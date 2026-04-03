/**
 * DeepTendonReflexPanel Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DeepTendonReflexPanel from '../../../components/examination/DeepTendonReflexPanel';

describe('DeepTendonReflexPanel', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Norwegian title by default', () => {
    render(<DeepTendonReflexPanel values={{}} onChange={mockOnChange} />);
    expect(screen.getByText('Dype senereflekser (DTR)')).toBeInTheDocument();
  });

  it('should render the English title when lang is en', () => {
    render(<DeepTendonReflexPanel values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText('Deep Tendon Reflexes (DTR)')).toBeInTheDocument();
  });

  it('should render the DTR table with header columns', () => {
    render(<DeepTendonReflexPanel values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText('Reflex')).toBeInTheDocument();
    expect(screen.getByText('Nerve Root')).toBeInTheDocument();
    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
  });

  it('should render reflex names in the table', () => {
    render(<DeepTendonReflexPanel values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText('Biceps')).toBeInTheDocument();
    expect(screen.getByText('Triceps')).toBeInTheDocument();
    expect(screen.getByText('Patellar (Knee Jerk)')).toBeInTheDocument();
    expect(screen.getByText('Achilles (Ankle Jerk)')).toBeInTheDocument();
  });

  it('should render pathological reflexes section', () => {
    render(<DeepTendonReflexPanel values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText(/Pathological Reflexes/)).toBeInTheDocument();
  });
});
