/**
 * SickNotes Page Tests
 * Tests for sick note document management (list view, create view, search, AI generation)
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

vi.mock('../../components/documents/SickNoteGenerator', () => ({
  default: ({ onSave, saving }) => (
    <div data-testid="sick-note-generator">
      <button
        data-testid="save-sick-note-btn"
        disabled={saving}
        onClick={() => onSave({ diagnosis: 'L84', dateFrom: '2024-01-01', dateTo: '2024-01-14' })}
      >
        Save Sick Note
      </button>
      {saving && <span data-testid="saving-indicator">Saving...</span>}
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

import SickNotes from '../../pages/SickNotes';
import { lettersApi } from '../../api/letters';
import toast from '../../utils/toast';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

const renderWithPatientId = (patientId) =>
  render(
    <MemoryRouter initialEntries={[`/patients/${patientId}/sick-notes`]}>
      <Routes>
        <Route path="/patients/:patientId/sick-notes" element={<SickNotes />} />
      </Routes>
    </MemoryRouter>
  );

const renderWithNewParam = () =>
  render(
    <MemoryRouter initialEntries={['/sick-notes?new=true']}>
      <Routes>
        <Route path="/sick-notes" element={<SickNotes />} />
      </Routes>
    </MemoryRouter>
  );

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SickNotes Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lettersApi.getPatientLetters.mockResolvedValue({ letters: [] });
    lettersApi.saveLetter.mockResolvedValue({ id: 1 });
    lettersApi.generateLetter.mockResolvedValue({ letter: { diagnosis: 'AI-generated' } });
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  it('should render list view by default without crashing', async () => {
    renderWithRouter(<SickNotes />);

    await waitFor(() => {
      expect(screen.getByText('sickNotes')).toBeInTheDocument();
    });
  });

  it('should render NAV-compliant subtitle in list view', async () => {
    renderWithRouter(<SickNotes />);

    await waitFor(() => {
      expect(screen.getByText('navCompliant')).toBeInTheDocument();
    });
  });

  it('should render new sick note button', async () => {
    renderWithRouter(<SickNotes />);

    const newBtn = await screen.findByRole('button', { name: /newSickNote/i });
    expect(newBtn).toBeInTheDocument();
  });

  // ── Search & Filter ──────────────────────────────────────────────────────

  it('should render search input in list view', async () => {
    renderWithRouter(<SickNotes />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('searchByPatientOrDiagnosis')).toBeInTheDocument();
    });
  });

  it('should render filter button in list view', async () => {
    renderWithRouter(<SickNotes />);

    await waitFor(() => {
      expect(screen.getByText('filter')).toBeInTheDocument();
    });
  });

  it('should filter sick notes by search term', async () => {
    lettersApi.getPatientLetters.mockResolvedValue({
      letters: [
        {
          id: 1,
          patient_name: 'Ola Nordmann',
          diagnosis: 'L84',
          date_from: '2024-01-01',
          date_to: '2024-01-14',
          grad_percent: 100,
          status: 'FINALIZED',
        },
        {
          id: 2,
          patient_name: 'Kari Hansen',
          diagnosis: 'M54',
          date_from: '2024-02-01',
          date_to: '2024-02-14',
          grad_percent: 50,
          status: 'DRAFT',
        },
      ],
    });

    renderWithPatientId('123');

    // Wait for loading to finish and both names appear
    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
    });

    // Search for Ola
    const searchInput = screen.getByPlaceholderText('searchByPatientOrDiagnosis');
    fireEvent.change(searchInput, { target: { value: 'Ola' } });

    // Ola should remain, Kari should be gone
    expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    expect(screen.queryByText('Kari Hansen')).not.toBeInTheDocument();
  });

  // ── Table & Columns ──────────────────────────────────────────────────────

  it('should show table headers for patient, diagnosis, period, grade, and status', async () => {
    renderWithRouter(<SickNotes />);

    await waitFor(() => {
      expect(screen.getByText('patient')).toBeInTheDocument();
      expect(screen.getByText('diagnosis')).toBeInTheDocument();
      expect(screen.getByText('period')).toBeInTheDocument();
      expect(screen.getByText('grade')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('should show empty state when no sick notes exist', async () => {
    renderWithRouter(<SickNotes />);

    await waitFor(() => {
      expect(screen.getByText('noSickNotes')).toBeInTheDocument();
    });
  });

  it('should display sick notes with status badges', async () => {
    lettersApi.getPatientLetters.mockResolvedValue({
      letters: [
        {
          id: 1,
          patient_name: 'Test Patient',
          diagnosis: 'L84',
          date_from: '2024-01-01',
          date_to: '2024-01-14',
          grad_percent: 100,
          status: 'FINALIZED',
        },
        {
          id: 2,
          patient_name: 'Draft Patient',
          diagnosis: 'M54',
          date_from: '2024-02-01',
          date_to: '2024-02-14',
          grad_percent: 50,
          status: 'DRAFT',
        },
      ],
    });

    renderWithPatientId('123');

    await waitFor(() => {
      expect(screen.getByText('Test Patient')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('draft')).toBeInTheDocument();
    });
  });

  // ── Create View ──────────────────────────────────────────────────────────

  it('should switch to create view when new sick note button is clicked', async () => {
    renderWithRouter(<SickNotes />);

    const newBtn = await screen.findByRole('button', { name: /newSickNote/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByTestId('sick-note-generator')).toBeInTheDocument();
    });
  });

  it('should open directly in create view when ?new=true search param is set', async () => {
    renderWithNewParam();

    await waitFor(() => {
      expect(screen.getByTestId('sick-note-generator')).toBeInTheDocument();
    });
  });

  it('should render generate with AI button in create view', async () => {
    renderWithRouter(<SickNotes />);

    const newBtn = await screen.findByRole('button', { name: /newSickNote/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByText('generateWithAI')).toBeInTheDocument();
    });
  });

  it('should render language toggle buttons (Norsk/English) in create view', async () => {
    renderWithRouter(<SickNotes />);

    const newBtn = await screen.findByRole('button', { name: /newSickNote/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      const norskBtns = screen.getAllByRole('button', { name: 'Norsk' });
      const englishBtns = screen.getAllByRole('button', { name: 'English' });
      expect(norskBtns.length).toBeGreaterThanOrEqual(1);
      expect(englishBtns.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Save Flow ────────────────────────────────────────────────────────────

  it('should save sick note and show success toast', async () => {
    renderWithRouter(<SickNotes />);

    // Switch to create view
    const newBtn = await screen.findByRole('button', { name: /newSickNote/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByTestId('sick-note-generator')).toBeInTheDocument();
    });

    // Click save in the generator mock
    const saveBtn = screen.getByTestId('save-sick-note-btn');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(lettersApi.saveLetter).toHaveBeenCalledWith(
        expect.objectContaining({
          letterType: 'SICK_NOTE',
          status: 'DRAFT',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('sickNoteSaved');
    });
  });

  it('should return to list view after successful save', async () => {
    renderWithRouter(<SickNotes />);

    const newBtn = await screen.findByRole('button', { name: /newSickNote/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByTestId('sick-note-generator')).toBeInTheDocument();
    });

    const saveBtn = screen.getByTestId('save-sick-note-btn');
    fireEvent.click(saveBtn);

    // After save, should return to list view
    await waitFor(() => {
      expect(screen.getByText('sickNotes')).toBeInTheDocument();
      expect(screen.queryByTestId('sick-note-generator')).not.toBeInTheDocument();
    });
  });

  // ── Error Handling ───────────────────────────────────────────────────────

  it('should display error when save fails', async () => {
    lettersApi.saveLetter.mockRejectedValue(new Error('Network error'));

    renderWithRouter(<SickNotes />);

    const newBtn = await screen.findByRole('button', { name: /newSickNote/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByTestId('sick-note-generator')).toBeInTheDocument();
    });

    const saveBtn = screen.getByTestId('save-sick-note-btn');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('failedToSaveSickNote')).toBeInTheDocument();
    });
  });

  it('should show error with retry button when fetch fails', async () => {
    lettersApi.getPatientLetters.mockRejectedValue(new Error('API down'));

    renderWithPatientId('123');

    await waitFor(() => {
      expect(screen.getByText('failedToLoadSickNotes')).toBeInTheDocument();
      expect(screen.getByText('tryAgain')).toBeInTheDocument();
    });
  });

  // ── Back Navigation ──────────────────────────────────────────────────────

  it('should show back button in create view that returns to list view', async () => {
    renderWithRouter(<SickNotes />);

    const newBtn = await screen.findByRole('button', { name: /newSickNote/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByText('newSickNote')).toBeInTheDocument();
    });

    // The ArrowLeft back button is the first button in create view header
    const buttons = screen.getAllByRole('button');
    // First button in header is the back arrow
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByText('sickNotes')).toBeInTheDocument();
    });
  });
});
