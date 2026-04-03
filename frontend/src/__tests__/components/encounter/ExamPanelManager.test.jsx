/**
 * ExamPanelManager Component Tests
 * Tests rendering of sub-panel containers with correct prop forwarding.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => ({
  Bone: () => null,
  Activity: () => null,
  Ruler: () => null,
  PersonStanding: () => null,
  Stethoscope: () => null,
  ChevronDown: () => null,
  ChevronUp: () => null,
}));

vi.mock('../../../components/encounter/exam-panels/CoreExamPanels', () => ({
  default: (props) => (
    <div data-testid="mock-core-panels">
      patientId:{props.patientId},signed:{String(props.isSigned)}
    </div>
  ),
}));
vi.mock('../../../components/encounter/exam-panels/ProtocolExamPanels', () => ({
  default: (props) => <div data-testid="mock-protocol-panels">signed:{String(props.isSigned)}</div>,
}));
vi.mock('../../../components/encounter/exam-panels/NeuroDetailPanels', () => ({
  default: (props) => <div data-testid="mock-neuro-panels">signed:{String(props.isSigned)}</div>,
}));
vi.mock('../../../components/encounter/exam-panels/RegionalPanels', () => ({
  default: (props) => <div data-testid="mock-regional-panels">signed:{String(props.isSigned)}</div>,
}));

import { ExamPanelManager } from '../../../components/encounter/ExamPanelManager';

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

describe('ExamPanelManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all four panel groups', () => {
    render(<ExamPanelManager {...buildProps()} />);
    expect(screen.getByTestId('mock-core-panels')).toBeTruthy();
    expect(screen.getByTestId('mock-protocol-panels')).toBeTruthy();
    expect(screen.getByTestId('mock-neuro-panels')).toBeTruthy();
    expect(screen.getByTestId('mock-regional-panels')).toBeTruthy();
  });

  it('passes patientId to CoreExamPanels', () => {
    render(<ExamPanelManager {...buildProps()} />);
    expect(screen.getByTestId('mock-core-panels').textContent).toContain('patientId:p1');
  });

  it('passes isSigned=false to all panels', () => {
    render(<ExamPanelManager {...buildProps()} />);
    expect(screen.getByTestId('mock-core-panels').textContent).toContain('signed:false');
    expect(screen.getByTestId('mock-protocol-panels').textContent).toContain('signed:false');
    expect(screen.getByTestId('mock-neuro-panels').textContent).toContain('signed:false');
    expect(screen.getByTestId('mock-regional-panels').textContent).toContain('signed:false');
  });

  it('passes isSigned=true when signed', () => {
    render(<ExamPanelManager {...buildProps({ isSigned: true })} />);
    expect(screen.getByTestId('mock-core-panels').textContent).toContain('signed:true');
  });
});
