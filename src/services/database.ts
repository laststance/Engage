import * as SQLite from 'expo-sqlite'
import { Task, Entry, Completion } from '../types'

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('engage.db')
      await this.createTables()
      console.log('Database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database:', error)
      throw error
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const createTablesSQL = `
      -- Tasks table (preset and custom tasks)
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT CHECK(category IN ('business', 'life')) NOT NULL,
        default_minutes INTEGER,
        archived INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Daily journal entries
      CREATE TABLE IF NOT EXISTS entries (
        id TEXT PRIMARY KEY,
        date TEXT UNIQUE NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Task completions
      CREATE TABLE IF NOT EXISTS completions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        task_id TEXT NOT NULL,
        minutes INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
        UNIQUE(date, task_id)
      );

      -- App settings
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_completions_date ON completions(date);
      CREATE INDEX IF NOT EXISTS idx_completions_task_id ON completions(task_id);
      CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
    `

    await this.db.execAsync(createTablesSQL)
  }

  // Task operations
  async getAllTasks(): Promise<Task[]> {
    if (!this.db) throw new Error('Database not initialized')

    const result = await this.db.getAllAsync(
      'SELECT * FROM tasks WHERE archived = 0 ORDER BY created_at DESC'
    )

    return result.map(this.mapRowToTask)
  }

  async createTask(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Task> {
    if (!this.db) throw new Error('Database not initialized')

    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()

    const newTask: Task = {
      ...task,
      id,
      createdAt: now,
      updatedAt: now,
    }

    await this.db.runAsync(
      'INSERT INTO tasks (id, title, category, default_minutes, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        newTask.id,
        newTask.title,
        newTask.category,
        newTask.defaultMinutes || null,
        newTask.archived ? 1 : 0,
        newTask.createdAt,
        newTask.updatedAt,
      ]
    )

    return newTask
  }

  // Entry operations
  async getEntry(date: string): Promise<Entry | null> {
    if (!this.db) throw new Error('Database not initialized')

    const result = await this.db.getFirstAsync(
      'SELECT * FROM entries WHERE date = ?',
      [date]
    )

    return result ? this.mapRowToEntry(result) : null
  }

  async upsertEntry(date: string, note: string): Promise<Entry> {
    if (!this.db) throw new Error('Database not initialized')

    const existing = await this.getEntry(date)
    const now = Date.now()

    if (existing) {
      await this.db.runAsync(
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

      await this.db.runAsync(
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
  }

  // Completion operations
  async getCompletions(date: string): Promise<Completion[]> {
    if (!this.db) throw new Error('Database not initialized')

    const result = await this.db.getAllAsync(
      'SELECT * FROM completions WHERE date = ? ORDER BY created_at DESC',
      [date]
    )

    return result.map(this.mapRowToCompletion)
  }

  async toggleCompletion(date: string, taskId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized')

    const existing = await this.db.getFirstAsync(
      'SELECT * FROM completions WHERE date = ? AND task_id = ?',
      [date, taskId]
    )

    if (existing) {
      // Remove completion
      await this.db.runAsync(
        'DELETE FROM completions WHERE date = ? AND task_id = ?',
        [date, taskId]
      )
      return false
    } else {
      // Add completion
      const id = `completion_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`
      await this.db.runAsync(
        'INSERT INTO completions (id, date, task_id, created_at) VALUES (?, ?, ?, ?)',
        [id, date, taskId, Date.now()]
      )
      return true
    }
  }

  // Helper methods to map database rows to TypeScript objects
  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      defaultMinutes: row.default_minutes,
      archived: Boolean(row.archived),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
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
}

export const databaseService = new DatabaseService()
