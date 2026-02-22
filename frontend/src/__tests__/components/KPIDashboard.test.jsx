/**
 * KPIDashboard Component Tests
 *
 * Tests stat cards, date range, view modes, chart areas, and export
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock hooks
vi.mock('../../hooks/useAnalytics', () => ({
  useKPIs: vi.fn(),
  usePatientMetrics: vi.fn(),
}));

// Mock child components
vi.mock('../ui/Card', () => ({
  Card: ({ children, ...props }) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children }) => <div>{children}</div>,
  CardBody: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../components/ui/Card', () => ({
  Card: Object.assign(({ children }) => <div data-testid="card">{children}</div>, {
    Header: ({ children }) => <div>{children}</div>,
    Body: ({ children }) => <div>{children}</div>,
  }),
}));

vi.mock('../../components/ui/Button', () => ({
  Button: ({ children, onClick, icon: Icon, ...props }) => (
    <button onClick={onClick} {...props}>
      {Icon && <Icon />}
      {children}
    </button>
  ),
}));

vi.mock('../../components/ui/Badge', () => ({
  Badge: ({ children }) => <span>{children}</span>,
}));

vi.mock('./KPIChart', () => ({
  KPIChart: () => <div data-testid="kpi-chart">Chart</div>,
}));

vi.mock('../../components/analytics/KPIChart', () => ({
  KPIChart: () => <div data-testid="kpi-chart">Chart</div>,
}));

vi.mock('./EmailReportModal', () => ({
  EmailReportModal: () => <div data-testid="email-modal">Email Modal</div>,
}));

vi.mock('../../components/analytics/EmailReportModal', () => ({
  EmailReportModal: () => <div data-testid="email-modal">Email Modal</div>,
}));

vi.mock('./WeekendDifferentialAnalysis', () => ({
  WeekendDifferentialAnalysis: () => <div data-testid="weekend-analysis">Weekend Analysis</div>,
}));

vi.mock('../../components/analytics/WeekendDifferentialAnalysis', () => ({
  WeekendDifferentialAnalysis: () => <div data-testid="weekend-analysis">Weekend Analysis</div>,
}));

vi.mock('lucide-react', () => ({
  TrendingUp: ({ size }) => <span>TrendingUp</span>,
  TrendingDown: ({ size }) => <span>TrendingDown</span>,
  Users: ({ size }) => <span>Users</span>,
  Calendar: ({ size }) => <span>Calendar</span>,
  MessageSquare: ({ size }) => <span>MessageSquare</span>,
  Activity: ({ size }) => <span>Activity</span>,
  Mail: () => <span>Mail</span>,
  Download: () => <span>Download</span>,
  Filter: ({ size }) => <span>Filter</span>,
  BarChart3: ({ size }) => <span>BarChart3</span>,
  MapPin: () => <span>MapPin</span>,
}));

import { KPIDashboard } from '../../components/analytics/KPIDashboard';
import { useKPIs, usePatientMetrics } from '../../hooks/useAnalytics';

const mockKPIData = {
  current: {
    totalVisits: 150,
    reactivations: 12,
    messagesSent: 85,
    activePatients: 200,
    pva: 3.5,
    appointmentsScheduled: 180,
    appointmentsCompleted: 155,
    appointmentsCancelled: 15,
    appointmentsNoShow: 5,
    showRate: 86.1,
    newPatients: 25,
    returningPatients: 175,
    inactivePatients: 30,
    retentionRate: 87.5,
  },
  previous: {
    totalVisits: 130,
    reactivations: 10,
    messagesSent: 70,
    activePatients: 190,
  },
};

describe('KPIDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useKPIs.mockReturnValue({ data: mockKPIData, isLoading: false });
    usePatientMetrics.mockReturnValue({ data: null });
  });

  it('should render the dashboard title', () => {
    render(<KPIDashboard />);
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Key performance indicators and clinic metrics')).toBeInTheDocument();
  });

  it('should display KPI cards with values', () => {
    render(<KPIDashboard />);
    expect(screen.getByText('Total Visits')).toBeInTheDocument();
    // 150 appears in both KPI card and sub-details — use getAllByText
    expect(screen.getAllByText('150').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Reactivations')).toBeInTheDocument();
    expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Messages Sent')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Active Patients')).toBeInTheDocument();
    expect(screen.getAllByText('200').length).toBeGreaterThanOrEqual(1);
  });

  it('should display PVA metric', () => {
    render(<KPIDashboard />);
    expect(screen.getByText('PVA (Patient Visit Average)')).toBeInTheDocument();
    expect(screen.getByText('3.5')).toBeInTheDocument();
  });

  it('should display appointment stats', () => {
    render(<KPIDashboard />);
    expect(screen.getByText('Appointment Stats')).toBeInTheDocument();
    expect(screen.getByText('Scheduled:')).toBeInTheDocument();
    expect(screen.getByText('Completed:')).toBeInTheDocument();
    expect(screen.getByText('No-Show:')).toBeInTheDocument();
  });

  it('should display patient demographics', () => {
    render(<KPIDashboard />);
    expect(screen.getByText('Patient Demographics')).toBeInTheDocument();
    expect(screen.getByText('New Patients:')).toBeInTheDocument();
    expect(screen.getByText('Returning:')).toBeInTheDocument();
  });

  it('should have Monthly and Yearly time range buttons', () => {
    render(<KPIDashboard />);
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Yearly')).toBeInTheDocument();
  });

  it('should have view mode toggle buttons', () => {
    render(<KPIDashboard />);
    expect(screen.getByText('Standard KPIs')).toBeInTheDocument();
    expect(screen.getByText('Weekend Differential')).toBeInTheDocument();
  });

  it('should have Email Report button', () => {
    render(<KPIDashboard />);
    expect(screen.getByText('Email Report')).toBeInTheDocument();
  });

  it('should have Export CSV button', () => {
    render(<KPIDashboard />);
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('should show loading spinner when data is loading', () => {
    useKPIs.mockReturnValue({ data: null, isLoading: true });
    const { container } = render(<KPIDashboard />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should display date navigator with Previous/Next', () => {
    render(<KPIDashboard />);
    const prevButtons = screen.getAllByText(/Previous/);
    const nextButtons = screen.getAllByText(/Next/);
    expect(prevButtons.length).toBeGreaterThanOrEqual(1);
    expect(nextButtons.length).toBeGreaterThanOrEqual(1);
  });
});
