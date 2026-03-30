/**
 * SOAPNoteForm Component Tests
 * Tests the orchestrator component that arranges all four SOAP sections.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));

// Stub all SOAP sub-sections
vi.mock('../../../components/encounter/SubjectiveSection', () => ({
  SubjectiveSection: () => <div data-testid="subjective-section">SubjectiveSection</div>,
}));
vi.mock('../../../components/encounter/ObjectiveSection', () => ({
  ObjectiveSection: () => <div data-testid="objective-section">ObjectiveSection</div>,
}));
vi.mock('../../../components/encounter/AssessmentSection', () => ({
  AssessmentSection: () => <div data-testid="assessment-section">AssessmentSection</div>,
}));
vi.mock('../../../components/encounter/PlanSection', () => ({
  PlanSection: () => <div data-testid="plan-section">PlanSection</div>,
}));
vi.mock('../../../components/clinical/SALTBanner', () => ({
  default: ({ onApplyAll, onDismiss }) => (
    <div data-testid="salt-banner">
      <button onClick={onApplyAll} data-testid="salt-apply-all">
        Apply All
      </button>
      <button onClick={onDismiss} data-testid="salt-dismiss">
        Dismiss
      </button>
    </div>
  ),
}));

import { SOAPNoteForm } from '../../../components/encounter/SOAPNoteForm';

function buildProps(overrides = {}) {
  return {
    encounterData: {
      subjective: { chief_complaint: '', history: '', onset: '', pain_description: '' },
      objective: { observation: '', palpation: '', rom: '', ortho_tests: '', neuro_tests: '' },
      plan: { treatment: '', exercises: '', follow_up: '' },
      vas_pain_start: 0,
      vas_pain_end: 0,
    },
    setEncounterData: vi.fn(),
    isSigned: false,
    updateField: vi.fn(),
    quickPhrases: { subjective: [], objective: [], plan: [] },
    handleQuickPhrase: vi.fn(),
    previousEncounters: null,
    showSALTBanner: false,
    setShowSALTBanner: vi.fn(),
    saltBannerExpanded: false,
    setSaltBannerExpanded: vi.fn(),
    handleSALT: vi.fn(),
    textAreaRefs: {},
    setActiveField: vi.fn(),
    patientId: 'patient-1',
    encounterId: 'enc-1',
    handleOrthoExamChange: vi.fn(),
    handleNeuroExamChange: vi.fn(),
    onAnatomyInsertText: vi.fn(),
    diagnosisSearch: '',
    setDiagnosisSearch: vi.fn(),
    showDiagnosisDropdown: false,
    setShowDiagnosisDropdown: vi.fn(),
    filteredDiagnoses: [],
    toggleDiagnosis: vi.fn(),
    removeDiagnosisCode: vi.fn(),
    clinicalPrefs: {},
    currentNotationMethod: { id: 'soap_narrative' },
    getNotationName: vi.fn(() => 'SOAP Narrativ'),
    isVisualNotation: false,
    clinicalLang: 'no',
    notationData: null,
    setNotationData: vi.fn(),
    _notationNarrative: '',
    setNotationNarrative: vi.fn(),
    navigate: vi.fn(),
    selectedTakster: [],
    toggleTakst: vi.fn(),
    showTakster: false,
    setShowTakster: vi.fn(),
    totalPrice: 0,
    showExercisePanel: false,
    setShowExercisePanel: vi.fn(),
    _setAutoSaveStatus: vi.fn(),
    sectionOrder: 'soap',
    suggestedCodes: [],
    suggestedCMTCode: null,
    ...overrides,
  };
}

describe('SOAPNoteForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Rendering — all four sections present
  // --------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render all four SOAP sections', () => {
      render(<SOAPNoteForm {...buildProps()} />);
      expect(screen.getByTestId('subjective-section')).toBeInTheDocument();
      expect(screen.getByTestId('objective-section')).toBeInTheDocument();
      expect(screen.getByTestId('assessment-section')).toBeInTheDocument();
      expect(screen.getByTestId('plan-section')).toBeInTheDocument();
    });

    it('should not render the SALT banner when showSALTBanner is false', () => {
      render(<SOAPNoteForm {...buildProps({ showSALTBanner: false })} />);
      expect(screen.queryByTestId('salt-banner')).not.toBeInTheDocument();
    });

    it('should not render SALT banner when isSigned is true even if showSALTBanner is true', () => {
      render(
        <SOAPNoteForm
          {...buildProps({
            isSigned: true,
            showSALTBanner: true,
            previousEncounters: { id: 'prev-1' },
          })}
        />
      );
      expect(screen.queryByTestId('salt-banner')).not.toBeInTheDocument();
    });

    it('should not render SALT banner when previousEncounters is null', () => {
      render(<SOAPNoteForm {...buildProps({ previousEncounters: null, showSALTBanner: true })} />);
      expect(screen.queryByTestId('salt-banner')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // SALT Banner
  // --------------------------------------------------------------------------

  describe('SALT Banner', () => {
    it('should render SALT banner when not signed, previousEncounters exists, and showSALTBanner is true', () => {
      render(
        <SOAPNoteForm
          {...buildProps({
            isSigned: false,
            previousEncounters: { id: 'prev-1' },
            showSALTBanner: true,
          })}
        />
      );
      expect(screen.getByTestId('salt-banner')).toBeInTheDocument();
    });

    it('should call handleSALT and setShowSALTBanner(false) when Apply All is clicked', () => {
      const handleSALT = vi.fn();
      const setShowSALTBanner = vi.fn();
      render(
        <SOAPNoteForm
          {...buildProps({
            previousEncounters: { id: 'prev-1' },
            showSALTBanner: true,
            handleSALT,
            setShowSALTBanner,
          })}
        />
      );
      screen.getByTestId('salt-apply-all').click();
      expect(handleSALT).toHaveBeenCalled();
      expect(setShowSALTBanner).toHaveBeenCalledWith(false);
    });

    it('should call setShowSALTBanner(false) when Dismiss is clicked', () => {
      const setShowSALTBanner = vi.fn();
      render(
        <SOAPNoteForm
          {...buildProps({
            previousEncounters: { id: 'prev-1' },
            showSALTBanner: true,
            setShowSALTBanner,
          })}
        />
      );
      screen.getByTestId('salt-dismiss').click();
      expect(setShowSALTBanner).toHaveBeenCalledWith(false);
    });
  });

  // --------------------------------------------------------------------------
  // Section ordering
  // --------------------------------------------------------------------------

  describe('Section ordering', () => {
    it('should render sections in S-O-A-P order when sectionOrder is "soap"', () => {
      render(<SOAPNoteForm {...buildProps({ sectionOrder: 'soap' })} />);
      const sections = screen.getAllByTestId(
        /subjective-section|objective-section|assessment-section|plan-section/
      );
      expect(sections[0]).toHaveAttribute('data-testid', 'subjective-section');
      expect(sections[1]).toHaveAttribute('data-testid', 'objective-section');
      expect(sections[2]).toHaveAttribute('data-testid', 'assessment-section');
      expect(sections[3]).toHaveAttribute('data-testid', 'plan-section');
    });

    it('should render sections in A-S-O-P order when sectionOrder is "asoap"', () => {
      render(<SOAPNoteForm {...buildProps({ sectionOrder: 'asoap' })} />);
      const sections = screen.getAllByTestId(
        /subjective-section|objective-section|assessment-section|plan-section/
      );
      expect(sections[0]).toHaveAttribute('data-testid', 'assessment-section');
      expect(sections[1]).toHaveAttribute('data-testid', 'subjective-section');
      expect(sections[2]).toHaveAttribute('data-testid', 'objective-section');
      expect(sections[3]).toHaveAttribute('data-testid', 'plan-section');
    });

    it('should default to SOAP order when sectionOrder prop is omitted', () => {
      const props = buildProps();
      delete props.sectionOrder;
      render(<SOAPNoteForm {...props} />);
      const sections = screen.getAllByTestId(
        /subjective-section|objective-section|assessment-section|plan-section/
      );
      expect(sections[0]).toHaveAttribute('data-testid', 'subjective-section');
    });
  });

  // --------------------------------------------------------------------------
  // Container structure
  // --------------------------------------------------------------------------

  describe('Container structure', () => {
    it('should wrap sections in a max-w-4xl container div', () => {
      const { container } = render(<SOAPNoteForm {...buildProps()} />);
      const wrapper = container.firstChild;
      expect(wrapper.className).toContain('max-w-4xl');
    });
  });
});
