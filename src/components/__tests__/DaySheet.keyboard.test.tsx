import React, { useImperativeHandle } from 'react'
import { act, cleanup, fireEvent, render } from '@testing-library/react-native'
import { Keyboard, Platform, ScrollView, ScrollViewProps, View } from 'react-native'
import { DaySheet } from '../DaySheet'

const scrollTo = jest.fn()
const scrollToEnd = jest.fn()
const measureInWindow = jest.fn()
const getNativeScrollRef = jest.fn()
const scrollViewMock = ScrollView as unknown as {
  render: React.ForwardRefRenderFunction<
    Pick<ScrollView, 'scrollTo' | 'scrollToEnd' | 'getNativeScrollRef'>,
    ScrollViewProps
  >
}

describe('DaySheet journal keyboard visibility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getNativeScrollRef.mockReturnValue({ measureInWindow })
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate'] })
    jest.spyOn(scrollViewMock, 'render').mockImplementation((props, ref) => {
      useImperativeHandle(ref, () => ({ scrollTo, scrollToEnd, getNativeScrollRef }))
      return (
        <View testID="journal-scroll-viewport" onLayout={props.onLayout}>
          {props.children}
        </View>
      )
    })
  })

  afterEach(async () => {
    await cleanup()
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  test('keeps the Android writing area anchored when the keyboard opens and autosave adds feedback', async () => {
    // Arrange: the journal begins below the selected day's tasks.
    jest.replaceProperty(Platform, 'OS', 'android')
    const { getByTestId } = await render(
      <DaySheet
        date="2026-10-15"
        tasks={[]}
        completions={[]}
        journalEntry={null}
        categories={[]}
        onTaskToggle={jest.fn()}
        onJournalUpdate={jest.fn().mockResolvedValue(undefined)}
        onConditionChangeAction={jest.fn()}
        onTaskSelectionPress={jest.fn()}
      />
    )
    await fireEvent(getByTestId('journal-scroll-anchor'), 'layout', {
      nativeEvent: { layout: { x: 16, y: 510, width: 343, height: 240 } },
    })

    // Act: focus, keyboard resize, and typing must target the editor, not its footer.
    await fireEvent(getByTestId('journal-text-input'), 'focus')
    const keyboardDidShow = jest.mocked(Keyboard.addListener).mock.calls.find(
      ([event]) => event === 'keyboardDidShow'
    )?.[1]
    expect(keyboardDidShow).toBeDefined()
    await act(async () => keyboardDidShow?.({} as Parameters<NonNullable<typeof keyboardDidShow>>[0]))
    await fireEvent(getByTestId('journal-scroll-viewport'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 375, height: 245 } },
    })
    await fireEvent.changeText(getByTestId('journal-text-input'), 'Hello')
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    // Assert: end-scrolling would lift the writing line above the modal header.
    expect(scrollTo).toHaveBeenCalledWith({ y: 510, animated: true })
    expect(scrollTo).toHaveBeenCalledTimes(3)
    expect(scrollToEnd).not.toHaveBeenCalled()
    expect(getByTestId('journal-text-input')).toBeVisible()
    expect(getByTestId('journal-save-feedback')).toBeVisible()

    // Act: blur leaves subsequent keyboard/layout changes under the user's control.
    await fireEvent(getByTestId('journal-text-input'), 'blur')
    scrollTo.mockClear()
    await act(async () => keyboardDidShow?.({} as Parameters<NonNullable<typeof keyboardDidShow>>[0]))
    await fireEvent(getByTestId('journal-scroll-viewport'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 375, height: 560 } },
    })

    // Assert
    expect(scrollTo).not.toHaveBeenCalled()
  })

  test('preserves native caret scrolling in compact views and shows the complete journal when it fits', async () => {
    // Arrange: measured heading plus writing box needs 208 points above the keyboard.
    const { getByTestId } = await render(
      <DaySheet
        date="2026-10-22"
        tasks={[]}
        completions={[]}
        journalEntry={null}
        categories={[]}
        onTaskToggle={jest.fn()}
        onJournalUpdate={jest.fn().mockResolvedValue(undefined)}
        onConditionChangeAction={jest.fn()}
        onTaskSelectionPress={jest.fn()}
      />
    )
    await fireEvent(getByTestId('journal-scroll-anchor'), 'layout', {
      nativeEvent: { layout: { x: 16, y: 510, width: 635, height: 240 } },
    })
    await fireEvent(getByTestId('journal-writing-area'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 32, width: 635, height: 176 } },
    })
    const keyboardDidChangeFrame = jest.mocked(Keyboard.addListener).mock.calls.find(
      ([event]) => event === 'keyboardDidChangeFrame'
    )?.[1]
    expect(keyboardDidChangeFrame).toBeDefined()
    const keyboardWillChangeFrame = jest.mocked(Keyboard.addListener).mock.calls.find(
      ([event]) => event === 'keyboardWillChangeFrame'
    )?.[1]
    const frame = {
      duration: 250,
      easing: 'keyboard',
      endCoordinates: { screenX: 0, screenY: 119, width: 667, height: 256 },
    } as Parameters<NonNullable<typeof keyboardDidChangeFrame>>[0]
    measureInWindow.mockImplementation((callback) => callback(0, 73.5, 667, 269.5))

    // Act: opening and resizing must leave native caret scrolling in control of a 45.5pt viewport.
    await fireEvent(getByTestId('journal-text-input'), 'focus')
    await act(async () => keyboardDidChangeFrame?.(frame))
    await fireEvent(getByTestId('journal-scroll-viewport'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 73.5, width: 667, height: 269.5 } },
    })
    await fireEvent(getByTestId('journal-text-input'), 'blur')
    await fireEvent(getByTestId('journal-text-input'), 'focus')

    // Assert: heading alignment would cover the first writing line with the Done bar.
    expect(scrollTo).not.toHaveBeenCalled()
    expect(scrollToEnd).not.toHaveBeenCalled()

    // Act: a settled portrait keyboard leaves enough room for the heading and entire editor.
    measureInWindow.mockImplementation((callback) => callback(0, 93, 375, 574))
    const portraitFrame = { ...frame, endCoordinates: { screenX: 0, screenY: 357, width: 375, height: 310 } }
    await act(async () => keyboardDidChangeFrame?.(portraitFrame))

    // Assert: no overlapping animation may move the caret after native keyboard positioning.
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 510, animated: false })

    // Act: rotation invalidates a delayed measurement of the previous keyboard frame.
    scrollTo.mockClear()
    let finishMeasurement: ((x: number, y: number, width: number, height: number) => void) | undefined
    measureInWindow.mockImplementation((callback) => { finishMeasurement = callback })
    await act(async () => keyboardDidChangeFrame?.(portraitFrame))
    await act(async () => keyboardWillChangeFrame?.(frame))
    await act(async () => finishMeasurement?.(0, 93, 375, 574))

    // Assert: stale portrait geometry must not overwrite landscape caret placement.
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
