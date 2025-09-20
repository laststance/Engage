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
import { initializeOfflineService } from '@/src/services/offlineService'
import { initializeBackupService } from '@/src/services/backupService'
// import { notificationService } from '@/src/services/notificationService'
// import { useNotificationResponse } from '@/src/hooks/useNotifications'
// import { router } from 'expo-router'

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider'
import '@/global.css'

// React Native DevTools types for E2E testing
declare global {
  interface Console {
    disableYellowBox?: boolean
  }
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
      onCommitFiberRoot?: any
      onCommitFiberUnmount?: any
    }
  }
}

export const unstable_settings = {
  anchor: '(tabs)',
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const initializeApp = useAppStore((state) => state.initializeApp)
  // const { lastResponse, clearLastResponse } = useNotificationResponse()

  useEffect(() => {
    // Disable React Native DevTools for E2E testing
    if (process.env.EXPO_PUBLIC_E2E_TEST === 'true') {
      console.log('🧪 E2E Test mode detected - Disabling DevTools')
      
      // Disable Yellow Box warnings
      if (__DEV__ && console.disableYellowBox !== undefined) {
        console.disableYellowBox = true
      }
      
      // Suppress console warnings and logs that trigger DevTools
      if (__DEV__) {
        const originalWarn = console.warn
        const originalLog = console.log
        const originalError = console.error
        
        console.warn = (...args) => {
          // Only log critical warnings, suppress DevTools-related warnings
          const message = args.join(' ')
          if (!message.includes('DevTools') && !message.includes('Remote debugger')) {
            originalWarn.apply(console, args)
          }
        }
        
        console.log = (...args) => {
          // Allow app-level logs but suppress DevTools connection logs
          const message = args.join(' ')
          if (!message.includes('DevTools') && !message.includes('Remote debugger')) {
            originalLog.apply(console, args)
          }
        }
        
        console.error = (...args) => {
          // Allow error logs but suppress DevTools-related errors
          const message = args.join(' ')
          if (!message.includes('DevTools') && !message.includes('Remote debugger')) {
            originalError.apply(console, args)
          }
        }
      }

      // Disable React DevTools if available
      if (__DEV__ && typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = undefined
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount = undefined
      }
    }

    const initApp = async () => {
      try {
        // Initialize database first
        await databaseService.initialize()

        // Initialize offline service with database
        initializeOfflineService(databaseService)

        // Initialize backup service with database
        initializeBackupService(databaseService)

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
