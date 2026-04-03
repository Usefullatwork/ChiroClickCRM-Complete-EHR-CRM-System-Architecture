/**
 * CoordinationTestPanel Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CoordinationTestPanel from '../../../components/examination/CoordinationTestPanel';

describe('CoordinationTestPanel', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Norwegian title by default', () => {
    render(<CoordinationTestPanel values={{}} onChange={mockOnChange} />);
    expect(screen.getByText('Koordinasjon og cerebellar funksjon')).toBeInTheDocument();
  });

  it('should render the English title when lang is en', () => {
    render(<CoordinationTestPanel values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText('Coordination & Cerebellar Function')).toBeInTheDocument();
  });

  it('should render the quick screening section', () => {
    render(<CoordinationTestPanel values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText('Quick Screening')).toBeInTheDocument();
    expect(screen.getByText('All Normal')).toBeInTheDocument();
  });

  it('should render expanded category sections', () => {
    render(<CoordinationTestPanel values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText('Limb Coordination')).toBeInTheDocument();
    expect(screen.getByText('Balance & Stance')).toBeInTheDocument();
    expect(screen.getByText('Gait Assessment')).toBeInTheDocument();
  });

  it('should call onGenerateNarrative when button is clicked', () => {
    const mockGenerate = vi.fn();
    render(
      <CoordinationTestPanel
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
