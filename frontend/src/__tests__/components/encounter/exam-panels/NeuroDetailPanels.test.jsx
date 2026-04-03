/**
 * NeuroDetailPanels Component Tests
 * Tests rendering of neurological detail panels (MMT, DTR, sensory, cranial, coordination, nerve tension).
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  Activity: () => null,
  Brain: () => null,
  ChevronDown: () => null,
  ChevronUp: () => null,
}));

const mockPanels = {
  showMMT: false,
  setShowMMT: vi.fn(),
  showDTR: false,
  setShowDTR: vi.fn(),
  showSensoryExam: false,
  setShowSensoryExam: vi.fn(),
  showCranialNerves: false,
  setShowCranialNerves: vi.fn(),
  showCoordination: false,
  setShowCoordination: vi.fn(),
  showNerveTension: false,
  setShowNerveTension: vi.fn(),
};

const mockExamData = {
  mmtData: {},
  setMmtData: vi.fn(),
  dtrData: {},
  setDtrData: vi.fn(),
  sensoryExamData: {},
  setSensoryExamData: vi.fn(),
  cranialNerveData: {},
  setCranialNerveData: vi.fn(),
  coordinationData: {},
  setCoordinationData: vi.fn(),
  nerveTensionData: {},
  setNerveTensionData: vi.fn(),
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

vi.mock('../../../../components/examination/ManualMuscleTesting', () => ({
  default: () => <div data-testid="mock-mmt" />,
}));
vi.mock('../../../../components/examination/DeepTendonReflexPanel', () => ({
  default: () => <div data-testid="mock-dtr" />,
}));
vi.mock('../../../../components/examination/SensoryExamination', () => ({
  default: () => <div data-testid="mock-sensory" />,
}));
vi.mock('../../../../components/examination/CranialNervePanel', () => ({
  default: () => <div data-testid="mock-cranial" />,
}));
vi.mock('../../../../components/examination/CoordinationTestPanel', () => ({
  default: () => <div data-testid="mock-coordination" />,
}));
vi.mock('../../../../components/examination/NerveTensionTests', () => ({
  default: () => <div data-testid="mock-nerve-tension" />,
}));

import NeuroDetailPanels from '../../../../components/encounter/exam-panels/NeuroDetailPanels';

function buildProps(overrides = {}) {
  return {
    isSigned: false,
    updateField: vi.fn(),
    encounterData: { objective: { neuro_tests: '' } },
    ...overrides,
  };
}

describe('NeuroDetailPanels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockPanels).forEach((key) => {
      if (typeof mockPanels[key] === 'boolean') mockPanels[key] = false;
    });
  });

  it('renders all six neuro exam toggle panels', () => {
    render(<NeuroDetailPanels {...buildProps()} />);
    expect(screen.getByText(/Manuell Muskeltesting/)).toBeTruthy();
    expect(screen.getByText(/Dype Senereflekser/)).toBeTruthy();
    expect(screen.getByText(/Sensibilitetsunders/)).toBeTruthy();
    expect(screen.getByText(/Hjernenerver/)).toBeTruthy();
    expect(screen.getByText(/Koordinasjonstester/)).toBeTruthy();
    expect(screen.getByText(/Nervestrekkstester/)).toBeTruthy();
  });

  it('does not render panel content when collapsed', () => {
    render(<NeuroDetailPanels {...buildProps()} />);
    expect(screen.queryByTestId('mock-mmt')).toBeNull();
    expect(screen.queryByTestId('mock-dtr')).toBeNull();
  });

  it('shows MMT panel content when expanded', () => {
    mockPanels.showMMT = true;
    render(<NeuroDetailPanels {...buildProps()} />);
    expect(screen.getByTestId('mock-mmt')).toBeTruthy();
  });

  it('shows DTR panel content when expanded', () => {
    mockPanels.showDTR = true;
    render(<NeuroDetailPanels {...buildProps()} />);
    expect(screen.getByTestId('mock-dtr')).toBeTruthy();
  });
});
