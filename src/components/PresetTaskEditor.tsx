import React, { useState, useEffect, useMemo, useRef, useId } from 'react'
import {
  Modal,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  LayoutChangeEvent,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { Pressable } from '@/components/ui/pressable'
import { HStack } from '@/components/ui/hstack'
import { VStack } from '@/components/ui/vstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import {
  OperationFeedback,
  OperationFeedbackKind,
} from '@/src/components/OperationFeedback'
import { KeyboardDoneAccessory } from '@/src/components/KeyboardDoneAccessory'
import { Task, Category } from '@/src/types'
import { getCategoryDisplayName } from '@/src/i18n/config'
import {
  PRESET_EDITOR_KEYBOARD_EXTRA_SCROLL_PADDING_PX,
  PRESET_TASK_FOCUS_SCROLL_OFFSET_PX,
} from '@/src/constants/interaction'

const PRESET_EDITOR_INPUT_ACCESSORY_VIEW_ID_PREFIX =
  'preset-editor-input-accessory'
const NATIVE_ID_UNSUPPORTED_CHARACTERS = /[^A-Za-z0-9_-]/g

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

interface PresetEditorFeedback {
  kind: OperationFeedbackKind
  message: string
  actionLabel?: string
  onAction?: () => void
}

type PresetTaskValidationMessage =
  | 'presetEditor.taskNameRequired'
  | 'presetEditor.duplicateTaskInCategory'

interface PresetTaskValidation {
  taskMessages: Record<number, PresetTaskValidationMessage[]>
  formMessages: string[]
  isValid: boolean
}

/**
 * Normalizes preset task titles before validation and persistence.
 * @param title - The editable task title from the form.
 * @returns A trimmed title with surrounding whitespace removed.
 * @example
 * normalizeTaskTitle('  Reading  ') // => 'Reading'
 */
const normalizeTaskTitle = (title: string): string => title.trim()

/**
 * Builds inline validation state for the preset task editor as users type.
 * @param editingTasks - Draft tasks currently visible in the editor.
 * @returns Per-row messages, form-level messages, and whether Save can run.
 * @example
 * validatePresetTaskDrafts([{ title: '', categoryId: 'life', archived: false }]).isValid // => false
 */
const validatePresetTaskDrafts = (
  editingTasks: EditingTask[]
): PresetTaskValidation => {
  const taskMessages: Record<number, PresetTaskValidationMessage[]> = {}
  const titleCategoryCounts = new Map<string, number>()
  let hasDuplicateTitleCategory = false

  editingTasks.forEach((task) => {
    const normalizedTitle = normalizeTaskTitle(task.title).toLocaleLowerCase()

    if (normalizedTitle.length === 0) {
      return
    }

    const titleCategoryKey = `${task.categoryId}:${normalizedTitle}`
    titleCategoryCounts.set(
      titleCategoryKey,
      (titleCategoryCounts.get(titleCategoryKey) ?? 0) + 1
    )
  })

  editingTasks.forEach((task, index) => {
    const messages: PresetTaskValidationMessage[] = []
    const normalizedTitle = normalizeTaskTitle(task.title)

    if (normalizedTitle.length === 0) {
      messages.push('presetEditor.taskNameRequired')
    }

    const titleCategoryKey = `${task.categoryId}:${normalizedTitle.toLocaleLowerCase()}`
    if (
      normalizedTitle.length > 0 &&
      (titleCategoryCounts.get(titleCategoryKey) ?? 0) > 1
    ) {
      messages.push('presetEditor.duplicateTaskInCategory')
      hasDuplicateTitleCategory = true
    }

    if (messages.length > 0) {
      taskMessages[index] = messages
    }
  })

  const formMessages: string[] = []
  const hasNamedTask = editingTasks.some(
    (task) => normalizeTaskTitle(task.title).length > 0
  )

  if (!hasNamedTask) {
    formMessages.push('presetEditor.atLeastOneTask')
  } else if (hasDuplicateTitleCategory) {
    formMessages.push('presetEditor.duplicateTaskInCategory')
  }

  if (formMessages.length === 0 && Object.keys(taskMessages).length > 0) {
    formMessages.push('presetEditor.fixInvalidTasks')
  }

  return {
    formMessages,
    isValid: formMessages.length === 0,
    taskMessages,
  }
}

