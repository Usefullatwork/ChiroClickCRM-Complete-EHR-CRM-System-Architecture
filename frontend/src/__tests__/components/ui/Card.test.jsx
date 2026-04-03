/**
 * Card Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/ui/Card';

describe('Card Component', () => {
  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should render as a div', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild.tagName).toBe('DIV');
  });

  // =========================================================================
  // CLASSNAME
  // =========================================================================

  it('should apply base classes', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild.className).toContain('bg-white');
    expect(container.firstChild.className).toContain('rounded-xl');
  });

  it('should append custom className', () => {
    const { container } = render(<Card className="my-class">Content</Card>);
    expect(container.firstChild.className).toContain('my-class');
  });

  // =========================================================================
  // HOVER PROP
  // =========================================================================

  it('should not add hover classes by default', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild.className).not.toContain('hover:shadow-soft');
  });

  it('should add hover classes when hover is true', () => {
    const { container } = render(<Card hover>Content</Card>);
    expect(container.firstChild.className).toContain('hover:shadow-soft');
    expect(container.firstChild.className).toContain('transition-shadow');
  });
});

describe('CardHeader Component', () => {
  it('should render children', () => {
    render(<CardHeader>Header text</CardHeader>);
    expect(screen.getByText('Header text')).toBeInTheDocument();
  });

  it('should apply border-b class', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    expect(container.firstChild.className).toContain('border-b');
    expect(container.firstChild.className).toContain('p-6');
  });

  it('should append custom className', () => {
    const { container } = render(<CardHeader className="extra">Header</CardHeader>);
    expect(container.firstChild.className).toContain('extra');
  });
});

describe('CardBody Component', () => {
  it('should render children', () => {
    render(<CardBody>Body text</CardBody>);
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });

  it('should apply p-6 class', () => {
    const { container } = render(<CardBody>Body</CardBody>);
    expect(container.firstChild.className).toContain('p-6');
  });

  it('should append custom className', () => {
    const { container } = render(<CardBody className="custom-body">Body</CardBody>);
    expect(container.firstChild.className).toContain('custom-body');
  });
});

describe('CardFooter Component', () => {
  it('should render children', () => {
    render(<CardFooter>Footer text</CardFooter>);
    expect(screen.getByText('Footer text')).toBeInTheDocument();
  });

  it('should apply border-t and bg classes', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    expect(container.firstChild.className).toContain('border-t');
    expect(container.firstChild.className).toContain('bg-slate-50');
  });

  it('should append custom className', () => {
    const { container } = render(<CardFooter className="foot-class">Footer</CardFooter>);
    expect(container.firstChild.className).toContain('foot-class');
  });
});
