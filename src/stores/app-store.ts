import AsyncStorage from '@react-native-async-storage/async-storage'
import { createStorageMiddleware } from '@laststance/redux-storage-middleware'
import {
  combineReducers,
  configureStore,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit'
import { useSyncExternalStore } from 'react'
import {
  Task,
  Entry,
  Completion,
  DayData,
  StatsData,
  Category,
  ConditionLevel,
  TaskAssignmentOperationResult,
  TaskCompletionOperationResult,
} from '../types'
import {
  taskRepository,
  entryRepository,
  completionRepository,
  categoryRepository,
} from '../services/repositories'
import {
  presetService,
  type PresetInitializationResult,
} from '../services/presetService'
import {
  journalService,
  type JournalSaveResult,
} from '../services/journalService'
import {
  calculateDayProgress,
  getTaskCompletionStatus,
  getJournalPlaceholder,
  getTaskRecommendations,
  hasCompletedDailyFlow,
  getMotivationalMessage,
  type TaskSelectionResult,
  type DayProgress,
} from '../utils/businessLogic'
import {
  formatDate,
  getCurrentDate,
  getWeekStartDate,
  getWeekEndDate,
  getMonthStartDate,
  getMonthEndDate,
} from '../utils/dateUtils'
import {
  calculateWeeklyStats,
  calculateMonthlyStats,
  calculateAchievementData,
  calculateStreakDays,
  calculateProductivityTrends,
} from '../utils/statisticsEngine'
import { backupService } from '../services/backupService'
import { databaseService } from '@/src/services/database'

interface AppState {
  // Data
  categories: Category[]
  tasks: Task[]
  entries: Record<string, Entry> // date -> entry
  completions: Record<string, Completion[]> // date -> completions

  // UI State
  selectedDate: string
  isTaskPickerVisible: boolean
  isPresetEditorVisible: boolean
  isCategoryEditorVisible: boolean
  currentTab: 'calendar' | 'today' | 'stats'
  isLoading: boolean
  isInitialized: boolean
  hasDailyTaskError: boolean
  error: string | null
  isFirstLaunch: boolean
  suggestedTasks: Task[]

  // Offline State
  isOffline: boolean
  offlineCapabilities: any
  dataIntegrityStatus: 'unknown' | 'valid' | 'invalid' | 'checking'

  // Actions
  loadData: () => Promise<void>
  refreshDailyTasks: () => Promise<boolean>
  selectDate: (date: string) => void
  toggleTaskCompletion: (
    date: string,
    taskId: string
  ) => Promise<TaskCompletionOperationResult>
  updateJournalEntry: (date: string, content: string) => Promise<void>
  updateCondition: (date: string, conditionLevel: ConditionLevel | null) => Promise<boolean>
  addTasksToDate: (
    date: string,
    taskIds: string[]
  ) => Promise<TaskAssignmentOperationResult>
  updatePresetTasks: (tasks: Task[]) => Promise<void>
  createCategory: (category: Omit<Category, 'id'>) => Promise<void>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  setTaskPickerVisible: (visible: boolean) => void
  setPresetEditorVisible: (visible: boolean) => void
  setCategoryEditorVisible: (visible: boolean) => void
  setCurrentTab: (tab: 'calendar' | 'today' | 'stats') => void
  clearError: () => void

  // Business Logic Actions
  initializeApp: () => Promise<void>
  initializePresets: () => Promise<PresetInitializationResult>
  getSuggestedTasks: () => Promise<Task[]>
  getPresetTasksByCategory: () => Promise<Record<string, Task[]>>
  getTaskSelectionData: () => TaskSelectionResult
  getDayProgress: (date: string) => DayProgress
  getTaskCompletionStatus: (date: string) => Record<string, boolean>
  validateAndUpdateJournal: (
    date: string,
    content: string
  ) => Promise<JournalSaveResult>
  getJournalPlaceholder: (date: string) => string
  getMotivationalMessage: (date: string) => string
  hasCompletedDailyFlow: (date: string) => boolean
  loadDateRangeData: (startDate: string, endDate: string) => Promise<void>

  // Computed
  getStatsForPeriod: (period: 'week' | 'month') => StatsData
  getAchievementData: () => Record<string, number>
  getDayData: (date: string) => DayData
  getStreakData: (currentDate?: string) => {
    currentStreak: number
    longestStreak: number
    streakDates: string[]
  }
  getProductivityTrends: (startDate: string, endDate: string) => any
  
  // Backup methods (stubs)
  createBackup: () => Promise<any>
  exportData: () => Promise<any>
  importBackup: (file?: any) => Promise<any>
  listBackups: () => Promise<any[]>
  deleteBackup: (id: string) => Promise<boolean>
  getBackupStats: () => Promise<any>
}

export type AppTab = AppState['currentTab']

type AppActionKey = {
  [K in keyof AppState]: AppState[K] extends (...args: never[]) => unknown
    ? unknown extends AppState[K]
      ? never
      : K
    : never
}[keyof AppState]

type AppActions = Pick<AppState, AppActionKey>
type AppData = Omit<AppState, AppActionKey | 'currentTab'>

/**
 * Zustand-shaped update used by store actions and {@link useAppStore}.setState.
 * A function receives the latest public state and returns the partial to merge.
 */
type SetAppState = (
  partial: Partial<AppState> | ((state: AppState) => Partial<AppState>),
  replace?: boolean,
) => void

/**
 * Builds the imperative actions {@link useAppStore} exposes on top of the RTK slices.
 * Called once when this module loads, before any screen reads the store.
 * @param set - Merges a partial into the slices, sending `currentTab` to the session slice.
 * @param get - Reads the latest public state, including these actions, so queued work can call another action.
 * @returns The action map. Data fields live in the slice, not in this object.
 */
function createActions(set: SetAppState, get: () => AppState): AppActions {
  return {
  // Actions
  loadData: async () => {
    try {
      set({ isLoading: true, error: null })

      // Use offline service to execute data loading with proper error handling
      const loadOperation = async () => {
        // Load all data from repositories
        const [categories, tasks, entries, recentCompletions] =
          await Promise.all([
            categoryRepository.findAll(),
            taskRepository.findAll(),
            entryRepository.findAll(), // Keep conditions visible when browsing older calendar months.
            completionRepository.findByDateRange(
              // Load last 30 days of completions
              formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
              formatDate(new Date())
            ),
          ])

        return { categories, tasks, entries, recentCompletions }
      }

      // Execute load operation directly
      const result = await loadOperation()

      // Transform entries and completions into maps
      const entriesMap: Record<string, Entry> = {}
      result.entries.forEach((entry) => {
        entriesMap[entry.date] = entry
      })

      const completionsMap: Record<string, Completion[]> = {}
      result.recentCompletions.forEach((completion) => {
        if (!completionsMap[completion.date]) {
          completionsMap[completion.date] = []
        }
        completionsMap[completion.date].push(completion)
      })

      // Update offline status
      const offlineStatus = { isOffline: false, capabilities: {} }

      set({
        categories: result.categories,
        tasks: result.tasks,
        entries: entriesMap,
        completions: completionsMap,
        isOffline: offlineStatus.isOffline,
        offlineCapabilities: offlineStatus.capabilities,
        isLoading: false,
      })

      console.log('Data loaded successfully:', {
        categories: result.categories.length,
        tasks: result.tasks.length,
        entries: result.entries.length,
        completions: result.recentCompletions.length,
        isOffline: offlineStatus.isOffline,
      })
    } catch (error) {
      console.error('Failed to load data:', error)
      set({
        error: 'Failed to load data. Please try again.',
        isLoading: false,
      })
    }
  },

  selectDate: (date: string) => {
    set({ selectedDate: date })
  },

  /**
   * Applies today's routines when initialization, foregrounding, or local midnight requests a refresh.
   * @returns True after refreshing today's assignments, or false with a recoverable error.
   * @example
   * await useAppStore.getState().refreshDailyTasks() // => today's routines are selected, still incomplete
   */
  refreshDailyTasks: () => enqueueDataMutation(async () => {
    // A picker can be tapped while SQLite migrations are still running at cold start.
    if (!get().isInitialized) return false
    // Resolve the date inside the queue so a delayed refresh never backfills yesterday.
    const today = getCurrentDate()
    try {
      const dailyCompletions = await taskRepository.applyDailyTasks(today)
      set((current) => ({
        completions: { ...current.completions, [today]: dailyCompletions },
        hasDailyTaskError: false,
      }))
      return true
    } catch (error) {
      console.error('Failed to apply daily tasks:', error)
      // Background refresh feedback must not replace an error from the user's own operation.
      set({ hasDailyTaskError: true })
      return false
    }
  }),

  toggleTaskCompletion: (date: string, taskId: string) => enqueueDataMutation(async () => {
    const state = get()
    const previousTaskCompletion = (state.completions[date] || []).find(
      (completion) => completion.taskId === taskId
    )

    // Optimistic update: flip only the requested completion row.
    const updatedCompletions = { ...state.completions }
    const dayCompletions = updatedCompletions[date] || []
    const existingCompletion = dayCompletions.find(
      (c) => c.taskId === taskId
    )
    const nextCompleted = existingCompletion ? !existingCompletion.completed : true
    const change = nextCompleted ? 'completed' : 'undone'

    if (existingCompletion) {
      // Toggle completed status
      updatedCompletions[date] = dayCompletions.map((c) =>
        c.taskId === taskId ? { ...c, completed: !c.completed } : c
      )
    } else {
      // Create new completion (marked as completed)
      if (!updatedCompletions[date]) {
        updatedCompletions[date] = []
      }
      const newCompletion: Completion = {
        id: `temp_${Date.now()}`,
        date,
        taskId,
        completed: true,
        createdAt: Date.now(),
      }
      updatedCompletions[date] = [...updatedCompletions[date], newCompletion]
    }

    // Update UI immediately
    set({ completions: updatedCompletions, error: null })

    try {
      // Persist to database in background
      await completionRepository.toggle(date, taskId)

      console.log(
        `Task ${taskId} toggled for ${date}`
      )

      return {
        success: true,
        date,
        taskId,
        change,
      }
    } catch (error) {
      // Roll back only this task so concurrent successful updates stay intact.
      console.error('Failed to toggle task completion:', error)
      set((current) => {
        const currentDayCompletions = current.completions[date] || []
        const revertedDayCompletions = previousTaskCompletion
          ? currentDayCompletions.map((completion) =>
            completion.taskId === taskId
              ? previousTaskCompletion
              : completion
          )
          : currentDayCompletions.filter(
            (completion) => completion.taskId !== taskId
          )
        const revertedCompletions = { ...current.completions }

        if (revertedDayCompletions.length > 0) {
          revertedCompletions[date] = revertedDayCompletions
        } else {
          delete revertedCompletions[date]
        }

        return {
          completions: revertedCompletions,
          error: 'Failed to toggle task completion. Please try again.',
        }
      })

      return {
        success: false,
        date,
        taskId,
        change,
        message: 'Failed to toggle task completion. Please try again.',
      }
    }
  }),

  /**
   * Serializes picker changes with journal saves and restores whenever a day view records its condition.
   * @param date - The date captured by the day view that initiated the change.
   * @param conditionLevel - The selected level or null to clear it.
   * @returns Whether persistence succeeded; failures leave the last saved entry intact.
   * @example await useAppStore.getState().updateCondition('2026-09-05', 4) // => true
   */
  updateCondition: (date, conditionLevel) => enqueueDataMutation(async () => {
    try {
      const entry = await entryRepository.setCondition(date, conditionLevel)
      set((state) => ({ entries: { ...state.entries, [date]: entry } }))
      return true
    } catch (error) {
      console.error('Failed to save condition:', error)
      return false
    }
  }),

  updateJournalEntry: (date: string, content: string) => enqueueDataMutation(async () => {
    try {
      set({ error: null })

      const journalOperation = async () => {
        return await journalService.saveEntry(date, content)
      }

      // Execute journal operation directly
      const result = await journalOperation()

      if (result.success && result.entry) {
        // Update local state
        const state = get()
        set({
          entries: {
            ...state.entries,
            [date]: result.entry,
          },
        })

        console.log(`Journal entry updated for ${date}`)
      } else {
        throw new Error(result.errors.join(', '))
      }
    } catch (error) {
      console.error('Failed to update journal entry:', error)
      set({ error: 'Failed to update journal entry. Please try again.' })
    }
  }),

  addTasksToDate: (date: string, taskIds: string[]) => enqueueDataMutation(async () => {
    try {
      set({ error: null })

      const state = get()
      const existingCompletions = state.completions[date] || []
      const existingTaskIds = new Set(
        existingCompletions.map((c) => c.taskId)
      )
      const selectedTaskIds = new Set(taskIds)

      // Tasks to add (not yet assigned)
      const newTaskIds = taskIds.filter((id) => !existingTaskIds.has(id))

      // Tasks to remove (deselected by user)
      const removedTaskIds = existingCompletions
        .filter((c) => !selectedTaskIds.has(c.taskId))
        .map((c) => c.taskId)

      if (newTaskIds.length === 0 && removedTaskIds.length === 0) {
        console.log(`No changes to tasks for ${date}`)
        return {
          success: true,
          date,
          addedCount: 0,
          removedCount: 0,
        }
      }

      // Create uncompleted assignment records for new tasks
      const completionsToCreate = newTaskIds.map((taskId) => ({
        date,
        taskId,
        completed: false,
      }))

      const createdCompletions =
        await completionRepository.updateTaskAssignmentsForDate(
          date,
          completionsToCreate,
          removedTaskIds
        )

      set((current) => {
        const updatedCompletions = { ...current.completions }
        const currentDayCompletions = updatedCompletions[date] || []
        const currentTaskIds = new Set(
          currentDayCompletions.map((completion) => completion.taskId)
        )
        const newCreatedCompletions = createdCompletions.filter(
          (completion) => !currentTaskIds.has(completion.taskId)
        )
        const remainingCompletions = currentDayCompletions.filter(
          (completion) => selectedTaskIds.has(completion.taskId)
        )

        updatedCompletions[date] = [
          ...remainingCompletions,
          ...newCreatedCompletions,
        ]

        if (updatedCompletions[date].length === 0) {
          delete updatedCompletions[date]
        }

        return { completions: updatedCompletions }
      })

      console.log(
        `Tasks updated for ${date}: +${createdCompletions.length} -${removedTaskIds.length}`
      )

      return {
        success: true,
        date,
        addedCount: createdCompletions.length,
        removedCount: removedTaskIds.length,
      }
    } catch (error) {
      console.error('Failed to add tasks to date:', error)
      const message = error instanceof Error
        ? error.message
        : 'Failed to add tasks to date'
      set({
        error: message,
      })

      // The repository sync is atomic, so a failed save leaves no applied deltas.
      return {
        success: false,
        date,
        addedCount: 0,
        removedCount: 0,
        message,
      }
    }
  }),

  /**
   * Reconciles the complete preset list when PresetTaskEditor or TaskPicker submits a mutation.
   * @param tasks - The complete preset list that should remain persisted.
   * @returns A promise that settles after repository and loaded completion state agree.
   * @example
   * await useAppStore.getState().updatePresetTasks(remainingTasks)
   */
  updatePresetTasks: (tasks: Task[]) => enqueueDataMutation(async () => {
    try {
      set({ error: null })

      // Get current tasks to determine what needs to be created, updated, or deleted
      const currentTasks = get().tasks
      const currentTaskIds = new Set(currentTasks.map((t) => t.id))
      const newTaskIds = new Set(tasks.map((t) => t.id))

      // Tasks to create (new tasks without existing IDs)
      const tasksToCreate = tasks.filter(
        (t) => !t.id || !currentTaskIds.has(t.id)
      )

      // Tasks to update (existing tasks with changes)
      const tasksToUpdate = tasks.filter(
        (t) => t.id && currentTaskIds.has(t.id)
      )

      // Tasks to delete (current tasks not in new list)
      const tasksToDelete = currentTasks.filter((t) => !newTaskIds.has(t.id))

      // Execute database operations
      const operations: (() => Promise<void>)[] = []

      // Delete tasks
      tasksToDelete.forEach((task) => {
        operations.push(async () => {
          await taskRepository.delete(task.id)
        })
      })

      // Create new tasks
      tasksToCreate.forEach((task) => {
        operations.push(async () => {
          const { id, createdAt, updatedAt, ...taskData } = task
          await taskRepository.create(taskData)
        })
      })

      // Update existing tasks
      tasksToUpdate.forEach((task) => {
        operations.push(async () => {
          const { id, createdAt, ...updates } = task
          await taskRepository.update(id, updates)
        })
      })

      // Keep deletes, creates, and updates atomic so a later failure restores earlier writes.
      await databaseService.executeTransaction(operations)

      // Reload tasks from database to get accurate state
      const updatedTasks = await taskRepository.findAll()
      const deletedTaskIds = new Set(tasksToDelete.map((task) => task.id))

      // Preserve the completions reference when preset edits contain no deletions.
      if (deletedTaskIds.size === 0) {
        set({ tasks: updatedTasks })
      } else {
        set((current) => ({
          tasks: updatedTasks,
          // Mirror SQLite's cascading delete so loaded day assignments never retain ghost task IDs.
          completions: Object.fromEntries(
            Object.entries(current.completions).map(
              ([date, dateCompletions]) => [
                date,
                dateCompletions.filter(
                  (completion) => !deletedTaskIds.has(completion.taskId)
                ),
              ]
            )
          ),
        }))
      }

      console.log('Preset tasks updated successfully', {
        created: tasksToCreate.length,
        updated: tasksToUpdate.length,
        deleted: tasksToDelete.length,
      })
    } catch (error) {
      console.error('Failed to update preset tasks:', error)
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update preset tasks',
      })
      throw error
    }
  }),

  createCategory: (category: Omit<Category, 'id'>) => enqueueDataMutation(async () => {
    try {
      set({ error: null })

      const newCategory = await categoryRepository.create(category)

      const state = get()
      set({
        categories: [...state.categories, newCategory],
      })

      console.log('Category created:', newCategory.name)
    } catch (error) {
      console.error('Failed to create category:', error)
      set({
        error:
          error instanceof Error ? error.message : 'Failed to create category',
      })
    }
  }),

  updateCategory: (id: string, updates: Partial<Category>) => enqueueDataMutation(async () => {
    try {
      set({ error: null })

      const updatedCategory = await categoryRepository.update(id, updates)

      const state = get()
      set({
        categories: state.categories.map((cat) =>
          cat.id === id ? updatedCategory : cat
        ),
      })

      console.log('Category updated:', updatedCategory.name)
    } catch (error) {
      console.error('Failed to update category:', error)
      set({
        error:
          error instanceof Error ? error.message : 'Failed to update category',
      })
    }
  }),

  deleteCategory: (id: string) => enqueueDataMutation(async () => {
    try {
      set({ error: null })

      await categoryRepository.delete(id)

      const state = get()
      set({
        categories: state.categories.filter((cat) => cat.id !== id),
      })

      console.log('Category deleted:', id)
    } catch (error) {
      console.error('Failed to delete category:', error)
      set({
        error:
          error instanceof Error ? error.message : 'Failed to delete category',
      })
    }
  }),

  setTaskPickerVisible: (visible: boolean) => {
    set({ isTaskPickerVisible: visible })
  },

  setPresetEditorVisible: (visible: boolean) => {
    set({ isPresetEditorVisible: visible })
  },

  setCategoryEditorVisible: (visible: boolean) => {
    set({ isCategoryEditorVisible: visible })
  },

  setCurrentTab: (tab: 'calendar' | 'today' | 'stats') => {
    set({ currentTab: tab })
  },

  clearError: () => {
    set({ error: null })
  },

  // Business Logic Actions
  initializeApp: async () => {
    try {
      set({ isLoading: true, isInitialized: false, error: null })

      // Initialize app (offline services removed for simplicity)
      set({
        isOffline: false,
        offlineCapabilities: {},
      })

      // Check if this is first launch
      const isFirstLaunch = await presetService.isFirstLaunch()

      // Initialize presets (categories and tasks)
      const initResult = await get().initializePresets()

      // Load all data
      await get().loadData()
      const loadError = get().error
      if (loadError) throw new Error(loadError)
      set({ isInitialized: true })
      await get().refreshDailyTasks()

      set({
        isFirstLaunch,
        suggestedTasks: initResult.suggestedTasks,
        isLoading: false,
        isInitialized: true,
      })

      console.log('App initialized successfully', {
        isFirstLaunch,
        categoriesCreated: initResult.categoriesCreated,
        tasksCreated: initResult.tasksCreated,
        suggestedTasksCount: initResult.suggestedTasks.length,
        isOffline: get().isOffline,
      })
    } catch (error) {
      console.error('Failed to initialize app:', error)
      set({
        error: 'Failed to initialize app. Please try again.',
        isLoading: false,
      })
    }
  },

  initializePresets: async () => {
    try {
      return await presetService.initializeDefaults()
    } catch (error) {
      console.error('Failed to initialize presets:', error)
      throw error
    }
  },

  getSuggestedTasks: async () => {
    try {
      return await presetService.getSuggestedTasks()
    } catch (error) {
      console.error('Failed to get suggested tasks:', error)
      throw error
    }
  },

  getPresetTasksByCategory: async () => {
    try {
      return await presetService.getPresetTasksByCategory()
    } catch (error) {
      console.error('Failed to get preset tasks by category:', error)
      throw error
    }
  },

  getTaskSelectionData: () => {
    const state = get()

    // Get recent completions for recommendations
    const recentCompletions: Completion[] = []
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const cutoffDate = formatDate(thirtyDaysAgo)

    Object.entries(state.completions).forEach(([date, completions]) => {
      if (date >= cutoffDate) {
        recentCompletions.push(...completions)
      }
    })

    return getTaskRecommendations(
      state.tasks,
      recentCompletions,
      state.categories
    )
  },

  getDayProgress: (date: string) => {
    const state = get()
    const dayCompletions = state.completions[date] || []
    const entry = state.entries[date] || null

    return calculateDayProgress(
      date,
      state.tasks,
      dayCompletions,
      entry,
      state.categories
    )
  },

  getTaskCompletionStatus: (date: string) => {
    const state = get()
    const taskIds = state.tasks.map((t) => t.id)
    const completions = state.completions[date] || []

    return getTaskCompletionStatus(taskIds, date, completions)
  },

  validateAndUpdateJournal: (date: string, content: string) => enqueueDataMutation(async () => {
    try {
      const result = await journalService.saveEntry(date, content)

      if (result.success && result.entry) {
        // Update local state
        const state = get()
        set({
          entries: {
            ...state.entries,
            [date]: result.entry,
          },
        })
      }

      return result
    } catch (error) {
      return {
        success: false,
        errors: [
          error instanceof Error
            ? error.message
            : 'Failed to validate and update journal',
        ],
      }
    }
  }),

  getJournalPlaceholder: (date: string) => {
    const state = get()
    const completions = state.completions[date] || []
    return getJournalPlaceholder(completions.some((c) => c.completed))
  },

  getMotivationalMessage: (date: string) => {
    const progress = get().getDayProgress(date)
    return getMotivationalMessage(progress)
  },

  hasCompletedDailyFlow: (date: string) => {
    const state = get()
    const completions = state.completions[date] || []
    const entry = state.entries[date] || null

    return hasCompletedDailyFlow(date, completions, entry)
  },

  loadDateRangeData: async (startDate: string, endDate: string) => {
    try {
      set({ isLoading: true, error: null })

      const [entries, completions] = await Promise.all([
        entryRepository.findByDateRange(startDate, endDate),
        completionRepository.findByDateRange(startDate, endDate),
      ])

      // Merge with existing data
      const state = get()
      const updatedEntries = { ...state.entries }
      const updatedCompletions = { ...state.completions }

      entries.forEach((entry) => {
        updatedEntries[entry.date] = entry
      })

      completions.forEach((completion) => {
        if (!updatedCompletions[completion.date]) {
          updatedCompletions[completion.date] = []
        }
        // Avoid duplicates
        const exists = updatedCompletions[completion.date].some(
          (c) => c.id === completion.id
        )
        if (!exists) {
          updatedCompletions[completion.date].push(completion)
        }
      })

      set({
        entries: updatedEntries,
        completions: updatedCompletions,
        isLoading: false,
      })

      console.log(`Loaded data for range ${startDate} to ${endDate}`)
    } catch (error) {
      console.error('Failed to load date range data:', error)
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load date range data',
        isLoading: false,
      })
    }
  },

  // Computed getters
  getStatsForPeriod: (period: 'week' | 'month') => {
    const state = get()
    const today = new Date()

    if (period === 'week') {
      const weekStart = getWeekStartDate(today)
      const weekEnd = getWeekEndDate(today)

      return calculateWeeklyStats(
        state.tasks,
        state.completions,
        state.entries,
        state.categories,
        weekStart,
        weekEnd
      )
    } else {
      const monthStart = getMonthStartDate(today)
      const monthEnd = getMonthEndDate(today)

      return calculateMonthlyStats(
        state.tasks,
        state.completions,
        state.entries,
        state.categories,
        monthStart,
        monthEnd,
        today.getFullYear(),
        today.getMonth() + 1
      )
    }
  },

  getAchievementData: () => {
    const state = get()
    return calculateAchievementData(state.completions)
  },

  getDayData: (date: string) => {
    const state = get()
    return {
      date,
      tasks: state.tasks,
      completions: state.completions[date] || [],
      entry: state.entries[date] || null,
    }
  },

  getStreakData: (currentDate?: string) => {
    const state = get()
    return calculateStreakDays(state.completions, currentDate)
  },

  getProductivityTrends: (startDate: string, endDate: string) => {
    const state = get()
    return calculateProductivityTrends(
      state.completions,
      state.entries,
      startDate,
      endDate
    )
  },

  // Backup methods (delegating to backupService)
  createBackup: async () => {
    // Keep assignments and their application markers in one consistent backup snapshot.
    return enqueueDataMutation(() => backupService.createBackup())
  },

  exportData: async () => {
    return enqueueDataMutation(() => backupService.exportAndShare())
  },

  importBackup: async () => {
    // File-picker foreground events must not start a routine transaction during restoration.
    const result = await enqueueDataMutation(async () => {
      const restored = await backupService.importBackup()
      if (restored.success) await get().loadData()
      return restored
    })
    if (result.success) {
      // Queue the refresh after restoration settles, avoiding a nested queue wait.
      await get().refreshDailyTasks()
    }
    return result
  },

  listBackups: async () => {
    return backupService.listBackups()
  },

  deleteBackup: async (fileName: string) => {
    return backupService.deleteBackup(fileName)
  },

  getBackupStats: async () => {
    return backupService.getBackupStats()
  },
  }
}

