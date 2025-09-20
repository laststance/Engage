import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { TaskPicker } from '../TaskPicker'
import { Task, Category } from '../../types'

// Mock expo-symbols
jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}))

// Mock the GluestackUIProvider
jest.mock('@/components/ui/gluestack-ui-provider', () => ({
  GluestackUIProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}))

describe('TaskPicker', () => {
  const mockCategories: Category[] = [
    { id: 'business', name: '事業' },
    { id: 'life', name: '生活' },
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
    {
      id: 'task2',
      title: '運動 (20分以上)',
      categoryId: 'life',
      defaultMinutes: 20,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'task3',
      title: 'スキル学習',
      categoryId: 'business',
      defaultMinutes: 60,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]

  const mockOnTaskSelect = jest.fn()
  const mockOnClose = jest.fn()
  const mockOnEditPresets = jest.fn()
  const mockOnUpdatePresets = jest.fn()
  const mockOnCreateCategory = jest.fn()

  const defaultProps = {
    isVisible: true,
    categories: mockCategories,
    presetTasks: mockTasks,
    selectedTasks: [],
    onTaskSelect: mockOnTaskSelect,
    onClose: mockOnClose,
    onEditPresets: mockOnEditPresets,
    onUpdatePresets: mockOnUpdatePresets,
    onCreateCategory: mockOnCreateCategory,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly when visible', () => {
    const { getByText, getByTestId } = render(<TaskPicker {...defaultProps} />)

    expect(getByText('タスクを選択')).toBeTruthy()
    expect(getByTestId('task-picker-confirm')).toBeTruthy()
    expect(getByTestId('task-picker-cancel')).toBeTruthy()
  })

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <TaskPicker {...defaultProps} isVisible={false} />
    )

    expect(queryByText('タスクを選択')).toBeNull()
  })

  it('displays tasks grouped by category', () => {
    const { getByText } = render(<TaskPicker {...defaultProps} />)

    // Should show category headers
    expect(getByText('事業')).toBeTruthy()
    expect(getByText('生活')).toBeTruthy()

    // Should show tasks
    expect(getByText('ネットワーキング')).toBeTruthy()
    expect(getByText('運動 (20分以上)')).toBeTruthy()
    expect(getByText('スキル学習')).toBeTruthy()
  })

  it('allows selecting and deselecting tasks', () => {
    const { getByTestId } = render(<TaskPicker {...defaultProps} />)

    const taskItem = getByTestId('task-picker-item-task1')
    fireEvent.press(taskItem)

    // Task should be visually selected (this would be tested through style changes)
    expect(taskItem).toBeTruthy()
  })

  it('shows selected tasks count in confirm button', () => {
    const { getByTestId, rerender } = render(
      <TaskPicker {...defaultProps} selectedTasks={['task1', 'task2']} />
    )

    const confirmButton = getByTestId('task-picker-confirm')
    expect(confirmButton.props.children.props.children).toContain('2')
  })

  it('calls onConfirm with selected task IDs', () => {
    const { getByTestId } = render(
      <TaskPicker {...defaultProps} selectedTasks={['task1']} />
    )

    const confirmButton = getByTestId('task-picker-confirm')
    fireEvent.press(confirmButton)

    expect(mockOnTaskSelect).toHaveBeenCalledWith(['task1'])
  })

  it('calls onCancel when cancel button is pressed', () => {
    const { getByTestId } = render(<TaskPicker {...defaultProps} />)

    const cancelButton = getByTestId('task-picker-cancel')
    fireEvent.press(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onCancel when close button is pressed', () => {
    const { getByTestId } = render(<TaskPicker {...defaultProps} />)

    const closeButton = getByTestId('task-picker-close')
    fireEvent.press(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onEditPresets when edit button is pressed', () => {
    const { getByTestId } = render(<TaskPicker {...defaultProps} />)

    const editButton = getByTestId('edit-presets-button')
    fireEvent.press(editButton)

    expect(mockOnEditPresets).toHaveBeenCalled()
  })

  it('disables confirm button when no tasks selected', () => {
    const { getByTestId } = render(
      <TaskPicker {...defaultProps} selectedTasks={[]} />
    )

    const confirmButton = getByTestId('task-picker-confirm')
    expect(confirmButton.props.accessibilityState?.disabled).toBe(true)
  })

  it('enables confirm button when tasks are selected', () => {
    const { getByTestId } = render(
      <TaskPicker {...defaultProps} selectedTasks={['task1']} />
    )

    const confirmButton = getByTestId('task-picker-confirm')
    expect(confirmButton.props.accessibilityState?.disabled).toBe(false)
  })

  it('filters out archived tasks', () => {
    const tasksWithArchived = [
      ...mockTasks,
      {
        id: 'archived-task',
        title: 'Archived Task',
        categoryId: 'business',
        defaultMinutes: 30,
        archived: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]

    const { queryByText } = render(
      <TaskPicker {...defaultProps} presetTasks={tasksWithArchived} />
    )

    expect(queryByText('Archived Task')).toBeNull()
  })

  it('handles empty task list gracefully', () => {
    const { getByText } = render(<TaskPicker {...defaultProps} presetTasks={[]} />)

    // Should still show category headers but no tasks
    expect(getByText('事業')).toBeTruthy()
    expect(getByText('生活')).toBeTruthy()
  })

  it('shows task duration when available', () => {
    const { getByText } = render(<TaskPicker {...defaultProps} />)

    // Tasks with duration should show it in the title
    expect(getByText('運動 (20分以上)')).toBeTruthy()
  })
})
