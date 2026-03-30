/**
 * NotePreview Component Tests
 * Tests for read-only clinical note preview modal
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  FileText: (props) => <span data-testid="icon-filetext">FileText</span>,
  User: (props) => <span data-testid="icon-user">User</span>,
  Edit: (props) => <span data-testid="icon-edit">Edit</span>,
  Trash2: (props) => <span data-testid="icon-trash">Trash2</span>,
  Lock: (props) => <span data-testid="icon-lock">Lock</span>,
  Printer: (props) => <span data-testid="icon-printer">Printer</span>,
  Download: (props) => <span data-testid="icon-download">Download</span>,
  X: (props) => (
    <span data-testid="icon-x" onClick={props.onClick}>
      X
    </span>
  ),
  AlertTriangle: (props) => <span data-testid="icon-alert">AlertTriangle</span>,
  CheckCircle: (props) => <span data-testid="icon-check">CheckCircle</span>,
  Stethoscope: (props) => <span data-testid="icon-stethoscope">Stethoscope</span>,
  Target: (props) => <span data-testid="icon-target">Target</span>,
  ClipboardCheck: (props) => <span data-testid="icon-clipboard">ClipboardCheck</span>,
  Activity: (props) => <span data-testid="icon-activity">Activity</span>,
}));

import NotePreview from '../../../components/notes/NotePreview';

const mockHandlers = {
  onClose: vi.fn(),
  onEdit: vi.fn(),
  onPrint: vi.fn(),
  onExport: vi.fn(),
  onDelete: vi.fn(),
  getNoteTypeBadge: vi.fn(() => 'bg-blue-100 text-blue-800'),
  getNoteTypeLabel: vi.fn(() => 'Oppfolging'),
};

const makeNote = (overrides = {}) => ({
  id: 'abc12345-6789-0000-0000-000000000000',
  note_date: '2024-03-15T10:00:00Z',
  template_type: 'follow_up',
  signed_at: null,
  signed_by_name: null,
  patient_name: 'Ola Nordmann',
  practitioner_name: 'Dr. Hansen',
  duration_minutes: 30,
  vas_pain_start: 7,
  vas_pain_end: 4,
  icd10_codes: ['M54.5'],
  icpc_codes: ['L03'],
  subjective: {
    chiefComplaint: 'Ryggsmerter',
    historyOfPresentIllness: 'Smerter i 2 uker',
    painLocation: 'Korsrygg',
  },
  objective: {
    observation: 'Noe stivhet',
    palpation: 'Omhet i L4-L5',
  },
  assessment: {
    diagnosis: 'Lumbago',
    redFlags: [],
  },
  plan: {
    treatment: 'Manipulasjon',
    exercises: 'Ryggstrekk daglig',
  },
  vestibular_data: null,
  created_at: '2024-03-15T09:00:00Z',
  updated_at: '2024-03-15T10:30:00Z',
  ...overrides,
});

describe('NotePreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when note is null and not loading', () => {
    const { container } = render(<NotePreview {...mockHandlers} note={null} isLoading={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<NotePreview {...mockHandlers} note={null} isLoading={true} />);
    expect(screen.getByText('Laster notat...')).toBeInTheDocument();
  });

  it('renders note header with type label and date', () => {
    render(<NotePreview {...mockHandlers} note={makeNote()} />);
    expect(screen.getAllByText(/Oppfolging/).length).toBeGreaterThanOrEqual(1);
    expect(mockHandlers.getNoteTypeLabel).toHaveBeenCalledWith('follow_up');
  });

  it('displays patient name and practitioner name', () => {
    render(<NotePreview {...mockHandlers} note={makeNote()} />);
    expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    expect(screen.getByText('Dr. Hansen')).toBeInTheDocument();
  });

  it('displays duration in minutes', () => {
    render(<NotePreview {...mockHandlers} note={makeNote()} />);
    expect(screen.getByText(/30.*minutter/)).toBeInTheDocument();
  });

  it('displays VAS pain scores', () => {
    render(<NotePreview {...mockHandlers} note={makeNote()} />);
    expect(screen.getByText(/7\/10/)).toBeInTheDocument();
    expect(screen.getByText(/4\/10/)).toBeInTheDocument();
  });

  it('displays ICD-10 and ICPC-2 diagnosis codes', () => {
    render(<NotePreview {...mockHandlers} note={makeNote()} />);
    expect(screen.getByText('ICD-10: M54.5')).toBeInTheDocument();
    expect(screen.getByText('ICPC-2: L03')).toBeInTheDocument();
  });

  it('renders SOAP sections with content', () => {
    render(<NotePreview {...mockHandlers} note={makeNote()} />);
    expect(screen.getByText('Ryggsmerter')).toBeInTheDocument();
    expect(screen.getByText('Smerter i 2 uker')).toBeInTheDocument();
    expect(screen.getByText('Noe stivhet')).toBeInTheDocument();
    expect(screen.getByText('Lumbago')).toBeInTheDocument();
    expect(screen.getByText('Manipulasjon')).toBeInTheDocument();
  });

  it('displays red flags in assessment section', () => {
    const note = makeNote({
      assessment: {
        diagnosis: 'Lumbago',
        redFlags: ['Cauda equina', 'Progressiv svakhet'],
      },
    });
    render(<NotePreview {...mockHandlers} note={note} />);
    expect(screen.getByText('Cauda equina')).toBeInTheDocument();
    expect(screen.getByText('Progressiv svakhet')).toBeInTheDocument();
  });

  it('shows signed-and-locked info for signed notes', () => {
    const note = makeNote({
      signed_at: '2024-03-15T11:00:00Z',
      signed_by_name: 'Dr. Hansen',
    });
    render(<NotePreview {...mockHandlers} note={note} />);
    expect(screen.getByText('Signert og låst')).toBeInTheDocument();
    expect(screen.getByText(/Signert av Dr. Hansen/)).toBeInTheDocument();
  });

  it('hides edit and delete buttons for signed notes', () => {
    const note = makeNote({ signed_at: '2024-03-15T11:00:00Z' });
    render(<NotePreview {...mockHandlers} note={note} />);
    expect(screen.queryByText('Rediger')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Slett notat')).not.toBeInTheDocument();
  });

  it('shows edit and delete buttons for unsigned notes', () => {
    render(<NotePreview {...mockHandlers} note={makeNote()} />);
    expect(screen.getByText('Rediger')).toBeInTheDocument();
    expect(screen.getByTitle('Slett notat')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<NotePreview {...mockHandlers} note={makeNote()} />);
    // Close button is the last button in the header actions
    const closeButtons = screen.getAllByRole('button');
    const closeBtn = closeButtons[closeButtons.length - 1];
    fireEvent.click(closeBtn);
    expect(mockHandlers.onClose).toHaveBeenCalled();
  });

  it('calls onEdit when edit button is clicked', () => {
    const note = makeNote();
    render(<NotePreview {...mockHandlers} note={note} />);
    fireEvent.click(screen.getByText('Rediger'));
    expect(mockHandlers.onEdit).toHaveBeenCalledWith(note);
  });

  it('calls onPrint when print button is clicked', () => {
    const note = makeNote();
    render(<NotePreview {...mockHandlers} note={note} />);
    fireEvent.click(screen.getByText('Skriv ut'));
    expect(mockHandlers.onPrint).toHaveBeenCalledWith(note.id);
  });

  it('calls onExport when export button is clicked', () => {
    const note = makeNote();
    render(<NotePreview {...mockHandlers} note={note} />);
    fireEvent.click(screen.getByText('Last ned'));
    expect(mockHandlers.onExport).toHaveBeenCalledWith(note.id);
  });

  it('displays note ID in footer (truncated)', () => {
    render(<NotePreview {...mockHandlers} note={makeNote()} />);
    expect(screen.getByText('ID: abc12345...')).toBeInTheDocument();
  });

  it('parses subjective field from JSON string', () => {
    const note = makeNote({
      subjective: JSON.stringify({ chiefComplaint: 'Hodepine', painLocation: 'Frontal' }),
    });
    render(<NotePreview {...mockHandlers} note={note} />);
    expect(screen.getByText('Hodepine')).toBeInTheDocument();
    expect(screen.getByText('Frontal')).toBeInTheDocument();
  });

  it('handles malformed JSON in subjective gracefully', () => {
    const note = makeNote({ subjective: '{broken-json' });
    // Should not throw
    render(<NotePreview {...mockHandlers} note={note} />);
    expect(screen.getAllByText(/Oppfolging/).length).toBeGreaterThanOrEqual(1);
  });
});
