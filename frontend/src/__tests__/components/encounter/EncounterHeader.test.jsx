/**
 * EncounterHeader Component Tests
 * Tests date input, encounter type selector, timer, price display, and status indicators.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  Calendar: () => null,
  Check: () => null,
  Clock: () => null,
  Activity: () => null,
  BookOpen: () => null,
  Loader2: () => null,
  Lock: () => null,
}));

import { EncounterHeader } from '../../../components/encounter/EncounterHeader';

function buildProps(overrides = {}) {
  return {
    encounterData: {
      encounter_date: '2026-03-15',
      encounter_type: 'INITIAL',
      duration_minutes: 30,
    },
    setEncounterData: vi.fn(),
    isSigned: false,
    encounterId: 'e1',
    elapsedTime: '05:30',
    totalPrice: 450,
    applyEncounterTypeDefaults: vi.fn(),
    previousEncounters: null,
    handleSALT: vi.fn(),
    autoSaveStatus: 'saved',
    lastSaved: new Date(),
    _saveMutation: { isPending: false },
    setShowKeyboardHelp: vi.fn(),
    ...overrides,
  };
}

describe('EncounterHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the elapsed time', () => {
    render(<EncounterHeader {...buildProps()} />);
    expect(screen.getByText('05:30')).toBeTruthy();
  });

  it('renders the total price', () => {
    render(<EncounterHeader {...buildProps()} />);
    expect(screen.getByText('450 kr')).toBeTruthy();
  });

  it('renders encounter type options', () => {
    render(<EncounterHeader {...buildProps()} />);
    const select = screen.getByDisplayValue(/rstegangs/);
    expect(select).toBeTruthy();
  });

  it('calls applyEncounterTypeDefaults on type change', () => {
    const applyEncounterTypeDefaults = vi.fn();
    render(<EncounterHeader {...buildProps({ applyEncounterTypeDefaults })} />);
    const select = screen.getByDisplayValue(/rstegangs/);
    fireEvent.change(select, { target: { value: 'FOLLOWUP' } });
    expect(applyEncounterTypeDefaults).toHaveBeenCalledWith('FOLLOWUP');
  });

  it('shows Auto-lagret when saved', () => {
    render(<EncounterHeader {...buildProps({ autoSaveStatus: 'saved' })} />);
    expect(screen.getByText('Auto-lagret')).toBeTruthy();
  });

  it('shows Ulagrede endringer when unsaved', () => {
    render(<EncounterHeader {...buildProps({ autoSaveStatus: 'unsaved' })} />);
    expect(screen.getByText('Ulagrede endringer')).toBeTruthy();
  });

  it('shows Redigerer status when not signed and has encounterId', () => {
    render(<EncounterHeader {...buildProps()} />);
    expect(screen.getByText('Redigerer')).toBeTruthy();
  });

  it('shows Utkast when not signed and no encounterId', () => {
    render(<EncounterHeader {...buildProps({ encounterId: null })} />);
    expect(screen.getByText('Utkast')).toBeTruthy();
  });

  it('shows signed status when isSigned', () => {
    render(<EncounterHeader {...buildProps({ isSigned: true })} />);
    expect(screen.getByText(/Signert/)).toBeTruthy();
  });

  it('shows SALT button when previousEncounters exist and not signed', () => {
    render(<EncounterHeader {...buildProps({ previousEncounters: [{}] })} />);
    expect(screen.getByText('SALT')).toBeTruthy();
  });

  it('hides SALT button when signed', () => {
    render(<EncounterHeader {...buildProps({ previousEncounters: [{}], isSigned: true })} />);
    expect(screen.queryByText('SALT')).toBeNull();
  });

  it('calls setShowKeyboardHelp on keyboard help button click', () => {
    const setShowKeyboardHelp = vi.fn();
    render(<EncounterHeader {...buildProps({ setShowKeyboardHelp })} />);
    const kbBtn = screen.getByTitle(/Tastatursnarveier/);
    fireEvent.click(kbBtn);
    expect(setShowKeyboardHelp).toHaveBeenCalledWith(true);
  });
});
