/**
 * KeyboardShortcutsModal Component Tests
 * Tests rendering, keyboard shortcuts list, macros display, and close behavior.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  X: () => null,
}));

import { KeyboardShortcutsModal } from '../../../components/encounter/KeyboardShortcutsModal';

const mockShortcuts = {
  'Ctrl+S': 'Lagre notat',
  'Ctrl+L': 'SALT - Kopier fra forrige',
  F1: 'Vis hjelp',
};

const mockMacros = {
  '.cc': 'Hovedklage: Pasienten kommer inn med smerter...',
  '.hx': 'Sykehistorie: Pasienten rapporterer en gradvis...',
  '.rom': 'Bevegelsesutslag: Aktiv og passiv ROM innenfor...',
};

function buildProps(overrides = {}) {
  return {
    showKeyboardHelp: true,
    setShowKeyboardHelp: vi.fn(),
    keyboardShortcuts: mockShortcuts,
    macros: mockMacros,
    ...overrides,
  };
}

describe('KeyboardShortcutsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when showKeyboardHelp is false', () => {
    const { container } = render(
      <KeyboardShortcutsModal {...buildProps({ showKeyboardHelp: false })} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the modal when showKeyboardHelp is true', () => {
    render(<KeyboardShortcutsModal {...buildProps()} />);
    expect(screen.getByRole('dialog', { hidden: true })).toBeTruthy();
  });

  it('displays all keyboard shortcuts', () => {
    render(<KeyboardShortcutsModal {...buildProps()} />);
    expect(screen.getByText('Lagre notat')).toBeTruthy();
    expect(screen.getByText('Ctrl+S')).toBeTruthy();
    expect(screen.getByText('Vis hjelp')).toBeTruthy();
    expect(screen.getByText('F1')).toBeTruthy();
  });

  it('displays macro keys', () => {
    render(<KeyboardShortcutsModal {...buildProps()} />);
    expect(screen.getByText('.cc')).toBeTruthy();
    expect(screen.getByText('.hx')).toBeTruthy();
    expect(screen.getByText('.rom')).toBeTruthy();
  });

  it('calls setShowKeyboardHelp(false) when close button is clicked', () => {
    const setShowKeyboardHelp = vi.fn();
    render(<KeyboardShortcutsModal {...buildProps({ setShowKeyboardHelp })} />);
    const buttons = screen.getAllByRole('button', { hidden: true });
    fireEvent.click(buttons[0]);
    expect(setShowKeyboardHelp).toHaveBeenCalledWith(false);
  });

  it('calls setShowKeyboardHelp(false) when backdrop is clicked', () => {
    const setShowKeyboardHelp = vi.fn();
    render(<KeyboardShortcutsModal {...buildProps({ setShowKeyboardHelp })} />);
    const backdrop = screen.getByRole('dialog', { hidden: true }).closest('[aria-hidden]');
    fireEvent.click(backdrop);
    expect(setShowKeyboardHelp).toHaveBeenCalledWith(false);
  });

  it('does not close when clicking inside the modal content', () => {
    const setShowKeyboardHelp = vi.fn();
    render(<KeyboardShortcutsModal {...buildProps({ setShowKeyboardHelp })} />);
    fireEvent.click(screen.getByRole('dialog', { hidden: true }));
    expect(setShowKeyboardHelp).not.toHaveBeenCalled();
  });

  it('has proper aria attributes on dialog', () => {
    render(<KeyboardShortcutsModal {...buildProps()} />);
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
  });
});
