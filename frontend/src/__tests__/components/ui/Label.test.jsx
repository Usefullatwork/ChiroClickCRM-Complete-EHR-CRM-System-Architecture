/**
 * Label Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Label } from '../../../components/ui/Label';

describe('Label Component', () => {
  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render children text', () => {
    render(<Label>Username</Label>);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('should render as a label element', () => {
    const { container } = render(<Label>Test</Label>);
    expect(container.querySelector('label')).toBeInTheDocument();
  });

  // =========================================================================
  // HTMLFOR
  // =========================================================================

  it('should set htmlFor attribute', () => {
    render(<Label htmlFor="name-input">Name</Label>);
    const label = screen.getByText('Name');
    expect(label).toHaveAttribute('for', 'name-input');
  });

  it('should not have for attribute when htmlFor is not provided', () => {
    render(<Label>No For</Label>);
    const label = screen.getByText('No For');
    expect(label).not.toHaveAttribute('for');
  });

  // =========================================================================
  // REQUIRED
  // =========================================================================

  it('should show required indicator when required is true', () => {
    render(<Label required>Required Field</Label>);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should not show required indicator by default', () => {
    render(<Label>Optional Field</Label>);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  // =========================================================================
  // CLASSNAME
  // =========================================================================

  it('should apply default text-sm class', () => {
    const { container } = render(<Label>Test</Label>);
    expect(container.firstChild.className).toContain('text-sm');
    expect(container.firstChild.className).toContain('font-medium');
  });

  it('should append custom className', () => {
    const { container } = render(<Label className="my-label">Test</Label>);
    expect(container.firstChild.className).toContain('my-label');
  });
});
