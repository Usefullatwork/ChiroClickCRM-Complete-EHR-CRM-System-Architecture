/**
 * MessageHistory Component
 *
 * Displays log of sent messages from the sent_messages table.
 * Supports filtering by type (SMS/Email), status, date range, and patient.
 * Norwegian and English language support.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  History,
  Search,
  _Filter,
  _Calendar,
  MessageSquare,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  _ChevronRight,
  User,
  ExternalLink,
  RefreshCw,
  Download,
} from 'lucide-react';
import { communicationsAPI } from '../../services/api';
import { _formatDate, _formatRelativeTime } from '../../lib/utils';

// Status configurations
const STATUS_CONFIG = {
  SENT: {
    label: { no: 'Sendt', en: 'Sent' },
    icon: CheckCircle,
    color: 'green',
  },
  DELIVERED: {
    label: { no: 'Levert', en: 'Delivered' },
    icon: CheckCircle,
    color: 'green',
  },
  PENDING: {
    label: { no: 'Venter', en: 'Pending' },
    icon: Clock,
    color: 'yellow',
  },
  FAILED: {
    label: { no: 'Feilet', en: 'Failed' },
    icon: XCircle,
    color: 'red',
  },
  OPENED: {
    label: { no: 'Apnet', en: 'Opened' },
    icon: CheckCircle,
    color: 'blue',
  },
  CLICKED: {
    label: { no: 'Klikket', en: 'Clicked' },
    icon: ExternalLink,
    color: 'purple',
  },
};

export default function MessageHistory({ language = 'no' }) {
  // State
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    patientId: '',
    startDate: '',
    endDate: '',
  });
  const [expandedMessage, setExpandedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Labels
  const labels = {
    no: {
      title: 'Meldingshistorikk',
      subtitle: 'Oversikt over alle sendte meldinger',
      search: 'Sok etter pasient eller innhold...',
      allTypes: 'Alle typer',
      allStatuses: 'Alle statuser',
      dateRange: 'Datoperiode',
      from: 'Fra',
      to: 'Til',
      patient: 'Pasient',
      message: 'Melding',
      type: 'Type',
      status: 'Status',
      sentAt: 'Sendt',
      sentBy: 'Sendt av',
      recipient: 'Mottaker',
      template: 'Mal',
      noMessages: 'Ingen meldinger funnet',
      noMessagesDesc: 'Ingen meldinger matcher valgte filtre.',
      refresh: 'Oppdater',
      export: 'Eksporter',
      previous: 'Forrige',
      next: 'Neste',
      showing: 'Viser',
      of: 'av',
      messages: 'meldinger',
      automated: 'Automatisk',
      manual: 'Manuell',
      viewDetails: 'Vis detaljer',
      deliveredAt: 'Levert',
      openedAt: 'Apnet',
      clickedAt: 'Klikket',
      failureReason: 'Feilarsak',
      subject: 'Emne',
    },
    en: {
      title: 'Message History',
      subtitle: 'Overview of all sent messages',
      search: 'Search for patient or content...',
      allTypes: 'All Types',
      allStatuses: 'All Statuses',
      dateRange: 'Date Range',
      from: 'From',
      to: 'To',
      patient: 'Patient',
      message: 'Message',
      type: 'Type',
      status: 'Status',
      sentAt: 'Sent',
      sentBy: 'Sent By',
      recipient: 'Recipient',
      template: 'Template',
      noMessages: 'No messages found',
      noMessagesDesc: 'No messages match the selected filters.',
      refresh: 'Refresh',
      export: 'Export',
      previous: 'Previous',
      next: 'Next',
      showing: 'Showing',
      of: 'of',
      messages: 'messages',
      automated: 'Automated',
      manual: 'Manual',
      viewDetails: 'View Details',
      deliveredAt: 'Delivered',
      openedAt: 'Opened',
      clickedAt: 'Clicked',
      failureReason: 'Failure Reason',
      subject: 'Subject',
    },
  };

  const t = labels[language] || labels.no;

  // Build query params
  const queryParams = {
    page,
    limit: 20,
    type: filters.type !== 'all' ? filters.type : undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    patientId: filters.patientId || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    search: searchTerm || undefined,
  };

  // Fetch messages
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['message-history', queryParams],
    queryFn: async () => {
      const response = await communicationsAPI.getAll(queryParams);
      return {
        communications: response.data?.communications || [],
        pagination: response.data?.pagination || { page: 1, limit: 20, total: 0, pages: 1 },
      };
    },
  });

  const messages = data?.communications || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, pages: 1 };

  // Get status info
  const getStatusInfo = (status) => {
    return (
      STATUS_CONFIG[status] || {
        label: { no: status, en: status },
        icon: AlertCircle,
        color: 'gray',
      }
    );
  };

  // Format relative time with fallback
  const formatTime = (dateString) => {
    if (!dateString) {
      return '-';
    }
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) {
        return language === 'no' ? 'Akkurat na' : 'Just now';
      }
      if (diffMins < 60) {
        return `${diffMins}m ${language === 'no' ? 'siden' : 'ago'}`;
      }
      if (diffHours < 24) {
        return `${diffHours}t ${language === 'no' ? 'siden' : 'ago'}`;
      }
      if (diffDays < 7) {
        return `${diffDays}d ${language === 'no' ? 'siden' : 'ago'}`;
      }

      return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return dateString;
    }
  };

  // Format full date time
  const formatFullDateTime = (dateString) => {
    if (!dateString) {
      return '-';
    }
    try {
      return new Date(dateString).toLocaleString(language === 'no' ? 'nb-NO' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Handle export
  const handleExport = async () => {
    // Create CSV content
    const headers = ['Dato', 'Type', 'Pasient', 'Mottaker', 'Status', 'Melding'];
    const rows = messages.map((msg) => [
      formatFullDateTime(msg.sent_at),
      msg.type,
      msg.patient_name || '-',
      msg.recipient_phone || msg.recipient_email || '-',
      getStatusInfo(msg.status || 'SENT').label[language],
      msg.content?.substring(0, 100) || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `meldingshistorikk_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t.title}</h2>
          <p className="text-sm text-gray-500">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            {t.refresh}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            {t.export}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => {
              setFilters({ ...filters, type: e.target.value });
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t.allTypes}</option>
            <option value="SMS">SMS</option>
            <option value="EMAIL">E-post</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t.allStatuses}</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label[language]}
              </option>
            ))}
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setFilters({ ...filters, startDate: e.target.value });
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setFilters({ ...filters, endDate: e.target.value });
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-3">
              {language === 'no' ? 'Laster meldinger...' : 'Loading messages...'}
            </p>
          </div>
        ) : messages.length > 0 ? (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
              <div className="col-span-3">{t.patient}</div>
              <div className="col-span-4">{t.message}</div>
              <div className="col-span-1">{t.type}</div>
              <div className="col-span-2">{t.status}</div>
              <div className="col-span-2">{t.sentAt}</div>
            </div>

            {/* Messages */}
            <div className="divide-y divide-gray-100">
              {messages.map((message) => {
                const statusInfo = getStatusInfo(message.status || 'SENT');
                const StatusIcon = statusInfo.icon;
                const isExpanded = expandedMessage === message.id;

                return (
                  <div key={message.id} className="hover:bg-gray-50 transition-colors">
                    {/* Main Row */}
                    <div
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => setExpandedMessage(isExpanded ? null : message.id)}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Patient */}
                        <div className="col-span-12 md:col-span-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {message.patient_name || 'Ukjent pasient'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {message.recipient_phone || message.recipient_email}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Message Preview */}
                        <div className="col-span-12 md:col-span-4">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {message.subject && (
                              <span className="font-medium">{message.subject}: </span>
                            )}
                            {message.content}
                          </p>
                          {message.template_name && (
                            <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs bg-gray-100 text-gray-600 rounded">
                              {message.template_name}
                            </span>
                          )}
                        </div>

                        {/* Type */}
                        <div className="col-span-4 md:col-span-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
                              message.type === 'SMS'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {message.type === 'SMS' ? (
                              <MessageSquare className="w-3 h-3" />
                            ) : (
                              <Mail className="w-3 h-3" />
                            )}
                            {message.type}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="col-span-4 md:col-span-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label[language]}
                          </span>
                          {message.is_automated && (
                            <span className="ml-1 text-xs text-gray-400">({t.automated})</span>
                          )}
                        </div>

                        {/* Sent At */}
                        <div className="col-span-4 md:col-span-2 flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {formatTime(message.sent_at)}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left Column */}
                          <div className="space-y-3">
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase">
                                {t.sentAt}
                              </span>
                              <p className="text-sm text-gray-900">
                                {formatFullDateTime(message.sent_at)}
                              </p>
                            </div>

                            {message.sent_by_name && (
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">
                                  {t.sentBy}
                                </span>
                                <p className="text-sm text-gray-900">{message.sent_by_name}</p>
                              </div>
                            )}

                            {message.delivered_at && (
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">
                                  {t.deliveredAt}
                                </span>
                                <p className="text-sm text-gray-900">
                                  {formatFullDateTime(message.delivered_at)}
                                </p>
                              </div>
                            )}

                            {message.opened_at && (
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">
                                  {t.openedAt}
                                </span>
                                <p className="text-sm text-gray-900">
                                  {formatFullDateTime(message.opened_at)}
                                </p>
                              </div>
                            )}

                            {message.failure_reason && (
                              <div>
                                <span className="text-xs font-medium text-red-500 uppercase">
                                  {t.failureReason}
                                </span>
                                <p className="text-sm text-red-600">{message.failure_reason}</p>
                              </div>
                            )}
                          </div>

                          {/* Right Column - Full Message */}
                          <div>
                            {message.subject && (
                              <div className="mb-2">
                                <span className="text-xs font-medium text-gray-500 uppercase">
                                  {t.subject}
                                </span>
                                <p className="text-sm font-medium text-gray-900">
                                  {message.subject}
                                </p>
                              </div>
                            )}
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase">
                                {t.message}
                              </span>
                              <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200">
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                                  {message.content}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {t.showing} {(page - 1) * pagination.limit + 1}-
                {Math.min(page * pagination.limit, pagination.total)} {t.of} {pagination.total}{' '}
                {t.messages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t.previous}
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  {page} / {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={page >= pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t.next}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="px-6 py-12 text-center">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">{t.noMessages}</h3>
            <p className="text-sm text-gray-500 mt-1">{t.noMessagesDesc}</p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {messages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: language === 'no' ? 'Totalt sendt' : 'Total Sent',
              value: pagination.total,
              color: 'blue',
            },
            {
              label: language === 'no' ? 'Levert' : 'Delivered',
              value: messages.filter((m) => m.status === 'DELIVERED' || m.status === 'SENT').length,
              color: 'green',
            },
            {
              label: language === 'no' ? 'Apnet' : 'Opened',
              value: messages.filter((m) => m.opened_at).length,
              color: 'purple',
            },
            {
              label: language === 'no' ? 'Feilet' : 'Failed',
              value: messages.filter((m) => m.status === 'FAILED').length,
              color: 'red',
            },
          ].map((stat, index) => (
            <div
              key={index}
              className={`bg-${stat.color}-50 rounded-lg p-4 border border-${stat.color}-100`}
            >
              <div className={`text-2xl font-bold text-${stat.color}-700`}>{stat.value}</div>
              <div className={`text-sm text-${stat.color}-600`}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
