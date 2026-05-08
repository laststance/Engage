import React from 'react'
import { ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { Pressable } from '@/components/ui/pressable'
import { HStack } from '@/components/ui/hstack'
import { VStack } from '@/components/ui/vstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { JournalInput } from './JournalInput'
import { Task, Entry, Completion, Category } from '@/src/types'
import i18n, { getCategoryDisplayName } from '@/src/i18n/config'
import { parseDate } from '@/src/utils/dateUtils'
import { groupTasksByCategory } from '@/src/utils/businessLogic'

interface DaySheetProps {
  date: string
  tasks: Task[]
  completions: Completion[]
  journalEntry: Entry | null
  categories: Category[]
  onTaskToggle: (taskId: string) => void
  onJournalUpdate: (content: string) => Promise<void>
  onTaskSelectionPress: () => void
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

  const completedTaskIds = new Set(
    completions.filter((c) => c.completed).map((c) => c.taskId)
  )

  const tasksByCategory = groupTasksByCategory(tasks, categories)

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

          {/* Task Selection Button */}
          <Pressable
            onPress={onTaskSelectionPress}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
            testID="task-selection-button"
          >
            <HStack className="items-center justify-between">
              <Text className="text-blue-600 font-medium">{t('daySheet.selectTasks')}</Text>
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
                          {category ? getCategoryDisplayName(category) : 'Unknown Category'}
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
                            className="flex-row items-center py-3 px-3 bg-gray-50 rounded-lg min-h-[44px]"
                            testID={`task-item-${task.id}`}
                            accessibilityLabel={`${task.title}${completedTaskIds.has(task.id) ? ` ${t('daySheet.completed')}` : ` ${t('daySheet.notCompleted')}`}`}
                            accessibilityRole="button"
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
              {t('daySheet.noTasksMessage')}
            </Text>
          </Box>
        )}

        {/* Journal Section */}
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
