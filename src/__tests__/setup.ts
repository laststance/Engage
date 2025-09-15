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

// Global test timeout
jest.setTimeout(10000)
