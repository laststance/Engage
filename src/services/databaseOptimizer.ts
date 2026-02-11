/**
 * Database optimization utilities for the Engage app
 * Provides query optimization, indexing strategies, and performance monitoring
 */

import * as SQLite from 'expo-sqlite'
import {
  performanceMonitor,
  DatabasePerformanceWrapper,
} from '../utils/performanceMonitor'
import { formatDate } from '../utils/dateUtils'

interface QueryAnalysis {
  query: string
  executionTime: number
  rowsAffected: number
  usesIndex: boolean
  suggestions: string[]
}

interface IndexUsage {
  indexName: string
  tableName: string
  usageCount: number
  lastUsed: number
}

export class DatabaseOptimizer {
  private db: SQLite.SQLiteDatabase
  private queryAnalytics: Map<string, QueryAnalysis[]> = new Map()
  private indexUsage: Map<string, IndexUsage> = new Map()

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database
  }

  /**
   * Analyze query performance and suggest optimizations
   */
  async analyzeQuery(query: string, params?: any[]): Promise<QueryAnalysis> {
    const startTime = performance.now()

    // Execute EXPLAIN QUERY PLAN to understand query execution
    const explainQuery = `EXPLAIN QUERY PLAN ${query}`
    const explainResult = await this.db.getAllAsync(explainQuery, params || [])

    // Execute the actual query
    const result = await this.db.getAllAsync(query, params || [])

    const executionTime = performance.now() - startTime
    const rowsAffected = Array.isArray(result) ? result.length : 0

    // Analyze if query uses indexes
    const usesIndex = this.checkIndexUsage(explainResult)

    // Generate optimization suggestions
    const suggestions = this.generateOptimizationSuggestions(
      query,
      explainResult,
      executionTime
    )

    const analysis: QueryAnalysis = {
      query,
      executionTime,
      rowsAffected,
      usesIndex,
      suggestions,
    }

    // Store analytics
    const queryKey = this.normalizeQuery(query)
    if (!this.queryAnalytics.has(queryKey)) {
      this.queryAnalytics.set(queryKey, [])
    }
    this.queryAnalytics.get(queryKey)!.push(analysis)

    return analysis
  }

  /**
   * Check if query execution plan uses indexes
   */
  private checkIndexUsage(explainResult: any[]): boolean {
    return explainResult.some(
      (row: any) =>
        row.detail &&
        (row.detail.includes('USING INDEX') ||
          row.detail.includes('USING COVERING INDEX'))
    )
  }

  /**
   * Generate optimization suggestions based on query analysis
   */
  private generateOptimizationSuggestions(
    query: string,
    explainResult: any[],
    executionTime: number
  ): string[] {
    const suggestions: string[] = []

    // Check for slow queries
    if (executionTime > 100) {
      suggestions.push(
        'Query execution time is slow (>100ms). Consider optimization.'
      )
    }

    // Check for table scans
    const hasTableScan = explainResult.some(
      (row: any) => row.detail && row.detail.includes('SCAN TABLE')
    )

    if (hasTableScan) {
      suggestions.push(
        'Query performs table scan. Consider adding appropriate indexes.'
      )
    }

    // Check for missing WHERE clauses on large tables
    if (
      query.toLowerCase().includes('completions') &&
      !query.toLowerCase().includes('where')
    ) {
      suggestions.push(
        'Query on completions table without WHERE clause. Consider filtering by date.'
      )
    }

    // Check for ORDER BY without index
    if (query.toLowerCase().includes('order by') && hasTableScan) {
      suggestions.push(
        'ORDER BY clause may benefit from an index on the sorted columns.'
      )
    }

    // Check for JOIN operations
    if (query.toLowerCase().includes('join')) {
      suggestions.push(
        'Ensure JOIN conditions use indexed columns for better performance.'
      )
    }

    return suggestions
  }

  /**
   * Normalize query for analytics grouping
   */
  private normalizeQuery(query: string): string {
    return query
      .replace(/\s+/g, ' ')
      .replace(/\?/g, 'PARAM')
      .replace(/\d+/g, 'NUM')
      .trim()
      .toLowerCase()
  }

  /**
   * Get performance statistics for all queries
   */
  getQueryStatistics(): {
    totalQueries: number
    averageExecutionTime: number
    slowestQueries: QueryAnalysis[]
    unoptimizedQueries: QueryAnalysis[]
  } {
    const allAnalyses: QueryAnalysis[] = []

    for (const analyses of this.queryAnalytics.values()) {
      allAnalyses.push(...analyses)
    }

    const totalQueries = allAnalyses.length
    const averageExecutionTime =
      totalQueries > 0
        ? allAnalyses.reduce((sum, a) => sum + a.executionTime, 0) /
          totalQueries
        : 0

    const slowestQueries = allAnalyses
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10)

    const unoptimizedQueries = allAnalyses
      .filter((a) => !a.usesIndex || a.suggestions.length > 0)
      .slice(0, 10)

    return {
      totalQueries,
      averageExecutionTime,
      slowestQueries,
      unoptimizedQueries,
    }
  }

  /**
   * Create optimized indexes based on query patterns
   */
  async createOptimizedIndexes(): Promise<void> {
    const optimizationQueries = [
      // Composite index for date range queries on completions
      `CREATE INDEX IF NOT EXISTS idx_completions_date_created_at 
       ON completions(date, created_at)`,

      // Composite index for task completion status queries
      `CREATE INDEX IF NOT EXISTS idx_completions_task_date_created 
       ON completions(task_id, date, created_at)`,

      // Index for journal entries by date range
      `CREATE INDEX IF NOT EXISTS idx_entries_date_created_at 
       ON entries(date, created_at)`,

      // Index for active tasks by category
      `CREATE INDEX IF NOT EXISTS idx_tasks_category_archived_created 
       ON tasks(category_id, archived, created_at)`,

      // Index for settings lookup
      `CREATE INDEX IF NOT EXISTS idx_settings_key 
       ON settings(key)`,

      // Partial index for non-archived tasks only
      `CREATE INDEX IF NOT EXISTS idx_tasks_active_category 
       ON tasks(category_id, created_at) WHERE archived = 0`,

      // Partial index for recent completions (last 30 days)
      `CREATE INDEX IF NOT EXISTS idx_completions_recent 
       ON completions(date, task_id, created_at) 
       WHERE date >= date('now', '-30 days')`,
    ]

    for (const query of optimizationQueries) {
      try {
        await DatabasePerformanceWrapper.wrapQuery(
          'create_index',
          () => this.db.execAsync(query),
          { query }
        )
        console.log(
          'Created optimization index:',
          query.split('idx_')[1]?.split(' ')[0]
        )
      } catch (error) {
        console.warn('Failed to create index:', error)
      }
    }
  }

  /**
   * Analyze database size and suggest cleanup
   */
  async analyzeDatabaseSize(): Promise<{
    totalSize: number
    tablesSizes: Record<string, number>
    suggestions: string[]
  }> {
    const tables = ['tasks', 'entries', 'completions', 'categories', 'settings']
    const tableSizes: Record<string, number> = {}
    const suggestions: string[] = []

    let totalSize = 0

    for (const table of tables) {
      try {
        const result = (await this.db.getFirstAsync(
          `SELECT COUNT(*) as count FROM ${table}`
        )) as { count: number }

        tableSizes[table] = result.count
        totalSize += result.count

        // Generate cleanup suggestions
        if (table === 'completions' && result.count > 10000) {
          suggestions.push(
            'Consider archiving old completion records (>1 year)'
          )
        }

        if (table === 'entries' && result.count > 5000) {
          suggestions.push('Consider archiving old journal entries (>2 years)')
        }
      } catch (error) {
        console.warn(`Failed to analyze table ${table}:`, error)
      }
    }

    return {
      totalSize,
      tablesSizes: tableSizes,
      suggestions,
    }
  }

  /**
   * Vacuum database to reclaim space and optimize performance
   */
  async vacuumDatabase(): Promise<void> {
    await DatabasePerformanceWrapper.wrapQuery(
      'vacuum',
      () => this.db.execAsync('VACUUM'),
      { operation: 'vacuum' }
    )

    console.log('Database vacuum completed')
  }

  /**
   * Update table statistics for query optimizer
   */
  async updateStatistics(): Promise<void> {
    await DatabasePerformanceWrapper.wrapQuery(
      'analyze',
      () => this.db.execAsync('ANALYZE'),
      { operation: 'analyze' }
    )

    console.log('Database statistics updated')
  }

  /**
   * Test database performance with large datasets
   */
  async performanceTest(): Promise<{
    insertPerformance: number
    selectPerformance: number
    updatePerformance: number
    deletePerformance: number
  }> {
    const testData = this.generateTestData(1000)

    // Test INSERT performance
    const insertStart = performance.now()
    await this.db.withTransactionAsync(async () => {
      for (const item of testData) {
        await this.db.runAsync(
          'INSERT INTO completions (id, date, task_id, created_at) VALUES (?, ?, ?, ?)',
          [item.id, item.date, item.taskId, item.createdAt]
        )
      }
    })
    const insertTime = performance.now() - insertStart

    // Test SELECT performance
    const selectStart = performance.now()
    await this.db.getAllAsync(
      'SELECT * FROM completions WHERE date >= ? ORDER BY created_at DESC LIMIT 100',
      ['2024-01-01']
    )
    const selectTime = performance.now() - selectStart

    // Test UPDATE performance
    const updateStart = performance.now()
    await this.db.runAsync(
      'UPDATE completions SET minutes = ? WHERE date = ?',
      [30, testData[0].date]
    )
    const updateTime = performance.now() - updateStart

    // Test DELETE performance (cleanup test data)
    const deleteStart = performance.now()
    await this.db.runAsync('DELETE FROM completions WHERE id LIKE ?', [
      'test_%',
    ])
    const deleteTime = performance.now() - deleteStart

    return {
      insertPerformance: insertTime,
      selectPerformance: selectTime,
      updatePerformance: updateTime,
      deletePerformance: deleteTime,
    }
  }

  /**
   * Generate test data for performance testing
   */
  private generateTestData(count: number): {
    id: string
    date: string
    taskId: string
    createdAt: number
  }[] {
    const data = []
    const startDate = new Date('2024-01-01')

    for (let i = 0; i < count; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      data.push({
        id: `test_${i}`,
        date: formatDate(date),
        taskId: `task_${i % 10}`,
        createdAt: Date.now(),
      })
    }

    return data
  }

  /**
   * Clear analytics data
   */
  clearAnalytics(): void {
    this.queryAnalytics.clear()
    this.indexUsage.clear()
  }
}

/**
 * Wrapper for database operations with performance monitoring
 */
export class OptimizedDatabaseService {
  private db: SQLite.SQLiteDatabase
  private optimizer: DatabaseOptimizer

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database
    this.optimizer = new DatabaseOptimizer(database)
  }

  /**
   * Execute query with performance monitoring
   */
  async executeQuery<T>(
    query: string,
    params?: any[],
    options?: { analyze?: boolean }
  ): Promise<T> {
    const result = await DatabasePerformanceWrapper.wrapQuery(
      'execute_query',
      async () => {
        if (options?.analyze) {
          await this.optimizer.analyzeQuery(query, params)
        }
        return this.db.getAllAsync(query, params || []) as Promise<T>
      },
      { query: query.substring(0, 50), paramCount: params?.length || 0 }
    )

    return result
  }

  /**
   * Execute query with transaction
   */
  async executeTransaction<T>(operations: () => Promise<T>): Promise<T> {
    return this.db.withTransactionAsync(
      operations as () => Promise<void>
    ) as Promise<T>
  }

  /**
   * Get optimizer instance
   */
  getOptimizer(): DatabaseOptimizer {
    return this.optimizer
  }
}

export default DatabaseOptimizer
