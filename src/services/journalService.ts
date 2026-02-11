/**
 * Journal Service - Enhanced journal entry management with validation and error handling
 */

import { Entry } from '../types'
import { entryRepository } from './repositories/EntryRepository'
import { validateJournalEntry } from '../utils/businessLogic'
import { formatDate } from '../utils/dateUtils'

export interface JournalValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface JournalSaveResult {
  success: boolean
  entry?: Entry
  errors: string[]
}

export interface JournalStats {
  totalEntries: number
  nonEmptyEntries: number
  averageLength: number
  currentStreak: number
  longestStreak: number
  entriesThisWeek: number
  entriesThisMonth: number
}

export class JournalService {
  /**
   * Validate journal entry content with enhanced checks
   */
  async validateEntry(
    content: string,
    date?: string
  ): Promise<JournalValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic validation using business logic
    const basicValidation = validateJournalEntry(content)
    errors.push(...basicValidation.errors)

    // Additional validations
    if (content.trim().length === 0) {
      warnings.push('空の日記エントリーです')
    }

    if (content.length < 10 && content.trim().length > 0) {
      warnings.push('短い日記エントリーです。もう少し詳しく書いてみませんか？')
    }

    if (content.length > 800) {
      warnings.push('長い日記エントリーです。読みやすさを考慮してください')
    }

    // Check for potentially sensitive content (basic patterns)
    const sensitivePatterns = [/パスワード/i, /password/i, /秘密/i, /secret/i]

    for (const pattern of sensitivePatterns) {
      if (pattern.test(content)) {
        warnings.push('機密情報が含まれている可能性があります')
        break
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Save journal entry with validation and error handling
   */
  async saveEntry(date: string, content: string): Promise<JournalSaveResult> {
    try {
      // Validate the entry
      const validation = await this.validateEntry(content, date)

      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
        }
      }

      // Save to repository
      const entry = await entryRepository.upsert(date, content.trim())

      return {
        success: true,
        entry,
        errors: [],
      }
    } catch (error) {
      console.error('Failed to save journal entry:', error)
      return {
        success: false,
        errors: [
          error instanceof Error
            ? error.message
            : 'Failed to save journal entry',
        ],
      }
    }
  }

  /**
   * Get journal entry for a specific date
   */
  async getEntry(date: string): Promise<Entry | null> {
    try {
      return await entryRepository.findByDate(date)
    } catch (error) {
      console.error('Failed to get journal entry:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get journal entry'
      )
    }
  }

  /**
   * Get journal entries for a date range
   */
  async getEntriesForRange(
    startDate: string,
    endDate: string
  ): Promise<Entry[]> {
    try {
      return await entryRepository.findByDateRange(startDate, endDate)
    } catch (error) {
      console.error('Failed to get journal entries for range:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get journal entries'
      )
    }
  }

