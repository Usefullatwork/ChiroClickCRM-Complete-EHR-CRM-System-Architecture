/**
 * AIPerformance (AIAnalytics) Page Tests
 *
 * Tests AI model performance display, metrics cards, date filters, and bilingual text
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock hooks
vi.mock('../../hooks/useAIFeedback', () => ({
  useAIPerformanceMetrics: vi.fn(),
  useMyAIFeedback: vi.fn(),
  useMyAIFeedbackStats: vi.fn(),
  useAIRetrainingStatus: vi.fn(),
  useExportAIFeedback: vi.fn(),
}));

// Mock UI components
vi.mock('../../components/ui/Card', () => ({
  Card: Object.assign(({ children }) => <div data-testid="card">{children}</div>, {
    Header: ({ children }) => <div>{children}</div>,
    Body: ({ children }) => <div>{children}</div>,
  }),
  CardHeader: ({ children }) => <div>{children}</div>,
  CardBody: ({ children }) => <div>{children}</div>,
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

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key) => key,
    lang: 'no',
  }),
}));

vi.mock('lucide-react', () => ({
  TrendingUp: () => <span>TrendingUp</span>,
  TrendingDown: () => <span>TrendingDown</span>,
  Brain: () => <span>Brain</span>,
  Download: () => <span>Download</span>,
  RefreshCw: () => <span>RefreshCw</span>,
  Calendar: () => <span>Calendar</span>,
  Filter: () => <span>Filter</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  XCircle: () => <span>XCircle</span>,
  Edit3: () => <span>Edit3</span>,
  BarChart3: () => <span>BarChart3</span>,
  LineChart: () => <span>LineChart</span>,
  Clock: () => <span>Clock</span>,
  Star: () => <span>Star</span>,
  Zap: () => <span>Zap</span>,
}));

import AIPerformance from '../../pages/AIPerformance';
import {
  useAIPerformanceMetrics,
  useMyAIFeedback,
  useMyAIFeedbackStats,
  useAIRetrainingStatus,
  useExportAIFeedback,
} from '../../hooks/useAIFeedback';

const mockMetrics = {
  overallAcceptanceRate: 72.5,
  avgRating: 4.2,
  totalSuggestions: 350,
  avgDecisionTime: 3.5,
  overTime: [
    { period: 'Week 1', acceptanceRate: 68 },
    { period: 'Week 2', acceptanceRate: 70 },
    { period: 'Week 3', acceptanceRate: 75 },
    { period: 'Week 4', acceptanceRate: 72 },
  ],
  byType: [
    { type: 'subjective', total: 80, accepted: 60 },
    { type: 'objective', total: 70, accepted: 55 },
    { type: 'assessment', total: 50, accepted: 40 },
    { type: 'plan', total: 40, accepted: 30 },
    { type: 'diagnosis', total: 60, accepted: 45 },
  ],
};

const mockFeedbackStats = {
  total: 200,
  accepted: 145,
  modified: 30,
  rejected: 25,
};

const mockRetrainingStatus = {
  status: 'notNeeded',
  pendingFeedback: 45,
  lastTrained: '2026-02-15',
  threshold: 100,
};

describe('AIPerformance Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAIPerformanceMetrics.mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      refetch: vi.fn(),
    });
    useMyAIFeedback.mockReturnValue({ data: [], isLoading: false });
    useMyAIFeedbackStats.mockReturnValue({ data: mockFeedbackStats, isLoading: false });
    useAIRetrainingStatus.mockReturnValue({ data: mockRetrainingStatus, isLoading: false });
    useExportAIFeedback.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it('should render the AI performance title', () => {
    render(<AIPerformance />);
    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('should display acceptance rate stat card', () => {
    render(<AIPerformance />);
    expect(screen.getByText('acceptanceRate')).toBeInTheDocument();
  });

  it('should display total suggestions stat card', () => {
    render(<AIPerformance />);
    expect(screen.getByText('totalSuggestions')).toBeInTheDocument();
  });

  it('should display average rating stat card', () => {
    render(<AIPerformance />);
    expect(screen.getByText('avgRating')).toBeInTheDocument();
  });

  it('should display average decision time stat card', () => {
    render(<AIPerformance />);
    expect(screen.getByText('avgDecisionTime')).toBeInTheDocument();
  });

  it('should have date range filter options', () => {
    render(<AIPerformance />);
    expect(screen.getByText('last7Days')).toBeInTheDocument();
    expect(screen.getByText('last30Days')).toBeInTheDocument();
    expect(screen.getByText('last90Days')).toBeInTheDocument();
  });

  it('should have group by options', () => {
    render(<AIPerformance />);
    expect(screen.getByText('day')).toBeInTheDocument();
    expect(screen.getByText('week')).toBeInTheDocument();
    expect(screen.getByText('month')).toBeInTheDocument();
  });

  it('should display acceptance over time chart heading', () => {
    render(<AIPerformance />);
    expect(screen.getByText('acceptanceOverTime')).toBeInTheDocument();
  });

  it('should display by suggestion type chart heading', () => {
    render(<AIPerformance />);
    expect(screen.getByText('byType')).toBeInTheDocument();
  });

  it('should have export button', () => {
    render(<AIPerformance />);
    expect(screen.getByText('exportData')).toBeInTheDocument();
  });

  it('should display retraining status section', () => {
    render(<AIPerformance />);
    expect(screen.getByText('retrainingStatus')).toBeInTheDocument();
  });
});
