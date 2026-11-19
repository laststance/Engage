export interface Category {
  id: string
  name: string
}

export interface Task {
  id: string
  title: string
  categoryId: string
  defaultMinutes?: number
  dailyAutoAddFrom?: string // YYYY-MM-DD; undefined disables daily assignment
  archived: boolean
  createdAt: number
  updatedAt: number
}

export type ConditionLevel = 1 | 2 | 3 | 4 | 5

export interface NewPresetTodayAssignment {
  date: string // Local date when Save was pressed.
  draftTaskIds: string[]
}

export interface Entry {
  id: string
  date: string // YYYY-MM-DD
  note: string
  conditionLevel?: ConditionLevel | null // Missing in older backups; null means unrecorded.
  createdAt: number
  updatedAt: number
}

export interface DailyTaskApplication {
  date: string // YYYY-MM-DD
  taskId: Task['id']
}

export interface Completion {
  id: string
  date: string // YYYY-MM-DD
  taskId: string
  taskCategoryId?: Category['id'] // Task category when loaded alongside the assignment.
  minutes?: number
  completed: boolean
  createdAt: number
}

export type TaskCompletionChange = 'completed' | 'undone'

export interface TaskCompletionOperationResult {
  success: boolean
  date: string
  taskId: string
  change: TaskCompletionChange
  message?: string
}

export interface TaskAssignmentOperationResult {
  success: boolean
  date: string
  addedCount: number
  removedCount: number
  message?: string
}

export interface DayData {
  date: string
  tasks: Task[]
  completions: Completion[]
  entry: Entry | null
}

export interface StatsData {
  streakDays: number
  completionRate: number
  activeDays: number
  totalTasks: number // Completed task-day assignments
  assignedTasks: number // All task-day assignments in the period
  periodDays: number // Calendar days in the period
  dailyAverage: number
  journalDays: number
  categoryBreakdown: Record<string, { completed: number; total: number }>
}
