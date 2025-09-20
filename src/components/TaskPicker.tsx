import React, { useState } from 'react'
import { Modal, SafeAreaView, ScrollView } from 'react-native'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { Pressable } from '@/components/ui/pressable'
import { HStack } from '@/components/ui/hstack'
import { VStack } from '@/components/ui/vstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { Task, Category } from '@/src/types'
import { PresetTaskEditor } from './PresetTaskEditor'

interface TaskPickerProps {
  isVisible: boolean
  presetTasks: Task[]
  categories: Category[]
  selectedTasks: string[]
  onTaskSelect: (taskIds: string[]) => void
  onClose: () => void
  onEditPresets: () => void
  onUpdatePresets: (tasks: Task[]) => Promise<void>
  onCreateCategory: (name: string) => Promise<void>
}

export const TaskPicker: React.FC<TaskPickerProps> = ({
  isVisible,
  presetTasks,
  categories,
  selectedTasks,
  onTaskSelect,
  onClose,
  onEditPresets,
  onUpdatePresets,
  onCreateCategory,
}) => {
  const [localSelectedTasks, setLocalSelectedTasks] =
    useState<string[]>(selectedTasks)
  const [isPresetEditorVisible, setIsPresetEditorVisible] = useState(false)

  // Group tasks by category
  const tasksByCategory = presetTasks.reduce((acc, task) => {
    if (!acc[task.categoryId]) {
      acc[task.categoryId] = []
    }
    acc[task.categoryId].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  // Get category color using design system
  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return 'bg-system-gray'

    // Use design system category colors
    const colorMap: Record<string, string> = {
      事業: 'bg-business',
      生活: 'bg-life',
      勉強: 'bg-study',
      健康: 'bg-health',
      財務: 'bg-finance',
      趣味: 'bg-hobby',
      仕事: 'bg-work',
      個人: 'bg-personal',
    }

    return colorMap[category.name] || 'bg-business'
  }

  const toggleTaskSelection = (taskId: string) => {
    setLocalSelectedTasks((prev) => {
      if (prev.includes(taskId)) {
        return prev.filter((id) => id !== taskId)
      } else {
        return [...prev, taskId]
      }
    })
  }

  const handleConfirm = () => {
    onTaskSelect(localSelectedTasks)
    onClose()
  }

  const handleCancel = () => {
    setLocalSelectedTasks(selectedTasks) // Reset to original selection
    onClose()
  }

  const handleEditPresets = () => {
    setIsPresetEditorVisible(true)
    onEditPresets()
  }

  const handlePresetEditorSave = async (tasks: Task[]) => {
    await onUpdatePresets(tasks)
    setIsPresetEditorVisible(false)
  }

  const handlePresetEditorCancel = () => {
    setIsPresetEditorVisible(false)
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <VStack space="md" className="p-4 border-b border-gray-200">
          <HStack className="items-center justify-between">
            <Text className="text-headline text-label">タスクを選択</Text>
            <Pressable
              onPress={handleCancel}
              className="p-2"
              testID="task-picker-close"
            >
              <IconSymbol name="xmark" size={24} color="#666" />
            </Pressable>
          </HStack>

          {/* Edit Presets Button */}
          <Pressable
            onPress={handleEditPresets}
            className="bg-secondary-system-background rounded-lg p-3 touch-target-minimum"
            testID="edit-presets-button"
          >
            <HStack className="items-center justify-center" space="sm">
              <IconSymbol name="pencil" size={20} color="#666" />
              <Text className="text-callout text-secondary-label font-medium">
                プリセットを編集
              </Text>
            </HStack>
          </Pressable>
        </VStack>

        {/* Task List */}
        <ScrollView className="flex-1 p-4">
          <VStack space="lg">
            {Object.entries(tasksByCategory).map(
              ([categoryId, categoryTasks]) => {
                const category = categories.find((c) => c.id === categoryId)
                const categoryColor = getCategoryColor(categoryId)

                return (
                  <VStack key={categoryId} space="sm">
                    {/* Category Header */}
                    <HStack className="items-center" space="sm">
                      <Box
                        className={`w-4 h-4 rounded-full ${categoryColor}`}
                      />
                      <Text className="text-headline text-label">
                        {category?.name || 'Unknown Category'}
                      </Text>
                    </HStack>

                    {/* Tasks in Category */}
                    <VStack space="xs">
                      {categoryTasks.map((task) => {
                        const isSelected = localSelectedTasks.includes(task.id)

                        return (
                          <Pressable
                            key={task.id}
                            onPress={() => toggleTaskSelection(task.id)}
                            className={`
                            p-4 rounded-lg border-2 transition-colors touch-target-minimum
                            ${
                              isSelected
                                ? `border-system-blue bg-business-light`
                                : 'border-system-gray-4 bg-system-background'
                            }
                          `}
                            testID={`task-picker-item-${task.id}`}
                          >
                            <HStack className="items-center justify-between">
                              <VStack className="flex-1" space="xs">
                                <Text
                                  className={`
                                  text-body font-medium
                                  ${
                                    isSelected
                                      ? 'text-system-blue'
                                      : 'text-label'
                                  }
                                `}
                                >
                                  {task.title}
                                </Text>
                                {task.defaultMinutes && (
                                  <Text className="text-footnote text-tertiary-label">
                                    目安時間: {task.defaultMinutes}分
                                  </Text>
                                )}
                              </VStack>

                              {/* Selection Indicator */}
                              <Box
                                className={`
                                w-6 h-6 rounded-full border-2 items-center justify-center
                                ${
                                  isSelected
                                    ? 'bg-system-blue border-system-blue'
                                    : 'border-system-gray-3 bg-system-background'
                                }
                              `}
                              >
                                {isSelected && (
                                  <IconSymbol
                                    name="checkmark"
                                    size={16}
                                    color="white"
                                  />
                                )}
                              </Box>
                            </HStack>
                          </Pressable>
                        )
                      })}
                    </VStack>
                  </VStack>
                )
              }
            )}

            {Object.keys(tasksByCategory).length === 0 && (
              <Box className="p-8 items-center">
                <Text className="text-tertiary-label text-center mb-4 text-body">
                  プリセットタスクがありません
                </Text>
                <Pressable
                  onPress={handleEditPresets}
                  className="bg-system-blue rounded-lg px-6 py-3 touch-target-minimum"
                >
                  <Text className="text-white font-medium text-callout">
                    タスクを追加
                  </Text>
                </Pressable>
              </Box>
            )}
          </VStack>
        </ScrollView>

        {/* Footer */}
        <Box className="p-4 border-t border-system-gray-4">
          <HStack space="md">
            <Pressable
              onPress={handleCancel}
              className="flex-1 bg-secondary-system-background rounded-lg py-3 touch-target-minimum"
              testID="task-picker-cancel"
            >
              <Text className="text-secondary-label font-medium text-center text-callout">
                キャンセル
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              className="flex-1 bg-system-blue rounded-lg py-3 touch-target-minimum"
              testID="task-picker-confirm"
            >
              <Text className="text-white font-medium text-center text-callout">
                確定 ({localSelectedTasks.length}個)
              </Text>
            </Pressable>
          </HStack>
        </Box>

        {/* Preset Task Editor Modal */}
        <PresetTaskEditor
          isVisible={isPresetEditorVisible}
          tasks={presetTasks}
          categories={categories}
          onSave={handlePresetEditorSave}
          onCancel={handlePresetEditorCancel}
          onCreateCategory={onCreateCategory}
        />
      </SafeAreaView>
    </Modal>
  )
}