let dataMutationQueue: Promise<unknown> | undefined

/**
 * Serializes routine refreshes and user writes so a background transaction cannot roll back another edit.
 * @param operation - The store mutation and its database writes, invoked after earlier mutations settle.
 * @returns The operation's result or rejection; later mutations can still proceed after a failure.
 * @example
 * await enqueueDataMutation(async () => taskRepository.applyDailyTasks('2026-09-06'))
 */
function enqueueDataMutation<Result>(operation: () => Promise<Result>): Promise<Result> {
  // Start immediately when idle to retain the existing optimistic response to taps.
  const result = dataMutationQueue
    ? dataMutationQueue.then(operation, operation)
    : operation()
  const queuedResult = result.finally(() => {
    // Only the last queued mutation can release the queue, including after failure.
    if (dataMutationQueue === queuedResult) dataMutationQueue = undefined
  })
  dataMutationQueue = queuedResult
  return queuedResult
}

const initialAppData: AppData = {
  categories: [],
  tasks: [],
  entries: {},
  completions: {},
  selectedDate: formatDate(new Date()),
  isTaskPickerVisible: false,
  isPresetEditorVisible: false,
  isCategoryEditorVisible: false,
  isLoading: false,
  isInitialized: false,
  hasDailyTaskError: false,
  error: null,
  isFirstLaunch: false,
  suggestedTasks: [],
  isOffline: false,
  offlineCapabilities: {},
  dataIntegrityStatus: 'unknown',
}

