import { Task, Category } from '../../types'
import { databaseService, DatabaseError } from '../database'

export class TaskRepository {
  // Basic CRUD operations
  async findAll(): Promise<Task[]> {
    return await databaseService.getAllTasks()
  }

  async findById(id: string): Promise<Task | null> {
    return await databaseService.getTaskById(id)
  }

  async create(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Task> {
    return await databaseService.createTask(task)
  }

  async update(
    id: string,
    updates: Partial<Omit<Task, 'id' | 'createdAt'>>
  ): Promise<Task> {
    return await databaseService.updateTask(id, updates)
  }

  async delete(id: string): Promise<void> {
    return await databaseService.deleteTask(id)
  }

  async archive(id: string): Promise<void> {
    return await databaseService.archiveTask(id)
  }

  // Category-specific queries
  async findByCategoryId(categoryId: string): Promise<Task[]> {
    try {
      const result = await databaseService.executeQuery<any>(
        'SELECT * FROM tasks WHERE category_id = ? AND archived = 0 ORDER BY created_at DESC',
        [categoryId]
      )
      return result.map(this.mapRowToTask)
    } catch (error) {
      throw new DatabaseError('Failed to find tasks by category', error)
    }
  }

  async findActiveTasksByCategory(): Promise<Record<string, Task[]>> {
    try {
      const categories = await databaseService.getAllCategories()
      const tasksByCategory: Record<string, Task[]> = {}

      for (const category of categories) {
        tasksByCategory[category.id] = await this.findByCategoryId(category.id)
      }

      return tasksByCategory
    } catch (error) {
      throw new DatabaseError('Failed to find active tasks by category', error)
    }
  }

  async findTasksWithCategories(): Promise<
    (Task & { categoryName: string })[]
  > {
    try {
      return await databaseService.getTasksWithCategories()
    } catch (error) {
      throw new DatabaseError('Failed to find tasks with categories', error)
    }
  }

  // Search and filtering
  async searchByTitle(searchTerm: string): Promise<Task[]> {
    try {
      const result = await databaseService.executeQuery<any>(
        'SELECT * FROM tasks WHERE title LIKE ? AND archived = 0 ORDER BY created_at DESC',
        [`%${searchTerm}%`]
      )
      return result.map(this.mapRowToTask)
    } catch (error) {
      throw new DatabaseError('Failed to search tasks by title', error)
    }
  }

  async findArchivedTasks(): Promise<Task[]> {
    try {
      const result = await databaseService.executeQuery<any>(
        'SELECT * FROM tasks WHERE archived = 1 ORDER BY updated_at DESC'
      )
      return result.map(this.mapRowToTask)
    } catch (error) {
      throw new DatabaseError('Failed to find archived tasks', error)
    }
  }

  // Statistics and analytics
  async getTaskCount(): Promise<number> {
    try {
      const result = await databaseService.executeQueryFirst<{ count: number }>(
        'SELECT COUNT(*) as count FROM tasks WHERE archived = 0'
      )
      return result?.count || 0
    } catch (error) {
      throw new DatabaseError('Failed to get task count', error)
    }
  }

  async getTaskCountByCategory(): Promise<Record<string, number>> {
    try {
      const result = await databaseService.executeQuery<{
        category_id: string
        count: number
      }>(
        'SELECT category_id, COUNT(*) as count FROM tasks WHERE archived = 0 GROUP BY category_id'
      )

      const counts: Record<string, number> = {}
      result.forEach((row) => {
        counts[row.category_id] = row.count
      })

      return counts
    } catch (error) {
      throw new DatabaseError('Failed to get task count by category', error)
    }
  }

  // Bulk operations
  async createMultiple(
    tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<Task[]> {
    try {
      const createdTasks: Task[] = []

      await databaseService.executeTransaction(
        tasks.map((task) => async () => {
          const created = await this.create(task)
          createdTasks.push(created)
        })
      )

      return createdTasks
    } catch (error) {
      throw new DatabaseError('Failed to create multiple tasks', error)
    }
  }

  async archiveMultiple(ids: string[]): Promise<void> {
    try {
      await databaseService.executeTransaction(
        ids.map((id) => async () => {
          await this.archive(id)
        })
      )
    } catch (error) {
      throw new DatabaseError('Failed to archive multiple tasks', error)
    }
  }

  // Default task seeding
  async seedDefaultTasks(): Promise<void> {
    try {
      const existingCount = await this.getTaskCount()
      if (existingCount > 0) {
        return // Already seeded
      }

      const defaultTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] =
        [
          // Business tasks
          {
            title: 'ネットワーキング',
            categoryId: 'business',
            archived: false,
          },
          {
            title: 'スキル学習 (30分)',
            categoryId: 'business',
            defaultMinutes: 30,
            archived: false,
          },
          { title: 'アイデア記録', categoryId: 'business', archived: false },

          // Life tasks
          {
            title: '運動 (20分以上)',
            categoryId: 'life',
            defaultMinutes: 20,
            archived: false,
          },
          { title: '読書・勉強', categoryId: 'life', archived: false },
          { title: '家族との時間', categoryId: 'life', archived: false },
          { title: '健康的な食事', categoryId: 'life', archived: false },
          {
            title: '十分な睡眠 (7時間)',
            categoryId: 'life',
            defaultMinutes: 420,
            archived: false,
          },
          { title: '整理整頓', categoryId: 'life', archived: false },
          { title: '財務管理', categoryId: 'life', archived: false },
          { title: '趣味・リラックス', categoryId: 'life', archived: false },
        ]

      await this.createMultiple(defaultTasks)
      console.log('Default tasks seeded successfully')
    } catch (error) {
      throw new DatabaseError('Failed to seed default tasks', error)
    }
  }

  // Helper method to map database rows to Task objects
  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      categoryId: row.category_id,
      defaultMinutes: row.default_minutes,
      archived: Boolean(row.archived),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}

// Export singleton instance
export const taskRepository = new TaskRepository()
