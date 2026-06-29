import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Keyboard, Platform, TextInput } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { KeyboardDoneAccessory } from '@/src/components/KeyboardDoneAccessory'
import {
  OperationFeedback,
  type OperationFeedbackKind,
} from '@/src/components/OperationFeedback'
import {
  JOURNAL_AUTOSAVE_DELAY_MS,
  JOURNAL_NEAR_LIMIT_RATIO,
  JOURNAL_TEXT_INPUT_MIN_HEIGHT_PX,
  MINUTES_PER_HOUR,
  MS_PER_MINUTE,
} from '@/src/constants/journal'
import { useInteractionFeedback } from '@/src/hooks/useInteractionFeedback'
import { Entry } from '@/src/types'

const JOURNAL_INPUT_ACCESSORY_VIEW_ID_PREFIX = 'journal-input-accessory'
const NATIVE_ID_UNSUPPORTED_CHARACTERS = /[^A-Za-z0-9_-]/g

interface JournalInputProps {
  date: string
  entry: Entry | null
  onUpdate: (content: string) => Promise<void>
  placeholder?: string
  maxLength?: number
}

type JournalSaveStatus = 'idle' | 'draft' | 'saving' | 'saved' | 'error'

/**
 * Converts journal save state into the shared inline feedback tone.
 * @param saveStatus - The current local autosave state.
 * @returns The OperationFeedback tone that matches the journal state.
 * @example
 * getJournalFeedbackKind('draft') // => 'info'
 */
const getJournalFeedbackKind = (
  saveStatus: Exclude<JournalSaveStatus, 'idle'>
): OperationFeedbackKind => {
  if (saveStatus === 'error') {
    return 'error'
  }

  if (saveStatus === 'saving') {
    return 'saving'
  }

  if (saveStatus === 'draft') {
    return 'info'
  }

  return 'success'
}

