/**
 * PainTracker Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module-level mocks (BEFORE component import)
// ---------------------------------------------------------------------------

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
}));

// Mock recharts — render children so structural assertions still work
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
}));

import PainTracker from '../../../components/patients/PainTracker';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const sampleData = [
  { date: '2024-03-01', avgPain: '3', entryCount: 2 },
  { date: '2024-03-05', avgPain: '5', entryCount: 1 },
  { date: '2024-03-10', avgPain: '7', entryCount: 3 },
  { date: '2024-03-15', avgPain: '4', entryCount: 1 },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PainTracker', () => {
  const mockOnLogPain = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // EMPTY STATE
  // ========================================================================

  describe('Empty state', () => {
    it('should show empty message when no data', () => {
      render(<PainTracker data={[]} />);
      expect(screen.getByText('Ingen smertedata tilgjengelig')).toBeInTheDocument();
    });

    it('should show suggestion text when no data', () => {
      render(<PainTracker data={[]} />);
      expect(screen.getByText('Registrer smerteniva for a se fremgang')).toBeInTheDocument();
    });

    it('should show dashes for statistics when no data', () => {
      render(<PainTracker data={[]} />);
      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ========================================================================
  // CHART RENDERING
  // ========================================================================

  describe('Chart rendering', () => {
    it('should render the chart when data is provided', () => {
      render(<PainTracker data={sampleData} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('should not render the chart when data is empty', () => {
      render(<PainTracker data={[]} />);
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // STATISTICS
  // ========================================================================

  describe('Statistics', () => {
    it('should display average pain level', () => {
      render(<PainTracker data={sampleData} />);
      expect(screen.getByText('Gjennomsnitt')).toBeInTheDocument();
      expect(screen.getByText('4.8')).toBeInTheDocument();
    });

    it('should display min pain level', () => {
      render(<PainTracker data={sampleData} />);
      expect(screen.getByText('Laveste')).toBeInTheDocument();
      expect(screen.getByText('3.0')).toBeInTheDocument();
    });

    it('should display max pain level', () => {
      render(<PainTracker data={sampleData} />);
      expect(screen.getByText('Hoyeste')).toBeInTheDocument();
      expect(screen.getByText('7.0')).toBeInTheDocument();
    });

    it('should display total entry count', () => {
      render(<PainTracker data={sampleData} />);
      expect(screen.getByText('Registreringer')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // TREND INDICATOR
  // ========================================================================

  describe('Trend indicator', () => {
    it('should show "Stabilt" for stable trend', () => {
      render(<PainTracker data={sampleData} trend="stable" />);
      expect(screen.getByText('Stabilt')).toBeInTheDocument();
    });

    it('should show "Forbedring" for improving trend', () => {
      render(<PainTracker data={sampleData} trend="improving" />);
      expect(screen.getByText('Forbedring')).toBeInTheDocument();
    });

    it('should show "Okning" for worsening trend', () => {
      render(<PainTracker data={sampleData} trend="worsening" />);
      expect(screen.getByText('Okning')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // CURRENT PAIN DISPLAY
  // ========================================================================

  describe('Current pain display', () => {
    it('should display current average pain level', () => {
      render(<PainTracker data={sampleData} currentAvg={5} />);
      expect(screen.getByText('5 / 10')).toBeInTheDocument();
    });

    it('should not display current pain when null', () => {
      render(<PainTracker data={sampleData} currentAvg={null} />);
      expect(screen.queryByText('/ 10')).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // PAIN LEVEL SELECTOR
  // ========================================================================

  describe('Pain level selector', () => {
    it('should render pain level buttons when onLogPain is provided', () => {
      render(<PainTracker data={[]} onLogPain={mockOnLogPain} />);
      expect(screen.getByText('Registrer smerteniva na')).toBeInTheDocument();
      // 11 buttons for levels 0-10
      const painButtons = screen.getAllByTitle(/./);
      expect(painButtons.length).toBe(11);
    });

    it('should not render pain level buttons when onLogPain is not provided', () => {
      render(<PainTracker data={[]} />);
      expect(screen.queryByText('Registrer smerteniva na')).not.toBeInTheDocument();
    });

    it('should open modal when pain level is clicked', () => {
      render(<PainTracker data={[]} onLogPain={mockOnLogPain} />);
      const buttons = screen.getAllByTitle(/./);
      fireEvent.click(buttons[5]); // click level 5

      expect(screen.getByText('Registrer smerteniva')).toBeInTheDocument();
      expect(screen.getByText('Avbryt')).toBeInTheDocument();
      expect(screen.getByText('Registrer')).toBeInTheDocument();
    });

    it('should call onLogPain when submitting from modal', () => {
      render(<PainTracker data={[]} onLogPain={mockOnLogPain} />);
      const buttons = screen.getAllByTitle(/./);
      fireEvent.click(buttons[3]); // click level 3

      // Submit the pain entry
      fireEvent.click(screen.getByText('Registrer'));
      expect(mockOnLogPain).toHaveBeenCalledWith(3, '');
    });

    it('should close modal on cancel', () => {
      render(<PainTracker data={[]} onLogPain={mockOnLogPain} />);
      const buttons = screen.getAllByTitle(/./);
      fireEvent.click(buttons[5]);

      fireEvent.click(screen.getByText('Avbryt'));
      // Modal should be gone
      expect(screen.queryByText('Notater (valgfritt)')).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // PAIN SCALE LEGEND
  // ========================================================================

  describe('Pain scale legend', () => {
    it('should display pain scale labels', () => {
      render(<PainTracker data={[]} />);
      expect(screen.getByText('Ingen smerte')).toBeInTheDocument();
      expect(screen.getByText('Middels')).toBeInTheDocument();
      expect(screen.getByText('Verst mulig')).toBeInTheDocument();
    });
  });
});
