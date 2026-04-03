/**
 * PlanSection Component Tests
 * Tests assessment fields, diagnosis codes, treatment plan fields, red flags, and informed consent.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => ({
  ClipboardCheck: () => null,
  Target: () => null,
  Activity: () => null,
  AlertTriangle: () => null,
  Plus: () => null,
  Trash2: () => null,
}));
vi.mock('../../../components/ui/PromptDialog', () => ({
  usePrompt: () => vi.fn().mockResolvedValue('New red flag'),
}));

import PlanSection from '../../../components/notes/PlanSection';

const MockSection = ({ title, children }) => (
  <div data-testid={`section-${title}`}>
    <h3>{title}</h3>
    {children}
  </div>
);
const MockTextField = ({ label }) => <div data-testid={`text-${label}`}>{label}</div>;
const MockInputField = ({ label }) => <div data-testid={`input-${label}`}>{label}</div>;
const MockCheckbox = ({ label, checked }) => (
  <div data-testid="mock-checkbox">
    <input type="checkbox" checked={checked} readOnly />
    <span>{label}</span>
  </div>
);

function buildProps(overrides = {}) {
  return {
    consultData: {
      assessment: {
        primaryDiagnosis: '',
        differentialDiagnosis: '',
        clinicalImpression: '',
        redFlags: [],
        severity: '',
        prognosis: '',
        expectedRecoveryTime: '',
      },
      icd10_codes: ['M54.5'],
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
      duration_minutes: 60,
    },
    updateField: vi.fn(),
    updateNestedField: vi.fn(),
    updateRootField: vi.fn(),
    readOnly: false,
    Section: MockSection,
    TextField: MockTextField,
    InputField: MockInputField,
    Checkbox: MockCheckbox,
    addRedFlag: vi.fn(),
    removeRedFlag: vi.fn(),
    handleCodeSelect: vi.fn(),
    removeCode: vi.fn(),
    showCodePicker: false,
    setShowCodePicker: vi.fn(),
    ...overrides,
  };
}

describe('PlanSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders assessment section', () => {
    render(<PlanSection {...buildProps()} />);
    expect(screen.getByText('Vurdering')).toBeTruthy();
  });

  it('renders diagnosis codes section', () => {
    render(<PlanSection {...buildProps()} />);
    expect(screen.getByText('Diagnosekoder')).toBeTruthy();
  });

  it('renders treatment plan section', () => {
    render(<PlanSection {...buildProps()} />);
    expect(screen.getByText('Behandlingsplan')).toBeTruthy();
  });

  it('renders primary diagnosis text field', () => {
    render(<PlanSection {...buildProps()} />);
    expect(screen.getByTestId('text-Primaerdiagnose')).toBeTruthy();
  });

  it('renders severity selector', () => {
    render(<PlanSection {...buildProps()} />);
    expect(screen.getByLabelText('Alvorlighetsgrad')).toBeTruthy();
  });

  it('renders ICD-10 code chips', () => {
    render(<PlanSection {...buildProps()} />);
    expect(screen.getByText('M54.5')).toBeTruthy();
  });

  it('renders red flags section with add button', () => {
    render(<PlanSection {...buildProps()} />);
    expect(screen.getByText(/Legg til r.*dt flagg/)).toBeTruthy();
  });

  it('renders existing red flags', () => {
    const consultData = {
      ...buildProps().consultData,
      assessment: {
        ...buildProps().consultData.assessment,
        redFlags: ['Cauda equina'],
      },
    };
    render(<PlanSection {...buildProps({ consultData })} />);
    expect(screen.getByText('Cauda equina')).toBeTruthy();
  });

  it('renders Legg til kode button', () => {
    render(<PlanSection {...buildProps()} />);
    expect(screen.getByText('Legg til kode')).toBeTruthy();
  });

  it('calls setShowCodePicker when Legg til kode is clicked', () => {
    const setShowCodePicker = vi.fn();
    render(<PlanSection {...buildProps({ setShowCodePicker })} />);
    fireEvent.click(screen.getByText('Legg til kode'));
    expect(setShowCodePicker).toHaveBeenCalledWith(true);
  });

  it('renders informed consent checkbox', () => {
    render(<PlanSection {...buildProps()} />);
    expect(screen.getByTestId('mock-checkbox')).toBeTruthy();
    expect(screen.getByText(/Pasienten er informert/)).toBeTruthy();
  });

  it('renders treatment plan text fields', () => {
    render(<PlanSection {...buildProps()} />);
    expect(screen.getByTestId('text-Kortsiktige mal')).toBeTruthy();
    expect(screen.getByTestId('text-Langsiktige mal')).toBeTruthy();
    expect(screen.getByTestId('text-Foreslatt behandling')).toBeTruthy();
  });

  it('renders empty state when no codes', () => {
    const consultData = { ...buildProps().consultData, icd10_codes: [] };
    render(<PlanSection {...buildProps({ consultData })} />);
    expect(screen.getByText('Ingen koder lagt til')).toBeTruthy();
  });

  it('hides add buttons in readOnly mode', () => {
    render(<PlanSection {...buildProps({ readOnly: true })} />);
    expect(screen.queryByText('Legg til kode')).toBeNull();
  });
});
