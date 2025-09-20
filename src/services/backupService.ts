import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import * as DocumentPicker from 'expo-document-picker'
import { DatabaseService, DatabaseError } from './database'
import { Task, Entry, Completion, Category } from '../types'

export interface BackupData {
  version: string
  timestamp: number
  categories: Category[]
  tasks: Task[]
  entries: Entry[]
  completions: Completion[]
  settings: Array<{ key: string; value: string }>
  metadata: {
    totalRecords: number
    exportedBy: string
    appVersion: string
  }
}

export interface BackupResult {
  success: boolean
  filePath?: string
  fileName?: string
  size?: number
  errors: string[]
}

export interface RestoreResult {
  success: boolean
  recordsImported: {
    categories: number
    tasks: number
    entries: number
    completions: number
    settings: number
  }
  errors: string[]
  warnings: string[]
}

export interface BackupValidationResult {
  isValid: boolean
  version: string
  timestamp: number
  recordCounts: {
    categories: number
    tasks: number
    entries: number
    completions: number
    settings: number
  }
  errors: string[]
  warnings: string[]
}

/**
 * Service for managing data backup and export functionality
 */
export class BackupService {
  private readonly BACKUP_VERSION = '1.0'
  private readonly BACKUP_DIRECTORY = `${FileSystem.documentDirectory}backups/`
  private readonly MAX_BACKUP_FILES = 10 // Keep only last 10 backups

  constructor(private databaseService: DatabaseService) {}

  /**
   * Create a full backup of all app data
   */
  async createBackup(includeMetadata: boolean = true): Promise<BackupResult> {
    try {
      // Ensure backup directory exists
      await this.ensureBackupDirectory()

      // Export all data from database
      const exportedData = await this.databaseService.exportData()

      // Create backup data structure
      const backupData: BackupData = {
        version: this.BACKUP_VERSION,
        timestamp: Date.now(),
        categories: exportedData.categories,
        tasks: exportedData.tasks,
        entries: exportedData.entries,
        completions: exportedData.completions,
        settings: exportedData.settings,
        metadata: {
          totalRecords:
            exportedData.categories.length +
            exportedData.tasks.length +
            exportedData.entries.length +
            exportedData.completions.length +
            exportedData.settings.length,
          exportedBy: 'Engage App',
          appVersion: '1.0.0', // This should come from app.json in real implementation
        },
      }

      // Generate backup filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `engage-backup-${timestamp}.json`
      const filePath = `${this.BACKUP_DIRECTORY}${fileName}`

      // Write backup file
      const backupJson = JSON.stringify(backupData, null, 2)
      await FileSystem.writeAsStringAsync(filePath, backupJson)

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(filePath)
      const size = fileInfo.exists ? fileInfo.size : 0

      // Clean up old backups
      await this.cleanupOldBackups()

      console.log(`Backup created successfully: ${fileName} (${size} bytes)`)

      return {
        success: true,
        filePath,
        fileName,
        size,
        errors: [],
      }
    } catch (error) {
      console.error('Failed to create backup:', error)
      return {
        success: false,
        errors: [
          error instanceof Error
            ? error.message
            : 'Unknown error occurred during backup',
        ],
      }
    }
  }

  /**
   * Export data and share it with user
   */
  async exportAndShare(): Promise<BackupResult> {
    try {
      const backupResult = await this.createBackup()

      if (!backupResult.success || !backupResult.filePath) {
        return backupResult
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync()
      if (!isAvailable) {
        return {
          success: false,
          errors: ['Sharing is not available on this device'],
        }
      }

      // Share the backup file
      await Sharing.shareAsync(backupResult.filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export Engage App Data',
        UTI: 'public.json',
      })

      return backupResult
    } catch (error) {
      console.error('Failed to export and share:', error)
      return {
        success: false,
        errors: [
          error instanceof Error
            ? error.message
            : 'Failed to export and share data',
        ],
      }
    }
  }

