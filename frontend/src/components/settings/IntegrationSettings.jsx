import { Check, CreditCard, Key } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function IntegrationSettings({ t }) {
  return (
    <div className="space-y-6">
      {/* SolvIt Integration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('solvitIntegration')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">{t('solvitDesc')}</p>
          </div>
          <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded flex items-center gap-2">
            <Check className="w-4 h-4" />
            {t('active')}
          </span>
        </div>
        <div className="p-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-white">{t('status')}:</span>
              <span className="text-gray-900 dark:text-white font-medium">{t('connected')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-white">{t('lastSync')}:</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatDate(new Date(), 'time')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-white">{t('syncMode')}:</span>
              <span className="text-gray-900 dark:text-white font-medium">{t('automatic')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Google Drive Integration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('googleDriveIntegration')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">{t('googleDriveDesc')}</p>
          </div>
          <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded flex items-center gap-2">
            <Check className="w-4 h-4" />
            {t('active')}
          </span>
        </div>
        <div className="p-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-white">{t('status')}:</span>
              <span className="text-gray-900 dark:text-white font-medium">{t('connected')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-white">{t('trainingDataFolder')}:</span>
              <span className="text-gray-900 dark:text-white font-medium">{t('configured')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-white">{t('autoImport')}:</span>
              <span className="text-gray-900 dark:text-white font-medium">{t('enabled')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Integration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('stripeIntegration')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">{t('stripeDesc')}</p>
          </div>
          <span className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 rounded">
            {t('notConnected')}
          </span>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-white mb-4">{t('connectStripeDesc')}</p>
          <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            {t('connectStripe')}
          </button>
        </div>
      </div>

      {/* API Access */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('apiAccess')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">{t('apiAccessDesc')}</p>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Key className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">{t('apiComingSoon')}</p>
              <p className="text-xs text-blue-700 mt-1">{t('apiComingSoonDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
