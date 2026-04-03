import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../services/api', () => ({
  pdfAPI: {
    generateInvoice: vi.fn().mockResolvedValue({ data: { html: '<p>Invoice</p>' } }),
  },
}));

vi.mock('../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    scope: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
  },
}));

vi.mock(
  'lucide-react',
  () => new Proxy({}, { get: (_, name) => (props) => <span data-testid={`icon-${name}`} /> })
);

import InvoiceModal from '../../components/InvoiceModal';

const mockTransaction = {
  id: 'tx-1',
  patient_name: 'Ola Nordmann',
  invoice_number: 'INV-001',
  created_at: '2025-06-15T10:00:00Z',
  gross_amount: 850,
  patient_amount: 400,
  payment_status: 'PENDING',
};

function renderWithQuery(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('InvoiceModal', () => {
  it('renders the modal with transaction details', () => {
    renderWithQuery(<InvoiceModal transaction={mockTransaction} onClose={vi.fn()} />);
    expect(screen.getByText('Invoice')).toBeInTheDocument();
    expect(screen.getByText(/Ola Nordmann/)).toBeInTheDocument();
    expect(screen.getByText(/INV-001/)).toBeInTheDocument();
  });

  it('displays transaction amount details', () => {
    renderWithQuery(<InvoiceModal transaction={mockTransaction} onClose={vi.fn()} />);
    expect(screen.getByText('850 kr')).toBeInTheDocument();
    expect(screen.getByText('400 kr')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('renders generate button before generation', () => {
    renderWithQuery(<InvoiceModal transaction={mockTransaction} onClose={vi.fn()} />);
    expect(screen.getByText('Generate Invoice PDF')).toBeInTheDocument();
  });

  it('has a close button with aria-label', () => {
    renderWithQuery(<InvoiceModal transaction={mockTransaction} onClose={vi.fn()} />);
    expect(screen.getByLabelText('Lukk')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderWithQuery(<InvoiceModal transaction={mockTransaction} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Lukk'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders dialog with proper accessibility', () => {
    renderWithQuery(<InvoiceModal transaction={mockTransaction} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders Close button in footer', () => {
    renderWithQuery(<InvoiceModal transaction={mockTransaction} onClose={vi.fn()} />);
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});
