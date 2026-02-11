import {
  Building2,
  Save,
  Loader2,
  Check,
  Mail,
  Phone,
  Globe,
  MapPin,
  Monitor,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import toast from '../../utils/toast';

export default function OrganizationSettings({
  t,
  organization,
  orgLoading,
  editMode,
  formData,
  setFormData,
  handleEdit,
  handleCancel,
  handleSave,
  updateOrgMutation,
}) {
  return (
    <div className="space-y-6">
      {orgLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Organization Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('organizationInfo')}
              </h2>
              {!editMode ? (
                <button
                  onClick={() => handleEdit(organization)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('edit')}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateOrgMutation.isLoading}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {updateOrgMutation.isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('saving')}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {t('save')}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Organization Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    {t('orgName')}
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white">
                      {organization.name || '-'}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    {t('email')}
                  </label>
                  {editMode ? (
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {organization.email || '-'}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    {t('clinicPhone')}
                  </label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {organization.phone || '-'}
                    </p>
                  )}
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    {t('website')}
                  </label>
                  {editMode ? (
                    <input
                      type="url"
                      value={formData.website || ''}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      {organization.website || '-'}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  {t('clinicAddress')}
                </label>
                {editMode ? (
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-white flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    {organization.address || '-'}
                  </p>
                )}
              </div>

              {!editMode && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 dark:text-gray-200">
                    {t('created')}: {formatDate(organization.created_at, 'time')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Kiosk Mode Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('kioskTitle')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-200">
                    {t('kioskDescription')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-white">
                  {t('kioskLaunchDescription')}
                </p>
                <ul className="text-sm text-gray-600 dark:text-white space-y-2 ml-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600" />
                    {t('kioskFeature1')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600" />
                    {t('kioskFeature2')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600" />
                    {t('kioskFeature3')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600" />
                    {t('kioskFeature4')}
                  </li>
                </ul>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => window.open('/kiosk', '_blank', 'fullscreen=yes')}
                    className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700
                               transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Monitor className="w-5 h-5" />
                    {t('launchKiosk')}
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/kiosk`);
                      toast.success(t('kioskUrlCopied'));
                    }}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg
                               hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {t('copyKioskUrl')}
                  </button>
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">{t('fullscreenTip')}</p>
                      <p className="text-blue-700 mt-1">
                        {t('fullscreenDescription').replace('{key}', '')}
                        <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">
                          F11
                        </kbd>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
