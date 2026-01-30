import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const LanguageContext = createContext(null)

const STORAGE_KEY = 'user_language'
const DEFAULT_LANG = 'no'

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG
    } catch {
      return DEFAULT_LANG
    }
  })

  const setLang = useCallback((newLang) => {
    setLangState(newLang)
    try {
      localStorage.setItem(STORAGE_KEY, newLang)
    } catch {
      // localStorage unavailable
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang === 'no' ? 'nb' : 'en'
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
