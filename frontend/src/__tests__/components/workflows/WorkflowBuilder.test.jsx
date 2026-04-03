/**
 * Workflows WorkflowBuilder Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    scope: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
  },
}));

vi.mock('../../../components/workflows/WorkflowBuilder/constants', () => ({
  LABELS: {
    en: {
      title: 'Create Workflow',
      titleEdit: 'Edit Workflow',
      name: 'Name',
      namePlaceholder: 'Workflow name...',
      description: 'Description',
      descriptionPlaceholder: 'Describe this workflow...',
      errorName: 'Name is required',
      errorTrigger: 'Trigger is required',
      errorActions: 'At least one action is required',
    },
    no: {
      title: 'Opprett Arbeidsflyt',
      titleEdit: 'Rediger Arbeidsflyt',
      name: 'Navn',
      namePlaceholder: 'Arbeidsflytnavn...',
      description: 'Beskrivelse',
      descriptionPlaceholder: 'Beskriv denne arbeidsflyten...',
      errorName: 'Navn er påkrevd',
      errorTrigger: 'Trigger er påkrevd',
      errorActions: 'Minst en handling er påkrevd',
    },
  },
}));

vi.mock('../../../components/workflows/WorkflowBuilder/WorkflowCanvas', () => ({
  default: (props) => <div data-testid="workflow-canvas">Canvas</div>,
}));

vi.mock('../../../components/workflows/WorkflowBuilder/WorkflowToolbar', () => ({
  WorkflowHeader: ({ t, isEdit }) => (
    <div data-testid="workflow-header">{isEdit ? t.titleEdit : t.title}</div>
  ),
  WorkflowFooter: ({ t, onSave, onCancel }) => (
    <div data-testid="workflow-footer">
      <button onClick={onSave}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  WorkflowTestModal: () => <div data-testid="test-modal">Test Modal</div>,
}));

vi.mock('../../../components/workflows/WorkflowBuilder/WorkflowNodeEditor', () => ({
  default: () => <div data-testid="node-editor">Node Editor</div>,
}));

vi.mock('../../../components/workflows/WorkflowBuilder/WorkflowConnections', () => ({
  ConditionsSection: () => <div data-testid="conditions-section">Conditions</div>,
  SettingsSection: () => <div data-testid="settings-section">Settings</div>,
}));

vi.mock(
  'lucide-react',
  () =>
    new Proxy(
      {},
      {
        get: (_, name) => {
          if (name === '__esModule') return false;
          return (props) => null;
        },
      }
    )
);

import WorkflowBuilder from '../../../components/workflows/WorkflowBuilder';

describe('Workflows WorkflowBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create title when no workflow prop', () => {
    render(<WorkflowBuilder language="en" />);
    expect(screen.getByText('Create Workflow')).toBeInTheDocument();
  });

  it('renders edit title when workflow prop is provided', () => {
    render(<WorkflowBuilder workflow={{ id: 1, name: 'Test' }} language="en" />);
    expect(screen.getByText('Edit Workflow')).toBeInTheDocument();
  });

  it('renders name input', () => {
    render(<WorkflowBuilder language="en" />);
    expect(screen.getByPlaceholderText('Workflow name...')).toBeInTheDocument();
  });

  it('renders description input', () => {
    render(<WorkflowBuilder language="en" />);
    expect(screen.getByPlaceholderText('Describe this workflow...')).toBeInTheDocument();
  });

  it('renders workflow canvas', () => {
    render(<WorkflowBuilder language="en" />);
    expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
  });

  it('renders conditions section', () => {
    render(<WorkflowBuilder language="en" />);
    expect(screen.getByTestId('conditions-section')).toBeInTheDocument();
  });

  it('renders node editor', () => {
    render(<WorkflowBuilder language="en" />);
    expect(screen.getByTestId('node-editor')).toBeInTheDocument();
  });

  it('renders settings section', () => {
    render(<WorkflowBuilder language="en" />);
    expect(screen.getByTestId('settings-section')).toBeInTheDocument();
  });

  it('renders footer with save and cancel', () => {
    render(<WorkflowBuilder language="en" />);
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('populates name from workflow prop', () => {
    render(
      <WorkflowBuilder
        workflow={{ id: 1, name: 'My Workflow', description: 'A desc' }}
        language="en"
      />
    );
    expect(screen.getByDisplayValue('My Workflow')).toBeInTheDocument();
  });
});
