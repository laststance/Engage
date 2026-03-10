import React, { useState, useCallback } from 'react'
import {
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { NotificationSettings } from '@/src/components/NotificationSettings'
import { BackupManager } from '@/src/components/BackupManager'
import { changeLanguage } from '@/src/i18n/config'

type SettingsView = 'menu' | 'notifications' | 'backup' | 'language'

export default function ModalScreen() {
  const { t, i18n } = useTranslation()
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
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-800 flex-1 text-center mr-[44px]">
            {t('settings.notificationSettings')}
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
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-800 flex-1 text-center mr-[44px]">
            {t('settings.dataBackup')}
          </Text>
        </HStack>
        <BackupManager />
      </SafeAreaView>
    )
  }

  if (currentView === 'language') {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HStack className="items-center p-4 border-b border-gray-200">
          <TouchableOpacity
            onPress={handleBack}
            className="p-2 min-w-[44px] min-h-[44px] items-center justify-center"
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-800 flex-1 text-center mr-[44px]">
            {t('settings.language')}
          </Text>
        </HStack>
        <VStack className="flex-1 bg-white">
          <VStack className="mt-6">
            <Box className="bg-white border-t border-b border-gray-200">
              <TouchableOpacity
                onPress={() => changeLanguage('ja')}
                className="px-4 py-3 min-h-[44px] flex-row items-center"
                accessibilityRole="button"
              >
                <VStack className="flex-1">
                  <Text className="text-base text-gray-900">{t('settings.languageJapanese')}</Text>
                </VStack>
                {i18n.language === 'ja' && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
              <Box className="h-px bg-gray-200 ml-4" />
              <TouchableOpacity
                onPress={() => changeLanguage('en')}
                className="px-4 py-3 min-h-[44px] flex-row items-center"
                accessibilityRole="button"
              >
                <VStack className="flex-1">
                  <Text className="text-base text-gray-900">{t('settings.languageEnglish')}</Text>
                </VStack>
                {i18n.language === 'en' && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            </Box>
          </VStack>
        </VStack>
      </SafeAreaView>
    )
  }

  // Settings menu
  return (
    <SafeAreaView className="flex-1 bg-white">
      <HStack className="items-center justify-between p-4 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-800 flex-1 text-center ml-[44px]">
          {t('settings.title')}
        </Text>
        <TouchableOpacity
          onPress={handleClose}
          className="p-2 min-w-[44px] min-h-[44px] items-center justify-center"
          testID="settings-close"
          accessibilityLabel={t('common.close')}
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </HStack>

      <ScrollView className="flex-1">
        {/* General Section */}
        <VStack className="mt-6">
          <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide px-4 mb-2">
            {t('settings.general')}
          </Text>
          <Box className="bg-white border-t border-b border-gray-200">
            <SettingsMenuItem
              icon="notifications-outline"
              label={t('settings.notificationSettings')}
              sublabel={t('settings.notificationSublabel')}
              onPress={() => setCurrentView('notifications')}
              testID="settings-notifications"
            />
            <Box className="h-px bg-gray-200 ml-4" />
            <SettingsMenuItem
              icon="language-outline"
              label={t('settings.language')}
              sublabel={i18n.language === 'ja' ? t('settings.languageJapanese') : t('settings.languageEnglish')}
              onPress={() => setCurrentView('language')}
              testID="settings-language"
            />
          </Box>
        </VStack>

        {/* Data Section */}
        <VStack className="mt-6">
          <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide px-4 mb-2">
            {t('settings.data')}
          </Text>
          <Box className="bg-white border-t border-b border-gray-200">
            <SettingsMenuItem
              icon="cloud-upload-outline"
              label={t('settings.dataBackup')}
              sublabel={t('settings.dataBackupSublabel')}
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
