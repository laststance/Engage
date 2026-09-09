import React, { type ComponentProps } from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { Alert, Keyboard } from 'react-native'
import { Category, Task } from '@/src/types'
import * as dateUtils from '@/src/utils/dateUtils'
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

/**
 * Renders PresetTaskEditor with type-safe partial props for form-safety test scenarios.
 * @param overrides - Props replaced for the current scenario.
 * @returns The awaited React Native test renderer result.
 * @example
 * await renderEditor({ isVisible: false })
 */
const renderEditor = async (
  overrides: Partial<ComponentProps<typeof PresetTaskEditor>> = {}
) => {
  return await render(
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

  test('shows inline task-name validation while typing and explains disabled Save', async () => {
    // Arrange
    const onSave = jest.fn()
    const { getAllByText, getByTestId, getByText } = await renderEditor({ onSave })

    // Act
    await fireEvent.changeText(getByTestId('task-title-input-0'), '   ')

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

  test('marks both duplicate preset tasks and prevents saving that conflict', async () => {
    // Arrange
    const onSave = jest.fn()
    const { getByTestId, getAllByText } = await renderEditor({ onSave })

    // Act
    await fireEvent.changeText(getByTestId('task-title-input-1'), ' networking ')
    await fireEvent.press(getByTestId('category-option-business-1'))

    // Assert
    expect(getByTestId('task-title-error-0')).toBeTruthy()
    expect(getByTestId('task-title-error-1')).toBeTruthy()
    expect(getAllByText('presetEditor.duplicateTaskInCategory')).toHaveLength(3)
    expect(getByTestId('preset-editor-save').props.disabled).toBe(true)
    expect(onSave).not.toHaveBeenCalled()
  })

  test('focuses the newly added task title input so users can type immediately', async () => {
    // Arrange
    const { getByTestId } = await renderEditor()

    // Act
    await fireEvent.press(getByTestId('add-task-button'))

    // Assert
    expect(getByTestId('task-title-input-2').props.autoFocus).toBe(true)
    expect(getByTestId('task-title-input-0').props.autoFocus).toBe(false)
  })

  test('hides the preset Save action while users type a newly added task', async () => {
    // Arrange
    const { getByTestId, queryByTestId } = await renderEditor()

    // Act
    await fireEvent.press(getByTestId('add-task-button'))
    await fireEvent(getByTestId('task-title-input-2'), 'focus')

    // Assert
    expect(queryByTestId('preset-editor-save')).toBeNull()
    expect(queryByTestId('preset-editor-cancel')).toBeNull()
    expect(queryByTestId('preset-editor-inline-keyboard-done-button')).toBeNull()
    expect(queryByTestId('preset-editor-keyboard-done-button')).toBeNull()
  })

  test('restores preset Save and Cancel actions after the native keyboard hides', async () => {
    // Arrange
    const { getByTestId, queryByTestId } = await renderEditor()
    const keyboardDidHideHandler = (
      Keyboard.addListener as jest.Mock
    ).mock.calls.find(([eventName]) => eventName === 'keyboardDidHide')?.[1]

    // Act
    await fireEvent.press(getByTestId('add-task-button'))
    await fireEvent(getByTestId('task-title-input-2'), 'focus')
    await act(() => {
      keyboardDidHideHandler()
    })

    // Assert
    expect(queryByTestId('preset-editor-inline-keyboard-done-button')).toBeNull()
    expect(getByTestId('preset-editor-save')).toBeTruthy()
    expect(getByTestId('preset-editor-cancel')).toBeTruthy()
  })

  test('hides the editor without calling cancel when visibility changes', async () => {
    // Arrange
    const editorProps = {
      categories: mockCategories,
      onCancel: jest.fn(),
      onCreateCategory: jest.fn(),
      onSave: jest.fn(),
      tasks: mockTasks,
    }
    const { queryByTestId, rerender } = await render(
      <PresetTaskEditor isVisible {...editorProps} />
    )

    // Act
    await rerender(<PresetTaskEditor isVisible={false} {...editorProps} />)

    // Assert
    expect(queryByTestId('preset-editor-keyboard-avoiding-view')).toBeNull()
    expect(editorProps.onCancel).not.toHaveBeenCalled()
  })

  test('reopens with persisted values instead of a discarded preset draft', async () => {
    // Arrange
    const editorProps = {
      categories: mockCategories,
      onCancel: jest.fn(),
      onCreateCategory: jest.fn(),
      onSave: jest.fn(),
      tasks: mockTasks,
    }
    const { getByTestId, rerender } = await render(
      <PresetTaskEditor isVisible {...editorProps} />
    )
    await fireEvent.changeText(getByTestId('task-title-input-0'), 'Discarded draft')

    // Act
    await rerender(<PresetTaskEditor isVisible={false} {...editorProps} />)
    await rerender(<PresetTaskEditor isVisible {...editorProps} />)

    // Assert
    expect(getByTestId('task-title-input-0').props.value).toBe('Networking')
  })

  test('preserves the active draft when live preset tasks refresh while visible', async () => {
    // Arrange
    const editorProps = {
      categories: mockCategories,
      isVisible: true,
      onCancel: jest.fn(),
      onCreateCategory: jest.fn(),
      onSave: jest.fn(),
    }
    const { getByTestId, rerender } = await render(
      <PresetTaskEditor tasks={mockTasks} {...editorProps} />
    )
    await fireEvent.changeText(getByTestId('task-title-input-0'), 'Active draft')

    // Act
    await rerender(
      <PresetTaskEditor
        tasks={[{ ...mockTasks[0], title: 'Refreshed title' }, mockTasks[1]]}
        {...editorProps}
      />
    )

    // Assert
    expect(getByTestId('task-title-input-0').props.value).toBe('Active draft')
  })

  test('keeps a newly added task in place when category changes during editing', async () => {
    // Arrange
    const { getAllByTestId, getByTestId } = await renderEditor()

    // Act
    await fireEvent.press(getByTestId('add-task-button'))
    const inputOrderBeforeCategoryChange = getTaskTitleInputTestIds(
      getAllByTestId(/^task-title-input-/)
    )
    await fireEvent.changeText(getByTestId('task-title-input-2'), 'Read product notes')
    await fireEvent.press(getByTestId('latest-new-task-category-option-life'))
    const inputOrderAfterCategoryChange = getTaskTitleInputTestIds(
      getAllByTestId(/^task-title-input-/)
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

  test('keeps the Add Category label inside its button when the section heading needs more width', async () => {
    // Arrange
    const { getByTestId, getByText } = await renderEditor()

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

  test('centers the Add Category label vertically within its minimum touch target', async () => {
    // Arrange
    const { getByTestId } = await renderEditor()

    // Act
    const addCategoryButton = getByTestId('add-category-button')

    // Assert
    expect(addCategoryButton.props.className).toContain('justify-center')
  })

  test('keeps preset text inputs above the keyboard without custom Done controls', async () => {
    // Arrange
    const { getByTestId, queryByTestId } = await renderEditor()

    // Act
    await fireEvent.press(getByTestId('add-category-button'))

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
    await fireEvent(newCategoryInput, 'focus')
    expect(queryByTestId('preset-editor-inline-keyboard-done-button')).toBeNull()
    expect(queryByTestId('preset-editor-keyboard-done-button')).toBeNull()
  })

  test('dismisses the preset keyboard from the return key without custom controls', async () => {
    // Arrange
    const { getByTestId, queryByTestId } = await renderEditor()

    // Act
    await fireEvent(getByTestId('task-title-input-0'), 'focus')
    await fireEvent(getByTestId('task-title-input-0'), 'submitEditing')

    // Assert
    expect(queryByTestId('preset-editor-inline-keyboard-done-button')).toBeNull()
    expect(queryByTestId('preset-editor-keyboard-done-button')).toBeNull()
    expect(Keyboard.dismiss).toHaveBeenCalledTimes(1)
  })

  test('keeps preset actions hidden while focus moves from title to minutes', async () => {
    // Arrange
    const { getByTestId, queryByTestId } = await renderEditor()
    const taskTitleInput = getByTestId('task-title-input-0')
    const taskMinutesInput = getByTestId('task-minutes-input-0')

    // Act
    await fireEvent(taskTitleInput, 'focus')
    await fireEvent(taskTitleInput, 'blur')
    await fireEvent(taskMinutesInput, 'focus')
    await act(() => {
      // Run any uncancelled frame callbacks to prove the footer cannot return after handoff.
      pendingAnimationFrameCallbacks.forEach((callback) => callback(0))
    })

    // Assert
    expect(queryByTestId('preset-editor-save')).toBeNull()
    expect(queryByTestId('preset-editor-cancel')).toBeNull()
    expect(cancelAnimationFrame).toHaveBeenCalledTimes(1)
  })

  test('exposes selected state on category chips for screen readers', async () => {
    // Arrange
    const { getByTestId } = await renderEditor()

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

  test('keeps destructive task removal behind a confirmation dialog', async () => {
    // Arrange
    const { getByTestId } = await renderEditor()

    // Act
    await fireEvent.press(getByTestId('delete-task-0'))

    // Assert
    expect(Alert.alert).toHaveBeenCalledWith(
      'presetEditor.deleteTask',
      'presetEditor.deleteTaskConfirm',
      expect.any(Array)
    )
  })

  test('exposes busy and disabled state while saving preset tasks', async () => {
    // Arrange
    let resolveSave: () => void = () => {}
    const onSave = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve
        })
    )
    const { getByTestId } = await renderEditor({ onSave })

    // Act
    const saveAction = fireEvent.press(getByTestId('preset-editor-save'))

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
    await saveAction
  })

  describe('daily routine settings', () => {
    beforeEach(() => {
      jest.spyOn(dateUtils, 'getCurrentDate').mockReturnValue('2026-09-05')
    })

    afterEach(() => {
      jest.mocked(dateUtils.getCurrentDate).mockRestore()
    })

    test('shows unscheduled presets as off with a task-specific switch name', async () => {
      // Arrange & Act
      const { getByRole, getAllByText } = await renderEditor()

      // Assert
      expect(
        getByRole('switch', {
          name: 'presetEditor.dailyAutoAdd: Networking',
        })
      ).not.toBeChecked()
      expect(
        getByRole('switch', {
          name: 'presetEditor.dailyAutoAdd: Exercise',
        })
      ).not.toBeChecked()
      expect(
        getAllByText('presetEditor.dailyAutoAddDescription')
      ).toHaveLength(2)
    })

    test('keeps an active daily routine on and preserves its start date when saved', async () => {
      // Arrange
      const onSave = jest.fn()
      const { getByTestId, getByText } = await renderEditor({
        onSave,
        tasks: [{ ...mockTasks[0], dailyAutoAddFrom: '2026-09-01' }],
      })

      // Act
      await fireEvent.press(getByTestId('preset-editor-save'))

      // Assert
      expect(getByTestId('task-daily-auto-add-switch-0')).toBeChecked()
      expect(
        getByText('presetEditor.dailyAutoAddActiveDescription')
      ).toBeVisible()
      expect(onSave).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'task-business',
          dailyAutoAddFrom: '2026-09-01',
        }),
      ])
    })

    test('toggles from the enlarged touch target while exposing one native switch per task', async () => {
      // Arrange
      const { getByTestId, getAllByRole } = await renderEditor()
      const touchTarget = getByTestId('task-daily-auto-add-touch-target-0')

      // Act
      await fireEvent.press(touchTarget)

      // Assert
      expect(touchTarget.props.className).toContain('touch-target-minimum')
      expect(touchTarget.props.accessible).toBe(false)
      expect(touchTarget.props.importantForAccessibility).toBe('no')
      expect(getAllByRole('switch')).toHaveLength(2)
      expect(getByTestId('task-daily-auto-add-switch-0')).toBeChecked()

      // Act
      await fireEvent(
        getByTestId('task-daily-auto-add-switch-0'),
        'valueChange',
        false
      )

      // Assert
      expect(getByTestId('task-daily-auto-add-switch-0')).not.toBeChecked()
      expect(getAllByRole('switch')).toHaveLength(2)
    })

    test('saves a newly enabled routine from tomorrow across a month boundary', async () => {
      // Arrange
      jest.mocked(dateUtils.getCurrentDate).mockReturnValue('2026-09-30')
      const onSave = jest.fn()
      const { getByTestId } = await renderEditor({ onSave })

      // Act
      await fireEvent(
        getByTestId('task-daily-auto-add-switch-0'),
        'valueChange',
        true
      )
      await fireEvent.press(getByTestId('preset-editor-save'))

      // Assert
      expect(onSave).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'task-business',
          dailyAutoAddFrom: '2026-10-01',
        }),
        expect.objectContaining({
          id: 'task-life',
          dailyAutoAddFrom: undefined,
        }),
      ])
    })

    test('starts a newly enabled routine tomorrow when the editor is saved after midnight', async () => {
      // Arrange
      const onSave = jest.fn()
      const { getByTestId } = await renderEditor({
        onSave,
        tasks: [mockTasks[0]],
      })
      await fireEvent(
        getByTestId('task-daily-auto-add-switch-0'),
        'valueChange',
        true
      )

      // Act
      jest.mocked(dateUtils.getCurrentDate).mockReturnValue('2026-09-06')
      await fireEvent.press(getByTestId('preset-editor-save'))

      // Assert
      expect(onSave).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'task-business',
          dailyAutoAddFrom: '2026-09-07',
        }),
      ])
    })

    test('removes the routine start date when an enabled preset is turned off and saved', async () => {
      // Arrange
      const onSave = jest.fn()
      const { getByTestId } = await renderEditor({
        onSave,
        tasks: [{ ...mockTasks[0], dailyAutoAddFrom: '2026-09-01' }],
      })

      // Act
      await fireEvent(
        getByTestId('task-daily-auto-add-switch-0'),
        'valueChange',
        false
      )
      await fireEvent.press(getByTestId('preset-editor-save'))

      // Assert
      expect(getByTestId('task-daily-auto-add-switch-0')).not.toBeChecked()
      expect(onSave).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'task-business',
          dailyAutoAddFrom: undefined,
        }),
      ])
    })

    test('does not postpone an active routine when its draft switch is turned off and back on', async () => {
      // Arrange
      const onSave = jest.fn()
      const { getByTestId } = await renderEditor({
        onSave,
        tasks: [{ ...mockTasks[0], dailyAutoAddFrom: '2026-09-01' }],
      })

      // Act
      await fireEvent(
        getByTestId('task-daily-auto-add-switch-0'),
        'valueChange',
        false
      )
      await fireEvent(
        getByTestId('task-daily-auto-add-switch-0'),
        'valueChange',
        true
      )
      await fireEvent.press(getByTestId('preset-editor-save'))

      // Assert
      expect(onSave).toHaveBeenCalledWith([
        expect.objectContaining({ dailyAutoAddFrom: '2026-09-01' }),
      ])
    })

    test('discards a routine switch change without saving it when the user cancels', async () => {
      // Arrange
      const onSave = jest.fn()
      const onCancel = jest.fn()
      const editorProps = { onSave, onCancel }
      const { getByTestId } = await renderEditor(editorProps)
      await fireEvent(
        getByTestId('task-daily-auto-add-switch-0'),
        'valueChange',
        true
      )

      // Act
      await fireEvent.press(getByTestId('preset-editor-cancel'))
      const discardAction = jest
        .mocked(Alert.alert)
        .mock.calls.at(-1)?.[2]
        ?.find((button) => button.style === 'destructive')
      await act(() => discardAction?.onPress?.())

      // Assert
      expect(onCancel).toHaveBeenCalledTimes(1)
      expect(onSave).not.toHaveBeenCalled()
      expect(mockTasks[0].dailyAutoAddFrom).toBeUndefined()
    })
  })
})
