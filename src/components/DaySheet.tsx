import React from 'react'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { Pressable } from '@/components/ui/pressable'
import { HStack } from '@/components/ui/hstack'
import { VStack } from '@/components/ui/vstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { JournalInput } from './JournalInput'
import { Task, Entry, Completion, Category } from '@/src/types'
import { useAppStore } from '@/src/stores/app-store'

interface DaySheetProps {
  date: string
  tasks: Task[]
  completions: Completion[]
  journalEntry: Entry | null
  categories: Category[]
  onTaskToggle: (taskId: string) => void
  onJournalUpdate: (content: string) => void
  onTaskSelectionPress: () => void
}

export const DaySheet: React.FC<DaySheetProps> = ({
  date,
  tasks,
  completions,
  journalEntry,
  categories,
  onTaskToggle,
  onJournalUpdate,
  onTaskSelectionPress,
}) => {
  const { getJournalPlaceholder } = useAppStore()

  // Create a map of completed task IDs for quick lookup
  const completedTaskIds = new Set(completions.map((c) => c.taskId))

  // Group tasks by category
  const tasksByCategory = tasks.reduce((acc, task) => {
    if (!acc[task.categoryId]) {
      acc[task.categoryId] = []
    }
    acc[task.categoryId].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  // Calculate progress for each category
  const getCategoryProgress = (categoryId: string) => {
    const categoryTasks = tasksByCategory[categoryId] || []
    const completedCount = categoryTasks.filter((task) =>
      completedTaskIds.has(task.id)
    ).length
    return {
      completed: completedCount,
      total: categoryTasks.length,
    }
  }

  // Get category color
  const getCategoryColor = (categoryId: string) => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
    return `${month}月${day}日 (${dayOfWeek})`
  }

  // Get dynamic placeholder text based on completion status
  const hasCompletions = completions.length > 0
  const placeholder = getJournalPlaceholder(date)

  return (
    <Box className="flex-1 bg-white" testID="day-sheet">
      <VStack space="lg" className="p-4">
        {/* Header */}
        <VStack space="sm">
          <Text
            className="text-2xl font-bold text-gray-800"
            testID="day-sheet-date"
          >
            {formatDate(date)}
          </Text>

          {/* Task Selection Button */}
          <Pressable
            onPress={onTaskSelectionPress}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
            testID="task-selection-button"
          >
            <HStack className="items-center justify-between">
              <Text className="text-blue-600 font-medium">タスクを選択</Text>
              <IconSymbol name="plus.circle" size={24} color="#2563eb" />
            </HStack>
          </Pressable>
        </VStack>

        {/* Tasks by Category */}
        {Object.keys(tasksByCategory).length > 0 ? (
          <VStack space="md">
            {Object.entries(tasksByCategory).map(
              ([categoryId, categoryTasks]) => {
                const category = categories.find((c) => c.id === categoryId)
                const progress = getCategoryProgress(categoryId)
                const categoryColor = getCategoryColor(categoryId)

                return (
                  <VStack key={categoryId} space="sm">
                    {/* Category Header */}
                    <HStack className="items-center justify-between">
                      <HStack className="items-center" space="sm">
                        <Box
                          className={`w-3 h-3 rounded-full ${categoryColor}`}
                        />
                        <Text className="font-semibold text-gray-800">
                          {category?.name || 'Unknown Category'}
                        </Text>
                      </HStack>
                      <Text className="text-sm text-gray-500">
                        {progress.completed}/{progress.total}
                      </Text>
                    </HStack>

                    {/* Tasks in Category */}
                    <VStack space="xs">
                      {categoryTasks.map((task) => {
                        const isCompleted = completedTaskIds.has(task.id)

                        return (
                          <Pressable
                            key={task.id}
                            onPress={() => onTaskToggle(task.id)}
                            className="flex-row items-center p-3 bg-gray-50 rounded-lg"
                            testID={`task-item-${task.id}`}
                          >
                            <HStack className="items-center flex-1" space="sm">
                              {/* Checkbox */}
                              <Box
                                className={`
                                w-6 h-6 rounded-full border-2 items-center justify-center
                                ${
                                  isCompleted
                                    ? `${categoryColor} border-transparent`
                                    : 'border-gray-300 bg-white'
                                }
                              `}
                              >
                                {isCompleted && (
                                  <IconSymbol
                                    name="checkmark"
                                    size={16}
                                    color="white"
                                  />
                                )}
                              </Box>

                              {/* Task Title */}
                              <Text
                                className={`
                                flex-1 ${
                                  isCompleted
                                    ? 'text-gray-500 line-through'
                                    : 'text-gray-800'
                                }
                              `}
                              >
                                {task.title}
                              </Text>
                            </HStack>
                          </Pressable>
                        )
                      })}
                    </VStack>
                  </VStack>
                )
              }
            )}
          </VStack>
        ) : (
          <Box className="p-8 items-center">
            <Text className="text-gray-500 text-center">
              タスクを選択してください
            </Text>
          </Box>
        )}

        {/* Journal Section */}
        <JournalInput
          date={date}
          entry={journalEntry}
          onUpdate={onJournalUpdate}
          placeholder={placeholder}
        />
      </VStack>
    </Box>
  )
}
