// Jest setup file for global test configuration

// Define React Native globals
;(globalThis as any).__DEV__ = true

// Mock console methods to reduce noise in tests
globalThis.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock React Native completely for unit tests
jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const createNativeComponent = (displayName: string) => {
    const NativeComponent = React.forwardRef(
      ({ children, ...props }: any, ref: any) =>
        React.createElement(displayName, { ...props, ref }, children)
    )
    NativeComponent.displayName = displayName
    return NativeComponent
  }

  const Pressable = React.forwardRef(
    ({ children, disabled, onPress, ...props }: any, ref: any) =>
      React.createElement(
        'Pressable',
        {
          ...props,
          disabled,
          onPress: disabled ? undefined : onPress,
          ref,
        },
        typeof children === 'function' ? children({ pressed: false }) : children
      )
  )
  Pressable.displayName = 'Pressable'

  const Modal = ({ children, visible }: any) => {
    if (!visible) {
      return null
    }

    return React.createElement('Modal', {}, children)
  }

  return {
    View: createNativeComponent('View'),
    Text: createNativeComponent('Text'),
    TextInput: createNativeComponent('TextInput'),
    InputAccessoryView: createNativeComponent('InputAccessoryView'),
    KeyboardAvoidingView: createNativeComponent('KeyboardAvoidingView'),
    SafeAreaView: createNativeComponent('SafeAreaView'),
    ScrollView: createNativeComponent('ScrollView'),
    Switch: createNativeComponent('Switch'),
    Pressable,
    Modal,
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios || obj.default),
    },
    StyleSheet: {
      create: jest.fn((styles) => styles),
      flatten: jest.fn((style) => style),
    },
    Keyboard: {
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      dismiss: jest.fn(),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
    },
    Appearance: {
      getColorScheme: jest.fn(() => 'light'),
      addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
    },
    Alert: {
      alert: jest.fn(),
    },
    Share: {
      share: jest.fn(),
    },
    Linking: {
      openSettings: jest.fn(() => Promise.resolve()),
    },
  }
})

// Mock expo-sqlite module
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}))

// Mock expo-symbols module
jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}))

// Mock vector icons used by IconSymbol
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons')

// Mock expo-haptics module
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: {
    Success: 'success',
    Error: 'error',
  },
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}))

// Mock expo-notifications module
jest.mock('expo-notifications', () => ({
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'undetermined', granted: false })
  ),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'denied', granted: false })
  ),
  scheduleNotificationAsync: jest.fn(() =>
    Promise.resolve('engage-daily-reminder')
  ),
  setNotificationHandler: jest.fn(),
  IosAuthorizationStatus: {
    NOT_DETERMINED: 0,
    DENIED: 1,
    AUTHORIZED: 2,
    PROVISIONAL: 3,
    EPHEMERAL: 4,
  },
  SchedulableTriggerInputTypes: {
    CALENDAR: 'calendar',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
  },
}))

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}))

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  Paths: {
    document: {
      uri: 'file://mock/',
    },
  },
  documentDirectory: 'file://mock/',
}))

// Mock expo-file-system legacy API used by backup service
jest.mock('expo-file-system/legacy', () => ({
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
}))

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}))

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}))

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(),
  clear: jest.fn(),
}))

// Mock expo-localization (required by i18n/config.ts)
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'ja' }]),
  getCalendars: jest.fn(() => []),
}))

// Mock react-i18next
jest.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: jest.fn() },
  }),
}))

// Global test timeout
jest.setTimeout(10000)
