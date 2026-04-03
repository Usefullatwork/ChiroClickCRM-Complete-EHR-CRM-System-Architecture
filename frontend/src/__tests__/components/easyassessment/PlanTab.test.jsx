/**
 * PlanTab Component Tests
 * Tests rendering in easy vs detailed modes, treatment/exercise grids, and advice/followup fields.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => ({}));

vi.mock('../../../components/assessment/QuickCheckboxGrid', () => {
  const component = ({ title }) => <div data-testid={`mock-qcg-${title}`}>{title}</div>;
  component.TREATMENT_OPTIONS = [];
  component.EXERCISE_OPTIONS = [];
  return { default: component, TREATMENT_OPTIONS: [], EXERCISE_OPTIONS: [] };
});
vi.mock('../../../components/assessment/SmartTextInput', () => {
  const component = ({ label }) => <div data-testid={`mock-smart-${label}`}>{label}</div>;
  component.ADVICE_PHRASES = [];
  component.FOLLOW_UP_PHRASES = [];
  return { default: component, ADVICE_PHRASES: [], FOLLOW_UP_PHRASES: [] };
});

import PlanTab from '../../../components/easyassessment/PlanTab';

function buildProps(overrides = {}) {
  return {
    encounterData: {
      plan: { treatment: '', exercises: '', advice: '', follow_up: '' },
      treatments_selected: [],
      exercises_selected: [],
    },
    viewMode: 'easy',
    language: 'no',
    aiAvailable: true,
    updateField: vi.fn(),
    updateQuickSelect: vi.fn(),
    buildAIContext: vi.fn(),
    ...overrides,
  };
}

describe('PlanTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders quick checkbox grids in easy mode', () => {
    render(<PlanTab {...buildProps()} />);
    expect(screen.getByText(/Utf.*rt behandling/)).toBeTruthy();
    expect(screen.getByText(/Hjemme.*velser/)).toBeTruthy();
  });

  it('renders SmartTextInputs in detailed mode', () => {
    render(<PlanTab {...buildProps({ viewMode: 'detailed' })} />);
    expect(screen.getByText('Behandling')).toBeTruthy();
  });

  it('hides checkbox grids in detailed mode', () => {
    render(<PlanTab {...buildProps({ viewMode: 'detailed' })} />);
    expect(screen.queryByTestId(/mock-qcg/)).toBeNull();
  });

  it('renders advice SmartTextInput in both modes', () => {
    render(<PlanTab {...buildProps()} />);
    expect(screen.getByTestId('mock-smart-R\u00e5d')).toBeTruthy();
  });

  it('renders followup SmartTextInput in both modes', () => {
    render(<PlanTab {...buildProps()} />);
    expect(screen.getByTestId('mock-smart-Oppf\u00f8lging')).toBeTruthy();
  });

  it('renders advice and followup in detailed mode', () => {
    render(<PlanTab {...buildProps({ viewMode: 'detailed' })} />);
    expect(screen.getByTestId('mock-smart-R\u00e5d')).toBeTruthy();
    expect(screen.getByTestId('mock-smart-Oppf\u00f8lging')).toBeTruthy();
  });
});
