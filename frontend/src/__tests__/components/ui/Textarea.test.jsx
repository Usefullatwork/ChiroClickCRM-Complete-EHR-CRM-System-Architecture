/**
 * Textarea Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Textarea } from '../../../components/ui/Textarea';

describe('Textarea Component', () => {
  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render a textarea element', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render as a textarea tag', () => {
    const { container } = render(<Textarea />);
    expect(container.querySelector('textarea')).toBeInTheDocument();
  });

  // =========================================================================
  // VALUE AND ONCHANGE
  // =========================================================================

  it('should forward value prop', () => {
    render(<Textarea value="some text" onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('some text');
  });

  it('should call onChange when typing', () => {
    const handleChange = vi.fn();
    render(<Textarea value="" onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new' } });
    expect(handleChange).toHaveBeenCalled();
  });

  // =========================================================================
  // PLACEHOLDER
  // =========================================================================

  it('should render placeholder', () => {
    render(<Textarea placeholder="Write notes..." />);
    expect(screen.getByPlaceholderText('Write notes...')).toBeInTheDocument();
  });

  // =========================================================================
  // ROWS PROP
  // =========================================================================

  it('should default to 4 rows', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '4');
  });

  it('should accept custom rows', () => {
    render(<Textarea rows={8} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '8');
  });

  // =========================================================================
  // DISABLED STATE
  // =========================================================================

  it('should be disabled when disabled prop is true', () => {
    render(<Textarea disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should not be disabled by default', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).not.toBeDisabled();
  });

  // =========================================================================
  // CLASSNAME
  // =========================================================================

  it('should apply base classes', () => {
    const { container } = render(<Textarea />);
    const ta = container.querySelector('textarea');
    expect(ta.className).toContain('rounded-md');
    expect(ta.className).toContain('border');
  });

  it('should append custom className', () => {
    const { container } = render(<Textarea className="my-textarea" />);
    const ta = container.querySelector('textarea');
    expect(ta.className).toContain('my-textarea');
  });

  // =========================================================================
  // PROPS FORWARDING
  // =========================================================================

  it('should forward additional props', () => {
    render(<Textarea data-testid="ta" name="notes" />);
    const ta = screen.getByTestId('ta');
    expect(ta).toHaveAttribute('name', 'notes');
  });
});
