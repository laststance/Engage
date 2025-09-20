import React, { useState } from 'react'
import { ScrollView } from 'react-native'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { Pressable } from '@/components/ui/pressable'
import { HStack } from '@/components/ui/hstack'
import { VStack } from '@/components/ui/vstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { StatsData, Category } from '@/src/types'

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
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week')

  const currentStats = selectedPeriod === 'week' ? weeklyStats : monthlyStats

  // Get category color
  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return 'bg-gray-500'

    // Default colors for preset categories
    if (category.name === '事業') return 'bg-blue-500'
    if (category.name === '生活') return 'bg-green-500'

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
    icon: string
    color?: string
  }> = ({ title, value, subtitle, icon, color = 'text-blue-500' }) => (
    <Box className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
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

  return (
    <Box className="flex-1 bg-gray-50" testID="statistics-screen">
      <ScrollView className="flex-1">
        <VStack space="lg" className="p-4">
          {/* Header */}
          <VStack space="md">
            <Text className="text-2xl font-bold text-gray-800">実績</Text>

            {/* Period Toggle */}
            <HStack className="bg-gray-200 rounded-lg p-1">
              <Pressable
                onPress={() => setSelectedPeriod('week')}
                className={`
                  flex-1 py-2 px-4 rounded-md
                  ${selectedPeriod === 'week' ? 'bg-white shadow-sm' : ''}
                `}
                testID="stats-week-toggle"
              >
                <Text
                  className={`
                    text-center font-medium
                    ${
                      selectedPeriod === 'week'
                        ? 'text-gray-800'
                        : 'text-gray-500'
                    }
                  `}
                >
                  今週
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedPeriod('month')}
                className={`
                  flex-1 py-2 px-4 rounded-md
                  ${selectedPeriod === 'month' ? 'bg-white shadow-sm' : ''}
                `}
                testID="stats-month-toggle"
              >
                <Text
                  className={`
                    text-center font-medium
                    ${
                      selectedPeriod === 'month'
                        ? 'text-gray-800'
                        : 'text-gray-500'
                    }
                  `}
                >
                  今月
                </Text>
              </Pressable>
            </HStack>
          </VStack>

          {/* Today's Achievements */}
          <VStack space="sm">
            <Text className="text-lg font-semibold text-gray-800">
              今日の成果
            </Text>
            <Box className="bg-gradient-to-r from-blue-500 to-green-500 rounded-xl p-6">
              <VStack space="sm" className="items-center">
                <IconSymbol name="star.fill" size={32} color="white" />
                <Text className="text-white text-xl font-bold">
                  {currentStats.streakDays}日連続
                </Text>
                <Text className="text-white/80 text-center">
                  素晴らしい継続力です！
                </Text>
              </VStack>
            </Box>
          </VStack>

          {/* Key Metrics */}
          <VStack space="sm">
            <Text className="text-lg font-semibold text-gray-800">
              {selectedPeriod === 'week' ? '今週の統計' : '今月の統計'}
            </Text>

            <VStack space="md">
              {/* First Row */}
              <HStack space="md">
                <Box className="flex-1">
                  <StatCard
                    title="完了率"
                    value={formatPercentage(currentStats.completionRate)}
                    icon="chart.pie.fill"
                    color="text-green-600"
                  />
                </Box>
                <Box className="flex-1">
                  <StatCard
                    title="アクティブ日数"
                    value={`${currentStats.activeDays}日`}
                    icon="calendar"
                    color="text-blue-600"
                  />
                </Box>
              </HStack>

              {/* Second Row */}
              <HStack space="md">
                <Box className="flex-1">
                  <StatCard
                    title="総タスク数"
                    value={currentStats.totalTasks}
                    icon="list.bullet"
                    color="text-purple-600"
                  />
                </Box>
                <Box className="flex-1">
                  <StatCard
                    title="1日平均"
                    value={`${currentStats.dailyAverage.toFixed(1)}個`}
                    icon="chart.bar.fill"
                    color="text-orange-600"
                  />
                </Box>
              </HStack>

              {/* Journal Days */}
              <StatCard
                title="日記を書いた日数"
                value={`${currentStats.journalDays}日`}
                subtitle={`全体の${formatPercentage(
                  currentStats.journalDays /
                    Math.max(currentStats.activeDays, 1)
                )}`}
                icon="book.fill"
                color="text-indigo-600"
              />
            </VStack>
          </VStack>

          {/* Category Breakdown */}
          <VStack space="sm">
            <Text className="text-lg font-semibold text-gray-800">
              カテゴリー別実績
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
                      className="bg-white rounded-lg p-4 border border-gray-100"
                    >
                      <VStack space="sm">
                        <HStack className="items-center justify-between">
                          <HStack className="items-center" space="sm">
                            <Box
                              className={`w-4 h-4 rounded-full ${categoryColor}`}
                            />
                            <Text className="font-medium text-gray-800">
                              {category?.name || 'Unknown Category'}
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
                          完了率: {formatPercentage(completionRate)}
                        </Text>
                      </VStack>
                    </Box>
                  )
                }
              )}

              {Object.keys(currentStats.categoryBreakdown).length === 0 && (
                <Box className="bg-white rounded-lg p-8 border border-gray-100">
                  <VStack className="items-center" space="sm">
                    <IconSymbol name="chart.bar" size={32} color="#9CA3AF" />
                    <Text className="text-gray-500 text-center">
                      まだデータがありません
                    </Text>
                    <Text className="text-gray-400 text-sm text-center">
                      タスクを完了すると統計が表示されます
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
