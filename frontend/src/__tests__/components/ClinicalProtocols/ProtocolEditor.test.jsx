import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../../components/ClinicalProtocols/ProtocolStepBuilder', () => ({
  default: ({ protocol }) => <div data-testid="step-builder">StepBuilder: {protocol.name}</div>,
}));

import ProtocolEditor from '../../../components/ClinicalProtocols/ProtocolEditor';

const mockProtocol = {
  id: 'lbp',
  name: 'Low Back Pain Protocol',
  icd10: 'M54.5',
  icpc2: 'L03',
  description: 'Evidence-based protocol for managing low back pain',
  redFlags: [
    'Cauda equina syndrome',
    'Progressive neurological deficit',
    'Fracture with instability',
  ],
  assessment: {
    history: ['Pain onset and duration', 'Previous episodes'],
    examination: ['Range of motion', 'Neurological screen'],
    imaging: ['X-ray if indicated', 'MRI for red flags'],
  },
  treatment: {
    phase1: {
      name: 'Acute Phase',
      frequency: '3x/week',
      duration: '2 weeks',
      goals: ['Pain reduction'],
      interventions: ['Manual therapy'],
    },
  },
};

describe('ProtocolEditor', () => {
  it('renders the protocol name', () => {
    render(<ProtocolEditor protocol={mockProtocol} onBack={vi.fn()} />);
    expect(screen.getByText('Low Back Pain Protocol')).toBeInTheDocument();
  });

  it('displays ICD-10 code', () => {
    render(<ProtocolEditor protocol={mockProtocol} onBack={vi.fn()} />);
    expect(screen.getByText('ICD-10: M54.5')).toBeInTheDocument();
  });

  it('displays ICPC-2 code', () => {
    render(<ProtocolEditor protocol={mockProtocol} onBack={vi.fn()} />);
    expect(screen.getByText('ICPC-2: L03')).toBeInTheDocument();
  });

  it('renders protocol description', () => {
    render(<ProtocolEditor protocol={mockProtocol} onBack={vi.fn()} />);
    expect(
      screen.getByText('Evidence-based protocol for managing low back pain')
    ).toBeInTheDocument();
  });

  it('renders red flags section', () => {
    render(<ProtocolEditor protocol={mockProtocol} onBack={vi.fn()} />);
    expect(screen.getByText('Red Flags - Immediate Referral/Investigation')).toBeInTheDocument();
    expect(screen.getByText('Cauda equina syndrome')).toBeInTheDocument();
    expect(screen.getByText('Progressive neurological deficit')).toBeInTheDocument();
  });

  it('renders clinical assessment section', () => {
    render(<ProtocolEditor protocol={mockProtocol} onBack={vi.fn()} />);
    expect(screen.getByText('Clinical Assessment')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Physical Examination')).toBeInTheDocument();
    expect(screen.getByText('Imaging')).toBeInTheDocument();
  });

  it('renders assessment history items', () => {
    render(<ProtocolEditor protocol={mockProtocol} onBack={vi.fn()} />);
    expect(screen.getByText('Pain onset and duration')).toBeInTheDocument();
    expect(screen.getByText('Previous episodes')).toBeInTheDocument();
  });

  it('renders the ProtocolStepBuilder subcomponent', () => {
    render(<ProtocolEditor protocol={mockProtocol} onBack={vi.fn()} />);
    expect(screen.getByTestId('step-builder')).toBeInTheDocument();
  });

  it('renders without red flags when not provided', () => {
    const protocolNoFlags = { ...mockProtocol, redFlags: null };
    render(<ProtocolEditor protocol={protocolNoFlags} onBack={vi.fn()} />);
    expect(
      screen.queryByText('Red Flags - Immediate Referral/Investigation')
    ).not.toBeInTheDocument();
  });
});
