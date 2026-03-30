import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock api
vi.mock('../../../services/api', () => ({
  organizationAPI: {
    getCurrent: vi.fn().mockResolvedValue({
      data: {
        organization: {
          id: 'org-1',
          settings: {
            reminder_appointment_enabled: true,
            reminder_exercise_enabled: true,
            recall_booking_link_enabled: true,
            reminder_birthday_enabled: false,
          },
        },
      },
    }),
    update: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key }),
}));

vi.mock('../../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import AutomatedRemindersSettings from '../AutomatedRemindersSettings';
import { organizationAPI } from '../../../services/api';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'TestQueryWrapper';
  return Wrapper;
};

describe('AutomatedRemindersSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 4 toggle switches', async () => {
    render(<AutomatedRemindersSettings />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Timepåminnelser')).toBeDefined();
    });

    expect(screen.getByText('Øvelsespåminnelser')).toBeDefined();
    expect(screen.getByText('Recall-bestillingslenke')).toBeDefined();
    expect(screen.getByText('Bursdagshilsen')).toBeDefined();
  });

  it('toggles appointment reminders on/off', async () => {
    render(<AutomatedRemindersSettings />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Timepåminnelser')).toBeDefined();
    });

    const toggles = screen.getAllByRole('checkbox');
    fireEvent.click(toggles[0]);

    await waitFor(() => {
      expect(organizationAPI.update).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            reminder_appointment_enabled: false,
          }),
        })
      );
    });
  });

  it('shows provider status', async () => {
    render(<AutomatedRemindersSettings />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Leverandørstatus')).toBeDefined();
    });

    expect(screen.getByText('SMS')).toBeDefined();
    expect(screen.getByText('E-post')).toBeDefined();
  });

  it('saves settings on toggle', async () => {
    render(<AutomatedRemindersSettings />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Bursdagshilsen')).toBeDefined();
    });

    const toggles = screen.getAllByRole('checkbox');
    // Toggle birthday (4th toggle, index 3) — was false, should become true
    fireEvent.click(toggles[3]);

    await waitFor(() => {
      expect(organizationAPI.update).toHaveBeenCalled();
    });
  });
});
