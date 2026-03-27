/**
 * AIPerformance Page Tests
 *
 * Tests rendering, stat cards, chart sections, filters,
 * export/refresh buttons, retraining status, and corrections table.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --------------- Mocks (before component import) ---------------

vi.mock('../../hooks/useAIFeedback', () => ({
  useAIPerformanceMetrics: vi.fn(),
  useMyAIFeedback: vi.fn(),
  useMyAIFeedbackStats: vi.fn(),
  useAIRetrainingStatus: vi.fn(),
  useExportAIFeedback: vi.fn(),
}));

vi.mock('../../components/ui/Card', () => ({
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardBody: ({ children }) => <div data-testid="card-body">{children}</div>,
}));

vi.mock('../../components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, loading, icon: Icon, ...rest }) => (
    <button onClick={onClick} disabled={disabled} data-loading={loading} {...rest}>
      {Icon && <Icon data-testid="button-icon" />}
      {children}
    </button>
  ),
}));

vi.mock('../../components/ui/Badge', () => ({
  Badge: ({ children, variant }) => <span data-variant={variant}>{children}</span>,
}));

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
}));

vi.mock('lucide-react', () => ({
  TrendingUp: (props) => (
    <span data-testid="icon-trending-up" {...props}>
      TrendingUp
    </span>
  ),
  TrendingDown: (props) => (
    <span data-testid="icon-trending-down" {...props}>
      TrendingDown
    </span>
  ),
  Brain: (props) => (
    <span data-testid="icon-brain" {...props}>
      Brain
    </span>
  ),
  Download: (props) => (
    <span data-testid="icon-download" {...props}>
      Download
    </span>
  ),
  RefreshCw: (props) => (
    <span data-testid="icon-refresh" {...props}>
      RefreshCw
    </span>
  ),
  Calendar: (props) => (
    <span data-testid="icon-calendar" {...props}>
      Calendar
    </span>
  ),
  Filter: (props) => (
    <span data-testid="icon-filter" {...props}>
      Filter
    </span>
  ),
  CheckCircle: (props) => (
    <span data-testid="icon-check" {...props}>
      CheckCircle
    </span>
  ),
  XCircle: (props) => (
    <span data-testid="icon-x" {...props}>
      XCircle
    </span>
  ),
  Edit3: (props) => (
    <span data-testid="icon-edit" {...props}>
      Edit3
    </span>
  ),
  BarChart3: (props) => (
    <span data-testid="icon-bar" {...props}>
      BarChart3
    </span>
  ),
  LineChart: (props) => (
    <span data-testid="icon-line" {...props}>
      LineChart
    </span>
  ),
  Clock: (props) => (
    <span data-testid="icon-clock" {...props}>
      Clock
    </span>
  ),
  Star: (props) => (
    <span data-testid="icon-star" {...props}>
      Star
    </span>
  ),
  Zap: (props) => (
    <span data-testid="icon-zap" {...props}>
      Zap
    </span>
  ),
}));

// --------------- Imports (after mocks) ---------------

import AIPerformance from '../../pages/AIPerformance';
import {
  useAIPerformanceMetrics,
  useMyAIFeedback,
  useMyAIFeedbackStats,
  useAIRetrainingStatus,
  useExportAIFeedback,
} from '../../hooks/useAIFeedback';

// --------------- Test data ---------------

const mockMetricsData = {
  metrics: [
    {
      period: '2026-03-01',
      suggestion_type: 'subjective',
      total_suggestions: 40,
      accepted_as_is: 20,
      modified: 10,
      rejected: 10,
    },
    {
      period: '2026-03-02',
      suggestion_type: 'objective',
      total_suggestions: 30,
      accepted_as_is: 15,
      modified: 8,
      rejected: 7,
    },
    {
      period: '2026-03-03',
      suggestion_type: 'assessment',
      total_suggestions: 25,
      accepted_as_is: 12,
      modified: 6,
      rejected: 7,
    },
  ],
};

const mockStatsData = {
  totalFeedback: 200,
  acceptanceRate: 75.3,
  avgRating: 4.1,
  avgDecisionTime: 3500,
};

const mockFeedbackData = {
  feedback: [
    {
      id: 1,
      suggestionType: 'subjective',
      correctionType: 'accepted_as_is',
      userRating: 5,
      timeToDecision: 2000,
      createdAt: '2026-03-15T10:00:00Z',
    },
    {
      id: 2,
      suggestionType: 'objective',
      correctionType: 'modified',
      userRating: 3,
      timeToDecision: 5000,
      createdAt: '2026-03-14T14:30:00Z',
    },
    {
      id: 3,
      suggestionType: 'plan',
      correctionType: 'rejected',
      userRating: 1,
      timeToDecision: 1000,
      createdAt: '2026-03-13T09:00:00Z',
    },
  ],
};

const mockRetrainingStatus = {
  status: 'not_needed',
  pendingFeedbackCount: 25,
  threshold: 50,
  lastTrainedAt: '2026-03-10T08:00:00Z',
};

const mockRefetchMetrics = vi.fn();
const mockRefetchStats = vi.fn();
const mockExportMutate = vi.fn();

// --------------- Setup ---------------

describe('AIPerformance Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAIPerformanceMetrics.mockReturnValue({
      data: mockMetricsData,
      isLoading: false,
      refetch: mockRefetchMetrics,
    });

    useMyAIFeedback.mockReturnValue({
      data: mockFeedbackData,
      isLoading: false,
    });

    useMyAIFeedbackStats.mockReturnValue({
      data: mockStatsData,
      isLoading: false,
      refetch: mockRefetchStats,
    });

    useAIRetrainingStatus.mockReturnValue({
      data: mockRetrainingStatus,
      isLoading: false,
    });

    useExportAIFeedback.mockReturnValue({
      mutate: mockExportMutate,
      isLoading: false,
    });
  });

  // ---- Rendering ----

  it('should render without crashing', () => {
    render(<AIPerformance />);
    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('should display the page subtitle', () => {
    render(<AIPerformance />);
    expect(screen.getByText('subtitle')).toBeInTheDocument();
  });

  // ---- Stat cards ----

  it('should display all four stat cards with correct labels', () => {
    render(<AIPerformance />);
    expect(screen.getByText('acceptanceRate')).toBeInTheDocument();
    expect(screen.getByText('avgRating')).toBeInTheDocument();
    expect(screen.getByText('totalSuggestions')).toBeInTheDocument();
    expect(screen.getByText('avgDecisionTime')).toBeInTheDocument();
  });

  it('should display acceptance rate value from stats', () => {
    render(<AIPerformance />);
    // 75.3% rendered as "75.3%"
    expect(screen.getByText('75.3%')).toBeInTheDocument();
  });

  it('should display total feedback count from stats', () => {
    render(<AIPerformance />);
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('should display average rating value with /5 suffix', () => {
    render(<AIPerformance />);
    expect(screen.getByText('4.1')).toBeInTheDocument();
    expect(screen.getByText('/5')).toBeInTheDocument();
  });

  it('should show "good" indicator when acceptance rate >= 70', () => {
    render(<AIPerformance />);
    expect(screen.getByText('good')).toBeInTheDocument();
  });

  it('should show "needsImprovement" when acceptance rate < 70', () => {
    useMyAIFeedbackStats.mockReturnValue({
      data: { ...mockStatsData, acceptanceRate: 55.0 },
      isLoading: false,
      refetch: mockRefetchStats,
    });
    render(<AIPerformance />);
    expect(screen.getByText('needsImprovement')).toBeInTheDocument();
  });

  // ---- Chart sections ----

  it('should display acceptance over time chart heading', () => {
    render(<AIPerformance />);
    expect(screen.getByText('acceptanceOverTime')).toBeInTheDocument();
  });

  it('should display by type chart heading', () => {
    render(<AIPerformance />);
    expect(screen.getByText('byType')).toBeInTheDocument();
  });

  // ---- Filters ----

  it('should render date range filter with all options', () => {
    render(<AIPerformance />);
    expect(screen.getByText('last7Days')).toBeInTheDocument();
    expect(screen.getByText('last30Days')).toBeInTheDocument();
    expect(screen.getByText('last90Days')).toBeInTheDocument();
    expect(screen.getByText('lastYear')).toBeInTheDocument();
  });

  it('should render group by filter with day/week/month', () => {
    render(<AIPerformance />);
    expect(screen.getByText('day')).toBeInTheDocument();
    expect(screen.getByText('week')).toBeInTheDocument();
    expect(screen.getByText('month')).toBeInTheDocument();
  });

  it('should display filters label', () => {
    render(<AIPerformance />);
    expect(screen.getByText('filters:')).toBeInTheDocument();
  });

  // ---- Buttons ----

  it('should render refresh and export buttons', () => {
    render(<AIPerformance />);
    expect(screen.getByText('refresh')).toBeInTheDocument();
    expect(screen.getByText('exportData')).toBeInTheDocument();
  });

  it('should call export mutation when export button is clicked', () => {
    render(<AIPerformance />);
    const exportBtn = screen.getByText('exportData');
    fireEvent.click(exportBtn);
    expect(mockExportMutate).toHaveBeenCalledWith(expect.objectContaining({ format: 'csv' }));
  });

  it('should call refetch functions when refresh is clicked', () => {
    render(<AIPerformance />);
    const refreshBtn = screen.getByText('refresh');
    fireEvent.click(refreshBtn);
    expect(mockRefetchMetrics).toHaveBeenCalled();
    expect(mockRefetchStats).toHaveBeenCalled();
  });

  // ---- Retraining status ----

  it('should display retraining status section', () => {
    render(<AIPerformance />);
    expect(screen.getByText('retrainingStatus')).toBeInTheDocument();
  });

  it('should show pending feedback count and threshold', () => {
    render(<AIPerformance />);
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('should display retraining progress label', () => {
    render(<AIPerformance />);
    expect(screen.getByText('retrainingProgress')).toBeInTheDocument();
  });

  // ---- Recent corrections ----

  it('should display recent corrections section heading', () => {
    render(<AIPerformance />);
    expect(screen.getByText('recentCorrections')).toBeInTheDocument();
  });

  it('should render corrections table with action labels', () => {
    render(<AIPerformance />);
    // "actionAccepted" and "actionModified" appear in both chart legend and corrections table
    const acceptedElements = screen.getAllByText('actionAccepted');
    expect(acceptedElements.length).toBeGreaterThanOrEqual(2);
    const modifiedElements = screen.getAllByText('actionModified');
    expect(modifiedElements.length).toBeGreaterThanOrEqual(2);
    const rejectedElements = screen.getAllByText('actionRejected');
    expect(rejectedElements.length).toBeGreaterThanOrEqual(2);
  });

  // ---- Loading state ----

  it('should show loading spinner when metrics are loading', () => {
    useAIPerformanceMetrics.mockReturnValue({
      data: null,
      isLoading: true,
      refetch: mockRefetchMetrics,
    });
    render(<AIPerformance />);
    // Refresh button should be disabled when loading
    const refreshBtn = screen.getByText('refresh');
    expect(refreshBtn).toBeDisabled();
  });

  // ---- Empty data ----

  it('should show noData text when no metrics available', () => {
    useAIPerformanceMetrics.mockReturnValue({
      data: { metrics: [] },
      isLoading: false,
      refetch: mockRefetchMetrics,
    });
    useMyAIFeedback.mockReturnValue({
      data: { feedback: [] },
      isLoading: false,
    });
    render(<AIPerformance />);
    // Both chart components and corrections table should show "noData"
    const noDataElements = screen.getAllByText('noData');
    expect(noDataElements.length).toBeGreaterThanOrEqual(2);
  });

  // ---- Null/missing stats graceful handling ----

  it('should display 0 values when stats data is null', () => {
    useMyAIFeedbackStats.mockReturnValue({
      data: null,
      isLoading: false,
      refetch: mockRefetchStats,
    });
    render(<AIPerformance />);
    // Should show "0%" for acceptance rate fallback
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
