/**
 * BulkHistory - Step 3: Review summary before sending
 * Sub-component of BulkSender
 */

import { Mail, MessageSquare, Clock, Eye, EyeOff, Users, RefreshCw } from 'lucide-react';

export default function BulkHistory({
  selectedPatients,
  communicationType,
  scheduleType,
  scheduledDateTime,
  customSubject,
  showPreview,
  setShowPreview,
  previewPatientId,
  setPreviewPatientId,
  previewData,
  previewLoading,
  patientsData,
  getMessageContent,
  language,
  t,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t.reviewing}</h3>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-700">{t.selectedPatients}</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{selectedPatients.length}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              {communicationType === 'SMS' ? (
                <MessageSquare className="w-5 h-5 text-purple-600" />
              ) : (
                <Mail className="w-5 h-5 text-purple-600" />
              )}
              <span className="text-sm text-purple-700">{t.communicationType}</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {communicationType === 'SMS' ? t.sms : t.email}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">{t.schedule}</span>
            </div>
            <p className="text-lg font-bold text-green-900">
              {scheduleType === 'immediate'
                ? t.sendImmediately
                : new Date(scheduledDateTime).toLocaleString(language === 'no' ? 'nb-NO' : 'en-US')}
            </p>
          </div>
        </div>

        {/* Message Preview */}
        <div className="border border-gray-200 rounded-lg">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="font-medium text-gray-700">{t.messagePreview}</span>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showPreview ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  {t.hidePreview}
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  {t.previewMessage}
                </>
              )}
            </button>
          </div>
          <div className="p-4">
            {communicationType === 'EMAIL' && customSubject && (
              <div className="mb-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">{t.subject}:</span>
                <p className="font-medium text-gray-900">{customSubject}</p>
              </div>
            )}
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-3 rounded">
                {getMessageContent()}
              </pre>
            </div>

            {/* Personalized Preview */}
            {showPreview && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {t.selectPatientForPreview}
                </label>
                <select
                  value={previewPatientId || ''}
                  onChange={(e) => setPreviewPatientId(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">-- {t.selectPatientForPreview} --</option>
                  {patientsData?.data?.patients
                    ?.filter((p) => selectedPatients.includes(p.id))
                    .slice(0, 20)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                </select>

                {previewLoading ? (
                  <div className="mt-3 flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading preview...
                  </div>
                ) : previewData?.data ? (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900 font-medium mb-1">
                      {previewData.data.patientName}
                    </p>
                    <pre className="whitespace-pre-wrap font-sans text-sm text-blue-800">
                      {previewData.data.personalizedContent}
                    </pre>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
