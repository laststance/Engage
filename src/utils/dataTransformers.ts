import { Task, Entry, Completion, DayData, StatsData } from '../types'
import { CompletionStats } from '../services/repositories'
import { formatDate } from './dateUtils'

/**
 * Transforms raw data into DayData structure for UI consumption
 */
export function transformToDayData(
  date: string,
  tasks: Task[],
  completions: Completion[],
  entry: Entry | null
): DayData {
  return {
    date,
    tasks,
    completions,
    entry,
  }
}

/**
 * Transforms completion statistics into StatsData structure
 */
export function transformToStatsData(
  completionStats: CompletionStats,
  journalDays: number
): StatsData {
  return {
    streakDays: completionStats.streakDays,
    completionRate: completionStats.completionRate,
    activeDays: completionStats.activeDays,
    totalTasks: completionStats.totalCompletions,
    dailyAverage: completionStats.dailyAverage,
    journalDays,
    categoryBreakdown: completionStats.categoryBreakdown,
  }
}

/**
 * Groups tasks by category for UI display
 */
export function groupTasksByCategory(tasks: Task[]): Record<string, Task[]> {
  return tasks.reduce((groups, task) => {
    if (!groups[task.categoryId]) {
      groups[task.categoryId] = []
    }
    groups[task.categoryId].push(task)
    return groups
  }, {} as Record<string, Task[]>)
}

/**
 * Calculates completion progress for a set of tasks and completions
 */
export function calculateCompletionProgress(
  tasks: Task[],
  completions: Completion[]
): {
  total: number
  completed: number
  percentage: number
  categories: Record<string, { total: number; completed: number }>
} {
  const completedTaskIds = new Set(completions.map((c) => c.taskId))

  // Group tasks by category
  const tasksByCategory = groupTasksByCategory(tasks)
  const categories: Record<string, { total: number; completed: number }> = {}

  // Calculate completion for each category
  Object.keys(tasksByCategory).forEach((categoryId) => {
    const categoryTasks = tasksByCategory[categoryId]
    const completedInCategory = categoryTasks.filter((t) =>
      completedTaskIds.has(t.id)
    ).length

    categories[categoryId] = {
      total: categoryTasks.length,
      completed: completedInCategory,
    }
  })

  const totalCompleted = Object.values(categories).reduce(
    (sum, cat) => sum + cat.completed,
    0
  )
  const totalTasks = tasks.length

  return {
    total: totalTasks,
    completed: totalCompleted,
    percentage:
      totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0,
    categories,
  }
}

/**
 * Generates date range array between two dates
 */
export function generateDateRange(
  startDate: string,
  endDate: string
): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    dates.push(formatDate(date))
  }

  return dates
}

/**
 * Gets the start and end dates for a given week
 */
export function getWeekDateRange(date: string): {
  startDate: string
  endDate: string
} {
  const targetDate = new Date(date)
  const dayOfWeek = targetDate.getDay()

  // Calculate start of week (Sunday)
  const startDate = new Date(targetDate)
  startDate.setDate(targetDate.getDate() - dayOfWeek)

  // Calculate end of week (Saturday)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  }
}

/**
 * Gets the start and end dates for a given month
 */
export function getMonthDateRange(
  year: number,
  month: number
): { startDate: string; endDate: string } {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
  const endDate = formatDate(new Date(year, month, 0))

  return { startDate, endDate }
}

/**
 * Formats date for display in different locales
 */
export function formatDateForDisplay(
  date: string,
  locale: string = 'ja-JP'
): string {
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Formats relative date (e.g., "今日", "昨日", "3日前")
 */
export function formatRelativeDate(
  date: string,
  currentDate: string = formatDate(new Date())
): string {
  const targetDate = new Date(date)
  const today = new Date(currentDate)

  const diffTime = today.getTime() - targetDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今日'
  if (diffDays === 1) return '昨日'
  if (diffDays === -1) return '明日'
  if (diffDays > 1) return `${diffDays}日前`
  if (diffDays < -1) return `${Math.abs(diffDays)}日後`

  return date
}

/**
 * Calculates heatmap intensity based on completion count
 */
export function calculateHeatmapIntensity(
  completionCount: number,
  maxCompletions: number = 4
): number {
  if (completionCount === 0) return 0
  if (maxCompletions === 0) return 1

  return Math.min(completionCount / maxCompletions, 1)
}

/**
 * Generates calendar grid data for a given month
 */
export function generateCalendarGrid(
  year: number,
  month: number,
  heatmapData: Record<string, number> = {}
): {
  date: string
  day: number
  isCurrentMonth: boolean
  completionCount: number
  intensity: number
}[] {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startOfWeek = new Date(firstDay)
  startOfWeek.setDate(firstDay.getDate() - firstDay.getDay())

  const grid: {
    date: string
    day: number
    isCurrentMonth: boolean
    completionCount: number
    intensity: number
  }[] = []

  // Generate 6 weeks (42 days) to fill calendar grid
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startOfWeek)
    currentDate.setDate(startOfWeek.getDate() + i)

    const dateString = formatDate(currentDate)
    const completionCount = heatmapData[dateString] || 0

    grid.push({
      date: dateString,
      day: currentDate.getDate(),
      isCurrentMonth: currentDate.getMonth() === month - 1,
      completionCount,
      intensity: calculateHeatmapIntensity(completionCount),
    })
  }

  return grid
}

/**
 * Validates and normalizes date string
 */
export function normalizeDate(date: string | Date): string {
  if (date instanceof Date) {
    return formatDate(date)
  }

  // Validate YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD')
  }

  return date
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return formatDate(new Date())
}

/**
 * Checks if a date is today
 */
export function isToday(date: string): boolean {
  return date === getTodayDate()
}

/**
 * Checks if a date is in the past
 */
export function isPastDate(date: string): boolean {
  return date < getTodayDate()
}

/**
 * Checks if a date is in the future
 */
export function isFutureDate(date: string): boolean {
  return date > getTodayDate()
}
