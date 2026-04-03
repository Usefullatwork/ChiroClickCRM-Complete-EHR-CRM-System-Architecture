/**
 * NotificationDropdown Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationDropdown from '../../../components/common/NotificationDropdown';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (props) => null }));
vi.mock('../../../services/api', () => ({
  notificationsAPI: {
    getUnreadCount: vi.fn().mockResolvedValue({ data: { count: 3 } }),
    getAll: vi.fn().mockResolvedValue({
      data: {
        notifications: [
          {
            id: '1',
            type: 'APPOINTMENT_REMINDER',
            title: 'Appointment tomorrow',
            message: 'Patient at 10:00',
            read: false,
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            type: 'MESSAGE_RECEIVED',
            title: 'New message',
            message: null,
            read: true,
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
      },
    }),
    markRead: vi.fn().mockResolvedValue({}),
    markAllRead: vi.fn().mockResolvedValue({}),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('NotificationDropdown Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render bell button', () => {
    render(<NotificationDropdown />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('Varsler')).toBeInTheDocument();
  });

  // =========================================================================
  // TOGGLE DROPDOWN
  // =========================================================================

  it('should open dropdown when bell is clicked', async () => {
    render(<NotificationDropdown />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByLabelText('Varsler'));
    // The dropdown panel should appear with the heading
    expect(await screen.findByText('Varsler', { selector: 'h3' })).toBeInTheDocument();
  });

  it('should close dropdown when bell is clicked again', async () => {
    render(<NotificationDropdown />, { wrapper: createWrapper() });
    const bell = screen.getByLabelText('Varsler');
    fireEvent.click(bell);
    expect(await screen.findByText('Varsler', { selector: 'h3' })).toBeInTheDocument();
    fireEvent.click(bell);
    // h3 heading should be gone
    expect(screen.queryByText('Varsler', { selector: 'h3' })).not.toBeInTheDocument();
  });

  // =========================================================================
  // NOTIFICATION LIST
  // =========================================================================

  it('should display notifications when dropdown is open', async () => {
    render(<NotificationDropdown />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByLabelText('Varsler'));
    expect(await screen.findByText('Appointment tomorrow')).toBeInTheDocument();
    expect(screen.getByText('New message')).toBeInTheDocument();
  });

  it('should show unread indicator for unread notifications', async () => {
    render(<NotificationDropdown />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByLabelText('Varsler'));
    await screen.findByText('Appointment tomorrow');
    // The unread notification should have the blue dot
    const unreadDot = document.querySelector('.bg-blue-500.rounded-full');
    expect(unreadDot).toBeInTheDocument();
  });

  // =========================================================================
  // EMPTY STATE
  // =========================================================================

  it('should show empty message when no notifications', async () => {
    const { notificationsAPI } = await import('../../../services/api');
    notificationsAPI.getAll.mockResolvedValueOnce({ data: { notifications: [] } });

    render(<NotificationDropdown />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByLabelText('Varsler'));
    expect(await screen.findByText('Ingen varsler')).toBeInTheDocument();
  });

  // =========================================================================
  // CLICK OUTSIDE
  // =========================================================================

  it('should close dropdown on outside click', async () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <NotificationDropdown />
      </div>,
      { wrapper: createWrapper() }
    );
    fireEvent.click(screen.getByLabelText('Varsler'));
    expect(await screen.findByText('Varsler', { selector: 'h3' })).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('Varsler', { selector: 'h3' })).not.toBeInTheDocument();
  });
});
