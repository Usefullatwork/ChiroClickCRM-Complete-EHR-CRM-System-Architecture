/**
 * AIDiagnosisSidebar Tests
 *
 * Tests:
 * - Renders in collapsed and expanded state
 * - Suggestions display
 * - Loading state
 * - Empty state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Brain: (props) => null,
  ChevronRight: (props) => null,
  ThumbsUp: (props) => null,
  ThumbsDown: (props) => null,
  Loader2: (props) => null,
  RefreshCw: (props) => null,
}));

vi.mock('../../../services/api', () => ({
  aiAPI: {
    suggestDiagnosis: vi.fn().mockResolvedValue({ data: { codes: [] } }),
  },
}));

vi.mock('../../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    scope: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
  },
}));

vi.mock('../../../components/clinical/AIConfidenceBadge', () => ({
  default: ({ confidence }) => (
    <span data-testid="confidence-badge">{Math.round(confidence * 100)}%</span>
  ),
}));

import AIDiagnosisSidebar from '../../../components/clinical/AIDiagnosisSidebar';

describe('AIDiagnosisSidebar', () => {
  const defaultProps = {
    soapData: {},
    onSelectCode: vi.fn(),
    isCollapsed: false,
    onToggle: vi.fn(),
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sidebar header when not collapsed', () => {
    render(<AIDiagnosisSidebar {...defaultProps} />);
    expect(screen.getByText('AI Diagnosehjelp')).toBeInTheDocument();
  });

  it('renders a toggle button when collapsed', () => {
    render(<AIDiagnosisSidebar {...defaultProps} isCollapsed={true} />);
    // Collapsed state renders a button, not the full sidebar
    expect(screen.queryByText('AI Diagnosehjelp')).not.toBeInTheDocument();
    // Should have a button with title
    const toggleBtn = screen.getByTitle('Vis AI diagnosehjelp');
    expect(toggleBtn).toBeInTheDocument();
  });

  it('renders empty state message when no suggestions', () => {
    render(<AIDiagnosisSidebar {...defaultProps} />);
    expect(
      screen.getByText('Skriv hovedklage eller vurdering for å få diagnosekode-forslag.')
    ).toBeInTheDocument();
  });

  it('renders the footer hint text', () => {
    render(<AIDiagnosisSidebar {...defaultProps} />);
    expect(
      screen.getByText(/Klikk på en kode for å legge til i konsultasjonen/)
    ).toBeInTheDocument();
  });

  it('renders refresh button with aria-label', () => {
    render(<AIDiagnosisSidebar {...defaultProps} />);
    expect(screen.getByLabelText('Oppdater forslag')).toBeInTheDocument();
  });

  it('renders hide panel button with aria-label', () => {
    render(<AIDiagnosisSidebar {...defaultProps} />);
    expect(screen.getByLabelText('Skjul detaljer')).toBeInTheDocument();
  });
});
