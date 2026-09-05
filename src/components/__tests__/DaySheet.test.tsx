import React from 'react'
import { act, render, fireEvent, waitFor } from '@testing-library/react-native'
import { DaySheet } from '../DaySheet'
import {
  Category,
  Completion,
  Entry,
  Task,
  TaskCompletionOperationResult,
} from '../../types'

jest.mock('../JournalInput', () => ({
  JournalInput: () => null,
}))

describe('DaySheet', () => {
  const mockCategories: Category[] = [
    { id: 'business', name: '事業' },
  ]

  const mockTasks: Task[] = [
    {
      id: 'task1',
      title: 'ネットワーキング',
      categoryId: 'business',
      defaultMinutes: 30,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]

  const secondTask: Task = {
    id: 'task2',
    title: '提案メモを書く',
    categoryId: 'business',
    defaultMinutes: 15,
    archived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const mockEntry: Entry = {
    id: 'entry1',
    date: '2025-01-15',
    note: 'Good day',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const completedCompletions: Completion[] = [
    {
      id: 'comp1',
      date: '2025-01-15',
      taskId: 'task1',
      completed: true,
      createdAt: Date.now(),
    },
  ]

  const completionSuccess: TaskCompletionOperationResult = {
    success: true,
    date: '2025-01-15',
    taskId: 'task1',
    change: 'completed',
  }

  const mockOnTaskToggle = jest.fn<Promise<TaskCompletionOperationResult>, [string]>()
  const mockOnJournalUpdate = jest.fn()
  const mockOnTaskSelectionPress = jest.fn()

  const defaultProps = {
    date: '2025-01-15',
    tasks: mockTasks,
    completions: [] as Completion[],
    journalEntry: mockEntry,
    categories: mockCategories,
    onTaskToggle: mockOnTaskToggle,
    onJournalUpdate: mockOnJournalUpdate,
    onTaskSelectionPress: mockOnTaskSelectionPress,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnTaskToggle.mockResolvedValue(completionSuccess)
  })

  it('shows a primary habit selection action when the day has no assigned tasks', async () => {
    // Arrange & Act
    const { getByText, getByTestId } = await render(
      <DaySheet {...defaultProps} tasks={[]} />
    )

    // Assert
    expect(getByText('daySheet.noTasksTitle')).toBeTruthy()
    expect(getByText('daySheet.noTasksMessage')).toBeTruthy()
    await fireEvent.press(getByTestId('empty-task-selection-button'))
    expect(mockOnTaskSelectionPress).toHaveBeenCalledTimes(1)
  })

  it('exposes checked accessibility state for completed task rows', async () => {
    // Arrange & Act
    const { getByTestId } = await render(
      <DaySheet {...defaultProps} completions={completedCompletions} />
    )

    // Assert
    expect(getByTestId('task-item-task1').props.accessibilityState).toMatchObject({
      checked: true,
    })
  })

  it('disables both task-selection controls until the day is ready, then makes them usable', async () => {
    // Arrange
    const { getByTestId, rerender } = await render(
      <DaySheet {...defaultProps} tasks={[]} isTaskSelectionDisabled />
    )

    // Act
    await fireEvent.press(getByTestId('task-selection-button'))
    await fireEvent.press(getByTestId('empty-task-selection-button'))

    // Assert
    expect(getByTestId('task-selection-button')).toBeDisabled()
    expect(getByTestId('empty-task-selection-button')).toBeDisabled()
    expect(getByTestId('task-selection-button').props.className).toContain('opacity-50')
    expect(getByTestId('empty-task-selection-button').props.className).toContain('opacity-50')
    expect(mockOnTaskSelectionPress).not.toHaveBeenCalled()

    // Act
    await rerender(
      <DaySheet {...defaultProps} tasks={[]} isTaskSelectionDisabled={false} />
    )
    await fireEvent.press(getByTestId('task-selection-button'))
    await fireEvent.press(getByTestId('empty-task-selection-button'))

    // Assert
    expect(getByTestId('task-selection-button')).toBeEnabled()
    expect(getByTestId('empty-task-selection-button')).toBeEnabled()
    expect(mockOnTaskSelectionPress).toHaveBeenCalledTimes(2)
  })

  it('shows completion immediately while persistence is queued and rolls back when it fails', async () => {
    // Arrange
    let finishToggle: (result: TaskCompletionOperationResult) => void = () => undefined
    mockOnTaskToggle.mockImplementationOnce(
      () => new Promise<TaskCompletionOperationResult>((resolve) => {
        finishToggle = resolve
      })
    )
    const { getByTestId, getByText } = await render(<DaySheet {...defaultProps} />)

    // Act
    await fireEvent.press(getByTestId('task-item-task1'))
    await fireEvent.press(getByTestId('task-item-task1'))

    // Assert
    expect(getByTestId('task-item-task1').props.accessibilityState).toMatchObject({
      checked: true,
      busy: true,
      disabled: true,
    })
    expect(getByText('ネットワーキング').props.className).toContain('line-through')
    expect(mockOnTaskToggle).toHaveBeenCalledTimes(1)

    // Act
    await act(async () => {
      finishToggle({
        success: false,
        date: '2025-01-15',
        taskId: 'task1',
        change: 'completed',
        message: 'Save failed',
      })
    })

    // Assert
    expect(getByTestId('task-item-task1').props.accessibilityState).toMatchObject({
      checked: false,
      busy: false,
      disabled: false,
    })
    expect(getByText('ネットワーキング').props.className).not.toContain('line-through')
    expect(getByText('daySheet.taskCompletionFailed')).toBeVisible()
  })

  it('shows completion acknowledgement after a task is completed', async () => {
    // Arrange
    const { getByTestId, getByText } = await render(
      <DaySheet {...defaultProps} tasks={[...mockTasks, secondTask]} />
    )

    // Act
    await fireEvent.press(getByTestId('task-item-task1'))

    // Assert
    await waitFor(() => {
      expect(getByText('daySheet.taskCompleted')).toBeTruthy()
    })
  })

  it('keeps pending completion checked through a stale refresh and after successful persistence', async () => {
    // Arrange
    let finishToggle: (result: TaskCompletionOperationResult) => void = () => undefined
    mockOnTaskToggle.mockImplementationOnce(
      () => new Promise<TaskCompletionOperationResult>((resolve) => {
        finishToggle = resolve
      })
    )
    const { getByTestId, getByText, rerender } = await render(
      <DaySheet {...defaultProps} />
    )
    await fireEvent.press(getByTestId('task-item-task1'))

    // Act
    await rerender(
      <DaySheet
        {...defaultProps}
        completions={[{
          id: 'refreshed-assignment',
          date: '2025-01-15',
          taskId: 'task1',
          completed: false,
          createdAt: 1700000000000,
        }]}
      />
    )

    // Assert
    expect(getByTestId('task-item-task1').props.accessibilityState).toMatchObject({
      checked: true,
      busy: true,
    })
    expect(getByText('ネットワーキング').props.className).toContain('line-through')

    // Act
    await rerender(
      <DaySheet {...defaultProps} completions={completedCompletions} />
    )
    await act(async () => finishToggle(completionSuccess))

    // Assert
    expect(getByTestId('task-item-task1').props.accessibilityState).toMatchObject({
      checked: true,
      busy: false,
      disabled: false,
    })
    expect(getByText('ネットワーキング').props.className).toContain('line-through')
    expect(mockOnTaskToggle).toHaveBeenCalledTimes(1)
  })

  it('shows closure feedback when the final assigned task is completed', async () => {
    // Arrange
    mockOnTaskToggle.mockResolvedValue({
      success: true,
      date: '2025-01-15',
      taskId: 'task2',
      change: 'completed',
    })
    const { getByTestId, getByText } = await render(
      <DaySheet
        {...defaultProps}
        tasks={[...mockTasks, secondTask]}
        completions={completedCompletions}
      />
    )

    // Act
    await fireEvent.press(getByTestId('task-item-task2'))

    // Assert
    await waitFor(() => {
      expect(getByText('daySheet.allTasksCompleted')).toBeTruthy()
    })
  })

  it('shows undo acknowledgement after a completed task is marked incomplete', async () => {
    // Arrange
    mockOnTaskToggle.mockResolvedValue({
      success: true,
      date: '2025-01-15',
      taskId: 'task1',
      change: 'undone',
    })
    const { getByTestId, getByText } = await render(
      <DaySheet {...defaultProps} completions={completedCompletions} />
    )

    // Act
    await fireEvent.press(getByTestId('task-item-task1'))

    // Assert
    await waitFor(() => {
      expect(getByText('daySheet.taskCompletionUndone')).toBeTruthy()
    })
  })

  it('shows retry feedback when completion persistence fails', async () => {
    // Arrange
    mockOnTaskToggle.mockResolvedValue({
      success: false,
      date: '2025-01-15',
      taskId: 'task1',
      change: 'completed',
      message: 'Save failed',
    })
    const { getByTestId, getByText } = await render(<DaySheet {...defaultProps} />)

    // Act
    await fireEvent.press(getByTestId('task-item-task1'))

    // Assert
    await waitFor(() => {
      expect(getByText('daySheet.taskCompletionFailed')).toBeTruthy()
    })
    expect(getByTestId('task-feedback-retry')).toBeTruthy()
  })
})
