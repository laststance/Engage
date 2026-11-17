/// <reference types="node" />

import { createRequire } from 'node:module'

describe('Expo routing dependency compatibility', () => {
  test('keeps encoded route parameters readable with Expo Router 58', () => {
    // Arrange
    // SDK 58 uses its own parser; Node's resolver verifies the shipped module without Jest transforms.
    const expoRouterRequire = createRequire(require.resolve('expo-router/package.json'))
    const { parseQueryParams }: { parseQueryParams: (path: string, route: { name: string }) => Record<string, unknown> } = expoRouterRequire('./build/fork/getStateFromPath-forks')

    // Act
    const parameters = parseQueryParams('/journal?condition=%E5%A5%BD%E8%AA%BF&note=rest+day&raw=%C0%AF', { name: 'journal' })

    // Assert: malformed UTF-8 follows SDK 58's URLSearchParams replacement-character behavior.
    expect({ ...parameters }).toEqual({ condition: '好調', note: 'rest day', raw: '��' })
  })
})
