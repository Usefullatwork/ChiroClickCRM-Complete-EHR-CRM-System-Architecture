/**
 * OutcomeAssessment Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OutcomeAssessment from '../../../components/assessment/OutcomeAssessment';

describe('OutcomeAssessment', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the ODI questionnaire by default', () => {
    render(<OutcomeAssessment responses={{}} onChange={mockOnChange} />);
    expect(screen.getByText('Oswestry Disability Index')).toBeInTheDocument();
  });

  it('should render the NDI questionnaire when type is NDI', () => {
    render(<OutcomeAssessment type="NDI" responses={{}} onChange={mockOnChange} />);
    expect(screen.getByText('Neck Disability Index')).toBeInTheDocument();
  });

  it('should render the PSFS questionnaire when type is PSFS', () => {
    render(<OutcomeAssessment type="PSFS" responses={{}} onChange={mockOnChange} />);
    expect(screen.getByText('Patient-Specific Functional Scale')).toBeInTheDocument();
  });

  it('should render with showScore false', () => {
    const { container } = render(
      <OutcomeAssessment responses={{}} onChange={mockOnChange} showScore={false} />
    );
    expect(container).toBeTruthy();
  });
});
