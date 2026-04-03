/**
 * ProtocolExamPanels Component Tests
 * Tests rendering of protocol exam panels (exam protocol, cluster tests, regional, neuro full, outcome measures).
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  ClipboardList: () => null,
  Target: () => null,
  PersonStanding: () => null,
  Brain: () => null,
  ChevronDown: () => null,
  ChevronUp: () => null,
}));

const mockPanels = {
  showExamProtocol: false,
  setShowExamProtocol: vi.fn(),
  showClusterTests: false,
  setShowClusterTests: vi.fn(),
  showRegionalExam: false,
  setShowRegionalExam: vi.fn(),
  showNeurologicalExam: false,
  setShowNeurologicalExam: vi.fn(),
  showOutcomeMeasures: false,
  setShowOutcomeMeasures: vi.fn(),
};

const mockExamData = {
  examProtocolData: {},
  setExamProtocolData: vi.fn(),
  clusterTestData: {},
  setClusterTestData: vi.fn(),
  regionalExamData: {},
  setRegionalExamData: vi.fn(),
  neurologicalExamData: {},
  setNeurologicalExamData: vi.fn(),
  outcomeMeasureType: 'ndi',
  setOutcomeMeasureType: vi.fn(),
  outcomeMeasureData: {},
  setOutcomeMeasureData: vi.fn(),
};

vi.mock('../../../../context/ExamPanelContext', () => ({
  useExamPanelContext: () => ({ panels: mockPanels, examData: mockExamData }),
}));

vi.mock('../../../../components/encounter/exam-panels/ExamToggle', () => ({
  default: ({ label, show, children }) => (
    <div data-testid={`toggle-${label.substring(0, 15)}`}>
      {label}
      {show && <div>{children}</div>}
    </div>
  ),
}));

vi.mock('../../../../components/examination/ExaminationProtocol', () => ({
  default: () => <div data-testid="mock-exam-protocol" />,
}));
vi.mock('../../../../components/examination/ClusterTestPanel', () => ({
  default: () => <div data-testid="mock-cluster-tests" />,
}));
vi.mock('../../../../components/examination/RegionalExamination', () => ({
  default: () => <div data-testid="mock-regional-exam" />,
}));
vi.mock('../../../../components/examination/NeurologicalExam', () => ({
  default: () => <div data-testid="mock-neuro-exam" />,
}));
vi.mock('../../../../components/examination/OutcomeMeasures', () => ({
  default: () => <div data-testid="mock-outcome-measures" />,
  OutcomeMeasureSelector: () => <div data-testid="mock-outcome-selector" />,
}));

import ProtocolExamPanels from '../../../../components/encounter/exam-panels/ProtocolExamPanels';

function buildProps(overrides = {}) {
  return {
    isSigned: false,
    updateField: vi.fn(),
    encounterData: {
      objective: { palpation: '', ortho_tests: '', neuro_tests: '' },
      assessment: { clinical_reasoning: '' },
    },
    ...overrides,
  };
}

describe('ProtocolExamPanels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockPanels).forEach((key) => {
      if (typeof mockPanels[key] === 'boolean') mockPanels[key] = false;
    });
  });

  it('renders all six protocol exam toggle panels', () => {
    render(<ProtocolExamPanels {...buildProps()} />);
    expect(screen.getByText(/kelsesprotokoll/)).toBeTruthy();
    expect(screen.getByText(/Diagnostiske Klynge/)).toBeTruthy();
    expect(screen.getByText(/Regional unders/)).toBeTruthy();
    expect(screen.getByText(/Nevrologisk unders/)).toBeTruthy();
    expect(screen.getByText(/NDI\/ODI/)).toBeTruthy();
  });

  it('shows exam protocol when expanded', () => {
    mockPanels.showExamProtocol = true;
    render(<ProtocolExamPanels {...buildProps()} />);
    expect(screen.getByTestId('mock-exam-protocol')).toBeTruthy();
  });

  it('shows outcome measures with selector when expanded', () => {
    mockPanels.showOutcomeMeasures = true;
    render(<ProtocolExamPanels {...buildProps()} />);
    expect(screen.getByTestId('mock-outcome-selector')).toBeTruthy();
    expect(screen.getByTestId('mock-outcome-measures')).toBeTruthy();
  });
});
