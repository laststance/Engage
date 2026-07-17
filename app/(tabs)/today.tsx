import React from 'react'
import { useTranslation } from 'react-i18next'
import { AppScreen } from '@/src/components/AppScreen'
import { DaySheet } from '@/src/components/DaySheet'
import { TaskPicker } from '@/src/components/TaskPicker'
import { PresetTaskEditor } from '@/src/components/PresetTaskEditor'
import { TodayScreenErrorBoundary } from '@/src/components/TodayScreenErrorBoundary'
import { useAppStore } from '@/src/stores/app-store'
import { Task } from '@/src/types'
import { useDayView } from '@/src/hooks/useDayView'
import { formatDate } from '@/src/utils/dateUtils'

/**
 * Renders today's assigned habits whenever the Today tab is active.
 * @returns The Today task, journal, picker, and preset-editor experience.
 * @example
 * <TodayScreen />
 */
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

  return (
    <TodayScreenErrorBoundary
      errorMessage={t('today.errorLoading')}
      retryLabel={t('common.retry')}
      title={t('today.title')}
    >
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
    </TodayScreenErrorBoundary>
  )
}
