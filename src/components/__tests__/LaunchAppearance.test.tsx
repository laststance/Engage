import React from 'react'
import { render } from '@testing-library/react-native'
import { ThemeProvider } from 'expo-router/react-navigation'
import appConfig from '@/app.json'

// RootLayout configures development warnings at import time; scope that native mock here.
jest.requireMock('react-native').LogBox = { ignoreAllLogs: jest.fn() }

const { default: RootLayout } =
  jest.requireActual<typeof import('@/app/_layout')>('@/app/_layout')

jest.mock('@/global.css', () => ({}))
jest.mock('@/src/i18n/config', () => ({}))
jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: () => 'dark' }))
jest.mock('expo-splash-screen', () => ({ setOptions: jest.fn() }))
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }))
jest.mock('expo-router/react-navigation', () => ({
  DefaultTheme: { dark: false, colors: { background: 'white' } },
  DarkTheme: { dark: true, colors: { background: 'black' } },
  ThemeProvider: jest.fn(({ children }) => children),
}))
jest.mock('expo-router', () => ({
  Stack: Object.assign(({ children }: React.PropsWithChildren) => children, {
    Screen: () => null,
  }),
}))
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: (props: Record<string, unknown>) => {
    const { View } = jest.requireMock('react-native')
    return <View {...props} testID="launch-root" />
  },
}))
jest.mock('@/components/ui/gluestack-ui-provider', () => ({
  GluestackUIProvider: ({ children }: React.PropsWithChildren) => children,
}))
jest.mock('@/src/components/DailyTaskSynchronization', () => ({
  DailyTaskSynchronization: () => null,
}))
jest.mock('@/src/stores/app-store', () => ({
  useAppStore: (selector: (state: unknown) => unknown) =>
    selector({ initializeApp: jest.fn() }),
}))
jest.mock('@/src/services/database', () => ({
  databaseService: { initialize: () => new Promise(() => {}) },
}))
jest.mock('@/src/services/offlineService', () => ({
  initializeOfflineService: jest.fn(),
}))
jest.mock('@/src/services/backupService', () => ({
  initializeBackupService: jest.fn(),
}))

describe('Launch appearance', () => {
  test('keeps the native launch surface light when the device uses dark appearance', () => {
    // Arrange
    const { expo } = appConfig
    const splashPlugin = expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen'
    ) as [string, { backgroundColor: string; dark?: { backgroundColor: string } }]

    // Act
    const splash = splashPlugin[1]

    // Assert
    expect(expo.userInterfaceStyle).toBe('light')
    expect(expo).toHaveProperty('backgroundColor', '#f9fafb')
    expect(splash.backgroundColor).toBe('#f9fafb')
    expect(splash.dark?.backgroundColor ?? splash.backgroundColor).toBe('#f9fafb')
  })

  test('keeps an opaque light root and navigation surface while startup data is loading', async () => {
    // Arrange
    jest.mocked(ThemeProvider).mockClear()

    // Act
    const screen = await render(<RootLayout />)
    const theme = jest.mocked(ThemeProvider).mock.calls[0][0].value

    // Assert
    expect(screen.getByTestId('launch-root')).toHaveStyle({
      backgroundColor: '#f9fafb',
    })
    expect(theme).toMatchObject({
      dark: false,
      colors: { background: '#f9fafb' },
    })
  })
})
