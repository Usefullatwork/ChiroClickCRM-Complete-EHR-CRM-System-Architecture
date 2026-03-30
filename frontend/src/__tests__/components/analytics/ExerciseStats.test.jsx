/**
 * ExerciseStats Component Tests
 * Tests rendering, loading state, view toggle, data display, and compact variant
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Cell: () => null,
}));

import { ExerciseStats, ExerciseStatsCompact } from '../../../components/analytics/ExerciseStats';

describe('ExerciseStats', () => {
  const sampleData = [
    {
      nameNo: 'Nakketoyning',
      prescriptionCount: 50,
      patientCount: 30,
      category: 'Tøyning',
      bodyRegion: 'Nakke',
    },
    {
      nameNo: 'Skulderpress',
      prescriptionCount: 40,
      patientCount: 25,
      category: 'Styrke',
      bodyRegion: 'Skulder',
    },
    {
      nameNo: 'Kneboy',
      prescriptionCount: 35,
      patientCount: 20,
      category: 'Styrke',
      bodyRegion: 'Kne',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading skeleton when loading is true', () => {
    const { container } = render(<ExerciseStats loading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render the title "Mest foreskrevne ovelser"', () => {
    render(<ExerciseStats data={sampleData} />);
    expect(screen.getByText('Mest foreskrevne ovelser')).toBeInTheDocument();
  });

  it('should show empty state when no data provided', () => {
    render(<ExerciseStats data={[]} />);
    expect(screen.getByText('Ingen ovelsesdata tilgjengelig')).toBeInTheDocument();
  });

  it('should render bar chart by default in chart view mode', () => {
    render(<ExerciseStats data={sampleData} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should switch to list view when "Liste" button is clicked', () => {
    render(<ExerciseStats data={sampleData} />);
    const listButton = screen.getByText('Liste');
    fireEvent.click(listButton);
    expect(screen.getByText('Nakketoyning')).toBeInTheDocument();
    expect(screen.getByText('Skulderpress')).toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('should switch back to chart view when "Graf" button is clicked', () => {
    render(<ExerciseStats data={sampleData} />);
    fireEvent.click(screen.getByText('Liste'));
    fireEvent.click(screen.getByText('Graf'));
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should display exercise details in list view', () => {
    render(<ExerciseStats data={sampleData} />);
    fireEvent.click(screen.getByText('Liste'));
    expect(screen.getByText('Nakketoyning')).toBeInTheDocument();
    // Category and body region are combined: "Tøyning - Nakke"
    expect(screen.getByText('Tøyning - Nakke')).toBeInTheDocument();
  });

  it('should display prescription and patient counts in list view', () => {
    render(<ExerciseStats data={sampleData} />);
    fireEvent.click(screen.getByText('Liste'));
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('should display footer stats with totals', () => {
    render(<ExerciseStats data={sampleData} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('125')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('should display footer stat labels', () => {
    render(<ExerciseStats data={sampleData} />);
    expect(screen.getByText('Unike ovelser')).toBeInTheDocument();
    expect(screen.getByText('Totalt foreskrivninger')).toBeInTheDocument();
    expect(screen.getByText('Pasienter')).toBeInTheDocument();
  });

  it('should not render footer when data is empty', () => {
    render(<ExerciseStats data={[]} />);
    expect(screen.queryByText('Unike ovelser')).not.toBeInTheDocument();
  });

  it('should respect the limit prop for number of items shown', () => {
    const manyExercises = Array.from({ length: 15 }, (_, i) => ({
      nameNo: `Exercise ${i + 1}`,
      prescriptionCount: 100 - i,
      patientCount: 50 - i,
      category: 'Test',
      bodyRegion: 'Test',
    }));
    render(<ExerciseStats data={manyExercises} limit={5} />);
    fireEvent.click(screen.getByText('Liste'));
    expect(screen.getByText('Exercise 1')).toBeInTheDocument();
    expect(screen.getByText('Exercise 5')).toBeInTheDocument();
    expect(screen.queryByText('Exercise 6')).not.toBeInTheDocument();
  });

  it('should truncate long exercise names in chart data', () => {
    const longNameData = [
      {
        nameNo: 'This is a very long exercise name that exceeds twenty characters',
        prescriptionCount: 10,
        patientCount: 5,
        category: 'Test',
        bodyRegion: 'Test',
      },
    ];
    render(<ExerciseStats data={longNameData} />);
    fireEvent.click(screen.getByText('Liste'));
    expect(
      screen.getByText('This is a very long exercise name that exceeds twenty characters')
    ).toBeInTheDocument();
  });

  it('should show subtitle with limit value', () => {
    render(<ExerciseStats data={sampleData} limit={5} />);
    expect(screen.getByText('Topp 5 siste 90 dager')).toBeInTheDocument();
  });
});

describe('ExerciseStatsCompact', () => {
  it('should render loading skeleton when loading is true', () => {
    const { container } = render(<ExerciseStatsCompact loading={true} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display top 5 exercises', () => {
    const data = Array.from({ length: 8 }, (_, i) => ({
      nameNo: `Exercise ${i + 1}`,
      prescriptionCount: 100 - i * 10,
    }));
    render(<ExerciseStatsCompact data={data} />);
    expect(screen.getByText('Exercise 1')).toBeInTheDocument();
    expect(screen.getByText('Exercise 5')).toBeInTheDocument();
    expect(screen.queryByText('Exercise 6')).not.toBeInTheDocument();
  });

  it('should display prescription counts for each exercise', () => {
    const data = [
      { nameNo: 'Stretch A', prescriptionCount: 42 },
      { nameNo: 'Stretch B', prescriptionCount: 35 },
    ];
    render(<ExerciseStatsCompact data={data} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
  });

  it('should render color indicators for each exercise', () => {
    const data = [
      { nameNo: 'Exercise 1', prescriptionCount: 50 },
      { nameNo: 'Exercise 2', prescriptionCount: 40 },
    ];
    const { container } = render(<ExerciseStatsCompact data={data} />);
    const colorBars = container.querySelectorAll('.rounded-full');
    expect(colorBars.length).toBe(2);
  });
});
