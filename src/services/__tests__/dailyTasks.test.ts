/// <reference types="node" />
import { DatabaseSync, SQLInputValue } from 'node:sqlite'
import * as SQLite from 'expo-sqlite'
import * as FileSystem from 'expo-file-system/legacy'
import * as DocumentPicker from 'expo-document-picker'
import { DatabaseService } from '@/src/services/database'
import { backupService, initializeBackupService } from '@/src/services/backupService'

describe('daily routine persistence with real SQLite', () => {
  let sqliteDatabase: DatabaseSync
  let databaseService: DatabaseService

  beforeEach(async () => {
    // Match Expo's existing connection defaults while executing actual SQLite statements.
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
    // The adapter implements only the Expo methods used by DatabaseService.
    jest.mocked(SQLite.openDatabaseAsync).mockResolvedValue(
      adapter as unknown as SQLite.SQLiteDatabase
    )
    databaseService = new DatabaseService()
    await databaseService.initialize()
  })

  afterEach(() => {
    sqliteDatabase.close()
    jest.clearAllMocks()
  })

  it('keeps existing tasks opted out when upgrading the database from version 3', async () => {
    // Arrange: recreate a version 3 task table containing a saved task.
    sqliteDatabase.exec(`
      DROP TRIGGER delete_task_daily_applications;
      DROP TABLE daily_task_applications;
      ALTER TABLE tasks DROP COLUMN daily_auto_add_from;
      ALTER TABLE entries DROP COLUMN condition_level;
      DELETE FROM schema_migrations WHERE version > 3;
      INSERT INTO tasks (id, title, category_id, archived, created_at, updated_at)
      VALUES ('existing', 'Read', 'life', 0, 1, 1);
    `)

    // Act
    await databaseService.initialize()
    const assignments = await databaseService.applyDailyTasks('2026-09-06')

    // Assert
    expect(await databaseService.getTaskById('existing')).toMatchObject({
      title: 'Read',
      dailyAutoAddFrom: undefined,
    })
    expect(assignments).toEqual([])
    expect(sqliteDatabase.prepare('SELECT MAX(version) AS version FROM schema_migrations').get())
      .toEqual({ version: 6 })
  })

  it('upgrades version 4 with an index that targets only the deleted task’s routine history', async () => {
    // Arrange
    const routine = await databaseService.createTask({
      title: 'Read', categoryId: 'life', archived: false, dailyAutoAddFrom: '2026-09-06',
    })
    await databaseService.applyDailyTasks('2026-09-06')
    sqliteDatabase.exec(`
      DROP INDEX idx_daily_task_applications_task_id;
      ALTER TABLE entries DROP COLUMN condition_level;
      DELETE FROM schema_migrations WHERE version > 4;
    `)

    // Act
    await databaseService.initialize()
    const deletionPlan = sqliteDatabase.prepare(
      'EXPLAIN QUERY PLAN DELETE FROM daily_task_applications WHERE task_id = ?'
    ).all(routine.id)

    // Assert
    expect(deletionPlan).toEqual(expect.arrayContaining([
      expect.objectContaining({
        detail: 'SEARCH daily_task_applications USING INDEX idx_daily_task_applications_task_id (task_id=?)',
      }),
    ]))
    expect((await databaseService.exportData()).dailyTaskApplications).toEqual([
      { date: '2026-09-06', taskId: routine.id },
    ])
  })

  it('adds eligible routines only on the requested date and leaves future, disabled, and archived tasks out', async () => {
    // Arrange
    const routine = await databaseService.createTask({
      title: 'Read', categoryId: 'life', archived: false, dailyAutoAddFrom: '2026-09-06',
    })
    await databaseService.createTask({
      title: 'Future', categoryId: 'life', archived: false, dailyAutoAddFrom: '2026-09-08',
    })
    await databaseService.createTask({ title: 'Manual', categoryId: 'life', archived: false })
    await databaseService.createTask({
      title: 'Archived', categoryId: 'life', archived: true, dailyAutoAddFrom: '2026-09-01',
    })

    // Act
    const beforeStart = await databaseService.applyDailyTasks('2026-09-05')
    const today = await databaseService.applyDailyTasks('2026-09-07')

    // Assert
    expect(beforeStart).toEqual([])
    expect(today).toHaveLength(1)
    expect(today[0]).toMatchObject({ date: '2026-09-07', taskId: routine.id, completed: false })
    expect(await databaseService.getCompletions('2026-09-06')).toEqual([])
  })

  it('preserves manual assignments and finished routines when applying the same day repeatedly', async () => {
    // Arrange
    const routine = await databaseService.createTask({
      title: 'Read', categoryId: 'life', archived: false, dailyAutoAddFrom: '2026-09-06',
    })
    const manualTask = await databaseService.createTask({ title: 'Work', categoryId: 'business', archived: false })
    const manualAssignment = await databaseService.createCompletion({ date: '2026-09-06', taskId: manualTask.id, completed: false })
    const finishedAssignment = await databaseService.createCompletion({ date: '2026-09-06', taskId: routine.id, completed: true, minutes: 25 })

    // Act
    await databaseService.applyDailyTasks('2026-09-06')
    const assignments = await databaseService.applyDailyTasks('2026-09-06')

    // Assert
    expect(assignments).toHaveLength(2)
    expect(assignments).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: manualAssignment.id, taskId: manualTask.id, completed: false }),
      expect.objectContaining({ id: finishedAssignment.id, taskId: routine.id, completed: true, minutes: 25 }),
    ]))
    expect((await databaseService.exportData()).dailyTaskApplications).toEqual([
      { date: '2026-09-06', taskId: routine.id },
    ])
  })

  it('keeps a routine removed for today out after restarting but adds it tomorrow', async () => {
    // Arrange
    const routine = await databaseService.createTask({
      title: 'Read', categoryId: 'life', archived: false, dailyAutoAddFrom: '2026-09-06',
    })
    await databaseService.applyDailyTasks('2026-09-06')
    await databaseService.deleteCompletion('2026-09-06', routine.id)

    // Act
    const restartedService = new DatabaseService()
    await restartedService.initialize()
    const today = await restartedService.applyDailyTasks('2026-09-06')
    const tomorrow = await restartedService.applyDailyTasks('2026-09-07')

    // Assert
    expect(today).toEqual([])
    expect(tomorrow).toHaveLength(1)
    expect(tomorrow[0]).toMatchObject({ taskId: routine.id, date: '2026-09-07', completed: false })
  })

  it('adds the next day even when yesterday remains unfinished', async () => {
    // Arrange
    const routine = await databaseService.createTask({
      title: 'Read', categoryId: 'life', archived: false, dailyAutoAddFrom: '2026-09-06',
    })
    await databaseService.applyDailyTasks('2026-09-06')

    // Act
    const tomorrow = await databaseService.applyDailyTasks('2026-09-07')

    // Assert
    expect(tomorrow).toHaveLength(1)
    expect(tomorrow[0]).toMatchObject({ taskId: routine.id, completed: false })
    expect((await databaseService.getCompletions('2026-09-06'))[0].completed).toBe(false)
  })

  it('preserves today and history when a routine is switched off', async () => {
    // Arrange
    const routine = await databaseService.createTask({
      title: 'Read', categoryId: 'life', archived: false, dailyAutoAddFrom: '2026-09-06',
    })
    await databaseService.applyDailyTasks('2026-09-06')

    // Act
    await databaseService.updateTask(routine.id, { dailyAutoAddFrom: undefined })
    const tomorrow = await databaseService.applyDailyTasks('2026-09-07')

    // Assert
    expect(tomorrow).toEqual([])
    expect(await databaseService.getCompletions('2026-09-06')).toHaveLength(1)
    expect((await databaseService.getTaskById(routine.id))?.dailyAutoAddFrom).toBeUndefined()
  })

  it('rolls back routine assignments when saving application history fails', async () => {
    // Arrange
    await databaseService.createTask({
      title: 'Read', categoryId: 'life', archived: false, dailyAutoAddFrom: '2026-09-06',
    })
    sqliteDatabase.exec(`CREATE TRIGGER fail_application BEFORE INSERT ON daily_task_applications
      BEGIN SELECT RAISE(ABORT, 'simulated write failure'); END`)

    // Act
    await expect(databaseService.applyDailyTasks('2026-09-06')).rejects.toThrow('Transaction failed')

    // Assert
    expect(await databaseService.getCompletions('2026-09-06')).toEqual([])
    expect((await databaseService.exportData()).dailyTaskApplications).toEqual([])
    sqliteDatabase.exec('DROP TRIGGER fail_application')
    expect(await databaseService.applyDailyTasks('2026-09-06')).toHaveLength(1)
  })

  it('removes daily application history when its task is deleted', async () => {
    // Arrange
    const routine = await databaseService.createTask({
      title: 'Read', categoryId: 'life', archived: false, dailyAutoAddFrom: '2026-09-06',
    })
    await databaseService.applyDailyTasks('2026-09-06')

    // Act
    await databaseService.deleteTask(routine.id)

    // Assert
    expect(sqliteDatabase.prepare('SELECT * FROM daily_task_applications').all()).toEqual([])
  })

  it('restores schedules and today-only exclusions through a JSON backup roundtrip', async () => {
    // Arrange
    const routine = await databaseService.createTask({
      title: 'Read', categoryId: 'life', archived: false, dailyAutoAddFrom: '2026-09-06',
    })
    await databaseService.applyDailyTasks('2026-09-06')
    await databaseService.deleteCompletion('2026-09-06', routine.id)
    initializeBackupService(databaseService)
    await databaseService.setSetting('theme', 'dark')
    jest.mocked(FileSystem.getInfoAsync).mockResolvedValue({ exists: false, isDirectory: false, uri: 'file://backup.json' })
    jest.mocked(FileSystem.readDirectoryAsync).mockResolvedValue([])

    // Act
    const backup = await backupService.createBackup()
    const backupJson = jest.mocked(FileSystem.writeAsStringAsync).mock.calls[0][1]
    await databaseService.importData({})
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false, assets: [{ uri: 'file://backup.json', name: 'backup.json', mimeType: 'application/json', lastModified: 1 }],
    })
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue(backupJson)
    const restore = await backupService.importBackup()

    // Assert
    expect(backup.success).toBe(true)
    expect(restore.success).toBe(true)
    expect(await databaseService.getSetting('theme')).toBe('dark')
    expect((await databaseService.getTaskById(routine.id))?.dailyAutoAddFrom).toBe('2026-09-06')
    expect(await databaseService.applyDailyTasks('2026-09-06')).toEqual([])
    expect(await databaseService.applyDailyTasks('2026-09-07')).toHaveLength(1)
  })

  it('accepts older backups with no schedule or daily application history', async () => {
    // Arrange
    const legacyBackup = {
      version: '1.0', timestamp: Date.now(), categories: [{ id: 'life', name: '生活' }],
      tasks: [{ id: 'legacy', title: 'Read', categoryId: 'life', archived: false, createdAt: 1, updatedAt: 1 }],
      entries: [], completions: [], settings: [],
    }
    initializeBackupService(databaseService)

    // Act
    const validation = await backupService.validateBackupData(legacyBackup)
    await databaseService.importData(legacyBackup)

    // Assert
    expect(validation.isValid).toBe(true)
    expect((await databaseService.getTaskById('legacy'))?.dailyAutoAddFrom).toBeUndefined()
    expect(await databaseService.applyDailyTasks('2026-09-06')).toEqual([])
  })

  it.each(['2026-02-31', '2026-02-29'])('rejects the nonexistent date %s in routine and journal writes', async (date) => {
    // Arrange
    const routine = await databaseService.createTask({
      title: 'Read', categoryId: 'life', archived: false,
    })

    // Act / Assert
    await expect(databaseService.createTask({
      title: 'Walk', categoryId: 'life', archived: false, dailyAutoAddFrom: date,
    })).rejects.toThrow('Failed to create task')
    await expect(databaseService.updateTask(routine.id, { dailyAutoAddFrom: date }))
      .rejects.toThrow('Failed to update task')
    await expect(databaseService.applyDailyTasks(date)).rejects.toThrow('Date must be in YYYY-MM-DD format')
    await expect(databaseService.upsertEntry(date, 'Invalid day')).rejects.toThrow()
    await expect(databaseService.createCompletion({ date, taskId: routine.id, completed: false }))
      .rejects.toThrow('Failed to create completion')
    expect((await databaseService.getTaskById(routine.id))?.dailyAutoAddFrom).toBeUndefined()
  })

  it.each([
    { tasks: [{ id: 'routine', title: 'Read', categoryId: 'life', archived: false, createdAt: 1, updatedAt: 1, dailyAutoAddFrom: '2026-02-31' }] },
    { entries: [{ id: 'entry', date: '2026-02-29', note: 'Read', createdAt: 1, updatedAt: 1 }] },
    { completions: [{ id: 'completion', date: '2026-02-31', taskId: 'routine', completed: false, createdAt: 1 }] },
    { dailyTaskApplications: [{ date: '2026-02-29', taskId: 'routine' }] },
  ])('rejects nonexistent backup dates without replacing saved data: %j', async (invalidFields) => {
    // Arrange
    const savedTask = await databaseService.createTask({ title: 'Keep me', categoryId: 'life', archived: false })
    initializeBackupService(databaseService)
    const backup = {
      version: '1.0', timestamp: Date.now(), categories: [{ id: 'life', name: '生活' }],
      tasks: [{ id: 'routine', title: 'Read', categoryId: 'life', archived: false, createdAt: 1, updatedAt: 1 }],
      entries: [], completions: [], settings: [], ...invalidFields,
    }

    // Act
    const validation = await backupService.validateBackupData(backup)

    // Assert
    expect(validation.isValid).toBe(false)
    await expect(databaseService.importData(backup)).rejects.toThrow('Failed to import data')
    expect(await databaseService.getTaskById(savedTask.id)).toMatchObject({ title: 'Keep me' })
  })

  it('restores valid leap-day schedules, entries, assignments, and application history', async () => {
    // Arrange
    initializeBackupService(databaseService)
    const backup = {
      version: '1.0', timestamp: Date.now(), categories: [{ id: 'life', name: '生活' }],
      tasks: [{ id: 'routine', title: 'Read', categoryId: 'life', archived: false, createdAt: 1, updatedAt: 1, dailyAutoAddFrom: '2024-02-29' }],
      entries: [{ id: 'entry', date: '2024-02-29', note: 'Leap day', createdAt: 1, updatedAt: 1 }],
      completions: [{ id: 'completion', date: '2024-02-29', taskId: 'routine', completed: false, createdAt: 1 }],
      dailyTaskApplications: [{ date: '2024-02-29', taskId: 'routine' }], settings: [],
    }

    // Act
    const validation = await backupService.validateBackupData(backup)
    await databaseService.importData(backup)
    const assignments = await databaseService.applyDailyTasks('2024-02-29')

    // Assert
    expect(validation.isValid).toBe(true)
    expect(assignments).toHaveLength(1)
    expect(assignments[0]).toMatchObject({ id: 'completion', date: '2024-02-29', completed: false })
    expect(await databaseService.getEntry('2024-02-29')).toMatchObject({ note: 'Leap day' })
    expect((await databaseService.getTaskById('routine'))?.dailyAutoAddFrom).toBe('2024-02-29')
  })

  it.each([
    { dailyTaskApplications: 'invalid' },
    { dailyTaskApplications: [{ date: '2026-09-06', taskId: 'missing' }] },
    { dailyTaskApplications: [{ date: 'invalid', taskId: 'routine' }] },
    { dailyTaskApplications: [{ date: '2026-09-06', taskId: 'routine' }, { date: '2026-09-06', taskId: 'routine' }] },
    { tasks: [{ id: 'routine', title: 'Read', categoryId: 'life', dailyAutoAddFrom: 'invalid' }] },
  ])('rejects corrupted routine backup data before import: %j', async (invalidFields) => {
    // Arrange
    initializeBackupService(databaseService)
    const backup = {
      version: '1.0', timestamp: Date.now(), categories: [],
      tasks: [{ id: 'routine', title: 'Read', categoryId: 'life' }],
      entries: [], completions: [], settings: [], ...invalidFields,
    }

    // Act
    const validation = await backupService.validateBackupData(backup)

    // Assert
    expect(validation.isValid).toBe(false)
  })
})
