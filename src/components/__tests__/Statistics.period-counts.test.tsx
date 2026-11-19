import React from 'react'
import { fireEvent, render, within } from '@testing-library/react-native'
import { changeLanguage } from '@/src/i18n/config'
import { Completion, Entry, Task } from '@/src/types'
import {
  getMonthEndDate,
  getMonthStartDate,
  getWeekEndDate,
  getWeekStartDate,
} from '@/src/utils/dateUtils'
import {
  calculateMonthlyStats,
  calculateWeeklyStats,
} from '@/src/utils/statisticsEngine'
import { Statistics } from '../Statistics'

jest.unmock('react-i18next')

const selectedDate = new Date(2024, 1, 28)

describe('Statistics period counts', () => {
  test('counts completed task-day records and distinct active days within the selected period', async () => {
    // Arrange
    await changeLanguage('ja')
    const completions: Record<string, Completion[]> = {
      '2024-02-26': [
        { id: '1', date: '2024-02-26', taskId: 'run', completed: true, createdAt: 0 },
        { id: '2', date: '2024-02-26', taskId: 'read', completed: true, createdAt: 0 },
      ],
      '2024-02-27': [
        { id: '3', date: '2024-02-27', taskId: 'run', completed: false, createdAt: 0 },
      ],
      '2024-03-01': [
        { id: '4', date: '2024-03-01', taskId: 'run', completed: true, createdAt: 0 },
      ],
    }
    const entries: Record<string, Entry> = {
      '2024-02-28': {
        id: 'journal', date: '2024-02-28', note: 'Read a chapter.', createdAt: 0, updatedAt: 0,
      },
      '2024-02-29': {
        id: 'condition-only', date: '2024-02-29', note: '  ', conditionLevel: 3, createdAt: 0, updatedAt: 0,
      },
    }
    const weeklyStats = calculateWeeklyStats(
      [], completions, entries, [], getWeekStartDate(selectedDate), getWeekEndDate(selectedDate)
    )
    const monthlyStats = calculateMonthlyStats(
      [], completions, entries, [], getMonthStartDate(selectedDate), getMonthEndDate(selectedDate), 2024, 2
    )

    // Act
    const { getByTestId, getByText } = await render(
      <Statistics categories={[]} weeklyStats={weeklyStats} monthlyStats={monthlyStats} />
    )

    // Assert
    expect(getByText('予定した習慣の完了数')).toBeVisible()
    expect(getByText('3/4件')).toBeVisible()
    expect(getByText('習慣を実行した日数')).toBeVisible()
    expect(getByText('2/7日')).toBeVisible()
    expect(getByText('日記を書いた日数')).toBeVisible()
    expect(getByText('1/7日')).toBeVisible()

    // Act
    await fireEvent.press(getByTestId('stats-month-toggle'))

    // Assert
    expect(getByText('2/3件')).toBeVisible()
    expect(within(getByTestId('stats-active-days')).getByText('1/29日')).toBeVisible()
    expect(within(getByTestId('stats-journal-days')).getByText('1/29日')).toBeVisible()
  })

  test('reports 100% for one completed assignment despite unselected presets', async () => {
    // Arrange
    await changeLanguage('en')
    const tasks: Task[] = [
      { id: 'run', title: 'Run', categoryId: 'fitness', archived: false, createdAt: 0, updatedAt: 0 },
      { id: 'stretch', title: 'Stretch', categoryId: 'fitness', archived: false, createdAt: 0, updatedAt: 0 },
    ]
    const completions: Record<string, Completion[]> = {
      '2024-02-28': [
        { id: 'run-once', date: '2024-02-28', taskId: 'run', completed: true, createdAt: 0 },
      ],
    }
    const categories = [{ id: 'fitness', name: 'Fitness' }]
    const weeklyStats = calculateWeeklyStats(
      tasks, completions, {}, categories, getWeekStartDate(selectedDate), getWeekEndDate(selectedDate)
    )

    // Act
    const { getByText } = await render(
      <Statistics categories={categories} weeklyStats={weeklyStats} monthlyStats={weeklyStats} />
    )

    // Assert
    expect(getByText('1 of 1')).toBeVisible()
    expect(getByText('Fitness')).toBeVisible()
    expect(getByText('1/1', { exact: true })).toBeVisible()
    expect(getByText('Rate: 100%')).toBeVisible()
  })

  test('shows journal activity independently when no habits have been assigned', async () => {
    // Arrange
    await changeLanguage('en')
    const entries: Record<string, Entry> = {
      '2024-02-28': {
        id: 'journal', date: '2024-02-28', note: 'Went for a walk.', createdAt: 0, updatedAt: 0,
      },
    }
    const weeklyStats = calculateWeeklyStats(
      [], {}, entries, [], getWeekStartDate(selectedDate), getWeekEndDate(selectedDate)
    )

    // Act
    const { getByText, queryByTestId } = await render(
      <Statistics categories={[]} weeklyStats={weeklyStats} monthlyStats={weeklyStats} />
    )

    // Assert
    expect(getByText('Scheduled Habits Completed')).toBeVisible()
    expect(getByText('0 of 0')).toBeVisible()
    expect(getByText('Days with a Habit Completed')).toBeVisible()
    expect(getByText('0/7 days')).toBeVisible()
    expect(getByText('Days with a Journal Entry')).toBeVisible()
    expect(getByText('1/7 days')).toBeVisible()
    expect(queryByTestId('stats-period-recap')).toBeNull()
  })

  test('shows zero recorded activity over the selected month when there are no records', async () => {
    // Arrange
    await changeLanguage('en')
    const november = new Date(2026, 10, 18)
    const weeklyStats = calculateWeeklyStats(
      [], {}, {}, [], getWeekStartDate(november), getWeekEndDate(november)
    )
    const monthlyStats = calculateMonthlyStats(
      [], {}, {}, [], getMonthStartDate(november), getMonthEndDate(november), 2026, 11
    )
    const { getByTestId, getByText } = await render(
      <Statistics categories={[]} weeklyStats={weeklyStats} monthlyStats={monthlyStats} />
    )

    // Act
    await fireEvent.press(getByTestId('stats-month-toggle'))

    // Assert
    expect(getByText('0 of 0')).toBeVisible()
    expect(within(getByTestId('stats-active-days')).getByText('0/30 days')).toBeVisible()
    expect(within(getByTestId('stats-journal-days')).getByText('0/30 days')).toBeVisible()
  })
})
