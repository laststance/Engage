/**
 * Apple HIG-Compliant Design System for Engage App
 *
 * This design system follows Apple Human Interface Guidelines and provides
 * consistent design tokens for colors, typography, spacing, and interaction states.
 */

import { Platform } from 'react-native'

// MARK: - Color System

/**
 * iOS System Colors following Apple HIG
 * These colors automatically adapt to light/dark mode and accessibility settings
 */
export const SystemColors = {
  // Primary System Colors
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemIndigo: '#5856D6',
  systemOrange: '#FF9500',
  systemPink: '#FF2D92',
  systemPurple: '#AF52DE',
  systemRed: '#FF3B30',
  systemTeal: '#5AC8FA',
  systemYellow: '#FFCC00',

  // Neutral Colors
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',

  // Label Colors (Text)
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C43',
  quaternaryLabel: '#2C2C2E',

  // Background Colors
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  tertiarySystemBackground: '#FFFFFF',

  // Grouped Background Colors
  systemGroupedBackground: '#F2F2F7',
  secondarySystemGroupedBackground: '#FFFFFF',
  tertiarySystemGroupedBackground: '#F2F2F7',

  // Fill Colors
  systemFill: '#78788033',
  secondarySystemFill: '#78788028',
  tertiarySystemFill: '#7676801E',
  quaternarySystemFill: '#74748014',

  // Separator Colors
  separator: '#3C3C4349',
  opaqueSeparator: '#C6C6C8',
} as const

/**
 * Category-specific colors for task organization
 * Blue for "事業" (business), Green for "生活" (life), and additional colors for custom categories
 */
export const CategoryColors = {
  // Default preset categories
  business: {
    primary: SystemColors.systemBlue,
    light: '#E3F2FD',
    dark: '#1565C0',
    text: '#FFFFFF',
  },
  life: {
    primary: SystemColors.systemGreen,
    light: '#E8F5E8',
    dark: '#2E7D32',
    text: '#FFFFFF',
  },

  // Additional colors for custom categories
  study: {
    primary: SystemColors.systemOrange,
    light: '#FFF3E0',
    dark: '#F57C00',
    text: '#FFFFFF',
  },
  health: {
    primary: SystemColors.systemPink,
    light: '#FCE4EC',
    dark: '#C2185B',
    text: '#FFFFFF',
  },
  finance: {
    primary: SystemColors.systemPurple,
    light: '#F3E5F5',
    dark: '#7B1FA2',
    text: '#FFFFFF',
  },
  hobby: {
    primary: SystemColors.systemTeal,
    light: '#E0F2F1',
    dark: '#00695C',
    text: '#FFFFFF',
  },
  work: {
    primary: SystemColors.systemIndigo,
    light: '#E8EAF6',
    dark: '#303F9F',
    text: '#FFFFFF',
  },
  personal: {
    primary: SystemColors.systemYellow,
    light: '#FFFDE7',
    dark: '#F57F17',
    text: '#000000',
  },
} as const

/**
 * Semantic colors for different states and feedback
 */
export const SemanticColors = {
  success: SystemColors.systemGreen,
  warning: SystemColors.systemYellow,
  error: SystemColors.systemRed,
  info: SystemColors.systemBlue,

  // Completion states for heatmap
  heatmap: {
    none: SystemColors.systemGray6,
    low: '#C8E6C9',
    medium: '#81C784',
    high: '#4CAF50',
    highest: '#2E7D32',
  },
} as const

// MARK: - Typography System

/**
 * iOS Typography Scale following Apple HIG
 * Font sizes and weights that match iOS system typography
 */
export const Typography = {
  // Display Typography
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
  },

  // Title Typography
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600' as const,
    letterSpacing: 0.38,
  },

  // Headline Typography
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
  },

  // Body Typography
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
  },

  // Supporting Typography
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400' as const,
    letterSpacing: -0.32,
  },
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
  },

  // Caption Typography
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400' as const,
    letterSpacing: 0.07,
  },
} as const

/**
 * Font families optimized for each platform
 */
export const FontFamilies = Platform.select({
  ios: {
    system: 'system-ui',
    systemRounded: 'ui-rounded',
    systemMono: 'ui-monospace',
  },
  android: {
    system: 'Roboto',
    systemRounded: 'Roboto',
    systemMono: 'monospace',
  },
  default: {
    system: 'system-ui',
    systemRounded: 'system-ui',
    systemMono: 'monospace',
  },
})

