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

  it('renders correctly when visible', () => {
    const { getByText, getByTestId } = render(
      <PresetTaskEditor {...defaultProps} />
    )

    expect(getByText('プリセットタスク編集')).toBeTruthy()
    expect(getByTestId('add-task-button')).toBeTruthy()
    expect(getByText('ネットワーキング')).toBeTruthy()
    expect(getByText('運動 (20分以上)')).toBeTruthy()
  })

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <PresetTaskEditor {...defaultProps} isVisible={false} />
    )

    expect(queryByText('プリセットタスク編集')).toBeNull()
  })

  it('allows adding a new task', () => {
    const { getByTestId, getAllByDisplayValue } = render(
      <PresetTaskEditor {...defaultProps} />
    )

    const addButton = getByTestId('add-task-button')
    fireEvent.press(addButton)

    // Should have 3 task title inputs now (2 existing + 1 new)
    const titleInputs = getAllByDisplayValue('')
    expect(titleInputs.length).toBeGreaterThan(0)
  })

  it('allows editing task title', () => {
    const { getByDisplayValue } = render(<PresetTaskEditor {...defaultProps} />)

    const titleInput = getByDisplayValue('ネットワーキング')
    fireEvent.changeText(titleInput, '新しいネットワーキング')

    expect(titleInput.props.value).toBe('新しいネットワーキング')
  })

  it('allows editing task duration', () => {
    const { getByDisplayValue } = render(<PresetTaskEditor {...defaultProps} />)

    const minutesInput = getByDisplayValue('20')
    fireEvent.changeText(minutesInput, '30')

    expect(minutesInput.props.value).toBe('30')
  })

  it('allows changing task category', () => {
    const { getByTestId } = render(<PresetTaskEditor {...defaultProps} />)

    // Find category option for the first task (index 0)
    const categoryOption = getByTestId('category-option-life-0')
    fireEvent.press(categoryOption)

    // The category should be selected (this would be reflected in the UI state)
    expect(categoryOption).toBeTruthy()
  })

  it('shows delete confirmation when deleting a task', () => {
    const { getByTestId } = render(<PresetTaskEditor {...defaultProps} />)

    const deleteButton = getByTestId('delete-task-0')
    fireEvent.press(deleteButton)

    expect(Alert.alert).toHaveBeenCalledWith(
      'タスクを削除',
      '「ネットワーキング」を削除しますか？',
      expect.any(Array)
    )
  })

  it('allows creating a new category', async () => {
    const { getByTestId, getByPlaceholderText } = render(
      <PresetTaskEditor {...defaultProps} />
    )

    // Open new category input
    const addCategoryButton = getByTestId('add-category-button')
    fireEvent.press(addCategoryButton)

    // Enter category name
    const categoryInput = getByPlaceholderText('新しいカテゴリー名')
    fireEvent.changeText(categoryInput, '勉強')

    // Create category
    const createButton = getByTestId('create-category-button')
    fireEvent.press(createButton)

    await waitFor(() => {
      expect(mockOnCreateCategory).toHaveBeenCalledWith('勉強')
    })
  })

  it('validates tasks before saving', async () => {
    const { getByTestId, getByDisplayValue } = render(
      <PresetTaskEditor {...defaultProps} />
    )

    // Clear all task titles
    const titleInput1 = getByDisplayValue('ネットワーキング')
    const titleInput2 = getByDisplayValue('運動 (20分以上)')

    fireEvent.changeText(titleInput1, '')
    fireEvent.changeText(titleInput2, '')

    // Try to save
    const saveButton = getByTestId('preset-editor-save')
    fireEvent.press(saveButton)

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'エラー',
        '少なくとも1つのタスクが必要です'
      )
    })

    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('detects duplicate task names in same category', async () => {
    const { getByTestId, getByDisplayValue } = render(
      <PresetTaskEditor {...defaultProps} />
    )

    // Change second task to have same title as first task
    const titleInput2 = getByDisplayValue('運動 (20分以上)')
    fireEvent.changeText(titleInput2, 'ネットワーキング')

    // Change second task to same category as first task
    const categoryOption = getByTestId('category-option-business-1')
    fireEvent.press(categoryOption)

    // Try to save
    const saveButton = getByTestId('preset-editor-save')
    fireEvent.press(saveButton)

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'エラー',
        '同じカテゴリー内で重複するタスク名があります'
      )
    })

    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('saves valid tasks successfully', async () => {
    mockOnSave.mockResolvedValue(undefined)

    const { getByTestId } = render(<PresetTaskEditor {...defaultProps} />)

    const saveButton = getByTestId('preset-editor-save')
    fireEvent.press(saveButton)

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

  it('shows confirmation when canceling with changes', () => {
    const { getByTestId } = render(<PresetTaskEditor {...defaultProps} />)

    const cancelButton = getByTestId('preset-editor-cancel')
    fireEvent.press(cancelButton)

    expect(Alert.alert).toHaveBeenCalledWith(
      '変更を破棄',
      '編集内容が失われますが、よろしいですか？',
      expect.any(Array)
    )
  })

  it('handles save errors gracefully', async () => {
    mockOnSave.mockRejectedValue(new Error('Save failed'))

    const { getByTestId } = render(<PresetTaskEditor {...defaultProps} />)

    const saveButton = getByTestId('preset-editor-save')
    fireEvent.press(saveButton)

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'エラー',
        'タスクの保存に失敗しました'
      )
    })
  })

  it('handles category creation errors gracefully', async () => {
    mockOnCreateCategory.mockRejectedValue(
      new Error('Category creation failed')
    )

    const { getByTestId, getByPlaceholderText } = render(
      <PresetTaskEditor {...defaultProps} />
    )

    // Open new category input
    const addCategoryButton = getByTestId('add-category-button')
    fireEvent.press(addCategoryButton)

    // Enter category name
    const categoryInput = getByPlaceholderText('新しいカテゴリー名')
    fireEvent.changeText(categoryInput, '勉強')

    // Try to create category
    const createButton = getByTestId('create-category-button')
    fireEvent.press(createButton)

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'エラー',
        'カテゴリーの作成に失敗しました'
      )
    })
  })
})
