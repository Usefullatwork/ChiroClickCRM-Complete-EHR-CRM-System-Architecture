/**
 * Checkbox Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from '../../../components/ui/Checkbox';

vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (props) => null }));

describe('Checkbox Component', () => {
  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render a button with checkbox role', () => {
    render(<Checkbox checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('should set id on the button', () => {
    render(<Checkbox id="my-checkbox" checked={false} onChange={vi.fn()} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('id', 'my-checkbox');
  });

  // =========================================================================
  // CHECKED STATE
  // =========================================================================

  it('should set aria-checked to false when unchecked', () => {
    render(<Checkbox checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
  });

  it('should set aria-checked to true when checked', () => {
    render(<Checkbox checked={true} onChange={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });

  it('should apply checked styles when checked', () => {
    render(<Checkbox checked={true} onChange={vi.fn()} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.className).toContain('bg-teal-600');
  });

  it('should apply unchecked styles when not checked', () => {
    render(<Checkbox checked={false} onChange={vi.fn()} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.className).toContain('bg-white');
  });

  // =========================================================================
  // CHANGE HANDLER
  // =========================================================================

  it('should call onChange with toggled value on click', () => {
    const handleChange = vi.fn();
    render(<Checkbox checked={false} onChange={handleChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('should call onChange with false when checked and clicked', () => {
    const handleChange = vi.fn();
    render(<Checkbox checked={true} onChange={handleChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('should not throw when onChange is not provided', () => {
    render(<Checkbox checked={false} />);
    expect(() => fireEvent.click(screen.getByRole('checkbox'))).not.toThrow();
  });

  // =========================================================================
  // DISABLED STATE
  // =========================================================================

  it('should be disabled when disabled prop is true', () => {
    render(<Checkbox checked={false} onChange={vi.fn()} disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('should not be disabled by default', () => {
    render(<Checkbox checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole('checkbox')).not.toBeDisabled();
  });

  // =========================================================================
  // CLASSNAME
  // =========================================================================

  it('should append custom className', () => {
    render(<Checkbox checked={false} onChange={vi.fn()} className="extra-class" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.className).toContain('extra-class');
  });
});
