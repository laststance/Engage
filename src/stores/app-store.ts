import { create } from 'zustand'
import { Task, Entry, Completion, DayData, StatsData, Category } from '../types'
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
  getSuggestedTasks,
  groupTasksByCategory,
  calculateDayProgress,
  isTaskCompleted,
  getTaskCompletionStatus,
  validateJournalEntry,
  getJournalPlaceholder,
  getTaskRecommendations,
  hasCompletedDailyFlow,
  getMotivationalMessage,
  type TaskSelectionResult,
  type DayProgress,
} from '../utils/businessLogic'
import {
  getCurrentDate,
  getWeekStartDate,
  getWeekEndDate,
  getMonthStartDate,
  getMonthEndDate,
  getDaysInRange,
  isToday,
} from '../utils/dateUtils'
import {
  calculateWeeklyStats,
  calculateMonthlyStats,
  calculateAchievementData,
  calculateStreakDays,
  calculateProductivityTrends,
} from '../utils/statisticsEngine'

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
  error: string | null
  isFirstLaunch: boolean
  suggestedTasks: Task[]

  // Actions
  loadData: () => Promise<void>
  selectDate: (date: string) => void
  toggleTaskCompletion: (date: string, taskId: string) => Promise<void>
  updateJournalEntry: (date: string, content: string) => Promise<void>
  addTasksToDate: (date: string, taskIds: string[]) => Promise<void>
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
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  categories: [],
  tasks: [],
  entries: {},
  completions: {},
  selectedDate: new Date().toISOString().split('T')[0],
  isTaskPickerVisible: false,
  isPresetEditorVisible: false,
  isCategoryEditorVisible: false,
  currentTab: 'calendar',
  isLoading: false,
  error: null,
  isFirstLaunch: false,
  suggestedTasks: [],

  // Actions
  loadData: async () => {
    try {
      set({ isLoading: true, error: null })

      // Load all data from repositories
      const [categories, tasks, recentEntries, recentCompletions] =
        await Promise.all([
          categoryRepository.findAll(),
          taskRepository.findAll(),
          entryRepository.findRecentEntries(30), // Load last 30 days of entries
          completionRepository.findByDateRange(
            // Load last 30 days of completions
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            new Date().toISOString().split('T')[0]
          ),
        ])

      // Transform entries and completions into maps
      const entriesMap: Record<string, Entry> = {}
      recentEntries.forEach((entry) => {
        entriesMap[entry.date] = entry
      })

      const completionsMap: Record<string, Completion[]> = {}
      recentCompletions.forEach((completion) => {
        if (!completionsMap[completion.date]) {
          completionsMap[completion.date] = []
        }
        completionsMap[completion.date].push(completion)
      })

      set({
        categories,
        tasks,
        entries: entriesMap,
        completions: completionsMap,
        isLoading: false,
      })

      console.log('Data loaded successfully:', {
        categories: categories.length,
        tasks: tasks.length,
        entries: recentEntries.length,
        completions: recentCompletions.length,
      })
    } catch (error) {
      console.error('Failed to load data:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to load data',
        isLoading: false,
      })
    }
  },

  selectDate: (date: string) => {
    set({ selectedDate: date })
  },

  toggleTaskCompletion: async (date: string, taskId: string) => {
    try {
      set({ error: null })

      const isCompleted = await completionRepository.toggle(date, taskId)

      // Update local state
      const state = get()
      const updatedCompletions = { ...state.completions }

      if (isCompleted) {
        // Task was completed - add to local state
        if (!updatedCompletions[date]) {
          updatedCompletions[date] = []
        }
        const newCompletion: Completion = {
          id: `temp_${Date.now()}`,
          date,
          taskId,
          createdAt: Date.now(),
        }
        updatedCompletions[date].push(newCompletion)
      } else {
        // Task was uncompleted - remove from local state
        if (updatedCompletions[date]) {
          updatedCompletions[date] = updatedCompletions[date].filter(
            (c) => c.taskId !== taskId
          )
          if (updatedCompletions[date].length === 0) {
            delete updatedCompletions[date]
          }
        }
      }

      set({ completions: updatedCompletions })

      console.log(
        `Task ${taskId} ${
          isCompleted ? 'completed' : 'uncompleted'
        } for ${date}`
      )
    } catch (error) {
      console.error('Failed to toggle task completion:', error)
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to toggle task completion',
      })
    }
  },

  updateJournalEntry: async (date: string, content: string) => {
    try {
      set({ error: null })

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

        console.log(`Journal entry updated for ${date}`)
      } else {
        throw new Error(result.errors.join(', '))
      }
    } catch (error) {
      console.error('Failed to update journal entry:', error)
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update journal entry',
      })
    }
  },

  addTasksToDate: async (date: string, taskIds: string[]) => {
    try {
      set({ error: null })

      // This action doesn't actually create completions, just makes tasks available for the date
      // The actual completion happens when user checks the task
      console.log(`Tasks ${taskIds.join(', ')} added to ${date}`)
    } catch (error) {
      console.error('Failed to add tasks to date:', error)
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to add tasks to date',
      })
    }
  },

  updatePresetTasks: async (tasks: Task[]) => {
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

      // Execute all operations
      await Promise.all(operations.map((op) => op()))

      // Reload tasks from database to get accurate state
      const updatedTasks = await taskRepository.findAll()
      set({ tasks: updatedTasks })

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
  },

  createCategory: async (category: Omit<Category, 'id'>) => {
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
  },

  updateCategory: async (id: string, updates: Partial<Category>) => {
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
  },

  deleteCategory: async (id: string) => {
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
  },

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
      set({ isLoading: true, error: null })

      // Check if this is first launch
      const isFirstLaunch = await presetService.isFirstLaunch()

      // Initialize presets (categories and tasks)
      const initResult = await get().initializePresets()

      // Load all data
      await get().loadData()

      set({
        isFirstLaunch,
        suggestedTasks: initResult.suggestedTasks,
        isLoading: false,
      })

      console.log('App initialized successfully', {
        isFirstLaunch,
        categoriesCreated: initResult.categoriesCreated,
        tasksCreated: initResult.tasksCreated,
        suggestedTasksCount: initResult.suggestedTasks.length,
      })
    } catch (error) {
      console.error('Failed to initialize app:', error)
      set({
        error:
          error instanceof Error ? error.message : 'Failed to initialize app',
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
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0]

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

  validateAndUpdateJournal: async (date: string, content: string) => {
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
  },

  getJournalPlaceholder: (date: string) => {
    const state = get()
    const completions = state.completions[date] || []
    return getJournalPlaceholder(completions.length > 0)
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
}))
