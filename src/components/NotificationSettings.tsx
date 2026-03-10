import React, { useState } from 'react'
import { View, Text, Switch, Alert, Platform } from 'react-native'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/src/hooks/useNotifications'

interface NotificationSettingsProps {
  onClose?: () => void
}

export function NotificationSettings({ onClose }: NotificationSettingsProps) {
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
          '通知が有効になりました',
          `毎日 ${reminderTime.hour}:${reminderTime.minute
            .toString()
            .padStart(2, '0')} にリマインダーを送信します。`
        )
      } else {
        Alert.alert(
          '通知の許可が必要です',
          Platform.OS === 'ios'
            ? '設定アプリから通知を有効にしてください。'
            : 'アプリの設定から通知を有効にしてください。'
        )
      }
    } else {
      // Disable notifications
      await cancelDailyReminder()
      Alert.alert(
        '通知が無効になりました',
        'リマインダーをキャンセルしました。'
      )
    }
  }

  const handleTimeChange = async (hour: number, minute: number) => {
    setReminderTime({ hour, minute })
    if (settings.enabled) {
      await scheduleDailyReminder(hour, minute)
      Alert.alert(
        '時間を更新しました',
        `毎日 ${hour}:${minute
          .toString()
          .padStart(2, '0')} にリマインダーを送信します。`
      )
    }
  }

  const formatTime = (hour: number, minute: number) => {
    return `${hour}:${minute.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-gray-600">読み込み中...</Text>
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
              デイリーリマインダー
            </Text>
            <Text className="text-sm text-gray-600">
              毎日決まった時間に習慣チェックのリマインダーを受け取る
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
              現在の設定時間:{' '}
              {settings.dailyReminderTime
                ? formatTime(
                    settings.dailyReminderTime.hour,
                    settings.dailyReminderTime.minute
                  )
                : '未設定'}
            </Text>

            {/* Time Selection Buttons */}
            <Text className="text-sm font-medium text-gray-700 mb-2">
              リマインダー時間を選択:
            </Text>
            <VStack className="gap-2">
              {[
                { hour: 8, minute: 0, label: '朝 8:00' },
                { hour: 9, minute: 0, label: '朝 9:00' },
                { hour: 12, minute: 0, label: '昼 12:00' },
                { hour: 18, minute: 0, label: '夕方 6:00' },
                { hour: 20, minute: 0, label: '夜 8:00' },
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
          通知ステータス
        </Text>
        <HStack className="justify-between items-center mb-1">
          <Text className="text-sm text-gray-600">許可状態:</Text>
          <Text
            className={`text-sm font-medium ${
              settings.enabled ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {settings.enabled ? '有効' : '無効'}
          </Text>
        </HStack>
        <HStack className="justify-between items-center">
          <Text className="text-sm text-gray-600">予定された通知:</Text>
          <Text className="text-sm font-medium text-gray-900">
            {settings.scheduledCount}件
          </Text>
        </HStack>
      </VStack>

      {/* Action Buttons */}
      <VStack className="gap-3">
        <Button variant="outline" onPress={refreshSettings} className="w-full">
          <Text className="text-gray-700">設定を更新</Text>
        </Button>

        {onClose && (
          <Button variant="solid" onPress={onClose} className="w-full">
            <Text className="text-white">完了</Text>
          </Button>
        )}
      </VStack>

      {/* Help Text */}
      <VStack className="mt-6 p-4 bg-blue-50 rounded-lg">
        <Text className="text-sm text-blue-800 font-medium mb-1">
          💡 ヒント
        </Text>
        <Text className="text-sm text-blue-700">
          通知をタップすると、今日のタスク画面に直接移動できます。
          通知が届かない場合は、端末の設定で通知が許可されているか確認してください。
        </Text>
      </VStack>
    </VStack>
  )
}
