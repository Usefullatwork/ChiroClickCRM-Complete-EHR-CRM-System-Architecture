/**
 * Automations Page Tests
 * Tests for the workflow automations management page
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Automations from '../../pages/Automations';

// Mock i18n
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

// Mock ConfirmDialog
vi.mock('../../components/ui/ConfirmDialog', () => ({
  default: () => null,
  useConfirm: () => vi.fn().mockResolvedValue(true),
  ConfirmProvider: ({ children }) => children,
}));

// Mock toast
vi.mock('../../utils/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// Mock APIs
vi.mock('../../services/api', () => ({
  automationsAPI: {
    getWorkflows: vi.fn(),
    getWorkflow: vi.fn(),
    createWorkflow: vi.fn(),
    updateWorkflow: vi.fn(),
    deleteWorkflow: vi.fn(),
    toggleWorkflow: vi.fn(),
    getExecutions: vi.fn(),
    testWorkflow: vi.fn(),
    getStats: vi.fn(),
  },
  patientsAPI: {
    getAll: vi.fn(),
  },
  usersAPI: {
    getAll: vi.fn(),
  },
}));

// Mock child components to isolate Automations page logic
vi.mock('../../components/workflows/WorkflowBuilder', () => ({
  default: function MockWorkflowBuilder({ onCancel, onSave }) {
    return (
      <div data-testid="workflow-builder">
        <button onClick={onCancel}>Avbryt</button>
        <button
          onClick={() => onSave({ name: 'Test', trigger_type: 'PATIENT_CREATED', actions: [] })}
        >
          Lagre
        </button>
      </div>
    );
  },
}));

vi.mock('../../components/workflows/WorkflowListTab', () => ({
  default: function MockWorkflowListTab({
    filteredWorkflows,
    workflowsLoading,
    onCreateNew,
    onEdit,
    onDelete,
    onToggle,
    t,
    filters,
    setFilters,
  }) {
    return (
      <div data-testid="workflow-list-tab">
        {workflowsLoading && <div>Laster...</div>}
        {!workflowsLoading && filteredWorkflows.length === 0 && <div>{t.noWorkflows}</div>}
        {filteredWorkflows.map((w) => (
          <div key={w.id} data-testid={`workflow-${w.id}`}>
            <span>{w.name}</span>
            <button onClick={() => onEdit(w)}>Rediger</button>
            <button onClick={() => onDelete(w)}>Slett</button>
            <button onClick={() => onToggle(w.id)}>Toggle</button>
          </div>
        ))}
        <button onClick={onCreateNew}>Opprett ny</button>
        <input
          data-testid="search-input"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          placeholder={t.searchPlaceholder}
        />
      </div>
    );
  },
}));

vi.mock('../../components/workflows/ExecutionHistoryTab', () => ({
  default: function MockExecutionHistoryTab() {
    return <div data-testid="execution-history-tab">Execution History</div>;
  },
}));

vi.mock('../../components/workflows/AutomationStatsTab', () => ({
  default: function MockAutomationStatsTab() {
    return <div data-testid="automation-stats-tab">Automation Stats</div>;
  },
}));

import { automationsAPI } from '../../services/api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  };
}

describe('Automations Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    automationsAPI.getWorkflows.mockResolvedValue({ workflows: [] });
    automationsAPI.getExecutions.mockResolvedValue({ executions: [] });
    automationsAPI.getStats.mockResolvedValue({});
  });

  // ============================================================================
  // HEADING & LAYOUT
  // ============================================================================

  describe('Heading & Layout', () => {
    it('should render the page title in Norwegian', async () => {
      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Automatiserte Arbeidsflyter')).toBeInTheDocument();
      });
    });

    it('should render the subtitle', async () => {
      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(
          screen.getByText('Automatiser pasientengasjement og oppfolginger')
        ).toBeInTheDocument();
      });
    });

    it('should show create workflow button', async () => {
      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Opprett arbeidsflyt')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TABS
  // ============================================================================

  describe('Tabs', () => {
    it('should render all three tabs', async () => {
      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Arbeidsflyter')).toBeInTheDocument();
        expect(screen.getByText('Utforelseshistorikk')).toBeInTheDocument();
        expect(screen.getByText('Statistikk')).toBeInTheDocument();
      });
    });

    it('should show workflows tab by default', async () => {
      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('workflow-list-tab')).toBeInTheDocument();
      });
    });

    it('should switch to execution history tab when clicked', async () => {
      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Utforelseshistorikk')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Utforelseshistorikk'));

      await waitFor(() => {
        expect(screen.getByTestId('execution-history-tab')).toBeInTheDocument();
      });
    });

    it('should switch to statistics tab when clicked', async () => {
      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Statistikk')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Statistikk'));

      await waitFor(() => {
        expect(screen.getByTestId('automation-stats-tab')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // LANGUAGE TOGGLE
  // ============================================================================

  describe('Language Toggle', () => {
    it('should show language toggle button', async () => {
      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('EN')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // WORKFLOW LIST
  // ============================================================================

  describe('Workflow List', () => {
    it('should show empty state when no workflows exist', async () => {
      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Ingen arbeidsflyter funnet')).toBeInTheDocument();
      });
    });

    it('should display workflows when they exist', async () => {
      automationsAPI.getWorkflows.mockResolvedValue({
        workflows: [
          { id: 'w1', name: 'Welcome Flow', trigger_type: 'PATIENT_CREATED', is_active: true },
          { id: 'w2', name: 'Recall SMS', trigger_type: 'DAYS_SINCE_VISIT', is_active: false },
        ],
      });

      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Welcome Flow')).toBeInTheDocument();
        expect(screen.getByText('Recall SMS')).toBeInTheDocument();
      });
    });

    it('should filter workflows by search query', async () => {
      automationsAPI.getWorkflows.mockResolvedValue({
        workflows: [
          { id: 'w1', name: 'Welcome Flow', trigger_type: 'PATIENT_CREATED', is_active: true },
          { id: 'w2', name: 'Recall SMS', trigger_type: 'DAYS_SINCE_VISIT', is_active: false },
        ],
      });

      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Welcome Flow')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Recall' } });

      await waitFor(() => {
        expect(screen.queryByText('Welcome Flow')).not.toBeInTheDocument();
        expect(screen.getByText('Recall SMS')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // CREATE WORKFLOW
  // ============================================================================

  describe('Create Workflow', () => {
    it('should open workflow builder when create button is clicked', async () => {
      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Opprett arbeidsflyt')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Opprett arbeidsflyt'));

      await waitFor(() => {
        expect(screen.getByTestId('workflow-builder')).toBeInTheDocument();
      });
    });

    it('should return to list when cancel is clicked in builder', async () => {
      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Opprett arbeidsflyt')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Opprett arbeidsflyt'));

      await waitFor(() => {
        expect(screen.getByTestId('workflow-builder')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Avbryt'));

      await waitFor(() => {
        expect(screen.getByTestId('workflow-list-tab')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // EDIT WORKFLOW
  // ============================================================================

  describe('Edit Workflow', () => {
    it('should open builder when edit is clicked on a workflow', async () => {
      automationsAPI.getWorkflows.mockResolvedValue({
        workflows: [
          { id: 'w1', name: 'Welcome Flow', trigger_type: 'PATIENT_CREATED', is_active: true },
        ],
      });

      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Welcome Flow')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Rediger'));

      await waitFor(() => {
        expect(screen.getByTestId('workflow-builder')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // DELETE WORKFLOW
  // ============================================================================

  describe('Delete Workflow', () => {
    it('should call delete mutation when delete is clicked and confirmed', async () => {
      automationsAPI.deleteWorkflow.mockResolvedValue({});
      automationsAPI.getWorkflows.mockResolvedValue({
        workflows: [
          { id: 'w1', name: 'Welcome Flow', trigger_type: 'PATIENT_CREATED', is_active: true },
        ],
      });

      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Welcome Flow')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Slett'));

      await waitFor(() => {
        expect(automationsAPI.deleteWorkflow).toHaveBeenCalledWith('w1');
      });
    });
  });

  // ============================================================================
  // TOGGLE WORKFLOW
  // ============================================================================

  describe('Toggle Workflow', () => {
    it('should call toggle mutation when toggle is clicked', async () => {
      automationsAPI.toggleWorkflow.mockResolvedValue({});
      automationsAPI.getWorkflows.mockResolvedValue({
        workflows: [
          { id: 'w1', name: 'Welcome Flow', trigger_type: 'PATIENT_CREATED', is_active: true },
        ],
      });

      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Welcome Flow')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Toggle'));

      await waitFor(() => {
        expect(automationsAPI.toggleWorkflow).toHaveBeenCalledWith('w1');
      });
    });
  });

  // ============================================================================
  // API INTEGRATION
  // ============================================================================

  describe('API Integration', () => {
    it('should call getWorkflows on mount', async () => {
      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(automationsAPI.getWorkflows).toHaveBeenCalled();
      });
    });

    it('should not fetch executions until executions tab is active', async () => {
      render(<Automations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Arbeidsflyter')).toBeInTheDocument();
      });

      expect(automationsAPI.getExecutions).not.toHaveBeenCalled();

      fireEvent.click(screen.getByText('Utforelseshistorikk'));

      await waitFor(() => {
        expect(automationsAPI.getExecutions).toHaveBeenCalled();
      });
    });
  });
});
