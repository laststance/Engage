import React, { useImperativeHandle } from 'react'
import { act, cleanup, fireEvent, render } from '@testing-library/react-native'
import { ScrollView, TextInput, View } from 'react-native'
import { PresetTaskEditor } from '../PresetTaskEditor'

const scrollTo = jest.fn()
const measureInput = jest.fn()
const contentView = {}
let focusedInputId: string | null = null

describe('Preset editor input visibility while folding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    focusedInputId = null
    jest
      .spyOn(
        ScrollView as unknown as {
          render: React.ForwardRefRenderFunction<unknown>
        },
        'render'
      )
      .mockImplementation((props: React.ComponentProps<typeof ScrollView>, ref) => {
        useImperativeHandle(ref, () => ({
          scrollTo,
          getInnerViewRef: () => contentView,
        }))
        return <View {...props} />
      })
    jest
      .spyOn(
        TextInput as unknown as {
          render: React.ForwardRefRenderFunction<unknown>
        },
        'render'
      )
      .mockImplementation((props: React.ComponentProps<typeof TextInput>, ref) => {
        useImperativeHandle(ref, () => ({
          isFocused: () => props.testID === focusedInputId,
          measureLayout: measureInput,
        }))
        return React.createElement('TextInput', props)
      })
  })

  afterEach(async () => {
    await cleanup()
    jest.restoreAllMocks()
  })

  test('reveals focused minutes after closing the inner display without another keystroke', async () => {
    // Arrange: native focus remains, but the smaller outer display covers the field.
    measureInput.mockImplementation((_parent, callback) =>
      callback(30, 182, 526, 33)
    )
    const { getByTestId } = await render(
      <PresetTaskEditor
        isVisible
        tasks={[
          {
            id: 'walk',
            title: 'Walk',
            categoryId: 'life',
            defaultMinutes: 30,
            archived: false,
            createdAt: 1,
            updatedAt: 1,
          },
        ]}
        categories={[{ id: 'life', name: 'Life' }]}
        onSave={jest.fn()}
        onCancel={jest.fn()}
        onCreateCategory={jest.fn()}
      />
    )
    focusedInputId = 'task-minutes-input-0'
    await fireEvent(getByTestId('task-minutes-input-0'), 'focus')
    // Act: the outer viewport lays out while the same field retains focus.
    await fireEvent(getByTestId('preset-task-scroll-view'), 'layout', {
      nativeEvent: { layout: { x: 84, y: 136, width: 586, height: 296 } },
    })

    // Assert: the full field is moved above the keyboard and its draft stays intact.
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 166, animated: false })
    expect(getByTestId('task-minutes-input-0').props.value).toBe('30')

    // Arrange: an asynchronous measurement is still pending when the user scrolls.
    scrollTo.mockClear()
    let finishInputMeasurement:
      | ((x: number, y: number, width: number, height: number) => void)
      | undefined
    measureInput.mockImplementation((_parent, callback) => {
      finishInputMeasurement = callback
    })
    await fireEvent(getByTestId('preset-task-scroll-view'), 'layout', {
      nativeEvent: { layout: { x: 84, y: 136, width: 586, height: 296 } },
    })

    // Act: the user moves the viewport before the old geometry arrives.
    await fireEvent(getByTestId('preset-task-scroll-view'), 'scrollBeginDrag', {
      nativeEvent: { contentOffset: { x: 0, y: 140 } },
    })
    await act(async () => finishInputMeasurement?.(30, 182, 526, 33))

    // Assert: stale measurements cannot undo the user's scroll.
    expect(scrollTo).not.toHaveBeenCalled()

    // Arrange: the field has lost focus before another viewport change.
    focusedInputId = null
    measureInput.mockClear()

    // Act: reflow the unfocused editor.
    await fireEvent(getByTestId('preset-task-scroll-view'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 120, width: 375, height: 500 } },
    })

    // Assert: passive form browsing is left at the user's position.
    expect(measureInput).not.toHaveBeenCalled()
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
