import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../services/api', () => ({
  encountersAPI: {
    getByPatient: vi.fn().mockResolvedValue({ data: [] }),
  },
  examinationsAPI: {
    getFindingsByEncounter: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock(
  'lucide-react',
  () => new Proxy({}, { get: (_, name) => (props) => <span data-testid={`icon-${name}`} /> })
);

import ExaminationHistory from '../../components/ExaminationHistory';

function renderWithQuery(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('ExaminationHistory', () => {
  it('returns null when no patientId', () => {
    const { container } = renderWithQuery(
      <ExaminationHistory patientId={null} currentEncounterId="e1" />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders comparison header when patientId is provided', () => {
    renderWithQuery(<ExaminationHistory patientId="p1" currentEncounterId="e1" />);
    expect(screen.getByText('Sammenligning med tidligere')).toBeInTheDocument();
  });

  it('shows empty state when no previous encounters', async () => {
    renderWithQuery(<ExaminationHistory patientId="p1" currentEncounterId="e1" />);
    expect(await screen.findByText('Ingen tidligere konsultasjoner')).toBeInTheDocument();
  });

  it('renders the encounter select when past encounters exist', async () => {
    const { encountersAPI } = await import('../../services/api');
    encountersAPI.getByPatient.mockResolvedValue({
      data: [
        { id: 'e1', encounter_date: '2025-01-15' },
        { id: 'e2', encounter_date: '2025-01-01' },
      ],
    });

    renderWithQuery(<ExaminationHistory patientId="p1" currentEncounterId="e1" />);
    expect(await screen.findByText('Velg tidligere konsultasjon...')).toBeInTheDocument();
  });
});
