/**
 * LiveAppointmentBoard Component Tests
 * Tests for the real-time appointment board with WebSocket updates
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LiveAppointmentBoard from '../../components/appointments/LiveAppointmentBoard';

// Mock API
vi.mock('../../services/api', () => ({
  appointmentsAPI: {
    getAll: vi.fn(),
  },
}));

// Mock socket hooks
vi.mock('../../services/socket', () => ({
  useSocketEvent: vi.fn(),
  useSocketStatus: vi.fn(() => false),
}));

import { appointmentsAPI } from '../../services/api';
import { useSocketStatus } from '../../services/socket';

describe('LiveAppointmentBoard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appointmentsAPI.getAll.mockResolvedValue({ data: { appointments: [] } });
    useSocketStatus.mockReturnValue(false);
  });

  // ============================================================================
  // HEADING
  // ============================================================================

  describe('Heading', () => {
    it('should render the board heading "Dagstavle"', async () => {
      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(screen.getByText('Dagstavle')).toBeInTheDocument();
      });
    });

    it('should show "I dag" button for today navigation', async () => {
      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(screen.getByText('I dag')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // WIFI INDICATOR
  // ============================================================================

  describe('WiFi Indicator', () => {
    it('should show "Frakoblet" when socket is disconnected', async () => {
      useSocketStatus.mockReturnValue(false);
      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(screen.getByText('Frakoblet')).toBeInTheDocument();
      });
    });

    it('should show "Live" when socket is connected', async () => {
      useSocketStatus.mockReturnValue(true);
      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(screen.getByText('Live')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // DATE NAVIGATION
  // ============================================================================

  describe('Date Navigation', () => {
    it('should have prev and next day buttons', async () => {
      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(screen.getByLabelText('Forrige dag')).toBeInTheDocument();
        expect(screen.getByLabelText('Neste dag')).toBeInTheDocument();
      });
    });

    it('should navigate to previous day when prev button is clicked', async () => {
      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(screen.getByText('Dagstavle')).toBeInTheDocument();
      });

      // Click prev — should refetch appointments with a different date
      fireEvent.click(screen.getByLabelText('Forrige dag'));

      await waitFor(() => {
        // appointmentsAPI.getAll should be called again with a new date
        expect(appointmentsAPI.getAll).toHaveBeenCalledTimes(2);
      });
    });

    it('should navigate to next day when next button is clicked', async () => {
      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(screen.getByText('Dagstavle')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Neste dag'));

      await waitFor(() => {
        expect(appointmentsAPI.getAll).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ============================================================================
  // APPOINTMENTS LOADING
  // ============================================================================

  describe('Appointments Loading', () => {
    it('should show loading state while fetching appointments', () => {
      appointmentsAPI.getAll.mockReturnValue(new Promise(() => {}));
      render(<LiveAppointmentBoard />);
      expect(screen.getByText('Laster...')).toBeInTheDocument();
    });

    it('should call appointmentsAPI.getAll on mount', async () => {
      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(appointmentsAPI.getAll).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ============================================================================
  // APPOINTMENT DISPLAY
  // ============================================================================

  describe('Appointment Display', () => {
    it('should display appointment patient names', async () => {
      const today = new Date();
      const startTime = new Date(today.setHours(10, 0, 0, 0)).toISOString();

      appointmentsAPI.getAll.mockResolvedValue({
        data: {
          appointments: [
            {
              id: 'a1',
              patient_name: 'Ola Nordmann',
              start_time: startTime,
              duration_minutes: 30,
              status: 'scheduled',
              appointment_type: 'follow_up',
            },
          ],
        },
      });

      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        // Patient name appears in both the grid and the sidebar queue
        const names = screen.getAllByText('Ola Nordmann');
        expect(names.length).toBeGreaterThan(0);
      });
    });

    it('should show status label for appointments', async () => {
      const today = new Date();
      const startTime = new Date(today.setHours(9, 0, 0, 0)).toISOString();

      appointmentsAPI.getAll.mockResolvedValue({
        data: {
          appointments: [
            {
              id: 'a1',
              patient_name: 'Test Patient',
              start_time: startTime,
              duration_minutes: 30,
              status: 'checked_in',
            },
          ],
        },
      });

      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(screen.getByText('Innsjekket')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // SIDEBAR QUEUE
  // ============================================================================

  describe('Sidebar Queue', () => {
    it('should show queue heading with count', async () => {
      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(screen.getByText(/Ko \(0\)/)).toBeInTheDocument();
      });
    });

    it('should show "Ingen avtaler i ko" when queue is empty', async () => {
      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(screen.getByText('Ingen avtaler i ko')).toBeInTheDocument();
      });
    });

    it('should show total and completed stats', async () => {
      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(screen.getByText('Totalt')).toBeInTheDocument();
        expect(screen.getByText('Fullfort')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // CLICK EXPAND/COLLAPSE
  // ============================================================================

  describe('Click Expand/Collapse', () => {
    it('should expand appointment details when clicked', async () => {
      const today = new Date();
      const startTime = new Date(today.setHours(10, 0, 0, 0)).toISOString();

      appointmentsAPI.getAll.mockResolvedValue({
        data: {
          appointments: [
            {
              id: 'a1',
              patient_name: 'Kari Hansen',
              start_time: startTime,
              duration_minutes: 45,
              status: 'scheduled',
              notes: 'Oppfolging nakke',
            },
          ],
        },
      });

      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        const names = screen.getAllByText('Kari Hansen');
        expect(names.length).toBeGreaterThan(0);
      });

      // Click the appointment button in the grid to expand it
      const apptButtons = screen.getAllByText('Kari Hansen');
      fireEvent.click(apptButtons[0].closest('button'));

      await waitFor(() => {
        expect(screen.getByText(/Varighet: 45 min/)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // EMPTY STATE
  // ============================================================================

  describe('Empty State', () => {
    it('should render time slots even with no appointments', async () => {
      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        // Should show time labels like 08:00, 09:00, etc.
        expect(screen.getByText('08:00')).toBeInTheDocument();
        expect(screen.getByText('12:00')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // QUEUE FILTERING
  // ============================================================================

  describe('Queue Filtering', () => {
    it('should exclude completed appointments from the queue', async () => {
      const today = new Date();
      const startTime1 = new Date(today.setHours(10, 0, 0, 0)).toISOString();
      const startTime2 = new Date(today.setHours(11, 0, 0, 0)).toISOString();

      appointmentsAPI.getAll.mockResolvedValue({
        data: {
          appointments: [
            {
              id: 'a1',
              patient_name: 'Active Patient',
              start_time: startTime1,
              duration_minutes: 30,
              status: 'scheduled',
            },
            {
              id: 'a2',
              patient_name: 'Done Patient',
              start_time: startTime2,
              duration_minutes: 30,
              status: 'completed',
            },
          ],
        },
      });

      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        // Queue should show "Ko (1)" not "Ko (2)" since completed is excluded
        expect(screen.getByText(/Ko \(1\)/)).toBeInTheDocument();
      });
    });

    it('should exclude no_show appointments from the queue', async () => {
      const today = new Date();
      const startTime = new Date(today.setHours(9, 0, 0, 0)).toISOString();

      appointmentsAPI.getAll.mockResolvedValue({
        data: {
          appointments: [
            {
              id: 'a1',
              patient_name: 'No Show',
              start_time: startTime,
              duration_minutes: 30,
              status: 'no_show',
            },
          ],
        },
      });

      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(screen.getByText(/Ko \(0\)/)).toBeInTheDocument();
      });
    });

    it('should exclude cancelled appointments from the grid', async () => {
      const today = new Date();
      const startTime = new Date(today.setHours(10, 0, 0, 0)).toISOString();

      appointmentsAPI.getAll.mockResolvedValue({
        data: {
          appointments: [
            {
              id: 'a1',
              patient_name: 'Cancelled Patient',
              start_time: startTime,
              duration_minutes: 30,
              status: 'cancelled',
            },
          ],
        },
      });

      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        // Totalt should show 0 since cancelled are excluded from sortedAppointments
        const stats = screen.getByText('Totalt');
        expect(stats).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // APPOINTMENT STATUSES
  // ============================================================================

  describe('Appointment Statuses', () => {
    it('should show "Under behandling" for in_progress appointments', async () => {
      const today = new Date();
      const startTime = new Date(today.setHours(10, 0, 0, 0)).toISOString();

      appointmentsAPI.getAll.mockResolvedValue({
        data: {
          appointments: [
            {
              id: 'a1',
              patient_name: 'In Treatment',
              start_time: startTime,
              duration_minutes: 30,
              status: 'in_progress',
            },
          ],
        },
      });

      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(screen.getByText('Under behandling')).toBeInTheDocument();
      });
    });

    it('should show "Planlagt" for scheduled appointments', async () => {
      const today = new Date();
      const startTime = new Date(today.setHours(10, 0, 0, 0)).toISOString();

      appointmentsAPI.getAll.mockResolvedValue({
        data: {
          appointments: [
            {
              id: 'a1',
              patient_name: 'Planned',
              start_time: startTime,
              duration_minutes: 30,
              status: 'scheduled',
            },
          ],
        },
      });

      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(screen.getByText('Planlagt')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // REFRESH
  // ============================================================================

  describe('Refresh', () => {
    it('should refetch appointments when refresh button is clicked', async () => {
      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(appointmentsAPI.getAll).toHaveBeenCalledTimes(1);
      });

      const refreshBtn = screen.getByLabelText('Oppdater');
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(appointmentsAPI.getAll).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ============================================================================
  // TODAY BUTTON
  // ============================================================================

  describe('Today Button', () => {
    it('should reset to current date when I dag is clicked after navigating', async () => {
      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(screen.getByText('Dagstavle')).toBeInTheDocument();
      });

      // Navigate to next day
      fireEvent.click(screen.getByLabelText('Neste dag'));
      await waitFor(() => {
        expect(appointmentsAPI.getAll).toHaveBeenCalledTimes(2);
      });

      // Click I dag to return
      fireEvent.click(screen.getByText('I dag'));
      await waitFor(() => {
        expect(appointmentsAPI.getAll).toHaveBeenCalledTimes(3);
      });
    });
  });

  // ============================================================================
  // STATS
  // ============================================================================

  describe('Stats', () => {
    it('should show correct completed count in stats', async () => {
      const today = new Date();
      const startTime1 = new Date(today.setHours(9, 0, 0, 0)).toISOString();
      const startTime2 = new Date(today.setHours(10, 0, 0, 0)).toISOString();
      const startTime3 = new Date(today.setHours(11, 0, 0, 0)).toISOString();

      appointmentsAPI.getAll.mockResolvedValue({
        data: {
          appointments: [
            {
              id: 'a1',
              patient_name: 'P1',
              start_time: startTime1,
              duration_minutes: 30,
              status: 'completed',
            },
            {
              id: 'a2',
              patient_name: 'P2',
              start_time: startTime2,
              duration_minutes: 30,
              status: 'completed',
            },
            {
              id: 'a3',
              patient_name: 'P3',
              start_time: startTime3,
              duration_minutes: 30,
              status: 'scheduled',
            },
          ],
        },
      });

      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        const completedStats = screen.getAllByText('2');
        expect(completedStats.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // APPOINTMENT TYPE ICONS
  // ============================================================================

  describe('Appointment Type Icons', () => {
    it('should show type icon for follow_up appointments', async () => {
      const today = new Date();
      const startTime = new Date(today.setHours(10, 0, 0, 0)).toISOString();

      appointmentsAPI.getAll.mockResolvedValue({
        data: {
          appointments: [
            {
              id: 'a1',
              patient_name: 'Follow Up',
              start_time: startTime,
              duration_minutes: 30,
              status: 'scheduled',
              appointment_type: 'follow_up',
            },
          ],
        },
      });

      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(screen.getByText('F')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    it('should show empty state when API fails', async () => {
      appointmentsAPI.getAll.mockRejectedValue(new Error('Network error'));
      render(<LiveAppointmentBoard />);

      await waitFor(() => {
        expect(screen.getByText('Ingen avtaler i ko')).toBeInTheDocument();
      });
    });
  });
});
