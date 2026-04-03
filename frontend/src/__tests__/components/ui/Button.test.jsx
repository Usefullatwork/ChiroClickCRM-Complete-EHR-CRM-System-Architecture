/**
 * Button Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../../../components/ui/Button';

vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (props) => null }));

describe('Button Component', () => {
  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render children content', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should render a button element', () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole('button', { name: 'Test' })).toBeInTheDocument();
  });

  // =========================================================================
  // VARIANTS
  // =========================================================================

  it('should apply primary variant by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-teal-600');
  });

  it('should apply secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-white');
  });

  it('should apply danger variant', () => {
    render(<Button variant="danger">Danger</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-red-600');
  });

  it('should apply ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-slate-600');
  });

  // =========================================================================
  // SIZES
  // =========================================================================

  it('should apply md size by default', () => {
    render(<Button>Medium</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-sm');
    expect(btn.className).toContain('px-4');
  });

  it('should apply sm size', () => {
    render(<Button size="sm">Small</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-xs');
    expect(btn.className).toContain('px-3');
  });

  it('should apply lg size', () => {
    render(<Button size="lg">Large</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-base');
    expect(btn.className).toContain('px-6');
  });

  // =========================================================================
  // CLASSNAME FORWARDING
  // =========================================================================

  it('should append custom className', () => {
    render(<Button className="my-custom-class">Custom</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('my-custom-class');
  });

  // =========================================================================
  // DISABLED STATE
  // =========================================================================

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should not be disabled by default', () => {
    render(<Button>Enabled</Button>);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  // =========================================================================
  // LOADING STATE
  // =========================================================================

  it('should disable button when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should set aria-busy when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('should not set aria-busy when not loading', () => {
    render(<Button>Not loading</Button>);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
  });

  it('should render spinner SVG when loading', () => {
    const { container } = render(<Button loading>Loading</Button>);
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
  });

  // =========================================================================
  // CLICK HANDLER
  // =========================================================================

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click
      </Button>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  // =========================================================================
  // PROPS FORWARDING
  // =========================================================================

  it('should forward additional props to button element', () => {
    render(
      <Button data-testid="custom-btn" type="submit">
        Submit
      </Button>
    );
    const btn = screen.getByTestId('custom-btn');
    expect(btn).toHaveAttribute('type', 'submit');
  });

  it('should render icon when provided', () => {
    const MockIcon = (props) => <span data-testid="mock-icon" {...props} />;
    render(<Button icon={MockIcon}>With Icon</Button>);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });
});
