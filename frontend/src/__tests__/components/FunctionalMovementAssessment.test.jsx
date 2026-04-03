import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

import FunctionalMovementAssessment from '../../components/FunctionalMovementAssessment';

describe('FunctionalMovementAssessment', () => {
  it('renders the main heading', () => {
    render(<FunctionalMovementAssessment />);
    expect(screen.getByText('Functional Movement Assessment')).toBeInTheDocument();
  });

  it('renders all 7 FMS tests', () => {
    render(<FunctionalMovementAssessment />);
    expect(screen.getByText('Deep Squat')).toBeInTheDocument();
    expect(screen.getByText('Hurdle Step')).toBeInTheDocument();
    expect(screen.getByText('In-Line Lunge')).toBeInTheDocument();
    expect(screen.getByText('Shoulder Mobility')).toBeInTheDocument();
    expect(screen.getByText('Active Straight Leg Raise')).toBeInTheDocument();
    expect(screen.getByText('Trunk Stability Push-Up')).toBeInTheDocument();
    expect(screen.getByText('Rotary Stability')).toBeInTheDocument();
  });

  it('renders section title for FMS', () => {
    render(<FunctionalMovementAssessment />);
    expect(screen.getByText('Functional Movement Screen (FMS)')).toBeInTheDocument();
  });

  it('renders additional assessment sections', () => {
    render(<FunctionalMovementAssessment />);
    expect(screen.getByText('Postural Assessment')).toBeInTheDocument();
    expect(screen.getByText('Gait Analysis')).toBeInTheDocument();
    expect(screen.getByText('Balance Assessment')).toBeInTheDocument();
  });

  it('shows score header when a score is selected', () => {
    render(<FunctionalMovementAssessment />);
    // Select a score for deep_squat (score 3)
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]); // First radio = score 3 for deep_squat
    expect(screen.getByText(/\/21/)).toBeInTheDocument();
  });

  it('shows bilateral badge on bilateral tests', () => {
    render(<FunctionalMovementAssessment />);
    const bilateralBadges = screen.getAllByText('BILATERAL - Score Lowest Side');
    expect(bilateralBadges.length).toBeGreaterThan(0);
  });

  it('renders clearing test warning for applicable tests', () => {
    render(<FunctionalMovementAssessment />);
    expect(screen.getByText(/Shoulder Clearing Test/)).toBeInTheDocument();
  });

  it('calls onSave when a score changes', () => {
    const onSave = vi.fn();
    render(<FunctionalMovementAssessment onSave={onSave} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ fmsScore: expect.any(Number) }));
  });
});
