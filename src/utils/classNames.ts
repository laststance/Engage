/**
 * Joins optional NativeWind class fragments without leaking falsey values.
 * @param values - Class name fragments that may be empty during conditional styling.
 * @returns A single space-separated class string.
 * @example
 * classNames('bg-white', false, 'p-4') // => 'bg-white p-4'
 */
export function classNames(
  ...values: (string | false | null | undefined)[]
): string {
  return values.filter(Boolean).join(' ')
}
