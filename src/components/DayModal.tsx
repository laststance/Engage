import React from 'react'
import { Modal, SafeAreaView } from 'react-native'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { Pressable } from '@/components/ui/pressable'
import { HStack } from '@/components/ui/hstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { DaySheet } from './DaySheet'
import { TaskPicker } from './TaskPicker'
import { useAppStore } from '@/src/stores/app-store'
import { Task } from '@/src/types'

interface DayModalProps {
  isVisible: boolean
  onClose: () => void
}

export const DayModal: React.FC<DayModalProps> = ({ isVisible, onClose }) => {
  const {
    selectedDate,
    categories,
    tasks,
    completions,
    entries,
    isTaskPickerVisible,
    toggleTaskCompletion,
    updateJournalEntry,
    setTaskPickerVisible,
    setPresetEditorVisible,
    addTasksToDate,
    updatePresetTasks,
    createCategory,
  } = useAppStore()

  const dayCompletions = completions[selectedDate] || []
  const dayEntry = entries[selectedDate] || null

  const handleTaskToggle = async (taskId: string) => {
    await toggleTaskCompletion(selectedDate, taskId)
  }

  const handleJournalUpdate = async (content: string) => {
    await updateJournalEntry(selectedDate, content)
  }

  const handleTaskSelectionPress = () => {
    setTaskPickerVisible(true)
  }

  const handleTaskPickerClose = () => {
    setTaskPickerVisible(false)
  }

  const handleTaskSelect = async (taskIds: string[]) => {
    await addTasksToDate(selectedDate, taskIds)
    setTaskPickerVisible(false)
  }

  const handleEditPresets = () => {
    // Keep task picker visible, it will handle the preset editor internally
  }

  const handleUpdatePresets = async (tasks: Task[]) => {
    await updatePresetTasks(tasks)
  }

  const handleCreateCategory = async (name: string) => {
    await createCategory({ name })
  }

  // Get currently selected tasks for the day (tasks that are available for completion)
  const selectedTaskIds = dayCompletions.map((c) => c.taskId)

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
            Daily Tasks
          </Text>
          <Pressable
            onPress={onClose}
            className="p-2 min-w-[44px] min-h-[44px] items-center justify-center"
            testID="day-modal-close"
            accessibilityLabel="閉じる"
            accessibilityRole="button"
          >
            <IconSymbol name="xmark" size={24} color="#666" />
          </Pressable>
        </HStack>

        {/* Day Sheet Content */}
        <DaySheet
          date={selectedDate}
          tasks={tasks}
          completions={dayCompletions}
          journalEntry={dayEntry}
          categories={categories}
          onTaskToggle={handleTaskToggle}
          onJournalUpdate={handleJournalUpdate}
          onTaskSelectionPress={handleTaskSelectionPress}
        />

        {/* Task Picker Modal */}
        <TaskPicker
          isVisible={isTaskPickerVisible}
          presetTasks={tasks}
          categories={categories}
          selectedTasks={selectedTaskIds}
          onTaskSelect={handleTaskSelect}
          onClose={handleTaskPickerClose}
          onEditPresets={handleEditPresets}
          onUpdatePresets={handleUpdatePresets}
          onCreateCategory={handleCreateCategory}
        />
      </SafeAreaView>
    </Modal>
  )
}
