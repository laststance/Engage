import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { OperationFeedback } from '@/src/components/OperationFeedback'

describe('OperationFeedback', () => {
  test('shows the feedback message and retry action for recoverable failures', async () => {
    // Arrange
    const onRetry = jest.fn()

    const { getByTestId, getByText } = await render(
      <OperationFeedback
        kind="error"
        message="Save failed"
        actionLabel="Retry"
        onAction={onRetry}
        testID="save-feedback"
      />
    )

    // Act
    await fireEvent.press(getByTestId('save-feedback-action'))

    // Assert
    expect(getByText('Save failed')).toBeTruthy()
    expect(getByText('Retry')).toBeTruthy()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
