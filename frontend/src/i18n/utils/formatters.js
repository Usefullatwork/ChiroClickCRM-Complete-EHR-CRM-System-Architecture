/**
 * Locale-aware formatters
 */

const LOCALE_MAP = { no: 'nb-NO', en: 'en-GB' }

function getLocale(lang) {
  return LOCALE_MAP[lang] || LOCALE_MAP.no
}

export function formatDate(date, lang, options) {
  const d = date instanceof Date ? date : new Date(date)
  const defaultOpts = { year: 'numeric', month: 'long', day: 'numeric' }
  return d.toLocaleDateString(getLocale(lang), options || defaultOpts)
}

export function formatDateShort(date, lang) {
  return formatDate(date, lang, { month: 'short', day: 'numeric' })
}

export function formatDateWithWeekday(date, lang) {
  return formatDate(date, lang, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatTime(date, lang) {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleTimeString(getLocale(lang), { hour: '2-digit', minute: '2-digit' })
}

export function formatCurrency(amount, lang) {
  const locale = getLocale(lang)
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'NOK', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

export function formatNumber(num, lang) {
  return new Intl.NumberFormat(getLocale(lang)).format(num)
}
