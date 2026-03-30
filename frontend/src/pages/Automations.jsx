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

// Note: LABELS and TRIGGER_LABELS removed — now served by i18n 'automations' namespace.

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
// MAIN COMPONENT
// =============================================================================

export default function Automations() {
  const queryClient = useQueryClient();
  const { t, lang: language, setLang: setLanguage } = useTranslation('automations');
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

  const getTriggerLabel = (triggerType) => t(`trigger_${triggerType}`, triggerType);

  // Build a labels object for child components that still expect an object-style t prop
  const labels = {
    title: t('title', 'Automatiserte Arbeidsflyter'),
    subtitle: t('subtitle', 'Automatiser pasientengasjement og oppfølginger'),
    workflows: t('workflows', 'Arbeidsflyter'),
    executions: t('executions', 'Utførelseshistorikk'),
    stats: t('stats', 'Statistikk'),
    createWorkflow: t('createWorkflow', 'Opprett arbeidsflyt'),
    allStatuses: t('allStatuses', 'Alle statuser'),
    activeOnly: t('activeOnly', 'Kun aktive'),
    inactiveOnly: t('inactiveOnly', 'Kun inaktive'),
    allTriggers: t('allTriggers', 'Alle triggere'),
    searchPlaceholder: t('searchPlaceholder', 'Søk i arbeidsflyter...'),
    noWorkflows: t('noWorkflows', 'Ingen arbeidsflyter funnet'),
    noWorkflowsDesc: t(
      'noWorkflowsDesc',
      'Opprett din første arbeidsflyt for å automatisere pasientengasjement.'
    ),
    enabled: t('enabled', 'Aktivert'),
    disabled: t('disabled', 'Deaktivert'),
    lastRun: t('lastRun', 'Sist kjørt'),
    never: t('never', 'Aldri'),
    totalRuns: t('totalRuns', 'Totalt kjørt'),
    successRate: t('successRate', 'Suksessrate'),
    edit: t('edit', 'Rediger'),
    delete: t('delete', 'Slett'),
    viewHistory: t('viewHistory', 'Se historikk'),
    confirmDelete: t('confirmDelete', 'Er du sikker på at du vil slette denne arbeidsflyten?'),
    deleteSuccess: t('deleteSuccess', 'Arbeidsflyt slettet'),
    toggleSuccess: t('toggleSuccess', 'Arbeidsflyt status oppdatert'),
    saveSuccess: t('saveSuccess', 'Arbeidsflyt lagret'),
    noExecutions: t('noExecutions', 'Ingen utførelser funnet'),
    patient: t('patient', 'Pasient'),
    status: t('status', 'Status'),
    started: t('started', 'Startet'),
    completed: t('completed', 'Fullført'),
    duration: t('duration', 'Varighet'),
    actions: t('actions', 'Handlinger'),
    triggerStats: t('triggerStats', 'Trigger-statistikk'),
    upcomingTriggers: t('upcomingTriggers', 'Kommende triggere'),
    birthdays: t('birthdays', 'Bursdager'),
    recalls: t('recalls', 'Tilbakekallinger'),
    hasActiveWorkflow: t('hasActiveWorkflow', 'Har aktiv arbeidsflyt'),
    noActiveWorkflow: t('noActiveWorkflow', 'Ingen aktiv arbeidsflyt'),
  };

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
  const staffRaw = staffData?.data?.data || staffData?.data;
  const staff = Array.isArray(staffRaw) ? staffRaw : [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => api.createWorkflow(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      setShowBuilder(false);
      toast.success(t('saveSuccess', 'Arbeidsflyt lagret'));
    },
    onError: (error) => {
      toast.error(error.message || t('failedToCreate', 'Kunne ikke opprette arbeidsflyt'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateWorkflow(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      setShowBuilder(false);
      setEditingWorkflow(null);
      toast.success(t('saveSuccess', 'Arbeidsflyt lagret'));
    },
    onError: (error) => {
      toast.error(error.message || t('failedToUpdate', 'Kunne ikke oppdatere arbeidsflyt'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      toast.success(t('deleteSuccess', 'Arbeidsflyt slettet'));
    },
    onError: (error) => {
      toast.error(error.message || t('failedToDelete', 'Kunne ikke slette arbeidsflyt'));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.toggleWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      toast.success(t('toggleSuccess', 'Arbeidsflyt status oppdatert'));
    },
    onError: (error) => {
      toast.error(error.message || t('failedToToggle', 'Kunne ikke endre status for arbeidsflyt'));
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
    const ok = await confirm({
      title: t('confirmDelete', 'Er du sikker på at du vil slette denne arbeidsflyten?'),
      variant: 'destructive',
    });
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
            {t('title', 'Automatiserte Arbeidsflyter')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('subtitle', 'Automatiser pasientengasjement og oppfølginger')}
          </p>
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
            {t('createWorkflow', 'Opprett arbeidsflyt')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div role="tablist" aria-label="Automatiseringer" className="-mb-px flex gap-6">
          {[
            { id: 'workflows', label: t('workflows', 'Arbeidsflyter'), icon: Zap },
            { id: 'executions', label: t('executions', 'Utforelseshistorikk'), icon: History },
            { id: 'stats', label: t('stats', 'Statistikk'), icon: BarChart2 },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'workflows' && (
        <div role="tabpanel" id="tabpanel-workflows" aria-labelledby="tab-workflows">
          <WorkflowListTab
            filteredWorkflows={filteredWorkflows}
            workflowsLoading={workflowsLoading}
            filters={filters}
            setFilters={setFilters}
            t={labels}
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
        </div>
      )}

      {activeTab === 'executions' && (
        <div role="tabpanel" id="tabpanel-executions" aria-labelledby="tab-executions">
          <Suspense
            fallback={
              <div className="text-gray-500 dark:text-gray-400 p-4">
                {t('loadingExecutionHistory')}
              </div>
            }
          >
            <ExecutionHistoryTab
              executions={executions}
              executionsLoading={executionsLoading}
              executionFilters={executionFilters}
              setExecutionFilters={setExecutionFilters}
              workflows={workflows}
              t={labels}
              language={language}
              getTriggerLabel={getTriggerLabel}
            />
          </Suspense>
        </div>
      )}

      {activeTab === 'stats' && (
        <div role="tabpanel" id="tabpanel-stats" aria-labelledby="tab-stats">
          <Suspense
            fallback={
              <div className="text-gray-500 dark:text-gray-400 p-4">{t('loadingStatistics')}</div>
            }
          >
            <AutomationStatsTab
              stats={stats}
              statsLoading={statsLoading}
              t={labels}
              language={language}
              triggerIcons={TRIGGER_ICONS}
              triggerColors={TRIGGER_COLORS}
              getTriggerLabel={getTriggerLabel}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
