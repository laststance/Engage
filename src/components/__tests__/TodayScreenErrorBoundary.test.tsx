import React from 'react'
import { Text } from 'react-native'
import { fireEvent, render } from '@testing-library/react-native'
import { TodayScreenErrorBoundary } from '@/src/components/TodayScreenErrorBoundary'

describe('TodayScreenErrorBoundary', () => {
  it('restores Today content when a user retries a transient render failure', () => {
    // Arrange
    let shouldThrow = true
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

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

    const { getByTestId, getByText } = render(
      <TodayScreenErrorBoundary
        errorMessage="Unable to load Today"
        retryLabel="Retry"
        title="Today"
      >
        <TransientTodayContent />
      </TodayScreenErrorBoundary>
    )

    expect(getByText('Unable to load Today')).toBeTruthy()
    expect(getByText('Error: temporary render failure')).toBeTruthy()

    // Act
    shouldThrow = false
    fireEvent.press(getByTestId('today-screen-error-retry'))

    // Assert
    expect(getByText('Recovered Today content')).toBeTruthy()
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })
})
