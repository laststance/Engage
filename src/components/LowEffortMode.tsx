/**
 * Low Effort Mode Component
 * Provides encouraging placeholders and simplified interactions for low-motivation days
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { EnhancedPressable } from './ui/enhanced-pressable'

interface LowEffortModeProps {
  isActive: boolean
  onToggle: () => void
  onQuickWin: () => void
}

export const LowEffortMode: React.FC<LowEffortModeProps> = ({
  isActive,
  onToggle,
  onQuickWin,
}) => {
  const { t } = useTranslation()

  const encouragingMessageKeys = [
    'lowEffort.encouragement1',
    'lowEffort.encouragement2',
    'lowEffort.encouragement3',
    'lowEffort.encouragement4',
    'lowEffort.encouragement5',
    'lowEffort.encouragement6',
  ] as const

  const quickWinSuggestions = [
    { icon: 'book', titleKey: 'lowEffort.quickReading', descKey: 'lowEffort.quickReadingDesc' },
    { icon: 'figure.walk', titleKey: 'lowEffort.quickWalk', descKey: 'lowEffort.quickWalkDesc' },
    { icon: 'cup.and.saucer', titleKey: 'lowEffort.quickTea', descKey: 'lowEffort.quickTeaDesc' },
    { icon: 'heart', titleKey: 'lowEffort.quickBreathing', descKey: 'lowEffort.quickBreathingDesc' },
    { icon: 'music.note', titleKey: 'lowEffort.quickMusic', descKey: 'lowEffort.quickMusicDesc' },
    { icon: 'sun.max', titleKey: 'lowEffort.quickSun', descKey: 'lowEffort.quickSunDesc' },
  ] as const

  const todayMessage = t(encouragingMessageKeys[new Date().getDay() % encouragingMessageKeys.length])
  const todayQuickWin = quickWinSuggestions[new Date().getDay() % quickWinSuggestions.length]

  if (!isActive) {
    return (
      <Box className="p-4 bg-system-gray-6 rounded-lg border border-system-gray-4">
        <HStack className="items-center justify-between">
          <VStack className="flex-1" space="xs">
            <Text className="text-callout font-medium text-label">
              {t('lowEffort.notFeelingIt')}
            </Text>
            <Text className="text-footnote text-secondary-label">
              {t('lowEffort.enableDescription')}
            </Text>
          </VStack>

          <EnhancedPressable
            variant="secondary"
            size="small"
            onPress={onToggle}
            testID="enable-low-effort-mode"
          >
            <HStack className="items-center" space="xs">
              <IconSymbol name="heart" size={16} color="#007AFF" />
              <Text className="text-footnote text-system-blue font-medium">
                {t('lowEffort.enable')}
              </Text>
            </HStack>
          </EnhancedPressable>
        </HStack>
      </Box>
    )
  }

  return (
    <Box className="p-6 bg-gradient-to-br from-life-light to-business-light rounded-xl border border-system-gray-4 shadow-ios-small">
      <VStack space="lg">
        {/* Header */}
        <HStack className="items-center justify-between">
          <HStack className="items-center" space="sm">
            <Box className="w-8 h-8 bg-system-green rounded-full items-center justify-center">
              <IconSymbol name="heart.fill" size={20} color="white" />
            </Box>
            <Text className="text-headline font-semibold text-label">
              {t('lowEffort.title')}
            </Text>
          </HStack>

          <EnhancedPressable
            variant="ghost"
            size="small"
            onPress={onToggle}
            testID="disable-low-effort-mode"
          >
            <IconSymbol name="xmark" size={20} color="#8E8E93" />
          </EnhancedPressable>
        </HStack>

        {/* Encouraging Message */}
        <Box className="p-4 bg-system-background/60 rounded-lg">
          <Text className="text-callout text-secondary-label text-center italic">
            &quot;{todayMessage}&quot;
          </Text>
        </Box>

        {/* Quick Win Suggestion */}
        <VStack space="sm">
          <Text className="text-subhead font-medium text-label">
            {t('lowEffort.todayRecommended')}
          </Text>

          <EnhancedPressable
            variant="secondary"
            onPress={onQuickWin}
            className="w-full"
            testID="quick-win-action"
          >
            <HStack className="items-center" space="md">
              <Box className="w-12 h-12 bg-system-blue/10 rounded-full items-center justify-center">
                <IconSymbol
                  name={todayQuickWin.icon as any}
                  size={24}
                  color="#007AFF"
                />
              </Box>

              <VStack className="flex-1" space="xs">
                <Text className="text-callout font-medium text-label">
                  {t(todayQuickWin.titleKey)}
                </Text>
                <Text className="text-footnote text-secondary-label">
                  {t(todayQuickWin.descKey)}
                </Text>
              </VStack>

              <IconSymbol name="chevron.right" size={16} color="#8E8E93" />
            </HStack>
          </EnhancedPressable>
        </VStack>

        {/* Gentle Reminders */}
        <VStack space="xs">
          <Text className="text-footnote text-tertiary-label text-center">
            {t('lowEffort.tipPerfection')}
          </Text>
          <Text className="text-footnote text-tertiary-label text-center">
            {t('lowEffort.tipSmallSteps')}
          </Text>
        </VStack>
      </VStack>
    </Box>
  )
}

export default LowEffortMode
