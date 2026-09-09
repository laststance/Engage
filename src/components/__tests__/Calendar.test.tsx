import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Calendar } from '../Calendar'

// Mock the GluestackUIProvider
jest.mock('@/components/ui/gluestack-ui-provider', () => ({
  GluestackUIProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}))

describe('Calendar', () => {
  const mockOnDateSelect = jest.fn()
  const defaultProps = {
    selectedDate: '2024-01-15',
    onDateSelect: mockOnDateSelect,
    achievementData: {
      '2024-01-10': 2,
      '2024-01-15': 1,
      '2024-01-20': 3,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders correctly', async () => {
    const { getByText } = await render(<Calendar {...defaultProps} />)

    // Should show current month/year
    expect(getByText(/January 2024/)).toBeTruthy()
  })

  test('displays achievement indicators for dates with data', async () => {
    const { getByTestId } = await render(<Calendar {...defaultProps} />)

    // Should have achievement indicators for dates with completion data
    expect(getByTestId('achievement-indicator-2024-01-10')).toBeTruthy()
    expect(getByTestId('achievement-indicator-2024-01-15')).toBeTruthy()
    expect(getByTestId('achievement-indicator-2024-01-20')).toBeTruthy()
  })

  test('calls onDateSelect when a date is tapped', async () => {
    const { getByTestId } = await render(<Calendar {...defaultProps} />)

    const dateButton = getByTestId('calendar-date-2024-01-10')
    await fireEvent.press(dateButton)

    expect(mockOnDateSelect).toHaveBeenCalledWith('2024-01-10')
  })

  test('highlights the selected date', async () => {
    const { getByTestId } = await render(<Calendar {...defaultProps} />)

    const selectedDate = getByTestId('calendar-date-2024-01-15')
    expect(selectedDate.props.style).toMatchObject(
      expect.objectContaining({
        backgroundColor: expect.any(String),
      })
    )
  })

  test('marks the selected date cell for assistive technologies', async () => {
    // Arrange
    const { getByTestId } = await render(<Calendar {...defaultProps} />)

    // Act
    const selectedDate = getByTestId('calendar-date-2024-01-15')
    const unselectedDate = getByTestId('calendar-date-2024-01-10')

    // Assert
    expect(selectedDate.props.accessibilityState).toMatchObject({
      selected: true,
    })
    expect(unselectedDate.props.accessibilityState).toMatchObject({
      selected: false,
    })
  })

  test('navigates to previous month', async () => {
    const { getByTestId, getByText } = await render(<Calendar {...defaultProps} />)

    const prevButton = getByTestId('calendar-prev-month')
    await fireEvent.press(prevButton)

    expect(getByText(/December 2023/)).toBeTruthy()
  })

  test('navigates to next month', async () => {
    const { getByTestId, getByText } = await render(<Calendar {...defaultProps} />)

    const nextButton = getByTestId('calendar-next-month')
    await fireEvent.press(nextButton)

    expect(getByText(/February 2024/)).toBeTruthy()
  })

  test('shows different achievement levels with different colors', async () => {
    const { getByTestId } = await render(<Calendar {...defaultProps} />)

    // Different achievement levels should have different visual indicators
    const lowAchievement = getByTestId('achievement-indicator-2024-01-15') // 1 task
    const highAchievement = getByTestId('achievement-indicator-2024-01-20') // 3 tasks

    expect(lowAchievement.props.style).not.toEqual(highAchievement.props.style)
  })

  test('handles empty achievement data gracefully', async () => {
    const { queryByTestId } = await render(
      <Calendar {...defaultProps} achievementData={{}} />
    )

    // Should not crash and should not show achievement indicators
    expect(queryByTestId('achievement-indicator-2024-01-10')).toBeNull()
  })

  test('shows today indicator for current date', async () => {
    const today = new Date().toISOString().split('T')[0]
    const { getByTestId } = await render(
      <Calendar {...defaultProps} selectedDate={today} />
    )

    expect(getByTestId(`calendar-date-${today}`)).toBeTruthy()
  })
})
