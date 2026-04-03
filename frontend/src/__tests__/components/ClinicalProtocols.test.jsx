import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../components/ClinicalProtocols/protocolData', () => ({
  protocols: {
    lbp: {
      id: 'lbp',
      name: 'Low Back Pain',
      description: 'Evidence-based protocol for low back pain',
      icd10: 'M54.5',
      icpc2: 'L03',
      assessment: { history: ['Onset'], examination: ['ROM'] },
      treatment: {
        phase1: {
          name: 'Acute Phase',
          frequency: '3x/week',
          duration: '2 weeks',
          goals: ['Pain relief'],
          interventions: ['SMT'],
        },
      },
    },
    neck: {
      id: 'neck',
      name: 'Neck Pain',
      description: 'Protocol for cervical pain',
      icd10: 'M54.2',
      icpc2: 'L01',
      assessment: { history: ['Onset'], examination: ['ROM'] },
      treatment: {
        phase1: {
          name: 'Acute Phase',
          frequency: '2x/week',
          duration: '3 weeks',
          goals: ['Reduce pain'],
          interventions: ['Mobilization'],
        },
      },
    },
  },
}));

vi.mock('../../components/ClinicalProtocols/styles', () => ({
  clinicalProtocolStyles: '',
}));

vi.mock('../../components/ClinicalProtocols/ProtocolList', () => ({
  default: ({ protocols, onSelect }) => (
    <div data-testid="protocol-list">
      {Object.values(protocols).map((p) => (
        <button key={p.id} onClick={() => onSelect(p)}>
          {p.name}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../components/ClinicalProtocols/ProtocolEditor', () => ({
  default: ({ protocol, onBack }) => (
    <div data-testid="protocol-editor">
      <span>Editing: {protocol.name}</span>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

import ClinicalProtocols from '../../components/ClinicalProtocols';

describe('ClinicalProtocols', () => {
  it('renders the protocol list by default', () => {
    render(<ClinicalProtocols />);
    expect(screen.getByText('Evidence-Based Clinical Protocols')).toBeInTheDocument();
    expect(screen.getByTestId('protocol-list')).toBeInTheDocument();
  });

  it('displays protocol cards in the list', () => {
    render(<ClinicalProtocols />);
    expect(screen.getByText('Low Back Pain')).toBeInTheDocument();
    expect(screen.getByText('Neck Pain')).toBeInTheDocument();
  });

  it('shows editor when a protocol is selected', () => {
    render(<ClinicalProtocols />);
    fireEvent.click(screen.getByText('Low Back Pain'));
    expect(screen.getByTestId('protocol-editor')).toBeInTheDocument();
    expect(screen.getByText('Editing: Low Back Pain')).toBeInTheDocument();
  });

  it('navigates back to list from editor', () => {
    render(<ClinicalProtocols />);
    fireEvent.click(screen.getByText('Low Back Pain'));
    expect(screen.getByTestId('protocol-editor')).toBeInTheDocument();

    // Click the back button rendered by the parent
    const backButtons = screen.getAllByText(/Back/);
    fireEvent.click(backButtons[0]);
    expect(screen.getByTestId('protocol-list')).toBeInTheDocument();
  });

  it('calls onSelectProtocol callback when protocol is selected', () => {
    const onSelect = vi.fn();
    render(<ClinicalProtocols onSelectProtocol={onSelect} />);
    fireEvent.click(screen.getByText('Low Back Pain'));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'lbp', name: 'Low Back Pain' })
    );
  });
});
