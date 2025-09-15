import React from 'react'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { Center } from '@/components/ui/center'

export default function StatsScreen() {
  return (
    <Box className="flex-1 bg-white" testID="stats-screen">
      <Center className="flex-1">
        <VStack space="md" className="items-center">
          <Text
            className="text-2xl font-bold text-gray-800"
            testID="stats-title"
          >
            Statistics
          </Text>
          <Text
            className="text-gray-600 text-center px-4"
            testID="stats-description"
          >
            This screen will show habit completion statistics and analytics.
          </Text>
        </VStack>
      </Center>
    </Box>
  )
}
