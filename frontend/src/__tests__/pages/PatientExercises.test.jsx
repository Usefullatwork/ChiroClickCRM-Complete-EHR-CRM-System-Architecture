/**
 * PatientExercises Page Tests
 * Tests for the patient exercise programs overview page
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// ============================================================================
// MOCKS — must be declared before any import that uses them
// ============================================================================

const mockNavigate = vi.fn();
let mockPatientId = 'patient-1';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ patientId: mockPatientId }),
  };
});

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

vi.mock('../../services/api', () => ({
  exercisesAPI: {
    getPatientExercises: vi.fn(),
  },
}));

// ============================================================================
// IMPORTS — after mocks
// ============================================================================

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PatientExercises from '../../pages/PatientExercises';
import { exercisesAPI } from '../../services/api';

// ============================================================================
// TEST DATA
// ============================================================================

const mockPrograms = [
  {
    id: 'prog-1',
    name: 'Rygg rehabilitering',
    description: 'Rehabiliteringsprogram for korsrygg',
    status: 'active',
    category: 'rehabilitation',
    exerciseCount: 5,
  },
  {
    id: 'prog-2',
    name: 'Skulder styrke',
    description: 'Styrketrening for skulder',
    status: 'completed',
    category: 'strengthening',
    exerciseCount: 8,
  },
  {
    id: 'prog-3',
    name: 'Nakke mobilitet',
    description: 'Mobilitetsovelser for nakke',
    status: 'active',
    category: 'mobility',
    exerciseCount: 4,
  },
  {
    id: 'prog-4',
    name: 'Svimmelhet vestibular',
    description: 'Vestibular trening',
    status: 'paused',
    category: 'vestibular',
    exerciseCount: 6,
  },
];

// ============================================================================
// HELPERS
// ============================================================================

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
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

// ============================================================================
// TESTS
// ============================================================================

describe('PatientExercises', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPatientId = 'patient-1';
    exercisesAPI.getPatientExercises.mockResolvedValue({ data: { data: mockPrograms } });
  });

  it('renders without crashing and shows page title', async () => {
    renderWithProviders(<PatientExercises />);
    await waitFor(() => {
      expect(screen.getByText('Treningsprogram')).toBeInTheDocument();
    });
  });

  it('shows the page description text', async () => {
    renderWithProviders(<PatientExercises />);
    await waitFor(() => {
      expect(
        screen.getByText('Administrer pasientens treningsprogram og øvelser')
      ).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching exercises', () => {
    exercisesAPI.getPatientExercises.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<PatientExercises />);
    expect(screen.getByText('Laster treningsprogrammer...')).toBeInTheDocument();
  });

  it('renders exercise program list after loading', async () => {
    renderWithProviders(<PatientExercises />);
    await waitFor(() => {
      expect(screen.getByText('Rygg rehabilitering')).toBeInTheDocument();
      expect(screen.getByText('Skulder styrke')).toBeInTheDocument();
      expect(screen.getByText('Nakke mobilitet')).toBeInTheDocument();
      expect(screen.getByText('Svimmelhet vestibular')).toBeInTheDocument();
    });
  });

  it('displays exercise count for each program', async () => {
    renderWithProviders(<PatientExercises />);
    await waitFor(() => {
      expect(screen.getByText('Rygg rehabilitering')).toBeInTheDocument();
    });
    // Each program shows "N øvelser"
    const exerciseLabels = screen.getAllByText(/øvelser/);
    expect(exerciseLabels.length).toBeGreaterThanOrEqual(4);
  });

  it('shows empty state when no exercise programs exist', async () => {
    exercisesAPI.getPatientExercises.mockResolvedValue({ data: { data: [] } });
    renderWithProviders(<PatientExercises />);
    await waitFor(() => {
      expect(screen.getByText('Ingen treningsprogrammer')).toBeInTheDocument();
      expect(
        screen.getByText('Opprett et nytt treningsprogram for denne pasienten')
      ).toBeInTheDocument();
    });
  });

  it('shows create button in empty state', async () => {
    exercisesAPI.getPatientExercises.mockResolvedValue({ data: { data: [] } });
    renderWithProviders(<PatientExercises />);
    await waitFor(() => {
      expect(screen.getByText('Opprett treningsprogram')).toBeInTheDocument();
    });
  });

  it('navigates to new prescription page when header create button is clicked', async () => {
    renderWithProviders(<PatientExercises />);
    await waitFor(() => {
      expect(screen.getByText('Ny forskrivning')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Ny forskrivning'));
    expect(mockNavigate).toHaveBeenCalledWith('/patients/patient-1/exercises/new');
  });

  it('navigates to new prescription page from empty state create button', async () => {
    exercisesAPI.getPatientExercises.mockResolvedValue({ data: { data: [] } });
    renderWithProviders(<PatientExercises />);
    await waitFor(() => {
      expect(screen.getByText('Opprett treningsprogram')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Opprett treningsprogram'));
    expect(mockNavigate).toHaveBeenCalledWith('/patients/patient-1/exercises/new');
  });

  it('navigates to exercise detail when a program is clicked', async () => {
    renderWithProviders(<PatientExercises />);
    await waitFor(() => {
      expect(screen.getByText('Rygg rehabilitering')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Rygg rehabilitering'));
    expect(mockNavigate).toHaveBeenCalledWith('/exercises/prog-1');
  });

  it('renders search input with correct placeholder', async () => {
    renderWithProviders(<PatientExercises />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Søk etter øvelser...')).toBeInTheDocument();
    });
  });

  it('filters programs by search term', async () => {
    renderWithProviders(<PatientExercises />);
    await waitFor(() => {
      expect(screen.getByText('Rygg rehabilitering')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Søk etter øvelser...');
    fireEvent.change(searchInput, { target: { value: 'Skulder' } });

    await waitFor(() => {
      expect(screen.getByText('Skulder styrke')).toBeInTheDocument();
      expect(screen.queryByText('Rygg rehabilitering')).not.toBeInTheDocument();
      expect(screen.queryByText('Nakke mobilitet')).not.toBeInTheDocument();
    });
  });

  it('filters programs by status', async () => {
    renderWithProviders(<PatientExercises />);
    await waitFor(() => {
      expect(screen.getByText('Rygg rehabilitering')).toBeInTheDocument();
    });

    const statusSelect = screen.getByDisplayValue('Alle statuser');
    fireEvent.change(statusSelect, { target: { value: 'completed' } });

    await waitFor(() => {
      expect(screen.getByText('Skulder styrke')).toBeInTheDocument();
      expect(screen.queryByText('Rygg rehabilitering')).not.toBeInTheDocument();
      expect(screen.queryByText('Nakke mobilitet')).not.toBeInTheDocument();
    });
  });

  it('filters programs by category', async () => {
    renderWithProviders(<PatientExercises />);
    await waitFor(() => {
      expect(screen.getByText('Rygg rehabilitering')).toBeInTheDocument();
    });

    const categorySelect = screen.getByDisplayValue('Alle kategorier');
    fireEvent.change(categorySelect, { target: { value: 'mobility' } });

    await waitFor(() => {
      expect(screen.getByText('Nakke mobilitet')).toBeInTheDocument();
      expect(screen.queryByText('Rygg rehabilitering')).not.toBeInTheDocument();
      expect(screen.queryByText('Skulder styrke')).not.toBeInTheDocument();
    });
  });

  it('shows status filter options', async () => {
    renderWithProviders(<PatientExercises />);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Alle statuser')).toBeInTheDocument();
    });
    expect(screen.getByText('Alle statuser')).toBeInTheDocument();
    expect(screen.getByText('Aktive')).toBeInTheDocument();
    expect(screen.getByText('Fullført')).toBeInTheDocument();
    expect(screen.getByText('Pauset')).toBeInTheDocument();
  });

  it('shows category filter options', async () => {
    renderWithProviders(<PatientExercises />);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Alle kategorier')).toBeInTheDocument();
    });
    expect(screen.getByText('Alle kategorier')).toBeInTheDocument();
    expect(screen.getByText('Rehabilitering')).toBeInTheDocument();
    expect(screen.getByText('Styrketrening')).toBeInTheDocument();
    expect(screen.getByText('Mobilitet')).toBeInTheDocument();
    expect(screen.getByText('Vestibular')).toBeInTheDocument();
  });

  it('does not fetch exercises when patientId is missing', () => {
    mockPatientId = null;
    renderWithProviders(<PatientExercises />);
    expect(exercisesAPI.getPatientExercises).not.toHaveBeenCalled();
  });

  it('shows empty results after filtering yields no matches', async () => {
    renderWithProviders(<PatientExercises />);
    await waitFor(() => {
      expect(screen.getByText('Rygg rehabilitering')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Søk etter øvelser...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent program xyz' } });

    await waitFor(() => {
      expect(screen.getByText('Ingen treningsprogrammer')).toBeInTheDocument();
    });
  });
});
