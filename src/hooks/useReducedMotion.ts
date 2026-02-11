import { useState, useEffect } from 'react'
import { AccessibilityInfo } from 'react-native'

/**
 * Hook to detect if the user prefers reduced motion via system accessibility settings.
 * @returns true if the user has enabled "Reduce Motion" in system settings
 * @example
 * const prefersReducedMotion = useReducedMotion()
 * const animationDuration = prefersReducedMotion ? 0 : 300
 */
export function useReducedMotion(): boolean {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotionEnabled)

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotionEnabled
    )

    return () => subscription.remove()
  }, [])

  return reduceMotionEnabled
}
