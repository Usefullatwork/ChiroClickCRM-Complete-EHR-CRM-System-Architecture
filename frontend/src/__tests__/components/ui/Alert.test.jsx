/**
 * Alert Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Alert from '../../../components/ui/Alert';

describe('Alert Component', () => {
  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render children content', () => {
    render(<Alert>Something happened</Alert>);
    expect(screen.getByText('Something happened')).toBeInTheDocument();
  });

  it('should render title when provided', () => {
    render(<Alert title="Warning">Check this out</Alert>);
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Check this out')).toBeInTheDocument();
  });

  it('should not render title element when title is not provided', () => {
    const { container } = render(<Alert>No title here</Alert>);
    expect(container.querySelector('h4')).not.toBeInTheDocument();
  });

  // =========================================================================
  // VARIANTS
  // =========================================================================

  it('should apply info variant by default', () => {
    const { container } = render(<Alert>Info alert</Alert>);
    expect(container.firstChild).toHaveClass('bg-blue-50');
    expect(container.firstChild).toHaveClass('border-blue-200');
  });

  it('should apply success variant', () => {
    const { container } = render(<Alert variant="success">Done!</Alert>);
    expect(container.firstChild).toHaveClass('bg-emerald-50');
    expect(container.firstChild).toHaveClass('border-emerald-200');
  });

  it('should apply warning variant', () => {
    const { container } = render(<Alert variant="warning">Careful!</Alert>);
    expect(container.firstChild).toHaveClass('bg-amber-50');
    expect(container.firstChild).toHaveClass('border-amber-200');
  });

  it('should apply danger variant', () => {
    const { container } = render(<Alert variant="danger">Error!</Alert>);
    expect(container.firstChild).toHaveClass('bg-rose-50');
    expect(container.firstChild).toHaveClass('border-rose-200');
  });

  // =========================================================================
  // CLOSE BUTTON
  // =========================================================================

  it('should render close button when onClose is provided', () => {
    const onClose = vi.fn();
    const { container } = render(<Alert onClose={onClose}>Closable</Alert>);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(1);
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<Alert onClose={onClose}>Close me</Alert>);
    const btn = container.querySelector('button');
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not render close button when onClose is not provided', () => {
    const { container } = render(<Alert>No close</Alert>);
    expect(container.querySelector('button')).not.toBeInTheDocument();
  });

  // =========================================================================
  // CUSTOM CLASS
  // =========================================================================

  it('should apply custom className', () => {
    const { container } = render(<Alert className="mt-4">Styled</Alert>);
    expect(container.firstChild.className).toContain('mt-4');
  });

  // =========================================================================
  // ICON PRESENCE
  // =========================================================================

  it('should render an icon for each variant', () => {
    const { container: infoC } = render(<Alert variant="info">I</Alert>);
    const { container: successC } = render(<Alert variant="success">S</Alert>);
    const { container: warningC } = render(<Alert variant="warning">W</Alert>);
    const { container: dangerC } = render(<Alert variant="danger">D</Alert>);

    // Each variant should render an SVG icon in the flex-shrink-0 wrapper
    [infoC, successC, warningC, dangerC].forEach((c) => {
      const icon = c.querySelector('.flex-shrink-0 svg');
      expect(icon).toBeInTheDocument();
    });
  });
});
