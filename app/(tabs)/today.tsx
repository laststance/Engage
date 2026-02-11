import React, { useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { DaySheet } from '@/src/components/DaySheet'
import { TaskPicker } from '@/src/components/TaskPicker'
import { useAppStore } from '@/src/stores/app-store'
import { Task } from '@/src/types'
import { formatDate } from '@/src/utils/dateUtils'

export default function TodayScreen() {
  console.log('TodayScreen: Component rendering')

  const {
    selectedDate,
    categories,
    tasks,
    completions,
    entries,
    isTaskPickerVisible,
    selectDate,
    toggleTaskCompletion,
    updateJournalEntry,
    setTaskPickerVisible,
    setPresetEditorVisible,
    addTasksToDate,
    updatePresetTasks,
    createCategory,
  } = useAppStore()

  // Get today's date in YYYY-MM-DD format (local timezone)
  const today = formatDate(new Date())

  console.log('TodayScreen: Today date is', today)

  // Ensure today's date is selected when component mounts
  useEffect(() => {
    console.log('TodayScreen: useEffect - Setting date to', today)
    if (selectedDate !== today) {
      selectDate(today)
    }
  }, [today, selectedDate, selectDate])

  const dayCompletions = completions[today] || []
  const dayEntry = entries[today] || null

  // Get tasks for today (all tasks that have completions for today, regardless of completion status)
  // If no completions exist for today, show empty task list (DaySheet will show task selection button)
  const todayTaskIds = new Set(dayCompletions.map((c) => c.taskId))
  const todayTasks = tasks.filter((task) => todayTaskIds.has(task.id))

  console.log('TodayScreen: Render data', {
    today,
    selectedDate,
    dayCompletions: dayCompletions.length,
    todayTasks: todayTasks.length,
    totalTasks: tasks.length,
    categories: categories.length,
  })

  const handleTaskToggle = async (taskId: string) => {
    console.log('TodayScreen: Toggle task', taskId)
    await toggleTaskCompletion(today, taskId)
  }

  const handleJournalUpdate = async (content: string) => {
    console.log('TodayScreen: Update journal', content)
    await updateJournalEntry(today, content)
  }

  const handleTaskSelectionPress = () => {
    console.log('TodayScreen: Task selection pressed')
    setTaskPickerVisible(true)
  }

  const handleTaskPickerClose = () => {
    console.log('TodayScreen: Task picker close')
    setTaskPickerVisible(false)
  }

  const handleTaskSelection = async (taskIds: string[]) => {
    console.log('TodayScreen: Task selection', taskIds)
    await addTasksToDate(today, taskIds)
    setTaskPickerVisible(false)
  }

  const handleEditPresets = () => {
    console.log('TodayScreen: Edit presets')
    setTaskPickerVisible(false)
    setPresetEditorVisible(true)
  }

  const handlePresetUpdate = async (updatedTasks: Task[]) => {
    console.log('TodayScreen: Preset update', updatedTasks.length)
    await updatePresetTasks(updatedTasks)
  }

  const handleCategoryCreate = async (name: string) => {
    console.log('TodayScreen: Category create', name)
    await createCategory({ name })
  }

  // Add error boundary
  try {
    const insets = useSafeAreaInsets()

    return (
      <Box className="flex-1 bg-white" testID="today-screen">
        <VStack className="flex-1" style={{ paddingTop: insets.top }}>
          <Box className="px-4 pt-4 pb-2">
            <Text 
              className="text-2xl font-bold text-gray-800 text-center mb-2"
              testID="today-title"
            >
              Today
            </Text>
            <Text
              className="text-gray-600 text-center text-sm"
              testID="today-description"
            >
              今日のタスクと振り返りを管理しましょう
            </Text>
          </Box>

          <DaySheet
            date={today}
            tasks={todayTasks}
            completions={dayCompletions}
            journalEntry={dayEntry}
            categories={categories}
            onTaskToggle={handleTaskToggle}
            onJournalUpdate={handleJournalUpdate}
            onTaskSelectionPress={handleTaskSelectionPress}
          />
        </VStack>

        <TaskPicker
          isVisible={isTaskPickerVisible}
          presetTasks={tasks}
          categories={categories}
          selectedTasks={todayTasks.map((t) => t.id)}
          onTaskSelect={handleTaskSelection}
          onClose={handleTaskPickerClose}
          onEditPresets={handleEditPresets}
          onUpdatePresets={handlePresetUpdate}
          onCreateCategory={handleCategoryCreate}
        />
      </Box>
    )
  } catch (error) {
    console.error('TodayScreen: Render error', error)
    return (
      <Box className="flex-1 bg-white" testID="today-screen">
        <VStack className="flex-1 justify-center items-center p-4">
          <Text className="text-red-600 text-center">
            Error loading Today screen
          </Text>
          <Text className="text-gray-600 text-center text-sm mt-2">
            {error?.toString()}
          </Text>
        </VStack>
      </Box>
    )
  }
}
