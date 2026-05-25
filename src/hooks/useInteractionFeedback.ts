import { useCallback } from 'react'
import * as Haptics from 'expo-haptics'

export type InteractionFeedbackKind =
  | 'none'
  | 'select'
  | 'complete'
  | 'undo'
  | 'error'

/**
 * Triggers the mobile feedback that matches a user interaction intent.
 * @param feedback - The intent to translate into a haptic feedback call.
 * @returns A promise that always resolves, even when haptics are unavailable.
 * @example
 * await triggerInteractionFeedback('complete')
 */
export async function triggerInteractionFeedback(
  feedback: InteractionFeedbackKind
): Promise<void> {
  try {
    if (feedback === 'select') {
      await Haptics.selectionAsync()
      return
    }

    if (feedback === 'complete') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      return
    }

    if (feedback === 'undo') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      return
    }

    if (feedback === 'error') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  } catch (error) {
    console.warn('Haptic feedback unavailable:', error)
  }
}

/**
 * Provides a stable haptic trigger for pressable controls.
 * @returns A callback that maps an interaction intent to safe haptic feedback.
 * @example
 * const triggerFeedback = useInteractionFeedback()
 * triggerFeedback('select')
 */
export function useInteractionFeedback() {
  return useCallback((feedback: InteractionFeedbackKind) => {
    void triggerInteractionFeedback(feedback)
  }, [])
}
