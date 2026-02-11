import React from 'react'
import { TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Statistics } from '@/src/components/Statistics'
import { useAppStore } from '@/src/stores/app-store'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function StatsScreen() {
  const insets = useSafeAreaInsets()
  const { categories, getStatsForPeriod } = useAppStore()

  const weeklyStats = getStatsForPeriod('week')
  const monthlyStats = getStatsForPeriod('month')

  return (
    <Box className="flex-1 bg-white" testID="stats-screen">
      <VStack className="flex-1" style={{ paddingTop: insets.top }}>
        <Box className="px-4 pt-4 pb-2">
          <HStack className="justify-between items-center mb-2">
            <Box className="flex-1">
              <Text
                className="text-2xl font-bold text-gray-800 text-center"
                testID="stats-title"
              >
                Stats
              </Text>
            </Box>
            <TouchableOpacity
              onPress={() => router.push('/modal')}
              className="p-2 min-w-[44px] min-h-[44px] items-center justify-center"
              testID="settings-button"
              accessibilityLabel="設定"
              accessibilityRole="button"
            >
              <Ionicons name="settings-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          </HStack>
          <Text
            className="text-gray-600 text-center text-sm"
            testID="stats-description"
          >
            習慣の達成状況と統計を確認しましょう
          </Text>
        </Box>

        <Statistics
          weeklyStats={weeklyStats}
          monthlyStats={monthlyStats}
          categories={categories}
        />
      </VStack>
    </Box>
  )
}