const APP_DATA_KEYS = Object.keys(initialAppData) as (keyof AppData)[]

const appSlice = createSlice({
  name: 'app',
  initialState: initialAppData,
  reducers: {
    patchApp(state, action: PayloadAction<Partial<AppData>>) {
      Object.assign(state, action.payload)
    },
    replaceApp(_state, action: PayloadAction<AppData>) {
      return action.payload
    },
  },
})

const sessionSlice = createSlice({
  name: 'session',
  initialState: { currentTab: 'calendar' as AppTab },
  reducers: {
    setCurrentTab(state, action: PayloadAction<AppTab>) {
      state.currentTab = action.payload
    },
  },
})

interface RootState {
  app: AppData
  session: { currentTab: AppTab }
}

const rootReducer = combineReducers({
  app: appSlice.reducer,
  session: sessionSlice.reducer,
})

let lastSavedTab: AppTab | null = null
const saveListeners = new Set<() => void>()

/**
 * Records the tab that AsyncStorage accepted so E2E can wait for the write.
 * Called from the middleware `onSaveComplete` callback after `setItem` settles.
 * @param tab - The session tab included in that write.
 */
function publishSavedTab(tab: AppTab): void {
  lastSavedTab = tab
  saveListeners.forEach((listener) => {
    listener()
  })
}

