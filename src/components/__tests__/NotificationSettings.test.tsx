import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { NotificationSettings } from '../NotificationSettings'

const mockOpenNotificationSettings = jest.fn()
const mockRefreshSettings = jest.fn()
const mockUseNotifications = jest.fn()

jest.mock('@/src/hooks/useNotifications', () => ({
  useNotifications: () => mockUseNotifications(),
}))

jest.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
  useTranslation: () => ({
    t: (key: string, options?: { count?: number; time?: string }) => {
      const translations: Record<string, string> = {
        'common.done': 'Done',
        'common.loading': 'Loading',
        'notifications.checkPermissionAgain': 'Check permission again',
        'notifications.controlsDisabledDenied':
          'Reminder controls are disabled because notification permission is blocked.',
        'notifications.dailyReminder': 'Daily Reminder',
        'notifications.dailyReminderDescription':
          'Get daily habit check reminders at a set time',
        'notifications.openSettings': 'Open Settings',
        'notifications.permissionDeniedBody':
          'Notifications are blocked in system settings. Open Settings to allow reminders again.',
        'notifications.permissionDeniedTitle': 'Notifications blocked',
        'notifications.permissionEnabledBody':
          'Choose a reminder time to schedule your daily habit prompt.',
        'notifications.permissionEnabledTitle': 'Notifications allowed',
        'notifications.permissionState': 'Permission:',
        'notifications.permission.denied': 'Denied',
        'notifications.permission.enabled': 'Allowed',
        'notifications.permission.notDetermined': 'Not requested',
        'notifications.permissionNotDeterminedBody':
          'Turn on reminders to choose a time and allow Engage to send daily habit prompts.',
        'notifications.permissionNotDeterminedTitle':
          'Permission not requested',
        'notifications.reminderScheduledTitle': 'Reminder scheduled',
        'notifications.scheduledNotifications': 'Scheduled:',
        'notifications.selectTime': 'Select reminder time:',
        'notifications.status': 'Notification Status',
        'notifications.tipBody': 'Notifications help you return to tasks.',
        'notifications.tipTitle': 'Tip',
        'notifications.toggleReminderHint': 'Turn daily reminders on or off.',
      }

      if (key === 'notifications.countUnit') {
        return `${options?.count ?? 0}`
      }

      if (key === 'notifications.currentTimeWithValue') {
        return `Current time: ${options?.time ?? ''}`
      }

      if (key === 'notifications.reminderScheduledBody') {
        return `Your daily reminder is scheduled for ${options?.time ?? ''}.`
      }

      return translations[key] || key
    },
    i18n: { changeLanguage: jest.fn() },
  }),
}))

const createHookState = (
  overrides: Partial<ReturnType<typeof mockUseNotifications>> = {}
) => ({
  cancelDailyReminder: jest.fn(),
  errorMessage: null,
  isLoading: false,
  openNotificationSettings: mockOpenNotificationSettings,
  refreshSettings: mockRefreshSettings,
  requestPermissions: jest.fn(),
  scheduleDailyReminder: jest.fn(),
  settings: {
    dailyReminderTime: null,
    enabled: false,
    isScheduled: false,
    permissionStatus: 'notDetermined',
    scheduledCount: 0,
  },
  ...overrides,
})

describe('NotificationSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseNotifications.mockReturnValue(createHookState())
  })

  it('shows not-requested permission state with a renamed check action', () => {
    // Arrange & Act
    const { getByText, queryByText } = render(<NotificationSettings />)

    // Assert
    expect(getByText('Permission not requested')).toBeTruthy()
    expect(getByText('Check permission again')).toBeTruthy()
    expect(queryByText('Refresh Settings')).toBeNull()
  })

  it('shows Open Settings as the primary recovery when permission is denied', () => {
    // Arrange
    mockUseNotifications.mockReturnValue(
      createHookState({
        settings: {
          dailyReminderTime: null,
          enabled: false,
          isScheduled: false,
          permissionStatus: 'denied',
          scheduledCount: 0,
        },
      })
    )
    const { getByTestId, getByText } = render(<NotificationSettings />)

    // Act
    fireEvent.press(getByTestId('notification-open-settings'))

    // Assert
    expect(getByText('Notifications blocked')).toBeTruthy()
    expect(getByText('Open Settings')).toBeTruthy()
    expect(getByText(
      'Reminder controls are disabled because notification permission is blocked.'
    )).toBeTruthy()
    expect(getByTestId('notification-reminder-switch').props.disabled).toBe(
      true
    )
    expect(mockOpenNotificationSettings).toHaveBeenCalledTimes(1)
  })

  it('shows enabled permission state before a reminder is scheduled', () => {
    // Arrange
    mockUseNotifications.mockReturnValue(
      createHookState({
        settings: {
          dailyReminderTime: null,
          enabled: false,
          isScheduled: false,
          permissionStatus: 'enabled',
          scheduledCount: 0,
        },
      })
    )

    // Act
    const { getByTestId, getByText } = render(<NotificationSettings />)

    // Assert
    expect(getByText('Notifications allowed')).toBeTruthy()
    expect(getByText('Select reminder time:')).toBeTruthy()
    expect(getByTestId('notification-state-enabled')).toBeTruthy()
  })

  it('shows scheduled reminder state with the current time', () => {
    // Arrange
    mockUseNotifications.mockReturnValue(
      createHookState({
        settings: {
          dailyReminderTime: { hour: 20, minute: 0 },
          enabled: true,
          isScheduled: true,
          permissionStatus: 'enabled',
          scheduledCount: 1,
        },
      })
    )

    // Act
    const { getByTestId, getByText } = render(<NotificationSettings />)

    // Assert
    expect(getByText('Reminder scheduled')).toBeTruthy()
    expect(getByText('Your daily reminder is scheduled for 20:00.')).toBeTruthy()
    expect(getByText('Current time: 20:00')).toBeTruthy()
    expect(getByTestId('notification-state-scheduled')).toBeTruthy()
  })

  it('exposes busy and disabled state while checking permissions', async () => {
    // Arrange
    let resolveRefresh: () => void = () => {}
    mockRefreshSettings.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveRefresh = resolve
      })
    )
    const { getByTestId } = render(<NotificationSettings />)

    // Act
    fireEvent.press(getByTestId('notification-check-permission'))

    // Assert
    await waitFor(() => {
      expect(
        getByTestId('notification-check-permission').props.accessibilityState
      ).toMatchObject({
        busy: true,
        disabled: true,
      })
    })
    expect(
      getByTestId('notification-reminder-switch').props.accessibilityState
    ).toMatchObject({
      busy: true,
      disabled: true,
    })
    resolveRefresh()
  })
})
