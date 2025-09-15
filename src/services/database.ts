import * as SQLite from 'expo-sqlite'
import { Task, Entry, Completion, Category } from '../types'

// Database version for migration management
const DATABASE_VERSION = 2

// Migration interface
interface Migration {
  version: number
  up: string[]
  down?: string[]
}

// Database error classes
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class MigrationError extends Error {
  constructor(message: string, public version?: number) {
    super(message)
    this.name = 'MigrationError'
  }
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null
  private readonly dbName = 'engage.db'

  // Migration definitions
  private migrations: Migration[] = [
    {
      version: 1,
      up: [
        // Tasks table (preset and custom tasks) - old version
        `CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT CHECK(category IN ('business', 'life')) NOT NULL,
          default_minutes INTEGER,
          archived INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )`,

        // Daily journal entries
        `CREATE TABLE IF NOT EXISTS entries (
          id TEXT PRIMARY KEY,
          date TEXT UNIQUE NOT NULL,
          note TEXT NOT NULL DEFAULT '',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )`,

        // Task completions
        `CREATE TABLE IF NOT EXISTS completions (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          task_id TEXT NOT NULL,
          minutes INTEGER,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
          UNIQUE(date, task_id)
        )`,

        // App settings
        `CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )`,

        // Schema version tracking
        `CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          applied_at INTEGER NOT NULL
        )`,

        // Performance indexes
        `CREATE INDEX IF NOT EXISTS idx_completions_date ON completions(date)`,
        `CREATE INDEX IF NOT EXISTS idx_completions_task_id ON completions(task_id)`,
        `CREATE INDEX IF NOT EXISTS idx_completions_date_task ON completions(date, task_id)`,
        `CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date)`,
        `CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category)`,
        `CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(archived)`,
        `CREATE INDEX IF NOT EXISTS idx_tasks_category_archived ON tasks(category, archived)`,
      ],
    },
    {
      version: 2,
      up: [
        // Create categories table
        `CREATE TABLE categories (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE NOT NULL
        )`,

        // Insert default categories
        `INSERT INTO categories (id, name) VALUES ('business', '事業')`,
        `INSERT INTO categories (id, name) VALUES ('life', '生活')`,

        // Create new tasks table with category_id
        `CREATE TABLE tasks_new (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          category_id TEXT NOT NULL,
          default_minutes INTEGER,
          archived INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (category_id) REFERENCES categories(id)
        )`,

        // Migrate existing tasks data
        `INSERT INTO tasks_new (id, title, category_id, default_minutes, archived, created_at, updated_at)
         SELECT id, title, category, default_minutes, archived, created_at, updated_at FROM tasks`,

        // Drop old tasks table
        `DROP TABLE tasks`,

        // Rename new table to tasks
        `ALTER TABLE tasks_new RENAME TO tasks`,

        // Create indexes for new structure
        `CREATE INDEX idx_tasks_category_id ON tasks(category_id)`,
        `CREATE INDEX idx_tasks_archived ON tasks(archived)`,
        `CREATE INDEX idx_tasks_category_id_archived ON tasks(category_id, archived)`,
      ],
    },
  ]

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(this.dbName)
      await this.runMigrations()
      console.log('Database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database:', error)
      throw new DatabaseError('Failed to initialize database', error)
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new DatabaseError('Database not initialized')

    try {
      // Create schema_migrations table if it doesn't exist
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          applied_at INTEGER NOT NULL
        )
      `)

      // Get current database version
      const currentVersion = await this.getCurrentVersion()
      console.log(`Current database version: ${currentVersion}`)

      // Apply pending migrations
      for (const migration of this.migrations) {
        if (migration.version > currentVersion) {
          console.log(`Applying migration ${migration.version}...`)
          await this.applyMigration(migration)
        }
      }

      console.log(
        `Database migrations completed. Current version: ${DATABASE_VERSION}`
      )
    } catch (error) {
      console.error('Migration failed:', error)
      throw new MigrationError('Failed to run migrations', undefined)
    }
  }

  private async getCurrentVersion(): Promise<number> {
    if (!this.db) throw new DatabaseError('Database not initialized')

    try {
      const result = (await this.db.getFirstAsync(
        'SELECT MAX(version) as version FROM schema_migrations'
      )) as { version: number | null } | null

      return result?.version ?? 0
    } catch (error) {
      // If schema_migrations table doesn't exist, return 0
      return 0
    }
  }

  private async applyMigration(migration: Migration): Promise<void> {
    if (!this.db) throw new DatabaseError('Database not initialized')

    try {
      // Start transaction
      await this.db.execAsync('BEGIN TRANSACTION')

      // Execute migration statements
      for (const statement of migration.up) {
        await this.db.execAsync(statement)
      }

      // Record migration as applied
      await this.db.runAsync(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
        [migration.version, Date.now()]
      )

      // Commit transaction
      await this.db.execAsync('COMMIT')

      console.log(`Migration ${migration.version} applied successfully`)
    } catch (error) {
      // Rollback on error
      await this.db.execAsync('ROLLBACK')
      throw new MigrationError(
        `Failed to apply migration ${migration.version}`,
        migration.version
      )
    }
  }

  // Database utility methods
  async executeQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
    if (!this.db) throw new DatabaseError('Database not initialized')

    try {
      const result = params
        ? await this.db.getAllAsync(query, params)
        : await this.db.getAllAsync(query)
      return result as T[]
    } catch (error) {
      console.error('Query execution failed:', query, params, error)
      throw new DatabaseError('Failed to execute query', error)
    }
  }

  async executeQueryFirst<T = any>(
    query: string,
    params?: any[]
  ): Promise<T | null> {
    if (!this.db) throw new DatabaseError('Database not initialized')

    try {
      const result = params
        ? await this.db.getFirstAsync(query, params)
        : await this.db.getFirstAsync(query)
      return (result as T) || null
    } catch (error) {
      console.error('Query execution failed:', query, params, error)
      throw new DatabaseError('Failed to execute query', error)
    }
  }

  async executeUpdate(
    query: string,
    params?: any[]
  ): Promise<SQLite.SQLiteRunResult> {
    if (!this.db) throw new DatabaseError('Database not initialized')

    try {
      const result = params
        ? await this.db.runAsync(query, params)
        : await this.db.runAsync(query)
      return result
    } catch (error) {
      console.error('Update execution failed:', query, params, error)
      throw new DatabaseError('Failed to execute update', error)
    }
  }

  async executeTransaction(operations: (() => Promise<void>)[]): Promise<void> {
    if (!this.db) throw new DatabaseError('Database not initialized')

    try {
      await this.db.execAsync('BEGIN TRANSACTION')

      for (const operation of operations) {
        await operation()
      }

      await this.db.execAsync('COMMIT')
    } catch (error) {
      await this.db.execAsync('ROLLBACK')
      console.error('Transaction failed:', error)
      throw new DatabaseError('Transaction failed', error)
    }
  }

  // Data validation methods
  private validateTask(task: Partial<Task>): void {
    if (!task.title || task.title.trim().length === 0) {
      throw new DatabaseError('Task title is required')
    }
    if (!task.categoryId || task.categoryId.trim().length === 0) {
      throw new DatabaseError('Task category ID is required')
    }
    if (task.defaultMinutes !== undefined && task.defaultMinutes < 0) {
      throw new DatabaseError('Default minutes must be non-negative')
    }
  }

  private validateCategory(category: Partial<Category>): void {
    if (!category.id || category.id.trim().length === 0) {
      throw new DatabaseError('Category ID is required')
    }
    if (!category.name || category.name.trim().length === 0) {
      throw new DatabaseError('Category name is required')
    }
  }

  private validateEntry(entry: Partial<Entry>): void {
    if (!entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
      throw new DatabaseError('Entry date must be in YYYY-MM-DD format')
    }
    if (entry.note === undefined) {
      throw new DatabaseError('Entry note is required')
    }
  }

  private validateCompletion(completion: Partial<Completion>): void {
    if (!completion.date || !/^\d{4}-\d{2}-\d{2}$/.test(completion.date)) {
      throw new DatabaseError('Completion date must be in YYYY-MM-DD format')
    }
    if (!completion.taskId || completion.taskId.trim().length === 0) {
      throw new DatabaseError('Completion task ID is required')
    }
    if (completion.minutes !== undefined && completion.minutes < 0) {
      throw new DatabaseError('Completion minutes must be non-negative')
    }
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    try {
      const result = await this.executeQuery<any>(
        'SELECT * FROM categories ORDER BY name ASC'
      )
      return result.map(this.mapRowToCategory)
    } catch (error) {
      throw new DatabaseError('Failed to get all categories', error)
    }
  }

  async getCategoryById(id: string): Promise<Category | null> {
    try {
      this.validateCategoryId(id)
      const result = await this.executeQueryFirst<any>(
        'SELECT * FROM categories WHERE id = ?',
        [id]
      )
      return result ? this.mapRowToCategory(result) : null
    } catch (error) {
      throw new DatabaseError('Failed to get category by ID', error)
    }
  }

  async createCategory(
    category: Omit<Category, 'id'> & { id?: string }
  ): Promise<Category> {
    try {
      const id =
        category.id ||
        `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newCategory: Category = {
        id,
        name: category.name,
      }

      this.validateCategory(newCategory)

      await this.executeUpdate(
        'INSERT INTO categories (id, name) VALUES (?, ?)',
        [newCategory.id, newCategory.name]
      )

      return newCategory
    } catch (error) {
      throw new DatabaseError('Failed to create category', error)
    }
  }

  async updateCategory(
    id: string,
    updates: Partial<Omit<Category, 'id'>>
  ): Promise<Category> {
    try {
      this.validateCategoryId(id)

      const existing = await this.getCategoryById(id)
      if (!existing) {
        throw new DatabaseError('Category not found')
      }

      const updatedCategory = { ...existing, ...updates }
      this.validateCategory(updatedCategory)

      await this.executeUpdate('UPDATE categories SET name = ? WHERE id = ?', [
        updatedCategory.name,
        id,
      ])

      return updatedCategory
    } catch (error) {
      throw new DatabaseError('Failed to update category', error)
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      this.validateCategoryId(id)

      // Check if category is in use
      const tasksUsingCategory = await this.executeQueryFirst<{
        count: number
      }>('SELECT COUNT(*) as count FROM tasks WHERE category_id = ?', [id])

      if (tasksUsingCategory && tasksUsingCategory.count > 0) {
        throw new DatabaseError(
          'Cannot delete category that is in use by tasks'
        )
      }

      const result = await this.executeUpdate(
        'DELETE FROM categories WHERE id = ?',
        [id]
      )

      if (result.changes === 0) {
        throw new DatabaseError('Category not found')
      }
    } catch (error) {
      throw new DatabaseError('Failed to delete category', error)
    }
  }

  // Task operations
  async getAllTasks(): Promise<Task[]> {
    try {
      const result = await this.executeQuery<any>(
        'SELECT * FROM tasks WHERE archived = 0 ORDER BY created_at DESC'
      )
      return result.map(this.mapRowToTask)
    } catch (error) {
      throw new DatabaseError('Failed to get all tasks', error)
    }
  }

  async getTasksWithCategories(): Promise<
    Array<Task & { categoryName: string }>
  > {
    try {
      const result = await this.executeQuery<any>(
        `SELECT t.*, c.name as category_name 
         FROM tasks t 
         JOIN categories c ON t.category_id = c.id 
         WHERE t.archived = 0 
         ORDER BY t.created_at DESC`
      )
      return result.map((row) => ({
        ...this.mapRowToTask(row),
        categoryName: row.category_name,
      }))
    } catch (error) {
      throw new DatabaseError('Failed to get tasks with categories', error)
    }
  }

  async getTaskById(id: string): Promise<Task | null> {
    try {
      this.validateTaskId(id)
      const result = await this.executeQueryFirst<any>(
        'SELECT * FROM tasks WHERE id = ?',
        [id]
      )
      return result ? this.mapRowToTask(result) : null
    } catch (error) {
      throw new DatabaseError('Failed to get task by ID', error)
    }
  }

  async createTask(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Task> {
    try {
      this.validateTask(task)

      // Verify category exists
      const category = await this.getCategoryById(task.categoryId)
      if (!category) {
        throw new DatabaseError('Category not found')
      }

      const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = Date.now()

      const newTask: Task = {
        ...task,
        id,
        createdAt: now,
        updatedAt: now,
      }

      await this.executeUpdate(
        'INSERT INTO tasks (id, title, category_id, default_minutes, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          newTask.id,
          newTask.title,
          newTask.categoryId,
          newTask.defaultMinutes || null,
          newTask.archived ? 1 : 0,
          newTask.createdAt,
          newTask.updatedAt,
        ]
      )

      return newTask
    } catch (error) {
      throw new DatabaseError('Failed to create task', error)
    }
  }

  async updateTask(
    id: string,
    updates: Partial<Omit<Task, 'id' | 'createdAt'>>
  ): Promise<Task> {
    try {
      this.validateTaskId(id)

      const existing = await this.getTaskById(id)
      if (!existing) {
        throw new DatabaseError('Task not found')
      }

      const updatedTask = { ...existing, ...updates, updatedAt: Date.now() }
      this.validateTask(updatedTask)

      // Verify category exists if categoryId is being updated
      if (updates.categoryId) {
        const category = await this.getCategoryById(updates.categoryId)
        if (!category) {
          throw new DatabaseError('Category not found')
        }
      }

      await this.executeUpdate(
        'UPDATE tasks SET title = ?, category_id = ?, default_minutes = ?, archived = ?, updated_at = ? WHERE id = ?',
        [
          updatedTask.title,
          updatedTask.categoryId,
          updatedTask.defaultMinutes || null,
          updatedTask.archived ? 1 : 0,
          updatedTask.updatedAt,
          id,
        ]
      )

      return updatedTask
    } catch (error) {
      throw new DatabaseError('Failed to update task', error)
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      this.validateTaskId(id)

      const result = await this.executeUpdate(
        'DELETE FROM tasks WHERE id = ?',
        [id]
      )

      if (result.changes === 0) {
        throw new DatabaseError('Task not found')
      }
    } catch (error) {
      throw new DatabaseError('Failed to delete task', error)
    }
  }

  async archiveTask(id: string): Promise<void> {
    try {
      await this.updateTask(id, { archived: true })
    } catch (error) {
      throw new DatabaseError('Failed to archive task', error)
    }
  }

  // Entry operations
  async getEntry(date: string): Promise<Entry | null> {
    try {
      this.validateDate(date)
      const result = await this.executeQueryFirst<any>(
        'SELECT * FROM entries WHERE date = ?',
        [date]
      )
      return result ? this.mapRowToEntry(result) : null
    } catch (error) {
      throw new DatabaseError('Failed to get entry', error)
    }
  }

  async upsertEntry(date: string, note: string): Promise<Entry> {
    try {
      this.validateEntry({ date, note })

      const existing = await this.getEntry(date)
      const now = Date.now()

      if (existing) {
        await this.executeUpdate(
          'UPDATE entries SET note = ?, updated_at = ? WHERE date = ?',
          [note, now, date]
        )
        return { ...existing, note, updatedAt: now }
      } else {
        const id = `entry_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`
        const newEntry: Entry = {
          id,
          date,
          note,
          createdAt: now,
          updatedAt: now,
        }

        await this.executeUpdate(
          'INSERT INTO entries (id, date, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          [
            newEntry.id,
            newEntry.date,
            newEntry.note,
            newEntry.createdAt,
            newEntry.updatedAt,
          ]
        )

        return newEntry
      }
    } catch (error) {
      throw new DatabaseError('Failed to upsert entry', error)
    }
  }

  async deleteEntry(date: string): Promise<void> {
    try {
      this.validateDate(date)

      const result = await this.executeUpdate(
        'DELETE FROM entries WHERE date = ?',
        [date]
      )

      if (result.changes === 0) {
        throw new DatabaseError('Entry not found')
      }
    } catch (error) {
      throw new DatabaseError('Failed to delete entry', error)
    }
  }

  // Completion operations
  async getCompletions(date: string): Promise<Completion[]> {
    try {
      this.validateDate(date)
      const result = await this.executeQuery<any>(
        'SELECT * FROM completions WHERE date = ? ORDER BY created_at DESC',
        [date]
      )
      return result.map(this.mapRowToCompletion)
    } catch (error) {
      throw new DatabaseError('Failed to get completions', error)
    }
  }

  async getCompletionsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Completion[]> {
    try {
      this.validateDate(startDate)
      this.validateDate(endDate)

      const result = await this.executeQuery<any>(
        'SELECT * FROM completions WHERE date >= ? AND date <= ? ORDER BY date DESC, created_at DESC',
        [startDate, endDate]
      )
      return result.map(this.mapRowToCompletion)
    } catch (error) {
      throw new DatabaseError('Failed to get completions by date range', error)
    }
  }

  async toggleCompletion(
    date: string,
    taskId: string,
    minutes?: number
  ): Promise<boolean> {
    try {
      this.validateCompletion({ date, taskId, minutes })

      const existing = await this.executeQueryFirst<any>(
        'SELECT * FROM completions WHERE date = ? AND task_id = ?',
        [date, taskId]
      )

      if (existing) {
        // Remove completion
        await this.executeUpdate(
          'DELETE FROM completions WHERE date = ? AND task_id = ?',
          [date, taskId]
        )
        return false
      } else {
        // Add completion
        const id = `completion_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`
        await this.executeUpdate(
          'INSERT INTO completions (id, date, task_id, minutes, created_at) VALUES (?, ?, ?, ?, ?)',
          [id, date, taskId, minutes || null, Date.now()]
        )
        return true
      }
    } catch (error) {
      throw new DatabaseError('Failed to toggle completion', error)
    }
  }

  async createCompletion(
    completion: Omit<Completion, 'id' | 'createdAt'>
  ): Promise<Completion> {
    try {
      this.validateCompletion(completion)

      const id = `completion_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`
      const now = Date.now()

      const newCompletion: Completion = {
        ...completion,
        id,
        createdAt: now,
      }

      await this.executeUpdate(
        'INSERT INTO completions (id, date, task_id, minutes, created_at) VALUES (?, ?, ?, ?, ?)',
        [
          newCompletion.id,
          newCompletion.date,
          newCompletion.taskId,
          newCompletion.minutes || null,
          newCompletion.createdAt,
        ]
      )

      return newCompletion
    } catch (error) {
      throw new DatabaseError('Failed to create completion', error)
    }
  }

  async deleteCompletion(date: string, taskId: string): Promise<void> {
    try {
      this.validateDate(date)
      this.validateTaskId(taskId)

      const result = await this.executeUpdate(
        'DELETE FROM completions WHERE date = ? AND task_id = ?',
        [date, taskId]
      )

      if (result.changes === 0) {
        throw new DatabaseError('Completion not found')
      }
    } catch (error) {
      throw new DatabaseError('Failed to delete completion', error)
    }
  }

  // Settings operations
  async getSetting(key: string): Promise<string | null> {
    try {
      if (!key || key.trim().length === 0) {
        throw new DatabaseError('Setting key is required')
      }

      const result = await this.executeQueryFirst<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        [key]
      )
      return result?.value || null
    } catch (error) {
      throw new DatabaseError('Failed to get setting', error)
    }
  }

  async setSetting(key: string, value: string): Promise<void> {
    try {
      if (!key || key.trim().length === 0) {
        throw new DatabaseError('Setting key is required')
      }
      if (value === undefined || value === null) {
        throw new DatabaseError('Setting value is required')
      }

      await this.executeUpdate(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, value]
      )
    } catch (error) {
      throw new DatabaseError('Failed to set setting', error)
    }
  }

  async deleteSetting(key: string): Promise<void> {
    try {
      if (!key || key.trim().length === 0) {
        throw new DatabaseError('Setting key is required')
      }

      await this.executeUpdate('DELETE FROM settings WHERE key = ?', [key])
    } catch (error) {
      throw new DatabaseError('Failed to delete setting', error)
    }
  }

  // Additional validation methods
  private validateTaskId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new DatabaseError('Task ID is required')
    }
  }

  private validateCategoryId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new DatabaseError('Category ID is required')
    }
  }

  private validateDate(date: string): void {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new DatabaseError('Date must be in YYYY-MM-DD format')
    }
  }

  // Helper methods to map database rows to TypeScript objects
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

  private mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
    }
  }

  private mapRowToEntry(row: any): Entry {
    return {
      id: row.id,
      date: row.date,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private mapRowToCompletion(row: any): Completion {
    return {
      id: row.id,
      date: row.date,
      taskId: row.task_id,
      minutes: row.minutes,
      createdAt: row.created_at,
    }
  }

  // Database maintenance methods
  async vacuum(): Promise<void> {
    try {
      await this.executeQuery('VACUUM')
      console.log('Database vacuum completed')
    } catch (error) {
      throw new DatabaseError('Failed to vacuum database', error)
    }
  }

  async getTableInfo(tableName: string): Promise<any[]> {
    try {
      return await this.executeQuery(`PRAGMA table_info(${tableName})`)
    } catch (error) {
      throw new DatabaseError(
        `Failed to get table info for ${tableName}`,
        error
      )
    }
  }

  async getDatabaseSize(): Promise<number> {
    try {
      const result = await this.executeQueryFirst<{ size: number }>(
        'SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()'
      )
      return result?.size || 0
    } catch (error) {
      throw new DatabaseError('Failed to get database size', error)
    }
  }

  // Backup and restore methods
  async exportData(): Promise<{
    categories: Category[]
    tasks: Task[]
    entries: Entry[]
    completions: Completion[]
    settings: Array<{ key: string; value: string }>
  }> {
    try {
      const [categories, tasks, entries, completions, settings] =
        await Promise.all([
          this.getAllCategories(),
          this.getAllTasks(),
          this.executeQuery<any>('SELECT * FROM entries ORDER BY date DESC'),
          this.executeQuery<any>(
            'SELECT * FROM completions ORDER BY date DESC, created_at DESC'
          ),
          this.executeQuery<{ key: string; value: string }>(
            'SELECT * FROM settings'
          ),
        ])

      return {
        categories,
        tasks,
        entries: entries.map(this.mapRowToEntry),
        completions: completions.map(this.mapRowToCompletion),
        settings,
      }
    } catch (error) {
      throw new DatabaseError('Failed to export data', error)
    }
  }

  async importData(data: {
    categories?: Category[]
    tasks?: Task[]
    entries?: Entry[]
    completions?: Completion[]
    settings?: Array<{ key: string; value: string }>
  }): Promise<void> {
    try {
      await this.executeTransaction([
        async () => {
          // Clear existing data
          await this.executeUpdate('DELETE FROM completions')
          await this.executeUpdate('DELETE FROM entries')
          await this.executeUpdate('DELETE FROM tasks')
          await this.executeUpdate(
            'DELETE FROM categories WHERE id NOT IN ("business", "life")'
          )
        },
        async () => {
          // Import categories
          if (data.categories) {
            for (const category of data.categories) {
              await this.executeUpdate(
                'INSERT OR REPLACE INTO categories (id, name) VALUES (?, ?)',
                [category.id, category.name]
              )
            }
          }
        },
        async () => {
          // Import tasks
          if (data.tasks) {
            for (const task of data.tasks) {
              await this.executeUpdate(
                'INSERT INTO tasks (id, title, category_id, default_minutes, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                  task.id,
                  task.title,
                  task.categoryId,
                  task.defaultMinutes || null,
                  task.archived ? 1 : 0,
                  task.createdAt,
                  task.updatedAt,
                ]
              )
            }
          }
        },
        async () => {
          // Import entries
          if (data.entries) {
            for (const entry of data.entries) {
              await this.executeUpdate(
                'INSERT INTO entries (id, date, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
                [
                  entry.id,
                  entry.date,
                  entry.note,
                  entry.createdAt,
                  entry.updatedAt,
                ]
              )
            }
          }
        },
        async () => {
          // Import completions
          if (data.completions) {
            for (const completion of data.completions) {
              await this.executeUpdate(
                'INSERT INTO completions (id, date, task_id, minutes, created_at) VALUES (?, ?, ?, ?, ?)',
                [
                  completion.id,
                  completion.date,
                  completion.taskId,
                  completion.minutes || null,
                  completion.createdAt,
                ]
              )
            }
          }
        },
        async () => {
          // Import settings
          if (data.settings) {
            for (const setting of data.settings) {
              await this.executeUpdate(
                'INSERT INTO settings (key, value) VALUES (?, ?)',
                [setting.key, setting.value]
              )
            }
          }
        },
      ])

      console.log('Data import completed successfully')
    } catch (error) {
      throw new DatabaseError('Failed to import data', error)
    }
  }
}

// Export the class for testing
export { DatabaseService }

// Export singleton instance for app usage
export const databaseService = new DatabaseService()
