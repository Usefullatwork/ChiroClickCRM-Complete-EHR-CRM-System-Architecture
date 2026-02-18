/**
 * AutomationStatsTab - Trigger statistics and upcoming triggers
 * Extracted from Automations.jsx for maintainability
 */

import { Zap, Clock, Gift } from 'lucide-react';

export default function AutomationStatsTab({
  stats,
  statsLoading,
  t,
  language,
  triggerIcons,
  triggerColors,
  getTriggerLabel,
}) {
  return (
    <div className="space-y-6">
      {/* Trigger Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.triggerStats}</h3>
        {statsLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : stats.trigger_stats?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.trigger_stats.map((stat) => {
              const TriggerIcon = triggerIcons[stat.trigger_type] || Zap;
              const triggerColor = triggerColors[stat.trigger_type] || 'gray';

              return (
                <div
                  key={stat.trigger_type}
                  className={`p-4 rounded-lg bg-${triggerColor}-50 border border-${triggerColor}-200`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TriggerIcon className={`w-5 h-5 text-${triggerColor}-600`} />
                    <span className="text-sm font-medium text-gray-700">
                      {getTriggerLabel(stat.trigger_type)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>
                      <span className="font-medium text-gray-900">{stat.workflow_count}</span>
                      <span className="ml-1">
                        {language === 'no' ? 'arbeidsflyter' : 'workflows'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{stat.active_workflows}</span>
                      <span className="ml-1">{language === 'no' ? 'aktive' : 'active'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{stat.total_executions}</span>
                      <span className="ml-1">{language === 'no' ? 'utforelser' : 'runs'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-600">
                        {stat.successful_executions}
                      </span>
                      <span className="ml-1">{language === 'no' ? 'vellykket' : 'success'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            {language === 'no' ? 'Ingen statistikk tilgjengelig' : 'No statistics available'}
          </p>
        )}
      </div>

      {/* Upcoming Triggers */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.upcomingTriggers}</h3>
        {stats.upcoming_triggers ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Birthdays */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-700">{t.birthdays}</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    stats.upcoming_triggers.birthdays?.has_active_workflow
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {stats.upcoming_triggers.birthdays?.has_active_workflow
                    ? t.hasActiveWorkflow
                    : t.noActiveWorkflow}
                </span>
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.upcoming_triggers.birthdays?.count || 0}
              </div>
              <div className="space-y-1 text-sm text-gray-500">
                {stats.upcoming_triggers.birthdays?.patients?.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span>
                      {p.first_name} {p.last_name}
                    </span>
                    <span>{p.days_until_birthday}d</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recalls */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-gray-700">{t.recalls}</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    stats.upcoming_triggers.recalls?.has_active_workflow
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {stats.upcoming_triggers.recalls?.has_active_workflow
                    ? t.hasActiveWorkflow
                    : t.noActiveWorkflow}
                </span>
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.upcoming_triggers.recalls?.count || 0}
              </div>
              <div className="space-y-1 text-sm text-gray-500">
                {stats.upcoming_triggers.recalls?.patients?.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span>
                      {p.first_name} {p.last_name}
                    </span>
                    <span>{p.days_since_visit}d</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            {language === 'no' ? 'Laster...' : 'Loading...'}
          </p>
        )}
      </div>
    </div>
  );
}
