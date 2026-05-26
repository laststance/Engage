import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { Category, Task } from '@/src/types'
import { PresetTaskEditor } from '../PresetTaskEditor'

jest.spyOn(Alert, 'alert')

const mockCategories: Category[] = [
  { id: 'business', name: 'Business' },
  { id: 'life', name: 'Life' },
]

const mockTasks: Task[] = [
  {
    archived: false,
    categoryId: 'business',
    createdAt: 1700000000000,
    id: 'task-business',
    title: 'Networking',
    updatedAt: 1700000000000,
  },
  {
    archived: false,
    categoryId: 'life',
    createdAt: 1700000000001,
    defaultMinutes: 20,
    id: 'task-life',
    title: 'Exercise',
    updatedAt: 1700000000001,
  },
]

const renderEditor = (overrides = {}) => {
  return render(
    <PresetTaskEditor
      categories={mockCategories}
      isVisible
      onCancel={jest.fn()}
      onCreateCategory={jest.fn()}
      onSave={jest.fn()}
      tasks={mockTasks}
      {...overrides}
    />
  )
}

describe('PresetTaskEditor form safety', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows inline task-name validation while typing and explains disabled Save', () => {
    // Arrange
    const onSave = jest.fn()
    const { getAllByText, getByTestId, getByText } = renderEditor({ onSave })

    // Act
    fireEvent.changeText(getByTestId('task-title-input-0'), '   ')

    // Assert
    expect(getByTestId('task-title-error-0')).toBeTruthy()
    expect(getByText('presetEditor.taskNameRequired')).toBeTruthy()
    expect(getAllByText('presetEditor.fixInvalidTasks').length).toBeGreaterThan(
      0
    )
    expect(getByTestId('preset-editor-save').props.disabled).toBe(true)
    expect(getByTestId('preset-editor-save').props.accessibilityState).toMatchObject({
      disabled: true,
    })
    expect(onSave).not.toHaveBeenCalled()
  })

  it('marks both duplicate preset tasks and prevents saving that conflict', () => {
    // Arrange
    const onSave = jest.fn()
    const { getByTestId, getAllByText } = renderEditor({ onSave })

    // Act
    fireEvent.changeText(getByTestId('task-title-input-1'), ' networking ')
    fireEvent.press(getByTestId('category-option-business-1'))

    // Assert
    expect(getByTestId('task-title-error-0')).toBeTruthy()
    expect(getByTestId('task-title-error-1')).toBeTruthy()
    expect(getAllByText('presetEditor.duplicateTaskInCategory')).toHaveLength(3)
    expect(getByTestId('preset-editor-save').props.disabled).toBe(true)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('exposes selected state on category chips for screen readers', () => {
    // Arrange
    const { getByTestId } = renderEditor()

    // Act
    const selectedBusinessChip = getByTestId('category-option-business-0')
    const unselectedLifeChip = getByTestId('category-option-life-0')

    // Assert
    expect(selectedBusinessChip.props.accessibilityRole).toBe('button')
    expect(selectedBusinessChip.props.accessibilityState).toEqual({
      selected: true,
    })
    expect(unselectedLifeChip.props.accessibilityState).toEqual({
      selected: false,
    })
  })

  it('keeps destructive task removal behind a confirmation dialog', () => {
    // Arrange
    const { getByTestId } = renderEditor()

    // Act
    fireEvent.press(getByTestId('delete-task-0'))

    // Assert
    expect(Alert.alert).toHaveBeenCalledWith(
      'presetEditor.deleteTask',
      'presetEditor.deleteTaskConfirm',
      expect.any(Array)
    )
  })

  it('exposes busy and disabled state while saving preset tasks', async () => {
    // Arrange
    let resolveSave: () => void = () => {}
    const onSave = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve
        })
    )
    const { getByTestId } = renderEditor({ onSave })

    // Act
    fireEvent.press(getByTestId('preset-editor-save'))

    // Assert
    await waitFor(() => {
      expect(
        getByTestId('preset-editor-save').props.accessibilityState
      ).toMatchObject({
        busy: true,
        disabled: true,
      })
    })
    resolveSave()
  })
})
