import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { Keyboard } from 'react-native'
import { JournalInput } from '../JournalInput'
import { Entry } from '@/src/types'

const defaultEntry: Entry = {
  createdAt: 1700000000000,
  date: '2026-05-27',
  id: 'entry-2026-05-27',
  note: '',
  updatedAt: 1700000000000,
}

const renderJournalInput = (overrides = {}) => {
  return render(
    <JournalInput
      date="2026-05-27"
      entry={defaultEntry}
      maxLength={500}
      onUpdate={jest.fn().mockResolvedValue(undefined)}
      placeholder="Write a note"
      {...overrides}
    />
  )
}

describe('JournalInput form safety', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('shows an unsaved draft state before autosave runs', () => {
    // Arrange
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    const { getAllByText, getByDisplayValue, getByTestId, getByText } =
      renderJournalInput({
        onUpdate,
      })

    // Act
    fireEvent.changeText(getByTestId('journal-text-input'), 'Draft reflection')

    // Assert
    expect(getByDisplayValue('Draft reflection')).toBeTruthy()
    expect(getAllByText('journal.unsavedDraft').length).toBeGreaterThan(0)
    expect(getByText('journal.unsavedDraftHint')).toBeTruthy()
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('keeps failed journal text visible and retryable after persistence fails', async () => {
    // Arrange
    const onUpdate = jest
      .fn()
      .mockRejectedValueOnce(new Error('Save failed'))
      .mockResolvedValueOnce(undefined)
    const { getAllByText, getByDisplayValue, getByTestId } =
      renderJournalInput({
        onUpdate,
      })

    // Act
    fireEvent.changeText(getByTestId('journal-text-input'), 'Important draft')
    fireEvent(getByTestId('journal-text-input'), 'blur')

    // Assert
    await waitFor(() => {
      expect(getAllByText('journal.saveFailedDraft').length).toBeGreaterThan(0)
    })
    expect(getByDisplayValue('Important draft')).toBeTruthy()

    fireEvent.press(getByTestId('journal-save-feedback-action'))

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledTimes(2)
    })
    expect(onUpdate).toHaveBeenLastCalledWith('Important draft')
  })

  it('does not replace a newer local draft when an older entry update arrives', () => {
    // Arrange
    const olderSavedEntry: Entry = {
      ...defaultEntry,
      note: 'Older saved text',
      updatedAt: 1700000000001,
    }
    const { getByDisplayValue, getByTestId, rerender } = render(
      <JournalInput
        date="2026-05-27"
        entry={defaultEntry}
        maxLength={500}
        onUpdate={jest.fn().mockResolvedValue(undefined)}
        placeholder="Write a note"
      />
    )

    // Act
    fireEvent.changeText(getByTestId('journal-text-input'), 'Newer local draft')
    rerender(
      <JournalInput
        date="2026-05-27"
        entry={olderSavedEntry}
        maxLength={500}
        onUpdate={jest.fn().mockResolvedValue(undefined)}
        placeholder="Write a note"
      />
    )

    // Assert
    expect(getByDisplayValue('Newer local draft')).toBeTruthy()
  })

  it('shows a keyboard Done control so multiline journal editing can finish', () => {
    // Arrange
    const { getByTestId, getByText } = renderJournalInput()

    // Act
    fireEvent.press(getByTestId('journal-keyboard-done-button'))

    // Assert
    expect(getByText('common.done')).toBeTruthy()
    expect(Keyboard.dismiss).toHaveBeenCalledTimes(1)
    expect(getByTestId('journal-text-input').props.inputAccessoryViewID).toEqual(
      expect.stringContaining('journal-input-accessory')
    )
    expect(getByTestId('journal-text-input').props.returnKeyType).toBe('done')
    expect(getByTestId('journal-text-input').props.submitBehavior).toBe(
      'blurAndSubmit'
    )
  })

  it('dismisses the keyboard when the journal return key submits editing', () => {
    // Arrange
    const { getByTestId } = renderJournalInput()

    // Act
    fireEvent(getByTestId('journal-text-input'), 'submitEditing')

    // Assert
    expect(Keyboard.dismiss).toHaveBeenCalledTimes(1)
  })
})
