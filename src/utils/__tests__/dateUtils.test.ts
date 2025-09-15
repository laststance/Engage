import {
  formatDate,
  parseDate,
  getCurrentDate,
  getWeekStartDate,
  getWeekEndDate,
  getMonthStartDate,
  getMonthEndDate,
  getDaysInRange,
  isToday,
  isYesterday,
  daysBetween,
} from '../dateUtils'

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-01-15T10:30:00Z')
      expect(formatDate(date)).toBe('2025-01-15')
    })
  })

  describe('parseDate', () => {
    it('should parse date string correctly', () => {
      const date = parseDate('2025-01-15')
      expect(date.getFullYear()).toBe(2025)
      expect(date.getMonth()).toBe(0) // January is 0
      expect(date.getDate()).toBe(15)
    })
  })

  describe('getCurrentDate', () => {
    it('should return current date in YYYY-MM-DD format', () => {
      const currentDate = getCurrentDate()
      expect(currentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('getWeekStartDate', () => {
    it('should return Sunday as week start', () => {
      const wednesday = new Date('2025-01-15') // Wednesday
      const weekStart = getWeekStartDate(wednesday)
      expect(weekStart).toBe('2025-01-12') // Previous Sunday
    })

    it('should return same date if already Sunday', () => {
      const sunday = new Date('2025-01-12') // Sunday
      const weekStart = getWeekStartDate(sunday)
      expect(weekStart).toBe('2025-01-12')
    })
  })

  describe('getWeekEndDate', () => {
    it('should return Saturday as week end', () => {
      const wednesday = new Date('2025-01-15') // Wednesday
      const weekEnd = getWeekEndDate(wednesday)
      expect(weekEnd).toBe('2025-01-18') // Following Saturday
    })

    it('should return same date if already Saturday', () => {
      const saturday = new Date('2025-01-18') // Saturday
      const weekEnd = getWeekEndDate(saturday)
      expect(weekEnd).toBe('2025-01-18')
    })
  })

  describe('getMonthStartDate', () => {
    it('should return first day of month', () => {
      const date = new Date('2025-01-15')
      const monthStart = getMonthStartDate(date)
      expect(monthStart).toBe('2025-01-01')
    })
  })

  describe('getMonthEndDate', () => {
    it('should return last day of month', () => {
      const date = new Date('2025-01-15')
      const monthEnd = getMonthEndDate(date)
      expect(monthEnd).toBe('2025-01-31')
    })

    it('should handle February correctly', () => {
      const date = new Date('2025-02-15')
      const monthEnd = getMonthEndDate(date)
      expect(monthEnd).toBe('2025-02-28') // 2025 is not a leap year
    })

    it('should handle leap year February', () => {
      const date = new Date('2024-02-15')
      const monthEnd = getMonthEndDate(date)
      expect(monthEnd).toBe('2024-02-29') // 2024 is a leap year
    })
  })

  describe('getDaysInRange', () => {
    it('should return all days in range', () => {
      const days = getDaysInRange('2025-01-15', '2025-01-17')
      expect(days).toEqual(['2025-01-15', '2025-01-16', '2025-01-17'])
    })

    it('should return single day for same start and end', () => {
      const days = getDaysInRange('2025-01-15', '2025-01-15')
      expect(days).toEqual(['2025-01-15'])
    })

    it('should handle month boundary', () => {
      const days = getDaysInRange('2025-01-30', '2025-02-02')
      expect(days).toEqual([
        '2025-01-30',
        '2025-01-31',
        '2025-02-01',
        '2025-02-02',
      ])
    })
  })

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = getCurrentDate()
      expect(isToday(today)).toBe(true)
    })

    it('should return false for other dates', () => {
      expect(isToday('2020-01-01')).toBe(false)
    })
  })

  describe('isYesterday', () => {
    it('should return true for yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = formatDate(yesterday)
      expect(isYesterday(yesterdayStr)).toBe(true)
    })

    it('should return false for other dates', () => {
      expect(isYesterday('2020-01-01')).toBe(false)
    })
  })

  describe('daysBetween', () => {
    it('should calculate days between dates correctly', () => {
      const days = daysBetween('2025-01-15', '2025-01-18')
      expect(days).toBe(3)
    })

    it('should return 0 for same date', () => {
      const days = daysBetween('2025-01-15', '2025-01-15')
      expect(days).toBe(0)
    })

    it('should handle reverse order', () => {
      const days = daysBetween('2025-01-18', '2025-01-15')
      expect(days).toBe(3)
    })
  })
})
