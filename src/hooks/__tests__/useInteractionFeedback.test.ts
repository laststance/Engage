import * as Haptics from 'expo-haptics'
import { triggerInteractionFeedback } from '../useInteractionFeedback'

describe('triggerInteractionFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('plays selection haptics when a selectable item changes', async () => {
    // Arrange
    const selectionAsync = Haptics.selectionAsync as jest.Mock

    // Act
    await triggerInteractionFeedback('select')

    // Assert
    expect(selectionAsync).toHaveBeenCalledTimes(1)
  })

  test('plays success notification haptics when a task is completed', async () => {
    // Arrange
    const notificationAsync = Haptics.notificationAsync as jest.Mock

    // Act
    await triggerInteractionFeedback('complete')

    // Assert
    expect(notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success
    )
  })

  test('plays light impact haptics when a completion is undone', async () => {
    // Arrange
    const impactAsync = Haptics.impactAsync as jest.Mock

    // Act
    await triggerInteractionFeedback('undo')

    // Assert
    expect(impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
  })

  test('plays error notification haptics when an action fails', async () => {
    // Arrange
    const notificationAsync = Haptics.notificationAsync as jest.Mock

    // Act
    await triggerInteractionFeedback('error')

    // Assert
    expect(notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Error
    )
  })

  test('keeps press handling alive when haptics reject', async () => {
    // Arrange
    const selectionAsync = Haptics.selectionAsync as jest.Mock
    selectionAsync.mockRejectedValueOnce(new Error('Haptics unavailable'))

    // Act
    await expect(triggerInteractionFeedback('select')).resolves.toBeUndefined()

    // Assert
    expect(selectionAsync).toHaveBeenCalledTimes(1)
  })
})
