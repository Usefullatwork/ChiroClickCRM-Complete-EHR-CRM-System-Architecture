/**
 * SendProgress - Step 4: Batch progress, stats, cancel
 * Sub-component of BulkSender
 */

import { CheckCircle, XCircle, AlertCircle, RefreshCw, Pause } from 'lucide-react';

export default function SendProgress({
  batchStatus,
  progressPercentage,
  isComplete,
  activeBatchId,
  cancelMutation,
  language,
  t,
}) {
  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="text-center">
        {batchStatus?.data?.status === 'COMPLETED' ? (
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
        ) : batchStatus?.data?.status === 'COMPLETED_WITH_ERRORS' ? (
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
        ) : batchStatus?.data?.status === 'CANCELLED' ? (
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
        ) : (
          <RefreshCw className="w-16 h-16 text-blue-500 mx-auto mb-3 animate-spin" />
        )}
        <h3 className="text-lg font-medium text-gray-900">
          {batchStatus?.data?.status === 'COMPLETED'
            ? t.completed
            : batchStatus?.data?.status === 'COMPLETED_WITH_ERRORS'
              ? t.completedWithErrors
              : batchStatus?.data?.status === 'CANCELLED'
                ? t.cancel
                : t.sending}
        </h3>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-gray-600 dark:text-gray-300">{t.progress}</span>
          <span className="font-medium text-gray-900">{progressPercentage}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              batchStatus?.data?.status === 'COMPLETED'
                ? 'bg-green-500'
                : batchStatus?.data?.status === 'COMPLETED_WITH_ERRORS'
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      {batchStatus?.data?.stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{batchStatus.data.stats.sent || 0}</p>
            <p className="text-sm text-green-700">{t.sent}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{batchStatus.data.stats.failed || 0}</p>
            <p className="text-sm text-red-700">{t.failed}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-gray-600 dark:text-gray-300">
              {batchStatus.data.stats.pending || 0}
            </p>
            <p className="text-sm text-gray-700">{t.pending}</p>
          </div>
        </div>
      )}

      {/* Estimated Completion */}
      {batchStatus?.data?.estimatedCompletionTime && !isComplete && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          {t.estimatedCompletion}:{' '}
          {new Date(batchStatus.data.estimatedCompletionTime).toLocaleTimeString(
            language === 'no' ? 'nb-NO' : 'en-US'
          )}
        </div>
      )}

      {/* Skipped Patients */}
      {batchStatus?.data?.skippedPatients?.length > 0 && (
        <div className="border border-yellow-200 rounded-lg bg-yellow-50">
          <div className="px-4 py-3 border-b border-yellow-200">
            <span className="font-medium text-yellow-800">{t.skippedPatients}</span>
          </div>
          <div className="max-h-[150px] overflow-y-auto divide-y divide-yellow-100">
            {batchStatus.data.skippedPatients.map((p, idx) => (
              <div key={idx} className="px-4 py-2 flex items-center justify-between">
                <span className="text-sm text-yellow-900">{p.name}</span>
                <span className="text-xs text-yellow-700">{p.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Button */}
      {!isComplete && (
        <div className="flex justify-center">
          <button
            onClick={() => cancelMutation.mutate(activeBatchId)}
            disabled={cancelMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
          >
            <Pause className="w-4 h-4" />
            {t.cancelBatch}
          </button>
        </div>
      )}
    </div>
  );
}
