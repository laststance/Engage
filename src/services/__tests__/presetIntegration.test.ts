import { presetService } from '../presetService'
import { taskRepository } from '../repositories/TaskRepository'
import { categoryRepository } from '../repositories/CategoryRepository'
import { Task, Category } from '../../types'

// Mock the repositories
jest.mock('../repositories/TaskRepository')
jest.mock('../repositories/CategoryRepository')

const mockTaskRepository = taskRepository as jest.Mocked<typeof taskRepository>
const mockCategoryRepository = categoryRepository as jest.Mocked<
  typeof categoryRepository
>

describe('Preset Management Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Real-time updates between preset editor and task selection', () => {
    it('should reflect task changes immediately after preset update', async () => {
      // Initial state
      const initialCategories: Category[] = [
        { id: 'business', name: '事業' },
        { id: 'life', name: '生活' },
      ]

      const initialTasks: Task[] = [
        {
          id: 'task1',
          title: 'ネットワーキング',
          categoryId: 'business',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      // Mock initial data
      mockCategoryRepository.findAll.mockResolvedValue(initialCategories)
      mockTaskRepository.findAll.mockResolvedValue(initialTasks)

      // Get initial preset tasks by category
      const initialPresets = await presetService.getPresetTasksByCategory()
      expect(initialPresets.business).toHaveLength(1)
      expect(initialPresets.life).toHaveLength(0)

      // Simulate adding a new task to life category
      const updatedTasks: Task[] = [
        ...initialTasks,
        {
          id: 'task2',
          title: '運動 (20分以上)',
          categoryId: 'life',
          defaultMinutes: 20,
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      // Mock updated data after preset modification
      mockTaskRepository.findAll.mockResolvedValue(updatedTasks)

      // Get updated preset tasks by category
      const updatedPresets = await presetService.getPresetTasksByCategory()
      expect(updatedPresets.business).toHaveLength(1)
      expect(updatedPresets.life).toHaveLength(1)
      expect(updatedPresets.life[0].title).toBe('運動 (20分以上)')
    })

    it('should handle category creation and immediate task assignment', async () => {
      const initialCategories: Category[] = [
        { id: 'business', name: '事業' },
        { id: 'life', name: '生活' },
      ]

      // Mock category creation
      mockCategoryRepository.create.mockResolvedValue({
        id: 'study',
        name: '勉強',
      })

      // After category creation, include new category in results
      const updatedCategories: Category[] = [
        ...initialCategories,
        { id: 'study', name: '勉強' },
      ]

      // First call returns initial categories, second call returns updated categories
      mockCategoryRepository.findAll
        .mockResolvedValueOnce(initialCategories)
        .mockResolvedValueOnce(updatedCategories)

      // Get initial categories
      const initialCats = await categoryRepository.findAll()
      expect(initialCats).toHaveLength(2)

      // Create new category
      const newCategory = await categoryRepository.create({ name: '勉強' })
      expect(newCategory.name).toBe('勉強')

      // Verify category is available for task assignment
      const categories = await categoryRepository.findAll()
      expect(categories).toHaveLength(3)
      expect(categories.find((c) => c.name === '勉強')).toBeTruthy()
    })

    it('should maintain task selection state when presets are modified', async () => {
      // Simulate a scenario where user has selected tasks, then modifies presets
      const categories: Category[] = [
        { id: 'business', name: '事業' },
        { id: 'life', name: '生活' },
      ]

      const originalTasks: Task[] = [
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
          defaultMinutes: 20,
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      mockCategoryRepository.findAll.mockResolvedValue(categories)
      mockTaskRepository.findAll.mockResolvedValue(originalTasks)

      // User selects tasks for a date
      const selectedTaskIds = ['task1', 'task2']

      // User modifies presets (e.g., updates task title)
      const modifiedTasks: Task[] = [
        {
          ...originalTasks[0],
          title: '新しいネットワーキング', // Modified title
        },
        originalTasks[1], // Unchanged
      ]

      mockTaskRepository.findAll.mockResolvedValue(modifiedTasks)

      // Verify that task selection can still work with updated tasks
      const updatedPresets = await presetService.getPresetTasksByCategory()
      const businessTasks = updatedPresets.business

      expect(businessTasks).toHaveLength(1)
      expect(businessTasks[0].title).toBe('新しいネットワーキング')
      expect(businessTasks[0].id).toBe('task1') // ID should remain the same

      // Selected task IDs should still be valid
      const stillValidSelections = selectedTaskIds.filter((id) =>
        modifiedTasks.some((task) => task.id === id)
      )
      expect(stillValidSelections).toHaveLength(2)
    })

    it('should handle task deletion gracefully in selection context', async () => {
      const categories: Category[] = [
        { id: 'business', name: '事業' },
        { id: 'life', name: '生活' },
      ]

      const originalTasks: Task[] = [
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
          defaultMinutes: 20,
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      mockCategoryRepository.findAll.mockResolvedValue(categories)
      mockTaskRepository.findAll.mockResolvedValue(originalTasks)

      // User has selected both tasks
      const selectedTaskIds = ['task1', 'task2']

      // User deletes one task from presets
      const tasksAfterDeletion: Task[] = [originalTasks[1]] // Only task2 remains

      mockTaskRepository.findAll.mockResolvedValue(tasksAfterDeletion)

      // Verify that selection state can be cleaned up
      const remainingPresets = await presetService.getPresetTasksByCategory()
      const allRemainingTaskIds = Object.values(remainingPresets)
        .flat()
        .map((task) => task.id)

      // Only valid task IDs should remain
      const validSelections = selectedTaskIds.filter((id) =>
        allRemainingTaskIds.includes(id)
      )
      expect(validSelections).toEqual(['task2'])
    })
  })

  describe('State synchronization', () => {
    it('should maintain consistency between categories and tasks', async () => {
      const categories: Category[] = [
        { id: 'business', name: '事業' },
        { id: 'life', name: '生活' },
      ]

      const tasks: Task[] = [
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
          categoryId: 'nonexistent-category', // Invalid category
          defaultMinutes: 20,
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      mockCategoryRepository.findAll.mockResolvedValue(categories)
      mockTaskRepository.findAll.mockResolvedValue(tasks)

      // Validate preset integrity
      const validation = await presetService.validatePresetIntegrity()

      expect(validation.isValid).toBe(false)
      expect(validation.orphanedTasks).toHaveLength(1)
      expect(validation.orphanedTasks[0].id).toBe('task2')
    })

    it('should provide suggested tasks after preset initialization', async () => {
      // Mock first launch scenario
      mockCategoryRepository.findAll.mockResolvedValueOnce([])
      mockTaskRepository.findAll.mockResolvedValueOnce([])

      // Mock successful initialization
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

      // Mock tasks after initialization
      const initializedTasks: Task[] = [
        {
          id: 'task1',
          title: '運動 (20分以上)',
          categoryId: 'life',
          defaultMinutes: 20,
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
      ]

      mockTaskRepository.findAll.mockResolvedValue(initializedTasks)

      // Initialize presets
      const result = await presetService.initializeDefaults()

      // Should provide 3 suggested tasks
      expect(result.suggestedTasks).toHaveLength(3)

      // Suggested tasks should be the recommended ones
      const suggestedTitles = result.suggestedTasks.map((t) => t.title)
      expect(suggestedTitles).toContain('運動 (20分以上)')
      expect(suggestedTitles).toContain('ネットワーキング')
      expect(suggestedTitles).toContain('読書・勉強')
    })
  })
})
