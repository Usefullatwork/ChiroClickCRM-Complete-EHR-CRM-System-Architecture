/**
 * EncounterFooter Component Tests
 * Tests save/sign buttons, disabled states, signed display, and navigation.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  Activity: () => null,
  Save: () => null,
  FileText: () => null,
  Lock: () => null,
  Loader2: () => null,
}));

import { EncounterFooter } from '../../../components/encounter/EncounterFooter';

function buildProps(overrides = {}) {
  return {
    patientId: 'p123',
    isSigned: false,
    saveMutation: { isPending: false },
    signMutation: { isPending: false },
    handleSave: vi.fn(),
    handleSignAndLock: vi.fn(),
    navigate: vi.fn(),
    ...overrides,
  };
}

describe('EncounterFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders save and sign buttons', () => {
    render(<EncounterFooter {...buildProps()} />);
    expect(screen.getByText('Lagre Notat')).toBeTruthy();
    expect(screen.getByText(/Signer og L/)).toBeTruthy();
  });

  it('renders Avbryt (cancel) button', () => {
    render(<EncounterFooter {...buildProps()} />);
    expect(screen.getByText('Avbryt')).toBeTruthy();
  });

  it('navigates to patient page on cancel', () => {
    const navigate = vi.fn();
    render(<EncounterFooter {...buildProps({ navigate })} />);
    fireEvent.click(screen.getByText('Avbryt'));
    expect(navigate).toHaveBeenCalledWith('/patients/p123');
  });

  it('calls handleSave when save button is clicked', () => {
    const handleSave = vi.fn();
    render(<EncounterFooter {...buildProps({ handleSave })} />);
    fireEvent.click(screen.getByTestId('encounter-save-button'));
    expect(handleSave).toHaveBeenCalledTimes(1);
  });

  it('calls handleSignAndLock when sign button is clicked', () => {
    const handleSignAndLock = vi.fn();
    render(<EncounterFooter {...buildProps({ handleSignAndLock })} />);
    fireEvent.click(screen.getByText(/Signer og L/).closest('button'));
    expect(handleSignAndLock).toHaveBeenCalledTimes(1);
  });

  it('disables save button when saving', () => {
    render(<EncounterFooter {...buildProps({ saveMutation: { isPending: true } })} />);
    expect(screen.getByTestId('encounter-save-button').disabled).toBe(true);
  });

  it('shows loading text when saving', () => {
    render(<EncounterFooter {...buildProps({ saveMutation: { isPending: true } })} />);
    expect(screen.getByText('Lagrer...')).toBeTruthy();
  });

  it('shows Klar til lagring when not saving', () => {
    render(<EncounterFooter {...buildProps()} />);
    expect(screen.getByText('Klar til lagring')).toBeTruthy();
  });

  it('disables sign button when already signed', () => {
    render(<EncounterFooter {...buildProps({ isSigned: true })} />);
    const signBtn = screen.getByText('Signert').closest('button');
    expect(signBtn.disabled).toBe(true);
  });

  it('shows Signert text when signed', () => {
    render(<EncounterFooter {...buildProps({ isSigned: true })} />);
    expect(screen.getByText('Signert')).toBeTruthy();
  });
});
