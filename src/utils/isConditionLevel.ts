/**
 * Validates untrusted condition values when database writes or backup validation receive daily records.
 * @param value - A value from a caller or imported backup.
 * @returns Whether the value is one of the five supported condition levels.
 * @example isConditionLevel(4) // => true; isConditionLevel('4') // => false
 */
export function isConditionLevel(value: unknown) {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
}
