import React, { useState } from 'react'
import { View, Text, Switch, Alert, Platform } from 'react-native'
import { useTranslation } from 'react-i18next'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/src/hooks/useNotifications'

interface NotificationSettingsProps {
  onClose?: () => void
}

export function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const { t } = useTranslation()
  const {
    settings,
    isLoading,
    requestPermissions,
    scheduleDailyReminder,
    cancelDailyReminder,
    refreshSettings,
  } = useNotifications()

  const [reminderTime, setReminderTime] = useState({
    hour: settings.dailyReminderTime?.hour ?? 9,
    minute: settings.dailyReminderTime?.minute ?? 0,
  })

  const handleEnableNotifications = async () => {
    if (!settings.enabled) {
      const granted = await requestPermissions()
      if (granted) {
        // Schedule default daily reminder
        await scheduleDailyReminder(reminderTime.hour, reminderTime.minute)
        Alert.alert(
          t('notifications.enabledTitle'),
          t('notifications.enabledMessage', { time: formatTime(reminderTime.hour, reminderTime.minute) })
        )
      } else {
        Alert.alert(
          t('notifications.permissionRequired'),
          Platform.OS === 'ios'
            ? t('notifications.permissionIOS')
            : t('notifications.permissionAndroid')
        )
      }
    } else {
      // Disable notifications
      await cancelDailyReminder()
      Alert.alert(
        t('notifications.disabledTitle'),
        t('notifications.disabledMessage')
      )
    }
  }

  const handleTimeChange = async (hour: number, minute: number) => {
    setReminderTime({ hour, minute })
    if (settings.enabled) {
      await scheduleDailyReminder(hour, minute)
      Alert.alert(
        t('notifications.timeUpdatedTitle'),
        t('notifications.timeUpdatedMessage', { time: formatTime(hour, minute) })
      )
    }
  }

  const formatTime = (hour: number, minute: number) => {
    return `${hour}:${minute.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-gray-600">{t('common.loading')}</Text>
      </View>
    )
  }

  return (
    <VStack className="flex-1 p-6 bg-white">
      {/* Enable/Disable Notifications */}
      <VStack className="mb-8">
        <HStack className="justify-between items-center mb-4">
          <VStack className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {t('notifications.dailyReminder')}
            </Text>
            <Text className="text-sm text-gray-600">
              {t('notifications.dailyReminderDescription')}
            </Text>
          </VStack>
          <Switch
            value={settings.enabled}
            onValueChange={handleEnableNotifications}
            trackColor={{ false: '#E5E7EB', true: '#007AFF' }}
            thumbColor={settings.enabled ? '#FFFFFF' : '#9CA3AF'}
          />
        </HStack>

        {settings.enabled && (
          <VStack className="ml-4 pl-4 border-l-2 border-gray-200">
            <Text className="text-sm text-gray-600 mb-2">
              {t('notifications.currentTime')}{' '}
              {settings.dailyReminderTime
                ? formatTime(
                    settings.dailyReminderTime.hour,
                    settings.dailyReminderTime.minute
                  )
                : t('notifications.notSet')}
            </Text>

            {/* Time Selection Buttons */}
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t('notifications.selectTime')}
            </Text>
            <VStack className="gap-2">
              {[
                { hour: 8, minute: 0, label: t('notifications.morning8') },
                { hour: 9, minute: 0, label: t('notifications.morning9') },
                { hour: 12, minute: 0, label: t('notifications.noon') },
                { hour: 18, minute: 0, label: t('notifications.evening6') },
                { hour: 20, minute: 0, label: t('notifications.night8') },
              ].map((time) => (
                <Button
                  key={`${time.hour}-${time.minute}`}
                  variant={
                    settings.dailyReminderTime?.hour === time.hour &&
                    settings.dailyReminderTime?.minute === time.minute
                      ? 'solid'
                      : 'outline'
                  }
                  size="sm"
                  onPress={() => handleTimeChange(time.hour, time.minute)}
                  className="justify-start"
                >
                  <Text
                    className={
                      settings.dailyReminderTime?.hour === time.hour &&
                      settings.dailyReminderTime?.minute === time.minute
                        ? 'text-white'
                        : 'text-gray-700'
                    }
                  >
                    {time.label}
                  </Text>
                </Button>
              ))}
            </VStack>
          </VStack>
        )}
      </VStack>

      {/* Notification Status */}
      <VStack className="mb-8 p-4 bg-gray-50 rounded-lg">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          {t('notifications.status')}
        </Text>
        <HStack className="justify-between items-center mb-1">
          <Text className="text-sm text-gray-600">{t('notifications.permissionState')}</Text>
          <Text
            className={`text-sm font-medium ${
              settings.enabled ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {settings.enabled ? t('notifications.enabled') : t('notifications.disabled')}
          </Text>
        </HStack>
        <HStack className="justify-between items-center">
          <Text className="text-sm text-gray-600">{t('notifications.scheduledNotifications')}</Text>
          <Text className="text-sm font-medium text-gray-900">
            {t('notifications.countUnit', { count: settings.scheduledCount })}
          </Text>
        </HStack>
      </VStack>

      {/* Action Buttons */}
      <VStack className="gap-3">
        <Button variant="outline" onPress={refreshSettings} className="w-full">
          <Text className="text-gray-700">{t('notifications.refresh')}</Text>
        </Button>

        {onClose && (
          <Button variant="solid" onPress={onClose} className="w-full">
            <Text className="text-white">{t('common.done')}</Text>
          </Button>
        )}
      </VStack>

      {/* Help Text */}
      <VStack className="mt-6 p-4 bg-blue-50 rounded-lg">
        <Text className="text-sm text-blue-800 font-medium mb-1">
          {t('notifications.tipTitle')}
        </Text>
        <Text className="text-sm text-blue-700">
          {t('notifications.tipBody')}
        </Text>
      </VStack>
    </VStack>
  )
}
