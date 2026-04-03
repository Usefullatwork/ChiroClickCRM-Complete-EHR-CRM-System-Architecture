/**
 * RetentionDashboard Component Tests
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDashboardData = {
  data: {
    retention_rate: 85,
    previous_retention_rate: 80,
    trend: 5,
    monthly_churn: 3,
    avg_lifetime_months: 14,
    avg_visits_per_patient: 8,
    reactivation_rate: 12,
    new_patients: 24,
    reactivated: 6,
    churned: 4,
    at_risk: 18,
    net_change: 26,
    cohorts: [],
    segments: [],
  },
};

const mockChurnData = {
  data: {
    atRiskPatients: [
      {
        id: 1,
        name: 'Ola Nordmann',
        days_since_visit: 60,
        last_visit_date: '2026-01-15',
        total_visits: 12,
        risk_score: 75,
      },
    ],
  },
};

vi.mock('../../../services/api', () => ({
  crmAPI: {
    getRetentionDashboard: vi.fn().mockResolvedValue(mockDashboardData),
    getChurnAnalysis: vi.fn().mockResolvedValue(mockChurnData),
  },
}));

vi.mock('../../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    scope: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
  },
}));

vi.mock(
  'lucide-react',
  () =>
    new Proxy(
      {},
      {
        get: (_, name) => {
          if (name === '__esModule') return false;
          return (props) => null;
        },
      }
    )
);

import RetentionDashboard from '../../../components/crm/RetentionDashboard';

describe('RetentionDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    render(<RetentionDashboard />);
    expect(screen.getByText('Laster retensjonsdata...')).toBeInTheDocument();
  });

  it('renders header after loading', async () => {
    render(<RetentionDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Retensjonsanalyse')).toBeInTheDocument();
    });
  });

  it('renders time range buttons', async () => {
    render(<RetentionDashboard />);
    await waitFor(() => {
      expect(screen.getByText('7 dager')).toBeInTheDocument();
      expect(screen.getByText('30 dager')).toBeInTheDocument();
      expect(screen.getByText('90 dager')).toBeInTheDocument();
      expect(screen.getByText('1 år')).toBeInTheDocument();
    });
  });

  it('renders retention rate metric', async () => {
    render(<RetentionDashboard />);
    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  it('renders churn metric', async () => {
    render(<RetentionDashboard />);
    await waitFor(() => {
      expect(screen.getByText('3%')).toBeInTheDocument();
    });
  });

  it('renders at-risk patients table with data', async () => {
    render(<RetentionDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      expect(screen.getByText('60 dager')).toBeInTheDocument();
    });
  });

  it('renders insights sections', async () => {
    render(<RetentionDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Positive Trender')).toBeInTheDocument();
      expect(screen.getByText('Observasjoner')).toBeInTheDocument();
      expect(screen.getByText('Anbefalinger')).toBeInTheDocument();
    });
  });
});
