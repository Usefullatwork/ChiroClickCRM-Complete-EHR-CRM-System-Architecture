/**
 * AutoAcceptSettings Component Tests
 *
 * Tests auto-accept configuration for appointments and referrals
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no' }),
}));

vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), promise: vi.fn() },
}));

vi.mock('../../../utils/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('lucide-react', () => ({
  Calendar: () => <span>Calendar</span>,
  Users: () => <span>Users</span>,
  Bell: () => <span>Bell</span>,
  AlertCircle: () => <span>AlertCircle</span>,
  Check: () => <span>Check</span>,
  Save: () => <span>Save</span>,
  History: () => <span>History</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  ChevronUp: () => <span>ChevronUp</span>,
  X: () => <span>X</span>,
}));

import AutoAcceptSettings from '../../../components/settings/AutoAcceptSettings';
import api from '../../../services/api';

const renderWithProviders = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('AutoAcceptSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      data: {
        data: {
          auto_accept_appointments: false,
          appointment_accept_delay_minutes: 0,
          appointment_types_included: [],
          appointment_types_excluded: [],
          appointment_max_daily_limit: null,
          appointment_business_hours_only: true,
          auto_accept_referrals: false,
          referral_accept_delay_minutes: 0,
          referral_sources_included: [],
          referral_sources_excluded: [],
          referral_require_complete_info: true,
          notify_on_auto_accept: true,
          notification_email: '',
          notification_sms: '',
        },
      },
    });
  });

  it('should show loading spinner initially', () => {
    api.get.mockReturnValue(new Promise(() => {})); // Never resolves
    renderWithProviders(<AutoAcceptSettings />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render header after loading', async () => {
    renderWithProviders(<AutoAcceptSettings />);
    await waitFor(() => {
      expect(screen.getByText('Auto-godkjenning')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Konfigurer automatisk godkjenning av avtaler og henvisninger')
    ).toBeInTheDocument();
  });

  it('should render the appointments section', async () => {
    renderWithProviders(<AutoAcceptSettings />);
    await waitFor(() => {
      expect(screen.getByText('Avtaler')).toBeInTheDocument();
    });
    expect(screen.getByText('Automatisk bekreft nye timebestillinger')).toBeInTheDocument();
  });

  it('should show Inaktiv status when auto-accept is disabled', async () => {
    renderWithProviders(<AutoAcceptSettings />);
    await waitFor(() => {
      const inactiveLabels = screen.getAllByText('Inaktiv');
      expect(inactiveLabels.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should render referrals section', async () => {
    renderWithProviders(<AutoAcceptSettings />);
    await waitFor(() => {
      expect(screen.getByText('Henvisninger')).toBeInTheDocument();
    });
    expect(screen.getByText('Automatisk godta innkommende henvisninger')).toBeInTheDocument();
  });

  it('should render notifications section', async () => {
    renderWithProviders(<AutoAcceptSettings />);
    await waitFor(() => {
      expect(screen.getByText('Varsler')).toBeInTheDocument();
    });
  });

  it('should render activity log section', async () => {
    renderWithProviders(<AutoAcceptSettings />);
    await waitFor(() => {
      expect(screen.getByText('Aktivitetslogg')).toBeInTheDocument();
    });
  });

  it('should render save button', async () => {
    renderWithProviders(<AutoAcceptSettings />);
    await waitFor(() => {
      expect(screen.getByText('Lagre innstillinger')).toBeInTheDocument();
    });
  });

  it('should show error message when settings fail to load', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    renderWithProviders(<AutoAcceptSettings />);
    await waitFor(() => {
      expect(screen.getByText('Kunne ikke laste innstillinger')).toBeInTheDocument();
    });
  });

  it('should call API save when save button is clicked', async () => {
    api.put.mockResolvedValue({ data: { success: true } });
    renderWithProviders(<AutoAcceptSettings />);
    await waitFor(() => {
      expect(screen.getByText('Lagre innstillinger')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Lagre innstillinger'));
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/auto-accept/settings', expect.any(Object));
    });
  });

  it('should show success message after saving', async () => {
    api.put.mockResolvedValue({ data: { success: true } });
    renderWithProviders(<AutoAcceptSettings />);
    await waitFor(() => {
      expect(screen.getByText('Lagre innstillinger')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Lagre innstillinger'));
    await waitFor(() => {
      expect(screen.getByText('Innstillinger lagret!')).toBeInTheDocument();
    });
  });
});
