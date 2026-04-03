/**
 * TaksterPanel Component Tests
 * Tests billing code display, toggle, selection, pricing accuracy, and signed state.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  FileText: () => null,
  ChevronUp: () => null,
  ChevronDown: () => null,
  Check: () => null,
}));

import { TaksterPanel, taksterNorwegian } from '../../../components/encounter/TaksterPanel';

function buildProps(overrides = {}) {
  return {
    selectedTakster: [],
    onToggleTakst: vi.fn(),
    showTakster: true,
    onToggleShow: vi.fn(),
    totalPrice: 0,
    isSigned: false,
    ...overrides,
  };
}

describe('TaksterPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the panel header', () => {
    render(<TaksterPanel {...buildProps()} />);
    expect(screen.getByText('Takster (behandlingskoder)')).toBeTruthy();
  });

  it('calls onToggleShow when header is clicked', () => {
    const onToggleShow = vi.fn();
    render(<TaksterPanel {...buildProps({ onToggleShow })} />);
    fireEvent.click(screen.getByText('Takster (behandlingskoder)').closest('button'));
    expect(onToggleShow).toHaveBeenCalledTimes(1);
  });

  it('hides billing codes when showTakster is false', () => {
    render(<TaksterPanel {...buildProps({ showTakster: false })} />);
    expect(screen.queryByText('L214')).toBeNull();
  });

  it('renders all billing codes when expanded', () => {
    render(<TaksterPanel {...buildProps()} />);
    expect(screen.getByText('L214')).toBeTruthy();
    expect(screen.getByText('L215')).toBeTruthy();
    expect(screen.getByText('L220')).toBeTruthy();
    expect(screen.getByText('AKUTT')).toBeTruthy();
  });

  it('renders correct billing code names', () => {
    render(<TaksterPanel {...buildProps()} />);
    expect(screen.getByText('Manipulasjonsbehandling')).toBeTruthy();
    expect(screen.getByText(/tvevsbehandling/)).toBeTruthy();
    expect(screen.getByText(/velser\/veiledning/)).toBeTruthy();
    expect(screen.getByText(/Akutt-tillegg/)).toBeTruthy();
  });

  it('renders correct individual prices', () => {
    render(<TaksterPanel {...buildProps()} />);
    expect(screen.getByText('450 kr')).toBeTruthy();
    expect(screen.getByText('350 kr')).toBeTruthy();
    expect(screen.getByText('150 kr')).toBeTruthy();
    expect(screen.getByText('200 kr')).toBeTruthy();
  });

  it('renders the total price', () => {
    render(<TaksterPanel {...buildProps({ totalPrice: 800 })} />);
    expect(screen.getByText('800 kr')).toBeTruthy();
  });

  it('calls onToggleTakst when a billing code is clicked', () => {
    const onToggleTakst = vi.fn();
    render(<TaksterPanel {...buildProps({ onToggleTakst })} />);
    fireEvent.click(screen.getByText('L214').closest('button'));
    expect(onToggleTakst).toHaveBeenCalledWith('l214');
  });

  it('disables billing code buttons when signed', () => {
    render(<TaksterPanel {...buildProps({ isSigned: true })} />);
    const codeBtn = screen.getByText('L214').closest('button');
    expect(codeBtn.disabled).toBe(true);
  });

  it('exports taksterNorwegian with correct data', () => {
    expect(taksterNorwegian).toHaveLength(4);
    expect(taksterNorwegian[0]).toEqual({
      id: 'l214',
      code: 'L214',
      name: 'Manipulasjonsbehandling',
      price: 450,
    });
  });

  it('verifies total pricing accuracy for all codes selected', () => {
    const expectedTotal = taksterNorwegian.reduce((sum, t) => sum + t.price, 0);
    expect(expectedTotal).toBe(1150);
  });

  it('renders Totalt label in the footer', () => {
    render(<TaksterPanel {...buildProps()} />);
    expect(screen.getByText('Totalt:')).toBeTruthy();
  });
});
