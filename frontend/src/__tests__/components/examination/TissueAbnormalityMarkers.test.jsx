/**
 * TissueAbnormalityMarkers Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TissueAbnormalityMarkers from '../../../components/examination/TissueAbnormalityMarkers';

describe('TissueAbnormalityMarkers', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(<TissueAbnormalityMarkers values={{}} onChange={mockOnChange} />);
    expect(container).toBeTruthy();
  });

  it('should render with Norwegian lang', () => {
    const { container } = render(
      <TissueAbnormalityMarkers values={{}} onChange={mockOnChange} lang="no" />
    );
    expect(container).toBeTruthy();
  });

  it('should render with English lang', () => {
    const { container } = render(
      <TissueAbnormalityMarkers values={{}} onChange={mockOnChange} lang="en" />
    );
    expect(container).toBeTruthy();
  });
});