  /**
   * Import backup data from file
   */
  async importBackup(): Promise<RestoreResult> {
    try {
      // Let user pick a backup file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      })

      if (result.canceled) {
        return {
          success: false,
          recordsImported: {
            categories: 0,
            tasks: 0,
            entries: 0,
            completions: 0,
            settings: 0,
          },
          errors: ['Import cancelled by user'],
          warnings: [],
        }
      }

      const fileUri = result.assets[0].uri

      // Read and parse backup file
      const backupJson = await FileSystem.readAsStringAsync(fileUri)
      const backupData: BackupData = JSON.parse(backupJson)

      // Validate backup data
      const validationResult = await this.validateBackupData(backupData)
      if (!validationResult.isValid) {
        return {
          success: false,
          recordsImported: {
            categories: 0,
            tasks: 0,
            entries: 0,
            completions: 0,
            settings: 0,
          },
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        }
      }

      // Import data to database
      await this.databaseService.importData({
        categories: backupData.categories,
        tasks: backupData.tasks,
        entries: backupData.entries,
        completions: backupData.completions,
        settings: backupData.settings,
      })

      const recordsImported = {
        categories: backupData.categories.length,
        tasks: backupData.tasks.length,
        entries: backupData.entries.length,
        completions: backupData.completions.length,
        settings: backupData.settings.length,
      }

      console.log('Backup imported successfully:', recordsImported)

      return {
        success: true,
        recordsImported,
        errors: [],
        warnings: validationResult.warnings,
      }
    } catch (error) {
      console.error('Failed to import backup:', error)
      return {
        success: false,
        recordsImported: {
          categories: 0,
          tasks: 0,
          entries: 0,
          completions: 0,
          settings: 0,
        },
        errors: [
          error instanceof Error
            ? error.message
            : 'Failed to import backup data',
        ],
        warnings: [],
      }
    }
  }

