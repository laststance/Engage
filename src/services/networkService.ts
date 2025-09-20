import NetInfo from '@react-native-community/netinfo'
import { DatabaseError } from './database'

export interface NetworkState {
  isConnected: boolean
  isInternetReachable: boolean | null
  type: string
}

export interface NetworkServiceConfig {
  enableLogging?: boolean
  retryAttempts?: number
  retryDelay?: number
}

/**
 * Service for managing network connectivity detection and offline handling
 */
export class NetworkService {
  private isConnected: boolean = true
  private isInternetReachable: boolean | null = null
  private listeners: ((state: NetworkState) => void)[] = []
  private config: Required<NetworkServiceConfig>

  constructor(config: NetworkServiceConfig = {}) {
    this.config = {
      enableLogging: config.enableLogging ?? true,
      retryAttempts: config.retryAttempts ?? 3,
      retryDelay: config.retryDelay ?? 1000,
    }
  }

  /**
   * Initialize network monitoring
   */
  async initialize(): Promise<void> {
    try {
      // Get initial network state
      const state = await NetInfo.fetch()
      this.updateNetworkState(state)

      // Subscribe to network state changes
      NetInfo.addEventListener((state) => {
        this.updateNetworkState(state)
      })

      if (this.config.enableLogging) {
        console.log('Network service initialized', {
          isConnected: this.isConnected,
          isInternetReachable: this.isInternetReachable,
        })
      }
    } catch (error) {
      console.error('Failed to initialize network service:', error)
      // Don't throw error - app should work even if network detection fails
      this.isConnected = false
      this.isInternetReachable = false
    }
  }

  /**
   * Get current network state
   */
  getNetworkState(): NetworkState {
    return {
      isConnected: this.isConnected,
      isInternetReachable: this.isInternetReachable,
      type: 'unknown', // NetInfo provides this but we'll keep it simple
    }
  }

  /**
   * Check if device is online (connected and internet reachable)
   */
  isOnline(): boolean {
    return this.isConnected && this.isInternetReachable !== false
  }

  /**
   * Check if device is offline
   */
  isOffline(): boolean {
    return !this.isOnline()
  }

  /**
   * Subscribe to network state changes
   */
  subscribe(listener: (state: NetworkState) => void): () => void {
    this.listeners.push(listener)

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Execute a function with network retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    options?: {
      retryAttempts?: number
      retryDelay?: number
      onRetry?: (attempt: number, error: any) => void
    }
  ): Promise<T> {
    const retryAttempts = options?.retryAttempts ?? this.config.retryAttempts
    const retryDelay = options?.retryDelay ?? this.config.retryDelay

    let lastError: any

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error

        if (this.config.enableLogging) {
          console.warn(
            `Operation failed (attempt ${attempt}/${retryAttempts}):`,
            error
          )
        }

        if (options?.onRetry) {
          options.onRetry(attempt, error)
        }

        // Don't retry if we're offline or if this is the last attempt
        if (this.isOffline() || attempt === retryAttempts) {
          break
        }

        // Wait before retrying
        await this.delay(retryDelay * attempt) // Exponential backoff
      }
    }

    throw new NetworkError(
      `Operation failed after ${retryAttempts} attempts`,
      lastError,
      this.isOffline()
    )
  }

  /**
   * Execute operation only if online, otherwise return fallback
   */
  async executeIfOnline<T>(
    operation: () => Promise<T>,
    fallback: T | (() => T | Promise<T>)
  ): Promise<T> {
    if (this.isOnline()) {
      try {
        return await operation()
      } catch (error) {
        if (this.config.enableLogging) {
          console.warn('Online operation failed, using fallback:', error)
        }
        return typeof fallback === 'function'
          ? await (fallback as Function)()
          : fallback
      }
    } else {
      if (this.config.enableLogging) {
        console.log('Device is offline, using fallback')
      }
      return typeof fallback === 'function'
        ? await (fallback as Function)()
        : fallback
    }
  }

  /**
   * Wait for network to become available
   */
  async waitForConnection(timeout: number = 30000): Promise<boolean> {
    if (this.isOnline()) {
      return true
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        unsubscribe()
        resolve(false)
      }, timeout)

      const unsubscribe = this.subscribe((state) => {
        if (state.isConnected && state.isInternetReachable !== false) {
          clearTimeout(timeoutId)
          unsubscribe()
          resolve(true)
        }
      })
    })
  }

  /**
   * Update internal network state and notify listeners
   */
  private updateNetworkState(state: any): void {
    const wasOnline = this.isOnline()

    this.isConnected = state.isConnected ?? false
    this.isInternetReachable = state.isInternetReachable

    const isNowOnline = this.isOnline()

    if (this.config.enableLogging && wasOnline !== isNowOnline) {
      console.log(
        `Network state changed: ${wasOnline ? 'online' : 'offline'} -> ${
          isNowOnline ? 'online' : 'offline'
        }`
      )
    }

    // Notify listeners
    const networkState: NetworkState = {
      isConnected: this.isConnected,
      isInternetReachable: this.isInternetReachable,
      type: state.type || 'unknown',
    }

    this.listeners.forEach((listener) => {
      try {
        listener(networkState)
      } catch (error) {
        console.error('Network listener error:', error)
      }
    })
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * Custom error class for network-related errors
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public originalError?: any,
    public isOffline: boolean = false
  ) {
    super(message)
    this.name = 'NetworkError'
  }
}

// Export singleton instance
export const networkService = new NetworkService({
  enableLogging: __DEV__, // Only log in development
  retryAttempts: 3,
  retryDelay: 1000,
})
