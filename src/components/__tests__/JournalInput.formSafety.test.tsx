import React from 'react'
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
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

/**
 * Renders JournalInput with type-safe partial props for form-safety test scenarios.
 * @param overrides - Props replaced for the current scenario.
 * @returns The awaited React Native test renderer result.
 * @example
 * await renderJournalInput({ placeholder: 'Reflect on today' })
 */
const renderJournalInput = async (
  overrides: Partial<Parameters<typeof JournalInput>[0]> = {}
) => {
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
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate'],
    })
  })

  afterEach(async () => {
    await cleanup()
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
    let finishSave: () => void = () => undefined
    const onUpdate = jest.fn(() => new Promise<void>((resolve) => {
      finishSave = resolve
    }))
    const { getAllByText, getByTestId, queryByText, rerender } =
      await renderJournalInput({ onUpdate })

    // Act
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Persisted draft')
    await act(async () => {
      jest.advanceTimersByTime(JOURNAL_AUTOSAVE_DELAY_MS)
    })
    // Echo the persisted entry before its save promise settles, as the app store does.
    await rerender(
      <JournalInput
        date="2026-05-27"
        entry={{
          ...defaultEntry,
          note: 'Persisted draft',
          updatedAt: defaultEntry.updatedAt + 1,
        }}
        maxLength={500}
        onUpdate={onUpdate}
        placeholder="Write a note"
      />
    )
    await act(async () => {
      finishSave()
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

  it('saves a pending reflection to its original date when the day changes before autosave', async () => {
    // Arrange
    const savePreviousDay = jest.fn().mockResolvedValue(undefined)
    const saveNextDay = jest.fn().mockResolvedValue(undefined)
    const { getByTestId, rerender } = await render(
      <JournalInput
        key="2026-05-27"
        date="2026-05-27"
        entry={defaultEntry}
        onUpdate={savePreviousDay}
      />
    )
    await fireEvent.changeText(
      getByTestId('journal-text-input'),
      'Reflection just before midnight'
    )

    // Act
    await rerender(
      <JournalInput
        key="2026-05-28"
        date="2026-05-28"
        entry={null}
        onUpdate={saveNextDay}
      />
    )
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    // Assert
    expect(savePreviousDay).toHaveBeenCalledTimes(1)
    expect(savePreviousDay).toHaveBeenCalledWith('Reflection just before midnight')
    expect(saveNextDay).not.toHaveBeenCalled()
    expect(getByTestId('journal-text-input').props.value).toBe('')
  })

  it('does not save an unchanged reflection when its day closes', async () => {
    // Arrange
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    const { unmount } = await renderJournalInput({ onUpdate })

    // Act
    await unmount()

    // Assert
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('persists a reversal after an earlier autosave acknowledges different text', async () => {
    // Arrange
    let finishFirstSave: () => void = () => undefined
    const onUpdate = jest.fn()
      .mockImplementationOnce(() => new Promise<void>((resolve) => {
        finishFirstSave = resolve
      }))
      .mockResolvedValue(undefined)
    const { getByTestId, rerender, unmount } = await renderJournalInput({ onUpdate })
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Temporary reflection')
    await act(async () => {
      jest.advanceTimersByTime(JOURNAL_AUTOSAVE_DELAY_MS)
    })

    // Act
    await fireEvent.changeText(getByTestId('journal-text-input'), '')
    await rerender(
      <JournalInput
        date="2026-05-27"
        entry={{ ...defaultEntry, note: 'Temporary reflection' }}
        onUpdate={onUpdate}
      />
    )
    expect(getByTestId('journal-text-input').props.value).toBe('')
    await act(async () => {
      finishFirstSave()
      jest.advanceTimersByTime(JOURNAL_AUTOSAVE_DELAY_MS)
    })
    await unmount()

    // Assert
    expect(onUpdate).toHaveBeenCalledTimes(2)
    expect(onUpdate).toHaveBeenNthCalledWith(1, 'Temporary reflection')
    expect(onUpdate).toHaveBeenNthCalledWith(2, '')
  })

  it('flushes a reversal to its original day when midnight interrupts an earlier autosave', async () => {
    // Arrange
    let finishFirstSave: () => void = () => undefined
    const savePreviousDay = jest.fn()
      .mockImplementationOnce(() => new Promise<void>((resolve) => {
        finishFirstSave = resolve
      }))
      .mockResolvedValue(undefined)
    const saveNextDay = jest.fn().mockResolvedValue(undefined)
    const { getByTestId, rerender } = await render(
      <JournalInput key="2026-05-27" date="2026-05-27" entry={defaultEntry} onUpdate={savePreviousDay} />
    )
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Temporary reflection')
    await act(async () => {
      jest.advanceTimersByTime(JOURNAL_AUTOSAVE_DELAY_MS)
    })

    // Act
    await fireEvent.changeText(getByTestId('journal-text-input'), '')
    await rerender(
      <JournalInput key="2026-05-28" date="2026-05-28" entry={null} onUpdate={saveNextDay} />
    )
    expect(savePreviousDay).toHaveBeenCalledTimes(1)
    await act(async () => {
      finishFirstSave()
    })

    // Assert
    expect(savePreviousDay).toHaveBeenCalledTimes(2)
    expect(savePreviousDay).toHaveBeenLastCalledWith('')
    expect(saveNextDay).not.toHaveBeenCalled()
  })

  it('keeps the final draft when an acknowledgment matches it before a different queued save', async () => {
    // Arrange
    let finishFirstSave: () => void = () => undefined
    const onUpdate = jest.fn()
      .mockImplementationOnce(() => new Promise<void>((resolve) => {
        finishFirstSave = resolve
      }))
      .mockResolvedValue(undefined)
    const { getByTestId, rerender, unmount } = await renderJournalInput({ onUpdate })
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Final reflection')
    await act(async () => {
      jest.advanceTimersByTime(JOURNAL_AUTOSAVE_DELAY_MS)
    })
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Intermediate reflection')
    await act(async () => {
      jest.advanceTimersByTime(JOURNAL_AUTOSAVE_DELAY_MS)
    })

    // Act
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Final reflection')
    await rerender(
      <JournalInput
        date="2026-05-27"
        entry={{ ...defaultEntry, note: 'Final reflection' }}
        onUpdate={onUpdate}
      />
    )
    await unmount()
    await act(async () => {
      finishFirstSave()
    })

    // Assert
    expect(onUpdate).toHaveBeenCalledTimes(3)
    expect(onUpdate).toHaveBeenNthCalledWith(1, 'Final reflection')
    expect(onUpdate).toHaveBeenNthCalledWith(2, 'Intermediate reflection')
    expect(onUpdate).toHaveBeenNthCalledWith(3, 'Final reflection')
  })

  it('does not repeat a save when the latest draft returns to text already being saved', async () => {
    // Arrange
    let finishSave: () => void = () => undefined
    const onUpdate = jest.fn(() => new Promise<void>((resolve) => {
      finishSave = resolve
    }))
    const { getAllByText, getByTestId, unmount } = await renderJournalInput({ onUpdate })
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Final reflection')
    await act(async () => {
      jest.advanceTimersByTime(JOURNAL_AUTOSAVE_DELAY_MS)
    })

    // Act
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Temporary reflection')
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Final reflection')
    await fireEvent(getByTestId('journal-text-input'), 'blur')
    await act(async () => {
      finishSave()
      jest.advanceTimersByTime(JOURNAL_AUTOSAVE_DELAY_MS)
    })

    // Assert
    expect(getAllByText('journal.saved').length).toBeGreaterThan(0)
    await unmount()
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })

  it('does not duplicate an autosave already in progress when its day closes', async () => {
    // Arrange
    let finishSave: () => void = () => undefined
    const onUpdate = jest.fn(() => new Promise<void>((resolve) => {
      finishSave = resolve
    }))
    const { getByTestId, unmount } = await renderJournalInput({ onUpdate })
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Already saving')
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    expect(onUpdate).toHaveBeenCalledTimes(1)

    // Act
    await unmount()
    await act(async () => {
      finishSave()
    })

    // Assert
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate).toHaveBeenCalledWith('Already saving')
  })

  it('keeps the latest reflection last when its day closes during queued autosaves', async () => {
    // Arrange
    let finishFirstSave: () => void = () => undefined
    const onUpdate = jest.fn()
      .mockImplementationOnce(() => new Promise<void>((resolve) => {
        finishFirstSave = resolve
      }))
      .mockResolvedValue(undefined)
    const { getByTestId, unmount } = await renderJournalInput({ onUpdate })
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Earlier text')
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Queued reflection')
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Latest reflection')

    // Act
    await unmount()
    expect(onUpdate).toHaveBeenCalledTimes(1)
    await act(async () => {
      finishFirstSave()
    })

    // Assert
    expect(onUpdate).toHaveBeenCalledTimes(3)
    expect(onUpdate).toHaveBeenNthCalledWith(1, 'Earlier text')
    expect(onUpdate).toHaveBeenNthCalledWith(2, 'Queued reflection')
    expect(onUpdate).toHaveBeenNthCalledWith(3, 'Latest reflection')
  })
})
