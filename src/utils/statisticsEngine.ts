/**
 * Statistics calculation engine for the Engage app
 */

import { Task, Completion, Entry, Category, StatsData } from '../types'
import { getDaysInRange, getCurrentDate } from './dateUtils'

export interface StreakCalculationResult {
  currentStreak: number
  longestStreak: number
  streakDates: string[]
}

export interface CategoryStats {
  completed: number
  total: number
  completionRate: number
  averagePerDay: number
}

export interface WeeklyStats extends StatsData {
  weekStart: string
  weekEnd: string
}

export interface MonthlyStats extends StatsData {
  monthStart: string
  monthEnd: string
  year: number
  month: number
}

/**
 * Calculate current streak based on consecutive days with at least one completion
 */
export const calculateStreakDays = (
  completions: Record<string, Completion[]>,
  currentDate: string = getCurrentDate()
): StreakCalculationResult => {
  // Get all dates with completions, sorted in descending order
  const completionDates = Object.keys(completions)
    .filter((date) => completions[date].length > 0)
    .sort((a, b) => b.localeCompare(a))

  if (completionDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, streakDates: [] }
  }

  // Calculate current streak
  let currentStreak = 0
  let streakDates: string[] = []
  const today = new Date(currentDate)

  for (const date of completionDates) {
    const completionDate = new Date(date)
    const daysDiff = Math.floor(
      (today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysDiff === currentStreak) {
      currentStreak++
      streakDates.push(date)
    } else {
      break
    }
  }

  // Calculate longest streak
  let longestStreak = 0
  let tempStreak = 0
  let previousDate: Date | null = null

  for (const date of completionDates.reverse()) {
    const currentDateObj = new Date(date)

    if (previousDate === null) {
      tempStreak = 1
    } else {
      const daysDiff = Math.floor(
        (currentDateObj.getTime() - previousDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )

      if (daysDiff === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }

    previousDate = currentDateObj
  }

  longestStreak = Math.max(longestStreak, tempStreak)

  return {
    currentStreak,
    longestStreak,
    streakDates: streakDates.reverse(),
  }
}

/**
 * Calculate completion rate for a date range
 */
export const calculateCompletionRate = (
  completions: Record<string, Completion[]>,
  startDate: string,
  endDate: string
): number => {
  const daysInRange = getDaysInRange(startDate, endDate)
  const daysWithCompletions = daysInRange.filter(
    (date) => completions[date] && completions[date].length > 0
  ).length

  return daysInRange.length > 0
    ? (daysWithCompletions / daysInRange.length) * 100
    : 0
}

/**
 * Calculate category breakdown statistics
 */
export const calculateCategoryBreakdown = (
  tasks: Task[],
  completions: Record<string, Completion[]>,
  categories: Category[],
  startDate: string,
  endDate: string
): Record<string, CategoryStats> => {
  const daysInRange = getDaysInRange(startDate, endDate)
  const breakdown: Record<string, CategoryStats> = {}

  categories.forEach((category) => {
    const categoryTasks = tasks.filter((t) => t.categoryId === category.id)

    // Count completions for this category
    let totalCompletions = 0
    daysInRange.forEach((date) => {
      const dayCompletions = completions[date] || []
      const categoryCompletions = dayCompletions.filter((completion) =>
        categoryTasks.some((task) => task.id === completion.taskId)
      )
      totalCompletions += categoryCompletions.length
    })

    const totalPossible = categoryTasks.length * daysInRange.length
    const completionRate =
      totalPossible > 0 ? (totalCompletions / totalPossible) * 100 : 0
    const averagePerDay =
      daysInRange.length > 0 ? totalCompletions / daysInRange.length : 0

    breakdown[category.id] = {
      completed: totalCompletions,
      total: totalPossible,
      completionRate: Math.round(completionRate * 100) / 100,
      averagePerDay: Math.round(averagePerDay * 100) / 100,
    }
  })

  return breakdown
}

/**
 * Calculate journal statistics
 */
export const calculateJournalStats = (
  entries: Record<string, Entry>,
  startDate: string,
  endDate: string
): {
  journalDays: number
  totalEntries: number
  averageLength: number
  longestEntry: number
} => {
  const daysInRange = getDaysInRange(startDate, endDate)
  const relevantEntries = daysInRange
    .map((date) => entries[date])
    .filter((entry) => entry && entry.note.trim().length > 0)

  const totalEntries = relevantEntries.length
  const journalDays = totalEntries // Same as total entries since one entry per day max

  const lengths = relevantEntries.map((entry) => entry.note.length)
  const averageLength =
    lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0
  const longestEntry = lengths.length > 0 ? Math.max(...lengths) : 0

  return {
    journalDays,
    totalEntries,
    averageLength: Math.round(averageLength),
    longestEntry,
  }
}

/**
 * Calculate weekly statistics
 */
export const calculateWeeklyStats = (
  tasks: Task[],
  completions: Record<string, Completion[]>,
  entries: Record<string, Entry>,
  categories: Category[],
  weekStartDate: string,
  weekEndDate: string
): WeeklyStats => {
  const daysInRange = getDaysInRange(weekStartDate, weekEndDate)

  // Calculate basic stats
  const totalCompletions = daysInRange.reduce((total, date) => {
    return total + (completions[date]?.length || 0)
  }, 0)

  const activeDays = daysInRange.filter(
    (date) => completions[date] && completions[date].length > 0
  ).length

  const completionRate = calculateCompletionRate(
    completions,
    weekStartDate,
    weekEndDate
  )
  const dailyAverage = activeDays > 0 ? totalCompletions / activeDays : 0

  // Calculate streak
  const streakResult = calculateStreakDays(completions, weekEndDate)

  // Calculate category breakdown
  const categoryBreakdown = calculateCategoryBreakdown(
    tasks,
    completions,
    categories,
    weekStartDate,
    weekEndDate
  )

  // Convert CategoryStats to the expected format
  const categoryBreakdownFormatted: Record<
    string,
    { completed: number; total: number }
  > = {}
  Object.entries(categoryBreakdown).forEach(([categoryId, stats]) => {
    categoryBreakdownFormatted[categoryId] = {
      completed: stats.completed,
      total: stats.total,
    }
  })

  // Calculate journal stats
  const journalStats = calculateJournalStats(
    entries,
    weekStartDate,
    weekEndDate
  )

  return {
    streakDays: streakResult.currentStreak,
    completionRate: Math.round(completionRate * 100) / 100,
    activeDays,
    totalTasks: totalCompletions,
    dailyAverage: Math.round(dailyAverage * 100) / 100,
    journalDays: journalStats.journalDays,
    categoryBreakdown: categoryBreakdownFormatted,
    weekStart: weekStartDate,
    weekEnd: weekEndDate,
  }
}

/**
 * Calculate monthly statistics
 */
export const calculateMonthlyStats = (
  tasks: Task[],
  completions: Record<string, Completion[]>,
  entries: Record<string, Entry>,
  categories: Category[],
  monthStartDate: string,
  monthEndDate: string,
  year: number,
  month: number
): MonthlyStats => {
  const daysInRange = getDaysInRange(monthStartDate, monthEndDate)

  // Calculate basic stats
  const totalCompletions = daysInRange.reduce((total, date) => {
    return total + (completions[date]?.length || 0)
  }, 0)

  const activeDays = daysInRange.filter(
    (date) => completions[date] && completions[date].length > 0
  ).length

  const completionRate = calculateCompletionRate(
    completions,
    monthStartDate,
    monthEndDate
  )
  const dailyAverage = activeDays > 0 ? totalCompletions / activeDays : 0

  // Calculate streak
  const streakResult = calculateStreakDays(completions, monthEndDate)

  // Calculate category breakdown
  const categoryBreakdown = calculateCategoryBreakdown(
    tasks,
    completions,
    categories,
    monthStartDate,
    monthEndDate
  )

  // Convert CategoryStats to the expected format
  const categoryBreakdownFormatted: Record<
    string,
    { completed: number; total: number }
  > = {}
  Object.entries(categoryBreakdown).forEach(([categoryId, stats]) => {
    categoryBreakdownFormatted[categoryId] = {
      completed: stats.completed,
      total: stats.total,
    }
  })

  // Calculate journal stats
  const journalStats = calculateJournalStats(
    entries,
    monthStartDate,
    monthEndDate
  )

  return {
    streakDays: streakResult.currentStreak,
    completionRate: Math.round(completionRate * 100) / 100,
    activeDays,
    totalTasks: totalCompletions,
    dailyAverage: Math.round(dailyAverage * 100) / 100,
    journalDays: journalStats.journalDays,
    categoryBreakdown: categoryBreakdownFormatted,
    monthStart: monthStartDate,
    monthEnd: monthEndDate,
    year,
    month,
  }
}

/**
 * Get achievement data for calendar heatmap
 */
export const calculateAchievementData = (
  completions: Record<string, Completion[]>,
  startDate?: string,
  endDate?: string
): Record<string, number> => {
  const achievementData: Record<string, number> = {}

  Object.entries(completions).forEach(([date, dayCompletions]) => {
    // Filter by date range if provided
    if (startDate && date < startDate) return
    if (endDate && date > endDate) return

    achievementData[date] = dayCompletions.length
  })

  return achievementData
}

/**
 * Calculate productivity trends
 */
export const calculateProductivityTrends = (
  completions: Record<string, Completion[]>,
  entries: Record<string, Entry>,
  startDate: string,
  endDate: string
): {
  dailyCompletions: { date: string; completions: number }[]
  weeklyAverages: { week: string; average: number }[]
  bestDay: { date: string; completions: number } | null
  mostProductiveWeekday: string
} => {
  const daysInRange = getDaysInRange(startDate, endDate)

  // Daily completions
  const dailyCompletions = daysInRange.map((date) => ({
    date,
    completions: completions[date]?.length || 0,
  }))

  // Find best day
  const bestDay = dailyCompletions.reduce((best, current) => {
    return current.completions > (best?.completions || 0) ? current : best
  }, null as { date: string; completions: number } | null)

  // Calculate weekday productivity
  const weekdayTotals: Record<string, { total: number; count: number }> = {
    Sunday: { total: 0, count: 0 },
    Monday: { total: 0, count: 0 },
    Tuesday: { total: 0, count: 0 },
    Wednesday: { total: 0, count: 0 },
    Thursday: { total: 0, count: 0 },
    Friday: { total: 0, count: 0 },
    Saturday: { total: 0, count: 0 },
  }

  dailyCompletions.forEach(({ date, completions }) => {
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
    })
    weekdayTotals[dayOfWeek].total += completions
    weekdayTotals[dayOfWeek].count += 1
  })

  const mostProductiveWeekday =
    Object.entries(weekdayTotals)
      .map(([day, { total, count }]) => ({
        day,
        average: count > 0 ? total / count : 0,
      }))
      .sort((a, b) => b.average - a.average)[0]?.day || 'Monday'

  // Weekly averages (simplified - just group by 7-day periods)
  const weeklyAverages: { week: string; average: number }[] = []
  for (let i = 0; i < dailyCompletions.length; i += 7) {
    const weekData = dailyCompletions.slice(i, i + 7)
    const weekTotal = weekData.reduce((sum, day) => sum + day.completions, 0)
    const weekAverage = weekData.length > 0 ? weekTotal / weekData.length : 0

    weeklyAverages.push({
      week: weekData[0]?.date || '',
      average: Math.round(weekAverage * 100) / 100,
    })
  }

  return {
    dailyCompletions,
    weeklyAverages,
    bestDay,
    mostProductiveWeekday,
  }
}
