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

vi.mock('../../hooks/useClinicalEncounterState', () => ({
  useClinicalEncounterState: () => ({
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
    showDiagnosisDropdown: false,
    setShowDiagnosisDropdown: vi.fn(),
    showAIAssistant: false,
    setShowAIAssistant: vi.fn(),
    showTemplatePicker: false,
    setShowTemplatePicker: vi.fn(),
    showKeyboardHelp: false,
    setShowKeyboardHelp: vi.fn(),
    showMacroHint: false,
    _setShowMacroHint: vi.fn(),
    currentMacroMatch: null,
    _setCurrentMacroMatch: vi.fn(),
    showSALTBanner: false,
    setShowSALTBanner: vi.fn(),
    saltBannerExpanded: false,
    setSaltBannerExpanded: vi.fn(),
    showAIDiagnosisSidebar: false,
    setShowAIDiagnosisSidebar: vi.fn(),
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
    showExercisePanel: false,
    setShowExercisePanel: vi.fn(),
    kioskDataApplied: false,
    setKioskDataApplied: vi.fn(),
    notationData: {},
    setNotationData: vi.fn(),
    notationNarrative: '',
    setNotationNarrative: vi.fn(),
    setNeuroExamData: vi.fn(),
    setOrthoExamData: vi.fn(),
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
}));

vi.mock('../../components/common', () => ({
  ConnectionStatus: () => null,
}));

vi.mock('../../utils/toast', () => ({
  default: { info: vi.fn(), success: vi.fn(), error: vi.fn(), promise: vi.fn() },
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
