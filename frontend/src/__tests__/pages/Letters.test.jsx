/**
 * Letters, SickNotes, and ReferralLetters Page Tests
 * Tests for unified document management pages
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// ─── Shared mocks ─────────────────────────────────────────────────────────────

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

vi.mock('../../utils/logger', () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock('../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('../../api/letters', () => ({
  lettersApi: {
    getLetterTypes: vi.fn(),
    getAllLetters: vi.fn(),
    getPatientLetters: vi.fn(),
    saveLetter: vi.fn(),
    generateLetter: vi.fn(),
  },
}));

// Mock sub-components used inside SickNotes and ReferralLetters
vi.mock('../../components/documents/SickNoteGenerator', () => ({
  default: ({ onSave }) => (
    <div data-testid="sick-note-generator">
      <button onClick={() => onSave({ diagnosis: 'L84' })}>Save Sick Note</button>
    </div>
  ),
  getDefaultSickNoteData: () => ({
    patientName: '',
    diagnosis: '',
    dateFrom: '',
    dateTo: '',
    gradPercent: 100,
  }),
}));

vi.mock('../../components/documents/ReferralLetterGenerator', () => ({
  default: ({ onSave }) => (
    <div data-testid="referral-letter-generator">
      <button onClick={() => onSave({ referralType: 'orthopedic' })}>Save Referral</button>
    </div>
  ),
  getDefaultReferralData: () => ({
    patientName: '',
    referralType: 'orthopedic',
    priority: 'routine',
    clinicalFindings: '',
  }),
}));

import Letters from '../../pages/Letters';
import SickNotes from '../../pages/SickNotes';
import ReferralLetters from '../../pages/ReferralLetters';
import { lettersApi } from '../../api/letters';

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

// ══════════════════════════════════════════════════════════════════════════════
// Letters Page
// ══════════════════════════════════════════════════════════════════════════════

describe('Letters Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lettersApi.getLetterTypes.mockResolvedValue({ types: [] });
  });

  it('should render header with document management title', async () => {
    renderWithRouter(<Letters />);

    await waitFor(() => {
      expect(screen.getByText('documentsAndLetters')).toBeInTheDocument();
    });
  });

  it('should display dashboard view by default with document type cards', async () => {
    renderWithRouter(<Letters />);

    await waitFor(() => {
      expect(screen.getByText('createNewDocument')).toBeInTheDocument();
    });
  });

  it('should display recent letters in dashboard view', async () => {
    renderWithRouter(<Letters />);

    // The component uses hard-coded mock data — Ola Nordmann should appear
    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
  });

  it('should switch to list view when list button is clicked', async () => {
    renderWithRouter(<Letters />);

    const listButton = await screen.findByRole('button', { name: 'list' });
    fireEvent.click(listButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('searchByPatientOrTitle')).toBeInTheDocument();
    });
  });

  it('should render new document button in header', async () => {
    renderWithRouter(<Letters />);

    const newDocBtn = await screen.findByRole('button', { name: 'newDocument' });
    expect(newDocBtn).toBeInTheDocument();
  });

  it('should filter letters by search term in list view', async () => {
    renderWithRouter(<Letters />);

    // Switch to list view
    const listButton = await screen.findByRole('button', { name: 'list' });
    fireEvent.click(listButton);

    const searchInput = screen.getByPlaceholderText('searchByPatientOrTitle');
    fireEvent.change(searchInput, { target: { value: 'Ola' } });

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
  });

  it('should show AI letter generation card', async () => {
    renderWithRouter(<Letters />);

    await waitFor(() => {
      expect(screen.getByText('aiLetterGeneration')).toBeInTheDocument();
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SickNotes Page
// ══════════════════════════════════════════════════════════════════════════════

describe('SickNotes Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lettersApi.getPatientLetters.mockResolvedValue({ letters: [] });
  });

  it('should render sick notes list header', async () => {
    renderWithRouter(<SickNotes />);

    await waitFor(() => {
      expect(screen.getByText('sickNotes')).toBeInTheDocument();
    });
  });

  it('should render new sick note button', async () => {
    renderWithRouter(<SickNotes />);

    const newBtn = await screen.findByRole('button', { name: 'newSickNote' });
    expect(newBtn).toBeInTheDocument();
  });

  it('should switch to create view when new sick note button is clicked', async () => {
    renderWithRouter(<SickNotes />);

    const newBtn = await screen.findByRole('button', { name: 'newSickNote' });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByTestId('sick-note-generator')).toBeInTheDocument();
    });
  });

  it('should show empty state table when no sick notes exist', async () => {
    renderWithRouter(<SickNotes />);

    await waitFor(() => {
      expect(screen.getByText('noSickNotes')).toBeInTheDocument();
    });
  });

  it('should render search input in list view', async () => {
    renderWithRouter(<SickNotes />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('searchByPatientOrDiagnosis')).toBeInTheDocument();
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ReferralLetters Page
// ══════════════════════════════════════════════════════════════════════════════

describe('ReferralLetters Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lettersApi.getPatientLetters.mockResolvedValue({ letters: [] });
  });

  it('should render referrals list header', async () => {
    renderWithRouter(<ReferralLetters />);

    await waitFor(() => {
      expect(screen.getByText('referrals')).toBeInTheDocument();
    });
  });

  it('should render new referral button', async () => {
    renderWithRouter(<ReferralLetters />);

    const newBtn = await screen.findByRole('button', { name: 'newReferral' });
    expect(newBtn).toBeInTheDocument();
  });

  it('should switch to create view when new referral button is clicked', async () => {
    renderWithRouter(<ReferralLetters />);

    const newBtn = await screen.findByRole('button', { name: 'newReferral' });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByTestId('referral-letter-generator')).toBeInTheDocument();
    });
  });

  it('should show empty state when no referrals exist', async () => {
    renderWithRouter(<ReferralLetters />);

    await waitFor(() => {
      expect(screen.getByText('noReferrals')).toBeInTheDocument();
    });
  });

  it('should render language toggle buttons', async () => {
    renderWithRouter(<ReferralLetters />);

    const norskButtons = await screen.findAllByRole('button', { name: 'Norsk' });
    expect(norskButtons.length).toBeGreaterThanOrEqual(1);
  });
});
