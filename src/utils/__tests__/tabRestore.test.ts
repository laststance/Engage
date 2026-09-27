import {
  decideTabRestore,
  observeTabBeforeHydration,
} from '@/src/utils/tabRestore'

describe('saved tab restore', () => {
  test('leaves the route alone until storage hydration finishes', () => {
    // Arrange
    const input = {
      hydrationSettled: false,
      restored: false,
      visible: 'today' as const,
      saved: 'stats' as const,
      chosenBeforeHydration: null,
    }

    // Act
    const decision = decideTabRestore(input)

    // Assert
    expect(decision).toEqual({ type: 'pending' })
  })

  test('does not replace a modal with the saved tab', () => {
    // Arrange
    const input = {
      hydrationSettled: true,
      restored: false,
      visible: null,
      saved: 'stats' as const,
      chosenBeforeHydration: null,
    }

    // Act
    const decision = decideTabRestore(input)

    // Assert
    expect(decision).toEqual({ type: 'pending' })
  })

  test('returns to the saved tab when the screen is still the default route', () => {
    // Arrange
    const input = {
      hydrationSettled: true,
      restored: false,
      visible: 'calendar' as const,
      saved: 'stats' as const,
      chosenBeforeHydration: null,
    }

    // Act
    const decision = decideTabRestore(input)

    // Assert
    expect(decision).toEqual({ type: 'replace', tab: 'stats' })
  })

  test('keeps the tab opened before hydration finishes', () => {
    // Arrange
    const input = {
      hydrationSettled: true,
      restored: false,
      visible: 'today' as const,
      saved: 'stats' as const,
      chosenBeforeHydration: 'today' as const,
    }

    // Act
    const decision = decideTabRestore(input)

    // Assert
    expect(decision).toEqual({ type: 'sync', tab: 'today' })
  })

  test('navigates to the early tab when the route has not caught up', () => {
    // Arrange
    const input = {
      hydrationSettled: true,
      restored: false,
      visible: 'calendar' as const,
      saved: 'stats' as const,
      chosenBeforeHydration: 'today' as const,
    }

    // Act
    const decision = decideTabRestore(input)

    // Assert
    expect(decision).toEqual({ type: 'replace', tab: 'today' })
  })

  test('writes a later tab change after the saved tab was restored', () => {
    // Arrange
    const input = {
      hydrationSettled: true,
      restored: true,
      visible: 'today' as const,
      saved: 'stats' as const,
      chosenBeforeHydration: null,
    }

    // Act
    const decision = decideTabRestore(input)

    // Assert
    expect(decision).toEqual({ type: 'sync', tab: 'today' })
  })

  test('does not treat the first route as a tap', () => {
    // Arrange / Act
    const observed = observeTabBeforeHydration(null, undefined, 'calendar')

    // Assert
    expect(observed).toEqual({ choice: null, seen: 'calendar' })
  })

  test('remembers a tab change that happens before hydration', () => {
    // Arrange
    const first = observeTabBeforeHydration(null, undefined, 'calendar')

    // Act
    const observed = observeTabBeforeHydration(first.choice, first.seen, 'today')

    // Assert
    expect(observed).toEqual({ choice: 'today', seen: 'today' })
  })
})
