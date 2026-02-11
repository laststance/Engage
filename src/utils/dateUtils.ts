/**
 * Date utility functions for the Engage app
 */

/**
 * Formats a Date object to YYYY-MM-DD string using local timezone.
 * @param date - The date to format
 * @returns Local date string in YYYY-MM-DD format
 * @example
 * formatDate(new Date(2026, 1, 12)) // => "2026-02-12" (always local, not UTC)
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const parseDate = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00.000Z')
}

export const getCurrentDate = (): string => {
  return formatDate(new Date())
}

export const getWeekStartDate = (date: Date): string => {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
  return formatDate(start)
}

export const getWeekEndDate = (date: Date): string => {
  const end = new Date(date)
  end.setDate(date.getDate() + (6 - date.getDay())) // End of week (Saturday)
  return formatDate(end)
}

export const getMonthStartDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = date.getMonth()
  return `${year}-${(month + 1).toString().padStart(2, '0')}-01`
}

export const getMonthEndDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  return `${year}-${(month + 1).toString().padStart(2, '0')}-${lastDay
    .toString()
    .padStart(2, '0')}`
}

export const getDaysInRange = (
  startDate: string,
  endDate: string
): string[] => {
  const days: string[] = []
  const start = parseDate(startDate)
  const end = parseDate(endDate)

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    days.push(formatDate(date))
  }

  return days
}

export const isToday = (dateString: string): boolean => {
  return dateString === getCurrentDate()
}

export const isYesterday = (dateString: string): boolean => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return dateString === formatDate(yesterday)
}

export const daysBetween = (date1: string, date2: string): number => {
  const d1 = parseDate(date1)
  const d2 = parseDate(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
