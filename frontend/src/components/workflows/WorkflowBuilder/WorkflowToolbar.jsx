/**
 * WorkflowToolbar - Header, toggle, footer actions, and test modal
 * Sub-component of WorkflowBuilder
 */

import { Play, Save, Eye, CheckCircle, XCircle, Zap } from 'lucide-react';

export function WorkflowHeader({ t, isActive, setIsActive, isEdit }) {
  return (
    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
        <Zap className="w-6 h-6 text-blue-600" />
        {isEdit ? t.titleEdit : t.title}
      </h2>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className={isActive ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}>
            {t.enabled}
          </span>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isActive ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                isActive ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}

export function WorkflowFooter({ t, language, isSaving, onSave, onCancel, onShowTest }) {
  return (
    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
      <button
        onClick={onShowTest}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <Eye className="w-4 h-4" />
        {t.test}
      </button>

      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800"
        >
          {t.cancel}
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? (language === 'no' ? 'Lagrer...' : 'Saving...') : t.save}
        </button>
      </div>
    </div>
  );
}

export function WorkflowTestModal({
  t,
  language,
  testPatients,
  testPatientId,
  setTestPatientId,
  testResult,
  isTesting,
  onTest,
  onClose,
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{t.test}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.selectPatient}
            </label>
            <select
              value={testPatientId}
              onChange={(e) => setTestPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{language === 'no' ? 'Velg...' : 'Select...'}</option>
              {testPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-lg ${
                testResult.success && testResult.conditions_pass
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {testResult.success && testResult.conditions_pass ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span
                  className={`font-medium ${
                    testResult.success && testResult.conditions_pass
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}
                >
                  {testResult.conditions_pass ? t.conditionsPassed : t.conditionsFailed}
                </span>
              </div>

              {testResult.actions && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">{t.actionsPreview}:</p>
                  <div className="space-y-2">
                    {testResult.actions.map((action, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-gray-600 dark:text-gray-300 pl-4 border-l-2 border-gray-200"
                      >
                        <strong>{action.type}</strong>
                        {action.delay_hours > 0 && ` (+${action.delay_hours}h)`}
                        {action.preview && (
                          <pre className="mt-1 text-xs bg-white/50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(action.preview, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800"
          >
            {t.cancel}
          </button>
          <button
            onClick={onTest}
            disabled={!testPatientId || isTesting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {isTesting ? (language === 'no' ? 'Tester...' : 'Testing...') : t.runTest}
          </button>
        </div>
      </div>
    </div>
  );
}
