import React, { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { Calendar } from '@/src/components/Calendar'
import { DayModal } from '@/src/components/DayModal'
import { useAppStore } from '@/src/stores/app-store'

export default function CalendarScreen() {
  const [isDayModalVisible, setIsDayModalVisible] = useState(false)

  const insets = useSafeAreaInsets()
  const { selectedDate, selectDate, getAchievementData } = useAppStore()

  const achievementData = getAchievementData()

  const handleDateSelect = (date: string) => {
    selectDate(date)
    setIsDayModalVisible(true)
  }

  const handleModalClose = () => {
    setIsDayModalVisible(false)
  }

  return (
    <Box className="flex-1 bg-white" testID="calendar-screen">
      <VStack className="flex-1" style={{ paddingTop: insets.top }}>
        <Box className="px-4 pt-4 pb-2">
          <Text
            className="text-gray-600 text-center text-base"
            testID="calendar-description"
          >
            日付を選択してタスクや振り返りを管理しましょう
          </Text>
        </Box>

        <Calendar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          achievementData={achievementData}
        />
      </VStack>

      <DayModal isVisible={isDayModalVisible} onClose={handleModalClose} />
    </Box>
  )
}
