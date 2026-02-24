/**
 * Automations Page
 *
 * Main page for managing workflow automations.
 * Lists all workflows with status, create/edit functionality,
 * and execution history.
 *
 * Features:
 * - List of all workflows with status
 * - Create new workflow button
 * - Quick toggle for enable/disable
 * - Recent executions log
 * - Filter by trigger type and status
 * - Bilingual support (EN/NO)
 */

import { useState, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../i18n';
import { useConfirm } from '../components/ui/ConfirmDialog';
import {
  Zap,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Gift,
  UserPlus,
  RefreshCw,
  History,
  BarChart2,
} from 'lucide-react';
import WorkflowBuilder from '../components/workflows/WorkflowBuilder';
import WorkflowListTab from '../components/workflows/WorkflowListTab';
import { automationsAPI, patientsAPI, usersAPI } from '../services/api';
import toast from '../utils/toast';

import logger from '../utils/logger';

// Lazy load less-used tabs
const ExecutionHistoryTab = lazy(() => import('../components/workflows/ExecutionHistoryTab'));
const AutomationStatsTab = lazy(() => import('../components/workflows/AutomationStatsTab'));

// =============================================================================
// API HELPERS
// =============================================================================

// Add automations API if not in api.js
const automationsAPILocal = {
  getWorkflows: (params) =>
    fetch(`/api/v1/automations/workflows?${new URLSearchParams(params)}`).then((r) => r.json()),
  getWorkflow: (id) => fetch(`/api/v1/automations/workflows/${id}`).then((r) => r.json()),
  createWorkflow: (data) =>
    fetch('/api/v1/automations/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  updateWorkflow: (id, data) =>
    fetch(`/api/v1/automations/workflows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  deleteWorkflow: (id) =>
    fetch(`/api/v1/automations/workflows/${id}`, { method: 'DELETE' }).then((r) => r.json()),
  toggleWorkflow: (id) =>
    fetch(`/api/v1/automations/workflows/${id}/toggle`, { method: 'POST' }).then((r) => r.json()),
  getExecutions: (params) =>
    fetch(`/api/v1/automations/executions?${new URLSearchParams(params)}`).then((r) => r.json()),
  getWorkflowExecutions: (id, params) =>
    fetch(`/api/v1/automations/workflows/${id}/executions?${new URLSearchParams(params)}`).then(
      (r) => r.json()
    ),
  testWorkflow: (data) =>
    fetch('/api/v1/automations/workflows/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  getStats: () => fetch('/api/v1/automations/stats').then((r) => r.json()),
  getTriggerTypes: () => fetch('/api/v1/automations/triggers').then((r) => r.json()),
  getActionTypes: () => fetch('/api/v1/automations/actions').then((r) => r.json()),
};

// Use real API if available, otherwise use local
const api = typeof automationsAPI !== 'undefined' ? automationsAPI : automationsAPILocal;

// =============================================================================
// CONSTANTS
// =============================================================================

const TRIGGER_ICONS = {
  PATIENT_CREATED: UserPlus,
  APPOINTMENT_SCHEDULED: Calendar,
  APPOINTMENT_COMPLETED: CheckCircle,
  APPOINTMENT_MISSED: XCircle,
  APPOINTMENT_CANCELLED: XCircle,
  DAYS_SINCE_VISIT: Clock,
  BIRTHDAY: Gift,
  LIFECYCLE_CHANGE: RefreshCw,
  CUSTOM: Zap,
};

const TRIGGER_COLORS = {
  PATIENT_CREATED: 'blue',
  APPOINTMENT_SCHEDULED: 'green',
  APPOINTMENT_COMPLETED: 'emerald',
  APPOINTMENT_MISSED: 'red',
  APPOINTMENT_CANCELLED: 'orange',
  DAYS_SINCE_VISIT: 'yellow',
  BIRTHDAY: 'purple',
  LIFECYCLE_CHANGE: 'indigo',
  CUSTOM: 'gray',
};

// =============================================================================
// LABELS
// =============================================================================

const LABELS = {
  en: {
    title: 'Workflow Automations',
    subtitle: 'Automate patient engagement and follow-ups',
    workflows: 'Workflows',
    executions: 'Execution History',
    stats: 'Statistics',
    createWorkflow: 'Create Workflow',
    allStatuses: 'All Statuses',
    activeOnly: 'Active Only',
    inactiveOnly: 'Inactive Only',
    allTriggers: 'All Triggers',
    searchPlaceholder: 'Search workflows...',
    noWorkflows: 'No workflows found',
    noWorkflowsDesc: 'Create your first workflow to automate patient engagement.',
    enabled: 'Enabled',
    disabled: 'Disabled',
    lastRun: 'Last run',
    never: 'Never',
    totalRuns: 'Total runs',
    successRate: 'Success rate',
    edit: 'Edit',
    delete: 'Delete',
    viewHistory: 'View History',
    confirmDelete: 'Are you sure you want to delete this workflow?',
    deleteSuccess: 'Workflow deleted successfully',
    toggleSuccess: 'Workflow status updated',
    saveSuccess: 'Workflow saved successfully',
    noExecutions: 'No executions found',
    patient: 'Patient',
    status: 'Status',
    started: 'Started',
    completed: 'Completed',
    duration: 'Duration',
    actions: 'Actions',
    triggerStats: 'Trigger Statistics',
    upcomingTriggers: 'Upcoming Triggers',
    birthdays: 'Birthdays',
    recalls: 'Recalls',
    hasActiveWorkflow: 'Has active workflow',
    noActiveWorkflow: 'No active workflow',
  },
  no: {
    title: 'Automatiserte Arbeidsflyter',
    subtitle: 'Automatiser pasientengasjement og oppfolginger',
    workflows: 'Arbeidsflyter',
    executions: 'Utforelseshistorikk',
    stats: 'Statistikk',
    createWorkflow: 'Opprett arbeidsflyt',
    allStatuses: 'Alle statuser',
    activeOnly: 'Kun aktive',
    inactiveOnly: 'Kun inaktive',
    allTriggers: 'Alle triggere',
    searchPlaceholder: 'Sok i arbeidsflyter...',
    noWorkflows: 'Ingen arbeidsflyter funnet',
    noWorkflowsDesc: 'Opprett din forste arbeidsflyt for a automatisere pasientengasjement.',
    enabled: 'Aktivert',
    disabled: 'Deaktivert',
    lastRun: 'Sist kjort',
    never: 'Aldri',
    totalRuns: 'Totalt kjort',
    successRate: 'Suksessrate',
    edit: 'Rediger',
    delete: 'Slett',
    viewHistory: 'Se historikk',
    confirmDelete: 'Er du sikker pa at du vil slette denne arbeidsflyten?',
    deleteSuccess: 'Arbeidsflyt slettet',
    toggleSuccess: 'Arbeidsflyt status oppdatert',
    saveSuccess: 'Arbeidsflyt lagret',
    noExecutions: 'Ingen utforelser funnet',
    patient: 'Pasient',
    status: 'Status',
    started: 'Startet',
    completed: 'Fullfort',
    duration: 'Varighet',
    actions: 'Handlinger',
    triggerStats: 'Trigger-statistikk',
    upcomingTriggers: 'Kommende triggere',
    birthdays: 'Bursdager',
    recalls: 'Tilbakekallinger',
    hasActiveWorkflow: 'Har aktiv arbeidsflyt',
    noActiveWorkflow: 'Ingen aktiv arbeidsflyt',
  },
};

const TRIGGER_LABELS = {
  en: {
    PATIENT_CREATED: 'New Patient',
    APPOINTMENT_SCHEDULED: 'Appointment Booked',
    APPOINTMENT_COMPLETED: 'Appointment Done',
    APPOINTMENT_MISSED: 'No Show',
    APPOINTMENT_CANCELLED: 'Cancelled',
    DAYS_SINCE_VISIT: 'Recall',
    BIRTHDAY: 'Birthday',
    LIFECYCLE_CHANGE: 'Lifecycle',
    CUSTOM: 'Custom',
  },
  no: {
    PATIENT_CREATED: 'Ny pasient',
    APPOINTMENT_SCHEDULED: 'Time bestilt',
    APPOINTMENT_COMPLETED: 'Time fullfort',
    APPOINTMENT_MISSED: 'Uteblitt',
    APPOINTMENT_CANCELLED: 'Avbestilt',
    DAYS_SINCE_VISIT: 'Tilbakekalling',
    BIRTHDAY: 'Bursdag',
    LIFECYCLE_CHANGE: 'Livssyklus',
    CUSTOM: 'Egendefinert',
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function Automations() {
  const queryClient = useQueryClient();
  const { lang: language, setLang: setLanguage } = useTranslation();
  const confirm = useConfirm();

  // UI State
  const [activeTab, setActiveTab] = useState('workflows');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [_selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const [filters, setFilters] = useState({
    isActive: '',
    triggerType: '',
    search: '',
  });
  const [executionFilters, setExecutionFilters] = useState({
    status: '',
    workflowId: '',
  });

  const t = LABELS[language] || LABELS.no;

  const getTriggerLabel = (triggerType) => TRIGGER_LABELS[language]?.[triggerType] || triggerType;

  // Queries
  const { data: workflowsData, isLoading: workflowsLoading } = useQuery({
    queryKey: ['workflows', filters],
    queryFn: () =>
      api.getWorkflows({
        isActive: filters.isActive || undefined,
        triggerType: filters.triggerType || undefined,
        limit: 100,
      }),
  });

  const { data: executionsData, isLoading: executionsLoading } = useQuery({
    queryKey: ['workflow-executions', executionFilters],
    queryFn: () =>
      api.getExecutions({
        status: executionFilters.status || undefined,
        workflowId: executionFilters.workflowId || undefined,
        limit: 50,
      }),
    enabled: activeTab === 'executions',
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['workflow-stats'],
    queryFn: () => api.getStats(),
    enabled: activeTab === 'stats',
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-for-test'],
    queryFn: () => patientsAPI.getAll({ limit: 50 }),
    enabled: showBuilder,
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: () => usersAPI.getAll(),
    enabled: showBuilder,
  });

  const workflows = workflowsData?.workflows || [];
  const executions = executionsData?.executions || [];
  const stats = statsData || {};
  const testPatients = patientsData?.data?.patients || [];
  const staff = staffData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => api.createWorkflow(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      setShowBuilder(false);
      toast.success(t.saveSuccess);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create workflow');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateWorkflow(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      setShowBuilder(false);
      setEditingWorkflow(null);
      toast.success(t.saveSuccess);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update workflow');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      toast.success(t.deleteSuccess);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete workflow');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.toggleWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      toast.success(t.toggleSuccess);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to toggle workflow');
    },
  });

  // Handlers
  const handleSaveWorkflow = async (workflowData) => {
    if (editingWorkflow?.id) {
      await updateMutation.mutateAsync({ id: editingWorkflow.id, data: workflowData });
    } else {
      await createMutation.mutateAsync(workflowData);
    }
  };

  const handleTestWorkflow = async (testData) => {
    try {
      const result = await api.testWorkflow(testData);
      return result;
    } catch (error) {
      logger.error('Test error:', error);
      throw error;
    }
  };

  const handleDeleteWorkflow = async (workflow) => {
    const ok = await confirm({ title: t.confirmDelete, variant: 'destructive' });
    if (ok) {
      deleteMutation.mutate(workflow.id);
    }
  };

  const handleEditWorkflow = (workflow) => {
    setEditingWorkflow(workflow);
    setShowBuilder(true);
  };

  const handleViewHistory = (workflow) => {
    setSelectedWorkflowId(workflow.id);
    setExecutionFilters({ ...executionFilters, workflowId: workflow.id });
    setActiveTab('executions');
  };

  // Filter workflows by search
  const filteredWorkflows = workflows.filter((w) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        w.name?.toLowerCase().includes(searchLower) ||
        w.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Render workflow builder
  if (showBuilder) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <WorkflowBuilder
          workflow={editingWorkflow}
          onSave={handleSaveWorkflow}
          onTest={handleTestWorkflow}
          onCancel={() => {
            setShowBuilder(false);
            setEditingWorkflow(null);
          }}
          testPatients={testPatients}
          staff={staff}
          language={language}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-7 h-7 text-blue-600" />
            {t.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLanguage(language === 'en' ? 'no' : 'en')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {language === 'en' ? 'NO' : 'EN'}
          </button>
          <button
            onClick={() => setShowBuilder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            {t.createWorkflow}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {[
            { id: 'workflows', label: t.workflows, icon: Zap },
            { id: 'executions', label: t.executions, icon: History },
            { id: 'stats', label: t.stats, icon: BarChart2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'workflows' && (
        <WorkflowListTab
          filteredWorkflows={filteredWorkflows}
          workflowsLoading={workflowsLoading}
          filters={filters}
          setFilters={setFilters}
          t={t}
          language={language}
          triggerIcons={TRIGGER_ICONS}
          triggerColors={TRIGGER_COLORS}
          getTriggerLabel={getTriggerLabel}
          onToggle={(id) => toggleMutation.mutate(id)}
          onEdit={handleEditWorkflow}
          onDelete={handleDeleteWorkflow}
          onViewHistory={handleViewHistory}
          onCreateNew={() => setShowBuilder(true)}
        />
      )}

      {activeTab === 'executions' && (
        <Suspense fallback={<div className="text-gray-500 p-4">Loading execution history...</div>}>
          <ExecutionHistoryTab
            executions={executions}
            executionsLoading={executionsLoading}
            executionFilters={executionFilters}
            setExecutionFilters={setExecutionFilters}
            workflows={workflows}
            t={t}
            language={language}
            getTriggerLabel={getTriggerLabel}
          />
        </Suspense>
      )}

      {activeTab === 'stats' && (
        <Suspense fallback={<div className="text-gray-500 p-4">Loading statistics...</div>}>
          <AutomationStatsTab
            stats={stats}
            statsLoading={statsLoading}
            t={t}
            language={language}
            triggerIcons={TRIGGER_ICONS}
            triggerColors={TRIGGER_COLORS}
            getTriggerLabel={getTriggerLabel}
          />
        </Suspense>
      )}
    </div>
  );
}
