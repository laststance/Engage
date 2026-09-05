import { act, cleanup, renderHook } from '@testing-library/react-native'
import { AppState, type AppStateStatus } from 'react-native'
import { useCurrentDay } from '../useCurrentDay'

describe('useCurrentDay', () => {
  let notifyAppStateChange: ((state: AppStateStatus) => void) | undefined
  const removeAppStateListener = jest.fn()

  beforeEach(() => {
    // Keep React's scheduling real so timer counts measure the midnight timer only.
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate'],
    })
    jest.setSystemTime(new Date(2026, 8, 5, 12))
    jest.clearAllMocks()
    AppState.currentState = 'active'
    notifyAppStateChange = undefined
    jest.mocked(AppState.addEventListener).mockImplementation((_, listener) => {
      notifyAppStateChange = listener
      return { remove: removeAppStateListener }
    })
  })

  afterEach(async () => {
    await cleanup()
    jest.useRealTimers()
  })

  it('changes Today to the next local date at midnight while the app stays open', async () => {
    // Arrange
    jest.setSystemTime(new Date(2026, 8, 5, 23, 59, 59))
    const { result } = await renderHook(() => useCurrentDay())
    expect(result.current.date).toBe('2026-09-05')

    // Act
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    // Assert
    expect(result.current).toEqual({
      date: '2026-09-06',
      appState: 'active',
    })
    expect(jest.getTimerCount()).toBe(1)
  })

  it('exposes same-day foreground returns so daily assignments can retry', async () => {
    // Arrange
    const { result } = await renderHook(() => useCurrentDay())
    await act(async () => {
      AppState.currentState = 'background'
      notifyAppStateChange?.('background')
    })
    expect(result.current.appState).toBe('background')
    expect(jest.getTimerCount()).toBe(0)

    // Act
    await act(async () => {
      AppState.currentState = 'active'
      notifyAppStateChange?.('active')
    })

    // Assert
    expect(result.current).toEqual({
      date: '2026-09-05',
      appState: 'active',
    })
    expect(jest.getTimerCount()).toBe(1)
  })

  it('uses the current local date when returning after multiple days away', async () => {
    // Arrange
    const { result } = await renderHook(() => useCurrentDay())
    await act(async () => {
      AppState.currentState = 'background'
      notifyAppStateChange?.('background')
    })
    jest.setSystemTime(new Date(2026, 8, 8, 9))

    // Act
    await act(async () => {
      AppState.currentState = 'active'
      notifyAppStateChange?.('active')
    })

    // Assert
    expect(result.current).toEqual({
      date: '2026-09-08',
      appState: 'active',
    })
    expect(jest.getTimerCount()).toBe(1)
  })

  it('keeps the snapshot stable when native events leave the day and visibility unchanged', async () => {
    // Arrange
    const { result } = await renderHook(() => useCurrentDay())
    const originalSnapshot = result.current
    jest.setSystemTime(new Date(2026, 8, 5, 12, 30))

    // Act
    await act(async () => {
      notifyAppStateChange?.('active')
    })

    // Assert
    expect(result.current).toBe(originalSnapshot)
    expect(jest.getTimerCount()).toBe(1)
  })

  it('shares native resources and releases them after the last day consumer unmounts', async () => {
    // Arrange
    const firstConsumer = await renderHook(() => useCurrentDay())
    const secondConsumer = await renderHook(() => useCurrentDay())
    expect(AppState.addEventListener).toHaveBeenCalledTimes(1)
    expect(jest.getTimerCount()).toBe(1)

    // Act
    await firstConsumer.unmount()

    // Assert
    expect(removeAppStateListener).not.toHaveBeenCalled()
    expect(jest.getTimerCount()).toBe(1)

    // Act
    await secondConsumer.unmount()

    // Assert
    expect(removeAppStateListener).toHaveBeenCalledTimes(1)
    expect(jest.getTimerCount()).toBe(0)
  })
})
