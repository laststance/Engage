// Manual mock for react-native to avoid ESM import issues in tests

export const Platform = {
  OS: 'ios',
  select: jest.fn((obj: any) => obj.ios || obj.default),
}

export const StyleSheet = {
  create: jest.fn((styles: any) => styles),
}

export const Dimensions = {
  get: jest.fn(() => ({ width: 375, height: 812 })),
}

export const Alert = {
  alert: jest.fn(),
}

export const Share = {
  share: jest.fn(),
}

export default {
  Platform,
  StyleSheet,
  Dimensions,
  Alert,
  Share,
}
