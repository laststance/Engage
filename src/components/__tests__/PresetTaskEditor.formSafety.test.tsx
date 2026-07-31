import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { Alert, Keyboard, Modal, TextInput } from 'react-native'
import { Category, Task } from '@/src/types'
import { PresetTaskEditor } from '../PresetTaskEditor'

jest.spyOn(Alert, 'alert')
globalThis.requestAnimationFrame = jest.fn()
globalThis.cancelAnimationFrame = jest.fn()

const pendingAnimationFrameCallbacks = new Map<
  number,
  Parameters<typeof requestAnimationFrame>[0]
>()
let nextAnimationFrameId = 0

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
    pendingAnimationFrameCallbacks.clear()
    nextAnimationFrameId = 0
    jest.mocked(requestAnimationFrame).mockImplementation((callback) => {
      nextAnimationFrameId += 1
      pendingAnimationFrameCallbacks.set(nextAnimationFrameId, callback)
      return nextAnimationFrameId
    })
    jest.mocked(cancelAnimationFrame).mockImplementation((frameId) => {
      // React Native permits an empty frame ID, so only remove callbacks with a real numeric key.
      if (typeof frameId === 'number') {
        pendingAnimationFrameCallbacks.delete(frameId)
      }
    })
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
    expect(queryByTestId('preset-editor-inline-keyboard-done-button')).toBeNull()
    expect(queryByTestId('preset-editor-keyboard-done-button')).toBeNull()
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

  it('keeps the native Modal mounted while hidden so nested iOS sheets dismiss cleanly', () => {
    // Arrange
    const editorProps = {
      categories: mockCategories,
      onCancel: jest.fn(),
      onCreateCategory: jest.fn(),
      onSave: jest.fn(),
      tasks: mockTasks,
    }
    const { UNSAFE_getByType, rerender } = render(
      <PresetTaskEditor isVisible {...editorProps} />
    )

    // Act
    rerender(<PresetTaskEditor isVisible={false} {...editorProps} />)

    // Assert
    expect(UNSAFE_getByType(Modal).props.visible).toBe(false)
  })

  it('reopens with persisted values instead of a discarded preset draft', () => {
    // Arrange
    const editorProps = {
      categories: mockCategories,
      onCancel: jest.fn(),
      onCreateCategory: jest.fn(),
      onSave: jest.fn(),
      tasks: mockTasks,
    }
    const { getByTestId, rerender } = render(
      <PresetTaskEditor isVisible {...editorProps} />
    )
    fireEvent.changeText(getByTestId('task-title-input-0'), 'Discarded draft')

    // Act
    rerender(<PresetTaskEditor isVisible={false} {...editorProps} />)
    rerender(<PresetTaskEditor isVisible {...editorProps} />)

    // Assert
    expect(getByTestId('task-title-input-0').props.value).toBe('Networking')
  })

  it('preserves the active draft when live preset tasks refresh while visible', () => {
    // Arrange
    const editorProps = {
      categories: mockCategories,
      isVisible: true,
      onCancel: jest.fn(),
      onCreateCategory: jest.fn(),
      onSave: jest.fn(),
    }
    const { getByTestId, rerender } = render(
      <PresetTaskEditor tasks={mockTasks} {...editorProps} />
    )
    fireEvent.changeText(getByTestId('task-title-input-0'), 'Active draft')

    // Act
    rerender(
      <PresetTaskEditor
        tasks={[{ ...mockTasks[0], title: 'Refreshed title' }, mockTasks[1]]}
        {...editorProps}
      />
    )

    // Assert
    expect(getByTestId('task-title-input-0').props.value).toBe('Active draft')
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

  it('keeps the Add Category label inside its button when the section heading needs more width', () => {
    // Arrange
    const { getByTestId, getByText } = renderEditor()

    // Act
    const categoryManagementHeading = getByText(
      'presetEditor.categoryManagement'
    )
    const addCategoryButton = getByTestId('add-category-button')

    // Assert
    expect(categoryManagementHeading.props.className).toContain('flex-1')
    expect(categoryManagementHeading.props.className).toContain('mr-2')
    expect(addCategoryButton.props.className).toContain('shrink-0')
    expect(getByText('presetEditor.addCategory')).toBeTruthy()
  })

  it('centers the Add Category label vertically within its minimum touch target', () => {
    // Arrange
    const { getByTestId } = renderEditor()

    // Act
    const addCategoryButton = getByTestId('add-category-button')

    // Assert
    expect(addCategoryButton.props.className).toContain('justify-center')
  })

  it('keeps preset text inputs above the keyboard without custom Done controls', () => {
    // Arrange
    const { getByTestId, queryByTestId } = renderEditor()

    // Act
    fireEvent.press(getByTestId('add-category-button'))

    // Assert
    const taskTitleInput = getByTestId('task-title-input-0')
    const taskMinutesInput = getByTestId('task-minutes-input-1')
    const newCategoryInput = getByTestId('new-category-input')

    expect(getByTestId('preset-editor-keyboard-avoiding-view')).toBeTruthy()
    expect(queryByTestId('preset-editor-inline-keyboard-done-button')).toBeNull()
    expect(queryByTestId('preset-editor-keyboard-done-button')).toBeNull()
    expect(taskTitleInput.props.inputAccessoryViewID).toBeUndefined()
    expect(taskMinutesInput.props.inputAccessoryViewID).toBeUndefined()
    expect(newCategoryInput.props.inputAccessoryViewID).toBeUndefined()
    expect(taskTitleInput.props.returnKeyType).toBe('done')
    expect(taskTitleInput.props.submitBehavior).toBe('blurAndSubmit')
    expect(taskMinutesInput.props.returnKeyType).toBe('done')
    expect(newCategoryInput.props.returnKeyType).toBe('done')
    fireEvent(newCategoryInput, 'focus')
    expect(queryByTestId('preset-editor-inline-keyboard-done-button')).toBeNull()
    expect(queryByTestId('preset-editor-keyboard-done-button')).toBeNull()
  })

  it('dismisses the preset keyboard from the return key without custom controls', () => {
    // Arrange
    const { getByTestId, queryByTestId } = renderEditor()

    // Act
    fireEvent(getByTestId('task-title-input-0'), 'focus')
    fireEvent(getByTestId('task-title-input-0'), 'submitEditing')

    // Assert
    expect(queryByTestId('preset-editor-inline-keyboard-done-button')).toBeNull()
    expect(queryByTestId('preset-editor-keyboard-done-button')).toBeNull()
    expect(Keyboard.dismiss).toHaveBeenCalledTimes(1)
  })

  it('keeps preset actions hidden while focus moves from title to minutes', () => {
    // Arrange
    const { getByTestId, queryByTestId } = renderEditor()
    const taskTitleInput = getByTestId('task-title-input-0')
    const taskMinutesInput = getByTestId('task-minutes-input-0')

    // Act
    fireEvent(taskTitleInput, 'focus')
    fireEvent(taskTitleInput, 'blur')
    fireEvent(taskMinutesInput, 'focus')
    act(() => {
      // Run any uncancelled frame callbacks to prove the footer cannot return after handoff.
      pendingAnimationFrameCallbacks.forEach((callback) => callback(0))
    })

    // Assert
    expect(queryByTestId('preset-editor-save')).toBeNull()
    expect(queryByTestId('preset-editor-cancel')).toBeNull()
    expect(cancelAnimationFrame).toHaveBeenCalledTimes(1)
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
