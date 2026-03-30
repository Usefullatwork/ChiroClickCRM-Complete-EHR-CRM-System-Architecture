/**
 * AICostDashboard Tests
 *
 * Tests the admin AI cost dashboard showing budget, task breakdown,
 * cache metrics, and provider comparison.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    language: 'no',
  }),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import AICostDashboard from '../../../components/ai/AICostDashboard';

// Helper to create a successful fetch response
function mockResponse(data) {
  return Promise.resolve({
    json: () => Promise.resolve({ success: true, data }),
  });
}

// Helper to create a failed fetch response
function mockFailedResponse() {
  return Promise.resolve({
    json: () => Promise.resolve({ success: false, data: null }),
  });
}

const mockBudget = {
  daily: { spent: 2.5, remaining: 7.5, budget: 10, percentUsed: 25 },
  monthly: { spent: 45.0, remaining: 155.0, budget: 200, percentUsed: 22.5 },
};

const mockCostByTask = [
  {
    task_type: 'soap_suggestion',
    provider: 'ollama',
    request_count: '150',
    total_cost_usd: '0.00',
    avg_cost_per_request: '0.000000',
    total_input_tokens: '50000',
    total_output_tokens: '25000',
  },
  {
    task_type: 'diagnosis_assist',
    provider: 'claude',
    request_count: '30',
    total_cost_usd: '1.50',
    avg_cost_per_request: '0.050000',
    total_input_tokens: '20000',
    total_output_tokens: '10000',
  },
];

const mockCacheMetrics = [{ cache_hit_rate_pct: 42 }];

const mockProviders = [
  {
    provider: 'ollama',
    total_requests: '150',
    total_tokens: '75000',
    avg_latency_ms: '120',
    total_cost_usd: '0.00',
  },
  {
    provider: 'claude',
    total_requests: '30',
    total_tokens: '30000',
    avg_latency_ms: '2500',
    total_cost_usd: '1.50',
  },
];

describe('AICostDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupDefaultMocks() {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/budget')) return mockResponse(mockBudget);
      if (url.includes('/by-task')) return mockResponse(mockCostByTask);
      if (url.includes('/cache')) return mockResponse(mockCacheMetrics);
      if (url.includes('/trend')) return mockResponse([]);
      if (url.includes('/providers')) return mockResponse(mockProviders);
      return mockFailedResponse();
    });
  }

  it('should show loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<AICostDashboard />);

    // The loading text comes from t('loading')
    expect(screen.getByText('loading')).toBeDefined();
  });

  it('should render title and refresh button after loading', async () => {
    setupDefaultMocks();

    render(<AICostDashboard />);

    await waitFor(() => {
      expect(screen.getByText('AI Kostnadsoversikt')).toBeDefined();
    });

    expect(screen.getByText('Oppdater')).toBeDefined();
  });

  it('should display daily budget information', async () => {
    setupDefaultMocks();

    render(<AICostDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Daglig/)).toBeDefined();
    });

    expect(screen.getByText(/\$2\.50/)).toBeDefined();
    expect(screen.getByText(/\$7\.50/)).toBeDefined();
    expect(screen.getByText(/25%/)).toBeDefined();
  });

  it('should display monthly budget information', async () => {
    setupDefaultMocks();

    render(<AICostDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Månedlig/)).toBeDefined();
    });

    expect(screen.getByText(/\$45\.00/)).toBeDefined();
    expect(screen.getByText(/\$155\.00/)).toBeDefined();
  });

  it('should display summary stat cards', async () => {
    setupDefaultMocks();

    render(<AICostDashboard />);

    // Wait for data to load (title appears after loading finishes)
    await waitFor(() => {
      expect(screen.getByText('AI Kostnadsoversikt')).toBeDefined();
    });

    // Total requests: 150 + 30 = 180
    expect(screen.getByText('180')).toBeDefined();
    // Total cost
    expect(screen.getByText('$1.50')).toBeDefined();
    // Cache hit rate
    expect(screen.getByText('42%')).toBeDefined();
  });

  it('should display task breakdown table', async () => {
    setupDefaultMocks();

    render(<AICostDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Kostnader per oppgave')).toBeDefined();
    });

    expect(screen.getByText('soap_suggestion')).toBeDefined();
    expect(screen.getByText('diagnosis_assist')).toBeDefined();
    // "ollama" and "claude" appear in both task table and provider table
    expect(screen.getAllByText('ollama').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('claude').length).toBeGreaterThanOrEqual(1);
  });

  it('should display provider comparison table', async () => {
    setupDefaultMocks();

    render(<AICostDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Leverandørsammenligning')).toBeDefined();
    });

    // Latency values are rendered as {value}ms in the same td
    expect(screen.getByText(/120.*ms/)).toBeDefined();
    expect(screen.getByText(/2500.*ms/)).toBeDefined();
  });

  it('should show no data message when task breakdown is empty', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/budget')) return mockResponse(null);
      if (url.includes('/by-task')) return mockResponse([]);
      if (url.includes('/cache')) return mockResponse([]);
      if (url.includes('/trend')) return mockResponse([]);
      if (url.includes('/providers')) return mockResponse([]);
      return mockFailedResponse();
    });

    render(<AICostDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Ingen data tilgjengelig')).toBeDefined();
    });
  });

  it('should call refresh when the refresh button is clicked', async () => {
    setupDefaultMocks();

    render(<AICostDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Oppdater')).toBeDefined();
    });

    // Clear to track the refresh call
    mockFetch.mockClear();
    setupDefaultMocks();

    fireEvent.click(screen.getByText('Oppdater'));

    await waitFor(() => {
      // 5 API calls per load (budget, by-task, cache, trend, providers)
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });
  });

  it('should gracefully handle API errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<AICostDashboard />);

    // Should render without crashing, showing empty state
    await waitFor(() => {
      expect(screen.getByText('AI Kostnadsoversikt')).toBeDefined();
    });
  });

  it('should display N/A for cache hit rate when no cache data exists', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/budget')) return mockResponse(null);
      if (url.includes('/by-task')) return mockResponse([]);
      if (url.includes('/cache')) return mockResponse([]);
      if (url.includes('/trend')) return mockResponse([]);
      if (url.includes('/providers')) return mockResponse([]);
      return mockFailedResponse();
    });

    render(<AICostDashboard />);

    await waitFor(() => {
      expect(screen.getByText('N/A')).toBeDefined();
    });
  });
});
