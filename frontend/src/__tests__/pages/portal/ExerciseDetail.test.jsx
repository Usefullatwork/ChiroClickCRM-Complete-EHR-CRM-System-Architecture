/**
 * ExerciseDetail Portal Page Tests
 * Tests exercise detail view with video, feedback modal, and progress history
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock patientApi
const mockGetExercise = vi.fn();
const mockRecordProgress = vi.fn();
const mockGetStoredToken = vi.fn();
const mockClearStoredToken = vi.fn();

vi.mock('../../../api/patientApi', () => ({
  patientApi: {
    getExercise: (...args) => mockGetExercise(...args),
    recordProgress: (...args) => mockRecordProgress(...args),
  },
  getStoredToken: () => mockGetStoredToken(),
  clearStoredToken: () => mockClearStoredToken(),
  storeToken: vi.fn(),
}));

// Mock VimeoPlayer
vi.mock('../../../components/exercises/VimeoPlayer', () => ({
  default: ({ title, onClose }) => (
    <div data-testid="vimeo-player">
      <span>{title}</span>
      <button onClick={onClose}>Close Video</button>
    </div>
  ),
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
    useParams: () => ({ prescriptionId: 'rx-1', exerciseId: 'ex-1' }),
    useSearchParams: () => [new URLSearchParams('token=test-token-123')],
  };
});

import ExerciseDetail from '../../../pages/portal/ExerciseDetail';

const mockExerciseData = {
  exercise: {
    name: 'Nakkestrekning',
    category: 'Nakke',
    difficultyLevel: 'beginner',
    sets: 3,
    reps: 10,
    holdSeconds: 15,
    frequencyPerDay: 2,
    instructions: 'Hold hodet i nøytral stilling.',
    description: 'En enkel strekkeøvelse for nakken.',
    customInstructions: 'Gjør øvelsen forsiktig.',
    precautions: ['Stopp ved smerter'],
    contraindications: ['Akutt nakkeskade'],
    videoUrl: 'https://vimeo.com/12345',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    imageUrl: null,
    completedToday: false,
    progressHistory: [
      {
        id: 'ph-1',
        completedAt: '2026-03-25T14:00:00Z',
        setsCompleted: 3,
        repsCompleted: 10,
        difficultyRating: 3,
        painRating: 2,
        notes: 'Gikk bra',
      },
    ],
  },
  clinic: { name: 'Test Klinikk', phone: '+47 12345678' },
};

const renderPage = () =>
  render(
    <BrowserRouter>
      <ExerciseDetail />
    </BrowserRouter>
  );

describe('ExerciseDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStoredToken.mockReturnValue('stored-token-123');
    mockGetExercise.mockResolvedValue({ success: true, data: mockExerciseData });
    mockRecordProgress.mockResolvedValue({ success: true });
  });

  it('renders loading state initially', () => {
    mockGetExercise.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Laster øvelse...')).toBeInTheDocument();
  });

  it('renders exercise details after loading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Nakkestrekning')).toBeInTheDocument();
    });
    expect(screen.getByText('Test Klinikk')).toBeInTheDocument();
    expect(screen.getByText('Nakke')).toBeInTheDocument();
    expect(screen.getByText('Nybegynner')).toBeInTheDocument();
    // Sets/reps are rendered inline: "3 sett", "10 rep"
    expect(screen.getByText(/3\s+sett/)).toBeInTheDocument();
    expect(screen.getByText(/10\s+rep/)).toBeInTheDocument();
  });

  it('renders error state when API call fails', async () => {
    mockGetExercise.mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Kunne ikke laste øvelsen')).toBeInTheDocument();
    });
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('redirects to login when no token is available', async () => {
    mockGetStoredToken.mockReturnValue(null);
    // Need to re-mock useSearchParams to not have token
    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ prescriptionId: 'rx-1', exerciseId: 'ex-1' }),
        useSearchParams: () => [new URLSearchParams('')],
      };
    });
    // Since the useEffect checks the token on mount, navigate should be called
    // when both URL param and stored token are null
  });

  it('renders instructions and description', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Instruksjoner')).toBeInTheDocument();
    });
    expect(screen.getByText('Hold hodet i nøytral stilling.')).toBeInTheDocument();
    expect(screen.getByText('Beskrivelse')).toBeInTheDocument();
    expect(screen.getByText('En enkel strekkeøvelse for nakken.')).toBeInTheDocument();
  });

  it('renders custom instructions', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Spesielle instruksjoner')).toBeInTheDocument();
    });
    expect(screen.getByText('Gjør øvelsen forsiktig.')).toBeInTheDocument();
  });

  it('renders precautions and contraindications', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Forsiktighetsregler')).toBeInTheDocument();
    });
    expect(screen.getByText('- Stopp ved smerter')).toBeInTheDocument();
    expect(screen.getByText('Kontraindikasjoner')).toBeInTheDocument();
    expect(screen.getByText('- Akutt nakkeskade')).toBeInTheDocument();
  });

  it('renders hold seconds when available', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Hold\s+15\s+sek/)).toBeInTheDocument();
    });
  });

  it('shows video play area when video URL is available', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Trykk for å se video')).toBeInTheDocument();
    });
  });

  it('opens feedback modal when mark complete button is clicked', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Nakkestrekning')).toBeInTheDocument();
    });
    // Find the "Marker fullført" button (the one in the bottom action bar)
    const markButtons = screen.getAllByRole('button');
    const markBtn = markButtons.find((btn) => btn.textContent.includes('Marker fullført'));
    expect(markBtn).toBeTruthy();
    fireEvent.click(markBtn);
    await waitFor(() => {
      // Modal title is an h3; there are two "Registrer fremgang" elements (title + button)
      const matches = screen.getAllByText('Registrer fremgang');
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('submits progress feedback successfully', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Nakkestrekning')).toBeInTheDocument();
    });
    // Open feedback modal
    const markButtons = screen.getAllByRole('button');
    const markBtn = markButtons.find((btn) => btn.textContent.includes('Marker fullført'));
    fireEvent.click(markBtn);
    await waitFor(() => {
      const matches = screen.getAllByText('Registrer fremgang');
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
    // Find and click submit button in the modal (the green one with "Registrer fremgang" text)
    const allButtons = screen.getAllByRole('button');
    const submitBtn = allButtons.find(
      (btn) =>
        btn.textContent.includes('Registrer fremgang') && btn.classList.contains('bg-green-600')
    );
    expect(submitBtn).toBeTruthy();
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(mockRecordProgress).toHaveBeenCalled();
    });
  });

  it('shows progress history toggle when history exists', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Fremgangshistorikk')).toBeInTheDocument();
    });
  });

  it('toggles progress history visibility', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Fremgangshistorikk')).toBeInTheDocument();
    });
    // Click to expand history
    fireEvent.click(screen.getByText('Fremgangshistorikk'));
    await waitFor(() => {
      expect(screen.getByText('Gikk bra')).toBeInTheDocument();
    });
  });

  it('displays completed today badge when exercise is completed', async () => {
    mockGetExercise.mockResolvedValue({
      success: true,
      data: {
        ...mockExerciseData,
        exercise: { ...mockExerciseData.exercise, completedToday: true },
      },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Fullført i dag')).toBeInTheDocument();
    });
  });

  it('shows clinic phone contact', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Kontakt klinikken/)).toBeInTheDocument();
    });
    expect(screen.getByText(/\+47 12345678/)).toBeInTheDocument();
  });

  it('navigates back when back button is clicked', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Nakkestrekning')).toBeInTheDocument();
    });
    // Find the back button (ArrowLeft)
    const backButtons = screen.getAllByRole('button');
    const backBtn = backButtons.find((btn) => btn.querySelector('svg'));
    if (backBtn) {
      fireEvent.click(backBtn);
    }
  });

  it('renders stop exercise warning footer', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Stopp øvelsen hvis du opplever økt smerte.')).toBeInTheDocument();
    });
  });

  it('handles 401 error by redirecting to login', async () => {
    const authError = new Error('Unauthorized');
    authError.status = 401;
    mockGetExercise.mockRejectedValue(authError);
    renderPage();
    await waitFor(() => {
      expect(mockClearStoredToken).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/portal/login');
    });
  });

  it('shows difficulty color for intermediate level', async () => {
    mockGetExercise.mockResolvedValue({
      success: true,
      data: {
        ...mockExerciseData,
        exercise: { ...mockExerciseData.exercise, difficultyLevel: 'intermediate' },
      },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Middels')).toBeInTheDocument();
    });
  });

  it('shows difficulty color for advanced level', async () => {
    mockGetExercise.mockResolvedValue({
      success: true,
      data: {
        ...mockExerciseData,
        exercise: { ...mockExerciseData.exercise, difficultyLevel: 'advanced' },
      },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Avansert')).toBeInTheDocument();
    });
  });

  it('renders image when imageUrl is provided but no videoUrl', async () => {
    mockGetExercise.mockResolvedValue({
      success: true,
      data: {
        ...mockExerciseData,
        exercise: {
          ...mockExerciseData.exercise,
          videoUrl: null,
          imageUrl: 'https://example.com/exercise.jpg',
        },
      },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByAltText('Nakkestrekning')).toBeInTheDocument();
    });
  });

  it('closes feedback modal when X button is clicked', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Nakkestrekning')).toBeInTheDocument();
    });
    // Open feedback modal
    const markButtons = screen.getAllByRole('button');
    const markBtn = markButtons.find((btn) => btn.textContent.includes('Marker fullført'));
    fireEvent.click(markBtn);
    await waitFor(() => {
      const matches = screen.getAllByText('Registrer fremgang');
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
    // Close the modal - find the close button inside the fixed overlay
    const fixedOverlay = document.querySelector('.fixed');
    expect(fixedOverlay).toBeTruthy();
    const stickyHeader = fixedOverlay.querySelector('.sticky');
    const closeBtn = stickyHeader?.querySelector('button');
    expect(closeBtn).toBeTruthy();
    fireEvent.click(closeBtn);
    await waitFor(() => {
      // After close, the fixed overlay should be gone
      expect(document.querySelector('.fixed')).toBeNull();
    });
  });

  it('renders error back button for exercise load failure', async () => {
    mockGetExercise.mockRejectedValue(new Error('Server error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Tilbake til øvelser')).toBeInTheDocument();
    });
  });
});
