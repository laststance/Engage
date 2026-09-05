import { useSyncExternalStore } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { getCurrentDate } from '@/src/utils/dateUtils'

interface CurrentDaySnapshot {
  readonly date: string
  readonly appState: AppStateStatus | null
}

const listeners = new Set<() => void>()
let currentDaySnapshot: CurrentDaySnapshot | undefined
let midnightTimeout: ReturnType<typeof setTimeout> | undefined
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | undefined

/**
 * Supplies root synchronization and Today with the local day whenever time or app visibility changes.
 * @returns The cached local date and native app state.
 * @example
 * const { date, appState } = useCurrentDay() // => { date: '2026-09-05', appState: 'active' }
 */
export function useCurrentDay(): CurrentDaySnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * Reads the native clock for React while preserving snapshot identity until either observed value changes.
 * @returns The same snapshot reference while the local date and app state stay unchanged.
 * @example
 * getSnapshot().date // => '2026-09-05'
 */
function getSnapshot(): CurrentDaySnapshot {
  const date = getCurrentDate()
  const appState = AppState.currentState

  // React compares snapshots by identity, so unchanged native values reuse their object.
  if (
    currentDaySnapshot?.date !== date ||
    currentDaySnapshot.appState !== appState
  ) {
    currentDaySnapshot = { date, appState }
  }

  return currentDaySnapshot
}

/**
 * Rearms the next local midnight when subscriptions, foreground transitions, or the prior timer trigger it.
 * @returns Nothing; one timer remains scheduled only while the app is active.
 * @example
 * scheduleMidnight() // => schedules the next local 00:00, including daylight-saving changes
 */
function scheduleMidnight(): void {
  clearTimeout(midnightTimeout)
  midnightTimeout = undefined

  // Background work resumes from the native visibility event instead of a suspended timer.
  if (AppState.currentState !== 'active') {
    return
  }

  const now = new Date()
  const nextMidnight = new Date(now)
  nextMidnight.setHours(24, 0, 0, 0)
  midnightTimeout = setTimeout(
    refreshCurrentDay,
    nextMidnight.getTime() - now.getTime()
  )
}

/**
 * Notifies React consumers when AppState or the midnight timer signals a possible day change.
 * @returns Nothing; listeners read the refreshed snapshot and the timer targets the next midnight.
 * @example
 * refreshCurrentDay() // => Today observes the new date after foregrounding
 */
function refreshCurrentDay(): void {
  getSnapshot()
  scheduleMidnight()

  // Every mounted consumer shares the same native listener and midnight timer.
  listeners.forEach((listener) => listener())
}

/**
 * Connects React to the native day source on first subscription and releases it after the last consumer leaves.
 * @param listener - React's callback for checking whether the current snapshot changed.
 * @returns A cleanup callback that removes this consumer and any now-unused native resources.
 * @example
 * const unsubscribe = subscribe(onDayChange); unsubscribe()
 */
function subscribe(listener: () => void): () => void {
  listeners.add(listener)

  // Multiple day consumers must not create duplicate AppState listeners or timers.
  if (listeners.size === 1) {
    appStateSubscription = AppState.addEventListener('change', refreshCurrentDay)
    scheduleMidnight()
  }

  return () => {
    listeners.delete(listener)

    // Release native resources only after the final subscribed screen unmounts.
    if (listeners.size === 0) {
      appStateSubscription?.remove()
      appStateSubscription = undefined
      clearTimeout(midnightTimeout)
      midnightTimeout = undefined
    }
  }
}
