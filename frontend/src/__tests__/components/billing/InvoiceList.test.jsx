/**
 * InvoiceList Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

vi.mock('../../../services/api', () => ({
  billingAPI: {
    getInvoices: vi.fn().mockResolvedValue({
      data: {
        invoices: [
          {
            id: 1,
            invoice_number: 'FAK-2026-001',
            patient_name: 'Kari Nordmann',
            patient_amount: 850,
            amount_paid: 0,
            status: 'sent',
            invoice_date: '2026-03-15',
            due_date: '2026-04-15',
          },
          {
            id: 2,
            invoice_number: 'FAK-2026-002',
            patient_name: 'Per Hansen',
            patient_amount: 1200,
            amount_paid: 600,
            status: 'partial',
            invoice_date: '2026-03-10',
            due_date: '2026-04-10',
          },
        ],
        pagination: { page: 1, pages: 1, total: 2 },
      },
    }),
    finalizeInvoice: vi.fn().mockResolvedValue({}),
    cancelInvoice: vi.fn().mockResolvedValue({}),
    getInvoiceHTML: vi.fn().mockResolvedValue({ data: { html: '<html></html>' } }),
  },
}));

vi.mock('../../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    scope: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
  },
}));

vi.mock(
  'lucide-react',
  () =>
    new Proxy(
      {},
      {
        get: (_, name) => {
          if (name === '__esModule') return false;
          return (props) => null;
        },
      }
    )
);

import InvoiceList from '../../../components/billing/InvoiceList';

function renderWithQuery(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('InvoiceList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input', async () => {
    renderWithQuery(<InvoiceList />);
    expect(
      screen.getByPlaceholderText('Søk etter pasient eller fakturanummer...')
    ).toBeInTheDocument();
  });

  it('renders status filter dropdown', () => {
    renderWithQuery(<InvoiceList />);
    expect(screen.getByText('Alle statuser')).toBeInTheDocument();
  });

  it('renders column headers', async () => {
    renderWithQuery(<InvoiceList />);
    await waitFor(() => {
      expect(screen.getByText('Faktura')).toBeInTheDocument();
      expect(screen.getByText('Pasient')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('renders invoice data after loading', async () => {
    renderWithQuery(<InvoiceList />);
    await waitFor(() => {
      expect(screen.getByText('FAK-2026-001')).toBeInTheDocument();
      expect(screen.getByText('Kari Nordmann')).toBeInTheDocument();
    });
  });

  it('renders partial payment indicator', async () => {
    renderWithQuery(<InvoiceList />);
    await waitFor(() => {
      expect(screen.getByText('Per Hansen')).toBeInTheDocument();
    });
  });

  it('calls onViewInvoice when row is clicked', async () => {
    const onView = vi.fn();
    renderWithQuery(<InvoiceList onViewInvoice={onView} />);
    await waitFor(() => {
      expect(screen.getByText('FAK-2026-001')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('FAK-2026-001').closest('tr'));
    expect(onView).toHaveBeenCalled();
  });

  it('renders status filter options', () => {
    renderWithQuery(<InvoiceList />);
    const select = screen.getByText('Alle statuser').closest('select');
    expect(select).toBeInTheDocument();
  });
});
