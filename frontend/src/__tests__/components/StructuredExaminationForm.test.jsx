import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

vi.mock('../../services/api', () => ({
  examinationsAPI: {
    createFinding: vi.fn().mockResolvedValue({ data: {} }),
    updateFinding: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock(
  'lucide-react',
  () => new Proxy({}, { get: (_, name) => (props) => <span data-testid={`icon-${name}`} /> })
);

import StructuredExaminationForm from '../../components/StructuredExaminationForm';

const mockProtocol = {
  id: 'proto-1',
  test_name: 'Kemp Test',
  test_name_no: 'Kemp Test',
  body_region: 'Lumbar',
  category: 'Orthopedic',
  description_no: 'Test for facet joint pathology',
  positive_indication_no: 'Pain radiating to ipsilateral leg',
};

function renderWithQuery(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('StructuredExaminationForm', () => {
  it('returns null when not open', () => {
    const { container } = renderWithQuery(
      <StructuredExaminationForm
        protocol={mockProtocol}
        encounterId="e1"
        isOpen={false}
        onClose={vi.fn()}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders form when open', () => {
    renderWithQuery(
      <StructuredExaminationForm
        protocol={mockProtocol}
        encounterId="e1"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Kemp Test')).toBeInTheDocument();
  });

  it('displays body region and category', () => {
    renderWithQuery(
      <StructuredExaminationForm
        protocol={mockProtocol}
        encounterId="e1"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/Lumbar.*Orthopedic/)).toBeInTheDocument();
  });

  it('displays protocol description', () => {
    renderWithQuery(
      <StructuredExaminationForm
        protocol={mockProtocol}
        encounterId="e1"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Test for facet joint pathology')).toBeInTheDocument();
  });

  it('renders result select with options', () => {
    renderWithQuery(
      <StructuredExaminationForm
        protocol={mockProtocol}
        encounterId="e1"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Resultat *')).toBeInTheDocument();
    expect(screen.getByText('Ikke testet')).toBeInTheDocument();
    expect(screen.getByText('Positiv')).toBeInTheDocument();
    expect(screen.getByText('Negativ')).toBeInTheDocument();
  });

  it('renders laterality select', () => {
    renderWithQuery(
      <StructuredExaminationForm
        protocol={mockProtocol}
        encounterId="e1"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Lateralitet')).toBeInTheDocument();
  });

  it('renders save and cancel buttons', () => {
    renderWithQuery(
      <StructuredExaminationForm
        protocol={mockProtocol}
        encounterId="e1"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Lagre')).toBeInTheDocument();
    expect(screen.getByText('Avbryt')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    renderWithQuery(
      <StructuredExaminationForm
        protocol={mockProtocol}
        encounterId="e1"
        isOpen={true}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByText('Avbryt'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows severity select when result is positive', () => {
    renderWithQuery(
      <StructuredExaminationForm
        protocol={mockProtocol}
        encounterId="e1"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    const resultSelect = screen.getByText('Resultat *').closest('div').querySelector('select');
    fireEvent.change(resultSelect, { target: { value: 'positive' } });
    expect(screen.getByText('Alvorlighetsgrad')).toBeInTheDocument();
  });
});
