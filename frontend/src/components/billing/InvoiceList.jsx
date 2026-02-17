/**
 * InvoiceList Component
 * Display and manage invoices with filtering and pagination
 *
 * Shows all invoices with status indicators, search functionality,
 * and quick actions for payment tracking
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Send,
  Printer,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  MoreVertical,
  Ban,
  CreditCard,
} from 'lucide-react';
import { billingAPI } from '../../services/api';

/**
 * Get status badge styling and label
 */
const getStatusConfig = (status) => {
  const configs = {
    draft: {
      label: 'Utkast',
      color: 'bg-gray-100 text-gray-700',
      icon: FileText,
    },
    pending: {
      label: 'Venter',
      color: 'bg-yellow-100 text-yellow-800',
      icon: Clock,
    },
    sent: {
      label: 'Sendt',
      color: 'bg-blue-100 text-blue-800',
      icon: Send,
    },
    paid: {
      label: 'Betalt',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
    },
    partial: {
      label: 'Delvis betalt',
      color: 'bg-orange-100 text-orange-800',
      icon: CreditCard,
    },
    overdue: {
      label: 'Forfalt',
      color: 'bg-red-100 text-red-800',
      icon: AlertTriangle,
    },
    cancelled: {
      label: 'Kansellert',
      color: 'bg-gray-100 text-gray-500',
      icon: XCircle,
    },
    credited: {
      label: 'Kreditert',
      color: 'bg-purple-100 text-purple-800',
      icon: Ban,
    },
  };
  return configs[status] || configs.pending;
};

/**
 * InvoiceList Component
 * @param {Object} props
 * @param {Function} props.onViewInvoice - Callback when viewing invoice details
 * @param {Function} props.onRecordPayment - Callback to open payment recording
 */
