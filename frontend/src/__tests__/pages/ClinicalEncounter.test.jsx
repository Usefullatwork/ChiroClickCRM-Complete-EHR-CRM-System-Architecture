import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock react-router-dom params
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ patientId: 'patient-123' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock all API modules
vi.mock('../../services/api', () => ({
  encountersAPI: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
    getById: vi.fn().mockResolvedValue({ data: null }),
    create: vi.fn().mockResolvedValue({ data: { id: 'enc-1' } }),
    update: vi.fn().mockResolvedValue({ data: {} }),
    sign: vi.fn().mockResolvedValue({ data: {} }),
    getAmendments: vi.fn().mockResolvedValue({ data: [] }),
    createAmendment: vi.fn().mockResolvedValue({ data: {} }),
    signAmendment: vi.fn().mockResolvedValue({ data: {} }),
  },
  patientsAPI: {
    getById: vi.fn().mockResolvedValue({
      data: {
        id: 'patient-123',
        first_name: 'Ola',
        last_name: 'Nordmann',
        date_of_birth: '1985-05-15',
      },
    }),
  },
  diagnosisAPI: {
    getCommon: vi.fn().mockResolvedValue({ data: [] }),
    search: vi.fn().mockResolvedValue({ data: [] }),
  },
  aiAPI: {
    suggestDiagnosis: vi.fn().mockResolvedValue({ data: {} }),
    analyzeRedFlags: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

// Mock hooks
vi.mock('../../hooks/usePatientIntake', () => ({
  usePatientIntake: () => ({
    intake: null,
    subjectiveNarrative: null,
    hasIntake: false,
  }),
}));

vi.mock('../../hooks', () => ({
  useClinicalPreferences: () => ({
    preferences: {},
    currentNotationMethod: 'text',
    getNotationName: () => 'Text',
    isVisualNotation: false,
    language: 'NO',
  }),
}));

vi.mock('../../hooks/useEncounterSave', () => ({
  useEncounterSave: () => ({
    saveMutation: { mutate: vi.fn(), isLoading: false },
    signMutation: { mutate: vi.fn(), isLoading: false },
    createAmendmentMutation: { mutate: vi.fn(), isLoading: false },
    signAmendmentMutation: { mutate: vi.fn(), isLoading: false },
    handleSave: vi.fn(),
    handlePreSign: vi.fn(),
    handleSignAndLock: vi.fn(),
    handleCreateAmendment: vi.fn(),
    triggerAutoSave: vi.fn(),
  }),
}));

vi.mock('../../hooks/useDiagnosisHandlers', () => ({
  useDiagnosisHandlers: () => ({
    toggleDiagnosis: vi.fn(),
    removeDiagnosisCode: vi.fn(),
    toggleTakst: vi.fn(),
  }),
}));

vi.mock('../../hooks/useEncounterHandlers', () => ({
  useEncounterHandlers: () => ({
    updateField: vi.fn(),
    handleQuickPhrase: vi.fn(),
    handleTemplateSelect: vi.fn(),
    handleSpineTextInsert: vi.fn(),
    handleCarryForward: vi.fn(),
    handleNeuroExamChange: vi.fn(),
    handleOrthoExamChange: vi.fn(),
    applyEncounterTypeDefaults: vi.fn(),
    handleSALT: vi.fn(),
  }),
}));

vi.mock('../../hooks/useEncounterEffects', () => ({
  useEncounterEffects: vi.fn(),
}));

vi.mock('../../hooks/useAutoCoding', () => ({
  useAutoCoding: () => ({
    confirmedRegions: [],
    suggestedCMTCode: null,
    suggestedCodes: [],
  }),
}));

vi.mock('../../hooks/useAISuggestions', () => ({
  useAISuggestions: () => ({
    getAISuggestions: vi.fn(),
  }),
}));

vi.mock('../../hooks/useEncounterQueries', () => ({
  useEncounterQueries: () => ({
    patient: null,
    patientLoading: false,
    kioskIntake: null,
    hasKioskIntake: false,
    kioskSubjective: '',
    existingEncounter: null,
    commonDiagnoses: null,
    previousEncounters: null,
    latestAnatomyFindings: null,
    existingAnatomyFindings: null,
  }),
}));

vi.mock('../../hooks/useClinicalEncounterState', () => ({
  useClinicalEncounterState: () => ({
    panels: {
      showDiagnosisDropdown: false,
      setShowDiagnosisDropdown: vi.fn(),
      showAIAssistant: false,
      setShowAIAssistant: vi.fn(),
      showTemplatePicker: false,
      setShowTemplatePicker: vi.fn(),
      showKeyboardHelp: false,
      setShowKeyboardHelp: vi.fn(),
      showMacroHint: false,
      showSALTBanner: false,
      setShowSALTBanner: vi.fn(),
      saltBannerExpanded: false,
      setSaltBannerExpanded: vi.fn(),
      showAIDiagnosisSidebar: false,
      setShowAIDiagnosisSidebar: vi.fn(),
      showExercisePanel: false,
      setShowExercisePanel: vi.fn(),
      showOrthoExam: false,
      setShowOrthoExam: vi.fn(),
      showNeuroExam: false,
      setShowNeuroExam: vi.fn(),
      showAnatomyPanel: false,
      setShowAnatomyPanel: vi.fn(),
      showROMTable: false,
      setShowROMTable: vi.fn(),
      showBodyDiagram: false,
      setShowBodyDiagram: vi.fn(),
      showExamProtocol: false,
      setShowExamProtocol: vi.fn(),
      showClusterTests: false,
      setShowClusterTests: vi.fn(),
      showRegionalExam: false,
      setShowRegionalExam: vi.fn(),
      showNeurologicalExam: false,
      setShowNeurologicalExam: vi.fn(),
      showOutcomeMeasures: false,
      setShowOutcomeMeasures: vi.fn(),
      showMMT: false,
      setShowMMT: vi.fn(),
      showDTR: false,
      setShowDTR: vi.fn(),
      showSensoryExam: false,
      setShowSensoryExam: vi.fn(),
      showCranialNerves: false,
      setShowCranialNerves: vi.fn(),
      showCoordination: false,
      setShowCoordination: vi.fn(),
      showNerveTension: false,
      setShowNerveTension: vi.fn(),
      showRegionalDiagrams: false,
      setShowRegionalDiagrams: vi.fn(),
      showPainAssessment: false,
      setShowPainAssessment: vi.fn(),
      showHeadacheAssessment: false,
      setShowHeadacheAssessment: vi.fn(),
      showTissueMarkers: false,
      setShowTissueMarkers: vi.fn(),
    },
    examData: {
      notationData: {},
      setNotationData: vi.fn(),
      notationNarrative: '',
      setNotationNarrative: vi.fn(),
      neuroExamData: null,
      setNeuroExamData: vi.fn(),
      orthoExamData: null,
      setOrthoExamData: vi.fn(),
      anatomySpineFindings: {},
      setAnatomySpineFindings: vi.fn(),
      anatomyBodyRegions: [],
      setAnatomyBodyRegions: vi.fn(),
      romTableData: {},
      setRomTableData: vi.fn(),
      bodyDiagramMarkers: [],
      setBodyDiagramMarkers: vi.fn(),
      examProtocolData: {},
      setExamProtocolData: vi.fn(),
      clusterTestData: {},
      setClusterTestData: vi.fn(),
      regionalExamData: {},
      setRegionalExamData: vi.fn(),
      neurologicalExamData: {},
      setNeurologicalExamData: vi.fn(),
      outcomeMeasureType: 'ndi',
      setOutcomeMeasureType: vi.fn(),
      outcomeMeasureData: {},
      setOutcomeMeasureData: vi.fn(),
      mmtData: {},
      setMmtData: vi.fn(),
      dtrData: {},
      setDtrData: vi.fn(),
      sensoryExamData: {},
      setSensoryExamData: vi.fn(),
      cranialNerveData: {},
      setCranialNerveData: vi.fn(),
      coordinationData: {},
      setCoordinationData: vi.fn(),
      nerveTensionData: {},
      setNerveTensionData: vi.fn(),
      regionalDiagramData: {},
      setRegionalDiagramData: vi.fn(),
      selectedRegion: 'shoulder',
      setSelectedRegion: vi.fn(),
      painAssessmentData: {},
      setPainAssessmentData: vi.fn(),
      headacheData: {},
      setHeadacheData: vi.fn(),
      tissueMarkerData: {},
      setTissueMarkerData: vi.fn(),
    },
    encounterData: {
      encounter_date: new Date().toISOString().split('T')[0],
      encounter_type: 'FOLLOWUP',
      duration_minutes: 20,
      vas_pain_start: 0,
      vas_pain_end: 0,
      subjective: {},
      objective: {},
      assessment: {},
      plan: {},
      icpc_codes: [],
      icd10_codes: [],
      signed_at: null,
    },
    setEncounterData: vi.fn(),
    redFlagAlerts: [],
    setRedFlagAlerts: vi.fn(),
    clinicalWarnings: [],
    setClinicalWarnings: vi.fn(),
    aiSuggestions: null,
    setAiSuggestions: vi.fn(),
    aiLoading: false,
    setAiLoading: vi.fn(),
    activeField: null,
    setActiveField: vi.fn(),
    diagnosisSearch: '',
    setDiagnosisSearch: vi.fn(),
    currentMacroMatch: null,
    _setCurrentMacroMatch: vi.fn(),
    selectedTakster: [],
    setSelectedTakster: vi.fn(),
    showTakster: false,
    setShowTakster: vi.fn(),
    autoSaveStatus: 'saved',
    setAutoSaveStatus: vi.fn(),
    lastSaved: null,
    setLastSaved: vi.fn(),
    elapsedTime: '00:00',
    setElapsedTime: vi.fn(),
    encounterStartTime: new Date(),
    showAmendmentForm: false,
    setShowAmendmentForm: vi.fn(),
    amendmentContent: '',
    setAmendmentContent: vi.fn(),
    amendmentType: 'addendum',
    setAmendmentType: vi.fn(),
    amendmentReason: '',
    setAmendmentReason: vi.fn(),
    kioskDataApplied: false,
    setKioskDataApplied: vi.fn(),
    textAreaRefs: { current: {} },
    palpationRef: { current: null },
    autoSaveTimerRef: { current: null },
    sectionRefs: { current: {} },
    timerIntervalRef: { current: null },
  }),
}));

// Mock child components to simplify rendering
vi.mock('../../components/TemplatePicker', () => ({
  default: () => null,
}));

vi.mock('../../components/clinical/QuickPalpationSpine', () => ({
  default: () => <div data-testid="quick-palpation">QuickPalpation</div>,
}));

vi.mock('../../components/clinical', () => ({
  AIDiagnosisSidebar: () => null,
  RedFlagModal: () => null,
}));

vi.mock('../../hooks/useRedFlagScreening', () => ({
  useRedFlagScreening: () => ({
    flags: [],
    summary: {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      requiresImmediateAction: false,
      categories: [],
    },
    isScreening: false,
    lastScreened: null,
    acknowledgedFlags: new Set(),
    unacknowledgedFlags: [],
    hasUnacknowledgedCritical: false,
    screenText: vi.fn(),
    screenTextImmediate: vi.fn(),
    screenFullPatient: vi.fn(),
    screenPatientAge: vi.fn(),
    screenExam: vi.fn(),
    acknowledgeFlag: vi.fn(),
    acknowledgeAllFlags: vi.fn(),
    resetAcknowledgements: vi.fn(),
    clearFlags: vi.fn(),
  }),
  default: () => ({
    flags: [],
    summary: { total: 0, critical: 0 },
    screenText: vi.fn(),
    clearFlags: vi.fn(),
  }),
}));

vi.mock('../../components/common', () => ({
  ConnectionStatus: () => null,
}));

vi.mock('../../utils/toast', () => ({
  default: { info: vi.fn(), success: vi.fn(), error: vi.fn(), promise: vi.fn() },
}));

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key) => key,
    lang: 'no',
  }),
}));

