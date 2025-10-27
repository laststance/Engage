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
    const weeks: { date: number; dateString: string; isCurrentMonth: boolean }[][] = []
    let currentWeek: {
      date: number
      dateString: string
      isCurrentMonth: boolean
    }[] = []

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
    if (completionCount === 0) return 'bg-gray-100'
    if (completionCount === 1) return 'bg-green-200'
    if (completionCount === 2) return 'bg-green-400'
    if (completionCount === 3) return 'bg-green-600'
    return 'bg-green-700' // 4+ completions
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
    <Box className="flex-1 bg-white" testID="calendar-component">
      {/* Header with month navigation - matching Figma design */}
      <HStack className="items-center justify-between px-6 py-4 mb-4">
        <Pressable
          onPress={() => navigateMonth('prev')}
          testID="calendar-prev-month"
          className="p-2"
        >
          <IconSymbol name="chevron.left" size={20} color="#666" />
        </Pressable>

        <Text
          className="text-lg font-semibold text-gray-800"
          testID="calendar-title"
        >
          {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
        </Text>

        <Pressable
          onPress={() => navigateMonth('next')}
          testID="calendar-next-month"
          className="p-2"
        >
          <IconSymbol name="chevron.right" size={20} color="#666" />
        </Pressable>
      </HStack>

      {/* Days of week header - matching Figma spacing */}
      <HStack className="px-4 mb-3">
        {DAYS_OF_WEEK.map((day, index) => (
          <Box key={day} className="flex-1 items-center">
            <Text
              className={`text-sm font-medium ${
                index === 0
                  ? 'text-red-500'
                  : index === 6
                  ? 'text-blue-500'
                  : 'text-gray-600'
              }`}
            >
              {day}
            </Text>
          </Box>
        ))}
      </HStack>

      {/* Calendar grid - more compact design matching Figma */}
      <VStack className="px-4" space="xs">
        {calendarData.map((week, weekIndex) => (
          <HStack key={weekIndex} space="xs">
            {week.map((dayData, dayIndex) => {
              const completionCount = achievementData[dayData.dateString] || 0
              const heatmapColor = getHeatmapColor(completionCount)

              return (
                <Pressable
                  key={`${weekIndex}-${dayIndex}`}
                  onPress={() => onDateSelect(dayData.dateString)}
                  testID={`calendar-date-${dayData.dateString}`}
                  className="flex-1"
                >
                  <Box
                    className={`
                      h-10 items-center justify-center rounded-md
                      ${dayData.isCurrentMonth ? heatmapColor : 'bg-gray-50'}
                      ${
                        isSelected(dayData.dateString)
                          ? 'border-2 border-blue-500'
                          : ''
                      }
                      ${
                        isToday(dayData.dateString)
                          ? 'border-2 border-orange-500'
                          : ''
                      }
                    `}
                  >
                    <Text
                      className={`
                        text-sm font-medium
                        ${
                          dayData.isCurrentMonth
                            ? 'text-gray-800'
                            : 'text-gray-300'
                        }
                        ${isSelected(dayData.dateString) ? 'text-blue-600' : ''}
                        ${isToday(dayData.dateString) ? 'text-orange-600' : ''}
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

      {/* Legend - matching Figma design with proper spacing */}
      <HStack className="items-center justify-center mt-8 px-4">
        <Text className="text-xs text-gray-500 mr-3">少ない</Text>
        <Box className="w-3 h-3 bg-gray-100 rounded-sm mx-1" />
        <Box className="w-3 h-3 bg-green-200 rounded-sm mx-1" />
        <Box className="w-3 h-3 bg-green-400 rounded-sm mx-1" />
        <Box className="w-3 h-3 bg-green-600 rounded-sm mx-1" />
        <Text className="text-xs text-gray-500 ml-3">多い</Text>
      </HStack>
    </Box>
  )
}
