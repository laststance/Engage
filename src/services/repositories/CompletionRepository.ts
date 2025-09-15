import { Completion, Task } from '../../types'
import { databaseService, DatabaseError } from '../database'

export interface CompletionStats {
  totalCompletions: number
  completionRate: number
  activeDays: number
  dailyAverage: number
  streakDays: number
  categoryBreakdown: Record<string, { completed: number; total: number }>
}

export interface DailyCompletionData {
  date: string
  completions: Completion[]
  totalTasks: number
  completedTasks: number
  completionRate: number
}

export class CompletionRepository {
  // Basic CRUD operations
  async findByDate(date: string): Promise<Completion[]> {
    return await databaseService.getCompletions(date)
  }

  async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Completion[]> {
    return await databaseService.getCompletionsByDateRange(startDate, endDate)
  }

  async create(
    completion: Omit<Completion, 'id' | 'createdAt'>
  ): Promise<Completion> {
    return await databaseService.createCompletion(completion)
  }

  async toggle(
    date: string,
    taskId: string,
    minutes?: number
  ): Promise<boolean> {
    return await databaseService.toggleCompletion(date, taskId, minutes)
  }

  async delete(date: string, taskId: string): Promise<void> {
    return await databaseService.deleteCompletion(date, taskId)
  }

  // Task-specific queries
  async findByTaskId(taskId: string): Promise<Completion[]> {
    try {
      const result = await databaseService.executeQuery<any>(
        'SELECT * FROM completions WHERE task_id = ? ORDER BY date DESC',
        [taskId]
      )
      return result.map(this.mapRowToCompletion)
    } catch (error) {
      throw new DatabaseError('Failed to find completions by task ID', error)
    }
  }

  async findByTaskIdAndDateRange(
    taskId: string,
    startDate: string,
    endDate: string
  ): Promise<Completion[]> {
    try {
      const result = await databaseService.executeQuery<any>(
        'SELECT * FROM completions WHERE task_id = ? AND date >= ? AND date <= ? ORDER BY date DESC',
        [taskId, startDate, endDate]
      )
      return result.map(this.mapRowToCompletion)
    } catch (error) {
      throw new DatabaseError(
        'Failed to find completions by task ID and date range',
        error
      )
    }
  }

