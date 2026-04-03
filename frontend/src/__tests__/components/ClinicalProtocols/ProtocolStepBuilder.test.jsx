import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ProtocolStepBuilder from '../../../components/ClinicalProtocols/ProtocolStepBuilder';

const mockProtocol = {
  name: 'Low Back Pain Protocol',
  treatment: {
    phase1: {
      name: 'Acute Phase',
      frequency: '3x/week',
      duration: '2 weeks',
      goals: ['Pain reduction', 'Restore mobility'],
      interventions: ['Spinal manipulation', 'Mobilization'],
    },
    phase2: {
      name: 'Rehabilitation Phase',
      frequency: '2x/week',
      duration: '4 weeks',
      goals: ['Strengthen core', 'Improve function'],
      interventions: ['Exercise therapy', 'Ergonomic advice'],
    },
  },
  homeExercises: [
    {
      name: 'Cat-Cow Stretch',
      sets: 3,
      reps: '10 reps',
      frequency: 'Daily',
      description: 'Alternating spinal flexion and extension',
    },
    {
      name: 'Bird Dog',
      sets: 3,
      reps: '8 each side',
      frequency: 'Daily',
      description: 'Core stability exercise',
    },
  ],
  expectedOutcomes: {
    '2_weeks': '50% pain reduction',
    '6_weeks': 'Return to normal activities',
    '12_weeks': 'Full recovery',
  },
  referralCriteria: [
    'No improvement after 6 weeks',
    'Progressive neurological deficit',
    'Suspected fracture',
  ],
};

describe('ProtocolStepBuilder', () => {
  it('renders treatment protocol heading', () => {
    render(<ProtocolStepBuilder protocol={mockProtocol} />);
    expect(screen.getByText('Treatment Protocol')).toBeInTheDocument();
  });

  it('renders all treatment phases', () => {
    render(<ProtocolStepBuilder protocol={mockProtocol} />);
    expect(screen.getByText('Acute Phase')).toBeInTheDocument();
    expect(screen.getByText('Rehabilitation Phase')).toBeInTheDocument();
  });

  it('renders phase frequency and duration', () => {
    render(<ProtocolStepBuilder protocol={mockProtocol} />);
    expect(screen.getByText('3x/week')).toBeInTheDocument();
    expect(screen.getByText('2 weeks')).toBeInTheDocument();
  });

  it('renders phase goals', () => {
    render(<ProtocolStepBuilder protocol={mockProtocol} />);
    expect(screen.getByText('Pain reduction')).toBeInTheDocument();
    expect(screen.getByText('Restore mobility')).toBeInTheDocument();
  });

  it('renders phase interventions', () => {
    render(<ProtocolStepBuilder protocol={mockProtocol} />);
    expect(screen.getByText('Spinal manipulation')).toBeInTheDocument();
    expect(screen.getByText('Mobilization')).toBeInTheDocument();
  });

  it('renders home exercises section', () => {
    render(<ProtocolStepBuilder protocol={mockProtocol} />);
    expect(screen.getByText('Home Exercise Program')).toBeInTheDocument();
    expect(screen.getByText('Cat-Cow Stretch')).toBeInTheDocument();
    expect(screen.getByText('Bird Dog')).toBeInTheDocument();
  });

  it('renders exercise prescriptions', () => {
    render(<ProtocolStepBuilder protocol={mockProtocol} />);
    expect(screen.getByText('3 sets x 10 reps')).toBeInTheDocument();
    const dailyElements = screen.getAllByText('Daily');
    expect(dailyElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders expected outcomes', () => {
    render(<ProtocolStepBuilder protocol={mockProtocol} />);
    expect(screen.getByText('Expected Outcomes')).toBeInTheDocument();
    expect(screen.getByText('50% pain reduction')).toBeInTheDocument();
    expect(screen.getByText('Full recovery')).toBeInTheDocument();
  });

  it('renders referral criteria', () => {
    render(<ProtocolStepBuilder protocol={mockProtocol} />);
    expect(screen.getByText('Referral Criteria')).toBeInTheDocument();
    expect(screen.getByText('No improvement after 6 weeks')).toBeInTheDocument();
    expect(screen.getByText('Progressive neurological deficit')).toBeInTheDocument();
  });

  it('omits home exercises when not provided', () => {
    const protocol = { ...mockProtocol, homeExercises: null };
    render(<ProtocolStepBuilder protocol={protocol} />);
    expect(screen.queryByText('Home Exercise Program')).not.toBeInTheDocument();
  });

  it('omits expected outcomes when not provided', () => {
    const protocol = { ...mockProtocol, expectedOutcomes: null };
    render(<ProtocolStepBuilder protocol={protocol} />);
    expect(screen.queryByText('Expected Outcomes')).not.toBeInTheDocument();
  });

  it('omits referral criteria when not provided', () => {
    const protocol = { ...mockProtocol, referralCriteria: null };
    render(<ProtocolStepBuilder protocol={protocol} />);
    expect(screen.queryByText('Referral Criteria')).not.toBeInTheDocument();
  });
});
