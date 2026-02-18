/**
 * ExecutionHistoryTab - Workflow execution history table with filters
 * Extracted from Automations.jsx for maintainability
 */

import { Filter, History } from 'lucide-react';
import { formatRelativeTime } from '../../lib/utils';

const STATUS_COLORS = {
  PENDING: 'yellow',
  RUNNING: 'blue',
  COMPLETED: 'green',
  FAILED: 'red',
  CANCELLED: 'gray',
  PAUSED: 'orange',
};

export default function ExecutionHistoryTab({
  executions,
  executionsLoading,
  executionFilters,
  setExecutionFilters,
  workflows,
  t,
  language,
  getTriggerLabel,
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
            value={executionFilters.status}
            onChange={(e) => setExecutionFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t.allStatuses}</option>
            <option value="COMPLETED">{language === 'no' ? 'Fullfort' : 'Completed'}</option>
            <option value="RUNNING">{language === 'no' ? 'Kjorer' : 'Running'}</option>
            <option value="FAILED">{language === 'no' ? 'Feilet' : 'Failed'}</option>
            <option value="PENDING">{language === 'no' ? 'Venter' : 'Pending'}</option>
          </select>

          <select
            value={executionFilters.workflowId}
            onChange={(e) =>
              setExecutionFilters((prev) => ({ ...prev, workflowId: e.target.value }))
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{language === 'no' ? 'Alle arbeidsflyter' : 'All Workflows'}</option>
            {workflows.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          {executionFilters.workflowId && (
            <button
              onClick={() => setExecutionFilters({ status: '', workflowId: '' })}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {language === 'no' ? 'Nullstill filter' : 'Clear filters'}
            </button>
          )}
        </div>
      </div>

      {/* Executions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {language === 'no' ? 'Arbeidsflyt' : 'Workflow'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.patient}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.status}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.started}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {executionsLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </td>
              </tr>
            ) : executions.length > 0 ? (
              executions.map((execution) => {
                const statusColor = STATUS_COLORS[execution.status] || 'gray';

                return (
                  <tr key={execution.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {execution.workflow_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getTriggerLabel(execution.trigger_type)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{execution.patient_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full bg-${statusColor}-100 text-${statusColor}-700`}
                      >
                        {execution.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatRelativeTime(execution.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {execution.current_step || 0}/{execution.total_steps || 0}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{t.noExecutions}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