const { middleware, reducer, api: storageApi } = createStorageMiddleware<RootState>({
  rootReducer,
  key: 'engage',
  // SQLite owns tasks, entries, and completions. Persisting `app` would let a late hydration overwrite them.
  slices: ['session'],
  storage: AsyncStorage,
  performance: { debounceMs: 300 },
  onSaveComplete: (state) => {
    publishSavedTab(state.session.currentTab)
  },
})

export { storageApi }

const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(middleware),
})

let actions: AppActions | undefined
let cachedRoot: RootState | undefined
let cachedSnapshot: AppState | undefined
let snapshotDirty = false
const actionOverrides: Partial<Record<keyof AppActions, AppActions[keyof AppActions]>> = {}

/**
 * Reads the public Zustand-shaped state, including stable action functions.
 * Called by {@link useAppStore}.getState and by actions that need a sibling action.
 * @returns The latest app data, the session tab, and {@link createActions}.
 */
function readState(): AppState {
  const root = store.getState()
  // createActions assigns `actions` after this function exists, so setup reads have no methods yet.
  const publicActions = actions ?? {}
  return {
    ...root.app,
    currentTab: root.session.currentTab,
    ...publicActions,
    ...actionOverrides,
  } as AppState
}

/**
 * Copies data fields out of a Zustand partial so action functions never enter Redux.
 * Called by {@link commit} for both merges and full replacements.
 * @param partial - The resolved setState value.
 * @returns Only keys owned by the app slice.
 */
