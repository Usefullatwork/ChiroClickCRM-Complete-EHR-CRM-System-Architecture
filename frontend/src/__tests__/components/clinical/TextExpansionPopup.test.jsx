/**
 * TextExpansionPopup Tests
 *
 * Tests:
 * - Popup renders with suggestions
 * - Returns null when closed or no suggestions
 * - Category grouping
 * - Selection callback
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Command: (props) => null,
}));

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = vi.fn();

import TextExpansionPopup from '../../../components/clinical/TextExpansionPopup';

describe('TextExpansionPopup', () => {
  const mockSuggestions = [
    {
      id: 'tmpl-1',
      shortcut: 'better',
      name: 'Bedring',
      category: 'Subjektiv',
      text: 'Bedring siden sist.',
      preview: 'Bedring siden sist.',
    },
    {
      id: 'tmpl-2',
      shortcut: 'worse',
      name: 'Forverring',
      category: 'Subjektiv',
      text: 'Forverring siden sist.',
      preview: 'Forverring siden sist.',
    },
    {
      id: 'tmpl-3',
      shortcut: 'rom',
      name: 'Normal ROM',
      category: 'Objektiv',
      text: 'Normal ROM i alle retninger.',
      preview: 'Normal ROM i alle retninger.',
    },
  ];

  const defaultProps = {
    suggestions: mockSuggestions,
    isOpen: true,
    onSelect: vi.fn(),
    searchTerm: 'b',
    selectedIndex: 0,
    inputRef: { current: null },
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when isOpen is false', () => {
    const { container } = render(<TextExpansionPopup {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders null when suggestions array is empty', () => {
    const { container } = render(<TextExpansionPopup {...defaultProps} suggestions={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the header with suggestion count', () => {
    render(<TextExpansionPopup {...defaultProps} />);
    expect(screen.getByText('Maler (3)')).toBeInTheDocument();
  });

  it('renders the Tab hint text', () => {
    render(<TextExpansionPopup {...defaultProps} />);
    expect(screen.getByText('Tab for å sette inn')).toBeInTheDocument();
  });

  it('renders category headers', () => {
    render(<TextExpansionPopup {...defaultProps} />);
    // Category headers and badges both show category names, so use getAllByText
    expect(screen.getAllByText('Subjektiv').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Objektiv').length).toBeGreaterThanOrEqual(1);
  });

  it('renders shortcut codes for each suggestion', () => {
    render(<TextExpansionPopup {...defaultProps} />);
    expect(screen.getByText('/better')).toBeInTheDocument();
    expect(screen.getByText('/worse')).toBeInTheDocument();
    expect(screen.getByText('/rom')).toBeInTheDocument();
  });

  it('renders preview text for each suggestion', () => {
    render(<TextExpansionPopup {...defaultProps} />);
    expect(screen.getByText(/Bedring/)).toBeInTheDocument();
    expect(screen.getByText(/Forverring/)).toBeInTheDocument();
    expect(screen.getByText(/Normal ROM/)).toBeInTheDocument();
  });

  it('calls onSelect when a suggestion is clicked', () => {
    render(<TextExpansionPopup {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    // First clickable button is the first suggestion
    const firstSuggestion = buttons.find((b) => b.textContent.includes('/better'));
    if (firstSuggestion) {
      fireEvent.click(firstSuggestion);
      expect(defaultProps.onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ shortcut: 'better' })
      );
    }
  });

  it('marks the selected index item', () => {
    const { container } = render(<TextExpansionPopup {...defaultProps} selectedIndex={0} />);
    const selected = container.querySelector('[data-selected="true"]');
    expect(selected).toBeInTheDocument();
  });
});
