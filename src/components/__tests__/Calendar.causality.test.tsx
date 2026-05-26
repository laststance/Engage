import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { Calendar } from '../Calendar'

describe('Calendar completion causality', () => {
  it('guides users to complete a Today habit when the month has no completions', () => {
    // Arrange
    const { getByTestId, getByText, queryByTestId } = render(
      <Calendar
        achievementData={{}}
        onDateSelect={jest.fn()}
        selectedDate="2026-05-15"
      />
    )

    // Assert
    expect(getByTestId('calendar-monthly-summary-hint')).toBeTruthy()
    expect(getByText('calendar.monthlySummaryEmptyHint')).toBeTruthy()
    expect(queryByTestId('calendar-selected-day-recap')).toBeNull()
  })

  it('recaps completions for the selected date when the heatmap updates', () => {
    // Arrange
    const { getByTestId, getByText } = render(
      <Calendar
        achievementData={{ '2026-05-15': 2 }}
        onDateSelect={jest.fn()}
        selectedDate="2026-05-15"
      />
    )

    // Assert
    expect(getByTestId('calendar-selected-day-recap')).toBeTruthy()
    expect(getByText('calendar.selectedDateCompleted')).toBeTruthy()
  })

  it('hides the selected-day recap when month navigation leaves that date behind', () => {
    // Arrange
    const { getByTestId, queryByTestId } = render(
      <Calendar
        achievementData={{ '2026-05-15': 2 }}
        onDateSelect={jest.fn()}
        selectedDate="2026-05-15"
      />
    )

    // Act
    fireEvent.press(getByTestId('calendar-next-month'))

    // Assert
    expect(queryByTestId('calendar-selected-day-recap')).toBeNull()
  })
})
