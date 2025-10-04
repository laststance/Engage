// Jest setup file for global test configuration

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock expo-sqlite module
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}))

// Mock expo-symbols module
jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}))

// Global test timeout
jest.setTimeout(10000)
