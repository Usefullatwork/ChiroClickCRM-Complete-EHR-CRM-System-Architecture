/**
 * AssessmentTab Component Tests
 * Tests diagnosis code selection, clinical reasoning fields, VAS display, and outcome measures.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => ({}));

vi.mock('../../../components/assessment/SmartTextInput', () => {
  const component = ({ label }) => <div data-testid={`mock-smart-${label}`}>{label}</div>;
  component.CLINICAL_REASONING_PHRASES = [];
  return { default: component, CLINICAL_REASONING_PHRASES: [] };
});
vi.mock('../../../components/assessment/VASPainScale', () => ({
  VASComparisonDisplay: ({ startValue, endValue }) => (
    <div data-testid="mock-vas">
      VAS:{startValue}-{endValue}
    </div>
  ),
}));
vi.mock('../../../components/assessment/OutcomeAssessment', () => ({
  QUESTIONNAIRE_TYPES: { NDI: 'NDI', ODI: 'ODI', DASH: 'DASH' },
}));

import AssessmentTab from '../../../components/easyassessment/AssessmentTab';

function buildProps(overrides = {}) {
  return {
    encounterData: {
      icpc_codes: ['L02'],
      assessment: { clinical_reasoning: '', differential_diagnosis: '', prognosis: '' },
      vas_pain_start: 7,
      vas_pain_end: 3,
    },
    _setEncounterData: vi.fn(),
    language: 'no',
    aiAvailable: true,
    updateField: vi.fn(),
    addDiagnosisCode: vi.fn(),
    removeDiagnosisCode: vi.fn(),
    commonDiagnoses: { data: [{ code: 'L03', description_no: 'Lumbago' }] },
    buildAIContext: vi.fn(),
    _showOutcomeAssessment: false,
    setShowOutcomeAssessment: vi.fn(),
    _outcomeType: 'NDI',
    setOutcomeType: vi.fn(),
    ...overrides,
  };
}

describe('AssessmentTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the diagnosis label', () => {
    render(<AssessmentTab {...buildProps()} />);
    expect(screen.getByText('Diagnose (ICPC-2 / ICD-10)')).toBeTruthy();
  });

  it('renders the diagnosis selector with options', () => {
    render(<AssessmentTab {...buildProps()} />);
    expect(screen.getByText('Velg diagnose...')).toBeTruthy();
    expect(screen.getByText('L03 - Lumbago')).toBeTruthy();
  });

  it('calls addDiagnosisCode when a diagnosis is selected', () => {
    const addDiagnosisCode = vi.fn();
    render(<AssessmentTab {...buildProps({ addDiagnosisCode })} />);
    const select = screen.getByText('Velg diagnose...').closest('select');
    fireEvent.change(select, { target: { value: 'L03' } });
    expect(addDiagnosisCode).toHaveBeenCalledWith('L03');
  });

  it('renders existing diagnosis code chips', () => {
    render(<AssessmentTab {...buildProps()} />);
    expect(screen.getByText('L02')).toBeTruthy();
  });

  it('calls removeDiagnosisCode when x is clicked on code chip', () => {
    const removeDiagnosisCode = vi.fn();
    render(<AssessmentTab {...buildProps({ removeDiagnosisCode })} />);
    const removeBtn = screen.getByText('x');
    fireEvent.click(removeBtn);
    expect(removeDiagnosisCode).toHaveBeenCalledWith('L02');
  });

  it('renders clinical reasoning SmartTextInput', () => {
    render(<AssessmentTab {...buildProps()} />);
    expect(screen.getByText('Klinisk resonnement')).toBeTruthy();
  });

  it('renders differential diagnosis SmartTextInput', () => {
    render(<AssessmentTab {...buildProps()} />);
    expect(screen.getByText('Differensialdiagnose')).toBeTruthy();
  });

  it('renders prognosis SmartTextInput', () => {
    render(<AssessmentTab {...buildProps()} />);
    expect(screen.getByText('Prognose')).toBeTruthy();
  });

  it('renders VAS comparison display with correct values', () => {
    render(<AssessmentTab {...buildProps()} />);
    expect(screen.getByTestId('mock-vas').textContent).toContain('VAS:7-3');
  });

  it('renders outcome assessment buttons (NDI, ODI, DASH)', () => {
    render(<AssessmentTab {...buildProps()} />);
    expect(screen.getByText('NDI')).toBeTruthy();
    expect(screen.getByText('ODI')).toBeTruthy();
    expect(screen.getByText('DASH')).toBeTruthy();
  });

  it('calls setOutcomeType and setShowOutcomeAssessment on outcome button click', () => {
    const setOutcomeType = vi.fn();
    const setShowOutcomeAssessment = vi.fn();
    render(<AssessmentTab {...buildProps({ setOutcomeType, setShowOutcomeAssessment })} />);
    fireEvent.click(screen.getByText('NDI'));
    expect(setOutcomeType).toHaveBeenCalledWith('NDI');
    expect(setShowOutcomeAssessment).toHaveBeenCalledWith(true);
  });
});
