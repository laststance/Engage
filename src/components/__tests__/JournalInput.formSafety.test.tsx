import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { Keyboard } from 'react-native'
import { JournalInput } from '../JournalInput'
import { Entry } from '@/src/types'
import { JOURNAL_AUTOSAVE_DELAY_MS } from '@/src/constants/journal'

const defaultEntry: Entry = {
  createdAt: 1700000000000,
  date: '2026-05-27',
  id: 'entry-2026-05-27',
  note: '',
  updatedAt: 1700000000000,
}

const renderJournalInput = async (overrides = {}) => {
  return await render(
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

  it('shows an unsaved draft state before autosave runs', async () => {
    // Arrange
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    const { getAllByText, getByDisplayValue, getByTestId, getByText } =
      await renderJournalInput({
        onUpdate,
      })

    // Act
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Draft reflection')

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
      await renderJournalInput({
        onUpdate,
      })

    // Act
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Important draft')
    await fireEvent(getByTestId('journal-text-input'), 'blur')

    // Assert
    await waitFor(() => {
      expect(getAllByText('journal.saveFailedDraft').length).toBeGreaterThan(0)
    })
    expect(getByDisplayValue('Important draft')).toBeTruthy()

    await fireEvent.press(getByTestId('journal-save-feedback-action'))

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledTimes(2)
    })
    expect(onUpdate).toHaveBeenLastCalledWith('Important draft')
  })

  it('shows saved after autosave updates the parent journal entry', async () => {
    // Arrange
    let rerenderJournal: Awaited<ReturnType<typeof render>>['rerender']
    let onUpdate: jest.MockedFunction<(content: string) => Promise<void>>
    const renderInput = (entry: Entry) => (
      <JournalInput
        date="2026-05-27"
        entry={entry}
        maxLength={500}
        onUpdate={onUpdate}
        placeholder="Write a note"
      />
    )
    onUpdate = jest.fn(async (content: string) => {
      rerenderJournal(
        renderInput({
          ...defaultEntry,
          note: content,
          updatedAt: defaultEntry.updatedAt + 1,
        })
      )
    })
    const { getAllByText, getByTestId, queryByText, rerender } = await render(
      renderInput(defaultEntry)
    )
    rerenderJournal = rerender

    // Act
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Persisted draft')
    await act(async () => {
      jest.advanceTimersByTime(JOURNAL_AUTOSAVE_DELAY_MS)
      await Promise.resolve()
    })

    // Assert
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('Persisted draft')
    })
    await waitFor(() => {
      expect(queryByText('common.saving')).toBeNull()
      expect(getAllByText('journal.saved').length).toBeGreaterThan(0)
    })
  })

  it('does not replace a newer local draft when an older entry update arrives', async () => {
    // Arrange
    const olderSavedEntry: Entry = {
      ...defaultEntry,
      note: 'Older saved text',
      updatedAt: 1700000000001,
    }
    const { getByDisplayValue, getByTestId, rerender } = await render(
      <JournalInput
        date="2026-05-27"
        entry={defaultEntry}
        maxLength={500}
        onUpdate={jest.fn().mockResolvedValue(undefined)}
        placeholder="Write a note"
      />
    )

    // Act
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Newer local draft')
    await rerender(
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

  it('keeps the journal return key for line breaks while the Done control closes editing', async () => {
    // Arrange
    const { getByTestId, getByText } = await renderJournalInput()

    // Act
    await fireEvent.press(getByTestId('journal-keyboard-done-button'))

    // Assert
    expect(getByText('common.done')).toBeTruthy()
    expect(Keyboard.dismiss).toHaveBeenCalledTimes(1)
    expect(getByTestId('journal-text-input').props.inputAccessoryViewID).toEqual(
      expect.stringContaining('journal-input-accessory')
    )
    expect(getByTestId('journal-text-input').props.returnKeyType).toBeUndefined()
    expect(getByTestId('journal-text-input').props.submitBehavior).toBe('newline')
  })

  it('does not dismiss the keyboard when the multiline journal return key is pressed', async () => {
    // Arrange
    const { getByTestId } = await renderJournalInput()

    // Act
    await fireEvent(getByTestId('journal-text-input'), 'submitEditing')

    // Assert
    expect(getByTestId('journal-text-input').props.onSubmitEditing).toBeUndefined()
    expect(Keyboard.dismiss).not.toHaveBeenCalled()
  })

  it('keeps newline characters in the journal draft text', async () => {
    // Arrange
    const { getByDisplayValue, getByTestId } = await renderJournalInput()

    // Act
    await fireEvent.changeText(
      getByTestId('journal-text-input'),
      'Today was good.\nTomorrow I will continue.'
    )

    // Assert
    expect(
      getByDisplayValue('Today was good.\nTomorrow I will continue.')
    ).toBeTruthy()
  })
})
