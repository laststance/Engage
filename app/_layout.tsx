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

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider'
import '@/global.css'

export const unstable_settings = {
  anchor: '(tabs)',
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const initializeApp = useAppStore((state) => state.initializeApp)

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize database first
        await databaseService.initialize()

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
              options={{ presentation: 'modal', title: 'Modal' }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </GluestackUIProvider>
    </SafeAreaProvider>
  )
}
