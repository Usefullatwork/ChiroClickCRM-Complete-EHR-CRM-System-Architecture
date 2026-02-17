/**
 * InvoicePreview Component
 * Preview and print invoice with Norwegian formatting
 *
 * Displays invoice details with options to print PDF,
 * record payments, and manage invoice status
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  X,
  Printer,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  User,
  Building,
  Phone,
  Mail,
  Loader2,
  Ban,
  ExternalLink,
} from 'lucide-react';
import { billingAPI } from '../../services/api';

/**
 * Get status configuration
 */
const getStatusConfig = (status) => {
  const configs = {
    draft: { label: 'Utkast', color: 'bg-gray-100 text-gray-700', icon: FileText },
    pending: { label: 'Venter', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    sent: { label: 'Sendt', color: 'bg-blue-100 text-blue-800', icon: Send },
    paid: { label: 'Betalt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    partial: { label: 'Delvis betalt', color: 'bg-orange-100 text-orange-800', icon: CreditCard },
    overdue: { label: 'Forfalt', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    cancelled: { label: 'Kansellert', color: 'bg-gray-100 text-gray-500', icon: Ban },
    credited: { label: 'Kreditert', color: 'bg-purple-100 text-purple-800', icon: Ban },
  };
  return configs[status] || configs.pending;
};

/**
 * InvoicePreview Component
 * @param {Object} props
 * @param {string} props.invoiceId - Invoice ID to display
 * @param {Function} props.onClose - Callback when closing preview
 * @param {Function} props.onRecordPayment - Callback to open payment recording
 */
export default function InvoicePreview({ invoiceId, onClose, onRecordPayment }) {
  const queryClient = useQueryClient();
  const [showHTML, setShowHTML] = useState(false);

  // Fetch invoice details
  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const response = await billingAPI.getInvoice(invoiceId);
      return response.data;
    },
    enabled: !!invoiceId,
  });

  // Fetch invoice HTML for preview
  const { data: htmlData } = useQuery({
    queryKey: ['invoice-html', invoiceId],
    queryFn: async () => {
      const response = await billingAPI.getInvoiceHTML(invoiceId);
      return response.data;
    },
    enabled: showHTML && !!invoiceId,
  });

  // Fetch payments
  const { data: payments } = useQuery({
    queryKey: ['invoice-payments', invoiceId],
    queryFn: async () => {
      const response = await billingAPI.getInvoicePayments(invoiceId);
      return response.data;
    },
    enabled: !!invoiceId,
  });

  // Finalize mutation
  const finalizeMutation = useMutation({
    mutationFn: () => billingAPI.finalizeInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoice', invoiceId]);
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
   * Handle print
   */
  const handlePrint = async () => {
    try {
      const response = await billingAPI.getInvoiceHTML(invoiceId);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(response.data.html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    } catch (error) {
      console.error('Failed to print:', error);
    }
  };

  /**
   * Handle send invoice
   */
  const handleSend = async () => {
    try {
      await finalizeMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to send invoice:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span>Laster faktura...</span>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <p className="text-red-600 mb-4">Kunne ikke laste faktura</p>
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            Lukk
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(invoice.status);
  const StatusIcon = statusConfig.icon;
  const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items || [];
  const isOverdue =
    invoice.status !== 'paid' &&
    invoice.status !== 'cancelled' &&
    new Date(invoice.due_date) < new Date();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Faktura {invoice.invoice_number}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${statusConfig.color}`}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusConfig.label}
                </span>
                {isOverdue && invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                  <span className="text-xs text-red-600 font-medium">
                    {Math.ceil((new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24))}{' '}
                    dager forfalt
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From (Organization) */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-500 uppercase">Fra</span>
              </div>
              <p className="font-semibold text-gray-900">{invoice.organization_name}</p>
              {invoice.organization_address && (
                <p className="text-sm text-gray-600">{invoice.organization_address}</p>
              )}
              <p className="text-sm text-gray-600">
                {invoice.organization_postal_code} {invoice.organization_city}
              </p>
              {invoice.organization_org_number && (
                <p className="text-sm text-gray-600 mt-2">
                  Org.nr: {invoice.organization_org_number}
                </p>
              )}
              {invoice.organization_phone && (
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" /> {invoice.organization_phone}
                </p>
              )}
            </div>

            {/* To (Patient) */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-500 uppercase">Til</span>
              </div>
              <p className="font-semibold text-gray-900">
                {invoice.patient_first_name} {invoice.patient_last_name}
              </p>
              {invoice.patient_address && (
                <p className="text-sm text-gray-600">{invoice.patient_address}</p>
              )}
              <p className="text-sm text-gray-600">
                {invoice.patient_postal_code} {invoice.patient_city}
              </p>
              {invoice.patient_phone && (
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-2">
                  <Phone className="w-3 h-3" /> {invoice.patient_phone}
                </p>
              )}
              {invoice.patient_email && (
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {invoice.patient_email}
                </p>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Fakturadato</p>
              <p className="font-medium">{formatDate(invoice.invoice_date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Forfallsdato</p>
              <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                {formatDate(invoice.due_date)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Behandler</p>
              <p className="font-medium">{invoice.practitioner_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">HPR-nummer</p>
              <p className="font-medium">{invoice.practitioner_hpr || '-'}</p>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Takstkoder</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Takst
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Beskrivelse
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Antall
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Pris
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Belop
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-blue-600 font-medium">{item.code}</td>
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Brutto:</span>
                <span>{formatCurrency(invoice.gross_amount)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>HELFO-refusjon:</span>
                <span>- {formatCurrency(invoice.helfo_refund)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">A betale:</span>
                <span className="font-medium">{formatCurrency(invoice.patient_amount)}</span>
              </div>
              {invoice.amount_paid > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Innbetalt:</span>
                  <span>- {formatCurrency(invoice.amount_paid)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span>Utstaende:</span>
                <span className={invoice.amount_due > 0 ? 'text-blue-600' : 'text-green-600'}>
                  {formatCurrency(invoice.amount_due)}
                </span>
              </div>
            </div>
          </div>

          {/* Exemptions */}
          {(invoice.is_child || invoice.has_exemption) && (
            <div className="flex gap-2">
              {invoice.is_child && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  Barn under 16 ar
                </span>
              )}
              {invoice.has_exemption && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  Frikort
                </span>
              )}
            </div>
          )}

          {/* Payment History */}
          {payments && payments.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">
                Betalingshistorikk
              </h3>
              <div className="border border-gray-200 rounded-lg divide-y">
                {payments.map((payment, index) => (
                  <div key={index} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-gray-500">
                        {payment.payment_method === 'card' && 'Kort'}
                        {payment.payment_method === 'cash' && 'Kontant'}
                        {payment.payment_method === 'vipps' && 'Vipps'}
                        {payment.payment_method === 'bank_transfer' && 'Bankoverføring'}
                        {payment.payment_reference && ` - ${payment.payment_reference}`}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(payment.payment_date)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Merknad</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{invoice.notes}</p>
            </div>
          )}

          {/* HTML Preview Toggle */}
          <div>
            <button
              onClick={() => setShowHTML(!showHTML)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              {showHTML ? 'Skjul forhåndsvisning' : 'Vis utskriftsversjon'}
            </button>

            {showHTML && htmlData?.html && (
              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                <iframe
                  srcDoc={htmlData.html}
                  className="w-full h-[600px] bg-white"
                  title="Invoice Preview"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Lukk
          </button>

          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Skriv ut
            </button>

            {invoice.status === 'draft' && (
              <button
                onClick={handleSend}
                disabled={finalizeMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {finalizeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send faktura
              </button>
            )}

            {['pending', 'sent', 'partial', 'overdue'].includes(invoice.status) && (
              <button
                onClick={() => onRecordPayment && onRecordPayment(invoice)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Registrer betaling
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
