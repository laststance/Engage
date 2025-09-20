/**
 * Loading Spinner Component with Apple HIG-compliant styling
 */

import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { DesignSystem } from '@/constants/design-system'

interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  color?: string
  message?: string
  overlay?: boolean
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = DesignSystem.colors.system.systemBlue,
  message,
  overlay = false,
}) => {
  const content = (
    <VStack className="items-center justify-center" space="md">
      <ActivityIndicator size={size} color={color} testID="loading-spinner" />
      {message && (
        <Text className="text-callout text-secondary-label text-center">
          {message}
        </Text>
      )}
    </VStack>
  )

  if (overlay) {
    return (
      <View
        className="absolute inset-0 bg-system-background/80 items-center justify-center z-50"
        testID="loading-overlay"
      >
        {content}
      </View>
    )
  }

  return content
}

export default LoadingSpinner
