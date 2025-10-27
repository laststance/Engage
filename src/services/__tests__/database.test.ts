import * as SQLite from 'expo-sqlite'
import { DatabaseService, DatabaseError, MigrationError } from '../database'
import { Task, Entry, Completion } from '../../types'

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}))

describe('DatabaseService', () => {
  let databaseService: DatabaseService
  let mockDb: any

  beforeEach(async () => {
    // Create mock database
    mockDb = {
      execAsync: jest.fn(),
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      runAsync: jest.fn(),
    }

    // Mock SQLite.openDatabaseAsync
    ;(SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb)

    // Create new database service instance
    databaseService = new DatabaseService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize database successfully', async () => {
      mockDb.execAsync.mockResolvedValue(undefined)
      mockDb.getFirstAsync.mockResolvedValue(null) // No existing migrations

      await databaseService.initialize()

      expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('engage.db')
      expect(mockDb.execAsync).toHaveBeenCalled()
    })

    it('should throw DatabaseError on initialization failure', async () => {
      const error = new Error('Database connection failed')
      ;(SQLite.openDatabaseAsync as jest.Mock).mockRejectedValue(error)

      await expect(databaseService.initialize()).rejects.toThrow(DatabaseError)
    })

    it('should apply migrations correctly', async () => {
      mockDb.execAsync.mockResolvedValue(undefined)
      mockDb.getFirstAsync.mockResolvedValue(null) // No existing migrations
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 })

      await databaseService.initialize()

      // Should create schema_migrations table and apply migration
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS schema_migrations')
      )
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
        expect.arrayContaining([1, expect.any(Number)])
      )
    })
  })

  describe('task operations', () => {
    beforeEach(async () => {
      mockDb.execAsync.mockResolvedValue(undefined)
      mockDb.getFirstAsync.mockResolvedValue(null)
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 })
      await databaseService.initialize()
    })

    describe('getAllTasks', () => {
      it('should return all non-archived tasks', async () => {
        const mockTasks = [
          {
            id: 'task1',
            title: 'Test Task',
            category_id: 'business',
            default_minutes: 30,
            archived: 0,
            created_at: Date.now(),
            updated_at: Date.now(),
          },
        ]

        mockDb.getAllAsync.mockResolvedValue(mockTasks)

        const result = await databaseService.getAllTasks()

        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
          'SELECT * FROM tasks WHERE archived = 0 ORDER BY created_at DESC'
        )
        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject({
          id: 'task1',
          title: 'Test Task',
          categoryId: 'business',
          defaultMinutes: 30,
          archived: false,
        })
      })

      it('should handle database errors', async () => {
        mockDb.getAllAsync.mockRejectedValue(new Error('Database error'))

        await expect(databaseService.getAllTasks()).rejects.toThrow(
          DatabaseError
        )
      })
    })

    describe('createTask', () => {
      it('should create a new task successfully', async () => {
        const taskData = {
          title: 'New Task',
          categoryId: 'life',
          defaultMinutes: 45,
          archived: false,
        }

        // Mock category validation
        mockDb.getFirstAsync.mockResolvedValueOnce({ id: 'life', name: 'Life' })
        mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 })

        const result = await databaseService.createTask(taskData)

        expect(result).toMatchObject(taskData)
        expect(result.id).toBeDefined()
        expect(result.createdAt).toBeDefined()
        expect(result.updatedAt).toBeDefined()
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          'INSERT INTO tasks (id, title, category_id, default_minutes, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          expect.arrayContaining([
            expect.any(String),
            'New Task',
            'life',
            45,
            0,
            expect.any(Number),
            expect.any(Number),
          ])
        )
      })

      it('should validate task data', async () => {
        const invalidTask = {
          title: '',
          categoryId: 'invalid',
          archived: false,
        }

        await expect(databaseService.createTask(invalidTask)).rejects.toThrow(
          DatabaseError
        )
      })

      it('should handle negative default minutes', async () => {
        const invalidTask = {
          title: 'Test Task',
          categoryId: 'business',
          defaultMinutes: -10,
          archived: false,
        }

        await expect(databaseService.createTask(invalidTask)).rejects.toThrow(
          DatabaseError
        )
      })
    })

    describe('updateTask', () => {
      it('should update an existing task', async () => {
        const existingTask = {
          id: 'task1',
          title: 'Original Task',
          categoryId: 'business',
          defaultMinutes: 30,
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        mockDb.getFirstAsync.mockResolvedValue({
          id: 'task1',
          title: 'Original Task',
          category_id: 'business',
          default_minutes: 30,
          archived: 0,
          created_at: existingTask.createdAt,
          updated_at: existingTask.updatedAt,
        })

        mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 })

        const updates = { title: 'Updated Task', defaultMinutes: 60 }
        const result = await databaseService.updateTask('task1', updates)

        expect(result.title).toBe('Updated Task')
        expect(result.defaultMinutes).toBe(60)
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          'UPDATE tasks SET title = ?, category_id = ?, default_minutes = ?, archived = ?, updated_at = ? WHERE id = ?',
          expect.arrayContaining([
            'Updated Task',
            'business',
            60,
            0,
            expect.any(Number),
            'task1',
          ])
        )
      })

      it('should throw error for non-existent task', async () => {
        mockDb.getFirstAsync.mockResolvedValue(null)

        await expect(
          databaseService.updateTask('nonexistent', { title: 'New Title' })
        ).rejects.toThrow(DatabaseError)
      })
    })

    describe('deleteTask', () => {
      it('should delete an existing task', async () => {
        mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 })

        await databaseService.deleteTask('task1')

        expect(mockDb.runAsync).toHaveBeenCalledWith(
          'DELETE FROM tasks WHERE id = ?',
          ['task1']
        )
      })

      it('should throw error when task not found', async () => {
        mockDb.runAsync.mockResolvedValue({ changes: 0, lastInsertRowId: 0 })

        await expect(databaseService.deleteTask('nonexistent')).rejects.toThrow(
          DatabaseError
        )
      })
    })
  })

  describe('entry operations', () => {
    beforeEach(async () => {
      mockDb.execAsync.mockResolvedValue(undefined)
      mockDb.getFirstAsync.mockResolvedValue(null)
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 })
      await databaseService.initialize()
    })

    describe('getEntry', () => {
      it('should return entry for valid date', async () => {
        const mockEntry = {
          id: 'entry1',
          date: '2024-01-15',
          note: 'Test note',
          created_at: Date.now(),
          updated_at: Date.now(),
        }

        mockDb.getFirstAsync.mockResolvedValue(mockEntry)

        const result = await databaseService.getEntry('2024-01-15')

        expect(result).toMatchObject({
          id: 'entry1',
          date: '2024-01-15',
          note: 'Test note',
        })
      })

      it('should return null for non-existent entry', async () => {
        mockDb.getFirstAsync.mockResolvedValue(null)

        const result = await databaseService.getEntry('2024-01-15')

        expect(result).toBeNull()
      })

      it('should validate date format', async () => {
        await expect(databaseService.getEntry('invalid-date')).rejects.toThrow(
          DatabaseError
        )
      })
    })

    describe('upsertEntry', () => {
      it('should create new entry when none exists', async () => {
        mockDb.getFirstAsync.mockResolvedValue(null) // No existing entry
        mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 })

        const result = await databaseService.upsertEntry(
          '2024-01-15',
          'New note'
        )

        expect(result.date).toBe('2024-01-15')
        expect(result.note).toBe('New note')
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          'INSERT INTO entries (id, date, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          expect.arrayContaining([
            expect.any(String),
            '2024-01-15',
            'New note',
            expect.any(Number),
            expect.any(Number),
          ])
        )
      })

      it('should update existing entry', async () => {
        const existingEntry = {
          id: 'entry1',
          date: '2024-01-15',
          note: 'Old note',
          created_at: Date.now(),
          updated_at: Date.now(),
        }

        mockDb.getFirstAsync.mockResolvedValue(existingEntry)
        mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 })

        const result = await databaseService.upsertEntry(
          '2024-01-15',
          'Updated note'
        )

        expect(result.note).toBe('Updated note')
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          'UPDATE entries SET note = ?, updated_at = ? WHERE date = ?',
          expect.arrayContaining([
            'Updated note',
            expect.any(Number),
            '2024-01-15',
          ])
        )
      })
    })
  })

  describe('completion operations', () => {
    beforeEach(async () => {
      mockDb.execAsync.mockResolvedValue(undefined)
      mockDb.getFirstAsync.mockResolvedValue(null)
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 })
      await databaseService.initialize()
    })

    describe('getCompletions', () => {
      it('should return completions for a date', async () => {
        const mockCompletions = [
          {
            id: 'completion1',
            date: '2024-01-15',
            task_id: 'task1',
            minutes: 30,
            created_at: Date.now(),
          },
        ]

        mockDb.getAllAsync.mockResolvedValue(mockCompletions)

        const result = await databaseService.getCompletions('2024-01-15')

        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject({
          id: 'completion1',
          date: '2024-01-15',
          taskId: 'task1',
          minutes: 30,
        })
      })
    })

    describe('toggleCompletion', () => {
      it('should create completion when none exists', async () => {
        mockDb.getFirstAsync.mockResolvedValue(null) // No existing completion
        mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 })

        const result = await databaseService.toggleCompletion(
          '2024-01-15',
          'task1',
          30
        )

        expect(result).toBe(true)
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          'INSERT INTO completions (id, date, task_id, minutes, created_at) VALUES (?, ?, ?, ?, ?)',
          expect.arrayContaining([
            expect.any(String),
            '2024-01-15',
            'task1',
            30,
            expect.any(Number),
          ])
        )
      })

      it('should remove completion when it exists', async () => {
        const existingCompletion = {
          id: 'completion1',
          date: '2024-01-15',
          task_id: 'task1',
          minutes: 30,
          created_at: Date.now(),
        }

        mockDb.getFirstAsync.mockResolvedValue(existingCompletion)
        mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 })

        const result = await databaseService.toggleCompletion(
          '2024-01-15',
          'task1'
        )

        expect(result).toBe(false)
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          'DELETE FROM completions WHERE date = ? AND task_id = ?',
          ['2024-01-15', 'task1']
        )
      })
    })

    describe('getCompletionsByDateRange', () => {
      it('should return completions within date range', async () => {
        const mockCompletions = [
          {
            id: 'completion1',
            date: '2024-01-15',
            task_id: 'task1',
            minutes: 30,
            created_at: Date.now(),
          },
          {
            id: 'completion2',
            date: '2024-01-16',
            task_id: 'task2',
            minutes: 45,
            created_at: Date.now(),
          },
        ]

        mockDb.getAllAsync.mockResolvedValue(mockCompletions)

        const result = await databaseService.getCompletionsByDateRange(
          '2024-01-15',
          '2024-01-16'
        )

        expect(result).toHaveLength(2)
        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
          'SELECT * FROM completions WHERE date >= ? AND date <= ? ORDER BY date DESC, created_at DESC',
          ['2024-01-15', '2024-01-16']
        )
      })
    })
  })

  describe('settings operations', () => {
    beforeEach(async () => {
      mockDb.execAsync.mockResolvedValue(undefined)
      mockDb.getFirstAsync.mockResolvedValue(null)
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 })
      await databaseService.initialize()
    })

    describe('getSetting', () => {
      it('should return setting value', async () => {
        mockDb.getFirstAsync.mockResolvedValue({ value: 'test-value' })

        const result = await databaseService.getSetting('test-key')

        expect(result).toBe('test-value')
        expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
          'SELECT value FROM settings WHERE key = ?',
          ['test-key']
        )
      })

      it('should return null for non-existent setting', async () => {
        mockDb.getFirstAsync.mockResolvedValue(null)

        const result = await databaseService.getSetting('non-existent')

        expect(result).toBeNull()
      })
    })

    describe('setSetting', () => {
      it('should set setting value', async () => {
        mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 })

        await databaseService.setSetting('test-key', 'test-value')

        expect(mockDb.runAsync).toHaveBeenCalledWith(
          'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          ['test-key', 'test-value']
        )
      })

      it('should validate setting key', async () => {
        await expect(databaseService.setSetting('', 'value')).rejects.toThrow(
          DatabaseError
        )
      })
    })
  })

  describe('transaction handling', () => {
    beforeEach(async () => {
      mockDb.execAsync.mockResolvedValue(undefined)
      mockDb.getFirstAsync.mockResolvedValue(null)
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 })
      await databaseService.initialize()
    })

    it('should execute transaction successfully', async () => {
      const operations = [
        jest.fn().mockResolvedValue(undefined),
        jest.fn().mockResolvedValue(undefined),
      ]

      await databaseService.executeTransaction(operations)

      expect(mockDb.execAsync).toHaveBeenCalledWith('BEGIN TRANSACTION')
      expect(operations[0]).toHaveBeenCalled()
      expect(operations[1]).toHaveBeenCalled()
      expect(mockDb.execAsync).toHaveBeenCalledWith('COMMIT')
    })

    it('should rollback on transaction failure', async () => {
      const operations = [
        jest.fn().mockResolvedValue(undefined),
        jest.fn().mockRejectedValue(new Error('Operation failed')),
      ]

      await expect(
        databaseService.executeTransaction(operations)
      ).rejects.toThrow(DatabaseError)

      expect(mockDb.execAsync).toHaveBeenCalledWith('BEGIN TRANSACTION')
      expect(mockDb.execAsync).toHaveBeenCalledWith('ROLLBACK')
    })
  })

  describe('data export and import', () => {
    beforeEach(async () => {
      mockDb.execAsync.mockResolvedValue(undefined)
      mockDb.getFirstAsync.mockResolvedValue(null)
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 })
      await databaseService.initialize()
    })

    describe('exportData', () => {
      it('should export all data successfully', async () => {
        const mockCategories = [{ id: 'business', name: 'Business' }]
        const mockTasks = [
          {
            id: 'task1',
            title: 'Test Task',
            categoryId: 'business',
            archived: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ]
        const mockEntries = [
          {
            id: 'entry1',
            date: '2024-01-15',
            note: 'Test note',
            created_at: Date.now(),
            updated_at: Date.now(),
          },
        ]
        const mockCompletions = [
          {
            id: 'completion1',
            date: '2024-01-15',
            task_id: 'task1',
            created_at: Date.now(),
          },
        ]
        const mockSettings = [{ key: 'test-key', value: 'test-value' }]

        // Mock the getAllCategories and getAllTasks calls
        mockDb.getAllAsync
          .mockResolvedValueOnce(mockCategories) // getAllCategories
          .mockResolvedValueOnce(mockTasks) // getAllTasks
          .mockResolvedValueOnce(mockEntries) // entries query
          .mockResolvedValueOnce(mockCompletions) // completions query
          .mockResolvedValueOnce(mockSettings) // settings query

        const result = await databaseService.exportData()

        expect(result).toHaveProperty('categories')
        expect(result).toHaveProperty('tasks')
        expect(result).toHaveProperty('entries')
        expect(result).toHaveProperty('completions')
        expect(result).toHaveProperty('settings')
        expect(result.categories).toHaveLength(1)
        expect(result.tasks).toHaveLength(1)
        expect(result.entries).toHaveLength(1)
        expect(result.completions).toHaveLength(1)
        expect(result.settings).toHaveLength(1)
      })
    })
  })
})
