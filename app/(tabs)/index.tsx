import React, { useState } from 'react'
import { Box } from '@/components/ui/box'
import { Calendar } from '@/src/components/Calendar'
import { DayModal } from '@/src/components/DayModal'
import { useAppStore } from '@/src/stores/app-store'

export default function CalendarScreen() {
  const [isDayModalVisible, setIsDayModalVisible] = useState(false)

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
      <Calendar
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        achievementData={achievementData}
      />

      <DayModal isVisible={isDayModalVisible} onClose={handleModalClose} />
    </Box>
  )
}
