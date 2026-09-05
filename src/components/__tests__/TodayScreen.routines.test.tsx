import React, { type ComponentProps } from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import TodayScreen from '@/app/(tabs)/today'
import type { DaySheet } from '@/src/components/DaySheet'
import type { TaskPicker } from '@/src/components/TaskPicker'
import { useCurrentDay } from '@/src/hooks/useCurrentDay'
import { useAppStore } from '@/src/stores/app-store'
import type { Task } from '@/src/types'

jest.mock('@/src/hooks/useCurrentDay', () => ({
  useCurrentDay: jest.fn(),
}))

jest.mock('@/src/components/DaySheet', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react')
  const { Pressable, Text, View } =
    jest.requireMock<typeof import('react-native')>('react-native')

  return {
    /**
     * Exposes the Today date and picker action while isolating unrelated day-sheet controls.
     * @param props - The date and selection callback supplied by Today.
     * @returns A visible date and task-selection button for screen contract tests.
     * @example
     * <DaySheet date="2026-09-05" onTaskSelectionPress={openPicker} />
     */
    DaySheet: ({
      date,
      onTaskSelectionPress,
    }: Pick<ComponentProps<typeof DaySheet>, 'date' | 'onTaskSelectionPress'>) =>
      ReactModule.createElement(
        View,
        {},
        ReactModule.createElement(Text, { testID: 'day-date' }, date),
        ReactModule.createElement(
          Pressable,
          { testID: 'open-task-picker', onPress: onTaskSelectionPress },
          ReactModule.createElement(Text, {}, 'Select tasks'),
        ),
      ),
  }
})

jest.mock('@/src/components/TaskPicker', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react')
  const { Text } =
    jest.requireMock<typeof import('react-native')>('react-native')

  return {
    /**
     * Displays the picker contract so Today tests can observe visibility and refreshed selections.
     * @param props - Modal visibility and selected task IDs supplied by Today.
     * @returns Visible selected IDs while the picker is open, otherwise no modal content.
     * @example
     * <TaskPicker isVisible selectedTasks={['morning-walk']} />
     */
    TaskPicker: ({
      isVisible,
      selectedTasks,
    }: Pick<ComponentProps<typeof TaskPicker>, 'isVisible' | 'selectedTasks'>) =>
      isVisible
        ? ReactModule.createElement(
            Text,
            { testID: 'routine-task-picker' },
            selectedTasks.join(', '),
          )
        : null,
  }
})

jest.mock('@/src/components/PresetTaskEditor', () => ({
  PresetTaskEditor: () => null,
}))

const initialStoreState = useAppStore.getState()
const mockRefreshDailyTasks = jest.fn<Promise<boolean>, []>()
const tasks: Task[] = [
  {
    id: 'manual-task',
    title: 'Read a book',
    categoryId: 'life',
    archived: false,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
  {
    id: 'daily-routine',
    title: 'Morning walk',
    categoryId: 'life',
    dailyAutoAddFrom: '2026-09-05',
    archived: false,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
]

describe('Today routine selection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useCurrentDay).mockReturnValue({
      date: '2026-09-05',
      appState: 'active',
    })
    mockRefreshDailyTasks.mockResolvedValue(true)
    useAppStore.setState({
      ...initialStoreState,
      tasks,
      categories: [{ id: 'life', name: 'Life' }],
      refreshDailyTasks: mockRefreshDailyTasks,
    }, true)
  })

  afterEach(() => {
    useAppStore.setState(initialStoreState, true)
  })

  it('closes yesterday\'s picker draft when Today advances to the next local date', async () => {
    // Arrange
    const { getByTestId, queryByTestId, rerender } = await render(<TodayScreen />)
    await fireEvent.press(getByTestId('open-task-picker'))
    expect(getByTestId('routine-task-picker')).toBeVisible()

    // Act
    jest.mocked(useCurrentDay).mockReturnValue({
      date: '2026-09-06',
      appState: 'active',
    })
    await rerender(<TodayScreen />)

    // Assert
    expect(getByTestId('day-date')).toHaveTextContent('2026-09-06')
    expect(queryByTestId('routine-task-picker')).toBeNull()
  })

  it('waits for a routine refresh before opening the first selection draft with current assignments', async () => {
    // Arrange
    let finishRefresh: (didSucceed: boolean) => void = () => undefined
    mockRefreshDailyTasks.mockImplementationOnce(
      () => new Promise<boolean>((resolve) => {
        finishRefresh = resolve
      }),
    )
    const { getByTestId, queryByTestId } = await render(<TodayScreen />)

    // Act
    const openPickerAction = fireEvent.press(getByTestId('open-task-picker'))
    await waitFor(() => expect(mockRefreshDailyTasks).toHaveBeenCalledTimes(1))
    expect(queryByTestId('routine-task-picker')).toBeNull()
    await act(() => {
      useAppStore.setState({
        completions: {
          '2026-09-05': [
            {
              id: 'manual-assignment',
              date: '2026-09-05',
              taskId: 'manual-task',
              completed: false,
              createdAt: 1700000000000,
            },
            {
              id: 'routine-assignment',
              date: '2026-09-05',
              taskId: 'daily-routine',
              completed: false,
              createdAt: 1700000000000,
            },
          ],
        },
      })
      finishRefresh(true)
    })
    await openPickerAction

    // Assert
    expect(getByTestId('routine-task-picker')).toBeVisible()
    expect(getByTestId('routine-task-picker')).toHaveTextContent(
      'manual-task, daily-routine',
    )
  })

  it('opens a fresh next-day draft with that day\'s refreshed routine selections', async () => {
    // Arrange
    const { getByTestId, queryByTestId, rerender } = await render(<TodayScreen />)
    await fireEvent.press(getByTestId('open-task-picker'))
    jest.mocked(useCurrentDay).mockReturnValue({
      date: '2026-09-06',
      appState: 'active',
    })
    await rerender(<TodayScreen />)
    expect(queryByTestId('routine-task-picker')).toBeNull()
    mockRefreshDailyTasks.mockImplementationOnce(async () => {
      useAppStore.setState({
        completions: {
          '2026-09-06': [{
            id: 'next-day-routine',
            date: '2026-09-06',
            taskId: 'daily-routine',
            completed: false,
            createdAt: 1700000000000,
          }],
        },
      })
      return true
    })

    // Act
    await fireEvent.press(getByTestId('open-task-picker'))

    // Assert
    expect(mockRefreshDailyTasks).toHaveBeenCalledTimes(2)
    expect(getByTestId('routine-task-picker')).toHaveTextContent('daily-routine')
    expect(getByTestId('day-date')).toHaveTextContent('2026-09-06')
  })

  it('shows the routine refresh error and keeps task selection closed when refresh fails', async () => {
    // Arrange
    mockRefreshDailyTasks.mockImplementationOnce(async () => {
      useAppStore.setState({ hasDailyTaskError: true })
      return false
    })
    const { getByTestId, getByText, queryByTestId } = await render(<TodayScreen />)

    // Act
    await fireEvent.press(getByTestId('open-task-picker'))

    // Assert
    expect(getByTestId('daily-tasks-error')).toBeVisible()
    expect(getByText('today.dailyTasksError')).toBeVisible()
    expect(queryByTestId('routine-task-picker')).toBeNull()
  })
})
