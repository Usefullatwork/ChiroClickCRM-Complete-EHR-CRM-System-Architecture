import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock i18n (CUSTOM - from ../../i18n, NOT react-i18next)
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
  formatDate: () => '15.03.2024',
  formatTime: () => '10:00',
}));

// Mock API
vi.mock('../../services/api', () => ({
  appointmentsAPI: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    cancel: vi.fn(),
    confirm: vi.fn(),
  },
}));

// Mock toast
vi.mock('../../utils/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    promise: vi.fn(),
  },
}));

// Mock ConfirmDialog
vi.mock('../../components/ui/ConfirmDialog', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));

// Mock skeleton components
vi.mock('../../components/ui/Skeleton', () => ({
  AppointmentsListSkeleton: () => <div data-testid="skeleton-loading">Loading appointments...</div>,
}));

// Mock LiveAppointmentBoard
vi.mock('../../components/appointments/LiveAppointmentBoard', () => ({
  default: () => <div data-testid="live-appointment-board">LiveAppointmentBoard</div>,
}));

import Appointments from '../../pages/Appointments';
import { appointmentsAPI } from '../../services/api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderWithProviders = (ui) => {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

const mockAppointments = [
  {
    id: 1,
    patient_id: 101,
    patient_name: 'Ola Nordmann',
    practitioner_name: 'Dr. Hansen',
    start_time: '2024-03-15T09:00:00Z',
    end_time: '2024-03-15T09:30:00Z',
    status: 'PENDING',
    notes: 'Første konsultasjon',
  },
  {
    id: 2,
    patient_id: 102,
    patient_name: 'Kari Hansen',
    practitioner_name: 'Dr. Berg',
    start_time: '2024-03-15T10:00:00Z',
    end_time: '2024-03-15T10:30:00Z',
    status: 'CONFIRMED',
    notes: '',
  },
  {
    id: 3,
    patient_id: 103,
    patient_name: 'Per Olsen',
    practitioner_name: null,
    start_time: '2024-03-15T11:00:00Z',
    end_time: '2024-03-15T11:30:00Z',
    status: 'CANCELLED',
    notes: 'Avbestilt av pasient',
  },
];

describe('Appointments Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    appointmentsAPI.getAll.mockResolvedValue({
      data: { appointments: mockAppointments },
    });
    appointmentsAPI.cancel.mockResolvedValue({ data: { success: true } });
    appointmentsAPI.confirm.mockResolvedValue({ data: { success: true } });
  });

  it('should render without crashing', async () => {
    renderWithProviders(<Appointments />);

    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  it('should show skeleton loading state initially', () => {
    appointmentsAPI.getAll.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithProviders(<Appointments />);

    expect(screen.getByTestId('skeleton-loading')).toBeInTheDocument();
  });

  it('should display the page heading', async () => {
    renderWithProviders(<Appointments />);

    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  it('should display new appointment button', async () => {
    renderWithProviders(<Appointments />);

    await waitFor(() => {
      expect(screen.getByTestId('appointments-new-button')).toBeInTheDocument();
    });
  });

  it('should navigate to new appointment page on button click', async () => {
    renderWithProviders(<Appointments />);

    await waitFor(() => {
      expect(screen.getByTestId('appointments-new-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('appointments-new-button'));
    expect(mockNavigate).toHaveBeenCalledWith('/appointments/new');
  });

  it('should display appointment list when data loads', async () => {
    renderWithProviders(<Appointments />);

    await waitFor(() => {
      expect(screen.getByTestId('appointments-list')).toBeInTheDocument();
    });

    const rows = screen.getAllByTestId('appointment-row');
    expect(rows).toHaveLength(3);
  });

  it('should display patient names in appointment rows', async () => {
    renderWithProviders(<Appointments />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
      expect(screen.getByText('Per Olsen')).toBeInTheDocument();
    });
  });

  it('should display appointment statuses', async () => {
    renderWithProviders(<Appointments />);

    await waitFor(() => {
      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
      expect(screen.getByText('CANCELLED')).toBeInTheDocument();
    });
  });

  it('should show empty state when no appointments', async () => {
    appointmentsAPI.getAll.mockResolvedValue({
      data: { appointments: [] },
    });

    renderWithProviders(<Appointments />);

    await waitFor(() => {
      expect(screen.getByText('noAppointmentsFound')).toBeInTheDocument();
      expect(screen.getByText('tryDifferentFilter')).toBeInTheDocument();
    });
  });

  it('should have date filter input', async () => {
    renderWithProviders(<Appointments />);

    await waitFor(() => {
      expect(screen.getByTestId('appointments-date-filter')).toBeInTheDocument();
    });
  });

  it('should have status filter select with all options', async () => {
    renderWithProviders(<Appointments />);

    await waitFor(() => {
      expect(screen.getByText('allStatuses')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('confirmed')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('cancelled')).toBeInTheDocument();
      expect(screen.getByText('noShow')).toBeInTheDocument();
    });
  });

  it('should show confirm button for PENDING appointments', async () => {
    renderWithProviders(<Appointments />);

    await waitFor(() => {
      expect(screen.getByText('confirm')).toBeInTheDocument();
    });
  });

  it('should show cancel button for non-terminal appointments', async () => {
    renderWithProviders(<Appointments />);

    await waitFor(() => {
      // PENDING and CONFIRMED both get cancel buttons; CANCELLED does not
      const cancelButtons = screen.getAllByText('cancel');
      expect(cancelButtons.length).toBe(2);
    });
  });

  it('should show view patient button for each appointment', async () => {
    renderWithProviders(<Appointments />);

    await waitFor(() => {
      const viewButtons = screen.getAllByText('viewPatient');
      expect(viewButtons).toHaveLength(3);
    });
  });

  it('should navigate to patient detail on view patient click', async () => {
    renderWithProviders(<Appointments />);

    await waitFor(() => {
      expect(screen.getAllByText('viewPatient').length).toBeGreaterThan(0);
    });

    const viewButtons = screen.getAllByText('viewPatient');
    fireEvent.click(viewButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/patients/101');
  });

  it('should toggle between list and board view', async () => {
    renderWithProviders(<Appointments />);

    await waitFor(() => {
      expect(screen.getByTestId('appointments-list')).toBeInTheDocument();
    });

    // Click board view button
    const boardButton = screen.getByText('Tavle');
    fireEvent.click(boardButton);

    await waitFor(() => {
      expect(screen.getByTestId('live-appointment-board')).toBeInTheDocument();
    });

    // Click list view button to go back
    const listButton = screen.getByText('Liste');
    fireEvent.click(listButton);

    await waitFor(() => {
      expect(screen.getByTestId('appointments-list')).toBeInTheDocument();
    });
  });

  it('should call API with date and status filter parameters', async () => {
    renderWithProviders(<Appointments />);

    await waitFor(() => {
      expect(appointmentsAPI.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          date: expect.any(String),
          status: '',
        })
      );
    });
  });

  it('should display appointment notes when present', async () => {
    renderWithProviders(<Appointments />);

    await waitFor(() => {
      expect(screen.getByText('Første konsultasjon')).toBeInTheDocument();
    });
  });
});
