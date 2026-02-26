/**
 * Page-level Error Boundary with retry and fallback
 *
 * Wraps individual route pages so a crash in one page
 * doesn't take down the entire app. Includes Suspense
 * for lazy-loaded pages.
 */

import { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { useTranslation } from '../i18n';

function PageErrorFallback({ pageName }) {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  return (
    <div className="flex items-center justify-center min-h-[50vh] px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-full bg-amber-100">
          <svg
            className="w-7 h-7 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {pageName ? `${t('pageErrorIn', 'Feil i')} ${pageName}` : t('errorTitle')}
        </h2>

        <p className="text-gray-600 mb-6 text-sm">
          {t(
            'pageErrorDesc',
            'An error occurred on this page. The rest of the application still works normally.'
          )}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            {t('back')}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
          >
            {t('reloadPage')}
          </button>
        </div>
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
    </div>
  );
}

export default function PageErrorBoundary({ children, pageName }) {
  return (
    <ErrorBoundary fallback={<PageErrorFallback pageName={pageName} />}>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
