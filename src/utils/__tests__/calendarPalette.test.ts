import { DesignSystem } from '@/constants/design-system'

const tailwindConfig = jest.requireActual<{
  theme: { extend: { colors: Record<string, string> } }
}>('@/tailwind.config.js')

/**
 * Value: protects=calendar completion colors agree across native and utility styles;
 * fails_when=one palette retains the old dark greens or maps a bucket incorrectly;
 * why_new=render tests do not load the utility color configuration;
 * seam=none; no_claim=native visual rendering or perceptual color distinction.
 */
describe('Calendar completion palette', () => {
  test.each([
    [0, 'heatmap-none', '#F3F4F6'],
    [1, 'heatmap-low', '#E6F1E9'],
    [2, 'heatmap-medium', '#C8DFCF'],
    [3, 'heatmap-high', '#A9CBB6'],
    [4, 'heatmap-highest', '#84B59A'],
    [7, 'heatmap-highest', '#84B59A'],
  ] as const)('keeps %i completions in the same soft-sage bucket across styling paths', (count, alias, expected) => {
    // Arrange
    const utilityColor = tailwindConfig.theme.extend.colors[alias]

    // Act
    const nativeColor = DesignSystem.utils.getHeatmapColor(count)

    // Assert
    expect(nativeColor).toBe(expected)
    expect(utilityColor).toBe(expected)
  })
})
