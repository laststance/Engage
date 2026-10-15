import React, { useImperativeHandle } from 'react'
import { act, cleanup, fireEvent, render } from '@testing-library/react-native'
import { Keyboard, ScrollView, ScrollViewProps, View } from 'react-native'
import { DaySheet } from '../DaySheet'

const scrollTo = jest.fn()
const scrollToEnd = jest.fn()
const scrollViewMock = ScrollView as unknown as {
  render: React.ForwardRefRenderFunction<
    Pick<ScrollView, 'scrollTo' | 'scrollToEnd'>,
    ScrollViewProps
  >
}

describe('DaySheet journal keyboard visibility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate'] })
    jest.spyOn(scrollViewMock, 'render').mockImplementation((props, ref) => {
      useImperativeHandle(ref, () => ({ scrollTo, scrollToEnd }))
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

  test('keeps the writing area anchored when the keyboard opens and autosave adds feedback', async () => {
    // Arrange: the journal begins below the selected day's tasks.
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
    await fireEvent(getByTestId('journal-input-container'), 'layout', {
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
})
