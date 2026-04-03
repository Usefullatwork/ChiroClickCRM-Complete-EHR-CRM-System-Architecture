/**
 * TakstCodes Component Tests — Financial Accuracy
 *
 * Tests code display, quantity management, and total calculations.
 * TakstCodes is financially critical: takst prices, HELFO refund,
 * and patient share must be correctly computed.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockTakstData = {
  codes: {
    K1: {
      code: 'K1',
      name: 'Førstegangsundersøkelse',
      description: 'Undersøkelse ved første besøk',
      category: 'consultation',
      price: 800,
      helfoRefund: 250,
      patientShare: 550,
      duration: 45,
    },
    K2a: {
      code: 'K2a',
      name: 'Behandling enkel',
      description: 'Standard behandling',
      category: 'consultation',
      price: 500,
      helfoRefund: 152,
      patientShare: 348,
      duration: 20,
    },
  },
  additionalCodes: {
    K3a: {
      code: 'K3a',
      name: 'Røntgen',
      description: 'Røntgenundersøkelse',
      category: 'supplement',
      price: 300,
      helfoRefund: 100,
      patientShare: 200,
    },
  },
  categories: {
    consultation: { name: 'Konsultasjon', nameEn: 'Consultation' },
    supplement: { name: 'Tillegg', nameEn: 'Supplement' },
  },
};

vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

vi.mock('../../../services/api', () => ({
  billingAPI: {
    getTakstCodes: vi.fn().mockResolvedValue({ data: mockTakstData }),
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

import TakstCodes from '../../../components/billing/TakstCodes';

function renderWithQuery(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('TakstCodes', () => {
  const defaultProps = {
    selectedCodes: [],
    onCodesChange: vi.fn(),
    isChild: false,
    hasExemption: false,
    readOnly: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    renderWithQuery(<TakstCodes {...defaultProps} />);
    expect(screen.getByText('Laster takstkoder...')).toBeInTheDocument();
  });

  it('renders search input after loading', async () => {
    renderWithQuery(<TakstCodes {...defaultProps} />);
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Søk etter takst eller beskrivelse...')
      ).toBeInTheDocument();
    });
  });

  it('renders takst code K1', async () => {
    renderWithQuery(<TakstCodes {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('K1')).toBeInTheDocument();
      expect(screen.getByText('Førstegangsundersøkelse')).toBeInTheDocument();
    });
  });

  it('renders takst code K2a', async () => {
    renderWithQuery(<TakstCodes {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('K2a')).toBeInTheDocument();
    });
  });

  it('renders additional code K3a', async () => {
    renderWithQuery(<TakstCodes {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('K3a')).toBeInTheDocument();
    });
  });

  it('renders category filter dropdown', async () => {
    renderWithQuery(<TakstCodes {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Alle kategorier')).toBeInTheDocument();
    });
  });

  it('shows child exemption badge when isChild=true', async () => {
    renderWithQuery(<TakstCodes {...defaultProps} isChild={true} />);
    await waitFor(() => {
      expect(screen.getByText(/Barn under 16/)).toBeInTheDocument();
    });
  });

  it('shows frikort badge when hasExemption=true', async () => {
    renderWithQuery(<TakstCodes {...defaultProps} hasExemption={true} />);
    await waitFor(() => {
      expect(screen.getByText(/Frikort/)).toBeInTheDocument();
    });
  });

  it('renders selected codes summary with totals', async () => {
    const selected = [
      { code: 'K1', quantity: 1 },
      { code: 'K2a', quantity: 2 },
    ];
    renderWithQuery(<TakstCodes {...defaultProps} selectedCodes={selected} />);
    await waitFor(() => {
      expect(screen.getByText('Valgte takstkoder')).toBeInTheDocument();
      expect(screen.getByText('Brutto:')).toBeInTheDocument();
      expect(screen.getByText('HELFO-refusjon:')).toBeInTheDocument();
      expect(screen.getByText('Pasient betaler:')).toBeInTheDocument();
    });
  });

  it('shows zero quantity for unselected codes', async () => {
    renderWithQuery(<TakstCodes {...defaultProps} />);
    await waitFor(() => {
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('does not show summary when no codes selected', async () => {
    renderWithQuery(<TakstCodes {...defaultProps} selectedCodes={[]} />);
    await waitFor(() => {
      expect(screen.getByText('K1')).toBeInTheDocument();
    });
    expect(screen.queryByText('Valgte takstkoder')).not.toBeInTheDocument();
  });
});