function dataFrom(partial: Partial<AppState>): Partial<AppData> {
  const data: Partial<AppData> = {}
  for (const key of APP_DATA_KEYS) {
    if (Object.prototype.hasOwnProperty.call(partial, key)) {
      data[key] = partial[key] as AppData[typeof key]
    }
  }
  return data
}

/**
 * Keeps function replacements from {@link useAppStore}.setState, which tests use to stub one action.
 * Called by {@link commit} before the slice dispatch so the next snapshot includes the stub.
 * @param resolved - The merged or replacement values.
 * @param replace - When true, stubs that are absent from `resolved` are removed.
 * @returns True when the stub map changed.
 */
function takeActionOverrides(resolved: Partial<AppState>, replace: boolean): boolean {
  let changed = false
  if (replace) {
    for (const key of Object.keys(actionOverrides) as (keyof AppActions)[]) {
      delete actionOverrides[key]
      changed = true
    }
  }

  for (const key of Object.keys(resolved) as (keyof AppState)[]) {
    const value = resolved[key]
    if (typeof value !== 'function') {
      continue
    }
    actionOverrides[key as keyof AppActions] = value as AppActions[keyof AppActions]
    changed = true
  }
  return changed
}

/**
 * Applies a Zustand `set` / `setState` onto the RTK slices.
 * Store actions and tests call this. `currentTab` updates the persisted session slice; other fields stay in memory.
 * @param partial - The next values, or a function of the current public state.
 * @param replace - When true, data fields missing from `partial` return to their initial values.
 */
