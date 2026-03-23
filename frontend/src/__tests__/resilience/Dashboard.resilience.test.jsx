/**
 * Dashboard Resilience Tests
 * Verify Dashboard renders gracefully with null, empty, and extreme data
 */
import { render, screen as _screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock API with null/empty responses
vi.mock('../../services/api', () => ({
  dashboardAPI: {
    getStats: vi.fn(),
    getTodayAppointments: vi.fn(),
    getPendingTasks: vi.fn(),
  },
  appointmentsAPI: {
    cancel: vi.fn(),
  },
  followUpsAPI: {
    getPatientsNeedingFollowUp: vi.fn(),
    markPatientAsContacted: vi.fn(),
  },
}));

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
  formatDateWithWeekday: () => 'Mandag 15. mars 2024',
  formatDateShort: () => '15.03.2024',
  formatTime: () => '10:00',
}));

vi.mock('../../utils/toast', () => ({
  default: {
    info: vi.fn(),
    promise: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../components/ui/Skeleton', () => ({
  StatsGridSkeleton: () => <div>Loading stats...</div>,
  AppointmentsListSkeleton: () => <div>Loading appointments...</div>,
  ListSkeleton: () => <div>Loading list...</div>,
}));

vi.mock('../../components/RecallDashboard', () => ({
  default: () => <div>RecallDashboard</div>,
}));

vi.mock('../../components/ConfirmDialog', () => ({
  default: () => null,
}));

vi.mock('../../services/websocket', () => ({
  default: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
}));

import { dashboardAPI } from '../../services/api';

function renderWithProviders(ui) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
}

describe('Dashboard Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not crash when stats API returns null', async () => {
    dashboardAPI.getStats.mockResolvedValue({ data: null });
    dashboardAPI.getTodayAppointments.mockResolvedValue({ data: [] });
    dashboardAPI.getPendingTasks.mockResolvedValue({ data: [] });

    const { default: Dashboard } = await import('../../pages/Dashboard');
    expect(() => renderWithProviders(<Dashboard />)).not.toThrow();
  });

  it('should not crash when stats API returns empty object', async () => {
    dashboardAPI.getStats.mockResolvedValue({ data: {} });
    dashboardAPI.getTodayAppointments.mockResolvedValue({ data: [] });
    dashboardAPI.getPendingTasks.mockResolvedValue({ data: [] });

    const { default: Dashboard } = await import('../../pages/Dashboard');
    expect(() => renderWithProviders(<Dashboard />)).not.toThrow();
  });

  it('should not crash when API throws error', async () => {
    dashboardAPI.getStats.mockRejectedValue(new Error('Network error'));
    dashboardAPI.getTodayAppointments.mockRejectedValue(new Error('Timeout'));
    dashboardAPI.getPendingTasks.mockRejectedValue(new Error('500'));

    const { default: Dashboard } = await import('../../pages/Dashboard');
    expect(() => renderWithProviders(<Dashboard />)).not.toThrow();
  });

  it('should not crash when appointments contain null values', async () => {
    dashboardAPI.getStats.mockResolvedValue({ data: { appointmentsToday: 0 } });
    dashboardAPI.getTodayAppointments.mockResolvedValue({
      data: [
        { id: '1', patient: null, time: null, type: null },
        { id: '2', patient: { first_name: null, last_name: null } },
      ],
    });
    dashboardAPI.getPendingTasks.mockResolvedValue({ data: [] });

    const { default: Dashboard } = await import('../../pages/Dashboard');
    expect(() => renderWithProviders(<Dashboard />)).not.toThrow();
  });

  it('should handle undefined data properties', async () => {
    dashboardAPI.getStats.mockResolvedValue(undefined);
    dashboardAPI.getTodayAppointments.mockResolvedValue(undefined);
    dashboardAPI.getPendingTasks.mockResolvedValue(undefined);

    const { default: Dashboard } = await import('../../pages/Dashboard');
    expect(() => renderWithProviders(<Dashboard />)).not.toThrow();
  });
});
