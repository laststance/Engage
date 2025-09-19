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

  // Get category color
  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return 'bg-gray-500'

    // Default colors for preset categories
    if (category.name === '事業') return 'bg-blue-500'
    if (category.name === '生活') return 'bg-green-500'

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
            <Text className="text-lg font-semibold text-gray-800">
              タスクを選択
            </Text>
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
            className="bg-gray-100 rounded-lg p-3"
            testID="edit-presets-button"
          >
            <HStack className="items-center justify-center" space="sm">
              <IconSymbol name="pencil" size={20} color="#666" />
              <Text className="text-gray-700 font-medium">
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
                      <Text className="text-lg font-semibold text-gray-800">
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
                            p-4 rounded-lg border-2 transition-colors
                            ${
                              isSelected
                                ? `border-blue-500 bg-blue-50`
                                : 'border-gray-200 bg-white'
                            }
                          `}
                            testID={`task-picker-item-${task.id}`}
                          >
                            <HStack className="items-center justify-between">
                              <VStack className="flex-1" space="xs">
                                <Text
                                  className={`
                                  font-medium
                                  ${
                                    isSelected
                                      ? 'text-blue-700'
                                      : 'text-gray-800'
                                  }
                                `}
                                >
                                  {task.title}
                                </Text>
                                {task.defaultMinutes && (
                                  <Text className="text-sm text-gray-500">
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
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'border-gray-300 bg-white'
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
                <Text className="text-gray-500 text-center mb-4">
                  プリセットタスクがありません
                </Text>
                <Pressable
                  onPress={handleEditPresets}
                  className="bg-blue-500 rounded-lg px-6 py-3"
                >
                  <Text className="text-white font-medium">タスクを追加</Text>
                </Pressable>
              </Box>
            )}
          </VStack>
        </ScrollView>

        {/* Footer */}
        <Box className="p-4 border-t border-gray-200">
          <HStack space="md">
            <Pressable
              onPress={handleCancel}
              className="flex-1 bg-gray-100 rounded-lg py-3"
              testID="task-picker-cancel"
            >
              <Text className="text-gray-700 font-medium text-center">
                キャンセル
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              className="flex-1 bg-blue-500 rounded-lg py-3"
              testID="task-picker-confirm"
            >
              <Text className="text-white font-medium text-center">
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
