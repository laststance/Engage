import React from 'react'
import { useTranslation } from 'react-i18next'
import { AppScreen } from '@/src/components/AppScreen'
import { DaySheet } from '@/src/components/DaySheet'
import { TaskPicker } from '@/src/components/TaskPicker'
import { PresetTaskEditor } from '@/src/components/PresetTaskEditor'
import { TodayScreenErrorBoundary } from '@/src/components/TodayScreenErrorBoundary'
import { useAppStore } from '@/src/stores/app-store'
import type { Task } from '@/src/types'
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

  return (
    <TodayScreenErrorBoundary
      errorMessage={t('today.errorLoading')}
      retryLabel={t('common.retry')}
      title={t('today.title')}
    >
      <TodayScreenContent />
    </TodayScreenErrorBoundary>
  )
}

/**
 * Loads and renders Today state inside its error boundary whenever the Today tab mounts.
 * @returns The Today task, journal, picker, and preset-editor content.
 * @example
 * <TodayScreenContent />
 */
function TodayScreenContent() {
  const { t } = useTranslation()
  const isPresetEditorVisible = useAppStore(
    (state) => state.isPresetEditorVisible,
  )
  const setPresetEditorVisible = useAppStore(
    (state) => state.setPresetEditorVisible,
  )

  const today = formatDate(new Date())
  const day = useDayView(today)

  /**
   * Replaces the task picker with the preset editor when the user selects Edit Presets.
   * @returns Nothing; the two modal visibility states are updated in sequence.
   * @example
   * handleEditPresets() // => closes TaskPicker, then opens PresetTaskEditor
   */
  const handleEditPresets = () => {
    // Close the picker first so iOS never receives a third nested modal.
    day.handleTaskPickerClose()
    setPresetEditorVisible(true)
  }

  /**
   * Persists edited presets and closes the editor after its Save action succeeds.
   * @param tasks - The complete preset task list submitted by PresetTaskEditor.
   * @returns A promise that settles after presets are stored and the editor closes.
   * @example
   * await handlePresetEditorSave(updatedTasks)
   */
  const handlePresetEditorSave = async (tasks: Task[]) => {
    await day.handleUpdatePresets(tasks)
    setPresetEditorVisible(false)
  }

  /**
   * Closes the preset editor when the user cancels without persisting its draft.
   * @returns Nothing; only preset-editor visibility changes.
   * @example
   * handlePresetEditorCancel() // => closes PresetTaskEditor
   */
  const handlePresetEditorCancel = () => {
    setPresetEditorVisible(false)
  }

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

      {/* Keep the editor beside TaskPicker so iOS receives at most two nested modals. */}
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
}
