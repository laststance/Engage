import { presetService } from '../presetService'
import { taskRepository } from '../repositories/TaskRepository'
import { categoryRepository } from '../repositories/CategoryRepository'
import { databaseService } from '../database'

// Mock the repositories
jest.mock('../repositories/TaskRepository')
jest.mock('../repositories/CategoryRepository')
jest.mock('../database')

const mockTaskRepository = taskRepository as jest.Mocked<typeof taskRepository>
const mockCategoryRepository = categoryRepository as jest.Mocked<
  typeof categoryRepository
>
const mockDatabaseService = databaseService as jest.Mocked<
  typeof databaseService
>

describe('PresetService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initializeDefaults', () => {
    it('should create default categories and tasks on first launch', async () => {
      // Mock empty database (first launch)
      mockCategoryRepository.findAll.mockResolvedValue([])
      mockTaskRepository.findAll.mockResolvedValue([])
      mockCategoryRepository.findById.mockResolvedValue(null)
      mockCategoryRepository.create.mockImplementation(async (category) => ({
        id: category.id || 'generated-id',
        name: category.name,
      }))
      mockTaskRepository.create.mockImplementation(async (task) => ({
        ...task,
        id: 'generated-task-id',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }))
      mockTaskRepository.findByCategoryId.mockResolvedValue([])

      const result = await presetService.initializeDefaults()

      // Should create 2 default categories
      expect(mockCategoryRepository.create).toHaveBeenCalledTimes(2)
      expect(mockCategoryRepository.create).toHaveBeenCalledWith({
        id: 'business',
        name: '事業',
      })
      expect(mockCategoryRepository.create).toHaveBeenCalledWith({
        id: 'life',
        name: '生活',
      })

      // Should create 11 default tasks
      expect(mockTaskRepository.create).toHaveBeenCalledTimes(11)

      // Verify business tasks
      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        title: 'ネットワーキング',
        categoryId: 'business',
        archived: false,
      })
      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        title: 'スキル学習 (30分)',
        categoryId: 'business',
        defaultMinutes: 30,
        archived: false,
      })
      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        title: 'アイデア記録',
        categoryId: 'business',
        archived: false,
      })

      // Verify life tasks
      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        title: '運動 (20分以上)',
        categoryId: 'life',
        defaultMinutes: 20,
        archived: false,
      })
      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        title: '十分な睡眠 (7時間)',
        categoryId: 'life',
        defaultMinutes: 420,
        archived: false,
      })

      expect(result.categoriesCreated).toBe(2)
      expect(result.tasksCreated).toBe(11)
    })

    it('should not create duplicates if data already exists', async () => {
      // Mock existing data
      mockCategoryRepository.findAll.mockResolvedValue([
        { id: 'business', name: '事業' },
        { id: 'life', name: '生活' },
      ])
      mockTaskRepository.findAll.mockResolvedValue([
        {
          id: 'existing-task',
          title: 'ネットワーキング',
          categoryId: 'business',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ])
      mockCategoryRepository.findById.mockImplementation(async (id) => {
        if (id === 'business') return { id: 'business', name: '事業' }
        if (id === 'life') return { id: 'life', name: '生活' }
        return null
      })
      mockTaskRepository.findByCategoryId.mockImplementation(
        async (categoryId) => {
          if (categoryId === 'business') {
            return [
              {
                id: 'existing-task',
                title: 'ネットワーキング',
                categoryId: 'business',
                archived: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
            ]
          }
          return []
        }
      )

      const result = await presetService.initializeDefaults()

      // Should not create categories that already exist
      expect(mockCategoryRepository.create).not.toHaveBeenCalled()

      // Should only create tasks that don't exist (10 out of 11)
      expect(mockTaskRepository.create).toHaveBeenCalledTimes(10)

      expect(result.categoriesCreated).toBe(0)
      expect(result.tasksCreated).toBe(10)
    })
  })

  describe('getSuggestedTasks', () => {
    it('should return 3 recommended tasks for first-time users', async () => {
      const mockTasks = [
        {
          id: 'task1',
          title: '運動 (20分以上)',
          categoryId: 'life',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'task2',
          title: 'ネットワーキング',
          categoryId: 'business',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'task3',
          title: '読書・勉強',
          categoryId: 'life',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'task4',
          title: 'アイデア記録',
          categoryId: 'business',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      mockTaskRepository.findAll.mockResolvedValue(mockTasks)

      const suggestedTasks = await presetService.getSuggestedTasks()

      expect(suggestedTasks).toHaveLength(3)
      expect(suggestedTasks[0].title).toBe('運動 (20分以上)')
      expect(suggestedTasks[1].title).toBe('ネットワーキング')
      expect(suggestedTasks[2].title).toBe('読書・勉強')
    })

    it('should fill with other tasks if recommended tasks are not available', async () => {
      const mockTasks = [
        {
          id: 'task1',
          title: 'アイデア記録',
          categoryId: 'business',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'task2',
          title: '整理整頓',
          categoryId: 'life',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'task3',
          title: 'スキル学習 (30分)',
          categoryId: 'business',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      mockTaskRepository.findAll.mockResolvedValue(mockTasks)

      const suggestedTasks = await presetService.getSuggestedTasks()

      expect(suggestedTasks).toHaveLength(3)
      // Should alternate between business and life categories
      expect(suggestedTasks[0].categoryId).toBe('business')
      expect(suggestedTasks[1].categoryId).toBe('life')
      expect(suggestedTasks[2].categoryId).toBe('business')
    })
  })

  describe('isFirstLaunch', () => {
    it('should return true when no categories or tasks exist', async () => {
      mockCategoryRepository.findAll.mockResolvedValue([])
      mockTaskRepository.findAll.mockResolvedValue([])

      const isFirst = await presetService.isFirstLaunch()

      expect(isFirst).toBe(true)
    })

    it('should return false when data exists', async () => {
      mockCategoryRepository.findAll.mockResolvedValue([
        { id: 'business', name: '事業' },
      ])
      mockTaskRepository.findAll.mockResolvedValue([])

      const isFirst = await presetService.isFirstLaunch()

      expect(isFirst).toBe(false)
    })
  })

  describe('getPresetTasksByCategory', () => {
    it('should group tasks by category', async () => {
      const mockCategories = [
        { id: 'business', name: '事業' },
        { id: 'life', name: '生活' },
      ]
      const mockTasks = [
        {
          id: 'task1',
          title: 'ネットワーキング',
          categoryId: 'business',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'task2',
          title: '運動 (20分以上)',
          categoryId: 'life',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      mockCategoryRepository.findAll.mockResolvedValue(mockCategories)
      mockTaskRepository.findAll.mockResolvedValue(mockTasks)

      const tasksByCategory = await presetService.getPresetTasksByCategory()

      expect(tasksByCategory).toEqual({
        business: [mockTasks[0]],
        life: [mockTasks[1]],
      })
    })
  })

  describe('validatePresetIntegrity', () => {
    it('should validate that all required categories exist', async () => {
      mockCategoryRepository.findAll.mockResolvedValue([
        { id: 'business', name: '事業' },
        // Missing 'life' category
      ])
      mockTaskRepository.findAll.mockResolvedValue([])

      const validation = await presetService.validatePresetIntegrity()

      expect(validation.isValid).toBe(false)
      expect(validation.missingCategories).toContain('life')
    })

    it('should detect orphaned tasks', async () => {
      mockCategoryRepository.findAll.mockResolvedValue([
        { id: 'business', name: '事業' },
      ])
      mockTaskRepository.findAll.mockResolvedValue([
        {
          id: 'orphaned-task',
          title: 'Orphaned Task',
          categoryId: 'nonexistent-category',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ])

      const validation = await presetService.validatePresetIntegrity()

      expect(validation.isValid).toBe(false)
      expect(validation.orphanedTasks).toHaveLength(1)
      expect(validation.orphanedTasks[0].id).toBe('orphaned-task')
    })

    it('should return valid when everything is correct', async () => {
      mockCategoryRepository.findAll.mockResolvedValue([
        { id: 'business', name: '事業' },
        { id: 'life', name: '生活' },
      ])
      mockTaskRepository.findAll.mockResolvedValue([
        {
          id: 'task1',
          title: 'ネットワーキング',
          categoryId: 'business',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ])

      const validation = await presetService.validatePresetIntegrity()

      expect(validation.isValid).toBe(true)
      expect(validation.missingCategories).toHaveLength(0)
      expect(validation.orphanedTasks).toHaveLength(0)
    })
  })
})
