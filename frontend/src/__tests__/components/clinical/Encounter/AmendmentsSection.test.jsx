/**
 * AmendmentsSection Tests
 *
 * Tests:
 * - Renders null when not signed
 * - Shows amendment form toggle
 * - Amendment type selector
 * - Amendment list display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  FileText: (props) => null,
  Save: (props) => null,
  Loader2: (props) => null,
  Lock: (props) => null,
}));

vi.mock('../../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
  useLanguage: () => ({ lang: 'no', setLang: vi.fn() }),
  LanguageProvider: ({ children }) => children,
}));

vi.mock('../../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
}));

import AmendmentsSection from '../../../../components/clinical/Encounter/AmendmentsSection';

describe('AmendmentsSection', () => {
  const defaultProps = {
    isSigned: true,
    showAmendmentForm: false,
    setShowAmendmentForm: vi.fn(),
    amendmentType: 'ADDENDUM',
    setAmendmentType: vi.fn(),
    amendmentReason: '',
    setAmendmentReason: vi.fn(),
    amendmentContent: '',
    setAmendmentContent: vi.fn(),
    handleCreateAmendment: vi.fn(),
    createAmendmentMutation: { isPending: false },
    amendments: { data: [] },
    signAmendmentMutation: { mutate: vi.fn(), isPending: false },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when isSigned is false', () => {
    const { container } = render(<AmendmentsSection {...defaultProps} isSigned={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the section title when signed', () => {
    render(<AmendmentsSection {...defaultProps} />);
    expect(screen.getByText('TILLEGG / RETTELSER')).toBeInTheDocument();
  });

  it('renders the add amendment button', () => {
    render(<AmendmentsSection {...defaultProps} />);
    expect(screen.getByText('Legg til Tillegg')).toBeInTheDocument();
  });

  it('calls setShowAmendmentForm when add button is clicked', () => {
    render(<AmendmentsSection {...defaultProps} />);
    fireEvent.click(screen.getByText('Legg til Tillegg'));
    expect(defaultProps.setShowAmendmentForm).toHaveBeenCalledWith(true);
  });

  it('renders the amendment form when showAmendmentForm is true', () => {
    render(<AmendmentsSection {...defaultProps} showAmendmentForm={true} />);
    expect(screen.getByText('Tillegg (ny informasjon)')).toBeInTheDocument();
    expect(screen.getByText('Innhold')).toBeInTheDocument();
  });

  it('renders amendment type selector options', () => {
    render(<AmendmentsSection {...defaultProps} showAmendmentForm={true} />);
    expect(screen.getByText('Tillegg (ny informasjon)')).toBeInTheDocument();
    expect(screen.getByText('Rettelse (korrigering av feil)')).toBeInTheDocument();
    expect(screen.getByText('Avklaring (utdyping)')).toBeInTheDocument();
    expect(screen.getByText('Sen registrering')).toBeInTheDocument();
  });

  it('shows correction reason field when CORRECTION type is selected', () => {
    render(
      <AmendmentsSection {...defaultProps} showAmendmentForm={true} amendmentType="CORRECTION" />
    );
    // Text has " *" suffix for required field indicator
    expect(screen.getByText(/Begrunnelse for rettelse/)).toBeInTheDocument();
  });

  it('renders Lagre Tillegg button', () => {
    render(<AmendmentsSection {...defaultProps} showAmendmentForm={true} />);
    expect(screen.getByText('Lagre Tillegg')).toBeInTheDocument();
  });

  it('renders Avbryt button', () => {
    render(<AmendmentsSection {...defaultProps} showAmendmentForm={true} />);
    expect(screen.getByText('Avbryt')).toBeInTheDocument();
  });

  it('disables save when content is empty', () => {
    render(<AmendmentsSection {...defaultProps} showAmendmentForm={true} amendmentContent="" />);
    const saveBtn = screen.getByText('Lagre Tillegg');
    expect(saveBtn).toBeDisabled();
  });

  it('renders existing amendments', () => {
    const amendments = {
      data: [
        {
          id: 'amend-1',
          amendment_type: 'ADDENDUM',
          content: 'Tillegg om treningsøvelser',
          created_at: '2026-03-30T10:00:00Z',
          signed_at: null,
          author_name: 'Dr. Hansen',
        },
      ],
    };
    render(<AmendmentsSection {...defaultProps} amendments={amendments} />);
    expect(screen.getByText('Tillegg')).toBeInTheDocument();
    expect(screen.getByText('Tillegg om treningsøvelser')).toBeInTheDocument();
    expect(screen.getByText(/Dr. Hansen/)).toBeInTheDocument();
  });

  it('shows sign button for unsigned amendments', () => {
    const amendments = {
      data: [
        {
          id: 'amend-1',
          amendment_type: 'ADDENDUM',
          content: 'Test',
          created_at: '2026-03-30T10:00:00Z',
          signed_at: null,
          author_name: 'Dr. Hansen',
        },
      ],
    };
    render(<AmendmentsSection {...defaultProps} amendments={amendments} />);
    expect(screen.getByText('Signer')).toBeInTheDocument();
  });

  it('shows signed indicator for signed amendments', () => {
    const amendments = {
      data: [
        {
          id: 'amend-1',
          amendment_type: 'ADDENDUM',
          content: 'Test',
          created_at: '2026-03-30T10:00:00Z',
          signed_at: '2026-03-30T11:00:00Z',
          author_name: 'Dr. Hansen',
          signed_by_name: 'Dr. Hansen',
        },
      ],
    };
    render(<AmendmentsSection {...defaultProps} amendments={amendments} />);
    expect(screen.getByText('Signert')).toBeInTheDocument();
  });

  it('shows empty state message when no amendments and form is hidden', () => {
    render(<AmendmentsSection {...defaultProps} />);
    expect(screen.getByText(/Ingen tillegg eller rettelser ennå/)).toBeInTheDocument();
  });
});
