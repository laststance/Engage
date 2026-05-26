import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AppPressable } from '@/src/components/AppPressable'
import { AppScreen } from '@/src/components/AppScreen'
import { Statistics } from '@/src/components/Statistics'
import { useAppStore } from '@/src/stores/app-store'

export default function StatsScreen() {
  const { t } = useTranslation()
  const { categories, getStatsForPeriod } = useAppStore()

  const weeklyStats = getStatsForPeriod('week')
  const monthlyStats = getStatsForPeriod('month')

  return (
    <AppScreen
      description={t('stats.description')}
      descriptionTestID="stats-description"
      rightAction={
        <AppPressable
          onPress={() => router.push('/modal')}
          className="p-2 min-w-[44px] min-h-[44px] items-center justify-center"
          pressedClassName="bg-gray-100 rounded-full"
          testID="settings-button"
          accessibilityLabel={t('stats.settingsLabel')}
          accessibilityRole="button"
        >
          <Ionicons name="settings-outline" size={24} color="#6B7280" />
        </AppPressable>
      }
      testID="stats-screen"
      title={t('stats.title')}
      titleTestID="stats-title"
    >
      <Statistics
        weeklyStats={weeklyStats}
        monthlyStats={monthlyStats}
        categories={categories}
      />
    </AppScreen>
  )
}
