import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { Text } from '@/components/ui/text'
import { AppCard } from '../AppCard'
import { AppListRow } from '../AppListRow'
import { AppScreen } from '../AppScreen'
import { AppSection } from '../AppSection'

jest.mock('@react-native-vector-icons/ionicons', () => 'Ionicons')

describe('App layout primitives', () => {
  test('renders the shared screen title and description without custom headers', async () => {
    // Arrange
    const { getByTestId, getByText } = await render(
      <AppScreen
        description="Shared description"
        descriptionTestID="screen-description"
        testID="screen"
        title="Shared title"
        titleTestID="screen-title"
      >
        <Text>Screen body</Text>
      </AppScreen>
    )

    // Assert
    expect(getByTestId('screen')).toBeTruthy()
    expect(getByTestId('screen-title')).toBeTruthy()
    expect(getByTestId('screen-description')).toBeTruthy()
    expect(getByText('Screen body')).toBeTruthy()
  })

  test('groups content in a titled section with a card surface', async () => {
    // Arrange
    const { getByTestId, getByText } = await render(
      <AppSection title="Daily summary" titleTestID="section-title">
        <AppCard testID="summary-card">
          <Text>Three completed habits</Text>
        </AppCard>
      </AppSection>
    )

    // Assert
    expect(getByTestId('section-title')).toBeTruthy()
    expect(getByTestId('summary-card')).toBeTruthy()
    expect(getByText('Three completed habits')).toBeTruthy()
  })

  test('keeps list rows pressable and exposes selected accessibility state', async () => {
    // Arrange
    const handlePress = jest.fn()
    const { getByTestId, getByText } = await render(
      <AppListRow
        onPress={handlePress}
        selected
        subtitle="Opens the reminder setup"
        testID="settings-row"
        title="Notifications"
      />
    )

    // Act
    await fireEvent.press(getByTestId('settings-row'))

    // Assert
    expect(getByText('Notifications')).toBeTruthy()
    expect(getByText('Opens the reminder setup')).toBeTruthy()
    expect(getByTestId('settings-row').props.accessibilityState.selected).toBe(
      true
    )
    expect(handlePress).toHaveBeenCalledTimes(1)
  })
})
