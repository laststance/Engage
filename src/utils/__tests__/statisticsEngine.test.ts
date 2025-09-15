import {
  calculateStreakDays,
  calculateCompletionRate,
  calculateCategoryBreakdown,
  calculateJournalStats,
  calculateWeeklyStats,
  calculateMonthlyStats,
  calculateAchievementData,
  calculateProductivityTrends,
} from '../statisticsEngine'
import { Task, Completion, Entry, Category } from '../../types'

// Mock data
const mockCategories: Category[] = [
  { id: 'business', name: '事業' },
  { id: 'life', name: '生活' },
]

const mockTasks: Task[] = [
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

const mockCompletions: Record<string, Completion[]> = {
  '2025-01-15': [
    { id: 'c1', date: '2025-01-15', taskId: 'task1', createdAt: Date.now() },
    { id: 'c2', date: '2025-01-15', taskId: 'task2', createdAt: Date.now() },
  ],
  '2025-01-16': [
    { id: 'c3', date: '2025-01-16', taskId: 'task1', createdAt: Date.now() },
  ],
  '2025-01-17': [
    { id: 'c4', date: '2025-01-17', taskId: 'task2', createdAt: Date.now() },
  ],
  // Gap on 2025-01-18
  '2025-01-19': [
    { id: 'c5', date: '2025-01-19', taskId: 'task1', createdAt: Date.now() },
  ],
}

const mockEntries: Record<string, Entry> = {
  '2025-01-15': {
    id: 'e1',
    date: '2025-01-15',
    note: 'Great day!',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  '2025-01-16': {
    id: 'e2',
    date: '2025-01-16',
    note: 'Good progress',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  '2025-01-17': {
    id: 'e3',
    date: '2025-01-17',
    note: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
}

describe('statisticsEngine', () => {
  describe('calculateStreakDays', () => {
    it('should calculate current streak correctly', () => {
      const result = calculateStreakDays(mockCompletions, '2025-01-19')

      expect(result.currentStreak).toBe(1) // Only 2025-01-19 is consecutive from current date
      expect(result.streakDates).toEqual(['2025-01-19'])
    })

    it('should handle no completions', () => {
      const result = calculateStreakDays({}, '2025-01-19')

      expect(result.currentStreak).toBe(0)
      expect(result.longestStreak).toBe(0)
      expect(result.streakDates).toEqual([])
    })

    it('should calculate longest streak', () => {
      const consecutiveCompletions: Record<string, Completion[]> = {
        '2025-01-15': [
          {
            id: 'c1',
            date: '2025-01-15',
            taskId: 'task1',
            createdAt: Date.now(),
          },
        ],
        '2025-01-16': [
          {
            id: 'c2',
            date: '2025-01-16',
            taskId: 'task1',
            createdAt: Date.now(),
          },
        ],
        '2025-01-17': [
          {
            id: 'c3',
            date: '2025-01-17',
            taskId: 'task1',
            createdAt: Date.now(),
          },
        ],
      }

      const result = calculateStreakDays(consecutiveCompletions, '2025-01-17')

      expect(result.currentStreak).toBe(3)
      expect(result.longestStreak).toBe(3)
    })
  })

  describe('calculateCompletionRate', () => {
    it('should calculate completion rate correctly', () => {
      const rate = calculateCompletionRate(
        mockCompletions,
        '2025-01-15',
        '2025-01-19'
      )

      // 4 days with completions out of 5 total days = 80%
      expect(rate).toBe(80)
    })

    it('should handle no completions', () => {
      const rate = calculateCompletionRate({}, '2025-01-15', '2025-01-19')
      expect(rate).toBe(0)
    })

    it('should handle single day range', () => {
      const rate = calculateCompletionRate(
        mockCompletions,
        '2025-01-15',
        '2025-01-15'
      )
      expect(rate).toBe(100) // 1 day with completions out of 1 day
    })
  })

  describe('calculateCategoryBreakdown', () => {
    it('should calculate category breakdown correctly', () => {
      const breakdown = calculateCategoryBreakdown(
        mockTasks,
        mockCompletions,
        mockCategories,
        '2025-01-15',
        '2025-01-17'
      )

      expect(breakdown.business.completed).toBe(2) // task1 completed on 15th and 16th
      expect(breakdown.business.total).toBe(3) // 1 task * 3 days
      expect(breakdown.life.completed).toBe(2) // task2 completed on 15th and 17th
      expect(breakdown.life.total).toBe(3) // 1 task * 3 days
    })

    it('should handle empty categories', () => {
      const breakdown = calculateCategoryBreakdown(
        [],
        mockCompletions,
        mockCategories,
        '2025-01-15',
        '2025-01-17'
      )

      expect(breakdown.business.completed).toBe(0)
      expect(breakdown.business.total).toBe(0)
      expect(breakdown.life.completed).toBe(0)
      expect(breakdown.life.total).toBe(0)
    })
  })

  describe('calculateJournalStats', () => {
    it('should calculate journal stats correctly', () => {
      const stats = calculateJournalStats(
        mockEntries,
        '2025-01-15',
        '2025-01-17'
      )

      expect(stats.journalDays).toBe(2) // Only entries with non-empty notes
      expect(stats.totalEntries).toBe(2)
      expect(stats.averageLength).toBe(Math.round((10 + 13) / 2)) // "Great day!" + "Good progress"
      expect(stats.longestEntry).toBe(13) // "Good progress"
    })

    it('should handle no entries', () => {
      const stats = calculateJournalStats({}, '2025-01-15', '2025-01-17')

      expect(stats.journalDays).toBe(0)
      expect(stats.totalEntries).toBe(0)
      expect(stats.averageLength).toBe(0)
      expect(stats.longestEntry).toBe(0)
    })
  })

  describe('calculateWeeklyStats', () => {
    it('should calculate weekly stats correctly', () => {
      const stats = calculateWeeklyStats(
        mockTasks,
        mockCompletions,
        mockEntries,
        mockCategories,
        '2025-01-15',
        '2025-01-19'
      )

      expect(stats.totalTasks).toBe(5) // Total completions across all days
      expect(stats.activeDays).toBe(4) // Days with at least one completion
      expect(stats.journalDays).toBe(2) // Days with non-empty journal entries
      expect(stats.weekStart).toBe('2025-01-15')
      expect(stats.weekEnd).toBe('2025-01-19')

      expect(stats.categoryBreakdown.business.completed).toBe(3)
      expect(stats.categoryBreakdown.life.completed).toBe(2)
    })
  })

  describe('calculateMonthlyStats', () => {
    it('should calculate monthly stats correctly', () => {
      const stats = calculateMonthlyStats(
        mockTasks,
        mockCompletions,
        mockEntries,
        mockCategories,
        '2025-01-15',
        '2025-01-19',
        2025,
        1
      )

      expect(stats.totalTasks).toBe(5)
      expect(stats.activeDays).toBe(4)
      expect(stats.journalDays).toBe(2)
      expect(stats.monthStart).toBe('2025-01-15')
      expect(stats.monthEnd).toBe('2025-01-19')
      expect(stats.year).toBe(2025)
      expect(stats.month).toBe(1)
    })
  })

  describe('calculateAchievementData', () => {
    it('should calculate achievement data correctly', () => {
      const data = calculateAchievementData(mockCompletions)

      expect(data['2025-01-15']).toBe(2)
      expect(data['2025-01-16']).toBe(1)
      expect(data['2025-01-17']).toBe(1)
      expect(data['2025-01-19']).toBe(1)
      expect(data['2025-01-18']).toBeUndefined()
    })

    it('should filter by date range', () => {
      const data = calculateAchievementData(
        mockCompletions,
        '2025-01-16',
        '2025-01-17'
      )

      expect(data['2025-01-15']).toBeUndefined()
      expect(data['2025-01-16']).toBe(1)
      expect(data['2025-01-17']).toBe(1)
      expect(data['2025-01-19']).toBeUndefined()
    })
  })

  describe('calculateProductivityTrends', () => {
    it('should calculate productivity trends correctly', () => {
      const trends = calculateProductivityTrends(
        mockCompletions,
        mockEntries,
        '2025-01-15',
        '2025-01-19'
      )

      expect(trends.dailyCompletions).toHaveLength(5)
      expect(trends.dailyCompletions[0]).toEqual({
        date: '2025-01-15',
        completions: 2,
      })
      expect(trends.dailyCompletions[1]).toEqual({
        date: '2025-01-16',
        completions: 1,
      })
      expect(trends.dailyCompletions[3]).toEqual({
        date: '2025-01-18',
        completions: 0,
      })

      expect(trends.bestDay).toEqual({ date: '2025-01-15', completions: 2 })
      expect(trends.mostProductiveWeekday).toBeTruthy()
      expect(trends.weeklyAverages).toBeTruthy()
    })

    it('should handle no completions', () => {
      const trends = calculateProductivityTrends(
        {},
        {},
        '2025-01-15',
        '2025-01-19'
      )

      expect(
        trends.dailyCompletions.every((day) => day.completions === 0)
      ).toBe(true)
      expect(trends.bestDay).toBeNull()
    })
  })
})
