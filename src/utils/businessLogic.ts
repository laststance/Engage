/**
 * Business logic utilities for the Engage app
 */

import { Task, Completion, Entry, Category } from '../types'

export interface TaskSelectionResult {
  selectedTasks: Task[]
  suggestedTasks: Task[]
  categoryGroups: Record<string, Task[]>
}

export interface DayProgress {
  date: string
  totalTasks: number
  completedTasks: number
  completionRate: number
  hasJournalEntry: boolean
  categoryProgress: Record<string, { completed: number; total: number }>
}

/**
 * Get suggested tasks for first-time users (3 recommended tasks)
 */
export const getSuggestedTasks = (
  tasks: Task[],
  categories: Category[]
): Task[] => {
  const businessTasks = tasks.filter((t) => t.categoryId === 'business')
  const lifeTasks = tasks.filter((t) => t.categoryId === 'life')

  const suggestions: Task[] = []

  // Add one business task
  if (businessTasks.length > 0) {
    suggestions.push(businessTasks[0])
  }

  // Add two life tasks
  if (lifeTasks.length > 0) {
    suggestions.push(lifeTasks[0])
    if (lifeTasks.length > 1) {
      suggestions.push(lifeTasks[1])
    }
  }

  return suggestions.slice(0, 3)
}

/**
 * Group tasks by category for display
 */
export const groupTasksByCategory = (
  tasks: Task[],
  categories: Category[]
): Record<string, Task[]> => {
  const groups: Record<string, Task[]> = {}

  categories.forEach((category) => {
    groups[category.id] = tasks.filter(
      (task) => task.categoryId === category.id
    )
  })

  return groups
}

/**
 * Calculate progress for a specific day
 */
export const calculateDayProgress = (
  date: string,
  tasks: Task[],
  completions: Completion[],
  entry: Entry | null,
  categories: Category[]
): DayProgress => {
  const dayCompletions = completions.filter((c) => c.date === date)
  const completedTaskIds = new Set(dayCompletions.map((c) => c.taskId))

  // Calculate category progress
  const categoryProgress: Record<string, { completed: number; total: number }> =
    {}

  categories.forEach((category) => {
    const categoryTasks = tasks.filter((t) => t.categoryId === category.id)
    const completedCategoryTasks = categoryTasks.filter((t) =>
      completedTaskIds.has(t.id)
    )

    categoryProgress[category.id] = {
      completed: completedCategoryTasks.length,
      total: categoryTasks.length,
    }
  })

  return {
    date,
    totalTasks: tasks.length,
    completedTasks: dayCompletions.length,
    completionRate:
      tasks.length > 0 ? (dayCompletions.length / tasks.length) * 100 : 0,
    hasJournalEntry: entry !== null && entry.note.trim().length > 0,
    categoryProgress,
  }
}

/**
 * Check if a task is completed on a specific date
 */
export const isTaskCompleted = (
  taskId: string,
  date: string,
  completions: Completion[]
): boolean => {
  return completions.some((c) => c.taskId === taskId && c.date === date)
}

/**
 * Get completion status for multiple tasks on a date
 */
export const getTaskCompletionStatus = (
  taskIds: string[],
  date: string,
  completions: Completion[]
): Record<string, boolean> => {
  const status: Record<string, boolean> = {}

  taskIds.forEach((taskId) => {
    status[taskId] = isTaskCompleted(taskId, date, completions)
  })

  return status
}

/**
 * Validate journal entry content
 */
export const validateJournalEntry = (
  content: string
): {
  isValid: boolean
  errors: string[]
} => {
  const errors: string[] = []

  if (content.length > 1000) {
    errors.push('Journal entry is too long (maximum 1000 characters)')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Generate placeholder text for journal entries
 */
export const getJournalPlaceholder = (hasCompletions: boolean): string => {
  if (hasCompletions) {
    return '今日達成したことについて振り返ってみましょう...'
  }
  return '日記を書いてみましょう...'
}

/**
 * Calculate task selection recommendations based on user history
 */
export const getTaskRecommendations = (
  tasks: Task[],
  recentCompletions: Completion[],
  categories: Category[]
): TaskSelectionResult => {
  // Get frequently completed tasks
  const taskCompletionCounts = new Map<string, number>()

  recentCompletions.forEach((completion) => {
    const count = taskCompletionCounts.get(completion.taskId) || 0
    taskCompletionCounts.set(completion.taskId, count + 1)
  })

  // Sort tasks by completion frequency
  const sortedTasks = [...tasks].sort((a, b) => {
    const aCount = taskCompletionCounts.get(a.id) || 0
    const bCount = taskCompletionCounts.get(b.id) || 0
    return bCount - aCount
  })

  const suggestedTasks = sortedTasks.slice(0, 3)
  const categoryGroups = groupTasksByCategory(tasks, categories)

  return {
    selectedTasks: [],
    suggestedTasks,
    categoryGroups,
  }
}

/**
 * Check if user has completed the core daily flow
 */
export const hasCompletedDailyFlow = (
  date: string,
  completions: Completion[],
  entry: Entry | null
): boolean => {
  const dayCompletions = completions.filter((c) => c.date === date)
  const hasAtLeastOneCompletion = dayCompletions.length > 0
  const hasJournalEntry = entry !== null && entry.note.trim().length > 0

  return hasAtLeastOneCompletion && hasJournalEntry
}

/**
 * Get motivational message based on progress
 */
export const getMotivationalMessage = (progress: DayProgress): string => {
  if (progress.completedTasks === 0) {
    return 'タスクを選んで今日を始めましょう！'
  }

  if (progress.completionRate === 100) {
    if (progress.hasJournalEntry) {
      return '素晴らしい！今日も完璧な一日でした！'
    }
    return 'タスク完了！日記を書いて一日を振り返りましょう'
  }

  if (progress.completionRate >= 50) {
    return '順調に進んでいます！この調子で続けましょう'
  }

  return 'もう少し頑張りましょう！'
}
