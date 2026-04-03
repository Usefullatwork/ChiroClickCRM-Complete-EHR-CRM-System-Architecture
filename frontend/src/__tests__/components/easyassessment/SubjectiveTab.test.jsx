/**
 * SubjectiveTab Component Tests
 * Tests rendering of subjective fields, body chart, quick checkbox grids, and AI intake button.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => ({
  Sparkles: () => null,
}));

vi.mock('../../../components/assessment/QuickCheckboxGrid', () => {
  const component = ({ title }) => <div data-testid={`mock-checkbox-${title}`}>{title}</div>;
  component.PAIN_QUALITY_OPTIONS = [];
  component.AGGRAVATING_FACTORS_OPTIONS = [];
  component.RELIEVING_FACTORS_OPTIONS = [];
  return {
    default: component,
    PAIN_QUALITY_OPTIONS: [],
    AGGRAVATING_FACTORS_OPTIONS: [],
    RELIEVING_FACTORS_OPTIONS: [],
  };
});
vi.mock('../../../components/assessment/SmartTextInput', () => {
  const component = ({ label }) => <div data-testid={`mock-smart-text-${label}`}>{label}</div>;
  component.CHIEF_COMPLAINT_PHRASES = [];
  component.ONSET_PHRASES = [];
  component.HISTORY_PHRASES = [];
  return {
    default: component,
    CHIEF_COMPLAINT_PHRASES: [],
    ONSET_PHRASES: [],
    HISTORY_PHRASES: [],
  };
});
vi.mock('../../../components/assessment/BodyDiagram', () => {
  const component = () => <div data-testid="mock-body-diagram" />;
  component.QuickRegionSelect = () => <div data-testid="mock-quick-region" />;
  return { default: component, QuickRegionSelect: component.QuickRegionSelect };
});
vi.mock('../../../components/assessment/BodyChart', () => ({
  BodyChartGallery: () => <div data-testid="mock-body-chart-gallery" />,
}));
vi.mock('../../../components/assessment/IntakeParser', () => ({
  IntakeParserButton: () => <div data-testid="mock-intake-parser" />,
}));

import SubjectiveTab from '../../../components/easyassessment/SubjectiveTab';

function buildProps(overrides = {}) {
  return {
    encounterData: {
      subjective: { chief_complaint: '', history: '', onset: '' },
      vas_pain_start: 5,
      pain_locations: [],
      pain_qualities: [],
      aggravating_factors_selected: [],
      relieving_factors_selected: [],
      body_chart: { markers: [], annotations: [] },
    },
    viewMode: 'easy',
    language: 'no',
    aiAvailable: true,
    updateField: vi.fn(),
    updateQuickSelect: vi.fn(),
    buildAIContext: vi.fn(),
    setShowBodyChart: vi.fn(),
    ...overrides,
  };
}

describe('SubjectiveTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the intake parser button area', () => {
    render(<SubjectiveTab {...buildProps()} />);
    expect(screen.getByTestId('mock-intake-parser')).toBeTruthy();
  });

  it('renders Norwegian AI generate text', () => {
    render(<SubjectiveTab {...buildProps()} />);
    expect(screen.getByText('Generer Subjektiv fra pasientopptak')).toBeTruthy();
  });

  it('renders English AI generate text when language is en', () => {
    render(<SubjectiveTab {...buildProps({ language: 'en' })} />);
    expect(screen.getByText('Generate Subjective from patient intake')).toBeTruthy();
  });

  it('renders chief complaint SmartTextInput', () => {
    render(<SubjectiveTab {...buildProps()} />);
    expect(screen.getByTestId('mock-smart-text-Hovedklage')).toBeTruthy();
  });

  it('renders history SmartTextInput', () => {
    render(<SubjectiveTab {...buildProps()} />);
    expect(screen.getByTestId('mock-smart-text-Sykehistorie')).toBeTruthy();
  });

  it('renders onset SmartTextInput', () => {
    render(<SubjectiveTab {...buildProps()} />);
    expect(screen.getByTestId('mock-smart-text-Debut')).toBeTruthy();
  });

  it('renders quick checkbox grids in easy mode', () => {
    render(<SubjectiveTab {...buildProps({ viewMode: 'easy' })} />);
    expect(screen.getByText('Pain Quality')).toBeTruthy();
    expect(screen.getByText('Aggravating Factors')).toBeTruthy();
    expect(screen.getByText('Relieving Factors')).toBeTruthy();
  });

  it('hides quick checkbox grids in detailed mode', () => {
    render(<SubjectiveTab {...buildProps({ viewMode: 'detailed' })} />);
    expect(screen.queryByText('Pain Quality')).toBeNull();
  });

  it('renders body chart gallery', () => {
    render(<SubjectiveTab {...buildProps()} />);
    expect(screen.getByTestId('mock-body-chart-gallery')).toBeTruthy();
  });

  it('renders body diagram and quick region select', () => {
    render(<SubjectiveTab {...buildProps()} />);
    expect(screen.getByTestId('mock-body-diagram')).toBeTruthy();
    expect(screen.getByTestId('mock-quick-region')).toBeTruthy();
  });

  it('renders the Kroppskart label', () => {
    render(<SubjectiveTab {...buildProps()} />);
    expect(screen.getByText('Kroppskart')).toBeTruthy();
  });
});
