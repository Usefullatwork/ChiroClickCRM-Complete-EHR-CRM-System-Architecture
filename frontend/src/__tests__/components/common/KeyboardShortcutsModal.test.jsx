/**
 * KeyboardShortcutsModal Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KeyboardShortcutsModal from '../../../components/common/KeyboardShortcutsModal';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (props) => null }));
vi.mock('../../../hooks/useGlobalKeyboardShortcuts', () => ({
  SHORTCUTS: [
    { description: 'Open search', keys: ['Ctrl', 'K'] },
    { description: 'Navigate home', keys: ['G', 'H'] },
    { description: 'New patient', keys: ['N', 'P'] },
  ],
}));

describe('KeyboardShortcutsModal Component', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // OPEN / CLOSE
  // =========================================================================

  it('should render nothing when open is false', () => {
    const { container } = render(<KeyboardShortcutsModal open={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('should render modal when open is true', () => {
    render(<KeyboardShortcutsModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // =========================================================================
  // CONTENT
  // =========================================================================

  it('should display Keyboard Shortcuts title', () => {
    render(<KeyboardShortcutsModal {...defaultProps} />);
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('should display all shortcuts', () => {
    render(<KeyboardShortcutsModal {...defaultProps} />);
    expect(screen.getByText('Open search')).toBeInTheDocument();
    expect(screen.getByText('Navigate home')).toBeInTheDocument();
    expect(screen.getByText('New patient')).toBeInTheDocument();
  });

  it('should display keyboard keys', () => {
    render(<KeyboardShortcutsModal {...defaultProps} />);
    expect(screen.getByText('Ctrl')).toBeInTheDocument();
    expect(screen.getByText('K')).toBeInTheDocument();
  });

  it('should render keys in kbd elements', () => {
    const { container } = render(<KeyboardShortcutsModal {...defaultProps} />);
    const kbdElements = container.querySelectorAll('kbd');
    expect(kbdElements.length).toBeGreaterThanOrEqual(6); // 3 shortcuts x 2 keys each
  });

  // =========================================================================
  // CLOSE CALLBACKS
  // =========================================================================

  it('should call onClose when close button is clicked', () => {
    render(<KeyboardShortcutsModal {...defaultProps} />);
    const closeBtn = screen.getByLabelText('Lukk hurtigtaster-dialog');
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    const { container } = render(<KeyboardShortcutsModal {...defaultProps} />);
    const backdrop = container.querySelector('[aria-hidden="true"]');
    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // ACCESSIBILITY
  // =========================================================================

  it('should have aria-modal attribute', () => {
    render(<KeyboardShortcutsModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('should have aria-labelledby pointing to title', () => {
    render(<KeyboardShortcutsModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'shortcuts-title');
  });
});
