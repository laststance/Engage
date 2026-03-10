import React from 'react'
import { Modal, SafeAreaView } from 'react-native'
import { Text } from '@/components/ui/text'
import { Pressable } from '@/components/ui/pressable'
import { HStack } from '@/components/ui/hstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { DaySheet } from './DaySheet'
import { TaskPicker } from './TaskPicker'
import { useAppStore } from '@/src/stores/app-store'
import { useDayView } from '@/src/hooks/useDayView'

interface DayModalProps {
  isVisible: boolean
  onClose: () => void
}

export const DayModal: React.FC<DayModalProps> = ({ isVisible, onClose }) => {
  const selectedDate = useAppStore((state) => state.selectedDate)
  const day = useDayView(selectedDate)

  const handleEditPresets = () => {
    // Keep task picker visible, it will handle the preset editor internally
  }

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
          tasks={day.assignedTasks}
          completions={day.dayCompletions}
          journalEntry={day.dayEntry}
          categories={day.categories}
          onTaskToggle={day.handleTaskToggle}
          onJournalUpdate={day.handleJournalUpdate}
          onTaskSelectionPress={day.handleTaskSelectionPress}
        />

        {/* Task Picker Modal */}
        <TaskPicker
          isVisible={day.isTaskPickerVisible}
          presetTasks={day.allTasks}
          categories={day.categories}
          selectedTasks={day.selectedTaskIds}
          onTaskSelect={day.handleTaskSelect}
          onClose={day.handleTaskPickerClose}
          onEditPresets={handleEditPresets}
          onUpdatePresets={day.handleUpdatePresets}
          onCreateCategory={day.handleCreateCategory}
        />
      </SafeAreaView>
    </Modal>
  )
}
