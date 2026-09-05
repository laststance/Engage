import React, { useMemo, useRef, useState } from 'react'
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  type AccessibilityActionEvent,
} from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Swipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { DesignSystem } from '@/constants/design-system'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { HStack } from '@/components/ui/hstack'
import { VStack } from '@/components/ui/vstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { AppPressable } from '@/src/components/AppPressable'
import { Task, Category, TaskAssignmentOperationResult } from '@/src/types'
import { getCategoryDisplayName } from '@/src/i18n/config'
import { groupTasksByCategory } from '@/src/utils/businessLogic'
import { useInteractionFeedback } from '@/src/hooks/useInteractionFeedback'

interface TaskPickerProps {
  isVisible: boolean
  presetTasks: Task[]
  categories: Category[]
  selectedTasks: string[]
  onTaskSelect: (taskIds: string[]) => Promise<TaskAssignmentOperationResult>
  onTaskDeleteAction: (taskId: string) => Promise<void>
  onClose: () => void
  onEditPresets: () => void
}

/**
 * Establishes the gesture boundary Android native modals cannot inherit from the app root.
 * @param props - Picker content rendered inside the modal-safe gesture and safe-area roots.
 * @returns A full-screen native-modal surface that can recognize row swipe gestures.
 * @example
 * <TaskPickerModalSurface>{pickerContent}</TaskPickerModalSurface>
 */
const TaskPickerModalSurface: React.FC<React.PropsWithChildren> = ({
  children,
}) => (
  <GestureHandlerRootView className="flex-1">
    <SafeAreaView className="flex-1 bg-white">{children}</SafeAreaView>
  </GestureHandlerRootView>
)

/**
 * Checks whether two task selections contain the same IDs regardless of tap order.
 * @param currentTaskIds - The task IDs currently selected in the picker.
 * @param savedTaskIds - The task IDs that were selected when the picker opened.
 * @returns
 * - `true` when both lists describe the same selection
 * - `false` when any task was added or removed
 * @example
 * haveSameTaskSelection(['task-1', 'task-2'], ['task-2', 'task-1']) // => true
 */
const haveSameTaskSelection = (
  currentTaskIds: string[],
  savedTaskIds: string[]
): boolean => {
  if (currentTaskIds.length !== savedTaskIds.length) {
    return false
  }

  const savedTaskIdSet = new Set(savedTaskIds)
  return currentTaskIds.every((taskId) => savedTaskIdSet.has(taskId))
}

/**
 * Presents preset tasks as a modal picker for assigning habits to the active day.
 * @param props - The visible state, task lists, and callbacks provided by day-view screens.
 * @returns A modal task-selection flow with local draft state until the user saves.
 * @example
 * <TaskPicker isVisible selectedTasks={[]} presetTasks={tasks} categories={categories} ... />
 */
export const TaskPicker: React.FC<TaskPickerProps> = ({
  isVisible,
  ...taskPickerProps
}) => {
  // A closed picker must drop its draft so reopening starts from saved tasks.
  if (!isVisible) {
    return null
  }

  return (
    <TaskPickerSession
      isVisible={isVisible}
      {...taskPickerProps}
    />
  )
}

/**
 * Owns one visible picker draft and remounts only after the picker closes and reopens.
 * @param props - The open picker inputs and assignment callbacks.
 * @returns The visible modal session for selecting tasks.
 * @example
 * <TaskPickerSession isVisible selectedTasks={['task-1']} {...props} />
 */
