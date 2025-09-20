import { DatabaseService, DatabaseError } from './database'
import { networkService, NetworkError } from './networkService'
import { Task, Entry, Completion, Category } from '../types'

export interface OfflineConfig {
  enableDataValidation?: boolean
  enableIntegrityChecks?: boolean
  enableLogging?: boolean
  maxRetryAttempts?: number
}

export interface DataIntegrityResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  corruptedRecords: {
    tasks: string[]
    entries: string[]
    completions: string[]
    categories: string[]
  }
}

export interface OfflineCapabilities {
  canCreateTasks: boolean
  canUpdateTasks: boolean
  canDeleteTasks: boolean
  canCreateEntries: boolean
  canUpdateEntries: boolean
  canCreateCompletions: boolean
  canViewStatistics: boolean
  canExportData: boolean
}

/**
 * Service for managing offline functionality and data consistency
 */
export class OfflineService {
  private config: Required<OfflineConfig>
  private databaseService: DatabaseService

  constructor(databaseService: DatabaseService, config: OfflineConfig = {}) {
    this.databaseService = databaseService
    this.config = {
      enableDataValidation: config.enableDataValidation ?? true,
      enableIntegrityChecks: config.enableIntegrityChecks ?? true,
      enableLogging: config.enableLogging ?? __DEV__,
      maxRetryAttempts: config.maxRetryAttempts ?? 3,
    }
  }

  /**
   * Initialize offline service
   */
  async initialize(): Promise<void> {
    try {
      // Initialize network service
      await networkService.initialize()

      // Subscribe to network changes
      networkService.subscribe((state) => {
        if (this.config.enableLogging) {
          console.log('Network state changed:', state)
        }

        // Handle network state changes
        this.handleNetworkStateChange(state)
      })

      // Perform initial data integrity check
      if (this.config.enableIntegrityChecks) {
        const integrityResult = await this.checkDataIntegrity()
        if (!integrityResult.isValid) {
          console.warn('Data integrity issues detected:', integrityResult)

          // Attempt to fix minor issues automatically
          await this.attemptDataRepair(integrityResult)
        }
      }

      if (this.config.enableLogging) {
        console.log('Offline service initialized successfully')
      }
    } catch (error) {
      console.error('Failed to initialize offline service:', error)
      throw new DatabaseError('Failed to initialize offline service', error)
    }
  }

  /**
   * Get current offline capabilities based on network state and data integrity
   */
  getOfflineCapabilities(): OfflineCapabilities {
    const isOnline = networkService.isOnline()

    // All core features should work offline since we use local SQLite
    return {
      canCreateTasks: true,
      canUpdateTasks: true,
      canDeleteTasks: true,
      canCreateEntries: true,
      canUpdateEntries: true,
      canCreateCompletions: true,
      canViewStatistics: true,
      canExportData: true,
    }
  }

  /**
   * Execute database operation with offline error handling
   */
  async executeOfflineOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    fallbackValue?: T
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (this.config.enableLogging) {
        console.error(`Offline operation failed: ${operationName}`, error)
      }

