import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppScreen } from '@/src/components/AppScreen'
import { Calendar } from '@/src/components/Calendar'
import { DayModal } from '@/src/components/DayModal'
import { useAppStore } from '@/src/stores/app-store'
import { calculateAchievementData } from '@/src/utils/statisticsEngine'

export default function CalendarScreen() {
  const { t } = useTranslation()
  const [isDayModalVisible, setIsDayModalVisible] = useState(false)

  const selectedDate = useAppStore((state) => state.selectedDate)
  const selectDate = useAppStore((state) => state.selectDate)
  const completions = useAppStore((state) => state.completions)
  const achievementData = useMemo(
    () => calculateAchievementData(completions),
    [completions]
  )

  const handleDateSelect = (date: string) => {
    selectDate(date)
    setIsDayModalVisible(true)
  }

  const handleModalClose = () => {
    setIsDayModalVisible(false)
  }

  return (
    <AppScreen
      description={t('calendar.description')}
      descriptionTestID="calendar-description"
      testID="calendar-screen"
      title={t('calendar.title')}
      titleTestID="calendar-screen-title"
    >
      <Calendar
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        achievementData={achievementData}
      />

      <DayModal isVisible={isDayModalVisible} onClose={handleModalClose} />
    </AppScreen>
  )
}
