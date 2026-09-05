import type { ConditionLevel } from '@/src/types'

export const CONDITION_LEVELS: readonly ConditionLevel[] = [1, 2, 3, 4, 5]
export const CONDITION_ICON_SIZE_PX = 34
export const CONDITION_CALENDAR_ICON_SIZE_PX = 18
export const CONDITION_FACE_VIEWBOX = '0 0 40 40'
export const CONDITION_FACE_INK = '#22314d'

export const CONDITION_APPEARANCE = {
  1: { color: '#c6b7ea', mouth: 'M 13 29 Q 20 19 27 29', label: 'condition.veryLow' },
  2: { color: '#9cc4ee', mouth: 'M 14 27 Q 20 23 26 27', label: 'condition.low' },
  3: { color: '#f7d774', mouth: 'M 14 26 L 26 26', label: 'condition.okay' },
  4: { color: '#ffb58a', mouth: 'M 13 24 Q 20 33 27 24', label: 'condition.good' },
  5: { color: '#ff9ebe', mouth: 'M 12 23 L 28 23 Q 27 33 20 33 Q 13 33 12 23 Z', label: 'condition.great' },
} satisfies Record<ConditionLevel, { color: string; mouth: string; label: string }>
