/**
 * PlanSection Component Tests
 * Tests the P (Plan) section of the SOAP note form.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));

// Mock FeatureModuleContext — default: all modules enabled
vi.mock('../../../context/FeatureModuleContext', () => ({
  useFeatureModule: () => ({ isModuleEnabled: () => true }),
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

vi.mock('../../../components/encounter/TaksterPanel', () => ({
  TaksterPanel: ({ onToggleShow, showTakster }) => (
    <div data-testid="takster-panel">
      <button onClick={onToggleShow} data-testid="takster-toggle">
        {showTakster ? 'Skjul takster' : 'Vis takster'}
      </button>
    </div>
  ),
}));

vi.mock('../../../components/examination/BodyChartPanel', () => ({
  default: () => <div data-testid="body-chart-panel">BodyChartPanel</div>,
}));
vi.mock('../../../components/examination/AnatomicalBodyChart', () => ({
  default: () => <div data-testid="anatomical-body-chart">AnatomicalBodyChart</div>,
}));
vi.mock('../../../components/examination/ActivatorMethodPanel', () => ({
  default: () => <div data-testid="activator-method-panel">ActivatorMethodPanel</div>,
}));
vi.mock('../../../components/examination/FacialLinesChart', () => ({
  default: () => <div data-testid="facial-lines-chart">FacialLinesChart</div>,
}));
vi.mock('../../../components/exercises/ExercisePanel', () => ({
  default: () => <div data-testid="exercise-panel">ExercisePanel</div>,
}));

vi.mock('lucide-react', () => ({
  Activity: () => <span data-testid="icon-activity">Activity</span>,
  Target: () => <span data-testid="icon-target">Target</span>,
  Settings: () => <span data-testid="icon-settings">Settings</span>,
}));

import { PlanSection } from '../../../components/encounter/PlanSection';

function buildEncounterData(overrides = {}) {
  return {
    vas_pain_end: 0,
    plan: {
      treatment: '',
      exercises: '',
      follow_up: '',
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
    clinicalPrefs: { showDermatomes: false, showTriggerPoints: false },
    currentNotationMethod: { id: 'soap_narrative' },
    getNotationName: vi.fn(() => 'SOAP Narrativ'),
    isVisualNotation: false,
    clinicalLang: 'no',
    notationData: null,
    setNotationData: vi.fn(),
    setNotationNarrative: vi.fn(),
    navigate: vi.fn(),
    selectedTakster: [],
    toggleTakst: vi.fn(),
    showTakster: false,
    setShowTakster: vi.fn(),
    totalPrice: 0,
    showExercisePanel: false,
    setShowExercisePanel: vi.fn(),
    patientId: 'patient-1',
    encounterId: 'enc-1',
    suggestedCMTCode: null,
    ...overrides,
  };
}

describe('PlanSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Rendering
  // --------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render the section with correct testid', () => {
      render(<PlanSection {...buildProps()} />);
      expect(screen.getByTestId('encounter-plan')).toBeInTheDocument();
    });

    it('should render the "P" badge and plan heading', () => {
      render(<PlanSection {...buildProps()} />);
      expect(screen.getByText('P')).toBeInTheDocument();
      expect(screen.getByText('Plan & Behandling')).toBeInTheDocument();
    });

    it('should render the VAS Slutt label', () => {
      render(<PlanSection {...buildProps()} />);
      expect(screen.getByText(/VAS Slutt/i)).toBeInTheDocument();
    });

    it('should render the notation method indicator', () => {
      render(<PlanSection {...buildProps()} />);
      expect(screen.getByText('Behandlingsnotasjon:')).toBeInTheDocument();
      expect(screen.getByText('SOAP Narrativ')).toBeInTheDocument();
    });

    it('should render the settings navigation button', () => {
      render(<PlanSection {...buildProps()} />);
      expect(screen.getByText('Endre i innstillinger')).toBeInTheDocument();
    });

    it('should render the TaksterPanel', () => {
      render(<PlanSection {...buildProps()} />);
      expect(screen.getByTestId('takster-panel')).toBeInTheDocument();
    });

    it('should render the treatment textarea when isVisualNotation is false', () => {
      render(<PlanSection {...buildProps()} />);
      expect(screen.getByText('Behandling')).toBeInTheDocument();
    });

    it('should render the follow-up input', () => {
      render(<PlanSection {...buildProps()} />);
      expect(screen.getByText('Oppfølging:')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Notation method
  // --------------------------------------------------------------------------

  describe('Notation method indicator', () => {
    it('should call getNotationName to display notation label', () => {
      const getNotationName = vi.fn(() => 'Gonstead');
      render(<PlanSection {...buildProps({ getNotationName })} />);
      expect(getNotationName).toHaveBeenCalled();
      expect(screen.getByText('Gonstead')).toBeInTheDocument();
    });

    it('should call navigate when "Endre i innstillinger" is clicked', () => {
      const navigate = vi.fn();
      render(<PlanSection {...buildProps({ navigate })} />);
      fireEvent.click(screen.getByText('Endre i innstillinger'));
      expect(navigate).toHaveBeenCalledWith('/settings');
    });
  });

  // --------------------------------------------------------------------------
  // CMT code suggestion
  // --------------------------------------------------------------------------

  describe('CMT code suggestion', () => {
    it('should not render CMT suggestion when suggestedCMTCode is null', () => {
      render(<PlanSection {...buildProps({ suggestedCMTCode: null })} />);
      expect(screen.queryByText('Behandlingskode:')).not.toBeInTheDocument();
    });

    it('should render CMT suggestion when suggestedCMTCode is set and not signed', () => {
      const cmt = { code: 'L214', name: 'Manipulasjonsbehandling', regions: 3 };
      render(<PlanSection {...buildProps({ suggestedCMTCode: cmt, isSigned: false })} />);
      expect(screen.getByText('Behandlingskode:')).toBeInTheDocument();
      expect(screen.getByText('L214')).toBeInTheDocument();
      expect(screen.getByText(/Manipulasjonsbehandling/)).toBeInTheDocument();
    });

    it('should hide CMT suggestion when isSigned is true', () => {
      const cmt = { code: 'L214', name: 'Manipulasjonsbehandling', regions: 3 };
      render(<PlanSection {...buildProps({ suggestedCMTCode: cmt, isSigned: true })} />);
      expect(screen.queryByText('Behandlingskode:')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // VAS and exercise panel
  // --------------------------------------------------------------------------

  describe('VAS Slutt slider', () => {
    it('should display the current vas_pain_end value', () => {
      const props = buildProps({
        encounterData: { ...buildEncounterData(), vas_pain_end: 4 },
      });
      render(<PlanSection {...props} />);
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should call setEncounterData when VAS slider changes', () => {
      const setEncounterData = vi.fn();
      render(<PlanSection {...buildProps({ setEncounterData })} />);
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: 6 } });
      expect(setEncounterData).toHaveBeenCalled();
    });
  });

  describe('Exercise panel', () => {
    it('should show exercise panel toggle button when exercise_rx module is enabled', () => {
      render(<PlanSection {...buildProps()} />);
      // 'Hjemmeøvelser' appears in both the section label and the textarea label
      const elements = screen.getAllByText('Hjemmeøvelser');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should call setShowExercisePanel when exercise panel button is clicked', () => {
      const setShowExercisePanel = vi.fn();
      render(<PlanSection {...buildProps({ setShowExercisePanel, showExercisePanel: false })} />);
      fireEvent.click(screen.getByText('Velg fra bibliotek'));
      expect(setShowExercisePanel).toHaveBeenCalledWith(true);
    });
  });

  // --------------------------------------------------------------------------
  // Signed state
  // --------------------------------------------------------------------------

  describe('Signed state', () => {
    it('should disable VAS Slutt slider when isSigned', () => {
      render(<PlanSection {...buildProps({ isSigned: true })} />);
      expect(screen.getByRole('slider')).toBeDisabled();
    });

    it('should disable follow-up input when isSigned', () => {
      render(<PlanSection {...buildProps({ isSigned: true })} />);
      const followUpInput = screen.getByPlaceholderText('f.eks. 1 uke, 3 behandlinger');
      expect(followUpInput).toBeDisabled();
    });
  });
});
