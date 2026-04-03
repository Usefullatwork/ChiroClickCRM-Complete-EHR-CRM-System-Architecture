/**
 * EasyAssessmentHeader Component Tests
 * Tests patient display, language toggle, view mode buttons, save button, and action controls.
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
  Save: () => null,
  Globe: () => null,
  ChevronLeft: () => null,
  Printer: () => null,
  Copy: () => null,
  Grid: () => null,
  Mic: () => null,
  Cpu: () => null,
}));

vi.mock('../../../components/assessment/TreatmentPlanTracker', () => ({
  VisitCounter: () => <div data-testid="mock-visit-counter" />,
}));
vi.mock('../../../components/assessment/SALTButton', () => ({
  default: () => <div data-testid="mock-salt-button" />,
}));
vi.mock('../../../components/assessment/ComplianceEngine', () => ({
  ComplianceIndicator: () => <div data-testid="mock-compliance" />,
}));
vi.mock('../../../components/assessment/AISettings', () => ({
  AIStatusIndicator: () => <div data-testid="mock-ai-status" />,
}));

import EasyAssessmentHeader from '../../../components/easyassessment/EasyAssessmentHeader';

function buildProps(overrides = {}) {
  return {
    patient: { data: { first_name: 'Ola', last_name: 'Nordmann', date_of_birth: '1990-01-01' } },
    treatmentPlan: null,
    currentVisitNumber: 3,
    patientId: 'p1',
    navigate: vi.fn(),
    language: 'no',
    setLanguage: vi.fn(),
    previousEncounter: null,
    handleSALTApply: vi.fn(),
    setShowAISettings: vi.fn(),
    setShowAIScribe: vi.fn(),
    setShowCompliancePanel: vi.fn(),
    setShowMacroMatrix: vi.fn(),
    viewMode: 'easy',
    setViewMode: vi.fn(),
    setShowPrintPreview: vi.fn(),
    copyToClipboard: vi.fn(),
    copiedToClipboard: false,
    handleSave: vi.fn(),
    saveMutation: { isLoading: false },
    encounterData: {},
    ...overrides,
  };
}

describe('EasyAssessmentHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders patient name', () => {
    render(<EasyAssessmentHeader {...buildProps()} />);
    expect(screen.getByText('Ola Nordmann')).toBeTruthy();
  });

  it('navigates back on chevron click', () => {
    const navigate = vi.fn();
    render(<EasyAssessmentHeader {...buildProps({ navigate })} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(navigate).toHaveBeenCalledWith('/patients/p1');
  });

  it('renders language toggle button', () => {
    render(<EasyAssessmentHeader {...buildProps()} />);
    expect(screen.getByTitle(/Bytt til Engelsk/)).toBeTruthy();
  });

  it('toggles language when button is clicked', () => {
    const setLanguage = vi.fn();
    render(<EasyAssessmentHeader {...buildProps({ setLanguage })} />);
    fireEvent.click(screen.getByTitle(/Bytt til Engelsk/));
    expect(setLanguage).toHaveBeenCalledWith('en');
  });

  it('renders view mode buttons (Enkel, Detaljert, Forhåndsvisning)', () => {
    render(<EasyAssessmentHeader {...buildProps()} />);
    expect(screen.getByText('Enkel')).toBeTruthy();
    expect(screen.getByText('Detaljert')).toBeTruthy();
  });

  it('calls setViewMode when a mode button is clicked', () => {
    const setViewMode = vi.fn();
    render(<EasyAssessmentHeader {...buildProps({ setViewMode })} />);
    fireEvent.click(screen.getByText('Detaljert'));
    expect(setViewMode).toHaveBeenCalledWith('detailed');
  });

  it('renders copy button with Kopier text', () => {
    render(<EasyAssessmentHeader {...buildProps()} />);
    expect(screen.getByText('Kopier')).toBeTruthy();
  });

  it('shows Kopiert! when copiedToClipboard is true', () => {
    render(<EasyAssessmentHeader {...buildProps({ copiedToClipboard: true })} />);
    expect(screen.getByText('Kopiert!')).toBeTruthy();
  });

  it('calls handleSave when save button is clicked', () => {
    const handleSave = vi.fn();
    render(<EasyAssessmentHeader {...buildProps({ handleSave })} />);
    const saveBtn = screen.getByText('save').closest('button');
    fireEvent.click(saveBtn);
    expect(handleSave).toHaveBeenCalledTimes(1);
  });

  it('disables save button when saveMutation.isLoading', () => {
    render(<EasyAssessmentHeader {...buildProps({ saveMutation: { isLoading: true } })} />);
    const saveBtn = screen.getByText('saving').closest('button');
    expect(saveBtn.disabled).toBe(true);
  });

  it('renders SALT button mock', () => {
    render(<EasyAssessmentHeader {...buildProps()} />);
    expect(screen.getByTestId('mock-salt-button')).toBeTruthy();
  });

  it('renders compliance indicator mock', () => {
    render(<EasyAssessmentHeader {...buildProps()} />);
    expect(screen.getByTestId('mock-compliance')).toBeTruthy();
  });

  it('renders active badge', () => {
    render(<EasyAssessmentHeader {...buildProps()} />);
    expect(screen.getByText('active')).toBeTruthy();
  });
});
