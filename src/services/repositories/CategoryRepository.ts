import { Category } from '../../types'
import { databaseService, DatabaseError } from '../database'

export class CategoryRepository {
  // Basic CRUD operations
  async findAll(): Promise<Category[]> {
    return await databaseService.getAllCategories()
  }

  async findById(id: string): Promise<Category | null> {
    return await databaseService.getCategoryById(id)
  }

  async create(
    category: Omit<Category, 'id'> & { id?: string }
  ): Promise<Category> {
    return await databaseService.createCategory(category)
  }

  async update(
    id: string,
    updates: Partial<Omit<Category, 'id'>>
  ): Promise<Category> {
    return await databaseService.updateCategory(id, updates)
  }

  async delete(id: string): Promise<void> {
    return await databaseService.deleteCategory(id)
  }

  // Utility methods
  async findByName(name: string): Promise<Category | null> {
    try {
      const result = await databaseService.executeQueryFirst<any>(
        'SELECT * FROM categories WHERE name = ?',
        [name]
      )
      return result ? this.mapRowToCategory(result) : null
    } catch (error) {
      throw new DatabaseError('Failed to find category by name', error)
    }
  }

  async searchByName(searchTerm: string): Promise<Category[]> {
    try {
      const result = await databaseService.executeQuery<any>(
        'SELECT * FROM categories WHERE name LIKE ? ORDER BY name ASC',
        [`%${searchTerm}%`]
      )
      return result.map(this.mapRowToCategory)
    } catch (error) {
      throw new DatabaseError('Failed to search categories by name', error)
    }
  }

  // Statistics
  async getCategoryCount(): Promise<number> {
    try {
      const result = await databaseService.executeQueryFirst<{ count: number }>(
        'SELECT COUNT(*) as count FROM categories'
      )
      return result?.count || 0
    } catch (error) {
      throw new DatabaseError('Failed to get category count', error)
    }
  }

  async getCategoriesWithTaskCounts(): Promise<
    (Category & { taskCount: number })[]
  > {
    try {
      const result = await databaseService.executeQuery<any>(
        `SELECT c.*, COUNT(t.id) as task_count 
         FROM categories c 
         LEFT JOIN tasks t ON c.id = t.category_id AND t.archived = 0 
         GROUP BY c.id, c.name 
         ORDER BY c.name ASC`
      )

      return result.map((row) => ({
        ...this.mapRowToCategory(row),
        taskCount: row.task_count || 0,
      }))
    } catch (error) {
      throw new DatabaseError(
        'Failed to get categories with task counts',
        error
      )
    }
  }

  // Bulk operations
  async createMultiple(
    categories: (Omit<Category, 'id'> & { id?: string })[]
  ): Promise<Category[]> {
    try {
      const createdCategories: Category[] = []

      await databaseService.executeTransaction(
        categories.map((category) => async () => {
          const created = await this.create(category)
          createdCategories.push(created)
        })
      )

      return createdCategories
    } catch (error) {
      throw new DatabaseError('Failed to create multiple categories', error)
    }
  }

  // Default category seeding
  async seedDefaultCategories(): Promise<void> {
    try {
      const existingCount = await this.getCategoryCount()
      if (existingCount > 0) {
        return // Already seeded
      }

      const defaultCategories: Category[] = [
        { id: 'business', name: '事業' },
        { id: 'life', name: '生活' },
      ]

      await this.createMultiple(defaultCategories)
      console.log('Default categories seeded successfully')
    } catch (error) {
      throw new DatabaseError('Failed to seed default categories', error)
    }
  }

  // Validation
  async validateCategoryExists(id: string): Promise<boolean> {
    try {
      const category = await this.findById(id)
      return category !== null
    } catch (error) {
      return false
    }
  }

  async canDeleteCategory(id: string): Promise<boolean> {
    try {
      const result = await databaseService.executeQueryFirst<{ count: number }>(
        'SELECT COUNT(*) as count FROM tasks WHERE category_id = ?',
        [id]
      )
      return (result?.count || 0) === 0
    } catch (error) {
      return false
    }
  }

  // Helper method to map database rows to Category objects
  private mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
    }
  }
}

// Export singleton instance
export const categoryRepository = new CategoryRepository()
