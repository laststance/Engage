import { useCallback, useMemo } from 'react'
import { useAppStore } from '@/src/stores/app-store'
import { ConditionLevel, Task } from '@/src/types'
import { getCurrentDate } from '@/src/utils/dateUtils'

/**
 * Shared hook for day-view screens (TodayScreen and DayModal).
 * Encapsulates store selectors, task filtering, and common handlers.
 * @param date - Target date in YYYY-MM-DD format
 * @returns Data and handlers for DaySheet + TaskPicker
 * @example
 * const day = useDayView('2026-03-10')
 * <DaySheet tasks={day.assignedTasks} completions={day.dayCompletions} ... />
 * <TaskPicker selectedTasks={day.selectedTaskIds} presetTasks={day.allTasks} ... />
 */
export function useDayView(date: string) {
  // Store selectors (individual for render optimization)
  const categories = useAppStore((state) => state.categories)
  const allTasks = useAppStore((state) => state.tasks)
  const completions = useAppStore((state) => state.completions)
  const entries = useAppStore((state) => state.entries)
  const isTaskPickerVisible = useAppStore((state) => state.isTaskPickerVisible)
  const toggleTaskCompletion = useAppStore((state) => state.toggleTaskCompletion)
  const updateJournalEntry = useAppStore((state) => state.updateJournalEntry)
  const updateCondition = useAppStore((state) => state.updateCondition)
  const setTaskPickerVisible = useAppStore((state) => state.setTaskPickerVisible)
  const addTasksToDate = useAppStore((state) => state.addTasksToDate)
  const refreshDailyTasks = useAppStore((state) => state.refreshDailyTasks)
  const updatePresetTasks = useAppStore((state) => state.updatePresetTasks)
  const createCategory = useAppStore((state) => state.createCategory)

  // Derived state
  const dayCompletions = useMemo(
    () => completions[date] || [],
    [completions, date],
  )
  const dayEntry = useMemo(
    () => entries[date] || null,
    [entries, date],
  )
  const assignedTaskIds = useMemo(
    () => new Set(dayCompletions.map((c) => c.taskId)),
    [dayCompletions],
  )
  const assignedTasks = useMemo(
    () => allTasks.filter((task) => assignedTaskIds.has(task.id)),
    [allTasks, assignedTaskIds],
  )
  const selectedTaskIds = useMemo(
    () => dayCompletions.map((c) => c.taskId),
    [dayCompletions],
  )

  // Handlers
  const handleTaskToggle = useCallback(
    (taskId: string) => toggleTaskCompletion(date, taskId),
    [date, toggleTaskCompletion],
  )

  const handleJournalUpdate = useCallback(
    async (content: string) => updateJournalEntry(date, content),
    [date, updateJournalEntry],
  )

  /**
   * Captures the visible date when DaySheet saves or clears its condition.
   * @param level - The selected level or null to clear it.
   * @returns Whether that day's condition was persisted.
   * @example await handleConditionChangeAction(4) // => updates this day even after navigation
   */
  const handleConditionChangeAction = useCallback(
    (level: ConditionLevel | null) => updateCondition(date, level),
    [date, updateCondition],
  )

  const handleTaskSelectionPress = useCallback(
    async () => {
      // Calendar's current-day picker also needs completed routine synchronization before taking its draft.
      if (date === getCurrentDate() && !await refreshDailyTasks()) return
      setTaskPickerVisible(true)
    },
    [date, refreshDailyTasks, setTaskPickerVisible],
  )

  const handleTaskPickerClose = useCallback(
    () => setTaskPickerVisible(false),
    [setTaskPickerVisible],
  )

  const handleTaskSelect = useCallback(
    async (taskIds: string[]) => {
      return await addTasksToDate(date, taskIds)
    },
    [date, addTasksToDate],
  )

  const handleUpdatePresets = useCallback(
    async (tasks: Task[]) => updatePresetTasks(tasks),
    [updatePresetTasks],
  )

  /**
   * Deletes one preset from every day view when TaskPicker's swipe action is confirmed.
   * @param taskId - The persisted preset task ID to remove.
   * @returns A promise that settles after the shared preset list is persisted.
   * @example
   * await handleDeletePresetTask('task-1') // => task-1 is removed from TaskPicker
   */
  const handleDeletePresetTask = useCallback(
    async (taskId: string): Promise<void> => {
      // Submit the remaining source-of-truth list through the existing preset reconciler.
      await updatePresetTasks(allTasks.filter((task) => task.id !== taskId))
    },
    [allTasks, updatePresetTasks],
  )

  const handleCreateCategory = useCallback(
    async (name: string) => createCategory({ name }),
    [createCategory],
  )

  return {
    // Data
    categories,
    allTasks,
    assignedTasks,
    dayCompletions,
    dayEntry,
    selectedTaskIds,
    isTaskPickerVisible,
    // Handlers
    handleTaskToggle,
    handleJournalUpdate,
    handleConditionChangeAction,
    handleTaskSelectionPress,
    handleTaskPickerClose,
    handleTaskSelect,
    handleUpdatePresets,
    handleDeletePresetTask,
    handleCreateCategory,
  }
}
