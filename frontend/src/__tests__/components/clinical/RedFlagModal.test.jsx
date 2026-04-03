/**
 * RedFlagModal Tests
 *
 * CRITICAL safety modal. Tests:
 * - Checkbox required before dismiss
 * - Renders warning content
 * - onAcknowledge callback fires only when checkbox checked
 * - Does not render when closed or no flags
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  AlertTriangle: (props) => null,
  ExternalLink: (props) => null,
  ShieldX: (props) => null,
}));

import RedFlagModal from '../../../components/clinical/RedFlagModal';

const mockFlags = [
  {
    id: 'flag-1',
    severity: 'CRITICAL',
    categoryLabel: 'Nevrologi',
    description: 'Cauda equina syndrom mistenkt',
    action: 'Umiddelbar henvisning til sykehus',
  },
  {
    id: 'flag-2',
    severity: 'HIGH',
    categoryLabel: 'Vaskulær',
    description: 'Pulserende nakkesmerter med synsforstyrrelser',
    action: 'Vurder vertebral arteriedisseksjon',
  },
];

describe('RedFlagModal', () => {
  let onClose;
  let onAcknowledge;
  let onReferral;

  beforeEach(() => {
    vi.clearAllMocks();
    onClose = vi.fn();
    onAcknowledge = vi.fn();
    onReferral = vi.fn();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <RedFlagModal
        isOpen={false}
        onClose={onClose}
        criticalFlags={mockFlags}
        onAcknowledge={onAcknowledge}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when criticalFlags is empty', () => {
    const { container } = render(
      <RedFlagModal
        isOpen={true}
        onClose={onClose}
        criticalFlags={[]}
        onAcknowledge={onAcknowledge}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the modal with title and flag descriptions', () => {
    render(
      <RedFlagModal
        isOpen={true}
        onClose={onClose}
        criticalFlags={mockFlags}
        onAcknowledge={onAcknowledge}
        lang="no"
      />
    );

    expect(screen.getByText('Kritiske Rode Flagg Oppdaget')).toBeInTheDocument();
    expect(screen.getByText('Umiddelbar handling er pakrevd')).toBeInTheDocument();
    expect(screen.getByText('Cauda equina syndrom mistenkt')).toBeInTheDocument();
    expect(screen.getByText('Pulserende nakkesmerter med synsforstyrrelser')).toBeInTheDocument();
  });

  it('renders English labels when lang is en', () => {
    render(
      <RedFlagModal
        isOpen={true}
        onClose={onClose}
        criticalFlags={mockFlags}
        onAcknowledge={onAcknowledge}
        lang="en"
      />
    );

    expect(screen.getByText('Critical Red Flags Detected')).toBeInTheDocument();
    expect(screen.getByText('Immediate action required')).toBeInTheDocument();
  });

  it('renders the flag count badge', () => {
    render(
      <RedFlagModal
        isOpen={true}
        onClose={onClose}
        criticalFlags={mockFlags}
        onAcknowledge={onAcknowledge}
        lang="no"
      />
    );

    expect(screen.getByText('2 kritiske rode flagg')).toBeInTheDocument();
  });

  it('renders severity badges for each flag', () => {
    render(
      <RedFlagModal
        isOpen={true}
        onClose={onClose}
        criticalFlags={mockFlags}
        onAcknowledge={onAcknowledge}
        lang="no"
      />
    );

    expect(screen.getByText('Kritisk')).toBeInTheDocument();
    expect(screen.getByText('Hoy')).toBeInTheDocument();
  });

  it('renders the acknowledgement checkbox unchecked by default', () => {
    render(
      <RedFlagModal
        isOpen={true}
        onClose={onClose}
        criticalFlags={mockFlags}
        onAcknowledge={onAcknowledge}
        lang="no"
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('has the acknowledge button disabled when checkbox is unchecked', () => {
    render(
      <RedFlagModal
        isOpen={true}
        onClose={onClose}
        criticalFlags={mockFlags}
        onAcknowledge={onAcknowledge}
        lang="no"
      />
    );

    const acknowledgeBtn = screen.getByText('Bekreft og fortsett');
    expect(acknowledgeBtn).toBeDisabled();
  });

  it('does NOT call onAcknowledge when clicking button with checkbox unchecked', () => {
    render(
      <RedFlagModal
        isOpen={true}
        onClose={onClose}
        criticalFlags={mockFlags}
        onAcknowledge={onAcknowledge}
        lang="no"
      />
    );

    const acknowledgeBtn = screen.getByText('Bekreft og fortsett');
    fireEvent.click(acknowledgeBtn);

    expect(onAcknowledge).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('enables acknowledge button after checking checkbox', () => {
    render(
      <RedFlagModal
        isOpen={true}
        onClose={onClose}
        criticalFlags={mockFlags}
        onAcknowledge={onAcknowledge}
        lang="no"
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const acknowledgeBtn = screen.getByText('Bekreft og fortsett');
    expect(acknowledgeBtn).not.toBeDisabled();
  });

  it('calls onAcknowledge and onClose when checkbox is checked and button clicked', () => {
    render(
      <RedFlagModal
        isOpen={true}
        onClose={onClose}
        criticalFlags={mockFlags}
        onAcknowledge={onAcknowledge}
        lang="no"
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const acknowledgeBtn = screen.getByText('Bekreft og fortsett');
    fireEvent.click(acknowledgeBtn);

    expect(onAcknowledge).toHaveBeenCalledWith(mockFlags);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders the referral button when onReferral is provided', () => {
    render(
      <RedFlagModal
        isOpen={true}
        onClose={onClose}
        criticalFlags={mockFlags}
        onAcknowledge={onAcknowledge}
        onReferral={onReferral}
        lang="no"
      />
    );

    expect(screen.getByText('Opprett henvisning')).toBeInTheDocument();
  });

  it('calls onReferral when referral button is clicked', () => {
    render(
      <RedFlagModal
        isOpen={true}
        onClose={onClose}
        criticalFlags={mockFlags}
        onAcknowledge={onAcknowledge}
        onReferral={onReferral}
        lang="no"
      />
    );

    fireEvent.click(screen.getByText('Opprett henvisning'));
    expect(onReferral).toHaveBeenCalledWith(mockFlags);
  });

  it('does not render referral button when onReferral is not provided', () => {
    render(
      <RedFlagModal
        isOpen={true}
        onClose={onClose}
        criticalFlags={mockFlags}
        onAcknowledge={onAcknowledge}
        lang="no"
      />
    );

    expect(screen.queryByText('Opprett henvisning')).not.toBeInTheDocument();
  });

  it('has proper aria attributes for accessibility', () => {
    render(
      <RedFlagModal
        isOpen={true}
        onClose={onClose}
        criticalFlags={mockFlags}
        onAcknowledge={onAcknowledge}
        lang="no"
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Kritiske Rode Flagg Oppdaget');
  });

  it('renders recommended action for each flag', () => {
    render(
      <RedFlagModal
        isOpen={true}
        onClose={onClose}
        criticalFlags={mockFlags}
        onAcknowledge={onAcknowledge}
        lang="no"
      />
    );

    expect(screen.getByText('Umiddelbar henvisning til sykehus')).toBeInTheDocument();
    expect(screen.getByText('Vurder vertebral arteriedisseksjon')).toBeInTheDocument();
  });
});
