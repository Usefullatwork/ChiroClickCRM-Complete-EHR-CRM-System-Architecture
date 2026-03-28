/**
 * AnalyticsTab Component Tests
 * Tests loading state, empty state, date range selector, CSV export, and data rendering
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mocks must be before component imports
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no' }),
  formatDate: () => '15.03.2024',
}));

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  trainingAPI: {
    getAnalyticsPerformance: vi.fn(),
    getAnalyticsUsage: vi.fn(),
    getAnalyticsSuggestions: vi.fn(),
    getAnalyticsRedFlags: vi.fn(),
    getAnalyticsComparison: vi.fn(),
    getCostPerSuggestion: vi.fn(),
    getProviderValue: vi.fn(),
    getCacheTrends: vi.fn(),
  },
  aiAPI: {
    getStatus: vi.fn(),
  },
}));

vi.mock('../../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), promise: vi.fn() },
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Test User', role: 'ADMIN' } }),
}));

// Mock recharts to avoid rendering issues in JSDOM
vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
}));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trainingAPI, aiAPI } from '../../../services/api';
import AnalyticsTab from '../../../components/training/AnalyticsTab';

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithProviders = (ui) => {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

function setupAPIMocks({
  comparison = [],
  usage = { daily: [], taskTypes: [] },
  suggestions = [],
  redFlag = { summary: {}, trend: [] },
  costData = [],
  providerData = [],
  cacheData = [],
  abTesting = {},
} = {}) {
  trainingAPI.getAnalyticsPerformance.mockResolvedValue({ data: { data: {} } });
  trainingAPI.getAnalyticsUsage.mockResolvedValue({ data: { data: usage } });
  trainingAPI.getAnalyticsSuggestions.mockResolvedValue({ data: { data: suggestions } });
  trainingAPI.getAnalyticsRedFlags.mockResolvedValue({ data: { data: redFlag } });
  trainingAPI.getAnalyticsComparison.mockResolvedValue({ data: { data: comparison } });
  trainingAPI.getCostPerSuggestion.mockResolvedValue({ data: { data: costData } });
  trainingAPI.getProviderValue.mockResolvedValue({ data: { data: providerData } });
  trainingAPI.getCacheTrends.mockResolvedValue({ data: { data: cacheData } });
  aiAPI.getStatus.mockResolvedValue({ data: { abTesting } });
}

describe('AnalyticsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading text while data is fetching', () => {
      // Never resolve to keep loading state
      trainingAPI.getAnalyticsPerformance.mockReturnValue(new Promise(() => {}));
      trainingAPI.getAnalyticsUsage.mockReturnValue(new Promise(() => {}));
      trainingAPI.getAnalyticsSuggestions.mockReturnValue(new Promise(() => {}));
      trainingAPI.getAnalyticsRedFlags.mockReturnValue(new Promise(() => {}));
      trainingAPI.getAnalyticsComparison.mockReturnValue(new Promise(() => {}));
      trainingAPI.getCostPerSuggestion.mockReturnValue(new Promise(() => {}));
      trainingAPI.getProviderValue.mockReturnValue(new Promise(() => {}));
      trainingAPI.getCacheTrends.mockReturnValue(new Promise(() => {}));
      aiAPI.getStatus.mockReturnValue(new Promise(() => {}));

      renderWithProviders(<AnalyticsTab />);
      expect(screen.getByText('Laster analysedata...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty messages when no data is available', async () => {
      setupAPIMocks();

      renderWithProviders(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('AI-analyse')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Ingen data enna\. AI-forslag vil vises her etter bruk\./)
      ).toBeInTheDocument();
      expect(screen.getByText('Ingen forslag registrert enna.')).toBeInTheDocument();
    });

    it('should show empty red flag message when no checks exist', async () => {
      setupAPIMocks();
      renderWithProviders(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('AI-analyse')).toBeInTheDocument();
      });

      expect(screen.getByText('Ingen red flag-analyser registrert enna.')).toBeInTheDocument();
    });

    it('should show empty A/B testing message when none configured', async () => {
      setupAPIMocks();
      renderWithProviders(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('AI-analyse')).toBeInTheDocument();
      });

      expect(screen.getByText(/Ingen A\/B-tester konfigurert/)).toBeInTheDocument();
    });
  });

  describe('Date Range Selector', () => {
    it('should render date range dropdown with default 30 days', async () => {
      setupAPIMocks();
      renderWithProviders(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('AI-analyse')).toBeInTheDocument();
      });

      const select = screen.getByDisplayValue('Siste 30 dager');
      expect(select).toBeInTheDocument();
    });

    it('should re-fetch data when date range changes', async () => {
      setupAPIMocks();
      renderWithProviders(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('AI-analyse')).toBeInTheDocument();
      });

      const select = screen.getByDisplayValue('Siste 30 dager');
      fireEvent.change(select, { target: { value: '7' } });

      await waitFor(() => {
        // Queries are re-triggered with new params
        expect(trainingAPI.getAnalyticsPerformance).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Comparison Data', () => {
    it('should render comparison table with model data', async () => {
      setupAPIMocks({
        comparison: [
          {
            model_name: 'chiro-no',
            total_suggestions: 100,
            approval_rate: '85',
            avg_user_rating: '4.2',
            avg_latency_ms: '320',
            total_feedback: '50',
          },
          {
            model_name: 'chiro-fast',
            total_suggestions: 80,
            approval_rate: '72',
            avg_user_rating: '3.8',
            avg_latency_ms: '150',
            total_feedback: '40',
          },
        ],
      });

      renderWithProviders(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('chiro-no')).toBeInTheDocument();
      });

      expect(screen.getByText('chiro-fast')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('72%')).toBeInTheDocument();
    });

    it('should show low feedback warning when models have < 30 feedback', async () => {
      setupAPIMocks({
        comparison: [
          {
            model_name: 'chiro-no',
            total_suggestions: 20,
            approval_rate: '85',
            avg_user_rating: '4.2',
            avg_latency_ms: '320',
            total_feedback: '15',
          },
        ],
      });

      renderWithProviders(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Statistisk usikre resultater/)).toBeInTheDocument();
      });
    });
  });

  describe('Suggestions Table', () => {
    it('should render suggestion rows with status badges', async () => {
      setupAPIMocks({
        suggestions: [
          {
            id: 1,
            created_at: '2024-03-15T10:00:00Z',
            task_type: 'soap_note',
            model_name: 'chiro-no',
            confidence_score: 0.92,
            latency_ms: 300,
            accepted: true,
          },
          {
            id: 2,
            created_at: '2024-03-15T11:00:00Z',
            task_type: 'diagnosis',
            model_name: 'chiro-fast',
            confidence_score: 0.78,
            latency_ms: 150,
            accepted: false,
          },
        ],
      });

      renderWithProviders(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('Godkjent')).toBeInTheDocument();
      });

      expect(screen.getByText('Avvist')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('300ms')).toBeInTheDocument();
    });

    it('should show CSV export button when suggestions exist', async () => {
      setupAPIMocks({
        suggestions: [
          {
            id: 1,
            created_at: '2024-03-15T10:00:00Z',
            task_type: 'soap_note',
            model_name: 'chiro-no',
            confidence_score: 0.92,
            latency_ms: 300,
            accepted: true,
          },
        ],
      });

      renderWithProviders(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('Siste AI-forslag')).toBeInTheDocument();
      });

      const csvButtons = screen.getAllByText('CSV');
      expect(csvButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Red Flag Accuracy', () => {
    it('should render stat cards when red flag data exists', async () => {
      setupAPIMocks({
        redFlag: {
          summary: {
            total_red_flag_checks: '100',
            true_positives: 85,
            false_positives: 5,
            precision_rate: 94,
          },
          trend: [],
        },
      });

      renderWithProviders(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
      });

      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('94%')).toBeInTheDocument();
    });
  });

  describe('Cost Data', () => {
    it('should render cost per suggestion bars when data exists', async () => {
      setupAPIMocks({
        costData: [
          { task_type: 'soap_note', avg_cost_usd: '0.0050', count: 42 },
          { task_type: 'diagnosis', avg_cost_usd: '0.0030', count: 18 },
        ],
      });

      renderWithProviders(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('soap_note')).toBeInTheDocument();
      });

      expect(screen.getByText('diagnosis')).toBeInTheDocument();
      expect(screen.getByText('$0.0050')).toBeInTheDocument();
      expect(screen.getByText('42 stk')).toBeInTheDocument();
    });
  });
});
