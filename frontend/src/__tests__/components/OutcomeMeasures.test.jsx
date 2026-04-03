import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import OutcomeMeasures from '../../components/OutcomeMeasures';

describe('OutcomeMeasures', () => {
  it('renders the heading', () => {
    render(<OutcomeMeasures />);
    expect(screen.getByText('Patient-Reported Outcome Measures')).toBeInTheDocument();
  });

  it('renders the ODI scale selector', () => {
    render(<OutcomeMeasures />);
    expect(screen.getByText('Oswestry (ODI) - Low Back')).toBeInTheDocument();
  });

  it('renders the NDI scale selector', () => {
    render(<OutcomeMeasures />);
    expect(screen.getByText('Neck Disability Index (NDI)')).toBeInTheDocument();
  });

  it('renders ODI description by default', () => {
    render(<OutcomeMeasures />);
    expect(screen.getByText('Oswestry Disability Index (ODI)')).toBeInTheDocument();
  });

  it('renders ODI questions by default', () => {
    render(<OutcomeMeasures />);
    expect(screen.getByText('1. Pain Intensity')).toBeInTheDocument();
    expect(screen.getByText('2. Personal Care (Washing, Dressing, etc.)')).toBeInTheDocument();
  });

  it('switches to NDI when NDI tab is clicked', () => {
    render(<OutcomeMeasures />);
    fireEvent.click(screen.getByText('Neck Disability Index (NDI)'));
    // NDI has unique questions like "4. Reading" and "5. Headaches"
    expect(screen.getByText('4. Reading')).toBeInTheDocument();
    expect(screen.getByText('5. Headaches')).toBeInTheDocument();
  });

  it('shows disability score when a response is selected', () => {
    render(<OutcomeMeasures />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[2]); // Select a mid-severity option
    expect(screen.getByText('Disability Score')).toBeInTheDocument();
  });

  it('calls onSave when responses change', () => {
    const onSave = vi.fn();
    render(<OutcomeMeasures onSave={onSave} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        scale: 'oswestry',
        score: expect.any(Number),
      })
    );
  });

  it('renders interpretation when score is calculated', () => {
    render(<OutcomeMeasures />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]); // score = 0 -> Minimal Disability
    expect(screen.getByText('Clinical Interpretation')).toBeInTheDocument();
  });
});
