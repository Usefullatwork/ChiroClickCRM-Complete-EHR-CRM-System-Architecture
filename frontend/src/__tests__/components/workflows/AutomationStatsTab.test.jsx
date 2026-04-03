/**
 * AutomationStatsTab Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

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

import AutomationStatsTab from '../../../components/workflows/AutomationStatsTab';

const mockTriggerIcons = {
  PATIENT_CREATED: (props) => null,
  BIRTHDAY: (props) => null,
  DAYS_SINCE_VISIT: (props) => null,
};

const mockTriggerColors = {
  PATIENT_CREATED: 'blue',
  BIRTHDAY: 'purple',
  DAYS_SINCE_VISIT: 'orange',
};

const mockLabels = {
  triggerStats: 'Trigger Statistics',
  upcomingTriggers: 'Upcoming Triggers',
  birthdays: 'Birthdays',
  recalls: 'Recalls',
  hasActiveWorkflow: 'Has Active',
  noActiveWorkflow: 'No Active',
};

describe('AutomationStatsTab', () => {
  const defaultProps = {
    stats: { trigger_stats: [], upcoming_triggers: null },
    statsLoading: false,
    t: mockLabels,
    language: 'en',
    triggerIcons: mockTriggerIcons,
    triggerColors: mockTriggerColors,
    getTriggerLabel: (type) => type,
  };

  it('renders trigger statistics heading', () => {
    render(<AutomationStatsTab {...defaultProps} />);
    expect(screen.getByText('Trigger Statistics')).toBeInTheDocument();
  });

  it('renders upcoming triggers heading', () => {
    render(<AutomationStatsTab {...defaultProps} />);
    expect(screen.getByText('Upcoming Triggers')).toBeInTheDocument();
  });

  it('shows loading spinner when statsLoading is true', () => {
    render(<AutomationStatsTab {...defaultProps} statsLoading={true} />);
    expect(screen.getByText('Trigger Statistics')).toBeInTheDocument();
  });

  it('shows no statistics message when trigger_stats is empty', () => {
    render(<AutomationStatsTab {...defaultProps} />);
    expect(screen.getByText('No statistics available')).toBeInTheDocument();
  });

  it('renders trigger stats when data is provided', () => {
    const stats = {
      trigger_stats: [
        {
          trigger_type: 'PATIENT_CREATED',
          workflow_count: 3,
          active_workflows: 2,
          total_executions: 100,
          successful_executions: 95,
        },
      ],
      upcoming_triggers: null,
    };
    render(<AutomationStatsTab {...defaultProps} stats={stats} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
  });

  it('renders upcoming birthdays when data is provided', () => {
    const stats = {
      trigger_stats: [],
      upcoming_triggers: {
        birthdays: { count: 5, has_active_workflow: true, patients: [] },
        recalls: { count: 12, has_active_workflow: false, patients: [] },
      },
    };
    render(<AutomationStatsTab {...defaultProps} stats={stats} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders has active workflow badge', () => {
    const stats = {
      trigger_stats: [],
      upcoming_triggers: {
        birthdays: { count: 1, has_active_workflow: true, patients: [] },
        recalls: { count: 0, has_active_workflow: false, patients: [] },
      },
    };
    render(<AutomationStatsTab {...defaultProps} stats={stats} />);
    expect(screen.getByText('Has Active')).toBeInTheDocument();
    expect(screen.getByText('No Active')).toBeInTheDocument();
  });
});
