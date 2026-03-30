/**
 * PortalAppointments Page Tests
 * Tests for patient appointment management portal page
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock patientPortalAPI
vi.mock('../../../services/api', () => ({
  patientPortalAPI: {
    getAppointments: vi.fn(),
    cancelAppointment: vi.fn(),
    requestAppointment: vi.fn(),
    rescheduleAppointment: vi.fn(),
    getAvailableSlots: vi.fn(),
  },
  default: { get: vi.fn(), post: vi.fn() },
}));

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import PortalAppointments from '../../../pages/portal/PortalAppointments';
import { patientPortalAPI } from '../../../services/api';

const renderPage = () =>
  render(
    <BrowserRouter>
      <PortalAppointments />
    </BrowserRouter>
  );

// Future date for upcoming appointments
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 7);
const futureDateISO = futureDate.toISOString();

// Past date for past appointments
const pastDate = new Date();
pastDate.setDate(pastDate.getDate() - 14);
const pastDateISO = pastDate.toISOString();

const mockUpcomingAppointments = [
  {
    id: 'apt-1',
    appointment_date: futureDateISO,
    appointment_time: '10:00:00',
    visit_type: 'follow_up',
    status: 'scheduled',
  },
  {
    id: 'apt-2',
    appointment_date: futureDateISO,
    appointment_time: '14:30:00',
    visit_type: 'consultation',
    status: 'confirmed',
  },
];

const mockPastAppointments = [
  {
    id: 'apt-3',
    appointment_date: pastDateISO,
    appointment_time: '09:00:00',
    visit_type: 'initial',
    status: 'completed',
  },
];

const allAppointments = [...mockUpcomingAppointments, ...mockPastAppointments];

describe('PortalAppointments Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patientPortalAPI.getAppointments.mockResolvedValue({
      data: { appointments: allAppointments },
    });
    patientPortalAPI.cancelAppointment.mockResolvedValue({ data: { success: true } });
    patientPortalAPI.requestAppointment.mockResolvedValue({ data: { success: true } });
    patientPortalAPI.rescheduleAppointment.mockResolvedValue({ data: { success: true } });
    patientPortalAPI.getAvailableSlots.mockResolvedValue({
      data: {
        slots: [
          { time: '09:00', available: true },
          { time: '10:00', available: true },
        ],
      },
    });
  });

  it('should render loading state initially', () => {
    patientPortalAPI.getAppointments.mockImplementation(() => new Promise(() => {}));
    renderPage();
    // Loading spinner is shown (Loader2 element present, no header yet)
    expect(screen.queryByText('portalMyAppointments')).not.toBeInTheDocument();
  });

  it('should render page title after loading', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('portalMyAppointments')).toBeInTheDocument();
    });
  });

  it('should display the request appointment button', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('portalRequestAppointment')).toBeInTheDocument();
    });
  });

  it('should show upcoming appointments section', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('portalUpcoming')).toBeInTheDocument();
    });
  });

  it('should display appointment time for upcoming appointments', async () => {
    renderPage();

    await waitFor(() => {
      // appointment_time "10:00:00".slice(0,5) = "10:00"
      expect(screen.getByText('10:00')).toBeInTheDocument();
    });
  });

  it('should show no upcoming message when no future appointments exist', async () => {
    patientPortalAPI.getAppointments.mockResolvedValue({
      data: { appointments: mockPastAppointments },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('portalNoUpcoming')).toBeInTheDocument();
    });
  });

  it('should show past appointments toggle button', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/portalPastAppointments/)).toBeInTheDocument();
    });
  });

  it('should show request form when request button is clicked', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('portalRequestAppointment')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('portalRequestAppointment'));

    expect(screen.getByText('portalRequestNew')).toBeInTheDocument();
    expect(screen.getByText('portalSendRequest')).toBeInTheDocument();
  });

  it('should show cancel button on upcoming non-cancelled appointments', async () => {
    renderPage();

    await waitFor(() => {
      const cancelButtons = screen.getAllByText('portalCancel');
      expect(cancelButtons.length).toBeGreaterThan(0);
    });
  });

  it('should show reschedule button on upcoming appointments', async () => {
    renderPage();

    await waitFor(() => {
      const rescheduleButtons = screen.getAllByText('Endre time');
      expect(rescheduleButtons.length).toBeGreaterThan(0);
    });
  });

  it('should display status badges for appointments', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('portalStatusScheduled')).toBeInTheDocument();
      expect(screen.getByText('portalStatusConfirmed')).toBeInTheDocument();
    });
  });

  it('should show error message when appointments fail to load', async () => {
    patientPortalAPI.getAppointments.mockRejectedValue(new Error('Network error'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('portalCouldNotLoad')).toBeInTheDocument();
    });
  });

  it('should render footer contact text', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('portalFooterContact')).toBeInTheDocument();
    });
  });
});
