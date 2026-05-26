import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Box } from '@/components/ui/box'
import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { AppPressable } from '@/src/components/AppPressable'
import { classNames } from '@/src/utils/classNames'

interface AppListRowProps
  extends Omit<React.ComponentProps<typeof AppPressable>, 'children'> {
  icon?: keyof typeof Ionicons.glyphMap
  rightAccessory?: React.ReactNode
  showChevron?: boolean
  subtitle?: string
  title: string
}

/**
 * Renders a settings-style list row with shared touch feedback and spacing.
 * @param props - Row label, optional icon/subtitle/accessory, and AppPressable props.
 * @returns A tappable row that preserves app-level pressed and accessibility states.
 * @example
 * <AppListRow icon="settings-outline" title="Settings" onPress={openSettings} />
 */
export function AppListRow({
  accessibilityLabel,
  className,
  icon,
  rightAccessory,
  selected,
  showChevron = true,
  subtitle,
  title,
  ...props
}: AppListRowProps) {
  const resolvedAccessibilityLabel =
    accessibilityLabel ?? [title, subtitle].filter(Boolean).join(', ')

  return (
    <AppPressable
      {...props}
      accessibilityLabel={resolvedAccessibilityLabel}
      accessibilityRole="button"
      className={classNames(
        'min-h-[52px] flex-row items-center px-4 py-3',
        className
      )}
      pressedClassName="bg-gray-100"
      selected={selected}
      selectedClassName="bg-blue-50"
    >
      <HStack className="flex-1 items-center" space="sm">
        {icon && (
          <Box className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center">
            <Ionicons name={icon} size={18} color="#6B7280" />
          </Box>
        )}
        <VStack className="flex-1">
          <Text className="text-base text-gray-900">{title}</Text>
          {subtitle && (
            <Text className="mt-0.5 text-xs text-gray-500">{subtitle}</Text>
          )}
        </VStack>
        {rightAccessory}
        {showChevron && (
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        )}
      </HStack>
    </AppPressable>
  )
}
