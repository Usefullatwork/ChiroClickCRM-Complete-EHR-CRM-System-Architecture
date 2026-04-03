/**
 * EmptyState Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EmptyState from '../../../components/ui/EmptyState';

vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (props) => null }));

describe('EmptyState Component', () => {
  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render the title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('should render in a heading element', () => {
    render(<EmptyState title="Empty" />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Empty');
  });

  // =========================================================================
  // DESCRIPTION
  // =========================================================================

  it('should render description when provided', () => {
    render(<EmptyState title="No data" description="Try adding some items" />);
    expect(screen.getByText('Try adding some items')).toBeInTheDocument();
  });

  it('should not render description paragraph when not provided', () => {
    const { container } = render(<EmptyState title="No data" />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs.length).toBe(0);
  });

  // =========================================================================
  // ACTION SLOT
  // =========================================================================

  it('should render action slot when provided', () => {
    render(<EmptyState title="No items" action={<button>Add Item</button>} />);
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
  });

  it('should not render action wrapper when action is not provided', () => {
    const { container } = render(<EmptyState title="No items" />);
    // Only the icon container div and h3 should exist, no extra action div
    const actionDivs = container.querySelectorAll('.mt-2');
    expect(actionDivs.length).toBe(0);
  });

  // =========================================================================
  // CUSTOM ICON
  // =========================================================================

  it('should render custom icon when provided', () => {
    const CustomIcon = (props) => <span data-testid="custom-icon" {...props} />;
    render(<EmptyState title="Empty" icon={CustomIcon} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  // =========================================================================
  // ILLUSTRATION SLOT
  // =========================================================================

  it('should render illustration instead of icon when provided', () => {
    const illustration = <img data-testid="illustration" src="/test.png" alt="test" />;
    render(<EmptyState title="Empty" illustration={illustration} />);
    expect(screen.getByTestId('illustration')).toBeInTheDocument();
  });

  // =========================================================================
  // CLASSNAME
  // =========================================================================

  it('should append custom className to wrapper', () => {
    const { container } = render(<EmptyState title="Empty" className="my-empty" />);
    expect(container.firstChild.className).toContain('my-empty');
  });

  it('should have centered flex layout', () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.firstChild.className).toContain('flex');
    expect(container.firstChild.className).toContain('items-center');
    expect(container.firstChild.className).toContain('justify-center');
  });
});
