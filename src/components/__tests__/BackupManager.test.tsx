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

  test('shows generic metadata loading without announcing backup operations', async () => {
    // Arrange
    store.listBackups.mockReturnValue(new Promise(() => undefined))
    store.getBackupStats.mockReturnValue(new Promise(() => undefined))

    // Act
    const { getByTestId, getByText } = await render(<BackupManager />)

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

  test('shows inline success feedback instead of a blocking alert after creating a backup', async () => {
    // Arrange
    store.createBackup.mockResolvedValue({
      success: true,
      fileName: 'engage-backup.json',
      size: 2048,
      errors: [],
    })
    const { getByTestId } = await render(<BackupManager />)
    await waitFor(() => {
      expect(getByTestId('backup-create-button').props.disabled).toBe(false)
    })

    // Act
    await fireEvent.press(getByTestId('backup-create-button'))

    // Assert
    await waitFor(() => {
      expect(store.createBackup).toHaveBeenCalledTimes(1)
    })
    expect(getByTestId('backup-operation-feedback')).toBeTruthy()
    expect(Alert.alert).not.toHaveBeenCalled()
  })

  test('marks only Create as busy while a backup is being created', async () => {
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
    const { getByTestId, getByText } = await render(<BackupManager />)
    await waitFor(() => {
      expect(getByTestId('backup-create-button').props.disabled).toBe(false)
    })

    // Act
    const createBackupAction = fireEvent.press(
      getByTestId('backup-create-button')
    )

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
    await createBackupAction
  })

  test('marks only the selected backup as busy while it is being deleted', async () => {
    // Arrange
    const firstFileName = 'engage-first.json'
    const secondFileName = 'engage-second.json'
    store.listBackups.mockResolvedValue([
      {
        fileName: firstFileName,
        filePath: `/backups/${firstFileName}`,
        size: 1024,
        createdAt: new Date('2026-07-17T00:00:00.000Z'),
        isValid: true,
      },
      {
        fileName: secondFileName,
        filePath: `/backups/${secondFileName}`,
        size: 2048,
        createdAt: new Date('2026-07-16T00:00:00.000Z'),
        isValid: true,
      },
    ])
    let resolveDelete: (didDelete: boolean) => void = () => {}
    store.deleteBackup.mockReturnValue(
      new Promise((resolve) => {
        resolveDelete = resolve
      })
    )
    const { getByTestId } = await render(<BackupManager />)
    const firstDeleteButton = await waitFor(() =>
      getByTestId(`backup-delete-button-${firstFileName}`)
    )
    const secondDeleteButton = getByTestId(
      `backup-delete-button-${secondFileName}`
    )

    // Act
    await fireEvent.press(firstDeleteButton)
    const destructiveAction = jest
      .mocked(Alert.alert)
      .mock.calls[0]?.[2]?.find((button) => button.style === 'destructive')
    // React Native types Alert callbacks as void, while the runtime keeps this returned Promise.
    let deleteBackupAction: void
    await act(() => {
      deleteBackupAction = destructiveAction?.onPress?.()
    })

    // Assert
    await waitFor(() => {
      expect(firstDeleteButton.props.accessibilityState).toMatchObject({
        busy: true,
        disabled: true,
      })
    })
    expect(secondDeleteButton.props.accessibilityState).toMatchObject({
      busy: false,
      disabled: true,
    })

    await act(async () => {
      resolveDelete(true)
      await deleteBackupAction
    })
  })
})
