/**
 * FollowUps Page Tests
 *
 * Tests follow-up queue display, tab navigation, filtering,
 * complete/skip actions, and patients needing follow-up list
 */

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
  followUpsAPI: {
    getAll: vi.fn(),
    complete: vi.fn(),
    skip: vi.fn(),
    getPatientsNeedingFollowUp: vi.fn(),
    markPatientAsContacted: vi.fn(),
  },
  patientsAPI: {
    getAll: vi.fn(),
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

// Mock lib/utils
vi.mock('../../lib/utils', () => ({
  formatPhone: (phone) => phone || '',
  cn: (...args) => args.filter(Boolean).join(' '),
}));

// Mock RecallDashboard
vi.mock('../../components/recall/RecallDashboard', () => ({
  default: () => <div data-testid="recall-dashboard">RecallDashboard</div>,
}));

// Mock PromptDialog (usePrompt returns an async function like window.prompt)
vi.mock('../../components/ui/PromptDialog', () => ({
  usePrompt: () => vi.fn().mockResolvedValue('test notes'),
}));

import FollowUps from '../../pages/FollowUps';
import { followUpsAPI, patientsAPI } from '../../services/api';

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

const mockFollowUps = [
  {
    id: 1,
    patient_id: 101,
    patient_name: 'Ola Nordmann',
    status: 'PENDING',
    priority: 'HIGH',
    due_date: '2024-03-10T00:00:00Z',
    notes: 'Sjekk fremgang etter behandling',
    follow_up_type: 'PHONE',
    assigned_to_name: 'Dr. Hansen',
    completion_notes: null,
  },
  {
    id: 2,
    patient_id: 102,
    patient_name: 'Kari Hansen',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    due_date: '2024-03-08T00:00:00Z',
    notes: 'Kontrolltime',
    follow_up_type: 'VISIT',
    assigned_to_name: 'Dr. Berg',
    completion_notes: 'Pasienten rapporterer bedring',
  },
  {
    id: 3,
    patient_id: 103,
    patient_name: 'Per Olsen',
    status: 'PENDING',
    priority: 'LOW',
    due_date: '2025-06-15T00:00:00Z',
    notes: null,
    follow_up_type: null,
    assigned_to_name: null,
    completion_notes: null,
  },
];

const mockPatientsNeedingFollowUp = [
  {
    id: 201,
    first_name: 'Lars',
    last_name: 'Eriksen',
    phone: '+47 91234567',
    last_visit_date: '2024-02-01T00:00:00Z',
    follow_up_reason: 'Ingen bedring etter 3 behandlinger',
  },
  {
    id: 202,
    first_name: 'Ingrid',
    last_name: 'Bakken',
    phone: '+47 99887766',
    last_visit_date: '2024-01-15T00:00:00Z',
    follow_up_reason: null,
  },
];

describe('FollowUps Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    followUpsAPI.getAll.mockResolvedValue({
      data: { followups: mockFollowUps },
    });

    patientsAPI.getAll.mockResolvedValue({
      data: { patients: mockPatientsNeedingFollowUp },
    });

    followUpsAPI.complete.mockResolvedValue({ data: { success: true } });
    followUpsAPI.skip.mockResolvedValue({ data: { success: true } });
  });

  it('should render without crashing', async () => {
    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      expect(screen.getByText('followUps')).toBeInTheDocument();
    });
  });

  it('should display the page heading and subtitle', async () => {
    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      expect(screen.getByText('followUps')).toBeInTheDocument();
      expect(screen.getByText('followUpsSubtitle')).toBeInTheDocument();
    });
  });

  it('should display all tab buttons', async () => {
    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      expect(screen.getByText('allFollowUps')).toBeInTheDocument();
      // "pending" and "completed" appear in both tabs and filter dropdown options
      const pendingElements = screen.getAllByText('pending');
      expect(pendingElements.length).toBeGreaterThanOrEqual(1);
      const completedElements = screen.getAllByText('completed');
      expect(completedElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('patientsNeedingFollowUp')).toBeInTheDocument();
      expect(screen.getByText('Recall')).toBeInTheDocument();
    });
  });

  it('should display follow-up items with patient names when data loads', async () => {
    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
      expect(screen.getByText('Per Olsen')).toBeInTheDocument();
    });
  });

  it('should display follow-up status badges', async () => {
    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      const pendingBadges = screen.getAllByText('PENDING');
      expect(pendingBadges.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    });
  });

  it('should display complete and skip buttons for PENDING follow-ups', async () => {
    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      const completeButtons = screen.getAllByText('complete');
      expect(completeButtons.length).toBe(2); // Two PENDING items
      const skipButtons = screen.getAllByText('skip');
      expect(skipButtons.length).toBe(2);
    });
  });

  it('should not display complete/skip buttons for COMPLETED follow-ups', async () => {
    followUpsAPI.getAll.mockResolvedValue({
      data: {
        followups: [mockFollowUps[1]], // Only the COMPLETED one
      },
    });

    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
    });

    expect(screen.queryByText('complete')).not.toBeInTheDocument();
    expect(screen.queryByText('skip')).not.toBeInTheDocument();
  });

  it('should show pending count badge on the pending tab', async () => {
    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      // 2 PENDING items in mockFollowUps
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('should filter to pending-only when clicking the pending tab', async () => {
    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    // Click the "pending" tab button (not the dropdown option)
    const pendingElements = screen.getAllByText('pending');
    // The tab button is the first one (tabs render before filter dropdown)
    fireEvent.click(pendingElements[0]);

    await waitFor(() => {
      // PENDING items should be visible
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      expect(screen.getByText('Per Olsen')).toBeInTheDocument();
      // COMPLETED item should be filtered out
      expect(screen.queryByText('Kari Hansen')).not.toBeInTheDocument();
    });
  });

  it('should filter to completed-only when clicking the completed tab', async () => {
    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
    });

    // Click the "completed" tab button (not the dropdown option)
    const completedElements = screen.getAllByText('completed');
    fireEvent.click(completedElements[0]);

    await waitFor(() => {
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
      expect(screen.queryByText('Ola Nordmann')).not.toBeInTheDocument();
      expect(screen.queryByText('Per Olsen')).not.toBeInTheDocument();
    });
  });

  it('should show filter controls on the all tab', async () => {
    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      // The text in the DOM is "filters:" (with colon inside span)
      expect(screen.getByText('filters:')).toBeInTheDocument();
      expect(screen.getByText('allStatuses')).toBeInTheDocument();
      expect(screen.getByText('allPriorities')).toBeInTheDocument();
    });
  });

  it('should display follow-up notes when present', async () => {
    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      expect(screen.getByText('Sjekk fremgang etter behandling')).toBeInTheDocument();
      expect(screen.getByText('Kontrolltime')).toBeInTheDocument();
    });
  });

  it('should display completion notes for completed follow-ups', async () => {
    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      expect(screen.getByText(/Pasienten rapporterer bedring/)).toBeInTheDocument();
    });
  });

  it('should show empty state when no follow-ups exist', async () => {
    followUpsAPI.getAll.mockResolvedValue({
      data: { followups: [] },
    });

    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      expect(screen.getByText('noFollowUpsFound')).toBeInTheDocument();
    });
  });

  it('should navigate to patient detail when clicking patient name', async () => {
    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Ola Nordmann'));
    expect(mockNavigate).toHaveBeenCalledWith('/patients/101');
  });

  it('should show the recall dashboard when clicking the Recall tab', async () => {
    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      expect(screen.getByText('Recall')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Recall'));

    await waitFor(() => {
      expect(screen.getByTestId('recall-dashboard')).toBeInTheDocument();
    });
  });

  it('should show patients needing follow-up when clicking the needed tab', async () => {
    renderWithProviders(<FollowUps />);

    fireEvent.click(screen.getByText('patientsNeedingFollowUp'));

    await waitFor(() => {
      expect(screen.getByText('Lars Eriksen')).toBeInTheDocument();
      expect(screen.getByText('Ingrid Bakken')).toBeInTheDocument();
    });
  });

  it('should display follow-up reason for flagged patients', async () => {
    renderWithProviders(<FollowUps />);

    fireEvent.click(screen.getByText('patientsNeedingFollowUp'));

    await waitFor(() => {
      expect(screen.getByText(/Ingen bedring etter 3 behandlinger/)).toBeInTheDocument();
    });
  });

  it('should have view and contact buttons for patients needing follow-up', async () => {
    renderWithProviders(<FollowUps />);

    fireEvent.click(screen.getByText('patientsNeedingFollowUp'));

    await waitFor(() => {
      const viewButtons = screen.getAllByText('viewPatient');
      expect(viewButtons.length).toBe(2);
      const contactButtons = screen.getAllByText('contact');
      expect(contactButtons.length).toBe(2);
    });
  });

  it('should navigate to patient page when clicking view on needed patient', async () => {
    renderWithProviders(<FollowUps />);

    fireEvent.click(screen.getByText('patientsNeedingFollowUp'));

    await waitFor(() => {
      expect(screen.getAllByText('viewPatient').length).toBe(2);
    });

    fireEvent.click(screen.getAllByText('viewPatient')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/patients/201');
  });

  it('should navigate to communications when clicking contact on needed patient', async () => {
    renderWithProviders(<FollowUps />);

    fireEvent.click(screen.getByText('patientsNeedingFollowUp'));

    await waitFor(() => {
      expect(screen.getAllByText('contact').length).toBe(2);
    });

    fireEvent.click(screen.getAllByText('contact')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/communications', {
      state: { patientId: 201 },
    });
  });

  it('should show loading state while fetching follow-ups', () => {
    followUpsAPI.getAll.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithProviders(<FollowUps />);

    expect(screen.getByText('loadingFollowUps')).toBeInTheDocument();
  });

  it('should hide filter section on the needed tab', async () => {
    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      expect(screen.getByText('filters:')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('patientsNeedingFollowUp'));

    await waitFor(() => {
      expect(screen.queryByText('filters:')).not.toBeInTheDocument();
    });
  });

  it('should hide filter section on the recall tab', async () => {
    renderWithProviders(<FollowUps />);

    await waitFor(() => {
      expect(screen.getByText('filters:')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Recall'));

    await waitFor(() => {
      expect(screen.queryByText('filters:')).not.toBeInTheDocument();
    });
  });
});
