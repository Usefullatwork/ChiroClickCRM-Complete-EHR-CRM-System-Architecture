/**
 * DynamicPositionalTestPanel Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DynamicPositionalTestPanel from '../../../components/examination/DynamicPositionalTestPanel';

describe('DynamicPositionalTestPanel', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Norwegian title by default', () => {
    render(<DynamicPositionalTestPanel values={{}} onChange={mockOnChange} />);
    expect(screen.getByText('Dynamisk Posisjonell Testing')).toBeInTheDocument();
  });

  it('should render the English title when lang is en', () => {
    render(<DynamicPositionalTestPanel values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText('Dynamic Positional Testing')).toBeInTheDocument();
  });

  it('should render expanded category sections', () => {
    render(<DynamicPositionalTestPanel values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText('Baseline Testing')).toBeInTheDocument();
    expect(screen.getByText('Cervical Challenges')).toBeInTheDocument();
  });

  it('should call onGenerateNarrative when button is clicked', () => {
    const mockGenerate = vi.fn();
    render(
      <DynamicPositionalTestPanel
        values={{}}
        onChange={mockOnChange}
        lang="en"
        onGenerateNarrative={mockGenerate}
      />
    );
    fireEvent.click(screen.getByText('Generate Text'));
    expect(mockGenerate).toHaveBeenCalled();
  });

  it('should show clinical principles section', () => {
    render(<DynamicPositionalTestPanel values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText('Clinical Principles:')).toBeInTheDocument();
  });
});
