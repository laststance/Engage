import { act, renderHook, waitFor } from '@testing-library/react-native'
import * as Notifications from 'expo-notifications'
import {
  DAILY_REMINDER_NOTIFICATION_ID,
  DEFAULT_REMINDER_HOUR,
} from '@/src/constants/notifications'
import {
  getNotificationPermissionState,
  getReminderTimeFromTrigger,
  useNotifications,
} from '../useNotifications'

const permissionStatuses = {
  denied: 'denied' as Notifications.NotificationPermissionsStatus['status'],
  granted: 'granted' as Notifications.NotificationPermissionsStatus['status'],
  undetermined:
    'undetermined' as Notifications.NotificationPermissionsStatus['status'],
}

const createPermissionResponse = (
  status: Notifications.NotificationPermissionsStatus['status'],
  granted: boolean
): Notifications.NotificationPermissionsStatus => ({
  status,
  granted,
  canAskAgain: status !== permissionStatuses.denied,
  expires: 'never',
})

const createDailyReminder = (
  hour: number,
  minute: number
): Notifications.NotificationRequest => ({
  identifier: DAILY_REMINDER_NOTIFICATION_ID,
  content: {
    title: 'Engage',
    body: "Time to check today's habits.",
    data: { type: 'dailyReminder' },
    sound: null,
    subtitle: null,
    categoryIdentifier: null,
  },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
  },
})

describe('notification permission helpers', () => {
  it('maps Expo permission responses to user-facing states', () => {
    // Arrange
    const grantedPermission = createPermissionResponse(
      permissionStatuses.granted,
      true
    )
    const deniedPermission = createPermissionResponse(
      permissionStatuses.denied,
      false
    )
    const undeterminedPermission = createPermissionResponse(
      permissionStatuses.undetermined,
      false
    )

    // Act & Assert
    expect(getNotificationPermissionState(grantedPermission)).toBe('enabled')
    expect(getNotificationPermissionState(deniedPermission)).toBe('denied')
    expect(getNotificationPermissionState(undeterminedPermission)).toBe(
      'notDetermined'
    )
  })

  it('reads the reminder time from a daily trigger', () => {
    // Arrange
    const trigger: Notifications.NotificationTrigger = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: DEFAULT_REMINDER_HOUR,
      minute: 30,
    }

    // Act & Assert
    expect(getReminderTimeFromTrigger(trigger)).toEqual({
      hour: DEFAULT_REMINDER_HOUR,
      minute: 30,
    })
  })
})

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue(
      createPermissionResponse(permissionStatuses.undetermined, false)
    )
    ;(
      Notifications.getAllScheduledNotificationsAsync as jest.Mock
    ).mockResolvedValue([])
  })

  it('loads enabled scheduled reminder state from Expo', async () => {
    // Arrange
    ;(Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue(
      createPermissionResponse(permissionStatuses.granted, true)
    )
    ;(
      Notifications.getAllScheduledNotificationsAsync as jest.Mock
    ).mockResolvedValue([createDailyReminder(9, 0)])

    // Act
    const { result } = renderHook(() => useNotifications())

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.settings).toMatchObject({
      enabled: true,
      permissionStatus: 'enabled',
      isScheduled: true,
      dailyReminderTime: { hour: 9, minute: 0 },
      scheduledCount: 1,
    })
  })

  it('schedules a daily reminder after permission is enabled', async () => {
    // Arrange
    ;(Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue(
      createPermissionResponse(permissionStatuses.granted, true)
    )
    const { result } = renderHook(() => useNotifications())
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Act
    await act(async () => {
      await result.current.scheduleDailyReminder(20, 0)
    })

    // Assert
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      DAILY_REMINDER_NOTIFICATION_ID
    )
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: DAILY_REMINDER_NOTIFICATION_ID,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 20,
          minute: 0,
        },
      })
    )
  })
})
