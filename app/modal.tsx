import { router } from 'expo-router'
import { View, Text } from 'react-native'
// import { NotificationSettings } from '@/src/components/NotificationSettings'

export default function ModalScreen() {
  const handleClose = () => {
    router.back()
  }

  return (
    <View className="flex-1 justify-center items-center p-6">
      <Text className="text-2xl font-bold mb-4">Settings</Text>
      <Text className="text-gray-600 text-center">
        Settings screen is temporarily disabled while fixing navigation issues.
      </Text>
    </View>
  )
  // return <NotificationSettings onClose={handleClose} />
}
