/**
 * InvoiceGenerator Component Tests (billing subdir)
 *
 * Tests invoice creation modal: patient selection, takst codes,
 * exemption options, validation, and action buttons.
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

vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key, fb) => fb || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

vi.mock('../../../services/api', () => ({
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

vi.mock('../../../utils/logger', () => ({
  default: { error: vi.fn(), scope: () => ({ error: vi.fn() }) },
}));

vi.mock('../../../components/billing/TakstCodes', () => ({
  default: ({ selectedCodes, onCodesChange }) => (
    <div data-testid="takst-codes">
      <button type="button" onClick={() => onCodesChange([{ code: 'K1', quantity: 1 }])}>
        Add Code
      </button>
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

import InvoiceGenerator from '../../../components/billing/InvoiceGenerator';
import { billingAPI, patientsAPI } from '../../../services/api';

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithProviders = (props = {}) => {
  const queryClient = createQueryClient();
  const defaultProps = { onClose: vi.fn(), onInvoiceCreated: vi.fn() };
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
    patientsAPI.search.mockResolvedValue({ data: { patients: [] } });
    billingAPI.calculateTotals.mockResolvedValue({
      data: { totalGross: 500, totalHelfoRefund: 200, totalPatientShare: 300 },
    });
    billingAPI.createInvoice.mockResolvedValue({
      data: { id: 'inv-1', invoice_number: 'F-2026-001' },
    });
  });

  it('should render the invoice generator modal heading', () => {
    renderWithProviders();
    expect(screen.getByText('Ny faktura')).toBeInTheDocument();
  });

  it('should show patient search field when no patient is preselected', () => {
    renderWithProviders();
    expect(
      screen.getByPlaceholderText('Søk etter pasient (navn, telefon, eller fødselsnummer)...')
    ).toBeInTheDocument();
  });

  it('should display selected patient when patientId prop is provided', async () => {
    renderWithProviders({ patientId: 'p1' });
    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
  });

  it('should render exemption checkboxes for child and frikort', () => {
    renderWithProviders();
    expect(screen.getByText('Barn under 16 år (fritak for egenandel)')).toBeInTheDocument();
    expect(screen.getByText('Frikort (redusert egenandel)')).toBeInTheDocument();
  });

  it('should render TakstCodes component', () => {
    renderWithProviders();
    expect(screen.getByTestId('takst-codes')).toBeInTheDocument();
  });

  it('should render due-days selector with options', () => {
    renderWithProviders();
    expect(screen.getByText('Forfallsdager')).toBeInTheDocument();
    expect(screen.getByText('14 dager')).toBeInTheDocument();
    expect(screen.getByText('30 dager')).toBeInTheDocument();
  });

  it('should show validation error when submitting without selecting a patient', async () => {
    renderWithProviders();
    fireEvent.click(screen.getByText('Lagre som utkast'));
    await waitFor(() => {
      expect(screen.getByText('Velg en pasient')).toBeInTheDocument();
    });
  });

  it('should show validation error when submitting without takst codes', async () => {
    renderWithProviders({ patientId: 'p1' });
    await waitFor(() => screen.getByText('Ola Nordmann'));
    fireEvent.click(screen.getByText('Lagre som utkast'));
    await waitFor(() => {
      expect(screen.getByText('Velg minst en takstkode')).toBeInTheDocument();
    });
  });

  it('should call onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    renderWithProviders({ onClose });
    fireEvent.click(screen.getByText('Avbryt'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render notes textarea', () => {
    renderWithProviders();
    expect(screen.getByPlaceholderText('Intern merknad...')).toBeInTheDocument();
  });
});
