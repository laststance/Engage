import React from 'react'
import { render } from '@testing-library/react-native'
import { Calendar } from '../Calendar'

describe('Calendar completion and date markers', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  test('shows today and selection together without obscuring a high-completion day', async () => {
    // Arrange
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 23, 12))

    // Act
    const screen = await render(
      <Calendar
        selectedDate="2026-10-23"
        onDateSelect={jest.fn()}
        achievementData={{ '2026-10-23': 4 }}
      />
    )

    // Assert
    expect(screen.getByTestId('calendar-date-label-2026-10-23')).toBeVisible()
    expect(screen.getByTestId('calendar-date-label-2026-10-23')).toHaveStyle({
      textDecorationLine: 'underline',
      textDecorationColor: '#9A3412',
    })
    expect(screen.getByTestId('achievement-indicator-2026-10-23')).toHaveStyle({
      backgroundColor: '#84B59A',
      borderColor: '#1E40AF',
    })
    expect(screen.getByTestId('calendar-date-2026-10-23').props.accessibilityState).toMatchObject({ selected: true })
    expect(screen.getByTestId('calendar-date-2026-10-23').props.accessibilityValue).toEqual({ text: 'calendar.currentDateA11yValue' })
  })

  test('explains the highest completion bucket in the legend even when a day has more than four tasks', async () => {
    // Arrange
    const props = {
      selectedDate: '2026-10-15',
      onDateSelect: jest.fn(),
      achievementData: { '2026-10-15': 7 },
    }

    // Act
    const screen = await render(<Calendar {...props} />)

    // Assert
    expect(screen.getByText('4+')).toBeVisible()
    expect(screen.getByTestId('calendar-legend-level-4')).toHaveStyle({ backgroundColor: '#84B59A' })
    expect(screen.getByTestId('achievement-indicator-2026-10-15')).toHaveStyle({ backgroundColor: '#84B59A' })
  })
})
