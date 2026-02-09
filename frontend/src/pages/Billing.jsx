/**
 * Billing Page
 * Fakturering og betalingsadministrasjon for norsk helsevesen
 *
 * Comprehensive billing and payment management for Norwegian
 * chiropractic clinics with takst codes and HELFO integration
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  MoreVertical,
  Eye,
  Printer,
  BarChart3,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { billingAPI } from '../services/api';
import toast from '../utils/toast';
import logger from '../utils/logger';
import InvoiceList from '../components/billing/InvoiceList';
import InvoiceGenerator from '../components/billing/InvoiceGenerator';
import InvoicePreview from '../components/billing/InvoicePreview';
import TakstCodes from '../components/billing/TakstCodes';
import PaymentTracker from '../components/billing/PaymentTracker';

/**
 * Billing Component
 * Hovedkomponent for fakturering og betalingsoversikt
 *
 * @returns {JSX.Element} Billing management page
 */
export default function Billing() {
  const navigate = useNavigate();

  // State for tabs and modals
  const [activeTab, setActiveTab] = useState('invoices');
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [showPaymentTracker, setShowPaymentTracker] = useState(false);
  const [takstCodesReadOnly, setTakstCodesReadOnly] = useState([]);

  // Fetch statistics
  const {
    data: statistics,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['invoice-statistics'],
    queryFn: async () => {
      const response = await billingAPI.getStatistics();
      return response.data;
    },
  });

  /**
   * Handle creating new invoice
   * Handterer opprettelse av ny faktura
   */
  const handleCreateInvoice = () => {
    setShowInvoiceGenerator(true);
  };

  /**
   * Handle viewing invoice details
   * Handterer visning av fakturadetaljer
   */
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoicePreview(true);
  };

  /**
   * Handle recording payment
   * Handterer registrering av betaling
   */
  const handleRecordPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentTracker(true);
  };

  /**
   * Handle invoice created
   */
  const handleInvoiceCreated = (invoice) => {
    refetchStats();
    setShowInvoiceGenerator(false);
    // Show the new invoice
    setSelectedInvoice(invoice);
    setShowInvoicePreview(true);
  };

  /**
   * Handle payment recorded
   */
  const handlePaymentRecorded = () => {
    refetchStats();
    setShowPaymentTracker(false);
    setSelectedInvoice(null);
  };

  /**
   * Handle export
   */
  const handleExport = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const response = await billingAPI.getHelfoReport({
        start_date: startOfMonth,
        end_date: endOfMonth,
      });

      // Create CSV from report data
      const invoices = response.data.invoices || [];
      const csvContent = [
        ['Fakturanummer', 'Dato', 'Pasient', 'HELFO-refusjon'].join(';'),
        ...invoices.map((inv) =>
          [
            inv.invoice_number,
            new Date(inv.invoice_date).toLocaleDateString('no-NO'),
            inv.patient_name,
            inv.helfo_refund,
          ].join(';')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `helfo-rapport-${startOfMonth}.csv`;
      link.click();
    } catch (error) {
      logger.error('Export failed:', error);
      toast.error('Kunne ikke eksportere rapport');
    }
  };

  /**
   * Format currency in NOK
   * Formaterer belop i NOK
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const stats = statistics || {
    total_outstanding: 0,
    total_paid: 0,
    overdue_count: 0,
    total_invoices: 0,
    pending_count: 0,
    draft_count: 0,
    total_helfo_refund: 0,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header / Overskrift */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fakturering</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administrer fakturaer, takstkoder og betalinger
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchStats()}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Oppdater statistikk"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            HELFO-rapport
          </button>
          <button
            onClick={handleCreateInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ny faktura
          </button>
        </div>
      </div>

      {/* Statistics Cards / Statistikkort */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Utstaende</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {statsLoading ? '...' : formatCurrency(stats.total_outstanding)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.pending_count || 0} ventende fakturaer
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Betalt totalt</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {statsLoading ? '...' : formatCurrency(stats.total_paid)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.paid_count || 0} betalte fakturaer
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Forfalt</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {statsLoading ? '...' : stats.overdue_count || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(stats.total_overdue)} utstaende
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">HELFO-refusjon</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {statsLoading ? '...' : formatCurrency(stats.total_helfo_refund)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.total_invoices || 0} totalt fakturaer
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Faner */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'invoices'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Fakturaer
          </button>
          <button
            onClick={() => setActiveTab('takst')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'takst'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Takstkoder
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Rapporter
          </button>
        </nav>
      </div>

      {/* Invoices Tab / Faktura-fane */}
      {activeTab === 'invoices' && (
        <InvoiceList onViewInvoice={handleViewInvoice} onRecordPayment={handleRecordPayment} />
      )}

      {/* Takst Codes Tab / Takstkoder-fane */}
      {activeTab === 'takst' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Norske takstkoder for kiropraktorer
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Oversikt over gjeldende takstkoder med HELFO-refusjon og egenandeler
            </p>
          </div>
          <TakstCodes
            selectedCodes={takstCodesReadOnly}
            onCodesChange={setTakstCodesReadOnly}
            readOnly={false}
          />
        </div>
      )}

      {/* Reports Tab / Rapporter-fane */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Okonomiske rapporter</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* HELFO Report Card */}
              <div
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={handleExport}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">HELFO-rapport</h4>
                    <p className="text-sm text-gray-500">Manedlig refusjonsrapport</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Eksporter oversikt over HELFO-refusjoner for innevarende maned.
                </p>
              </div>

              {/* Outstanding Report Card */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Utstaende fordringer</h4>
                    <p className="text-sm text-gray-500">Ubetalte fakturaer</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Oversikt over alle utstaende og forfalte fakturaer.
                </p>
              </div>

              {/* Revenue Report Card */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Inntektsrapport</h4>
                    <p className="text-sm text-gray-500">Periodens inntekter</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Detaljert oversikt over inntekter fordelt pa takstkoder.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistikk oversikt</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Totalt fakturert</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">
                  {formatCurrency((stats.total_paid || 0) + (stats.total_outstanding || 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gjennomsnittlig faktura</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(
                    stats.total_invoices > 0
                      ? ((stats.total_paid || 0) + (stats.total_outstanding || 0)) /
                          stats.total_invoices
                      : 0
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Betalingsgrad</p>
                <p className="text-xl font-semibold text-green-600 mt-1">
                  {stats.total_invoices > 0
                    ? Math.round(((stats.paid_count || 0) / stats.total_invoices) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Utkast</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">{stats.draft_count || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Generator Modal */}
      {showInvoiceGenerator && (
        <InvoiceGenerator
          onClose={() => setShowInvoiceGenerator(false)}
          onInvoiceCreated={handleInvoiceCreated}
        />
      )}

      {/* Invoice Preview Modal */}
      {showInvoicePreview && selectedInvoice && (
        <InvoicePreview
          invoiceId={selectedInvoice.id}
          onClose={() => {
            setShowInvoicePreview(false);
            setSelectedInvoice(null);
          }}
          onRecordPayment={handleRecordPayment}
        />
      )}

      {/* Payment Tracker Modal */}
      {showPaymentTracker && selectedInvoice && (
        <PaymentTracker
          invoice={selectedInvoice}
          onClose={() => {
            setShowPaymentTracker(false);
            setSelectedInvoice(null);
          }}
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}
    </div>
  );
}
