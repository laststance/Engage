/**
 * Theme configuration for Engage app
 * Integrates with the Apple HIG-compliant design system
 */

import { Platform } from 'react-native'
import { DesignSystem } from './design-system'

// Legacy color system for backward compatibility
const tintColorLight = DesignSystem.colors.system.systemBlue
const tintColorDark = '#fff'

export const Colors = {
  light: {
    text: DesignSystem.colors.system.label,
    background: DesignSystem.colors.system.systemBackground,
    tint: tintColorLight,
    icon: DesignSystem.colors.system.systemGray,
    tabIconDefault: DesignSystem.colors.system.systemGray,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
}

// Use design system fonts
export const Fonts = DesignSystem.fonts

// Export design system for easy access
export { DesignSystem } from './design-system'
