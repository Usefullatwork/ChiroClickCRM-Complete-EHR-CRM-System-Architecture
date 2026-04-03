/**
 * CoreExamPanels Component Tests
 * Tests rendering of core exam panels (anatomy, ortho, neuro, ROM, body diagram)
 * with mocked ExamPanelContext.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  Bone: () => null,
  Activity: () => null,
  Ruler: () => null,
  PersonStanding: () => null,
  Stethoscope: () => null,
  ChevronDown: () => null,
  ChevronUp: () => null,
}));

const mockPanels = {
  showAnatomyPanel: false,
  setShowAnatomyPanel: vi.fn(),
  showOrthoExam: false,
  setShowOrthoExam: vi.fn(),
  showNeuroExam: false,
  setShowNeuroExam: vi.fn(),
  showROMTable: false,
  setShowROMTable: vi.fn(),
  showBodyDiagram: false,
  setShowBodyDiagram: vi.fn(),
};

const mockExamData = {
  orthoExamData: {},
  neuroExamData: {},
  romTableData: {},
  setRomTableData: vi.fn(),
  bodyDiagramMarkers: [],
  setBodyDiagramMarkers: vi.fn(),
  anatomySpineFindings: {},
  setAnatomySpineFindings: vi.fn(),
  anatomyBodyRegions: [],
  setAnatomyBodyRegions: vi.fn(),
};

vi.mock('../../../../context/ExamPanelContext', () => ({
  useExamPanelContext: () => ({ panels: mockPanels, examData: mockExamData }),
}));

vi.mock('../../../../components/encounter/exam-panels/ExamToggle', () => ({
  default: ({ label, show, children }) => (
    <div data-testid={`toggle-${label}`}>
      {label}
      {show && <div data-testid={`content-${label}`}>{children}</div>}
    </div>
  ),
}));

vi.mock('../../../../components/anatomy/AnatomyViewer', () => ({
  default: () => <div data-testid="mock-anatomy-viewer" />,
}));
vi.mock('../../../../components/neuroexam', () => ({
  NeurologicalExamCompact: () => <div data-testid="mock-neuro-compact" />,
}));
vi.mock('../../../../components/orthoexam', () => ({
  OrthopedicExamCompact: () => <div data-testid="mock-ortho-compact" />,
}));
vi.mock('../../../../components/examination/VisualROMSelector', () => ({
  default: () => <div data-testid="mock-rom-selector" />,
}));
vi.mock('../../../../components/examination/BodyDiagram', () => ({
  default: () => <div data-testid="mock-body-diagram" />,
}));

import CoreExamPanels from '../../../../components/encounter/exam-panels/CoreExamPanels';

function buildProps(overrides = {}) {
  return {
    patientId: 'p1',
    encounterId: 'e1',
    isSigned: false,
    onOrthoExamChange: vi.fn(),
    onNeuroExamChange: vi.fn(),
    onAnatomyInsertText: vi.fn(),
    updateField: vi.fn(),
    encounterData: { objective: { rom: '' } },
    ...overrides,
  };
}

describe('CoreExamPanels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all five exam toggle panels', () => {
    render(<CoreExamPanels {...buildProps()} />);
    expect(screen.getByText(/Anatomi/)).toBeTruthy();
    expect(screen.getByText(/Ortopedisk/)).toBeTruthy();
    expect(screen.getByText(/Nevrologisk/)).toBeTruthy();
    expect(screen.getByText(/Leddutslag/)).toBeTruthy();
    expect(screen.getByText(/Smertekart/)).toBeTruthy();
  });

  it('does not show panel content when collapsed', () => {
    render(<CoreExamPanels {...buildProps()} />);
    expect(screen.queryByTestId('mock-anatomy-viewer')).toBeNull();
    expect(screen.queryByTestId('mock-ortho-compact')).toBeNull();
  });

  it('shows anatomy panel content area when panel is open', () => {
    mockPanels.showAnatomyPanel = true;
    render(<CoreExamPanels {...buildProps()} />);
    // AnatomyViewer is lazy-loaded, so we see the Suspense fallback or the loaded component
    const contentDiv = screen.getByTestId(/content-Anatomi/);
    expect(contentDiv).toBeTruthy();
    mockPanels.showAnatomyPanel = false;
  });
});
