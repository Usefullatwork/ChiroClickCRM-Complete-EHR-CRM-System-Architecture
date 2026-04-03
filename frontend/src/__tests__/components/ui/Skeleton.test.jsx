/**
 * Skeleton Component Tests
 */

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Skeleton,
  CardSkeleton,
  StatsGridSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  ListItemSkeleton,
  ListSkeleton,
} from '../../../components/ui/Skeleton';

describe('Skeleton Component', () => {
  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render a div element', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild.tagName).toBe('DIV');
  });

  it('should have animate-pulse class', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild.className).toContain('animate-pulse');
  });

  it('should have bg-gray-200 class', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild.className).toContain('bg-gray-200');
  });

  it('should have rounded class', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild.className).toContain('rounded');
  });

  // =========================================================================
  // CLASSNAME
  // =========================================================================

  it('should append custom className', () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);
    expect(container.firstChild.className).toContain('h-4');
    expect(container.firstChild.className).toContain('w-24');
  });

  // =========================================================================
  // PROPS FORWARDING
  // =========================================================================

  it('should forward additional props', () => {
    const { container } = render(<Skeleton data-testid="skel" style={{ width: '50%' }} />);
    expect(container.firstChild).toHaveAttribute('data-testid', 'skel');
    expect(container.firstChild.style.width).toBe('50%');
  });
});

describe('CardSkeleton Component', () => {
  it('should render skeleton elements', () => {
    const { container } = render(<CardSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('should append custom className', () => {
    const { container } = render(<CardSkeleton className="my-card-skel" />);
    expect(container.firstChild.className).toContain('my-card-skel');
  });
});

describe('StatsGridSkeleton Component', () => {
  it('should render 4 card skeletons by default', () => {
    const { container } = render(<StatsGridSkeleton />);
    const cards = container.querySelectorAll('.bg-white');
    expect(cards.length).toBe(4);
  });

  it('should render custom count of card skeletons', () => {
    const { container } = render(<StatsGridSkeleton count={2} />);
    const cards = container.querySelectorAll('.bg-white');
    expect(cards.length).toBe(2);
  });
});

describe('TableSkeleton Component', () => {
  it('should render table with header and rows', () => {
    const { container } = render(<TableSkeleton rows={3} columns={4} />);
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelector('thead')).toBeInTheDocument();
    const bodyRows = container.querySelectorAll('tbody tr');
    expect(bodyRows.length).toBe(3);
  });

  it('should hide header when showHeader is false', () => {
    const { container } = render(<TableSkeleton showHeader={false} />);
    expect(container.querySelector('thead')).not.toBeInTheDocument();
  });
});

describe('ListSkeleton Component', () => {
  it('should render default 5 list items', () => {
    const { container } = render(<ListSkeleton />);
    const items = container.querySelectorAll('.flex.items-center');
    expect(items.length).toBe(5);
  });

  it('should render custom number of items', () => {
    const { container } = render(<ListSkeleton items={3} />);
    const items = container.querySelectorAll('.flex.items-center');
    expect(items.length).toBe(3);
  });
});
