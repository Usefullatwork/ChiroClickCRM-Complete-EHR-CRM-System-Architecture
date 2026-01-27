import { useCallback } from 'react'
import { useLanguage } from './LanguageContext'
import { translations } from './translations'

/**
 * Hook for accessing translations.
 * @param {string} [namespace] - Optional namespace to scope translations
 * @returns {{ t: Function, lang: string, setLang: Function }}
 */
export function useTranslation(namespace) {
  const { lang, setLang } = useLanguage()

  const t = useCallback((key, fallback) => {
    // Try namespace first, then common
    const namespaces = namespace ? [namespace, 'common'] : ['common']

    for (const ns of namespaces) {
      const section = translations[ns]
      if (!section) continue
      const langData = section[lang] || section['en']
      if (langData && langData[key] !== undefined) return langData[key]
      // Fallback to other language
      const otherLang = lang === 'no' ? 'en' : 'no'
      const otherData = section[otherLang]
      if (otherData && otherData[key] !== undefined) return otherData[key]
    }

    return fallback !== undefined ? fallback : key
  }, [lang, namespace])

  /**
   * Pick the right value from a bilingual {no, en} object.
   */
  const getBilingual = useCallback((obj) => {
    if (!obj || typeof obj !== 'object') return obj
    return obj[lang] ?? obj['en'] ?? obj['no'] ?? obj
  }, [lang])

  return { t, lang, setLang, getBilingual }
}
