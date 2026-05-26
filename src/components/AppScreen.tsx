import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Box } from '@/components/ui/box'
import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { classNames } from '@/src/utils/classNames'

interface AppScreenProps extends React.ComponentProps<typeof Box> {
  children: React.ReactNode
  description?: string
  descriptionTestID?: string
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
  title?: string
  titleTestID?: string
}

/**
 * Wraps app screens with one background, safe-area header, and title rhythm.
 * @param props - Screen content plus optional header title, description, and actions.
 * @returns A full-height screen shell that keeps top-level tabs visually aligned.
 * @example
 * <AppScreen title="Today" testID="today-screen"><DaySheet /></AppScreen>
 */
export function AppScreen({
  children,
  className,
  description,
  descriptionTestID,
  leftAction,
  rightAction,
  title,
  titleTestID,
  ...props
}: AppScreenProps) {
  const insets = useSafeAreaInsets()
  const shouldRenderHeader = Boolean(title || description || leftAction || rightAction)

  return (
    <Box {...props} className={classNames('flex-1 bg-gray-50', className)}>
      <VStack className="flex-1" style={{ paddingTop: insets.top }}>
        {shouldRenderHeader && (
          <VStack className="px-4 pt-4 pb-2">
            <HStack className="items-center justify-between mb-2">
              <Box className="min-w-[44px]">{leftAction}</Box>
              <Box className="flex-1">
                {title && (
                  <Text
                    className="text-2xl font-bold text-gray-800 text-center"
                    testID={titleTestID}
                  >
                    {title}
                  </Text>
                )}
              </Box>
              <Box className="min-w-[44px] items-end">{rightAction}</Box>
            </HStack>
            {description && (
              <Text
                className="text-gray-600 text-center text-sm"
                testID={descriptionTestID}
              >
                {description}
              </Text>
            )}
          </VStack>
        )}
        {children}
      </VStack>
    </Box>
  )
}
