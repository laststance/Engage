import { Task, Category } from '../../types'

// Mock data for testing
const mockCategories: Category[] = [
  { id: 'business', name: '事業' },
  { id: 'life', name: '生活' },
]

const mockTasks: Task[] = [
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

// Helper functions that would be used in the PresetTaskEditor component
export const validateTaskList = (
  tasks: Task[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  // Check if at least one task exists
  const validTasks = tasks.filter((task) => task.title.trim() !== '')
  if (validTasks.length === 0) {
    errors.push('少なくとも1つのタスクが必要です')
  }

  // Check for duplicate titles within same category
  const duplicates = validTasks.filter((task, index) => {
    return (
      validTasks.findIndex(
        (t) => t.title === task.title && t.categoryId === task.categoryId
      ) !== index
    )
  })

  if (duplicates.length > 0) {
    errors.push('同じカテゴリー内で重複するタスク名があります')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const getCategoryColor = (
  categoryId: string,
  categories: Category[]
): string => {
  const category = categories.find((c) => c.id === categoryId)
  if (!category) return 'bg-gray-500'

  // Default colors for preset categories
  if (category.name === '事業') return 'bg-blue-500'
  if (category.name === '生活') return 'bg-green-500'

  // Generate colors for custom categories
  const colors = [
    'bg-orange-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
  ]
  const index = categoryId.length % colors.length
  return colors[index]
}

export const groupTasksByCategory = (tasks: Task[]): Record<string, Task[]> => {
  return tasks.reduce((acc, task) => {
    if (!acc[task.categoryId]) {
      acc[task.categoryId] = []
    }
    acc[task.categoryId].push(task)
    return acc
  }, {} as Record<string, Task[]>)
}

describe('PresetTaskEditor Helper Functions', () => {
  describe('validateTaskList', () => {
    it('should validate a list with valid tasks', () => {
      const result = validateTaskList(mockTasks)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty task list', () => {
      const result = validateTaskList([])
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('少なくとも1つのタスクが必要です')
    })

    it('should reject tasks with empty titles', () => {
      const tasksWithEmptyTitles = [
        { ...mockTasks[0], title: '' },
        { ...mockTasks[1], title: '   ' }, // whitespace only
      ]
      const result = validateTaskList(tasksWithEmptyTitles)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('少なくとも1つのタスクが必要です')
    })

    it('should detect duplicate task names in same category', () => {
      const duplicateTasks = [
        mockTasks[0],
        { ...mockTasks[0], id: 'different-id' }, // Same title and category
      ]
      const result = validateTaskList(duplicateTasks)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        '同じカテゴリー内で重複するタスク名があります'
      )
    })

    it('should allow same task names in different categories', () => {
      const sameTitleDifferentCategory = [
        mockTasks[0],
        { ...mockTasks[0], id: 'different-id', categoryId: 'life' },
      ]
      const result = validateTaskList(sameTitleDifferentCategory)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('getCategoryColor', () => {
    it('should return blue for business category', () => {
      const color = getCategoryColor('business', mockCategories)
      expect(color).toBe('bg-blue-500')
    })

    it('should return green for life category', () => {
      const color = getCategoryColor('life', mockCategories)
      expect(color).toBe('bg-green-500')
    })

    it('should return generated color for custom categories', () => {
      const customCategories = [
        ...mockCategories,
        { id: 'study', name: '勉強' },
      ]
      const color = getCategoryColor('study', customCategories)
      expect(color).toMatch(/^bg-(orange|purple|pink|indigo|yellow)-500$/)
    })

    it('should return gray for unknown categories', () => {
      const color = getCategoryColor('unknown', mockCategories)
      expect(color).toBe('bg-gray-500')
    })
  })

  describe('groupTasksByCategory', () => {
    it('should group tasks by category correctly', () => {
      const grouped = groupTasksByCategory(mockTasks)

      expect(grouped).toHaveProperty('business')
      expect(grouped).toHaveProperty('life')
      expect(grouped.business).toHaveLength(1)
      expect(grouped.life).toHaveLength(1)
      expect(grouped.business[0].title).toBe('ネットワーキング')
      expect(grouped.life[0].title).toBe('運動 (20分以上)')
    })

    it('should handle empty task list', () => {
      const grouped = groupTasksByCategory([])
      expect(Object.keys(grouped)).toHaveLength(0)
    })

    it('should handle multiple tasks in same category', () => {
      const tasksWithMultipleInSameCategory = [
        ...mockTasks,
        {
          id: 'task3',
          title: 'アイデア記録',
          categoryId: 'business',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const grouped = groupTasksByCategory(tasksWithMultipleInSameCategory)
      expect(grouped.business).toHaveLength(2)
      expect(grouped.life).toHaveLength(1)
    })
  })
})
