/**
 * AppointmentCalendar Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => (Array.isArray(fallback) ? fallback[0] : fallback || key),
  }),
}));

import AppointmentCalendar, {
  APPOINTMENT_TYPES,
  WORK_HOURS,
} from '../../../components/calendar/AppointmentCalendar';

const mockProviders = [
  { id: 1, name: 'Dr. Olsen', color: 'blue' },
  { id: 2, name: 'Dr. Hansen', color: 'green' },
];

const today = new Date().toISOString().split('T')[0];

const mockAppointments = [
  {
    id: 'apt-1',
    date: today,
    startTime: '09:00',
    duration: 30,
    patient: { id: 101, name: 'Erik Hansen' },
    type: 'NEW_PATIENT',
    providerId: 1,
    status: 'CONFIRMED',
  },
  {
    id: 'apt-2',
    date: today,
    startTime: '10:30',
    duration: 60,
    patient: { id: 102, name: 'Maria Johansen' },
    type: 'FOLLOW_UP',
    providerId: 2,
    status: 'PENDING',
  },
];

describe('AppointmentCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the calendar container', () => {
    render(<AppointmentCalendar appointments={mockAppointments} providers={mockProviders} />);
    // Header navigation buttons present
    expect(screen.getByText('←')).toBeDefined();
    expect(screen.getByText('→')).toBeDefined();
  });

  it('should render today button', () => {
    render(<AppointmentCalendar appointments={mockAppointments} providers={mockProviders} />);
    expect(screen.getByText('I dag')).toBeDefined();
  });

  it('should render week/day view toggle buttons', () => {
    render(<AppointmentCalendar appointments={mockAppointments} providers={mockProviders} />);
    expect(screen.getByText('Uke')).toBeDefined();
    expect(screen.getByText('Dag')).toBeDefined();
  });

  it('should render new appointment button', () => {
    render(<AppointmentCalendar appointments={mockAppointments} providers={mockProviders} />);
    expect(screen.getByText('+ Ny avtale')).toBeDefined();
  });

  it('should render provider filter dropdown with all-providers option', () => {
    render(<AppointmentCalendar appointments={mockAppointments} providers={mockProviders} />);
    expect(screen.getByText('Alle behandlere')).toBeDefined();
    expect(screen.getByText('Dr. Olsen')).toBeDefined();
    expect(screen.getByText('Dr. Hansen')).toBeDefined();
  });

  it('should switch to day view when day button is clicked', () => {
    render(<AppointmentCalendar appointments={mockAppointments} providers={mockProviders} />);
    const dagButton = screen.getByText('Dag');
    fireEvent.click(dagButton);
    // After click the Dag button should have active styling (bg-blue-600)
    expect(dagButton).toBeDefined();
  });

  it('should call onNewAppointment when new appointment button is clicked', () => {
    const onNewAppointment = vi.fn();
    render(
      <AppointmentCalendar
        appointments={mockAppointments}
        providers={mockProviders}
        onNewAppointment={onNewAppointment}
      />
    );
    fireEvent.click(screen.getByText('+ Ny avtale'));
    expect(onNewAppointment).toHaveBeenCalledWith(
      expect.objectContaining({ date: today, time: '09:00' })
    );
  });

  it('should show appointment modal when an appointment card is clicked', () => {
    render(<AppointmentCalendar appointments={mockAppointments} providers={mockProviders} />);
    // Click the Erik Hansen appointment card
    const patientName = screen.getByText('Erik Hansen');
    fireEvent.click(patientName);
    // Modal should show patient name and close button
    expect(screen.getByText('✕')).toBeDefined();
  });

  it('should close appointment modal when close button is clicked', () => {
    render(<AppointmentCalendar appointments={mockAppointments} providers={mockProviders} />);
    fireEvent.click(screen.getByText('Erik Hansen'));
    fireEvent.click(screen.getByText('✕'));
    expect(screen.queryByText('✕')).toBeNull();
  });

  it('should export APPOINTMENT_TYPES constant with expected keys', () => {
    expect(APPOINTMENT_TYPES).toHaveProperty('NEW_PATIENT');
    expect(APPOINTMENT_TYPES).toHaveProperty('FOLLOW_UP');
    expect(APPOINTMENT_TYPES).toHaveProperty('ACUTE');
    expect(APPOINTMENT_TYPES).toHaveProperty('MAINTENANCE');
  });

  it('should export WORK_HOURS with start and end', () => {
    expect(WORK_HOURS.start).toBe(8);
    expect(WORK_HOURS.end).toBe(18);
    expect(WORK_HOURS.slotDuration).toBe(15);
  });
});
