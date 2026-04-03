/**
 * ObjectiveTab Component Tests
 * Tests rendering in easy vs detailed modes, checkbox grids, and spine diagram.
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
  component.OBSERVATION_FINDINGS_OPTIONS = [];
  component.PALPATION_FINDINGS_OPTIONS = [];
  component.ROM_FINDINGS_OPTIONS = [];
  component.ORTHO_TESTS_OPTIONS = [];
  component.NEURO_TESTS_OPTIONS = [];
  return {
    default: component,
    OBSERVATION_FINDINGS_OPTIONS: [],
    PALPATION_FINDINGS_OPTIONS: [],
    ROM_FINDINGS_OPTIONS: [],
    ORTHO_TESTS_OPTIONS: [],
    NEURO_TESTS_OPTIONS: [],
  };
});
vi.mock('../../../components/assessment/SmartTextInput', () => ({
  default: ({ label }) => <div data-testid={`mock-smart-${label}`}>{label}</div>,
}));
vi.mock('../../../components/assessment/SpineDiagram', () => ({
  default: () => <div data-testid="mock-spine-diagram" />,
}));

import ObjectiveTab from '../../../components/easyassessment/ObjectiveTab';

function buildProps(overrides = {}) {
  return {
    encounterData: {
      objective: { observation: '', palpation: '', rom: '', ortho_tests: '' },
      observation_findings: [],
      palpation_findings: [],
      rom_findings: [],
      ortho_tests_selected: [],
      neuro_tests_selected: [],
      spinal_findings: {},
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

describe('ObjectiveTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders quick checkbox grids in easy mode', () => {
    render(<ObjectiveTab {...buildProps()} />);
    expect(screen.getByText('Observasjon')).toBeTruthy();
    expect(screen.getByText('Palpasjon')).toBeTruthy();
    expect(screen.getByText('Leddutslag (ROM)')).toBeTruthy();
    expect(screen.getByText('Ortopediske tester')).toBeTruthy();
    expect(screen.getByText('Nevrologisk')).toBeTruthy();
  });

  it('renders SmartTextInputs in detailed mode', () => {
    render(<ObjectiveTab {...buildProps({ viewMode: 'detailed' })} />);
    expect(screen.getByTestId('mock-smart-Observasjon')).toBeTruthy();
    expect(screen.getByTestId('mock-smart-Palpasjon')).toBeTruthy();
    expect(screen.getByTestId('mock-smart-Leddutslag (ROM)')).toBeTruthy();
    expect(screen.getByTestId('mock-smart-Ortopediske tester')).toBeTruthy();
  });

  it('hides checkbox grids in detailed mode', () => {
    render(<ObjectiveTab {...buildProps({ viewMode: 'detailed' })} />);
    expect(screen.queryByTestId('mock-qcg-Observasjon')).toBeNull();
  });

  it('renders the spine diagram in both modes', () => {
    render(<ObjectiveTab {...buildProps()} />);
    expect(screen.getByTestId('mock-spine-diagram')).toBeTruthy();
  });

  it('renders spine diagram in detailed mode', () => {
    render(<ObjectiveTab {...buildProps({ viewMode: 'detailed' })} />);
    expect(screen.getByTestId('mock-spine-diagram')).toBeTruthy();
  });
});
