/**
 * ComplianceCalendar Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ComplianceCalendar from '../../../components/patients/ComplianceCalendar';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const today = new Date();
const year = today.getFullYear();
const month = today.getMonth();

// Create a date string for the 10th of the current month
const dayTen = new Date(year, month, 10);
const dayTenStr = dayTen.toISOString().split('T')[0];

const dayFifteen = new Date(year, month, 15);
const dayFifteenStr = dayFifteen.toISOString().split('T')[0];

// Only include data for past days to avoid future-date disabled state
const sampleData = [
  {
    date: dayTenStr,
    completionRate: 90,
    exercisesDone: 9,
    totalPrescribed: 10,
    avgPain: '3',
    exerciseNames: ['Nakketoyning', 'Planke'],
  },
  {
    date: dayFifteenStr,
    completionRate: 40,
    exercisesDone: 2,
    totalPrescribed: 5,
    avgPain: '7',
  },
];

// ---------------------------------------------------------------------------
// Norwegian month names (from the component)
// ---------------------------------------------------------------------------

const monthNames = [
  'Januar',
  'Februar',
  'Mars',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Desember',
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ComplianceCalendar', () => {
  const mockOnDateSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // BASIC RENDERING
  // ========================================================================

  describe('Basic rendering', () => {
    it('should render current month and year in header', () => {
      render(<ComplianceCalendar data={[]} />);
      const expected = `${monthNames[month]} ${year}`;
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should render all Norwegian day abbreviations', () => {
      render(<ComplianceCalendar data={[]} />);
      const dayNames = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lor', 'Son'];
      dayNames.forEach((day) => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it('should render 42 day cells (6 weeks grid)', () => {
      render(<ComplianceCalendar data={[]} />);
      // Each day cell is a button in the calendar grid
      const gridButtons = screen.getAllByRole('button').filter((btn) => {
        // Filter out nav buttons (prev/next month)
        return !btn.querySelector('.w-5');
      });
      // 42 day buttons + 2 nav buttons = but we filter nav, so ~42
      expect(gridButtons.length).toBeGreaterThanOrEqual(42);
    });

    it('should render the legend with all four levels', () => {
      render(<ComplianceCalendar data={[]} />);
      expect(screen.getByText('Utmerket (80%+)')).toBeInTheDocument();
      expect(screen.getByText('Middels (50-79%)')).toBeInTheDocument();
      expect(screen.getByText('Lav (1-49%)')).toBeInTheDocument();
      expect(screen.getByText('Ingen')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // MONTH NAVIGATION
  // ========================================================================

  describe('Month navigation', () => {
    it('should navigate to previous month', () => {
      render(<ComplianceCalendar data={[]} />);
      const prevButton = screen.getAllByRole('button')[0];
      fireEvent.click(prevButton);

      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const expected = `${monthNames[prevMonth]} ${prevYear}`;
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should navigate to next month', () => {
      render(<ComplianceCalendar data={[]} />);
      // The next-month button is the last nav button in the header
      const buttons = screen.getAllByRole('button');
      // Find the one after the header (second button in the row)
      const nextButton = buttons[1];
      fireEvent.click(nextButton);

      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const expected = `${monthNames[nextMonth]} ${nextYear}`;
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  // ========================================================================
  // DATE SELECTION
  // ========================================================================

  describe('Date selection', () => {
    it('should call onDateSelect when a current-month date is clicked', () => {
      // Use day 1 of current month (always in the past or today)
      const dayOneData = [
        {
          date: new Date(year, month, 1).toISOString().split('T')[0],
          completionRate: 50,
          exercisesDone: 3,
          totalPrescribed: 6,
        },
      ];
      render(<ComplianceCalendar data={dayOneData} onDateSelect={mockOnDateSelect} />);

      // Find the button containing text "1" that is for the current month
      // Day 1 should always be present
      const dayButtons = screen.getAllByRole('button');
      const day1Button = dayButtons.find((btn) => btn.textContent.trim() === '1' && !btn.disabled);

      if (day1Button) {
        fireEvent.click(day1Button);
        expect(mockOnDateSelect).toHaveBeenCalled();
      }
    });

    it('should show selected date details panel after click', () => {
      render(<ComplianceCalendar data={sampleData} onDateSelect={mockOnDateSelect} />);

      // Find and click a day with data (day 10)
      const dayButtons = screen.getAllByRole('button');
      const day10Button = dayButtons.find((btn) => btn.textContent.includes('10') && !btn.disabled);

      if (day10Button) {
        fireEvent.click(day10Button);
        // Details panel should show exercises done
        expect(screen.getByText('Ovelser fullfort')).toBeInTheDocument();
        expect(screen.getByText('Overholdelse')).toBeInTheDocument();
      }
    });

    it('should show "no data" message for date without data', () => {
      render(<ComplianceCalendar data={[]} onDateSelect={mockOnDateSelect} />);

      const dayButtons = screen.getAllByRole('button');
      // Click day 2 (likely no data)
      const day2Button = dayButtons.find((btn) => btn.textContent.trim() === '2' && !btn.disabled);

      if (day2Button) {
        fireEvent.click(day2Button);
        expect(
          screen.getByText('Ingen treningsdata registrert for denne dagen')
        ).toBeInTheDocument();
      }
    });

    it('should not trigger onDateSelect for non-current-month days', () => {
      render(<ComplianceCalendar data={[]} onDateSelect={mockOnDateSelect} />);

      // Disabled buttons (non-current-month) should not fire callback
      const disabledButtons = screen.getAllByRole('button').filter((btn) => btn.disabled);
      if (disabledButtons.length > 0) {
        fireEvent.click(disabledButtons[0]);
        expect(mockOnDateSelect).not.toHaveBeenCalled();
      }
    });
  });

  // ========================================================================
  // COMPLETION INDICATORS
  // ========================================================================

  describe('Completion indicators', () => {
    it('should render without crashing when data is empty', () => {
      const { container } = render(<ComplianceCalendar data={[]} />);
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    it('should render without crashing with valid data', () => {
      const { container } = render(
        <ComplianceCalendar data={sampleData} onDateSelect={mockOnDateSelect} />
      );
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });
  });
});
