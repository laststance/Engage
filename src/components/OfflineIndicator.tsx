import React from 'react'
import { View, Text } from 'react-native'
import { useAppStore } from '../stores/app-store'

interface OfflineIndicatorProps {
  className?: string
}

/**
 * Component to show offline status and capabilities to users
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
}) => {
  const isOffline = useAppStore((state) => state.isOffline)
  const offlineCapabilities = useAppStore((state) => state.offlineCapabilities)
  const dataIntegrityStatus = useAppStore((state) => state.dataIntegrityStatus)

  if (!isOffline && dataIntegrityStatus === 'valid') {
    return null // Don't show anything when online and data is valid
  }

  return (
    <View
      className={`bg-orange-100 border-l-4 border-orange-500 p-3 ${className}`}
    >
      {isOffline && (
        <View className="flex-row items-center mb-2">
          <View className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
          <Text className="text-orange-800 text-sm font-medium">
            オフラインモード
          </Text>
        </View>
      )}

      {isOffline && (
        <Text className="text-orange-700 text-xs mb-2">
          インターネット接続がありませんが、すべての機能は正常に動作します。データはローカルに保存されます。
        </Text>
      )}

      {dataIntegrityStatus === 'invalid' && (
        <View className="flex-row items-center">
          <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
          <Text className="text-red-800 text-sm font-medium">
            データの整合性に問題があります
          </Text>
        </View>
      )}

      {dataIntegrityStatus === 'checking' && (
        <View className="flex-row items-center">
          <View className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
          <Text className="text-blue-800 text-sm font-medium">
            データの整合性を確認中...
          </Text>
        </View>
      )}
    </View>
  )
}

export default OfflineIndicator
