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

// Mock API - In production, this would call a real audit logs endpoint
const mockAuditAPI = {
  getAll: async (_params) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockLogs = [
      {
        id: '1',
        created_at: new Date().toISOString(),
        user_email: 'dr.smith@chiroclinic.no',
        user_name: 'Dr. John Smith',
        user_role: 'PRACTITIONER',
        action: 'READ',
        resource_type: 'PATIENT',
        resource_id: 'pat-001',
        resource_name: 'Erik Johansen',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0...',
        reason: null,
        changes: null,
      },
      {
        id: '2',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        user_email: 'admin@chiroclinic.no',
        user_name: 'Admin User',
        user_role: 'ADMIN',
        action: 'UPDATE',
        resource_type: 'PATIENT',
        resource_id: 'pat-001',
        resource_name: 'Erik Johansen',
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0...',
        reason: null,
        changes: { consent_marketing: { old: false, new: true } },
      },
      {
        id: '3',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        user_email: 'dr.smith@chiroclinic.no',
        user_name: 'Dr. John Smith',
        user_role: 'PRACTITIONER',
        action: 'CREATE',
        resource_type: 'ENCOUNTER',
        resource_id: 'enc-123',
        resource_name: 'Clinical Encounter',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0...',
        reason: null,
        changes: null,
      },
      {
        id: '4',
        created_at: new Date(Date.now() - 10800000).toISOString(),
        user_email: 'admin@chiroclinic.no',
        user_name: 'Admin User',
        user_role: 'ADMIN',
        action: 'EXPORT',
        resource_type: 'PATIENT',
        resource_id: 'pat-002',
        resource_name: 'Anna Larsen',
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0...',
        reason: 'GDPR Article 20 - Data Portability Request',
        changes: null,
      },
      {
        id: '5',
        created_at: new Date(Date.now() - 14400000).toISOString(),
        user_email: 'assistant@chiroclinic.no',
        user_name: 'Maria Hansen',
        user_role: 'ASSISTANT',
        action: 'DELETE',
        resource_type: 'APPOINTMENT',
        resource_id: 'apt-456',
        resource_name: 'Appointment',
        ip_address: '192.168.1.102',
        user_agent: 'Mozilla/5.0...',
        reason: 'Patient requested cancellation',
        changes: null,
      },
    ];

    return { data: { logs: mockLogs, total: mockLogs.length } };
  },
};

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
  const [selectedLog, setSelectedLog] = useState(null);

  // Fetch audit logs
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => mockAuditAPI.getAll(filters),
  });

  const logs = logsData?.data?.logs || [];

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
        return <Database className="w-4 h-4 text-gray-600" />;
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
              <p className="text-gray-600">{t('auditLogsSubtitle')}</p>
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
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('endDate')}</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('action')}</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
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
              onChange={(e) => setFilters((prev) => ({ ...prev, resourceType: e.target.value }))}
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
              onChange={(e) => setFilters((prev) => ({ ...prev, userRole: e.target.value }))}
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('searchLogs')}
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('timestamp')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('action')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('resource')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('ipAddress')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('details')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-3">{t('loadingAuditLogs')}</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">{t('noAuditLogs')}</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span>{format(new Date(log.created_at), 'MMM d, yyyy')}</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(log.created_at), 'HH:mm:ss')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.user_name}</div>
                          <div className="text-xs text-gray-500">{log.user_role}</div>
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
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">
                        {log.resource_name || log.resource_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                  <label className="text-sm font-medium text-gray-500">{t('timestamp')}</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(selectedLog.created_at), 'PPpp')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('action')}</label>
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
                  <label className="text-sm font-medium text-gray-500">{t('user')}</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.user_name}</p>
                  <p className="text-xs text-gray-500">{selectedLog.user_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('role')}</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.user_role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('resourceType')}</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.resource_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Resource ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedLog.resource_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('ipAddress')}</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.ip_address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('userAgent')}</label>
                  <p className="mt-1 text-xs text-gray-900 truncate" title={selectedLog.user_agent}>
                    {selectedLog.user_agent}
                  </p>
                </div>
              </div>

              {selectedLog.reason && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('reason')}</label>
                  <p className="mt-1 text-sm text-gray-900 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    {selectedLog.reason}
                  </p>
                </div>
              )}

              {selectedLog.changes && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">
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
