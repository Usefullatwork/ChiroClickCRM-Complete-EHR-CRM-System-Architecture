/**
 * KPI Dashboard Page Tests
 *
 * Tests for the KPI dashboard: metric cards, date range filter,
 * category breakdown table, geographic distribution, treatment
 * type analysis, loading states, and empty data handling.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Module-level mocks (BEFORE component import)
// ---------------------------------------------------------------------------

vi.mock('../../services/api', () => ({
  kpiAPI: {
    getDetailedKPIs: vi.fn(),
    getDashboard: vi.fn(),
    getDaily: vi.fn(),
    getWeekly: vi.fn(),
    getMonthly: vi.fn(),
    getPatientRetention: vi.fn(),
    getRebookingRate: vi.fn(),
    getTopDiagnoses: vi.fn(),
    getCategoryBreakdown: vi.fn(),
    getGeographicDistribution: vi.fn(),
    importData: vi.fn(),
  },
}));

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key) => key,
    lang: 'no',
  }),
  formatDate: () => '15.03.2024',
  formatTime: () => '10:00',
  formatDateWithWeekday: () => 'Mandag 15. mars 2024',
  formatDateShort: () => '15.03.2024',
}));

// Mock lucide-react icons as simple spans
vi.mock('lucide-react', () => ({
  TrendingUp: (props) => (
    <span data-testid="trending-up" {...props}>
      TrendingUp
    </span>
  ),
  TrendingDown: (props) => (
    <span data-testid="trending-down" {...props}>
      TrendingDown
    </span>
  ),
  Users: (props) => (
    <span data-testid="users-icon" {...props}>
      Users
    </span>
  ),
  MapPin: (props) => (
    <span data-testid="map-pin" {...props}>
      MapPin
    </span>
  ),
  Activity: (props) => (
    <span data-testid="activity-icon" {...props}>
      Activity
    </span>
  ),
}));

// ---------------------------------------------------------------------------
// Component + API import (AFTER mocks)
// ---------------------------------------------------------------------------

import KPI from '../../pages/KPI';
import { kpiAPI } from '../../services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

const renderKPI = () => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <KPI />
    </QueryClientProvider>
  );
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockKPIData = {
  data: {
    overview: {
      rebooking_rate: 82.5,
      rebooked_patients: 33,
      total_patients: 40,
    },
    by_category: [
      {
        category: 'Acute',
        patient_count: 15,
        total_visits: 30,
        avg_visits_per_patient: '2.0',
        rebooking_rate: '80.0',
      },
      {
        category: 'Chronic',
        patient_count: 25,
        total_visits: 100,
        avg_visits_per_patient: '4.0',
        rebooking_rate: '88.0',
      },
    ],
    by_geography: [
      {
        location_type: 'Oslo',
        patient_count: 30,
        total_visits: 90,
        avg_visits_per_patient: '3.0',
      },
      {
        location_type: 'Baerum',
        patient_count: 10,
        total_visits: 40,
        avg_visits_per_patient: '4.0',
      },
    ],
    by_treatment_type: [
      {
        treatment_type: 'Manipulasjon',
        patient_count: 35,
        treatment_count: 100,
        avg_treatments_per_patient: '2.9',
      },
    ],
    follow_up_status: {
      SMS: 12,
      Email: 8,
      Phone: 5,
    },
    by_referral_source: [
      { referral_source: 'Google', patient_count: 20 },
      { referral_source: 'Henvisning', patient_count: 15 },
    ],
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('KPI Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Never resolve — keeps component in loading state
    kpiAPI.getDetailedKPIs.mockReturnValue(new Promise(() => {}));
    renderKPI();

    expect(screen.getByText('kpiDashboard')).toBeInTheDocument();
    expect(screen.getByText('loadingMetrics')).toBeInTheDocument();
  });

  it('renders without crashing when data loads', async () => {
    kpiAPI.getDetailedKPIs.mockResolvedValue(mockKPIData);
    renderKPI();

    await waitFor(() => {
      expect(screen.getByText('practiceMetrics')).toBeInTheDocument();
    });

    // Page heading visible
    expect(screen.getByText('kpiDashboard')).toBeInTheDocument();
  });

  it('displays the four overview metric cards', async () => {
    kpiAPI.getDetailedKPIs.mockResolvedValue(mockKPIData);
    renderKPI();

    await waitFor(() => {
      // rebookingRate appears in card title AND in table header
      expect(screen.getAllByText('rebookingRate').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText('82.5%')).toBeInTheDocument();
    expect(screen.getByText('totalPatients')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('patientCategories')).toBeInTheDocument();
    expect(screen.getByText('geographicAreas')).toBeInTheDocument();
  });

  it('renders the category breakdown table with data', async () => {
    kpiAPI.getDetailedKPIs.mockResolvedValue(mockKPIData);
    renderKPI();

    await waitFor(() => {
      expect(screen.getByText('patientCategoryBreakdown')).toBeInTheDocument();
    });

    // Table column headers
    expect(screen.getByText('category')).toBeInTheDocument();
    expect(screen.getAllByText('patients').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('visits')).toBeInTheDocument();
    expect(screen.getByText('avgVisits')).toBeInTheDocument();

    // Table data rows
    expect(screen.getByText('Acute')).toBeInTheDocument();
    expect(screen.getByText('Chronic')).toBeInTheDocument();
  });

  it('renders geographic distribution cards', async () => {
    kpiAPI.getDetailedKPIs.mockResolvedValue(mockKPIData);
    renderKPI();

    await waitFor(() => {
      expect(screen.getByText('geographicDistribution')).toBeInTheDocument();
    });

    expect(screen.getByText('Oslo')).toBeInTheDocument();
    expect(screen.getByText('Baerum')).toBeInTheDocument();
  });

  it('renders treatment type analysis table', async () => {
    kpiAPI.getDetailedKPIs.mockResolvedValue(mockKPIData);
    renderKPI();

    await waitFor(() => {
      expect(screen.getByText('treatmentTypeAnalysis')).toBeInTheDocument();
    });

    expect(screen.getByText('treatmentType')).toBeInTheDocument();
    expect(screen.getByText('treatments')).toBeInTheDocument();
    expect(screen.getByText('Manipulasjon')).toBeInTheDocument();
  });

  it('renders follow-up status section when data is present', async () => {
    kpiAPI.getDetailedKPIs.mockResolvedValue(mockKPIData);
    renderKPI();

    await waitFor(() => {
      expect(screen.getByText('followUpStatus')).toBeInTheDocument();
    });

    expect(screen.getByText('SMS')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders referral sources table when data is present', async () => {
    kpiAPI.getDetailedKPIs.mockResolvedValue(mockKPIData);
    renderKPI();

    await waitFor(() => {
      expect(screen.getByText('referralSources')).toBeInTheDocument();
    });

    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Henvisning')).toBeInTheDocument();
  });

  it('changes date range when selecting a different period', async () => {
    kpiAPI.getDetailedKPIs.mockResolvedValue(mockKPIData);
    renderKPI();

    await waitFor(() => {
      expect(screen.getByText('practiceMetrics')).toBeInTheDocument();
    });

    // The select element is present with role combobox
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('30');

    // Change to 7 days
    fireEvent.change(select, { target: { value: '7' } });

    // API should be called again with new date range
    await waitFor(() => {
      expect(kpiAPI.getDetailedKPIs).toHaveBeenCalledTimes(2);
    });
  });

  it('handles empty data gracefully', async () => {
    kpiAPI.getDetailedKPIs.mockResolvedValue({
      data: {
        overview: { rebooking_rate: 0, rebooked_patients: 0, total_patients: 0 },
        by_category: [],
        by_geography: [],
        by_treatment_type: [],
        follow_up_status: null,
        by_referral_source: [],
      },
    });
    renderKPI();

    // Wait for data to load (loading state disappears)
    await waitFor(() => {
      expect(screen.getByText('practiceMetrics')).toBeInTheDocument();
    });

    // Metric cards should show zero values
    expect(screen.getByText('0%')).toBeInTheDocument();

    // Section headings still present even with no data rows
    expect(screen.getByText('patientCategoryBreakdown')).toBeInTheDocument();
    expect(screen.getByText('geographicDistribution')).toBeInTheDocument();
    expect(screen.getByText('treatmentTypeAnalysis')).toBeInTheDocument();
  });

  it('shows correct trend indicator based on rebooking rate', async () => {
    kpiAPI.getDetailedKPIs.mockResolvedValue(mockKPIData);
    renderKPI();

    await waitFor(() => {
      // With 82.5% rebooking rate (>= 75), trend should be 'up'
      expect(screen.getByText('82.5%')).toBeInTheDocument();
    });

    // TrendingUp icon should be rendered (one in MetricCard + one in the card's icon)
    const trendingUpIcons = screen.getAllByTestId('trending-up');
    expect(trendingUpIcons.length).toBeGreaterThanOrEqual(1);
  });

  it('has all four date range options in the selector', async () => {
    kpiAPI.getDetailedKPIs.mockResolvedValue(mockKPIData);
    renderKPI();

    await waitFor(() => {
      expect(screen.getByText('practiceMetrics')).toBeInTheDocument();
    });

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('last7days');
    expect(options[1]).toHaveTextContent('last30days');
    expect(options[2]).toHaveTextContent('last90days');
    expect(options[3]).toHaveTextContent('lastYearPeriod');
  });
});
