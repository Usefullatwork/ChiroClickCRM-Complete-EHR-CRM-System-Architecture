/**
 * ComplianceEngine (CompliancePanel) Tests
 *
 * The component lives in assessment/ComplianceEngine.jsx (not clinical/).
 * Tests both the default export (CompliancePanel) and the named export
 * checkCompliance pure function.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <svg data-testid="alert-triangle" />,
  CheckCircle: () => <svg data-testid="check-circle" />,
  XCircle: () => <svg data-testid="x-circle" />,
  Info: () => <svg data-testid="info-icon" />,
  Shield: () => <svg data-testid="shield-icon" />,
  Clock: () => <svg data-testid="clock-icon" />,
  FileText: () => <svg data-testid="file-text-icon" />,
  Zap: () => <svg data-testid="zap-icon" />,
}));

import CompliancePanel, {
  checkCompliance,
  ComplianceIndicator,
  TREATMENT_QUALIFIERS,
  DIAGNOSIS_TREATMENT_RULES,
} from '../../../components/assessment/ComplianceEngine';

// Minimal valid encounter with all required fields
const compliantEncounter = {
  subjective: {
    chief_complaint: 'Lower back pain for 2 weeks',
    history: 'Gradual onset, no trauma',
    onset: '2 weeks ago',
    pain_description: 'Dull aching pain 4/10',
  },
  objective: {
    observation: 'Patient ambulates normally',
    palpation: 'Subluxation at L4, joint dysfunction, motion restriction noted',
    rom: 'Lumbar flexion 40°, extension 20°',
    ortho_tests: 'SLR negative bilaterally',
    neuro_tests: 'Sensation intact',
  },
  plan: {
    treatment: 'Spinal adjustment performed at L4',
    exercises: 'Core strengthening exercises',
    advice: 'Ice 20 minutes TID',
  },
  treatments_selected: ['spinal adjustment'],
  icpc_codes: ['M99.03'],
  icd10_codes: [],
  spinal_findings: { L4: 'subluxation' },
};

const emptyEncounter = {
  subjective: {},
  objective: {},
  plan: {},
  treatments_selected: [],
  icpc_codes: [],
  icd10_codes: [],
};

describe('checkCompliance (pure function)', () => {
  it('should return isCompliant=false when chief complaint is missing', () => {
    const result = checkCompliance(emptyEncounter);
    expect(result.isCompliant).toBe(false);
    const ccIssue = result.issues.find((i) => i.message === 'Chief complaint is required');
    expect(ccIssue).toBeDefined();
  });

  it('should return isCompliant=false when objective findings are missing', () => {
    const result = checkCompliance(emptyEncounter);
    const objIssue = result.issues.find((i) => i.message === 'Objective findings are required');
    expect(objIssue).toBeDefined();
  });

  it('should flag missing adjustment qualifier when adjustment is selected without findings', () => {
    const encounter = {
      ...emptyEncounter,
      subjective: { chief_complaint: 'Back pain' },
      objective: { palpation: 'no findings here' },
      treatments_selected: ['spinal adjustment'],
    };
    const result = checkCompliance(encounter);
    const adjustIssue = result.issues.find((i) => i.type === 'missing_qualifier');
    expect(adjustIssue).toBeDefined();
  });

  it('should detect red flags in subjective text', () => {
    const encounter = {
      ...emptyEncounter,
      subjective: {
        chief_complaint: 'Back pain with bowel incontinence',
        history: '',
      },
    };
    const result = checkCompliance(encounter);
    const redFlag = result.issues.find((i) => i.type === 'red_flag' && i.severity === 'critical');
    expect(redFlag).toBeDefined();
    expect(redFlag.message).toMatch(/cauda equina/i);
  });

  it('should return a compliance score between 0 and 100', () => {
    const result = checkCompliance(compliantEncounter);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should warn when no diagnosis code is selected', () => {
    const encounter = {
      ...compliantEncounter,
      icpc_codes: [],
      icd10_codes: [],
    };
    const result = checkCompliance(encounter);
    const diagWarning = result.warnings.find((w) => w.type === 'missing_diagnosis');
    expect(diagWarning).toBeDefined();
  });

  it('should generate a summary string', () => {
    const result = checkCompliance(emptyEncounter);
    expect(typeof result.summary).toBe('string');
    expect(result.summary.length).toBeGreaterThan(0);
  });
});

describe('CompliancePanel component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Compliance Check heading', () => {
    render(<CompliancePanel encounterData={compliantEncounter} />);
    expect(screen.getByText('Compliance Check')).toBeDefined();
  });

  it('should show score badge', () => {
    render(<CompliancePanel encounterData={compliantEncounter} />);
    // Score badge shows number%
    const badge = screen.getByText(/\d+%/);
    expect(badge).toBeDefined();
  });

  it('should show a summary text in the header', () => {
    // Any encounter renders a summary — verify the element exists
    render(<CompliancePanel encounterData={compliantEncounter} />);
    // Summary is a <p> inside the header button; it has text content
    const summaryEl = document.querySelector('.text-xs.text-gray-600');
    expect(summaryEl).toBeDefined();
    expect(summaryEl.textContent.length).toBeGreaterThan(0);
  });

  it('should show "All compliance checks passed!" for encounter with zero issues/warnings/suggestions', () => {
    // Build an encounter that produces no issues, no warnings, no suggestions:
    // - chief_complaint present (no missing_field issue)
    // - objective findings present (no missing_field issue)
    // - a diagnosis code (M54.9 — not in rules dict, so no diagnosis-treatment rules trigger)
    // - treatments_selected present (no missing_treatment warning)
    // - no time-based treatments (no missing_time warnings)
    const perfectEncounter = {
      subjective: {
        chief_complaint: 'Back pain',
        history: 'Onset 2 weeks ago',
        onset: '2 weeks',
        pain_description: 'Aching',
      },
      objective: {
        observation: 'Normal gait',
        palpation: 'Mild tenderness L4',
        rom: 'Slightly restricted',
        ortho_tests: 'Negative',
        neuro_tests: 'Intact',
      },
      plan: {
        treatment: 'Patient education and advice provided',
        exercises: 'Walking program',
        advice: 'Ice as needed',
      },
      treatments_selected: ['patient education'],
      // M54.9 is not in DIAGNOSIS_TREATMENT_RULES — no extra rules fire
      icpc_codes: ['M54.9'],
      icd10_codes: [],
      spinal_findings: {},
    };
    render(<CompliancePanel encounterData={perfectEncounter} />);
    expect(screen.getByText('All compliance checks passed!')).toBeDefined();
  });

  it('should show issues section when there are compliance problems', () => {
    render(<CompliancePanel encounterData={emptyEncounter} />);
    expect(screen.getByText(/Issues/)).toBeDefined();
  });

  it('should collapse/expand content when header button is clicked', () => {
    // Use emptyEncounter so we know the content section exists (issues section)
    render(<CompliancePanel encounterData={emptyEncounter} />);
    // Initially expanded — issues visible
    expect(screen.getByText(/Issues/)).toBeDefined();
    // Click header to collapse
    fireEvent.click(screen.getByText('Compliance Check').closest('button'));
    expect(screen.queryByText(/Issues/)).toBeNull();
    // Click again to expand
    fireEvent.click(screen.getByText('Compliance Check').closest('button'));
    expect(screen.getByText(/Issues/)).toBeDefined();
  });

  it('should call onApplyAutoInsert when Fix button is clicked', () => {
    const onApply = vi.fn();
    const encounter = {
      ...emptyEncounter,
      subjective: { chief_complaint: 'Back pain' },
      objective: { palpation: '' },
      treatments_selected: ['spinal adjustment'],
    };
    render(<CompliancePanel encounterData={encounter} onApplyAutoInsert={onApply} />);
    const fixButtons = screen.getAllByText('Fix');
    fireEvent.click(fixButtons[0]);
    expect(onApply).toHaveBeenCalled();
  });
});

describe('TREATMENT_QUALIFIERS and DIAGNOSIS_TREATMENT_RULES exports', () => {
  it('should export TREATMENT_QUALIFIERS with adjustment key', () => {
    expect(TREATMENT_QUALIFIERS).toHaveProperty('adjustment');
    expect(TREATMENT_QUALIFIERS.adjustment.auto_insert).toBeDefined();
  });

  it('should export DIAGNOSIS_TREATMENT_RULES with lumbar code', () => {
    expect(DIAGNOSIS_TREATMENT_RULES).toHaveProperty('M99.03');
  });
});
