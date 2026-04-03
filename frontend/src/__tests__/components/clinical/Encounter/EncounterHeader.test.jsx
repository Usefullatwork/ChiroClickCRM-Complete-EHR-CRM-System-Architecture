/**
 * EncounterHeader Tests
 *
 * Tests:
 * - Renders date, type, and duration inputs
 * - Auto-save status indicators
 * - Signed/unsigned states
 * - SALT button visibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Calendar: (props) => null,
  Clock: (props) => null,
  BookOpen: (props) => null,
  Check: (props) => null,
  Activity: (props) => null,
  Lock: (props) => null,
  Loader2: (props) => null,
}));

import EncounterHeader from '../../../../components/clinical/Encounter/EncounterHeader';

describe('EncounterHeader', () => {
  const defaultProps = {
    encounterData: {
      encounter_date: '2026-03-31',
      encounter_type: 'FOLLOWUP',
      duration_minutes: 30,
    },
    onUpdateField: vi.fn(),
    isSigned: false,
    previousEncounters: [{ id: 'prev-1' }],
    onSALT: vi.fn(),
    onShowKeyboardHelp: vi.fn(),
    autoSaveStatus: 'saved',
    lastSaved: new Date(),
    encounterId: 'enc-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header element', () => {
    render(<EncounterHeader {...defaultProps} />);
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  it('renders the encounter date input', () => {
    render(<EncounterHeader {...defaultProps} />);
    const dateInput = screen.getByDisplayValue('2026-03-31');
    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveAttribute('type', 'date');
  });

  it('renders the encounter type selector', () => {
    render(<EncounterHeader {...defaultProps} />);
    const select = screen.getByDisplayValue('Oppfølging');
    expect(select).toBeInTheDocument();
  });

  it('renders all encounter type options', () => {
    render(<EncounterHeader {...defaultProps} />);
    expect(screen.getByText('Førstegangs')).toBeInTheDocument();
    expect(screen.getByText('Oppfølging')).toBeInTheDocument();
    expect(screen.getByText('Re-undersøkelse')).toBeInTheDocument();
    expect(screen.getByText('Akutt')).toBeInTheDocument();
  });

  it('renders the duration input', () => {
    render(<EncounterHeader {...defaultProps} />);
    const durationInput = screen.getByDisplayValue('30');
    expect(durationInput).toBeInTheDocument();
    expect(durationInput).toHaveAttribute('type', 'number');
  });

  it('calls onUpdateField when date changes', () => {
    render(<EncounterHeader {...defaultProps} />);
    const dateInput = screen.getByDisplayValue('2026-03-31');
    fireEvent.change(dateInput, { target: { value: '2026-04-01' } });
    expect(defaultProps.onUpdateField).toHaveBeenCalledWith('encounter_date', '2026-04-01', true);
  });

  it('renders SALT button when not signed and previousEncounters exist', () => {
    render(<EncounterHeader {...defaultProps} />);
    expect(screen.getByText('SALT')).toBeInTheDocument();
  });

  it('hides SALT button when signed', () => {
    render(<EncounterHeader {...defaultProps} isSigned={true} />);
    expect(screen.queryByText('SALT')).not.toBeInTheDocument();
  });

  it('calls onSALT when SALT button is clicked', () => {
    render(<EncounterHeader {...defaultProps} />);
    fireEvent.click(screen.getByText('SALT'));
    expect(defaultProps.onSALT).toHaveBeenCalled();
  });

  it('shows "Lagret" status when autoSaveStatus is saved', () => {
    render(<EncounterHeader {...defaultProps} autoSaveStatus="saved" />);
    expect(screen.getByText(/Lagret/)).toBeInTheDocument();
  });

  it('shows "Redigerer" status when not signed with encounterId', () => {
    render(<EncounterHeader {...defaultProps} />);
    expect(screen.getByText('Redigerer')).toBeInTheDocument();
  });

  it('shows "Utkast" status when no encounterId', () => {
    render(<EncounterHeader {...defaultProps} encounterId={null} />);
    expect(screen.getByText('Utkast')).toBeInTheDocument();
  });

  it('shows "Signert & Låst" when signed', () => {
    render(<EncounterHeader {...defaultProps} isSigned={true} />);
    expect(screen.getByText('Signert & Låst')).toBeInTheDocument();
  });

  it('disables inputs when signed', () => {
    render(<EncounterHeader {...defaultProps} isSigned={true} />);
    const dateInput = screen.getByDisplayValue('2026-03-31');
    expect(dateInput).toBeDisabled();
  });
});
