import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import ProtocolList from '../../../components/ClinicalProtocols/ProtocolList';

const mockProtocols = {
  lbp: {
    id: 'lbp',
    name: 'Low Back Pain',
    description: 'Protocol for managing low back pain',
    icd10: 'M54.5',
    icpc2: 'L03',
  },
  neck: {
    id: 'neck',
    name: 'Neck Pain',
    description: 'Protocol for cervical pain management',
    icd10: 'M54.2',
    icpc2: 'L01',
  },
  headache: {
    id: 'headache',
    name: 'Cervicogenic Headache',
    description: 'Protocol for headache originating from cervical spine',
    icd10: 'G44.8',
    icpc2: 'N02',
  },
};

describe('ProtocolList', () => {
  it('renders the instruction text', () => {
    render(<ProtocolList protocols={mockProtocols} onSelect={vi.fn()} />);
    expect(screen.getByText(/Select a condition to view/)).toBeInTheDocument();
  });

  it('renders all protocol cards', () => {
    render(<ProtocolList protocols={mockProtocols} onSelect={vi.fn()} />);
    expect(screen.getByText('Low Back Pain')).toBeInTheDocument();
    expect(screen.getByText('Neck Pain')).toBeInTheDocument();
    expect(screen.getByText('Cervicogenic Headache')).toBeInTheDocument();
  });

  it('renders protocol descriptions', () => {
    render(<ProtocolList protocols={mockProtocols} onSelect={vi.fn()} />);
    expect(screen.getByText('Protocol for managing low back pain')).toBeInTheDocument();
  });

  it('renders ICD-10 and ICPC-2 codes', () => {
    render(<ProtocolList protocols={mockProtocols} onSelect={vi.fn()} />);
    expect(screen.getByText('M54.5 | L03')).toBeInTheDocument();
    expect(screen.getByText('M54.2 | L01')).toBeInTheDocument();
  });

  it('calls onSelect when a card is clicked', () => {
    const onSelect = vi.fn();
    render(<ProtocolList protocols={mockProtocols} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Low Back Pain'));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'lbp', name: 'Low Back Pain' })
    );
  });

  it('supports keyboard activation with Enter', () => {
    const onSelect = vi.fn();
    render(<ProtocolList protocols={mockProtocols} onSelect={onSelect} />);
    const card = screen.getByLabelText('Velg protokoll: Neck Pain');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'neck' }));
  });

  it('supports keyboard activation with Space', () => {
    const onSelect = vi.fn();
    render(<ProtocolList protocols={mockProtocols} onSelect={onSelect} />);
    const card = screen.getByLabelText('Velg protokoll: Low Back Pain');
    fireEvent.keyDown(card, { key: ' ' });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'lbp' }));
  });

  it('protocol cards have role="button"', () => {
    render(<ProtocolList protocols={mockProtocols} onSelect={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });

  it('protocol cards have tabIndex=0 for keyboard accessibility', () => {
    render(<ProtocolList protocols={mockProtocols} onSelect={vi.fn()} />);
    const card = screen.getByLabelText('Velg protokoll: Low Back Pain');
    expect(card).toHaveAttribute('tabindex', '0');
  });
});
