import React from 'react'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { classNames } from '@/src/utils/classNames'

interface AppSectionProps extends React.ComponentProps<typeof VStack> {
  children: React.ReactNode
  title?: string
  subtitle?: string
  titleTestID?: string
}

/**
 * Groups related screen content under one normalized section heading.
 * @param props - Section text, children, and optional VStack props.
 * @returns A vertically spaced section with consistent title hierarchy.
 * @example
 * <AppSection title="Stats"><AppCard /></AppSection>
 */
export function AppSection({
  children,
  className,
  space = 'sm',
  subtitle,
  title,
  titleTestID,
  ...props
}: AppSectionProps) {
  return (
    <VStack {...props} className={classNames(className)} space={space}>
      {(title || subtitle) && (
        <Box>
          {title && (
            <Text
              className="text-xl font-semibold text-gray-800"
              testID={titleTestID}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text className="mt-1 text-sm leading-5 text-gray-500">
              {subtitle}
            </Text>
          )}
        </Box>
      )}
      {children}
    </VStack>
  )
}
