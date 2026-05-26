import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { OperationFeedback } from '@/src/components/OperationFeedback'

describe('OperationFeedback', () => {
  it('shows the feedback message and retry action for recoverable failures', () => {
    // Arrange
    const onRetry = jest.fn()

    const { getByTestId, getByText } = render(
      <OperationFeedback
        kind="error"
        message="Save failed"
        actionLabel="Retry"
        onAction={onRetry}
        testID="save-feedback"
      />
    )

    // Act
    fireEvent.press(getByTestId('save-feedback-action'))

    // Assert
    expect(getByText('Save failed')).toBeTruthy()
    expect(getByText('Retry')).toBeTruthy()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
