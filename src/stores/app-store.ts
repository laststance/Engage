import { create } from 'zustand'
import { Task, Entry, Completion, DayData, StatsData } from '../types'

interface AppState {
  // Data
  tasks: Task[]
  entries: Record<string, Entry> // date -> entry
  completions: Record<string, Completion[]> // date -> completions

  // UI State
  selectedDate: string
  isTaskPickerVisible: boolean
  isPresetEditorVisible: boolean
  currentTab: 'calendar' | 'today' | 'stats'

  // Actions
  loadData: () => Promise<void>
  selectDate: (date: string) => void
  toggleTaskCompletion: (date: string, taskId: string) => Promise<void>
  updateJournalEntry: (date: string, content: string) => Promise<void>
  addTasksToDate: (date: string, taskIds: string[]) => Promise<void>
  updatePresetTasks: (tasks: Task[]) => Promise<void>

  // Computed
  getStatsForPeriod: (period: 'week' | 'month') => StatsData
  getAchievementData: () => Record<string, number>
  getDayData: (date: string) => DayData
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  tasks: [],
  entries: {},
  completions: {},
  selectedDate: new Date().toISOString().split('T')[0],
  isTaskPickerVisible: false,
  isPresetEditorVisible: false,
  currentTab: 'calendar',

  // Actions
  loadData: async () => {
    // TODO: Load data from SQLite database
    console.log('Loading data...')
  },

  selectDate: (date: string) => {
    set({ selectedDate: date })
  },

  toggleTaskCompletion: async (date: string, taskId: string) => {
    // TODO: Toggle task completion in database
    console.log('Toggling task completion:', date, taskId)
  },

  updateJournalEntry: async (date: string, content: string) => {
    // TODO: Update journal entry in database
    console.log('Updating journal entry:', date, content)
  },

  addTasksToDate: async (date: string, taskIds: string[]) => {
    // TODO: Add tasks to specific date
    console.log('Adding tasks to date:', date, taskIds)
  },

  updatePresetTasks: async (tasks: Task[]) => {
    // TODO: Update preset tasks in database
    set({ tasks })
  },

  // Computed getters
  getStatsForPeriod: (period: 'week' | 'month') => {
    // TODO: Calculate statistics for the given period
    return {
      streakDays: 0,
      completionRate: 0,
      activeDays: 0,
      totalTasks: 0,
      dailyAverage: 0,
      journalDays: 0,
      categoryBreakdown: {
        business: { completed: 0, total: 0 },
        life: { completed: 0, total: 0 },
      },
    }
  },

  getAchievementData: () => {
    // TODO: Calculate achievement data for calendar heatmap
    return {}
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
}))
