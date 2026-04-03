/**
 * AmendmentSection Component Tests
 * Tests rendering, amendment form, signed/unsigned states, and amendment list.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => ({
  FileText: () => null,
  Save: () => null,
  Loader2: () => null,
  Lock: () => null,
}));

import { AmendmentSection } from '../../../components/encounter/AmendmentSection';

function buildProps(overrides = {}) {
  return {
    isSigned: true,
    amendments: { data: [] },
    showAmendmentForm: false,
    setShowAmendmentForm: vi.fn(),
    amendmentContent: '',
    setAmendmentContent: vi.fn(),
    amendmentType: 'ADDENDUM',
    setAmendmentType: vi.fn(),
    amendmentReason: '',
    setAmendmentReason: vi.fn(),
    handleCreateAmendment: vi.fn(),
    createAmendmentMutation: { isPending: false },
    signAmendmentMutation: { isPending: false, mutate: vi.fn() },
    ...overrides,
  };
}

describe('AmendmentSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isSigned is false', () => {
    const { container } = render(<AmendmentSection {...buildProps({ isSigned: false })} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the section header when signed', () => {
    render(<AmendmentSection {...buildProps()} />);
    expect(screen.getByText('TILLEGG / RETTELSER')).toBeTruthy();
  });

  it('shows the add-amendment button when form is hidden', () => {
    render(<AmendmentSection {...buildProps()} />);
    expect(screen.getByText('Legg til Tillegg')).toBeTruthy();
  });

  it('calls setShowAmendmentForm when add button is clicked', () => {
    const setShowAmendmentForm = vi.fn();
    render(<AmendmentSection {...buildProps({ setShowAmendmentForm })} />);
    fireEvent.click(screen.getByText('Legg til Tillegg'));
    expect(setShowAmendmentForm).toHaveBeenCalledWith(true);
  });

  it('renders the amendment form when showAmendmentForm is true', () => {
    render(<AmendmentSection {...buildProps({ showAmendmentForm: true })} />);
    expect(screen.getByText('Innhold')).toBeTruthy();
    expect(screen.getByText('Lagre Tillegg')).toBeTruthy();
    expect(screen.getByText('Avbryt')).toBeTruthy();
  });

  it('shows reason field when type is CORRECTION', () => {
    render(
      <AmendmentSection {...buildProps({ showAmendmentForm: true, amendmentType: 'CORRECTION' })} />
    );
    expect(screen.getByText(/Begrunnelse for rettelse/)).toBeTruthy();
  });

  it('hides reason field for non-CORRECTION types', () => {
    render(
      <AmendmentSection {...buildProps({ showAmendmentForm: true, amendmentType: 'ADDENDUM' })} />
    );
    expect(screen.queryByText(/Begrunnelse for rettelse/)).toBeNull();
  });

  it('disables save when content is empty', () => {
    render(<AmendmentSection {...buildProps({ showAmendmentForm: true, amendmentContent: '' })} />);
    const saveBtn = screen.getByText('Lagre Tillegg').closest('button');
    expect(saveBtn.disabled).toBe(true);
  });

  it('enables save when content is filled', () => {
    render(
      <AmendmentSection
        {...buildProps({ showAmendmentForm: true, amendmentContent: 'Test content' })}
      />
    );
    const saveBtn = screen.getByText('Lagre Tillegg').closest('button');
    expect(saveBtn.disabled).toBe(false);
  });

  it('renders existing amendments', () => {
    const amendments = {
      data: [
        {
          id: 1,
          amendment_type: 'ADDENDUM',
          content: 'First amendment',
          created_at: '2026-01-01T10:00:00Z',
          signed_at: null,
          author_name: 'Dr. Test',
        },
      ],
    };
    render(<AmendmentSection {...buildProps({ amendments })} />);
    expect(screen.getByText('First amendment')).toBeTruthy();
    expect(screen.getByText('Tillegg')).toBeTruthy();
    expect(screen.getByText(/Dr. Test/)).toBeTruthy();
  });

  it('shows Signer button for unsigned amendments', () => {
    const amendments = {
      data: [
        {
          id: 1,
          amendment_type: 'CORRECTION',
          content: 'Fix',
          created_at: '2026-01-01T10:00:00Z',
          signed_at: null,
          reason: 'Wrong date',
          author_name: 'Dr. A',
        },
      ],
    };
    render(<AmendmentSection {...buildProps({ amendments })} />);
    expect(screen.getByText('Signer')).toBeTruthy();
  });

  it('shows Signert label for signed amendments', () => {
    const amendments = {
      data: [
        {
          id: 1,
          amendment_type: 'ADDENDUM',
          content: 'Signed content',
          created_at: '2026-01-01T10:00:00Z',
          signed_at: '2026-01-01T11:00:00Z',
          author_name: 'Dr. B',
          signed_by_name: 'Dr. B',
        },
      ],
    };
    render(<AmendmentSection {...buildProps({ amendments })} />);
    expect(screen.getByText('Signert')).toBeTruthy();
  });

  it('shows empty state message when no amendments exist', () => {
    render(<AmendmentSection {...buildProps()} />);
    expect(screen.getByText(/Ingen tillegg eller rettelser/i)).toBeTruthy();
  });
});
