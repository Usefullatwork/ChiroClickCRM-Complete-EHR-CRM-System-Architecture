/**
 * RegionalPanels Component Tests
 * Tests rendering of regional panels (body diagrams, pain, headache, tissue markers)
 * and region selection buttons.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  Activity: () => null,
  Target: () => null,
  Brain: () => null,
  ChevronDown: () => null,
  ChevronUp: () => null,
}));

const mockPanels = {
  showRegionalDiagrams: false,
  setShowRegionalDiagrams: vi.fn(),
  showPainAssessment: false,
  setShowPainAssessment: vi.fn(),
  showHeadacheAssessment: false,
  setShowHeadacheAssessment: vi.fn(),
  showTissueMarkers: false,
  setShowTissueMarkers: vi.fn(),
};

const mockExamData = {
  regionalDiagramData: {},
  setRegionalDiagramData: vi.fn(),
  selectedRegion: 'shoulder',
  setSelectedRegion: vi.fn(),
  painAssessmentData: {},
  setPainAssessmentData: vi.fn(),
  headacheData: {},
  setHeadacheData: vi.fn(),
  tissueMarkerData: {},
  setTissueMarkerData: vi.fn(),
};

vi.mock('../../../../context/ExamPanelContext', () => ({
  useExamPanelContext: () => ({ panels: mockPanels, examData: mockExamData }),
}));

vi.mock('../../../../components/encounter/exam-panels/ExamToggle', () => ({
  default: ({ label, show, children }) => (
    <div data-testid={`toggle-${label.substring(0, 12)}`}>
      {label}
      {show && <div>{children}</div>}
    </div>
  ),
}));

vi.mock('../../../../components/examination/RegionalBodyDiagrams', () => ({
  default: ({ region }) => <div data-testid="mock-regional-body">region:{region}</div>,
}));
vi.mock('../../../../components/examination/PainAssessmentPanel', () => ({
  default: () => <div data-testid="mock-pain-assessment" />,
}));
vi.mock('../../../../components/examination/HeadacheAssessment', () => ({
  default: () => <div data-testid="mock-headache" />,
}));
vi.mock('../../../../components/examination/TissueAbnormalityMarkers', () => ({
  default: () => <div data-testid="mock-tissue-markers" />,
}));

import RegionalPanels from '../../../../components/encounter/exam-panels/RegionalPanels';

function buildProps(overrides = {}) {
  return {
    isSigned: false,
    updateField: vi.fn(),
    encounterData: {
      subjective: { pain_description: '', chief_complaint: '' },
      objective: { palpation: '' },
    },
    ...overrides,
  };
}

describe('RegionalPanels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockPanels).forEach((key) => {
      if (typeof mockPanels[key] === 'boolean') mockPanels[key] = false;
    });
  });

  it('renders all four regional toggle panels', () => {
    render(<RegionalPanels {...buildProps()} />);
    expect(screen.getByText(/Leddunders/)).toBeTruthy();
    expect(screen.getByText(/Smertevurdering/)).toBeTruthy();
    expect(screen.getByText(/Hodepineutredning/)).toBeTruthy();
    expect(screen.getByText(/Vevsabnormaliteter/)).toBeTruthy();
  });

  it('shows region selector buttons when regional diagrams panel is open', () => {
    mockPanels.showRegionalDiagrams = true;
    render(<RegionalPanels {...buildProps()} />);
    expect(screen.getByText('Skulder')).toBeTruthy();
    expect(screen.getByText('Kne')).toBeTruthy();
    expect(screen.getByText('Ankel')).toBeTruthy();
    expect(screen.getByText('Nakke')).toBeTruthy();
    expect(screen.getByText('Korsrygg')).toBeTruthy();
    expect(screen.getByText('Hofte')).toBeTruthy();
  });

  it('calls setSelectedRegion when a region button is clicked', () => {
    mockPanels.showRegionalDiagrams = true;
    render(<RegionalPanels {...buildProps()} />);
    fireEvent.click(screen.getByText('Kne'));
    expect(mockExamData.setSelectedRegion).toHaveBeenCalledWith('knee');
  });

  it('renders the regional body diagram component with selected region', () => {
    mockPanels.showRegionalDiagrams = true;
    render(<RegionalPanels {...buildProps()} />);
    expect(screen.getByTestId('mock-regional-body').textContent).toContain('region:shoulder');
  });

  it('shows pain assessment when expanded', () => {
    mockPanels.showPainAssessment = true;
    render(<RegionalPanels {...buildProps()} />);
    expect(screen.getByTestId('mock-pain-assessment')).toBeTruthy();
  });

  it('shows headache assessment when expanded', () => {
    mockPanels.showHeadacheAssessment = true;
    render(<RegionalPanels {...buildProps()} />);
    expect(screen.getByTestId('mock-headache')).toBeTruthy();
  });
});
