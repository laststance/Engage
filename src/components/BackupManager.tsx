import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
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

/**
 * Component for managing data backups and exports
 */
export const BackupManager: React.FC = () => {
  const { t } = useTranslation()
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

  useEffect(() => {
    loadBackupData()
  }, [])

  const loadBackupData = async () => {
    try {
      setIsLoading(true)
      const [backupList, backupStats] = await Promise.all([
        listBackups(),
        getBackupStats(),
      ])
      setBackups(backupList)
      setStats(backupStats)
    } catch (error) {
      console.error('Failed to load backup data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    try {
      setIsLoading(true)
      clearError()

      const result = await createBackup()

      if (result.success) {
        Alert.alert(
          t('backup.createSuccessTitle'),
          t('backup.createSuccessMessage', { fileName: result.fileName, size: formatFileSize(result.size || 0) }),
          [{ text: t('common.ok') }]
        )
        await loadBackupData()
      } else {
        Alert.alert(t('backup.createFailTitle'), result.errors.join('\n'), [
          { text: t('common.ok') },
        ])
      }
    } catch (error) {
      console.error('Failed to create backup:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      setIsLoading(true)
      clearError()

      const result = await exportData()

      if (result.success) {
        Alert.alert(
          t('backup.exportSuccessTitle'),
          t('backup.exportSuccessMessage'),
          [{ text: t('common.ok') }]
        )
      } else {
        Alert.alert(t('backup.exportFailTitle'), result.errors.join('\n'), [
          { text: t('common.ok') },
        ])
      }
    } catch (error) {
      console.error('Failed to export data:', error)
    } finally {
      setIsLoading(false)
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
          onPress: async () => {
            try {
              setIsLoading(true)
              clearError()

              const result = await importBackup()

              if (result.success) {
                Alert.alert(
                  t('backup.importSuccessTitle'),
                  t('backup.importSuccessMessage', {
                    categories: result.recordsImported.categories,
                    tasks: result.recordsImported.tasks,
                    entries: result.recordsImported.entries,
                    completions: result.recordsImported.completions,
                    settings: result.recordsImported.settings,
                  }),
                  [{ text: t('common.ok') }]
                )
                await loadBackupData()
              } else {
                Alert.alert(t('backup.importFailTitle'), result.errors.join('\n'), [
                  { text: t('common.ok') },
                ])
              }
            } catch (error) {
              console.error('Failed to import backup:', error)
            } finally {
              setIsLoading(false)
            }
          },
        },
      ]
    )
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
          onPress: async () => {
            try {
              setIsLoading(true)
              const success = await deleteBackup(fileName)

              if (success) {
                Alert.alert(t('backup.deleteSuccessTitle'), t('backup.deleteSuccessMessage'), [
                  { text: t('common.ok') },
                ])
                await loadBackupData()
              } else {
                Alert.alert(t('backup.deleteFailTitle'), t('backup.deleteFailMessage'), [
                  { text: t('common.ok') },
                ])
              }
            } catch (error) {
              console.error('Failed to delete backup:', error)
            } finally {
              setIsLoading(false)
            }
          },
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

  return (
    <ScrollView className="flex-1 p-4 bg-white">


      {error && (
        <View className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <Text className="text-red-800">{error}</Text>
        </View>
      )}

      {/* Backup Actions */}
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">{t('backup.operations')}</Text>

        <View className="space-y-3">
          <Button
            onPress={handleCreateBackup}
            disabled={isLoading}
            className="w-full"
          >
            <Text className="text-white font-medium">
              {isLoading ? t('backup.creating') : t('backup.create')}
            </Text>
          </Button>

          <Button
            onPress={handleExportData}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <Text className="font-medium">
              {isLoading ? t('backup.exporting') : t('backup.export')}
            </Text>
          </Button>

          <Button
            onPress={handleImportBackup}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <Text className="font-medium">
              {isLoading ? t('backup.importing') : t('backup.import')}
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
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="self-start"
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

export default BackupManager
