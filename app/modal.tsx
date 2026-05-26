import React, { useCallback, useState } from 'react'
import { ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Box } from '@/components/ui/box'
import { VStack } from '@/components/ui/vstack'
import { AppCard } from '@/src/components/AppCard'
import { AppListRow } from '@/src/components/AppListRow'
import { AppPressable } from '@/src/components/AppPressable'
import { AppScreen } from '@/src/components/AppScreen'
import { AppSection } from '@/src/components/AppSection'
import { BackupManager } from '@/src/components/BackupManager'
import { NotificationSettings } from '@/src/components/NotificationSettings'
import { changeLanguage } from '@/src/i18n/config'

type SettingsView = 'menu' | 'notifications' | 'backup' | 'language'

export default function ModalScreen() {
  const { i18n, t } = useTranslation()
  const [currentView, setCurrentView] = useState<SettingsView>('menu')

  const handleClose = useCallback(() => {
    router.back()
  }, [])

  const handleBack = useCallback(() => {
    setCurrentView('menu')
  }, [])

  const backAction = (
    <AppPressable
      onPress={handleBack}
      className="p-2 min-w-[44px] min-h-[44px] items-center justify-center"
      pressedClassName="bg-blue-50 rounded-full"
      accessibilityLabel={t('common.back')}
      accessibilityRole="button"
    >
      <Ionicons name="chevron-back" size={24} color="#007AFF" />
    </AppPressable>
  )

  const closeAction = (
    <AppPressable
      onPress={handleClose}
      className="p-2 min-w-[44px] min-h-[44px] items-center justify-center"
      pressedClassName="bg-gray-100 rounded-full"
      testID="settings-close"
      accessibilityLabel={t('common.close')}
      accessibilityRole="button"
    >
      <Ionicons name="close" size={24} color="#666" />
    </AppPressable>
  )

  if (currentView === 'notifications') {
    return (
      <AppScreen
        leftAction={backAction}
        title={t('settings.notificationSettings')}
      >
        <NotificationSettings onClose={handleBack} />
      </AppScreen>
    )
  }

  if (currentView === 'backup') {
    return (
      <AppScreen leftAction={backAction} title={t('settings.dataBackup')}>
        <BackupManager />
      </AppScreen>
    )
  }

  if (currentView === 'language') {
    return (
      <AppScreen leftAction={backAction} title={t('settings.language')}>
        <VStack className="flex-1 px-4 pt-6">
          <AppSection title={t('settings.language')}>
            <AppCard className="overflow-hidden p-0">
              <AppListRow
                onPress={() => changeLanguage('ja')}
                rightAccessory={
                  i18n.language === 'ja' ? (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  ) : null
                }
                selected={i18n.language === 'ja'}
                showChevron={false}
                title={t('settings.languageJapanese')}
              />
              <Box className="h-px bg-gray-200 ml-4" />
              <AppListRow
                onPress={() => changeLanguage('en')}
                rightAccessory={
                  i18n.language === 'en' ? (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  ) : null
                }
                selected={i18n.language === 'en'}
                showChevron={false}
                title={t('settings.languageEnglish')}
              />
            </AppCard>
          </AppSection>
        </VStack>
      </AppScreen>
    )
  }

  return (
    <AppScreen rightAction={closeAction} title={t('settings.title')}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <VStack className="px-4 pt-6" space="lg">
          <AppSection title={t('settings.general')}>
            <AppCard className="overflow-hidden p-0">
              <AppListRow
                icon="notifications-outline"
                onPress={() => setCurrentView('notifications')}
                subtitle={t('settings.notificationSublabel')}
                testID="settings-notifications"
                title={t('settings.notificationSettings')}
              />
              <Box className="h-px bg-gray-200 ml-4" />
              <AppListRow
                icon="language-outline"
                onPress={() => setCurrentView('language')}
                subtitle={
                  i18n.language === 'ja'
                    ? t('settings.languageJapanese')
                    : t('settings.languageEnglish')
                }
                testID="settings-language"
                title={t('settings.language')}
              />
            </AppCard>
          </AppSection>

          <AppSection title={t('settings.data')}>
            <AppCard className="overflow-hidden p-0">
              <AppListRow
                icon="cloud-upload-outline"
                onPress={() => setCurrentView('backup')}
                subtitle={t('settings.dataBackupSublabel')}
                testID="settings-backup"
                title={t('settings.dataBackup')}
              />
            </AppCard>
          </AppSection>
        </VStack>
      </ScrollView>
    </AppScreen>
  )
}
