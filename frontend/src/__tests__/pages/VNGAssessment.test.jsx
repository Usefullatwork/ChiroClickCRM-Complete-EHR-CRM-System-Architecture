import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock react-router-dom params
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ patientId: 'patient-1' }),
    useNavigate: () => mockNavigate,
  };
});

// Mock i18n
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

// Mock toast
vi.mock('../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), promise: vi.fn() },
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    scope: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Mock API services
const mockGetById = vi.fn().mockResolvedValue({
  id: 'patient-1',
  first_name: 'Ola',
  last_name: 'Nordmann',
  date_of_birth: '1985-05-15',
});
const mockVestibularCreate = vi.fn().mockResolvedValue({ data: { id: 'vng-1' } });

vi.mock('../../services/api', () => ({
  patientsAPI: {
    getById: (...args) => mockGetById(...args),
  },
  vestibularAPI: {
    create: (...args) => mockVestibularCreate(...args),
  },
}));

// Mock VNGModule component
vi.mock('../../components/assessment/VNGModule', () => ({
  default: ({ data, onChange, language, patientId }) => (
    <div data-testid="vng-module">
      <span data-testid="vng-language">{language}</span>
      <span data-testid="vng-patient-id">{patientId}</span>
      <button data-testid="vng-change" onClick={() => onChange({ ...data, modified: true })}>
        Modify Data
      </button>
    </div>
  ),
  getDefaultVNGData: () => ({
    spontaneousNystagmus: { present: false, direction: '', notes: '' },
    gazeLight: { center: 'normal', left: 'normal', right: 'normal', up: 'normal', down: 'normal' },
    gazeDark: { center: 'normal', left: 'normal', right: 'normal', up: 'normal', down: 'normal' },
    positional: { headRight: 'normal', headLeft: 'normal', bow: 'normal', lean: 'normal' },
  }),
}));

import VNGAssessment from '../../pages/VNGAssessment';
import toast from '../../utils/toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderWithProviders = (ui) => {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('VNGAssessment Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetById.mockResolvedValue({
      id: 'patient-1',
      first_name: 'Ola',
      last_name: 'Nordmann',
      date_of_birth: '1985-05-15',
    });
  });

  it('should render without crashing', async () => {
    renderWithProviders(<VNGAssessment />);

    await waitFor(() => {
      expect(screen.getByText('vngAssessment')).toBeInTheDocument();
    });
  });

  it('should render the header with assessment title', async () => {
    renderWithProviders(<VNGAssessment />);

    await waitFor(() => {
      expect(screen.getByText('vngAssessment')).toBeInTheDocument();
    });
  });

  it('should display patient name after loading', async () => {
    renderWithProviders(<VNGAssessment />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
  });

  it('should show loading indicator while patient data is fetching', async () => {
    mockGetById.mockReturnValue(new Promise(() => {})); // Never resolves

    renderWithProviders(<VNGAssessment />);

    await waitFor(() => {
      expect(screen.getByText('loading')).toBeInTheDocument();
    });
  });

  it('should render the VNG module with correct props', async () => {
    renderWithProviders(<VNGAssessment />);

    await waitFor(() => {
      expect(screen.getByTestId('vng-module')).toBeInTheDocument();
      expect(screen.getByTestId('vng-patient-id')).toHaveTextContent('patient-1');
    });
  });

  it('should render save and print buttons', async () => {
    renderWithProviders(<VNGAssessment />);

    await waitFor(() => {
      expect(screen.getByText('save')).toBeInTheDocument();
      expect(screen.getByText('print')).toBeInTheDocument();
    });
  });

  it('should render language toggle with Norsk and English buttons', async () => {
    renderWithProviders(<VNGAssessment />);

    await waitFor(() => {
      expect(screen.getByText('Norsk')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });
  });

  it('should call vestibularAPI.create when save is clicked', async () => {
    renderWithProviders(<VNGAssessment />);

    await waitFor(() => {
      expect(screen.getByText('save')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('save').closest('button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockVestibularCreate).toHaveBeenCalledWith({
        patient_id: 'patient-1',
        assessment_data: expect.objectContaining({
          spontaneousNystagmus: expect.any(Object),
          gazeLight: expect.any(Object),
        }),
      });
    });
  });

  it('should show success toast after successful save', async () => {
    renderWithProviders(<VNGAssessment />);

    await waitFor(() => {
      expect(screen.getByText('save')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('save').closest('button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('vngSaved');
    });
  });

  it('should show error toast on save failure', async () => {
    mockVestibularCreate.mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<VNGAssessment />);

    await waitFor(() => {
      expect(screen.getByText('save')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('save').closest('button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('vngSaveError');
    });
  });

  it('should disable save button while saving is in progress', async () => {
    mockVestibularCreate.mockReturnValue(new Promise(() => {})); // Never resolves

    renderWithProviders(<VNGAssessment />);

    await waitFor(() => {
      expect(screen.getByText('save')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('save').closest('button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('saving')).toBeInTheDocument();
      expect(screen.getByText('saving').closest('button')).toBeDisabled();
    });
  });

  it('should render back navigation button', async () => {
    renderWithProviders(<VNGAssessment />);

    const backButtons = screen.getAllByRole('button');
    // First button is the back/arrow-left button
    expect(backButtons.length).toBeGreaterThan(0);
  });
});
