/**
 * SubjectiveSection Tests
 *
 * Tests:
 * - Renders with encounter context
 * - Chief complaint input
 * - VAS slider
 * - Quick phrases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  ChevronDown: (props) => null,
  ChevronUp: (props) => null,
}));

vi.mock('../../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
  useLanguage: () => ({ lang: 'no', setLang: vi.fn() }),
  LanguageProvider: ({ children }) => children,
}));

vi.mock('../../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
}));

// Mock EncounterContext
const mockEncounterData = {
  vas_pain_start: 5,
  subjective: {
    chief_complaint: 'Ryggsmerter',
    history: 'Kronisk smerte',
    onset: '2 uker siden',
    pain_description: 'Dull smerte',
  },
};

const mockUpdateField = vi.fn();
const mockSetEncounterData = vi.fn();

vi.mock('../../../../context/EncounterContext', () => ({
  useEncounter: () => ({
    encounterData: mockEncounterData,
    isSigned: false,
    updateField: mockUpdateField,
    setEncounterData: mockSetEncounterData,
  }),
}));

import SubjectiveSection from '../../../../components/clinical/Encounter/SubjectiveSection';

describe('SubjectiveSection', () => {
  const defaultProps = {
    onTextInputWithMacros: vi.fn().mockReturnValue(false),
    onQuickPhrase: vi.fn(),
    onSetActiveField: vi.fn(),
    quickPhrases: {
      subjective: ['Bedring', 'Forverring', 'Uendret'],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Subjektivt section header', () => {
    render(<SubjectiveSection {...defaultProps} />);
    expect(screen.getByText('Subjektivt')).toBeInTheDocument();
  });

  it('renders the S badge', () => {
    render(<SubjectiveSection {...defaultProps} />);
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('renders the chief complaint input', () => {
    render(<SubjectiveSection {...defaultProps} />);
    const input = screen.getByLabelText('Hovedklage');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Ryggsmerter');
  });

  it('calls updateField when chief complaint changes', () => {
    render(<SubjectiveSection {...defaultProps} />);
    const input = screen.getByLabelText('Hovedklage');
    fireEvent.change(input, { target: { value: 'Nakkesmerter' } });
    expect(mockUpdateField).toHaveBeenCalledWith('subjective', 'chief_complaint', 'Nakkesmerter');
  });

  it('renders the history textarea', () => {
    render(<SubjectiveSection {...defaultProps} />);
    const textarea = screen.getByLabelText('Anamnese og symptombeskrivelse');
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toBe('Kronisk smerte');
  });

  it('renders VAS pain slider', () => {
    render(<SubjectiveSection {...defaultProps} />);
    const slider = screen.getByLabelText('VAS smerteskala start');
    expect(slider).toBeInTheDocument();
    expect(slider.value).toBe('5');
  });

  it('renders VAS label text', () => {
    render(<SubjectiveSection {...defaultProps} />);
    expect(screen.getByText('VAS Start:')).toBeInTheDocument();
  });

  it('displays current VAS value', () => {
    render(<SubjectiveSection {...defaultProps} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders onset input', () => {
    render(<SubjectiveSection {...defaultProps} />);
    const onset = screen.getByLabelText('Debut');
    expect(onset).toBeInTheDocument();
    expect(onset.value).toBe('2 uker siden');
  });

  it('renders pain description input', () => {
    render(<SubjectiveSection {...defaultProps} />);
    const painDesc = screen.getByLabelText('Smertebeskrivelse');
    expect(painDesc).toBeInTheDocument();
    expect(painDesc.value).toBe('Dull smerte');
  });

  it('renders quick phrase buttons', () => {
    render(<SubjectiveSection {...defaultProps} />);
    expect(screen.getByText('+ Bedring')).toBeInTheDocument();
    expect(screen.getByText('+ Forverring')).toBeInTheDocument();
    expect(screen.getByText('+ Uendret')).toBeInTheDocument();
  });

  it('calls onQuickPhrase when quick phrase button is clicked', () => {
    render(<SubjectiveSection {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Bedring'));
    expect(defaultProps.onQuickPhrase).toHaveBeenCalledWith('Bedring', 'subjective', 'history');
  });

  it('calls onSetActiveField when textarea is focused', () => {
    render(<SubjectiveSection {...defaultProps} />);
    const textarea = screen.getByLabelText('Anamnese og symptombeskrivelse');
    fireEvent.focus(textarea);
    expect(defaultProps.onSetActiveField).toHaveBeenCalledWith('subjective.history');
  });
});
