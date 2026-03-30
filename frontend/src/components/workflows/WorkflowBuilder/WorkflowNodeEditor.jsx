/**
 * WorkflowNodeEditor - Action list with type-specific config editors
 * Sub-component of WorkflowBuilder
 */

import { Play, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

import { ACTION_TYPES } from './constants';

export default function WorkflowNodeEditor({
  actions,
  addAction,
  removeAction,
  updateAction,
  moveAction,
  activeSection,
  setActiveSection,
  errors,
  language,
  t,
  staff,
}) {
  const renderActionConfig = (action, index) => {
    const actionType = ACTION_TYPES[action.type];
    if (!actionType) {
      return null;
    }

    return (
      <div className="space-y-3">
        {/* Delay */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.delayHours}</label>
          <input
            type="number"
            value={action.delay_hours || 0}
            onChange={(e) => updateAction(index, { delay_hours: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="0"
          />
        </div>

        {action.type === 'SEND_SMS' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.message} *</label>
            <textarea
              value={action.message || ''}
              onChange={(e) => updateAction(index, { message: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={language === 'no' ? 'Hei {firstName}...' : 'Hi {firstName}...'}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t.variables}</p>
          </div>
        )}

        {action.type === 'SEND_EMAIL' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.subject} *</label>
              <input
                type="text"
                value={action.subject || ''}
                onChange={(e) => updateAction(index, { subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.body} *</label>
              <textarea
                value={action.body || ''}
                onChange={(e) => updateAction(index, { body: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t.variables}</p>
            </div>
          </>
        )}

        {action.type === 'CREATE_FOLLOW_UP' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.priority}</label>
                <select
                  value={action.priority || 'MEDIUM'}
                  onChange={(e) => updateAction(index, { priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="HIGH">{language === 'no' ? 'Hoy' : 'High'}</option>
                  <option value="MEDIUM">{language === 'no' ? 'Medium' : 'Medium'}</option>
                  <option value="LOW">{language === 'no' ? 'Lav' : 'Low'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.dueInDays}
                </label>
                <input
                  type="number"
                  value={action.due_in_days || 7}
                  onChange={(e) => updateAction(index, { due_in_days: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'no' ? 'Arsak' : 'Reason'}
              </label>
              <input
                type="text"
                value={action.reason || ''}
                onChange={(e) => updateAction(index, { reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {staff.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.assignTo}</label>
                <select
                  value={action.assigned_to || ''}
                  onChange={(e) => updateAction(index, { assigned_to: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{language === 'no' ? 'Ikke tildelt' : 'Unassigned'}</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {(action.type === 'UPDATE_STATUS' || action.type === 'UPDATE_LIFECYCLE') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.newValue} *</label>
            <select
              value={action.value || ''}
              onChange={(e) => updateAction(index, { value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{language === 'no' ? 'Velg...' : 'Select...'}</option>
              {action.type === 'UPDATE_STATUS' ? (
                <>
                  <option value="ACTIVE">{language === 'no' ? 'Aktiv' : 'Active'}</option>
                  <option value="INACTIVE">{language === 'no' ? 'Inaktiv' : 'Inactive'}</option>
                  <option value="FINISHED">{language === 'no' ? 'Ferdig' : 'Finished'}</option>
                </>
              ) : (
                <>
                  {[
                    'NEW',
                    'ONBOARDING',
                    'ACTIVE',
                    'AT_RISK',
                    'INACTIVE',
                    'LOST',
                    'REACTIVATED',
                  ].map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        )}

        {action.type === 'NOTIFY_STAFF' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.message} *</label>
              <textarea
                value={action.message || ''}
                onChange={(e) => updateAction(index, { message: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.notifyRoles}
              </label>
              <div className="flex gap-3">
                {['ADMIN', 'PRACTITIONER', 'ASSISTANT'].map((role) => (
                  <label key={role} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(action.roles || []).includes(role)}
                      onChange={(e) => {
                        const roles = action.roles || [];
                        if (e.target.checked) {
                          updateAction(index, { roles: [...roles, role] });
                        } else {
                          updateAction(index, { roles: roles.filter((r) => r !== role) });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{role}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {action.type === 'ADD_TAG' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.tag} *</label>
            <input
              type="text"
              value={action.tag || ''}
              onChange={(e) => updateAction(index, { tag: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={language === 'no' ? 'f.eks. VIP' : 'e.g., VIP'}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setActiveSection(activeSection === 'actions' ? '' : 'actions')}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <Play className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{t.actions}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.actionsSection}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              {actions.length}
            </span>
          )}
          {activeSection === 'actions' ? (
            <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-300" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-300" />
          )}
        </div>
      </button>

      {activeSection === 'actions' && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="mt-4 space-y-4">
            {actions.map((action, index) => {
              const actionType = ACTION_TYPES[action.type];
              if (!actionType) {
                return null;
              }
              const Icon = actionType.icon;

              return (
                <div
                  key={`action-${action.type}-${index}`}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-gray-400 dark:text-gray-300">
                        <button
                          onClick={() => moveAction(index, -1)}
                          disabled={index === 0}
                          className="p-1 hover:text-gray-600 dark:text-gray-300 disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveAction(index, 1)}
                          disabled={index === actions.length - 1}
                          className="p-1 hover:text-gray-600 dark:text-gray-300 disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <div
                        className={`w-8 h-8 rounded-lg bg-${actionType.color}-100 flex items-center justify-center`}
                      >
                        <Icon className={`w-4 h-4 text-${actionType.color}-600`} />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">
                          {index + 1}. {actionType.label[language] || actionType.label.en}
                        </span>
                        {action.delay_hours > 0 && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            (+{action.delay_hours}h)
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeAction(index)}
                      className="p-2 text-gray-400 dark:text-gray-300 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {renderActionConfig(action, index)}
                </div>
              );
            })}

            {actions.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">{t.noActions}</p>
            )}
          </div>

          {errors.actions && <p className="mt-2 text-sm text-red-600">{errors.actions}</p>}

          {/* Add Action Buttons */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">{t.addAction}:</p>
            <div className="flex flex-wrap gap-2">
              {Object.values(ACTION_TYPES).map((actionType) => {
                const Icon = actionType.icon;
                return (
                  <button
                    key={actionType.id}
                    onClick={() => addAction(actionType.id)}
                    className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Icon className={`w-4 h-4 text-${actionType.color}-600`} />
                    {actionType.label[language] || actionType.label.en}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
