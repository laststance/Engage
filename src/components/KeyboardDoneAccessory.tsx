import React from 'react'
import { InputAccessoryView, Platform } from 'react-native'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { AppPressable } from '@/src/components/AppPressable'

interface KeyboardDoneAccessoryProps {
  accessibilityLabel: string
  nativeID: string
  onPress: () => void
  testID: string
  title: string
}

/**
 * Renders the iOS keyboard toolbar button used by form fields to finish editing.
 * @param props - The native accessory ID, labels, and callback for the active input.
 * @returns The iOS InputAccessoryView toolbar, or null on non-iOS platforms.
 * @example
 * <KeyboardDoneAccessory nativeID="note-accessory" title="Done" accessibilityLabel="Finish editing" onPress={Keyboard.dismiss} testID="note-done" />
 */
export const KeyboardDoneAccessory: React.FC<KeyboardDoneAccessoryProps> = ({
  accessibilityLabel,
  nativeID,
  onPress,
  testID,
  title,
}) => {
  if (Platform.OS !== 'ios') {
    return null
  }

  return (
    <InputAccessoryView nativeID={nativeID}>
      <Box className="items-end border-t border-gray-200 bg-gray-50 px-3 py-2">
        <AppPressable
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          className="rounded-lg px-3 py-2"
          feedback="select"
          onPress={onPress}
          pressedClassName="bg-gray-200"
          testID={testID}
        >
          <Text className="text-base font-semibold text-blue-600">
            {title}
          </Text>
        </AppPressable>
      </Box>
    </InputAccessoryView>
  )
}
