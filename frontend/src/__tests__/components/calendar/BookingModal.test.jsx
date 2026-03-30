/**
 * BookingModal Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
}));

// Mock services/api
vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  patientsAPI: { search: vi.fn().mockResolvedValue({ data: { patients: [] } }) },
}));

// Mock utils/toast
vi.mock('../../../utils/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    promise: vi.fn(),
  },
}));

// Mock ConfirmDialog
const mockConfirm = vi.fn().mockResolvedValue(true);
vi.mock('../../../components/ui/ConfirmDialog', () => ({
  useConfirm: () => mockConfirm,
}));

// Mock date-fns
vi.mock('date-fns', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    format: (date, fmt) => {
      if (date instanceof Date) {
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        if (fmt === 'HH:mm') return `${h}:${m}`;
        if (fmt === 'yyyy-MM-dd') {
          const y = date.getFullYear();
          const mo = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          return `${y}-${mo}-${d}`;
        }
        return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
      }
      return String(date);
    },
  };
});

// Mock date-fns locale
vi.mock('date-fns/locale', () => ({
  nb: {
    code: 'nb',
    localize: {
      month: (n) =>
        ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'][n],
      day: (n) => ['son', 'man', 'tir', 'ons', 'tor', 'fre', 'lor'][n],
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
  X: (props) => <svg data-testid="x-icon" {...props} />,
  Search: (props) => <svg data-testid="search-icon" {...props} />,
  User: (props) => <svg data-testid="user-icon" {...props} />,
  Calendar: (props) => <svg data-testid="calendar-icon" {...props} />,
  Clock: (props) => <svg data-testid="clock-icon" {...props} />,
  AlertTriangle: (props) => <svg data-testid="alert-triangle-icon" {...props} />,
  CheckCircle: (props) => <svg data-testid="check-circle-icon" {...props} />,
  Loader2: (props) => <svg data-testid="loader-icon" {...props} />,
  Trash2: (props) => <svg data-testid="trash-icon" {...props} />,
}));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BookingModal from '../../../components/calendar/BookingModal';

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithProviders = (ui) => {
  const qc = createQueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

// =============================================================================
// TEST DATA
// =============================================================================

const practitioners = [
  { id: 'p1', first_name: 'Dr.', last_name: 'Olsen' },
  { id: 'p2', first_name: 'Dr.', last_name: 'Hansen' },
];

const typeOptions = {
  FOLLOWUP: { label: 'Oppfolging' },
  INITIAL: { label: 'Ny pasient' },
  REASSESSMENT: { label: 'Revurdering' },
  PHONE: { label: 'Telefon' },
};

const initialSlot = {
  date: '2026-03-16',
  time: '09:00',
};

const editingAppointment = {
  id: 'apt-edit-1',
  patient_id: 101,
  patient_name: 'Erik Hansen',
  patient_phone: '12345678',
  practitioner_id: 'p1',
  start_time: '2026-03-16T09:00:00.000Z',
  end_time: '2026-03-16T10:00:00.000Z',
  appointment_type: 'FOLLOWUP',
  status: 'CONFIRMED',
  patient_notes: 'Test notes',
};

describe('BookingModal', () => {
  const onClose = vi.fn();
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null when isOpen is false', () => {
    const { container } = renderWithProviders(
      <BookingModal
        isOpen={false}
        onClose={onClose}
        initialSlot={initialSlot}
        practitioners={practitioners}
        existingAppointments={[]}
        onSubmit={onSubmit}
        typeOptions={typeOptions}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('should render the modal with "Ny avtale" title for new appointments', () => {
    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={onClose}
        initialSlot={initialSlot}
        practitioners={practitioners}
        existingAppointments={[]}
        onSubmit={onSubmit}
        typeOptions={typeOptions}
      />
    );
    expect(screen.getByText('Ny avtale')).toBeDefined();
  });

  it('should render the modal with "Rediger avtale" title when editing', () => {
    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={onClose}
        editingAppointment={editingAppointment}
        practitioners={practitioners}
        existingAppointments={[]}
        onSubmit={onSubmit}
        onCancel={onCancel}
        typeOptions={typeOptions}
      />
    );
    expect(screen.getByText('Rediger avtale')).toBeDefined();
  });

  it('should render practitioner select with all practitioners', () => {
    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={onClose}
        initialSlot={initialSlot}
        practitioners={practitioners}
        existingAppointments={[]}
        onSubmit={onSubmit}
        typeOptions={typeOptions}
      />
    );
    expect(screen.getByText('Velg behandler')).toBeDefined();
    expect(screen.getByText('Dr. Olsen')).toBeDefined();
    expect(screen.getByText('Dr. Hansen')).toBeDefined();
  });

  it('should render appointment type options', () => {
    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={onClose}
        initialSlot={initialSlot}
        practitioners={practitioners}
        existingAppointments={[]}
        onSubmit={onSubmit}
        typeOptions={typeOptions}
      />
    );
    expect(screen.getByText('Oppfolging')).toBeDefined();
    expect(screen.getByText('Ny pasient')).toBeDefined();
    expect(screen.getByText('Telefon')).toBeDefined();
  });

  it('should render duration select with all options', () => {
    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={onClose}
        initialSlot={initialSlot}
        practitioners={practitioners}
        existingAppointments={[]}
        onSubmit={onSubmit}
        typeOptions={typeOptions}
      />
    );
    expect(screen.getByText('15 min')).toBeDefined();
    expect(screen.getByText('30 min')).toBeDefined();
    expect(screen.getByText('45 min')).toBeDefined();
    expect(screen.getByText('1 time')).toBeDefined();
  });

  it('should render Norwegian form labels', () => {
    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={onClose}
        initialSlot={initialSlot}
        practitioners={practitioners}
        existingAppointments={[]}
        onSubmit={onSubmit}
        typeOptions={typeOptions}
      />
    );
    expect(screen.getByText('Pasient *')).toBeDefined();
    expect(screen.getByText('Behandler *')).toBeDefined();
    expect(screen.getByText('Notater')).toBeDefined();
  });

  it('should render patient search input placeholder', () => {
    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={onClose}
        initialSlot={initialSlot}
        practitioners={practitioners}
        existingAppointments={[]}
        onSubmit={onSubmit}
        typeOptions={typeOptions}
      />
    );
    expect(
      screen.getByPlaceholderText('S\u00f8k etter pasient (navn, telefon, e-post)...')
    ).toBeDefined();
  });

  it('should call onClose when Avbryt button is clicked', () => {
    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={onClose}
        initialSlot={initialSlot}
        practitioners={practitioners}
        existingAppointments={[]}
        onSubmit={onSubmit}
        typeOptions={typeOptions}
      />
    );
    // There are two Avbryt buttons (close X and text button), click the text one
    const cancelButtons = screen.getAllByText('Avbryt');
    fireEvent.click(cancelButtons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should disable submit button when no patient is selected', () => {
    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={onClose}
        initialSlot={initialSlot}
        practitioners={practitioners}
        existingAppointments={[]}
        onSubmit={onSubmit}
        typeOptions={typeOptions}
      />
    );
    const submitButton = screen.getByText('Opprett avtale');
    expect(submitButton.disabled).toBe(true);
  });

  it('should show "Lagre endringer" button text when editing', () => {
    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={onClose}
        editingAppointment={editingAppointment}
        practitioners={practitioners}
        existingAppointments={[]}
        onSubmit={onSubmit}
        onCancel={onCancel}
        typeOptions={typeOptions}
      />
    );
    expect(screen.getByText('Lagre endringer')).toBeDefined();
  });

  it('should show cancel appointment button when editing a non-cancelled appointment', () => {
    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={onClose}
        editingAppointment={editingAppointment}
        practitioners={practitioners}
        existingAppointments={[]}
        onSubmit={onSubmit}
        onCancel={onCancel}
        typeOptions={typeOptions}
      />
    );
    expect(screen.getByText('Avlys denne avtalen')).toBeDefined();
  });

  it('should not show cancel appointment button for already cancelled appointments', () => {
    const cancelledApt = { ...editingAppointment, status: 'CANCELLED' };
    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={onClose}
        editingAppointment={cancelledApt}
        practitioners={practitioners}
        existingAppointments={[]}
        onSubmit={onSubmit}
        onCancel={onCancel}
        typeOptions={typeOptions}
      />
    );
    expect(screen.queryByText('Avlys denne avtalen')).toBeNull();
  });

  it('should show cancellation form when "Avlys denne avtalen" is clicked', () => {
    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={onClose}
        editingAppointment={editingAppointment}
        practitioners={practitioners}
        existingAppointments={[]}
        onSubmit={onSubmit}
        onCancel={onCancel}
        typeOptions={typeOptions}
      />
    );
    fireEvent.click(screen.getByText('Avlys denne avtalen'));
    expect(screen.getByText('Avlys avtale')).toBeDefined();
    expect(screen.getByText('Bekreft avlysning')).toBeDefined();
  });

  it('should show no-conflict message when practitioner, date and time are set with no conflicts', () => {
    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={onClose}
        initialSlot={initialSlot}
        practitioners={practitioners}
        existingAppointments={[]}
        onSubmit={onSubmit}
        typeOptions={typeOptions}
      />
    );
    // The initial slot sets date and time but practitioner defaults to first
    // With the initialSlot prop, date and time are set; practitioner is set from practitioners[0]
    expect(screen.getByText('Ingen tidskonflikter')).toBeDefined();
  });

  it('should populate form fields when editing an existing appointment', () => {
    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={onClose}
        editingAppointment={editingAppointment}
        practitioners={practitioners}
        existingAppointments={[]}
        onSubmit={onSubmit}
        onCancel={onCancel}
        typeOptions={typeOptions}
      />
    );
    // Patient should be shown in selected state
    expect(screen.getByText('Erik Hansen')).toBeDefined();
    // Notes should be populated
    const notesTextarea = screen.getByPlaceholderText('Eventuell informasjon om avtalen...');
    expect(notesTextarea.value).toBe('Test notes');
  });
});
