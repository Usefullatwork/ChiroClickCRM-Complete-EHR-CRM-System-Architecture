/**
 * WorkflowListTab - Displays workflow list with filters
 * Extracted from Automations.jsx for maintainability
 */

import {
  Zap,
  Plus,
  Play,
  Pause,
  Clock,
  CheckCircle,
  Filter,
  Search,
  Edit,
  Trash2,
  History,
} from 'lucide-react';
import { formatRelativeTime } from '../../lib/utils';

const _TRIGGER_ICONS = {
  PATIENT_CREATED: () => null,
  APPOINTMENT_SCHEDULED: () => null,
  APPOINTMENT_COMPLETED: () => null,
  APPOINTMENT_MISSED: () => null,
  APPOINTMENT_CANCELLED: () => null,
  DAYS_SINCE_VISIT: () => null,
  BIRTHDAY: () => null,
  LIFECYCLE_CHANGE: () => null,
  CUSTOM: () => null,
};

export default function WorkflowListTab({
  filteredWorkflows,
  workflowsLoading,
  filters,
  setFilters,
  t,
  language,
  triggerIcons,
  triggerColors,
  getTriggerLabel,
  onToggle,
  onEdit,
  onDelete,
  onViewHistory,
  onCreateNew,
}) {
  return (
    <>
      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {language === 'no' ? 'Filtrer:' : 'Filter:'}
            </span>
          </div>

          <select
            value={filters.isActive}
            onChange={(e) => setFilters((prev) => ({ ...prev, isActive: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t.allStatuses}</option>
            <option value="true">{t.activeOnly}</option>
            <option value="false">{t.inactiveOnly}</option>
          </select>

          <select
            value={filters.triggerType}
            onChange={(e) => setFilters((prev) => ({ ...prev, triggerType: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t.allTriggers}</option>
            {Object.keys(triggerIcons).map((type) => (
              <option key={type} value={type}>
                {getTriggerLabel(type)}
              </option>
            ))}
          </select>

          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {workflowsLoading ? (
          <div className="px-6 py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-3">
              {language === 'no' ? 'Laster arbeidsflyter...' : 'Loading workflows...'}
            </p>
          </div>
        ) : filteredWorkflows.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredWorkflows.map((workflow) => {
              const TriggerIcon = triggerIcons[workflow.trigger_type] || Zap;
              const triggerColor = triggerColors[workflow.trigger_type] || 'gray';
              const successRate =
                workflow.total_runs > 0
                  ? Math.round((workflow.successful_count / workflow.execution_count) * 100)
                  : 0;

              return (
                <div key={workflow.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Trigger Icon */}
                      <div
                        className={`w-12 h-12 rounded-lg bg-${triggerColor}-100 flex items-center justify-center`}
                      >
                        <TriggerIcon className={`w-6 h-6 text-${triggerColor}-600`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              workflow.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {workflow.is_active ? t.enabled : t.disabled}
                          </span>
                        </div>

                        {workflow.description && (
                          <p className="text-sm text-gray-500 mt-1">{workflow.description}</p>
                        )}

                        <div className="flex items-center gap-6 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <TriggerIcon className="w-3 h-3" />
                            {getTriggerLabel(workflow.trigger_type)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t.lastRun}:{' '}
                            {workflow.last_execution
                              ? formatRelativeTime(workflow.last_execution)
                              : t.never}
                          </span>
                          <span className="flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            {t.totalRuns}: {workflow.execution_count || 0}
                          </span>
                          {workflow.execution_count > 0 && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {t.successRate}: {successRate}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggle(workflow.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          workflow.is_active
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={workflow.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {workflow.is_active ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>

                      <button
                        onClick={() => onEdit(workflow)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t.edit}
                      >
                        <Edit className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => onViewHistory(workflow)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title={t.viewHistory}
                      >
                        <History className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => onDelete(workflow)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t.delete}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">{t.noWorkflows}</h3>
            <p className="text-sm text-gray-500 mt-1">{t.noWorkflowsDesc}</p>
            <button
              onClick={onCreateNew}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
            >
              <Plus className="w-4 h-4" />
              {t.createWorkflow}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
