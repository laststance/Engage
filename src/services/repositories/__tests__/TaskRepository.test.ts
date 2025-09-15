import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals'
import { TaskRepository } from '../TaskRepository'
import { databaseService, DatabaseError } from '../../database'

// Mock the database service
jest.mock('../../database', () => ({
  databaseService: {
    getAllTasks: jest.fn(),
    getTaskById: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    archiveTask: jest.fn(),
    getAllCategories: jest.fn(),
    executeQuery: jest.fn(),
    executeQueryFirst: jest.fn(),
    executeTransaction: jest.fn(),
  },
  DatabaseError: class DatabaseError extends Error {
    constructor(message: string, public originalError?: any) {
      super(message)
      this.name = 'DatabaseError'
    }
  },
}))

describe('TaskRepository', () => {
  let taskRepository: TaskRepository
  const mockDatabaseService = databaseService as jest.Mocked<
    typeof databaseService
  >

  beforeEach(() => {
    taskRepository = new TaskRepository()
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('should return all tasks from database service', async () => {
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

      mockDatabaseService.getAllTasks.mockResolvedValue(mockTasks)

      const result = await taskRepository.findAll()

      expect(mockDatabaseService.getAllTasks).toHaveBeenCalled()
      expect(result).toEqual(mockTasks)
    })
  })

  describe('findByCategoryId', () => {
    it('should return tasks filtered by category', async () => {
      const mockRows = [
        {
          id: 'task1',
          title: 'Business Task',
          category_id: 'business',
          default_minutes: 30,
          archived: 0,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
      ]

      mockDatabaseService.executeQuery.mockResolvedValue(mockRows)

      const result = await taskRepository.findByCategoryId('business')

      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        'SELECT * FROM tasks WHERE category_id = ? AND archived = 0 ORDER BY created_at DESC',
        ['business']
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'task1',
          title: 'Business Task',
          categoryId: 'business',
        })
      )
    })
  })

  describe('findActiveTasksByCategory', () => {
    it('should return tasks grouped by category', async () => {
      const businessRows = [
        {
          id: 'task1',
          title: 'Business Task',
          category_id: 'business',
          default_minutes: 30,
          archived: 0,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
      ]

      const lifeRows = [
        {
          id: 'task2',
          title: 'Life Task',
          category_id: 'life',
          default_minutes: 20,
          archived: 0,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
      ]

      const mockCategories = [
        { id: 'business', name: 'Business' },
        { id: 'life', name: 'Life' },
      ]

      mockDatabaseService.getAllCategories.mockResolvedValue(mockCategories)
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce(businessRows)
        .mockResolvedValueOnce(lifeRows)

      const result = await taskRepository.findActiveTasksByCategory()

      expect(result).toHaveProperty('business')
      expect(result).toHaveProperty('life')
      expect(result.business).toHaveLength(1)
      expect(result.life).toHaveLength(1)
    })
  })

  describe('searchByTitle', () => {
    it('should search tasks by title', async () => {
      const mockRows = [
        {
          id: 'task1',
          title: 'Exercise Task',
          category: 'life',
          default_minutes: 30,
          archived: 0,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
      ]

      mockDatabaseService.executeQuery.mockResolvedValue(mockRows)

      const result = await taskRepository.searchByTitle('Exercise')

      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        'SELECT * FROM tasks WHERE title LIKE ? AND archived = 0 ORDER BY created_at DESC',
        ['%Exercise%']
      )
      expect(result).toHaveLength(1)
    })
  })

  describe('getTaskCount', () => {
    it('should return total task count', async () => {
      mockDatabaseService.executeQueryFirst.mockResolvedValue({ count: 5 })

      const result = await taskRepository.getTaskCount()

      expect(mockDatabaseService.executeQueryFirst).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM tasks WHERE archived = 0'
      )
      expect(result).toBe(5)
    })

    it('should return 0 when no result', async () => {
      mockDatabaseService.executeQueryFirst.mockResolvedValue(null)

      const result = await taskRepository.getTaskCount()

      expect(result).toBe(0)
    })
  })

  describe('getTaskCountByCategory', () => {
    it('should return task count grouped by category', async () => {
      const mockResult = [
        { category_id: 'business', count: 3 },
        { category_id: 'life', count: 5 },
      ]

      mockDatabaseService.executeQuery.mockResolvedValue(mockResult)

      const result = await taskRepository.getTaskCountByCategory()

      expect(result).toEqual({
        business: 3,
        life: 5,
      })
    })

    it('should handle missing categories', async () => {
      const mockResult = [{ category_id: 'business', count: 3 }]

      mockDatabaseService.executeQuery.mockResolvedValue(mockResult)

      const result = await taskRepository.getTaskCountByCategory()

      expect(result).toEqual({
        business: 3,
      })
    })
  })

  describe('seedDefaultTasks', () => {
    it('should seed default tasks when none exist', async () => {
      mockDatabaseService.executeQueryFirst.mockResolvedValue({ count: 0 })
      mockDatabaseService.executeTransaction.mockResolvedValue(undefined)

      await taskRepository.seedDefaultTasks()

      expect(mockDatabaseService.executeTransaction).toHaveBeenCalled()
    })

    it('should not seed when tasks already exist', async () => {
      mockDatabaseService.executeQueryFirst.mockResolvedValue({ count: 5 })

      await taskRepository.seedDefaultTasks()

      expect(mockDatabaseService.executeTransaction).not.toHaveBeenCalled()
    })
  })

  describe('createMultiple', () => {
    it('should create multiple tasks in transaction', async () => {
      const tasksToCreate = [
        { title: 'Task 1', categoryId: 'business', archived: false },
        { title: 'Task 2', categoryId: 'life', archived: false },
      ]

      const mockCreatedTasks = tasksToCreate.map((task, index) => ({
        ...task,
        id: `task${index + 1}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }))

      mockDatabaseService.createTask
        .mockResolvedValueOnce(mockCreatedTasks[0])
        .mockResolvedValueOnce(mockCreatedTasks[1])

      mockDatabaseService.executeTransaction.mockImplementation(
        async (operations) => {
          for (const operation of operations) {
            await operation()
          }
        }
      )

      const result = await taskRepository.createMultiple(tasksToCreate)

      expect(mockDatabaseService.executeTransaction).toHaveBeenCalled()
      expect(result).toHaveLength(2)
    })
  })
})
