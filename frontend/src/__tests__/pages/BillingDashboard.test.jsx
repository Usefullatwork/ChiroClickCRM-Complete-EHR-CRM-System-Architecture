/**
 * Billing Page (BillingDashboard) Tests
 *
 * Tests invoice list, statistics, filters, tabs, and export
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../../services/api', () => ({
  billingAPI: {
    getStatistics: vi.fn(),
    getHelfoReport: vi.fn(),
  },
}));

vi.mock('../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('../../utils/logger', () => ({
  default: { scope: () => ({ error: vi.fn() }), error: vi.fn() },
}));

// Mock child billing components
vi.mock('../../components/billing/InvoiceList', () => ({
  default: () => <div data-testid="invoice-list">Invoice List</div>,
}));

vi.mock('../../components/billing/InvoiceGenerator', () => ({
  default: ({ onClose }) => (
    <div data-testid="invoice-generator">
      <button onClick={onClose}>Close Generator</button>
    </div>
  ),
}));

vi.mock('../../components/billing/InvoicePreview', () => ({
  default: () => <div data-testid="invoice-preview">Invoice Preview</div>,
}));

vi.mock('../../components/billing/TakstCodes', () => ({
  default: () => <div data-testid="takst-codes">Takst Codes</div>,
}));

vi.mock('../../components/billing/PaymentTracker', () => ({
  default: () => <div data-testid="payment-tracker">Payment Tracker</div>,
}));

vi.mock('lucide-react', () => ({
  Plus: () => <span>Plus</span>,
  Download: () => <span>Download</span>,
  Clock: () => <span>Clock</span>,
  AlertTriangle: () => <span>AlertTriangle</span>,
  FileText: () => <span>FileText</span>,
  TrendingUp: () => <span>TrendingUp</span>,
  BarChart3: () => <span>BarChart3</span>,
  RefreshCw: () => <span>RefreshCw</span>,
}));

import Billing from '../../pages/Billing';
import { billingAPI } from '../../services/api';

const mockStatistics = {
  total_outstanding: 25000,
  total_paid: 150000,
  overdue_count: 3,
  total_invoices: 45,
  pending_count: 8,
  draft_count: 2,
  total_helfo_refund: 80000,
  paid_count: 34,
  total_overdue: 15000,
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const renderWithProviders = (component) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Billing Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    billingAPI.getStatistics.mockResolvedValue({ data: mockStatistics });
  });

  it('should render billing page title', async () => {
    renderWithProviders(<Billing />);
    expect(screen.getByText('Fakturering')).toBeInTheDocument();
    expect(screen.getByText('Administrer fakturaer, takstkoder og betalinger')).toBeInTheDocument();
  });

  it('should display statistics cards', async () => {
    renderWithProviders(<Billing />);

    await waitFor(() => {
      expect(screen.getByText('Utstaende')).toBeInTheDocument();
      expect(screen.getByText('Betalt totalt')).toBeInTheDocument();
      expect(screen.getByText('Forfalt')).toBeInTheDocument();
      expect(screen.getByText('HELFO-refusjon')).toBeInTheDocument();
    });
  });

  it('should show tab navigation', () => {
    renderWithProviders(<Billing />);
    expect(screen.getByText('Fakturaer')).toBeInTheDocument();
    expect(screen.getByText('Takstkoder')).toBeInTheDocument();
    expect(screen.getByText('Rapporter')).toBeInTheDocument();
  });

  it('should render invoice list by default', () => {
    renderWithProviders(<Billing />);
    expect(screen.getByTestId('invoice-list')).toBeInTheDocument();
  });

  it('should switch to takst codes tab', async () => {
    renderWithProviders(<Billing />);
    fireEvent.click(screen.getByText('Takstkoder'));

    await waitFor(() => {
      expect(screen.getByText('Norske takstkoder for kiropraktorer')).toBeInTheDocument();
    });
  });

  it('should switch to reports tab', async () => {
    renderWithProviders(<Billing />);
    fireEvent.click(screen.getByText('Rapporter'));

    await waitFor(() => {
      expect(screen.getByText('Okonomiske rapporter')).toBeInTheDocument();
    });
  });

  it('should have Ny faktura button', () => {
    renderWithProviders(<Billing />);
    expect(screen.getByText('Ny faktura')).toBeInTheDocument();
  });

  it('should open invoice generator when Ny faktura is clicked', async () => {
    renderWithProviders(<Billing />);
    fireEvent.click(screen.getByText('Ny faktura'));

    await waitFor(() => {
      expect(screen.getByTestId('invoice-generator')).toBeInTheDocument();
    });
  });

  it('should have HELFO-rapport export button', () => {
    renderWithProviders(<Billing />);
    expect(screen.getByText('HELFO-rapport')).toBeInTheDocument();
  });

  it('should show report cards in reports tab', async () => {
    renderWithProviders(<Billing />);
    fireEvent.click(screen.getByText('Rapporter'));

    await waitFor(() => {
      // HELFO-rapport appears in both header and reports tab
      expect(screen.getAllByText('HELFO-rapport').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Utstaende fordringer')).toBeInTheDocument();
      expect(screen.getByText('Inntektsrapport')).toBeInTheDocument();
    });
  });
});
