/**
 * VisualROMSelector Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VisualROMSelector from '../../../components/examination/VisualROMSelector';

describe('VisualROMSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(<VisualROMSelector values={{}} onChange={mockOnChange} />);
    expect(container).toBeTruthy();
  });

  it('should render with Norwegian lang', () => {
    const { container } = render(
      <VisualROMSelector values={{}} onChange={mockOnChange} lang="no" />
    );
    expect(container).toBeTruthy();
  });

  it('should render with English lang', () => {
    const { container } = render(
      <VisualROMSelector values={{}} onChange={mockOnChange} lang="en" />
    );
    expect(container).toBeTruthy();
  });
});
