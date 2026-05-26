import React, { useEffect, useMemo, useState } from 'react'
import { ScrollView, Switch, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { AppPressable } from '@/src/components/AppPressable'
import {
  DEFAULT_REMINDER_HOUR,
  DEFAULT_REMINDER_MINUTE,
  NOTIFICATION_TIME_PRESETS,
  TIME_PART_PAD_LENGTH,
} from '@/src/constants/notifications'
import { useNotifications } from '@/src/hooks/useNotifications'

interface NotificationSettingsProps {
  onClose?: () => void
}

type NotificationStatusTone = 'neutral' | 'warning' | 'success' | 'scheduled'

interface NotificationStatusView {
  titleKey: string
  bodyKey: string
  tone: NotificationStatusTone
  testID: string
}

/**
 * Formats a reminder time for labels and confirmation text.
 * @param hour - The 24-hour clock hour.
 * @param minute - The minute within the hour.
 * @returns A `H:MM` time string.
 * @example
 * formatTime(9, 0) // => "9:00"
 */
const formatTime = (hour: number, minute: number): string => {
  return `${hour}:${minute.toString().padStart(TIME_PART_PAD_LENGTH, '0')}`
}

/**
 * Builds the status panel copy from permission and schedule state.
 * @param settings - The current notification permission and schedule state.
 * @returns Copy keys, visual tone, and test ID for the state panel.
 * @example
 * getNotificationStatusView({ permissionStatus: 'denied', isScheduled: false, ... }) // => denied view
 */
const getNotificationStatusView = (
  settings: ReturnType<typeof useNotifications>['settings']
): NotificationStatusView => {
  if (settings.permissionStatus === 'denied') {
    return {
      titleKey: 'notifications.permissionDeniedTitle',
      bodyKey: 'notifications.permissionDeniedBody',
      tone: 'warning',
      testID: 'notification-state-denied',
    }
  }

  if (settings.permissionStatus === 'notDetermined') {
    return {
      titleKey: 'notifications.permissionNotDeterminedTitle',
      bodyKey: 'notifications.permissionNotDeterminedBody',
      tone: 'neutral',
      testID: 'notification-state-not-determined',
    }
  }

  if (settings.isScheduled) {
    return {
      titleKey: 'notifications.reminderScheduledTitle',
      bodyKey: 'notifications.reminderScheduledBody',
      tone: 'scheduled',
      testID: 'notification-state-scheduled',
    }
  }

  return {
    titleKey: 'notifications.permissionEnabledTitle',
    bodyKey: 'notifications.permissionEnabledBody',
    tone: 'success',
    testID: 'notification-state-enabled',
  }
}

const statusToneClassNames: Record<NotificationStatusTone, string> = {
  neutral: 'bg-gray-50 border-gray-200',
  warning: 'bg-red-50 border-system-red',
  success: 'bg-blue-50 border-system-blue',
  scheduled: 'bg-green-50 border-system-green',
}

/**
 * Renders reminder permission recovery, schedule state, and daily reminder controls.
 * @param props - Optional close callback supplied by the Settings modal.
 * @returns A notification settings screen with explicit permission and schedule states.
 * @example
 * <NotificationSettings onClose={goBackToSettingsMenu} />
 */
export function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const { t } = useTranslation()
  const {
    settings,
    isLoading,
    errorMessage,
    requestPermissions,
    scheduleDailyReminder,
    cancelDailyReminder,
    refreshSettings,
    openNotificationSettings,
  } = useNotifications()

  const [reminderTime, setReminderTime] = useState({
    hour: settings.dailyReminderTime?.hour ?? DEFAULT_REMINDER_HOUR,
    minute: settings.dailyReminderTime?.minute ?? DEFAULT_REMINDER_MINUTE,
  })
  const [operationMessage, setOperationMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const statusView = useMemo(
    () => getNotificationStatusView(settings),
    [settings]
  )
  const isDenied = settings.permissionStatus === 'denied'
  const canEditReminder = settings.permissionStatus === 'enabled'

  useEffect(() => {
    if (settings.dailyReminderTime) {
      setReminderTime(settings.dailyReminderTime)
    }
  }, [settings.dailyReminderTime])

  const handleEnableReminder = async (): Promise<void> => {
    setIsSaving(true)
    setOperationMessage(null)

    try {
      const hasPermission =
        settings.permissionStatus === 'enabled' || (await requestPermissions())

      if (!hasPermission) {
        setOperationMessage('notifications.permissionStillNeeded')
        return
      }

      const didSchedule = await scheduleDailyReminder(
        reminderTime.hour,
        reminderTime.minute
      )
      setOperationMessage(
        didSchedule
          ? 'notifications.reminderEnabledInline'
          : 'notifications.scheduleFailed'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleReminderToggle = async (nextEnabled: boolean): Promise<void> => {
    if (isDenied || isSaving) {
      return
    }

    if (nextEnabled) {
      await handleEnableReminder()
      return
    }

    setIsSaving(true)
    setOperationMessage(null)

    try {
      await cancelDailyReminder()
      setOperationMessage('notifications.reminderDisabledInline')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTimeChange = async (
    hour: number,
    minute: number
  ): Promise<void> => {
    setReminderTime({ hour, minute })

    if (!canEditReminder || isSaving) {
      return
    }

    setIsSaving(true)
    setOperationMessage(null)

    try {
      const didSchedule = await scheduleDailyReminder(hour, minute)
      setOperationMessage(
        didSchedule
          ? 'notifications.timeUpdatedInline'
          : 'notifications.scheduleFailed'
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-gray-600">{t('common.loading')}</Text>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <VStack className="p-6">
        <VStack className="mb-6">
          <HStack className="justify-between items-center mb-4">
            <VStack className="flex-1 mr-4">
              <Text className="text-lg font-semibold text-gray-900">
                {t('notifications.dailyReminder')}
              </Text>
              <Text className="text-sm text-gray-600">
                {t('notifications.dailyReminderDescription')}
              </Text>
            </VStack>
            <Switch
              value={settings.enabled}
              onValueChange={handleReminderToggle}
              disabled={isDenied || isSaving}
              testID="notification-reminder-switch"
              trackColor={{ false: '#E5E7EB', true: '#007AFF' }}
              thumbColor={settings.enabled ? '#FFFFFF' : '#9CA3AF'}
              accessibilityHint={
                isDenied
                  ? t('notifications.controlsDisabledDenied')
                  : t('notifications.toggleReminderHint')
              }
            />
          </HStack>

          {isDenied && (
            <Text
              className="text-sm text-gray-700"
              testID="notification-disabled-reason"
            >
              {t('notifications.controlsDisabledDenied')}
            </Text>
          )}
        </VStack>

        <VStack
          className={`mb-6 p-4 rounded-lg border ${statusToneClassNames[statusView.tone]}`}
          testID={statusView.testID}
        >
          <Text className="text-sm font-semibold text-gray-900 mb-1">
            {t(statusView.titleKey)}
          </Text>
          <Text className="text-sm text-gray-700">
            {t(statusView.bodyKey, {
              time: settings.dailyReminderTime
                ? formatTime(
                    settings.dailyReminderTime.hour,
                    settings.dailyReminderTime.minute
                  )
                : formatTime(reminderTime.hour, reminderTime.minute),
            })}
          </Text>
        </VStack>

        {canEditReminder && (
          <VStack className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {settings.isScheduled
                ? t('notifications.currentTimeWithValue', {
                    time: settings.dailyReminderTime
                      ? formatTime(
                          settings.dailyReminderTime.hour,
                          settings.dailyReminderTime.minute
                        )
                      : t('notifications.notSet'),
                  })
                : t('notifications.selectTime')}
            </Text>
            <VStack className="gap-2">
              {NOTIFICATION_TIME_PRESETS.map((time) => {
                const isSelected =
                  settings.dailyReminderTime?.hour === time.hour &&
                  settings.dailyReminderTime?.minute === time.minute

                return (
                  <AppPressable
                    key={`${time.hour}-${time.minute}`}
                    onPress={() => handleTimeChange(time.hour, time.minute)}
                    selected={isSelected}
                    disabled={isSaving}
                    feedback="select"
                    className={`
                      rounded-lg border px-4 py-3 touch-target-minimum
                      ${
                        isSelected
                          ? 'bg-system-blue border-system-blue'
                          : 'bg-white border-gray-300'
                      }
                    `}
                    pressedClassName="bg-system-gray-6"
                    testID={`notification-time-${time.hour}-${time.minute}`}
                    accessibilityRole="button"
                  >
                    <Text
                      className={
                        isSelected
                          ? 'text-white font-semibold'
                          : 'text-gray-700 font-medium'
                      }
                    >
                      {t(time.labelKey)}
                    </Text>
                  </AppPressable>
                )
              })}
            </VStack>
          </VStack>
        )}

        <VStack className="mb-6 p-4 bg-gray-50 rounded-lg">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            {t('notifications.status')}
          </Text>
          <HStack className="justify-between items-center mb-1">
            <Text className="text-sm text-gray-600">
              {t('notifications.permissionState')}
            </Text>
            <Text className="text-sm font-medium text-gray-900">
              {t(`notifications.permission.${settings.permissionStatus}`)}
            </Text>
          </HStack>
          <HStack className="justify-between items-center">
            <Text className="text-sm text-gray-600">
              {t('notifications.scheduledNotifications')}
            </Text>
            <Text className="text-sm font-medium text-gray-900">
              {t('notifications.countUnit', { count: settings.scheduledCount })}
            </Text>
          </HStack>
        </VStack>

        {(operationMessage || errorMessage) && (
          <Text
            className="mb-4 text-sm font-medium text-gray-800"
            testID="notification-operation-message"
          >
            {t(operationMessage || errorMessage || '')}
          </Text>
        )}

        <VStack className="gap-3">
          {isDenied && (
            <AppPressable
              onPress={openNotificationSettings}
              disabled={isSaving}
              feedback="select"
              className="w-full bg-system-blue rounded-lg py-3 touch-target-minimum"
              pressedClassName="bg-business-dark"
              testID="notification-open-settings"
              accessibilityRole="button"
            >
              <Text className="text-white font-medium text-center">
                {t('notifications.openSettings')}
              </Text>
            </AppPressable>
          )}

          <AppPressable
            onPress={refreshSettings}
            disabled={isSaving}
            feedback="select"
            className="w-full bg-secondary-system-background rounded-lg py-3 touch-target-minimum"
            pressedClassName="bg-system-gray-5"
            testID="notification-check-permission"
            accessibilityRole="button"
          >
            <Text className="text-gray-700 font-medium text-center">
              {t('notifications.checkPermissionAgain')}
            </Text>
          </AppPressable>

          {onClose && (
            <AppPressable
              onPress={onClose}
              disabled={isSaving}
              feedback="select"
              className="w-full bg-system-blue rounded-lg py-3 touch-target-minimum"
              pressedClassName="bg-business-dark"
              testID="notification-done"
              accessibilityRole="button"
            >
              <Text className="text-white font-medium text-center">
                {t('common.done')}
              </Text>
            </AppPressable>
          )}
        </VStack>

        <VStack className="mt-6 p-4 bg-blue-50 rounded-lg">
          <Text className="text-sm text-blue-800 font-medium mb-1">
            {t('notifications.tipTitle')}
          </Text>
          <Text className="text-sm text-blue-700">
            {t('notifications.tipBody')}
          </Text>
        </VStack>
      </VStack>
    </ScrollView>
  )
}
