import { journalService } from '../journalService'
import { entryRepository } from '../repositories/EntryRepository'
import { Entry } from '../../types'

// Mock the entry repository
jest.mock('../repositories/EntryRepository')

const mockEntryRepository = entryRepository as jest.Mocked<
  typeof entryRepository
>

describe('JournalService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateEntry', () => {
    it('should validate normal journal entry', async () => {
      const result = await journalService.validateEntry(
        'This is a normal entry'
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should warn about empty entry', async () => {
      const result = await journalService.validateEntry('')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toContain('空の日記エントリーです')
    })

    it('should warn about short entry', async () => {
      const result = await journalService.validateEntry('短い')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toContain(
        '短い日記エントリーです。もう少し詳しく書いてみませんか？'
      )
    })

    it('should reject too long entry', async () => {
      const longEntry = 'a'.repeat(1001)
      const result = await journalService.validateEntry(longEntry)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'Journal entry is too long (maximum 1000 characters)'
      )
    })

    it('should warn about long entry', async () => {
      const longEntry = 'a'.repeat(850)
      const result = await journalService.validateEntry(longEntry)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain(
        '長い日記エントリーです。読みやすさを考慮してください'
      )
    })

    it('should warn about sensitive content', async () => {
      const result = await journalService.validateEntry('My password is 123456')

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain(
        '機密情報が含まれている可能性があります'
      )
    })
  })

  describe('saveEntry', () => {
    const mockEntry: Entry = {
      id: 'entry1',
      date: '2025-01-15',
      note: 'Test entry',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    it('should save valid entry successfully', async () => {
      mockEntryRepository.upsert.mockResolvedValue(mockEntry)

      const result = await journalService.saveEntry('2025-01-15', 'Test entry')

      expect(result.success).toBe(true)
      expect(result.entry).toEqual(mockEntry)
      expect(result.errors).toHaveLength(0)
      expect(mockEntryRepository.upsert).toHaveBeenCalledWith(
        '2025-01-15',
        'Test entry'
      )
    })

    it('should reject invalid entry', async () => {
      const longEntry = 'a'.repeat(1001)
      const result = await journalService.saveEntry('2025-01-15', longEntry)

      expect(result.success).toBe(false)
      expect(result.errors).toContain(
        'Journal entry is too long (maximum 1000 characters)'
      )
      expect(mockEntryRepository.upsert).not.toHaveBeenCalled()
    })

    it('should handle repository errors', async () => {
      mockEntryRepository.upsert.mockRejectedValue(new Error('Database error'))

      const result = await journalService.saveEntry('2025-01-15', 'Test entry')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Database error')
    })

    it('should trim whitespace from content', async () => {
      mockEntryRepository.upsert.mockResolvedValue(mockEntry)

      await journalService.saveEntry('2025-01-15', '  Test entry  ')

      expect(mockEntryRepository.upsert).toHaveBeenCalledWith(
        '2025-01-15',
        'Test entry'
      )
    })
  })

  describe('getEntry', () => {
    const mockEntry: Entry = {
      id: 'entry1',
      date: '2025-01-15',
      note: 'Test entry',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    it('should get entry successfully', async () => {
      mockEntryRepository.findByDate.mockResolvedValue(mockEntry)

      const result = await journalService.getEntry('2025-01-15')

      expect(result).toEqual(mockEntry)
      expect(mockEntryRepository.findByDate).toHaveBeenCalledWith('2025-01-15')
    })

    it('should return null for non-existent entry', async () => {
      mockEntryRepository.findByDate.mockResolvedValue(null)

      const result = await journalService.getEntry('2025-01-15')

      expect(result).toBeNull()
    })

    it('should handle repository errors', async () => {
      mockEntryRepository.findByDate.mockRejectedValue(
        new Error('Database error')
      )

      await expect(journalService.getEntry('2025-01-15')).rejects.toThrow(
        'Database error'
      )
    })
  })

  describe('searchEntries', () => {
    const mockEntries: Entry[] = [
      {
        id: 'entry1',
        date: '2025-01-15',
        note: 'Great day today',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'entry2',
        date: '2025-01-16',
        note: 'Another great day',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]

    it('should search entries successfully', async () => {
      mockEntryRepository.searchByContent.mockResolvedValue(mockEntries)

      const result = await journalService.searchEntries('great')

      expect(result).toEqual(mockEntries)
      expect(mockEntryRepository.searchByContent).toHaveBeenCalledWith('great')
    })

    it('should reject short search terms', async () => {
      await expect(journalService.searchEntries('a')).rejects.toThrow(
        '検索語は2文字以上で入力してください'
      )
      expect(mockEntryRepository.searchByContent).not.toHaveBeenCalled()
    })

    it('should trim search term', async () => {
      mockEntryRepository.searchByContent.mockResolvedValue(mockEntries)

      await journalService.searchEntries('  great  ')

      expect(mockEntryRepository.searchByContent).toHaveBeenCalledWith('great')
    })
  })

  describe('getJournalStats', () => {
    it('should calculate journal stats correctly', async () => {
      mockEntryRepository.getEntryCount.mockResolvedValue(10)
      mockEntryRepository.getNonEmptyEntryCount.mockResolvedValue(8)
      mockEntryRepository.getAverageEntryLength.mockResolvedValue(50)
      mockEntryRepository.getJournalStreak.mockResolvedValue(5)
      mockEntryRepository.findByDateRange.mockResolvedValue([
        {
          id: 'entry1',
          date: '2025-01-15',
          note: 'Test entry',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ])
      mockEntryRepository.findNonEmptyEntries.mockResolvedValue([
        {
          id: 'entry1',
          date: '2025-01-15',
          note: 'Test entry',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ])

      const stats = await journalService.getJournalStats('2025-01-15')

      expect(stats.totalEntries).toBe(10)
      expect(stats.nonEmptyEntries).toBe(8)
      expect(stats.averageLength).toBe(50)
      expect(stats.currentStreak).toBe(5)
      expect(stats.longestStreak).toBe(1)
      expect(stats.entriesThisWeek).toBe(1)
      expect(stats.entriesThisMonth).toBe(1)
    })
  })

  describe('exportEntries', () => {
    const mockEntries: Entry[] = [
      {
        id: 'entry1',
        date: '2025-01-15',
        note: 'Test entry',
        createdAt: 1642204800000,
        updatedAt: 1642204800000,
      },
    ]

    it('should export entries as JSON', async () => {
      mockEntryRepository.findNonEmptyEntries.mockResolvedValue(mockEntries)

      const result = await journalService.exportEntries()
      const exportData = JSON.parse(result)

      expect(exportData.totalEntries).toBe(1)
      expect(exportData.entries).toHaveLength(1)
      expect(exportData.entries[0].date).toBe('2025-01-15')
      expect(exportData.entries[0].note).toBe('Test entry')
    })

    it('should export entries for date range', async () => {
      mockEntryRepository.findByDateRange.mockResolvedValue(mockEntries)

      const result = await journalService.exportEntries(
        '2025-01-01',
        '2025-01-31'
      )
      const exportData = JSON.parse(result)

      expect(exportData.dateRange.startDate).toBe('2025-01-01')
      expect(exportData.dateRange.endDate).toBe('2025-01-31')
      expect(mockEntryRepository.findByDateRange).toHaveBeenCalledWith(
        '2025-01-01',
        '2025-01-31'
      )
    })
  })

  describe('importEntries', () => {
    const validImportData = {
      entries: [
        {
          date: '2025-01-15',
          note: 'Imported entry',
        },
      ],
    }

    it('should import valid entries', async () => {
      mockEntryRepository.upsert.mockResolvedValue({
        id: 'entry1',
        date: '2025-01-15',
        note: 'Imported entry',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      const result = await journalService.importEntries(
        JSON.stringify(validImportData)
      )

      expect(result.imported).toBe(1)
      expect(result.errors).toHaveLength(0)
      expect(mockEntryRepository.upsert).toHaveBeenCalledWith(
        '2025-01-15',
        'Imported entry'
      )
    })

    it('should reject invalid JSON', async () => {
      await expect(
        journalService.importEntries('invalid json')
      ).rejects.toThrow()
    })

    it('should handle invalid entry data', async () => {
      const invalidData = {
        entries: [
          { date: '2025-01-15' }, // Missing note
          { note: 'Missing date' }, // Missing date
        ],
      }

      const result = await journalService.importEntries(
        JSON.stringify(invalidData)
      )

      expect(result.imported).toBe(0)
      expect(result.errors).toHaveLength(2)
      expect(mockEntryRepository.upsert).not.toHaveBeenCalled()
    })
  })

  describe('getSuggestedPrompts', () => {
    it('should return base prompts when no completions', () => {
      const prompts = journalService.getSuggestedPrompts(false)

      expect(prompts).toContain('今日はどんな気持ちでしたか？')
      expect(prompts).toContain('今日学んだことは何ですか？')
    })

    it('should return completion prompts when has completions', () => {
      const prompts = journalService.getSuggestedPrompts(true)

      expect(prompts).toContain('達成したタスクについてどう感じますか？')
      expect(prompts).toContain('タスクを完了して得られたものは？')
    })
  })
})
