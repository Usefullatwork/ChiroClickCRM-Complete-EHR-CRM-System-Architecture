/**
 * PatientFlow Page Tests
 * Tests for the Kanban patient flow dashboard
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock services/api
vi.mock('../../services/api', () => ({
  appointmentsAPI: {
    getAll: vi.fn(),
    updateStatus: vi.fn(),
  },
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock i18n
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
  formatDate: (_date, _lang, _opts) => 'Mandag 15. mars 2026',
}));

// Mock PatientFlowBoard to isolate page-level logic
vi.mock('../../components/PatientFlowBoard', () => ({
  default: ({ appointments, onStatusChange, onRefresh }) => (
    <div data-testid="patient-flow-board">
      <span data-testid="appointment-count">{appointments.length}</span>
      <button onClick={() => onStatusChange('apt-1', 'CHECKED_IN')}>Change Status</button>
      <button onClick={onRefresh}>Refresh</button>
    </div>
  ),
}));

import PatientFlow from '../../pages/PatientFlow';
import { appointmentsAPI } from '../../services/api';

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderPage = () => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PatientFlow />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('PatientFlow Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appointmentsAPI.getAll.mockResolvedValue({
      data: {
        appointments: [
          { id: 'apt-1', status: 'SCHEDULED', patient_id: 'p1' },
          { id: 'apt-2', status: 'CHECKED_IN', patient_id: 'p2' },
        ],
      },
    });
    appointmentsAPI.updateStatus.mockResolvedValue({ data: { success: true } });
  });

  it('should render the patient flow board once appointments load', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('patient-flow-board')).toBeInTheDocument();
    });
  });

  it('should render date navigation controls', () => {
    renderPage();

    // ChevronLeft and ChevronRight buttons are always present
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('should render calendar and kiosk links', () => {
    renderPage();

    // Calendar link
    expect(screen.getByRole('link', { name: /calendar/i })).toBeInTheDocument();
    // Kiosk button
    const kioskButton = screen.getByRole('button', { name: /kiosk/i });
    expect(kioskButton).toBeInTheDocument();
  });

  it('should pass correct appointment count to board (filters cancelled)', async () => {
    appointmentsAPI.getAll.mockResolvedValue({
      data: {
        appointments: [
          { id: 'apt-1', status: 'SCHEDULED' },
          { id: 'apt-2', status: 'CANCELLED' },
          { id: 'apt-3', status: 'NO_SHOW' },
          { id: 'apt-4', status: 'CHECKED_IN' },
        ],
      },
    });

    renderPage();

    await waitFor(() => {
      // CANCELLED and NO_SHOW are filtered — only 2 should pass through
      expect(screen.getByTestId('appointment-count').textContent).toBe('2');
    });
  });

  it('should show empty state when no appointments', async () => {
    appointmentsAPI.getAll.mockResolvedValue({ data: { appointments: [] } });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('noAppointments')).toBeInTheDocument();
    });
  });

  it('should show loading spinner while fetching', () => {
    appointmentsAPI.getAll.mockImplementation(() => new Promise(() => {}));

    renderPage();

    expect(screen.getByText('loadingPatientFlow')).toBeInTheDocument();
  });

  it('should call updateStatus when status is changed from board', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('patient-flow-board')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Change Status' }));

    await waitFor(() => {
      expect(appointmentsAPI.updateStatus).toHaveBeenCalledWith('apt-1', 'CHECKED_IN');
    });
  });
});
