/**
 * LoadingSpinner Component Tests
 */

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingSpinner, LoadingOverlay } from '../../../components/ui/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render an SVG element', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should have spin animation', () => {
    const { container } = render(<LoadingSpinner />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('class')).toContain('animate-spin');
  });

  // =========================================================================
  // SIZE PROP
  // =========================================================================

  it('should apply md size by default', () => {
    const { container } = render(<LoadingSpinner />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('class')).toContain('h-8');
    expect(svg.getAttribute('class')).toContain('w-8');
  });

  it('should apply sm size', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('class')).toContain('h-4');
    expect(svg.getAttribute('class')).toContain('w-4');
  });

  it('should apply lg size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('class')).toContain('h-12');
    expect(svg.getAttribute('class')).toContain('w-12');
  });

  // =========================================================================
  // CLASSNAME
  // =========================================================================

  it('should append custom className to wrapper', () => {
    const { container } = render(<LoadingSpinner className="my-spinner" />);
    expect(container.firstChild.className).toContain('my-spinner');
  });

  it('should have flex centered wrapper', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.firstChild.className).toContain('flex');
    expect(container.firstChild.className).toContain('items-center');
    expect(container.firstChild.className).toContain('justify-center');
  });
});

describe('LoadingOverlay Component', () => {
  it('should render with default message', () => {
    const { container } = render(<LoadingOverlay />);
    const text = container.querySelector('p');
    expect(text).toHaveTextContent('Laster...');
  });

  it('should render with custom message', () => {
    const { container } = render(<LoadingOverlay message="Processing..." />);
    const text = container.querySelector('p');
    expect(text).toHaveTextContent('Processing...');
  });

  it('should render a full-screen overlay', () => {
    const { container } = render(<LoadingOverlay />);
    expect(container.firstChild.className).toContain('fixed');
    expect(container.firstChild.className).toContain('inset-0');
    expect(container.firstChild.className).toContain('z-50');
  });

  it('should contain a LoadingSpinner', () => {
    const { container } = render(<LoadingOverlay />);
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
  });
});
