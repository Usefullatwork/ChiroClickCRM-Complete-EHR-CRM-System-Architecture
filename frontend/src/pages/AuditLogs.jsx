/**
 * Audit Log Viewer
 * GDPR Article 30 - Record of processing activities
 * View all system audit logs for compliance and security
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  User,
  AlertCircle,
  XCircle,
  Database,
} from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '../i18n';
import { auditLogsAPI } from '../services/api';

export default function AuditLogs() {
  const { t } = useTranslation('common');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    action: '',
    resourceType: '',
    userRole: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  // Fetch audit logs from real backend
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs', filters, page],
    queryFn: async () => {
      const params = { page, limit: 50 };
      if (filters.action) {
        params.action = filters.action;
      }
      if (filters.resourceType) {
        params.resourceType = filters.resourceType;
      }
      if (filters.userRole) {
        params.userRole = filters.userRole;
      }
      if (filters.startDate) {
        params.startDate = filters.startDate;
      }
      if (filters.endDate) {
        params.endDate = filters.endDate;
      }
      if (filters.search) {
        params.search = filters.search;
      }
      const res = await auditLogsAPI.getAll(params);
      return res.data;
    },
  });

  const logs = logsData?.logs || [];
  const totalPages = logsData?.totalPages || 1;

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE':
        return <FileText className="w-4 h-4 text-green-600" />;
      case 'READ':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'UPDATE':
        return <Edit className="w-4 h-4 text-yellow-600" />;
      case 'DELETE':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'EXPORT':
        return <Download className="w-4 h-4 text-purple-600" />;
      default:
        return <Database className="w-4 h-4 text-gray-600 dark:text-gray-300" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'READ':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'EXPORT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const exportAuditLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('auditLogs')}</h1>
              <p className="text-gray-600 dark:text-gray-300">{t('auditLogsSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={exportAuditLogs}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            {t('exportLogs')}
          </button>
        </div>
      </div>

      {/* GDPR Compliance Notice */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{t('gdprCompliance')}</h3>
            <p className="text-sm text-gray-700">{t('gdprComplianceDesc')}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('startDate')}</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilter('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('endDate')}</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilter('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('action')}</label>
            <select
              value={filters.action}
              onChange={(e) => updateFilter('action', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('allActions')}</option>
              <option value="CREATE">{t('create')}</option>
              <option value="READ">Read</option>
              <option value="UPDATE">{t('update')}</option>
              <option value="DELETE">{t('delete')}</option>
              <option value="EXPORT">{t('export')}</option>
            </select>
          </div>

          {/* Resource Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('resourceType')}
            </label>
            <select
              value={filters.resourceType}
              onChange={(e) => updateFilter('resourceType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('allResources')}</option>
              <option value="PATIENT">Patient</option>
              <option value="ENCOUNTER">{t('clinicalEncounter')}</option>
              <option value="APPOINTMENT">{t('appointment')}</option>
              <option value="FINANCIAL">Financial</option>
              <option value="COMMUNICATION">{t('communication')}</option>
              <option value="DOCUMENT">{t('document')}</option>
            </select>
          </div>

          {/* User Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('userRole')}</label>
            <select
              value={filters.userRole}
              onChange={(e) => updateFilter('userRole', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('allRoles')}</option>
              <option value="ADMIN">{t('admin')}</option>
              <option value="PRACTITIONER">{t('practitioner')}</option>
              <option value="ASSISTANT">{t('assistant')}</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('search')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 w-4 h-4" />
              <input
                type="text"
                placeholder={t('searchLogs')}
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('timestamp')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('user')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('action')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('resource')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('ipAddress')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('details')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                      {t('loadingAuditLogs')}
                    </p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('noAuditLogs')}</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span>{format(new Date(log.created_at), 'MMM d, yyyy')}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(log.created_at), 'HH:mm:ss')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.user_name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {log.user_role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}
                      >
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.resource_type}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                        {log.resource_name || log.resource_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.ip_address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        {t('viewDetails')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-700">
              {t('page')} {page} / {totalPages} ({logsData?.total || 0} {t('total')})
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-100"
              >
                {t('previous')}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-100"
              >
                {t('next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{t('auditLogDetails')}</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('timestamp')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(selectedLog.created_at), 'PPpp')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('action')}
                  </label>
                  <p className="mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(selectedLog.action)}`}
                    >
                      {getActionIcon(selectedLog.action)}
                      {selectedLog.action}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('user')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.user_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedLog.user_email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('role')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.user_role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('resourceType')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.resource_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Resource ID
                  </label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedLog.resource_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('ipAddress')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.ip_address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('userAgent')}
                  </label>
                  <p className="mt-1 text-xs text-gray-900 truncate" title={selectedLog.user_agent}>
                    {selectedLog.user_agent}
                  </p>
                </div>
              </div>

              {selectedLog.reason && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('reason')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    {selectedLog.reason}
                  </p>
                </div>
              )}

              {selectedLog.changes && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                    {t('changes')}
                  </label>
                  <pre className="text-xs bg-gray-50 p-3 rounded-lg border border-gray-200 overflow-x-auto">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
