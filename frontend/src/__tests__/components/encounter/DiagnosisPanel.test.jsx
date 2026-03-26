/**
 * DiagnosisPanel Component Tests
 * Tests ICD-10/ICPC-2 search, selection, and removal in the Assessment section.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));

vi.mock('lucide-react', () => ({
  Search: () => <span data-testid="icon-search">Search</span>,
  Check: () => <span data-testid="icon-check">Check</span>,
  X: () => <span data-testid="icon-x">X</span>,
}));

import { DiagnosisPanel } from '../../../components/encounter/DiagnosisPanel';

const mockDiagnoses = [
  { code: 'L02', description_no: 'Korsryggsmerter' },
  { code: 'L03', description_no: 'Lumbago' },
  { code: 'N01', description_no: 'Nakkesmerter' },
];

function buildProps(overrides = {}) {
  return {
    diagnosisSearch: '',
    onSearchChange: vi.fn(),
    showDropdown: false,
    onShowDropdown: vi.fn(),
    filteredDiagnoses: mockDiagnoses,
    selectedCodes: [],
    onToggleDiagnosis: vi.fn(),
    onRemoveCode: vi.fn(),
    isSigned: false,
    ...overrides,
  };
}

describe('DiagnosisPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Rendering
  // --------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render the diagnosis search input', () => {
      render(<DiagnosisPanel {...buildProps()} />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render search icon', () => {
      render(<DiagnosisPanel {...buildProps()} />);
      expect(screen.getByTestId('icon-search')).toBeInTheDocument();
    });

    it('should not render dropdown when showDropdown is false', () => {
      render(<DiagnosisPanel {...buildProps({ showDropdown: false, diagnosisSearch: 'L02' })} />);
      expect(screen.queryByText('L02')).not.toBeInTheDocument();
    });

    it('should not render selected codes section when no codes selected', () => {
      render(<DiagnosisPanel {...buildProps({ selectedCodes: [] })} />);
      expect(screen.queryByTestId('icon-x')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Search interaction
  // --------------------------------------------------------------------------

  describe('Search interaction', () => {
    it('should call onSearchChange and onShowDropdown when input changes', () => {
      const onSearchChange = vi.fn();
      const onShowDropdown = vi.fn();
      render(<DiagnosisPanel {...buildProps({ onSearchChange, onShowDropdown })} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'rygg' } });

      expect(onSearchChange).toHaveBeenCalledWith('rygg');
      expect(onShowDropdown).toHaveBeenCalledWith(true);
    });

    it('should call onShowDropdown(true) when input is focused', () => {
      const onShowDropdown = vi.fn();
      render(<DiagnosisPanel {...buildProps({ onShowDropdown })} />);

      fireEvent.focus(screen.getByRole('textbox'));

      expect(onShowDropdown).toHaveBeenCalledWith(true);
    });

    it('should disable input when isSigned is true', () => {
      render(<DiagnosisPanel {...buildProps({ isSigned: true })} />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // Dropdown rendering
  // --------------------------------------------------------------------------

  describe('Dropdown rendering', () => {
    it('should render filtered diagnoses in dropdown when showDropdown and search term present', () => {
      render(<DiagnosisPanel {...buildProps({ showDropdown: true, diagnosisSearch: 'L' })} />);
      expect(screen.getByText('L02')).toBeInTheDocument();
      expect(screen.getByText('Korsryggsmerter', { exact: false })).toBeInTheDocument();
    });

    it('should show "Ingen diagnose funnet" when filteredDiagnoses is empty', () => {
      render(
        <DiagnosisPanel
          {...buildProps({ showDropdown: true, diagnosisSearch: 'zzz', filteredDiagnoses: [] })}
        />
      );
      expect(screen.getByText('Ingen diagnose funnet')).toBeInTheDocument();
    });

    it('should call onToggleDiagnosis when a diagnosis is clicked', () => {
      const onToggleDiagnosis = vi.fn();
      render(
        <DiagnosisPanel
          {...buildProps({ showDropdown: true, diagnosisSearch: 'L', onToggleDiagnosis })}
        />
      );

      fireEvent.click(screen.getByText('L02'));
      expect(onToggleDiagnosis).toHaveBeenCalledWith(mockDiagnoses[0]);
    });

    it('should show check icon for already-selected codes in dropdown', () => {
      render(
        <DiagnosisPanel
          {...buildProps({
            showDropdown: true,
            diagnosisSearch: 'L',
            selectedCodes: ['L02'],
          })}
        />
      );
      expect(screen.getByTestId('icon-check')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Selected codes display
  // --------------------------------------------------------------------------

  describe('Selected codes display', () => {
    it('should render selected diagnosis codes as chips', () => {
      render(<DiagnosisPanel {...buildProps({ selectedCodes: ['L02', 'N01'] })} />);
      const codeSpans = screen.getAllByText(/^L02$|^N01$/);
      expect(codeSpans.length).toBeGreaterThanOrEqual(2);
    });

    it('should call onRemoveCode when X button is clicked on a chip', () => {
      const onRemoveCode = vi.fn();
      render(<DiagnosisPanel {...buildProps({ selectedCodes: ['L02'], onRemoveCode })} />);
      // The X icon button for the chip
      const removeBtn = screen.getByTestId('icon-x').closest('button');
      fireEvent.click(removeBtn);
      expect(onRemoveCode).toHaveBeenCalledWith('L02');
    });
  });

  // --------------------------------------------------------------------------
  // Edge cases
  // --------------------------------------------------------------------------

  describe('Edge cases', () => {
    it('should limit dropdown to at most 10 diagnoses', () => {
      const manyDiagnoses = Array.from({ length: 15 }, (_, i) => ({
        code: `L${String(i).padStart(2, '0')}`,
        description_no: `Diagnose ${i}`,
      }));

      render(
        <DiagnosisPanel
          {...buildProps({
            showDropdown: true,
            diagnosisSearch: 'L',
            filteredDiagnoses: manyDiagnoses,
          })}
        />
      );

      // Only first 10 should render (slice(0, 10))
      const buttons = screen.getAllByRole('button');
      // Count only diagnosis-result buttons (each contains a code span)
      const diagnosisButtons = buttons.filter((btn) => btn.textContent.match(/L\d{2}/));
      expect(diagnosisButtons.length).toBeLessThanOrEqual(10);
    });
  });
});
