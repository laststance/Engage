import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useEffect } from 'react'
import { LogBox } from 'react-native'
import 'react-native-reanimated'
import '@/src/i18n/config'

import { useColorScheme } from '@/hooks/use-color-scheme'
import { useAppStore } from '@/src/stores/app-store'
import { databaseService } from '@/src/services/database'
import { initializeOfflineService } from '@/src/services/offlineService'
import { initializeBackupService } from '@/src/services/backupService'

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

// Suppress LogBox warning banner that overlays the tab bar in development
if (__DEV__) {
  LogBox.ignoreAllLogs(true)
}

export const unstable_settings = {
  anchor: '(tabs)',
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const initializeApp = useAppStore((state) => state.initializeApp)

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

        console.log('App initialization completed successfully')
      } catch (error) {
        console.error('Failed to initialize app:', error)
      }
    }

    initApp()
  }, [initializeApp])

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
              options={{ presentation: 'modal', headerShown: false }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </GluestackUIProvider>
    </SafeAreaProvider>
  )
}
