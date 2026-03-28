/**
 * Analytics Page Tests
 *
 * Tests for the Analytics dashboard: stat cards, date range filter,
 * month navigation, export buttons, refresh, loading states,
 * error state, empty data, and quick stats footer.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Module-level mocks (BEFORE component import)
// ---------------------------------------------------------------------------

vi.mock('../../services/api', () => ({
  analyticsAPI: {
    getDashboard: vi.fn(),
    getPatientStats: vi.fn(),
    getAppointmentStats: vi.fn(),
    getRevenueStats: vi.fn(),
    getTopExercises: vi.fn(),
    getExerciseCompliance: vi.fn(),
    getPatientTrends: vi.fn(),
    exportCSV: vi.fn(),
  },
}));

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key) => key,
    lang: 'no',
  }),
  formatDate: () => '15.03.2024',
  formatTime: () => '10:00',
  formatDateWithWeekday: () => 'Mandag 15. mars 2024',
  formatDateShort: () => '15.03.2024',
}));

vi.mock('../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('../../utils/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), scope: () => ({ error: vi.fn() }) },
  logger: { error: vi.fn() },
}));

// Mock lucide-react icons as simple spans
vi.mock('lucide-react', () => ({
  Users: (props) => <span {...props}>Users</span>,
  UserPlus: (props) => <span {...props}>UserPlus</span>,
  Calendar: (props) => <span {...props}>Calendar</span>,
  DollarSign: (props) => <span {...props}>DollarSign</span>,
  Download: (props) => <span {...props}>Download</span>,
  Filter: (props) => <span {...props}>Filter</span>,
  RefreshCw: (props) => <span {...props}>RefreshCw</span>,
  Dumbbell: (props) => <span {...props}>Dumbbell</span>,
  Target: (props) => <span {...props}>Target</span>,
  ChevronLeft: (props) => <span {...props}>ChevronLeft</span>,
  ChevronRight: (props) => <span {...props}>ChevronRight</span>,
}));

// Mock analytics sub-components with simple div stubs
vi.mock('../../components/analytics/StatCard', () => ({
  StatCard: ({ title, value, loading }) => (
    <div data-testid="stat-card">
      <span>{title}</span>
      <span>{loading ? '-' : value}</span>
    </div>
  ),
  StatCardGrid: ({ children, columns }) => (
    <div data-testid="stat-card-grid" data-columns={columns}>
      {children}
    </div>
  ),
}));

vi.mock('../../components/analytics/PatientMetrics', () => ({
  PatientMetrics: ({ loading }) => (
    <div data-testid="patient-metrics">{loading ? 'Loading...' : 'Patient Metrics'}</div>
  ),
}));

vi.mock('../../components/analytics/AppointmentStats', () => ({
  AppointmentStats: ({ loading }) => (
    <div data-testid="appointment-stats">{loading ? 'Loading...' : 'Appointment Stats'}</div>
  ),
}));

vi.mock('../../components/analytics/ExerciseStats', () => ({
  ExerciseStats: ({ loading }) => (
    <div data-testid="exercise-stats">{loading ? 'Loading...' : 'Exercise Stats'}</div>
  ),
}));

vi.mock('../../components/analytics/RevenueChart', () => ({
  RevenueChart: ({ loading }) => (
    <div data-testid="revenue-chart">{loading ? 'Loading...' : 'Revenue Chart'}</div>
  ),
}));

vi.mock('../../components/analytics/ComplianceOverview', () => ({
  ComplianceOverview: ({ loading }) => (
    <div data-testid="compliance-overview">{loading ? 'Loading...' : 'Compliance Overview'}</div>
  ),
}));

// ---------------------------------------------------------------------------
// Component + API import (AFTER mocks)
// ---------------------------------------------------------------------------

import Analytics from '../../pages/Analytics';
import { analyticsAPI } from '../../services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

const renderAnalytics = () => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <Analytics />
    </QueryClientProvider>
  );
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockDashboardData = {
  data: {
    patients: {
      totalPatients: 150,
      changePercent: 12,
      newPatientsThisMonth: 18,
      newPatientsLastMonth: 14,
      activePatients: 95,
    },
    appointments: {
      completedThisMonth: 240,
      today: { total: 8, completed: 5, noShow: 1 },
      thisWeek: { total: 42, noShow: 3 },
    },
    revenue: {
      thisMonth: { totalRevenue: 180000 },
      changePercent: 8,
      dailyRevenue: [
        { date: '2024-03-01', amount: 6000 },
        { date: '2024-03-02', amount: 7500 },
      ],
    },
    exercises: {
      compliance: { avgProgressRate: 72 },
      topPrescribed: [
        { name: 'McKenzie Extension', count: 45 },
        { name: 'Cervical Retraction', count: 38 },
      ],
    },
    trends: {
      patientVolume: [
        { date: '2024-03-01', count: 12 },
        { date: '2024-03-02', count: 15 },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Analytics Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing and shows page heading', async () => {
    analyticsAPI.getDashboard.mockResolvedValue(mockDashboardData);
    renderAnalytics();

    expect(screen.getByText('analyticsTitle')).toBeInTheDocument();
    expect(screen.getByText('analyticsSubtitle')).toBeInTheDocument();
  });

  it('displays all four stat cards', async () => {
    analyticsAPI.getDashboard.mockResolvedValue(mockDashboardData);
    renderAnalytics();

    await waitFor(() => {
      const statCards = screen.getAllByTestId('stat-card');
      expect(statCards).toHaveLength(4);
    });

    // Verify stat card titles
    expect(screen.getByText('totalPatientsCount')).toBeInTheDocument();
    expect(screen.getByText('newPatientsLabel')).toBeInTheDocument();
    expect(screen.getByText('completedAppointments')).toBeInTheDocument();
    expect(screen.getByText('complianceLabel')).toBeInTheDocument();
  });

  it('renders all chart/analytics sub-components', async () => {
    analyticsAPI.getDashboard.mockResolvedValue(mockDashboardData);
    renderAnalytics();

    await waitFor(() => {
      expect(screen.getByTestId('patient-metrics')).toBeInTheDocument();
    });

    expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
    expect(screen.getByTestId('appointment-stats')).toBeInTheDocument();
    expect(screen.getByTestId('compliance-overview')).toBeInTheDocument();
    expect(screen.getByTestId('exercise-stats')).toBeInTheDocument();
  });

  it('shows date range filter buttons for week, month, quarter, year', async () => {
    analyticsAPI.getDashboard.mockResolvedValue(mockDashboardData);
    renderAnalytics();

    expect(screen.getByText('dateRangeWeek')).toBeInTheDocument();
    expect(screen.getByText('dateRangeMonth')).toBeInTheDocument();
    expect(screen.getByText('dateRangeQuarter')).toBeInTheDocument();
    expect(screen.getByText('dateRangeYear')).toBeInTheDocument();
  });

  it('changes active date range when a filter button is clicked', async () => {
    analyticsAPI.getDashboard.mockResolvedValue(mockDashboardData);
    renderAnalytics();

    // Default is month — click quarter
    const quarterBtn = screen.getByText('dateRangeQuarter');
    fireEvent.click(quarterBtn);

    // API should be called again with new range params
    await waitFor(() => {
      expect(analyticsAPI.getDashboard).toHaveBeenCalledTimes(2);
    });
  });

  it('shows month navigator only when month range is active', async () => {
    analyticsAPI.getDashboard.mockResolvedValue(mockDashboardData);
    renderAnalytics();

    // Default is month — chevrons should be visible
    expect(screen.getByText('ChevronLeft')).toBeInTheDocument();
    expect(screen.getByText('ChevronRight')).toBeInTheDocument();

    // Switch to week — month navigator should disappear
    fireEvent.click(screen.getByText('dateRangeWeek'));

    await waitFor(() => {
      expect(screen.queryByText('ChevronLeft')).not.toBeInTheDocument();
    });
  });

  it('navigates months when chevron buttons are clicked', async () => {
    analyticsAPI.getDashboard.mockResolvedValue(mockDashboardData);
    renderAnalytics();

    // Click previous month
    const prevBtn = screen.getByText('ChevronLeft').closest('button');
    fireEvent.click(prevBtn);

    // API should re-fetch with updated month params
    await waitFor(() => {
      expect(analyticsAPI.getDashboard).toHaveBeenCalledTimes(2);
    });
  });

  it('shows refresh button and export button', async () => {
    analyticsAPI.getDashboard.mockResolvedValue(mockDashboardData);
    renderAnalytics();

    expect(screen.getByText('refresh')).toBeInTheDocument();
    expect(screen.getByText('export')).toBeInTheDocument();
  });

  it('has a refresh button present in the header', async () => {
    analyticsAPI.getDashboard.mockResolvedValue(mockDashboardData);
    renderAnalytics();

    const refreshBtn = screen.getByText('refresh').closest('button');
    expect(refreshBtn).toBeInTheDocument();

    // Wait for data to load, then the button should become enabled
    await waitFor(() => {
      expect(screen.getByTestId('patient-metrics')).toBeInTheDocument();
    });

    // After load, button should not be disabled
    await waitFor(() => {
      expect(refreshBtn).not.toBeDisabled();
    });
  });

  it('displays error state when query fails', async () => {
    analyticsAPI.getDashboard.mockRejectedValue(new Error('Network error'));
    renderAnalytics();

    await waitFor(() => {
      expect(screen.getByText('loadAnalyticsError')).toBeInTheDocument();
    });
  });

  it('renders quick stats footer with correct labels', async () => {
    analyticsAPI.getDashboard.mockResolvedValue(mockDashboardData);
    renderAnalytics();

    await waitFor(() => {
      expect(screen.getByText('quickStats')).toBeInTheDocument();
    });

    expect(screen.getByText('activePatients')).toBeInTheDocument();
    expect(screen.getByText('appointmentsToday')).toBeInTheDocument();
    expect(screen.getByText('thisWeekLabel')).toBeInTheDocument();
    expect(screen.getByText('noShowRateLabel')).toBeInTheDocument();
    expect(screen.getByText('revenueThisMonthShort')).toBeInTheDocument();
    expect(screen.getByText('revenueChangeLabel')).toBeInTheDocument();
  });

  it('shows quick stats values from loaded data', async () => {
    analyticsAPI.getDashboard.mockResolvedValue(mockDashboardData);
    renderAnalytics();

    await waitFor(() => {
      expect(screen.getByText('95')).toBeInTheDocument(); // activePatients
    });

    expect(screen.getByText('8')).toBeInTheDocument(); // appointments today
    expect(screen.getByText('42')).toBeInTheDocument(); // this week total
  });

  it('handles empty dashboard data gracefully', async () => {
    analyticsAPI.getDashboard.mockResolvedValue({ data: {} });
    renderAnalytics();

    await waitFor(() => {
      expect(screen.getByText('analyticsTitle')).toBeInTheDocument();
    });

    // Stat cards should show 0 values
    const statCards = screen.getAllByTestId('stat-card');
    expect(statCards).toHaveLength(4);

    // Quick stats footer should still render
    expect(screen.getByText('quickStats')).toBeInTheDocument();
  });
});
