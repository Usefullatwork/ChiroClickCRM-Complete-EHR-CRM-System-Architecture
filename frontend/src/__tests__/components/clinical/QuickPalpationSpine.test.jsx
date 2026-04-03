/**
 * QuickPalpationSpine Tests
 *
 * Tests:
 * - Renders spine segments
 * - Region headers
 * - Direction picker on segment click
 * - Returns null when disabled
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  ChevronDown: (props) => null,
  ChevronUp: (props) => null,
  X: (props) => null,
}));

import QuickPalpationSpine from '../../../components/clinical/QuickPalpationSpine';

describe('QuickPalpationSpine', () => {
  const defaultProps = {
    onInsertText: vi.fn(),
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when disabled', () => {
    const { container } = render(<QuickPalpationSpine {...defaultProps} disabled={true} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the PALPASJON header', () => {
    render(<QuickPalpationSpine {...defaultProps} />);
    expect(screen.getByText('PALPASJON')).toBeInTheDocument();
  });

  it('renders the instruction subheader', () => {
    render(<QuickPalpationSpine {...defaultProps} />);
    expect(screen.getByText('Klikk segment → velg retning')).toBeInTheDocument();
  });

  it('renders spine region labels', () => {
    render(<QuickPalpationSpine {...defaultProps} />);
    expect(screen.getByText('CERVICAL')).toBeInTheDocument();
    expect(screen.getByText('THORACIC')).toBeInTheDocument();
    expect(screen.getByText('LUMBAR')).toBeInTheDocument();
    expect(screen.getByText('SACRAL')).toBeInTheDocument();
    expect(screen.getByText('MUSKEL')).toBeInTheDocument();
  });

  it('renders cervical segment buttons when expanded', () => {
    render(<QuickPalpationSpine {...defaultProps} />);
    // Cervical is expanded by default
    expect(screen.getByText('C1')).toBeInTheDocument();
    expect(screen.getByText('C7')).toBeInTheDocument();
  });

  it('renders thoracic segment buttons when expanded', () => {
    render(<QuickPalpationSpine {...defaultProps} />);
    // Thoracic is expanded by default
    expect(screen.getByText('T1')).toBeInTheDocument();
    expect(screen.getByText('T12')).toBeInTheDocument();
  });

  it('renders lumbar segment buttons when expanded', () => {
    render(<QuickPalpationSpine {...defaultProps} />);
    // Lumbar is expanded by default
    expect(screen.getByText('L1')).toBeInTheDocument();
    expect(screen.getByText('L5')).toBeInTheDocument();
  });

  it('shows direction picker when a segment is clicked', () => {
    render(<QuickPalpationSpine {...defaultProps} />);
    fireEvent.click(screen.getByText('C1'));
    // Direction buttons should appear
    expect(screen.getByText('V')).toBeInTheDocument(); // Venstre
    expect(screen.getByText('H')).toBeInTheDocument(); // Hoyre
    expect(screen.getByText('B')).toBeInTheDocument(); // Bilateral
  });

  it('calls onInsertText when direction is clicked', () => {
    render(<QuickPalpationSpine {...defaultProps} />);
    // Click a segment
    fireEvent.click(screen.getByText('L5'));
    // Click a direction
    fireEvent.click(screen.getByTitle('Venstre'));

    expect(defaultProps.onInsertText).toHaveBeenCalledWith('L5 restriksjon venstre. ');
  });

  it('closes direction picker after direction is selected', () => {
    render(<QuickPalpationSpine {...defaultProps} />);
    fireEvent.click(screen.getByText('C1'));
    fireEvent.click(screen.getByTitle('Bilateral'));

    // Direction buttons should be gone
    expect(screen.queryByTitle('Venstre')).not.toBeInTheDocument();
  });

  it('closes direction picker when X button is clicked', () => {
    render(<QuickPalpationSpine {...defaultProps} />);
    fireEvent.click(screen.getByText('C1'));

    // Click close button
    fireEvent.click(screen.getByTitle('Lukk'));
    expect(screen.queryByTitle('Venstre')).not.toBeInTheDocument();
  });

  it('renders the footer hint text', () => {
    render(<QuickPalpationSpine {...defaultProps} />);
    expect(screen.getByText('1. Klikk segment → 2. Klikk V/H/B')).toBeInTheDocument();
  });

  it('toggles region expansion when region header is clicked', () => {
    render(<QuickPalpationSpine {...defaultProps} />);

    // Click SACRAL to expand it
    fireEvent.click(screen.getByText('SACRAL'));
    expect(screen.getByText('Sac')).toBeInTheDocument(); // Sacrum abbreviated

    // Click CERVICAL to collapse it
    fireEvent.click(screen.getByText('CERVICAL'));
    expect(screen.queryByText('C1')).not.toBeInTheDocument();
  });
});
