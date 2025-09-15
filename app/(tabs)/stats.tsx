import React from 'react'
import { Box } from '@/components/ui/box'
import { Statistics } from '@/src/components/Statistics'
import { useAppStore } from '@/src/stores/app-store'

export default function StatsScreen() {
  const { categories, getStatsForPeriod } = useAppStore()

  const weeklyStats = getStatsForPeriod('week')
  const monthlyStats = getStatsForPeriod('month')

  return (
    <Box className="flex-1 bg-white" testID="stats-screen">
      <Statistics
        weeklyStats={weeklyStats}
        monthlyStats={monthlyStats}
        categories={categories}
      />
    </Box>
  )
}