  // Weekly and monthly queries
  async findCompletionsForWeek(weekStartDate: string): Promise<Completion[]> {
    try {
      const startDate = new Date(weekStartDate)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)

      const weekEndDate = endDate.toISOString().split('T')[0]

      return await this.findByDateRange(weekStartDate, weekEndDate)
    } catch (error) {
      throw new DatabaseError('Failed to find completions for week', error)
    }
  }

  async findCompletionsForMonth(
    year: number,
    month: number
  ): Promise<Completion[]> {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]

      return await this.findByDateRange(startDate, endDate)
    } catch (error) {
      throw new DatabaseError('Failed to find completions for month', error)
    }
  }

  // Statistics and analytics
  async getCompletionStats(
    startDate: string,
    endDate: string
  ): Promise<CompletionStats> {
    try {
      const [completions, tasks] = await Promise.all([
        this.findByDateRange(startDate, endDate),
        databaseService.getAllTasks(),
      ])

      // Calculate basic stats
      const totalCompletions = completions.length
      const uniqueDates = new Set(completions.map((c) => c.date))
      const activeDays = uniqueDates.size

      // Calculate date range
      const start = new Date(startDate)
      const end = new Date(endDate)
      const totalDays =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

      const completionRate = totalDays > 0 ? (activeDays / totalDays) * 100 : 0
      const dailyAverage = activeDays > 0 ? totalCompletions / activeDays : 0

      // Calculate category breakdown
      const categoryBreakdown = await this.getCategoryBreakdown(
        startDate,
        endDate,
        tasks
      )

      // Calculate streak
      const streakDays = await this.calculateStreak(endDate)

      return {
        totalCompletions,
        completionRate: Math.round(completionRate * 100) / 100,
        activeDays,
        dailyAverage: Math.round(dailyAverage * 100) / 100,
        streakDays,
        categoryBreakdown,
      }
    } catch (error) {
      throw new DatabaseError('Failed to get completion stats', error)
    }
  }

  async getDailyCompletionData(
    startDate: string,
    endDate: string
  ): Promise<DailyCompletionData[]> {
    try {
      const [completions, tasks] = await Promise.all([
        this.findByDateRange(startDate, endDate),
        databaseService.getAllTasks(),
      ])

      // Group completions by date
      const completionsByDate = new Map<string, Completion[]>()
      completions.forEach((completion) => {
        const date = completion.date
        if (!completionsByDate.has(date)) {
          completionsByDate.set(date, [])
        }
        completionsByDate.get(date)!.push(completion)
      })

      // Generate daily data
      const dailyData: DailyCompletionData[] = []
      const start = new Date(startDate)
      const end = new Date(endDate)

      for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        const dateStr = date.toISOString().split('T')[0]
        const dayCompletions = completionsByDate.get(dateStr) || []

        dailyData.push({
          date: dateStr,
          completions: dayCompletions,
          totalTasks: tasks.length,
          completedTasks: dayCompletions.length,
          completionRate:
            tasks.length > 0 ? (dayCompletions.length / tasks.length) * 100 : 0,
        })
      }

      return dailyData
    } catch (error) {
      throw new DatabaseError('Failed to get daily completion data', error)
    }
  }

  async getCategoryBreakdown(
    startDate: string,
    endDate: string,
    tasks?: Task[]
  ): Promise<CompletionStats['categoryBreakdown']> {
    try {
      if (!tasks) {
        tasks = await databaseService.getAllTasks()
      }

      const completions = await this.findByDateRange(startDate, endDate)

      // Create task lookup
      const taskLookup = new Map(tasks.map((task) => [task.id, task]))

      // Count completions by category
      const categoryCompletions: Record<string, number> = {}
      const categoryTotals: Record<string, number> = {}

      // Count total tasks by category
      tasks.forEach((task) => {
        categoryTotals[task.categoryId] =
          (categoryTotals[task.categoryId] || 0) + 1
      })

      // Initialize completion counts
      Object.keys(categoryTotals).forEach((categoryId) => {
        categoryCompletions[categoryId] = 0
      })

      // Count completions by category
      completions.forEach((completion) => {
        const task = taskLookup.get(completion.taskId)
        if (task) {
          categoryCompletions[task.categoryId] =
            (categoryCompletions[task.categoryId] || 0) + 1
        }
      })

      // Build result
      const result: Record<string, { completed: number; total: number }> = {}
      Object.keys(categoryTotals).forEach((categoryId) => {
        result[categoryId] = {
          completed: categoryCompletions[categoryId] || 0,
          total: categoryTotals[categoryId] || 0,
        }
      })

      return result
    } catch (error) {
      throw new DatabaseError('Failed to get category breakdown', error)
    }
  }

  // Streak calculations
  async calculateStreak(currentDate: string): Promise<number> {
    try {
      // Get all completion dates, ordered by date descending
      const result = await databaseService.executeQuery<{ date: string }>(
        'SELECT DISTINCT date FROM completions ORDER BY date DESC'
      )

      if (result.length === 0) return 0

      let streak = 0
      const today = new Date(currentDate)

      for (const row of result) {
        const completionDate = new Date(row.date)
        const daysDiff = Math.floor(
          (today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysDiff === streak) {
          streak++
        } else {
          break
        }
      }

      return streak
    } catch (error) {
      throw new DatabaseError('Failed to calculate streak', error)
    }
  }

  async calculateTaskStreak(
    taskId: string,
    currentDate: string
  ): Promise<number> {
    try {
      const completions = await this.findByTaskId(taskId)

      if (completions.length === 0) return 0

      let streak = 0
      const today = new Date(currentDate)

      for (const completion of completions) {
        const completionDate = new Date(completion.date)
        const daysDiff = Math.floor(
          (today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysDiff === streak) {
          streak++
        } else {
          break
        }
      }

      return streak
    } catch (error) {
      throw new DatabaseError('Failed to calculate task streak', error)
    }
  }

  // Heatmap data for calendar visualization
  async getHeatmapData(
    year: number,
    month?: number
  ): Promise<Record<string, number>> {
    try {
      let startDate: string
      let endDate: string

      if (month !== undefined) {
        // Get data for specific month
        startDate = `${year}-${month.toString().padStart(2, '0')}-01`
        endDate = new Date(year, month, 0).toISOString().split('T')[0]
      } else {
        // Get data for entire year
        startDate = `${year}-01-01`
        endDate = `${year}-12-31`
      }

      const result = await databaseService.executeQuery<{
        date: string
        count: number
      }>(
        'SELECT date, COUNT(*) as count FROM completions WHERE date >= ? AND date <= ? GROUP BY date',
        [startDate, endDate]
      )

      const heatmapData: Record<string, number> = {}
      result.forEach((row) => {
        heatmapData[row.date] = row.count
      })

      return heatmapData
    } catch (error) {
      throw new DatabaseError('Failed to get heatmap data', error)
    }
  }

  // Time tracking analytics
  async getTotalMinutesSpent(
    startDate: string,
    endDate: string
  ): Promise<number> {
    try {
      const result = await databaseService.executeQueryFirst<{
        total_minutes: number
      }>(
        'SELECT SUM(minutes) as total_minutes FROM completions WHERE date >= ? AND date <= ? AND minutes IS NOT NULL',
        [startDate, endDate]
      )
      return result?.total_minutes || 0
    } catch (error) {
      throw new DatabaseError('Failed to get total minutes spent', error)
    }
  }

  async getAverageMinutesPerCompletion(
    startDate: string,
    endDate: string
  ): Promise<number> {
    try {
      const result = await databaseService.executeQueryFirst<{
        avg_minutes: number
      }>(
        'SELECT AVG(minutes) as avg_minutes FROM completions WHERE date >= ? AND date <= ? AND minutes IS NOT NULL',
        [startDate, endDate]
      )
      return Math.round(result?.avg_minutes || 0)
    } catch (error) {
      throw new DatabaseError(
        'Failed to get average minutes per completion',
        error
      )
    }
  }

  // Bulk operations
  async createMultiple(
    completions: Array<Omit<Completion, 'id' | 'createdAt'>>
  ): Promise<Completion[]> {
    try {
      const createdCompletions: Completion[] = []

      await databaseService.executeTransaction(
        completions.map((completion) => async () => {
          const created = await this.create(completion)
          createdCompletions.push(created)
        })
      )

      return createdCompletions
    } catch (error) {
      throw new DatabaseError('Failed to create multiple completions', error)
    }
  }

  async deleteByDateRange(startDate: string, endDate: string): Promise<void> {
    try {
      await databaseService.executeUpdate(
        'DELETE FROM completions WHERE date >= ? AND date <= ?',
        [startDate, endDate]
      )
    } catch (error) {
      throw new DatabaseError(
        'Failed to delete completions by date range',
        error
      )
    }
  }

  // Helper methods
  private mapRowToCompletion(row: any): Completion {
    return {
      id: row.id,
      date: row.date,
      taskId: row.task_id,
      minutes: row.minutes,
      createdAt: row.created_at,
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }
}

// Export singleton instance
export const completionRepository = new CompletionRepository()
