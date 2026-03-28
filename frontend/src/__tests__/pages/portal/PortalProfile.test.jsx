/**
 * PortalProfile Page Tests
 * Tests for patient profile display and edit portal page
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock patientPortalAPI
vi.mock('../../../services/api', () => ({
  patientPortalAPI: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    getCommunicationPreferences: vi.fn(),
    updateCommunicationPreferences: vi.fn(),
  },
  default: { get: vi.fn(), post: vi.fn() },
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
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import PortalProfile from '../../../pages/portal/PortalProfile';
import { patientPortalAPI } from '../../../services/api';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const renderPage = () => {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <PortalProfile />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const mockProfile = {
  firstName: 'Ola',
  lastName: 'Nordmann',
  phone: '+47 123 45 678',
  email: 'ola@example.no',
  dateOfBirth: '1985-06-15',
};

describe('PortalProfile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patientPortalAPI.getProfile.mockResolvedValue({ data: mockProfile });
    patientPortalAPI.updateProfile.mockResolvedValue({ data: { success: true } });
    patientPortalAPI.getCommunicationPreferences.mockResolvedValue({
      data: {
        sms_enabled: true,
        email_enabled: true,
        reminder_enabled: true,
        exercise_reminder_enabled: true,
        marketing_enabled: false,
      },
    });
    patientPortalAPI.updateCommunicationPreferences.mockResolvedValue({ data: { success: true } });
  });

  it('should render loading state initially', () => {
    patientPortalAPI.getProfile.mockImplementation(() => new Promise(() => {}));
    renderPage();
    // When loading, page title is not rendered
    expect(screen.queryByText('Min profil')).not.toBeInTheDocument();
  });

  it('should render page title after loading', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Min profil')).toBeInTheDocument();
    });
  });

  it('should display patient name', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
  });

  it('should display phone number in view mode', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('+47 123 45 678')).toBeInTheDocument();
    });
  });

  it('should display email address in view mode', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('ola@example.no')).toBeInTheDocument();
    });
  });

  it('should show contact information section header', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Kontaktinformasjon')).toBeInTheDocument();
    });
  });

  it('should show edit button in view mode', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Rediger')).toBeInTheDocument();
    });
  });

  it('should switch to edit mode when edit button is clicked', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Rediger')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Rediger'));

    // Edit mode should show save and cancel buttons
    expect(screen.getByText('Lagre')).toBeInTheDocument();
    expect(screen.getByText('Avbryt')).toBeInTheDocument();
  });

  it('should show phone and email inputs in edit mode', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Rediger')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Rediger'));

    // Should have tel and email inputs with current values
    const phoneInput = screen.getByPlaceholderText('+47 123 45 678');
    const emailInput = screen.getByPlaceholderText('din@epost.no');
    expect(phoneInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(phoneInput).toHaveValue('+47 123 45 678');
    expect(emailInput).toHaveValue('ola@example.no');
  });

  it('should cancel editing and restore original values', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Rediger')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Rediger'));

    // Change phone value
    const phoneInput = screen.getByPlaceholderText('+47 123 45 678');
    fireEvent.change(phoneInput, { target: { value: '+47 999 99 999' } });
    expect(phoneInput).toHaveValue('+47 999 99 999');

    // Click cancel
    fireEvent.click(screen.getByText('Avbryt'));

    // Should be back in view mode showing original phone
    await waitFor(() => {
      expect(screen.getByText('+47 123 45 678')).toBeInTheDocument();
      expect(screen.getByText('Rediger')).toBeInTheDocument();
    });
  });

  it('should call updateProfile API on save', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Rediger')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Rediger'));

    const emailInput = screen.getByPlaceholderText('din@epost.no');
    fireEvent.change(emailInput, { target: { value: 'ny@epost.no' } });

    fireEvent.click(screen.getByText('Lagre'));

    await waitFor(() => {
      expect(patientPortalAPI.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'ny@epost.no' })
      );
    });
  });

  it('should display communication preferences section', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Kommunikasjonspreferanser')).toBeInTheDocument();
    });
  });

  it('should show communication preference toggle options', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('SMS-varsler')).toBeInTheDocument();
      expect(screen.getByText('E-postvarsler')).toBeInTheDocument();
      expect(screen.getByText('Timepåminnelser')).toBeInTheDocument();
    });
  });

  it('should show privacy note', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Din personlige informasjon er trygt oppbevart/)).toBeInTheDocument();
    });
  });

  it('should show error message when profile fails to load', async () => {
    patientPortalAPI.getProfile.mockRejectedValue(new Error('Network error'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Kunne ikke laste profilen')).toBeInTheDocument();
    });
  });

  it('should show footer with contact clinic message', async () => {
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText('Kontakt klinikken for å oppdatere navn eller fødselsdato')
      ).toBeInTheDocument();
    });
  });
});
