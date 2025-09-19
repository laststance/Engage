import { Task, Category } from '../types'
import { taskRepository } from './repositories/TaskRepository'
import { categoryRepository } from './repositories/CategoryRepository'
import { DatabaseError } from './database'

export interface DefaultTaskData {
  title: string
  categoryId: string
  defaultMinutes?: number
}

export interface PresetInitializationResult {
  categoriesCreated: number
  tasksCreated: number
  suggestedTasks: Task[]
}

/**
 * Service for managing preset tasks and categories initialization
 */
export class PresetService {
  // Default categories that should be available on first launch
  private readonly defaultCategories: Category[] = [
    { id: 'business', name: '事業' },
    { id: 'life', name: '生活' },
  ]

  // Default tasks for each category
  private readonly defaultTasks: DefaultTaskData[] = [
    // Business category tasks
    {
      title: 'ネットワーキング',
      categoryId: 'business',
    },
    {
      title: 'スキル学習 (30分)',
      categoryId: 'business',
      defaultMinutes: 30,
    },
    {
      title: 'アイデア記録',
      categoryId: 'business',
    },

    // Life category tasks
    {
      title: '運動 (20分以上)',
      categoryId: 'life',
      defaultMinutes: 20,
    },
    {
      title: '読書・勉強',
      categoryId: 'life',
    },
    {
      title: '家族との時間',
      categoryId: 'life',
    },
    {
      title: '健康的な食事',
      categoryId: 'life',
    },
    {
      title: '十分な睡眠 (7時間)',
      categoryId: 'life',
      defaultMinutes: 420, // 7 hours in minutes
    },
    {
      title: '整理整頓',
      categoryId: 'life',
    },
    {
      title: '財務管理',
      categoryId: 'life',
    },
    {
      title: '趣味・リラックス',
      categoryId: 'life',
    },
  ]

  // Recommended tasks for first-time users (3 tasks as per requirements)
  private readonly recommendedTaskTitles = [
    '運動 (20分以上)', // Life - easy to achieve
    'ネットワーキング', // Business - important for growth
    '読書・勉強', // Life - personal development
  ]

