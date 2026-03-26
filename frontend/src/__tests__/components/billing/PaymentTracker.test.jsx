/**
 * PaymentTracker Component Tests
 *
 * Tests payment recording modal: amount input, payment methods,
 * validation, mutation callbacks, and full-payment shortcut.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key, fb) => fb || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

vi.mock('../../../services/api', () => ({
  billingAPI: {
    recordPayment: vi.fn(),
  },
}));

vi.mock('../../../utils/logger', () => ({
  default: { error: vi.fn(), scope: () => ({ error: vi.fn() }) },
}));

vi.mock('lucide-react', () => ({
  CreditCard: () => <span>CreditCard</span>,
  Banknote: () => <span>Banknote</span>,
  Smartphone: () => <span>Smartphone</span>,
  Building2: () => <span>Building2</span>,
  X: () => <span>X</span>,
  Check: () => <span>Check</span>,
  AlertCircle: () => <span>AlertCircle</span>,
  Loader2: () => <span>Loader2</span>,
  Calendar: () => <span>Calendar</span>,
  Receipt: () => <span>Receipt</span>,
}));

import PaymentTracker from '../../../components/billing/PaymentTracker';
import { billingAPI } from '../../../services/api';

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const mockInvoice = {
  id: 'inv-1',
  invoice_number: 'F-2026-001',
  patient_name: 'Ola Nordmann',
  amount_due: 450,
  amount_paid: 0,
};

const renderWithProviders = (props = {}) => {
  const queryClient = createQueryClient();
  const defaultProps = {
    invoice: mockInvoice,
    onClose: vi.fn(),
    onPaymentRecorded: vi.fn(),
  };
  return render(
    <QueryClientProvider client={queryClient}>
      <PaymentTracker {...defaultProps} {...props} />
    </QueryClientProvider>
  );
};

describe('PaymentTracker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    billingAPI.recordPayment.mockResolvedValue({
      data: { id: 'pmt-1', amount: 450 },
    });
  });

  it('should render the record payment heading', () => {
    renderWithProviders();
    // 'Registrer betaling' appears in both h2 heading and submit button
    const headings = screen.getAllByText('Registrer betaling');
    expect(headings.length).toBeGreaterThanOrEqual(1);
    expect(headings[0]).toBeInTheDocument();
  });

  it('should display the invoice number in the header', () => {
    renderWithProviders();
    expect(screen.getByText(/F-2026-001/)).toBeInTheDocument();
  });

  it('should display patient name', () => {
    renderWithProviders();
    expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
  });

  it('should pre-fill amount field with invoice amount_due', () => {
    renderWithProviders();
    const amountInput = screen.getByPlaceholderText('0');
    expect(amountInput.value).toBe('450');
  });

  it('should render all four payment method buttons', () => {
    renderWithProviders();
    expect(screen.getByText('card')).toBeInTheDocument();
    expect(screen.getByText('cash')).toBeInTheDocument();
    expect(screen.getByText('vipps')).toBeInTheDocument();
    expect(screen.getByText('bankTransfer')).toBeInTheDocument();
  });

  it('should update amount to full due when full-amount button clicked', () => {
    renderWithProviders();
    const amountInput = screen.getByPlaceholderText('0');
    fireEvent.change(amountInput, { target: { value: '200' } });
    expect(amountInput.value).toBe('200');

    fireEvent.click(screen.getByText('Fullt beløp'));
    expect(amountInput.value).toBe('450');
  });

  const getSubmitBtn = () =>
    screen
      .getAllByRole('button')
      .find(
        (b) =>
          b.textContent.includes('Registrer betaling') &&
          b.tagName === 'BUTTON' &&
          b.className.includes('bg-green-600')
      );

  it('should show validation error when amount is zero', async () => {
    renderWithProviders();
    const amountInput = screen.getByPlaceholderText('0');
    fireEvent.change(amountInput, { target: { value: '0' } });
    fireEvent.click(getSubmitBtn());
    await waitFor(() => {
      expect(screen.getByText('Angi et gyldig beløp')).toBeInTheDocument();
    });
  });

  it('should show validation error when amount exceeds amount_due', async () => {
    renderWithProviders();
    const amountInput = screen.getByPlaceholderText('0');
    fireEvent.change(amountInput, { target: { value: '9999' } });
    fireEvent.click(getSubmitBtn());
    await waitFor(() => {
      expect(screen.getByText('Beløpet kan ikke overstige utestående beløp')).toBeInTheDocument();
    });
  });

  it('should call onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    renderWithProviders({ onClose });
    fireEvent.click(screen.getByText('Avbryt'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should return null when invoice prop is not provided', () => {
    const { container } = renderWithProviders({ invoice: null });
    expect(container.firstChild).toBeNull();
  });

  it('should show already-paid amount when amount_paid > 0', () => {
    renderWithProviders({
      invoice: { ...mockInvoice, amount_paid: 100 },
    });
    expect(screen.getByText(/Allerede betalt/)).toBeInTheDocument();
  });
});
