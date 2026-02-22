/**
 * InvoiceGenerator Component Tests
 *
 * Tests create invoice, patient selection, takst codes, totals, and validation
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
    calculateTotals: vi.fn(),
    createInvoice: vi.fn(),
    finalizeInvoice: vi.fn(),
  },
  patientsAPI: {
    getById: vi.fn(),
    search: vi.fn(),
  },
}));

vi.mock('../../utils/logger', () => ({
  default: { scope: () => ({ error: vi.fn() }), error: vi.fn() },
}));

vi.mock('../billing/TakstCodes', () => ({
  default: ({ selectedCodes, onCodesChange }) => (
    <div data-testid="takst-codes">
      <button onClick={() => onCodesChange([{ code: 'K1', quantity: 1 }])}>Add Code</button>
      <span>{selectedCodes.length} codes selected</span>
    </div>
  ),
}));

// Alternate mock path for TakstCodes (relative to InvoiceGenerator)
vi.mock('../../components/billing/TakstCodes', () => ({
  default: ({ selectedCodes, onCodesChange }) => (
    <div data-testid="takst-codes">
      <button onClick={() => onCodesChange([{ code: 'K1', quantity: 1 }])}>Add Code</button>
      <span>{selectedCodes.length} codes selected</span>
    </div>
  ),
}));

vi.mock('lucide-react', () => ({
  FileText: () => <span>FileText</span>,
  User: () => <span>User</span>,
  Save: () => <span>Save</span>,
  Send: () => <span>Send</span>,
  X: () => <span>X</span>,
  AlertCircle: () => <span>AlertCircle</span>,
  Check: () => <span>Check</span>,
  Loader2: () => <span>Loader2</span>,
  Search: () => <span>Search</span>,
}));

import InvoiceGenerator from '../../components/billing/InvoiceGenerator';
import { billingAPI, patientsAPI } from '../../services/api';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const renderWithProviders = (props = {}) => {
  const queryClient = createQueryClient();
  const defaultProps = {
    onClose: vi.fn(),
    onInvoiceCreated: vi.fn(),
  };
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <InvoiceGenerator {...defaultProps} {...props} />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('InvoiceGenerator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patientsAPI.getById.mockResolvedValue({
      data: {
        id: 'p1',
        first_name: 'Ola',
        last_name: 'Nordmann',
        date_of_birth: '1990-01-15',
        phone: '+4712345678',
      },
    });
    patientsAPI.search.mockResolvedValue({
      data: { patients: [] },
    });
    billingAPI.calculateTotals.mockResolvedValue({
      data: { totalGross: 500, totalHelfoRefund: 200, totalPatientShare: 300 },
    });
  });

  it('should render the invoice generator modal', () => {
    renderWithProviders();
    expect(screen.getByText('Ny faktura')).toBeInTheDocument();
    expect(screen.getByText('Opprett faktura med takstkoder')).toBeInTheDocument();
  });

  it('should show patient search when no patient is preselected', () => {
    renderWithProviders();
    expect(
      screen.getByPlaceholderText('Sok etter pasient (navn, telefon, eller fodselsnummer)...')
    ).toBeInTheDocument();
  });

  it('should show selected patient when patientId is provided', async () => {
    renderWithProviders({ patientId: 'p1' });

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
  });

  it('should render exemption checkboxes', () => {
    renderWithProviders();
    expect(screen.getByText('Barn under 16 ar (fritak for egenandel)')).toBeInTheDocument();
    expect(screen.getByText('Frikort (redusert egenandel)')).toBeInTheDocument();
  });

  it('should render due days selector', () => {
    renderWithProviders();
    expect(screen.getByText('Forfallsdager')).toBeInTheDocument();
    expect(screen.getByText('7 dager')).toBeInTheDocument();
    expect(screen.getByText('14 dager')).toBeInTheDocument();
    expect(screen.getByText('30 dager')).toBeInTheDocument();
  });

  it('should render notes textarea', () => {
    renderWithProviders();
    expect(screen.getByText('Merknad (valgfri)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Intern merknad...')).toBeInTheDocument();
  });

  it('should have Lagre som utkast and Opprett og send buttons', () => {
    renderWithProviders();
    expect(screen.getByText('Lagre som utkast')).toBeInTheDocument();
    expect(screen.getByText('Opprett og send')).toBeInTheDocument();
  });

  it('should have Avbryt (cancel) button', () => {
    renderWithProviders();
    expect(screen.getByText('Avbryt')).toBeInTheDocument();
  });

  it('should call onClose when Avbryt is clicked', () => {
    const onClose = vi.fn();
    renderWithProviders({ onClose });
    fireEvent.click(screen.getByText('Avbryt'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should show validation error when submitting without patient', async () => {
    renderWithProviders();
    fireEvent.click(screen.getByText('Lagre som utkast'));

    await waitFor(() => {
      expect(screen.getByText('Velg en pasient')).toBeInTheDocument();
    });
  });
});
