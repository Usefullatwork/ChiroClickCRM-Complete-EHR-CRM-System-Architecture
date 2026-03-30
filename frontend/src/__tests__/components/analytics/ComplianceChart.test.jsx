/**
 * ComplianceChart Component Tests
 * Tests rendering, loading state, data display, gauge, and color coding
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
}));

import { ComplianceChart, ComplianceGauge } from '../../../components/analytics/ComplianceChart';

describe('ComplianceChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading skeleton when loading is true', () => {
    const { container } = render(<ComplianceChart loading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render title and subtitle', () => {
    render(<ComplianceChart data={{ completionRate: 75 }} />);
    expect(screen.getByText('Pasientetterlevelse')).toBeInTheDocument();
    expect(screen.getByText('Øvelsesprogrammer siste 90 dager')).toBeInTheDocument();
  });

  it('should display the completion rate percentage', () => {
    render(<ComplianceChart data={{ completionRate: 82 }} />);
    expect(screen.getByText('82%')).toBeInTheDocument();
  });

  it('should apply green color class for high completion rate (>=70)', () => {
    render(<ComplianceChart data={{ completionRate: 75 }} />);
    const rateElement = screen.getByText('75%');
    expect(rateElement.className).toContain('text-green-600');
  });

  it('should apply amber color class for moderate completion rate (50-69)', () => {
    render(<ComplianceChart data={{ completionRate: 55 }} />);
    const rateElement = screen.getByText('55%');
    expect(rateElement.className).toContain('text-amber-600');
  });

  it('should apply red color class for low completion rate (<50)', () => {
    render(<ComplianceChart data={{ completionRate: 30 }} />);
    const rateElement = screen.getByText('30%');
    expect(rateElement.className).toContain('text-red-600');
  });

  it('should show pie chart when status data exists', () => {
    render(<ComplianceChart data={{ completed: 10, active: 5, paused: 2, cancelled: 1 }} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('should show "Ingen data" when no pie data entries have values', () => {
    render(<ComplianceChart data={{ completed: 0, active: 0, paused: 0, cancelled: 0 }} />);
    expect(screen.getByText('Ingen data')).toBeInTheDocument();
  });

  it('should show "Ingen trenddata" when no weekly trend data', () => {
    render(<ComplianceChart data={{ completed: 5 }} />);
    expect(screen.getByText('Ingen trenddata')).toBeInTheDocument();
  });

  it('should render line chart when weeklyTrend data is provided', () => {
    const data = {
      completed: 10,
      weeklyTrend: [
        { week: '2024-01-01', avgRate: 80, total: 10 },
        { week: '2024-01-08', avgRate: 85, total: 12 },
      ],
    };
    render(<ComplianceChart data={data} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('should display footer stats with correct labels', () => {
    const data = {
      totalPrescriptions: 50,
      completed: 30,
      active: 15,
      paused: 3,
      avgProgressRate: 78,
    };
    render(<ComplianceChart data={data} />);
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  it('should default to zero values when data is empty object', () => {
    render(<ComplianceChart data={{}} />);
    // completionRate (0%) and avgProgressRate (0%) both render as "0%"
    const zeroPercents = screen.getAllByText('0%');
    expect(zeroPercents.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Etterlevelsesrate')).toBeInTheDocument();
  });
});

describe('ComplianceGauge', () => {
  it('should render loading skeleton when loading is true', () => {
    const { container } = render(<ComplianceGauge loading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render the rate percentage and label', () => {
    render(<ComplianceGauge rate={85} label="Test Label" />);
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('should show "Utmerket" for rate >= 70', () => {
    render(<ComplianceGauge rate={75} />);
    expect(screen.getByText('Utmerket')).toBeInTheDocument();
  });

  it('should show "Moderat" for rate 50-69', () => {
    render(<ComplianceGauge rate={55} />);
    expect(screen.getByText('Moderat')).toBeInTheDocument();
  });

  it('should show "Lav" for rate < 50', () => {
    render(<ComplianceGauge rate={30} />);
    expect(screen.getByText('Lav')).toBeInTheDocument();
  });

  it('should render SVG gauge circle', () => {
    const { container } = render(<ComplianceGauge rate={60} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2);
  });
});
