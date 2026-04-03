/**
 * ClinicalEncounterModals Component Tests
 * Tests rendering of lazy-loaded modal containers with suspense boundaries.
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
  Brain: () => null,
  X: () => null,
  Sparkles: () => null,
  Loader2: () => null,
  AlertTriangle: () => null,
}));

vi.mock('../../../components/common/ConnectionStatus', () => ({
  default: ({ pendingChanges }) => (
    <div data-testid="mock-connection-status">pending:{pendingChanges}</div>
  ),
}));
vi.mock('../../../components/clinical/RedFlagModal', () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="mock-redflag-modal" /> : null),
}));
vi.mock('../../../components/TemplatePicker', () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="mock-template-picker" /> : null),
}));
vi.mock('../../../components/clinical/AIDiagnosisSidebar', () => ({
  default: ({ isCollapsed }) => (
    <div data-testid="mock-ai-diagnosis">{isCollapsed ? 'collapsed' : 'expanded'}</div>
  ),
}));
vi.mock('../../../components/encounter/AIAssistantPanel', () => ({
  AIAssistantPanel: ({ showAIAssistant }) =>
    showAIAssistant ? <div data-testid="mock-ai-assistant" /> : null,
}));

import { ClinicalEncounterModals } from '../../../components/encounter/ClinicalEncounterModals';

function buildProps(overrides = {}) {
  return {
    showAIAssistant: false,
    setShowAIAssistant: vi.fn(),
    aiSuggestions: null,
    aiLoading: false,
    getAISuggestions: vi.fn(),
    showAIDiagnosisSidebar: false,
    setShowAIDiagnosisSidebar: vi.fn(),
    encounterData: { icpc_codes: [] },
    setEncounterData: vi.fn(),
    setAutoSaveStatus: vi.fn(),
    isSigned: false,
    showTemplatePicker: false,
    setShowTemplatePicker: vi.fn(),
    handleTemplateSelect: vi.fn(),
    activeField: 'subjective.chief_complaint',
    showRedFlagModal: false,
    setShowRedFlagModal: vi.fn(),
    criticalFlagsForModal: [],
    setRedFlagAlerts: vi.fn(),
    autoSaveStatus: 'saved',
    lastSaved: new Date(),
    ...overrides,
  };
}

describe('ClinicalEncounterModals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the connection status', () => {
    render(<ClinicalEncounterModals {...buildProps()} />);
    expect(screen.getByTestId('mock-connection-status')).toBeTruthy();
  });

  it('shows pending=0 when autoSaveStatus is saved', () => {
    render(<ClinicalEncounterModals {...buildProps({ autoSaveStatus: 'saved' })} />);
    expect(screen.getByText('pending:0')).toBeTruthy();
  });

  it('shows pending=1 when autoSaveStatus is unsaved', () => {
    render(<ClinicalEncounterModals {...buildProps({ autoSaveStatus: 'unsaved' })} />);
    expect(screen.getByText('pending:1')).toBeTruthy();
  });

  it('does not render RedFlagModal when showRedFlagModal is false', () => {
    render(<ClinicalEncounterModals {...buildProps()} />);
    expect(screen.queryByTestId('mock-redflag-modal')).toBeNull();
  });

  it('renders RedFlagModal when showRedFlagModal is true', () => {
    render(<ClinicalEncounterModals {...buildProps({ showRedFlagModal: true })} />);
    expect(screen.getByTestId('mock-redflag-modal')).toBeTruthy();
  });
});
