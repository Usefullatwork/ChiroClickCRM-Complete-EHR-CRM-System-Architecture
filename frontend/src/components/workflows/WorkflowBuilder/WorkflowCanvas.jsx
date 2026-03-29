/**
 * WorkflowCanvas - Trigger selection grid and trigger-specific config
 * Sub-component of WorkflowBuilder
 */

import { ChevronDown, ChevronUp, Zap } from 'lucide-react';

import { TRIGGER_TYPES } from './constants';

export default function WorkflowCanvas({
  triggerType,
  setTriggerType,
  triggerConfig,
  setTriggerConfig,
  activeSection,
  setActiveSection,
  errors,
  language,
  t,
}) {
  const renderTriggerConfig = () => {
    if (!triggerType) {
      return null;
    }

    switch (triggerType) {
      case 'DAYS_SINCE_VISIT':
        return (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.days}</label>
              <input
                type="number"
                value={triggerConfig.days || 42}
                onChange={(e) =>
                  setTriggerConfig({ ...triggerConfig, days: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
          </div>
        );

      case 'BIRTHDAY':
        return (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.daysBefore}</label>
              <input
                type="number"
                value={triggerConfig.days_before || 0}
                onChange={(e) =>
                  setTriggerConfig({ ...triggerConfig, days_before: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
        );

      case 'APPOINTMENT_SCHEDULED':
      case 'APPOINTMENT_COMPLETED':
        return (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.appointmentType} ({language === 'no' ? 'valgfritt' : 'optional'})
              </label>
              <select
                value={triggerConfig.appointment_type || ''}
                onChange={(e) =>
                  setTriggerConfig({ ...triggerConfig, appointment_type: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{language === 'no' ? 'Alle typer' : 'All types'}</option>
                <option value="INITIAL">{language === 'no' ? 'Forstegangstime' : 'Initial'}</option>
                <option value="FOLLOWUP">
                  {language === 'no' ? 'Oppfolgingstime' : 'Follow-up'}
                </option>
                <option value="MAINTENANCE">
                  {language === 'no' ? 'Vedlikeholdstime' : 'Maintenance'}
                </option>
              </select>
            </div>
          </div>
        );

      case 'LIFECYCLE_CHANGE':
        return (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.fromStage} ({language === 'no' ? 'valgfritt' : 'optional'})
              </label>
              <select
                value={triggerConfig.from_stage || ''}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, from_stage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{language === 'no' ? 'Alle' : 'Any'}</option>
                {['NEW', 'ONBOARDING', 'ACTIVE', 'AT_RISK', 'INACTIVE', 'LOST', 'REACTIVATED'].map(
                  (stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.toStage} ({language === 'no' ? 'valgfritt' : 'optional'})
              </label>
              <select
                value={triggerConfig.to_stage || ''}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, to_stage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{language === 'no' ? 'Alle' : 'Any'}</option>
                {['NEW', 'ONBOARDING', 'ACTIVE', 'AT_RISK', 'INACTIVE', 'LOST', 'REACTIVATED'].map(
                  (stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setActiveSection(activeSection === 'trigger' ? '' : 'trigger')}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{t.trigger}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.triggerSection}</p>
          </div>
        </div>
        {activeSection === 'trigger' ? (
          <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-300" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-300" />
        )}
      </button>

      {activeSection === 'trigger' && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(TRIGGER_TYPES).map((trigger) => {
              const Icon = trigger.icon;
              const isSelected = triggerType === trigger.id;

              return (
                <button
                  key={trigger.id}
                  onClick={() => {
                    setTriggerType(trigger.id);
                    setTriggerConfig({});
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? `border-${trigger.color}-500 bg-${trigger.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mb-2 ${
                      isSelected ? `text-${trigger.color}-600` : 'text-gray-400 dark:text-gray-300'
                    }`}
                  />
                  <p
                    className={`text-sm font-medium ${
                      isSelected ? `text-${trigger.color}-900` : 'text-gray-700'
                    }`}
                  >
                    {trigger.label[language] || trigger.label.en}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {trigger.description[language] || trigger.description.en}
                  </p>
                </button>
              );
            })}
          </div>

          {errors.trigger && <p className="mt-2 text-sm text-red-600">{errors.trigger}</p>}

          {renderTriggerConfig()}
        </div>
      )}
    </div>
  );
}
