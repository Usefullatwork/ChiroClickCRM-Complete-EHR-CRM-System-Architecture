/**
 * PatientExercises Portal Page Tests
 * Tests PIN entry, token validation, exercise list, compliance logging, and rating
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

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
let mockSearchParams = new URLSearchParams('');
let mockPatientId = 'patient-1';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ patientId: mockPatientId }),
    useSearchParams: () => [mockSearchParams],
  };
});

// Mock import.meta.env
vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api/v1');

import PatientExercises from '../../../pages/portal/PatientExercises';

const mockValidateTokenResponse = {
  patient: { id: 'patient-1', first_name: 'Ola' },
  sessionToken: 'session-token-123',
};

const mockExercises = [
  {
    id: 'rx-1',
    exercise_name: 'Nakkestrekning',
    body_region: 'cervical',
    sets: 3,
    reps: 10,
    hold_seconds: 15,
    frequency: 'daily',
    exercise_instructions: 'Hold hodet rett.',
    custom_instructions: 'Forsiktig!',
    compliance_log: {},
    patient_rating: 0,
    video_url: null,
    thumbnail_url: null,
    image_url: null,
  },
];

const renderPage = () =>
  render(
    <BrowserRouter>
      <PatientExercises />
    </BrowserRouter>
  );

describe('PatientExercises', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams('');
    global.fetch = vi.fn();
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
  });

  describe('PIN Entry', () => {
    it('renders PIN entry when no token is provided', () => {
      renderPage();
      expect(screen.getByText('portalMyExercises')).toBeInTheDocument();
      expect(screen.getByText('portalEnterCode')).toBeInTheDocument();
    });

    it('renders four PIN input fields', () => {
      renderPage();
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBe(4);
    });

    it('shows loading state during PIN validation', async () => {
      global.fetch.mockReturnValue(new Promise(() => {}));
      renderPage();
      const inputs = screen.getAllByRole('textbox');
      // Enter PIN digits
      fireEvent.change(inputs[0], { target: { value: '1' } });
      fireEvent.change(inputs[1], { target: { value: '2' } });
      fireEvent.change(inputs[2], { target: { value: '3' } });
      fireEvent.change(inputs[3], { target: { value: '4' } });
      await waitFor(() => {
        expect(screen.getByText('portalLoadingExercises')).toBeInTheDocument();
      });
    });

    it('shows error on invalid PIN', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Wrong code' }),
      });
      renderPage();
      const inputs = screen.getAllByRole('textbox');
      fireEvent.change(inputs[0], { target: { value: '1' } });
      fireEvent.change(inputs[1], { target: { value: '2' } });
      fireEvent.change(inputs[2], { target: { value: '3' } });
      fireEvent.change(inputs[3], { target: { value: '4' } });
      await waitFor(() => {
        expect(screen.getByText('Wrong code')).toBeInTheDocument();
      });
    });

    it('rejects non-numeric input in PIN fields', () => {
      renderPage();
      const inputs = screen.getAllByRole('textbox');
      fireEvent.change(inputs[0], { target: { value: 'a' } });
      expect(inputs[0].value).toBe('');
    });
  });

  describe('Token Validation', () => {
    it('validates token from URL search params', async () => {
      mockSearchParams = new URLSearchParams('token=magic-token-123');
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockValidateTokenResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockExercises }),
        });
      renderPage();
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/patient-portal/validate-token'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('shows error when token validation fails', async () => {
      mockSearchParams = new URLSearchParams('token=bad-token');
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('portalSomethingWentWrong')).toBeInTheDocument();
      });
    });
  });

  describe('Exercise List (Authenticated)', () => {
    const setupAuthenticated = async () => {
      mockSearchParams = new URLSearchParams('token=valid-token');
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockValidateTokenResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockExercises }),
        });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('portalMyExercises')).toBeInTheDocument();
      });
    };

    it('renders exercise list after authentication', async () => {
      await setupAuthenticated();
      expect(screen.getByText('Nakkestrekning')).toBeInTheDocument();
    });

    it('shows greeting with patient name', async () => {
      await setupAuthenticated();
      // t('portalGreeting') returns 'portalGreeting', then .replace('{name}', 'Ola')
      // Since mock t() returns key, the replace has no effect. Check the key is rendered.
      expect(screen.getByText('portalGreeting')).toBeInTheDocument();
    });

    it('shows stats cards with today count, total compliance, and exercise count', async () => {
      await setupAuthenticated();
      expect(screen.getByText('portalToday')).toBeInTheDocument();
      expect(screen.getByText('portalTotal')).toBeInTheDocument();
      expect(screen.getByText('portalExercisesCount')).toBeInTheDocument();
    });

    it('shows empty state when no exercises', async () => {
      mockSearchParams = new URLSearchParams('token=valid-token');
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockValidateTokenResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('portalNoExercisesYet')).toBeInTheDocument();
      });
    });

    it('renders download button', async () => {
      await setupAuthenticated();
      expect(screen.getByText('portalRefresh')).toBeInTheDocument();
    });

    it('renders footer text', async () => {
      await setupAuthenticated();
      expect(screen.getByText('portalFooterContact')).toBeInTheDocument();
      expect(screen.getByText('portalFooterBrand')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner during token validation', async () => {
      mockSearchParams = new URLSearchParams('token=valid-token');
      global.fetch.mockReturnValue(new Promise(() => {}));
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('portalLoadingExercises')).toBeInTheDocument();
      });
    });
  });
});
