import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, SafeAreaView } from 'react-native'
import { Text } from '@/components/ui/text'
import { Pressable } from '@/components/ui/pressable'
import { HStack } from '@/components/ui/hstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { DaySheet } from './DaySheet'
import { TaskPicker } from './TaskPicker'
import { PresetTaskEditor } from './PresetTaskEditor'
import { useAppStore } from '@/src/stores/app-store'
import { useDayView } from '@/src/hooks/useDayView'
import { Task } from '@/src/types'

interface DayModalProps {
  isVisible: boolean
  onClose: () => void
}

export const DayModal: React.FC<DayModalProps> = ({ isVisible, onClose }) => {
  const { t } = useTranslation()
  const selectedDate = useAppStore((state) => state.selectedDate)
  const day = useDayView(selectedDate)
  const [isPresetEditorVisible, setIsPresetEditorVisible] = useState(false)

  const { handleTaskPickerClose, handleUpdatePresets } = day

  // Close TaskPicker first, then show PresetEditor at DayModal level
  // to avoid iOS triple-nested Modal issue (DayModal → TaskPicker → PresetEditor)
  const handleEditPresets = useCallback(() => {
    handleTaskPickerClose()
    setIsPresetEditorVisible(true)
  }, [handleTaskPickerClose])

  const handlePresetEditorSave = useCallback(async (tasks: Task[]) => {
    await handleUpdatePresets(tasks)
    setIsPresetEditorVisible(false)
  }, [handleUpdatePresets])

  const handlePresetEditorCancel = useCallback(() => {
    setIsPresetEditorVisible(false)
  }, [])

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <HStack className="items-center justify-between p-4 border-b border-gray-200">
          <Text className="text-lg font-semibold text-gray-800">
            {t('dayModal.title')}
          </Text>
          <Pressable
            onPress={onClose}
            className="p-2 min-w-[44px] min-h-[44px] items-center justify-center"
            testID="day-modal-close"
            accessibilityLabel={t('common.close')}
            accessibilityRole="button"
          >
            <IconSymbol name="xmark" size={24} color="#666" />
          </Pressable>
        </HStack>

        {/* Day Sheet Content */}
        <DaySheet
          date={selectedDate}
          tasks={day.assignedTasks}
          completions={day.dayCompletions}
          journalEntry={day.dayEntry}
          categories={day.categories}
          onTaskToggle={day.handleTaskToggle}
          onJournalUpdate={day.handleJournalUpdate}
          onTaskSelectionPress={day.handleTaskSelectionPress}
        />

        {/* Task Picker Modal (2nd modal level) */}
        <TaskPicker
          isVisible={day.isTaskPickerVisible}
          presetTasks={day.allTasks}
          categories={day.categories}
          selectedTasks={day.selectedTaskIds}
          onTaskSelect={day.handleTaskSelect}
          onClose={day.handleTaskPickerClose}
          onEditPresets={handleEditPresets}
        />

        {/* Preset Editor rendered at DayModal level (2nd modal, not 3rd) */}
        <PresetTaskEditor
          isVisible={isPresetEditorVisible}
          tasks={day.allTasks}
          categories={day.categories}
          onSave={handlePresetEditorSave}
          onCancel={handlePresetEditorCancel}
          onCreateCategory={day.handleCreateCategory}
        />
      </SafeAreaView>
    </Modal>
  )
}
