/**
 * AITextarea Tests
 *
 * Tests:
 * - Renders textarea
 * - Loading state display
 * - Disabled state
 * - Placeholder text
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Loader2: (props) => null,
}));

vi.mock('../../../services/api', () => ({
  aiAPI: {
    generateField: vi.fn().mockResolvedValue({ data: { text: '' } }),
  },
}));

vi.mock('../../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    scope: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
  },
}));

import AITextarea from '../../../components/clinical/AITextarea';

describe('AITextarea', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    fieldType: 'subjective',
    placeholder: 'Skriv her...',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a textarea element', () => {
    render(<AITextarea {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Skriv her...');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('displays the current value', () => {
    render(<AITextarea {...defaultProps} value="Test content" />);
    const textarea = screen.getByPlaceholderText('Skriv her...');
    expect(textarea.value).toBe('Test content');
  });

  it('calls onChange when text is entered', () => {
    render(<AITextarea {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Skriv her...');
    fireEvent.change(textarea, { target: { value: 'New text' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('New text');
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<AITextarea {...defaultProps} disabled={true} />);
    const textarea = screen.getByPlaceholderText('Skriv her...');
    expect(textarea).toBeDisabled();
  });

  it('renders with the specified number of rows', () => {
    render(<AITextarea {...defaultProps} rows={5} />);
    const textarea = screen.getByPlaceholderText('Skriv her...');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('applies custom className', () => {
    render(<AITextarea {...defaultProps} className="custom-style" />);
    const textarea = screen.getByPlaceholderText('Skriv her...');
    expect(textarea.className).toContain('custom-style');
  });

  it('renders without ghost text when value is short', () => {
    const { container } = render(<AITextarea {...defaultProps} value="Short" />);
    // Ghost text overlay should not be present when value < minLength (30)
    expect(container.querySelector('.pointer-events-none')).not.toBeInTheDocument();
  });

  it('renders without ghost text when disabled', () => {
    const longValue = 'A'.repeat(50);
    const { container } = render(
      <AITextarea {...defaultProps} value={longValue} disabled={true} />
    );
    expect(container.querySelector('.pointer-events-none')).not.toBeInTheDocument();
  });
});
