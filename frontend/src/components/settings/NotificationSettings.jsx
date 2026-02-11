import { AlertCircle } from 'lucide-react';

export default function NotificationSettings({ t }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('notificationPrefs')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">{t('manageNotifications')}</p>
      </div>

      <div className="p-6 space-y-4">
        {/* Email Notifications */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {t('emailNotifications')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-200">
              {t('emailNotificationsDesc')}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Appointment Reminders */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {t('appointmentReminders')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-200">
              {t('appointmentRemindersDesc')}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Follow-up Notifications */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {t('followUpNotifications')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-200">
              {t('followUpNotificationsDesc')}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* System Updates */}
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {t('systemUpdates')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-200">{t('systemUpdatesDesc')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="pt-4">
          <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">{t('notificationComingSoon')}</p>
              <p className="text-xs text-blue-700 mt-1">{t('notificationComingSoonDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