  /**
   * Initialize default categories and tasks if they don't exist
   * Returns information about what was created and suggested tasks
   */
  async initializeDefaults(): Promise<PresetInitializationResult> {
    try {
      let categoriesCreated = 0
      let tasksCreated = 0

      // Check if we need to initialize (no existing data)
      const existingCategories = await categoryRepository.findAll()
      const existingTasks = await taskRepository.findAll()

      const isFirstLaunch =
        existingCategories.length === 0 && existingTasks.length === 0

      // Initialize categories if needed
      for (const category of this.defaultCategories) {
        const existing = await categoryRepository.findById(category.id)
        if (!existing) {
          await categoryRepository.create(category)
          categoriesCreated++
          console.log(`Created default category: ${category.name}`)
        }
      }

      // Initialize tasks if needed
      for (const taskData of this.defaultTasks) {
        // Check if task with same title and category already exists
        const existingTask = await this.findTaskByTitleAndCategory(
          taskData.title,
          taskData.categoryId
        )

        if (!existingTask) {
          const task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
            title: taskData.title,
            categoryId: taskData.categoryId,
            defaultMinutes: taskData.defaultMinutes,
            archived: false,
          }

          await taskRepository.create(task)
          tasksCreated++
          console.log(`Created default task: ${taskData.title}`)
        }
      }

      // Get suggested tasks for first-time users
      const suggestedTasks = await this.getSuggestedTasks()

      console.log(`Preset initialization complete:`, {
        categoriesCreated,
        tasksCreated,
        suggestedTasksCount: suggestedTasks.length,
        isFirstLaunch,
      })

      return {
        categoriesCreated,
        tasksCreated,
        suggestedTasks,
      }
    } catch (error) {
      console.error('Failed to initialize default presets:', error)
      throw new DatabaseError('Failed to initialize default presets', error)
    }
  }

  /**
   * Get 3 recommended tasks for first-time users
   */
  async getSuggestedTasks(): Promise<Task[]> {
    try {
      const allTasks = await taskRepository.findAll()
      const suggestedTasks: Task[] = []

      // Find tasks that match our recommended titles
      for (const recommendedTitle of this.recommendedTaskTitles) {
        const task = allTasks.find((t) => t.title === recommendedTitle)
        if (task) {
          suggestedTasks.push(task)
        }
      }

      // If we don't have enough recommended tasks, fill with other available tasks
      if (suggestedTasks.length < 3) {
        const remainingTasks = allTasks.filter(
          (t) => !suggestedTasks.some((st) => st.id === t.id)
        )

        // Add tasks from different categories to provide variety
        const businessTasks = remainingTasks.filter(
          (t) => t.categoryId === 'business'
        )
        const lifeTasks = remainingTasks.filter((t) => t.categoryId === 'life')

        // Alternate between categories
        let businessIndex = 0
        let lifeIndex = 0

        while (suggestedTasks.length < 3) {
          if (
            suggestedTasks.length % 2 === 0 &&
            businessIndex < businessTasks.length
          ) {
            suggestedTasks.push(businessTasks[businessIndex])
            businessIndex++
          } else if (lifeIndex < lifeTasks.length) {
            suggestedTasks.push(lifeTasks[lifeIndex])
            lifeIndex++
          } else if (businessIndex < businessTasks.length) {
            suggestedTasks.push(businessTasks[businessIndex])
            businessIndex++
          } else {
            break // No more tasks available
          }
        }
      }

      return suggestedTasks.slice(0, 3) // Ensure we return exactly 3 tasks
    } catch (error) {
      console.error('Failed to get suggested tasks:', error)
      throw new DatabaseError('Failed to get suggested tasks', error)
    }
  }

  /**
   * Check if this is the first launch (no existing data)
   */
  async isFirstLaunch(): Promise<boolean> {
    try {
      const [categories, tasks] = await Promise.all([
        categoryRepository.findAll(),
        taskRepository.findAll(),
      ])

      return categories.length === 0 && tasks.length === 0
    } catch (error) {
      console.error('Failed to check first launch status:', error)
      return false
    }
  }

  /**
   * Get all available preset tasks grouped by category
   */
  async getPresetTasksByCategory(): Promise<Record<string, Task[]>> {
    try {
      const tasks = await taskRepository.findAll()
      const categories = await categoryRepository.findAll()

      const tasksByCategory: Record<string, Task[]> = {}

      // Initialize empty arrays for all categories
      categories.forEach((category) => {
        tasksByCategory[category.id] = []
      })

      // Group tasks by category
      tasks.forEach((task) => {
        if (tasksByCategory[task.categoryId]) {
          tasksByCategory[task.categoryId].push(task)
        }
      })

      return tasksByCategory
    } catch (error) {
      console.error('Failed to get preset tasks by category:', error)
      throw new DatabaseError('Failed to get preset tasks by category', error)
    }
  }

  /**
   * Reset all preset data (useful for testing or complete reset)
   */
  async resetPresets(): Promise<void> {
    try {
      // Get all tasks and delete them
      const allTasks = await taskRepository.findAll()
      for (const task of allTasks) {
        await taskRepository.delete(task.id)
      }

      // Delete custom categories (keep default ones)
      const allCategories = await categoryRepository.findAll()
      for (const category of allCategories) {
        if (!this.defaultCategories.some((dc) => dc.id === category.id)) {
          await categoryRepository.delete(category.id)
        }
      }

      console.log('Preset data reset successfully')
    } catch (error) {
      console.error('Failed to reset presets:', error)
      throw new DatabaseError('Failed to reset presets', error)
    }
  }

  /**
   * Helper method to find a task by title and category
   */
  private async findTaskByTitleAndCategory(
    title: string,
    categoryId: string
  ): Promise<Task | null> {
    try {
      const tasks = await taskRepository.findByCategoryId(categoryId)
      return tasks.find((task) => task.title === title) || null
    } catch (error) {
      console.error('Failed to find task by title and category:', error)
      return null
    }
  }

  /**
   * Validate that all required categories exist for default tasks
   */
  async validatePresetIntegrity(): Promise<{
    isValid: boolean
    missingCategories: string[]
    orphanedTasks: Task[]
  }> {
    try {
      const [categories, tasks] = await Promise.all([
        categoryRepository.findAll(),
        taskRepository.findAll(),
      ])

      const categoryIds = new Set(categories.map((c) => c.id))
      const missingCategories: string[] = []
      const orphanedTasks: Task[] = []

      // Check for missing required categories
      for (const defaultCategory of this.defaultCategories) {
        if (!categoryIds.has(defaultCategory.id)) {
          missingCategories.push(defaultCategory.id)
        }
      }

      // Check for orphaned tasks (tasks with non-existent categories)
      for (const task of tasks) {
        if (!categoryIds.has(task.categoryId)) {
          orphanedTasks.push(task)
        }
      }

      const isValid =
        missingCategories.length === 0 && orphanedTasks.length === 0

      return {
        isValid,
        missingCategories,
        orphanedTasks,
      }
    } catch (error) {
      console.error('Failed to validate preset integrity:', error)
      return {
        isValid: false,
        missingCategories: [],
        orphanedTasks: [],
      }
    }
  }
}

// Export singleton instance
export const presetService = new PresetService()
