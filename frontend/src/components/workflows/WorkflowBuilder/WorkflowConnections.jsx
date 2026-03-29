/**
 * WorkflowConnections - Conditions section and Settings section
 * Sub-component of WorkflowBuilder
 */

import { Plus, Trash2, ChevronDown, ChevronUp, Settings } from 'lucide-react';

import { CONDITION_FIELDS, OPERATORS } from './constants';

export function ConditionsSection({
  conditions,
  addCondition,
  removeCondition,
  updateCondition,
  activeSection,
  setActiveSection,
  language,
  t,
}) {
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setActiveSection(activeSection === 'conditions' ? '' : 'conditions')}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{t.conditions}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.conditionsSection}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conditions.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
              {conditions.length}
            </span>
          )}
          {activeSection === 'conditions' ? (
            <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-300" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-300" />
          )}
        </div>
      </button>

      {activeSection === 'conditions' && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="mt-4 space-y-3">
            {conditions.map((condition, index) => (
              <div
                key={`condition-${condition.field || index}`}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {index > 0 && (
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t.and}
                  </span>
                )}
                <select
                  value={condition.field}
                  onChange={(e) => updateCondition(index, { field: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t.field}...</option>
                  {CONDITION_FIELDS.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label[language] || field.label.en}
                    </option>
                  ))}
                </select>
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, { operator: e.target.value })}
                  className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(OPERATORS).map(([key, op]) => (
                    <option key={key} value={key}>
                      {op.label[language] || op.label.en}
                    </option>
                  ))}
                </select>
                {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, { value: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder={t.value}
                  />
                )}
                <button
                  onClick={() => removeCondition(index)}
                  className="p-2 text-gray-400 dark:text-gray-300 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addCondition}
            className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" />
            {t.addCondition}
          </button>
        </div>
      )}
    </div>
  );
}

export function SettingsSection({
  maxRunsPerPatient,
  setMaxRunsPerPatient,
  activeSection,
  setActiveSection,
  t,
}) {
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setActiveSection(activeSection === 'settings' ? '' : 'settings')}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{t.settings}</h3>
          </div>
        </div>
        {activeSection === 'settings' ? (
          <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-300" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-300" />
        )}
      </button>

      {activeSection === 'settings' && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.maxRuns}</label>
            <input
              type="number"
              value={maxRunsPerPatient}
              onChange={(e) => setMaxRunsPerPatient(parseInt(e.target.value) || 0)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t.maxRunsHelp}</p>
          </div>
        </div>
      )}
    </div>
  );
}
