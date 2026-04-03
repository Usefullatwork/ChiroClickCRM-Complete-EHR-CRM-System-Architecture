/**
 * InvoicePreview Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../services/api', () => ({
  billingAPI: {
    getInvoice: vi.fn().mockResolvedValue({
      data: {
        id: 1,
        invoice_number: 'FAK-2026-001',
        status: 'sent',
        organization_name: 'ChiroClick Klinikk',
        organization_postal_code: '0150',
        organization_city: 'Oslo',
        patient_first_name: 'Kari',
        patient_last_name: 'Nordmann',
        patient_postal_code: '0550',
        patient_city: 'Oslo',
        invoice_date: '2026-03-15',
        due_date: '2026-04-15',
        gross_amount: 1100,
        helfo_refund: 250,
        patient_amount: 850,
        amount_paid: 0,
        amount_due: 850,
        items: [
          {
            code: 'K1',
            name: 'Førstegangsundersøkelse',
            quantity: 1,
            unitPrice: 800,
            lineTotal: 800,
          },
          { code: 'K3a', name: 'Røntgen', quantity: 1, unitPrice: 300, lineTotal: 300 },
        ],
      },
    }),
    getInvoiceHTML: vi.fn().mockResolvedValue({ data: { html: '<html>Test</html>' } }),
    getInvoicePayments: vi.fn().mockResolvedValue({ data: [] }),
    finalizeInvoice: vi.fn().mockResolvedValue({}),
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

import InvoicePreview from '../../../components/billing/InvoicePreview';

function renderWithQuery(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('InvoicePreview', () => {
  const defaultProps = {
    invoiceId: '1',
    onClose: vi.fn(),
    onRecordPayment: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    renderWithQuery(<InvoicePreview {...defaultProps} />);
    expect(screen.getByText('Laster faktura...')).toBeInTheDocument();
  });

  it('renders invoice number after loading', async () => {
    renderWithQuery(<InvoicePreview {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/FAK-2026-001/)).toBeInTheDocument();
    });
  });

  it('renders organization name', async () => {
    renderWithQuery(<InvoicePreview {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('ChiroClick Klinikk')).toBeInTheDocument();
    });
  });

  it('renders patient name', async () => {
    renderWithQuery(<InvoicePreview {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Kari Nordmann')).toBeInTheDocument();
    });
  });

  it('renders line items with codes', async () => {
    renderWithQuery(<InvoicePreview {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('K1')).toBeInTheDocument();
      expect(screen.getByText('K3a')).toBeInTheDocument();
    });
  });

  it('renders HELFO refund label', async () => {
    renderWithQuery(<InvoicePreview {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('HELFO-refusjon:')).toBeInTheDocument();
    });
  });

  it('renders Lukk button', async () => {
    renderWithQuery(<InvoicePreview {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getAllByText('Lukk').length).toBeGreaterThan(0);
    });
  });

  it('renders Skriv ut button', async () => {
    renderWithQuery(<InvoicePreview {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Skriv ut')).toBeInTheDocument();
    });
  });
});
