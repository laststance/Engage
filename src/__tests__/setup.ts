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
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default),
  },
  StyleSheet: {
    create: jest.fn((styles) => styles),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
  Alert: {
    alert: jest.fn(),
  },
  Share: {
    share: jest.fn(),
  },
}))

// Mock expo-sqlite module
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}))

// Mock expo-symbols module
jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
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
