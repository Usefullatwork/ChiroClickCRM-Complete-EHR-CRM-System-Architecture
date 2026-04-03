/**
 * HeadacheAssessment Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HeadacheAssessment from '../../../components/examination/HeadacheAssessment';

describe('HeadacheAssessment', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Norwegian title by default', () => {
    render(<HeadacheAssessment values={{}} onChange={mockOnChange} />);
    expect(screen.getByText('Hodepineutredning')).toBeInTheDocument();
  });

  it('should render the English title when lang is en', () => {
    render(<HeadacheAssessment values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText('Headache Assessment')).toBeInTheDocument();
  });

  it('should render red flags section with SNOOPY label', () => {
    render(<HeadacheAssessment values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText(/Red Flags/)).toBeInTheDocument();
    expect(screen.getByText(/SNOOPY/)).toBeInTheDocument();
  });

  it('should render headache type options', () => {
    render(<HeadacheAssessment values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText('Tension-Type Headache')).toBeInTheDocument();
    expect(screen.getByText('Migraine without Aura')).toBeInTheDocument();
    expect(screen.getByText('Cervicogenic Headache')).toBeInTheDocument();
  });

  it('should call onGenerateNarrative when button is clicked', () => {
    const mockGenerate = vi.fn();
    render(
      <HeadacheAssessment
        values={{}}
        onChange={mockOnChange}
        lang="en"
        onGenerateNarrative={mockGenerate}
      />
    );
    fireEvent.click(screen.getByText('Generate Text'));
    expect(mockGenerate).toHaveBeenCalled();
  });
});
