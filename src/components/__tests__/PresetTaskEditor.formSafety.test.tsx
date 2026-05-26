import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { PresetTaskEditor } from '../PresetTaskEditor'
import { Category, Task } from '@/src/types'

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
})
