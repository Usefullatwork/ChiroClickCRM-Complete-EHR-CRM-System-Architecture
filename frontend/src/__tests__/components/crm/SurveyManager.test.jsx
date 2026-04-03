/**
 * SurveyManager Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

vi.mock('../../../services/api', () => ({
  crmAPI: {
    getSurveys: vi.fn().mockResolvedValue({ data: { surveys: [] } }),
    getNPSStats: vi.fn().mockResolvedValue({
      data: {
        promoters: 65,
        passives: 25,
        detractors: 10,
        score: 55,
        trend: 3,
        recentResponses: [],
      },
    }),
    createSurvey: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('../../../utils/toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
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

import SurveyManager from '../../../components/crm/SurveyManager';

describe('SurveyManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    render(<SurveyManager />);
    expect(screen.getByText('loadingSurveys')).toBeInTheDocument();
  });

  it('renders NPS score after loading', async () => {
    render(<SurveyManager />);
    await waitFor(() => {
      expect(screen.getByText('55')).toBeInTheDocument();
    });
  });

  it('renders promoter percentage', async () => {
    render(<SurveyManager />);
    await waitFor(() => {
      expect(screen.getByText('65%')).toBeInTheDocument();
    });
  });

  it('renders passive percentage', async () => {
    render(<SurveyManager />);
    await waitFor(() => {
      expect(screen.getByText('25%')).toBeInTheDocument();
    });
  });

  it('renders detractor percentage', async () => {
    render(<SurveyManager />);
    await waitFor(() => {
      expect(screen.getByText('10%')).toBeInTheDocument();
    });
  });

  it('renders new survey button', async () => {
    render(<SurveyManager />);
    await waitFor(() => {
      expect(screen.getByText('newSurvey')).toBeInTheDocument();
    });
  });

  it('renders tab navigation', async () => {
    render(<SurveyManager />);
    await waitFor(() => {
      expect(screen.getByText('tabOverview')).toBeInTheDocument();
      expect(screen.getByText('tabSurveys')).toBeInTheDocument();
      expect(screen.getByText('tabResponses')).toBeInTheDocument();
      expect(screen.getByText('tabAnalytics')).toBeInTheDocument();
    });
  });
});
