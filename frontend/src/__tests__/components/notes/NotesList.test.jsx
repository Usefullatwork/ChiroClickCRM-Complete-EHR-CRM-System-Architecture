/**
 * NotesList Component Tests
 * Tests for clinical notes list display, actions, and empty states
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  FileText: (props) => (
    <span data-testid="icon-filetext" {...props}>
      FileText
    </span>
  ),
  User: (props) => (
    <span data-testid="icon-user" {...props}>
      User
    </span>
  ),
  Clock: (props) => (
    <span data-testid="icon-clock" {...props}>
      Clock
    </span>
  ),
  ChevronRight: (props) => (
    <span data-testid="icon-chevron" {...props}>
      ChevronRight
    </span>
  ),
  Edit: (props) => (
    <span data-testid="icon-edit" {...props}>
      Edit
    </span>
  ),
  Trash2: (props) => (
    <span data-testid="icon-trash" {...props}>
      Trash2
    </span>
  ),
  Lock: (props) => (
    <span data-testid="icon-lock" {...props}>
      Lock
    </span>
  ),
  Eye: (props) => (
    <span data-testid="icon-eye" {...props}>
      Eye
    </span>
  ),
  Printer: (props) => (
    <span data-testid="icon-printer" {...props}>
      Printer
    </span>
  ),
  Download: (props) => (
    <span data-testid="icon-download" {...props}>
      Download
    </span>
  ),
  AlertTriangle: (props) => (
    <span data-testid="icon-alert" {...props}>
      AlertTriangle
    </span>
  ),
}));

// Mock Skeleton
vi.mock('../../../components/ui/Skeleton', () => ({
  ListSkeleton: ({ items }) => <div data-testid="list-skeleton">Loading {items} items</div>,
}));

import NotesList from '../../../components/notes/NotesList';

const mockHandlers = {
  onViewNote: vi.fn(),
  onEditNote: vi.fn(),
  onDeleteNote: vi.fn(),
  onPrintNote: vi.fn(),
  onExportNote: vi.fn(),
  getNoteTypeBadge: vi.fn(() => 'bg-blue-100 text-blue-800'),
  getNoteTypeLabel: vi.fn(() => 'Oppfolging'),
};

const makeNote = (overrides = {}) => ({
  id: 'note-1',
  note_date: '2024-03-15T10:00:00Z',
  template_type: 'follow_up',
  signed_at: null,
  is_draft: false,
  icd10_codes: [],
  icpc_codes: [],
  subjective: JSON.stringify({ chiefComplaint: 'Ryggsmerter' }),
  practitioner_name: 'Dr. Hansen',
  duration_minutes: 30,
  vas_pain_start: 7,
  vas_pain_end: 4,
  assessment: null,
  ...overrides,
});

describe('NotesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders no-patient-selected state when selectedPatientId is missing', () => {
    render(<NotesList {...mockHandlers} selectedPatientId={null} />);
    expect(screen.getByText('Ingen pasient valgt')).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    render(<NotesList {...mockHandlers} selectedPatientId="p1" isLoading={true} notes={[]} />);
    expect(screen.getByTestId('list-skeleton')).toBeInTheDocument();
  });

  it('renders empty state when notes array is empty', () => {
    render(<NotesList {...mockHandlers} selectedPatientId="p1" notes={[]} />);
    expect(screen.getByText('Ingen notater')).toBeInTheDocument();
  });

  it('renders notes with correct count in header', () => {
    const notes = [makeNote(), makeNote({ id: 'note-2' })];
    render(<NotesList {...mockHandlers} selectedPatientId="p1" notes={notes} />);
    expect(screen.getByText('Notater (2)')).toBeInTheDocument();
  });

  it('displays chief complaint from subjective JSON field', () => {
    const notes = [makeNote({ subjective: JSON.stringify({ chiefComplaint: 'Nakkesmerter' }) })];
    render(<NotesList {...mockHandlers} selectedPatientId="p1" notes={notes} />);
    expect(screen.getByText('Nakkesmerter')).toBeInTheDocument();
  });

  it('displays diagnosis codes from icd10 and icpc arrays', () => {
    const notes = [makeNote({ icd10_codes: ['M54.5', 'M79.3'], icpc_codes: ['L03'] })];
    render(<NotesList {...mockHandlers} selectedPatientId="p1" notes={notes} />);
    expect(screen.getByText('M54.5')).toBeInTheDocument();
    expect(screen.getByText('M79.3')).toBeInTheDocument();
    expect(screen.getByText('L03')).toBeInTheDocument();
  });

  it('shows signed badge for signed notes', () => {
    const notes = [makeNote({ signed_at: '2024-03-15T11:00:00Z' })];
    render(<NotesList {...mockHandlers} selectedPatientId="p1" notes={notes} />);
    expect(screen.getByText('Signert')).toBeInTheDocument();
  });

  it('shows draft badge for draft notes', () => {
    const notes = [makeNote({ is_draft: true })];
    render(<NotesList {...mockHandlers} selectedPatientId="p1" notes={notes} />);
    expect(screen.getByText('Utkast')).toBeInTheDocument();
  });

  it('calls onViewNote when clicking on a note row', () => {
    const notes = [makeNote()];
    render(<NotesList {...mockHandlers} selectedPatientId="p1" notes={notes} />);
    // Click the clickable area containing the chief complaint
    fireEvent.click(screen.getByText('Ryggsmerter'));
    expect(mockHandlers.onViewNote).toHaveBeenCalledWith('note-1');
  });

  it('calls onPrintNote when clicking print button', () => {
    const notes = [makeNote()];
    render(<NotesList {...mockHandlers} selectedPatientId="p1" notes={notes} />);
    const printBtn = screen.getByTitle('Skriv ut');
    fireEvent.click(printBtn);
    expect(mockHandlers.onPrintNote).toHaveBeenCalledWith('note-1');
  });

  it('calls onExportNote when clicking download button', () => {
    const notes = [makeNote()];
    render(<NotesList {...mockHandlers} selectedPatientId="p1" notes={notes} />);
    const exportBtn = screen.getByTitle('Last ned');
    fireEvent.click(exportBtn);
    expect(mockHandlers.onExportNote).toHaveBeenCalledWith('note-1');
  });

  it('hides edit and delete buttons for signed (locked) notes', () => {
    const notes = [makeNote({ signed_at: '2024-03-15T11:00:00Z' })];
    render(<NotesList {...mockHandlers} selectedPatientId="p1" notes={notes} />);
    expect(screen.queryByTitle('Rediger notat')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Slett notat')).not.toBeInTheDocument();
  });

  it('shows edit and delete buttons for unsigned notes', () => {
    const notes = [makeNote({ signed_at: null })];
    render(<NotesList {...mockHandlers} selectedPatientId="p1" notes={notes} />);
    expect(screen.getByTitle('Rediger notat')).toBeInTheDocument();
    expect(screen.getByTitle('Slett notat')).toBeInTheDocument();
  });

  it('displays VAS pain data when present', () => {
    const notes = [makeNote({ vas_pain_start: 7, vas_pain_end: 3 })];
    render(<NotesList {...mockHandlers} selectedPatientId="p1" notes={notes} />);
    expect(screen.getByText(/VAS:/)).toBeInTheDocument();
  });

  it('displays practitioner name and duration', () => {
    const notes = [makeNote({ practitioner_name: 'Dr. Hansen', duration_minutes: 45 })];
    render(<NotesList {...mockHandlers} selectedPatientId="p1" notes={notes} />);
    expect(screen.getByText('Dr. Hansen')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
  });

  it('shows load more button when notes count is 20 or more', () => {
    const notes = Array.from({ length: 20 }, (_, i) => makeNote({ id: `note-${i}` }));
    render(<NotesList {...mockHandlers} selectedPatientId="p1" notes={notes} />);
    expect(screen.getByText('Last flere notater...')).toBeInTheDocument();
  });

  it('does not show load more when notes count is less than 20', () => {
    const notes = [makeNote()];
    render(<NotesList {...mockHandlers} selectedPatientId="p1" notes={notes} />);
    expect(screen.queryByText('Last flere notater...')).not.toBeInTheDocument();
  });
});
