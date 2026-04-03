/**
 * VestibularAssessment Component Tests
 * Tests rendering of sections, symptom triggers, balance tests, save/lock buttons, and readOnly mode.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => ({
  Eye: () => null,
  Activity: () => null,
  AlertTriangle: () => null,
  Save: () => null,
  Lock: () => null,
  ChevronDown: () => null,
  ChevronUp: () => null,
  HelpCircle: () => null,
  Clock: () => null,
  Target: () => null,
}));

import VestibularAssessment from '../../../components/notes/VestibularAssessment';

function buildProps(overrides = {}) {
  return {
    initialData: null,
    patient: { firstName: 'Ola', lastName: 'Nordmann' },
    onSave: vi.fn(),
    onLock: vi.fn(),
    readOnly: false,
    ...overrides,
  };
}

describe('VestibularAssessment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header title', () => {
    render(<VestibularAssessment {...buildProps()} />);
    expect(screen.getByText('Vestibular Vurdering')).toBeTruthy();
  });

  it('renders patient name', () => {
    render(<VestibularAssessment {...buildProps()} />);
    expect(screen.getByText('Ola Nordmann')).toBeTruthy();
  });

  it('renders all main sections', () => {
    render(<VestibularAssessment {...buildProps()} />);
    expect(screen.getByText('Symptomer')).toBeTruthy();
    expect(screen.getByText('Okulomotorisk undersokelse')).toBeTruthy();
    expect(screen.getByText('Vestibulare tester')).toBeTruthy();
    expect(screen.getByText('Balanse')).toBeTruthy();
    expect(screen.getByText('Klinisk vurdering')).toBeTruthy();
    expect(screen.getByText('Behandlingsplan')).toBeTruthy();
  });

  it('renders dizziness type selector', () => {
    render(<VestibularAssessment {...buildProps()} />);
    expect(screen.getByText('Type svimmelhet')).toBeTruthy();
    expect(screen.getByText('Vertigo (roterende)')).toBeTruthy();
  });

  it('renders dizziness trigger buttons', () => {
    render(<VestibularAssessment {...buildProps()} />);
    expect(screen.getByText('Hodebevegelse')).toBeTruthy();
    expect(screen.getByText('Snur seg i sengen')).toBeTruthy();
    expect(screen.getByText('Stress')).toBeTruthy();
  });

  it('toggles trigger selection on click', () => {
    render(<VestibularAssessment {...buildProps()} />);
    fireEvent.click(screen.getByText('Hodebevegelse'));
    // Re-query after state update to get the updated element
    const updatedBtn = screen.getByText('Hodebevegelse');
    expect(updatedBtn.className).toContain('bg-blue-100');
  });

  it('renders associated symptom buttons', () => {
    render(<VestibularAssessment {...buildProps()} />);
    expect(screen.getByText('Kvalme')).toBeTruthy();
    expect(screen.getByText('Tinnitus')).toBeTruthy();
    expect(screen.getByText('Hodepine')).toBeTruthy();
  });

  it('renders Dix-Hallpike test section', () => {
    render(<VestibularAssessment {...buildProps()} />);
    expect(screen.getByText('Dix-Hallpike')).toBeTruthy();
  });

  it('renders Romberg section', () => {
    render(<VestibularAssessment {...buildProps()} />);
    expect(screen.getByText('Romberg')).toBeTruthy();
  });

  it('renders save and sign buttons when not readOnly', () => {
    render(<VestibularAssessment {...buildProps()} />);
    expect(screen.getByText('Lagre')).toBeTruthy();
    expect(screen.getByText('Signer')).toBeTruthy();
  });

  it('hides save/sign buttons in readOnly mode', () => {
    render(<VestibularAssessment {...buildProps({ readOnly: true })} />);
    expect(screen.queryByText('Lagre')).toBeNull();
    expect(screen.queryByText('Signer')).toBeNull();
  });

  it('calls onSave when save button is clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<VestibularAssessment {...buildProps({ onSave })} />);
    fireEvent.click(screen.getByText('Lagre'));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  });

  it('calls onLock when sign button is clicked', () => {
    const onLock = vi.fn();
    render(<VestibularAssessment {...buildProps({ onLock })} />);
    fireEvent.click(screen.getByText('Signer'));
    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it('collapses a section when header is clicked', () => {
    render(<VestibularAssessment {...buildProps()} />);
    const symptomHeader = screen.getByText('Symptomer').closest('button');
    fireEvent.click(symptomHeader);
    expect(screen.queryByText('Type svimmelhet')).toBeNull();
  });

  it('disables inputs in readOnly mode', () => {
    render(<VestibularAssessment {...buildProps({ readOnly: true })} />);
    const selects = screen.getAllByRole('combobox');
    selects.forEach((select) => {
      expect(select.disabled).toBe(true);
    });
  });
});
