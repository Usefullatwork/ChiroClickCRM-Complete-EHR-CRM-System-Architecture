import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ClinicalProgressTracking from '../../components/ClinicalProgressTracking';

describe('ClinicalProgressTracking', () => {
  it('renders with empty encounters data', () => {
    render(<ClinicalProgressTracking encountersData={[]} />);
    expect(screen.getByText('Patient Progress Tracking')).toBeInTheDocument();
    expect(screen.getByText('No Progress Data Available')).toBeInTheDocument();
  });

  it('renders the no-data message when encountersData is default empty', () => {
    render(<ClinicalProgressTracking />);
    expect(screen.getByText('No Progress Data Available')).toBeInTheDocument();
  });

  it('renders progress cards when encounters data is provided', () => {
    const encounters = [
      {
        id: 1,
        encounter_date: '2025-01-01',
        vas_pain_start: 8,
        vas_pain_end: 6,
        encounter_type: 'Initial',
        chief_complaint: 'Back pain',
      },
      {
        id: 2,
        encounter_date: '2025-01-15',
        vas_pain_start: 6,
        vas_pain_end: 4,
        encounter_type: 'Follow-up',
        chief_complaint: 'Improving',
      },
    ];

    render(<ClinicalProgressTracking encountersData={encounters} />);
    expect(screen.getByText('Current Pain Level')).toBeInTheDocument();
    expect(screen.getByText('Total Visits')).toBeInTheDocument();
    expect(screen.getByText('Pain Reduction')).toBeInTheDocument();
    expect(screen.getByText('Improvement')).toBeInTheDocument();
  });

  it('renders improvement indicator when pain decreased', () => {
    const encounters = [
      { id: 1, encounter_date: '2025-01-01', vas_pain_start: 8, vas_pain_end: 6 },
      { id: 2, encounter_date: '2025-01-15', vas_pain_start: 5, vas_pain_end: 3 },
    ];

    render(<ClinicalProgressTracking encountersData={encounters} />);
    expect(screen.getByText('Overall Improvement')).toBeInTheDocument();
  });

  it('renders the pain chart title with encounter data', () => {
    const encounters = [
      { id: 1, encounter_date: '2025-01-01', vas_pain_start: 7, vas_pain_end: 5 },
      { id: 2, encounter_date: '2025-02-01', vas_pain_start: 5, vas_pain_end: 3 },
    ];

    render(<ClinicalProgressTracking encountersData={encounters} />);
    expect(screen.getByText('Pain Levels Over Time (VAS)')).toBeInTheDocument();
  });

  it('renders treatment timeline when encounters have types', () => {
    const encounters = [
      {
        id: 1,
        encounter_date: '2025-01-01',
        vas_pain_start: 8,
        vas_pain_end: 5,
        encounter_type: 'Initial Consultation',
      },
      {
        id: 2,
        encounter_date: '2025-02-01',
        vas_pain_start: 5,
        vas_pain_end: 3,
        encounter_type: 'Follow-up',
        treatments: [{ type: 'Adjustment' }],
      },
    ];

    render(<ClinicalProgressTracking encountersData={encounters} />);
    expect(screen.getByText('Treatment Timeline')).toBeInTheDocument();
    expect(screen.getByText('Initial Consultation')).toBeInTheDocument();
  });
});
