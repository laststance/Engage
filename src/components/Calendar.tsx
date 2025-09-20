import React, { useState, useMemo } from 'react'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { Pressable } from '@/components/ui/pressable'
import { HStack } from '@/components/ui/hstack'
import { VStack } from '@/components/ui/vstack'
import { IconSymbol } from '@/components/ui/icon-symbol'

interface CalendarProps {
  selectedDate: string
  onDateSelect: (date: string) => void
  achievementData: Record<string, number> // date -> completion count
}

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土']
const MONTHS = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
]

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  achievementData,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = new Date(selectedDate)
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })

  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // Get first day of month and how many days in month
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay() // 0 = Sunday, 1 = Monday, etc.

    // Create calendar grid
    const weeks: Array<
      Array<{ date: number; dateString: string; isCurrentMonth: boolean }>
    > = []
    let currentWeek: Array<{
      date: number
      dateString: string
      isCurrentMonth: boolean
    }> = []

    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevMonthDate = new Date(year, month, 0 - (startDayOfWeek - 1 - i))
      currentWeek.push({
        date: prevMonthDate.getDate(),
        dateString: prevMonthDate.toISOString().split('T')[0],
        isCurrentMonth: false,
      })
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      currentWeek.push({
        date: day,
        dateString: date.toISOString().split('T')[0],
        isCurrentMonth: true,
      })

      // If week is complete, start new week
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }

    // Fill remaining cells with next month days
    if (currentWeek.length > 0) {
      const remainingCells = 7 - currentWeek.length
      for (let i = 1; i <= remainingCells; i++) {
        const nextMonthDate = new Date(year, month + 1, i)
        currentWeek.push({
          date: i,
          dateString: nextMonthDate.toISOString().split('T')[0],
          isCurrentMonth: false,
        })
      }
      weeks.push(currentWeek)
    }

    return weeks
  }, [currentMonth])

  const getHeatmapColor = (completionCount: number): string => {
    if (completionCount === 0) return 'bg-heatmap-none'
    if (completionCount === 1) return 'bg-heatmap-low'
    if (completionCount === 2) return 'bg-heatmap-medium'
    if (completionCount === 3) return 'bg-heatmap-high'
    return 'bg-heatmap-highest' // 4+ completions
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1)
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1)
      }
      return newMonth
    })
  }

  const isToday = (dateString: string): boolean => {
    const today = new Date().toISOString().split('T')[0]
    return dateString === today
  }

  const isSelected = (dateString: string): boolean => {
    return dateString === selectedDate
  }

  return (
    <Box className="flex-1 bg-white p-4" testID="calendar-component">
      {/* Header with month navigation */}
      <HStack className="items-center justify-between mb-6">
        <Pressable
          onPress={() => navigateMonth('prev')}
          className={({ pressed }) => `
            p-2 rounded-full touch-target-minimum
            ${
              pressed ? 'bg-system-gray-6 scale-95' : 'bg-transparent scale-100'
            }
            transition-all duration-150
          `}
          testID="calendar-prev-month"
        >
          <IconSymbol name="chevron.left" size={24} color="#666" />
        </Pressable>

        <Text className="text-title-2 text-label" testID="calendar-title">
          {currentMonth.getFullYear()}年{MONTHS[currentMonth.getMonth()]}
        </Text>

        <Pressable
          onPress={() => navigateMonth('next')}
          className={({ pressed }) => `
            p-2 rounded-full touch-target-minimum
            ${
              pressed ? 'bg-system-gray-6 scale-95' : 'bg-transparent scale-100'
            }
            transition-all duration-150
          `}
          testID="calendar-next-month"
        >
          <IconSymbol name="chevron.right" size={24} color="#666" />
        </Pressable>
      </HStack>

      {/* Days of week header */}
      <HStack className="mb-2">
        {DAYS_OF_WEEK.map((day, index) => (
          <Box key={day} className="flex-1 items-center py-2">
            <Text
              className={`text-footnote font-medium ${
                index === 0
                  ? 'text-system-red'
                  : index === 6
                  ? 'text-system-blue'
                  : 'text-secondary-label'
              }`}
            >
              {day}
            </Text>
          </Box>
        ))}
      </HStack>

      {/* Calendar grid */}
      <VStack space="xs">
        {calendarData.map((week, weekIndex) => (
          <HStack key={weekIndex} space="xs">
            {week.map((dayData, dayIndex) => {
              const completionCount = achievementData[dayData.dateString] || 0
              const heatmapColor = getHeatmapColor(completionCount)

              return (
                <Pressable
                  key={`${weekIndex}-${dayIndex}`}
                  onPress={() => onDateSelect(dayData.dateString)}
                  className={({ pressed }) => `
                    flex-1 h-12 items-center justify-center rounded-lg
                    ${pressed ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}
                    transition-all duration-150
                  `}
                  testID={`calendar-date-${dayData.dateString}`}
                >
                  <Box
                    className={`
                      w-full h-full items-center justify-center rounded-lg
                      ${dayData.isCurrentMonth ? heatmapColor : 'bg-gray-50'}
                      ${
                        isSelected(dayData.dateString)
                          ? 'border-2 border-system-blue'
                          : ''
                      }
                      ${
                        isToday(dayData.dateString)
                          ? 'border-2 border-system-orange'
                          : ''
                      }
                    `}
                  >
                    <Text
                      className={`
                        text-footnote font-medium
                        ${
                          dayData.isCurrentMonth
                            ? 'text-label'
                            : 'text-quaternary-label'
                        }
                        ${
                          isSelected(dayData.dateString)
                            ? 'text-system-blue'
                            : ''
                        }
                        ${
                          isToday(dayData.dateString)
                            ? 'text-system-orange'
                            : ''
                        }
                      `}
                    >
                      {dayData.date}
                    </Text>
                  </Box>
                </Pressable>
              )
            })}
          </HStack>
        ))}
      </VStack>

      {/* Legend */}
      <HStack className="items-center justify-center mt-4 space-x-2">
        <Text className="text-caption-2 text-tertiary-label mr-2">少ない</Text>
        <Box className="w-3 h-3 bg-heatmap-none rounded-sm" />
        <Box className="w-3 h-3 bg-heatmap-low rounded-sm" />
        <Box className="w-3 h-3 bg-heatmap-medium rounded-sm" />
        <Box className="w-3 h-3 bg-heatmap-high rounded-sm" />
        <Box className="w-3 h-3 bg-heatmap-highest rounded-sm" />
        <Text className="text-caption-2 text-tertiary-label ml-2">多い</Text>
      </HStack>
    </Box>
  )
}
