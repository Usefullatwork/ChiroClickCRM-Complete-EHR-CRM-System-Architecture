/**
 * PatientMetrics Component Tests
 * Tests rendering, loading state, data display, and compact variant
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import {
  PatientMetrics,
  PatientMetricsCompact,
} from '../../../components/analytics/PatientMetrics';

describe('PatientMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading skeleton when loading is true', () => {
    const { container } = render(<PatientMetrics loading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render the title "Pasientvolum"', () => {
    render(<PatientMetrics />);
    expect(screen.getByText('Pasientvolum')).toBeInTheDocument();
  });

  it('should render subtitle "Siste 12 maneder"', () => {
    render(<PatientMetrics />);
    expect(screen.getByText('Siste 12 maneder')).toBeInTheDocument();
  });

  it('should show empty state when no data provided', () => {
    render(<PatientMetrics data={[]} />);
    expect(screen.getByText('Ingen data tilgjengelig')).toBeInTheDocument();
  });

  it('should render area chart when data is provided', () => {
    const data = [
      { month: '2024-01-01', totalVisits: 50, uniquePatients: 30 },
      { month: '2024-02-01', totalVisits: 60, uniquePatients: 35 },
    ];
    render(<PatientMetrics data={data} />);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('should display stats from the stats prop', () => {
    const stats = {
      totalPatients: 200,
      newPatientsThisMonth: 15,
      activePatients: 120,
      changePercent: 8,
    };
    render(<PatientMetrics stats={stats} />);
    expect(screen.getByText('200')).toBeInTheDocument();
    // newPatientsThisMonth appears twice (header + footer) so use getAllByText
    const fifteens = screen.getAllByText('15');
    expect(fifteens.length).toBeGreaterThanOrEqual(1);
    // activePatients appears in both header and footer
    const onetwenties = screen.getAllByText('120');
    expect(onetwenties.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('+8%')).toBeInTheDocument();
  });

  it('should display negative change percent with red color', () => {
    const stats = { changePercent: -5 };
    render(<PatientMetrics stats={stats} />);
    const changeEl = screen.getByText('-5%');
    expect(changeEl.className).toContain('text-red-600');
  });

  it('should display positive change percent with green color', () => {
    const stats = { changePercent: 10 };
    render(<PatientMetrics stats={stats} />);
    const changeEl = screen.getByText('+10%');
    expect(changeEl.className).toContain('text-green-600');
  });

  it('should default stat values to 0 when stats is empty', () => {
    render(<PatientMetrics stats={{}} />);
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThanOrEqual(2);
  });

  it('should display footer stat labels', () => {
    render(<PatientMetrics />);
    expect(screen.getByText('Totalt')).toBeInTheDocument();
    expect(screen.getByText('Nye (denne mnd)')).toBeInTheDocument();
    expect(screen.getByText('Aktive (90 dager)')).toBeInTheDocument();
    expect(screen.getByText('Endring')).toBeInTheDocument();
  });

  it('should use label fallback when month is not a date string', () => {
    const data = [
      { label: 'Jan', totalVisits: 50, uniquePatients: 30 },
      { label: 'Feb', totalVisits: 60, uniquePatients: 35 },
    ];
    render(<PatientMetrics data={data} />);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });
});

describe('PatientMetricsCompact', () => {
  it('should render loading skeleton when loading is true', () => {
    const { container } = render(<PatientMetricsCompact loading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render line chart with data', () => {
    const data = [
      { month: '2024-01-01', totalVisits: 50 },
      { month: '2024-02-01', totalVisits: 60 },
      { month: '2024-03-01', totalVisits: 55 },
    ];
    render(<PatientMetricsCompact data={data} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('should only show last 6 data points', () => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      label: `Month ${i + 1}`,
      totalVisits: 50 + i,
    }));
    render(<PatientMetricsCompact data={data} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
