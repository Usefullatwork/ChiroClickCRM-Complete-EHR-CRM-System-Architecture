/**
 * AutomatedRemindersSettings Component Tests
 *
 * Tests automated reminder toggles, provider status, mutation handling
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no' }),
}));

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  organizationAPI: {
    getCurrent: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), promise: vi.fn() },
}));

vi.mock('lucide-react', () => ({
  Loader2: () => <span>Loader2</span>,
  MessageSquare: () => <span>MessageSquare</span>,
  Mail: () => <span>Mail</span>,
}));

import AutomatedRemindersSettings from '../../../components/settings/AutomatedRemindersSettings';
import { organizationAPI } from '../../../services/api';
import toast from '../../../utils/toast';

const mockOrgData = {
  data: {
    organization: {
      id: 1,
      name: 'Test Klinikk',
      settings: {
        reminder_appointment_enabled: true,
        reminder_exercise_enabled: true,
        recall_booking_link_enabled: true,
        reminder_birthday_enabled: false,
      },
    },
  },
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const renderWithProviders = (ui) => {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AutomatedRemindersSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    organizationAPI.getCurrent.mockResolvedValue(mockOrgData);
    organizationAPI.update.mockResolvedValue({ data: { success: true } });
  });

  it('should show loading spinner while fetching', () => {
    organizationAPI.getCurrent.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<AutomatedRemindersSettings />);
    // Loader2 is mocked as <span>Loader2</span>
    expect(screen.getByText('Loader2')).toBeInTheDocument();
  });

  it('should render the main heading after loading', async () => {
    renderWithProviders(<AutomatedRemindersSettings />);
    await waitFor(() => {
      expect(screen.getByText('Automatiske påminnelser')).toBeInTheDocument();
    });
  });

  it('should render description text', async () => {
    renderWithProviders(<AutomatedRemindersSettings />);
    await waitFor(() => {
      expect(
        screen.getByText('Konfigurer automatiske påminnelser og meldinger til pasienter')
      ).toBeInTheDocument();
    });
  });

  it('should render all four toggle options', async () => {
    renderWithProviders(<AutomatedRemindersSettings />);
    await waitFor(() => {
      expect(screen.getByText('Timepåminnelser')).toBeInTheDocument();
    });
    expect(screen.getByText('Øvelsespåminnelser')).toBeInTheDocument();
    expect(screen.getByText('Recall-bestillingslenke')).toBeInTheDocument();
    expect(screen.getByText('Bursdagshilsen')).toBeInTheDocument();
  });

  it('should render toggle descriptions', async () => {
    renderWithProviders(<AutomatedRemindersSettings />);
    await waitFor(() => {
      expect(
        screen.getByText('Send SMS/e-post påminnelse 24 og 48 timer før timen')
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText('Send påminnelse når pasienten ikke har logget øvelser på 7 dager')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Send bestillingslenke til pasienter med forfalt recall')
    ).toBeInTheDocument();
    expect(screen.getByText('Send automatisk gratulasjon på bursdagen')).toBeInTheDocument();
  });

  it('should render four checkboxes matching toggle states', async () => {
    renderWithProviders(<AutomatedRemindersSettings />);
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBe(4);
    });
  });

  it('should have birthday toggle unchecked by default', async () => {
    renderWithProviders(<AutomatedRemindersSettings />);
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      // Birthday is the last toggle, default false
      expect(checkboxes[3].checked).toBe(false);
    });
  });

  it('should have appointment reminder toggle checked by default', async () => {
    renderWithProviders(<AutomatedRemindersSettings />);
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0].checked).toBe(true);
    });
  });

  it('should render provider status section', async () => {
    renderWithProviders(<AutomatedRemindersSettings />);
    await waitFor(() => {
      expect(screen.getByText('Leverandørstatus')).toBeInTheDocument();
    });
    expect(screen.getByText('SMS')).toBeInTheDocument();
    expect(screen.getByText('E-post')).toBeInTheDocument();
  });

  it('should call mutation when a toggle is clicked', async () => {
    renderWithProviders(<AutomatedRemindersSettings />);
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toBe(4);
    });
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[3]); // Toggle birthday
    await waitFor(() => {
      expect(organizationAPI.update).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            reminder_birthday_enabled: true,
          }),
        })
      );
    });
  });
});
