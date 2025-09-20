/**
 * Performance monitoring utilities for the Engage app
 * Tracks database query performance, memory usage, and app responsiveness
 */

import React from 'react'

interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

interface MemoryUsage {
  used: number
  total: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private memorySnapshots: MemoryUsage[] = []
  private isEnabled: boolean = __DEV__ // Only enable in development

  /**
   * Start timing a performance metric
   */
  startTiming(name: string, metadata?: Record<string, any>): string {
    if (!this.isEnabled) return ''

    const id = `${name}_${Date.now()}_${Math.random()}`
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    }

    this.metrics.push(metric)
    return id
  }

  /**
   * End timing a performance metric
   */
  endTiming(name: string): number | null {
    if (!this.isEnabled) return null

    const metricIndex = this.metrics.findIndex(
      (m) => m.name === name && !m.endTime
    )

    if (metricIndex === -1) {
      console.warn(`Performance metric not found: ${name}`)
      return null
    }

    const metric = this.metrics[metricIndex]
    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime

    if (metric.duration > 100) {
      console.warn(
        `Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`,
        metric.metadata
      )
    }

    return metric.duration
  }

  /**
   * Measure the execution time of an async function
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.isEnabled) return fn()

    this.startTiming(name, metadata)
    try {
      const result = await fn()
      return result
    } finally {
      this.endTiming(name)
    }
  }

  /**
   * Measure the execution time of a synchronous function
   */
  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    if (!this.isEnabled) return fn()

    this.startTiming(name, metadata)
    try {
      const result = fn()
      return result
    } finally {
      this.endTiming(name)
    }
  }

  /**
   * Take a memory usage snapshot
   */
  takeMemorySnapshot(): MemoryUsage | null {
    if (!this.isEnabled) return null

    // Note: React Native doesn't have direct memory API access
    // This is a placeholder for when memory monitoring is available
    const snapshot: MemoryUsage = {
      used: 0, // Would be populated with actual memory usage
      total: 0, // Would be populated with total available memory
      timestamp: Date.now(),
    }

    this.memorySnapshots.push(snapshot)

    // Keep only last 100 snapshots
    if (this.memorySnapshots.length > 100) {
      this.memorySnapshots = this.memorySnapshots.slice(-100)
    }

    return snapshot
  }

  /**
   * Get performance metrics for a specific operation
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (!this.isEnabled) return []

    if (name) {
      return this.metrics.filter((m) => m.name === name && m.duration)
    }

    return this.metrics.filter((m) => m.duration)
  }

  /**
   * Get average execution time for an operation
   */
  getAverageTime(name: string): number | null {
    const metrics = this.getMetrics(name)
    if (metrics.length === 0) return null

    const total = metrics.reduce((sum, m) => sum + (m.duration || 0), 0)
    return total / metrics.length
  }

  /**
   * Get slowest operations
   */
  getSlowestOperations(limit: number = 10): PerformanceMetric[] {
    return this.getMetrics()
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, limit)
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clearMetrics(): void {
    this.metrics = []
    this.memorySnapshots = []
  }

  /**
   * Generate a performance report
   */
  generateReport(): {
    totalOperations: number
    averageTime: number
    slowestOperations: PerformanceMetric[]
    memoryTrend: 'stable' | 'increasing' | 'decreasing' | 'unknown'
  } {
    const metrics = this.getMetrics()
    const totalOperations = metrics.length
    const averageTime =
      totalOperations > 0
        ? metrics.reduce((sum, m) => sum + (m.duration || 0), 0) /
          totalOperations
        : 0

    const slowestOperations = this.getSlowestOperations(5)

    // Analyze memory trend (placeholder)
    const memoryTrend: 'stable' | 'increasing' | 'decreasing' | 'unknown' =
      'unknown'

    return {
      totalOperations,
      averageTime,
      slowestOperations,
      memoryTrend,
    }
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  /**
   * Check if performance monitoring is enabled
   */
  isMonitoringEnabled(): boolean {
    return this.isEnabled
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Decorator for measuring method performance
 */
export function measurePerformance(name?: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value
    const metricName = name || `${target.constructor.name}.${propertyName}`

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measureAsync(
        metricName,
        () => method.apply(this, args),
        { args: args.length }
      )
    }
  }
}

/**
 * Database query performance wrapper
 */
export class DatabasePerformanceWrapper {
  static wrapQuery<T>(
    queryName: string,
    query: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    return performanceMonitor.measureAsync(
      `db_query_${queryName}`,
      query,
      metadata
    )
  }

  static wrapSyncQuery<T>(
    queryName: string,
    query: () => T,
    metadata?: Record<string, any>
  ): T {
    return performanceMonitor.measure(`db_query_${queryName}`, query, metadata)
  }
}

/**
 * React component performance wrapper
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const name = componentName || Component.displayName || Component.name

  const WrappedComponent = React.memo((props: P) => {
    const renderStart = React.useRef<number>(0)

    React.useEffect(() => {
      renderStart.current = performance.now()
    })

    React.useEffect(() => {
      const renderTime = performance.now() - renderStart.current
      if (renderTime > 16) {
        // More than one frame at 60fps
        console.warn(
          `Slow render detected: ${name} took ${renderTime.toFixed(2)}ms`
        )
      }
    })

    return React.createElement(Component, props)
  })

  // Set display name for debugging
  WrappedComponent.displayName = `withPerformanceMonitoring(${name})`

  return WrappedComponent
}

export default performanceMonitor
