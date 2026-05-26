export const DAILY_REMINDER_NOTIFICATION_ID = 'engage-daily-reminder'
export const DEFAULT_REMINDER_HOUR = 9
export const DEFAULT_REMINDER_MINUTE = 0
export const TIME_PART_PAD_LENGTH = 2

export const NOTIFICATION_TIME_PRESETS = [
  { hour: 8, minute: 0, labelKey: 'notifications.morning8' },
  { hour: 9, minute: 0, labelKey: 'notifications.morning9' },
  { hour: 12, minute: 0, labelKey: 'notifications.noon' },
  { hour: 18, minute: 0, labelKey: 'notifications.evening6' },
  { hour: 20, minute: 0, labelKey: 'notifications.night8' },
] as const
