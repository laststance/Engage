/**
 * Empty State Component with Apple HIG-compliant styling
 * Provides consistent empty state messaging and actions
 */

import React from 'react'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { EnhancedPressable } from './enhanced-pressable'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  testID?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'tray',
  title,
  description,
  actionLabel,
  onAction,
  testID = 'empty-state',
}) => {
  return (
    <Box className="flex-1 items-center justify-center p-8" testID={testID}>
      <VStack className="items-center max-w-sm" space="lg">
        {/* Icon */}
        <Box className="w-16 h-16 items-center justify-center bg-system-gray-6 rounded-full">
          <IconSymbol name={icon} size={32} color="#8E8E93" />
        </Box>

        {/* Content */}
        <VStack className="items-center" space="sm">
          <Text className="text-title-3 text-label text-center font-semibold">
            {title}
          </Text>

          {description && (
            <Text className="text-body text-secondary-label text-center">
              {description}
            </Text>
          )}
        </VStack>

        {/* Action Button */}
        {actionLabel && onAction && (
          <EnhancedPressable
            variant="primary"
            size="medium"
            onPress={onAction}
            className="mt-4"
            testID={`${testID}-action`}
          >
            <Text className="text-callout text-white font-medium">
              {actionLabel}
            </Text>
          </EnhancedPressable>
        )}
      </VStack>
    </Box>
  )
}

export default EmptyState
