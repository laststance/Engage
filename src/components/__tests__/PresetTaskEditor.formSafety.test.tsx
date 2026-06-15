import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { Alert, Keyboard, TextInput } from 'react-native'
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

interface RenderedInputWithTestId {
  props: {
    testID?: unknown
  }
}

/**
 * Reads task-title input IDs in screen order so category changes cannot reorder the active draft.
 * @param inputs - The rendered React Native TextInput instances from the editor.
 * @returns The task title test IDs in their current visual order.
 * @example
 * getTaskTitleInputTestIds(inputs) // => ['task-title-input-0', 'task-title-input-1']
 */
const getTaskTitleInputTestIds = (
  inputs: RenderedInputWithTestId[]
): string[] =>
  inputs
    .map((input) => input.props.testID)
    .filter((testId): testId is string =>
      String(testId).startsWith('task-title-input-')
    )

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

  it('focuses the newly added task title input so users can type immediately', () => {
    // Arrange
    const { getByTestId } = renderEditor()

    // Act
    fireEvent.press(getByTestId('add-task-button'))

    // Assert
    expect(getByTestId('task-title-input-2').props.autoFocus).toBe(true)
    expect(getByTestId('task-title-input-0').props.autoFocus).toBe(false)
  })

  it('hides the preset Save action while users type a newly added task', () => {
    // Arrange
    const { getByTestId, queryByTestId } = renderEditor()

    // Act
    fireEvent.press(getByTestId('add-task-button'))
    fireEvent(getByTestId('task-title-input-2'), 'focus')

    // Assert
    expect(queryByTestId('preset-editor-save')).toBeNull()
    expect(queryByTestId('preset-editor-cancel')).toBeNull()
    expect(getByTestId('preset-editor-inline-keyboard-done-button')).toBeTruthy()
  })

  it('restores preset Save and Cancel actions after the native keyboard hides', () => {
    // Arrange
    const { getByTestId, queryByTestId } = renderEditor()
    const keyboardDidHideHandler = (
      Keyboard.addListener as jest.Mock
    ).mock.calls.find(([eventName]) => eventName === 'keyboardDidHide')?.[1]

    // Act
    fireEvent.press(getByTestId('add-task-button'))
    fireEvent(getByTestId('task-title-input-2'), 'focus')
    act(() => {
      keyboardDidHideHandler()
    })

    // Assert
    expect(queryByTestId('preset-editor-inline-keyboard-done-button')).toBeNull()
    expect(getByTestId('preset-editor-save')).toBeTruthy()
    expect(getByTestId('preset-editor-cancel')).toBeTruthy()
  })

  it('keeps a newly added task in place when category changes during editing', () => {
    // Arrange
    const { UNSAFE_getAllByType, getByTestId } = renderEditor()

    // Act
    fireEvent.press(getByTestId('add-task-button'))
    const inputOrderBeforeCategoryChange = getTaskTitleInputTestIds(
      UNSAFE_getAllByType(TextInput)
    )
    fireEvent.changeText(getByTestId('task-title-input-2'), 'Read product notes')
    fireEvent.press(getByTestId('latest-new-task-category-option-life'))
    const inputOrderAfterCategoryChange = getTaskTitleInputTestIds(
      UNSAFE_getAllByType(TextInput)
    )

    // Assert
    expect(inputOrderBeforeCategoryChange).toEqual([
      'task-title-input-0',
      'task-title-input-1',
      'task-title-input-2',
    ])
    expect(inputOrderAfterCategoryChange).toEqual(inputOrderBeforeCategoryChange)
    expect(getByTestId('task-title-input-2').props.value).toBe(
      'Read product notes'
    )
    expect(
      getByTestId('latest-new-task-category-option-life').props
        .accessibilityState
    ).toEqual({
      selected: true,
    })
  })

  it('keeps preset text inputs above the keyboard and gives them a Done action', () => {
    // Arrange
    const { getAllByText, getByTestId, queryByTestId } = renderEditor()

    // Act
    fireEvent.press(getByTestId('add-category-button'))

    // Assert
    const taskTitleInput = getByTestId('task-title-input-0')
    const taskMinutesInput = getByTestId('task-minutes-input-1')
    const newCategoryInput = getByTestId('new-category-input')

    expect(getByTestId('preset-editor-keyboard-avoiding-view')).toBeTruthy()
    expect(queryByTestId('preset-editor-inline-keyboard-done-button')).toBeNull()
    expect(taskTitleInput.props.inputAccessoryViewID).toEqual(
      expect.stringContaining('preset-editor-input-accessory')
    )
    expect(taskMinutesInput.props.inputAccessoryViewID).toBe(
      taskTitleInput.props.inputAccessoryViewID
    )
    expect(newCategoryInput.props.inputAccessoryViewID).toBe(
      taskTitleInput.props.inputAccessoryViewID
    )
    expect(taskTitleInput.props.returnKeyType).toBe('done')
    expect(taskTitleInput.props.submitBehavior).toBe('blurAndSubmit')
    expect(taskMinutesInput.props.returnKeyType).toBe('done')
    expect(newCategoryInput.props.returnKeyType).toBe('done')
    fireEvent(newCategoryInput, 'focus')
    expect(getByTestId('preset-editor-inline-keyboard-done-button')).toBeTruthy()
    expect(getAllByText('common.done').length).toBeGreaterThan(0)
  })

  it('dismisses the preset keyboard from the Done controls and return key', () => {
    // Arrange
    const { getByTestId, queryByTestId } = renderEditor()

    // Act
    fireEvent.press(getByTestId('preset-editor-keyboard-done-button'))
    fireEvent(getByTestId('task-title-input-0'), 'focus')
    fireEvent.press(getByTestId('preset-editor-inline-keyboard-done-button'))
    fireEvent(getByTestId('task-title-input-0'), 'focus')
    fireEvent(getByTestId('task-title-input-0'), 'submitEditing')

    // Assert
    expect(queryByTestId('preset-editor-inline-keyboard-done-button')).toBeNull()
    expect(Keyboard.dismiss).toHaveBeenCalledTimes(3)
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
