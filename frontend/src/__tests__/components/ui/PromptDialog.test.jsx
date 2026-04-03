/**
 * PromptDialog Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PromptDialog from '../../../components/ui/PromptDialog';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (props) => null }));

describe('PromptDialog Component', () => {
  const defaultProps = {
    open: true,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    title: 'Enter a name',
    placeholder: 'Type here...',
    defaultValue: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // OPEN / CLOSE
  // =========================================================================

  it('should render nothing when open is false', () => {
    const { container } = render(<PromptDialog {...defaultProps} open={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('should render dialog when open is true', () => {
    render(<PromptDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // =========================================================================
  // CONTENT
  // =========================================================================

  it('should render the title', () => {
    render(<PromptDialog {...defaultProps} />);
    expect(screen.getByText('Enter a name')).toBeInTheDocument();
  });

  it('should render input with placeholder', () => {
    render(<PromptDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('should initialize input with defaultValue', () => {
    render(<PromptDialog {...defaultProps} defaultValue="initial" />);
    expect(screen.getByDisplayValue('initial')).toBeInTheDocument();
  });

  it('should render custom confirm and cancel text', () => {
    render(<PromptDialog {...defaultProps} confirmText="OK" cancelText="Dismiss" />);
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });

  // =========================================================================
  // INPUT INTERACTION
  // =========================================================================

  it('should update input value on change', () => {
    render(<PromptDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText('Type here...');
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(input).toHaveValue('new value');
  });

  // =========================================================================
  // CALLBACKS
  // =========================================================================

  it('should call onConfirm with input value on form submit', () => {
    render(<PromptDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText('Type here...');
    fireEvent.change(input, { target: { value: 'my answer' } });
    // Submit the form by clicking the submit button
    const submitBtn = screen.getByText('confirm');
    fireEvent.click(submitBtn);
    expect(defaultProps.onConfirm).toHaveBeenCalledWith('my answer');
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<PromptDialog {...defaultProps} />);
    const cancelBtn = screen.getByText('cancel');
    fireEvent.click(cancelBtn);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when backdrop is clicked', () => {
    const { container } = render(<PromptDialog {...defaultProps} />);
    const backdrop = container.querySelector('[aria-hidden="true"]');
    fireEvent.click(backdrop);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel on Escape key press', () => {
    render(<PromptDialog {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // ACCESSIBILITY
  // =========================================================================

  it('should have aria-modal attribute', () => {
    render(<PromptDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('should have aria-labelledby pointing to title', () => {
    render(<PromptDialog {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy)).toHaveTextContent('Enter a name');
  });
});
