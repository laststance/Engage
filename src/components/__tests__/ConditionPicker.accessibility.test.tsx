import { AccessibilityInfo, Platform } from 'react-native'
import { act, fireEvent, render } from '@testing-library/react-native'
import { ConditionPicker } from '@/src/components/ConditionPicker'

describe('daily condition save announcements', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.replaceProperty(Platform, 'OS', 'ios')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('announces a persisted selection only after saving finishes', async () => {
    // Arrange
    let finishSave: (success: boolean) => void = () => undefined
    const save = jest.fn(() => new Promise<boolean>((resolve) => { finishSave = resolve }))
    const screen = await render(<ConditionPicker value={null} onChangeAction={save} />)

    // Act
    await fireEvent.press(screen.getByTestId('condition-option-4'))

    // Assert
    expect(screen.getByText('common.saving')).toBeVisible()
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled()

    // Act
    await act(async () => { finishSave(true) })

    // Assert
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledTimes(1)
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('condition.saved')
  })

  it('announces a rejected save while preserving the previously recorded face', async () => {
    // Arrange
    const screen = await render(<ConditionPicker value={4} onChangeAction={jest.fn().mockResolvedValue(false)} />)

    // Act
    await fireEvent.press(screen.getByTestId('condition-option-2'))

    // Assert
    expect(screen.getByTestId('condition-option-4')).toBeChecked()
    expect(screen.getByText('condition.saveFailed')).toBeVisible()
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('condition.saveFailed')
  })

  it('announces a failed clear while keeping the recorded condition available to retry', async () => {
    // Arrange
    const screen = await render(<ConditionPicker value={4} onChangeAction={jest.fn().mockRejectedValue(new Error('Disk full'))} />)

    // Act
    await fireEvent.press(screen.getByTestId('condition-clear'))

    // Assert
    expect(screen.getByTestId('condition-option-4')).toBeChecked()
    expect(screen.getByTestId('condition-clear')).toBeEnabled()
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('condition.saveFailed')
  })

  it('announces that the condition is unrecorded after clearing succeeds', async () => {
    // Arrange
    const screen = await render(<ConditionPicker value={4} onChangeAction={jest.fn().mockResolvedValue(true)} />)

    // Act
    await fireEvent.press(screen.getByTestId('condition-clear'))

    // Assert
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('condition.unrecorded')
  })

  it('keeps Android save feedback in its live region without a duplicate announcement', async () => {
    // Arrange
    jest.replaceProperty(Platform, 'OS', 'android')
    const screen = await render(<ConditionPicker value={null} onChangeAction={jest.fn().mockResolvedValue(true)} />)

    // Act
    await fireEvent.press(screen.getByTestId('condition-option-4'))

    // Assert
    expect(screen.getByTestId('condition-save-status')).toHaveProp('accessibilityLiveRegion', 'polite')
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled()
  })
})
