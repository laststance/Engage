import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { Category, StatsData } from '@/src/types'
import { Statistics } from '../Statistics'

const categories: Category[] = [
  { id: 'business', name: 'Business' },
  { id: 'life', name: 'Life' },
]

const emptyStats: StatsData = {
  activeDays: 0,
  categoryBreakdown: {},
  completionRate: 0,
  dailyAverage: 0,
  journalDays: 0,
  streakDays: 0,
  totalTasks: 0,
}

const activeStats: StatsData = {
  activeDays: 2,
  categoryBreakdown: {
    business: { completed: 3, total: 4 },
  },
  completionRate: 0.5,
  dailyAverage: 1.5,
  journalDays: 1,
  streakDays: 2,
  totalTasks: 3,
}

describe('Statistics completion causality', () => {
  test('explains the next action when the selected period has no completions', async () => {
    // Arrange
    const { getByTestId, getByText } = await render(
      <Statistics
        categories={categories}
        monthlyStats={emptyStats}
        weeklyStats={emptyStats}
      />
    )

    // Assert
    expect(getByTestId('stats-period-recap')).toBeTruthy()
    expect(getByText('stats.periodEmptyNextAction')).toBeTruthy()
  })

  test('recaps the completed tasks that feed Calendar and Stats', async () => {
    // Arrange
    const { getByTestId, getByText } = await render(
      <Statistics
        categories={categories}
        monthlyStats={activeStats}
        weeklyStats={activeStats}
      />
    )

    // Assert
    expect(getByTestId('stats-period-recap')).toBeTruthy()
    expect(getByText('stats.periodRecap')).toBeTruthy()
  })

  test('exposes selected state as the segmented period changes', async () => {
    // Arrange
    const { getByTestId } = await render(
      <Statistics
        categories={categories}
        monthlyStats={activeStats}
        weeklyStats={activeStats}
      />
    )

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
})
