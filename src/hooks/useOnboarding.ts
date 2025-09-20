/**
 * Onboarding Hook
 * Manages first-run experience and user guidance state
 */

import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const ONBOARDING_KEYS = {
  COMPLETED: 'onboarding_completed',
  FIRST_LAUNCH: 'first_launch_completed',
  TOOLTIP_SEEN: 'tooltip_seen_',
  LOW_EFFORT_MODE: 'low_effort_mode_enabled',
} as const

interface OnboardingState {
  isFirstLaunch: boolean
  isOnboardingCompleted: boolean
  isLowEffortModeEnabled: boolean
  tooltipsSeen: Record<string, boolean>
}

interface OnboardingActions {
  completeOnboarding: () => Promise<void>
  completeFirstLaunch: () => Promise<void>
  markTooltipSeen: (tooltipId: string) => Promise<void>
  isTooltipSeen: (tooltipId: string) => boolean
  toggleLowEffortMode: () => Promise<void>
  resetOnboarding: () => Promise<void>
}

export const useOnboarding = (): OnboardingState & OnboardingActions => {
  const [state, setState] = useState<OnboardingState>({
    isFirstLaunch: true,
    isOnboardingCompleted: false,
    isLowEffortModeEnabled: false,
    tooltipsSeen: {},
  })

  // Load onboarding state on mount
  useEffect(() => {
    loadOnboardingState()
  }, [])

  const loadOnboardingState = async () => {
    try {
      const [firstLaunch, onboardingCompleted, lowEffortMode, tooltipData] =
        await Promise.all([
          AsyncStorage.getItem(ONBOARDING_KEYS.FIRST_LAUNCH),
          AsyncStorage.getItem(ONBOARDING_KEYS.COMPLETED),
          AsyncStorage.getItem(ONBOARDING_KEYS.LOW_EFFORT_MODE),
          AsyncStorage.getAllKeys().then((keys) =>
            AsyncStorage.multiGet(
              keys.filter((key) => key.startsWith(ONBOARDING_KEYS.TOOLTIP_SEEN))
            )
          ),
        ])

      // Parse tooltip data
      const tooltipsSeen: Record<string, boolean> = {}
      tooltipData.forEach(([key, value]) => {
        const tooltipId = key.replace(ONBOARDING_KEYS.TOOLTIP_SEEN, '')
        tooltipsSeen[tooltipId] = value === 'true'
      })

      setState({
        isFirstLaunch: firstLaunch !== 'true',
        isOnboardingCompleted: onboardingCompleted === 'true',
        isLowEffortModeEnabled: lowEffortMode === 'true',
        tooltipsSeen,
      })
    } catch (error) {
      console.error('Failed to load onboarding state:', error)
    }
  }

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true')
      setState((prev) => ({ ...prev, isOnboardingCompleted: true }))
    } catch (error) {
      console.error('Failed to save onboarding completion:', error)
    }
  }

  const completeFirstLaunch = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEYS.FIRST_LAUNCH, 'true')
      setState((prev) => ({ ...prev, isFirstLaunch: false }))
    } catch (error) {
      console.error('Failed to save first launch completion:', error)
    }
  }

  const markTooltipSeen = async (tooltipId: string) => {
    try {
      await AsyncStorage.setItem(
        `${ONBOARDING_KEYS.TOOLTIP_SEEN}${tooltipId}`,
        'true'
      )
      setState((prev) => ({
        ...prev,
        tooltipsSeen: { ...prev.tooltipsSeen, [tooltipId]: true },
      }))
    } catch (error) {
      console.error('Failed to save tooltip seen state:', error)
    }
  }

  const isTooltipSeen = (tooltipId: string): boolean => {
    return state.tooltipsSeen[tooltipId] || false
  }

  const toggleLowEffortMode = async () => {
    try {
      const newValue = !state.isLowEffortModeEnabled
      await AsyncStorage.setItem(
        ONBOARDING_KEYS.LOW_EFFORT_MODE,
        newValue.toString()
      )
      setState((prev) => ({ ...prev, isLowEffortModeEnabled: newValue }))
    } catch (error) {
      console.error('Failed to toggle low effort mode:', error)
    }
  }

  const resetOnboarding = async () => {
    try {
      // Get all onboarding-related keys
      const allKeys = await AsyncStorage.getAllKeys()
      const onboardingKeys = allKeys.filter((key) =>
        Object.values(ONBOARDING_KEYS).some((onboardingKey) =>
          key.includes(onboardingKey)
        )
      )

      // Remove all onboarding data
      await AsyncStorage.multiRemove(onboardingKeys)

      // Reset state
      setState({
        isFirstLaunch: true,
        isOnboardingCompleted: false,
        isLowEffortModeEnabled: false,
        tooltipsSeen: {},
      })
    } catch (error) {
      console.error('Failed to reset onboarding:', error)
    }
  }

  return {
    ...state,
    completeOnboarding,
    completeFirstLaunch,
    markTooltipSeen,
    isTooltipSeen,
    toggleLowEffortMode,
    resetOnboarding,
  }
}

export default useOnboarding
