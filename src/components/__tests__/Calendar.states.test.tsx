import React from 'react'
import { fireEvent, render, within } from '@testing-library/react-native'
import { Calendar } from '../Calendar'

describe('Calendar completion and date markers', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  /**
   * Value: protects=today remains identifiable as selection moves to another completed date;
   * fails_when=selection leaves today blue or moves the today underline to another date;
   * why_new=the existing assertion covered only today and selection on the same date;
   * seam=none; no_claim=native border rasterization or perceptual color distinction.
   */
  test('keeps today identifiable when selecting another high-completion day', async () => {
    // Arrange
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 23, 12))
    const onDateSelect = jest.fn()
    const achievementData = { '2026-10-23': 4, '2026-10-15': 4, '2026-10-12': 3, '2026-09-30': 7 }

    // Act
    const screen = await render(
      <Calendar
        selectedDate="2026-10-23"
        onDateSelect={onDateSelect}
        achievementData={achievementData}
      />
    )

    // Assert
    expect(screen.getByTestId('calendar-date-label-2026-10-23')).toBeVisible()
    expect(screen.getByTestId('calendar-today-marker-2026-10-23')).toBeVisible()
    expect(screen.getByTestId('calendar-today-marker-2026-10-23')).toHaveStyle({
      height: 1,
      backgroundColor: '#9A3412',
    })
    expect(screen.getByTestId('achievement-indicator-2026-10-23')).toHaveStyle({
      backgroundColor: '#84B59A',
      borderColor: '#1E40AF',
      borderWidth: 2,
    })
    expect(screen.getByTestId('calendar-date-2026-10-23').props.accessibilityState).toMatchObject({ selected: true })
    expect(screen.getByTestId('calendar-date-2026-10-23').props.accessibilityValue).toEqual({ text: 'calendar.currentDateA11yValue' })

    // Act
    await fireEvent.press(screen.getByTestId('calendar-date-2026-10-15'))
    await screen.rerender(
      <Calendar selectedDate="2026-10-15" onDateSelect={onDateSelect} achievementData={achievementData} />
    )

    // Assert
    expect(onDateSelect).toHaveBeenCalledWith('2026-10-15')
    expect(screen.getByTestId('achievement-indicator-2026-10-23')).toHaveStyle({ borderColor: '#9A3412', borderWidth: 2 })
    expect(screen.getByTestId('calendar-today-marker-2026-10-23')).toBeVisible()
    expect(screen.getByTestId('calendar-date-2026-10-23').props.accessibilityState).toMatchObject({ selected: false })
    expect(screen.getByTestId('achievement-indicator-2026-10-15')).toHaveStyle({ borderColor: '#1E40AF', borderWidth: 2 })
    expect(screen.queryByTestId('calendar-today-marker-2026-10-15')).toBeNull()
    expect(screen.getByTestId('calendar-date-2026-10-15').props.accessibilityState).toMatchObject({ selected: true })
    expect(screen.getByTestId('achievement-indicator-2026-10-12')).not.toHaveStyle({ borderWidth: 2 })
    expect(screen.getByTestId('calendar-date-label-2026-09-30').props.className).toContain('text-gray-300')
    expect(screen.getByTestId('achievement-indicator-2026-09-30').props.className).toContain('bg-gray-50')
    expect(screen.getByTestId('achievement-indicator-2026-09-30')).not.toHaveStyle({ backgroundColor: '#84B59A' })
    expect(screen.getByTestId('calendar-date-2026-09-30')).toBeDisabled()
  })

  /**
   * Value: protects=the legend explains all five completion levels including four or more;
   * fails_when=a level disappears or its swatch no longer matches the completion scale;
   * why_new=the existing assertion checked only the highest legend level;
   * seam=none; no_claim=rendered spacing or translated surrounding legend text.
   */
  test('explains all completion buckets including days with more than four tasks', async () => {
    // Arrange
    const props = {
      selectedDate: '2026-10-15',
      onDateSelect: jest.fn(),
      achievementData: { '2026-10-15': 7 },
    }

    // Act
    const screen = await render(<Calendar {...props} />)

    // Assert
    const legend = within(screen.getByTestId('calendar-completion-legend'))
    expect(legend.getByText('0')).toBeVisible()
    expect(legend.getByText('1')).toBeVisible()
    expect(legend.getByText('2')).toBeVisible()
    expect(legend.getByText('3')).toBeVisible()
    expect(legend.getByText('4+')).toBeVisible()
    expect(screen.getByTestId('calendar-legend-level-0')).toHaveStyle({ backgroundColor: '#F3F4F6' })
    expect(screen.getByTestId('calendar-legend-level-1')).toHaveStyle({ backgroundColor: '#E6F1E9' })
    expect(screen.getByTestId('calendar-legend-level-2')).toHaveStyle({ backgroundColor: '#C8DFCF' })
    expect(screen.getByTestId('calendar-legend-level-3')).toHaveStyle({ backgroundColor: '#A9CBB6' })
    expect(screen.getByTestId('calendar-legend-level-4')).toHaveStyle({ backgroundColor: '#84B59A' })
    expect(screen.getByTestId('achievement-indicator-2026-10-15')).toHaveStyle({ backgroundColor: '#84B59A' })
  })
})
