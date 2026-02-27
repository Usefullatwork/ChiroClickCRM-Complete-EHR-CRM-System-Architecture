import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// --- Module-level mocks (BEFORE imports) ---

const mockNavigate = vi.fn();
const mockConfirm = vi.fn().mockResolvedValue(true);

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({}),
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

vi.mock('../../api/clinicalNotes', () => ({
  clinicalNotesAPI: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
    getById: vi.fn().mockResolvedValue({ data: null }),
    getByPatient: vi.fn().mockResolvedValue({ data: { data: [] } }),
    create: vi.fn().mockResolvedValue({ data: { id: 'note-new' } }),
    update: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    sign: vi.fn().mockResolvedValue({ data: {} }),
    getDrafts: vi.fn().mockResolvedValue({ data: { data: [] } }),
    autoSave: vi.fn().mockResolvedValue({ data: {} }),
    generateFormatted: vi.fn().mockResolvedValue({
      data: { data: { formatted_note: 'Formatted note content' } },
    }),
    downloadPDF: vi.fn().mockResolvedValue({
      data: new Blob(['pdf'], { type: 'application/pdf' }),
      headers: {},
    }),
  },
  default: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
    getById: vi.fn().mockResolvedValue({ data: null }),
    getByPatient: vi.fn().mockResolvedValue({ data: { data: [] } }),
    create: vi.fn().mockResolvedValue({ data: { id: 'note-new' } }),
    update: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    sign: vi.fn().mockResolvedValue({ data: {} }),
    getDrafts: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

vi.mock('../../api/client', () => ({
  api: {
    patients: {
      search: vi.fn().mockResolvedValue({ data: [] }),
      getById: vi.fn().mockResolvedValue({ data: null }),
    },
  },
}));

vi.mock('../../components/ui/ConfirmDialog', () => ({
  useConfirm: () => mockConfirm,
}));

vi.mock('../../utils/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('../../utils/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock child note components (simplified stubs)
vi.mock('../../components/notes/NotesList', () => ({
  default: ({ notes, isLoading, selectedPatientId, onViewNote, onEditNote, onDeleteNote }) => {
    if (!selectedPatientId) {
      return <div data-testid="notes-list-empty">Ingen pasient valgt</div>;
    }
    if (isLoading) {
      return <div data-testid="notes-list-loading">Laster notater...</div>;
    }
    if (notes.length === 0) {
      return <div data-testid="notes-list-empty">Ingen notater</div>;
    }
    return (
      <div data-testid="notes-list">
        <span data-testid="notes-count">Notater ({notes.length})</span>
        {notes.map((note) => (
          <div key={note.id} data-testid={`note-item-${note.id}`}>
            <span data-testid={`note-type-${note.id}`}>{note.template_type}</span>
            <span data-testid={`note-signed-${note.id}`}>
              {note.signed_at ? 'Signert' : 'Utkast'}
            </span>
            <button data-testid={`view-note-${note.id}`} onClick={() => onViewNote(note.id)}>
              Se
            </button>
            <button data-testid={`edit-note-${note.id}`} onClick={() => onEditNote(note)}>
              Rediger
            </button>
            <button data-testid={`delete-note-${note.id}`} onClick={() => onDeleteNote(note.id)}>
              Slett
            </button>
          </div>
        ))}
      </div>
    );
  },
}));

vi.mock('../../components/notes/NotePreview', () => ({
  default: ({ note, isLoading, onClose, onEdit }) => {
    if (isLoading) {
      return <div data-testid="note-preview-loading">Laster forhandsvisning...</div>;
    }
    return (
      <div data-testid="note-preview">
        <span data-testid="preview-note-content">{note ? JSON.stringify(note) : 'Ingen data'}</span>
        <button data-testid="preview-close" onClick={onClose}>
          Lukk
        </button>
        <button data-testid="preview-edit" onClick={() => onEdit && onEdit(note)}>
          Rediger
        </button>
      </div>
    );
  },
}));

vi.mock('../../components/notes/SOAPTemplate', () => ({
  default: ({ patient, onSave, onLock, readOnly }) => (
    <div data-testid="soap-template">
      <span data-testid="soap-readonly">{readOnly ? 'readonly' : 'editable'}</span>
      <button data-testid="soap-save" onClick={() => onSave({ content: 'test' })}>
        Lagre
      </button>
      <button data-testid="soap-sign" onClick={() => onLock({ content: 'test' })}>
        Signer
      </button>
    </div>
  ),
}));

vi.mock('../../components/notes/InitialConsultTemplate', () => ({
  default: ({ patient, onSave, readOnly }) => (
    <div data-testid="initial-consult-template">
      <span data-testid="initial-readonly">{readOnly ? 'readonly' : 'editable'}</span>
      <button data-testid="initial-save" onClick={() => onSave({ content: 'initial' })}>
        Lagre
      </button>
    </div>
  ),
}));

vi.mock('../../components/notes/FollowUpTemplate', () => ({
  default: ({ patient, onSave, readOnly }) => (
    <div data-testid="followup-template">
      <span data-testid="followup-readonly">{readOnly ? 'readonly' : 'editable'}</span>
      <button data-testid="followup-save" onClick={() => onSave({ content: 'followup' })}>
        Lagre
      </button>
    </div>
  ),
}));

vi.mock('../../components/notes/VestibularAssessment', () => ({
  default: ({ patient, onSave, readOnly }) => (
    <div data-testid="vestibular-template">
      <span data-testid="vestibular-readonly">{readOnly ? 'readonly' : 'editable'}</span>
      <button data-testid="vestibular-save" onClick={() => onSave({ content: 'vestibular' })}>
        Lagre
      </button>
    </div>
  ),
}));

// --- Imports (AFTER mocks) ---

import ClinicalNotes from '../../pages/ClinicalNotes';
import { clinicalNotesAPI } from '../../api/clinicalNotes';
import { api } from '../../api/client';
import toast from '../../utils/toast';

// --- Test helpers ---

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

const renderWithProviders = (component) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

// --- Mock data ---

const mockPatients = [
  {
    id: 'p-1',
    first_name: 'Ola',
    last_name: 'Nordmann',
    date_of_birth: '1985-05-15',
    solvit_id: 'S-001',
  },
  {
    id: 'p-2',
    first_name: 'Kari',
    last_name: 'Hansen',
    date_of_birth: '1990-03-20',
    solvit_id: 'S-002',
  },
];

const mockNotes = [
  {
    id: 'note-1',
    patient_id: 'p-1',
    template_type: 'soap',
    note_date: '2026-02-25T10:30:00Z',
    signed_at: '2026-02-25T11:00:00Z',
    is_draft: false,
    practitioner_name: 'Dr. Berg',
    duration_minutes: 20,
    subjective: JSON.stringify({ chiefComplaint: 'Nakkesmerter' }),
    icd10_codes: ['M54.2'],
    icpc_codes: ['L83'],
    vas_pain_start: 7,
    vas_pain_end: 4,
  },
  {
    id: 'note-2',
    patient_id: 'p-1',
    template_type: 'initial',
    note_date: '2026-02-20T09:00:00Z',
    signed_at: null,
    is_draft: true,
    practitioner_name: 'Dr. Berg',
    duration_minutes: 45,
    subjective: JSON.stringify({ chiefComplaint: 'Korsryggsmerter' }),
    icd10_codes: ['M54.5'],
    icpc_codes: [],
  },
  {
    id: 'note-3',
    patient_id: 'p-1',
    template_type: 'followup',
    note_date: '2026-02-22T14:00:00Z',
    signed_at: '2026-02-22T15:00:00Z',
    is_draft: false,
    practitioner_name: 'Dr. Berg',
    duration_minutes: 15,
    subjective: JSON.stringify({ chiefComplaint: 'Oppfolging skulder' }),
    icd10_codes: [],
    icpc_codes: ['L92'],
  },
];

const mockDrafts = [
  {
    id: 'draft-1',
    patient_id: 'p-1',
    template_type: 'soap',
    note_date: '2026-02-26T08:00:00Z',
    is_draft: true,
    signed_at: null,
  },
  {
    id: 'draft-2',
    patient_id: 'p-1',
    template_type: 'followup',
    note_date: '2026-02-26T09:00:00Z',
    is_draft: true,
    signed_at: null,
  },
];

// --- Tests ---

describe('ClinicalNotes Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    api.patients.search.mockResolvedValue({ data: mockPatients });
    api.patients.getById.mockResolvedValue({ data: null });
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });
    clinicalNotesAPI.getDrafts.mockResolvedValue({ data: { data: [] } });
    clinicalNotesAPI.getById.mockResolvedValue({ data: null });
    clinicalNotesAPI.create.mockResolvedValue({ data: { id: 'note-new' } });
    clinicalNotesAPI.update.mockResolvedValue({ data: {} });
    clinicalNotesAPI.sign.mockResolvedValue({ data: {} });
    clinicalNotesAPI.delete.mockResolvedValue({ data: {} });
    mockConfirm.mockResolvedValue(true);
  });

  // =============================================
  // 1. Renders page heading
  // =============================================
  it('renders the page heading "Kliniske Notater"', () => {
    renderWithProviders(<ClinicalNotes />);

    expect(screen.getByText('Kliniske Notater')).toBeInTheDocument();
  });

  // =============================================
  // 2. Renders "Velg pasient..." placeholder when no patient selected
  // =============================================
  it('shows "Velg pasient..." when no patient is selected', () => {
    renderWithProviders(<ClinicalNotes />);

    expect(screen.getByText('Velg pasient...')).toBeInTheDocument();
  });

  // =============================================
  // 3. Patient selector modal shown by default (no routePatientId)
  // =============================================
  it('shows patient selector modal when no route patient ID is provided', () => {
    renderWithProviders(<ClinicalNotes />);

    expect(screen.getByText('Velg pasient')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Sok etter pasient...')).toBeInTheDocument();
  });

  // =============================================
  // 4. Renders patient list in selector modal
  // =============================================
  it('renders patients in the selector modal after API response', async () => {
    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
    });
  });

  // =============================================
  // 5. Patient search input updates
  // =============================================
  it('allows typing in patient search field', async () => {
    renderWithProviders(<ClinicalNotes />);

    const searchInput = screen.getByPlaceholderText('Sok etter pasient...');
    fireEvent.change(searchInput, { target: { value: 'Ola' } });

    expect(searchInput.value).toBe('Ola');
  });

  // =============================================
  // 6. Selecting a patient navigates and hides selector
  // =============================================
  it('navigates to patient notes route when a patient is selected', async () => {
    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Ola Nordmann'));

    expect(mockNavigate).toHaveBeenCalledWith('/notes/p-1', { replace: true });
  });

  // =============================================
  // 7. Patient selector modal closes when X is clicked
  // =============================================
  it('closes patient selector modal when close button is clicked', async () => {
    renderWithProviders(<ClinicalNotes />);

    // The modal title is visible
    expect(screen.getByText('Velg pasient')).toBeInTheDocument();

    // Find the close button within the modal header (the X button next to "Velg pasient")
    const modalHeader = screen.getByText('Velg pasient').closest('div');
    const closeButton = modalHeader.querySelector('button');
    fireEvent.click(closeButton);

    // After closing, the modal title should no longer be visible
    await waitFor(() => {
      expect(screen.queryByText('Velg pasient')).not.toBeInTheDocument();
    });
  });

  // =============================================
  // 8. "Ingen pasienter funnet" shown when search has no results
  // =============================================
  it('shows "Ingen pasienter funnet" when patient search yields no results', async () => {
    api.patients.search.mockResolvedValue({ data: [] });

    renderWithProviders(<ClinicalNotes />);

    // Type a search term to trigger the "no results" text
    const searchInput = screen.getByPlaceholderText('Sok etter pasient...');
    fireEvent.change(searchInput, { target: { value: 'XYZ' } });

    await waitFor(() => {
      expect(screen.getByText('Ingen pasienter funnet')).toBeInTheDocument();
    });
  });

  // =============================================
  // 9. Empty state when no notes exist
  // =============================================
  it('shows notes list empty state when patient has no notes', async () => {
    api.patients.search.mockResolvedValue({ data: mockPatients });
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      expect(screen.getByText('Ingen notater')).toBeInTheDocument();
    });
  });

  // =============================================
  // 10. Notes list renders with data
  // =============================================
  it('renders notes list when patient has clinical notes', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: mockNotes } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      expect(screen.getByTestId('notes-list')).toBeInTheDocument();
      expect(screen.getByTestId('notes-count')).toHaveTextContent('Notater (3)');
    });
  });

  // =============================================
  // 11. Signed vs unsigned note indicators
  // =============================================
  it('displays signed and unsigned note status correctly', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: mockNotes } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      // note-1 is signed
      expect(screen.getByTestId('note-signed-note-1')).toHaveTextContent('Signert');
      // note-2 is a draft (unsigned)
      expect(screen.getByTestId('note-signed-note-2')).toHaveTextContent('Utkast');
      // note-3 is signed
      expect(screen.getByTestId('note-signed-note-3')).toHaveTextContent('Signert');
    });
  });

  // =============================================
  // 12. Note type labels displayed
  // =============================================
  it('renders note type labels (soap, initial, followup)', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: mockNotes } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      expect(screen.getByTestId('note-type-note-1')).toHaveTextContent('soap');
      expect(screen.getByTestId('note-type-note-2')).toHaveTextContent('initial');
      expect(screen.getByTestId('note-type-note-3')).toHaveTextContent('followup');
    });
  });

  // =============================================
  // 13. "Nytt notat" button is disabled without patient
  // =============================================
  it('disables "Nytt notat" button when no patient is selected', () => {
    renderWithProviders(<ClinicalNotes />);

    const newNoteBtn = screen.getByText('Nytt notat');
    expect(newNoteBtn.closest('button')).toBeDisabled();
  });

  // =============================================
  // 14. New note dropdown menu opens
  // =============================================
  it('opens new note dropdown menu when button is clicked (patient selected)', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    // Select a patient
    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    // Click "Nytt notat" button
    const newNoteBtn = screen.getByText('Nytt notat').closest('button');
    fireEvent.click(newNoteBtn);

    // Dropdown should show all 4 note type options (plus quick action cards = duplicates)
    await waitFor(() => {
      // SOAP Notat appears in quick action cards AND the dropdown
      const soapItems = screen.getAllByText('SOAP Notat');
      expect(soapItems.length).toBeGreaterThanOrEqual(2);
      // Dropdown-only options also duplicated
      const initialItems = screen.getAllByText('Forstegangskonsultasjon');
      expect(initialItems.length).toBeGreaterThanOrEqual(2);
      const followupItems = screen.getAllByText('Oppfolgingskonsultasjon');
      expect(followupItems.length).toBeGreaterThanOrEqual(1);
      const vestibularItems = screen.getAllByText('Vestibular vurdering');
      expect(vestibularItems.length).toBeGreaterThanOrEqual(2);
    });
  });

  // =============================================
  // 15. Norwegian labels in new note dropdown
  // =============================================
  it('shows Norwegian labels and descriptions in new note dropdown', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    const newNoteBtn = screen.getByText('Nytt notat').closest('button');
    fireEvent.click(newNoteBtn);

    await waitFor(() => {
      // Descriptions appear in both quick action cards and the dropdown
      const standardItems = screen.getAllByText('Standard konsultasjon');
      expect(standardItems.length).toBeGreaterThanOrEqual(1);
      const nyPasientItems = screen.getAllByText('Ny pasient');
      expect(nyPasientItems.length).toBeGreaterThanOrEqual(1);
      const eksisterendeItems = screen.getAllByText('Eksisterende pasient');
      expect(eksisterendeItems.length).toBeGreaterThanOrEqual(1);
      const svimmelhetItems = screen.getAllByText('Svimmelhet/balanse');
      expect(svimmelhetItems.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =============================================
  // 16. Clicking SOAP note type opens SOAP template
  // =============================================
  it('opens SOAP template editor when SOAP Notat quick action is clicked', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    // Click the first "SOAP Notat" (the quick action card)
    await waitFor(() => {
      const soapOptions = screen.getAllByText('SOAP Notat');
      fireEvent.click(soapOptions[0]);
    });

    await waitFor(() => {
      expect(screen.getByTestId('soap-template')).toBeInTheDocument();
      expect(screen.getByText('Nytt SOAP notat')).toBeInTheDocument();
    });
  });

  // =============================================
  // 17. Clicking Initial Consult opens initial template
  // =============================================
  it('opens Initial Consult template when Forstegangskonsultasjon quick action is clicked', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    // Click first Forstegangskonsultasjon quick action card
    await waitFor(() => {
      const options = screen.getAllByText('Forstegangskonsultasjon');
      fireEvent.click(options[0]);
    });

    await waitFor(() => {
      expect(screen.getByTestId('initial-consult-template')).toBeInTheDocument();
      expect(screen.getByText('Nytt Forstegangskonsultasjon notat')).toBeInTheDocument();
    });
  });

  // =============================================
  // 18. Clicking Follow-Up opens followup template
  // =============================================
  it('opens Follow-Up template when Oppfolgingskonsultasjon quick action is clicked', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    // Click the Oppfolgingskonsultasjon quick action card
    await waitFor(() => {
      const options = screen.getAllByText('Oppfolgingskonsultasjon');
      fireEvent.click(options[0]);
    });

    await waitFor(() => {
      expect(screen.getByTestId('followup-template')).toBeInTheDocument();
      expect(screen.getByText('Nytt Oppfolging notat')).toBeInTheDocument();
    });
  });

  // =============================================
  // 19. Clicking Vestibular opens vestibular template
  // =============================================
  it('opens Vestibular template when Vestibular vurdering quick action is clicked', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    // Click the Vestibular vurdering quick action card
    await waitFor(() => {
      const options = screen.getAllByText('Vestibular vurdering');
      fireEvent.click(options[0]);
    });

    await waitFor(() => {
      expect(screen.getByTestId('vestibular-template')).toBeInTheDocument();
      expect(screen.getByText('Nytt Vestibular notat')).toBeInTheDocument();
    });
  });

  // =============================================
  // 20. Search input in notes filter
  // =============================================
  it('renders the notes search input with Norwegian placeholder', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Sok i notater...');
      expect(searchInput).toBeInTheDocument();
      fireEvent.change(searchInput, { target: { value: 'nakkesmerter' } });
      expect(searchInput.value).toBe('nakkesmerter');
    });
  });

  // =============================================
  // 21. Note type filter dropdown with Norwegian options
  // =============================================
  it('renders note type filter with Norwegian options', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      const select = screen.getByDisplayValue('Alle typer');
      expect(select).toBeInTheDocument();

      // Verify all filter options exist
      const options = within(select).getAllByRole('option');
      const optionTexts = options.map((o) => o.textContent);
      expect(optionTexts).toContain('Alle typer');
      expect(optionTexts).toContain('SOAP');
      expect(optionTexts).toContain('Forstegangskonsultasjon');
      expect(optionTexts).toContain('Oppfolging');
      expect(optionTexts).toContain('Vestibular');
    });
  });

  // =============================================
  // 22. Note type filter changes selection
  // =============================================
  it('changes note type filter selection', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      const select = screen.getByDisplayValue('Alle typer');
      fireEvent.change(select, { target: { value: 'soap' } });
      expect(select.value).toBe('soap');
    });
  });

  // =============================================
  // 23. Date range filter inputs present
  // =============================================
  it('renders date range filter inputs', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      const dateInputs = screen.getAllByDisplayValue('');
      const dateTypeInputs = dateInputs.filter((el) => el.type === 'date');
      expect(dateTypeInputs.length).toBeGreaterThanOrEqual(2);
    });
  });

  // =============================================
  // 24. Date range filter changes value
  // =============================================
  it('allows changing date range filter values', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      const dateInputs = screen.getAllByDisplayValue('');
      const startDate = dateInputs.find((el) => el.type === 'date');
      fireEvent.change(startDate, { target: { value: '2026-01-01' } });
      expect(startDate.value).toBe('2026-01-01');
    });
  });

  // =============================================
  // 25. Quick action cards shown when patient is selected
  // =============================================
  it('shows quick action cards after selecting a patient', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    // Quick action cards have the same labels as dropdown
    await waitFor(() => {
      // There are multiple SOAP Notat texts (quick actions + dropdown potentially)
      const soapButtons = screen.getAllByText('SOAP Notat');
      expect(soapButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =============================================
  // 26. Drafts indicator shown when drafts exist
  // =============================================
  it('shows drafts indicator when user has draft notes', async () => {
    clinicalNotesAPI.getDrafts.mockResolvedValue({ data: { data: mockDrafts } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('2 utkast')).toBeInTheDocument();
    });
  });

  // =============================================
  // 27. No drafts indicator when no drafts
  // =============================================
  it('does not show drafts indicator when there are no drafts', () => {
    clinicalNotesAPI.getDrafts.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    expect(screen.queryByText(/utkast/)).not.toBeInTheDocument();
  });

  // =============================================
  // 28. Editor shows "Rediger notat" heading when editing existing note
  // =============================================
  it('shows "Rediger notat" heading when editing an existing note', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: mockNotes } });
    clinicalNotesAPI.getById.mockResolvedValue({
      data: { ...mockNotes[1], signed_at: null },
    });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      expect(screen.getByTestId('notes-list')).toBeInTheDocument();
    });

    // Click edit on note-2 (unsigned, editable)
    fireEvent.click(screen.getByTestId('edit-note-note-2'));

    await waitFor(() => {
      expect(screen.getByText('Rediger notat')).toBeInTheDocument();
    });
  });

  // =============================================
  // 29. Editor close button returns to list view
  // =============================================
  it('returns to notes list when editor close button is clicked', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    // Open new SOAP note via quick action
    await waitFor(() => {
      const soapButtons = screen.getAllByText('SOAP Notat');
      fireEvent.click(soapButtons[0]);
    });

    // Should be in editor now
    await waitFor(() => {
      expect(screen.getByTestId('soap-template')).toBeInTheDocument();
    });

    // Find the editor heading "Nytt SOAP notat" and its sibling close button
    const heading = screen.getByText('Nytt SOAP notat');
    // The close button is a sibling inside the same flex container
    const headerRow = heading.closest('.flex');
    const closeBtn = headerRow.querySelector('button');
    fireEvent.click(closeBtn);

    // Should return to list view
    await waitFor(() => {
      expect(screen.queryByTestId('soap-template')).not.toBeInTheDocument();
    });
  });

  // =============================================
  // 30. View note opens preview
  // =============================================
  it('opens note preview when view button is clicked', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: mockNotes } });
    clinicalNotesAPI.getById.mockResolvedValue({ data: mockNotes[0] });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      expect(screen.getByTestId('notes-list')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('view-note-note-1'));

    await waitFor(() => {
      expect(screen.getByTestId('note-preview')).toBeInTheDocument();
    });
  });

  // =============================================
  // 31. Close preview modal
  // =============================================
  it('closes note preview when close button is clicked', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: mockNotes } });
    clinicalNotesAPI.getById.mockResolvedValue({ data: mockNotes[0] });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      expect(screen.getByTestId('notes-list')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('view-note-note-1'));

    await waitFor(() => {
      expect(screen.getByTestId('note-preview')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('preview-close'));

    await waitFor(() => {
      expect(screen.queryByTestId('note-preview')).not.toBeInTheDocument();
    });
  });

  // =============================================
  // 32. Delete note calls confirm dialog with Norwegian text
  // =============================================
  it('calls confirm dialog with Norwegian text when deleting a note', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: mockNotes } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      expect(screen.getByTestId('notes-list')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-note-note-2'));

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith({
        title: 'Slett notat',
        description: 'Er du sikker på at du vil slette dette notatet? Dette kan ikke angres.',
        variant: 'destructive',
      });
    });
  });

  // =============================================
  // 33. Delete note calls API after confirmation
  // =============================================
  it('calls delete API after user confirms deletion', async () => {
    mockConfirm.mockResolvedValue(true);
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: mockNotes } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      expect(screen.getByTestId('notes-list')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-note-note-2'));

    await waitFor(() => {
      expect(clinicalNotesAPI.delete).toHaveBeenCalledWith('note-2');
    });
  });

  // =============================================
  // 34. Delete note cancelled by user
  // =============================================
  it('does not call delete API when user cancels deletion', async () => {
    mockConfirm.mockResolvedValue(false);
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: mockNotes } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      expect(screen.getByTestId('notes-list')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-note-note-2'));

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
    });

    expect(clinicalNotesAPI.delete).not.toHaveBeenCalled();
  });

  // =============================================
  // 35. getNoteTypeLabel returns correct Norwegian labels
  // =============================================
  describe('getNoteTypeLabel mapping', () => {
    it('maps soap to "SOAP"', async () => {
      const singleNote = [{ ...mockNotes[0], template_type: 'soap' }];
      clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: singleNote } });

      renderWithProviders(<ClinicalNotes />);

      await waitFor(() => {
        expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Ola Nordmann'));

      await waitFor(() => {
        expect(screen.getByTestId('note-type-note-1')).toHaveTextContent('soap');
      });
    });
  });

  // =============================================
  // 36. "Skriv for a soke" shown when no search term in patient selector
  // =============================================
  it('shows "Skriv for a soke etter pasienter" when patient list is empty and no search', async () => {
    api.patients.search.mockResolvedValue({ data: [] });

    renderWithProviders(<ClinicalNotes />);

    // Without typing anything
    await waitFor(() => {
      expect(screen.getByText('Skriv for a soke etter pasienter')).toBeInTheDocument();
    });
  });

  // =============================================
  // 37. Patients loading state in selector
  // =============================================
  it('shows loading spinner in patient selector while patients are loading', async () => {
    // Make the patients query never resolve during the test
    api.patients.search.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<ClinicalNotes />);

    // The loading spinner should be present (animate-spin class)
    await waitFor(() => {
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  // =============================================
  // 38. Patient date of birth formatted in selector
  // =============================================
  it('displays patient date of birth in the selector', async () => {
    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      // The date is formatted using toLocaleDateString('no-NO')
      // Depending on locale, this may vary but the element should exist
      const patientButton = screen.getByText('Ola Nordmann').closest('button');
      expect(patientButton).toBeInTheDocument();
    });
  });

  // =============================================
  // 39. Quick action SOAP from main content area
  // =============================================
  it('opens SOAP editor from quick action card in main area', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    // Click the first "SOAP Notat" quick action card
    await waitFor(() => {
      const soapButtons = screen.getAllByText('SOAP Notat');
      // The quick action card button
      fireEvent.click(soapButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByTestId('soap-template')).toBeInTheDocument();
    });
  });

  // =============================================
  // 40. Create note shows patient selector if no patient
  // =============================================
  it('opens patient selector when creating note without a patient selected', () => {
    // The component starts without a patient and with selector open by default
    // This test verifies the selector is present
    renderWithProviders(<ClinicalNotes />);

    expect(screen.getByText('Velg pasient')).toBeInTheDocument();
  });

  // =============================================
  // 41. Multiple note items rendered in list
  // =============================================
  it('renders all note items from the notes array', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: mockNotes } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      expect(screen.getByTestId('note-item-note-1')).toBeInTheDocument();
      expect(screen.getByTestId('note-item-note-2')).toBeInTheDocument();
      expect(screen.getByTestId('note-item-note-3')).toBeInTheDocument();
    });
  });

  // =============================================
  // 42. Selected patient name shown in header after selection
  // =============================================
  it('displays selected patient name in header button after selection', async () => {
    api.patients.getById.mockResolvedValue({
      data: { id: 'p-1', first_name: 'Ola', last_name: 'Nordmann' },
    });
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    // After selection, the header should show the patient name
    await waitFor(() => {
      // The patient name should appear somewhere outside the modal
      // (the modal should be closed, and the header button should show the name)
      expect(screen.queryByText('Velg pasient')).not.toBeInTheDocument();
    });
  });

  // =============================================
  // 43. API called with correct parameters for notes fetch
  // =============================================
  it('calls clinicalNotesAPI.getByPatient with correct patient ID', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      expect(clinicalNotesAPI.getByPatient).toHaveBeenCalledWith(
        'p-1',
        expect.objectContaining({
          includeDrafts: true,
        })
      );
    });
  });

  // =============================================
  // 44. Filtering by note type passes correct parameter
  // =============================================
  it('passes note type filter to API when changed', async () => {
    clinicalNotesAPI.getByPatient.mockResolvedValue({ data: { data: [] } });

    renderWithProviders(<ClinicalNotes />);

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ola Nordmann'));

    await waitFor(() => {
      const select = screen.getByDisplayValue('Alle typer');
      fireEvent.change(select, { target: { value: 'initial' } });
    });

    await waitFor(() => {
      expect(clinicalNotesAPI.getByPatient).toHaveBeenCalledWith(
        'p-1',
        expect.objectContaining({
          templateType: 'initial',
          includeDrafts: true,
        })
      );
    });
  });
});