const TaskPickerSession: React.FC<TaskPickerProps> = ({
  isVisible,
  presetTasks,
  categories,
  selectedTasks,
  onTaskSelect,
  onTaskDeleteAction,
  onClose,
  onEditPresets,
}) => {
  const { t } = useTranslation()
  const triggerFeedback = useInteractionFeedback()
  const [localSelectedTasks, setLocalSelectedTasks] =
    useState<string[]>(selectedTasks)
  const [isSaving, setIsSaving] = useState(false)
  const isSavingRef = useRef(false)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const deletingTaskIdRef = useRef<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const tasksByCategory = useMemo(
    () => groupTasksByCategory(presetTasks, categories),
    [categories, presetTasks]
  )
  const visibleTaskGroups = useMemo(
    () => Object.entries(tasksByCategory).filter(
      ([, categoryTasks]) => categoryTasks.length > 0
    ),
    [tasksByCategory]
  )
  const selectedTaskCount = localSelectedTasks.length
  const isBusy = isSaving || deletingTaskId !== null
  const hasSelectionChanges = useMemo(
    () => !haveSameTaskSelection(localSelectedTasks, selectedTasks),
    [localSelectedTasks, selectedTasks]
  )

  /**
   * Maps a preset category to its design token whenever TaskPicker renders a section.
   * @param categoryId - The persisted category ID for the visible task group.
   * @returns A NativeWind background-color class with a safe business fallback.
   * @example
   * getCategoryColor('life') // => 'bg-life'
   */
  const getCategoryColor = (categoryId: string): string => {
    const colorMap: Record<string, string> = {
      business: 'bg-business',
      life: 'bg-life',
      study: 'bg-study',
      health: 'bg-health',
      finance: 'bg-finance',
      hobby: 'bg-hobby',
      work: 'bg-work',
      personal: 'bg-personal',
    }

    return colorMap[categoryId] || 'bg-business'
  }

  /**
   * Updates the local draft when a user taps a task row before saving the day assignment.
   * @param taskId - The preset task whose selected state should flip.
   * @returns Nothing; local draft and visible error state are updated.
   * @example
   * toggleTaskSelection('task-1') // => task-1 toggles in the draft
   */
  const toggleTaskSelection = (taskId: string): void => {
    setErrorMessage(null)
    setLocalSelectedTasks((prev) => {
      if (prev.includes(taskId)) {
        return prev.filter((id) => id !== taskId)
      } else {
        return [...prev, taskId]
      }
    })
  }

  /**
   * Persists the picker draft when the user presses Save and closes only after success.
   * @returns A promise that settles after assignment feedback and modal state are synchronized.
   * @example
   * await handleConfirm() // => saves the selected task IDs
   */
  const handleConfirm = async (): Promise<void> => {
    // Do not overlap assignment persistence with a destructive task update.
    if (isSavingRef.current || deletingTaskIdRef.current !== null) {
      return
    }

    isSavingRef.current = true
    setIsSaving(true)
    setErrorMessage(null)

    try {
      const result = await onTaskSelect(localSelectedTasks)

      if (result.success) {
        isSavingRef.current = false
        setIsSaving(false)
        onClose()
        return
      }

      triggerFeedback('error')
      setErrorMessage(result.message || t('taskPicker.saveFailed'))
      isSavingRef.current = false
      setIsSaving(false)
    } catch (error) {
      console.error('Failed to save task selection:', error)
      triggerFeedback('error')
      setErrorMessage(t('taskPicker.saveFailed'))
      isSavingRef.current = false
      setIsSaving(false)
    }
  }

  /**
   * Discards the visible draft when the user closes the picker outside an active mutation.
   * @returns Nothing; saved selections are restored before the modal closes.
   * @example
   * handleCancel() // => resets the draft and closes TaskPicker
   */
  const handleCancel = (): void => {
    // Keep the modal stable while a save or deletion is still persisting.
    if (isSavingRef.current || deletingTaskIdRef.current !== null) {
      return
    }

    setLocalSelectedTasks(selectedTasks) // Reset to original selection
    setErrorMessage(null)
    onClose()
  }

  /**
   * Opens PresetTaskEditor from TaskPicker when no save or deletion is still running.
   * @returns Nothing; the parent swaps to the preset editing flow.
   * @example
   * handleEditPresets() // => opens the preset editor
   */
  const handleEditPresets = (): void => {
    // Avoid replacing this modal while a task mutation is still running.
    if (isSavingRef.current || deletingTaskIdRef.current !== null) {
      return
    }

    onEditPresets()
  }

  /**
   * Permanently deletes a swiped preset and removes its stale local selection after confirmation.
   * @param taskId - The persisted task ID selected by the destructive swipe action.
   * @returns A promise that settles after persistence and picker state are synchronized.
   * @example
   * await deletePresetTask('task-1') // => task-1 disappears from the picker
   */
  const deletePresetTask = async (taskId: string): Promise<void> => {
    // A second destructive tap must not start another database mutation.
    if (isSavingRef.current || deletingTaskIdRef.current !== null) {
      return
    }

    deletingTaskIdRef.current = taskId
    setDeletingTaskId(taskId)
    setErrorMessage(null)

    try {
      await onTaskDeleteAction(taskId)
      setLocalSelectedTasks((currentTaskIds) =>
        currentTaskIds.filter((currentTaskId) => currentTaskId !== taskId)
      )
    } catch (error) {
      console.error('Failed to delete preset task:', error)
      triggerFeedback('error')
      setErrorMessage(t('taskPicker.deleteFailed'))
    } finally {
      deletingTaskIdRef.current = null
      setDeletingTaskId(null)
    }
  }

  /**
   * Closes the swiped row and asks for confirmation before the destructive callback runs.
   * @param task - The preset task exposed by the swipe gesture.
   * @param swipeableMethods - Gesture Handler controls for closing the revealed action.
   * @returns Nothing; confirmation triggers deletion only when the user accepts.
   * @example
   * requestTaskDeletion(task, swipeableMethods) // => shows the delete confirmation
   */
  const requestTaskDeletion = (
    task: Task,
    swipeableMethods?: SwipeableMethods
  ): void => {
    // Ignore swipe actions while another picker mutation is active.
    if (isSavingRef.current || deletingTaskIdRef.current !== null) {
      swipeableMethods?.close()
      return
    }

    swipeableMethods?.close()
    Alert.alert(
      t('presetEditor.deleteTask'),
      t('presetEditor.deleteTaskConfirm', { title: task.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            void deletePresetTask(task.id)
          },
        },
      ]
    )
  }

  /**
   * Routes assistive-technology delete actions through the same confirmed destructive flow.
   * @param task - The focused preset task exposed to VoiceOver or TalkBack.
   * @param event - The accessibility action selected by the user.
   * @returns Nothing; only the localized delete action opens confirmation.
   * @example
   * handleTaskAccessibilityAction(task, deleteActionEvent) // => shows confirmation
   */
  const handleTaskAccessibilityAction = (
    task: Task,
    event: AccessibilityActionEvent
  ): void => {
    if (event.nativeEvent.actionName === 'delete') {
      requestTaskDeletion(task)
    }
  }

  /**
   * Renders the destructive control revealed when a picker row is swiped to the left.
   * @param task - The preset task represented by the swiped row.
   * @param swipeableMethods - Gesture Handler controls passed to the action renderer.
   * @returns An accessible red delete action sized to the full task row.
   * @example
   * renderTaskDeleteAction(task, swipeableMethods) // => red Delete button
   */
  const renderTaskDeleteAction = (
    task: Task,
    swipeableMethods: SwipeableMethods
  ): React.ReactNode => (
    <AppPressable
      onPress={() => requestTaskDeletion(task, swipeableMethods)}
      disabled={isBusy}
      feedback="select"
      className="bg-system-red px-6 items-center justify-center touch-target-minimum"
      pressedClassName="opacity-80"
      testID={`task-picker-delete-${task.id}`}
      accessibilityLabel={t('presetEditor.deleteTask')}
      accessibilityRole="button"
    >
      <Text className="text-white font-semibold text-callout">
        {t('common.delete')}
      </Text>
    </AppPressable>
  )

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <TaskPickerModalSurface>
        <VStack space="md" className="p-4 border-b border-gray-200">
          <HStack className="items-center justify-between">
            <VStack className="flex-1 mr-3" space="xs">
              <Text className="text-headline text-label">
                {t('daySheet.selectTasks')}
              </Text>
              <Text
                className="text-footnote text-secondary-label"
                testID="task-picker-selected-count"
              >
                {t('taskPicker.selectedCount', {
                  count: selectedTaskCount,
                })}
              </Text>
              {hasSelectionChanges && (
                <Text
                  className="text-footnote text-label font-medium"
                  testID="task-picker-unsaved-changes"
                >
                  {t('taskPicker.unsavedChanges')}
                </Text>
              )}
            </VStack>
            <AppPressable
              onPress={handleCancel}
              disabled={isBusy}
              className="p-3 touch-target-minimum"
              pressedClassName="bg-system-gray-6 rounded-full"
              testID="task-picker-close"
              accessibilityLabel={
                hasSelectionChanges
                  ? t('taskPicker.discardChangesAndClose')
                  : t('common.close')
              }
              accessibilityRole="button"
            >
              <IconSymbol name="xmark" size={24} color="#666" />
            </AppPressable>
          </HStack>

          <AppPressable
            onPress={handleEditPresets}
            disabled={isBusy}
            feedback="select"
            className="bg-secondary-system-background rounded-lg p-3 touch-target-minimum"
            pressedClassName="bg-system-gray-5"
            testID="edit-presets-button"
            accessibilityRole="button"
          >
            <HStack className="items-center justify-center" space="sm">
              <IconSymbol name="pencil" size={20} color="#666" />
              <Text className="text-callout text-secondary-label font-medium">
                {t('taskPicker.editPresetsShort')}
              </Text>
            </HStack>
          </AppPressable>
        </VStack>

        <ScrollView className="flex-1 p-4">
          <VStack space="lg">
            {visibleTaskGroups.map(([categoryId, categoryTasks]) => {
              const category = categories.find((c) => c.id === categoryId)
              const categoryColor = getCategoryColor(categoryId)

              return (
                <VStack key={categoryId} space="sm">
                  <HStack className="items-center" space="sm">
                    <Box className={`w-4 h-4 rounded-full ${categoryColor}`} />
                    <Text className="text-headline text-label">
                      {category
                        ? getCategoryDisplayName(category)
                        : 'Unknown Category'}
                    </Text>
                  </HStack>

                  <VStack space="xs">
                    {categoryTasks.map((task) => {
                      const isSelected = localSelectedTasks.includes(task.id)
                      const selectionStatus = t(
                        isSelected
                          ? 'taskPicker.selectedStatus'
                          : 'taskPicker.notSelectedStatus'
                      )

                      return (
                        <Swipeable
                          key={task.id}
                          enabled={!isBusy}
                          overshootRight={false}
                          renderRightActions={(
                            _swipeProgress,
                            _swipeTranslation,
                            swipeableMethods
                          ) =>
                            renderTaskDeleteAction(task, swipeableMethods)
                          }
                          containerStyle={styles.swipeableContainer}
                          testID={`task-picker-swipeable-${task.id}`}
                        >
                          {/* Match the swipe container radius to preserve the border at every corner. */}
                          <AppPressable
                            onPress={() => toggleTaskSelection(task.id)}
                            disabled={isBusy}
                            feedback="select"
                            selected={isSelected}
                            accessibilityLabel={`${task.title}, ${selectionStatus}`}
                            accessibilityValue={{
                              text: selectionStatus,
                            }}
                            accessibilityHint={t(
                              'taskPicker.toggleSelectionHint'
                            )}
                            accessibilityActions={[
                              {
                                name: 'delete',
                                label: t('taskPicker.deletePresetAction'),
                              },
                            ]}
                            onAccessibilityAction={(
                              event: AccessibilityActionEvent
                            ) =>
                              handleTaskAccessibilityAction(task, event)
                            }
                            className={`
                              p-4 border-2 rounded-sm touch-target-minimum
                              ${
                                isSelected
                                  ? `border-system-blue bg-business-light`
                                  : 'border-system-gray-4 bg-system-background'
                              }
                            `}
                            pressedClassName="bg-system-gray-6"
                            testID={`task-picker-item-${task.id}`}
                            accessibilityRole="button"
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
                                    {t('taskPicker.estimatedTime', {
                                      minutes: task.defaultMinutes,
                                    })}
                                  </Text>
                                )}
                              </VStack>

                              <HStack className="items-center" space="sm">
                                {isSelected && (
                                  <Text className="text-caption-1 font-semibold text-system-blue">
                                    {t('taskPicker.selectedStatus')}
                                  </Text>
                                )}
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
                            </HStack>
                          </AppPressable>
                        </Swipeable>
                      )
                    })}
                  </VStack>
                </VStack>
              )
            })}

            {visibleTaskGroups.length === 0 && (
              <Box className="p-8 items-center">
                <Text className="text-tertiary-label text-center mb-4 text-body">
                  {t('taskPicker.noPresetTasks')}
                </Text>
                <AppPressable
                  onPress={handleEditPresets}
                  disabled={isBusy}
                  feedback="select"
                  className="bg-system-blue rounded-lg px-6 py-3 touch-target-minimum"
                  pressedClassName="bg-business-dark"
                  accessibilityRole="button"
                >
                  <Text className="text-white font-medium text-callout">
                    {t('presetEditor.addTask')}
                  </Text>
                </AppPressable>
              </Box>
            )}
          </VStack>
        </ScrollView>

        <Box className="p-4 border-t border-system-gray-4">
          {errorMessage && (
            <Text
              className="text-system-red text-center text-footnote mb-3"
              testID="task-picker-error"
            >
              {errorMessage}
            </Text>
          )}
          <HStack space="md">
            <AppPressable
              onPress={handleCancel}
              disabled={isBusy}
              className="flex-1 bg-secondary-system-background rounded-lg py-3 touch-target-minimum"
              pressedClassName="bg-system-gray-5"
              testID="task-picker-cancel"
              accessibilityRole="button"
            >
              <Text className="text-secondary-label font-medium text-center text-callout">
                {hasSelectionChanges
                  ? t('taskPicker.discardChanges')
                  : t('common.cancel')}
              </Text>
            </AppPressable>

            <AppPressable
              onPress={handleConfirm}
              busy={isSaving}
              disabled={isBusy}
              feedback="select"
              className="flex-1 bg-system-blue rounded-lg py-3 touch-target-minimum"
              pressedClassName="bg-business-dark"
              testID="task-picker-confirm"
              accessibilityRole="button"
              accessibilityLabel={t('taskPicker.saveSelection', {
                count: selectedTaskCount,
              })}
            >
              <Text
                className="text-white font-medium text-center text-callout"
                style={styles.primaryActionLabel}
              >
                {isSaving
                  ? t('common.saving')
                  : t('taskPicker.confirm', {
                    count: localSelectedTasks.length,
                  })}
              </Text>
            </AppPressable>
          </HStack>
        </Box>
      </TaskPickerModalSurface>
    </Modal>
  )
}

const styles = StyleSheet.create({
  primaryActionLabel: {
    color: DesignSystem.colors.system.systemBackground,
  },
  swipeableContainer: {
    borderRadius: DesignSystem.borderRadius.button,
    overflow: 'hidden',
  },
})
