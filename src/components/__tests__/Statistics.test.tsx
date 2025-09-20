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

  it('renders correctly', () => {
    const { getByTestId, getByText } = render(<Statistics {...defaultProps} />)

    expect(getByTestId('statistics-screen')).toBeTruthy()
    expect(getByText('今週')).toBeTruthy()
    expect(getByText('今月')).toBeTruthy()
  })

  it('displays weekly stats by default', () => {
    const { getByText } = render(<Statistics {...defaultProps} />)

    // Should show weekly streak
    expect(getByText('5日連続')).toBeTruthy()

    // Should show weekly completion rate
    expect(getByText('75%')).toBeTruthy()

    // Should show weekly active days
    expect(getByText('6日')).toBeTruthy()
  })

  it('switches to monthly stats when monthly toggle is pressed', () => {
    const { getByTestId, getByText } = render(<Statistics {...defaultProps} />)

    const monthlyToggle = getByTestId('stats-month-toggle')
    fireEvent.press(monthlyToggle)

    // Should show monthly streak
    expect(getByText('12日連続')).toBeTruthy()

    // Should show monthly completion rate
    expect(getByText('68%')).toBeTruthy()

    // Should show monthly active days
    expect(getByText('25日')).toBeTruthy()
  })

  it('switches back to weekly stats when weekly toggle is pressed', () => {
    const { getByTestId, getByText } = render(<Statistics {...defaultProps} />)

    // Switch to monthly first
    const monthlyToggle = getByTestId('stats-month-toggle')
    fireEvent.press(monthlyToggle)

    // Then switch back to weekly
    const weeklyToggle = getByTestId('stats-week-toggle')
    fireEvent.press(weeklyToggle)

    // Should show weekly stats again
    expect(getByText('5日連続')).toBeTruthy()
    expect(getByText('75%')).toBeTruthy()
  })

  it('displays category breakdown correctly', () => {
    const { getByText } = render(<Statistics {...defaultProps} />)

    // Should show category names
    expect(getByText('事業')).toBeTruthy()
    expect(getByText('生活')).toBeTruthy()
    expect(getByText('勉強')).toBeTruthy()

    // Should show category completion counts (weekly)
    expect(getByText('8/10')).toBeTruthy() // business
    expect(getByText('6/8')).toBeTruthy() // life
    expect(getByText('1/2')).toBeTruthy() // study
  })

  it('updates category breakdown when switching periods', () => {
    const { getByTestId, getByText } = render(<Statistics {...defaultProps} />)

    // Switch to monthly
    const monthlyToggle = getByTestId('stats-month-toggle')
    fireEvent.press(monthlyToggle)

    // Should show monthly category counts
    expect(getByText('30/45')).toBeTruthy() // business monthly
    expect(getByText('25/35')).toBeTruthy() // life monthly
    expect(getByText('6/10')).toBeTruthy() // study monthly
  })

  it('displays daily average correctly', () => {
    const { getByText } = render(<Statistics {...defaultProps} />)

    // Should show weekly daily average
    expect(getByText('2.8')).toBeTruthy()
  })

  it('displays journal days correctly', () => {
    const { getByText } = render(<Statistics {...defaultProps} />)

    // Should show weekly journal days
    expect(getByText('4日')).toBeTruthy()
  })

  it('handles zero stats gracefully', () => {
    const zeroStats: StatsData = {
      streakDays: 0,
      completionRate: 0,
      activeDays: 0,
      totalTasks: 0,
      dailyAverage: 0,
      journalDays: 0,
      categoryBreakdown: {},
    }

    const { getByText } = render(
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

  it('handles empty category breakdown', () => {
    const statsWithEmptyCategories: StatsData = {
      ...mockWeeklyStats,
      categoryBreakdown: {},
    }

    const { queryByText } = render(
      <Statistics {...defaultProps} weeklyStats={statsWithEmptyCategories} />
    )

    // Should not crash and should not show category counts
    expect(queryByText('8/10')).toBeNull()
  })

  it('calculates completion percentages correctly', () => {
    const { getByText } = render(<Statistics {...defaultProps} />)

    // 75% completion rate should be displayed
    expect(getByText('75%')).toBeTruthy()
  })

  it('shows proper visual indicators for different achievement levels', () => {
    const { getByTestId } = render(<Statistics {...defaultProps} />)

    // Different categories should have different visual treatments
    const businessCategory = getByTestId('category-business')
    const lifeCategory = getByTestId('category-life')

    expect(businessCategory).toBeTruthy()
    expect(lifeCategory).toBeTruthy()
  })

  it('displays total tasks count', () => {
    const { getByText } = render(<Statistics {...defaultProps} />)

    // Should show total tasks for the period
    expect(getByText('20')).toBeTruthy() // weekly total
  })

  it('handles categories with no tasks', () => {
    const categoriesWithEmpty = [
      ...mockCategories,
      { id: 'empty', name: '空のカテゴリー' },
    ]

    const { getByText } = render(
      <Statistics {...defaultProps} categories={categoriesWithEmpty} />
    )

    // Should show the category even if it has no tasks
    expect(getByText('空のカテゴリー')).toBeTruthy()
  })
})
