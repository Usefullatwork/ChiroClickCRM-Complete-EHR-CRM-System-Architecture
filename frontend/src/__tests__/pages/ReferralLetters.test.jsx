/**
 * ReferralLetters Page Tests
 * Tests for referral letter document management (list view, create view, search, AI generation)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';

// ─── Mocks (must be before component import) ────────────────────────────────

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

vi.mock('../../components/documents/ReferralLetterGenerator', () => ({
  default: ({ onSave, saving }) => (
    <div data-testid="referral-letter-generator">
      <button
        data-testid="save-referral-btn"
        disabled={saving}
        onClick={() => onSave({ referralType: 'orthopedic', priority: 'routine' })}
      >
        Save Referral
      </button>
      {saving && <span data-testid="saving-indicator">Saving...</span>}
    </div>
  ),
  getDefaultReferralData: () => ({
    patientName: '',
    referralType: 'orthopedic',
    priority: 'routine',
    clinicalFindings: '',
  }),
}));

import ReferralLetters from '../../pages/ReferralLetters';
import { lettersApi } from '../../api/letters';
import toast from '../../utils/toast';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

const renderWithPatientId = (patientId) =>
  render(
    <MemoryRouter initialEntries={[`/patients/${patientId}/referrals`]}>
      <Routes>
        <Route path="/patients/:patientId/referrals" element={<ReferralLetters />} />
      </Routes>
    </MemoryRouter>
  );

const renderWithNewParam = () =>
  render(
    <MemoryRouter initialEntries={['/referrals?new=true']}>
      <Routes>
        <Route path="/referrals" element={<ReferralLetters />} />
      </Routes>
    </MemoryRouter>
  );

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ReferralLetters Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lettersApi.getPatientLetters.mockResolvedValue({ letters: [] });
    lettersApi.saveLetter.mockResolvedValue({ id: 1 });
    lettersApi.generateLetter.mockResolvedValue({ letter: { clinicalFindings: 'AI-generated' } });
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  it('should render list view by default without crashing', async () => {
    renderWithRouter(<ReferralLetters />);

    await waitFor(() => {
      expect(screen.getByText('referrals')).toBeInTheDocument();
    });
  });

  it('should render medical referrals subtitle in list view', async () => {
    renderWithRouter(<ReferralLetters />);

    await waitFor(() => {
      expect(screen.getByText('medicalReferrals')).toBeInTheDocument();
    });
  });

  it('should render new referral button', async () => {
    renderWithRouter(<ReferralLetters />);

    const newBtn = await screen.findByRole('button', { name: /newReferral/i });
    expect(newBtn).toBeInTheDocument();
  });

  // ── Search & Filter ──────────────────────────────────────────────────────

  it('should render search input in list view', async () => {
    renderWithRouter(<ReferralLetters />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('searchByPatientOrRecipient')).toBeInTheDocument();
    });
  });

  it('should render filter button in list view', async () => {
    renderWithRouter(<ReferralLetters />);

    await waitFor(() => {
      expect(screen.getByText('filter')).toBeInTheDocument();
    });
  });

  it('should filter referrals by search term', async () => {
    lettersApi.getPatientLetters.mockResolvedValue({
      letters: [
        {
          id: 1,
          patient_name: 'Ola Nordmann',
          referral_type: 'orthopedic',
          recipient: 'Dr. Berg',
          priority: 'routine',
          status: 'FINALIZED',
          created_at: '2024-03-01T10:00:00Z',
        },
        {
          id: 2,
          patient_name: 'Kari Hansen',
          referral_type: 'neurology',
          recipient: 'Dr. Svensson',
          priority: 'urgent',
          status: 'DRAFT',
          created_at: '2024-03-02T10:00:00Z',
        },
      ],
    });

    renderWithPatientId('123');

    // Wait for both names to appear
    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
    });

    // Search for Kari
    const searchInput = screen.getByPlaceholderText('searchByPatientOrRecipient');
    fireEvent.change(searchInput, { target: { value: 'Kari' } });

    // Kari should remain, Ola should be gone
    expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
    expect(screen.queryByText('Ola Nordmann')).not.toBeInTheDocument();
  });

  it('should also filter by recipient name', async () => {
    lettersApi.getPatientLetters.mockResolvedValue({
      letters: [
        {
          id: 1,
          patient_name: 'Patient A',
          recipient: 'Oslo Ortopedi',
          referral_type: 'orthopedic',
          priority: 'routine',
          status: 'SENT',
          created_at: '2024-03-01T10:00:00Z',
        },
        {
          id: 2,
          patient_name: 'Patient B',
          recipient: 'Bergen Nevrologi',
          referral_type: 'neurology',
          priority: 'soon',
          status: 'DRAFT',
          created_at: '2024-03-02T10:00:00Z',
        },
      ],
    });

    renderWithPatientId('456');

    await waitFor(() => {
      expect(screen.getByText('Patient A')).toBeInTheDocument();
      expect(screen.getByText('Patient B')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('searchByPatientOrRecipient');
    fireEvent.change(searchInput, { target: { value: 'Bergen' } });

    expect(screen.getByText('Patient B')).toBeInTheDocument();
    expect(screen.queryByText('Patient A')).not.toBeInTheDocument();
  });

  // ── Table & Columns ──────────────────────────────────────────────────────

  it('should show table headers for patient, type, recipient, date, priority, and status', async () => {
    renderWithRouter(<ReferralLetters />);

    await waitFor(() => {
      expect(screen.getByText('patient')).toBeInTheDocument();
      expect(screen.getByText('type')).toBeInTheDocument();
      expect(screen.getByText('recipient')).toBeInTheDocument();
      expect(screen.getByText('date')).toBeInTheDocument();
      expect(screen.getByText('priority')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('should show empty state when no referrals exist', async () => {
    renderWithRouter(<ReferralLetters />);

    await waitFor(() => {
      expect(screen.getByText('noReferrals')).toBeInTheDocument();
    });
  });

  it('should display referrals with correct status and priority badges', async () => {
    lettersApi.getPatientLetters.mockResolvedValue({
      letters: [
        {
          id: 1,
          patient_name: 'Urgent Patient',
          referral_type: 'orthopedic',
          recipient: 'Dr. Urgent',
          priority: 'urgent',
          status: 'FINALIZED',
          created_at: '2024-03-01T10:00:00Z',
        },
        {
          id: 2,
          patient_name: 'Draft Patient',
          referral_type: 'neurology',
          recipient: 'Dr. Neuro',
          priority: 'routine',
          status: 'DRAFT',
          created_at: '2024-03-02T10:00:00Z',
        },
      ],
    });

    renderWithPatientId('123');

    await waitFor(() => {
      expect(screen.getByText('Urgent Patient')).toBeInTheDocument();
      expect(screen.getByText('Draft Patient')).toBeInTheDocument();
      // Priority labels come from priorityLabels[language]
      expect(screen.getByText('Haster')).toBeInTheDocument();
      expect(screen.getByText('Rutinemessig')).toBeInTheDocument();
      // Status labels come from statusLabels[language]
      expect(screen.getByText('Ferdig')).toBeInTheDocument();
      expect(screen.getByText('Utkast')).toBeInTheDocument();
    });
  });

  it('should display referral type labels in Norwegian', async () => {
    lettersApi.getPatientLetters.mockResolvedValue({
      letters: [
        {
          id: 1,
          patient_name: 'Test',
          referral_type: 'orthopedic',
          recipient: 'Dr. X',
          priority: 'routine',
          status: 'SENT',
          created_at: '2024-03-01T10:00:00Z',
        },
      ],
    });

    renderWithPatientId('123');

    await waitFor(() => {
      expect(screen.getByText('Ortoped')).toBeInTheDocument();
    });
  });

  // ── Language Toggle ──────────────────────────────────────────────────────

  it('should render language toggle buttons (Norsk/English) in list view', async () => {
    renderWithRouter(<ReferralLetters />);

    await waitFor(() => {
      const norskBtns = screen.getAllByRole('button', { name: 'Norsk' });
      const englishBtns = screen.getAllByRole('button', { name: 'English' });
      expect(norskBtns.length).toBeGreaterThanOrEqual(1);
      expect(englishBtns.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Create View ──────────────────────────────────────────────────────────

  it('should switch to create view when new referral button is clicked', async () => {
    renderWithRouter(<ReferralLetters />);

    const newBtn = await screen.findByRole('button', { name: /newReferral/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByTestId('referral-letter-generator')).toBeInTheDocument();
    });
  });

  it('should open directly in create view when ?new=true search param is set', async () => {
    renderWithNewParam();

    await waitFor(() => {
      expect(screen.getByTestId('referral-letter-generator')).toBeInTheDocument();
    });
  });

  it('should render generate with AI button in create view', async () => {
    renderWithRouter(<ReferralLetters />);

    const newBtn = await screen.findByRole('button', { name: /newReferral/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByText('generateWithAI')).toBeInTheDocument();
    });
  });

  it('should render language toggle in create view', async () => {
    renderWithRouter(<ReferralLetters />);

    const newBtn = await screen.findByRole('button', { name: /newReferral/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      const norskBtns = screen.getAllByRole('button', { name: 'Norsk' });
      expect(norskBtns.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Save Flow ────────────────────────────────────────────────────────────

  it('should save referral and show success toast', async () => {
    renderWithRouter(<ReferralLetters />);

    // Switch to create view
    const newBtn = await screen.findByRole('button', { name: /newReferral/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByTestId('referral-letter-generator')).toBeInTheDocument();
    });

    // Click save in the generator mock
    const saveBtn = screen.getByTestId('save-referral-btn');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(lettersApi.saveLetter).toHaveBeenCalledWith(
        expect.objectContaining({
          letterType: 'REFERRAL_LETTER',
          status: 'DRAFT',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('referralSaved');
    });
  });

  it('should return to list view after successful save', async () => {
    renderWithRouter(<ReferralLetters />);

    const newBtn = await screen.findByRole('button', { name: /newReferral/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByTestId('referral-letter-generator')).toBeInTheDocument();
    });

    const saveBtn = screen.getByTestId('save-referral-btn');
    fireEvent.click(saveBtn);

    // After save, should return to list view
    await waitFor(() => {
      expect(screen.getByText('referrals')).toBeInTheDocument();
      expect(screen.queryByTestId('referral-letter-generator')).not.toBeInTheDocument();
    });
  });

  // ── Error Handling ───────────────────────────────────────────────────────

  it('should display error when save fails', async () => {
    lettersApi.saveLetter.mockRejectedValue(new Error('Network error'));

    renderWithRouter(<ReferralLetters />);

    const newBtn = await screen.findByRole('button', { name: /newReferral/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByTestId('referral-letter-generator')).toBeInTheDocument();
    });

    const saveBtn = screen.getByTestId('save-referral-btn');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('failedToSaveReferral')).toBeInTheDocument();
    });
  });

  it('should show error with retry button when fetch fails', async () => {
    lettersApi.getPatientLetters.mockRejectedValue(new Error('API down'));

    renderWithPatientId('123');

    await waitFor(() => {
      expect(screen.getByText('failedToLoadReferrals')).toBeInTheDocument();
      expect(screen.getByText('tryAgain')).toBeInTheDocument();
    });
  });

  // ── Back Navigation ──────────────────────────────────────────────────────

  it('should show back button in create view that returns to list view', async () => {
    renderWithRouter(<ReferralLetters />);

    const newBtn = await screen.findByRole('button', { name: /newReferral/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByText('newReferral')).toBeInTheDocument();
    });

    // The ArrowLeft back button is the first button in create view header
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByText('referrals')).toBeInTheDocument();
    });
  });
});
