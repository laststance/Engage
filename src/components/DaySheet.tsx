import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { HStack } from '@/components/ui/hstack'
import { VStack } from '@/components/ui/vstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { JournalInput } from './JournalInput'
import { AppPressable } from './AppPressable'
import {
  Task,
  Entry,
  Completion,
  Category,
  TaskCompletionOperationResult,
} from '@/src/types'
import i18n, { getCategoryDisplayName } from '@/src/i18n/config'
import { parseDate } from '@/src/utils/dateUtils'
import { groupTasksByCategory } from '@/src/utils/businessLogic'
import { COMPLETION_FEEDBACK_DURATION_MS } from '@/src/constants/interaction'
import { useInteractionFeedback } from '@/src/hooks/useInteractionFeedback'

interface DaySheetProps {
  date: string
  tasks: Task[]
  completions: Completion[]
  journalEntry: Entry | null
  categories: Category[]
  onTaskToggle: (taskId: string) => Promise<TaskCompletionOperationResult>
  onJournalUpdate: (content: string) => Promise<void>
  onTaskSelectionPress: () => void
}

type DaySheetTaskFeedback = {
  kind: 'completed' | 'undone' | 'error'
  taskId: string
  title: string
}

type DaySheetDateFormatValues = {
  month: number | string
  day: number
  dayOfWeek: string
}

type TranslateDaySheetDate = (
  key: string,
  values: DaySheetDateFormatValues
) => string

