import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Alert } from 'react-native'
import { Button } from '@/components/ui/button'
import { useAppStore } from '../stores/app-store'

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
          'バックアップ作成完了',
          `バックアップが正常に作成されました。\n\nファイル名: ${
            result.fileName
          }\nサイズ: ${formatFileSize(result.size || 0)}`,
          [{ text: 'OK' }]
        )
        await loadBackupData()
      } else {
        Alert.alert('バックアップ作成失敗', result.errors.join('\n'), [
          { text: 'OK' },
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
          'データエクスポート完了',
          'データが正常にエクスポートされ、共有されました。',
          [{ text: 'OK' }]
        )
      } else {
        Alert.alert('エクスポート失敗', result.errors.join('\n'), [
          { text: 'OK' },
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
      'データインポート',
      'この操作により、現在のデータがすべて置き換えられます。続行しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '続行',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true)
              clearError()

              const result = await importBackup()

              if (result.success) {
                Alert.alert(
                  'インポート完了',
                  `データが正常にインポートされました。\n\n` +
                    `カテゴリ: ${result.recordsImported.categories}\n` +
                    `タスク: ${result.recordsImported.tasks}\n` +
                    `エントリ: ${result.recordsImported.entries}\n` +
                    `完了記録: ${result.recordsImported.completions}\n` +
                    `設定: ${result.recordsImported.settings}`,
                  [{ text: 'OK' }]
                )
                await loadBackupData()
              } else {
                Alert.alert('インポート失敗', result.errors.join('\n'), [
                  { text: 'OK' },
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
      'バックアップ削除',
      `バックアップファイル「${fileName}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true)
              const success = await deleteBackup(fileName)

              if (success) {
                Alert.alert('削除完了', 'バックアップが削除されました。', [
                  { text: 'OK' },
                ])
                await loadBackupData()
              } else {
                Alert.alert('削除失敗', 'バックアップの削除に失敗しました。', [
                  { text: 'OK' },
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
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <ScrollView className="flex-1 p-4 bg-white">
      <Text className="text-2xl font-bold mb-6">データバックアップ</Text>

      {error && (
        <View className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <Text className="text-red-800">{error}</Text>
        </View>
      )}

      {/* Backup Actions */}
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">バックアップ操作</Text>

        <View className="space-y-3">
          <Button
            onPress={handleCreateBackup}
            disabled={isLoading}
            className="w-full"
          >
            <Text className="text-white font-medium">
              {isLoading ? 'バックアップ作成中...' : 'バックアップを作成'}
            </Text>
          </Button>

          <Button
            onPress={handleExportData}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <Text className="font-medium">
              {isLoading ? 'エクスポート中...' : 'データをエクスポート・共有'}
            </Text>
          </Button>

          <Button
            onPress={handleImportBackup}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <Text className="font-medium">
              {isLoading ? 'インポート中...' : 'バックアップをインポート'}
            </Text>
          </Button>
        </View>
      </View>

      {/* Backup Statistics */}
      {stats && (
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-3">バックアップ統計</Text>
          <View className="bg-gray-50 p-4 rounded-lg">
            <Text className="mb-2">総バックアップ数: {stats.totalBackups}</Text>
            <Text className="mb-2">
              有効なバックアップ: {stats.validBackups}
            </Text>
            <Text className="mb-2">
              総サイズ: {formatFileSize(stats.totalSize)}
            </Text>
            {stats.newestBackup && (
              <Text className="mb-2">
                最新バックアップ: {formatDate(stats.newestBackup)}
              </Text>
            )}
            {stats.oldestBackup && (
              <Text>最古バックアップ: {formatDate(stats.oldestBackup)}</Text>
            )}
          </View>
        </View>
      )}

      {/* Backup List */}
      <View>
        <Text className="text-lg font-semibold mb-3">
          バックアップファイル ({backups.length})
        </Text>

        {backups.length === 0 ? (
          <View className="bg-gray-50 p-4 rounded-lg">
            <Text className="text-gray-600 text-center">
              バックアップファイルがありません
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
                      {backup.isValid ? '有効' : '無効'}
                    </Text>
                  </View>
                </View>

                <Text className="text-sm text-gray-600 mb-2">
                  作成日時: {formatDate(backup.createdAt)}
                </Text>

                <Text className="text-sm text-gray-600 mb-3">
                  サイズ: {formatFileSize(backup.size)}
                </Text>

                <Button
                  onPress={() => handleDeleteBackup(backup.fileName)}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="self-start"
                >
                  <Text className="text-red-600 text-sm">削除</Text>
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
