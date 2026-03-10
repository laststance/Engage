import { useCallback, useMemo } from 'react'
import { useAppStore } from '@/src/stores/app-store'
import { Task } from '@/src/types'

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
  const setTaskPickerVisible = useAppStore((state) => state.setTaskPickerVisible)
  const addTasksToDate = useAppStore((state) => state.addTasksToDate)
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

  const handleTaskSelectionPress = useCallback(
    () => setTaskPickerVisible(true),
    [setTaskPickerVisible],
  )

  const handleTaskPickerClose = useCallback(
    () => setTaskPickerVisible(false),
    [setTaskPickerVisible],
  )

  const handleTaskSelect = useCallback(
    async (taskIds: string[]) => {
      await addTasksToDate(date, taskIds)
      setTaskPickerVisible(false)
    },
    [date, addTasksToDate, setTaskPickerVisible],
  )

  const handleUpdatePresets = useCallback(
    async (tasks: Task[]) => updatePresetTasks(tasks),
    [updatePresetTasks],
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
    handleTaskSelectionPress,
    handleTaskPickerClose,
    handleTaskSelect,
    handleUpdatePresets,
    handleCreateCategory,
  }
}
