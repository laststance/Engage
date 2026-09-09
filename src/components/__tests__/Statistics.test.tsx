import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Statistics } from '../Statistics'
import { StatsData, Category } from '../../types'

// Mock the GluestackUIProvider
jest.mock('@/components/ui/gluestack-ui-provider', () => ({
  GluestackUIProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}))

describe('Statistics', () => {
  const mockCategories: Category[] = [
    { id: 'business', name: '事業' },
    { id: 'life', name: '生活' },
    { id: 'study', name: '勉強' },
  ]

  const mockWeeklyStats: StatsData = {
    streakDays: 5,
    completionRate: 0.75,
    activeDays: 6,
    totalTasks: 20,
    dailyAverage: 2.8,
    journalDays: 4,
    categoryBreakdown: {
      business: { completed: 8, total: 10 },
      life: { completed: 6, total: 8 },
      study: { completed: 1, total: 2 },
    },
  }

  const mockMonthlyStats: StatsData = {
    streakDays: 12,
    completionRate: 0.68,
    activeDays: 25,
    totalTasks: 90,
    dailyAverage: 3.6,
    journalDays: 18,
    categoryBreakdown: {
      business: { completed: 30, total: 45 },
      life: { completed: 25, total: 35 },
      study: { completed: 6, total: 10 },
    },
  }

  const defaultProps = {
    weeklyStats: mockWeeklyStats,
    monthlyStats: mockMonthlyStats,
    categories: mockCategories,
  }

  test('renders correctly', async () => {
    const { getByTestId, getByText } = await render(<Statistics {...defaultProps} />)

    expect(getByTestId('statistics-screen')).toBeTruthy()
    expect(getByText('今週')).toBeTruthy()
    expect(getByText('今月')).toBeTruthy()
  })

  test('displays weekly stats by default', async () => {
    const { getByText } = await render(<Statistics {...defaultProps} />)

    // Should show weekly streak
    expect(getByText('5日連続')).toBeTruthy()

    // Should show weekly completion rate
    expect(getByText('75%')).toBeTruthy()

    // Should show weekly active days
    expect(getByText('6日')).toBeTruthy()
  })

  test('switches to monthly stats when monthly toggle is pressed', async () => {
    const { getByTestId, getByText } = await render(<Statistics {...defaultProps} />)

    const monthlyToggle = getByTestId('stats-month-toggle')
    await fireEvent.press(monthlyToggle)

    // Should show monthly streak
    expect(getByText('12日連続')).toBeTruthy()

    // Should show monthly completion rate
    expect(getByText('68%')).toBeTruthy()

    // Should show monthly active days
    expect(getByText('25日')).toBeTruthy()
  })

  test('marks the active stats period for assistive technologies', async () => {
    // Arrange
    const { getByTestId } = await render(<Statistics {...defaultProps} />)

    // Act
    const weeklyToggle = getByTestId('stats-week-toggle')
    const monthlyToggle = getByTestId('stats-month-toggle')

    // Assert
    expect(weeklyToggle.props.accessibilityState).toMatchObject({
      selected: true,
    })
    expect(monthlyToggle.props.accessibilityState).toMatchObject({
      selected: false,
    })
  })

  test('moves the selected accessibility state when the monthly stats period is opened', async () => {
    // Arrange
    const { getByTestId } = await render(<Statistics {...defaultProps} />)

    // Act
    await fireEvent.press(getByTestId('stats-month-toggle'))

    // Assert
    expect(getByTestId('stats-week-toggle').props.accessibilityState).toMatchObject({
      selected: false,
    })
    expect(getByTestId('stats-month-toggle').props.accessibilityState).toMatchObject({
      selected: true,
    })
  })

  test('switches back to weekly stats when weekly toggle is pressed', async () => {
    const { getByTestId, getByText } = await render(<Statistics {...defaultProps} />)

    // Switch to monthly first
    const monthlyToggle = getByTestId('stats-month-toggle')
    await fireEvent.press(monthlyToggle)

    // Then switch back to weekly
    const weeklyToggle = getByTestId('stats-week-toggle')
    await fireEvent.press(weeklyToggle)

    // Should show weekly stats again
    expect(getByText('5日連続')).toBeTruthy()
    expect(getByText('75%')).toBeTruthy()
  })

  test('displays category breakdown correctly', async () => {
    const { getByText } = await render(<Statistics {...defaultProps} />)

    // Should show category names
    expect(getByText('事業')).toBeTruthy()
    expect(getByText('生活')).toBeTruthy()
    expect(getByText('勉強')).toBeTruthy()

    // Should show category completion counts (weekly)
    expect(getByText('8/10')).toBeTruthy() // business
    expect(getByText('6/8')).toBeTruthy() // life
    expect(getByText('1/2')).toBeTruthy() // study
  })

  test('updates category breakdown when switching periods', async () => {
    const { getByTestId, getByText } = await render(<Statistics {...defaultProps} />)

    // Switch to monthly
    const monthlyToggle = getByTestId('stats-month-toggle')
    await fireEvent.press(monthlyToggle)

    // Should show monthly category counts
    expect(getByText('30/45')).toBeTruthy() // business monthly
    expect(getByText('25/35')).toBeTruthy() // life monthly
    expect(getByText('6/10')).toBeTruthy() // study monthly
  })

  test('displays daily average correctly', async () => {
    const { getByText } = await render(<Statistics {...defaultProps} />)

    // Should show weekly daily average
    expect(getByText('2.8')).toBeTruthy()
  })

  test('displays journal days correctly', async () => {
    const { getByText } = await render(<Statistics {...defaultProps} />)

    // Should show weekly journal days
    expect(getByText('4日')).toBeTruthy()
  })

  test('handles zero stats gracefully', async () => {
    const zeroStats: StatsData = {
      streakDays: 0,
      completionRate: 0,
      activeDays: 0,
      totalTasks: 0,
      dailyAverage: 0,
      journalDays: 0,
      categoryBreakdown: {},
    }

    const { getByText } = await render(
      <Statistics
        {...defaultProps}
        weeklyStats={zeroStats}
        monthlyStats={zeroStats}
      />
    )

    expect(getByText('0日連続')).toBeTruthy()
    expect(getByText('0%')).toBeTruthy()
    expect(getByText('0日')).toBeTruthy()
  })

  test('handles empty category breakdown', async () => {
    const statsWithEmptyCategories: StatsData = {
      ...mockWeeklyStats,
      categoryBreakdown: {},
    }

    const { queryByText } = await render(
      <Statistics {...defaultProps} weeklyStats={statsWithEmptyCategories} />
    )

    // Should not crash and should not show category counts
    expect(queryByText('8/10')).toBeNull()
  })

  test('calculates completion percentages correctly', async () => {
    const { getByText } = await render(<Statistics {...defaultProps} />)

    // 75% completion rate should be displayed
    expect(getByText('75%')).toBeTruthy()
  })

  test('shows proper visual indicators for different achievement levels', async () => {
    const { getByTestId } = await render(<Statistics {...defaultProps} />)

    // Different categories should have different visual treatments
    const businessCategory = getByTestId('category-business')
    const lifeCategory = getByTestId('category-life')

    expect(businessCategory).toBeTruthy()
    expect(lifeCategory).toBeTruthy()
  })

  test('displays total tasks count', async () => {
    const { getByText } = await render(<Statistics {...defaultProps} />)

    // Should show total tasks for the period
    expect(getByText('20')).toBeTruthy() // weekly total
  })

  test('handles categories with no tasks', async () => {
    const categoriesWithEmpty = [
      ...mockCategories,
      { id: 'empty', name: '空のカテゴリー' },
    ]

    const { getByText } = await render(
      <Statistics {...defaultProps} categories={categoriesWithEmpty} />
    )

    // Should show the category even if it has no tasks
    expect(getByText('空のカテゴリー')).toBeTruthy()
  })
})
