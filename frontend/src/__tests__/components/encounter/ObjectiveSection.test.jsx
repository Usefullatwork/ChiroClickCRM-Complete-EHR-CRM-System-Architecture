/**
 * ObjectiveSection Component Tests
 * Tests the O (Objective) section of the SOAP note form.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));

// Mock heavy/lazy sub-components
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

vi.mock('../../../components/clinical/AITextarea', () => ({
  default: ({ value, onChange, placeholder, disabled, onFocus }) => (
    <textarea
      data-testid={`ai-textarea-${placeholder}`}
      value={value || ''}
      onChange={(e) => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={onFocus}
    />
  ),
}));

vi.mock('../../../components/encounter/ExamPanelManager', () => ({
  ExamPanelManager: () => <div data-testid="exam-panel-manager">ExamPanelManager</div>,
}));

import { ObjectiveSection } from '../../../components/encounter/ObjectiveSection';

function buildEncounterData(overrides = {}) {
  return {
    subjective: { chief_complaint: '' },
    objective: {
      observation: '',
      palpation: '',
      rom: '',
      ortho_tests: '',
      neuro_tests: '',
      ...overrides,
    },
  };
}

function buildProps(overrides = {}) {
  return {
    encounterData: buildEncounterData(),
    isSigned: false,
    updateField: vi.fn(),
    quickPhrases: { objective: [] },
    handleQuickPhrase: vi.fn(),
    setActiveField: vi.fn(),
    patientId: 'patient-1',
    encounterId: 'enc-1',
    handleOrthoExamChange: vi.fn(),
    handleNeuroExamChange: vi.fn(),
    onAnatomyInsertText: vi.fn(),
    ...overrides,
  };
}

describe('ObjectiveSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Rendering
  // --------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render the section with correct testid', () => {
      render(<ObjectiveSection {...buildProps()} />);
      expect(screen.getByTestId('encounter-objective')).toBeInTheDocument();
    });

    it('should render the "O" badge and "Objektivt" heading', () => {
      render(<ObjectiveSection {...buildProps()} />);
      expect(screen.getByText('O')).toBeInTheDocument();
      expect(screen.getByText('Objektivt')).toBeInTheDocument();
    });

    it('should render Observasjon textarea', () => {
      render(<ObjectiveSection {...buildProps()} />);
      expect(screen.getByText('Observasjon')).toBeInTheDocument();
    });

    it('should render Palpasjon textarea', () => {
      render(<ObjectiveSection {...buildProps()} />);
      expect(screen.getByText('Palpasjon')).toBeInTheDocument();
    });

    it('should render ROM AI textarea', () => {
      render(<ObjectiveSection {...buildProps()} />);
      expect(screen.getByPlaceholderText('Range of Motion (ROM)...')).toBeInTheDocument();
    });

    it('should render the ExamPanelManager', () => {
      render(<ObjectiveSection {...buildProps()} />);
      expect(screen.getByTestId('exam-panel-manager')).toBeInTheDocument();
    });

    it('should render ortho_tests and neuro_tests AI textareas', () => {
      render(<ObjectiveSection {...buildProps()} />);
      expect(screen.getByPlaceholderText('Ortopediske tester (sammendrag)...')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Nevrologiske tester (sammendrag)...')
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Quick phrases
  // --------------------------------------------------------------------------

  describe('Quick phrases', () => {
    it('should not render quick phrase buttons when isSigned is true', () => {
      const props = buildProps({
        isSigned: true,
        quickPhrases: { objective: ['SLR neg', 'Kemp neg'] },
      });
      render(<ObjectiveSection {...props} />);
      expect(screen.queryByText('+ SLR neg')).not.toBeInTheDocument();
    });

    it('should render quick phrase buttons when not signed', () => {
      const props = buildProps({
        quickPhrases: { objective: ['SLR neg', 'Kemp neg'] },
      });
      render(<ObjectiveSection {...props} />);
      expect(screen.getByText('+ SLR neg')).toBeInTheDocument();
      expect(screen.getByText('+ Kemp neg')).toBeInTheDocument();
    });

    it('should call handleQuickPhrase with correct args when a quick phrase is clicked', () => {
      const handleQuickPhrase = vi.fn();
      const props = buildProps({
        quickPhrases: { objective: ['SLR neg'] },
        handleQuickPhrase,
      });
      render(<ObjectiveSection {...props} />);

      fireEvent.click(screen.getByText('+ SLR neg'));
      expect(handleQuickPhrase).toHaveBeenCalledWith('SLR neg', 'objective', 'ortho_tests');
    });
  });

  // --------------------------------------------------------------------------
  // Interaction
  // --------------------------------------------------------------------------

  describe('Interaction', () => {
    it('should call setActiveField on focus of ortho_tests textarea', () => {
      const setActiveField = vi.fn();
      render(<ObjectiveSection {...buildProps({ setActiveField })} />);

      const orthoTextarea = screen.getByPlaceholderText('Ortopediske tester (sammendrag)...');
      fireEvent.focus(orthoTextarea);
      expect(setActiveField).toHaveBeenCalledWith('objective.ortho_tests');
    });

    it('should call setActiveField on focus of neuro_tests textarea', () => {
      const setActiveField = vi.fn();
      render(<ObjectiveSection {...buildProps({ setActiveField })} />);

      const neuroTextarea = screen.getByPlaceholderText('Nevrologiske tester (sammendrag)...');
      fireEvent.focus(neuroTextarea);
      expect(setActiveField).toHaveBeenCalledWith('objective.neuro_tests');
    });
  });

  // --------------------------------------------------------------------------
  // Signed state
  // --------------------------------------------------------------------------

  describe('Signed state', () => {
    it('should disable the ROM textarea when isSigned', () => {
      render(<ObjectiveSection {...buildProps({ isSigned: true })} />);
      const romTextarea = screen.getByPlaceholderText('Range of Motion (ROM)...');
      expect(romTextarea).toBeDisabled();
    });

    it('should disable Observasjon textarea when isSigned', () => {
      render(<ObjectiveSection {...buildProps({ isSigned: true })} />);
      const obsTextarea = screen.getByTestId('textarea-Observasjon');
      expect(obsTextarea).toBeDisabled();
    });
  });
});
