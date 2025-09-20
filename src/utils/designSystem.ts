/**
 * Design System Utilities
 * Helper functions to use the Apple HIG-compliant design system in components
 */

import { DesignSystem } from '@/constants/design-system'

/**
 * Get category color classes for Tailwind CSS
 */
export const getCategoryColorClasses = (categoryName: string) => {
  const colorMap: Record<string, string> = {
    事業: 'business',
    生活: 'life',
    勉強: 'study',
    健康: 'health',
    財務: 'finance',
    趣味: 'hobby',
    仕事: 'work',
    個人: 'personal',
  }

  const colorKey = colorMap[categoryName] || 'business'

  return {
    background: `bg-${colorKey}`,
    backgroundLight: `bg-${colorKey}-light`,
    backgroundDark: `bg-${colorKey}-dark`,
    text: `text-${colorKey}`,
    border: `border-${colorKey}`,
  }
}

/**
 * Get category color by ID (for dynamic categories)
 */
export const getCategoryColorById = (categoryId: string) => {
  const colors = [
    'business',
    'life',
    'study',
    'health',
    'finance',
    'hobby',
    'work',
    'personal',
  ]
  const index = categoryId.length % colors.length
  const colorKey = colors[index]

  return {
    background: `bg-${colorKey}`,
    backgroundLight: `bg-${colorKey}-light`,
    backgroundDark: `bg-${colorKey}-dark`,
    text: `text-${colorKey}`,
    border: `border-${colorKey}`,
  }
}

/**
 * Get heatmap color class based on completion count
 */
export const getHeatmapColorClass = (completionCount: number): string => {
  if (completionCount === 0) return 'bg-heatmap-none'
  if (completionCount === 1) return 'bg-heatmap-low'
  if (completionCount === 2) return 'bg-heatmap-medium'
  if (completionCount === 3) return 'bg-heatmap-high'
  return 'bg-heatmap-highest'
}

/**
 * Apple HIG Typography Classes
 */
export const TypographyClasses = {
  largeTitle: 'text-large-title',
  title1: 'text-title-1',
  title2: 'text-title-2',
  title3: 'text-title-3',
  headline: 'text-headline',
  body: 'text-body',
  callout: 'text-callout',
  subhead: 'text-subhead',
  footnote: 'text-footnote',
  caption1: 'text-caption-1',
  caption2: 'text-caption-2',
} as const

/**
 * Apple HIG Color Classes
 */
export const ColorClasses = {
  // System Colors
  systemBlue: 'text-system-blue',
  systemGreen: 'text-system-green',
  systemOrange: 'text-system-orange',
  systemRed: 'text-system-red',
  systemPurple: 'text-system-purple',
  systemPink: 'text-system-pink',
  systemTeal: 'text-system-teal',
  systemYellow: 'text-system-yellow',

  // Label Colors
  label: 'text-label',
  secondaryLabel: 'text-secondary-label',
  tertiaryLabel: 'text-tertiary-label',
  quaternaryLabel: 'text-quaternary-label',

  // Background Colors
  systemBackground: 'bg-system-background',
  secondarySystemBackground: 'bg-secondary-system-background',
  tertiarySystemBackground: 'bg-tertiary-system-background',
} as const

/**
 * Apple HIG Spacing Classes
 */
export const SpacingClasses = {
  xs: 'p-1', // 4px
  sm: 'p-2', // 8px
  md: 'p-4', // 16px
  lg: 'p-6', // 24px
  xl: 'p-8', // 32px
  xxl: 'p-12', // 48px
  xxxl: 'p-16', // 64px
} as const

/**
 * Apple HIG Shadow Classes
 */
export const ShadowClasses = {
  small: 'shadow-ios-small',
  medium: 'shadow-ios-medium',
  large: 'shadow-ios-large',
  card: 'shadow-ios-card',
  modal: 'shadow-ios-modal',
} as const

/**
 * Apple HIG Touch Target Classes
 */
export const TouchTargetClasses = {
  minimum: 'touch-target-minimum',
  comfortable: 'touch-target-comfortable',
  large: 'touch-target-large',
} as const

/**
 * Create button style classes based on variant
 */
export const getButtonClasses = (
  variant: 'primary' | 'secondary' | 'tertiary' = 'primary'
) => {
  const baseClasses =
    'px-4 py-2 rounded-lg touch-target-minimum shadow-ios-small'

  switch (variant) {
    case 'primary':
      return `${baseClasses} bg-system-blue text-white`
    case 'secondary':
      return `${baseClasses} bg-system-gray-6 text-label`
    case 'tertiary':
      return `${baseClasses} bg-transparent border border-system-gray-4 text-label`
    default:
      return `${baseClasses} bg-system-blue text-white`
  }
}

/**
 * Create card style classes
 */
export const getCardClasses = () => {
  return 'bg-system-background rounded-lg p-4 shadow-ios-card'
}

/**
 * Create input style classes
 */
export const getInputClasses = () => {
  return 'bg-tertiary-system-background rounded-lg px-4 py-2 touch-target-minimum border border-system-gray-4'
}

/**
 * Get semantic color classes
 */
export const getSemanticColorClasses = (
  type: 'success' | 'warning' | 'error' | 'info'
) => {
  const colorMap = {
    success: 'system-green',
    warning: 'system-yellow',
    error: 'system-red',
    info: 'system-blue',
  }

  const color = colorMap[type]
  return {
    background: `bg-${color}`,
    text: `text-${color}`,
    border: `border-${color}`,
  }
}

/**
 * Export all utilities
 */
export const DesignSystemUtils = {
  getCategoryColorClasses,
  getCategoryColorById,
  getHeatmapColorClass,
  getButtonClasses,
  getCardClasses,
  getInputClasses,
  getSemanticColorClasses,
  Typography: TypographyClasses,
  Colors: ColorClasses,
  Spacing: SpacingClasses,
  Shadows: ShadowClasses,
  TouchTargets: TouchTargetClasses,
}

export default DesignSystemUtils
