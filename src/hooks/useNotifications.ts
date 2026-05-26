import { useCallback, useEffect, useState } from 'react'
import { Linking } from 'react-native'
import * as Notifications from 'expo-notifications'
import {
  DAILY_REMINDER_NOTIFICATION_ID,
  DEFAULT_REMINDER_HOUR,
  DEFAULT_REMINDER_MINUTE,
} from '@/src/constants/notifications'

export type NotificationPermissionState =
  | 'notDetermined'
  | 'denied'
  | 'enabled'

interface ReminderTime {
  hour: number
  minute: number
}

interface NotificationSettings {
  enabled: boolean
  permissionStatus: NotificationPermissionState
  dailyReminderTime: ReminderTime | null
  scheduledCount: number
  isScheduled: boolean
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  permissionStatus: 'notDetermined',
  dailyReminderTime: null,
  scheduledCount: 0,
  isScheduled: false,
}

/**
 * Checks whether an unknown date component object has numeric reminder fields.
 * @param value - The candidate trigger date component object.
 * @returns `true` when the value can provide hour and minute fields.
 * @example
 * hasReminderTimeFields({ hour: 9, minute: 0 }) // => true
 */
const hasReminderTimeFields = (
  value: unknown
): value is { hour?: number; minute?: number } => {
  return typeof value === 'object' && value !== null
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

/**
 * Converts Expo's platform permission response into the app's user-facing states.
 * @param permissions - The notification permission response from Expo.
 * @returns The permission state used by NotificationSettings UI.
 * @example
 * getNotificationPermissionState({ status: 'denied', granted: false } as NotificationPermissionsStatus) // => 'denied'
 */
export const getNotificationPermissionState = (
  permissions: Notifications.NotificationPermissionsStatus
): NotificationPermissionState => {
  if (
    permissions.granted ||
    permissions.status === 'granted' ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return 'enabled'
  }

  if (
    permissions.status === 'denied' ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.DENIED
  ) {
    return 'denied'
  }

  return 'notDetermined'
}

/**
 * Reads the reminder time from Expo's scheduled notification trigger shapes.
 * @param trigger - The trigger attached to a scheduled notification request.
 * @returns The hour/minute pair when the trigger is daily/calendar-based, otherwise `null`.
 * @example
 * getReminderTimeFromTrigger({ type: 'daily', hour: 9, minute: 0 }) // => { hour: 9, minute: 0 }
 */
export const getReminderTimeFromTrigger = (
  trigger: Notifications.NotificationTrigger
): ReminderTime | null => {
  if (!trigger || !('type' in trigger)) {
    return null
  }

  if (
    trigger.type === Notifications.SchedulableTriggerInputTypes.DAILY &&
    'hour' in trigger &&
    'minute' in trigger &&
    typeof trigger.hour === 'number' &&
    typeof trigger.minute === 'number'
  ) {
    return { hour: trigger.hour, minute: trigger.minute }
  }

  if (trigger.type === Notifications.SchedulableTriggerInputTypes.CALENDAR) {
    if (
      'hour' in trigger &&
      'minute' in trigger &&
      typeof trigger.hour === 'number' &&
      typeof trigger.minute === 'number'
    ) {
      return {
        hour: trigger.hour,
        minute: trigger.minute,
      }
    }

    if (
      'dateComponents' in trigger &&
      hasReminderTimeFields(trigger.dateComponents)
    ) {
      return {
        hour: trigger.dateComponents.hour ?? DEFAULT_REMINDER_HOUR,
        minute: trigger.dateComponents.minute ?? DEFAULT_REMINDER_MINUTE,
      }
    }
  }

  return null
}

/**
 * Reads and controls daily reminder notification permission and schedule state.
 * @returns Settings plus actions used by the notification settings screen.
 * @example
 * const { settings, requestPermissions } = useNotifications()
 */
export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  )
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshSettings = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [permissions, scheduledNotifications] = await Promise.all([
        Notifications.getPermissionsAsync(),
        Notifications.getAllScheduledNotificationsAsync(),
      ])
      const permissionStatus = getNotificationPermissionState(permissions)
      const dailyReminder = scheduledNotifications.find(
        (notification) =>
          notification.identifier === DAILY_REMINDER_NOTIFICATION_ID
      )
      const dailyReminderTime = dailyReminder
        ? getReminderTimeFromTrigger(dailyReminder.trigger)
        : null

      setSettings({
        enabled: permissionStatus === 'enabled' && Boolean(dailyReminder),
        permissionStatus,
        dailyReminderTime,
        scheduledCount: scheduledNotifications.length,
        isScheduled: Boolean(dailyReminder),
      })
    } catch (error) {
      console.error('Failed to refresh notification settings:', error)
      setErrorMessage('notifications.settingsUnavailable')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshSettings()
  }, [refreshSettings])

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setErrorMessage(null)

    try {
      const permissions = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      })
      await refreshSettings()
      return getNotificationPermissionState(permissions) === 'enabled'
    } catch (error) {
      console.error('Failed to request notification permissions:', error)
      setErrorMessage('notifications.permissionRequestFailed')
      return false
    }
  }, [refreshSettings])

  const scheduleDailyReminder = useCallback(
    async (hour: number, minute: number): Promise<boolean> => {
      setErrorMessage(null)

      try {
        const permissions = await Notifications.getPermissionsAsync()

        if (getNotificationPermissionState(permissions) !== 'enabled') {
          await refreshSettings()
          return false
        }

        // Replace the app's existing daily reminder so only one reminder is active.
        await Notifications.cancelScheduledNotificationAsync(
          DAILY_REMINDER_NOTIFICATION_ID
        ).catch(() => undefined)
        await Notifications.scheduleNotificationAsync({
          identifier: DAILY_REMINDER_NOTIFICATION_ID,
          content: {
            title: 'Engage',
            body: "Time to check today's habits.",
            data: { type: 'dailyReminder' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
          },
        })
        await refreshSettings()
        return true
      } catch (error) {
        console.error('Failed to schedule daily reminder:', error)
        setErrorMessage('notifications.scheduleFailed')
        await refreshSettings()
        return false
      }
    },
    [refreshSettings]
  )

  const cancelDailyReminder = useCallback(async (): Promise<void> => {
    setErrorMessage(null)

    try {
      await Notifications.cancelScheduledNotificationAsync(
        DAILY_REMINDER_NOTIFICATION_ID
      )
      await refreshSettings()
    } catch (error) {
      console.error('Failed to cancel daily reminder:', error)
      setErrorMessage('notifications.cancelFailed')
      await refreshSettings()
    }
  }, [refreshSettings])

  const openNotificationSettings = useCallback(async (): Promise<void> => {
    await Linking.openSettings()
  }, [])

  return {
    settings,
    isLoading,
    errorMessage,
    requestPermissions,
    scheduleDailyReminder,
    cancelDailyReminder,
    refreshSettings,
    openNotificationSettings,
  }
}
