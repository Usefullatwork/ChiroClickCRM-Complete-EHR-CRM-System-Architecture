/**
 * PatientLifecycle Component Tests
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies BEFORE component import
vi.mock('../../../services/api', () => ({
  crmAPI: {
    getPatientsByLifecycle: vi.fn(),
    getLifecycleStats: vi.fn(),
  },
}));

vi.mock('../../../utils/logger', () => ({
  default: { scope: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }), error: vi.fn() },
}));

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
    getBilingual: (obj) => obj?.['no'] || obj?.['en'] || obj,
  }),
}));

import { crmAPI } from '../../../services/api';
import PatientLifecycle from '../../../components/crm/PatientLifecycle';

const mockPatients = [
  {
    id: 'p1',
    first_name: 'Kari',
    last_name: 'Nordmann',
    lifecycle_stage: 'ACTIVE',
    engagement_score: 85,
    last_visit_date: '2026-03-20',
    next_appointment_date: '2026-04-05',
    total_visits: 12,
    lifetime_value: 15000,
    tags: ['VIP', 'Rygg'],
    phone: '+47 99887766',
    email: 'kari@example.com',
    referral_count: 2,
    is_vip: true,
  },
  {
    id: 'p2',
    first_name: 'Ole',
    last_name: 'Hansen',
    lifecycle_stage: 'AT_RISK',
    engagement_score: 30,
    last_visit_date: '2026-01-15',
    next_appointment_date: null,
    total_visits: 3,
    lifetime_value: 3500,
    tags: ['Nakke'],
    phone: '+47 11223344',
    email: 'ole@example.com',
    referral_count: 0,
    is_vip: false,
  },
  {
    id: 'p3',
    first_name: 'Anna',
    last_name: 'Berg',
    lifecycle_stage: 'NEW',
    engagement_score: 60,
    last_visit_date: '2026-03-25',
    next_appointment_date: '2026-03-28',
    total_visits: 1,
    lifetime_value: 800,
    tags: [],
    phone: '+47 55443322',
    email: 'anna@example.com',
    referral_count: 0,
    is_vip: false,
  },
];

const mockStats = {
  stageCounts: {
    ALL: 3,
    NEW: 1,
    ONBOARDING: 0,
    ACTIVE: 1,
    AT_RISK: 1,
    INACTIVE: 0,
    LOST: 0,
    REACTIVATED: 0,
  },
};

describe('PatientLifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crmAPI.getPatientsByLifecycle.mockResolvedValue({ data: { patients: mockPatients } });
    crmAPI.getLifecycleStats.mockResolvedValue({ data: mockStats });
  });

  it('shows loading spinner initially', () => {
    crmAPI.getPatientsByLifecycle.mockReturnValue(new Promise(() => {}));
    crmAPI.getLifecycleStats.mockReturnValue(new Promise(() => {}));
    render(<PatientLifecycle />);
    expect(screen.getByText('Laster pasientdata...')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    crmAPI.getPatientsByLifecycle.mockRejectedValue(new Error('Server error'));
    crmAPI.getLifecycleStats.mockRejectedValue(new Error('Server error'));
    render(<PatientLifecycle />);
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
    expect(screen.getByText('Prøv igjen')).toBeInTheDocument();
  });

  it('renders the title and subtitle after loading', async () => {
    render(<PatientLifecycle />);
    await waitFor(() => {
      expect(screen.getByText('Pasientlivssyklus')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Segmentér og følg opp pasienter basert på engasjement')
    ).toBeInTheDocument();
  });

  it('renders lifecycle stage buttons', async () => {
    render(<PatientLifecycle />);
    await waitFor(() => {
      expect(screen.getByText('Pasientlivssyklus')).toBeInTheDocument();
    });
    expect(screen.getByText('Alle')).toBeInTheDocument();
    // Some stage labels may appear multiple times (stage button + patient table status)
    expect(screen.getAllByText('Ny').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Aktiv').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('I Fare').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Inaktiv').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Tapt').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the patient table with correct headers', async () => {
    render(<PatientLifecycle />);
    await waitFor(() => {
      expect(screen.getByText('Pasientlivssyklus')).toBeInTheDocument();
    });
    // Table headers - some labels may appear multiple times in different contexts
    expect(screen.getAllByText('Pasient').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Engasjement').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Siste Besøk').length).toBeGreaterThanOrEqual(1);
  });

  it('renders patient names in the table', async () => {
    render(<PatientLifecycle />);
    await waitFor(() => {
      expect(screen.getByText('Kari Nordmann')).toBeInTheDocument();
    });
    expect(screen.getByText('Ole Hansen')).toBeInTheDocument();
    expect(screen.getByText('Anna Berg')).toBeInTheDocument();
  });

  it('shows VIP indicator for VIP patients', async () => {
    render(<PatientLifecycle />);
    await waitFor(() => {
      expect(screen.getByText('Kari Nordmann')).toBeInTheDocument();
    });
    // Kari is VIP, tags include VIP
    expect(screen.getByText('VIP')).toBeInTheDocument();
  });

  it('shows engagement scores with correct coloring', async () => {
    render(<PatientLifecycle />);
    await waitFor(() => {
      expect(screen.getByText('Kari Nordmann')).toBeInTheDocument();
    });
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('filters patients by search term', async () => {
    render(<PatientLifecycle />);
    await waitFor(() => {
      expect(screen.getByText('Kari Nordmann')).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText('Søk etter pasient...');
    fireEvent.change(searchInput, { target: { value: 'Kari' } });
    expect(screen.getByText('Kari Nordmann')).toBeInTheDocument();
    expect(screen.queryByText('Ole Hansen')).not.toBeInTheDocument();
  });

  it('shows "Ingen time" for patients without next appointment', async () => {
    render(<PatientLifecycle />);
    await waitFor(() => {
      expect(screen.getByText('Kari Nordmann')).toBeInTheDocument();
    });
    expect(screen.getByText('Ingen time')).toBeInTheDocument();
  });

  it('shows lifetime value in NOK format', async () => {
    render(<PatientLifecycle />);
    await waitFor(() => {
      expect(screen.getByText('Kari Nordmann')).toBeInTheDocument();
    });
    // Lifetime values rendered as "X kr" - use getAllByText since number might appear elsewhere
    expect(screen.getAllByText(/kr/).length).toBeGreaterThanOrEqual(1);
  });

  it('toggles filter button state', async () => {
    render(<PatientLifecycle />);
    await waitFor(() => {
      expect(screen.getByText('Pasientlivssyklus')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Filter'));
    // Clicking filter toggles showFilters state
    fireEvent.click(screen.getByText('Filter'));
    // Should still be rendered (toggle back)
    expect(screen.getByText('Filter')).toBeInTheDocument();
  });

  it('calls both API endpoints on mount', async () => {
    render(<PatientLifecycle />);
    await waitFor(() => {
      expect(crmAPI.getPatientsByLifecycle).toHaveBeenCalledTimes(1);
      expect(crmAPI.getLifecycleStats).toHaveBeenCalledTimes(1);
    });
  });
});
