/**
 * FollowUpTemplate Component Tests
 * Tests for follow-up consultation template form
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      const map = {
        followUpConsultation: 'Oppfolgingskonsultasjon',
        patientProgress: 'Pasientfremgang',
        overallProgress: 'Generell fremgang',
        improved: 'Bedre',
        unchanged: 'Uendret',
        worse: 'Verre',
        subjectiveProgressSinceLast: 'S - Subjektiv fremgang',
        objectiveChangesInFindings: 'O - Objektive endringer',
        assessmentUpdatedStatus: 'A - Oppdatert vurdering',
        planContinuedTreatment: 'P - Videre behandling',
        diagnosisCodes: 'Diagnosekoder',
        icd10Codes: 'ICD-10 koder',
        addCode: 'Legg til kode',
        noCodesAdded: 'Ingen koder lagt til',
        save: 'Lagre',
        saving: 'Lagrer...',
        signAndLockNote: 'Signer og lås',
        unsavedChanges: 'Ulagrede endringer',
        redFlags: 'Rode flagg',
        addRedFlag: 'Legg til rodt flagg',
        progressAssessment: 'Fremdriftsvurdering',
        onTrack: 'Pa sporet',
        fasterThanExpected: 'Raskere enn forventet',
        slowerThanExpected: 'Saktere enn forventet',
        noProgress: 'Ingen fremgang',
        homeExerciseCompliance: 'Hjemmeovelsesetterlevelse',
        complianceExcellent: 'Utmerket',
        complianceGood: 'God',
        complianceFair: 'Middels',
        compliancePoor: 'Darlig',
        considerDischarge: 'Vurder utskrivning',
        visitNumberLabel: 'Besoksnummer',
        vasPainNow: 'VAS smerte na',
        noPain: 'Ingen smerte',
        maxPain: 'Maks smerte',
        visitNumber: `Besok ${opts?.number || ''}`,
      };
      return map[key] || key;
    },
    lang: 'no',
  }),
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// Mock ICD10CodePicker
vi.mock('../../../components/notes/ICD10CodePicker', () => ({
  default: ({ onSelect, onClose }) => (
    <div data-testid="icd10-picker">
      <button onClick={() => onSelect({ code: 'M54.5', description: 'Low back pain' })}>
        Select M54.5
      </button>
      <button onClick={onClose}>Close Picker</button>
    </div>
  ),
}));

// Mock usePrompt
vi.mock('../../../components/ui/PromptDialog', () => ({
  usePrompt: () => vi.fn().mockResolvedValue('Cauda equina'),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  User: (props) => <span>User</span>,
  Stethoscope: (props) => <span>Stethoscope</span>,
  ClipboardCheck: (props) => <span>ClipboardCheck</span>,
  Target: (props) => <span>Target</span>,
  Save: (props) => <span>Save</span>,
  Lock: (props) => <span>Lock</span>,
  AlertTriangle: (props) => <span>AlertTriangle</span>,
  ChevronDown: (props) => <span>ChevronDown</span>,
  ChevronUp: (props) => <span>ChevronUp</span>,
  Plus: (props) => <span>Plus</span>,
  Trash2: (props) => <span>Trash2</span>,
  TrendingUp: (props) => <span>TrendingUp</span>,
  TrendingDown: (props) => <span>TrendingDown</span>,
  Minus: (props) => <span>Minus</span>,
  Activity: (props) => <span>Activity</span>,
  CheckCircle: (props) => <span>CheckCircle</span>,
}));

import FollowUpTemplate from '../../../components/notes/FollowUpTemplate';

const mockPatient = {
  firstName: 'Ola',
  lastName: 'Nordmann',
};

describe('FollowUpTemplate', () => {
  let onSave;
  let onLock;

  beforeEach(() => {
    vi.clearAllMocks();
    onSave = vi.fn().mockResolvedValue(undefined);
    onLock = vi.fn().mockResolvedValue(undefined);
  });

  const renderComponent = (props = {}) => {
    return render(
      <FollowUpTemplate
        patient={mockPatient}
        onSave={onSave}
        onLock={onLock}
        readOnly={false}
        {...props}
      />
    );
  };

  it('renders the follow-up consultation header', () => {
    renderComponent();
    expect(screen.getByText('Oppfolgingskonsultasjon')).toBeInTheDocument();
  });

  it('displays patient name in header', () => {
    renderComponent();
    expect(screen.getByText(/Ola Nordmann/)).toBeInTheDocument();
  });

  it('renders patient progress section with progress buttons', () => {
    renderComponent();
    expect(screen.getByText('Pasientfremgang')).toBeInTheDocument();
    expect(screen.getByText('Bedre')).toBeInTheDocument();
    expect(screen.getByText('Uendret')).toBeInTheDocument();
    expect(screen.getByText('Verre')).toBeInTheDocument();
  });

  it('renders SOAP sections (subjective, objective, assessment, plan)', () => {
    renderComponent();
    expect(screen.getByText('S - Subjektiv fremgang')).toBeInTheDocument();
    expect(screen.getByText('O - Objektive endringer')).toBeInTheDocument();
    expect(screen.getByText('A - Oppdatert vurdering')).toBeInTheDocument();
    expect(screen.getByText('P - Videre behandling')).toBeInTheDocument();
  });

  it('renders diagnosis codes section', () => {
    renderComponent();
    expect(screen.getByText('Diagnosekoder')).toBeInTheDocument();
    expect(screen.getByText('Ingen koder lagt til')).toBeInTheDocument();
  });

  it('renders save and sign buttons when not readOnly', () => {
    renderComponent();
    expect(screen.getByText('Lagre')).toBeInTheDocument();
    expect(screen.getByText('Signer og lås')).toBeInTheDocument();
  });

  it('hides save and sign buttons when readOnly', () => {
    renderComponent({ readOnly: true });
    expect(screen.queryByText('Lagre')).not.toBeInTheDocument();
    expect(screen.queryByText('Signer og lås')).not.toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Lagre'));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onLock when sign button is clicked', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Signer og lås'));
    await waitFor(() => {
      expect(onLock).toHaveBeenCalledTimes(1);
    });
  });

  it('renders compliance buttons (excellent, good, fair, poor)', () => {
    renderComponent();
    expect(screen.getByText('Utmerket')).toBeInTheDocument();
    expect(screen.getByText('God')).toBeInTheDocument();
    expect(screen.getByText('Middels')).toBeInTheDocument();
    expect(screen.getByText('Darlig')).toBeInTheDocument();
  });

  it('renders progress assessment options', () => {
    renderComponent();
    expect(screen.getByText('Pa sporet')).toBeInTheDocument();
    expect(screen.getByText('Raskere enn forventet')).toBeInTheDocument();
    expect(screen.getByText('Saktere enn forventet')).toBeInTheDocument();
    expect(screen.getByText('Ingen fremgang')).toBeInTheDocument();
  });

  it('renders discharge consideration checkbox', () => {
    renderComponent();
    expect(screen.getByText('Vurder utskrivning')).toBeInTheDocument();
  });

  it('uses initialData when provided', () => {
    const initialData = {
      previousConsultation: { date: '', treatmentGiven: '', recommendations: '' },
      subjective: {
        overallProgress: 'improved',
        progressDescription: 'Mye bedre',
        chiefComplaint: 'Nakkesmerter',
        currentPainIntensity: 3,
        comparedToLastVisit: 'better',
        functionalChanges: '',
        complianceWithExercises: 'good',
        complianceNotes: '',
        newSymptoms: '',
        sideEffects: '',
        questionsOrConcerns: '',
      },
      objective: {
        generalObservation: '',
        posturalChanges: '',
        rangeOfMotionChanges: '',
        palpationFindings: '',
        neurologicalStatus: '',
        functionalTests: '',
        comparisonToPrevious: '',
      },
      assessment: {
        progressAssessment: 'on_track',
        responseToTreatment: '',
        diagnosisUpdate: '',
        clinicalReasoning: '',
        redFlags: [],
        prognosis: '',
        revisedExpectations: '',
      },
      plan: {
        treatmentToday: '',
        techniqueModifications: '',
        updatedExercises: '',
        patientEducation: '',
        homeAdvice: '',
        nextAppointment: '',
        treatmentPlanAdjustments: '',
        referrals: '',
        dischargeConsideration: false,
        dischargeNotes: '',
      },
      icd10_codes: ['M54.5'],
      icpc_codes: [],
      vas_pain_start: 3,
      vas_pain_end: 0,
      duration_minutes: 30,
      visit_number: 4,
    };
    renderComponent({ initialData });
    // ICD-10 code should be displayed
    expect(screen.getByText('M54.5')).toBeInTheDocument();
  });

  it('supports patient with snake_case name fields', () => {
    renderComponent({
      patient: { first_name: 'Kari', last_name: 'Berg' },
    });
    expect(screen.getByText(/Kari Berg/)).toBeInTheDocument();
  });
});