  /**
   * Search journal entries by content
   */
  async searchEntries(searchTerm: string): Promise<Entry[]> {
    try {
      if (searchTerm.trim().length < 2) {
        throw new Error('検索語は2文字以上で入力してください')
      }

      return await entryRepository.searchByContent(searchTerm.trim())
    } catch (error) {
      console.error('Failed to search journal entries:', error)
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to search journal entries'
      )
    }
  }

  /**
   * Delete journal entry
   */
  async deleteEntry(date: string): Promise<void> {
    try {
      await entryRepository.delete(date)
    } catch (error) {
      console.error('Failed to delete journal entry:', error)
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to delete journal entry'
      )
    }
  }

  /**
   * Get comprehensive journal statistics
   */
  async getJournalStats(currentDate?: string): Promise<JournalStats> {
    try {
      const today = currentDate || formatDate(new Date())

      // Get basic counts
      const [totalEntries, nonEmptyEntries, averageLength, currentStreak] =
        await Promise.all([
          entryRepository.getEntryCount(),
          entryRepository.getNonEmptyEntryCount(),
          entryRepository.getAverageEntryLength(),
          entryRepository.getJournalStreak(today),
        ])

      // Calculate week range (Monday to Sunday)
      const todayDate = new Date(today)
      const dayOfWeek = todayDate.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Handle Sunday as 0

      const weekStart = new Date(todayDate)
      weekStart.setDate(todayDate.getDate() + mondayOffset)
      const weekStartStr = formatDate(weekStart)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      const weekEndStr = formatDate(weekEnd)

      // Calculate month range
      const monthStart = `${today.substring(0, 7)}-01`
      const monthEndDate = new Date(
        todayDate.getFullYear(),
        todayDate.getMonth() + 1,
        0
      )
      const monthEnd = formatDate(monthEndDate)

      // Get entries for week and month
      const [weekEntries, monthEntries] = await Promise.all([
        entryRepository.findByDateRange(weekStartStr, weekEndStr),
        entryRepository.findByDateRange(monthStart, monthEnd),
      ])

      // Calculate longest streak (simplified - could be enhanced)
      const allEntries = await entryRepository.findNonEmptyEntries()
      const longestStreak = this.calculateLongestStreak(allEntries)

      return {
        totalEntries,
        nonEmptyEntries,
        averageLength,
        currentStreak,
        longestStreak,
        entriesThisWeek: weekEntries.filter((e) => e.note.trim().length > 0)
          .length,
        entriesThisMonth: monthEntries.filter((e) => e.note.trim().length > 0)
          .length,
      }
    } catch (error) {
      console.error('Failed to get journal stats:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get journal stats'
      )
    }
  }

  /**
   * Export journal entries as JSON
   */
  async exportEntries(startDate?: string, endDate?: string): Promise<string> {
    try {
      let entries: Entry[]

      if (startDate && endDate) {
        entries = await entryRepository.findByDateRange(startDate, endDate)
      } else {
        entries = await entryRepository.findNonEmptyEntries()
      }

      const exportData = {
        exportDate: new Date().toISOString(),
        dateRange: startDate && endDate ? { startDate, endDate } : 'all',
        totalEntries: entries.length,
        entries: entries.map((entry) => ({
          date: entry.date,
          note: entry.note,
          createdAt: new Date(entry.createdAt).toISOString(),
          updatedAt: new Date(entry.updatedAt).toISOString(),
        })),
      }

      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('Failed to export journal entries:', error)
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to export journal entries'
      )
    }
  }

  /**
   * Import journal entries from JSON
   */
  async importEntries(
    jsonData: string
  ): Promise<{ imported: number; errors: string[] }> {
    try {
      const data = JSON.parse(jsonData)

      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error('Invalid import data format')
      }

      const errors: string[] = []
      let imported = 0

      for (const entryData of data.entries) {
        try {
          if (!entryData.date || !entryData.note) {
            errors.push(`Invalid entry data: missing date or note`)
            continue
          }

          const validation = await this.validateEntry(
            entryData.note,
            entryData.date
          )
          if (!validation.isValid) {
            errors.push(
              `Entry ${entryData.date}: ${validation.errors.join(', ')}`
            )
            continue
          }

          await entryRepository.upsert(entryData.date, entryData.note)
          imported++
        } catch (error) {
          errors.push(
            `Entry ${entryData.date}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          )
        }
      }

      return { imported, errors }
    } catch (error) {
      console.error('Failed to import journal entries:', error)
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to import journal entries'
      )
    }
  }

  /**
   * Calculate longest streak from entries
   */
  private calculateLongestStreak(entries: Entry[]): number {
    if (entries.length === 0) return 0

    // Sort entries by date
    const sortedEntries = entries
      .filter((e) => e.note.trim().length > 0)
      .sort((a, b) => a.date.localeCompare(b.date))

    let longestStreak = 1
    let currentStreak = 1

    for (let i = 1; i < sortedEntries.length; i++) {
      const prevDate = new Date(sortedEntries[i - 1].date)
      const currDate = new Date(sortedEntries[i].date)

      const daysDiff = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff === 1) {
        currentStreak++
        longestStreak = Math.max(longestStreak, currentStreak)
      } else {
        currentStreak = 1
      }
    }

    return longestStreak
  }

  /**
   * Get suggested prompts for journal writing
   */
  getSuggestedPrompts(hasCompletions: boolean = false): string[] {
    const basePrompts = [
      '今日はどんな気持ちでしたか？',
      '今日学んだことは何ですか？',
      '明日に向けて何を準備しますか？',
      '今日の一番の出来事は？',
      '感謝したいことはありますか？',
    ]

    const completionPrompts = [
      '達成したタスクについてどう感じますか？',
      'タスクを完了して得られたものは？',
      '今日の成果を振り返ってみましょう',
      'うまくいったことと改善点は？',
      '今日の頑張りを褒めてあげましょう',
    ]

    return hasCompletions ? completionPrompts : basePrompts
  }
}

// Export singleton instance
export const journalService = new JournalService()
