export interface Category {
  id: string
  name: string
}

export interface Task {
  id: string
  title: string
  categoryId: string
  defaultMinutes?: number
  archived: boolean
  createdAt: number
  updatedAt: number
}

export interface Entry {
  id: string
  date: string // YYYY-MM-DD
  note: string
  createdAt: number
  updatedAt: number
}

export interface Completion {
  id: string
  date: string // YYYY-MM-DD
  taskId: string
  minutes?: number
  createdAt: number
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
  totalTasks: number
  dailyAverage: number
  journalDays: number
  categoryBreakdown: Record<string, { completed: number; total: number }>
}