// MARK: - Spacing System

/**
 * Consistent spacing scale following 8pt grid system
 * Based on Apple HIG spacing recommendations
 */
export const Spacing = {
  // Base spacing units
  xs: 4, // 0.25rem
  sm: 8, // 0.5rem
  md: 16, // 1rem
  lg: 24, // 1.5rem
  xl: 32, // 2rem
  xxl: 48, // 3rem
  xxxl: 64, // 4rem

  // Component-specific spacing
  component: {
    padding: {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
    },
    margin: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
    },
    gap: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
    },
  },

  // Layout spacing
  layout: {
    screenPadding: 16,
    sectionSpacing: 24,
    cardPadding: 16,
    listItemPadding: 12,
  },
} as const

// MARK: - Border Radius

/**
 * Border radius values following iOS design patterns
 */
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,

  // Component-specific radius
  button: 8,
  card: 12,
  modal: 16,
  input: 8,
} as const

// MARK: - Shadows

/**
 * Shadow system following iOS elevation patterns
 */
export const Shadows = {
  // iOS-style shadows
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  // Component-specific shadows
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
} as const

// MARK: - Touch Targets

/**
 * Minimum touch target sizes following Apple HIG accessibility guidelines
 */
export const TouchTargets = {
  minimum: 44, // Minimum 44pt touch target
  comfortable: 48, // Comfortable touch target
  large: 56, // Large touch target for primary actions
} as const

// MARK: - Animation Timing

/**
 * Animation durations and easing curves following iOS patterns
 */
export const Animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },

  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
} as const

// MARK: - Utility Functions

/**
 * Get category color by category name or ID
 */
export const getCategoryColor = (
  categoryName: string
): (typeof CategoryColors)[keyof typeof CategoryColors] => {
  // Map category names to color keys
  const categoryMap: Record<string, keyof typeof CategoryColors> = {
    事業: 'business',
    生活: 'life',
    勉強: 'study',
    健康: 'health',
    財務: 'finance',
    趣味: 'hobby',
    仕事: 'work',
    個人: 'personal',
  }

  const colorKey = categoryMap[categoryName] || 'business'
  return CategoryColors[colorKey]
}

/**
 * Generate dynamic color for custom categories
 */
export const generateCategoryColor = (
  categoryId: string
): (typeof CategoryColors)[keyof typeof CategoryColors] => {
  const colors = Object.values(CategoryColors)
  const index = categoryId.length % colors.length
  return colors[index]
}

/**
 * Get heatmap color based on completion count
 */
export const getHeatmapColor = (completionCount: number): string => {
  if (completionCount === 0) return SemanticColors.heatmap.none
  if (completionCount === 1) return SemanticColors.heatmap.low
  if (completionCount === 2) return SemanticColors.heatmap.medium
  if (completionCount === 3) return SemanticColors.heatmap.high
  return SemanticColors.heatmap.highest
}

/**
 * Create consistent component styles
 */
export const createComponentStyles = {
  button: (variant: 'primary' | 'secondary' | 'tertiary' = 'primary') => ({
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.button,
    minHeight: TouchTargets.minimum,
    ...Shadows.small,
    ...(variant === 'primary' && {
      backgroundColor: SystemColors.systemBlue,
    }),
    ...(variant === 'secondary' && {
      backgroundColor: SystemColors.systemGray6,
    }),
    ...(variant === 'tertiary' && {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: SystemColors.systemGray4,
    }),
  }),

  card: () => ({
    backgroundColor: SystemColors.systemBackground,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    ...Shadows.card,
  }),

  input: () => ({
    backgroundColor: SystemColors.tertiarySystemBackground,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: TouchTargets.minimum,
    borderWidth: 1,
    borderColor: SystemColors.systemGray4,
  }),
}

// Export the complete design system
export const DesignSystem = {
  colors: {
    system: SystemColors,
    category: CategoryColors,
    semantic: SemanticColors,
  },
  typography: Typography,
  fonts: FontFamilies,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  touchTargets: TouchTargets,
  animation: Animation,
  utils: {
    getCategoryColor,
    generateCategoryColor,
    getHeatmapColor,
    createComponentStyles,
  },
} as const

export default DesignSystem
