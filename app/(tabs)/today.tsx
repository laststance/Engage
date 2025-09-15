import React from 'react'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { Center } from '@/components/ui/center'

export default function TodayScreen() {
  return (
    <Box className="flex-1 bg-white" testID="today-screen">
      <Center className="flex-1">
        <VStack space="md" className="items-center">
          <Text
            className="text-2xl font-bold text-gray-800"
            testID="today-title"
          >
            Today's Tasks
          </Text>
          <Text
            className="text-gray-600 text-center px-4"
            testID="today-description"
          >
            This screen will show today's selected tasks and journal entry.
          </Text>
        </VStack>
      </Center>
    </Box>
  )
}
