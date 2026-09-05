import { useEffect } from 'react'
import { useCurrentDay } from '@/src/hooks/useCurrentDay'
import { useAppStore } from '@/src/stores/app-store'

/**
 * Synchronizes daily assignments when the root observes an initialized foreground day.
 * @returns No UI; requests routine refreshes after initialization, foregrounding, or midnight.
 * @example
 * <DailyTaskSynchronization />
 */
export function DailyTaskSynchronization() {
  const isInitialized = useAppStore((state) => state.isInitialized)
  const refreshDailyTasks = useAppStore((state) => state.refreshDailyTasks)
  const currentDay = useCurrentDay()

  useEffect(() => {
    // Wait for SQLite and presets before reacting to foregrounding or local midnight.
    if (isInitialized && currentDay.appState === 'active') {
      void refreshDailyTasks()
    }
  }, [currentDay.date, currentDay.appState, isInitialized, refreshDailyTasks])

  return null
}
