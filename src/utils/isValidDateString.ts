/**
 * Rejects nonexistent calendar dates when database operations or backup validation receive a date value.
 * @param value - The untrusted value expected to contain a YYYY-MM-DD calendar date.
 * @returns True only for an exactly formatted date that exists in the Gregorian calendar.
 * @example isValidDateString('2024-02-29') // => true; isValidDateString('2026-02-31') // => false
 */
export function isValidDateString(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  // UTC avoids daylight-saving gaps; comparing the result rejects normalized dates such as February 31.
  const parsedDate = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().split('T')[0] === value
}
