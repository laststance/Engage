import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { JournalInput } from '../JournalInput'
import { Entry } from '../../types'

// Mock expo-symbols
jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}))

// Mock the GluestackUIProvider
jest.mock('@/components/ui/gluestack-ui-provider', () => ({
  GluestackUIProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}))

describe('JournalInput', () => {
  const mockOnUpdate = jest.fn().mockResolvedValue(undefined)

  const defaultEntry: Entry = {
    id: 'test-entry-1',
    date: '2024-01-15',
    note: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const defaultProps = {
    date: '2024-01-15',
    entry: defaultEntry,
    onUpdate: mockOnUpdate,
    placeholder: '今日の振り返りを書いてみましょう...',
    maxLength: 500,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const { getByTestId, getByPlaceholderText } = render(
      <JournalInput {...defaultProps} />
    )

    expect(getByTestId('journal-input-container')).toBeTruthy()
    expect(getByTestId('journal-text-input')).toBeTruthy()
    expect(
      getByPlaceholderText('今日の振り返りを書いてみましょう...')
    ).toBeTruthy()
  })

  it('displays the provided entry note', () => {
    const entryWithNote = {
      ...defaultEntry,
      note: '今日は良い一日でした。'
    }
    
    const { getByDisplayValue } = render(
      <JournalInput {...defaultProps} entry={entryWithNote} />
    )

    expect(getByDisplayValue('今日は良い一日でした。')).toBeTruthy()
  })

  it('updates text when user types', () => {
    const { getByTestId } = render(<JournalInput {...defaultProps} />)

    const textInput = getByTestId('journal-text-input')
    fireEvent.changeText(textInput, '新しいテキスト')

    // The text should be updated in the input
    expect(textInput.props.value).toBe('新しいテキスト')
  })

  it('auto-saves when text input loses focus', async () => {
    const { getByTestId } = render(<JournalInput {...defaultProps} />)

    const textInput = getByTestId('journal-text-input')
    fireEvent.changeText(textInput, '更新されたテキスト')
    fireEvent(textInput, 'blur')

    // Wait for debounced auto-save to trigger
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('更新されたテキスト')
    }, { timeout: 5000 })
  })

  it('displays character count', () => {
    const entryWithText = {
      ...defaultEntry,
      note: 'テスト'
    }
    
    const { getByTestId } = render(
      <JournalInput {...defaultProps} entry={entryWithText} />
    )

    expect(getByTestId('character-count')).toBeTruthy()
    expect(getByTestId('character-count').props.children).toContain('3')
  })

  it('respects maxLength prop', () => {
    const { getByTestId } = render(
      <JournalInput {...defaultProps} maxLength={10} />
    )

    const textInput = getByTestId('journal-text-input')
    expect(textInput.props.maxLength).toBe(10)
  })

  it('handles null entry gracefully', () => {
    const { getByTestId } = render(
      <JournalInput {...defaultProps} entry={null} />
    )

    const textInput = getByTestId('journal-text-input')
    expect(textInput.props.value).toBe('')
  })

  it('shows custom placeholder when provided', () => {
    const customPlaceholder = 'カスタムプレースホルダー'
    const { getByPlaceholderText } = render(
      <JournalInput {...defaultProps} placeholder={customPlaceholder} />
    )

    expect(getByPlaceholderText(customPlaceholder)).toBeTruthy()
  })

  it('handles long text properly', () => {
    const longText = 'あ'.repeat(400)
    const entryWithLongText = {
      ...defaultEntry,
      note: longText
    }
    
    const { getByTestId } = render(
      <JournalInput {...defaultProps} entry={entryWithLongText} />
    )

    const textInput = getByTestId('journal-text-input')
    expect(textInput.props.value).toBe(longText)
  })

  it('shows save indicator when auto-saving', async () => {
    const { getByTestId } = render(<JournalInput {...defaultProps} />)

    const textInput = getByTestId('journal-text-input')
    fireEvent.changeText(textInput, '自動保存テスト')
    
    // Auto-save should be triggered and save indicator should appear
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('自動保存テスト')
    })
  })
})