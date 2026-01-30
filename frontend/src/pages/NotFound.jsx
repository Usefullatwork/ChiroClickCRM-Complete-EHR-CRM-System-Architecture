import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n'

export default function NotFound() {
  const { t } = useTranslation('common')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="text-xl text-gray-600 mt-4">{t('pageNotFound')}</p>
        <Link
          to="/"
          className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t('goBackHome')}
        </Link>
      </div>
    </div>
  )
}
