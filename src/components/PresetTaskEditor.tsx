import React, { useState, useEffect } from 'react'
import { Modal, SafeAreaView, ScrollView, Alert, TextInput } from 'react-native'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { Pressable } from '@/components/ui/pressable'
import { HStack } from '@/components/ui/hstack'
import { VStack } from '@/components/ui/vstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { Task, Category } from '@/src/types'

interface PresetTaskEditorProps {
  isVisible: boolean
  tasks: Task[]
  categories: Category[]
  onSave: (tasks: Task[]) => Promise<void>
  onCancel: () => void
  onCreateCategory: (name: string) => Promise<void>
}

interface EditingTask {
  id?: string
  title: string
  categoryId: string
  defaultMinutes?: number
  archived: boolean
  isNew?: boolean
}

export const PresetTaskEditor: React.FC<PresetTaskEditorProps> = ({
  isVisible,
  tasks,
  categories,
  onSave,
  onCancel,
  onCreateCategory,
}) => {
  const [editingTasks, setEditingTasks] = useState<EditingTask[]>([])
  const [isLoading, setSaving] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)

  // Initialize editing tasks when modal opens
  useEffect(() => {
    if (isVisible) {
      setEditingTasks(
        tasks.map((task) => ({
          id: task.id,
          title: task.title,
          categoryId: task.categoryId,
          defaultMinutes: task.defaultMinutes,
          archived: task.archived,
          isNew: false,
        }))
      )
    }
  }, [isVisible, tasks])

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

  const addNewTask = () => {
    const newTask: EditingTask = {
      title: '',
      categoryId: categories[0]?.id || 'life',
      defaultMinutes: undefined,
      archived: false,
      isNew: true,
    }
    setEditingTasks((prev) => [...prev, newTask])
  }

  const updateTask = (index: number, updates: Partial<EditingTask>) => {
    setEditingTasks((prev) =>
      prev.map((task, i) => (i === index ? { ...task, ...updates } : task))
    )
  }

  const deleteTask = (index: number) => {
    const task = editingTasks[index]

    Alert.alert('タスクを削除', `「${task.title}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          setEditingTasks((prev) => prev.filter((_, i) => i !== index))
        },
      },
    ])
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      await onCreateCategory(newCategoryName.trim())
      setNewCategoryName('')
      setShowNewCategoryInput(false)
    } catch (error) {
      Alert.alert('エラー', 'カテゴリーの作成に失敗しました')
    }
  }

  const handleSave = async () => {
    // Validate tasks
    const validTasks = editingTasks.filter((task) => task.title.trim() !== '')

    if (validTasks.length === 0) {
      Alert.alert('エラー', '少なくとも1つのタスクが必要です')
      return
    }

    // Check for duplicate titles within same category
    const duplicates = validTasks.filter((task, index) => {
      return (
        validTasks.findIndex(
          (t) => t.title === task.title && t.categoryId === task.categoryId
        ) !== index
      )
    })

    if (duplicates.length > 0) {
      Alert.alert('エラー', '同じカテゴリー内で重複するタスク名があります')
      return
    }

    setSaving(true)
    try {
      // Convert editing tasks back to Task objects
      const tasksToSave: Task[] = validTasks.map((task) => ({
        id:
          task.id ||
          `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: task.title,
        categoryId: task.categoryId,
        defaultMinutes: task.defaultMinutes,
        archived: task.archived,
        createdAt: task.id
          ? tasks.find((t) => t.id === task.id)?.createdAt || Date.now()
          : Date.now(),
        updatedAt: Date.now(),
      }))

      await onSave(tasksToSave)
    } catch (error) {
      Alert.alert('エラー', 'タスクの保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    Alert.alert('変更を破棄', '編集内容が失われますが、よろしいですか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '破棄', style: 'destructive', onPress: onCancel },
    ])
  }

  // Group tasks by category for display
  const tasksByCategory = editingTasks.reduce((acc, task, index) => {
    if (!acc[task.categoryId]) {
      acc[task.categoryId] = []
    }
    acc[task.categoryId].push({ ...task, index })
    return acc
  }, {} as Record<string, Array<EditingTask & { index: number }>>)

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
              プリセットタスク編集
            </Text>
            <Pressable
              onPress={handleCancel}
              className="p-2"
              testID="preset-editor-close"
            >
              <IconSymbol name="xmark" size={24} color="#666" />
            </Pressable>
          </HStack>

          {/* Add Task Button */}
          <Pressable
            onPress={addNewTask}
            className="bg-blue-500 rounded-lg p-3"
            testID="add-task-button"
          >
            <HStack className="items-center justify-center" space="sm">
              <IconSymbol name="plus" size={20} color="white" />
              <Text className="text-white font-medium">新しいタスクを追加</Text>
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
                    <HStack className="items-center justify-between">
                      <HStack className="items-center" space="sm">
                        <Box
                          className={`w-4 h-4 rounded-full ${categoryColor}`}
                        />
                        <Text className="text-lg font-semibold text-gray-800">
                          {category?.name || 'Unknown Category'}
                        </Text>
                      </HStack>
                    </HStack>

                    {/* Tasks in Category */}
                    <VStack space="sm">
                      {categoryTasks.map((task) => (
                        <Box
                          key={task.index}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <VStack space="md">
                            {/* Task Title */}
                            <VStack space="xs">
                              <Text className="text-sm font-medium text-gray-700">
                                タスク名
                              </Text>
                              <TextInput
                                value={task.title}
                                onChangeText={(text) =>
                                  updateTask(task.index, { title: text })
                                }
                                placeholder="タスク名を入力"
                                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                                testID={`task-title-input-${task.index}`}
                              />
                            </VStack>

                            {/* Category Selection */}
                            <VStack space="xs">
                              <Text className="text-sm font-medium text-gray-700">
                                カテゴリー
                              </Text>
                              <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                              >
                                <HStack space="sm">
                                  {categories.map((cat) => {
                                    const isSelected =
                                      task.categoryId === cat.id
                                    const catColor = getCategoryColor(cat.id)

                                    return (
                                      <Pressable
                                        key={cat.id}
                                        onPress={() =>
                                          updateTask(task.index, {
                                            categoryId: cat.id,
                                          })
                                        }
                                        className={`
                                        px-3 py-2 rounded-full border-2 flex-row items-center
                                        ${
                                          isSelected
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-300 bg-white'
                                        }
                                      `}
                                        testID={`category-option-${cat.id}-${task.index}`}
                                      >
                                        <Box
                                          className={`w-3 h-3 rounded-full ${catColor} mr-2`}
                                        />
                                        <Text
                                          className={`text-sm ${
                                            isSelected
                                              ? 'text-blue-700'
                                              : 'text-gray-700'
                                          }`}
                                        >
                                          {cat.name}
                                        </Text>
                                      </Pressable>
                                    )
                                  })}
                                </HStack>
                              </ScrollView>
                            </VStack>

                            {/* Default Minutes */}
                            <VStack space="xs">
                              <Text className="text-sm font-medium text-gray-700">
                                目安時間（分）
                              </Text>
                              <TextInput
                                value={task.defaultMinutes?.toString() || ''}
                                onChangeText={(text) => {
                                  const minutes = text
                                    ? parseInt(text, 10)
                                    : undefined
                                  updateTask(task.index, {
                                    defaultMinutes: isNaN(minutes!)
                                      ? undefined
                                      : minutes,
                                  })
                                }}
                                placeholder="例: 30"
                                keyboardType="numeric"
                                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                                testID={`task-minutes-input-${task.index}`}
                              />
                            </VStack>

                            {/* Actions */}
                            <HStack className="justify-end">
                              <Pressable
                                onPress={() => deleteTask(task.index)}
                                className="bg-red-500 rounded-lg px-4 py-2"
                                testID={`delete-task-${task.index}`}
                              >
                                <HStack className="items-center" space="xs">
                                  <IconSymbol
                                    name="trash"
                                    size={16}
                                    color="white"
                                  />
                                  <Text className="text-white text-sm font-medium">
                                    削除
                                  </Text>
                                </HStack>
                              </Pressable>
                            </HStack>
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  </VStack>
                )
              }
            )}

            {/* New Category Section */}
            <VStack space="sm">
              <HStack className="items-center justify-between">
                <Text className="text-lg font-semibold text-gray-800">
                  カテゴリー管理
                </Text>
                <Pressable
                  onPress={() => setShowNewCategoryInput(!showNewCategoryInput)}
                  className="bg-green-500 rounded-lg px-3 py-2"
                  testID="add-category-button"
                >
                  <HStack className="items-center" space="xs">
                    <IconSymbol name="plus" size={16} color="white" />
                    <Text className="text-white text-sm font-medium">
                      カテゴリー追加
                    </Text>
                  </HStack>
                </Pressable>
              </HStack>

              {showNewCategoryInput && (
                <HStack space="sm" className="items-center">
                  <TextInput
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="新しいカテゴリー名"
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                    testID="new-category-input"
                  />
                  <Pressable
                    onPress={handleCreateCategory}
                    className="bg-green-500 rounded-lg px-4 py-2"
                    testID="create-category-button"
                  >
                    <Text className="text-white font-medium">作成</Text>
                  </Pressable>
                </HStack>
              )}
            </VStack>

            {editingTasks.length === 0 && (
              <Box className="p-8 items-center">
                <Text className="text-gray-500 text-center mb-4">
                  タスクがありません
                </Text>
                <Text className="text-gray-400 text-center text-sm">
                  「新しいタスクを追加」ボタンでタスクを作成してください
                </Text>
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
              testID="preset-editor-cancel"
            >
              <Text className="text-gray-700 font-medium text-center">
                キャンセル
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={isLoading}
              className={`flex-1 rounded-lg py-3 ${
                isLoading ? 'bg-gray-400' : 'bg-blue-500'
              }`}
              testID="preset-editor-save"
            >
              <Text className="text-white font-medium text-center">
                {isLoading ? '保存中...' : '保存'}
              </Text>
            </Pressable>
          </HStack>
        </Box>
      </SafeAreaView>
    </Modal>
  )
}
