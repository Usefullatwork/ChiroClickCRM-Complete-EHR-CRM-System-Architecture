/**
 * Financial Tracking Page
 * Comprehensive financial management and billing tracking
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financialAPI, patientsAPI } from '../services/api'
import { formatDate, formatCurrency } from '../lib/utils'
import { useTranslation, formatDate as i18nFormatDate, formatCurrency as i18nFormatCurrency } from '../i18n'
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Download,
  Filter,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Calendar,
  ChevronDown
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import InvoiceModal from '../components/InvoiceModal'

export default function Financial() {
  const { t, lang } = useTranslation('financial')
  const queryClient = useQueryClient()

  // Filters state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentStatus: '',
    transactionType: '',
    patientSearch: '',
    page: 1,
    limit: 20
  })

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInvoiceTransaction, setSelectedInvoiceTransaction] = useState(null)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Fetch financial summary
  const { data: summaryData } = useQuery({
    queryKey: ['financial-summary', filters.startDate, filters.endDate],
    queryFn: () => financialAPI.getSummary({
      startDate: filters.startDate,
      endDate: filters.endDate
    })
  })

  // Fetch financial transactions
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['financial-transactions', filters],
    queryFn: () => financialAPI.getAll(filters)
  })

  // Fetch outstanding invoices
  const { data: outstandingData } = useQuery({
    queryKey: ['financial-outstanding'],
    queryFn: () => financialAPI.getOutstanding()
  })

  // Fetch payment method breakdown
  const { data: paymentMethodsData } = useQuery({
    queryKey: ['financial-payment-methods', filters.startDate, filters.endDate],
    queryFn: () => financialAPI.getPaymentMethods({
      startDate: filters.startDate,
      endDate: filters.endDate
    })
  })

  // Fetch daily revenue chart
  const { data: revenueChartData } = useQuery({
    queryKey: ['financial-revenue-chart', filters.startDate, filters.endDate],
    queryFn: () => financialAPI.getDailyRevenueChart({
      startDate: filters.startDate,
      endDate: filters.endDate
    })
  })

  const summary = summaryData?.data || {
    totalRevenue: 0,
    totalPaid: 0,
    totalPending: 0,
    totalOutstanding: 0,
    transactionCount: 0
  }

  const transactions = transactionsData?.data?.transactions || []
  const pagination = transactionsData?.data?.pagination || { page: 1, pages: 1, total: 0 }
  const outstanding = outstandingData?.data?.invoices || []
  const paymentMethods = paymentMethodsData?.data?.breakdown || []
  const revenueChart = revenueChartData?.data?.dailyRevenue || []

  // Update payment status mutation
  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, status }) => financialAPI.updatePaymentStatus(id, { payment_status: status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['financial-transactions'])
      queryClient.invalidateQueries(['financial-summary'])
      queryClient.invalidateQueries(['financial-outstanding'])
    }
  })

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PARTIALLY_PAID':
        return 'bg-blue-100 text-blue-800'
      case 'REFUNDED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'CARD':
      case 'VIPPS':
        return <CreditCard className="w-4 h-4" />
      case 'CASH':
        return <DollarSign className="w-4 h-4" />
      case 'INVOICE':
        return <FileText className="w-4 h-4" />
      default:
        return <DollarSign className="w-4 h-4" />
    }
  }

  // Chart colors
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  // Export functionality
  const exportToCSV = () => {
    const headers = ['Date', 'Patient', 'Type', 'Amount', 'Insurance', 'Payment Method', 'Status', 'Invoice Number']
    const rows = transactions.map(t => [
      new Date(t.created_at).toISOString().split('T')[0],
      t.patient_name || 'Unknown',
      t.transaction_type || '',
      t.patient_amount || 0,
      t.insurance_amount || 0,
      t.payment_method || '',
      t.payment_status || '',
      t.invoice_number || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell =>
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `financial-export-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setShowExportMenu(false)
  }

  const exportToExcel = () => {
    // Excel XML format (simple version)
    const headers = ['Date', 'Patient', 'Type', 'Amount', 'Insurance', 'Payment Method', 'Status', 'Invoice Number']
    const rows = transactions.map(t => [
      new Date(t.created_at).toISOString().split('T')[0],
      t.patient_name || 'Unknown',
      t.transaction_type || '',
      t.patient_amount || 0,
      t.insurance_amount || 0,
      t.payment_method || '',
      t.payment_status || '',
      t.invoice_number || ''
    ])

    let xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Financial Report">
    <Table>
      <Row>${headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>
      ${rows.map(row => `<Row>${row.map((cell, i) =>
        `<Cell><Data ss:Type="${i === 3 || i === 4 ? 'Number' : 'String'}">${cell}</Data></Cell>`
      ).join('')}</Row>`).join('\n      ')}
    </Table>
  </Worksheet>
</Workbook>`

    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `financial-export-${new Date().toISOString().split('T')[0]}.xls`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setShowExportMenu(false)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('financialTracking')}</h1>
          <p className="text-gray-600 mt-1">{t('billingPaymentsRevenue')}</p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download size={20} />
              {t('export')}
              <ChevronDown size={16} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={exportToCSV}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                >
                  Export as CSV
                </button>
                <button
                  onClick={exportToExcel}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg"
                >
                  Export as Excel
                </button>
              </div>
            )}
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={20} />
            {t('newTransaction')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('totalRevenue')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary.totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('paid')}</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(summary.totalPaid)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('pending')}</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {formatCurrency(summary.totalPending)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('outstanding')}</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(summary.totalOutstanding)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t('dailyRevenue')}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('no-NO', { month: 'short', day: 'numeric' })} />
              <YAxis tickFormatter={(value) => `${value.toLocaleString()} kr`} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(date) => formatDate(date)}
              />
              <Bar dataKey="revenue" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t('paymentMethods')}</h2>
          {paymentMethods.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              {t('noPaymentData')}
            </div>
          )}
        </div>
      </div>

      {/* Outstanding Invoices Alert */}
      {outstanding.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-yellow-900">
                {outstanding.length} {outstanding.length !== 1 ? t('invoices') : t('invoice')}
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                {t('totalOutstanding')}: {formatCurrency(outstanding.reduce((sum, inv) => sum + parseFloat(inv.patient_amount || 0), 0))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold">{t('filters')}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('startDate')}</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('endDate')}</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('paymentStatus')}</label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('allStatuses')}</option>
              <option value="PAID">{t('paid')}</option>
              <option value="PENDING">{t('pending')}</option>
              <option value="PARTIALLY_PAID">{t('partiallyPaidStatus')}</option>
              <option value="REFUNDED">{t('refunded')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('transactionType')}</label>
            <select
              value={filters.transactionType}
              onChange={(e) => handleFilterChange('transactionType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('allTypes')}</option>
              <option value="VISIT_FEE">{t('visitFee')}</option>
              <option value="PACKAGE_PURCHASE">{t('packagePurchase')}</option>
              <option value="PRODUCT_SALE">{t('productSale')}</option>
              <option value="REFUND">{t('refundType')}</option>
              <option value="ADJUSTMENT">{t('adjustment')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('searchPatient')}</label>
            <input
              type="text"
              value={filters.patientSearch}
              onChange={(e) => handleFilterChange('patientSearch', e.target.value)}
              placeholder={t('searchByName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{t('transactions')}</h2>
          <p className="text-sm text-gray-600">{pagination.total} {t('transactions').toLowerCase()}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50">
            <p className="text-gray-600">{t('noTransactions')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('date')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('patient')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('type')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('amount')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('payment')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('invoice')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.patient_name || t('unknownPatient')}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {transaction.patient_id?.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.transaction_type?.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.patient_amount)}
                        </div>
                        {transaction.insurance_amount > 0 && (
                          <div className="text-xs text-gray-500">
                            {t('insurance')}: {formatCurrency(transaction.insurance_amount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          {getPaymentMethodIcon(transaction.payment_method)}
                          {transaction.payment_method || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.payment_status)}`}>
                          {transaction.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.invoice_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedInvoiceTransaction(transaction)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                            title={t('generateInvoicePdf')}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {transaction.payment_status === 'PENDING' && (
                            <button
                              onClick={() => updatePaymentMutation.mutate({
                                id: transaction.id,
                                status: 'PAID'
                              })}
                              disabled={updatePaymentMutation.isPending}
                              className="text-green-600 hover:text-green-900 font-medium disabled:opacity-50"
                            >
                              {t('markPaid')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {t('showing')
                    .replace('{from}', ((filters.page - 1) * filters.limit) + 1)
                    .replace('{to}', Math.min(filters.page * filters.limit, pagination.total))
                    .replace('{total}', pagination.total)}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={filters.page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {t('previous')}
                  </button>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={filters.page === pagination.pages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {t('next')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Transaction Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">{t('createNewTransaction')}</h3>
            <p className="text-gray-600 mb-4">{t('transactionFormComingSoon')}</p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {/* Invoice Generation Modal */}
      {selectedInvoiceTransaction && (
        <InvoiceModal
          transaction={selectedInvoiceTransaction}
          onClose={() => setSelectedInvoiceTransaction(null)}
        />
      )}
    </div>
  )
}