function commit(partial: Parameters<SetAppState>[0], replace = false): void {
  const current = readState()
  const resolved = typeof partial === 'function' ? partial(current) : partial
  const data = dataFrom(resolved)
  const overridesChanged = takeActionOverrides(resolved, replace)
  // The Redux root does not change when only an action stub is replaced.
  if (overridesChanged) {
    snapshotDirty = true
  }
  let dispatched = false

  if (replace) {
    store.dispatch(appSlice.actions.replaceApp({ ...initialAppData, ...data }))
    dispatched = true
  } else if (Object.keys(data).length > 0) {
    store.dispatch(appSlice.actions.patchApp(data))
    dispatched = true
  }

  // Skip an unchanged tab so a no-op setState does not schedule another AsyncStorage write.
  if (
    Object.prototype.hasOwnProperty.call(resolved, 'currentTab') &&
    resolved.currentTab !== store.getState().session.currentTab
  ) {
    store.dispatch(sessionSlice.actions.setCurrentTab(resolved.currentTab as AppTab))
    dispatched = true
  }

  if (overridesChanged && !dispatched) {
    store.dispatch({ type: 'engage/actionOverridesChanged' })
  }
}

/**
 * Returns a stable snapshot for {@link useSyncExternalStore}.
 * React calls this on every store notification and during render.
 * @returns The cached public state until the Redux root reference changes.
 */
