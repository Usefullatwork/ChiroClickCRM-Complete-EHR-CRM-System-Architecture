/**
 * EasyAssessmentModals Component Tests
 * Tests rendering of various modal containers based on visibility flags.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => ({
  X: () => null,
  Shield: () => null,
  Command: () => null,
  Mic: () => null,
}));

vi.mock('../../../components/assessment/ComplianceEngine', () => ({
  default: () => <div data-testid="mock-compliance-panel" />,
}));
vi.mock('../../../components/assessment/OutcomeAssessment', () => ({
  default: () => <div data-testid="mock-outcome-assessment" />,
}));
vi.mock('../../../components/TemplatePicker', () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="mock-template-picker" /> : null),
}));
vi.mock('../../../components/assessment/MacroMatrix', () => ({
  default: () => <div data-testid="mock-macro-matrix" />,
}));
vi.mock('../../../components/assessment/BodyChart', () => ({
  default: () => <div data-testid="mock-body-chart" />,
}));
vi.mock('../../../components/assessment/TemplateLibrary', () => ({
  default: () => <div data-testid="mock-template-library" />,
}));
vi.mock('../../../components/assessment/PrintPreview', () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="mock-print-preview" /> : null),
}));
vi.mock('../../../components/assessment/AIScribe', () => ({
  default: () => <div data-testid="mock-ai-scribe" />,
}));
vi.mock('../../../components/assessment/AISettings', () => ({
  default: () => <div data-testid="mock-ai-settings" />,
}));
vi.mock('../../../components/assessment/SlashCommands', () => ({
  SlashCommandReference: () => <div data-testid="mock-slash-commands" />,
}));

import { EasyAssessmentModals } from '../../../components/easyassessment/EasyAssessmentModals';

function buildProps(overrides = {}) {
  return {
    showOutcomeAssessment: false,
    setShowOutcomeAssessment: vi.fn(),
    showTemplatePicker: false,
    setShowTemplatePicker: vi.fn(),
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
    outcomeType: 'NDI',
    encounterData: {
      subjective: { chief_complaint: '', history: '' },
      objective: { observation: '' },
      assessment: { clinical_reasoning: '' },
      plan: { treatment: '' },
      outcome_assessment: null,
      body_chart: null,
    },
    setEncounterData: vi.fn(),
    activeTab: 'subjective',
    updateField: vi.fn(),
    language: 'no',
    macroFavorites: [],
    setMacroFavorites: vi.fn(),
    handleMacroInsert: vi.fn(),
    handleComplianceAutoFix: vi.fn(),
    patient: { data: { first_name: 'Ola', last_name: 'Nordmann' } },
    ...overrides,
  };
}

describe('EasyAssessmentModals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing visible when all modals are closed', () => {
    const { container } = render(<EasyAssessmentModals {...buildProps()} />);
    expect(screen.queryByTestId('mock-outcome-assessment')).toBeNull();
    expect(screen.queryByTestId('mock-body-chart')).toBeNull();
    expect(screen.queryByTestId('mock-macro-matrix')).toBeNull();
  });

  it('renders outcome assessment modal when shown', async () => {
    render(<EasyAssessmentModals {...buildProps({ showOutcomeAssessment: true })} />);
    await waitFor(() => expect(screen.getByText('NDI Assessment')).toBeTruthy());
    expect(screen.getByTestId('mock-outcome-assessment')).toBeTruthy();
  });

  it('closes outcome assessment modal on Done click', async () => {
    const setShowOutcomeAssessment = vi.fn();
    render(
      <EasyAssessmentModals
        {...buildProps({ showOutcomeAssessment: true, setShowOutcomeAssessment })}
      />
    );
    await waitFor(() => expect(screen.getByText('Done')).toBeTruthy());
    fireEvent.click(screen.getByText('Done'));
    expect(setShowOutcomeAssessment).toHaveBeenCalledWith(false);
  });

  it('renders body chart modal when shown', async () => {
    render(<EasyAssessmentModals {...buildProps({ showBodyChart: true })} />);
    await waitFor(() =>
      expect(screen.getByText('Body Chart - Annotate Pain Locations')).toBeTruthy()
    );
  });

  it('renders macro matrix modal when shown', async () => {
    render(<EasyAssessmentModals {...buildProps({ showMacroMatrix: true })} />);
    await waitFor(() => expect(screen.getByText(/Makromatrise/)).toBeTruthy());
  });

  it('renders compliance panel modal when shown', async () => {
    render(<EasyAssessmentModals {...buildProps({ showCompliancePanel: true })} />);
    await waitFor(() => expect(screen.getByText('Samsvarskontroll')).toBeTruthy());
    expect(screen.getByTestId('mock-compliance-panel')).toBeTruthy();
  });

  it('renders slash command reference modal when shown', async () => {
    render(<EasyAssessmentModals {...buildProps({ showSlashReference: true })} />);
    await waitFor(() => expect(screen.getByTestId('mock-slash-commands')).toBeTruthy());
  });

  it('renders AI scribe modal when shown', async () => {
    render(<EasyAssessmentModals {...buildProps({ showAIScribe: true })} />);
    await waitFor(() => expect(screen.getByText('AI Stemmeskriver')).toBeTruthy());
  });

  it('renders AI settings modal when shown', async () => {
    render(<EasyAssessmentModals {...buildProps({ showAISettings: true })} />);
    await waitFor(() => expect(screen.getByTestId('mock-ai-settings')).toBeTruthy());
  });
});
