/**
 * ExecutionHistoryTab Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../lib/utils', () => ({
  formatRelativeTime: (date) => '2 hours ago',
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

import ExecutionHistoryTab from '../../../components/workflows/ExecutionHistoryTab';

const mockLabels = {
  allStatuses: 'All Statuses',
  patient: 'Patient',
  status: 'Status',
  started: 'Started',
  actions: 'Actions',
  noExecutions: 'No executions found',
};

describe('ExecutionHistoryTab', () => {
  const defaultProps = {
    executions: [],
    executionsLoading: false,
    executionFilters: { status: '', workflowId: '' },
    setExecutionFilters: vi.fn(),
    workflows: [],
    t: mockLabels,
    language: 'en',
    getTriggerLabel: (type) => type,
  };

  it('renders filter section', () => {
    render(<ExecutionHistoryTab {...defaultProps} />);
    expect(screen.getByText('Filter:')).toBeInTheDocument();
  });

  it('renders status filter dropdown', () => {
    render(<ExecutionHistoryTab {...defaultProps} />);
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<ExecutionHistoryTab {...defaultProps} />);
    expect(screen.getByText('Patient')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Started')).toBeInTheDocument();
  });

  it('shows empty state when no executions', () => {
    render(<ExecutionHistoryTab {...defaultProps} />);
    expect(screen.getByText('No executions found')).toBeInTheDocument();
  });

  it('renders execution data', () => {
    const executions = [
      {
        id: 1,
        workflow_name: 'Welcome Sequence',
        trigger_type: 'PATIENT_CREATED',
        patient_name: 'Ola Nordmann',
        status: 'COMPLETED',
        created_at: '2026-03-28T10:00:00Z',
        current_step: 3,
        total_steps: 3,
      },
    ];
    render(<ExecutionHistoryTab {...defaultProps} executions={executions} />);
    expect(screen.getByText('Welcome Sequence')).toBeInTheDocument();
    expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('3/3')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    render(<ExecutionHistoryTab {...defaultProps} executionsLoading={true} />);
    expect(screen.queryByText('No executions found')).not.toBeInTheDocument();
  });

  it('calls setExecutionFilters on status change', () => {
    render(<ExecutionHistoryTab {...defaultProps} />);
    const statusSelect = screen.getByText('All Statuses').closest('select');
    fireEvent.change(statusSelect, { target: { value: 'COMPLETED' } });
    expect(defaultProps.setExecutionFilters).toHaveBeenCalled();
  });
});
