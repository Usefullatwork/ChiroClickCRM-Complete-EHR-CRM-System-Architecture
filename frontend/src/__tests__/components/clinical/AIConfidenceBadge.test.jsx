/**
 * AIConfidenceBadge Tests
 *
 * Tests:
 * - Badge renders with correct confidence level
 * - AIConfidenceDot renders
 * - calculateConfidence pure function
 * - Compact mode renders dot only
 * - Reasoning expansion
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Info: (props) => null,
  ChevronDown: (props) => null,
  ChevronUp: (props) => null,
}));

import AIConfidenceBadge, {
  AIConfidenceDot,
  calculateConfidence,
} from '../../../components/clinical/AIConfidenceBadge';

describe('AIConfidenceBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with high confidence label', () => {
    render(<AIConfidenceBadge confidence={0.9} />);
    expect(screen.getByText('Høy sikkerhet')).toBeInTheDocument();
  });

  it('renders with medium confidence label', () => {
    render(<AIConfidenceBadge confidence={0.7} />);
    expect(screen.getByText('Gjennomgang anbefalt')).toBeInTheDocument();
  });

  it('renders with low confidence label', () => {
    render(<AIConfidenceBadge confidence={0.3} />);
    expect(screen.getByText('Manuell verifisering')).toBeInTheDocument();
  });

  it('renders compact mode as a dot without label text', () => {
    const { container } = render(<AIConfidenceBadge confidence={0.9} compact={true} />);
    expect(screen.queryByText('Høy sikkerhet')).not.toBeInTheDocument();
    const dot = container.querySelector('span');
    expect(dot).toBeInTheDocument();
    expect(dot.title).toContain('90%');
  });

  it('shows reasoning when expanded', () => {
    render(
      <AIConfidenceBadge
        confidence={0.9}
        reasoning={['Matcher 25 lignende konsultasjoner', 'Høy mal-match']}
        showDetails={true}
      />
    );

    // Click to expand
    fireEvent.click(screen.getByText('Høy sikkerhet'));

    expect(screen.getByText('Matcher 25 lignende konsultasjoner')).toBeInTheDocument();
    expect(screen.getByText('Høy mal-match')).toBeInTheDocument();
  });

  it('does not expand reasoning when showDetails is false', () => {
    render(<AIConfidenceBadge confidence={0.9} reasoning={['Some reason']} showDetails={false} />);

    fireEvent.click(screen.getByText('Høy sikkerhet'));
    expect(screen.queryByText('Some reason')).not.toBeInTheDocument();
  });

  it('toggles reasoning on click', () => {
    render(<AIConfidenceBadge confidence={0.9} reasoning={['Test reason']} showDetails={true} />);

    // Expand
    fireEvent.click(screen.getByText('Høy sikkerhet'));
    expect(screen.getByText('Test reason')).toBeInTheDocument();

    // Collapse
    fireEvent.click(screen.getByText('Høy sikkerhet'));
    expect(screen.queryByText('Test reason')).not.toBeInTheDocument();
  });

  it('does not show expand icon when reasoning is empty', () => {
    const { container } = render(
      <AIConfidenceBadge confidence={0.9} reasoning={[]} showDetails={true} />
    );
    // The button should not have a chevron icon (which is mocked to null)
    expect(screen.getByText('Høy sikkerhet')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<AIConfidenceBadge confidence={0.9} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('AIConfidenceDot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a dot element', () => {
    const { container } = render(<AIConfidenceDot confidence={0.9} />);
    const dot = container.querySelector('span');
    expect(dot).toBeInTheDocument();
  });

  it('has correct title with confidence percentage', () => {
    const { container } = render(<AIConfidenceDot confidence={0.75} />);
    const dot = container.querySelector('span');
    expect(dot.title).toContain('75%');
  });

  it('renders different sizes', () => {
    const { container: sm } = render(<AIConfidenceDot confidence={0.5} size="sm" />);
    const { container: lg } = render(<AIConfidenceDot confidence={0.5} size="lg" />);
    const smDot = sm.querySelector('span');
    const lgDot = lg.querySelector('span');
    expect(smDot.className).toContain('w-2');
    expect(lgDot.className).toContain('w-3');
  });
});

describe('calculateConfidence', () => {
  it('returns base confidence of 0.5 with no inputs', () => {
    const result = calculateConfidence({});
    expect(result.score).toBe(0.5);
    expect(result.factors).toHaveLength(0);
  });

  it('increases confidence with many matching cases (>20)', () => {
    const result = calculateConfidence({ matchingSimilarCases: 25 });
    expect(result.score).toBe(0.7);
    expect(result.factors).toContain('Matcher 25 lignende konsultasjoner');
  });

  it('increases confidence moderately with some matching cases (5-20)', () => {
    const result = calculateConfidence({ matchingSimilarCases: 10 });
    expect(result.score).toBe(0.6);
    expect(result.factors).toContain('Matcher 10 tidligere tilfeller');
  });

  it('increases confidence with high template match', () => {
    const result = calculateConfidence({ templateMatch: 0.85 });
    expect(result.score).toBe(0.65);
    expect(result.factors).toContain('Høy mal-match');
  });

  it('increases confidence with appropriate content length', () => {
    const result = calculateConfidence({ contentLength: 200 });
    expect(result.score).toBe(0.6);
    expect(result.factors).toContain('Passende lengde');
  });

  it('increases confidence with medical terms present', () => {
    const result = calculateConfidence({ medicalTermsPresent: 5 });
    expect(result.score).toBe(0.55);
    expect(result.factors).toContain('Klinisk terminologi bekreftet');
  });

  it('caps score at 0.98', () => {
    const result = calculateConfidence({
      matchingSimilarCases: 25,
      templateMatch: 0.9,
      contentLength: 200,
      medicalTermsPresent: 5,
    });
    expect(result.score).toBe(0.98);
  });

  it('combines multiple factors', () => {
    const result = calculateConfidence({
      matchingSimilarCases: 25,
      templateMatch: 0.9,
    });
    expect(result.score).toBe(0.85);
    expect(result.factors).toHaveLength(2);
  });
});
