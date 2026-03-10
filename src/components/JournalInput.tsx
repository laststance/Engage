import React, { useState, useEffect, useRef } from 'react'
import { TextInput, Keyboard } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { Entry } from '@/src/types'

interface JournalInputProps {
  date: string
  entry: Entry | null
  onUpdate: (content: string) => Promise<void>
  placeholder?: string
  maxLength?: number
}

export const JournalInput: React.FC<JournalInputProps> = ({
  date,
  entry,
  onUpdate,
  placeholder,
  maxLength = 1000,
}) => {
  const { t } = useTranslation()
  const [text, setText] = useState(entry?.note || '')
  const [isFocused, setIsFocused] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [characterCount, setCharacterCount] = useState(entry?.note?.length || 0)

  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textInputRef = useRef<TextInput>(null)

  // Update local state when entry prop changes (e.g., date change)
  useEffect(() => {
    setText(entry?.note || '')
    setCharacterCount(entry?.note?.length || 0)
  }, [entry])

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Only auto-save if text has changed from the original entry
    if (text !== (entry?.note || '')) {
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          setIsAutoSaving(true)
          await onUpdate(text)
          setLastSaved(new Date())
        } catch (error) {
          console.error('Auto-save failed:', error)
        } finally {
          setIsAutoSaving(false)
        }
      }, 1000) // Auto-save after 1 second of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [text, entry?.note, onUpdate])

  const handleTextChange = (newText: string) => {
    // Enforce character limit
    if (newText.length <= maxLength) {
      setText(newText)
      setCharacterCount(newText.length)
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Force save on blur if there are unsaved changes
    if (text !== (entry?.note || '')) {
      onUpdate(text).catch(console.error)
    }
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    const formatter = new Intl.DateTimeFormat(undefined, {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
    return formatter.format(d)
  }

  const getStatusText = () => {
    if (isAutoSaving) {
      return t('common.saving')
    }
    if (lastSaved) {
      const now = new Date()
      const diffMs = now.getTime() - lastSaved.getTime()
      const diffMinutes = Math.floor(diffMs / 60000)

      if (diffMinutes < 1) {
        return t('journal.saved')
      } else if (diffMinutes < 60) {
        return t('journal.savedMinutesAgo', { minutes: diffMinutes })
      } else {
        const diffHours = Math.floor(diffMinutes / 60)
        return t('journal.savedHoursAgo', { hours: diffHours })
      }
    }
    return ''
  }

  const isNearLimit = characterCount > maxLength * 0.8
  const isAtLimit = characterCount >= maxLength

  return (
    <VStack space="sm" testID="journal-input-container">
      {/* Header */}
      <HStack className="items-center justify-between">
        <Text className="text-lg font-semibold text-gray-800">
          {t('journal.title')}
        </Text>
        <HStack className="items-center" space="xs">
          {isAutoSaving && (
            <IconSymbol name="arrow.clockwise" size={16} color="#6B7280" />
          )}
          <Text className="text-sm text-gray-500">{getStatusText()}</Text>
        </HStack>
      </HStack>

      {/* Text Input Container */}
      <Box
        className={`
          rounded-lg p-4 min-h-[120px] border-2 transition-colors
          ${
            isFocused
              ? 'bg-blue-50 border-blue-200'
              : text.length > 0
              ? 'bg-gray-50 border-gray-200'
              : 'bg-gray-50 border-gray-200'
          }
        `}
      >
        <TextInput
          ref={textInputRef}
          value={text}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder ?? t('journal.placeholder')}
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
          className="flex-1 text-gray-800 text-base leading-6"
          testID="journal-text-input"
          maxLength={maxLength}
          scrollEnabled={true}
          style={{
            minHeight: 88, // Ensure minimum height for comfortable typing
          }}
        />
      </Box>

      {/* Footer with character count and hints */}
      <HStack className="items-center justify-between">
        <Text className="text-xs text-gray-500">
          {text.length === 0
            ? t('journal.reflectionPrompt', { date: formatDate(date) })
            : t('journal.autoSave')}
        </Text>
        <Text
          className={`
            text-xs
            ${
              isAtLimit
                ? 'text-red-500 font-medium'
                : isNearLimit
                ? 'text-orange-500'
                : 'text-gray-400'
            }
          `}
          testID="character-count"
        >
          {characterCount}/{maxLength}
        </Text>
      </HStack>

      {/* Empty state encouragement */}
      {text.length === 0 && !isFocused && (
        <Box className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <Text className="text-sm text-blue-700 text-center">
            {t('journal.encouragement')}
          </Text>
        </Box>
      )}

      {/* Character limit warning */}
      {isNearLimit && (
        <Box className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-100">
          <Text className="text-sm text-orange-700 text-center">
            {isAtLimit
              ? t('journal.characterLimitReached')
              : t('journal.charactersRemaining', { count: maxLength - characterCount })}
          </Text>
        </Box>
      )}
    </VStack>
  )
}
