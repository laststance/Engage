import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  OperationFeedback,
  type OperationFeedbackKind,
} from '@/src/components/OperationFeedback'
import { useInteractionFeedback } from '@/src/hooks/useInteractionFeedback'
import { useAppStore } from '../stores/app-store'
import i18n from '@/src/i18n/config'

interface BackupInfo {
  fileName: string
  filePath: string
  size: number
  createdAt: Date
  isValid: boolean
}

interface BackupStats {
  totalBackups: number
  totalSize: number
  oldestBackup?: Date
  newestBackup?: Date
  validBackups: number
}

interface BackupFeedback {
  kind: OperationFeedbackKind
  message: string
  actionLabel?: string
  onAction?: () => void
}

type BackupActivity =
  | 'loadingMetadata'
  | 'idle'
  | 'creating'
  | 'exporting'
  | 'importing'
  | `deleting:${string}`

/**
 * Renders backup controls whenever Settings opens the local data-management screen.
 * @returns Backup creation, import, export, deletion, and status controls.
 * @example
 * <BackupManager />
 */
export const BackupManager: React.FC = () => {
  const { t } = useTranslation()
  const triggerFeedback = useInteractionFeedback()
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [activity, setActivity] =
    useState<BackupActivity>('loadingMetadata')
  const [operationFeedback, setOperationFeedback] =
    useState<BackupFeedback | null>(null)
  const isMountedRef = useRef(false)

  const {
    createBackup,
    exportData,
    importBackup,
    listBackups,
    deleteBackup,
    getBackupStats,
    error,
    clearError,
  } = useAppStore()

  /**
   * Reads backup files and aggregate statistics without changing component state.
   * @returns A promise containing the backup list and its aggregate statistics.
   * @example
   * const [backupList, backupStats] = await readBackupData()
   */
  const readBackupData = useCallback(
    () => Promise.all([listBackups(), getBackupStats()]),
    [getBackupStats, listBackups]
  )

  /**
   * Reloads rendered backup data after a user-triggered backup operation completes.
   * @returns A promise that settles after backup state and loading state are updated.
   * @example
   * await loadBackupData()
   */
  const loadBackupData = useCallback(async (): Promise<void> => {
    try {
      const [backupList, backupStats] = await readBackupData()

      // Native reads can finish after Settings closes, so only mounted UI receives them.
      if (!isMountedRef.current) {
        return
      }

      setBackups(backupList)
      setStats(backupStats)
    } catch (error) {
      console.error('Failed to load backup data:', error)
    } finally {
      if (isMountedRef.current) {
        setActivity('idle')
      }
    }
  }, [readBackupData])

  useEffect(() => {
    let shouldIgnoreResult = false
    isMountedRef.current = true

    void readBackupData()
      .then(([backupList, backupStats]) => {
        // A closed Settings screen must not receive its late native result.
        if (shouldIgnoreResult) {
          return
        }

        setBackups(backupList)
        setStats(backupStats)
      })
      .catch((error) => {
        console.error('Failed to load backup data:', error)
      })
      .finally(() => {
        if (!shouldIgnoreResult && isMountedRef.current) {
          setActivity('idle')
        }
      })

    return () => {
      shouldIgnoreResult = true
      isMountedRef.current = false
    }
  }, [readBackupData])

  const handleCreateBackup = async () => {
    try {
      setActivity('creating')
      clearError()
      setOperationFeedback({
        kind: 'saving',
        message: t('backup.creating'),
      })

      const result = await createBackup()

      if (!isMountedRef.current) {
        return
      }

      if (result.success) {
        triggerFeedback('complete')
        setOperationFeedback({
          kind: 'success',
          message: t('backup.createSuccessMessageInline', {
            fileName: result.fileName,
            size: formatFileSize(result.size || 0),
          }),
        })
        await loadBackupData()
      } else {
        triggerFeedback('error')
        setOperationFeedback({
          kind: 'error',
          message: result.errors.join('\n') || t('backup.createFailTitle'),
          actionLabel: t('common.retry'),
          onAction: () => {
            void handleCreateBackup()
          },
        })
      }
    } catch (error) {
      console.error('Failed to create backup:', error)

      if (!isMountedRef.current) {
        return
      }

      triggerFeedback('error')
      setOperationFeedback({
        kind: 'error',
        message: t('backup.createFailTitle'),
        actionLabel: t('common.retry'),
        onAction: () => {
          void handleCreateBackup()
        },
      })
    } finally {
      if (isMountedRef.current) {
        setActivity('idle')
      }
    }
  }

  const handleExportData = async () => {
    try {
      setActivity('exporting')
      clearError()
      setOperationFeedback({
        kind: 'saving',
        message: t('backup.exporting'),
      })

      const result = await exportData()

      if (!isMountedRef.current) {
        return
      }

      if (result.success) {
        triggerFeedback('complete')
        setOperationFeedback({
          kind: 'success',
          message: t('backup.exportSuccessMessage'),
        })
      } else {
        triggerFeedback('error')
        setOperationFeedback({
          kind: 'error',
          message: result.errors.join('\n') || t('backup.exportFailTitle'),
          actionLabel: t('common.retry'),
          onAction: () => {
            void handleExportData()
          },
        })
      }
    } catch (error) {
      console.error('Failed to export data:', error)

      if (!isMountedRef.current) {
        return
      }

      triggerFeedback('error')
      setOperationFeedback({
        kind: 'error',
        message: t('backup.exportFailTitle'),
        actionLabel: t('common.retry'),
        onAction: () => {
          void handleExportData()
        },
      })
    } finally {
      if (isMountedRef.current) {
        setActivity('idle')
      }
    }
  }

  const performImportBackup = async () => {
    try {
      setActivity('importing')
      clearError()
      setOperationFeedback({
        kind: 'saving',
        message: t('backup.importing'),
      })

      const result = await importBackup()

      if (!isMountedRef.current) {
        return
      }

      if (result.success) {
        triggerFeedback('complete')
        setOperationFeedback({
          kind: 'success',
          message: t('backup.importSuccessMessageInline', {
            categories: result.recordsImported.categories,
            tasks: result.recordsImported.tasks,
            entries: result.recordsImported.entries,
            completions: result.recordsImported.completions,
            settings: result.recordsImported.settings,
          }),
        })
        await loadBackupData()
        return
      }

      triggerFeedback('error')
      setOperationFeedback({
        kind: 'error',
        message: result.errors.join('\n') || t('backup.importFailTitle'),
        actionLabel: t('common.retry'),
        onAction: () => {
          void handleImportBackup()
        },
      })
    } catch (error) {
      console.error('Failed to import backup:', error)

      if (!isMountedRef.current) {
        return
      }

      triggerFeedback('error')
      setOperationFeedback({
        kind: 'error',
        message: t('backup.importFailTitle'),
        actionLabel: t('common.retry'),
        onAction: () => {
          void handleImportBackup()
        },
      })
    } finally {
      if (isMountedRef.current) {
        setActivity('idle')
      }
    }
  }

  const handleImportBackup = async () => {
    Alert.alert(
      t('backup.importConfirmTitle'),
      t('backup.importConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.continue'),
          style: 'destructive',
          onPress: () => {
            void performImportBackup()
          },
        },
      ]
    )
  }

  const performDeleteBackup = async (fileName: string) => {
    try {
      setActivity(`deleting:${fileName}`)
      setOperationFeedback({
        kind: 'saving',
        message: t('backup.deleting'),
      })
      const success = await deleteBackup(fileName)

      if (!isMountedRef.current) {
        return
      }

      if (success) {
        triggerFeedback('complete')
        setOperationFeedback({
          kind: 'success',
          message: t('backup.deleteSuccessMessage'),
        })
        await loadBackupData()
      } else {
        triggerFeedback('error')
        setOperationFeedback({
          kind: 'error',
          message: t('backup.deleteFailMessage'),
          actionLabel: t('common.retry'),
          onAction: () => {
            void performDeleteBackup(fileName)
          },
        })
      }
    } catch (error) {
      console.error('Failed to delete backup:', error)

      if (!isMountedRef.current) {
        return
      }

      triggerFeedback('error')
      setOperationFeedback({
        kind: 'error',
        message: t('backup.deleteFailMessage'),
        actionLabel: t('common.retry'),
        onAction: () => {
          void performDeleteBackup(fileName)
        },
      })
    } finally {
      if (isMountedRef.current) {
        setActivity('idle')
      }
    }
  }

  const handleDeleteBackup = async (fileName: string) => {
    Alert.alert(
      t('backup.deleteConfirmTitle'),
      t('backup.deleteConfirmMessage', { fileName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => performDeleteBackup(fileName),
        },
      ]
    )
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isMetadataLoading = activity === 'loadingMetadata'
  const areActionsDisabled = activity !== 'idle'

  return (
    <ScrollView className="flex-1 p-4 bg-white">
      {isMetadataLoading && (
        <View className="mb-4">
          <OperationFeedback
            kind="info"
            message={t('common.loading')}
            testID="backup-metadata-loading-feedback"
          />
        </View>
      )}

      {error && (
        <View className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <Text className="text-red-800">{error}</Text>
        </View>
      )}

      {operationFeedback && (
        <View className="mb-4">
          <OperationFeedback
            kind={operationFeedback.kind}
            message={operationFeedback.message}
            actionLabel={operationFeedback.actionLabel}
            onAction={operationFeedback.onAction}
            testID="backup-operation-feedback"
          />
        </View>
      )}

      {/* Backup Actions */}
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">{t('backup.operations')}</Text>

        <View className="space-y-3">
          <Button
            onPress={handleCreateBackup}
            disabled={areActionsDisabled}
            accessibilityState={{
              busy: activity === 'creating',
              disabled: areActionsDisabled,
            }}
            className="w-full"
            testID="backup-create-button"
          >
            <Text className="text-white font-medium">
              {activity === 'creating'
                ? t('backup.creating')
                : t('backup.create')}
            </Text>
          </Button>

          <Button
            onPress={handleExportData}
            disabled={areActionsDisabled}
            accessibilityState={{
              busy: activity === 'exporting',
              disabled: areActionsDisabled,
            }}
            variant="outline"
            className="w-full"
            testID="backup-export-button"
          >
            <Text className="font-medium">
              {activity === 'exporting'
                ? t('backup.exporting')
                : t('backup.export')}
            </Text>
          </Button>

          <Button
            onPress={handleImportBackup}
            disabled={areActionsDisabled}
            accessibilityState={{
              busy: activity === 'importing',
              disabled: areActionsDisabled,
            }}
            variant="outline"
            className="w-full"
            testID="backup-import-button"
          >
            <Text className="font-medium">
              {activity === 'importing'
                ? t('backup.importing')
                : t('backup.import')}
            </Text>
          </Button>
        </View>
      </View>

      {/* Backup Statistics */}
      {stats && (
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-3">{t('backup.statistics')}</Text>
          <View className="bg-gray-50 p-4 rounded-lg">
            <Text className="mb-2">{t('backup.totalBackups')} {stats.totalBackups}</Text>
            <Text className="mb-2">
              {t('backup.validBackups')} {stats.validBackups}
            </Text>
            <Text className="mb-2">
              {t('backup.totalSize')} {formatFileSize(stats.totalSize)}
            </Text>
            {stats.newestBackup && (
              <Text className="mb-2">
                {t('backup.latestBackup')} {formatDate(stats.newestBackup)}
              </Text>
            )}
            {stats.oldestBackup && (
              <Text>{t('backup.oldestBackup')} {formatDate(stats.oldestBackup)}</Text>
            )}
          </View>
        </View>
      )}

      {/* Backup List */}
      <View>
        <Text className="text-lg font-semibold mb-3">
          {t('backup.files', { count: backups.length })}
        </Text>

        {backups.length === 0 ? (
          <View className="bg-gray-50 p-4 rounded-lg">
            <Text className="text-gray-600 text-center">
              {t('backup.noFiles')}
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {backups.map((backup) => (
              <View
                key={backup.fileName}
                className="bg-gray-50 p-4 rounded-lg border"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="font-medium flex-1 mr-2">
                    {backup.fileName}
                  </Text>
                  <View className="flex-row items-center">
                    {backup.isValid ? (
                      <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    ) : (
                      <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                    )}
                    <Text className="text-xs text-gray-600">
                      {backup.isValid ? t('backup.valid') : t('backup.invalid')}
                    </Text>
                  </View>
                </View>

                <Text className="text-sm text-gray-600 mb-2">
                  {t('backup.createdAt')} {formatDate(backup.createdAt)}
                </Text>

                <Text className="text-sm text-gray-600 mb-3">
                  {t('backup.size')} {formatFileSize(backup.size)}
                </Text>

                <Button
                  onPress={() => handleDeleteBackup(backup.fileName)}
                  disabled={areActionsDisabled}
                  accessibilityState={{
                    busy: activity === `deleting:${backup.fileName}`,
                    disabled: areActionsDisabled,
                  }}
                  variant="outline"
                  size="sm"
                  className="self-start"
                  testID={`backup-delete-button-${backup.fileName}`}
                >
                  <Text className="text-red-600 text-sm">{t('common.delete')}</Text>
                </Button>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}
