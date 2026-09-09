import React from 'react'
import { AccessibilityInfo, Text } from 'react-native'
import { fireEvent, render } from '@testing-library/react-native'
import { TodayScreenErrorBoundary } from '@/src/components/TodayScreenErrorBoundary'

describe('TodayScreenErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance
  let accessibilityAnnouncementSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    accessibilityAnnouncementSpy = jest.spyOn(
      AccessibilityInfo,
      'announceForAccessibility',
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('announces a localized fallback without raw diagnostics and restores Today after retry', async () => {
    // Arrange
    let shouldThrow = true

    /**
     * Simulates one transient descendant failure before rendering normally on retry.
     * @returns Today content after its first render attempt throws.
     * @example
     * <TransientTodayContent />
     */
    const TransientTodayContent = (): React.ReactNode => {
      if (shouldThrow) {
        throw new Error('temporary render failure')
      }

      return <Text>Recovered Today content</Text>
    }

    const { getByTestId, getByText, queryByText } = await render(
      <TodayScreenErrorBoundary
        errorMessage="Unable to load Today"
        retryLabel="Retry"
        title="Today"
      >
        <TransientTodayContent />
      </TodayScreenErrorBoundary>
    )

    expect(getByText('Unable to load Today')).toBeTruthy()
    expect(queryByText('Error: temporary render failure')).toBeNull()
    expect(accessibilityAnnouncementSpy).toHaveBeenCalledWith(
      'Unable to load Today',
    )

    // Act
    shouldThrow = false
    await fireEvent.press(getByTestId('today-screen-error-retry'))

    // Assert
    expect(getByText('Recovered Today content')).toBeTruthy()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})
