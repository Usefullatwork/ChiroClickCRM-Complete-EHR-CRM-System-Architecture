/**
 * AppointmentStats Component Tests
 * Tests rendering, loading state, data display, rates, upcoming appointments, and compact variant
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
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Tooltip: () => null,
}));

import {
  AppointmentStats,
  AppointmentStatsCompact,
} from '../../../components/analytics/AppointmentStats';

describe('AppointmentStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading skeleton when loading is true', () => {
    const { container } = render(<AppointmentStats loading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render title "Avtalestatistikk"', () => {
    render(<AppointmentStats />);
    expect(screen.getByText('Avtalestatistikk')).toBeInTheDocument();
  });

  it('should render subtitle "Denne uken"', () => {
    render(<AppointmentStats />);
    expect(screen.getByText('Denne uken')).toBeInTheDocument();
  });

  it('should show 0% completion rate when no data', () => {
    render(<AppointmentStats data={{}} />);
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });

  it('should calculate and display completion rate correctly', () => {
    const data = {
      thisWeek: { total: 20, completed: 16, cancelled: 2, noShow: 2 },
      today: { total: 5, completed: 3, pending: 2 },
    };
    render(<AppointmentStats data={data} />);
    expect(screen.getByText(/80%/)).toBeInTheDocument();
  });

  it('should apply green badge for high completion rate (>=80)', () => {
    const data = {
      thisWeek: { total: 10, completed: 9 },
      today: {},
    };
    const { container } = render(<AppointmentStats data={data} />);
    const badge = container.querySelector('.bg-green-100');
    expect(badge).toBeInTheDocument();
  });

  it('should apply red badge for low completion rate (<60)', () => {
    const data = {
      thisWeek: { total: 10, completed: 3 },
      today: {},
    };
    const { container } = render(<AppointmentStats data={data} />);
    const badge = container.querySelector('.bg-red-100');
    expect(badge).toBeInTheDocument();
  });

  it('should display today total appointments', () => {
    const data = {
      today: { total: 8, completed: 3, pending: 5 },
      thisWeek: {},
    };
    render(<AppointmentStats data={data} />);
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('should display completed this week count', () => {
    const data = {
      thisWeek: { completed: 25, total: 30 },
      today: {},
    };
    render(<AppointmentStats data={data} />);
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('should display completed this month count', () => {
    const data = {
      completedThisMonth: 100,
      today: {},
      thisWeek: {},
    };
    render(<AppointmentStats data={data} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should display cancelled and no-show counts', () => {
    const data = {
      thisWeek: { cancelled: 7, noShow: 4, total: 20 },
      today: {},
    };
    render(<AppointmentStats data={data} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    // "Avlyst" and "Ikke møtt" appear in both pie legend and stats cards
    const avlystElements = screen.getAllByText('Avlyst');
    expect(avlystElements.length).toBeGreaterThanOrEqual(1);
    const noShowElements = screen.getAllByText('Ikke møtt');
    expect(noShowElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should show no-show rate percentage when noShow > 0', () => {
    const data = {
      thisWeek: { noShow: 4, total: 20 },
      today: {},
    };
    render(<AppointmentStats data={data} />);
    expect(screen.getByText('(20%)')).toBeInTheDocument();
  });

  it('should show pie chart when status data has values', () => {
    const data = {
      thisWeek: { completed: 10 },
      today: { confirmed: 5 },
    };
    render(<AppointmentStats data={data} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('should show empty state when no appointment data', () => {
    const data = {
      thisWeek: { completed: 0, cancelled: 0, noShow: 0 },
      today: { confirmed: 0, pending: 0 },
    };
    render(<AppointmentStats data={data} />);
    expect(screen.getByText('Ingen avtaler denne uken')).toBeInTheDocument();
  });

  it('should render upcoming appointments list when provided', () => {
    const data = {
      today: {},
      thisWeek: {},
      upcomingToday: [
        {
          id: '1',
          startTime: '2024-03-15T10:00:00',
          patientName: 'Ola Nordmann',
          appointmentType: 'Konsultasjon',
          durationMinutes: 30,
          status: 'CONFIRMED',
        },
      ],
    };
    render(<AppointmentStats data={data} />);
    expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    expect(screen.getByText('Bekreftet')).toBeInTheDocument();
  });

  it('should not render upcoming section when upcomingToday is empty', () => {
    const data = {
      today: {},
      thisWeek: {},
      upcomingToday: [],
    };
    render(<AppointmentStats data={data} />);
    expect(screen.queryByText(/Kommende avtaler/)).not.toBeInTheDocument();
  });
});

describe('AppointmentStatsCompact', () => {
  it('should render loading skeleton when loading is true', () => {
    const { container } = render(<AppointmentStatsCompact loading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should display today, this week, and this month values', () => {
    const data = {
      today: { total: 5 },
      thisWeek: { total: 25 },
      completedThisMonth: 90,
    };
    render(<AppointmentStatsCompact data={data} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
  });

  it('should display labels for each stat row', () => {
    render(<AppointmentStatsCompact data={{}} />);
    expect(screen.getByText('I dag')).toBeInTheDocument();
    expect(screen.getByText('Denne uken')).toBeInTheDocument();
  });

  it('should default to 0 when data properties are missing', () => {
    render(<AppointmentStatsCompact data={{}} />);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(3);
  });
});
