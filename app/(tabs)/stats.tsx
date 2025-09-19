import React from 'react'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { Statistics } from '@/src/components/Statistics'
import { useAppStore } from '@/src/stores/app-store'

export default function StatsScreen() {
  const { categories, getStatsForPeriod } = useAppStore()

  const weeklyStats = getStatsForPeriod('week')
  const monthlyStats = getStatsForPeriod('month')

  return (
    <Box className="flex-1 bg-white" testID="stats-screen">
      <VStack className="flex-1">
        <Box className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-gray-800 text-center mb-2" testID="stats-title">
            Stats
          </Text>
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
