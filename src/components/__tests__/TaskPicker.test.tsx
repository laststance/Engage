import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable'
import { Category, Task, TaskAssignmentOperationResult } from '@/src/types'
import { TaskPicker } from '../TaskPicker'

interface SwipeableMockProps {
  children?: React.ReactNode
  enabled?: boolean
  renderRightActions?: (
    progress: { value: number },
    translation: { value: number },
    swipeableMethods: SwipeableMethods
  ) => React.ReactNode
  testID?: string
}

jest.mock('react-native-gesture-handler', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react')

  return {
    GestureHandlerRootView: ({ children }: { children?: React.ReactNode }) =>
      ReactModule.createElement('GestureHandlerRootView', {}, children),
  }
})

jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react')
  const swipeableMethods: SwipeableMethods = {
    close: jest.fn(),
    openLeft: jest.fn(),
    openRight: jest.fn(),
    reset: jest.fn(),
  }

  return {
    __esModule: true,
    default: ({
      children,
      enabled = true,
      renderRightActions,
      testID,
    }: SwipeableMockProps) =>
      ReactModule.createElement(
        'ReanimatedSwipeable',
        { testID, enabled },
        children,
        enabled
          ? renderRightActions?.({ value: 0 }, { value: 0 }, swipeableMethods)
          : null
      ),
  }
})

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
          'Double tap to toggle this task for today. Swipe left to delete the preset.',
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
  const mockOnTaskDeleteAction = jest.fn<Promise<void>, [string]>()
  const mockOnClose = jest.fn()
  const mockOnEditPresets = jest.fn()

  const defaultProps = {
    isVisible: true,
    categories: mockCategories,
    presetTasks: mockTasks,
    selectedTasks: [],
    onTaskSelect: mockOnTaskSelect,
    onTaskDeleteAction: mockOnTaskDeleteAction,
    onClose: mockOnClose,
    onEditPresets: mockOnEditPresets,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnTaskSelect.mockResolvedValue(successResult)
    mockOnTaskDeleteAction.mockResolvedValue()
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
    ).toBe(
      'Double tap to toggle this task for today. Swipe left to delete the preset.'
    )
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
        isVisible={false}
        selectedTasks={['task1']}
      />
    )
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

  it('preserves unsaved selections when an assigned preset is deleted', async () => {
    // Arrange
    const alertMock = jest.mocked(Alert.alert)
    const { getByTestId, rerender } = render(
      <TaskPicker {...defaultProps} selectedTasks={['task1']} />
    )
    fireEvent.press(getByTestId('task-picker-item-task2'))

    // Act
    fireEvent.press(getByTestId('task-picker-delete-task1'))
    alertMock.mock.calls[0]?.[2]?.[1]?.onPress?.()
    await waitFor(() => {
      expect(mockOnTaskDeleteAction).toHaveBeenCalledWith('task1')
    })
    rerender(
      <TaskPicker
        {...defaultProps}
        presetTasks={[mockTasks[1]]}
        selectedTasks={[]}
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

  it('deletes the swiped preset only after the destructive action is confirmed', async () => {
    // Arrange
    const alertMock = jest.mocked(Alert.alert)
    const { getByTestId } = render(<TaskPicker {...defaultProps} />)

    // Act
    fireEvent.press(getByTestId('task-picker-delete-task1'))
    expect(mockOnTaskDeleteAction).not.toHaveBeenCalled()
    expect(alertMock).toHaveBeenCalledTimes(1)
    alertMock.mock.calls[0]?.[2]?.[1]?.onPress?.()

    // Assert
    await waitFor(() => {
      expect(mockOnTaskDeleteAction).toHaveBeenCalledWith('task1')
    })
    expect(mockOnTaskDeleteAction).toHaveBeenCalledTimes(1)
  })

  it('blocks swipe deletion while task selection is saving', async () => {
    // Arrange
    let resolveSave: (result: TaskAssignmentOperationResult) => void = () => {}
    mockOnTaskSelect.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve
      })
    )
    const { getByTestId, queryByTestId } = render(
      <TaskPicker {...defaultProps} />
    )

    // Act
    fireEvent.press(getByTestId('task-picker-confirm'))

    // Assert
    await waitFor(() => {
      expect(queryByTestId('task-picker-delete-task1')).toBeNull()
    })
    expect(mockOnTaskDeleteAction).not.toHaveBeenCalled()

    // Complete the pending save so React can finish the state transition.
    resolveSave(successResult)
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  it('prevents duplicate assignment saves while confirm is already pending', async () => {
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

    // Assert
    await waitFor(() => {
      expect(
        getByTestId('task-picker-confirm').props.accessibilityState
      ).toMatchObject({
        busy: true,
        disabled: true,
      })
    })
    expect(mockOnTaskSelect).toHaveBeenCalledTimes(1)
    resolveSave(successResult)
  })
})