      // Handle different types of errors
      if (error instanceof DatabaseError) {
        // Database errors in offline mode - try to provide helpful feedback
        throw new OfflineError(
          `Unable to ${operationName} while offline: ${error.message}`,
          error,
          'database'
        )
      } else if (error instanceof NetworkError) {
        // Network errors - provide offline-specific message
        throw new OfflineError(
          `Cannot ${operationName} - device is offline`,
          error,
          'network'
        )
      } else {
        // Unknown errors
        if (fallbackValue !== undefined) {
          if (this.config.enableLogging) {
            console.warn(`Using fallback value for ${operationName}`)
          }
          return fallbackValue
        }

        throw new OfflineError(
          `Operation failed: ${operationName}`,
          error,
          'unknown'
        )
      }
    }
  }

  /**
   * Validate data consistency and integrity
   */
  async checkDataIntegrity(): Promise<DataIntegrityResult> {
    const result: DataIntegrityResult = {
      isValid: true,
      errors: [],
      warnings: [],
      corruptedRecords: {
        tasks: [],
        entries: [],
        completions: [],
        categories: [],
      },
    }

    try {
      // Check categories integrity
      await this.validateCategories(result)

      // Check tasks integrity
      await this.validateTasks(result)

      // Check entries integrity
      await this.validateEntries(result)

      // Check completions integrity
      await this.validateCompletions(result)

      // Check foreign key relationships
      await this.validateRelationships(result)

      result.isValid = result.errors.length === 0

      if (this.config.enableLogging) {
        console.log('Data integrity check completed:', {
          isValid: result.isValid,
          errorsCount: result.errors.length,
          warningsCount: result.warnings.length,
        })
      }
    } catch (error) {
      result.isValid = false
      result.errors.push(
        `Integrity check failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }

    return result
  }

  /**
   * Attempt to repair data integrity issues
   */
  async attemptDataRepair(
    integrityResult: DataIntegrityResult
  ): Promise<boolean> {
    let repairSuccess = true

    try {
      // Remove orphaned completions (completions with non-existent tasks)
      if (integrityResult.corruptedRecords.completions.length > 0) {
        for (const completionId of integrityResult.corruptedRecords
          .completions) {
          try {
            await this.databaseService.executeUpdate(
              'DELETE FROM completions WHERE id = ?',
              [completionId]
            )
            if (this.config.enableLogging) {
              console.log(`Removed orphaned completion: ${completionId}`)
            }
          } catch (error) {
            console.error(
              `Failed to remove orphaned completion ${completionId}:`,
              error
            )
            repairSuccess = false
          }
        }
      }

      // Remove orphaned tasks (tasks with non-existent categories)
      if (integrityResult.corruptedRecords.tasks.length > 0) {
        for (const taskId of integrityResult.corruptedRecords.tasks) {
          try {
            await this.databaseService.executeUpdate(
              'UPDATE tasks SET archived = 1 WHERE id = ?',
              [taskId]
            )
            if (this.config.enableLogging) {
              console.log(`Archived orphaned task: ${taskId}`)
            }
          } catch (error) {
            console.error(`Failed to archive orphaned task ${taskId}:`, error)
            repairSuccess = false
          }
        }
      }

      if (this.config.enableLogging) {
        console.log(
          `Data repair ${
            repairSuccess ? 'completed successfully' : 'completed with errors'
          }`
        )
      }
    } catch (error) {
      console.error('Data repair failed:', error)
      repairSuccess = false
    }

    return repairSuccess
  }

  /**
   * Get offline status information
   */
  getOfflineStatus(): {
    isOffline: boolean
    networkState: any
    capabilities: OfflineCapabilities
    lastSyncTime?: Date
  } {
    return {
      isOffline: networkService.isOffline(),
      networkState: networkService.getNetworkState(),
      capabilities: this.getOfflineCapabilities(),
      // lastSyncTime would be implemented when cloud sync is added
    }
  }

  /**
   * Handle network state changes
   */
  private handleNetworkStateChange(state: any): void {
    if (state.isConnected && state.isInternetReachable !== false) {
      // Device came online
      if (this.config.enableLogging) {
        console.log('Device is now online')
      }
      // Future: Trigger sync operations when cloud sync is implemented
    } else {
      // Device went offline
      if (this.config.enableLogging) {
        console.log('Device is now offline')
      }
    }
  }

  /**
   * Validate categories data
   */
  private async validateCategories(result: DataIntegrityResult): Promise<void> {
    try {
      const categories = await this.databaseService.executeQuery<any>(
        'SELECT * FROM categories'
      )

      for (const category of categories) {
        if (!category.id || !category.name) {
          result.errors.push(
            `Invalid category: missing id or name (id: ${category.id})`
          )
          result.corruptedRecords.categories.push(category.id || 'unknown')
        }

        if (category.name && category.name.trim().length === 0) {
          result.warnings.push(`Category has empty name: ${category.id}`)
        }
      }
    } catch (error) {
      result.errors.push(
        `Failed to validate categories: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Validate tasks data
   */
  private async validateTasks(result: DataIntegrityResult): Promise<void> {
    try {
      const tasks = await this.databaseService.executeQuery<any>(
        'SELECT * FROM tasks'
      )

      for (const task of tasks) {
        if (!task.id || !task.title || !task.category_id) {
          result.errors.push(
            `Invalid task: missing required fields (id: ${task.id})`
          )
          result.corruptedRecords.tasks.push(task.id || 'unknown')
        }

        if (task.title && task.title.trim().length === 0) {
          result.warnings.push(`Task has empty title: ${task.id}`)
        }

        if (task.default_minutes !== null && task.default_minutes < 0) {
          result.warnings.push(`Task has negative default minutes: ${task.id}`)
        }
      }
    } catch (error) {
      result.errors.push(
        `Failed to validate tasks: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Validate entries data
   */
  private async validateEntries(result: DataIntegrityResult): Promise<void> {
    try {
      const entries = await this.databaseService.executeQuery<any>(
        'SELECT * FROM entries'
      )

      for (const entry of entries) {
        if (!entry.id || !entry.date) {
          result.errors.push(
            `Invalid entry: missing id or date (id: ${entry.id})`
          )
          result.corruptedRecords.entries.push(entry.id || 'unknown')
        }

        if (entry.date && !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
          result.errors.push(
            `Invalid entry date format: ${entry.date} (id: ${entry.id})`
          )
          result.corruptedRecords.entries.push(entry.id)
        }

        if (entry.note === null || entry.note === undefined) {
          result.warnings.push(`Entry has null note: ${entry.id}`)
        }
      }
    } catch (error) {
      result.errors.push(
        `Failed to validate entries: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Validate completions data
   */
  private async validateCompletions(
    result: DataIntegrityResult
  ): Promise<void> {
    try {
      const completions = await this.databaseService.executeQuery<any>(
        'SELECT * FROM completions'
      )

      for (const completion of completions) {
        if (!completion.id || !completion.date || !completion.task_id) {
          result.errors.push(
            `Invalid completion: missing required fields (id: ${completion.id})`
          )
          result.corruptedRecords.completions.push(completion.id || 'unknown')
        }

        if (completion.date && !/^\d{4}-\d{2}-\d{2}$/.test(completion.date)) {
          result.errors.push(
            `Invalid completion date format: ${completion.date} (id: ${completion.id})`
          )
          result.corruptedRecords.completions.push(completion.id)
        }

        if (completion.minutes !== null && completion.minutes < 0) {
          result.warnings.push(
            `Completion has negative minutes: ${completion.id}`
          )
        }
      }
    } catch (error) {
      result.errors.push(
        `Failed to validate completions: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Validate foreign key relationships
   */
  private async validateRelationships(
    result: DataIntegrityResult
  ): Promise<void> {
    try {
      // Check tasks -> categories relationship
      const orphanedTasks = await this.databaseService.executeQuery<any>(
        `SELECT t.id, t.category_id 
         FROM tasks t 
         LEFT JOIN categories c ON t.category_id = c.id 
         WHERE c.id IS NULL`
      )

      for (const task of orphanedTasks) {
        result.errors.push(
          `Task references non-existent category: ${task.id} -> ${task.category_id}`
        )
        result.corruptedRecords.tasks.push(task.id)
      }

      // Check completions -> tasks relationship
      const orphanedCompletions = await this.databaseService.executeQuery<any>(
        `SELECT c.id, c.task_id 
         FROM completions c 
         LEFT JOIN tasks t ON c.task_id = t.id 
         WHERE t.id IS NULL`
      )

      for (const completion of orphanedCompletions) {
        result.errors.push(
          `Completion references non-existent task: ${completion.id} -> ${completion.task_id}`
        )
        result.corruptedRecords.completions.push(completion.id)
      }
    } catch (error) {
      result.errors.push(
        `Failed to validate relationships: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }
}

/**
 * Custom error class for offline-related errors
 */
export class OfflineError extends Error {
  constructor(
    message: string,
    public originalError?: any,
    public errorType: 'database' | 'network' | 'unknown' = 'unknown'
  ) {
    super(message)
    this.name = 'OfflineError'
  }
}

// Export singleton instance - will be initialized with database service
export let offlineService: OfflineService

export function initializeOfflineService(
  databaseService: DatabaseService
): void {
  offlineService = new OfflineService(databaseService, {
    enableDataValidation: true,
    enableIntegrityChecks: true,
    enableLogging: __DEV__,
    maxRetryAttempts: 3,
  })
}