  /**
   * List all available backup files
   */
  async listBackups(): Promise<
    Array<{
      fileName: string
      filePath: string
      size: number
      createdAt: Date
      isValid: boolean
    }>
  > {
    try {
      await this.ensureBackupDirectory()

      const files = await FileSystem.readDirectoryAsync(this.BACKUP_DIRECTORY)
      const backupFiles = files.filter(
        (file) => file.startsWith('engage-backup-') && file.endsWith('.json')
      )

      const backupInfo = await Promise.all(
        backupFiles.map(async (fileName) => {
          const filePath = `${this.BACKUP_DIRECTORY}${fileName}`
          const fileInfo = await FileSystem.getInfoAsync(filePath)

          let isValid = false
          let createdAt = new Date()

          if (fileInfo.exists) {
            try {
              // Try to parse the backup file to check if it's valid
              const backupJson = await FileSystem.readAsStringAsync(filePath)
              const backupData: BackupData = JSON.parse(backupJson)

              const validation = await this.validateBackupData(backupData)
              isValid = validation.isValid
              createdAt = new Date(backupData.timestamp)
            } catch (error) {
              console.warn(`Invalid backup file: ${fileName}`, error)
              isValid = false
            }
          }

          return {
            fileName,
            filePath,
            size: fileInfo.exists ? fileInfo.size || 0 : 0,
            createdAt,
            isValid,
          }
        })
      )

      // Sort by creation date (newest first)
      return backupInfo.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )
    } catch (error) {
      console.error('Failed to list backups:', error)
      return []
    }
  }

  /**
   * Delete a specific backup file
   */
  async deleteBackup(fileName: string): Promise<boolean> {
    try {
      const filePath = `${this.BACKUP_DIRECTORY}${fileName}`
      const fileInfo = await FileSystem.getInfoAsync(filePath)

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath)
        console.log(`Backup deleted: ${fileName}`)
        return true
      } else {
        console.warn(`Backup file not found: ${fileName}`)
        return false
      }
    } catch (error) {
      console.error(`Failed to delete backup ${fileName}:`, error)
      return false
    }
  }

  /**
   * Validate backup data structure and integrity
   */
  async validateBackupData(backupData: any): Promise<BackupValidationResult> {
    const result: BackupValidationResult = {
      isValid: true,
      version: '',
      timestamp: 0,
      recordCounts: {
        categories: 0,
        tasks: 0,
        entries: 0,
        completions: 0,
        settings: 0,
      },
      errors: [],
      warnings: [],
    }

    try {
      // Check required fields
      if (!backupData.version) {
        result.errors.push('Missing backup version')
      } else {
        result.version = backupData.version
      }

      if (!backupData.timestamp) {
        result.errors.push('Missing backup timestamp')
      } else {
        result.timestamp = backupData.timestamp
      }

      // Check data arrays
      if (!Array.isArray(backupData.categories)) {
        result.errors.push('Invalid categories data')
      } else {
        result.recordCounts.categories = backupData.categories.length

        // Validate category structure
        for (const category of backupData.categories) {
          if (!category.id || !category.name) {
            result.errors.push(
              `Invalid category structure: ${JSON.stringify(category)}`
            )
          }
        }
      }

      if (!Array.isArray(backupData.tasks)) {
        result.errors.push('Invalid tasks data')
      } else {
        result.recordCounts.tasks = backupData.tasks.length

        // Validate task structure
        for (const task of backupData.tasks) {
          if (!task.id || !task.title || !task.categoryId) {
            result.errors.push(
              `Invalid task structure: ${JSON.stringify(task)}`
            )
          }
        }
      }

      if (!Array.isArray(backupData.entries)) {
        result.errors.push('Invalid entries data')
      } else {
        result.recordCounts.entries = backupData.entries.length

        // Validate entry structure
        for (const entry of backupData.entries) {
          if (!entry.id || !entry.date) {
            result.errors.push(
              `Invalid entry structure: ${JSON.stringify(entry)}`
            )
          }
        }
      }

      if (!Array.isArray(backupData.completions)) {
        result.errors.push('Invalid completions data')
      } else {
        result.recordCounts.completions = backupData.completions.length

        // Validate completion structure
        for (const completion of backupData.completions) {
          if (!completion.id || !completion.date || !completion.taskId) {
            result.errors.push(
              `Invalid completion structure: ${JSON.stringify(completion)}`
            )
          }
        }
      }

      if (!Array.isArray(backupData.settings)) {
        result.errors.push('Invalid settings data')
      } else {
        result.recordCounts.settings = backupData.settings.length
      }

      // Check version compatibility
      if (result.version && result.version !== this.BACKUP_VERSION) {
        result.warnings.push(
          `Backup version ${result.version} may not be fully compatible with current version ${this.BACKUP_VERSION}`
        )
      }

      // Check data age
      if (result.timestamp) {
        const backupAge = Date.now() - result.timestamp
        const thirtyDays = 30 * 24 * 60 * 60 * 1000

        if (backupAge > thirtyDays) {
          result.warnings.push('Backup is older than 30 days')
        }
      }

      result.isValid = result.errors.length === 0

      console.log('Backup validation completed:', {
        isValid: result.isValid,
        errorsCount: result.errors.length,
        warningsCount: result.warnings.length,
        recordCounts: result.recordCounts,
      })
    } catch (error) {
      result.isValid = false
      result.errors.push(
        `Validation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }

    return result
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    totalBackups: number
    totalSize: number
    oldestBackup?: Date
    newestBackup?: Date
    validBackups: number
  }> {
    try {
      const backups = await this.listBackups()

      const stats = {
        totalBackups: backups.length,
        totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
        oldestBackup:
          backups.length > 0
            ? backups[backups.length - 1].createdAt
            : undefined,
        newestBackup: backups.length > 0 ? backups[0].createdAt : undefined,
        validBackups: backups.filter((backup) => backup.isValid).length,
      }

      return stats
    } catch (error) {
      console.error('Failed to get backup stats:', error)
      return {
        totalBackups: 0,
        totalSize: 0,
        validBackups: 0,
      }
    }
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this.BACKUP_DIRECTORY)
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.BACKUP_DIRECTORY, {
        intermediates: true,
      })
    }
  }

  /**
   * Clean up old backup files (keep only MAX_BACKUP_FILES)
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups()

      if (backups.length > this.MAX_BACKUP_FILES) {
        const backupsToDelete = backups.slice(this.MAX_BACKUP_FILES)

        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup.fileName)
        }

        console.log(`Cleaned up ${backupsToDelete.length} old backup files`)
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error)
    }
  }
}

// Export singleton instance - will be initialized with database service
export let backupService: BackupService

export function initializeBackupService(
  databaseService: DatabaseService
): void {
  backupService = new BackupService(databaseService)
}
