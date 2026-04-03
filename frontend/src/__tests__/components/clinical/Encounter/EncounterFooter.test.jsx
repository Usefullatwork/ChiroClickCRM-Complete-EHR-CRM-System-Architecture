/**
 * EncounterFooter Tests
 *
 * Tests:
 * - Renders action buttons
 * - Save status display
 * - Signed state hides save/sign buttons
 * - Button callbacks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Activity: (props) => null,
  FileText: (props) => null,
  Save: (props) => null,
  Lock: (props) => null,
  Loader2: (props) => null,
}));

import EncounterFooter from '../../../../components/clinical/Encounter/EncounterFooter';

describe('EncounterFooter', () => {
  const defaultProps = {
    isSigned: false,
    onCancel: vi.fn(),
    onPreview: vi.fn(),
    onSave: vi.fn(),
    onSaveAndSign: vi.fn(),
    isSaving: false,
    isSigning: false,
    autoSaveStatus: 'saved',
    lastSaved: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the footer element', () => {
    render(<EncounterFooter {...defaultProps} />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  it('renders Avbryt button', () => {
    render(<EncounterFooter {...defaultProps} />);
    expect(screen.getByText('Avbryt')).toBeInTheDocument();
  });

  it('renders Forhåndsvis button', () => {
    render(<EncounterFooter {...defaultProps} />);
    expect(screen.getByText('Forhåndsvis')).toBeInTheDocument();
  });

  it('renders Lagre Notat button when not signed', () => {
    render(<EncounterFooter {...defaultProps} />);
    expect(screen.getByText('Lagre Notat')).toBeInTheDocument();
  });

  it('renders Signer og Lås button when not signed', () => {
    render(<EncounterFooter {...defaultProps} />);
    expect(screen.getByText('Signer og Lås')).toBeInTheDocument();
  });

  it('hides save/sign buttons when signed', () => {
    render(<EncounterFooter {...defaultProps} isSigned={true} />);
    expect(screen.queryByText('Lagre Notat')).not.toBeInTheDocument();
    expect(screen.queryByText('Signer og Lås')).not.toBeInTheDocument();
    expect(screen.getByText('Signert')).toBeInTheDocument();
  });

  it('calls onCancel when Avbryt is clicked', () => {
    render(<EncounterFooter {...defaultProps} />);
    fireEvent.click(screen.getByText('Avbryt'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('calls onPreview when Forhåndsvis is clicked', () => {
    render(<EncounterFooter {...defaultProps} />);
    fireEvent.click(screen.getByText('Forhåndsvis'));
    expect(defaultProps.onPreview).toHaveBeenCalled();
  });

  it('calls onSave when Lagre Notat is clicked', () => {
    render(<EncounterFooter {...defaultProps} />);
    fireEvent.click(screen.getByText('Lagre Notat'));
    expect(defaultProps.onSave).toHaveBeenCalled();
  });

  it('calls onSaveAndSign when Signer og Lås is clicked', () => {
    render(<EncounterFooter {...defaultProps} />);
    fireEvent.click(screen.getByText('Signer og Lås'));
    expect(defaultProps.onSaveAndSign).toHaveBeenCalled();
  });

  it('disables save button when isSaving', () => {
    render(<EncounterFooter {...defaultProps} isSaving={true} />);
    const saveBtn = screen.getByText('Lagre Notat');
    expect(saveBtn).toBeDisabled();
  });

  it('shows "Lagrer..." text when isSaving', () => {
    render(<EncounterFooter {...defaultProps} isSaving={true} />);
    expect(screen.getByText('Lagrer...')).toBeInTheDocument();
  });

  it('shows "Alle endringer er lagret" when autoSaveStatus is saved', () => {
    render(<EncounterFooter {...defaultProps} autoSaveStatus="saved" />);
    expect(screen.getByText('Alle endringer er lagret')).toBeInTheDocument();
  });

  it('shows "Utkast lagres automatisk" when autoSaveStatus is unsaved', () => {
    render(<EncounterFooter {...defaultProps} autoSaveStatus="unsaved" />);
    expect(screen.getByText('Utkast lagres automatisk')).toBeInTheDocument();
  });

  it('shows last saved time when provided', () => {
    const lastSaved = new Date(2026, 2, 31, 14, 30);
    render(<EncounterFooter {...defaultProps} lastSaved={lastSaved} />);
    expect(screen.getByText(/Sist oppdatert:/)).toBeInTheDocument();
  });
});
