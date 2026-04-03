/**
 * SALTBanner Tests
 *
 * Tests:
 * - Renders banner with previous encounter info
 * - Action buttons (Apply All, Expand, Dismiss)
 * - Expanded section details
 * - Returns null when no previous encounter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  ClipboardCopy: (props) => null,
  X: (props) => null,
  ChevronDown: (props) => null,
  ChevronUp: (props) => null,
}));

import SALTBanner from '../../../components/clinical/SALTBanner';

describe('SALTBanner', () => {
  const mockEncounter = {
    encounter_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    subjective: { chief_complaint: 'Ryggsmerter', history: 'Kronisk' },
    objective: { observation: 'Redusert ROM', palpation: 'Spasme' },
    assessment: {},
    plan: { treatment: 'Manipulasjon' },
  };

  const defaultProps = {
    previousEncounter: mockEncounter,
    onApplyAll: vi.fn(),
    onApplySection: vi.fn(),
    onDismiss: vi.fn(),
    isExpanded: false,
    onToggleExpand: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when previousEncounter is not provided', () => {
    const { container } = render(<SALTBanner {...defaultProps} previousEncounter={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the banner with encounter info', () => {
    render(<SALTBanner {...defaultProps} />);
    expect(screen.getByText('Lignende konsultasjon funnet')).toBeInTheDocument();
  });

  it('renders the days since text', () => {
    render(<SALTBanner {...defaultProps} />);
    expect(screen.getByText(/3 dager siden/)).toBeInTheDocument();
  });

  it('renders singular day text for 1 day ago', () => {
    const oneDayAgo = {
      ...mockEncounter,
      encounter_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    };
    render(<SALTBanner {...defaultProps} previousEncounter={oneDayAgo} />);
    expect(screen.getByText(/1 dag siden/)).toBeInTheDocument();
  });

  it('renders the Bruk alt button', () => {
    render(<SALTBanner {...defaultProps} />);
    expect(screen.getByText('Bruk alt')).toBeInTheDocument();
  });

  it('calls onApplyAll when Bruk alt is clicked', () => {
    render(<SALTBanner {...defaultProps} />);
    fireEvent.click(screen.getByText('Bruk alt'));
    expect(defaultProps.onApplyAll).toHaveBeenCalled();
  });

  it('calls onDismiss when close button is clicked', () => {
    render(<SALTBanner {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Lukk'));
    expect(defaultProps.onDismiss).toHaveBeenCalled();
  });

  it('calls onToggleExpand when expand button is clicked', () => {
    render(<SALTBanner {...defaultProps} />);
    const expandBtn = screen.getByTitle('Vis detaljer');
    fireEvent.click(expandBtn);
    expect(defaultProps.onToggleExpand).toHaveBeenCalled();
  });

  it('does not show section buttons when collapsed', () => {
    render(<SALTBanner {...defaultProps} isExpanded={false} />);
    expect(screen.queryByText('Subjektivt')).not.toBeInTheDocument();
  });

  it('shows section buttons when expanded', () => {
    render(<SALTBanner {...defaultProps} isExpanded={true} />);
    expect(screen.getByText('Subjektivt')).toBeInTheDocument();
    expect(screen.getByText('Objektivt')).toBeInTheDocument();
    expect(screen.getByText('Plan')).toBeInTheDocument();
  });

  it('does not show assessment button when assessment has no content', () => {
    render(<SALTBanner {...defaultProps} isExpanded={true} />);
    expect(screen.queryByText('Vurdering')).not.toBeInTheDocument();
  });

  it('calls onApplySection when section button is clicked', () => {
    render(<SALTBanner {...defaultProps} isExpanded={true} />);
    fireEvent.click(screen.getByText('Subjektivt'));
    expect(defaultProps.onApplySection).toHaveBeenCalledWith('subjective');
  });

  it('shows chief complaint preview when expanded', () => {
    render(<SALTBanner {...defaultProps} isExpanded={true} />);
    expect(screen.getByText('Hovedklage fra forrige:')).toBeInTheDocument();
    expect(screen.getByText('Ryggsmerter')).toBeInTheDocument();
  });
});