const JAPANESE_LANGUAGE_PREFIX = 'ja'
const MONTH_INDEX_OFFSET = 1

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
  const { t } = useTranslation()
  const formattedDate = formatDaySheetDate(date, i18n.language, t)
  const triggerFeedback = useInteractionFeedback()
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTaskIdRef = useRef<string | null>(null)
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)
  const [taskFeedback, setTaskFeedback] =
    useState<DaySheetTaskFeedback | null>(null)

  const completedTaskIds = useMemo(
    () => new Set(
      completions.filter((c) => c.completed).map((c) => c.taskId)
    ),
    [completions]
  )

  const tasksByCategory = useMemo(
    () => groupTasksByCategory(tasks, categories),
    [categories, tasks]
  )
  const visibleTaskGroups = useMemo(
    () => Object.entries(tasksByCategory).filter(
      ([, categoryTasks]) => categoryTasks.length > 0
    ),
    [tasksByCategory]
  )

  useEffect(() => {
    setTaskFeedback(null)
    pendingTaskIdRef.current = null
    setPendingTaskId(null)

    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current)
      }
    }
  }, [date])

  const showTaskFeedback = useCallback(
    (feedback: DaySheetTaskFeedback, shouldAutoClear: boolean) => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current)
      }

      setTaskFeedback(feedback)

      if (shouldAutoClear) {
        feedbackTimeoutRef.current = setTimeout(() => {
          setTaskFeedback(null)
        }, COMPLETION_FEEDBACK_DURATION_MS)
      }
    },
    []
  )

  const handleTaskToggle = useCallback(
    async (task: Task) => {
      if (pendingTaskIdRef.current) {
        return
      }

      pendingTaskIdRef.current = task.id
      setPendingTaskId(task.id)

      try {
        const result = await onTaskToggle(task.id)

        if (result.success) {
          showTaskFeedback(
            {
              kind: result.change,
              taskId: task.id,
              title: task.title,
            },
            true
          )
          return
        }

        triggerFeedback('error')
        showTaskFeedback(
          {
            kind: 'error',
            taskId: task.id,
            title: task.title,
          },
          false
        )
      } catch (error) {
        console.error('Failed to toggle task:', error)
        triggerFeedback('error')
        showTaskFeedback(
          {
            kind: 'error',
            taskId: task.id,
            title: task.title,
          },
          false
        )
      } finally {
        pendingTaskIdRef.current = null
        setPendingTaskId(null)
      }
    },
    [onTaskToggle, showTaskFeedback, triggerFeedback]
  )

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
    if (category.id === 'business') return 'bg-blue-500'
    if (category.id === 'life') return 'bg-green-500'

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

  return (
    <Box className="flex-1 bg-white" testID="day-sheet">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <VStack space="lg" className="p-4">
          {/* Header */}
          <VStack space="sm">
            <Text
              className="text-2xl font-bold text-gray-800"
              testID="day-sheet-date"
            >
              {formattedDate}
            </Text>

            <AppPressable
              onPress={onTaskSelectionPress}
              feedback="select"
              className="bg-blue-50 border border-blue-200 rounded-lg p-4"
              pressedClassName="bg-blue-100"
              testID="task-selection-button"
              accessibilityLabel={t('daySheet.chooseTodaysHabits')}
              accessibilityRole="button"
            >
              <HStack className="items-center justify-between">
                <Text className="text-blue-600 font-medium">
                  {t('daySheet.selectTasks')}
                </Text>
                <IconSymbol name="plus.circle" size={24} color="#2563eb" />
              </HStack>
            </AppPressable>
          </VStack>

          {taskFeedback && (
            <Box
              className={`rounded-lg border p-3 ${
                taskFeedback.kind === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
              }`}
              testID="task-feedback"
            >
              <HStack className="items-center justify-between" space="sm">
                <Text
                  className={`flex-1 text-sm ${
                    taskFeedback.kind === 'error'
                      ? 'text-red-700'
                      : 'text-green-700'
                  }`}
                >
                  {taskFeedback.kind === 'completed' &&
                    t('daySheet.taskCompleted', {
                      title: taskFeedback.title,
                    })}
                  {taskFeedback.kind === 'undone' &&
                    t('daySheet.taskCompletionUndone', {
                      title: taskFeedback.title,
                    })}
                  {taskFeedback.kind === 'error' &&
                    t('daySheet.taskCompletionFailed')}
                </Text>

                {taskFeedback.kind === 'error' && (
                  <AppPressable
                    onPress={() => {
                      const retryTask = tasks.find(
                        (task) => task.id === taskFeedback.taskId
                      )

                      if (retryTask) {
                        void handleTaskToggle(retryTask)
                      }
                    }}
                    feedback="select"
                    className="px-3 py-2 rounded-md bg-red-100"
                    pressedClassName="bg-red-200"
                    testID="task-feedback-retry"
                    accessibilityRole="button"
                  >
                    <Text className="text-red-700 text-sm font-semibold">
                      {t('daySheet.retry')}
                    </Text>
                  </AppPressable>
                )}
              </HStack>
            </Box>
          )}

          {visibleTaskGroups.length > 0 ? (
            <VStack space="md">
              {visibleTaskGroups.map(([categoryId, categoryTasks]) => {
                const category = categories.find((c) => c.id === categoryId)
                const progress = getCategoryProgress(categoryId)
                const categoryColor = getCategoryColor(categoryId)

                return (
                  <VStack key={categoryId} space="sm">
                    <HStack className="items-center justify-between">
                      <HStack className="items-center" space="sm">
                        <Box
                          className={`w-3 h-3 rounded-full ${categoryColor}`}
                        />
                        <Text className="font-semibold text-gray-800">
                          {category
                            ? getCategoryDisplayName(category)
                            : 'Unknown Category'}
                        </Text>
                      </HStack>
                      <Text className="text-sm text-gray-500">
                        {progress.completed}/{progress.total}
                      </Text>
                    </HStack>

                    <VStack space="xs">
                      {categoryTasks.map((task) => {
                        const isCompleted = completedTaskIds.has(task.id)

                        return (
                          <AppPressable
                            key={task.id}
                            onPress={() => {
                              void handleTaskToggle(task)
                            }}
                            feedback={isCompleted ? 'undo' : 'complete'}
                            checked={isCompleted}
                            busy={pendingTaskId === task.id}
                            disabled={Boolean(pendingTaskId)}
                            className="flex-row items-center py-3 px-3 bg-gray-50 rounded-lg min-h-[44px]"
                            pressedClassName="bg-gray-100"
                            testID={`task-item-${task.id}`}
                            accessibilityLabel={`${task.title}${
                              completedTaskIds.has(task.id)
                                ? ` ${t('daySheet.completed')}`
                                : ` ${t('daySheet.notCompleted')}`
                            }`}
                            accessibilityRole="checkbox"
                          >
                            <HStack className="items-center flex-1" space="sm">
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
                          </AppPressable>
                        )
                      })}
                    </VStack>
                  </VStack>
                )
              })}
            </VStack>
          ) : (
            <Box className="p-8 items-center">
              <Text className="text-gray-500 text-center mb-4">
                {t('daySheet.noTasksMessage')}
              </Text>
              <AppPressable
                onPress={onTaskSelectionPress}
                feedback="select"
                className="bg-blue-600 rounded-lg px-5 py-3"
                pressedClassName="bg-blue-700"
                testID="empty-task-selection-button"
                accessibilityRole="button"
              >
                <Text className="text-white font-semibold">
                  {t('daySheet.chooseTodaysHabits')}
                </Text>
              </AppPressable>
            </Box>
          )}

          <JournalInput
            date={date}
            entry={journalEntry}
            onUpdate={onJournalUpdate}
          />
        </VStack>
      </ScrollView>
    </Box>
  )
}

/**
 * Formats the date label shown at the top of the day sheet.
 * @param dateString - Local calendar date in YYYY-MM-DD format.
 * @param language - Active i18n language code.
 * @param translate - Translation function used to apply the locale template.
 * @returns
 * - Japanese: numeric month/day with a narrow weekday, such as "5月6日 (水)".
 * - English: short weekday/month names, such as "Wed, May 6".
 * @example
 * formatDaySheetDate(
 *   '2026-05-06',
 *   'en',
 *   (_key, values) => `${values.dayOfWeek}, ${values.month} ${values.day}`
 * ) // => 'Wed, May 6'
 */
const formatDaySheetDate = (
  dateString: string,
  language: string,
  translate: TranslateDaySheetDate
): string => {
  const dateObj = parseDate(dateString)
  const usesJapaneseDateParts = language.startsWith(JAPANESE_LANGUAGE_PREFIX)
  const day = dateObj.getDate()
  const dayOfWeek = new Intl.DateTimeFormat(language, {
    weekday: usesJapaneseDateParts ? 'narrow' : 'short',
  }).format(dateObj)
  const month = usesJapaneseDateParts
    ? dateObj.getMonth() + MONTH_INDEX_OFFSET
    : new Intl.DateTimeFormat(language, { month: 'short' }).format(dateObj)

  return translate('daySheet.dateFormat', { month, day, dayOfWeek })
}
