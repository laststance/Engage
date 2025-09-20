/**
 * Tooltip Component with Apple HIG-compliant styling
 * Provides contextual help and guidance
 */

import React, { useState, useEffect } from 'react'
import { Modal, Pressable, Dimensions } from 'react-native'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { EnhancedPressable } from './enhanced-pressable'

interface TooltipProps {
  isVisible: boolean
  title: string
  message: string
  targetPosition?: { x: number; y: number; width: number; height: number }
  onClose: () => void
  onNext?: () => void
  onPrevious?: () => void
  currentStep?: number
  totalSteps?: number
  showSkip?: boolean
  onSkip?: () => void
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

export const Tooltip: React.FC<TooltipProps> = ({
  isVisible,
  title,
  message,
  targetPosition,
  onClose,
  onNext,
  onPrevious,
  currentStep,
  totalSteps,
  showSkip = false,
  onSkip,
}) => {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (targetPosition) {
      // Calculate tooltip position relative to target
      const tooltipWidth = 280
      const tooltipHeight = 120
      const margin = 16

      let top = targetPosition.y + targetPosition.height + margin
      let left = targetPosition.x + targetPosition.width / 2 - tooltipWidth / 2

      // Adjust if tooltip goes off screen
      if (left < margin) left = margin
      if (left + tooltipWidth > screenWidth - margin) {
        left = screenWidth - tooltipWidth - margin
      }

      // If tooltip goes below screen, show above target
      if (top + tooltipHeight > screenHeight - 100) {
        top = targetPosition.y - tooltipHeight - margin
      }

      setTooltipPosition({ top, left })
    }
  }, [targetPosition])

  if (!isVisible) return null

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Pressable
        className="flex-1 bg-black/40"
        onPress={onClose}
        testID="tooltip-overlay"
      >
        {/* Highlight Target Area */}
        {targetPosition && (
          <Box
            className="absolute border-2 border-system-blue rounded-lg bg-transparent"
            style={{
              top: targetPosition.y - 4,
              left: targetPosition.x - 4,
              width: targetPosition.width + 8,
              height: targetPosition.height + 8,
            }}
          />
        )}

        {/* Tooltip Content */}
        <Pressable
          className="absolute bg-system-background rounded-xl p-4 shadow-ios-modal border border-system-gray-4"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: 280,
            maxWidth: screenWidth - 32,
          }}
          onPress={(e) => e.stopPropagation()}
          testID="tooltip-content"
        >
          <VStack space="md">
            {/* Header */}
            <HStack className="items-center justify-between">
              <Text className="text-headline font-semibold text-label flex-1">
                {title}
              </Text>

              {currentStep && totalSteps && (
                <Text className="text-caption-1 text-tertiary-label">
                  {currentStep}/{totalSteps}
                </Text>
              )}
            </HStack>

            {/* Message */}
            <Text className="text-callout text-secondary-label">{message}</Text>

            {/* Actions */}
            <HStack className="justify-between items-center">
              <HStack space="sm">
                {onPrevious && (
                  <EnhancedPressable
                    variant="ghost"
                    size="small"
                    onPress={onPrevious}
                    testID="tooltip-previous"
                  >
                    <Text className="text-footnote text-system-blue">戻る</Text>
                  </EnhancedPressable>
                )}
              </HStack>

              <HStack space="sm">
                {showSkip && onSkip && (
                  <EnhancedPressable
                    variant="ghost"
                    size="small"
                    onPress={onSkip}
                    testID="tooltip-skip"
                  >
                    <Text className="text-footnote text-tertiary-label">
                      スキップ
                    </Text>
                  </EnhancedPressable>
                )}

                {onNext ? (
                  <EnhancedPressable
                    variant="primary"
                    size="small"
                    onPress={onNext}
                    testID="tooltip-next"
                  >
                    <Text className="text-footnote text-white font-medium">
                      次へ
                    </Text>
                  </EnhancedPressable>
                ) : (
                  <EnhancedPressable
                    variant="primary"
                    size="small"
                    onPress={onClose}
                    testID="tooltip-close"
                  >
                    <Text className="text-footnote text-white font-medium">
                      完了
                    </Text>
                  </EnhancedPressable>
                )}
              </HStack>
            </HStack>
          </VStack>

          {/* Arrow pointing to target */}
          {targetPosition && (
            <Box
              className="absolute w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-system-background"
              style={{
                top: -8,
                left: '50%',
                marginLeft: -8,
              }}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

export default Tooltip
