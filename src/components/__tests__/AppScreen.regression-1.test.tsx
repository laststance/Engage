import React, { useState } from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { TextInput } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppScreen } from '../AppScreen'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(),
}))

// Regression: ISSUE-001 — lateral system regions overlap top-level screen content.
// Found by /qa on 2026-10-22
// Report: .gstack/qa-reports/iphone-duo/qa-report.md
describe('AppScreen resizing safe areas', () => {
  test('keeps content outside either side inset while preserving an in-progress draft', async () => {
    // Arrange: a folded display reserves space on the right edge.
    jest.mocked(useSafeAreaInsets).mockReturnValue({
      top: 24, right: 64, bottom: 20, left: 0,
    })
    function Draft() {
      const [value, setValue] = useState('')
      return <TextInput testID="draft" value={value} onChangeText={setValue} />
    }
    const screen = <AppScreen title="Today"><Draft /></AppScreen>
    const { getByTestId, rerender } = await render(screen)

    // Act
    await fireEvent.changeText(getByTestId('draft'), 'Keep this journal draft')

    // Assert: the navigator owns the bottom inset; the screen owns both sides.
    expect(getByTestId('draft').parent?.props.style).toEqual({
      paddingTop: 24, paddingLeft: 0, paddingRight: 64,
    })
    expect(getByTestId('draft')).toBeVisible()

    // Act: rotation moves the reserved region to the other edge without a restart.
    jest.mocked(useSafeAreaInsets).mockReturnValue({
      top: 0, right: 0, bottom: 20, left: 64,
    })
    await rerender(<AppScreen title="Today"><Draft /></AppScreen>)

    // Assert
    expect(getByTestId('draft').parent?.props.style).toEqual({
      paddingTop: 0, paddingLeft: 64, paddingRight: 0,
    })
    expect(getByTestId('draft').props.value).toBe('Keep this journal draft')

    // Act: fully opening the display releases both side insets.
    jest.mocked(useSafeAreaInsets).mockReturnValue({
      top: 24, right: 0, bottom: 20, left: 0,
    })
    await rerender(<AppScreen title="Today"><Draft /></AppScreen>)

    // Assert
    expect(getByTestId('draft').parent?.props.style).toEqual({
      paddingTop: 24, paddingLeft: 0, paddingRight: 0,
    })
    expect(getByTestId('draft').props.value).toBe('Keep this journal draft')
  })
})
