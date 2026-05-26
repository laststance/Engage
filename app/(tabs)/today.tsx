import React from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { AppScreen } from '@/src/components/AppScreen'
import { DaySheet } from '@/src/components/DaySheet'
import { TaskPicker } from '@/src/components/TaskPicker'
import { PresetTaskEditor } from '@/src/components/PresetTaskEditor'
import { useAppStore } from '@/src/stores/app-store'
import { Task } from '@/src/types'
import { useDayView } from '@/src/hooks/useDayView'
import { formatDate } from '@/src/utils/dateUtils'

export default function TodayScreen() {
  const { t } = useTranslation()
  const isPresetEditorVisible = useAppStore(
    (state) => state.isPresetEditorVisible,
  )

  const setPresetEditorVisible = useAppStore((state) => state.setPresetEditorVisible)

  const today = formatDate(new Date())
  const day = useDayView(today)

  // Close TaskPicker first, then show PresetEditor at TodayScreen level
  // to avoid iOS triple-nested Modal issue
  const handleEditPresets = () => {
    day.handleTaskPickerClose()
    setPresetEditorVisible(true)
  }

  const handlePresetEditorSave = async (tasks: Task[]) => {
    await day.handleUpdatePresets(tasks)
    setPresetEditorVisible(false)
  }

  const handlePresetEditorCancel = () => {
    setPresetEditorVisible(false)
  }

  try {
    return (
      <AppScreen
        description={t('today.description')}
        descriptionTestID="today-description"
        testID="today-screen"
        title={t('today.title')}
        titleTestID="today-title"
      >
        <DaySheet
          date={today}
          tasks={day.assignedTasks}
          completions={day.dayCompletions}
          journalEntry={day.dayEntry}
          categories={day.categories}
          onTaskToggle={day.handleTaskToggle}
          onJournalUpdate={day.handleJournalUpdate}
          onTaskSelectionPress={day.handleTaskSelectionPress}
        />

        <TaskPicker
          isVisible={day.isTaskPickerVisible}
          presetTasks={day.allTasks}
          categories={day.categories}
          selectedTasks={day.selectedTaskIds}
          onTaskSelect={day.handleTaskSelect}
          onClose={day.handleTaskPickerClose}
          onEditPresets={handleEditPresets}
        />

        {/* Preset Editor rendered at TodayScreen level (not inside TaskPicker) */}
        <PresetTaskEditor
          isVisible={isPresetEditorVisible}
          tasks={day.allTasks}
          categories={day.categories}
          onSave={handlePresetEditorSave}
          onCancel={handlePresetEditorCancel}
          onCreateCategory={day.handleCreateCategory}
        />
      </AppScreen>
    )
  } catch (error) {
    console.error('TodayScreen: Render error', error)
    return (
      <AppScreen testID="today-screen" title={t('today.title')}>
        <VStack className="flex-1 justify-center items-center p-4">
          <Text className="text-red-600 text-center">
            {t('today.errorLoading')}
          </Text>
          <Text className="text-gray-600 text-center text-sm mt-2">
            {error?.toString()}
          </Text>
        </VStack>
      </AppScreen>
    )
  }
}
