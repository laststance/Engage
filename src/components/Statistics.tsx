import React, { useState } from 'react'
import { ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { Pressable } from '@/components/ui/pressable'
import { HStack } from '@/components/ui/hstack'
import { VStack } from '@/components/ui/vstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { StatsData, Category } from '@/src/types'
import { getCategoryDisplayName } from '@/src/i18n/config'

interface StatisticsProps {
  weeklyStats: StatsData
  monthlyStats: StatsData
  categories: Category[]
}

export const Statistics: React.FC<StatisticsProps> = ({
  weeklyStats,
  monthlyStats,
  categories,
}) => {
  const { t } = useTranslation()
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week')

  const currentStats = selectedPeriod === 'week' ? weeklyStats : monthlyStats

  // Get category color
  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return 'bg-gray-500'

    // Default colors for preset categories
    if (category.id === 'business') return 'bg-blue-500'
    if (category.id === 'life') return 'bg-green-500'

    // Generate colors for custom categories
    const colors = [
      'bg-orange-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
    ]
    const index = categoryId.length % colors.length
    return colors[index]
  }

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`
  }

  const StatCard: React.FC<{
    title: string
    value: string | number
    subtitle?: string
    color?: string
  }> = ({ title, value, subtitle, color = 'text-blue-600' }) => (
    <Box className="bg-white rounded-xl p-4 border border-gray-200">
      <VStack space="sm">
        <HStack className="items-center justify-between">
          <Text className="text-sm font-medium text-gray-600">{title}</Text>
          <Text className="text-gray-400">📊</Text>
        </HStack>
        <Text className={`text-2xl font-bold ${color}`}>{value}</Text>
        {subtitle && <Text className="text-xs text-gray-500">{subtitle}</Text>}
      </VStack>
    </Box>
  )

  /**
   * Get localized streak encouragement message based on streak count.
   * @param streakDays - Number of consecutive streak days
   * @returns Translated encouragement string
   * @example
   * getStreakEncouragement(0) // => '今日から始めましょう！' (ja)
   * getStreakEncouragement(5) // => '素晴らしい継続力です！' (ja)
   */
  const getStreakEncouragement = (streakDays: number): string => {
    if (streakDays === 0) return t('stats.streakEncourageStart')
    if (streakDays < 3) return t('stats.streakEncourageGood')
    if (streakDays < 7) return t('stats.streakEncourageGreat')
    return t('stats.streakEncourageAmazing')
  }

  return (
    <Box className="flex-1 bg-gray-50" testID="statistics-screen">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={true}
        bounces={true}
        nestedScrollEnabled={true}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <VStack space="lg" className="p-4">
          {/* Header */}
          <VStack space="md">
            <Text className="text-3xl font-bold text-gray-800">{t('stats.title')}</Text>

            {/* Period Toggle */}
            <HStack className="bg-gray-200 rounded-lg p-1">
              <Pressable
                onPress={() => setSelectedPeriod('week')}
                testID="stats-week-toggle"
                className="flex-1"
                accessibilityLabel={t('stats.showWeekStats')}
                accessibilityRole="button"
              >
                <Box
                  className={`
                    py-3 px-4 rounded-md min-h-[44px] justify-center
                    ${selectedPeriod === 'week' ? 'bg-white' : 'bg-transparent'}
                  `}
                >
                  <Text
                    className={`
                      text-center font-medium
                      ${
                        selectedPeriod === 'week'
                          ? 'text-gray-800'
                          : 'text-gray-600'
                      }
                    `}
                  >
                    {t('stats.thisWeek')}
                  </Text>
                </Box>
              </Pressable>

              <Pressable
                onPress={() => setSelectedPeriod('month')}
                testID="stats-month-toggle"
                className="flex-1"
                accessibilityLabel={t('stats.showMonthStats')}
                accessibilityRole="button"
              >
                <Box
                  className={`
                    py-3 px-4 rounded-md min-h-[44px] justify-center
                    ${
                      selectedPeriod === 'month' ? 'bg-white' : 'bg-transparent'
                    }
                  `}
                >
                  <Text
                    className={`
                      text-center font-medium
                      ${
                        selectedPeriod === 'month'
                          ? 'text-gray-800'
                          : 'text-gray-600'
                      }
                    `}
                  >
                    {t('stats.thisMonth')}
                  </Text>
                </Box>
              </Pressable>
            </HStack>
          </VStack>

          {/* Today's Achievements */}
          <VStack space="sm">
            <Text className="text-xl font-semibold text-gray-800">
              {t('stats.todayAchievements')}
            </Text>
            <Box className="bg-blue-700 rounded-xl p-6">
              <VStack space="sm" className="items-center">
                <IconSymbol name="star.fill" size={32} color="white" />
                <Text className="text-white text-2xl font-bold">
                  {t('stats.streakConsecutive', { count: currentStats.streakDays })}
                </Text>
                <Text className="text-white text-center opacity-90">
                  {getStreakEncouragement(currentStats.streakDays)}
                </Text>
              </VStack>
            </Box>
          </VStack>

          {/* Key Metrics */}
          <VStack space="sm">
            <Text className="text-xl font-semibold text-gray-800">
              {t('stats.periodStats', {
                period: selectedPeriod === 'week' ? t('stats.thisWeek') : t('stats.thisMonth'),
              })}
            </Text>

            <VStack space="md">
              {/* First Row */}
              <HStack space="md">
                <Box className="flex-1">
                  <StatCard
                    title={t('stats.completionRate')}
                    value={formatPercentage(currentStats.completionRate)}
                    color="text-green-600"
                  />
                </Box>
                <Box className="flex-1">
                  <StatCard
                    title={t('stats.activeDays')}
                    value={t('stats.activeDaysValue', { count: currentStats.activeDays })}
                    color="text-blue-600"
                  />
                </Box>
              </HStack>

              {/* Second Row */}
              <HStack space="md">
                <Box className="flex-1">
                  <StatCard
                    title={t('stats.totalTasks')}
                    value={currentStats.totalTasks}
                    color="text-purple-600"
                  />
                </Box>
                <Box className="flex-1">
                  <StatCard
                    title={t('stats.dailyAverage')}
                    value={t('stats.dailyAverageValue', { value: currentStats.dailyAverage.toFixed(1) })}
                    color="text-orange-600"
                  />
                </Box>
              </HStack>

              {/* Journal Days */}
              <StatCard
                title={t('stats.journalDays')}
                value={t('stats.journalDaysValue', { count: currentStats.journalDays })}
                subtitle={t('stats.journalDaysSubtitle', {
                  percentage: formatPercentage(
                    currentStats.journalDays /
                      Math.max(currentStats.activeDays, 1)
                  ),
                })}
                color="text-indigo-600"
              />
            </VStack>
          </VStack>

          {/* Category Breakdown */}
          <VStack space="sm">
            <Text className="text-xl font-semibold text-gray-800">
              {t('stats.categoryBreakdown')}
            </Text>

            <VStack space="xs">
              {Object.entries(currentStats.categoryBreakdown).map(
                ([categoryId, stats]) => {
                  const category = categories.find((c) => c.id === categoryId)
                  const categoryColor = getCategoryColor(categoryId)
                  const completionRate =
                    stats.total > 0 ? stats.completed / stats.total : 0

                  return (
                    <Box
                      key={categoryId}
                      className="bg-white rounded-lg p-4 border border-gray-200"
                    >
                      <VStack space="sm">
                        <HStack className="items-center justify-between">
                          <HStack className="items-center" space="sm">
                            <Box
                              className={`w-4 h-4 rounded-full ${categoryColor}`}
                            />
                            <Text className="font-medium text-gray-800">
                              {category ? getCategoryDisplayName(category) : 'Unknown Category'}
                            </Text>
                          </HStack>
                          <Text className="text-sm text-gray-600">
                            {stats.completed}/{stats.total}
                          </Text>
                        </HStack>

                        {/* Progress Bar */}
                        <Box className="bg-gray-200 rounded-full h-2">
                          <Box
                            className={`h-2 rounded-full ${categoryColor}`}
                            style={{ width: `${completionRate * 100}%` }}
                          />
                        </Box>

                        <Text className="text-xs text-gray-500">
                          {t('stats.categoryCompletionRate', { rate: formatPercentage(completionRate) })}
                        </Text>
                      </VStack>
                    </Box>
                  )
                }
              )}

              {Object.keys(currentStats.categoryBreakdown).length === 0 && (
                <Box className="bg-white rounded-lg p-8 border border-gray-200">
                  <VStack className="items-center" space="sm">
                    <IconSymbol name="chart.bar" size={32} color="#9CA3AF" />
                    <Text className="text-gray-500 text-center">
                      {t('stats.categoryNoData')}
                    </Text>
                    <Text className="text-gray-400 text-sm text-center">
                      {t('stats.categoryNoDataHint')}
                    </Text>
                  </VStack>
                </Box>
              )}
            </VStack>
          </VStack>
        </VStack>
      </ScrollView>
    </Box>
  )
}
