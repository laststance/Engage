/// <reference types="node" />

import { createRequire } from 'node:module'

describe('Expo routing dependency compatibility', () => {
  it('keeps encoded route parameters readable after upgrading the URI decoder', () => {
    // Arrange
    // Use Node's actual resolver so Jest transforms cannot hide a module-format regression.
    const expoRouterRequire = createRequire(require.resolve('expo-router/package.json'))
    const queryString: { parse: (query: string) => Record<string, unknown> } = expoRouterRequire('query-string')

    // Act
    const parameters = queryString.parse('condition=%E5%A5%BD%E8%AA%BF&note=rest+day&raw=%C0%AF')

    // Assert
    expect({ ...parameters }).toEqual({ condition: '好調', note: 'rest day', raw: '%C0%AF' })
  })
})
