import {
  getSuggestedTasks,
  groupTasksByCategory,
  calculateDayProgress,
  isTaskCompleted,
  getTaskCompletionStatus,
  validateJournalEntry,
  getJournalPlaceholder,
  hasCompletedDailyFlow,
  getMotivationalMessage,
} from '../businessLogic'
import { Task, Completion, Entry, Category } from '../../types'

// Mock data
const mockCategories: Category[] = [
  { id: 'business', name: '事業' },
  { id: 'life', name: '生活' },
  { id: 'study', name: '勉強' },
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
    title: 'スキル学習',
    categoryId: 'business',
    defaultMinutes: 30,
    archived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'task3',
    title: '運動',
    categoryId: 'life',
    defaultMinutes: 20,
    archived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'task4',
    title: '読書',
    categoryId: 'life',
    archived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

const mockCompletions: Completion[] = [
  {
    id: 'comp1',
    date: '2025-01-15',
    taskId: 'task1',
    createdAt: Date.now(),
  },
  {
    id: 'comp2',
    date: '2025-01-15',
    taskId: 'task3',
    minutes: 25,
    createdAt: Date.now(),
  },
]

const mockEntry: Entry = {
  id: 'entry1',
  date: '2025-01-15',
  note: 'Today was productive!',
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

describe('businessLogic utils', () => {
  describe('getSuggestedTasks', () => {
    it('should return 3 suggested tasks with business and life mix', () => {
      const suggestions = getSuggestedTasks(mockTasks, mockCategories)

      expect(suggestions).toHaveLength(3)
      expect(suggestions[0].categoryId).toBe('business')
      expect(suggestions[1].categoryId).toBe('life')
      expect(suggestions[2].categoryId).toBe('life')
    })

    it('should handle empty task list', () => {
      const suggestions = getSuggestedTasks([], mockCategories)
      expect(suggestions).toHaveLength(0)
    })
  })

  describe('groupTasksByCategory', () => {
    it('should group tasks by category correctly', () => {
      const groups = groupTasksByCategory(mockTasks, mockCategories)

      expect(groups.business).toHaveLength(2)
      expect(groups.life).toHaveLength(2)
      expect(groups.study).toHaveLength(0)

      expect(groups.business[0].title).toBe('ネットワーキング')
      expect(groups.life[0].title).toBe('運動')
    })
  })

  describe('calculateDayProgress', () => {
    it('should calculate progress correctly', () => {
      const progress = calculateDayProgress(
        '2025-01-15',
        mockTasks,
        mockCompletions,
        mockEntry,
        mockCategories
      )

      expect(progress.date).toBe('2025-01-15')
      expect(progress.totalTasks).toBe(4)
      expect(progress.completedTasks).toBe(2)
      expect(progress.completionRate).toBe(50)
      expect(progress.hasJournalEntry).toBe(true)

      expect(progress.categoryProgress.business.completed).toBe(1)
      expect(progress.categoryProgress.business.total).toBe(2)
      expect(progress.categoryProgress.life.completed).toBe(1)
      expect(progress.categoryProgress.life.total).toBe(2)
    })

    it('should handle day with no completions', () => {
      const progress = calculateDayProgress(
        '2025-01-16',
        mockTasks,
        [],
        null,
        mockCategories
      )

      expect(progress.completedTasks).toBe(0)
      expect(progress.completionRate).toBe(0)
      expect(progress.hasJournalEntry).toBe(false)
    })
  })

  describe('isTaskCompleted', () => {
    it('should return true for completed task', () => {
      const completed = isTaskCompleted('task1', '2025-01-15', mockCompletions)
      expect(completed).toBe(true)
    })

    it('should return false for non-completed task', () => {
      const completed = isTaskCompleted('task2', '2025-01-15', mockCompletions)
      expect(completed).toBe(false)
    })

    it('should return false for different date', () => {
      const completed = isTaskCompleted('task1', '2025-01-16', mockCompletions)
      expect(completed).toBe(false)
    })
  })

  describe('getTaskCompletionStatus', () => {
    it('should return completion status for multiple tasks', () => {
      const status = getTaskCompletionStatus(
        ['task1', 'task2', 'task3'],
        '2025-01-15',
        mockCompletions
      )

      expect(status.task1).toBe(true)
      expect(status.task2).toBe(false)
      expect(status.task3).toBe(true)
    })
  })

  describe('validateJournalEntry', () => {
    it('should validate normal journal entry', () => {
      const result = validateJournalEntry('This is a normal entry')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject too long entry', () => {
      const longEntry = 'a'.repeat(1001)
      const result = validateJournalEntry(longEntry)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'Journal entry is too long (maximum 1000 characters)'
      )
    })

    it('should accept empty entry', () => {
      const result = validateJournalEntry('')
      expect(result.isValid).toBe(true)
    })
  })

  describe('getJournalPlaceholder', () => {
    it('should return completion-specific placeholder', () => {
      const placeholder = getJournalPlaceholder(true)
      expect(placeholder).toBe(
        '今日達成したことについて振り返ってみましょう...'
      )
    })

    it('should return default placeholder', () => {
      const placeholder = getJournalPlaceholder(false)
      expect(placeholder).toBe('日記を書いてみましょう...')
    })
  })

  describe('hasCompletedDailyFlow', () => {
    it('should return true when both tasks and journal are completed', () => {
      const completed = hasCompletedDailyFlow(
        '2025-01-15',
        mockCompletions,
        mockEntry
      )
      expect(completed).toBe(true)
    })

    it('should return false when no tasks completed', () => {
      const completed = hasCompletedDailyFlow('2025-01-16', [], mockEntry)
      expect(completed).toBe(false)
    })

    it('should return false when no journal entry', () => {
      const completed = hasCompletedDailyFlow(
        '2025-01-15',
        mockCompletions,
        null
      )
      expect(completed).toBe(false)
    })

    it('should return false when journal entry is empty', () => {
      const emptyEntry = { ...mockEntry, note: '' }
      const completed = hasCompletedDailyFlow(
        '2025-01-15',
        mockCompletions,
        emptyEntry
      )
      expect(completed).toBe(false)
    })
  })

  describe('getMotivationalMessage', () => {
    it('should return start message for no completions', () => {
      const progress = calculateDayProgress(
        '2025-01-16',
        mockTasks,
        [],
        null,
        mockCategories
      )
      const message = getMotivationalMessage(progress)
      expect(message).toBe('タスクを選んで今日を始めましょう！')
    })

    it('should return perfect day message for 100% completion with journal', () => {
      const allCompletions: Completion[] = [
        {
          id: 'c1',
          date: '2025-01-15',
          taskId: 'task1',
          createdAt: Date.now(),
        },
        {
          id: 'c2',
          date: '2025-01-15',
          taskId: 'task2',
          createdAt: Date.now(),
        },
        {
          id: 'c3',
          date: '2025-01-15',
          taskId: 'task3',
          createdAt: Date.now(),
        },
        {
          id: 'c4',
          date: '2025-01-15',
          taskId: 'task4',
          createdAt: Date.now(),
        },
      ]
      const progress = calculateDayProgress(
        '2025-01-15',
        mockTasks,
        allCompletions,
        mockEntry,
        mockCategories
      )
      const message = getMotivationalMessage(progress)
      expect(message).toBe('素晴らしい！今日も完璧な一日でした！')
    })

    it('should return journal reminder for 100% completion without journal', () => {
      const allCompletions: Completion[] = [
        {
          id: 'c1',
          date: '2025-01-15',
          taskId: 'task1',
          createdAt: Date.now(),
        },
        {
          id: 'c2',
          date: '2025-01-15',
          taskId: 'task2',
          createdAt: Date.now(),
        },
        {
          id: 'c3',
          date: '2025-01-15',
          taskId: 'task3',
          createdAt: Date.now(),
        },
        {
          id: 'c4',
          date: '2025-01-15',
          taskId: 'task4',
          createdAt: Date.now(),
        },
      ]
      const progress = calculateDayProgress(
        '2025-01-15',
        mockTasks,
        allCompletions,
        null,
        mockCategories
      )
      const message = getMotivationalMessage(progress)
      expect(message).toBe('タスク完了！日記を書いて一日を振り返りましょう')
    })

    it('should return encouragement for partial completion', () => {
      const progress = calculateDayProgress(
        '2025-01-15',
        mockTasks,
        mockCompletions,
        mockEntry,
        mockCategories
      )
      const message = getMotivationalMessage(progress)
      expect(message).toBe('順調に進んでいます！この調子で続けましょう')
    })
  })
})
