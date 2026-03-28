import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock react-router-dom params
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ patientId: 'patient-1', encounterId: undefined }),
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// Mock i18n
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

// Mock toast
vi.mock('../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), promise: vi.fn() },
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    scope: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Mock API services
vi.mock('../../services/api', () => ({
  encountersAPI: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
    getById: vi.fn().mockResolvedValue({ data: null }),
    create: vi.fn().mockResolvedValue({ data: { id: 'enc-1' } }),
    update: vi.fn().mockResolvedValue({ data: {} }),
  },
  patientsAPI: {
    getById: vi.fn().mockResolvedValue({
      data: {
        id: 'patient-1',
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
    getStatus: vi.fn().mockResolvedValue({ data: { available: false } }),
    suggestDiagnosis: vi.fn().mockResolvedValue({ data: {} }),
    analyzeRedFlags: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

// Mock the useEasyAssessmentState hook (the entire state logic)
const mockGoToNextTab = vi.fn();
const mockGoToPrevTab = vi.fn();
const mockSetActiveTab = vi.fn();
const mockHandleSave = vi.fn();
const mockSetViewMode = vi.fn();
const mockSetEncounterData = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../hooks/useEasyAssessmentState', () => ({
  default: () => ({
    patientId: 'patient-1',
    navigate: mockNavigate,
    activeTab: 'subjective',
    setActiveTab: mockSetActiveTab,
    tabs: [
      { id: 'subjective', label: 'Subjective', icon: 'S' },
      { id: 'objective', label: 'Objective', icon: 'O' },
      { id: 'assessment', label: 'Assessment', icon: 'A' },
      { id: 'plan', label: 'Plan', icon: 'P' },
    ],
    canGoBack: false,
    canGoForward: true,
    goToNextTab: mockGoToNextTab,
    goToPrevTab: mockGoToPrevTab,
    viewMode: 'easy',
    setViewMode: mockSetViewMode,
    redFlagAlerts: [],
    clinicalWarnings: [],
    showTemplatePicker: false,
    setShowTemplatePicker: vi.fn(),
    showOutcomeAssessment: false,
    setShowOutcomeAssessment: vi.fn(),
    outcomeType: 'ODI',
    setOutcomeType: vi.fn(),
    showBodyChart: false,
    setShowBodyChart: vi.fn(),
    showTemplateLibrary: false,
    setShowTemplateLibrary: vi.fn(),
    showMacroMatrix: false,
    setShowMacroMatrix: vi.fn(),
    showCompliancePanel: false,
    setShowCompliancePanel: vi.fn(),
    showPrintPreview: false,
    setShowPrintPreview: vi.fn(),
    showSlashReference: false,
    setShowSlashReference: vi.fn(),
    showAIScribe: false,
    setShowAIScribe: vi.fn(),
    showAISettings: false,
    setShowAISettings: vi.fn(),
    language: 'no',
    setLanguage: vi.fn(),
    macroFavorites: [],
    setMacroFavorites: vi.fn(),
    aiAvailable: false,
    encounterData: {
      patient_id: 'patient-1',
      encounter_date: '2024-03-15',
      encounter_type: 'FOLLOWUP',
      duration_minutes: 30,
      vas_pain_start: null,
      vas_pain_end: null,
      subjective: { chief_complaint: '', history: '' },
      objective: {},
      assessment: {},
      plan: {},
    },
    setEncounterData: mockSetEncounterData,
    problems: [],
    setProblems: vi.fn(),
    treatmentPlan: null,
    setTreatmentPlan: vi.fn(),
    currentVisitNumber: 1,
    patient: {
      data: {
        id: 'patient-1',
        first_name: 'Ola',
        last_name: 'Nordmann',
      },
    },
    previousEncounter: null,
    commonDiagnoses: [],
    copiedToClipboard: false,
    copyToClipboard: vi.fn(),
    saveMutation: { mutate: vi.fn(), isLoading: false },
    handleSave: mockHandleSave,
    updateField: vi.fn(),
    updateQuickSelect: vi.fn(),
    addDiagnosisCode: vi.fn(),
    removeDiagnosisCode: vi.fn(),
    handleSALTApply: vi.fn(),
    handleMacroInsert: vi.fn(),
    handleComplianceAutoFix: vi.fn(),
    buildAIContext: vi.fn(),
    generateNarrativeText: () => 'Test narrative text output',
  }),
}));

// Mock child components
vi.mock('../../components/assessment/ProblemList', () => ({
  default: () => <div data-testid="problem-list">ProblemList</div>,
}));

vi.mock('../../components/assessment/TreatmentPlanTracker', () => ({
  default: () => <div data-testid="treatment-plan-tracker">TreatmentPlanTracker</div>,
}));

vi.mock('../../components/easyassessment/EasyAssessmentHeader', () => ({
  default: ({ handleSave }) => (
    <div data-testid="easy-assessment-header">
      <button onClick={handleSave} data-testid="save-btn">
        Save
      </button>
    </div>
  ),
}));

vi.mock('../../components/easyassessment/EasyAssessmentModals', () => ({
  EasyAssessmentModals: () => <div data-testid="easy-assessment-modals">Modals</div>,
}));

vi.mock('../../components/easyassessment/SubjectiveTab', () => ({
  default: () => <div data-testid="subjective-tab">SubjectiveTab</div>,
}));

vi.mock('../../components/easyassessment/ObjectiveTab', () => ({
  default: () => <div data-testid="objective-tab">ObjectiveTab</div>,
}));

vi.mock('../../components/easyassessment/AssessmentTab', () => ({
  default: () => <div data-testid="assessment-tab">AssessmentTab</div>,
}));

vi.mock('../../components/easyassessment/PlanTab', () => ({
  default: () => <div data-testid="plan-tab">PlanTab</div>,
}));

vi.mock('../../components/assessment/NarrativeGenerator', () => ({
  generateFullNarrative: vi.fn(() => ''),
  generateEncounterSummary: vi.fn(() => ''),
}));

import EasyAssessment from '../../pages/EasyAssessment';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderWithProviders = (ui) => {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('EasyAssessment Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', async () => {
    renderWithProviders(<EasyAssessment />);

    await waitFor(() => {
      expect(screen.getByTestId('easy-assessment-header')).toBeInTheDocument();
    });
  });

  it('should render the 3-column layout with sidebar components', async () => {
    renderWithProviders(<EasyAssessment />);

    await waitFor(() => {
      expect(screen.getByTestId('problem-list')).toBeInTheDocument();
      expect(screen.getByTestId('treatment-plan-tracker')).toBeInTheDocument();
    });
  });

  it('should render SOAP tab navigation with all four tabs', async () => {
    renderWithProviders(<EasyAssessment />);

    await waitFor(() => {
      expect(screen.getByText('Subjective')).toBeInTheDocument();
      expect(screen.getByText('Objective')).toBeInTheDocument();
      expect(screen.getByText('Assessment')).toBeInTheDocument();
      expect(screen.getByText('Plan')).toBeInTheDocument();
    });
  });

  it('should render the active subjective tab content by default', async () => {
    renderWithProviders(<EasyAssessment />);

    await waitFor(() => {
      expect(screen.getByTestId('subjective-tab')).toBeInTheDocument();
    });
  });

  it('should render metadata bar with date, type, and duration fields', async () => {
    renderWithProviders(<EasyAssessment />);

    await waitFor(() => {
      expect(screen.getByText('Date:')).toBeInTheDocument();
      expect(screen.getByText('Type:')).toBeInTheDocument();
      expect(screen.getByText('Duration:')).toBeInTheDocument();
    });
  });

  it('should render VAS pain start and end inputs', async () => {
    renderWithProviders(<EasyAssessment />);

    await waitFor(() => {
      expect(screen.getByText('VAS Start:')).toBeInTheDocument();
      expect(screen.getByText('VAS End:')).toBeInTheDocument();
    });
  });

  it('should render encounter type select with correct options', async () => {
    renderWithProviders(<EasyAssessment />);

    await waitFor(() => {
      const select = screen.getByDisplayValue('Follow-up');
      expect(select).toBeInTheDocument();
      expect(select.querySelectorAll('option')).toHaveLength(4);
    });
  });

  it('should render chart notes preview sidebar', async () => {
    renderWithProviders(<EasyAssessment />);

    await waitFor(() => {
      expect(screen.getByText('Chart Notes')).toBeInTheDocument();
      expect(screen.getByText('Test narrative text output')).toBeInTheDocument();
    });
  });

  it('should render navigation back/next buttons', async () => {
    renderWithProviders(<EasyAssessment />);

    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });

  it('should render the floating action buttons', async () => {
    renderWithProviders(<EasyAssessment />);

    await waitFor(() => {
      // Three floating buttons exist (slash commands, template library, quick templates)
      const floatingButtons = screen
        .getAllByRole('button')
        .filter(
          (btn) =>
            btn.title === 'Kommandoreferanse' ||
            btn.title === 'Malbibliotek' ||
            btn.title === 'Hurtigmaler'
        );
      expect(floatingButtons).toHaveLength(3);
    });
  });

  it('should render the modals container', async () => {
    renderWithProviders(<EasyAssessment />);

    await waitFor(() => {
      expect(screen.getByTestId('easy-assessment-modals')).toBeInTheDocument();
    });
  });

  it('should disable back button when canGoBack is false', async () => {
    renderWithProviders(<EasyAssessment />);

    await waitFor(() => {
      const backButton = screen.getByText('Back').closest('button');
      expect(backButton).toBeDisabled();
    });
  });
});
