/**
 * InitialConsultTemplate Component Tests
 * Tests for the initial consultation template orchestrator
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18n — InitialConsultTemplate imports from '../../i18n/useTranslation'
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
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

// Mock child sections as simple stubs that render section names
vi.mock('../../../components/notes/HistorySection', () => ({
  default: (props) => (
    <div data-testid="history-section">
      <span>HistorySection</span>
      {props.consultData && (
        <span data-testid="history-chief-complaint">
          {props.consultData.subjective?.chiefComplaint}
        </span>
      )}
    </div>
  ),
}));

vi.mock('../../../components/notes/ExaminationSection', () => ({
  default: (props) => (
    <div data-testid="examination-section">
      <span>ExaminationSection</span>
    </div>
  ),
}));

vi.mock('../../../components/notes/PlanSection', () => ({
  default: (props) => (
    <div data-testid="plan-section">
      <span>PlanSection</span>
      {props.showCodePicker && <span data-testid="plan-code-picker-active">CodePickerActive</span>}
    </div>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Save: (props) => <span>Save</span>,
  Lock: (props) => <span>Lock</span>,
  AlertTriangle: (props) => <span>AlertTriangle</span>,
  ChevronDown: (props) => <span>ChevronDown</span>,
  ChevronUp: (props) => <span>ChevronUp</span>,
  CheckCircle: (props) => <span>CheckCircle</span>,
}));

import InitialConsultTemplate from '../../../components/notes/InitialConsultTemplate';

const mockPatient = {
  firstName: 'Ola',
  lastName: 'Nordmann',
};

describe('InitialConsultTemplate', () => {
  let onSave;
  let onLock;

  beforeEach(() => {
    vi.clearAllMocks();
    onSave = vi.fn().mockResolvedValue(undefined);
    onLock = vi.fn().mockResolvedValue(undefined);
  });

  const renderComponent = (props = {}) => {
    return render(
      <InitialConsultTemplate
        patient={mockPatient}
        onSave={onSave}
        onLock={onLock}
        readOnly={false}
        {...props}
      />
    );
  };

  it('renders the initial consultation header', () => {
    renderComponent();
    expect(screen.getByText('Forstegangskonsultasjon')).toBeInTheDocument();
  });

  it('displays patient name in header', () => {
    renderComponent();
    expect(screen.getByText(/Ola Nordmann/)).toBeInTheDocument();
  });

  it('supports patient with snake_case name fields', () => {
    renderComponent({ patient: { first_name: 'Kari', last_name: 'Berg' } });
    expect(screen.getByText(/Kari Berg/)).toBeInTheDocument();
  });

  it('renders all three child sections', () => {
    renderComponent();
    expect(screen.getByTestId('history-section')).toBeInTheDocument();
    expect(screen.getByTestId('examination-section')).toBeInTheDocument();
    expect(screen.getByTestId('plan-section')).toBeInTheDocument();
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
    // Verify it receives consultData object
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        demographics: expect.any(Object),
        subjective: expect.any(Object),
        medicalHistory: expect.any(Object),
        objective: expect.any(Object),
        assessment: expect.any(Object),
        plan: expect.any(Object),
      })
    );
  });

  it('calls onLock when sign button is clicked', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Signer og lås'));
    await waitFor(() => {
      expect(onLock).toHaveBeenCalledTimes(1);
    });
  });

  it('passes initialData as consultData to child sections', () => {
    const initialData = {
      demographics: {
        occupation: 'Lege',
        lifestyle: '',
        activityLevel: '',
        sleepQuality: '',
      },
      subjective: {
        chiefComplaint: 'Hodepine',
        historyOfPresentIllness: '',
        onsetDate: '',
        onsetCircumstances: '',
        painLocation: '',
        painIntensity: 0,
        painQuality: '',
        painRadiation: '',
        painPattern: '',
        aggravatingFactors: '',
        relievingFactors: '',
        functionalLimitations: '',
        previousEpisodes: '',
        previousTreatment: '',
        currentMedications: '',
        medicationAllergies: '',
      },
      medicalHistory: {
        pastMedicalHistory: '',
        surgicalHistory: '',
        familyHistory: '',
        socialHistory: '',
        redFlagScreening: {
          unexplainedWeightLoss: false,
          nightPain: false,
          fever: false,
          bladderDysfunction: false,
          bowelDysfunction: false,
          progressiveWeakness: false,
          saddleAnesthesia: false,
          recentTrauma: false,
          cancerHistory: false,
          immunocompromised: false,
        },
      },
      objective: {
        generalAppearance: '',
        gait: '',
        posture: '',
        vitalSigns: {
          bloodPressure: '',
          pulse: '',
          respiratoryRate: '',
          temperature: '',
          height: '',
          weight: '',
        },
        inspection: '',
        palpation: '',
        rangeOfMotion: '',
        neurologicalExam: {
          motorTesting: '',
          sensoryTesting: '',
          reflexes: '',
          cranialNerves: '',
        },
        orthopedicTests: '',
        specialTests: '',
        imaging: '',
      },
      assessment: {
        primaryDiagnosis: '',
        secondaryDiagnoses: [],
        differentialDiagnosis: '',
        clinicalImpression: '',
        redFlags: [],
        severity: '',
        prognosis: '',
        expectedRecoveryTime: '',
      },
      plan: {
        treatmentGoals: { shortTerm: '', longTerm: '' },
        proposedTreatment: '',
        treatmentFrequency: '',
        estimatedVisits: '',
        initialTreatment: '',
        exercises: '',
        patientEducation: '',
        lifestyleRecommendations: '',
        followUp: '',
        referrals: '',
        contraindications: '',
        informedConsent: false,
      },
      icd10_codes: [],
      icpc_codes: [],
      vas_pain_start: 0,
      vas_pain_end: null,
      duration_minutes: 60,
    };
    renderComponent({ initialData });
    expect(screen.getByTestId('history-chief-complaint').textContent).toBe('Hodepine');
  });

  it('does not show unsaved changes indicator initially', () => {
    renderComponent();
    expect(screen.queryByText('Ulagrede endringer')).not.toBeInTheDocument();
  });

  it('does not render patient name when patient is null', () => {
    renderComponent({ patient: null });
    expect(screen.queryByText('Ola Nordmann')).not.toBeInTheDocument();
  });

  it('shows saving state on save button when save is in progress', async () => {
    // Make onSave hang
    onSave.mockImplementation(() => new Promise(() => {}));
    renderComponent();
    fireEvent.click(screen.getByText('Lagre'));
    await waitFor(() => {
      expect(screen.getByText('Lagrer...')).toBeInTheDocument();
    });
  });
});
