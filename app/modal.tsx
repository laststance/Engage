import React, { useState, useCallback } from 'react'
import {
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { NotificationSettings } from '@/src/components/NotificationSettings'
import { BackupManager } from '@/src/components/BackupManager'

type SettingsView = 'menu' | 'notifications' | 'backup'

export default function ModalScreen() {
  const [currentView, setCurrentView] = useState<SettingsView>('menu')

  const handleClose = useCallback(() => {
    router.back()
  }, [])

  const handleBack = useCallback(() => {
    setCurrentView('menu')
  }, [])

  // Sub-screen header with back button
  if (currentView === 'notifications') {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HStack className="items-center p-4 border-b border-gray-200">
          <TouchableOpacity
            onPress={handleBack}
            className="p-2 min-w-[44px] min-h-[44px] items-center justify-center"
            accessibilityLabel="戻る"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-800 flex-1 text-center mr-[44px]">
            通知設定
          </Text>
        </HStack>
        <NotificationSettings onClose={handleBack} />
      </SafeAreaView>
    )
  }

  if (currentView === 'backup') {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HStack className="items-center p-4 border-b border-gray-200">
          <TouchableOpacity
            onPress={handleBack}
            className="p-2 min-w-[44px] min-h-[44px] items-center justify-center"
            accessibilityLabel="戻る"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-800 flex-1 text-center mr-[44px]">
            データバックアップ
          </Text>
        </HStack>
        <BackupManager />
      </SafeAreaView>
    )
  }

  // Settings menu
  return (
    <SafeAreaView className="flex-1 bg-white">
      <HStack className="items-center justify-between p-4 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-800 flex-1 text-center ml-[44px]">
          設定
        </Text>
        <TouchableOpacity
          onPress={handleClose}
          className="p-2 min-w-[44px] min-h-[44px] items-center justify-center"
          testID="settings-close"
          accessibilityLabel="閉じる"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </HStack>

      <ScrollView className="flex-1">
        {/* General Section */}
        <VStack className="mt-6">
          <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide px-4 mb-2">
            一般
          </Text>
          <Box className="bg-white border-t border-b border-gray-200">
            <SettingsMenuItem
              icon="notifications-outline"
              label="通知設定"
              sublabel="デイリーリマインダーの時間設定"
              onPress={() => setCurrentView('notifications')}
              testID="settings-notifications"
            />
          </Box>
        </VStack>

        {/* Data Section */}
        <VStack className="mt-6">
          <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide px-4 mb-2">
            データ
          </Text>
          <Box className="bg-white border-t border-b border-gray-200">
            <SettingsMenuItem
              icon="cloud-upload-outline"
              label="データバックアップ"
              sublabel="バックアップの作成・復元・エクスポート"
              onPress={() => setCurrentView('backup')}
              testID="settings-backup"
            />
          </Box>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  )
}

interface SettingsMenuItemProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  sublabel?: string
  onPress: () => void
  testID?: string
}

function SettingsMenuItem({
  icon,
  label,
  sublabel,
  onPress,
  testID,
}: SettingsMenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="px-4 py-3 min-h-[44px] flex-row items-center"
      testID={testID}
      accessibilityRole="button"
    >
      <Box className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center mr-3">
        <Ionicons name={icon} size={18} color="#6B7280" />
      </Box>
      <VStack className="flex-1">
        <Text className="text-base text-gray-900">{label}</Text>
        {sublabel && (
          <Text className="text-xs text-gray-500 mt-0.5">{sublabel}</Text>
        )}
      </VStack>
      <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
    </TouchableOpacity>
  )
}
