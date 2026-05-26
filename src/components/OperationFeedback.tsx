import React from 'react'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { HStack } from '@/components/ui/hstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { AppPressable } from '@/src/components/AppPressable'

export type OperationFeedbackKind = 'saving' | 'success' | 'error' | 'info'

interface OperationFeedbackProps {
  kind: OperationFeedbackKind
  message: string
  actionLabel?: string
  onAction?: () => void
  testID?: string
}

const FEEDBACK_STYLES: Record<
  OperationFeedbackKind,
  {
    container: string
    text: string
    action: string
    actionPressed: string
    icon: React.ComponentProps<typeof IconSymbol>['name']
    iconColor: string
  }
> = {
  saving: {
    container: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    action: 'bg-blue-100',
    actionPressed: 'bg-blue-200',
    icon: 'arrow.clockwise',
    iconColor: '#1D4ED8',
  },
  success: {
    container: 'bg-green-50 border-green-200',
    text: 'text-green-700',
    action: 'bg-green-100',
    actionPressed: 'bg-green-200',
    icon: 'checkmark.circle.fill',
    iconColor: '#15803D',
  },
  error: {
    container: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    action: 'bg-red-100',
    actionPressed: 'bg-red-200',
    icon: 'exclamationmark.triangle.fill',
    iconColor: '#B91C1C',
  },
  info: {
    container: 'bg-gray-50 border-gray-200',
    text: 'text-gray-700',
    action: 'bg-gray-100',
    actionPressed: 'bg-gray-200',
    icon: 'info.circle.fill',
    iconColor: '#4B5563',
  },
}

/**
 * Shows a consistent inline status banner for recoverable app operations.
 * @param props - Feedback kind, message, and optional recovery action.
 * @returns A compact feedback banner that can sit near the affected control.
 * @example
 * <OperationFeedback kind="error" message="Save failed" actionLabel="Retry" onAction={retrySave} />
 */
export function OperationFeedback({
  actionLabel,
  kind,
  message,
  onAction,
  testID = 'operation-feedback',
}: OperationFeedbackProps) {
  const styles = FEEDBACK_STYLES[kind]
  const hasAction = Boolean(actionLabel && onAction)

  return (
    <Box
      accessibilityLiveRegion="polite"
      className={`rounded-lg border p-3 ${styles.container}`}
      testID={testID}
    >
      <HStack className="items-center justify-between" space="sm">
        <HStack className="flex-1 items-center" space="sm">
          <IconSymbol name={styles.icon} size={16} color={styles.iconColor} />
          <Text className={`flex-1 text-sm ${styles.text}`}>{message}</Text>
        </HStack>

        {hasAction && (
          <AppPressable
            onPress={onAction}
            feedback="select"
            className={`rounded-md px-3 py-2 ${styles.action}`}
            pressedClassName={styles.actionPressed}
            testID={`${testID}-action`}
            accessibilityRole="button"
          >
            <Text className={`text-sm font-semibold ${styles.text}`}>
              {actionLabel}
            </Text>
          </AppPressable>
        )}
      </HStack>
    </Box>
  )
}
