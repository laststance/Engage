import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useEffect } from 'react'
import 'react-native-reanimated'

import { useColorScheme } from '@/hooks/use-color-scheme'
import { useAppStore } from '@/src/stores/app-store'
import { databaseService } from '@/src/services/database'
// import { notificationService } from '@/src/services/notificationService'
// import { useNotificationResponse } from '@/src/hooks/useNotifications'
// import { router } from 'expo-router'

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider'
import '@/global.css'

export const unstable_settings = {
  anchor: '(tabs)',
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const initializeApp = useAppStore((state) => state.initializeApp)
  // const { lastResponse, clearLastResponse } = useNotificationResponse()

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize database first
        await databaseService.initialize()

        // Then initialize app state and presets
        await initializeApp()

        // Initialize notification service (don't await to avoid blocking app startup)
        // notificationService
        //   .initialize()
        //   .then((success) => {
        //     if (success) {
        //       console.log('Notification service initialized')
        //       // Schedule default daily reminder at 9:00 AM
        //       notificationService.scheduleDailyReminder(9, 0)
        //     }
        //   })
        //   .catch((error) => {
        //     console.warn('Failed to initialize notifications:', error)
        //   })

        console.log('App initialization completed successfully')
      } catch (error) {
        console.error('Failed to initialize app:', error)
      }
    }

    initApp()
  }, [initializeApp])

  // Handle notification responses (when user taps on notification)
  // useEffect(() => {
  //   if (lastResponse) {
  //     const data = lastResponse.notification.request.content.data

  //     // Handle different notification types
  //     if (data?.type === 'daily_reminder') {
  //       // Navigate to today's view when user taps daily reminder
  //       router.push('/today')
  //     } else if (data?.url) {
  //       // Handle custom deep links
  //       router.push(data.url as any)
  //     }

  //     // Clear the response after handling
  //     clearLastResponse()
  //   }
  // }, [lastResponse, clearLastResponse])

  return (
    <SafeAreaProvider>
      <GluestackUIProvider mode="light">
        <ThemeProvider
          value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
        >
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: 'modal', title: 'Modal' }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </GluestackUIProvider>
    </SafeAreaProvider>
  )
}