export const PresetTaskEditor: React.FC<PresetTaskEditorProps> = ({
  isVisible,
  tasks,
  categories,
  onSave,
  onCancel,
  onCreateCategory,
}) => {
  const { t } = useTranslation()
  const [editingTasks, setEditingTasks] = useState<EditingTask[]>([])
  const [isLoading, setSaving] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [pendingFocusedTaskIndex, setPendingFocusedTaskIndex] = useState<
    number | null
  >(null)
  const [isPresetKeyboardDoneVisible, setIsPresetKeyboardDoneVisible] =
    useState(false)
  const [operationFeedback, setOperationFeedback] =
    useState<PresetEditorFeedback | null>(null)
  const taskListScrollViewRef = useRef<ScrollView>(null)
  const taskTitleInputRefs = useRef<Record<number, TextInput | null>>({})
  const taskMinutesInputRefs = useRef<Record<number, TextInput | null>>({})
  const newCategoryInputRef = useRef<TextInput>(null)
  const reactId = useId()
  const inputAccessoryViewID = `${PRESET_EDITOR_INPUT_ACCESSORY_VIEW_ID_PREFIX}-${reactId.replace(
    NATIVE_ID_UNSUPPORTED_CHARACTERS,
    ''
  )}`
  const taskValidation = useMemo(
    () => validatePresetTaskDrafts(editingTasks),
    [editingTasks]
  )
  const saveDisabledReason = taskValidation.formMessages[0] ?? null
  const isSaveDisabled = isLoading || !taskValidation.isValid

  // Initialize editing tasks when modal opens
  useEffect(() => {
    if (isVisible) {
      setOperationFeedback(null)
      setPendingFocusedTaskIndex(null)
      setIsPresetKeyboardDoneVisible(false)
      taskTitleInputRefs.current = {}
      taskMinutesInputRefs.current = {}
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

  // Get category color (lookup by category ID)
  const getCategoryColor = (categoryId: string) => {
    // Default colors for preset categories
    if (categoryId === 'business') return 'bg-blue-500'
    if (categoryId === 'life') return 'bg-green-500'

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
    setPendingFocusedTaskIndex(editingTasks.length)
    setEditingTasks((prev) => [...prev, newTask])
  }

  /**
   * Finishes preset text editing from the keyboard accessory or return key.
   * @returns Nothing; blurs known inputs and asks iOS to dismiss the keyboard.
   * @example
   * handleKeyboardDone() // closes the active preset editor keyboard
   */
  const handleKeyboardDone = (): void => {
    Object.values(taskTitleInputRefs.current).forEach((input) => {
      input?.blur?.()
    })
    Object.values(taskMinutesInputRefs.current).forEach((input) => {
      input?.blur?.()
    })
    newCategoryInputRef.current?.blur?.()
    Keyboard.dismiss()
    setIsPresetKeyboardDoneVisible(false)
  }

  /**
   * Shows the in-app Done control when a preset input receives focus in simulator hardware-keyboard mode.
   * @returns Nothing; keeps the dismissal action visible until editing is explicitly finished.
   * @example
   * handlePresetInputFocus() // reveals the preset editor Done button
   */
  const handlePresetInputFocus = (): void => {
    setIsPresetKeyboardDoneVisible(true)
  }

  /**
   * Moves the editor to a newly added task so the next keystroke lands in its title field.
   * @param taskIndex - The editing-task index for the row that just mounted.
   * @param taskCardY - The vertical position of the task card inside the scroll content.
   * @returns Nothing; scrolls and requests native focus when the pending row lays out.
   * @example
   * focusPendingTaskTitleInput(2, 240) // scrolls near row 2 and focuses its title input
   */
  const focusPendingTaskTitleInput = (
    taskIndex: number,
    taskCardY: number
  ): void => {
    if (pendingFocusedTaskIndex !== taskIndex) {
      return
    }

    // Keep the new row slightly below the top edge so the label and input are both visible.
    taskListScrollViewRef.current?.scrollTo?.({
      animated: true,
      y: Math.max(0, taskCardY - PRESET_TASK_FOCUS_SCROLL_OFFSET_PX),
    })
    taskTitleInputRefs.current[taskIndex]?.focus?.()
    setPendingFocusedTaskIndex(null)
  }

  /**
   * Captures each task card layout and triggers focus when the just-added row appears.
   * @param taskIndex - The editing-task index associated with the rendered card.
   * @param event - React Native layout event emitted after the card is positioned.
   * @returns Nothing; delegates to the pending focus helper for matching rows.
   * @example
   * handleTaskCardLayout(2, layoutEvent) // focuses row 2 when it is the pending new task
   */
  const handleTaskCardLayout = (
    taskIndex: number,
    event: LayoutChangeEvent
  ): void => {
    focusPendingTaskTitleInput(taskIndex, event.nativeEvent.layout.y)
  }

  const updateTask = (index: number, updates: Partial<EditingTask>) => {
    setOperationFeedback(null)
    setEditingTasks((prev) =>
      prev.map((task, i) => (i === index ? { ...task, ...updates } : task))
    )
  }

  const deleteTask = (index: number) => {
    const task = editingTasks[index]

    Alert.alert(
      t('presetEditor.deleteTask'),
      t('presetEditor.deleteTaskConfirm', { title: task.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            setEditingTasks((prev) => prev.filter((_, i) => i !== index))
          },
        },
      ]
    )
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      await onCreateCategory(newCategoryName.trim())
      setNewCategoryName('')
      setShowNewCategoryInput(false)
      setOperationFeedback({
        kind: 'success',
        message: t('presetEditor.categoryCreated'),
      })
    } catch {
      setOperationFeedback({
        kind: 'error',
        message: t('presetEditor.createCategoryFailed'),
        actionLabel: t('common.retry'),
        onAction: () => {
          void handleCreateCategory()
        },
      })
    }
  }

  const handleSave = async () => {
    const latestValidation = validatePresetTaskDrafts(editingTasks)

    if (!latestValidation.isValid) {
      setOperationFeedback({
        kind: 'error',
        message: t(latestValidation.formMessages[0]),
      })
      return
    }

    setSaving(true)
    setOperationFeedback({
      kind: 'saving',
      message: t('common.saving'),
    })
    try {
      // Convert editing tasks back to Task objects
      const tasksToSave: Task[] = editingTasks.map((task) => ({
        id:
          task.id ||
          `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: normalizeTaskTitle(task.title),
        categoryId: task.categoryId,
        defaultMinutes: task.defaultMinutes,
        archived: task.archived,
        createdAt: task.id
          ? tasks.find((t) => t.id === task.id)?.createdAt || Date.now()
          : Date.now(),
        updatedAt: Date.now(),
      }))

      await onSave(tasksToSave)
      setOperationFeedback({
        kind: 'success',
        message: t('presetEditor.saveSuccess'),
      })
    } catch {
      setOperationFeedback({
        kind: 'error',
        message: t('presetEditor.saveFailed'),
        actionLabel: t('common.retry'),
        onAction: () => {
          void handleSave()
        },
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    Alert.alert(
      t('presetEditor.discardChangesTitle'),
      t('presetEditor.discardChangesMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('presetEditor.discard'),
          style: 'destructive',
          onPress: onCancel,
        },
      ]
    )
  }

  // Group tasks by category for display
  const tasksByCategory = editingTasks.reduce((acc, task, index) => {
    if (!acc[task.categoryId]) {
      acc[task.categoryId] = []
    }
    acc[task.categoryId].push({ ...task, index })
    return acc
  }, {} as Record<string, (EditingTask & { index: number })[]>)

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          testID="preset-editor-keyboard-avoiding-view"
        >
        {/* Header */}
        <VStack space="md" className="p-4 border-b border-gray-200">
          <HStack className="items-center justify-between">
            <Text className="text-lg font-semibold text-gray-800">
              {t('presetEditor.title')}
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
              <Text className="text-white font-medium">
                {t('presetEditor.addTask')}
              </Text>
            </HStack>
          </Pressable>

          {operationFeedback && (
            <OperationFeedback
              kind={operationFeedback.kind}
              message={operationFeedback.message}
              actionLabel={operationFeedback.actionLabel}
              onAction={operationFeedback.onAction}
              testID="preset-editor-feedback"
            />
          )}
        </VStack>

        {/* Task List */}
        <ScrollView
          ref={taskListScrollViewRef}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          className="flex-1 p-4"
          contentContainerStyle={{
            paddingBottom: PRESET_EDITOR_KEYBOARD_EXTRA_SCROLL_PADDING_PX,
          }}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
        >
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
                          {category
                            ? getCategoryDisplayName(category)
                            : t('presetEditor.unknownCategory')}
                        </Text>
                      </HStack>
                    </HStack>

                    {/* Tasks in Category */}
                    <VStack space="sm">
                      {categoryTasks.map((task) => {
                        const validationMessages =
                          taskValidation.taskMessages[task.index] ?? []
                        const hasValidationError =
                          validationMessages.length > 0

                        return (
                          <Box
                            key={task.index}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                            onLayout={(event) =>
                              handleTaskCardLayout(task.index, event)
                            }
                          >
                            <VStack space="md">
                              {/* Task Title */}
                              <VStack space="xs">
                                <Text className="text-sm font-medium text-gray-700">
                                  {t('presetEditor.taskName')}
                                </Text>
                                <TextInput
                                  ref={(input) => {
                                    taskTitleInputRefs.current[task.index] =
                                      input
                                  }}
                                  value={task.title}
                                  onChangeText={(text) =>
                                    updateTask(task.index, { title: text })
                                  }
                                  autoFocus={
                                    task.index === pendingFocusedTaskIndex
                                  }
                                  inputAccessoryViewID={inputAccessoryViewID}
                                  onFocus={handlePresetInputFocus}
                                  onSubmitEditing={handleKeyboardDone}
                                  placeholder={t(
                                    'presetEditor.taskNamePlaceholder'
                                  )}
                                  returnKeyType="done"
                                  submitBehavior="blurAndSubmit"
                                  className={`bg-white border rounded-lg px-3 py-2 text-gray-800 ${
                                    hasValidationError
                                      ? 'border-red-300'
                                      : 'border-gray-300'
                                  }`}
                                  testID={`task-title-input-${task.index}`}
                                  accessibilityHint={
                                    hasValidationError
                                      ? validationMessages
                                          .map((messageKey) => t(messageKey))
                                          .join(' ')
                                      : undefined
                                  }
                                />
                                {validationMessages.map((messageKey) => (
                                  <Text
                                    key={`${task.index}-${messageKey}`}
                                    className="text-xs font-medium text-red-600"
                                    testID={`task-title-error-${task.index}`}
                                  >
                                    {t(messageKey)}
                                  </Text>
                                ))}
                              </VStack>

                              {/* Category Selection */}
                              <VStack space="xs">
                                <Text className="text-sm font-medium text-gray-700">
                                  {t('presetEditor.category')}
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
                                          accessibilityLabel={getCategoryDisplayName(
                                            cat
                                          )}
                                          accessibilityRole="button"
                                          accessibilityState={{
                                            selected: isSelected,
                                          }}
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
                                            {getCategoryDisplayName(cat)}
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
                                  {t('presetEditor.estimatedMinutes')}
                                </Text>
                                <TextInput
                                  ref={(input) => {
                                    taskMinutesInputRefs.current[task.index] =
                                      input
                                  }}
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
                                  placeholder={t(
                                    'presetEditor.estimatedMinutesPlaceholder'
                                  )}
                                  inputAccessoryViewID={inputAccessoryViewID}
                                  keyboardType="numeric"
                                  onFocus={handlePresetInputFocus}
                                  onSubmitEditing={handleKeyboardDone}
                                  returnKeyType="done"
                                  submitBehavior="blurAndSubmit"
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
                                      {t('common.delete')}
                                    </Text>
                                  </HStack>
                                </Pressable>
                              </HStack>
                            </VStack>
                          </Box>
                        )
                      })}
                    </VStack>
                  </VStack>
                )
              }
            )}

            {/* New Category Section */}
            <VStack space="sm" className="mb-4">
              <HStack className="items-center justify-between">
                <Text className="text-lg font-semibold text-gray-800">
                  {t('presetEditor.categoryManagement')}
                </Text>
                <Pressable
                  onPress={() => setShowNewCategoryInput(!showNewCategoryInput)}
                  className="bg-green-500 rounded-lg px-3 py-2 touch-target-minimum"
                  testID="add-category-button"
                >
                  <HStack className="items-center" space="xs">
                    <IconSymbol name="plus" size={16} color="white" />
                    <Text className="text-white text-sm font-medium">
                      {t('presetEditor.addCategory')}
                    </Text>
                  </HStack>
                </Pressable>
              </HStack>

              {showNewCategoryInput && (
                <HStack space="sm" className="items-center">
                  <TextInput
                    ref={newCategoryInputRef}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder={t('presetEditor.newCategoryPlaceholder')}
                    inputAccessoryViewID={inputAccessoryViewID}
                    onFocus={handlePresetInputFocus}
                    onSubmitEditing={handleKeyboardDone}
                    returnKeyType="done"
                    submitBehavior="blurAndSubmit"
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                    testID="new-category-input"
                  />
                  <Pressable
                    onPress={handleCreateCategory}
                    className="bg-green-500 rounded-lg px-4 py-2"
                    testID="create-category-button"
                  >
                    <Text className="text-white font-medium">
                      {t('common.create')}
                    </Text>
                  </Pressable>
                </HStack>
              )}
            </VStack>

            {editingTasks.length === 0 && (
              <Box className="p-8 items-center">
                <Text className="text-gray-500 text-center mb-4">
                  {t('presetEditor.noTasks')}
                </Text>
                <Text className="text-gray-400 text-center text-sm">
                  {t('presetEditor.noTasksHint')}
                </Text>
              </Box>
            )}
          </VStack>
        </ScrollView>

        {/* Footer */}
        <Box className="p-4 border-t border-gray-200">
          {isPresetKeyboardDoneVisible && (
            <Box className="mb-3 items-end">
              <Pressable
                accessibilityLabel={t('common.done')}
                accessibilityRole="button"
                className="rounded-lg bg-blue-50 px-4 py-2"
                onPress={handleKeyboardDone}
                testID="preset-editor-inline-keyboard-done-button"
              >
                <Text className="text-base font-semibold text-blue-600">
                  {t('common.done')}
                </Text>
              </Pressable>
            </Box>
          )}
          {saveDisabledReason && (
            <Text
              className="mb-3 text-center text-sm font-medium text-red-600"
              testID="preset-editor-save-disabled-reason"
            >
              {t(saveDisabledReason)}
            </Text>
          )}
          <HStack space="md">
            <Pressable
              onPress={handleCancel}
              className="flex-1 bg-gray-100 rounded-lg py-3"
              testID="preset-editor-cancel"
            >
              <Text className="text-gray-700 font-medium text-center">
                {t('common.cancel')}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={isSaveDisabled}
              className={`flex-1 rounded-lg py-3 ${
                isSaveDisabled ? 'bg-gray-400' : 'bg-blue-500'
              }`}
              testID="preset-editor-save"
              accessibilityState={{
                busy: isLoading,
                disabled: isSaveDisabled,
              }}
              accessibilityHint={
                saveDisabledReason ? t(saveDisabledReason) : undefined
              }
            >
              <Text className="text-white font-medium text-center">
                {isLoading ? t('common.saving') : t('common.save')}
              </Text>
            </Pressable>
          </HStack>
        </Box>
        <KeyboardDoneAccessory
          accessibilityLabel={t('common.done')}
          nativeID={inputAccessoryViewID}
          onPress={handleKeyboardDone}
          testID="preset-editor-keyboard-done-button"
          title={t('common.done')}
        />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}
