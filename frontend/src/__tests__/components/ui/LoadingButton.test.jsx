/**
 * LoadingButton Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoadingButton from '../../../components/ui/LoadingButton';

vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (props) => null }));

describe('LoadingButton Component', () => {
  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render children', () => {
    render(<LoadingButton>Save</LoadingButton>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('should render as a button element', () => {
    render(<LoadingButton>Click</LoadingButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  // =========================================================================
  // VARIANTS
  // =========================================================================

  it('should apply primary variant by default', () => {
    render(<LoadingButton>Primary</LoadingButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-teal-600');
  });

  it('should apply destructive variant', () => {
    render(<LoadingButton variant="destructive">Delete</LoadingButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-red-600');
  });

  it('should apply secondary variant', () => {
    render(<LoadingButton variant="secondary">Secondary</LoadingButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-gray-100');
  });

  it('should apply ghost variant', () => {
    render(<LoadingButton variant="ghost">Ghost</LoadingButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-gray-700');
  });

  // =========================================================================
  // SIZES
  // =========================================================================

  it('should apply md size by default', () => {
    render(<LoadingButton>Medium</LoadingButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('h-10');
  });

  it('should apply sm size', () => {
    render(<LoadingButton size="sm">Small</LoadingButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('h-8');
  });

  it('should apply lg size', () => {
    render(<LoadingButton size="lg">Large</LoadingButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('h-12');
  });

  // =========================================================================
  // LOADING STATE
  // =========================================================================

  it('should disable button when loading', () => {
    render(<LoadingButton loading>Saving</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should show loadingText when loading', () => {
    render(
      <LoadingButton loading loadingText="Saving...">
        Save
      </LoadingButton>
    );
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should show children as fallback when loading without loadingText', () => {
    render(<LoadingButton loading>Save</LoadingButton>);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  // =========================================================================
  // DISABLED STATE
  // =========================================================================

  it('should be disabled when disabled prop is true', () => {
    render(<LoadingButton disabled>Disabled</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should be disabled when both loading and disabled', () => {
    render(
      <LoadingButton loading disabled>
        Both
      </LoadingButton>
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  // =========================================================================
  // CLICK HANDLER
  // =========================================================================

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<LoadingButton onClick={handleClick}>Click</LoadingButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // CLASSNAME
  // =========================================================================

  it('should append custom className', () => {
    render(<LoadingButton className="extra">Test</LoadingButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('extra');
  });

  // =========================================================================
  // ICON PROP
  // =========================================================================

  it('should render icon when provided and not loading', () => {
    const MockIcon = (props) => <span data-testid="btn-icon" {...props} />;
    render(<LoadingButton icon={MockIcon}>With Icon</LoadingButton>);
    expect(screen.getByTestId('btn-icon')).toBeInTheDocument();
  });

  // =========================================================================
  // REF FORWARDING
  // =========================================================================

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<LoadingButton ref={ref}>Ref</LoadingButton>);
    expect(ref).toHaveBeenCalled();
  });
});
