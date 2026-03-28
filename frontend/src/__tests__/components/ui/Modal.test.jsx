/**
 * Modal Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Modal.jsx uses useTranslation without importing it (implicit global).
// Provide it as a global so the component can call it.
const useTranslation = () => ({
  t: (key, fallback) => fallback || key,
  lang: 'no',
  setLang: vi.fn(),
});
vi.stubGlobal('useTranslation', useTranslation);

// Also mock the i18n module in case any transitive import uses it
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

import Modal from '../../../components/ui/Modal';

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <p>Modal body content</p>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset body overflow that Modal sets
    document.body.style.overflow = 'unset';
  });

  // =========================================================================
  // VISIBILITY
  // =========================================================================

  it('should render when isOpen is true', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal body content')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  // =========================================================================
  // ACCESSIBILITY
  // =========================================================================

  it('should have role="dialog" and aria-modal="true"', () => {
    render(<Modal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('should set aria-labelledby when title is provided', () => {
    render(<Modal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });

  it('should set aria-describedby when description is provided', () => {
    render(<Modal {...defaultProps} description="Helpful info" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-describedby');
  });

  it('should not set aria-describedby when description is absent', () => {
    render(<Modal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-describedby')).toBeNull();
  });

  // =========================================================================
  // CLOSE BEHAVIOUR
  // =========================================================================

  it('should call onClose when close button is clicked', () => {
    render(<Modal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Lukk'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    const { container } = render(<Modal {...defaultProps} />);
    const backdrop = container.querySelector('.backdrop-blur-sm');
    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', () => {
    render(<Modal {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // BODY OVERFLOW
  // =========================================================================

  it('should set body overflow to hidden when open', () => {
    render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  // =========================================================================
  // SIZES
  // =========================================================================

  it('should apply md size by default', () => {
    render(<Modal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('max-w-2xl');
  });

  it('should apply sm size', () => {
    render(<Modal {...defaultProps} size="sm" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('max-w-md');
  });

  it('should apply lg size', () => {
    render(<Modal {...defaultProps} size="lg" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('max-w-4xl');
  });

  // =========================================================================
  // FOOTER
  // =========================================================================

  it('should render footer when provided', () => {
    render(<Modal {...defaultProps} footer={<button>Save</button>} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should not render footer section when not provided', () => {
    const { container } = render(<Modal {...defaultProps} />);
    // Footer has a specific border-t + bg-slate-50 class
    const footer = container.querySelector('.bg-slate-50');
    expect(footer).not.toBeInTheDocument();
  });

  // =========================================================================
  // TITLE OPTIONAL
  // =========================================================================

  it('should render without a header when title is not provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <p>Content only</p>
      </Modal>
    );
    expect(screen.getByText('Content only')).toBeInTheDocument();
    // No close button since no header
    expect(screen.queryByLabelText('Lukk')).not.toBeInTheDocument();
  });
});