export const JournalInput: React.FC<JournalInputProps> = ({
  date,
  entry,
  onUpdate,
  placeholder,
  maxLength = 1000,
}) => {
  const { t } = useTranslation()
  const triggerFeedback = useInteractionFeedback()
  const [text, setText] = useState(entry?.note || '')
  const [isFocused, setIsFocused] = useState(false)
  const [saveStatus, setSaveStatus] = useState<JournalSaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [lastFailedText, setLastFailedText] = useState<string | null>(null)
  const [characterCount, setCharacterCount] = useState(entry?.note?.length || 0)

  const reactId = useId()
  const inputAccessoryViewID = `${JOURNAL_INPUT_ACCESSORY_VIEW_ID_PREFIX}-${reactId.replace(
    NATIVE_ID_UNSUPPORTED_CHARACTERS,
    ''
  )}`
  const shouldShowKeyboardDoneButton = Platform.OS === 'ios'
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveRequestIdRef = useRef(0)
  const textInputRef = useRef<TextInput>(null)
  const lastPersistedTextRef = useRef(entry?.note || '')
  const textRef = useRef(entry?.note || '')

  // Update local state when entry prop changes (e.g., date change)
  useEffect(() => {
    const nextPersistedText = entry?.note || ''
    const previousPersistedText = lastPersistedTextRef.current
    const currentText = textRef.current
    const hasLocalDraft = currentText !== previousPersistedText
    const didPersistVisibleText = currentText === nextPersistedText

    lastPersistedTextRef.current = nextPersistedText

    if (didPersistVisibleText) {
      if (hasLocalDraft) {
        // The parent entry caught up to the draft, so this is the successful save echo.
        setLastSaved(new Date())
        setSaveStatus('saved')
        setLastFailedText(null)
      }
      return
    }

    if (hasLocalDraft) {
      saveRequestIdRef.current += 1
      setSaveStatus((currentStatus) =>
        currentStatus === 'saving' ? 'draft' : currentStatus
      )
      return
    }

    saveRequestIdRef.current += 1
    textRef.current = nextPersistedText
    setText(nextPersistedText)
    setCharacterCount(nextPersistedText.length)
    setSaveStatus('idle')
    setLastSaved(null)
    setLastFailedText(null)
  }, [entry?.note])

  const saveJournalText = useCallback(
    async (nextText: string) => {
      const requestId = ++saveRequestIdRef.current
      setSaveStatus('saving')
      setLastFailedText(null)

      try {
        await onUpdate(nextText)
        if (requestId !== saveRequestIdRef.current) return
        lastPersistedTextRef.current = nextText
        setLastSaved(new Date())
        setSaveStatus('saved')
      } catch (error) {
        if (requestId !== saveRequestIdRef.current) return
        console.error('Auto-save failed:', error)
        triggerFeedback('error')
        setLastFailedText(nextText)
        setSaveStatus('error')
      }
    },
    [onUpdate, triggerFeedback]
  )

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Only auto-save while the local draft differs from the last persisted text.
    if (text !== lastPersistedTextRef.current) {
      autoSaveTimeoutRef.current = setTimeout(async () => {
        await saveJournalText(text)
      }, JOURNAL_AUTOSAVE_DELAY_MS)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [text, saveJournalText])

  const handleTextChange = (newText: string) => {
    // Enforce character limit
    if (newText.length <= maxLength) {
      saveRequestIdRef.current += 1
      textRef.current = newText
      setText(newText)
      setCharacterCount(newText.length)
      setLastFailedText(null)
      setSaveStatus(
        newText === lastPersistedTextRef.current ? 'idle' : 'draft'
      )
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Force save on blur if there are unsaved changes
    if (text !== lastPersistedTextRef.current) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
        autoSaveTimeoutRef.current = null
      }
      void saveJournalText(text)
    }
  }

  const handleKeyboardDone = useCallback(() => {
    textInputRef.current?.blur()
    Keyboard.dismiss()
  }, [])

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
    if (saveStatus === 'draft') {
      return t('journal.unsavedDraft')
    }
    if (saveStatus === 'saving') {
      return t('common.saving')
    }
    if (saveStatus === 'error') {
      return t('journal.saveFailedDraft')
    }
    if (saveStatus === 'saved' && lastSaved) {
      const now = new Date()
      const diffMs = now.getTime() - lastSaved.getTime()
      const diffMinutes = Math.floor(diffMs / MS_PER_MINUTE)

      if (diffMinutes < 1) {
        return t('journal.saved')
      } else if (diffMinutes < MINUTES_PER_HOUR) {
        return t('journal.savedMinutesAgo', { minutes: diffMinutes })
      } else {
        const diffHours = Math.floor(diffMinutes / MINUTES_PER_HOUR)
        return t('journal.savedHoursAgo', { hours: diffHours })
      }
    }
    return ''
  }

  const isNearLimit = characterCount > maxLength * JOURNAL_NEAR_LIMIT_RATIO
  const isAtLimit = characterCount >= maxLength
  const footerHint =
    saveStatus === 'draft' || saveStatus === 'error'
      ? t('journal.unsavedDraftHint')
      : t('journal.autoSave')
  const feedbackKind =
    saveStatus === 'idle' ? null : getJournalFeedbackKind(saveStatus)

  return (
    <VStack space="sm" testID="journal-input-container">
      {/* Header */}
      <HStack className="items-center justify-between">
        <Text className="text-lg font-semibold text-gray-800">
          {t('journal.title')}
        </Text>
        <HStack className="items-center" space="xs">
          {saveStatus === 'saving' && (
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
          inputAccessoryViewID={
            shouldShowKeyboardDoneButton ? inputAccessoryViewID : undefined
          }
          scrollEnabled={true}
          submitBehavior="newline"
          style={{
            minHeight: JOURNAL_TEXT_INPUT_MIN_HEIGHT_PX,
          }}
        />
      </Box>

      {shouldShowKeyboardDoneButton && (
        <KeyboardDoneAccessory
          accessibilityLabel={t('journal.doneEditingA11y')}
          nativeID={inputAccessoryViewID}
          onPress={handleKeyboardDone}
          testID="journal-keyboard-done-button"
          title={t('common.done')}
        />
      )}

      {feedbackKind && (
        <OperationFeedback
          kind={feedbackKind}
          message={getStatusText()}
          actionLabel={saveStatus === 'error' ? t('common.retry') : undefined}
          onAction={
            saveStatus === 'error'
              ? () => {
                  void saveJournalText(lastFailedText ?? text)
                }
              : undefined
          }
          testID="journal-save-feedback"
        />
      )}

      {/* Footer with character count and hints */}
      <HStack className="items-center justify-between">
        <Text className="text-xs text-gray-500">
          {text.length === 0
            ? t('journal.reflectionPrompt', { date: formatDate(date) })
            : footerHint}
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
        <Box className="mt-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
          <HStack className="items-center justify-center" space="sm">
            <IconSymbol name="lightbulb" size={16} color="#1D4ED8" />
            <Text className="flex-1 text-center text-sm text-blue-700">
              {t('journal.encouragement')}
            </Text>
          </HStack>
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
