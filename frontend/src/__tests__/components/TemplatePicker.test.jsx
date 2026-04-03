import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

vi.mock('../../services/api', () => ({
  templatesAPI: {
    getByCategory: vi.fn().mockResolvedValue({ data: {} }),
    search: vi.fn().mockResolvedValue({ data: [] }),
    toggleFavorite: vi.fn(),
    incrementUsage: vi.fn(),
  },
}));

vi.mock(
  'lucide-react',
  () => new Proxy({}, { get: (_, name) => (props) => <span data-testid={`icon-${name}`} /> })
);

import TemplatePicker from '../../components/TemplatePicker';

function renderWithQuery(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('TemplatePicker', () => {
  it('returns null when not open', () => {
    const { container } = renderWithQuery(
      <TemplatePicker isOpen={false} onSelectTemplate={vi.fn()} onClose={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the panel when open', () => {
    renderWithQuery(<TemplatePicker isOpen={true} onSelectTemplate={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Kliniske Maler')).toBeInTheDocument();
  });

  it('renders close button with aria-label', () => {
    renderWithQuery(<TemplatePicker isOpen={true} onSelectTemplate={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByLabelText('Lukk')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderWithQuery(<TemplatePicker isOpen={true} onSelectTemplate={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText('Søk etter maler...')).toBeInTheDocument();
  });

  it('renders footer text', () => {
    renderWithQuery(<TemplatePicker isOpen={true} onSelectTemplate={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Klikk på en mal for å sette inn teksten')).toBeInTheDocument();
  });

  it('renders with template categories from API', async () => {
    const { templatesAPI } = await import('../../services/api');
    templatesAPI.getByCategory.mockResolvedValue({
      data: {
        Subjektiv: {
          Smerte: [{ id: 't1', name: 'Korsrygg', text: 'Pasienten opplever...' }],
        },
      },
    });

    renderWithQuery(<TemplatePicker isOpen={true} onSelectTemplate={vi.fn()} onClose={vi.fn()} />);
    expect(await screen.findByText('Subjektiv')).toBeInTheDocument();
  });
});
