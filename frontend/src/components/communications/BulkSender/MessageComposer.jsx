/**
 * MessageComposer - Step 2: Template, message, schedule, priority
 * Sub-component of BulkSender
 */

import { Clock, ChevronDown, ChevronUp, Info, Zap } from 'lucide-react';

export default function MessageComposer({
  communicationType,
  selectedTemplateId,
  handleTemplateSelect,
  templatesData,
  customMessage,
  setCustomMessage,
  customSubject,
  setCustomSubject,
  scheduleType,
  setScheduleType,
  scheduledDateTime,
  setScheduledDateTime,
  priority,
  setPriority,
  showVariables,
  setShowVariables,
  variablesData,
  insertVariable,
  messageStats,
  t,
}) {
  return (
    <div className="space-y-4">
      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.selectTemplate}</label>
        <select
          value={selectedTemplateId || ''}
          onChange={(e) => handleTemplateSelect(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t.noTemplate}</option>
          {templatesData?.data?.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      {/* Email Subject */}
      {communicationType === 'EMAIL' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.subject}</label>
          <input
            type="text"
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            placeholder={t.subjectPlaceholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Message Content */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">{t.customMessage}</label>
          <button
            onClick={() => setShowVariables(!showVariables)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Info className="w-4 h-4" />
            {t.availableVariables}
            {showVariables ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>

        {showVariables && variablesData?.data && (
          <div className="mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t.variableHelp}</p>
            <div className="flex flex-wrap gap-1">
              {variablesData.data.map((v) => (
                <button
                  key={v.variable}
                  onClick={() => insertVariable(v.variable)}
                  className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300"
                  title={v.description}
                >
                  {v.variable}
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder={t.messagePlaceholder}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
        />

        <div className="flex items-center justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
          <span>
            {messageStats.charCount} {t.characterCount}
            {communicationType === 'SMS' && ` (${messageStats.smsSegments} ${t.smsSegments})`}
          </span>
        </div>
      </div>

      {/* Schedule Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.schedule}</label>
        <div className="flex gap-2">
          <button
            onClick={() => setScheduleType('immediate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              scheduleType === 'immediate'
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-white border-gray-300 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            <Zap className="w-4 h-4" />
            {t.sendImmediately}
          </button>
          <button
            onClick={() => setScheduleType('scheduled')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              scheduleType === 'scheduled'
                ? 'bg-purple-50 border-purple-300 text-purple-700'
                : 'bg-white border-gray-300 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            {t.scheduleForLater}
          </button>
        </div>

        {scheduleType === 'scheduled' && (
          <div className="mt-3">
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              {t.scheduledTime}
            </label>
            <input
              type="datetime-local"
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.priority}</label>
        <div className="flex gap-2">
          {[
            { value: 'HIGH', label: t.priorityHigh, color: 'red' },
            { value: 'NORMAL', label: t.priorityNormal, color: 'blue' },
            { value: 'LOW', label: t.priorityLow, color: 'gray' },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPriority(p.value)}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                priority === p.value
                  ? `bg-${p.color}-50 border-${p.color}-300 text-${p.color}-700`
                  : 'bg-white border-gray-300 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
