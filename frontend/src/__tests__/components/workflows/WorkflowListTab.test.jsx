/**
 * WorkflowListTab Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../lib/utils', () => ({
  formatRelativeTime: (date) => '1 hour ago',
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

import WorkflowListTab from '../../../components/workflows/WorkflowListTab';

const mockLabels = {
  allStatuses: 'All Statuses',
  allTriggers: 'All Triggers',
  activeOnly: 'Active Only',
  inactiveOnly: 'Inactive Only',
  searchPlaceholder: 'Search workflows...',
  enabled: 'Enabled',
  disabled: 'Disabled',
  lastRun: 'Last Run',
  never: 'Never',
  totalRuns: 'Total Runs',
  successRate: 'Success Rate',
  edit: 'Edit',
  viewHistory: 'View History',
  delete: 'Delete',
  noWorkflows: 'No Workflows',
  noWorkflowsDesc: 'Create your first workflow to get started',
  createWorkflow: 'Create Workflow',
};

const mockTriggerIcons = {
  PATIENT_CREATED: (props) => null,
};

const mockTriggerColors = {
  PATIENT_CREATED: 'blue',
};

describe('WorkflowListTab', () => {
  const defaultProps = {
    filteredWorkflows: [],
    workflowsLoading: false,
    filters: { isActive: '', triggerType: '', search: '' },
    setFilters: vi.fn(),
    t: mockLabels,
    language: 'en',
    triggerIcons: mockTriggerIcons,
    triggerColors: mockTriggerColors,
    getTriggerLabel: (type) => type,
    onToggle: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onViewHistory: vi.fn(),
    onCreateNew: vi.fn(),
  };

  it('renders filter section', () => {
    render(<WorkflowListTab {...defaultProps} />);
    expect(screen.getByText('Filter:')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<WorkflowListTab {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search workflows...')).toBeInTheDocument();
  });

  it('shows empty state when no workflows', () => {
    render(<WorkflowListTab {...defaultProps} />);
    expect(screen.getByText('No Workflows')).toBeInTheDocument();
    expect(screen.getByText('Create your first workflow to get started')).toBeInTheDocument();
  });

  it('renders create workflow button in empty state', () => {
    render(<WorkflowListTab {...defaultProps} />);
    expect(screen.getByText('Create Workflow')).toBeInTheDocument();
  });

  it('calls onCreateNew when create button clicked', () => {
    render(<WorkflowListTab {...defaultProps} />);
    fireEvent.click(screen.getByText('Create Workflow'));
    expect(defaultProps.onCreateNew).toHaveBeenCalled();
  });

  it('renders workflow data when present', () => {
    const workflows = [
      {
        id: 1,
        name: 'Welcome Sequence',
        description: 'Onboarding flow',
        trigger_type: 'PATIENT_CREATED',
        is_active: true,
        execution_count: 50,
        successful_count: 48,
        total_runs: 50,
        last_execution: '2026-03-28T10:00:00Z',
      },
    ];
    render(<WorkflowListTab {...defaultProps} filteredWorkflows={workflows} />);
    expect(screen.getByText('Welcome Sequence')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Onboarding flow')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<WorkflowListTab {...defaultProps} workflowsLoading={true} />);
    expect(screen.getByText(/Loading workflows/)).toBeInTheDocument();
  });

  it('renders status filter options', () => {
    render(<WorkflowListTab {...defaultProps} />);
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
  });
});
