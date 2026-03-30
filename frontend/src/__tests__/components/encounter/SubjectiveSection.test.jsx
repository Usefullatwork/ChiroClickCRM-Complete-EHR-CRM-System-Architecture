/**
 * SubjectiveSection Component Tests
 * Tests the S (Subjective) section of the SOAP note form.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));

// Mock heavy clinical sub-components
vi.mock('../../../components/clinical/EnhancedClinicalTextarea', () => ({
  default: ({ value, onChange, placeholder, label, disabled }) => (
    <div data-testid="enhanced-clinical-textarea">
      {label && <label>{label}</label>}
      <textarea
        data-testid={`textarea-${label || placeholder}`}
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  ),
}));

import { SubjectiveSection } from '../../../components/encounter/SubjectiveSection';

function buildEncounterData(overrides = {}) {
  return {
    vas_pain_start: 0,
    subjective: {
      chief_complaint: '',
      history: '',
      onset: '',
      pain_description: '',
      ...overrides,
    },
  };
}

function buildProps(overrides = {}) {
  return {
    encounterData: buildEncounterData(),
    setEncounterData: vi.fn(),
    isSigned: false,
    updateField: vi.fn(),
    quickPhrases: { subjective: [] },
    ...overrides,
  };
}

describe('SubjectiveSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Rendering
  // --------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render the section with the correct test id', () => {
      render(<SubjectiveSection {...buildProps()} />);
      expect(screen.getByTestId('encounter-subjective')).toBeInTheDocument();
    });

    it('should render the "S" badge and "Subjektivt" heading', () => {
      render(<SubjectiveSection {...buildProps()} />);
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('Subjektivt')).toBeInTheDocument();
    });

    it('should render the VAS Start label', () => {
      render(<SubjectiveSection {...buildProps()} />);
      expect(screen.getByText(/VAS Start/i)).toBeInTheDocument();
    });

    it('should render the chief complaint input with placeholder', () => {
      render(<SubjectiveSection {...buildProps()} />);
      expect(screen.getByPlaceholderText('Hovedklage...')).toBeInTheDocument();
    });

    it('should render the EnhancedClinicalTextarea for history', () => {
      render(<SubjectiveSection {...buildProps()} />);
      expect(screen.getByText('Sykehistorie')).toBeInTheDocument();
    });

    it('should render onset and pain_description inputs', () => {
      render(<SubjectiveSection {...buildProps()} />);
      expect(screen.getByPlaceholderText('Smertebeskrivelse')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Data display
  // --------------------------------------------------------------------------

  describe('Data display', () => {
    it('should display the current chief complaint value', () => {
      const props = buildProps({
        encounterData: buildEncounterData({ chief_complaint: 'Nakkesmerter' }),
      });
      render(<SubjectiveSection {...props} />);
      expect(screen.getByPlaceholderText('Hovedklage...')).toHaveValue('Nakkesmerter');
    });

    it('should display the current VAS pain start value', () => {
      const props = buildProps({
        encounterData: { ...buildEncounterData(), vas_pain_start: 7 },
      });
      render(<SubjectiveSection {...props} />);
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('should show "0" as default VAS value when vas_pain_start is not set', () => {
      render(<SubjectiveSection {...buildProps()} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Interaction
  // --------------------------------------------------------------------------

  describe('Interaction', () => {
    it('should call updateField when chief complaint changes', () => {
      const updateField = vi.fn();
      render(<SubjectiveSection {...buildProps({ updateField })} />);

      fireEvent.change(screen.getByPlaceholderText('Hovedklage...'), {
        target: { value: 'Ryggsmerter' },
      });

      expect(updateField).toHaveBeenCalledWith('subjective', 'chief_complaint', 'Ryggsmerter');
    });

    it('should call setEncounterData when VAS slider changes', () => {
      const setEncounterData = vi.fn();
      render(<SubjectiveSection {...buildProps({ setEncounterData })} />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: 5 } });

      expect(setEncounterData).toHaveBeenCalled();
    });

    it('should call updateField when onset field changes', () => {
      const updateField = vi.fn();
      render(<SubjectiveSection {...buildProps({ updateField })} />);

      const onsetInputs = screen.getAllByRole('textbox');
      // The onset input is the 2nd text input (after chief_complaint)
      const onsetInput = onsetInputs.find(
        (el) => el.placeholder && el.placeholder.includes('Debut')
      );
      fireEvent.change(onsetInput, { target: { value: '2 uker siden' } });

      expect(updateField).toHaveBeenCalledWith('subjective', 'onset', '2 uker siden');
    });
  });

  // --------------------------------------------------------------------------
  // Signed state
  // --------------------------------------------------------------------------

  describe('Signed state', () => {
    it('should disable chief complaint input when isSigned', () => {
      render(<SubjectiveSection {...buildProps({ isSigned: true })} />);
      expect(screen.getByPlaceholderText('Hovedklage...')).toBeDisabled();
    });

    it('should disable VAS slider when isSigned', () => {
      render(<SubjectiveSection {...buildProps({ isSigned: true })} />);
      expect(screen.getByRole('slider')).toBeDisabled();
    });

    it('should pass disabled prop to EnhancedClinicalTextarea when isSigned', () => {
      render(<SubjectiveSection {...buildProps({ isSigned: true })} />);
      const textarea = screen.getByTestId('textarea-Sykehistorie');
      expect(textarea).toBeDisabled();
    });
  });
});
