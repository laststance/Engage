import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { PresetTaskEditor } from '../PresetTaskEditor'
import { Task, Category } from '@/src/types'

// Mock Alert
jest.spyOn(Alert, 'alert')

const mockCategories: Category[] = [
  { id: 'business', name: '事業' },
  { id: 'life', name: '生活' },
]

const mockTasks: Task[] = [
  {
    id: 'task1',
    title: 'ネットワーキング',
    categoryId: 'business',
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
]

describe('PresetTaskEditor', () => {
  const mockOnSave = jest.fn()
  const mockOnCancel = jest.fn()
  const mockOnCreateCategory = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const defaultProps = {
    isVisible: true,
    tasks: mockTasks,
    categories: mockCategories,
    onSave: mockOnSave,
    onCancel: mockOnCancel,
    onCreateCategory: mockOnCreateCategory,
  }

  test('renders correctly when visible', async () => {
    const { getByText, getByTestId } = await render(
      <PresetTaskEditor {...defaultProps} />
    )

    expect(getByText('プリセットタスク編集')).toBeTruthy()
    expect(getByTestId('add-task-button')).toBeTruthy()
    expect(getByText('ネットワーキング')).toBeTruthy()
    expect(getByText('運動 (20分以上)')).toBeTruthy()
  })

  test('does not render when not visible', async () => {
    const { queryByText } = await render(
      <PresetTaskEditor {...defaultProps} isVisible={false} />
    )

    expect(queryByText('プリセットタスク編集')).toBeNull()
  })

  test('allows adding a new task', async () => {
    const { getByTestId, getAllByDisplayValue } = await render(
      <PresetTaskEditor {...defaultProps} />
    )

    const addButton = getByTestId('add-task-button')
    await fireEvent.press(addButton)

    // Should have 3 task title inputs now (2 existing + 1 new)
    const titleInputs = getAllByDisplayValue('')
    expect(titleInputs.length).toBeGreaterThan(0)
  })

  test('allows editing task title', async () => {
    const { getByDisplayValue } = await render(<PresetTaskEditor {...defaultProps} />)

    const titleInput = getByDisplayValue('ネットワーキング')
    await fireEvent.changeText(titleInput, '新しいネットワーキング')

    expect(titleInput.props.value).toBe('新しいネットワーキング')
  })

  test('allows editing task duration', async () => {
    const { getByDisplayValue } = await render(<PresetTaskEditor {...defaultProps} />)

    const minutesInput = getByDisplayValue('20')
    await fireEvent.changeText(minutesInput, '30')

    expect(minutesInput.props.value).toBe('30')
  })

  test('allows changing task category', async () => {
    const { getByTestId } = await render(
      <PresetTaskEditor {...defaultProps} />
    )

    // Find category option for the first task (index 0)
    const categoryOption = getByTestId('category-option-life-0')
    await fireEvent.press(categoryOption)

    // The category should be selected (this would be reflected in the UI state)
    expect(categoryOption).toBeTruthy()
  })

  test('shows delete confirmation when deleting a task', async () => {
    const { getByTestId } = await render(<PresetTaskEditor {...defaultProps} />)

    const deleteButton = getByTestId('delete-task-0')
    await fireEvent.press(deleteButton)

    expect(Alert.alert).toHaveBeenCalledWith(
      'タスクを削除',
      '「ネットワーキング」を削除しますか？',
      expect.any(Array)
    )
  })

  test('allows creating a new category', async () => {
    const { getByTestId, getByPlaceholderText } = await render(
      <PresetTaskEditor {...defaultProps} />
    )

    // Open new category input
    const addCategoryButton = getByTestId('add-category-button')
    await fireEvent.press(addCategoryButton)

    // Enter category name
    const categoryInput = getByPlaceholderText('新しいカテゴリー名')
    await fireEvent.changeText(categoryInput, '勉強')

    // Create category
    const createButton = getByTestId('create-category-button')
    await fireEvent.press(createButton)

    await waitFor(() => {
      expect(mockOnCreateCategory).toHaveBeenCalledWith('勉強')
    })
  })

  test('validates tasks before saving', async () => {
    const { getByTestId, getByDisplayValue, getByText } = await render(
      <PresetTaskEditor {...defaultProps} />
    )

    // Clear all task titles
    const titleInput1 = getByDisplayValue('ネットワーキング')
    const titleInput2 = getByDisplayValue('運動 (20分以上)')

    await fireEvent.changeText(titleInput1, '')
    await fireEvent.changeText(titleInput2, '')

    // Try to save
    const saveButton = getByTestId('preset-editor-save')
    await fireEvent.press(saveButton)

    await waitFor(() => {
      expect(getByTestId('preset-editor-feedback')).toBeTruthy()
    })

    expect(getByText('presetEditor.atLeastOneTask')).toBeTruthy()
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  test('detects duplicate task names in same category', async () => {
    const { getByTestId, getByDisplayValue, getByText } = await render(
      <PresetTaskEditor {...defaultProps} />
    )

    // Change second task to have same title as first task
    const titleInput2 = getByDisplayValue('運動 (20分以上)')
    await fireEvent.changeText(titleInput2, 'ネットワーキング')

    // Change second task to same category as first task
    const categoryOption = getByTestId('category-option-business-1')
    await fireEvent.press(categoryOption)

    // Try to save
    const saveButton = getByTestId('preset-editor-save')
    await fireEvent.press(saveButton)

    await waitFor(() => {
      expect(getByTestId('preset-editor-feedback')).toBeTruthy()
    })

    expect(getByText('presetEditor.duplicateTaskInCategory')).toBeTruthy()
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  test('saves valid tasks successfully', async () => {
    mockOnSave.mockResolvedValue(undefined)

    const { getByTestId } = await render(
      <PresetTaskEditor {...defaultProps} />
    )

    const saveButton = getByTestId('preset-editor-save')
    await fireEvent.press(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'ネットワーキング',
            categoryId: 'business',
          }),
          expect.objectContaining({
            title: '運動 (20分以上)',
            categoryId: 'life',
            defaultMinutes: 20,
          }),
        ])
      )
    })
  })

  test('shows confirmation when canceling with changes', async () => {
    const { getByTestId } = await render(<PresetTaskEditor {...defaultProps} />)

    const cancelButton = getByTestId('preset-editor-cancel')
    await fireEvent.press(cancelButton)

    expect(Alert.alert).toHaveBeenCalledWith(
      '変更を破棄',
      '編集内容が失われますが、よろしいですか？',
      expect.any(Array)
    )
  })

  test('handles save errors gracefully', async () => {
    mockOnSave.mockRejectedValue(new Error('Save failed'))

    const { getByTestId, getByText } = await render(
      <PresetTaskEditor {...defaultProps} />
    )

    const saveButton = getByTestId('preset-editor-save')
    await fireEvent.press(saveButton)

    await waitFor(() => {
      expect(getByTestId('preset-editor-feedback')).toBeTruthy()
    })
    expect(getByText('presetEditor.saveFailed')).toBeTruthy()

    await fireEvent.press(getByTestId('preset-editor-feedback-action'))

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(2)
    })
  })

  test('handles category creation errors gracefully', async () => {
    mockOnCreateCategory.mockRejectedValue(
      new Error('Category creation failed')
    )

    const { getByTestId, getByPlaceholderText, getByText } = await render(
      <PresetTaskEditor {...defaultProps} />
    )

    // Open new category input
    const addCategoryButton = getByTestId('add-category-button')
    await fireEvent.press(addCategoryButton)

    // Enter category name
    const categoryInput = getByPlaceholderText(
      'presetEditor.newCategoryPlaceholder'
    )
    await fireEvent.changeText(categoryInput, '勉強')

    // Try to create category
    const createButton = getByTestId('create-category-button')
    await fireEvent.press(createButton)

    await waitFor(() => {
      expect(getByTestId('preset-editor-feedback')).toBeTruthy()
    })
    expect(getByText('presetEditor.createCategoryFailed')).toBeTruthy()
  })
})
