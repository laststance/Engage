import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Category, Task, TaskAssignmentOperationResult } from '@/src/types'
import { TaskPicker } from '../TaskPicker'

jest.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      const translations: Record<string, string> = {
        'taskPicker.discardChanges': 'Discard changes',
        'taskPicker.discardChangesAndClose': 'Discard changes and close',
        'taskPicker.notSelectedStatus': 'Not selected',
        'taskPicker.selectedStatus': 'Selected',
        'taskPicker.toggleSelectionHint':
          'Double tap to toggle whether this task is assigned for today.',
        'taskPicker.unsavedChanges': 'Unsaved changes',
      }

      if (key === 'taskPicker.selectedCount') {
        return `${options?.count ?? 0} selected`
      }

      return translations[key] || key
    },
    i18n: { changeLanguage: jest.fn() },
  }),
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
      title: '運動',
      categoryId: 'life',
      defaultMinutes: 20,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]

  const successResult: TaskAssignmentOperationResult = {
    success: true,
    date: '2025-01-15',
    addedCount: 1,
    removedCount: 0,
  }

  const mockOnTaskSelect = jest.fn<Promise<TaskAssignmentOperationResult>, [string[]]>()
  const mockOnClose = jest.fn()
  const mockOnEditPresets = jest.fn()

  const defaultProps = {
    isVisible: true,
    categories: mockCategories,
    presetTasks: mockTasks,
    selectedTasks: [],
    onTaskSelect: mockOnTaskSelect,
    onClose: mockOnClose,
    onEditPresets: mockOnEditPresets,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnTaskSelect.mockResolvedValue(successResult)
  })

  it('shows selectable preset tasks grouped by category', () => {
    // Arrange & Act
    const { getByTestId, getByText } = render(<TaskPicker {...defaultProps} />)

    // Assert
    expect(getByText('事業')).toBeTruthy()
    expect(getByText('生活')).toBeTruthy()
    expect(getByText('ネットワーキング')).toBeTruthy()
    expect(getByText('運動')).toBeTruthy()
    expect(getByTestId('task-picker-selected-count')).toBeTruthy()
  })

  it('submits the locally selected task ids after the user confirms', async () => {
    // Arrange
    const { getByTestId } = render(<TaskPicker {...defaultProps} />)

    // Act
    fireEvent.press(getByTestId('task-picker-item-task1'))
    fireEvent.press(getByTestId('task-picker-confirm'))

    // Assert
    await waitFor(() => {
      expect(mockOnTaskSelect).toHaveBeenCalledWith(['task1'])
    })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('exposes selected accessibility state on selected task items', () => {
    // Arrange & Act
    const { getByTestId, getByText } = render(
      <TaskPicker {...defaultProps} selectedTasks={['task1']} />
    )

    // Assert
    expect(
      getByTestId('task-picker-item-task1').props.accessibilityState
    ).toMatchObject({
      selected: true,
    })
    expect(
      getByTestId('task-picker-item-task2').props.accessibilityState
    ).toMatchObject({
      selected: false,
    })
    expect(getByText('Selected')).toBeTruthy()
    expect(
      getByTestId('task-picker-item-task1').props.accessibilityValue
    ).toMatchObject({
      text: 'Selected',
    })
    expect(
      getByTestId('task-picker-item-task1').props.accessibilityHint
    ).toBe('Double tap to toggle whether this task is assigned for today.')
    expect(
      getByTestId('task-picker-item-task1').props.accessibilityLabel
    ).toBe('ネットワーキング, Selected')
    expect(
      getByTestId('task-picker-item-task2').props.accessibilityLabel
    ).toBe('運動, Not selected')
  })

  it('shows unsaved-change affordances after the local selection changes', () => {
    // Arrange
    const { getByTestId, getByText } = render(<TaskPicker {...defaultProps} />)

    // Act
    fireEvent.press(getByTestId('task-picker-item-task1'))

    // Assert
    expect(getByText('Unsaved changes')).toBeTruthy()
    expect(getByText('Discard changes')).toBeTruthy()
    expect(getByTestId('task-picker-close').props.accessibilityLabel).toBe(
      'Discard changes and close'
    )
  })

  it('resyncs local selected state when the picker reopens with different tasks', async () => {
    // Arrange
    const { getByTestId, rerender } = render(
      <TaskPicker {...defaultProps} selectedTasks={['task1']} />
    )

    // Act
    rerender(
      <TaskPicker
        {...defaultProps}
        selectedTasks={['task2']}
        onTaskSelect={mockOnTaskSelect}
      />
    )
    fireEvent.press(getByTestId('task-picker-confirm'))

    // Assert
    await waitFor(() => {
      expect(mockOnTaskSelect).toHaveBeenCalledWith(['task2'])
    })
  })

  it('keeps the picker open and shows an error when assignment persistence fails', async () => {
    // Arrange
    mockOnTaskSelect.mockResolvedValue({
      success: false,
      date: '2025-01-15',
      addedCount: 0,
      removedCount: 0,
      message: 'Save failed',
    })
    const { getByTestId, getByText } = render(<TaskPicker {...defaultProps} />)

    // Act
    fireEvent.press(getByTestId('task-picker-confirm'))

    // Assert
    await waitFor(() => {
      expect(getByText('Save failed')).toBeTruthy()
    })
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('shows the first-preset action when there are no preset tasks', () => {
    // Arrange & Act
    const { getByText } = render(
      <TaskPicker {...defaultProps} presetTasks={[]} />
    )

    // Assert
    expect(getByText('taskPicker.noPresetTasks')).toBeTruthy()
    expect(getByText('presetEditor.addTask')).toBeTruthy()
  })

  it('prevents duplicate assignment saves while confirm is already pending', () => {
    // Arrange
    let resolveSave: (result: TaskAssignmentOperationResult) => void = () => {}
    mockOnTaskSelect.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve
      })
    )
    const { getByTestId } = render(<TaskPicker {...defaultProps} />)

    // Act
    fireEvent.press(getByTestId('task-picker-confirm'))
    fireEvent.press(getByTestId('task-picker-confirm'))
    resolveSave(successResult)

    // Assert
    expect(mockOnTaskSelect).toHaveBeenCalledTimes(1)
  })
})
