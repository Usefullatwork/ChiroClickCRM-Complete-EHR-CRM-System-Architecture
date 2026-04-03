/**
 * BPPVTestPanel Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BPPVTestPanel from '../../../components/examination/BPPVTestPanel';

describe('BPPVTestPanel', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the BPPV Testing title', () => {
    render(<BPPVTestPanel values={{}} onChange={mockOnChange} />);
    expect(screen.getByText('BPPV Testing')).toBeInTheDocument();
  });

  it('should render the Norwegian subtitle', () => {
    render(<BPPVTestPanel values={{}} onChange={mockOnChange} lang="no" />);
    expect(screen.getByText('Benign paroksysmal posisjonsvertigo')).toBeInTheDocument();
  });

  it('should render category sections for posterior and lateral canals', () => {
    render(<BPPVTestPanel values={{}} onChange={mockOnChange} lang="no" />);
    expect(screen.getByText('Posterior kanal tester')).toBeInTheDocument();
    expect(screen.getByText('Lateral kanal tester')).toBeInTheDocument();
  });

  it('should show treatment protocol buttons', () => {
    render(<BPPVTestPanel values={{}} onChange={mockOnChange} />);
    expect(screen.getByText('Epley Manøver')).toBeInTheDocument();
    expect(screen.getByText('Semont Manøver')).toBeInTheDocument();
  });

  it('should call onGenerateNarrative when button is clicked', () => {
    const mockGenerate = vi.fn();
    render(
      <BPPVTestPanel
        values={{}}
        onChange={mockOnChange}
        lang="en"
        onGenerateNarrative={mockGenerate}
      />
    );
    fireEvent.click(screen.getByText('Generate Text'));
    expect(mockGenerate).toHaveBeenCalled();
  });
});
