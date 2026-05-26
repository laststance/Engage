import React from 'react'
import { Alert } from 'react-native'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
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

  it('shows inline success feedback instead of a blocking alert after creating a backup', async () => {
    // Arrange
    store.createBackup.mockResolvedValue({
      success: true,
      fileName: 'engage-backup.json',
      size: 2048,
      errors: [],
    })
    const { getByTestId } = render(<BackupManager />)

    // Act
    fireEvent.press(getByTestId('backup-create-button'))

    // Assert
    await waitFor(() => {
      expect(store.createBackup).toHaveBeenCalledTimes(1)
    })
    expect(getByTestId('backup-operation-feedback')).toBeTruthy()
    expect(Alert.alert).not.toHaveBeenCalled()
  })
})
