import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

vi.mock('../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { notes: [] } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

import OldNotesImporter from '../../components/OldNotesImporter';

function renderWithQuery(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('OldNotesImporter', () => {
  it('renders the header with title', () => {
    renderWithQuery(<OldNotesImporter patientId="p1" onClose={vi.fn()} />);
    expect(screen.getByText('Importer gamle journalnotater')).toBeInTheDocument();
  });

  it('renders how it works section', () => {
    renderWithQuery(<OldNotesImporter patientId="p1" onClose={vi.fn()} />);
    expect(screen.getByText('Slik fungerer det')).toBeInTheDocument();
  });

  it('renders single and multiple upload tabs', () => {
    renderWithQuery(<OldNotesImporter patientId="p1" onClose={vi.fn()} />);
    expect(screen.getByText('Enkelt notat')).toBeInTheDocument();
    expect(screen.getByText('Flere notater')).toBeInTheDocument();
  });

  it('renders textarea for note content in single mode', () => {
    renderWithQuery(<OldNotesImporter patientId="p1" onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText('Lim inn gammelt journalnotat her...')).toBeInTheDocument();
  });

  it('has an upload button', () => {
    renderWithQuery(<OldNotesImporter patientId="p1" onClose={vi.fn()} />);
    expect(screen.getByText('Last opp notat')).toBeInTheDocument();
  });

  it('has a close button with aria-label', () => {
    renderWithQuery(<OldNotesImporter patientId="p1" onClose={vi.fn()} />);
    expect(screen.getByLabelText('Lukk')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderWithQuery(<OldNotesImporter patientId="p1" onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Lukk'));
    expect(onClose).toHaveBeenCalled();
  });

  it('switches to multiple notes mode', () => {
    renderWithQuery(<OldNotesImporter patientId="p1" onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Flere notater'));
    expect(screen.getByText('+ Legg til nytt notat')).toBeInTheDocument();
  });

  it('renders checkbox for AI processing', () => {
    renderWithQuery(<OldNotesImporter patientId="p1" onClose={vi.fn()} />);
    expect(screen.getByText('Prosesser med AI umiddelbart')).toBeInTheDocument();
  });

  it('renders imported notes section', () => {
    renderWithQuery(<OldNotesImporter patientId="p1" onClose={vi.fn()} />);
    expect(screen.getByText('Importerte notater')).toBeInTheDocument();
  });
});
