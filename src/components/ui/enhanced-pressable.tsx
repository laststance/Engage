/**
 * Enhanced Pressable Component with Apple HIG-compliant interaction states
 * Provides proper visual feedback, touch targets, and accessibility
 */

import React from 'react'
import {
  Pressable as RNPressable,
  PressableProps,
  ViewStyle,
  Platform,
  View,
} from 'react-native'
import { DesignSystemUtils } from '@/src/utils/designSystem'

interface EnhancedPressableProps extends PressableProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  isLoading?: boolean
  isDisabled?: boolean
  hapticFeedback?: boolean
  children: React.ReactNode
  className?: string
}

export const EnhancedPressable: React.FC<EnhancedPressableProps> = ({
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  isDisabled = false,
  hapticFeedback = true,
  children,
  className = '',
  onPress,
  ...props
}) => {
  const handlePress = (event: any) => {
    if (isLoading || isDisabled) return

    // Add haptic feedback on iOS
    if (hapticFeedback && Platform.OS === 'ios') {
      // Note: Would need expo-haptics for actual implementation
      // HapticFeedback.impactAsync(HapticFeedback.ImpactFeedbackStyle.Light)
    }

    onPress?.(event)
  }

  const getVariantStyles = (pressed: boolean): string => {
    const baseStyles =
      'rounded-lg items-center justify-center transition-all duration-150'

    // Size-based styles
    const sizeStyles = {
      small: 'px-3 py-2 min-h-[36px]',
      medium: 'px-4 py-3 min-h-[44px]',
      large: 'px-6 py-4 min-h-[56px]',
    }

    // Variant-based styles with interaction states
    const variantStyles = {
      primary: pressed
        ? 'bg-business-dark shadow-ios-small'
        : 'bg-system-blue shadow-ios-medium',
      secondary: pressed
        ? 'bg-system-gray-5 shadow-ios-small'
        : 'bg-secondary-system-background shadow-ios-small',
      tertiary: pressed
        ? 'bg-system-gray-6 border border-system-gray-3'
        : 'bg-transparent border border-system-gray-4',
      ghost: pressed ? 'bg-system-gray-6' : 'bg-transparent',
    }

    // Disabled styles
    const disabledStyles = isDisabled ? 'opacity-40' : ''

    // Loading styles
    const loadingStyles = isLoading ? 'opacity-70' : ''

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${disabledStyles} ${loadingStyles}`
  }

  return (
    <RNPressable
      {...props}
      onPress={handlePress}
      disabled={isDisabled || isLoading}
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled || isLoading,
        busy: isLoading,
      }}
    >
      {({ pressed }) => (
        <View
          className={`${getVariantStyles(pressed)} ${className}`}
        >
          {children}
        </View>
      )}
    </RNPressable>
  )
}

export default EnhancedPressable
