/**
 * PatientLogin Portal Page Tests
 * Tests token validation, manual entry, error states, and redirect flow
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock patientApi
const mockValidateToken = vi.fn();
const mockStoreToken = vi.fn();

vi.mock('../../../api/patientApi', () => ({
  patientApi: {
    validateToken: (...args) => mockValidateToken(...args),
  },
  storeToken: (...args) => mockStoreToken(...args),
  getStoredToken: vi.fn(),
  clearStoredToken: vi.fn(),
}));

// Mock i18n/useTranslation (PatientLogin imports from ../../i18n/useTranslation)
vi.mock('../../../i18n/useTranslation', () => ({
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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
  };
});

import PatientLogin from '../../../pages/portal/PatientLogin';

const renderPage = () =>
  render(
    <BrowserRouter>
      <PatientLogin />
    </BrowserRouter>
  );

describe('PatientLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockSearchParams = new URLSearchParams('');
    mockValidateToken.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('No Token State', () => {
    it('renders login page with manual token entry when no token in URL', async () => {
      mockValidateToken.mockResolvedValue({ success: false });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Pasientportalen')).toBeInTheDocument();
      });
      expect(screen.getByText('Logg inn for å se øvelsene dine')).toBeInTheDocument();
      expect(screen.getByText('Skriv inn tilgangskode')).toBeInTheDocument();
    });

    it('renders access code input field', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByLabelText('Tilgangskode')).toBeInTheDocument();
      });
    });

    it('disables login button when token is too short', async () => {
      renderPage();
      await waitFor(() => {
        const loginBtn = screen.getByText('Logg inn');
        expect(loginBtn.closest('button')).toBeDisabled();
      });
    });

    it('shows error when token is too short on submit', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByLabelText('Tilgangskode')).toBeInTheDocument();
      });
      const input = screen.getByLabelText('Tilgangskode');
      fireEvent.change(input, { target: { value: 'short-token' } });
      const form = input.closest('form');
      fireEvent.submit(form);
      await waitFor(() => {
        expect(screen.getByText('Tilgangskoden må være minst 32 tegn')).toBeInTheDocument();
      });
    });

    it('validates manual token when long enough', async () => {
      const longToken = 'a'.repeat(32);
      mockValidateToken.mockResolvedValue({
        success: true,
        valid: true,
        data: {
          patient: { firstName: 'Ola' },
          clinic: { name: 'Test Klinikk' },
        },
      });
      renderPage();
      await waitFor(() => {
        expect(screen.getByLabelText('Tilgangskode')).toBeInTheDocument();
      });
      const input = screen.getByLabelText('Tilgangskode');
      fireEvent.change(input, { target: { value: longToken } });
      const form = input.closest('form');
      fireEvent.submit(form);
      await waitFor(() => {
        expect(mockValidateToken).toHaveBeenCalledWith(longToken);
      });
    });

    it('renders help section', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Finner du ikke tilgangskoden?')).toBeInTheDocument();
      });
      expect(screen.getByText('Kontakt klinikken din for å få en ny lenke.')).toBeInTheDocument();
    });

    it('renders security notice footer', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText(/sikker innloggingsside/)).toBeInTheDocument();
      });
    });
  });

  describe('Token in URL', () => {
    it('shows loading state when validating URL token', async () => {
      mockSearchParams = new URLSearchParams('token=valid-token-32-chars-or-more');
      mockValidateToken.mockReturnValue(new Promise(() => {}));
      renderPage();
      expect(screen.getByText('Validerer tilgang...')).toBeInTheDocument();
      expect(screen.getByText('Vennligst vent')).toBeInTheDocument();
    });

    it('shows welcome screen on successful token validation', async () => {
      mockSearchParams = new URLSearchParams('token=valid-token-32-chars-or-more');
      mockValidateToken.mockResolvedValue({
        success: true,
        valid: true,
        data: {
          patient: { firstName: 'Ola' },
          clinic: { name: 'Test Klinikk' },
        },
      });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText(/Velkommen/)).toBeInTheDocument();
        expect(screen.getByText(/Ola/)).toBeInTheDocument();
      });
      expect(screen.getByText(/Test Klinikk/)).toBeInTheDocument();
      expect(screen.getByText('Laster øvelsene dine...')).toBeInTheDocument();
    });

    it('stores token on successful validation', async () => {
      mockSearchParams = new URLSearchParams('token=valid-token-32-chars-or-more');
      mockValidateToken.mockResolvedValue({
        success: true,
        valid: true,
        data: {
          patient: { firstName: 'Ola' },
          clinic: { name: 'Test Klinikk' },
        },
      });
      renderPage();
      await waitFor(() => {
        expect(mockStoreToken).toHaveBeenCalledWith('valid-token-32-chars-or-more');
      });
    });

    it('auto-redirects after successful validation', async () => {
      mockSearchParams = new URLSearchParams('token=valid-token-32-chars-or-more');
      mockValidateToken.mockResolvedValue({
        success: true,
        valid: true,
        data: {
          patient: { firstName: 'Ola' },
          clinic: { name: 'Test Klinikk' },
        },
      });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText(/Velkommen/)).toBeInTheDocument();
      });
      vi.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/portal/mine-ovelser'));
      });
    });

    it('shows error when token is invalid', async () => {
      mockSearchParams = new URLSearchParams('token=invalid-token');
      mockValidateToken.mockResolvedValue({
        success: true,
        valid: false,
        error: 'Token expired',
      });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Tilgang avvist')).toBeInTheDocument();
      });
      expect(screen.getByText('Token expired')).toBeInTheDocument();
    });

    it('shows error when validation throws', async () => {
      mockSearchParams = new URLSearchParams('token=bad-token');
      mockValidateToken.mockRejectedValue(new Error('Server error'));
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Tilgang avvist')).toBeInTheDocument();
      });
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });

    it('shows manual entry form after validation failure', async () => {
      mockSearchParams = new URLSearchParams('token=bad-token');
      mockValidateToken.mockRejectedValue(new Error('Server error'));
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Skriv inn tilgangskode')).toBeInTheDocument();
      });
    });
  });

  describe('Access Code Description', () => {
    it('shows description of where to find access code', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText(/tilgangskoden i e-posten/)).toBeInTheDocument();
      });
    });
  });
});