function getSnapshot(): AppState {
  const root = store.getState()
  if (!snapshotDirty && cachedRoot === root && cachedSnapshot) {
    return cachedSnapshot
  }
  snapshotDirty = false
  cachedSnapshot = readState()
  cachedRoot = root
  return cachedSnapshot
}

actions = createActions(commit, readState)

interface UseAppStore {
  (): AppState
  <T>(selector: (state: AppState) => T): T
  getState: () => AppState
  setState: SetAppState
}

/**
 * Subscribes a component to the public store shape that screens already select.
 * Screens call this during render; tests call `getState` and `setState` without a Provider.
 * @param selector - Optional projection. Omit it to read the whole public state.
 * @returns The selected value, or the whole state when no selector is passed.
 */
function useAppStoreHook<T>(selector?: (state: AppState) => T): T | AppState {
  return useSyncExternalStore(
    store.subscribe,
    () => (selector ? selector(getSnapshot()) : getSnapshot()),
    () => (selector ? selector(getSnapshot()) : getSnapshot()),
  )
}

export const useAppStore = Object.assign(useAppStoreHook, {
  getState: readState,
  setState: commit,
}) as UseAppStore

/**
 * Tells the tab layout when redux-storage-middleware has finished its initial read.
 * The tab layout calls this while deciding whether to restore the saved tab.
 * @returns True after hydration succeeds or fails. False while the read is still running.
 */
export function useStorageHydrationSettled(): boolean {
  return useSyncExternalStore(
    (listener) => {
      // onFinishHydration runs the listener immediately when already settled.
      // Ignore that synchronous call; getSnapshot already reports the settled value.
      let ignoreCurrent = true
      const unsubscribe = storageApi.onFinishHydration(() => {
        if (ignoreCurrent) {
          return
        }
        listener()
      })
      ignoreCurrent = false
      return unsubscribe
    },
    () => {
      const status = storageApi.getHydrationState()
      return status === 'hydrated' || status === 'error'
    },
    () => {
      const status = storageApi.getHydrationState()
      return status === 'hydrated' || status === 'error'
    },
  )
}

/**
 * Exposes the last tab AsyncStorage accepted, for the E2E marker only.
 * The tab layout calls this to render `session-tab-saved-*` after `setItem` resolves.
 * @returns The saved tab, or null before the first successful write.
 */
export function useLastSavedTab(): AppTab | null {
  return useSyncExternalStore(
    (listener) => {
      saveListeners.add(listener)
      return () => {
        saveListeners.delete(listener)
      }
    },
    () => lastSavedTab,
    () => lastSavedTab,
  )
}
