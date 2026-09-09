/// <reference types="node" />
import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import * as SQLite from 'expo-sqlite'
import * as FileSystem from 'expo-file-system/legacy'
import * as DocumentPicker from 'expo-document-picker'
import { DatabaseService, databaseService as sharedDatabaseService } from '@/src/services/database'
import { entryRepository } from '@/src/services/repositories/EntryRepository'
import { backupService, initializeBackupService } from '@/src/services/backupService'
import { calculateJournalStats } from '@/src/utils/statisticsEngine'

describe('daily condition persistence with real SQLite', () => {
  let sqliteDatabase: DatabaseSync
  let databaseService: DatabaseService

  beforeEach(async () => {
    sqliteDatabase = new DatabaseSync(':memory:', {
      enableForeignKeyConstraints: false,
      enableDoubleQuotedStringLiterals: true,
    })
    const adapter = {
      execAsync: async (query: string) => sqliteDatabase.exec(query),
      runAsync: async (query: string, parameters: SQLInputValue[] = []) =>
        sqliteDatabase.prepare(query).run(...parameters),
      getAllAsync: async (query: string, parameters: SQLInputValue[] = []) =>
        sqliteDatabase.prepare(query).all(...parameters),
      getFirstAsync: async (query: string, parameters: SQLInputValue[] = []) =>
        sqliteDatabase.prepare(query).get(...parameters) ?? null,
    }
    // Exercise production SQL using the subset of Expo's connection implemented by this adapter.
    jest.mocked(SQLite.openDatabaseAsync).mockResolvedValue(adapter as unknown as SQLite.SQLiteDatabase)
    databaseService = new DatabaseService()
    await databaseService.initialize()
  })

  afterEach(() => {
    sqliteDatabase.close()
    jest.clearAllMocks()
  })

  test('upgrades existing journals from version 5 without assigning a default condition', async () => {
    // Arrange
    sqliteDatabase.exec(`
      ALTER TABLE entries DROP COLUMN condition_level;
      DELETE FROM schema_migrations WHERE version = 6;
      INSERT INTO entries (id, date, note, created_at, updated_at)
      VALUES ('old-journal', '2026-09-04', 'Keep this journal', 1, 2);
    `)

    // Act
    await databaseService.initialize()

    // Assert
    expect(await databaseService.getEntry('2026-09-04')).toEqual({
      id: 'old-journal', date: '2026-09-04', note: 'Keep this journal',
      conditionLevel: null, createdAt: 1, updatedAt: 2,
    })
    expect(sqliteDatabase.prepare('SELECT MAX(version) AS version FROM schema_migrations').get())
      .toEqual({ version: 6 })
  })

  test('keeps a condition-only day after restarting without counting it as a journal or task completion', async () => {
    // Arrange
    await databaseService.setEntryCondition('2026-09-05', 2)
    const restartedDatabase = new DatabaseService()

    // Act
    await restartedDatabase.initialize()
    const entry = await restartedDatabase.getEntry('2026-09-05')

    // Assert
    expect(entry).toMatchObject({ date: '2026-09-05', note: '', conditionLevel: 2 })
    expect(await restartedDatabase.getCompletions('2026-09-05')).toEqual([])
    expect(calculateJournalStats(entry ? { '2026-09-05': entry } : {}, '2026-09-05', '2026-09-05'))
      .toEqual({ journalDays: 0, totalEntries: 0, averageLength: 0, longestEntry: 0 })
  })

  test('preserves the journal while changing and clearing a condition on the same day', async () => {
    // Arrange
    await databaseService.upsertEntry('2026-09-05', 'A long walk helped')
    await databaseService.setEntryCondition('2026-09-05', 4)

    // Act
    await databaseService.setEntryCondition('2026-09-05', 1)
    const changedEntry = await databaseService.getEntry('2026-09-05')
    await databaseService.setEntryCondition('2026-09-05', null)

    // Assert
    expect(changedEntry).toMatchObject({ note: 'A long walk helped', conditionLevel: 1 })
    expect(await databaseService.getEntry('2026-09-05'))
      .toMatchObject({ note: 'A long walk helped', conditionLevel: null })
    expect(sqliteDatabase.prepare('SELECT COUNT(*) AS count FROM entries').get()).toEqual({ count: 1 })
  })

  test('preserves the recorded condition when a delayed journal save or journal clear arrives', async () => {
    // Arrange
    await databaseService.setEntryCondition('2026-09-05', 5)

    // Act
    const writtenEntry = await databaseService.upsertEntry('2026-09-05', 'An evening reflection')
    const clearedJournal = await databaseService.upsertEntry('2026-09-05', '')

    // Assert
    expect(writtenEntry).toMatchObject({ note: 'An evening reflection', conditionLevel: 5 })
    expect(clearedJournal).toMatchObject({ note: '', conditionLevel: 5 })
  })

  test('loads the oldest condition and note even after more than 30 newer daily records exist', async () => {
    // Arrange
    await databaseService.upsertEntry('2020-01-01', 'An older reflection')
    await databaseService.setEntryCondition('2020-01-01', 4)
    for (let day = 1; day <= 31; day++) {
      await databaseService.upsertEntry(`2026-08-${String(day).padStart(2, '0')}`, 'A newer reflection')
    }
    await sharedDatabaseService.initialize()

    // Act
    const entries = await entryRepository.findAll()

    // Assert
    expect(entries).toHaveLength(32)
    expect(entries.at(-1)).toMatchObject({ date: '2020-01-01', note: 'An older reflection', conditionLevel: 4 })
    expect(await entryRepository.findByDateRange('2020-01-01', '2020-01-01'))
      .toEqual([expect.objectContaining({ conditionLevel: 4 })])
  })

  test('roundtrips recorded and cleared conditions together with notes through a JSON backup', async () => {
    // Arrange
    await databaseService.upsertEntry('2026-09-04', 'Keep this note')
    await databaseService.setEntryCondition('2026-09-04', 4)
    await databaseService.setEntryCondition('2026-09-05', null)
    initializeBackupService(databaseService)
    jest.mocked(FileSystem.getInfoAsync).mockResolvedValue({ exists: false, isDirectory: false, uri: 'file://backup.json' })

    // Act
    const backup = await backupService.createBackup()
    const backupJson = jest.mocked(FileSystem.writeAsStringAsync).mock.calls[0][1]
    await databaseService.setEntryCondition('2026-09-04', 1)
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false, assets: [{ uri: 'file://backup.json', name: 'backup.json', mimeType: 'application/json', lastModified: 1 }],
    })
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue(backupJson)
    const restore = await backupService.importBackup()

    // Assert
    expect(backup.success).toBe(true)
    expect(restore.success).toBe(true)
    expect(await databaseService.getEntry('2026-09-04')).toMatchObject({ note: 'Keep this note', conditionLevel: 4 })
    expect(await databaseService.getEntry('2026-09-05')).toMatchObject({ note: '', conditionLevel: null })
  })

  test('restores legacy backups with no condition field as unrecorded', async () => {
    // Arrange
    const backup = {
      version: '1.0.0', timestamp: Date.now(), categories: [], tasks: [], completions: [], settings: [],
      entries: [{ id: 'legacy', date: '2026-09-04', note: 'Legacy journal', createdAt: 1, updatedAt: 2 }],
    }
    initializeBackupService(databaseService)

    // Act
    const validation = await backupService.validateBackupData(backup)
    await databaseService.importData(backup)

    // Assert
    expect(validation.isValid).toBe(true)
    expect(await databaseService.getEntry('2026-09-04')).toMatchObject({ note: 'Legacy journal', conditionLevel: null })
  })

  test.each([0, 6, 2.5, '4', false])('rejects a corrupt condition (%j) without replacing saved data', async (conditionLevel) => {
    // Arrange
    await databaseService.upsertEntry('2026-09-05', 'Keep my data')
    initializeBackupService(databaseService)
    const backup = {
      version: '1.0.0', timestamp: Date.now(), categories: [], tasks: [], completions: [], settings: [],
      entries: [{ id: 'bad', date: '2026-09-04', note: '', conditionLevel, createdAt: 1, updatedAt: 2 }],
    }

    // Act
    const validation = await backupService.validateBackupData(backup)
    // Imported JSON is intentionally untrusted, unlike the typed application boundary.
    const untrustedBackup = JSON.parse(JSON.stringify(backup))

    // Assert
    expect(validation.isValid).toBe(false)
    await expect(databaseService.importData(untrustedBackup)).rejects.toThrow('Failed to import data')
    expect(await databaseService.getEntry('2026-09-05')).toMatchObject({ note: 'Keep my data' })
  })
})