vi.mock('../../components/encounter/PatientInfoSidebar', () => ({
  PatientInfoSidebar: ({ patientData }) => (
    <div data-testid="patient-sidebar">
      {patientData ? `${patientData.first_name} ${patientData.last_name}` : 'Loading...'}
    </div>
  ),
}));

vi.mock('../../components/encounter/TaksterPanel', () => ({
  taksterNorwegian: [],
}));

vi.mock('../../components/encounter/SOAPNoteForm', () => ({
  SOAPNoteForm: () => <div data-testid="soap-form">SOAP Form</div>,
}));

vi.mock('../../components/encounter/EncounterHeader', () => ({
  EncounterHeader: () => <div data-testid="encounter-header">Header</div>,
}));

vi.mock('../../components/encounter/EncounterFooter', () => ({
  EncounterFooter: ({ handleSave }) => (
    <div data-testid="encounter-footer">
      <button onClick={handleSave}>Lagre</button>
    </div>
  ),
}));

vi.mock('../../components/encounter/AmendmentSection', () => ({
  AmendmentSection: () => null,
}));

vi.mock('../../components/encounter/AIAssistantPanel', () => ({
  AIAssistantPanel: () => null,
}));

vi.mock('../../components/encounter/KeyboardShortcutsModal', () => ({
  KeyboardShortcutsModal: () => null,
}));

vi.mock('../../components/encounter/ClinicalEncounterModals', () => ({
  ClinicalEncounterModals: () => null,
}));

vi.mock('../../components/encounter/encounterConstants', () => ({
  macros: {},
  buildQuickPhrases: () => ({ subjective: [], objective: [], assessment: [], plan: [] }),
  buildKeyboardShortcuts: () => ({}),
}));

import ClinicalEncounter from '../../pages/ClinicalEncounter';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderWithProviders = (component) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ClinicalEncounter Component', () => {
  it('should render the encounter page with key sections', async () => {
    renderWithProviders(<ClinicalEncounter />);

    await waitFor(() => {
      expect(screen.getByTestId('encounter-header')).toBeInTheDocument();
      expect(screen.getByTestId('soap-form')).toBeInTheDocument();
      expect(screen.getByTestId('encounter-footer')).toBeInTheDocument();
      expect(screen.getByTestId('quick-palpation')).toBeInTheDocument();
    });
  });
});
