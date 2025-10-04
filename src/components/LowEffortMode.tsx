/**
 * Low Effort Mode Component
 * Provides encouraging placeholders and simplified interactions for low-motivation days
 */

import React from 'react'
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

const encouragingMessages = [
  '今日は小さな一歩でも十分です',
  '完璧でなくても、続けることが大切',
  '今日できることから始めましょう',
  '少しでも前進すれば成功です',
  '無理をせず、自分のペースで',
  '今日の小さな努力が明日につながります',
]

const quickWinSuggestions = [
  { icon: 'book', title: '5分読書', description: '好きな本を少しだけ' },
  { icon: 'figure.walk', title: '散歩', description: '外の空気を吸いに' },
  {
    icon: 'cup.and.saucer',
    title: 'お茶タイム',
    description: 'ゆっくり一息つく',
  },
  { icon: 'heart', title: '深呼吸', description: '3回深く呼吸する' },
  {
    icon: 'music.note',
    title: '好きな音楽',
    description: '1曲聴いてリラックス',
  },
  { icon: 'sun.max', title: '日光浴', description: '窓際で日光を浴びる' },
]

export const LowEffortMode: React.FC<LowEffortModeProps> = ({
  isActive,
  onToggle,
  onQuickWin,
}) => {
  const todayMessage =
    encouragingMessages[new Date().getDay() % encouragingMessages.length]
  const todayQuickWin =
    quickWinSuggestions[new Date().getDay() % quickWinSuggestions.length]

  if (!isActive) {
    return (
      <Box className="p-4 bg-system-gray-6 rounded-lg border border-system-gray-4">
        <HStack className="items-center justify-between">
          <VStack className="flex-1" space="xs">
            <Text className="text-callout font-medium text-label">
              今日は調子が出ませんか？
            </Text>
            <Text className="text-footnote text-secondary-label">
              低負荷モードで無理なく続けましょう
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
                有効にする
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
              低負荷モード
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
            今日のおすすめアクション
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
                  {todayQuickWin.title}
                </Text>
                <Text className="text-footnote text-secondary-label">
                  {todayQuickWin.description}
                </Text>
              </VStack>

              <IconSymbol name="chevron.right" size={16} color="#8E8E93" />
            </HStack>
          </EnhancedPressable>
        </VStack>

        {/* Gentle Reminders */}
        <VStack space="xs">
          <Text className="text-footnote text-tertiary-label text-center">
            💡 完璧を目指さず、継続を大切に
          </Text>
          <Text className="text-footnote text-tertiary-label text-center">
            🌱 小さな積み重ねが大きな変化を生みます
          </Text>
        </VStack>
      </VStack>
    </Box>
  )
}

export default LowEffortMode
