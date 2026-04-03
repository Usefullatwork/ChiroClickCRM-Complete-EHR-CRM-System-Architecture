/**
 * NotificationSettings Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationSettings from '../../../components/settings/NotificationSettings';

vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (props) => null }));

const mockUpdate = vi.fn().mockResolvedValue({});
vi.mock('../../../services/api', () => ({
  usersAPI: {
    getCurrent: vi.fn().mockResolvedValue({
      data: {
        user: {
          notification_preferences: {
            emailNotifications: true,
            appointmentReminders: true,
            followUpNotifications: false,
            systemUpdates: false,
          },
        },
      },
    }),
    update: (...args) => mockUpdate(...args),
  },
}));
vi.mock('../../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('NotificationSettings Component', () => {
  const t = (key, fallback) => {
    const translations = {
      notificationPrefs: 'Varslingsinnstillinger',
      manageNotifications: 'Administrer varslene dine',
      emailNotifications: 'E-postvarsler',
      emailNotificationsDesc: 'Motta e-postvarsler',
      appointmentReminders: 'Timepåminnelser',
      appointmentRemindersDesc: 'Påminnelser om timer',
      followUpNotifications: 'Oppfølgingsvarsler',
      followUpNotificationsDesc: 'Varsler om oppfølging',
      systemUpdates: 'Systemoppdateringer',
      systemUpdatesDesc: 'Varsler om systemoppdateringer',
      savedSuccessfully: 'Lagret',
      saveError: 'Kunne ikke lagre',
    };
    return translations[key] || fallback || key;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render section title', async () => {
    render(<NotificationSettings t={t} />, { wrapper: createWrapper() });
    expect(await screen.findByText('Varslingsinnstillinger')).toBeInTheDocument();
  });

  it('should render description', async () => {
    render(<NotificationSettings t={t} />, { wrapper: createWrapper() });
    expect(await screen.findByText('Administrer varslene dine')).toBeInTheDocument();
  });

  // =========================================================================
  // TOGGLES
  // =========================================================================

  it('should render all notification toggles', async () => {
    render(<NotificationSettings t={t} />, { wrapper: createWrapper() });
    expect(await screen.findByText('E-postvarsler')).toBeInTheDocument();
    expect(screen.getByText('Timepåminnelser')).toBeInTheDocument();
    expect(screen.getByText('Oppfølgingsvarsler')).toBeInTheDocument();
    expect(screen.getByText('Systemoppdateringer')).toBeInTheDocument();
  });

  it('should render toggle descriptions', async () => {
    render(<NotificationSettings t={t} />, { wrapper: createWrapper() });
    expect(await screen.findByText('Motta e-postvarsler')).toBeInTheDocument();
    expect(screen.getByText('Påminnelser om timer')).toBeInTheDocument();
  });

  // =========================================================================
  // TOGGLE INTERACTION
  // =========================================================================

  it('should call update API when a toggle is clicked', async () => {
    render(<NotificationSettings t={t} />, { wrapper: createWrapper() });
    // Wait for data to load
    await screen.findByText('E-postvarsler');
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // Toggle first checkbox
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // LOADING STATE
  // =========================================================================

  it('should show loading spinner initially', () => {
    // Override getCurrent to delay
    const { usersAPI } = require('../../../services/api');
    usersAPI.getCurrent.mockReturnValueOnce(new Promise(() => {})); // Never resolves
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <NotificationSettings t={t} />
      </QueryClientProvider>
    );
    // Should show centered loading area
    expect(container.querySelector('.flex.items-center.justify-center')).toBeInTheDocument();
  });
});
