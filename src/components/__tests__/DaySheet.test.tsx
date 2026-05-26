import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
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

  it('shows a primary habit selection action when the day has no assigned tasks', () => {
    // Arrange & Act
    const { getByText, getByTestId } = render(
      <DaySheet {...defaultProps} tasks={[]} />
    )

    // Assert
    expect(getByText('daySheet.noTasksMessage')).toBeTruthy()
    fireEvent.press(getByTestId('empty-task-selection-button'))
    expect(mockOnTaskSelectionPress).toHaveBeenCalledTimes(1)
  })

  it('exposes checked accessibility state for completed task rows', () => {
    // Arrange & Act
    const { getByTestId } = render(
      <DaySheet {...defaultProps} completions={completedCompletions} />
    )

    // Assert
    expect(getByTestId('task-item-task1').props.accessibilityState).toMatchObject({
      checked: true,
    })
  })

  it('shows completion acknowledgement after a task is completed', async () => {
    // Arrange
    const { getByTestId, getByText } = render(<DaySheet {...defaultProps} />)

    // Act
    fireEvent.press(getByTestId('task-item-task1'))

    // Assert
    await waitFor(() => {
      expect(getByText('daySheet.taskCompleted')).toBeTruthy()
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
    const { getByTestId, getByText } = render(
      <DaySheet {...defaultProps} completions={completedCompletions} />
    )

    // Act
    fireEvent.press(getByTestId('task-item-task1'))

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
    const { getByTestId, getByText } = render(<DaySheet {...defaultProps} />)

    // Act
    fireEvent.press(getByTestId('task-item-task1'))

    // Assert
    await waitFor(() => {
      expect(getByText('daySheet.taskCompletionFailed')).toBeTruthy()
    })
    expect(getByTestId('task-feedback-retry')).toBeTruthy()
  })
})
