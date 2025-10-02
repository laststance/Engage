/**
 * Performance tests for the Engage app
 * Tests database operations, memory usage, and app responsiveness with large datasets
 */

import { performanceMonitor } from '../utils/performanceMonitor'
import DatabaseOptimizer from '../services/databaseOptimizer'
import * as SQLite from 'expo-sqlite'

// Mock SQLite for testing
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}))

describe('Performance Tests', () => {
  let mockDb: any
  let optimizer: DatabaseOptimizer

  beforeEach(() => {
    // Mock database instance
    mockDb = {
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      runAsync: jest.fn(),
      execAsync: jest.fn(),
      withTransactionAsync: jest.fn(),
    }

    optimizer = new DatabaseOptimizer(mockDb)
    performanceMonitor.clearMetrics()
    performanceMonitor.setEnabled(true)
    
    // Verify monitoring is enabled
    expect(performanceMonitor.isMonitoringEnabled()).toBe(true)
  })

  afterEach(() => {
    performanceMonitor.clearMetrics()
  })

  describe('Performance Monitor', () => {
    it('should measure async operation performance', async () => {
      const result = await performanceMonitor.measureAsync(
        'test_operation',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 50))
          return 'test_result'
        }
      )

      expect(result).toBe('test_result')

      const metrics = performanceMonitor.getMetrics('test_operation')
      expect(metrics).toHaveLength(1)
      expect(metrics[0].duration).toBeGreaterThan(40)
      expect(metrics[0].duration).toBeLessThan(100)
    })

    it('should measure sync operation performance', () => {
      // Verify monitoring is enabled before test
      expect(performanceMonitor.isMonitoringEnabled()).toBe(true)
      
      const result = performanceMonitor.measure('sync_operation', () => {
        // Simulate some work
        let sum = 0
        for (let i = 0; i < 1000; i++) {
          sum += i
        }
        return sum
      })

      expect(result).toBe(499500)

      const allMetrics = performanceMonitor.getMetrics()
      console.log('All metrics:', allMetrics)
      
      const metrics = performanceMonitor.getMetrics('sync_operation')
      console.log('Sync operation metrics:', metrics)
      
      expect(metrics).toHaveLength(1)
      expect(metrics[0].duration).toBeGreaterThanOrEqual(0)
    })

    it('should track multiple operations and calculate averages', async () => {
      // Run multiple operations
      for (let i = 0; i < 5; i++) {
        await performanceMonitor.measureAsync(
          'repeated_operation',
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 10))
          }
        )
      }

      const averageTime =
        performanceMonitor.getAverageTime('repeated_operation')
      expect(averageTime).toBeGreaterThan(5)
      expect(averageTime).toBeLessThan(50)

      const metrics = performanceMonitor.getMetrics('repeated_operation')
      expect(metrics).toHaveLength(5)
    })

    it('should identify slowest operations', async () => {
      // Create operations with different durations
      await performanceMonitor.measureAsync('fast_op', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      await performanceMonitor.measureAsync('slow_op', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      await performanceMonitor.measureAsync('medium_op', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      const slowest = performanceMonitor.getSlowestOperations(2)
      expect(slowest).toHaveLength(2)
      expect(slowest[0].name).toBe('slow_op')
      expect(slowest[1].name).toBe('medium_op')
    })

    it('should generate performance report', async () => {
      // Add some test metrics
      await performanceMonitor.measureAsync('op1', async () => {
        await new Promise((resolve) => setTimeout(resolve, 20))
      })

      await performanceMonitor.measureAsync('op2', async () => {
        await new Promise((resolve) => setTimeout(resolve, 30))
      })

      const report = performanceMonitor.generateReport()

      expect(report.totalOperations).toBe(2)
      expect(report.averageTime).toBeGreaterThan(20)
      expect(report.slowestOperations).toHaveLength(2)
      expect(report.memoryTrend).toBe('unknown')
    })
  })

  describe('Database Performance', () => {
    it('should analyze query performance', async () => {
      const mockExplainResult = [{ detail: 'SCAN TABLE completions' }]
      const mockQueryResult = [
        { id: '1', date: '2024-01-01' },
        { id: '2', date: '2024-01-02' },
      ]

      mockDb.getAllAsync
        .mockResolvedValueOnce(mockExplainResult) // EXPLAIN QUERY PLAN
        .mockResolvedValueOnce(mockQueryResult) // Actual query

      const analysis = await optimizer.analyzeQuery(
        'SELECT * FROM completions WHERE date >= ?',
        ['2024-01-01']
      )

      expect(analysis.query).toContain('SELECT * FROM completions')
      expect(analysis.rowsAffected).toBe(2)
      expect(analysis.usesIndex).toBe(false)
      expect(analysis.suggestions.some(s => s.includes('table scan'))).toBe(true)
    })

    it('should detect index usage', async () => {
      const mockExplainResult = [
        { detail: 'SEARCH TABLE completions USING INDEX idx_completions_date' },
      ]
      const mockQueryResult = [{ id: '1' }]

      mockDb.getAllAsync
        .mockResolvedValueOnce(mockExplainResult)
        .mockResolvedValueOnce(mockQueryResult)

      const analysis = await optimizer.analyzeQuery(
        'SELECT * FROM completions WHERE date = ?',
        ['2024-01-01']
      )

      expect(analysis.usesIndex).toBe(true)
      expect(analysis.suggestions).toHaveLength(0)
    })

    it('should suggest optimizations for slow queries', async () => {
      const mockExplainResult = [{ detail: 'SCAN TABLE completions' }]
      const mockQueryResult = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
      }))

      // Mock slow execution by adding delay
      mockDb.getAllAsync.mockImplementation(async (query: string) => {
        if (query.startsWith('EXPLAIN')) {
          return mockExplainResult
        }
        await new Promise((resolve) => setTimeout(resolve, 150))
        return mockQueryResult
      })

      const analysis = await optimizer.analyzeQuery(
        'SELECT * FROM completions',
        []
      )

      expect(analysis.executionTime).toBeGreaterThan(100)
      expect(analysis.suggestions.some(s => s.includes('slow'))).toBe(true)
    })

    it('should create optimized indexes', async () => {
      mockDb.execAsync.mockResolvedValue(undefined)

      await optimizer.createOptimizedIndexes()

      // Should have called execAsync multiple times for different indexes
      expect(mockDb.execAsync).toHaveBeenCalledTimes(7)

      // Check that index creation queries were called
      const calls = mockDb.execAsync.mock.calls
      expect(
        calls.some((call: any[]) =>
          call[0].includes('idx_completions_date_created_at')
        )
      ).toBe(true)
      expect(
        calls.some((call: any[]) =>
          call[0].includes('idx_tasks_active_category')
        )
      ).toBe(true)
    })

    it('should analyze database size and suggest cleanup', async () => {
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ count: 5000 }) // tasks
        .mockResolvedValueOnce({ count: 5001 }) // entries
        .mockResolvedValueOnce({ count: 15000 }) // completions
        .mockResolvedValueOnce({ count: 10 }) // categories
        .mockResolvedValueOnce({ count: 20 }) // settings

      const analysis = await optimizer.analyzeDatabaseSize()

      expect(analysis.totalSize).toBe(25031)
      expect(analysis.tablesSizes.completions).toBe(15000)
      expect(analysis.suggestions.some(s => s.includes('archiving old completion records'))).toBe(true)
      expect(analysis.suggestions.some(s => s.includes('archiving old journal entries'))).toBe(true)
    })

    it('should perform vacuum operation', async () => {
      mockDb.execAsync.mockResolvedValue(undefined)

      await optimizer.vacuumDatabase()

      expect(mockDb.execAsync).toHaveBeenCalledWith('VACUUM')
    })

    it('should update database statistics', async () => {
      mockDb.execAsync.mockResolvedValue(undefined)

      await optimizer.updateStatistics()

      expect(mockDb.execAsync).toHaveBeenCalledWith('ANALYZE')
    })
  })

  describe('Large Dataset Performance', () => {
    it('should handle large dataset operations efficiently', async () => {
      // Mock transaction wrapper
      mockDb.withTransactionAsync.mockImplementation(async (callback: any) => {
        return await callback()
      })

      // Mock individual operations
      mockDb.runAsync.mockResolvedValue({ changes: 1 })
      mockDb.getAllAsync.mockResolvedValue(
        Array.from({ length: 100 }, (_, i) => ({ id: i }))
      )

      const performanceResults = await optimizer.performanceTest()

      expect(performanceResults.insertPerformance).toBeGreaterThan(0)
      expect(performanceResults.selectPerformance).toBeGreaterThanOrEqual(0)
      expect(performanceResults.updatePerformance).toBeGreaterThanOrEqual(0)
      expect(performanceResults.deletePerformance).toBeGreaterThanOrEqual(0)

      // Verify that operations were called
      expect(mockDb.withTransactionAsync).toHaveBeenCalled()
      expect(mockDb.getAllAsync).toHaveBeenCalled()
      expect(mockDb.runAsync).toHaveBeenCalled()
    })

    it('should maintain performance with concurrent operations', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ id: 1 }])

      // Simulate concurrent database operations
      const operations = Array.from({ length: 10 }, (_, i) =>
        performanceMonitor.measureAsync(`concurrent_op_${i}`, async () => {
          await mockDb.getAllAsync('SELECT * FROM tasks WHERE id = ?', [i])
        })
      )

      await Promise.all(operations)

      const metrics = performanceMonitor.getMetrics()
      expect(metrics).toHaveLength(10)

      // All operations should complete reasonably quickly
      metrics.forEach((metric) => {
        expect(metric.duration).toBeLessThan(100)
      })
    })
  })

  describe('Memory Performance', () => {
    it('should track memory usage patterns', () => {
      const snapshot1 = performanceMonitor.takeMemorySnapshot()
      const snapshot2 = performanceMonitor.takeMemorySnapshot()

      // In test environment, snapshots will be null or have placeholder values
      expect(snapshot1).toBeDefined()
      expect(snapshot2).toBeDefined()
    })

    it('should limit memory snapshot history', () => {
      // Take more than 100 snapshots
      for (let i = 0; i < 150; i++) {
        performanceMonitor.takeMemorySnapshot()
      }

      // Should only keep last 100 (this is internal behavior)
      // We can't directly test this without exposing internal state
      // but we can verify the method doesn't throw errors
      expect(() => performanceMonitor.takeMemorySnapshot()).not.toThrow()
    })
  })

  describe('Query Statistics', () => {
    it('should collect and analyze query statistics', async () => {
      mockDb.getAllAsync
        .mockResolvedValueOnce([{ detail: 'SCAN TABLE' }])
        .mockResolvedValueOnce([{ id: 1 }])
        .mockResolvedValueOnce([{ detail: 'USING INDEX' }])
        .mockResolvedValueOnce([{ id: 2 }])

      // Analyze two different queries
      await optimizer.analyzeQuery('SELECT * FROM tasks', [])
      await optimizer.analyzeQuery('SELECT * FROM tasks WHERE id = ?', [1])

      const stats = optimizer.getQueryStatistics()

      expect(stats.totalQueries).toBe(2)
      expect(stats.averageExecutionTime).toBeGreaterThanOrEqual(0)
      expect(stats.slowestQueries).toHaveLength(2)
      expect(stats.unoptimizedQueries.length).toBeGreaterThan(0)
    })

    it('should normalize similar queries for analytics', async () => {
      mockDb.getAllAsync
        .mockResolvedValue([{ detail: 'SCAN TABLE' }])
        .mockResolvedValue([{ id: 1 }])

      // Run similar queries with different parameters
      await optimizer.analyzeQuery('SELECT * FROM tasks WHERE id = ?', [1])
      await optimizer.analyzeQuery('SELECT * FROM tasks WHERE id = ?', [2])
      await optimizer.analyzeQuery('SELECT * FROM tasks WHERE id = ?', [3])

      const stats = optimizer.getQueryStatistics()

      // Should track all 3 executions
      expect(stats.totalQueries).toBe(3)
    })
  })

  describe('Performance Thresholds', () => {
    it('should warn about slow operations', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      await performanceMonitor.measureAsync('slow_operation', async () => {
        await new Promise((resolve) => setTimeout(resolve, 150))
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow operation detected'),
        undefined
      )

      consoleSpy.mockRestore()
    })

    it('should not warn about fast operations', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      await performanceMonitor.measureAsync('fast_operation', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})
