import { getLocales } from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ja from './locales/ja'
import en from './locales/en'

const LANGUAGE_KEY = '@engage/language'

const deviceLanguage = getLocales()[0]?.languageCode ?? 'ja'

i18n.use(initReactI18next).init({
  resources: {
    ja: { translation: ja },
    en: { translation: en },
  },
  lng: deviceLanguage,
  fallbackLng: 'ja',
  interpolation: { escapeValue: false },
})

// Load saved language preference (async, overrides device default)
AsyncStorage.getItem(LANGUAGE_KEY).then((savedLang) => {
  if (savedLang && (savedLang === 'ja' || savedLang === 'en')) {
    i18n.changeLanguage(savedLang)
  }
})

/**
 * Change app language and persist preference
 * @param lang - Target language code ('ja' or 'en')
 * @example
 * await changeLanguage('en') // Switch to English
 */
export const changeLanguage = async (lang: 'ja' | 'en') => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang)
  await i18n.changeLanguage(lang)
}

/**
 * Get translated display name for preset categories.
 * Known preset IDs (business/life) return translated names.
 * Custom categories return their stored name.
 * @param category - Category with id and name
 * @returns Translated display name
 * @example
 * getCategoryDisplayName({ id: 'business', name: '事業' }) // => 'Business' (en) or '事業' (ja)
 * getCategoryDisplayName({ id: 'custom-1', name: 'My Category' }) // => 'My Category'
 */
const PRESET_CATEGORY_KEYS: Record<string, string> = {
  business: 'preset.categories.business',
  life: 'preset.categories.life',
}

export const getCategoryDisplayName = (category: {
  id: string
  name: string
}): string => {
  const key = PRESET_CATEGORY_KEYS[category.id]
  return key ? i18n.t(key) : category.name
}

export default i18n
