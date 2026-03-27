/**
 * OutcomeChart Tests
 *
 * Tests the outcome measure trend chart component.
 * Covers: loading state, error state, empty state, data rendering,
 * type filter toggles, and severity zone legend.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  TrendingUp: () => <svg data-testid="trending-up-icon" />,
  Filter: () => <svg data-testid="filter-icon" />,
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ReferenceArea: () => null,
  Legend: () => null,
}));

// Mock outcomesAPI
const mockGetPatientTrend = vi.fn();

vi.mock('../../../services/api', () => ({
  outcomesAPI: {
    getPatientTrend: (...args) => mockGetPatientTrend(...args),
  },
}));

import OutcomeChart from '../../../components/clinical/OutcomeChart';

describe('OutcomeChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state while fetching data', () => {
    mockGetPatientTrend.mockReturnValue(new Promise(() => {}));

    render(<OutcomeChart patientId={1} />);

    expect(screen.getByText('Utfallstrender')).toBeDefined();
    expect(screen.getByText('Laster trenddata...')).toBeDefined();
  });

  it('should show error message when API call fails', async () => {
    mockGetPatientTrend.mockRejectedValue({
      response: { data: { error: 'Server error' } },
    });

    render(<OutcomeChart patientId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeDefined();
    });
  });

  it('should show empty state when no data is returned', async () => {
    mockGetPatientTrend.mockResolvedValue({ data: {} });

    render(<OutcomeChart patientId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/Ingen utfallsdata registrert/)).toBeDefined();
    });
  });

  it('should render the chart when data is available', async () => {
    mockGetPatientTrend.mockResolvedValue({
      data: {
        ODI: [
          { date: '2024-01-15', percentage: 45 },
          { date: '2024-02-15', percentage: 30 },
        ],
      },
    });

    render(<OutcomeChart patientId={1} />);

    await waitFor(() => {
      expect(screen.getByTestId('responsive-container')).toBeDefined();
    });

    expect(screen.getByTestId('line-chart')).toBeDefined();
  });

  it('should render type filter buttons based on available data', async () => {
    mockGetPatientTrend.mockResolvedValue({
      data: {
        ODI: [{ date: '2024-01-15', percentage: 45 }],
        VAS: [{ date: '2024-01-15', percentage: 60 }],
      },
    });

    render(<OutcomeChart patientId={1} />);

    await waitFor(() => {
      expect(screen.getByText('ODI')).toBeDefined();
    });

    expect(screen.getByText('VAS')).toBeDefined();
  });

  it('should toggle type selection when filter button is clicked', async () => {
    mockGetPatientTrend.mockResolvedValue({
      data: {
        ODI: [{ date: '2024-01-15', percentage: 45 }],
        VAS: [{ date: '2024-01-15', percentage: 60 }],
      },
    });

    render(<OutcomeChart patientId={1} />);

    await waitFor(() => {
      expect(screen.getByText('ODI')).toBeDefined();
    });

    // Click ODI to deselect it
    fireEvent.click(screen.getByText('ODI'));

    // Click again to re-select
    fireEvent.click(screen.getByText('ODI'));

    // Both should still be present as filter buttons
    expect(screen.getByText('ODI')).toBeDefined();
    expect(screen.getByText('VAS')).toBeDefined();
  });

  it('should show severity zone legend', async () => {
    mockGetPatientTrend.mockResolvedValue({
      data: {
        ODI: [
          { date: '2024-01-15', percentage: 45 },
          { date: '2024-02-15', percentage: 30 },
        ],
      },
    });

    render(<OutcomeChart patientId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Minimal')).toBeDefined();
    });

    expect(screen.getByText('Moderate')).toBeDefined();
    expect(screen.getByText('Severe')).toBeDefined();
    expect(screen.getByText('Very Severe')).toBeDefined();
  });

  it('should not fetch when patientId is not provided', () => {
    render(<OutcomeChart patientId={null} />);

    expect(mockGetPatientTrend).not.toHaveBeenCalled();
  });

  it('should pass typeFilter to the API call', async () => {
    mockGetPatientTrend.mockResolvedValue({ data: {} });

    render(<OutcomeChart patientId={1} typeFilter="ODI" />);

    await waitFor(() => {
      expect(mockGetPatientTrend).toHaveBeenCalledWith(1, { type: 'ODI' });
    });
  });

  it('should show message when all types are deselected', async () => {
    mockGetPatientTrend.mockResolvedValue({
      data: {
        ODI: [{ date: '2024-01-15', percentage: 45 }],
      },
    });

    render(<OutcomeChart patientId={1} />);

    await waitFor(() => {
      expect(screen.getByText('ODI')).toBeDefined();
    });

    // Deselect the only type
    fireEvent.click(screen.getByText('ODI'));

    await waitFor(() => {
      expect(screen.getByText('Select at least one measure type to view trends.')).toBeDefined();
    });
  });
});
