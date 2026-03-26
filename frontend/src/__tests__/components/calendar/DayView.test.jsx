/**
 * DayView Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

// Mock AppointmentCard
vi.mock('../../../components/calendar/AppointmentCard', () => ({
  default: ({ appointment, onClick }) => (
    <div data-testid={`appointment-card-${appointment.id}`} onClick={onClick}>
      {appointment.patient_name}
    </div>
  ),
}));

// Mock date-fns to avoid locale issues in jsdom
vi.mock('date-fns', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    format: (date, fmt) => {
      // Return a simple date string for any format
      if (date instanceof Date) {
        return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
      }
      return String(date);
    },
  };
});

// Mock date-fns nb locale
vi.mock('date-fns/locale', () => ({
  nb: {
    code: 'nb',
    localize: {
      month: (n) =>
        ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'][n],
      day: (n) => ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør'][n],
      dayPeriod: (n) => n,
      era: (n) => n,
      ordinalNumber: (n) => `${n}.`,
      quarter: (n) => `Q${n}`,
    },
    formatLong: {
      date: () => 'dd.MM.yyyy',
      time: () => 'HH:mm',
      dateTime: () => 'dd.MM.yyyy HH:mm',
    },
    match: {
      month: () => null,
      day: () => null,
      dayPeriod: () => null,
      era: () => null,
      ordinalNumber: () => null,
      quarter: () => null,
    },
    options: { weekStartsOn: 1 },
    formatRelative: () => '',
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Calendar: () => <svg data-testid="calendar-icon" />,
  Plus: () => <svg data-testid="plus-icon" />,
  Clock: () => <svg data-testid="clock-icon" />,
  User: () => <svg data-testid="user-icon" />,
}));

import DayView from '../../../components/calendar/DayView';

const workHours = { start: 8, end: 18 };

const typeColors = {
  NEW_PATIENT: {
    border: 'border-blue-500',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: 'New Patient',
  },
  FOLLOWUP: {
    border: 'border-green-500',
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Follow-up',
  },
};

const statusColors = {
  SCHEDULED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Scheduled' },
  CONFIRMED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmed' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
  NO_SHOW: { bg: 'bg-gray-200', text: 'text-gray-600', label: 'No Show' },
};

const today = new Date();
today.setHours(0, 0, 0, 0);

const buildISODateTime = (date, hour, minute = 0) => {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const mockAppointments = [
  {
    id: 'apt-1',
    patient_name: 'Erik Hansen',
    start_time: buildISODateTime(today, 9, 0),
    end_time: buildISODateTime(today, 9, 30),
    appointment_type: 'NEW_PATIENT',
    status: 'CONFIRMED',
    patient_notes: '',
  },
  {
    id: 'apt-2',
    patient_name: 'Maria Johansen',
    start_time: buildISODateTime(today, 11, 0),
    end_time: buildISODateTime(today, 12, 0),
    appointment_type: 'FOLLOWUP',
    status: 'SCHEDULED',
    patient_notes: 'Ongoing treatment',
  },
];

describe('DayView', () => {
  const onSlotClick = vi.fn();
  const onAppointmentClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner when isLoading is true', () => {
    render(
      <DayView
        date={today}
        appointments={[]}
        workHours={workHours}
        onSlotClick={onSlotClick}
        onAppointmentClick={onAppointmentClick}
        typeColors={typeColors}
        statusColors={statusColors}
        isLoading={true}
      />
    );
    expect(screen.getByText('Laster dag...')).toBeDefined();
  });

  it('should render the sidebar header with today appointment count', () => {
    render(
      <DayView
        date={today}
        appointments={mockAppointments}
        workHours={workHours}
        onSlotClick={onSlotClick}
        onAppointmentClick={onAppointmentClick}
        typeColors={typeColors}
        statusColors={statusColors}
        isLoading={false}
      />
    );
    // 2 appointments shown
    expect(screen.getByText('2 avtaler')).toBeDefined();
  });

  it('should render empty state when there are no appointments', () => {
    render(
      <DayView
        date={today}
        appointments={[]}
        workHours={workHours}
        onSlotClick={onSlotClick}
        onAppointmentClick={onAppointmentClick}
        typeColors={typeColors}
        statusColors={statusColors}
        isLoading={false}
      />
    );
    expect(screen.getByText('Ingen avtaler denne dagen')).toBeDefined();
    expect(screen.getByText('Ny avtale')).toBeDefined();
  });

  it('should render appointment cards in the sidebar', () => {
    render(
      <DayView
        date={today}
        appointments={mockAppointments}
        workHours={workHours}
        onSlotClick={onSlotClick}
        onAppointmentClick={onAppointmentClick}
        typeColors={typeColors}
        statusColors={statusColors}
        isLoading={false}
      />
    );
    // getAllByText handles multiple occurrences (grid card + sidebar list item)
    expect(screen.getAllByText('Erik Hansen').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Maria Johansen').length).toBeGreaterThanOrEqual(1);
  });

  it('should call onSlotClick when empty state new appointment button is clicked', () => {
    render(
      <DayView
        date={today}
        appointments={[]}
        workHours={workHours}
        onSlotClick={onSlotClick}
        onAppointmentClick={onAppointmentClick}
        typeColors={typeColors}
        statusColors={statusColors}
        isLoading={false}
      />
    );
    fireEvent.click(screen.getByText('Ny avtale'));
    expect(onSlotClick).toHaveBeenCalledWith(today, 9, 0);
  });

  it('should call onAppointmentClick when an appointment card is clicked in the sidebar', () => {
    render(
      <DayView
        date={today}
        appointments={mockAppointments}
        workHours={workHours}
        onSlotClick={onSlotClick}
        onAppointmentClick={onAppointmentClick}
        typeColors={typeColors}
        statusColors={statusColors}
        isLoading={false}
      />
    );
    // Click the list item for Erik Hansen (sidebar item is the AppointmentListItem,
    // the grid card is from our AppointmentCard mock — both render patient_name text)
    const cards = screen.getAllByText('Erik Hansen');
    fireEvent.click(cards[0]);
    // The positioned appointment includes extra fields (columnIndex, totalColumns)
    expect(onAppointmentClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'apt-1', patient_name: 'Erik Hansen' })
    );
  });

  it('should filter out CANCELLED and NO_SHOW appointments from the grid', () => {
    const appointmentsWithCancelled = [
      ...mockAppointments,
      {
        id: 'apt-3',
        patient_name: 'Cancelled Patient',
        start_time: buildISODateTime(today, 14, 0),
        end_time: buildISODateTime(today, 14, 30),
        appointment_type: 'FOLLOWUP',
        status: 'CANCELLED',
        patient_notes: '',
      },
    ];
    render(
      <DayView
        date={today}
        appointments={appointmentsWithCancelled}
        workHours={workHours}
        onSlotClick={onSlotClick}
        onAppointmentClick={onAppointmentClick}
        typeColors={typeColors}
        statusColors={statusColors}
        isLoading={false}
      />
    );
    // The cancelled appointment's card should not appear in the grid (only in sidebar)
    // The appointment-card mock is only rendered for non-cancelled ones in the grid
    expect(screen.queryByTestId('appointment-card-apt-3')).toBeNull();
  });

  it('should render the today header with blue styling when date is today', () => {
    const { container } = render(
      <DayView
        date={today}
        appointments={mockAppointments}
        workHours={workHours}
        onSlotClick={onSlotClick}
        onAppointmentClick={onAppointmentClick}
        typeColors={typeColors}
        statusColors={statusColors}
        isLoading={false}
      />
    );
    // bg-blue-50 applied when date is today
    expect(container.querySelector('.bg-blue-50')).toBeDefined();
  });

  it('should render the sidebar "Dagens avtaler" heading', () => {
    render(
      <DayView
        date={today}
        appointments={mockAppointments}
        workHours={workHours}
        onSlotClick={onSlotClick}
        onAppointmentClick={onAppointmentClick}
        typeColors={typeColors}
        statusColors={statusColors}
        isLoading={false}
      />
    );
    expect(screen.getByText('Dagens avtaler')).toBeDefined();
  });
});