export default function InvoiceList({ onViewInvoice, onRecordPayment }) {
  const queryClient = useQueryClient();

  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('invoice_date');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Fetch invoices
  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', { page, limit, statusFilter, searchTerm, dateRange, sortBy, sortOrder }],
    queryFn: async () => {
      const response = await billingAPI.getInvoices({
        page,
        limit,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        start_date: dateRange.start || undefined,
        end_date: dateRange.end || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      return response.data;
    },
  });

  // Finalize invoice mutation
  const finalizeMutation = useMutation({
    mutationFn: (invoiceId) => billingAPI.finalizeInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
    },
  });

  // Cancel invoice mutation
  const cancelMutation = useMutation({
    mutationFn: ({ invoiceId, reason }) => billingAPI.cancelInvoice(invoiceId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
    },
  });

  /**
   * Format currency in NOK
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  /**
   * Format date in Norwegian format
   */
  const formatDate = (date) => {
    if (!date) {
      return '-';
    }
    return new Date(date).toLocaleDateString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  /**
   * Handle send/finalize invoice
   */
  const handleSendInvoice = async (invoiceId) => {
    try {
      await finalizeMutation.mutateAsync(invoiceId);
      setActiveDropdown(null);
    } catch (error) {
      console.error('Failed to send invoice:', error);
    }
  };

  /**
   * Handle cancel invoice
   */
  const handleCancelInvoice = async (invoiceId) => {
    const reason = window.prompt('Angi grunn for kansellering:');
    if (!reason) {
      return;
    }

    try {
      await cancelMutation.mutateAsync({ invoiceId, reason });
      setActiveDropdown(null);
    } catch (error) {
      console.error('Failed to cancel invoice:', error);
    }
  };

  /**
   * Handle print invoice
   */
  const handlePrintInvoice = async (invoiceId) => {
    try {
      const response = await billingAPI.getInvoiceHTML(invoiceId);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(response.data.html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    } catch (error) {
      console.error('Failed to print invoice:', error);
    }
  };

  /**
   * Toggle sort order
   */
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('DESC');
    }
  };

  const invoices = data?.invoices || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        Kunne ikke laste fakturaer: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Sok etter pasient eller fakturanummer..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Alle statuser</option>
            <option value="draft">Utkast</option>
            <option value="pending">Venter</option>
            <option value="sent">Sendt</option>
            <option value="paid">Betalt</option>
            <option value="partial">Delvis betalt</option>
            <option value="overdue">Forfalt</option>
            <option value="cancelled">Kansellert</option>
          </select>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => {
              setDateRange({ ...dateRange, start: e.target.value });
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Fra dato"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => {
              setDateRange({ ...dateRange, end: e.target.value });
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Til dato"
          />
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('invoice_number')}
                >
                  Faktura
                  {sortBy === 'invoice_number' && (sortOrder === 'ASC' ? ' ▲' : ' ▼')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pasient
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('patient_amount')}
                >
                  Belop
                  {sortBy === 'patient_amount' && (sortOrder === 'ASC' ? ' ▲' : ' ▼')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  Status
                  {sortBy === 'status' && (sortOrder === 'ASC' ? ' ▲' : ' ▼')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('invoice_date')}
                >
                  Dato
                  {sortBy === 'invoice_date' && (sortOrder === 'ASC' ? ' ▲' : ' ▼')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('due_date')}
                >
                  Forfall
                  {sortBy === 'due_date' && (sortOrder === 'ASC' ? ' ▲' : ' ▼')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-3">Laster fakturaer...</p>
                  </td>
                </tr>
              ) : invoices.length > 0 ? (
                invoices.map((invoice) => {
                  const statusConfig = getStatusConfig(invoice.status);
                  const StatusIcon = statusConfig.icon;
                  const isOverdue =
                    invoice.status !== 'paid' &&
                    invoice.status !== 'cancelled' &&
                    new Date(invoice.due_date) < new Date();

                  return (
                    <tr
                      key={invoice.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => onViewInvoice && onViewInvoice(invoice)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-blue-600">{invoice.invoice_number}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900">{invoice.patient_name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(invoice.patient_amount)}
                          </span>
                          {invoice.amount_paid > 0 && invoice.status !== 'paid' && (
                            <span className="text-sm text-gray-500 block">
                              Betalt: {formatCurrency(invoice.amount_paid)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig.color}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {formatDate(invoice.invoice_date)}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}
                      >
                        {formatDate(invoice.due_date)}
                        {isOverdue &&
                          invoice.status !== 'paid' &&
                          invoice.status !== 'cancelled' && (
                            <AlertTriangle className="w-4 h-4 inline ml-1 text-red-500" />
                          )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === invoice.id ? null : invoice.id);
                            }}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeDropdown === invoice.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewInvoice && onViewInvoice(invoice);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                Se faktura
                              </button>
                              {invoice.status === 'draft' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendInvoice(invoice.id);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-blue-600"
                                >
                                  <Send className="w-4 h-4" />
                                  Send faktura
                                </button>
                              )}
                              {['pending', 'sent', 'partial', 'overdue'].includes(
                                invoice.status
                              ) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRecordPayment && onRecordPayment(invoice);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Registrer betaling
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintInvoice(invoice.id);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Printer className="w-4 h-4" />
                                Skriv ut
                              </button>
                              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelInvoice(invoice.id);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Kanseller
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Ingen fakturaer</h3>
                    <p className="text-sm text-gray-500">
                      {searchTerm || statusFilter
                        ? 'Ingen fakturaer matcher soket ditt'
                        : 'Opprett din forste faktura for a komme i gang'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-500">
              Viser {(page - 1) * limit + 1}-{Math.min(page * limit, pagination.total)} av{' '}
              {pagination.total} fakturaer
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm">
                Side {page} av {pagination.pages}
              </span>
              <button
                onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                disabled={page === pagination.pages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {activeDropdown && (
        <div className="fixed inset-0 z-0" onClick={() => setActiveDropdown(null)} />
      )}
    </div>
  );
}
