import { useAppStore } from '../app-store'
import {
  taskRepository,
  entryRepository,
  completionRepository,
  categoryRepository,
} from '../../services/repositories'

// Mock the repositories
jest.mock('../../services/repositories', () => ({
  taskRepository: {
    findAll: jest.fn(),
    seedDefaultTasks: jest.fn(),
  },
  entryRepository: {
    findRecentEntries: jest.fn(),
    findByDateRange: jest.fn(),
    upsert: jest.fn(),
  },
  completionRepository: {
    findByDateRange: jest.fn(),
    toggle: jest.fn(),
  },
  categoryRepository: {
    findAll: jest.fn(),
    seedDefaultCategories: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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
      error: null,
    })

    // Reset mocks
    jest.clearAllMocks()
  })

  describe('loadData', () => {
    it('should load data from repositories successfully', async () => {
      // Setup mocks
      ;(categoryRepository.findAll as jest.Mock).mockResolvedValue(
        mockCategories
      )
      ;(taskRepository.findAll as jest.Mock).mockResolvedValue(mockTasks)
      ;(entryRepository.findRecentEntries as jest.Mock).mockResolvedValue(
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
      expect(state.error).toBe('Database error')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('toggleTaskCompletion', () => {
    it('should toggle task completion and update local state', async () => {
      ;(completionRepository.toggle as jest.Mock).mockResolvedValue(true)

      const store = useAppStore.getState()
      await store.toggleTaskCompletion('2025-01-15', 'task1')

      const state = useAppStore.getState()
      expect(state.completions['2025-01-15']).toHaveLength(1)
      expect(state.completions['2025-01-15'][0].taskId).toBe('task1')
    })

    it('should handle uncompleting tasks', async () => {
      // Setup initial state with completion
      useAppStore.setState({
        completions: {
          '2025-01-15': [mockCompletions[0]],
        },
      })
      ;(completionRepository.toggle as jest.Mock).mockResolvedValue(false)

      const store = useAppStore.getState()
      await store.toggleTaskCompletion('2025-01-15', 'task1')

      const state = useAppStore.getState()
      expect(state.completions['2025-01-15']).toBeUndefined()
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

      ;(entryRepository.upsert as jest.Mock).mockResolvedValue(updatedEntry)

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
      ;(entryRepository.upsert as jest.Mock).mockResolvedValue({
        id: 'entry1',
        date: '2025-01-15',
        note: 'Valid entry',
        createdAt: Date.now(),
        updatedAt: Date.now(),
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
