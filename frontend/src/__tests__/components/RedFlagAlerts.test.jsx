import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../services/api', () => ({
  examinationsAPI: {
    getRedFlags: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock(
  'lucide-react',
  () => new Proxy({}, { get: (_, name) => (props) => <span data-testid={`icon-${name}`} /> })
);

import RedFlagAlerts from '../../components/RedFlagAlerts';

function renderWithQuery(ui) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchInterval: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('RedFlagAlerts', () => {
  it('returns null when loading', () => {
    const { container } = renderWithQuery(<RedFlagAlerts encounterId="e1" />);
    // Initially loading, so should return null
    expect(container.innerHTML).toBe('');
  });

  it('returns null when no red flags', async () => {
    const { container } = renderWithQuery(<RedFlagAlerts encounterId="e1" />);
    // After query resolves with empty data
    await vi.waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('renders red flag alerts when data exists', async () => {
    const { examinationsAPI } = await import('../../services/api');
    examinationsAPI.getRedFlags.mockResolvedValue({
      data: [
        {
          test_name: "L'hermitte Sign",
          severity: 'severe',
          finding: 'Positive bilateral',
          red_flag_criteria: 'Possible spinal cord compression',
        },
      ],
    });

    renderWithQuery(<RedFlagAlerts encounterId="e2" />);
    expect(await screen.findByText(/RØDE FLAGG OPPDAGET/)).toBeInTheDocument();
  });

  it('displays test name in alert', async () => {
    const { examinationsAPI } = await import('../../services/api');
    examinationsAPI.getRedFlags.mockResolvedValue({
      data: [
        {
          test_name: 'Babinski Sign',
          severity: 'severe',
          finding: 'Positive',
          red_flag_criteria: 'Upper motor neuron lesion',
        },
      ],
    });

    renderWithQuery(<RedFlagAlerts encounterId="e3" />);
    expect(await screen.findByText('Babinski Sign')).toBeInTheDocument();
  });

  it('displays recommended actions section', async () => {
    const { examinationsAPI } = await import('../../services/api');
    examinationsAPI.getRedFlags.mockResolvedValue({
      data: [{ test_name: 'Test', severity: 'moderate' }],
    });

    renderWithQuery(<RedFlagAlerts encounterId="e4" />);
    expect(await screen.findByText('Anbefalte tiltak:')).toBeInTheDocument();
  });
});
