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
  }> = ({ title, value, subtitle, icon, color = 'text-system-blue' }) => (
    <Box className="bg-system-background rounded-xl p-4 shadow-ios-card border border-system-gray-5">
      <VStack space="sm">
        <HStack className="items-center justify-between">
          <Text className="text-footnote font-medium text-secondary-label">
            {title}
          </Text>
          <Text className="text-quaternary-label">📊</Text>
        </HStack>
        <Text className={`text-title-1 font-bold ${color}`}>{value}</Text>
        {subtitle && (
          <Text className="text-caption-1 text-tertiary-label">{subtitle}</Text>
        )}
      </VStack>
    </Box>
  )

  return (
    <Box className="flex-1 bg-gray-50" testID="statistics-screen">
      <ScrollView className="flex-1">
        <VStack space="lg" className="p-4">
          {/* Header */}
          <VStack space="md">
            <Text className="text-large-title font-bold text-label">実績</Text>

            {/* Period Toggle */}
            <HStack className="bg-secondary-system-background rounded-lg p-1">
              <Pressable
                onPress={() => setSelectedPeriod('week')}
                className={({ pressed }) => `
                  flex-1 py-2 px-4 rounded-md touch-target-minimum transition-all duration-150
                  ${
                    selectedPeriod === 'week'
                      ? 'bg-system-background shadow-ios-small'
                      : ''
                  }
                  ${pressed ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}
                `}
                testID="stats-week-toggle"
              >
                <Text
                  className={`
                    text-center font-medium text-callout
                    ${
                      selectedPeriod === 'week'
                        ? 'text-label'
                        : 'text-tertiary-label'
                    }
                  `}
                >
                  今週
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedPeriod('month')}
                className={({ pressed }) => `
                  flex-1 py-2 px-4 rounded-md touch-target-minimum transition-all duration-150
                  ${
                    selectedPeriod === 'month'
                      ? 'bg-system-background shadow-ios-small'
                      : ''
                  }
                  ${pressed ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}
                `}
                testID="stats-month-toggle"
              >
                <Text
                  className={`
                    text-center font-medium text-callout
                    ${
                      selectedPeriod === 'month'
                        ? 'text-label'
                        : 'text-tertiary-label'
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
            <Text className="text-headline font-semibold text-label">
              今日の成果
            </Text>
            <Box className="bg-gradient-to-r from-system-blue to-system-green rounded-xl p-6 shadow-ios-medium">
              <VStack space="sm" className="items-center">
                <IconSymbol name="star.fill" size={32} color="white" />
                <Text className="text-white text-title-2 font-bold">
                  {currentStats.streakDays}日連続
                </Text>
                <Text className="text-white/80 text-center text-callout">
                  素晴らしい継続力です！
                </Text>
              </VStack>
            </Box>
          </VStack>

          {/* Key Metrics */}
          <VStack space="sm">
            <Text className="text-headline font-semibold text-label">
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
                    color="text-system-green"
                  />
                </Box>
                <Box className="flex-1">
                  <StatCard
                    title="アクティブ日数"
                    value={`${currentStats.activeDays}日`}
                    icon="calendar"
                    color="text-system-blue"
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
                    color="text-system-purple"
                  />
                </Box>
                <Box className="flex-1">
                  <StatCard
                    title="1日平均"
                    value={`${currentStats.dailyAverage.toFixed(1)}個`}
                    icon="chart.bar.fill"
                    color="text-system-orange"
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
                color="text-system-indigo"
              />
            </VStack>
          </VStack>

          {/* Category Breakdown */}
          <VStack space="sm">
            <Text className="text-headline font-semibold text-label">
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
                      className="bg-system-background rounded-lg p-4 border border-system-gray-5 shadow-ios-small"
                    >
                      <VStack space="sm">
                        <HStack className="items-center justify-between">
                          <HStack className="items-center" space="sm">
                            <Box
                              className={`w-4 h-4 rounded-full ${categoryColor}`}
                            />
                            <Text className="font-medium text-label text-callout">
                              {category?.name || 'Unknown Category'}
                            </Text>
                          </HStack>
                          <Text className="text-footnote text-secondary-label">
                            {stats.completed}/{stats.total}
                          </Text>
                        </HStack>

                        {/* Progress Bar */}
                        <Box className="bg-system-gray-5 rounded-full h-2">
                          <Box
                            className={`h-2 rounded-full ${categoryColor} transition-all duration-300`}
                            style={{ width: `${completionRate * 100}%` }}
                          />
                        </Box>

                        <Text className="text-caption-1 text-tertiary-label">
                          完了率: {formatPercentage(completionRate)}
                        </Text>
                      </VStack>
                    </Box>
                  )
                }
              )}

              {Object.keys(currentStats.categoryBreakdown).length === 0 && (
                <Box className="bg-system-background rounded-lg p-8 border border-system-gray-5 shadow-ios-small">
                  <VStack className="items-center" space="sm">
                    <IconSymbol name="chart.bar" size={32} color="#8E8E93" />
                    <Text className="text-tertiary-label text-center text-callout">
                      まだデータがありません
                    </Text>
                    <Text className="text-quaternary-label text-footnote text-center">
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
