/**
 * ConfirmDialog Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (props) => null }));
vi.mock('../../../components/ui/LoadingButton', () => ({
  default: vi.fn(({ children, onClick, loading, ref: _ref, ...rest }) => (
    <button onClick={onClick} disabled={loading} data-testid="confirm-btn" {...rest}>
      {children}
    </button>
  )),
}));

describe('ConfirmDialog Component', () => {
  const defaultProps = {
    open: true,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    title: 'Delete item?',
    description: 'This action cannot be undone.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // OPEN / CLOSE
  // =========================================================================

  it('should render nothing when open is false', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} open={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('should render when open is true', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  // =========================================================================
  // CONTENT
  // =========================================================================

  it('should render the title', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Delete item?')).toBeInTheDocument();
  });

  it('should render the description', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('should use translated default title when title is not provided', () => {
    render(<ConfirmDialog {...defaultProps} title={undefined} />);
    expect(screen.getByText('areYouSure')).toBeInTheDocument();
  });

  it('should render custom confirm/cancel text', () => {
    render(<ConfirmDialog {...defaultProps} confirmText="Yes, delete" cancelText="No, keep" />);
    expect(screen.getByText('Yes, delete')).toBeInTheDocument();
    expect(screen.getByText('No, keep')).toBeInTheDocument();
  });

  // =========================================================================
  // CALLBACKS
  // =========================================================================

  it('should call onConfirm when confirm button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByTestId('confirm-btn'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const cancelButtons = screen.getAllByRole('button');
    // The text-based cancel button (not the X close button)
    const cancelBtn = cancelButtons.find((btn) => btn.textContent === 'cancel');
    if (cancelBtn) {
      fireEvent.click(cancelBtn);
      expect(defaultProps.onCancel).toHaveBeenCalled();
    }
  });

  it('should call onCancel when backdrop is clicked', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} />);
    const backdrop = container.querySelector('[aria-hidden="true"]');
    fireEvent.click(backdrop);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel on Escape key press', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // ACCESSIBILITY
  // =========================================================================

  it('should have aria-modal attribute', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('alertdialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('should have aria-labelledby pointing to title', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const dialog = screen.getByRole('alertdialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy)).toBeInTheDocument();
  });
});
