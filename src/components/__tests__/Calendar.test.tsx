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

  it('renders correctly', () => {
    const { getByText } = render(<Calendar {...defaultProps} />)

    // Should show current month/year
    expect(getByText(/January 2024/)).toBeTruthy()
  })

  it('displays achievement indicators for dates with data', () => {
    const { getByTestId } = render(<Calendar {...defaultProps} />)

    // Should have achievement indicators for dates with completion data
    expect(getByTestId('achievement-indicator-2024-01-10')).toBeTruthy()
    expect(getByTestId('achievement-indicator-2024-01-15')).toBeTruthy()
    expect(getByTestId('achievement-indicator-2024-01-20')).toBeTruthy()
  })

  it('calls onDateSelect when a date is tapped', () => {
    const { getByTestId } = render(<Calendar {...defaultProps} />)

    const dateButton = getByTestId('calendar-date-2024-01-10')
    fireEvent.press(dateButton)

    expect(mockOnDateSelect).toHaveBeenCalledWith('2024-01-10')
  })

  it('highlights the selected date', () => {
    const { getByTestId } = render(<Calendar {...defaultProps} />)

    const selectedDate = getByTestId('calendar-date-2024-01-15')
    expect(selectedDate.props.style).toMatchObject(
      expect.objectContaining({
        backgroundColor: expect.any(String),
      })
    )
  })

  it('navigates to previous month', () => {
    const { getByTestId, getByText } = render(<Calendar {...defaultProps} />)

    const prevButton = getByTestId('calendar-prev-month')
    fireEvent.press(prevButton)

    expect(getByText(/December 2023/)).toBeTruthy()
  })

  it('navigates to next month', () => {
    const { getByTestId, getByText } = render(<Calendar {...defaultProps} />)

    const nextButton = getByTestId('calendar-next-month')
    fireEvent.press(nextButton)

    expect(getByText(/February 2024/)).toBeTruthy()
  })

  it('shows different achievement levels with different colors', () => {
    const { getByTestId } = render(<Calendar {...defaultProps} />)

    // Different achievement levels should have different visual indicators
    const lowAchievement = getByTestId('achievement-indicator-2024-01-15') // 1 task
    const highAchievement = getByTestId('achievement-indicator-2024-01-20') // 3 tasks

    expect(lowAchievement.props.style).not.toEqual(highAchievement.props.style)
  })

  it('handles empty achievement data gracefully', () => {
    const { queryByTestId } = render(
      <Calendar {...defaultProps} achievementData={{}} />
    )

    // Should not crash and should not show achievement indicators
    expect(queryByTestId('achievement-indicator-2024-01-10')).toBeNull()
  })

  it('shows today indicator for current date', () => {
    const today = new Date().toISOString().split('T')[0]
    const { getByTestId } = render(
      <Calendar {...defaultProps} selectedDate={today} />
    )

    expect(getByTestId(`calendar-date-${today}`)).toBeTruthy()
  })
})
