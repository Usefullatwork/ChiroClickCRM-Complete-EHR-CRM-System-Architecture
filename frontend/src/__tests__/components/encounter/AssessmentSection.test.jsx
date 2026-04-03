/**
 * AssessmentSection Component Tests
 * Tests rendering of diagnosis panel, suggested codes, and clinical reasoning fields.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// AssessmentSection.jsx uses useTranslation without importing it (missing import in source)
// Provide it as a global so the component can find it at runtime
globalThis.useTranslation = () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() });

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => ({
  Search: () => null,
  Check: () => null,
  X: () => null,
}));
vi.mock('../../../components/clinical/EnhancedClinicalTextarea', () => ({
  default: ({ label, placeholder }) => (
    <div data-testid="mock-clinical-textarea">{label || placeholder}</div>
  ),
}));
vi.mock('../../../components/encounter/DiagnosisPanel', () => ({
  DiagnosisPanel: (props) => <div data-testid="mock-diagnosis-panel" />,
}));

import { AssessmentSection } from '../../../components/encounter/AssessmentSection';

function buildProps(overrides = {}) {
  return {
    encounterData: {
      icpc_codes: [],
      assessment: { clinical_reasoning: '', differential_diagnosis: '' },
    },
    isSigned: false,
    updateField: vi.fn(),
    diagnosisSearch: '',
    setDiagnosisSearch: vi.fn(),
    showDiagnosisDropdown: false,
    setShowDiagnosisDropdown: vi.fn(),
    filteredDiagnoses: [],
    toggleDiagnosis: vi.fn(),
    removeDiagnosisCode: vi.fn(),
    suggestedCodes: [],
    patientId: 'p1',
    ...overrides,
  };
}

describe('AssessmentSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the assessment section with A badge', () => {
    render(<AssessmentSection {...buildProps()} />);
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText(/Vurdering & Diagnose/)).toBeTruthy();
  });

  it('renders the data-testid', () => {
    render(<AssessmentSection {...buildProps()} />);
    expect(screen.getByTestId('encounter-assessment')).toBeTruthy();
  });

  it('renders the DiagnosisPanel mock', () => {
    render(<AssessmentSection {...buildProps()} />);
    expect(screen.getByTestId('mock-diagnosis-panel')).toBeTruthy();
  });

  it('renders the clinical textarea mock', () => {
    render(<AssessmentSection {...buildProps()} />);
    expect(screen.getByTestId('mock-clinical-textarea')).toBeTruthy();
  });

  it('renders the differential diagnosis input', () => {
    render(<AssessmentSection {...buildProps()} />);
    expect(screen.getByPlaceholderText('Differensialdiagnoser...')).toBeTruthy();
  });

  it('shows suggested codes when available and not signed', () => {
    const suggestedCodes = [
      {
        diagnosis_code: 'L02',
        diagnosis_name: 'Korsryggsmerter',
        matching_regions: 2,
        avg_confidence: 0.85,
      },
    ];
    render(<AssessmentSection {...buildProps({ suggestedCodes })} />);
    expect(screen.getByText('L02')).toBeTruthy();
    expect(screen.getByText('Korsryggsmerter')).toBeTruthy();
  });

  it('hides suggested codes when signed', () => {
    const suggestedCodes = [
      {
        diagnosis_code: 'L02',
        diagnosis_name: 'Korsryggsmerter',
        matching_regions: 2,
        avg_confidence: 0.85,
      },
    ];
    render(<AssessmentSection {...buildProps({ suggestedCodes, isSigned: true })} />);
    expect(screen.queryByText('L02')).toBeNull();
  });

  it('filters out already-selected suggested codes', () => {
    const suggestedCodes = [
      {
        diagnosis_code: 'L02',
        diagnosis_name: 'Korsryggsmerter',
        matching_regions: 2,
        avg_confidence: 0.85,
      },
    ];
    const encounterData = {
      icpc_codes: ['L02'],
      assessment: { clinical_reasoning: '', differential_diagnosis: '' },
    };
    render(<AssessmentSection {...buildProps({ suggestedCodes, encounterData })} />);
    expect(screen.queryByText('Korsryggsmerter')).toBeNull();
  });
});
