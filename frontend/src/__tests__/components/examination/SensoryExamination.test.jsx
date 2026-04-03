/**
 * SensoryExamination Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SensoryExamination from '../../../components/examination/SensoryExamination';

describe('SensoryExamination', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(<SensoryExamination values={{}} onChange={mockOnChange} />);
    expect(container).toBeTruthy();
  });

  it('should render with Norwegian lang', () => {
    const { container } = render(
      <SensoryExamination values={{}} onChange={mockOnChange} lang="no" />
    );
    expect(container).toBeTruthy();
  });

  it('should render with English lang', () => {
    const { container } = render(
      <SensoryExamination values={{}} onChange={mockOnChange} lang="en" />
    );
    expect(container).toBeTruthy();
  });
});
