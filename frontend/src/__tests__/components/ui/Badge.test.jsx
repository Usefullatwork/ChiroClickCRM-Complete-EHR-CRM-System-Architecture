/**
 * Badge Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Badge from '../../../components/ui/Badge';

describe('Badge Component', () => {
  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render children text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render as a span element', () => {
    const { container } = render(<Badge>Test</Badge>);
    expect(container.firstChild.tagName).toBe('SPAN');
  });

  it('should have inline-flex and rounded-full base classes', () => {
    const { container } = render(<Badge>Base</Badge>);
    const el = container.firstChild;
    expect(el).toHaveClass('inline-flex');
    expect(el).toHaveClass('rounded-full');
    expect(el).toHaveClass('font-medium');
  });

  // =========================================================================
  // VARIANTS
  // =========================================================================

  it('should apply default variant styles', () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toHaveClass('bg-slate-100');
    expect(container.firstChild).toHaveClass('text-slate-800');
  });

  it('should apply success variant', () => {
    const { container } = render(<Badge variant="success">OK</Badge>);
    expect(container.firstChild).toHaveClass('bg-emerald-100');
    expect(container.firstChild).toHaveClass('text-emerald-800');
  });

  it('should apply warning variant', () => {
    const { container } = render(<Badge variant="warning">Caution</Badge>);
    expect(container.firstChild).toHaveClass('bg-amber-100');
    expect(container.firstChild).toHaveClass('text-amber-800');
  });

  it('should apply danger variant', () => {
    const { container } = render(<Badge variant="danger">Error</Badge>);
    expect(container.firstChild).toHaveClass('bg-rose-100');
    expect(container.firstChild).toHaveClass('text-rose-800');
  });

  it('should apply info variant', () => {
    const { container } = render(<Badge variant="info">Info</Badge>);
    expect(container.firstChild).toHaveClass('bg-blue-100');
    expect(container.firstChild).toHaveClass('text-blue-800');
  });

  // =========================================================================
  // SIZES
  // =========================================================================

  it('should apply md size by default', () => {
    const { container } = render(<Badge>Medium</Badge>);
    expect(container.firstChild).toHaveClass('px-2.5');
  });

  it('should apply sm size', () => {
    const { container } = render(<Badge size="sm">Small</Badge>);
    expect(container.firstChild).toHaveClass('px-2');
  });

  // =========================================================================
  // COMPOSITION
  // =========================================================================

  it('should render complex children', () => {
    render(
      <Badge variant="success">
        <span data-testid="icon">*</span> Active
      </Badge>
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Active', { exact: false })).toBeInTheDocument();
  });
});
