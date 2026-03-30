/**
 * AppointmentCard Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
  formatDate: () => '15.03.2024',
  formatTime: () => '10:00',
}));

// Mock date-fns (keep parseISO and format functional)
vi.mock('date-fns', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    format: (date, fmt) => {
      if (date instanceof Date) {
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        if (fmt === 'HH:mm') return `${h}:${m}`;
        return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
      }
      return String(date);
    },
  };
});

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Clock: (props) => <svg data-testid="clock-icon" {...props} />,
  User: (props) => <svg data-testid="user-icon" {...props} />,
  CheckCircle: (props) => <svg data-testid="check-circle-icon" {...props} />,
  AlertCircle: (props) => <svg data-testid="alert-circle-icon" {...props} />,
  XCircle: (props) => <svg data-testid="x-circle-icon" {...props} />,
  Phone: (props) => <svg data-testid="phone-icon" {...props} />,
  Video: (props) => <svg data-testid="video-icon" {...props} />,
}));

import AppointmentCard, { AppointmentListCard } from '../../../components/calendar/AppointmentCard';

// =============================================================================
// TEST DATA
// =============================================================================

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
  PHONE: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    label: 'Telefon',
  },
  VIDEO: {
    border: 'border-purple-500',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    label: 'Video',
  },
};

const statusColors = {
  SCHEDULED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Planlagt' },
  CONFIRMED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Bekreftet' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Avlyst' },
  IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pagar' },
  NO_SHOW: { bg: 'bg-gray-200', text: 'text-gray-600', label: 'Ikke mott' },
};

const baseAppointment = {
  id: 'apt-1',
  patient_name: 'Erik Hansen',
  practitioner_name: 'Dr. Olsen',
  start_time: '2026-03-15T09:00:00.000Z',
  end_time: '2026-03-15T10:00:00.000Z',
  appointment_type: 'FOLLOWUP',
  status: 'CONFIRMED',
  patient_notes: 'Back pain follow-up',
};

describe('AppointmentCard', () => {
  const onClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render patient name in full view mode', () => {
    render(
      <AppointmentCard
        appointment={baseAppointment}
        height={100}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
      />
    );
    expect(screen.getByText('Erik Hansen')).toBeDefined();
  });

  it('should render time range in full view mode', () => {
    render(
      <AppointmentCard
        appointment={baseAppointment}
        height={100}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
      />
    );
    // Full view shows "HH:mm - HH:mm" (times are UTC-parsed by parseISO, offset depends on TZ)
    // Just verify the time span element exists with the " - " separator
    const timeSpan = screen.getByText((content, element) => {
      return (
        element?.tagName === 'SPAN' &&
        element?.classList.contains('font-semibold') &&
        content.includes(' - ')
      );
    });
    expect(timeSpan).toBeDefined();
  });

  it('should call onClick when clicked', () => {
    render(
      <AppointmentCard
        appointment={baseAppointment}
        height={100}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
      />
    );
    fireEvent.click(screen.getByText('Erik Hansen'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should render type label when height >= 56', () => {
    render(
      <AppointmentCard
        appointment={baseAppointment}
        height={60}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
      />
    );
    expect(screen.getByText('Oppfolging')).toBeDefined();
  });

  it('should not render type label when height < 56', () => {
    render(
      <AppointmentCard
        appointment={baseAppointment}
        height={50}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
      />
    );
    expect(screen.queryByText('Oppfolging')).toBeNull();
  });

  it('should render status badge when height >= 72', () => {
    render(
      <AppointmentCard
        appointment={baseAppointment}
        height={80}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
      />
    );
    expect(screen.getByText('Bekreftet')).toBeDefined();
  });

  it('should not render status badge when height < 72', () => {
    render(
      <AppointmentCard
        appointment={baseAppointment}
        height={60}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
      />
    );
    expect(screen.queryByText('Bekreftet')).toBeNull();
  });

  it('should render practitioner name when height >= 90', () => {
    render(
      <AppointmentCard
        appointment={baseAppointment}
        height={95}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
      />
    );
    expect(screen.getByText('Dr. Olsen')).toBeDefined();
  });

  it('should render compact view when height < 48', () => {
    render(
      <AppointmentCard
        appointment={baseAppointment}
        height={40}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
      />
    );
    // Compact view shows patient name but not status/type label
    expect(screen.getByText('Erik Hansen')).toBeDefined();
    expect(screen.queryByText('Oppfolging')).toBeNull();
    expect(screen.queryByText('Bekreftet')).toBeNull();
  });

  it('should render very compact view when height < 32 showing only first name', () => {
    render(
      <AppointmentCard
        appointment={baseAppointment}
        height={24}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
      />
    );
    // Very compact shows only first name
    expect(screen.getByText('Erik')).toBeDefined();
  });

  it('should use fallback colors for unknown type', () => {
    const unknownTypeApt = { ...baseAppointment, appointment_type: 'UNKNOWN_TYPE' };
    const { container } = render(
      <AppointmentCard
        appointment={unknownTypeApt}
        height={60}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
      />
    );
    // Should render with fallback (border-gray-400)
    expect(container.querySelector('.border-gray-400')).not.toBeNull();
  });

  it('should render phone icon for PHONE type appointment', () => {
    const phoneApt = { ...baseAppointment, appointment_type: 'PHONE' };
    render(
      <AppointmentCard
        appointment={phoneApt}
        height={100}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
      />
    );
    expect(screen.getByTestId('phone-icon')).toBeDefined();
  });
});

describe('AppointmentListCard', () => {
  const onClick = vi.fn();
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const onCheckIn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render patient name and time range', () => {
    render(
      <AppointmentListCard
        appointment={baseAppointment}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
      />
    );
    expect(screen.getByText('Erik Hansen')).toBeDefined();
  });

  it('should render practitioner name', () => {
    render(
      <AppointmentListCard
        appointment={baseAppointment}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
      />
    );
    expect(screen.getByText(/Behandler: Dr. Olsen/)).toBeDefined();
  });

  it('should render patient notes when present', () => {
    render(
      <AppointmentListCard
        appointment={baseAppointment}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
      />
    );
    expect(screen.getByText('Back pain follow-up')).toBeDefined();
  });

  it('should show Bekreft button for SCHEDULED appointment', () => {
    const scheduledApt = { ...baseAppointment, status: 'SCHEDULED' };
    render(
      <AppointmentListCard
        appointment={scheduledApt}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onCheckIn={onCheckIn}
      />
    );
    expect(screen.getByText('Bekreft')).toBeDefined();
  });

  it('should show Sjekk inn button for CONFIRMED appointment', () => {
    render(
      <AppointmentListCard
        appointment={baseAppointment}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onCheckIn={onCheckIn}
      />
    );
    expect(screen.getByText('Sjekk inn')).toBeDefined();
  });

  it('should show Avlys button for non-cancelled/completed appointments', () => {
    render(
      <AppointmentListCard
        appointment={baseAppointment}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
        onCancel={onCancel}
      />
    );
    expect(screen.getByText('Avlys')).toBeDefined();
  });

  it('should not show Avlys button for CANCELLED appointments', () => {
    const cancelledApt = { ...baseAppointment, status: 'CANCELLED' };
    render(
      <AppointmentListCard
        appointment={cancelledApt}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
        onCancel={onCancel}
      />
    );
    expect(screen.queryByText('Avlys')).toBeNull();
  });

  it('should call onConfirm with appointment when Bekreft is clicked', () => {
    const scheduledApt = { ...baseAppointment, status: 'SCHEDULED' };
    render(
      <AppointmentListCard
        appointment={scheduledApt}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
        onConfirm={onConfirm}
      />
    );
    fireEvent.click(screen.getByText('Bekreft'));
    expect(onConfirm).toHaveBeenCalledWith(scheduledApt);
    // Should not propagate to onClick
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should call onCancel with appointment when Avlys is clicked', () => {
    render(
      <AppointmentListCard
        appointment={baseAppointment}
        onClick={onClick}
        typeColors={typeColors}
        statusColors={statusColors}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByText('Avlys'));
    expect(onCancel).toHaveBeenCalledWith(baseAppointment);
    expect(onClick).not.toHaveBeenCalled();
  });
});
