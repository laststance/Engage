import { useOptimistic, useState, useTransition } from 'react'
import { AccessibilityInfo, Platform } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Box } from '@/components/ui/box'
import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { AppPressable } from '@/src/components/AppPressable'
import { ConditionIcon } from '@/src/components/ConditionIcon'
import { CONDITION_APPEARANCE, CONDITION_LEVELS } from '@/src/constants/condition'
import type { ConditionLevel, Entry } from '@/src/types'

interface ConditionPickerProps {
  value: Entry['conditionLevel']
  onChangeAction: (level: ConditionLevel | null) => Promise<boolean>
  disabled?: boolean
}

/**
 * Records a day's overall condition in one tap whenever DaySheet displays its always-visible choices.
 * @param props - The saved condition, date-bound save action, and initialization readiness.
 * @returns Five labeled choices with immediate feedback, explicit clearing, and recoverable save errors.
 * @example <ConditionPicker value={null} onChangeAction={saveCondition} />
 */
export function ConditionPicker({ value, onChangeAction, disabled = false }: ConditionPickerProps) {
  const { t } = useTranslation()
  const [optimisticLevel, setOptimisticLevel] = useOptimistic(value ?? null)
  const [isPending, startTransition] = useTransition()
  const [hasSaveError, setHasSaveError] = useState(false)
  const savedMessage = value == null
    ? t('condition.unrecorded')
    : t('condition.saved', { label: t(CONDITION_APPEARANCE[value].label) })

  /**
   * Saves a pressed face or Clear, reverting failures and announcing the persistence result on iOS.
   * @param level - The chosen condition, or null for an explicit clear.
   * @returns Nothing; the transition tracks persistence and keeps the current date's feedback local.
   * @example handleChange(2) // => immediately selects Low, then persists it
   */
  function handleChange(level: ConditionLevel | null) {
    // Repeated presses on the saved level do not erase the record or queue redundant writes.
    if (disabled || isPending || level === optimisticLevel) return
    setHasSaveError(false)
    startTransition(async () => {
      setOptimisticLevel(level)
      let didSave = false
      try {
        didSave = await onChangeAction(level)
      } catch {
        // Thrown writes use the same recoverable feedback as rejected saves.
      }
      setHasSaveError(!didSave)

      // iOS does not announce the Android live region, so confirm the completed write explicitly.
      if (Platform.OS === 'ios') {
        const announcement = !didSave
          ? t('condition.saveFailed')
          : level == null
            ? t('condition.unrecorded')
            : t('condition.saved', { label: t(CONDITION_APPEARANCE[level].label) })
        AccessibilityInfo.announceForAccessibility(announcement)
      }
    })
  }

  return (
    <VStack className="rounded-2xl border border-gray-200 bg-white px-3 pt-3 pb-1" space="sm" testID="condition-picker">
      <Text className="font-semibold text-gray-800">{t('condition.title')}</Text>
      <HStack space="xs" accessibilityRole="radiogroup" accessibilityLabel={t('condition.description')}>
        {CONDITION_LEVELS.map((level) => (
          <AppPressable
            key={level}
            accessible
            accessibilityRole="radio"
            accessibilityLabel={t(CONDITION_APPEARANCE[level].label)}
            checked={optimisticLevel === level}
            disabled={disabled || isPending}
            feedback="select"
            hitSlop={0}
            onPress={() => handleChange(level)}
            testID={`condition-option-${level}`}
            className={`flex-1 min-w-[44px] items-center rounded-xl border-2 px-1 py-2 ${optimisticLevel === level ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}
            pressedClassName="bg-blue-50"
          >
            <ConditionIcon level={level} />
            <Text className="mt-2 text-center text-xs font-medium text-gray-800">
              {t(CONDITION_APPEARANCE[level].label)}
            </Text>
          </AppPressable>
        ))}
      </HStack>
      <HStack className="items-center justify-between" space="sm">
        <Box className="flex-1">
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole={hasSaveError ? 'alert' : undefined}
            className={`text-xs ${hasSaveError ? 'text-red-700' : 'text-gray-500'}`}
            testID="condition-save-status"
          >
            {hasSaveError
              ? t('condition.saveFailed')
              : isPending
                ? t('common.saving')
                : savedMessage}
          </Text>
        </Box>
        <AppPressable
          onPress={() => handleChange(null)}
          disabled={disabled || isPending || optimisticLevel === null}
          feedback="select"
          hitSlop={0}
          accessibilityRole="button"
          accessibilityLabel={t('condition.clearLabel')}
          testID="condition-clear"
          className={`min-h-[44px] min-w-[44px] items-center justify-center px-1 ${optimisticLevel === null ? 'opacity-40' : ''}`}
        >
          <Text className="text-xs text-blue-600">{t('condition.clear')}</Text>
        </AppPressable>
      </HStack>
    </VStack>
  )
}
