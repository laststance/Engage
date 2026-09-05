import { useAppStore } from '../app-store'
import {
  taskRepository,
  entryRepository,
  completionRepository,
  categoryRepository,
} from '../../services/repositories'
import { journalService } from '../../services/journalService'
import { databaseService } from '@/src/services/database'
import type { Completion, Entry } from '@/src/types'
import { backupService } from '@/src/services/backupService'

// Mock the repositories
jest.mock('../../services/repositories', () => ({
  taskRepository: {
    findAll: jest.fn(),
    seedDefaultTasks: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    applyDailyTasks: jest.fn(),
  },
  entryRepository: {
    findAll: jest.fn(),
    setCondition: jest.fn(),
    findByDateRange: jest.fn(),
    upsert: jest.fn(),
  },
  completionRepository: {
    findByDateRange: jest.fn(),
    toggle: jest.fn(),
    createMultiple: jest.fn(),
    delete: jest.fn(),
    updateTaskAssignmentsForDate: jest.fn(),
  },
  categoryRepository: {
    findAll: jest.fn(),
    seedDefaultCategories: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}))

// Mock the journal service
jest.mock('../../services/journalService', () => ({
  journalService: {
    saveEntry: jest.fn(),
  },
}))

jest.mock('@/src/services/database', () => ({
  databaseService: {
    executeTransaction: jest.fn(),
  },
}))

jest.mock('@/src/services/backupService', () => ({
  backupService: {
    createBackup: jest.fn(),
    exportAndShare: jest.fn(),
  },
}))

// Mock data
const mockCategories = [
  { id: 'business', name: '事業' },
  { id: 'life', name: '生活' },
]

const mockTasks = [
  {
    id: 'task1',
    title: 'ネットワーキング',
    categoryId: 'business',
    archived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'task2',
    title: '運動',
    categoryId: 'life',
    archived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

const mockEntries = [
  {
    id: 'entry1',
    date: '2025-01-15',
    note: 'Great day!',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

const mockCompletions = [
  {
    id: 'comp1',
    date: '2025-01-15',
    taskId: 'task1',
    completed: true,
    createdAt: Date.now(),
  },
]

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store state
    useAppStore.setState({
      categories: [],
      tasks: [],
      entries: {},
      completions: {},
      selectedDate: '2025-01-15',
      isTaskPickerVisible: false,
      isPresetEditorVisible: false,
      isCategoryEditorVisible: false,
      currentTab: 'calendar',
      isLoading: false,
      isInitialized: false,
      hasDailyTaskError: false,
      error: null,
    })

    // Reset mocks
    jest.clearAllMocks()
    jest
      .mocked(databaseService.executeTransaction)
      .mockImplementation(async (operations) => {
        // Match production ordering so store tests exercise every transactional operation.
        for (const operation of operations) {
          await operation()
        }
      })
  })

  describe('loadData', () => {
    it('should load data from repositories successfully', async () => {
      // Setup mocks
      ;(categoryRepository.findAll as jest.Mock).mockResolvedValue(
        mockCategories
      )
      ;(taskRepository.findAll as jest.Mock).mockResolvedValue(mockTasks)
      ;(entryRepository.findAll as jest.Mock).mockResolvedValue(
        mockEntries
      )
      ;(completionRepository.findByDateRange as jest.Mock).mockResolvedValue(
        mockCompletions
      )

      const store = useAppStore.getState()
      await store.loadData()

      const state = useAppStore.getState()
      expect(state.categories).toEqual(mockCategories)
      expect(state.tasks).toEqual(mockTasks)
      expect(state.entries['2025-01-15']).toEqual(mockEntries[0])
      expect(state.completions['2025-01-15']).toEqual([mockCompletions[0]])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should handle loading errors', async () => {
      const error = new Error('Database error')
      ;(categoryRepository.findAll as jest.Mock).mockRejectedValue(error)

      const store = useAppStore.getState()
      await store.loadData()

      const state = useAppStore.getState()
      expect(state.error).toBe('Failed to load data. Please try again.')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('daily routine assignments', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date(2026, 8, 6, 9))
      useAppStore.setState({ isInitialized: true })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('does not access routine tables while startup migrations are still running', async () => {
      // Arrange
      useAppStore.setState({ isInitialized: false })

      // Act
      const refreshed = await useAppStore.getState().refreshDailyTasks()

      // Assert
      expect(refreshed).toBe(false)
      expect(taskRepository.applyDailyTasks).not.toHaveBeenCalled()
    })

    it.each(['createBackup', 'exportData'] as const)('takes a consistent %s snapshot after a pending routine refresh', async (action) => {
      // Arrange
      let finishRefresh: (completions: Completion[]) => void = () => undefined
      jest.mocked(taskRepository.applyDailyTasks).mockImplementationOnce(() => new Promise((resolve) => {
        finishRefresh = resolve
      }))
      const backupOperation = action === 'createBackup'
        ? jest.mocked(backupService.createBackup)
        : jest.mocked(backupService.exportAndShare)
      backupOperation.mockResolvedValue({ success: true, errors: [] })

      // Act
      const refreshing = useAppStore.getState().refreshDailyTasks()
      const backingUp = useAppStore.getState()[action]()
      expect(backupOperation).not.toHaveBeenCalled()
      finishRefresh([])
      await Promise.all([refreshing, backingUp])

      // Assert
      expect(backupOperation).toHaveBeenCalledTimes(1)
    })

    it('shows today’s incomplete routines while preserving completed tasks and the calendar date', async () => {
      // Arrange
      const dailyCompletions: Completion[] = [
        { id: 'daily-walk', date: '2026-09-06', taskId: 'walk', completed: false, createdAt: 1 },
        { id: 'manual-read', date: '2026-09-06', taskId: 'read', completed: true, createdAt: 2 },
      ]
      useAppStore.setState({ completions: { '2025-01-15': mockCompletions } })
      jest.mocked(taskRepository.applyDailyTasks).mockResolvedValue(dailyCompletions)

      // Act
      await useAppStore.getState().refreshDailyTasks()

      // Assert
      expect(taskRepository.applyDailyTasks).toHaveBeenCalledWith('2026-09-06')
      expect(useAppStore.getState().completions['2026-09-06']).toEqual([
        { id: 'daily-walk', date: '2026-09-06', taskId: 'walk', completed: false, createdAt: 1 },
        { id: 'manual-read', date: '2026-09-06', taskId: 'read', completed: true, createdAt: 2 },
      ])
      expect(useAppStore.getState().completions['2025-01-15']).toBe(mockCompletions)
      expect(useAppStore.getState().selectedDate).toBe('2025-01-15')
    })

    it('keeps a task deselected when the picker saves during a routine refresh', async () => {
      // Arrange
      const dailyCompletions: Completion[] = [
        { id: 'daily-walk', date: '2026-09-06', taskId: 'walk', completed: false, createdAt: 1 },
      ]
      let finishRefresh: (completions: Completion[]) => void = () => undefined
      jest.mocked(taskRepository.applyDailyTasks).mockImplementationOnce(() => new Promise((resolve) => {
        finishRefresh = resolve
      }))
      jest.mocked(completionRepository.updateTaskAssignmentsForDate).mockResolvedValue([])

      // Act
      const refreshing = useAppStore.getState().refreshDailyTasks()
      const saving = useAppStore.getState().addTasksToDate('2026-09-06', [])
      expect(completionRepository.updateTaskAssignmentsForDate).not.toHaveBeenCalled()
      finishRefresh(dailyCompletions)
      await Promise.all([refreshing, saving])

      // Assert
      expect(completionRepository.updateTaskAssignmentsForDate).toHaveBeenCalledWith('2026-09-06', [], ['walk'])
      expect(useAppStore.getState().completions['2026-09-06']).toBeUndefined()
    })

    it('refreshes the new local day when a pending edit crosses midnight', async () => {
      // Arrange
      let finishEdit: (completed: boolean) => void = () => undefined
      jest.mocked(completionRepository.toggle).mockImplementationOnce(() => new Promise((resolve) => {
        finishEdit = resolve
      }))
      jest.mocked(taskRepository.applyDailyTasks).mockResolvedValue([])

      // Act
      const editing = useAppStore.getState().toggleTaskCompletion('2026-09-06', 'walk')
      const refreshing = useAppStore.getState().refreshDailyTasks()
      jest.setSystemTime(new Date(2026, 8, 7, 0))
      finishEdit(true)
      await Promise.all([editing, refreshing])

      // Assert
      expect(taskRepository.applyDailyTasks).toHaveBeenCalledTimes(1)
      expect(taskRepository.applyDailyTasks).toHaveBeenCalledWith('2026-09-07')
    })

    it('retains visible tasks after a failed daily refresh and recovers on retry', async () => {
      // Arrange
      useAppStore.setState({ completions: { '2025-01-15': mockCompletions } })
      jest.mocked(taskRepository.applyDailyTasks)
        .mockRejectedValueOnce(new Error('SQLite unavailable'))
        .mockResolvedValueOnce([])

      // Act
      await useAppStore.getState().refreshDailyTasks()

      // Assert
      expect(useAppStore.getState().completions).toEqual({ '2025-01-15': mockCompletions })
      expect(useAppStore.getState().hasDailyTaskError).toBe(true)
      expect(useAppStore.getState().error).toBeNull()

      // Act
      await useAppStore.getState().refreshDailyTasks()

      // Assert
      expect(useAppStore.getState().error).toBeNull()
      expect(useAppStore.getState().hasDailyTaskError).toBe(false)
      expect(useAppStore.getState().completions['2026-09-06']).toEqual([])
    })

    it('keeps a journal error visible when background routines refresh successfully', async () => {
      // Arrange
      useAppStore.setState({ error: 'Journal could not be saved.', hasDailyTaskError: true })
      jest.mocked(taskRepository.applyDailyTasks).mockResolvedValue([])

      // Act
      await useAppStore.getState().refreshDailyTasks()

      // Assert
      expect(useAppStore.getState().error).toBe('Journal could not be saved.')
      expect(useAppStore.getState().hasDailyTaskError).toBe(false)
    })

    it('keeps a task error visible when background routines fail to refresh', async () => {
      // Arrange
      useAppStore.setState({ error: 'Task could not be saved.' })
      jest.mocked(taskRepository.applyDailyTasks).mockRejectedValue(new Error('SQLite unavailable'))

      // Act
      await useAppStore.getState().refreshDailyTasks()

      // Assert
      expect(useAppStore.getState().error).toBe('Task could not be saved.')
      expect(useAppStore.getState().hasDailyTaskError).toBe(true)
    })
  })

  describe('toggleTaskCompletion', () => {
    it('creates a completed record when an assigned task is finished', async () => {
      // Arrange
      ;(completionRepository.toggle as jest.Mock).mockResolvedValue(true)

      // Act
      const store = useAppStore.getState()
      const result = await store.toggleTaskCompletion('2025-01-15', 'task1')

      // Assert
      const state = useAppStore.getState()
      expect(result).toEqual({
        success: true,
        date: '2025-01-15',
        taskId: 'task1',
        change: 'completed',
      })
      expect(state.completions['2025-01-15']).toHaveLength(1)
      expect(state.completions['2025-01-15'][0].taskId).toBe('task1')
      expect(state.completions['2025-01-15'][0].completed).toBe(true)
    })

    it('marks a completed task incomplete when it is toggled again', async () => {
      // Arrange
      useAppStore.setState({
        completions: {
          '2025-01-15': [mockCompletions[0]],
        },
      })
      ;(completionRepository.toggle as jest.Mock).mockResolvedValue(false)

      // Act
      const store = useAppStore.getState()
      const result = await store.toggleTaskCompletion('2025-01-15', 'task1')

      // Assert
      const state = useAppStore.getState()
      expect(result).toEqual({
        success: true,
        date: '2025-01-15',
        taskId: 'task1',
        change: 'undone',
      })
      expect(state.completions['2025-01-15']).toHaveLength(1)
      expect(state.completions['2025-01-15'][0].completed).toBe(false)
    })

    it('rolls back the visible completion when persistence fails', async () => {
      // Arrange
      useAppStore.setState({
        completions: {
          '2025-01-15': [mockCompletions[0]],
        },
      })
      ;(completionRepository.toggle as jest.Mock).mockRejectedValue(
        new Error('SQLite is unavailable')
      )

      // Act
      const store = useAppStore.getState()
      const result = await store.toggleTaskCompletion('2025-01-15', 'task1')

      // Assert
      const state = useAppStore.getState()
      expect(result).toEqual({
        success: false,
        date: '2025-01-15',
        taskId: 'task1',
        change: 'undone',
        message: 'Failed to toggle task completion. Please try again.',
      })
      expect(state.completions['2025-01-15']).toEqual([mockCompletions[0]])
      expect(state.error).toBe(
        'Failed to toggle task completion. Please try again.'
      )
    })

    it('keeps another successful completion update when rollback is needed', async () => {
      // Arrange
      const concurrentCompletion = {
        id: 'comp2',
        date: '2025-01-15',
        taskId: 'task2',
        completed: true,
        createdAt: Date.now(),
      }
      let rejectToggle: (error: Error) => void = () => undefined
      ;(completionRepository.toggle as jest.Mock).mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            rejectToggle = reject
          })
      )
      useAppStore.setState({
        completions: {
          '2025-01-15': [mockCompletions[0]],
        },
      })

      // Act
      const store = useAppStore.getState()
      const resultPromise = store.toggleTaskCompletion('2025-01-15', 'task1')
      useAppStore.setState((current) => ({
        completions: {
          ...current.completions,
          '2025-01-15': [
            ...(current.completions['2025-01-15'] || []),
            concurrentCompletion,
          ],
        },
      }))
      rejectToggle(new Error('SQLite is unavailable'))
      const result = await resultPromise

      // Assert
      const state = useAppStore.getState()
      expect(result.success).toBe(false)
      expect(state.completions['2025-01-15']).toEqual([
        mockCompletions[0],
        concurrentCompletion,
      ])
      expect(state.error).toBe(
        'Failed to toggle task completion. Please try again.'
      )
    })
  })

  describe('addTasksToDate', () => {
    it('assigns newly selected tasks as incomplete records', async () => {
      // Arrange
      const assignedCompletion = {
        id: 'comp2',
        date: '2025-01-15',
        taskId: 'task2',
        completed: false,
        createdAt: Date.now(),
      }
      useAppStore.setState({
        completions: {
          '2025-01-15': [mockCompletions[0]],
        },
      })
      ;(
        completionRepository.updateTaskAssignmentsForDate as jest.Mock
      ).mockResolvedValue([assignedCompletion])

      // Act
      const store = useAppStore.getState()
      const result = await store.addTasksToDate('2025-01-15', [
        'task1',
        'task2',
      ])

      // Assert
      const state = useAppStore.getState()
      expect(result).toEqual({
        success: true,
        date: '2025-01-15',
        addedCount: 1,
        removedCount: 0,
      })
      expect(
        completionRepository.updateTaskAssignmentsForDate
      ).toHaveBeenCalledWith(
        '2025-01-15',
        [
          {
            date: '2025-01-15',
            taskId: 'task2',
            completed: false,
          },
        ],
        []
      )
      expect(state.completions['2025-01-15']).toEqual([
        mockCompletions[0],
        assignedCompletion,
      ])
      expect(state.completions['2025-01-15'][1].completed).toBe(false)
    })

    it('keeps the picker recoverable when task assignment persistence fails', async () => {
      // Arrange
      useAppStore.setState({
        completions: {
          '2025-01-15': [mockCompletions[0]],
        },
      })
      ;(
        completionRepository.updateTaskAssignmentsForDate as jest.Mock
      ).mockRejectedValue(new Error('SQLite is unavailable'))

      // Act
      const store = useAppStore.getState()
      const result = await store.addTasksToDate('2025-01-15', [
        'task1',
        'task2',
      ])

      // Assert
      const state = useAppStore.getState()
      expect(result).toEqual({
        success: false,
        date: '2025-01-15',
        addedCount: 0,
        removedCount: 0,
        message: 'SQLite is unavailable',
      })
      expect(state.completions['2025-01-15']).toEqual([mockCompletions[0]])
      expect(state.error).toBe('SQLite is unavailable')
    })

    it('keeps the latest visible completion while task assignment save finishes', async () => {
      // Arrange
      const assignedCompletion = {
        id: 'comp2',
        date: '2025-01-15',
        taskId: 'task2',
        completed: false,
        createdAt: Date.now(),
      }
      const concurrentlyUpdatedCompletion = {
        ...mockCompletions[0],
        completed: false,
      }
      type AssignedCompletion = typeof assignedCompletion
      let resolveAssignment: (
        completions: AssignedCompletion[]
      ) => void = () => undefined
      ;(
        completionRepository.updateTaskAssignmentsForDate as jest.Mock
      ).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveAssignment = resolve
          })
      )
      useAppStore.setState({
        completions: {
          '2025-01-15': [mockCompletions[0]],
        },
      })

      // Act
      const store = useAppStore.getState()
      const resultPromise = store.addTasksToDate('2025-01-15', [
        'task1',
        'task2',
      ])
      useAppStore.setState({
        completions: {
          '2025-01-15': [concurrentlyUpdatedCompletion],
        },
      })
      resolveAssignment([assignedCompletion])
      const result = await resultPromise

      // Assert
      const state = useAppStore.getState()
      expect(result).toEqual({
        success: true,
        date: '2025-01-15',
        addedCount: 1,
        removedCount: 0,
      })
      expect(state.completions['2025-01-15']).toEqual([
        concurrentlyUpdatedCompletion,
        assignedCompletion,
      ])
    })
  })

  describe('updatePresetTasks', () => {
    it('removes a deleted preset from task lists and assigned days', async () => {
      // Arrange
      const remainingCompletion = {
        id: 'comp2',
        date: '2025-01-15',
        taskId: 'task2',
        completed: false,
        createdAt: Date.now(),
      }
      useAppStore.setState({
        tasks: mockTasks,
        completions: {
          '2025-01-15': [mockCompletions[0], remainingCompletion],
        },
      })
      jest.mocked(taskRepository.findAll).mockResolvedValue([mockTasks[1]])

      // Act
      await useAppStore.getState().updatePresetTasks([mockTasks[1]])

      // Assert
      expect(taskRepository.delete).toHaveBeenCalledWith('task1')
      expect(databaseService.executeTransaction).toHaveBeenCalledTimes(1)
      expect(useAppStore.getState().tasks).toEqual([mockTasks[1]])
      expect(useAppStore.getState().completions['2025-01-15']).toEqual([
        remainingCompletion,
      ])
    })

    it('preserves loaded day references when presets are edited without deletion', async () => {
      // Arrange
      const loadedCompletions = {
        '2025-01-15': mockCompletions,
      }
      useAppStore.setState({
        tasks: mockTasks,
        completions: loadedCompletions,
      })
      jest.mocked(taskRepository.findAll).mockResolvedValue(mockTasks)

      // Act
      await useAppStore.getState().updatePresetTasks(mockTasks)

      // Assert
      expect(useAppStore.getState().completions).toBe(loadedCompletions)
    })

    it('keeps loaded task data unchanged when reconciliation fails after deletion', async () => {
      // Arrange
      const loadedCompletions = {
        '2025-01-15': mockCompletions,
      }
      const editedTask = { ...mockTasks[1], title: '朝の運動' }
      useAppStore.setState({
        tasks: mockTasks,
        completions: loadedCompletions,
      })
      jest
        .mocked(taskRepository.update)
        .mockRejectedValue(new Error('Update failed'))

      // Act
      const reconciliation = useAppStore
        .getState()
        .updatePresetTasks([editedTask])

      // Assert
      await expect(reconciliation).rejects.toThrow('Update failed')
      expect(databaseService.executeTransaction).toHaveBeenCalledTimes(1)
      expect(taskRepository.delete).toHaveBeenCalledWith('task1')
      expect(taskRepository.update).toHaveBeenCalledWith('task2', {
        title: '朝の運動',
        categoryId: 'life',
        archived: false,
        updatedAt: mockTasks[1].updatedAt,
      })
      expect(taskRepository.findAll).not.toHaveBeenCalled()
      expect(useAppStore.getState().tasks).toBe(mockTasks)
      expect(useAppStore.getState().completions).toBe(loadedCompletions)
      expect(useAppStore.getState().error).toBe('Update failed')
    })
  })

  describe('daily condition writes', () => {
    it('updates only the requested day and leaves task completions unchanged', async () => {
      // Arrange
      const savedEntry: Entry = {
        id: 'entry-condition', date: '2026-09-04', note: 'A saved reflection',
        conditionLevel: 4, createdAt: 1, updatedAt: 2,
      }
      useAppStore.setState({ selectedDate: '2026-09-05', completions: { '2025-01-15': mockCompletions } })
      jest.mocked(entryRepository.setCondition).mockResolvedValue(savedEntry)

      // Act
      const saved = await useAppStore.getState().updateCondition('2026-09-04', 4)

      // Assert
      expect(saved).toBe(true)
      expect(useAppStore.getState().entries['2026-09-04']).toEqual(savedEntry)
      expect(useAppStore.getState().entries['2026-09-05']).toBeUndefined()
      expect(useAppStore.getState().completions['2025-01-15']).toEqual(mockCompletions)
    })

    it('keeps a backup behind a pending condition save so the snapshot contains the new value', async () => {
      // Arrange
      let finishSave: (entry: Entry) => void = () => undefined
      jest.mocked(entryRepository.setCondition).mockImplementationOnce(
        () => new Promise<Entry>((resolve) => { finishSave = resolve })
      )
      const store = useAppStore.getState()

      // Act
      const saving = store.updateCondition('2026-09-05', 2)
      const backingUp = store.createBackup()
      await Promise.resolve()

      // Assert
      expect(backupService.createBackup).not.toHaveBeenCalled()

      // Act
      finishSave({ id: 'day', date: '2026-09-05', note: '', conditionLevel: 2, createdAt: 1, updatedAt: 2 })
      await Promise.all([saving, backingUp])

      // Assert
      expect(backupService.createBackup).toHaveBeenCalledTimes(1)
      expect(useAppStore.getState().entries['2026-09-05'].conditionLevel).toBe(2)
    })

    it('retains the saved daily record after a write failure and accepts the next choice', async () => {
      // Arrange
      const previousEntry: Entry = {
        id: 'day', date: '2026-09-05', note: 'Keep this note', conditionLevel: 4, createdAt: 1, updatedAt: 2,
      }
      useAppStore.setState({ entries: { '2026-09-05': previousEntry } })
      jest.mocked(entryRepository.setCondition)
        .mockRejectedValueOnce(new Error('Disk full'))
        .mockResolvedValueOnce({ ...previousEntry, conditionLevel: 2 })

      // Act
      const firstSave = await useAppStore.getState().updateCondition('2026-09-05', 1)

      // Assert
      expect(firstSave).toBe(false)
      expect(useAppStore.getState().entries['2026-09-05']).toEqual(previousEntry)

      // Act
      const nextSave = await useAppStore.getState().updateCondition('2026-09-05', 2)

      // Assert
      expect(nextSave).toBe(true)
      expect(useAppStore.getState().entries['2026-09-05']).toMatchObject({ note: 'Keep this note', conditionLevel: 2 })
    })
  })

  describe('updateJournalEntry', () => {
    it('should update journal entry and local state', async () => {
      const updatedEntry = {
        id: 'entry1',
        date: '2025-01-15',
        note: 'Updated note',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      ;(journalService.saveEntry as jest.Mock).mockResolvedValue({
        success: true,
        entry: updatedEntry,
        errors: [],
      })

      const store = useAppStore.getState()
      await store.updateJournalEntry('2025-01-15', 'Updated note')

      const state = useAppStore.getState()
      expect(state.entries['2025-01-15']).toEqual(updatedEntry)
    })
  })

  describe('category management', () => {
    it('should create category and update state', async () => {
      const newCategory = { id: 'study', name: '勉強' }
      ;(categoryRepository.create as jest.Mock).mockResolvedValue(newCategory)

      const store = useAppStore.getState()
      await store.createCategory({ name: '勉強' })

      const state = useAppStore.getState()
      expect(state.categories).toContain(newCategory)
    })

    it('should update category and update state', async () => {
      useAppStore.setState({ categories: [mockCategories[0]] })

      const updatedCategory = { id: 'business', name: '新事業' }
      ;(categoryRepository.update as jest.Mock).mockResolvedValue(
        updatedCategory
      )

      const store = useAppStore.getState()
      await store.updateCategory('business', { name: '新事業' })

      const state = useAppStore.getState()
      expect(state.categories[0]).toEqual(updatedCategory)
    })

    it('should delete category and update state', async () => {
      useAppStore.setState({ categories: mockCategories })
      ;(categoryRepository.delete as jest.Mock).mockResolvedValue(undefined)

      const store = useAppStore.getState()
      await store.deleteCategory('business')

      const state = useAppStore.getState()
      expect(state.categories).toHaveLength(1)
      expect(state.categories[0].id).toBe('life')
    })
  })

  describe('business logic actions', () => {
    beforeEach(() => {
      useAppStore.setState({
        categories: mockCategories,
        tasks: mockTasks,
        entries: { '2025-01-15': mockEntries[0] },
        completions: { '2025-01-15': mockCompletions },
      })
    })

    it('should get day progress correctly', () => {
      const store = useAppStore.getState()
      const progress = store.getDayProgress('2025-01-15')

      expect(progress.date).toBe('2025-01-15')
      expect(progress.totalTasks).toBe(2)
      expect(progress.completedTasks).toBe(1)
      expect(progress.hasJournalEntry).toBe(true)
    })

    it('should get task completion status', () => {
      const store = useAppStore.getState()
      const status = store.getTaskCompletionStatus('2025-01-15')

      expect(status.task1).toBe(true)
      expect(status.task2).toBe(false)
    })

    it('should validate and update journal', async () => {
      const journalEntry = {
        id: 'entry1',
        date: '2025-01-15',
        note: 'Valid entry',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      ;(journalService.saveEntry as jest.Mock).mockResolvedValue({
        success: true,
        entry: journalEntry,
        errors: [],
      })

      const store = useAppStore.getState()
      const result = await store.validateAndUpdateJournal(
        '2025-01-15',
        'Valid entry'
      )

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid journal entries', async () => {
      ;(journalService.saveEntry as jest.Mock).mockResolvedValue({
        success: false,
        entry: null,
        errors: ['Journal entry is too long (maximum 1000 characters)'],
      })

      const store = useAppStore.getState()
      const longEntry = 'a'.repeat(1001)
      const result = await store.validateAndUpdateJournal(
        '2025-01-15',
        longEntry
      )

      expect(result.success).toBe(false)
      expect(result.errors).toContain(
        'Journal entry is too long (maximum 1000 characters)'
      )
    })

    it('should get motivational message', () => {
      const store = useAppStore.getState()
      const message = store.getMotivationalMessage('2025-01-15')

      expect(message).toBeTruthy()
      expect(typeof message).toBe('string')
    })

    it('should check daily flow completion', () => {
      const store = useAppStore.getState()
      const completed = store.hasCompletedDailyFlow('2025-01-15')

      expect(completed).toBe(true) // Has completion and journal entry
    })
  })

  describe('computed getters', () => {
    beforeEach(() => {
      useAppStore.setState({
        categories: mockCategories,
        tasks: mockTasks,
        entries: { '2025-01-15': mockEntries[0] },
        completions: { '2025-01-15': mockCompletions },
      })
    })

    it('should get stats for week period', () => {
      const store = useAppStore.getState()
      const stats = store.getStatsForPeriod('week')

      expect(stats).toHaveProperty('streakDays')
      expect(stats).toHaveProperty('completionRate')
      expect(stats).toHaveProperty('activeDays')
      expect(stats).toHaveProperty('totalTasks')
      expect(stats).toHaveProperty('dailyAverage')
      expect(stats).toHaveProperty('journalDays')
      expect(stats).toHaveProperty('categoryBreakdown')
    })

    it('should get stats for month period', () => {
      const store = useAppStore.getState()
      const stats = store.getStatsForPeriod('month')

      expect(stats).toHaveProperty('streakDays')
      expect(stats).toHaveProperty('completionRate')
      expect(stats).toHaveProperty('activeDays')
      expect(stats).toHaveProperty('totalTasks')
      expect(stats).toHaveProperty('dailyAverage')
      expect(stats).toHaveProperty('journalDays')
      expect(stats).toHaveProperty('categoryBreakdown')
    })

    it('should get achievement data', () => {
      const store = useAppStore.getState()
      const data = store.getAchievementData()

      expect(data['2025-01-15']).toBe(1) // One completion
    })

    it('should get day data', () => {
      const store = useAppStore.getState()
      const dayData = store.getDayData('2025-01-15')

      expect(dayData.date).toBe('2025-01-15')
      expect(dayData.tasks).toEqual(mockTasks)
      expect(dayData.completions).toEqual(mockCompletions)
      expect(dayData.entry).toEqual(mockEntries[0])
    })

    it('should get streak data', () => {
      const store = useAppStore.getState()
      const streakData = store.getStreakData('2025-01-15')

      expect(streakData).toHaveProperty('currentStreak')
      expect(streakData).toHaveProperty('longestStreak')
      expect(streakData).toHaveProperty('streakDates')
    })
  })

  describe('UI state management', () => {
    it('should manage modal visibility', () => {
      const store = useAppStore.getState()

      store.setTaskPickerVisible(true)
      expect(useAppStore.getState().isTaskPickerVisible).toBe(true)

      store.setPresetEditorVisible(true)
      expect(useAppStore.getState().isPresetEditorVisible).toBe(true)

      store.setCategoryEditorVisible(true)
      expect(useAppStore.getState().isCategoryEditorVisible).toBe(true)
    })

    it('should manage tab navigation', () => {
      const store = useAppStore.getState()

      store.setCurrentTab('today')
      expect(useAppStore.getState().currentTab).toBe('today')

      store.setCurrentTab('stats')
      expect(useAppStore.getState().currentTab).toBe('stats')
    })

    it('should manage selected date', () => {
      const store = useAppStore.getState()

      store.selectDate('2025-01-16')
      expect(useAppStore.getState().selectedDate).toBe('2025-01-16')
    })

    it('should manage error state', () => {
      useAppStore.setState({ error: 'Test error' })

      const store = useAppStore.getState()
      store.clearError()

      expect(useAppStore.getState().error).toBeNull()
    })
  })
})
