/**
 * Notifications hook - Stub implementation
 * This keeps the settings screen stable until notification scheduling is wired.
 */

import { useState } from 'react'

interface NotificationSettings {
  enabled: boolean
  dailyReminderTime: { hour: number; minute: number } | null
  scheduledCount: number
}

export function useNotifications() {
  const [settings] = useState<NotificationSettings>({
    enabled: false,
    dailyReminderTime: null,
    scheduledCount: 0,
  })

  const [isLoading] = useState(false)

  const requestPermissions = async (): Promise<boolean> => {
    console.warn('useNotifications: requestPermissions not implemented')
    return false
  }

  const scheduleDailyReminder = async (hour: number, minute: number): Promise<boolean> => {
    console.warn('useNotifications: scheduleDailyReminder not implemented', { hour, minute })
    return false
  }

  const cancelDailyReminder = async (): Promise<void> => {
    console.warn('useNotifications: cancelDailyReminder not implemented')
  }

  const refreshSettings = async (): Promise<void> => {
    console.warn('useNotifications: refreshSettings not implemented')
  }

  return {
    settings,
    isLoading,
    requestPermissions,
    scheduleDailyReminder,
    cancelDailyReminder,
    refreshSettings,
  }
}
