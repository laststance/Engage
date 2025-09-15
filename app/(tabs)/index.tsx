import React from 'react'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { Center } from '@/components/ui/center'

export default function CalendarScreen() {
  return (
    <Box className="flex-1 bg-white" testID="calendar-screen">
      <Center className="flex-1">
        <VStack space="md" className="items-center">
          <Text
            className="text-2xl font-bold text-gray-800"
            testID="calendar-title"
          >
            Calendar
          </Text>
          <Text
            className="text-gray-600 text-center px-4"
            testID="calendar-description"
          >
            This screen will show the monthly calendar with habit completion
            heatmap.
          </Text>
        </VStack>
      </Center>
    </Box>
  )
}
