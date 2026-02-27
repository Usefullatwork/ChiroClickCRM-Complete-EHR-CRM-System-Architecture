/**
 * PatientProgress Page Tests
 *
 * Tests both therapist view (all patients list) and single patient view
 * including stats cards, charts, pain tracking, compliance, search/filter,
 * sort, prescriptions, loading states, empty states, and navigation.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// --- Mocks ---

const mockNavigate = vi.fn();
let mockPatientId = undefined;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ patientId: mockPatientId }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

vi.mock('../../services/api', () => ({
  progressAPI: {
    getPatientStats: vi.fn(),
    getWeeklyCompliance: vi.fn(),
    getDailyProgress: vi.fn(),
    getPainHistory: vi.fn(),
    getAllPatientsCompliance: vi.fn(),
    getClinicOverview: vi.fn(),
  },
}));

vi.mock('../../components/patient/ProgressChart', () => ({
  default: ({ data, metric, period }) => (
    <div data-testid="progress-chart" data-metric={metric} data-period={period}>
      ProgressChart ({data?.length || 0} items)
    </div>
  ),
}));

vi.mock('../../components/patient/ComplianceCalendar', () => ({
  default: ({ data }) => (
    <div data-testid="compliance-calendar">ComplianceCalendar ({data?.length || 0} days)</div>
  ),
}));

vi.mock('../../components/patient/PainTracker', () => ({
  default: ({ data, trend, currentAvg }) => (
    <div data-testid="pain-tracker" data-trend={trend} data-avg={currentAvg}>
      PainTracker ({data?.length || 0} entries)
    </div>
  ),
}));

vi.mock('lucide-react', () => ({
  Activity: () => <span data-testid="icon-activity">Activity</span>,
  Calendar: () => <span data-testid="icon-calendar">Calendar</span>,
  Award: () => <span data-testid="icon-award">Award</span>,
  Users: () => <span data-testid="icon-users">Users</span>,
  ChevronLeft: () => <span data-testid="icon-chevron-left">ChevronLeft</span>,
  ChevronRight: () => <span data-testid="icon-chevron-right">ChevronRight</span>,
  Search: () => <span data-testid="icon-search">Search</span>,
  Clock: () => <span data-testid="icon-clock">Clock</span>,
  CheckCircle: () => <span data-testid="icon-check-circle">CheckCircle</span>,
  Target: () => <span data-testid="icon-target">Target</span>,
  Frown: () => <span data-testid="icon-frown">Frown</span>,
  Meh: () => <span data-testid="icon-meh">Meh</span>,
  Smile: () => <span data-testid="icon-smile">Smile</span>,
  ArrowUpRight: () => <span data-testid="icon-arrow-up">ArrowUpRight</span>,
  ArrowDownRight: () => <span data-testid="icon-arrow-down">ArrowDownRight</span>,
}));

import PatientProgress from '../../pages/PatientProgress';
import { progressAPI } from '../../services/api';

// --- Helpers ---

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

const renderWithProviders = (component) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

// --- Fixture data ---

const mockClinicOverview = {
  data: {
    overview: {
      activePatients: 42,
      activeThisWeek: 28,
      totalCompletions: 1350,
      avgPain30d: '3.2',
    },
    distribution: {
      excellent: 15,
      good: 12,
      fair: 8,
      low: 4,
      inactive: 3,
    },
  },
};

const mockAllPatientsCompliance = {
  data: {
    patients: [
      {
        patientId: 'p1',
        patientName: 'Ola Nordmann',
        complianceRate: 85,
        activeDaysThisWeek: 5,
        recentAvgPain: '2.1',
        lastActivity: '2026-02-25T10:00:00Z',
        status: { label: 'Utmerket' },
      },
      {
        patientId: 'p2',
        patientName: 'Kari Hansen',
        complianceRate: 55,
        activeDaysThisWeek: 3,
        recentAvgPain: '6.5',
        lastActivity: '2026-02-20T14:30:00Z',
        status: { label: 'Trenger oppfolging' },
      },
      {
        patientId: 'p3',
        patientName: 'Erik Johansen',
        complianceRate: 72,
        activeDaysThisWeek: 4,
        recentAvgPain: null,
        lastActivity: null,
        status: { label: 'Bra' },
      },
    ],
  },
};

const mockPatientStats = {
  data: {
    summary: {
      totalCompletions: 156,
      activeDays: 45,
      currentStreak: 7,
      avgPain: '3.5',
    },
    prescriptions: [
      {
        prescriptionId: 'rx-1',
        status: 'active',
        totalPrescribed: 5,
        complianceRate: 88,
        startDate: '2026-01-15T00:00:00Z',
        endDate: '2026-03-15T00:00:00Z',
      },
      {
        prescriptionId: 'rx-2',
        status: 'completed',
        totalPrescribed: 3,
        complianceRate: 65,
        startDate: '2025-10-01T00:00:00Z',
        endDate: '2026-01-14T00:00:00Z',
      },
    ],
  },
};

const mockWeeklyData = {
  data: [
    { weekStart: '2026-02-17', weekLabel: 'Uke 8', complianceRate: 80, activeDays: 5 },
    { weekStart: '2026-02-10', weekLabel: 'Uke 7', complianceRate: 60, activeDays: 4 },
    { weekStart: '2026-02-03', weekLabel: 'Uke 6', complianceRate: 90, activeDays: 6 },
  ],
};

const mockDailyData = {
  data: [
    { date: '2026-02-25', completed: 3, total: 5, painLevel: 2 },
    { date: '2026-02-24', completed: 5, total: 5, painLevel: 3 },
  ],
};

const mockPainData = {
  data: {
    data: [
      { date: '2026-02-25', painLevel: 2 },
      { date: '2026-02-20', painLevel: 4 },
      { date: '2026-02-15', painLevel: 5 },
    ],
    trend: 'improving',
    currentAvg: 3.2,
  },
};

// ========================
// THERAPIST VIEW TESTS
// ========================

describe('PatientProgress - Therapist View (no patientId)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPatientId = undefined;

    progressAPI.getAllPatientsCompliance.mockResolvedValue(mockAllPatientsCompliance);
    progressAPI.getClinicOverview.mockResolvedValue(mockClinicOverview);
  });

  it('should render the therapist view heading "Treningsfremgang"', async () => {
    renderWithProviders(<PatientProgress />);

    expect(screen.getByText('Treningsfremgang')).toBeInTheDocument();
    expect(
      screen.getByText('Oversikt over pasientenes overholdelse av treningsprogram')
    ).toBeInTheDocument();
  });

  it('should fetch clinic overview and patient compliance on mount', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(progressAPI.getClinicOverview).toHaveBeenCalled();
      expect(progressAPI.getAllPatientsCompliance).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
          offset: 0,
          sortBy: 'compliance_rate',
          order: 'DESC',
        })
      );
    });
  });

  it('should NOT fetch single-patient APIs in therapist mode', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(progressAPI.getClinicOverview).toHaveBeenCalled();
    });

    expect(progressAPI.getPatientStats).not.toHaveBeenCalled();
    expect(progressAPI.getWeeklyCompliance).not.toHaveBeenCalled();
    expect(progressAPI.getDailyProgress).not.toHaveBeenCalled();
    expect(progressAPI.getPainHistory).not.toHaveBeenCalled();
  });

  it('should display clinic overview stat cards', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Aktive pasienter')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    expect(screen.getByText('Aktive denne uken')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();

    expect(screen.getByText('Totale ovelser utfort')).toBeInTheDocument();
    expect(screen.getByText('1350')).toBeInTheDocument();

    expect(screen.getByText('Gj.snitt smerte (30d)')).toBeInTheDocument();
    expect(screen.getByText('3.2')).toBeInTheDocument();
  });

  it('should display compliance distribution section', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Overholdelsesfordeling')).toBeInTheDocument();
    });

    // "Utmerket" appears in both distribution and patient status badge; use getAllByText
    expect(screen.getAllByText('Utmerket').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('80%+')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    // "Bra" appears in both distribution and patient status badge
    expect(screen.getAllByText('Bra').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('60-79%')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    expect(screen.getByText('Middels')).toBeInTheDocument();
    expect(screen.getByText('40-59%')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();

    expect(screen.getByText('Lav')).toBeInTheDocument();
    expect(screen.getByText('20-39%')).toBeInTheDocument();
    // "4" appears in both "4" distribution count and patient row "4/7 dager denne uken"
    const fourElements = screen.getAllByText('4');
    expect(fourElements.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('Inaktiv')).toBeInTheDocument();
    expect(screen.getByText('Under 20%')).toBeInTheDocument();
    // "3" appears in both distribution and patient row
    const threeElements = screen.getAllByText('3');
    expect(threeElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should render search input with Norwegian placeholder', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Sok etter pasient...')).toBeInTheDocument();
    });
  });

  it('should render filter select with Norwegian options', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Alle nivåer')).toBeInTheDocument();
    });

    // Option values are inside <select> -- use role-based query or check by option element
    const filterSelect = screen.getByDisplayValue('Alle nivåer');
    const options = filterSelect.querySelectorAll('option');
    const optionTexts = Array.from(options).map((o) => o.textContent);
    expect(optionTexts).toContain('Utmerket (80%+)');
    expect(optionTexts).toContain('Bra (60-79%)');
    expect(optionTexts).toContain('Trenger oppfolging (Under 60%)');
  });

  it('should render sort select with Norwegian options', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Overholdelse')).toBeInTheDocument();
    });

    const sortSelect = screen.getByDisplayValue('Overholdelse');
    const sortOptions = Array.from(sortSelect.querySelectorAll('option')).map((o) => o.textContent);
    expect(sortOptions).toContain('Siste aktivitet');
    expect(sortOptions).toContain('Navn');
  });

  it('should render patient list heading', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Pasienter med treningsprogram')).toBeInTheDocument();
    });
  });

  it('should display patient rows with names and compliance rates', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
    expect(screen.getByText('Erik Johansen')).toBeInTheDocument();

    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('55%')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('should display patient activity info in Norwegian', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    expect(screen.getByText('5/7 dager denne uken')).toBeInTheDocument();
    expect(screen.getByText('3/7 dager denne uken')).toBeInTheDocument();
  });

  it('should display pain level next to patient entry', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText(/Smerte: 2.1/)).toBeInTheDocument();
      expect(screen.getByText(/Smerte: 6.5/)).toBeInTheDocument();
    });
  });

  it('should display "Aldri" for patients with no lastActivity', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText(/Aldri/)).toBeInTheDocument();
    });
  });

  it('should display status labels from API data', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      // "Utmerket" appears in distribution section AND patient status badge
      const utmerketElements = screen.getAllByText('Utmerket');
      expect(utmerketElements.length).toBeGreaterThanOrEqual(2);
    });

    // "Trenger oppfolging" in patient row AND in filter option
    const needsAttention = screen.getAllByText(/Trenger oppfolging/);
    expect(needsAttention.length).toBeGreaterThanOrEqual(1);
  });

  it('should navigate to patient detail on row click', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Ola Nordmann'));

    expect(mockNavigate).toHaveBeenCalledWith('/progress/p1');
  });

  it('should filter patients by search term', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Sok etter pasient...');
    fireEvent.change(searchInput, { target: { value: 'Kari' } });

    expect(screen.queryByText('Ola Nordmann')).not.toBeInTheDocument();
    expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
    expect(screen.queryByText('Erik Johansen')).not.toBeInTheDocument();
  });

  it('should filter patients by compliance level "excellent" (80%+)', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    const filterSelect = screen.getByDisplayValue('Alle nivåer');
    fireEvent.change(filterSelect, { target: { value: 'excellent' } });

    // Changing filter triggers new queryKey -> re-fetch; wait for data to settle
    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    expect(screen.queryByText('Kari Hansen')).not.toBeInTheDocument();
    expect(screen.queryByText('Erik Johansen')).not.toBeInTheDocument();
  });

  it('should filter patients by compliance level "good" (60-79%)', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Erik Johansen')).toBeInTheDocument();
    });

    const filterSelect = screen.getByDisplayValue('Alle nivåer');
    fireEvent.change(filterSelect, { target: { value: 'good' } });

    await waitFor(() => {
      expect(screen.getByText('Erik Johansen')).toBeInTheDocument();
    });
    expect(screen.queryByText('Ola Nordmann')).not.toBeInTheDocument();
    expect(screen.queryByText('Kari Hansen')).not.toBeInTheDocument();
  });

  it('should filter patients by "needs_attention" (under 60%)', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
    });

    const filterSelect = screen.getByDisplayValue('Alle nivåer');
    fireEvent.change(filterSelect, { target: { value: 'needs_attention' } });

    await waitFor(() => {
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
    });
    expect(screen.queryByText('Ola Nordmann')).not.toBeInTheDocument();
    expect(screen.queryByText('Erik Johansen')).not.toBeInTheDocument();
  });

  it('should toggle sort order when sort button is clicked', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    // Default is DESC, so ArrowDownRight icon should be visible
    expect(screen.getByTestId('icon-arrow-down')).toBeInTheDocument();

    // Click sort order toggle
    const sortButton = screen.getByTestId('icon-arrow-down').closest('button');
    fireEvent.click(sortButton);

    // After toggle to ASC, ArrowUpRight should appear
    expect(screen.getByTestId('icon-arrow-up')).toBeInTheDocument();
  });

  it('should show loading state while compliance data is loading', () => {
    // Make the API hang (never resolve)
    progressAPI.getAllPatientsCompliance.mockReturnValue(new Promise(() => {}));
    progressAPI.getClinicOverview.mockResolvedValue(mockClinicOverview);

    renderWithProviders(<PatientProgress />);

    expect(screen.getByText('Laster pasienter...')).toBeInTheDocument();
  });

  it('should show empty state when no patients match filter', async () => {
    progressAPI.getAllPatientsCompliance.mockResolvedValue({
      data: { patients: [] },
    });

    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Ingen pasienter funnet')).toBeInTheDocument();
      expect(screen.getByText('Ingen pasienter matcher sokekriteriene')).toBeInTheDocument();
    });
  });

  it('should show empty state when search yields no results', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Sok etter pasient...');
    fireEvent.change(searchInput, { target: { value: 'ZZZNONEXISTENT' } });

    expect(screen.getByText('Ingen pasienter funnet')).toBeInTheDocument();
    expect(screen.getByText('Ingen pasienter matcher sokekriteriene')).toBeInTheDocument();
  });

  it('should combine search and compliance filter', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    // Filter for needs_attention first
    const filterSelect = screen.getByDisplayValue('Alle nivåer');
    fireEvent.change(filterSelect, { target: { value: 'needs_attention' } });

    // Wait for refetch to settle
    await waitFor(() => {
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
    });

    // Now search for "Kari" within needs_attention
    const searchInput = screen.getByPlaceholderText('Sok etter pasient...');
    fireEvent.change(searchInput, { target: { value: 'Kari' } });

    await waitFor(() => {
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
    });
    expect(screen.queryByText('Ola Nordmann')).not.toBeInTheDocument();
    expect(screen.queryByText('Erik Johansen')).not.toBeInTheDocument();
  });

  it('should handle missing clinic overview gracefully (no stats cards)', async () => {
    progressAPI.getClinicOverview.mockResolvedValue({ data: null });

    renderWithProviders(<PatientProgress />);

    // Heading should still render
    expect(screen.getByText('Treningsfremgang')).toBeInTheDocument();

    // Overview stat labels should NOT appear since clinicOverview is null
    await waitFor(() => {
      expect(screen.queryByText('Aktive pasienter')).not.toBeInTheDocument();
    });
  });
});

// ========================
// PATIENT VIEW TESTS
// ========================

describe('PatientProgress - Patient View (with patientId)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPatientId = 'p1';

    progressAPI.getPatientStats.mockResolvedValue(mockPatientStats);
    progressAPI.getWeeklyCompliance.mockResolvedValue(mockWeeklyData);
    progressAPI.getDailyProgress.mockResolvedValue(mockDailyData);
    progressAPI.getPainHistory.mockResolvedValue(mockPainData);
  });

  it('should render the patient view heading "Pasientfremgang"', async () => {
    renderWithProviders(<PatientProgress />);

    expect(screen.getByText('Pasientfremgang')).toBeInTheDocument();
    expect(screen.getByText('Detaljert oversikt over treningsoverholdelse')).toBeInTheDocument();
  });

  it('should render a back button that navigates to /progress', () => {
    renderWithProviders(<PatientProgress />);

    const backButton = screen.getByTestId('icon-chevron-left').closest('button');
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('/progress');
  });

  it('should fetch patient-specific APIs on mount', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(progressAPI.getPatientStats).toHaveBeenCalledWith('p1');
      expect(progressAPI.getWeeklyCompliance).toHaveBeenCalledWith('p1', 12);
      expect(progressAPI.getDailyProgress).toHaveBeenCalledWith('p1', 3);
      expect(progressAPI.getPainHistory).toHaveBeenCalledWith('p1', 90);
    });
  });

  it('should NOT fetch therapist-mode APIs in patient view', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(progressAPI.getPatientStats).toHaveBeenCalled();
    });

    expect(progressAPI.getAllPatientsCompliance).not.toHaveBeenCalled();
    expect(progressAPI.getClinicOverview).not.toHaveBeenCalled();
  });

  it('should display summary stats cards with Norwegian labels', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Totale ovelser')).toBeInTheDocument();
      expect(screen.getByText('156')).toBeInTheDocument();
    });

    expect(screen.getByText('Aktive dager')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();

    expect(screen.getByText('Navarende rekke')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('dager')).toBeInTheDocument();

    expect(screen.getByText('Gj.snitt smerte')).toBeInTheDocument();
    expect(screen.getByText('3.5')).toBeInTheDocument();
  });

  it('should display pain emoji for average pain level', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('3.5')).toBeInTheDocument();
    });

    // avgPain 3.5 is between 2 and 5, so Meh emoji should render
    expect(screen.getByTestId('icon-meh')).toBeInTheDocument();
  });

  it('should render the weekly progress chart section', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByTestId('progress-chart')).toBeInTheDocument();
    });

    expect(screen.getByText('Ukentlig fremgang')).toBeInTheDocument();

    const chart = screen.getByTestId('progress-chart');
    expect(chart).toHaveAttribute('data-metric', 'completion');
    expect(chart).toHaveAttribute('data-period', 'week');
    expect(chart.textContent).toContain('3 items');
  });

  it('should render the pain tracker section', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByTestId('pain-tracker')).toBeInTheDocument();
    });

    expect(screen.getByText('Smerteniva over tid')).toBeInTheDocument();

    const painTracker = screen.getByTestId('pain-tracker');
    expect(painTracker).toHaveAttribute('data-trend', 'improving');
    expect(painTracker.textContent).toContain('3 entries');
  });

  it('should show "Ingen smertedata tilgjengelig" when no pain data', async () => {
    progressAPI.getPainHistory.mockResolvedValue({ data: null });

    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Ingen smertedata tilgjengelig')).toBeInTheDocument();
    });
  });

  it('should render the compliance calendar section', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByTestId('compliance-calendar')).toBeInTheDocument();
    });

    expect(screen.getByText('Treningskalender')).toBeInTheDocument();

    const calendar = screen.getByTestId('compliance-calendar');
    expect(calendar.textContent).toContain('2 days');
  });

  it('should render prescriptions section with Norwegian labels', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Treningsforskrivninger')).toBeInTheDocument();
    });

    // Active prescription badge
    expect(screen.getByText('Aktiv')).toBeInTheDocument();
    expect(screen.getByText('5 ovelser')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();

    // Compliance label
    const overholdelse = screen.getAllByText('overholdelse');
    expect(overholdelse.length).toBe(2);
  });

  it('should display prescription date range in Norwegian locale', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Treningsforskrivninger')).toBeInTheDocument();
    });

    // Check that dates are formatted with toLocaleDateString('no-NO')
    // 2026-01-15 in no-NO locale is "15.1.2026" or similar
    const dateTexts = screen.getAllByText(/Fra \d/);
    expect(dateTexts.length).toBeGreaterThan(0);
  });

  it('should not show prescriptions section when no prescriptions exist', async () => {
    progressAPI.getPatientStats.mockResolvedValue({
      data: {
        summary: { totalCompletions: 10, activeDays: 5, currentStreak: 2, avgPain: null },
        prescriptions: [],
      },
    });

    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Pasientfremgang')).toBeInTheDocument();
    });

    expect(screen.queryByText('Treningsforskrivninger')).not.toBeInTheDocument();
  });

  it('should display dash for avgPain when no pain data in summary', async () => {
    progressAPI.getPatientStats.mockResolvedValue({
      data: {
        summary: { totalCompletions: 10, activeDays: 5, currentStreak: 0, avgPain: null },
        prescriptions: [],
      },
    });

    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Gj.snitt smerte')).toBeInTheDocument();
    });

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('should show weekly chart loading spinner while data is loading', () => {
    progressAPI.getWeeklyCompliance.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<PatientProgress />);

    // The heading should be visible but not the chart
    expect(screen.getByText('Ukentlig fremgang')).toBeInTheDocument();
    expect(screen.queryByTestId('progress-chart')).not.toBeInTheDocument();
  });

  it('should show pain tracker loading spinner while data is loading', () => {
    progressAPI.getPainHistory.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<PatientProgress />);

    expect(screen.getByText('Smerteniva over tid')).toBeInTheDocument();
    expect(screen.queryByTestId('pain-tracker')).not.toBeInTheDocument();
  });

  it('should show calendar loading spinner while daily data is loading', () => {
    progressAPI.getDailyProgress.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<PatientProgress />);

    expect(screen.getByText('Treningskalender')).toBeInTheDocument();
    expect(screen.queryByTestId('compliance-calendar')).not.toBeInTheDocument();
  });

  it('should not render summary stat cards when patientStats is null', async () => {
    progressAPI.getPatientStats.mockResolvedValue({ data: null });

    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Pasientfremgang')).toBeInTheDocument();
    });

    expect(screen.queryByText('Totale ovelser')).not.toBeInTheDocument();
    expect(screen.queryByText('Aktive dager')).not.toBeInTheDocument();
    expect(screen.queryByText('Navarende rekke')).not.toBeInTheDocument();
  });

  it('should display 0 values for missing summary fields', async () => {
    progressAPI.getPatientStats.mockResolvedValue({
      data: {
        summary: {},
        prescriptions: [],
      },
    });

    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('Totale ovelser')).toBeInTheDocument();
    });

    // All numeric fields should default to 0
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(3);
  });
});

// ========================
// PAIN EMOJI LOGIC TESTS
// ========================

describe('PatientProgress - Pain emoji rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPatientId = undefined;
    progressAPI.getAllPatientsCompliance.mockResolvedValue(mockAllPatientsCompliance);
    progressAPI.getClinicOverview.mockResolvedValue(mockClinicOverview);
  });

  it('should show Smile icon for low pain in clinic overview (avgPain30d = 1.5)', async () => {
    progressAPI.getClinicOverview.mockResolvedValue({
      data: {
        overview: {
          activePatients: 10,
          activeThisWeek: 5,
          totalCompletions: 100,
          avgPain30d: '1.5',
        },
        distribution: { excellent: 5, good: 3, fair: 1, low: 1, inactive: 0 },
      },
    });

    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('1.5')).toBeInTheDocument();
    });

    // Pain <= 2 should render Smile
    expect(screen.getByTestId('icon-smile')).toBeInTheDocument();
  });

  it('should show Frown icon for high pain in patient rows (pain > 5)', async () => {
    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      // Kari Hansen has recentAvgPain of 6.5 which is > 5
      expect(screen.getByText(/Smerte: 6.5/)).toBeInTheDocument();
    });

    // There should be a Frown icon present (for Kari's 6.5 pain)
    expect(screen.getByTestId('icon-frown')).toBeInTheDocument();
  });
});

// ========================
// COMPLIANCE COLOR TESTS
// ========================

describe('PatientProgress - Compliance color logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPatientId = undefined;
    progressAPI.getClinicOverview.mockResolvedValue({ data: null });
  });

  it('should apply green styling for compliance >= 80%', async () => {
    progressAPI.getAllPatientsCompliance.mockResolvedValue({
      data: {
        patients: [
          {
            patientId: 'p1',
            patientName: 'High Compliance',
            complianceRate: 90,
            activeDaysThisWeek: 6,
            recentAvgPain: null,
            lastActivity: null,
            status: { label: 'Utmerket' },
          },
        ],
      },
    });

    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('90%')).toBeInTheDocument();
    });

    // The percentage is in a <span> inside a <div> that carries the color class
    const percentSpan = screen.getByText('90%');
    const complianceCircle = percentSpan.closest('div');
    expect(complianceCircle.className).toContain('text-green-600');
    expect(complianceCircle.className).toContain('bg-green-100');
  });

  it('should apply red styling for compliance < 40%', async () => {
    progressAPI.getAllPatientsCompliance.mockResolvedValue({
      data: {
        patients: [
          {
            patientId: 'p1',
            patientName: 'Low Compliance',
            complianceRate: 25,
            activeDaysThisWeek: 1,
            recentAvgPain: null,
            lastActivity: null,
            status: { label: 'Lav' },
          },
        ],
      },
    });

    renderWithProviders(<PatientProgress />);

    await waitFor(() => {
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    const percentSpan = screen.getByText('25%');
    const complianceCircle = percentSpan.closest('div');
    expect(complianceCircle.className).toContain('text-red-600');
    expect(complianceCircle.className).toContain('bg-red-100');
  });
});
