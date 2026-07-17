import React from 'react'
import { Alert } from 'react-native'
import {
  act,
  fireEvent,
  render,
  waitFor,
  within,
} from '@testing-library/react-native'
import { BackupManager } from '@/src/components/BackupManager'

const mockUseAppStore = jest.fn()

jest.mock('@/components/ui/button', () => {
  return {
    Button: 'Button',
  }
})

jest.mock('../../stores/app-store', () => ({
  useAppStore: (selector: (state: unknown) => unknown) =>
    mockUseAppStore(selector),
}))

describe('BackupManager', () => {
  const store = {
    createBackup: jest.fn(),
    exportData: jest.fn(),
    importBackup: jest.fn(),
    listBackups: jest.fn(),
    deleteBackup: jest.fn(),
    getBackupStats: jest.fn(),
    error: null,
    clearError: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert')
    store.listBackups.mockResolvedValue([])
    store.getBackupStats.mockResolvedValue({
      totalBackups: 0,
      totalSize: 0,
      validBackups: 0,
    })
    mockUseAppStore.mockImplementation((selector) =>
      typeof selector === 'function' ? selector(store) : store
    )
  })

  it('shows generic metadata loading without announcing backup operations', () => {
    // Arrange
    store.listBackups.mockReturnValue(new Promise(() => undefined))
    store.getBackupStats.mockReturnValue(new Promise(() => undefined))

    // Act
    const { getByTestId, getByText } = render(<BackupManager />)

    // Assert
    expect(getByTestId('backup-metadata-loading-feedback')).toBeTruthy()
    expect(getByText('common.loading')).toBeTruthy()
    expect(getByText('backup.create')).toBeTruthy()
    expect(getByText('backup.export')).toBeTruthy()
    expect(getByText('backup.import')).toBeTruthy()

    // Initial loading disables every operation without claiming any one is active.
    for (const testID of [
      'backup-create-button',
      'backup-export-button',
      'backup-import-button',
    ]) {
      expect(getByTestId(testID).props.accessibilityState).toMatchObject({
        busy: false,
        disabled: true,
      })
    }
  })

  it('shows inline success feedback instead of a blocking alert after creating a backup', async () => {
    // Arrange
    store.createBackup.mockResolvedValue({
      success: true,
      fileName: 'engage-backup.json',
      size: 2048,
      errors: [],
    })
    const { getByTestId } = render(<BackupManager />)
    await waitFor(() => {
      expect(getByTestId('backup-create-button').props.disabled).toBe(false)
    })

    // Act
    fireEvent.press(getByTestId('backup-create-button'))

    // Assert
    await waitFor(() => {
      expect(store.createBackup).toHaveBeenCalledTimes(1)
    })
    expect(getByTestId('backup-operation-feedback')).toBeTruthy()
    expect(Alert.alert).not.toHaveBeenCalled()
  })

  it('marks only Create as busy while a backup is being created', async () => {
    // Arrange
    let resolveBackup: (result: {
      success: boolean
      fileName: string
      size: number
      errors: string[]
    }) => void = () => {}
    store.createBackup.mockReturnValue(
      new Promise((resolve) => {
        resolveBackup = resolve
      })
    )
    const { getByTestId, getByText } = render(<BackupManager />)
    await waitFor(() => {
      expect(getByTestId('backup-create-button').props.disabled).toBe(false)
    })

    // Act
    fireEvent.press(getByTestId('backup-create-button'))

    // Assert
    await waitFor(() => {
      expect(
        getByTestId('backup-create-button').props.accessibilityState
      ).toMatchObject({
        busy: true,
        disabled: true,
      })
    })
    expect(
      getByTestId('backup-export-button').props.accessibilityState
    ).toMatchObject({ busy: false, disabled: true })
    expect(
      getByTestId('backup-import-button').props.accessibilityState
    ).toMatchObject({ busy: false, disabled: true })
    expect(
      within(getByTestId('backup-create-button')).getByText('backup.creating')
    ).toBeTruthy()
    expect(getByText('backup.export')).toBeTruthy()
    expect(getByText('backup.import')).toBeTruthy()

    await act(async () => {
      resolveBackup({
        success: true,
        fileName: 'engage-backup.json',
        size: 2048,
        errors: [],
      })
    })
  })
})
