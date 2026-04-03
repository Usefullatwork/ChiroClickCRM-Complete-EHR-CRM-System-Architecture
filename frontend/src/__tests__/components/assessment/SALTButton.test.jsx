/**
 * SALTButton Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SALTButton, { SALTButtonCompact } from '../../../components/assessment/SALTButton';

describe('SALTButton', () => {
  const mockOnApply = vi.fn();
  const previousEncounter = {
    encounter_date: '2026-03-20',
    subjective: { chief_complaint: 'Low back pain' },
    objective: { observation: 'Antalgic gait' },
    spinal_findings: { L4: 'PL' },
    treatments_selected: ['hvla_lumbar'],
    exercises_selected: ['bridges'],
    pain_locations: ['lumbar'],
    pain_qualities: ['aching'],
    aggravating_factors_selected: ['sitting'],
    relieving_factors_selected: ['rest'],
    observation_findings: [],
    palpation_findings: [],
    rom_findings: [],
    ortho_tests_selected: [],
    neuro_tests_selected: [],
    icpc_codes: ['L03'],
    icd10_codes: ['M54.5'],
    plan: { treatment: 'HVLA lumbar', exercises: 'Bridges 3x10' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render SALT button text', () => {
    render(<SALTButton previousEncounter={previousEncounter} onApply={mockOnApply} />);
    expect(screen.getByText('SALT')).toBeInTheDocument();
  });

  it('should be disabled when no previous encounter', () => {
    render(<SALTButton previousEncounter={null} onApply={mockOnApply} />);
    const btn = screen.getByText('SALT').closest('button');
    expect(btn).toBeDisabled();
  });

  it('should open dropdown when clicked', () => {
    render(<SALTButton previousEncounter={previousEncounter} onApply={mockOnApply} />);
    fireEvent.click(screen.getByText('SALT'));
    expect(screen.getByText('Same As Last Treatment')).toBeInTheDocument();
  });

  it('should show improvement modifiers in dropdown', () => {
    render(<SALTButton previousEncounter={previousEncounter} onApply={mockOnApply} />);
    fireEvent.click(screen.getByText('SALT'));
    expect(screen.getByText('50% better')).toBeInTheDocument();
    expect(screen.getByText('No change')).toBeInTheDocument();
  });

  it('should call onApply when Apply SALT is clicked', () => {
    render(<SALTButton previousEncounter={previousEncounter} onApply={mockOnApply} />);
    fireEvent.click(screen.getByText('SALT'));
    fireEvent.click(screen.getByText('Apply SALT'));
    expect(mockOnApply).toHaveBeenCalled();
  });
});

describe('SALTButtonCompact', () => {
  it('should render without crashing', () => {
    const { container } = render(<SALTButtonCompact previousEncounter={null} onApply={vi.fn()} />);
    expect(container).toBeTruthy();
  });

  it('should be disabled when no previous encounter', () => {
    const { container } = render(<SALTButtonCompact previousEncounter={null} onApply={vi.fn()} />);
    const btn = container.querySelector('button');
    expect(btn).toBeDisabled();
  });
});
