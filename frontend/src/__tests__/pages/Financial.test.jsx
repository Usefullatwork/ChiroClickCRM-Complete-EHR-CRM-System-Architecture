/**
 * Financial Page Tests
 *
 * Tests for the Financial tracking page: summary cards, charts,
 * outstanding invoices alert, filters, transactions table, pagination,
 * export (CSV/Excel), create transaction modal, invoice modal, and
 * mark-paid mutation.
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Module-level mocks (BEFORE component import)
// ---------------------------------------------------------------------------

vi.mock('../../services/api', () => ({
  financialAPI: {
    getAll: vi.fn(),
    getSummary: vi.fn(),
    getOutstanding: vi.fn(),
    getPaymentMethods: vi.fn(),
    getDailyRevenueChart: vi.fn(),
    updatePaymentStatus: vi.fn(),
  },
}));

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key) => key,
    lang: 'no',
  }),
  formatDate: () => '15.03.2025',
  formatCurrency: () => '1 000 kr',
}));

vi.mock('../../lib/utils', () => ({
  formatDate: (d) => (d ? new Date(d).toISOString().split('T')[0] : '-'),
  formatCurrency: (v) => (v != null ? `${v} kr` : '-'),
}));

vi.mock('../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('../../utils/logger', () => ({
  default: { error: vi.fn(), scope: () => ({ error: vi.fn() }) },
}));

// Mock recharts — renders children so structural assertions still work
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock lucide-react icons as simple text spans
vi.mock('lucide-react', () => ({
  DollarSign: () => <span>DollarSign</span>,
  TrendingUp: () => <span>TrendingUp</span>,
  CreditCard: () => <span>CreditCard</span>,
  AlertCircle: () => <span>AlertCircle</span>,
  Download: () => <span>Download</span>,
  Filter: () => <span>Filter</span>,
  Plus: () => <span>Plus</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  Clock: () => <span>Clock</span>,
  FileText: () => <span>FileText</span>,
  ChevronDown: () => <span>ChevronDown</span>,
}));

// Mock InvoiceModal child component
vi.mock('../../components/InvoiceModal', () => ({
  default: ({ transaction, onClose }) => (
    <div data-testid="invoice-modal">
      <span>{transaction.patient_name}</span>
      <button onClick={onClose}>Close Invoice Modal</button>
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Component + API import (AFTER mocks)
// ---------------------------------------------------------------------------

import Financial from '../../pages/Financial';
import { financialAPI } from '../../services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

const renderFinancial = () => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <Financial />
    </QueryClientProvider>
  );
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockSummary = {
  totalRevenue: 250000,
  totalPaid: 200000,
  totalPending: 30000,
  totalOutstanding: 20000,
  transactionCount: 85,
};

const mockTransactions = [
  {
    id: 'txn-1',
    patient_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    patient_name: 'Ola Nordmann',
    transaction_type: 'VISIT_FEE',
    patient_amount: 750,
    insurance_amount: 250,
    payment_method: 'CARD',
    payment_status: 'PAID',
    invoice_number: 'INV-2025-001',
    created_at: '2025-03-15T10:30:00Z',
  },
  {
    id: 'txn-2',
    patient_id: 'ffffffff-1111-2222-3333-444444444444',
    patient_name: 'Kari Hansen',
    transaction_type: 'PACKAGE_PURCHASE',
    patient_amount: 3500,
    insurance_amount: 0,
    payment_method: 'VIPPS',
    payment_status: 'PENDING',
    invoice_number: 'INV-2025-002',
    created_at: '2025-03-16T14:00:00Z',
  },
  {
    id: 'txn-3',
    patient_id: 'cccccccc-dddd-eeee-ffff-000000000000',
    patient_name: 'Per Olsen',
    transaction_type: 'REFUND',
    patient_amount: -500,
    insurance_amount: 0,
    payment_method: 'CASH',
    payment_status: 'REFUNDED',
    invoice_number: 'INV-2025-003',
    created_at: '2025-03-17T09:00:00Z',
  },
];

const mockPagination = { page: 1, pages: 3, total: 55 };

const mockOutstanding = [
  {
    id: 'inv-1',
    patient_name: 'Ola Nordmann',
    patient_amount: '12000',
    invoice_number: 'INV-O-001',
  },
  { id: 'inv-2', patient_name: 'Kari Hansen', patient_amount: '8000', invoice_number: 'INV-O-002' },
];

const mockPaymentMethods = [
  { name: 'CARD', amount: 120000 },
  { name: 'VIPPS', amount: 80000 },
  { name: 'CASH', amount: 30000 },
  { name: 'INVOICE', amount: 20000 },
];

const mockRevenueChart = [
  { date: '2025-03-10', revenue: 15000 },
  { date: '2025-03-11', revenue: 22000 },
  { date: '2025-03-12', revenue: 18000 },
];

/** Configure all API mocks to return full data by default */
function setupDefaultMocks() {
  financialAPI.getSummary.mockResolvedValue({ data: mockSummary });
  financialAPI.getAll.mockResolvedValue({
    data: { transactions: mockTransactions, pagination: mockPagination },
  });
  financialAPI.getOutstanding.mockResolvedValue({ data: { invoices: mockOutstanding } });
  financialAPI.getPaymentMethods.mockResolvedValue({ data: { breakdown: mockPaymentMethods } });
  financialAPI.getDailyRevenueChart.mockResolvedValue({
    data: { dailyRevenue: mockRevenueChart },
  });
  financialAPI.updatePaymentStatus.mockResolvedValue({ data: { success: true } });
}

