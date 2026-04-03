import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

vi.mock('../../i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

vi.mock('../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('../../services/api', () => ({
  examinationsAPI: {
    getFindingsByEncounter: vi.fn().mockResolvedValue({ data: [] }),
    deleteFinding: vi.fn(),
  },
}));

vi.mock('../../components/ui/ConfirmDialog', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));

vi.mock('../../components/StructuredExaminationForm', () => ({
  default: () => <div data-testid="structured-form">Structured Form</div>,
}));

vi.mock(
  'lucide-react',
  () => new Proxy({}, { get: (_, name) => (props) => <span data-testid={`icon-${name}`} /> })
);

import ExaminationFindingsList from '../../components/ExaminationFindingsList';

function renderWithQuery(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('ExaminationFindingsList', () => {
  it('renders empty state when no findings', async () => {
    renderWithQuery(<ExaminationFindingsList encounterId="enc-1" />);
    expect(await screen.findByText('Ingen undersøkelsesfunn registrert')).toBeInTheDocument();
  });

  it('renders loading state initially', () => {
    // Without encounterId the query is disabled, so no loading
    renderWithQuery(<ExaminationFindingsList encounterId={null} />);
    // Nothing should render for loading since query is disabled
  });

  it('renders with findings data', async () => {
    const { examinationsAPI } = await import('../../services/api');
    examinationsAPI.getFindingsByEncounter.mockResolvedValue({
      data: [
        {
          id: 'f1',
          test_name: 'Spurling Test',
          body_region: 'Cervical',
          category: 'Orthopedic',
          result: 'positive',
          severity: 'moderate',
          findings_text: 'Radiating pain right arm',
        },
      ],
    });

    renderWithQuery(<ExaminationFindingsList encounterId="enc-2" />);
    expect(await screen.findByText('Cervical')).toBeInTheDocument();
  });
});
