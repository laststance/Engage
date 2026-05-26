import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { Text } from '@/components/ui/text'
import { AppCard } from '../AppCard'
import { AppListRow } from '../AppListRow'
import { AppScreen } from '../AppScreen'
import { AppSection } from '../AppSection'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

describe('App layout primitives', () => {
  it('renders the shared screen title and description without custom headers', () => {
    // Arrange
    const { getByTestId, getByText } = render(
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

  it('groups content in a titled section with a card surface', () => {
    // Arrange
    const { getByTestId, getByText } = render(
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

  it('keeps list rows pressable and exposes selected accessibility state', () => {
    // Arrange
    const handlePress = jest.fn()
    const { getByTestId, getByText } = render(
      <AppListRow
        onPress={handlePress}
        selected
        subtitle="Opens the reminder setup"
        testID="settings-row"
        title="Notifications"
      />
    )

    // Act
    fireEvent.press(getByTestId('settings-row'))

    // Assert
    expect(getByText('Notifications')).toBeTruthy()
    expect(getByText('Opens the reminder setup')).toBeTruthy()
    expect(getByTestId('settings-row').props.accessibilityState.selected).toBe(
      true
    )
    expect(handlePress).toHaveBeenCalledTimes(1)
  })
})
