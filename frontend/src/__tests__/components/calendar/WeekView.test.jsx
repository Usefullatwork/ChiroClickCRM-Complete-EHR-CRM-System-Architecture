/**
 * WeekView Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
}));

// Mock AppointmentCard
vi.mock('../../../components/calendar/AppointmentCard', () => ({
  default: ({ appointment, onClick, compact }) => (
    <div
      data-testid={`appointment-card-${appointment.id}`}
      data-compact={compact ? 'true' : 'false'}
      onClick={onClick}
    >
      {appointment.patient_name}
    </div>
  ),
}));

// Mock date-fns
vi.mock('date-fns', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    format: (date, fmt) => {
      if (date instanceof Date) {
        if (fmt === 'd') return String(date.getDate());
        if (fmt === 'yyyy-MM-dd') {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
        return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
      }
      return String(date);
    },
    isToday: (date) => {
      const now = new Date();
      return (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    },
  };
});

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Clock: () => <svg data-testid="clock-icon" />,
  User: () => <svg data-testid="user-icon" />,
  CheckCircle: () => <svg data-testid="check-circle-icon" />,
  AlertCircle: () => <svg data-testid="alert-circle-icon" />,
  XCircle: () => <svg data-testid="x-circle-icon" />,
  Phone: () => <svg data-testid="phone-icon" />,
  Video: () => <svg data-testid="video-icon" />,
}));

import WeekView from '../../../components/calendar/WeekView';

// =============================================================================
// TEST HELPERS
// =============================================================================

const workHours = { start: 8, end: 18 };

const typeColors = {
  FOLLOWUP: {
    border: 'border-green-500',
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Oppfolging',
  },
  INITIAL: {
    border: 'border-blue-500',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: 'Ny pasient',
  },
};

const statusColors = {
  SCHEDULED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Planlagt' },
  CONFIRMED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Bekreftet' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Avlyst' },
  NO_SHOW: { bg: 'bg-gray-200', text: 'text-gray-600', label: 'Ikke mott' },
};

// Build a Monday-Sunday week starting from a fixed date
const makeWeekDates = () => {
  const monday = new Date(2026, 2, 16); // March 16, 2026 (Monday)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

const weekDates = makeWeekDates();

const buildISO = (date, hour, minute = 0) => {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const mondayKey = '2026-03-16';
const tuesdayKey = '2026-03-17';

const mockAppointments = {
  [mondayKey]: [
    {
      id: 'apt-1',
      patient_name: 'Erik Hansen',
      start_time: buildISO(weekDates[0], 9, 0),
      end_time: buildISO(weekDates[0], 10, 0),
      appointment_type: 'FOLLOWUP',
      status: 'CONFIRMED',
    },
  ],
  [tuesdayKey]: [
    {
      id: 'apt-2',
      patient_name: 'Maria Johansen',
      start_time: buildISO(weekDates[1], 11, 0),
      end_time: buildISO(weekDates[1], 12, 0),
      appointment_type: 'INITIAL',
      status: 'SCHEDULED',
    },
  ],
};

describe('WeekView', () => {
  const onSlotClick = vi.fn();
  const onAppointmentClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner when isLoading is true', () => {
    render(
      <WeekView
        weekDates={weekDates}
        appointments={{}}
        workHours={workHours}
        onSlotClick={onSlotClick}
        onAppointmentClick={onAppointmentClick}
        typeColors={typeColors}
        statusColors={statusColors}
        isLoading={true}
      />
    );
    expect(screen.getByText('Laster kalender...')).toBeDefined();
  });

  it('should render all 7 day columns with day numbers', () => {
    render(
      <WeekView
        weekDates={weekDates}
        appointments={{}}
        workHours={workHours}
        onSlotClick={onSlotClick}
        onAppointmentClick={onAppointmentClick}
        typeColors={typeColors}
        statusColors={statusColors}
        isLoading={false}
      />
    );
    // Each day column renders the day number via format(date, 'd')
    expect(screen.getByText('16')).toBeDefined(); // Monday
    expect(screen.getByText('17')).toBeDefined(); // Tuesday
    expect(screen.getByText('18')).toBeDefined(); // Wednesday
    expect(screen.getByText('19')).toBeDefined(); // Thursday
    expect(screen.getByText('20')).toBeDefined(); // Friday
    expect(screen.getByText('21')).toBeDefined(); // Saturday
    expect(screen.getByText('22')).toBeDefined(); // Sunday
  });

  it('should render Norwegian day name abbreviations', () => {
    render(
      <WeekView
        weekDates={weekDates}
        appointments={{}}
        workHours={workHours}
        onSlotClick={onSlotClick}
        onAppointmentClick={onAppointmentClick}
        typeColors={typeColors}
        statusColors={statusColors}
        isLoading={false}
      />
    );
    expect(screen.getByText('Man')).toBeDefined();
    expect(screen.getByText('Tir')).toBeDefined();
    expect(screen.getByText('Ons')).toBeDefined();
    expect(screen.getByText('Tor')).toBeDefined();
    expect(screen.getByText('Fre')).toBeDefined();
    expect(screen.getByText('Lor')).toBeDefined();
    expect(screen.getByText('Son')).toBeDefined();
  });

  it('should render time labels in the time column', () => {
    render(
      <WeekView
        weekDates={weekDates}
        appointments={{}}
        workHours={workHours}
        onSlotClick={onSlotClick}
        onAppointmentClick={onAppointmentClick}
        typeColors={typeColors}
        statusColors={statusColors}
        isLoading={false}
      />
    );
    expect(screen.getByText('08:00')).toBeDefined();
    expect(screen.getByText('09:00')).toBeDefined();
    expect(screen.getByText('12:00')).toBeDefined();
    expect(screen.getByText('17:00')).toBeDefined();
  });

  it('should render appointment cards in correct day columns', () => {
    render(
      <WeekView
        weekDates={weekDates}
        appointments={mockAppointments}
        workHours={workHours}
        onSlotClick={onSlotClick}
        onAppointmentClick={onAppointmentClick}
        typeColors={typeColors}
        statusColors={statusColors}
        isLoading={false}
      />
    );
    expect(screen.getByTestId('appointment-card-apt-1')).toBeDefined();
    expect(screen.getByTestId('appointment-card-apt-2')).toBeDefined();
    expect(screen.getByText('Erik Hansen')).toBeDefined();
    expect(screen.getByText('Maria Johansen')).toBeDefined();
  });

  it('should call onAppointmentClick when an appointment card is clicked', () => {
    render(
      <WeekView
        weekDates={weekDates}
        appointments={mockAppointments}
        workHours={workHours}
        onSlotClick={onSlotClick}
        onAppointmentClick={onAppointmentClick}
        typeColors={typeColors}
        statusColors={statusColors}
        isLoading={false}
      />
    );
    fireEvent.click(screen.getByTestId('appointment-card-apt-1'));
    expect(onAppointmentClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'apt-1', patient_name: 'Erik Hansen' })
    );
  });

  it('should filter out CANCELLED and NO_SHOW appointments', () => {
    const aptsWithCancelled = {
      [mondayKey]: [
        ...mockAppointments[mondayKey],
        {
          id: 'apt-cancelled',
          patient_name: 'Cancelled Person',
          start_time: buildISO(weekDates[0], 14, 0),
          end_time: buildISO(weekDates[0], 14, 30),
          appointment_type: 'FOLLOWUP',
          status: 'CANCELLED',
        },
        {
          id: 'apt-noshow',
          patient_name: 'No Show Person',
          start_time: buildISO(weekDates[0], 15, 0),
          end_time: buildISO(weekDates[0], 15, 30),
          appointment_type: 'FOLLOWUP',
          status: 'NO_SHOW',
        },
      ],
    };
    render(
      <WeekView
        weekDates={weekDates}
        appointments={aptsWithCancelled}
        workHours={workHours}
        onSlotClick={onSlotClick}
        onAppointmentClick={onAppointmentClick}
        typeColors={typeColors}
        statusColors={statusColors}
        isLoading={false}
      />
    );
    expect(screen.queryByTestId('appointment-card-apt-cancelled')).toBeNull();
    expect(screen.queryByTestId('appointment-card-apt-noshow')).toBeNull();
    // But the valid one is still there
    expect(screen.getByTestId('appointment-card-apt-1')).toBeDefined();
  });

  it('should render empty columns for days with no appointments', () => {
    render(
      <WeekView
        weekDates={weekDates}
        appointments={{}}
        workHours={workHours}
        onSlotClick={onSlotClick}
        onAppointmentClick={onAppointmentClick}
        typeColors={typeColors}
        statusColors={statusColors}
        isLoading={false}
      />
    );
    // No appointment cards should exist
    expect(screen.queryByTestId(/^appointment-card-/)).toBeNull();
    // But all day columns with day numbers should be present
    expect(screen.getByText('16')).toBeDefined();
    expect(screen.getByText('22')).toBeDefined();
  });
});
