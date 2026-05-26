import React from 'react'
import { Box } from '@/components/ui/box'
import { classNames } from '@/src/utils/classNames'

type AppCardTone = 'surface' | 'info' | 'success'

interface AppCardProps extends React.ComponentProps<typeof Box> {
  children: React.ReactNode
  tone?: AppCardTone
}

const cardToneClassNames: Record<AppCardTone, string> = {
  info: 'border-blue-100 bg-blue-50',
  success: 'border-green-200 bg-green-50',
  surface: 'border-gray-200 bg-white shadow-sm',
}

/**
 * Provides the shared card container used by dashboard and form surfaces.
 * @param props - Box props plus a semantic tone for app-level surfaces.
 * @returns A rounded, bordered card with consistent spacing and shadow.
 * @example
 * <AppCard tone="info"><Text>Saved</Text></AppCard>
 */
export function AppCard({
  children,
  className,
  tone = 'surface',
  ...props
}: AppCardProps) {
  return (
    <Box
      {...props}
      className={classNames('rounded-2xl border p-4', cardToneClassNames[tone], className)}
    >
      {children}
    </Box>
  )
}
