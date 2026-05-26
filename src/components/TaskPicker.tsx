import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, ScrollView, StyleSheet } from 'react-native'
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
  onClose: () => void
  onEditPresets: () => void
}

export const TaskPicker: React.FC<TaskPickerProps> = ({
  isVisible,
  presetTasks,
  categories,
  selectedTasks,
  onTaskSelect,
  onClose,
  onEditPresets,
}) => {
  const { t } = useTranslation()
  const triggerFeedback = useInteractionFeedback()
  const [localSelectedTasks, setLocalSelectedTasks] =
    useState<string[]>(selectedTasks)
  const [isSaving, setIsSaving] = useState(false)
  const isSavingRef = useRef(false)
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

  useEffect(() => {
    if (isVisible) {
      setLocalSelectedTasks(selectedTasks)
      setErrorMessage(null)
      setIsSaving(false)
      isSavingRef.current = false
    }
  }, [isVisible, selectedTasks])

  // Get category color using design system (lookup by category ID)
  const getCategoryColor = (categoryId: string) => {
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

  const toggleTaskSelection = (taskId: string) => {
    setErrorMessage(null)
    setLocalSelectedTasks((prev) => {
      if (prev.includes(taskId)) {
        return prev.filter((id) => id !== taskId)
      } else {
        return [...prev, taskId]
      }
    })
  }

  const handleConfirm = async () => {
    if (isSavingRef.current) {
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

  const handleCancel = () => {
    if (isSavingRef.current) {
      return
    }

    setLocalSelectedTasks(selectedTasks) // Reset to original selection
    setErrorMessage(null)
    onClose()
  }

  const handleEditPresets = () => {
    if (isSavingRef.current) {
      return
    }

    onEditPresets()
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <SafeAreaView className="flex-1 bg-white">
        <VStack space="md" className="p-4 border-b border-gray-200">
          <HStack className="items-center justify-between">
            <Text className="text-headline text-label">
              {t('daySheet.selectTasks')}
            </Text>
            <AppPressable
              onPress={handleCancel}
              disabled={isSaving}
              className="p-3 touch-target-minimum"
              pressedClassName="bg-system-gray-6 rounded-full"
              testID="task-picker-close"
              accessibilityLabel={t('common.close')}
              accessibilityRole="button"
            >
              <IconSymbol name="xmark" size={24} color="#666" />
            </AppPressable>
          </HStack>

          <AppPressable
            onPress={handleEditPresets}
            disabled={isSaving}
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

                      return (
                        <AppPressable
                          key={task.id}
                          onPress={() => toggleTaskSelection(task.id)}
                          feedback="select"
                          selected={isSelected}
                          className={`
                            p-4 rounded-lg border-2 transition-colors touch-target-minimum
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
                        </AppPressable>
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
                  disabled={isSaving}
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
              disabled={isSaving}
              className="flex-1 bg-secondary-system-background rounded-lg py-3 touch-target-minimum"
              pressedClassName="bg-system-gray-5"
              testID="task-picker-cancel"
              accessibilityRole="button"
            >
              <Text className="text-secondary-label font-medium text-center text-callout">
                {t('common.cancel')}
              </Text>
            </AppPressable>

            <AppPressable
              onPress={handleConfirm}
              busy={isSaving}
              feedback="select"
              className="flex-1 bg-system-blue rounded-lg py-3 touch-target-minimum"
              pressedClassName="bg-business-dark"
              testID="task-picker-confirm"
              accessibilityRole="button"
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
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  primaryActionLabel: {
    color: DesignSystem.colors.system.systemBackground,
  },
})
