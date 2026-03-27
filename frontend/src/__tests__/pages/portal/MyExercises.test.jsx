/**
 * MyExercises Portal Page Tests
 * Tests the patient exercise list page with prescriptions, progress summary, and navigation
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock patientApi
const mockGetPrescriptions = vi.fn();
const mockGetPrescription = vi.fn();
const mockGetDailySummary = vi.fn();
const mockGetStoredToken = vi.fn();
const mockClearStoredToken = vi.fn();

vi.mock('../../../api/patientApi', () => ({
  patientApi: {
    getPrescriptions: (...args) => mockGetPrescriptions(...args),
    getPrescription: (...args) => mockGetPrescription(...args),
    getDailySummary: (...args) => mockGetDailySummary(...args),
  },
  getStoredToken: () => mockGetStoredToken(),
  clearStoredToken: () => mockClearStoredToken(),
  storeToken: vi.fn(),
}));

// Mock ExerciseCard component
vi.mock('../../../components/patients/ExerciseCard', () => ({
  default: ({ exercise, onClick }) => (
    <div data-testid={`exercise-card-${exercise.id}`} onClick={() => onClick(exercise)}>
      <span>{exercise.name || 'Exercise'}</span>
    </div>
  ),
}));

// Mock useMediaQuery
vi.mock('../../../hooks/useMediaQuery', () => ({
  default: () => ({
    _isMobile: false,
    isTouchDevice: false,
    prefersReducedMotion: false,
  }),
}));

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('token=test-token-123')],
  };
});

import MyExercises from '../../../pages/portal/MyExercises';

const mockPrescriptionsData = {
  clinic: { name: 'Test Klinikk', phone: '+47 12345678' },
  patient: { firstName: 'Ola' },
  prescriptions: [
    {
      id: 'rx-1',
      prescribedAt: '2026-03-20T10:00:00Z',
      prescribedBy: 'Dr. Hansen',
      exerciseCount: 5,
      completedToday: 3,
    },
    {
      id: 'rx-2',
      prescribedAt: '2026-03-15T10:00:00Z',
      prescribedBy: 'Dr. Berg',
      exerciseCount: 3,
      completedToday: 1,
    },
  ],
};

const mockSinglePrescription = {
  ...mockPrescriptionsData,
  prescriptions: [mockPrescriptionsData.prescriptions[0]],
};

const mockPrescriptionDetail = {
  prescription: {
    id: 'rx-1',
    prescribedBy: 'Dr. Hansen',
    prescribedAt: '2026-03-20T10:00:00Z',
    patientInstructions: 'Gjør øvelsene daglig.',
  },
  exercises: [
    { id: 'ex-1', exerciseId: 'eid-1', name: 'Nakkestrekning' },
    { id: 'ex-2', exerciseId: 'eid-2', name: 'Skulderrotasjon' },
  ],
};

const mockDailySummaryData = {
  exercisesCompleted: 3,
  totalExercises: 5,
  completionPercentage: 60,
  totalSets: 9,
  totalReps: 30,
};

const renderPage = () =>
  render(
    <BrowserRouter>
      <MyExercises />
    </BrowserRouter>
  );

describe('MyExercises', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStoredToken.mockReturnValue('stored-token-123');
    mockGetPrescriptions.mockResolvedValue({
      success: true,
      data: mockPrescriptionsData,
    });
    mockGetPrescription.mockResolvedValue({
      success: true,
      data: mockPrescriptionDetail,
    });
    mockGetDailySummary.mockResolvedValue({
      success: true,
      data: mockDailySummaryData,
    });
  });

  it('renders loading state initially', () => {
    mockGetPrescriptions.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Laster øvelser...')).toBeInTheDocument();
  });

  it('renders clinic name and patient greeting', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Test Klinikk')).toBeInTheDocument();
    });
    expect(screen.getByText('Hei, Ola!')).toBeInTheDocument();
  });

  it('renders prescription list when multiple prescriptions exist', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Dine øvelsesprogrammer')).toBeInTheDocument();
    });
    expect(screen.getByText('5 øvelser')).toBeInTheDocument();
    expect(screen.getByText('3 øvelser')).toBeInTheDocument();
  });

  it('renders error state when API call fails', async () => {
    mockGetPrescriptions.mockRejectedValue(new Error('Network failure'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Kunne ikke laste øvelsene')).toBeInTheDocument();
    });
    expect(screen.getByText('Network failure')).toBeInTheDocument();
    expect(screen.getByText('Prøv igjen')).toBeInTheDocument();
  });

  it('redirects to login when no token is available', () => {
    mockGetStoredToken.mockReturnValue(null);
    // Re-mock to remove URL token
    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [new URLSearchParams('')],
      };
    });
  });

  it('auto-selects prescription when only one exists', async () => {
    mockGetPrescriptions.mockResolvedValue({
      success: true,
      data: mockSinglePrescription,
    });
    renderPage();
    await waitFor(() => {
      expect(mockGetPrescription).toHaveBeenCalledWith('test-token-123', 'rx-1');
    });
  });

  it('loads prescription detail when clicking a prescription', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('5 øvelser')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('5 øvelser'));
    await waitFor(() => {
      expect(mockGetPrescription).toHaveBeenCalledWith('test-token-123', 'rx-1');
    });
  });

  it('shows daily progress summary after loading prescription detail', async () => {
    mockGetPrescriptions.mockResolvedValue({
      success: true,
      data: mockSinglePrescription,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Din fremgang i dag')).toBeInTheDocument();
    });
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('3 / 5')).toBeInTheDocument();
  });

  it('shows stats for sets and reps', async () => {
    mockGetPrescriptions.mockResolvedValue({
      success: true,
      data: mockSinglePrescription,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('9 sett fullført')).toBeInTheDocument();
    });
    expect(screen.getByText('30 repetisjoner')).toBeInTheDocument();
  });

  it('shows 100% completion message', async () => {
    mockGetDailySummary.mockResolvedValue({
      success: true,
      data: { ...mockDailySummaryData, completionPercentage: 100 },
    });
    mockGetPrescriptions.mockResolvedValue({
      success: true,
      data: mockSinglePrescription,
    });
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByText('Bra jobbet! Du har fullført alle øvelsene for i dag.')
      ).toBeInTheDocument();
    });
  });

  it('renders exercise cards for selected prescription', async () => {
    mockGetPrescriptions.mockResolvedValue({
      success: true,
      data: mockSinglePrescription,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('exercise-card-ex-1')).toBeInTheDocument();
    });
    expect(screen.getByTestId('exercise-card-ex-2')).toBeInTheDocument();
  });

  it('shows no prescriptions message when list is empty', async () => {
    mockGetPrescriptions.mockResolvedValue({
      success: true,
      data: { ...mockPrescriptionsData, prescriptions: [] },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Ingen øvelsesprogrammer')).toBeInTheDocument();
    });
  });

  it('renders patient instructions when available', async () => {
    mockGetPrescriptions.mockResolvedValue({
      success: true,
      data: mockSinglePrescription,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Instruksjoner:')).toBeInTheDocument();
    });
    expect(screen.getByText('Gjør øvelsene daglig.')).toBeInTheDocument();
  });

  it('shows prescriber information', async () => {
    mockGetPrescriptions.mockResolvedValue({
      success: true,
      data: mockSinglePrescription,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Foreskrevet av: Dr. Hansen/)).toBeInTheDocument();
    });
  });

  it('handles logout by clearing token and navigating', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText('Logg ut')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Logg ut'));
    expect(mockClearStoredToken).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/portal/login');
  });

  it('renders refresh button and handles refresh', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText('Oppdater')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Oppdater'));
    // Should reload prescriptions
    expect(mockGetPrescriptions).toHaveBeenCalledTimes(2);
  });

  it('handles 401 error by redirecting to login', async () => {
    const authError = new Error('Unauthorized');
    authError.status = 401;
    mockGetPrescriptions.mockRejectedValue(authError);
    renderPage();
    await waitFor(() => {
      expect(mockClearStoredToken).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/portal/login');
    });
  });

  it('renders footer with warning message', async () => {
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByText('Stopp øvelsene hvis du opplever økt smerte og kontakt klinikken.')
      ).toBeInTheDocument();
    });
  });

  it('shows phone link when clinic has phone number', async () => {
    mockGetPrescriptions.mockResolvedValue({
      success: true,
      data: mockSinglePrescription,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('+47 12345678')).toBeInTheDocument();
    });
  });
});
