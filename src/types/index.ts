export interface Task {
  id: string
  title: string
  category: 'business' | 'life'
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
  categoryBreakdown: {
    business: { completed: number; total: number }
    life: { completed: number; total: number }
  }
}
