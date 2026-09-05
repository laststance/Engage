import { useState } from 'react'
import { act, fireEvent, render } from '@testing-library/react-native'
import { ConditionPicker } from '../ConditionPicker'
import type { ConditionLevel } from '@/src/types'

describe('daily condition picker', () => {
  it('starts unrecorded with all five choices visible and no selected default', async () => {
    // Arrange
    const save = jest.fn().mockResolvedValue(true)

    // Act
    const screen = await render(<ConditionPicker value={null} onChangeAction={save} />)

    // Assert
    expect(screen.getAllByRole('radio')).toHaveLength(5)
    expect(screen.getByRole('radio', { name: 'condition.okay' })).not.toBeChecked()
    expect(screen.getByText('condition.unrecorded')).toBeVisible()
    expect(screen.getByTestId('condition-clear')).toBeDisabled()
    expect(save).not.toHaveBeenCalled()
  })

  it('records Good with one press and clears it only through the explicit Clear action', async () => {
    // Arrange
    const save = jest.fn<Promise<boolean>, [ConditionLevel | null]>().mockResolvedValue(true)
    /**
     * Mirrors the persisted parent value when this test exercises successful picker changes.
     * @returns A picker driven by its parent's saved value.
     * @example <DailyRecord />
     */
    function DailyRecord() {
      const [level, setLevel] = useState<ConditionLevel | null>(null)
      return <ConditionPicker value={level} onChangeAction={async (nextLevel) => {
        const saved = await save(nextLevel)
        if (saved) setLevel(nextLevel)
        return saved
      }} />
    }
    const screen = await render(<DailyRecord />)

    // Act
    await fireEvent.press(screen.getByRole('radio', { name: 'condition.good' }))
    await fireEvent.press(screen.getByRole('radio', { name: 'condition.good' }))

    // Assert
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith(4)
    expect(screen.getByRole('radio', { name: 'condition.good' })).toBeChecked()

    // Act
    await fireEvent.press(screen.getByTestId('condition-clear'))

    // Assert
    expect(save).toHaveBeenLastCalledWith(null)
    expect(screen.getByText('condition.unrecorded')).toBeVisible()
    expect(screen.getByRole('radio', { name: 'condition.good' })).not.toBeChecked()
  })

  it('shows the tapped face while saving, then restores the saved face and allows retry on failure', async () => {
    // Arrange
    let finishSave: (success: boolean) => void = () => undefined
    const save = jest.fn(() => new Promise<boolean>((resolve) => { finishSave = resolve }))
    const screen = await render(<ConditionPicker value={4} onChangeAction={save} />)

    // Act
    await fireEvent.press(screen.getByRole('radio', { name: 'condition.low' }))

    // Assert
    expect(screen.getByRole('radio', { name: 'condition.low' })).toBeChecked()
    expect(screen.getByText('common.saving')).toBeVisible()
    expect(screen.getByTestId('condition-clear')).toBeDisabled()

    // Act
    await act(async () => { finishSave(false) })

    // Assert
    expect(screen.getByRole('radio', { name: 'condition.good' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'condition.low' })).toBeEnabled()
    expect(screen.getByText('condition.saveFailed')).toBeVisible()
  })

  it('keeps the saved face visible when clearing fails', async () => {
    // Arrange
    const screen = await render(<ConditionPicker value={2} onChangeAction={jest.fn().mockRejectedValue(new Error('Disk full'))} />)

    // Act
    await fireEvent.press(screen.getByTestId('condition-clear'))

    // Assert
    expect(screen.getByRole('radio', { name: 'condition.low' })).toBeChecked()
    expect(screen.getByText('condition.saveFailed')).toBeVisible()
  })

  it('blocks recording until initialization finishes', async () => {
    // Arrange
    const save = jest.fn()
    const screen = await render(<ConditionPicker value={null} onChangeAction={save} disabled />)

    // Act
    await fireEvent.press(screen.getByRole('radio', { name: 'condition.great' }))

    // Assert
    expect(save).not.toHaveBeenCalled()
    expect(screen.getByRole('radio', { name: 'condition.great' })).toBeDisabled()
  })
})
