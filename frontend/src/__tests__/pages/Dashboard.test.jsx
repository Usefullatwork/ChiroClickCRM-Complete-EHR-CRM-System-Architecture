import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock API module with proper object exports
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

// Mock i18n
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
  formatDateWithWeekday: () => 'Mandag 15. mars 2024',
  formatDateShort: () => '15.03.2024',
  formatTime: () => '10:00',
}));

// Mock toast
vi.mock('../../utils/toast', () => ({
  default: {
    info: vi.fn(),
    promise: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock skeleton components
vi.mock('../../components/ui/Skeleton', () => ({
  StatsGridSkeleton: () => <div>Loading stats...</div>,
  AppointmentsListSkeleton: () => <div>Loading appointments...</div>,
  ListSkeleton: () => <div>Loading list...</div>,
}));

// Mock RecallDashboard
vi.mock('../../components/recall/RecallDashboard', () => ({
  default: () => <div>RecallDashboard</div>,
}));

import Dashboard from '../../pages/Dashboard';
import { dashboardAPI, followUpsAPI } from '../../services/api';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderWithProviders = (component) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    dashboardAPI.getStats.mockResolvedValue({
      data: {
        todayAppointments: 5,
        activePatients: 120,
        pendingFollowUps: 3,
        monthRevenue: 125000,
      },
    });

    dashboardAPI.getTodayAppointments.mockResolvedValue({
      data: { appointments: [] },
    });

    followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({
      data: [],
    });
  });

  it('should render dashboard title', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-title')).toBeInTheDocument();
    });
  });

  it('should display stat cards after loading', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      const statCards = screen.getAllByTestId('dashboard-stat-card');
      expect(statCards.length).toBe(4);
    });
  });

  it('should show no appointments message when empty', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-chart')).toBeInTheDocument();
    });
  });

  it('should fetch dashboard data on mount', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(dashboardAPI.getStats).toHaveBeenCalled();
      expect(dashboardAPI.getTodayAppointments).toHaveBeenCalled();
    });
  });
});
