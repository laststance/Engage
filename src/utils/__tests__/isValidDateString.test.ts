import { isValidDateString } from '@/src/utils/isValidDateString'

describe('calendar date validation', () => {
  it.each(['2026-02-28', '2024-02-29', '2000-02-29', '2026-12-31'])(
    'accepts the existing calendar date %s',
    (date) => {
      // Arrange / Act
      const isValid = isValidDateString(date)

      // Assert
      expect(isValid).toBe(true)
    }
  )

  it.each([
    '2026-02-31',
    '2026-02-29',
    '1900-02-29',
    '2026-04-31',
    '2026-13-01',
    '2026-00-01',
    '2026-01-00',
    '2026-2-01',
    '2026-02-01T00:00:00Z',
    '2026-02-01\n',
    '',
    null,
    undefined,
    20260201,
  ])('rejects nonexistent dates or invalid date values: %j', (date) => {
    // Arrange / Act
    const isValid = isValidDateString(date)

    // Assert
    expect(isValid).toBe(false)
  })
})