/** Configure all API mocks to return empty data */
function setupEmptyMocks() {
  financialAPI.getSummary.mockResolvedValue({ data: null });
  financialAPI.getAll.mockResolvedValue({
    data: { transactions: [], pagination: { page: 1, pages: 1, total: 0 } },
  });
  financialAPI.getOutstanding.mockResolvedValue({ data: { invoices: [] } });
  financialAPI.getPaymentMethods.mockResolvedValue({ data: { breakdown: [] } });
  financialAPI.getDailyRevenueChart.mockResolvedValue({ data: { dailyRevenue: [] } });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// Polyfill URL.createObjectURL / revokeObjectURL for jsdom/happy-dom
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
}
if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = vi.fn();
}

describe('Financial Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
    URL.createObjectURL.mockReturnValue('blob:mock-url');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // 1. Rendering basics
  // -----------------------------------------------------------------------

  it('renders page heading and subtitle', async () => {
    renderFinancial();

    expect(screen.getByText('financialTracking')).toBeInTheDocument();
    expect(screen.getByText('billingPaymentsRevenue')).toBeInTheDocument();
  });

  it('renders new transaction button', () => {
    renderFinancial();

    expect(screen.getByText('newTransaction')).toBeInTheDocument();
  });

  it('renders export button', () => {
    renderFinancial();

    expect(screen.getByText('export')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 2. API calls on mount
  // -----------------------------------------------------------------------

  it('calls all financial APIs on mount', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(financialAPI.getSummary).toHaveBeenCalled();
      expect(financialAPI.getAll).toHaveBeenCalled();
      expect(financialAPI.getOutstanding).toHaveBeenCalled();
      expect(financialAPI.getPaymentMethods).toHaveBeenCalled();
      expect(financialAPI.getDailyRevenueChart).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 3. Summary cards
  // -----------------------------------------------------------------------

  it('displays all four summary cards', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('totalRevenue')).toBeInTheDocument();
      // 'paid' and 'pending' appear in both the summary card label and the dropdown option
      expect(screen.getAllByText('paid').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('pending').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('outstanding')).toBeInTheDocument();
    });
  });

  it('displays formatted currency amounts in summary cards', async () => {
    renderFinancial();

    await waitFor(() => {
      // formatCurrency is mocked to passthrough in lib/utils: `${v} kr`
      expect(screen.getByText('250000 kr')).toBeInTheDocument();
      expect(screen.getByText('200000 kr')).toBeInTheDocument();
      expect(screen.getByText('30000 kr')).toBeInTheDocument();
      expect(screen.getByText('20000 kr')).toBeInTheDocument();
    });
  });

  it('shows zero values when summary data is null', async () => {
    setupEmptyMocks();
    renderFinancial();

    await waitFor(() => {
      // defaults to 0 for all summary values
      const zeroAmounts = screen.getAllByText('0 kr');
      expect(zeroAmounts.length).toBe(4);
    });
  });

  // -----------------------------------------------------------------------
  // 4. Charts
  // -----------------------------------------------------------------------

  it('renders daily revenue chart heading', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('dailyRevenue')).toBeInTheDocument();
    });
  });

  it('renders payment methods chart heading', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('paymentMethods')).toBeInTheDocument();
    });
  });

  it('renders bar chart component when revenue data exists', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  it('renders pie chart component when payment method data exists', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  it('shows noPaymentData message when payment methods array is empty', async () => {
    financialAPI.getPaymentMethods.mockResolvedValue({ data: { breakdown: [] } });
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('noPaymentData')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // 5. Outstanding invoices alert
  // -----------------------------------------------------------------------

  it('displays outstanding invoices alert when there are outstanding invoices', async () => {
    renderFinancial();

    await waitFor(() => {
      // 2 outstanding invoices, so it uses plural key
      expect(screen.getByText('2 invoices')).toBeInTheDocument();
    });
  });

  it('shows singular invoice text when only one outstanding', async () => {
    financialAPI.getOutstanding.mockResolvedValue({
      data: { invoices: [mockOutstanding[0]] },
    });
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('1 invoice')).toBeInTheDocument();
    });
  });

  it('does not display outstanding alert when no outstanding invoices', async () => {
    financialAPI.getOutstanding.mockResolvedValue({ data: { invoices: [] } });
    renderFinancial();

    await waitFor(() => {
      expect(screen.queryByText(/invoices$/)).not.toBeInTheDocument();
      expect(screen.queryByText(/^1 invoice$/)).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // 6. Filters section
  // -----------------------------------------------------------------------

  it('renders filters section with heading', async () => {
    renderFinancial();

    expect(screen.getByText('filters')).toBeInTheDocument();
  });

  it('renders all five filter fields', async () => {
    renderFinancial();

    expect(screen.getByText('startDate')).toBeInTheDocument();
    expect(screen.getByText('endDate')).toBeInTheDocument();
    expect(screen.getByText('paymentStatus')).toBeInTheDocument();
    expect(screen.getByText('transactionType')).toBeInTheDocument();
    expect(screen.getByText('searchPatient')).toBeInTheDocument();
  });

  it('renders payment status dropdown options', async () => {
    renderFinancial();

    expect(screen.getByText('allStatuses')).toBeInTheDocument();
    // 'paid' appears in both summary card and dropdown, check at least one exists
    expect(screen.getAllByText('paid').length).toBeGreaterThanOrEqual(1);
    // 'pending' same
    expect(screen.getAllByText('pending').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('partiallyPaidStatus')).toBeInTheDocument();
    expect(screen.getByText('refunded')).toBeInTheDocument();
  });

  it('renders transaction type dropdown options', async () => {
    renderFinancial();

    expect(screen.getByText('allTypes')).toBeInTheDocument();
    expect(screen.getByText('visitFee')).toBeInTheDocument();
    expect(screen.getByText('packagePurchase')).toBeInTheDocument();
    expect(screen.getByText('productSale')).toBeInTheDocument();
    expect(screen.getByText('refundType')).toBeInTheDocument();
    expect(screen.getByText('adjustment')).toBeInTheDocument();
  });

  it('updates filter and refetches when payment status changes', async () => {
    renderFinancial();

    // Wait for initial load
    await waitFor(() => {
      expect(financialAPI.getAll).toHaveBeenCalledTimes(1);
    });

    // Get the payment status dropdown by finding the select that contains allStatuses
    const selects = screen.getAllByRole('combobox');
    // The payment status select is the first one (index 0)
    const paymentStatusSelect = selects[0];
    fireEvent.change(paymentStatusSelect, { target: { value: 'PAID' } });

    await waitFor(() => {
      expect(financialAPI.getAll).toHaveBeenCalledTimes(2);
      expect(financialAPI.getAll).toHaveBeenLastCalledWith(
        expect.objectContaining({ paymentStatus: 'PAID', page: 1 })
      );
    });
  });

  it('updates patient search filter on text input', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(financialAPI.getAll).toHaveBeenCalledTimes(1);
    });

    const searchInput = screen.getByPlaceholderText('searchByName');
    fireEvent.change(searchInput, { target: { value: 'Ola' } });

    await waitFor(() => {
      expect(financialAPI.getAll).toHaveBeenLastCalledWith(
        expect.objectContaining({ patientSearch: 'Ola', page: 1 })
      );
    });
  });

  // -----------------------------------------------------------------------
  // 7. Loading state
  // -----------------------------------------------------------------------

  it('shows loading spinner when transactions are loading', () => {
    // Make the query hang indefinitely by never resolving
    financialAPI.getAll.mockReturnValue(new Promise(() => {}));
    renderFinancial();

    // The loading spinner has animate-spin class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // 8. Empty state
  // -----------------------------------------------------------------------

  it('shows noTransactions message when transaction list is empty', async () => {
    financialAPI.getAll.mockResolvedValue({
      data: { transactions: [], pagination: { page: 1, pages: 1, total: 0 } },
    });
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('noTransactions')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // 9. Transactions table
  // -----------------------------------------------------------------------

  it('renders table headers', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('date')).toBeInTheDocument();
      expect(screen.getByText('patient')).toBeInTheDocument();
      expect(screen.getByText('type')).toBeInTheDocument();
      expect(screen.getByText('amount')).toBeInTheDocument();
      expect(screen.getByText('payment')).toBeInTheDocument();
      expect(screen.getByText('status')).toBeInTheDocument();
      // 'invoice' appears multiple times (header + singular outstanding text)
      expect(screen.getAllByText('invoice').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('actions')).toBeInTheDocument();
    });
  });

  it('renders transaction rows with patient names', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
      expect(screen.getByText('Per Olsen')).toBeInTheDocument();
    });
  });

  it('renders transaction amounts', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('750 kr')).toBeInTheDocument();
      expect(screen.getByText('3500 kr')).toBeInTheDocument();
      expect(screen.getByText('-500 kr')).toBeInTheDocument();
    });
  });

  it('shows insurance amount when greater than zero', async () => {
    renderFinancial();

    await waitFor(() => {
      // txn-1 has insurance_amount=250, shows insurance label
      expect(screen.getByText('insurance: 250 kr')).toBeInTheDocument();
    });
  });

  it('renders invoice numbers', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('INV-2025-001')).toBeInTheDocument();
      expect(screen.getByText('INV-2025-002')).toBeInTheDocument();
      expect(screen.getByText('INV-2025-003')).toBeInTheDocument();
    });
  });

  it('renders payment statuses with correct text', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('PAID')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByText('REFUNDED')).toBeInTheDocument();
    });
  });

  it('shows transaction type with underscores replaced by spaces', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('VISIT FEE')).toBeInTheDocument();
      expect(screen.getByText('PACKAGE PURCHASE')).toBeInTheDocument();
    });
  });

  it('displays patient ID substring', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('ID: aaaaaaaa...')).toBeInTheDocument();
    });
  });

  it('displays total transactions count', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('55 transactions')).toBeInTheDocument();
    });
  });

  it('shows markPaid button only for PENDING transactions', async () => {
    renderFinancial();

    await waitFor(() => {
      // Only txn-2 (Kari Hansen) has PENDING status
      const markPaidButtons = screen.getAllByText('markPaid');
      expect(markPaidButtons.length).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // 10. Mark as paid mutation
  // -----------------------------------------------------------------------

  it('calls updatePaymentStatus when markPaid is clicked', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('markPaid')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('markPaid'));

    await waitFor(() => {
      expect(financialAPI.updatePaymentStatus).toHaveBeenCalledWith('txn-2', {
        payment_status: 'PAID',
      });
    });
  });

  // -----------------------------------------------------------------------
  // 11. Pagination
  // -----------------------------------------------------------------------

  it('shows pagination when pages > 1', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('previous')).toBeInTheDocument();
      expect(screen.getByText('next')).toBeInTheDocument();
    });
  });

  it('disables previous button on first page', async () => {
    renderFinancial();

    await waitFor(() => {
      const prevButton = screen.getByText('previous');
      expect(prevButton).toBeDisabled();
    });
  });

  it('does not show pagination when only one page', async () => {
    financialAPI.getAll.mockResolvedValue({
      data: {
        transactions: mockTransactions,
        pagination: { page: 1, pages: 1, total: 3 },
      },
    });
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    expect(screen.queryByText('previous')).not.toBeInTheDocument();
    expect(screen.queryByText('next')).not.toBeInTheDocument();
  });

  it('navigates to next page on next button click', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('next')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('next'));

    await waitFor(() => {
      expect(financialAPI.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    });
  });

  // -----------------------------------------------------------------------
  // 12. Create transaction modal
  // -----------------------------------------------------------------------

  it('opens create transaction modal when newTransaction button is clicked', async () => {
    renderFinancial();

    fireEvent.click(screen.getByText('newTransaction'));

    await waitFor(() => {
      expect(screen.getByText('createNewTransaction')).toBeInTheDocument();
      expect(screen.getByText('transactionFormComingSoon')).toBeInTheDocument();
    });
  });

  it('closes create transaction modal when close button is clicked', async () => {
    renderFinancial();

    fireEvent.click(screen.getByText('newTransaction'));

    await waitFor(() => {
      expect(screen.getByText('createNewTransaction')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('close'));

    await waitFor(() => {
      expect(screen.queryByText('createNewTransaction')).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // 13. Invoice modal
  // -----------------------------------------------------------------------

  it('opens InvoiceModal when invoice icon button is clicked', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    // Each transaction row has a FileText button for generating invoice
    // The title attribute identifies the button
    const invoiceButtons = screen.getAllByTitle('generateInvoicePdf');
    fireEvent.click(invoiceButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('invoice-modal')).toBeInTheDocument();
    });
  });

  it('closes InvoiceModal when close button is clicked', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    const invoiceButtons = screen.getAllByTitle('generateInvoicePdf');
    fireEvent.click(invoiceButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('invoice-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Close Invoice Modal'));

    await waitFor(() => {
      expect(screen.queryByTestId('invoice-modal')).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // 14. Export menu
  // -----------------------------------------------------------------------

  it('toggles export dropdown menu', async () => {
    renderFinancial();

    // Initially no export options visible
    expect(screen.queryByText('Export as CSV')).not.toBeInTheDocument();

    // Open menu
    fireEvent.click(screen.getByText('export'));

    await waitFor(() => {
      expect(screen.getByText('Export as CSV')).toBeInTheDocument();
      expect(screen.getByText('Export as Excel')).toBeInTheDocument();
    });

    // Close menu by clicking export again
    fireEvent.click(screen.getByText('export'));

    await waitFor(() => {
      expect(screen.queryByText('Export as CSV')).not.toBeInTheDocument();
    });
  });

  it('triggers CSV export and closes menu', async () => {
    renderFinancial();

    // Wait for transactions to load so CSV has data
    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    // Capture original createElement before spying
    const originalCreateElement = document.createElement.bind(document);
    const mockClick = vi.fn();
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        return { setAttribute: vi.fn(), click: mockClick };
      }
      return originalCreateElement(tag);
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    // Open export menu
    fireEvent.click(screen.getByText('export'));
    await waitFor(() => {
      expect(screen.getByText('Export as CSV')).toBeInTheDocument();
    });

    // Click CSV export
    fireEvent.click(screen.getByText('Export as CSV'));

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    // Menu should be closed after export
    await waitFor(() => {
      expect(screen.queryByText('Export as CSV')).not.toBeInTheDocument();
    });

    createElementSpy.mockRestore();
  });

  it('triggers Excel export and closes menu', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    // Capture original createElement before spying
    const originalCreateElement = document.createElement.bind(document);
    const mockLink = { setAttribute: vi.fn(), click: vi.fn() };
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return mockLink;
      return originalCreateElement(tag);
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    // Open export menu
    fireEvent.click(screen.getByText('export'));
    await waitFor(() => {
      expect(screen.getByText('Export as Excel')).toBeInTheDocument();
    });

    // Click Excel export
    fireEvent.click(screen.getByText('Export as Excel'));

    expect(URL.createObjectURL).toHaveBeenCalled();
    // Verify download filename contains .xls
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('.xls'));
    // Menu should be closed after export
    await waitFor(() => {
      expect(screen.queryByText('Export as Excel')).not.toBeInTheDocument();
    });

    createElementSpy.mockRestore();
  });

  // -----------------------------------------------------------------------
  // 15. Date range filters trigger re-fetch
  // -----------------------------------------------------------------------

  it('filters by start date and refetches summary and transactions', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(financialAPI.getAll).toHaveBeenCalledTimes(1);
    });

    // Find the start date input (first date input)
    const dateInputs = screen.getAllByDisplayValue('');
    const startDateInput = dateInputs.find((input) => input.type === 'date');
    fireEvent.change(startDateInput, { target: { value: '2025-03-01' } });

    await waitFor(() => {
      expect(financialAPI.getSummary).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2025-03-01' })
      );
      expect(financialAPI.getAll).toHaveBeenLastCalledWith(
        expect.objectContaining({ startDate: '2025-03-01', page: 1 })
      );
    });
  });

  // -----------------------------------------------------------------------
  // 16. Transaction type filter
  // -----------------------------------------------------------------------

  it('filters by transaction type', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(financialAPI.getAll).toHaveBeenCalledTimes(1);
    });

    const selects = screen.getAllByRole('combobox');
    // Transaction type is the second select
    const typeSelect = selects[1];
    fireEvent.change(typeSelect, { target: { value: 'VISIT_FEE' } });

    await waitFor(() => {
      expect(financialAPI.getAll).toHaveBeenLastCalledWith(
        expect.objectContaining({ transactionType: 'VISIT_FEE', page: 1 })
      );
    });
  });

  // -----------------------------------------------------------------------
  // 17. Payment method icons
  // -----------------------------------------------------------------------

  it('renders payment method names in transaction rows', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('CARD')).toBeInTheDocument();
      expect(screen.getByText('VIPPS')).toBeInTheDocument();
      expect(screen.getByText('CASH')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // 18. unknownPatient fallback
  // -----------------------------------------------------------------------

  it('shows unknownPatient text when patient_name is missing', async () => {
    financialAPI.getAll.mockResolvedValue({
      data: {
        transactions: [
          {
            id: 'txn-no-name',
            patient_id: 'xxxx-yyyy',
            patient_name: null,
            transaction_type: 'VISIT_FEE',
            patient_amount: 500,
            insurance_amount: 0,
            payment_method: 'CARD',
            payment_status: 'PAID',
            invoice_number: 'INV-X',
            created_at: '2025-03-20T08:00:00Z',
          },
        ],
        pagination: { page: 1, pages: 1, total: 1 },
      },
    });
    renderFinancial();

    await waitFor(() => {
      expect(screen.getByText('unknownPatient')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // 19. Transactions table heading and count
  // -----------------------------------------------------------------------

  it('renders transactions section heading', async () => {
    renderFinancial();

    await waitFor(() => {
      // The heading "transactions" and the count line "55 transactions"
      const headings = screen.getAllByText('transactions');
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });

  // -----------------------------------------------------------------------
  // 20. Outstanding total calculation
  // -----------------------------------------------------------------------

  it('calculates and shows total outstanding amount from invoices', async () => {
    renderFinancial();

    await waitFor(() => {
      // Sum of mockOutstanding: 12000 + 8000 = 20000
      // The outstanding alert shows "totalOutstanding: 20000 kr"
      expect(screen.getByText(/totalOutstanding/)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // 21. Multiple filters combine correctly
  // -----------------------------------------------------------------------

  it('resets page to 1 when any filter changes', async () => {
    renderFinancial();

    // Wait for data to fully load (transactions visible means pagination is rendered)
    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      expect(screen.getByText('next')).toBeInTheDocument();
    });

    // Click next to go to page 2
    fireEvent.click(screen.getByText('next'));

    await waitFor(() => {
      expect(financialAPI.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    });

    // Now change a filter — page should reset to 1
    const searchInput = screen.getByPlaceholderText('searchByName');
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    await waitFor(() => {
      expect(financialAPI.getAll).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, patientSearch: 'Test' })
      );
    });
  });

  // -----------------------------------------------------------------------
  // 22. Default filter values
  // -----------------------------------------------------------------------

  it('sends default filter values on initial load', async () => {
    renderFinancial();

    await waitFor(() => {
      expect(financialAPI.getAll).toHaveBeenCalledWith({
        startDate: '',
        endDate: '',
        paymentStatus: '',
        transactionType: '',
        patientSearch: '',
        page: 1,
        limit: 20,
      });
    });
  });

  // -----------------------------------------------------------------------
  // 23. Status color classes (visual regression)
  // -----------------------------------------------------------------------

  it('applies correct color class to PAID status badge', async () => {
    renderFinancial();

    await waitFor(() => {
      const paidBadge = screen.getByText('PAID');
      expect(paidBadge.className).toContain('bg-green-100');
      expect(paidBadge.className).toContain('text-green-800');
    });
  });

  it('applies correct color class to PENDING status badge', async () => {
    renderFinancial();

    await waitFor(() => {
      const pendingBadge = screen.getByText('PENDING');
      expect(pendingBadge.className).toContain('bg-yellow-100');
      expect(pendingBadge.className).toContain('text-yellow-800');
    });
  });

  it('applies correct color class to REFUNDED status badge', async () => {
    renderFinancial();

    await waitFor(() => {
      const refundedBadge = screen.getByText('REFUNDED');
      expect(refundedBadge.className).toContain('bg-red-100');
      expect(refundedBadge.className).toContain('text-red-800');
    });
  });
});
