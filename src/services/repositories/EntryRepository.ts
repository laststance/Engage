import { Entry } from '../../types'
import { databaseService, DatabaseError } from '../database'

export class EntryRepository {
  // Basic CRUD operations
  async findByDate(date: string): Promise<Entry | null> {
    return await databaseService.getEntry(date)
  }

  async upsert(date: string, note: string): Promise<Entry> {
    return await databaseService.upsertEntry(date, note)
  }

  async delete(date: string): Promise<void> {
    return await databaseService.deleteEntry(date)
  }

  // Date range queries
  async findByDateRange(startDate: string, endDate: string): Promise<Entry[]> {
    try {
      const result = await databaseService.executeQuery<any>(
        'SELECT * FROM entries WHERE date >= ? AND date <= ? ORDER BY date DESC',
        [startDate, endDate]
      )
      return result.map(this.mapRowToEntry)
    } catch (error) {
      throw new DatabaseError('Failed to find entries by date range', error)
    }
  }

  async findRecentEntries(limit: number = 10): Promise<Entry[]> {
    try {
      const result = await databaseService.executeQuery<any>(
        'SELECT * FROM entries ORDER BY date DESC LIMIT ?',
        [limit]
      )
      return result.map(this.mapRowToEntry)
    } catch (error) {
      throw new DatabaseError('Failed to find recent entries', error)
    }
  }

  // Weekly and monthly queries
  async findEntriesForWeek(weekStartDate: string): Promise<Entry[]> {
    try {
      // Calculate week end date (6 days after start)
      const startDate = new Date(weekStartDate)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)

      const weekEndDate = endDate.toISOString().split('T')[0]

      return await this.findByDateRange(weekStartDate, weekEndDate)
    } catch (error) {
      throw new DatabaseError('Failed to find entries for week', error)
    }
  }

  async findEntriesForMonth(year: number, month: number): Promise<Entry[]> {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
      const endDate = new Date(year, month, 0).toISOString().split('T')[0] // Last day of month

      return await this.findByDateRange(startDate, endDate)
    } catch (error) {
      throw new DatabaseError('Failed to find entries for month', error)
    }
  }

  // Search and filtering
  async searchByContent(searchTerm: string): Promise<Entry[]> {
    try {
      const result = await databaseService.executeQuery<any>(
        'SELECT * FROM entries WHERE note LIKE ? ORDER BY date DESC',
        [`%${searchTerm}%`]
      )
      return result.map(this.mapRowToEntry)
    } catch (error) {
      throw new DatabaseError('Failed to search entries by content', error)
    }
  }

  async findNonEmptyEntries(): Promise<Entry[]> {
    try {
      const result = await databaseService.executeQuery<any>(
        'SELECT * FROM entries WHERE note != "" ORDER BY date DESC'
      )
      return result.map(this.mapRowToEntry)
    } catch (error) {
      throw new DatabaseError('Failed to find non-empty entries', error)
    }
  }

  // Statistics and analytics
  async getEntryCount(): Promise<number> {
    try {
      const result = await databaseService.executeQueryFirst<{ count: number }>(
        'SELECT COUNT(*) as count FROM entries'
      )
      return result?.count || 0
    } catch (error) {
      throw new DatabaseError('Failed to get entry count', error)
    }
  }

  async getNonEmptyEntryCount(): Promise<number> {
    try {
      const result = await databaseService.executeQueryFirst<{ count: number }>(
        'SELECT COUNT(*) as count FROM entries WHERE note != ""'
      )
      return result?.count || 0
    } catch (error) {
      throw new DatabaseError('Failed to get non-empty entry count', error)
    }
  }

  async getEntryCountByDateRange(
    startDate: string,
    endDate: string
  ): Promise<number> {
    try {
      const result = await databaseService.executeQueryFirst<{ count: number }>(
        'SELECT COUNT(*) as count FROM entries WHERE date >= ? AND date <= ?',
        [startDate, endDate]
      )
      return result?.count || 0
    } catch (error) {
      throw new DatabaseError('Failed to get entry count by date range', error)
    }
  }

  async getAverageEntryLength(): Promise<number> {
    try {
      const result = await databaseService.executeQueryFirst<{
        avg_length: number
      }>('SELECT AVG(LENGTH(note)) as avg_length FROM entries WHERE note != ""')
      return Math.round(result?.avg_length || 0)
    } catch (error) {
      throw new DatabaseError('Failed to get average entry length', error)
    }
  }

  // Streak calculations
  async getJournalStreak(currentDate: string): Promise<number> {
    try {
      // Get all entries with non-empty notes, ordered by date descending
      const entries = await databaseService.executeQuery<{ date: string }>(
        'SELECT date FROM entries WHERE note != "" ORDER BY date DESC'
      )

      if (entries.length === 0) return 0

      let streak = 0
      const today = new Date(currentDate)

      for (const entry of entries) {
        const entryDate = new Date(entry.date)
        const daysDiff = Math.floor(
          (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysDiff === streak) {
          streak++
        } else {
          break
        }
      }

      return streak
    } catch (error) {
      throw new DatabaseError('Failed to calculate journal streak', error)
    }
  }

  // Bulk operations
  async deleteMultiple(dates: string[]): Promise<void> {
    try {
      await databaseService.executeTransaction(
        dates.map((date) => async () => {
          await this.delete(date)
        })
      )
    } catch (error) {
      throw new DatabaseError('Failed to delete multiple entries', error)
    }
  }

  async bulkUpsert(
    entries: Array<{ date: string; note: string }>
  ): Promise<Entry[]> {
    try {
      const upsertedEntries: Entry[] = []

      await databaseService.executeTransaction(
        entries.map(({ date, note }) => async () => {
          const entry = await this.upsert(date, note)
          upsertedEntries.push(entry)
        })
      )

      return upsertedEntries
    } catch (error) {
      throw new DatabaseError('Failed to bulk upsert entries', error)
    }
  }

  // Data transformation utilities
  async getEntriesGroupedByMonth(): Promise<Record<string, Entry[]>> {
    try {
      const entries = await databaseService.executeQuery<any>(
        'SELECT * FROM entries ORDER BY date DESC'
      )

      const grouped: Record<string, Entry[]> = {}

      entries.forEach((row) => {
        const entry = this.mapRowToEntry(row)
        const monthKey = entry.date.substring(0, 7) // YYYY-MM

        if (!grouped[monthKey]) {
          grouped[monthKey] = []
        }
        grouped[monthKey].push(entry)
      })

      return grouped
    } catch (error) {
      throw new DatabaseError('Failed to group entries by month', error)
    }
  }

  async getEntriesWithWordCount(): Promise<
    Array<Entry & { wordCount: number }>
  > {
    try {
      const entries = await this.findNonEmptyEntries()

      return entries.map((entry) => ({
        ...entry,
        wordCount: this.countWords(entry.note),
      }))
    } catch (error) {
      throw new DatabaseError('Failed to get entries with word count', error)
    }
  }

  // Helper methods
  private mapRowToEntry(row: any): Entry {
    return {
      id: row.id,
      date: row.date,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }
}

// Export singleton instance
export const entryRepository = new EntryRepository()
