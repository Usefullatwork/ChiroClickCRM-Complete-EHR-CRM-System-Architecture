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

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../i18n';
import {
  Zap,
  Plus,
  Play,
  Pause,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Gift,
  UserPlus,
  RefreshCw,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  History,
  ChevronDown,
  ChevronRight,
  BarChart2,
  Users,
  MessageSquare,
  Mail,
  Bell
} from 'lucide-react';
import WorkflowBuilder from '../components/workflows/WorkflowBuilder';
import { automationsAPI, patientsAPI, usersAPI } from '../services/api';
import { formatDate, formatRelativeTime } from '../lib/utils';
import toast from '../utils/toast';

// =============================================================================
// API HELPERS
// =============================================================================

// Add automations API if not in api.js
const automationsAPILocal = {
  getWorkflows: (params) => fetch(`/api/v1/automations/workflows?${new URLSearchParams(params)}`).then(r => r.json()),
  getWorkflow: (id) => fetch(`/api/v1/automations/workflows/${id}`).then(r => r.json()),
  createWorkflow: (data) => fetch('/api/v1/automations/workflows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  updateWorkflow: (id, data) => fetch(`/api/v1/automations/workflows/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  deleteWorkflow: (id) => fetch(`/api/v1/automations/workflows/${id}`, { method: 'DELETE' }).then(r => r.json()),
  toggleWorkflow: (id) => fetch(`/api/v1/automations/workflows/${id}/toggle`, { method: 'POST' }).then(r => r.json()),
  getExecutions: (params) => fetch(`/api/v1/automations/executions?${new URLSearchParams(params)}`).then(r => r.json()),
  getWorkflowExecutions: (id, params) => fetch(`/api/v1/automations/workflows/${id}/executions?${new URLSearchParams(params)}`).then(r => r.json()),
  testWorkflow: (data) => fetch('/api/v1/automations/workflows/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  getStats: () => fetch('/api/v1/automations/stats').then(r => r.json()),
  getTriggerTypes: () => fetch('/api/v1/automations/triggers').then(r => r.json()),
  getActionTypes: () => fetch('/api/v1/automations/actions').then(r => r.json())
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
  CUSTOM: Zap
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
  CUSTOM: 'gray'
};

const STATUS_COLORS = {
  PENDING: 'yellow',
  RUNNING: 'blue',
  COMPLETED: 'green',
  FAILED: 'red',
  CANCELLED: 'gray',
  PAUSED: 'orange'
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function Automations() {
  const queryClient = useQueryClient();
  const { lang: language, setLang: setLanguage } = useTranslation();

  // UI State
  const [activeTab, setActiveTab] = useState('workflows');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const [filters, setFilters] = useState({
    isActive: '',
    triggerType: '',
    search: ''
  });
  const [executionFilters, setExecutionFilters] = useState({
    status: '',
    workflowId: ''
  });

  // Labels
  const labels = {
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
      noActiveWorkflow: 'No active workflow'
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
      noActiveWorkflow: 'Ingen aktiv arbeidsflyt'
    }
  };

  const t = labels[language] || labels.no;

  // Queries
  const { data: workflowsData, isLoading: workflowsLoading } = useQuery({
    queryKey: ['workflows', filters],
    queryFn: () => api.getWorkflows({
      isActive: filters.isActive || undefined,
      triggerType: filters.triggerType || undefined,
      limit: 100
    })
  });

  const { data: executionsData, isLoading: executionsLoading } = useQuery({
    queryKey: ['workflow-executions', executionFilters],
    queryFn: () => api.getExecutions({
      status: executionFilters.status || undefined,
      workflowId: executionFilters.workflowId || undefined,
      limit: 50
    }),
    enabled: activeTab === 'executions'
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['workflow-stats'],
    queryFn: () => api.getStats(),
    enabled: activeTab === 'stats'
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-for-test'],
    queryFn: () => patientsAPI.getAll({ limit: 50 }),
    enabled: showBuilder
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: () => usersAPI.getAll(),
    enabled: showBuilder
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
    }
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
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      toast.success(t.deleteSuccess);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete workflow');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.toggleWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      toast.success(t.toggleSuccess);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to toggle workflow');
    }
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
      console.error('Test error:', error);
      throw error;
    }
  };

  const handleDeleteWorkflow = (workflow) => {
    if (window.confirm(t.confirmDelete)) {
      deleteMutation.mutate(workflow.id);
    }
  };

  const handleEditWorkflow = (workflow) => {
    setEditingWorkflow(workflow);
    setShowBuilder(true);
  };

  // Filter workflows by search
  const filteredWorkflows = workflows.filter(w => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        w.name?.toLowerCase().includes(searchLower) ||
        w.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Get trigger label
  const getTriggerLabel = (triggerType) => {
    const triggerLabels = {
      en: {
        PATIENT_CREATED: 'New Patient',
        APPOINTMENT_SCHEDULED: 'Appointment Booked',
        APPOINTMENT_COMPLETED: 'Appointment Done',
        APPOINTMENT_MISSED: 'No Show',
        APPOINTMENT_CANCELLED: 'Cancelled',
        DAYS_SINCE_VISIT: 'Recall',
        BIRTHDAY: 'Birthday',
        LIFECYCLE_CHANGE: 'Lifecycle',
        CUSTOM: 'Custom'
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
        CUSTOM: 'Egendefinert'
      }
    };
    return triggerLabels[language]?.[triggerType] || triggerType;
  };

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
          {/* Language Toggle */}
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
            { id: 'stats', label: t.stats, icon: BarChart2 }
          ].map(tab => (
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

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <>
          {/* Filters */}
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {language === 'no' ? 'Filtrer:' : 'Filter:'}
                </span>
              </div>

              <select
                value={filters.isActive}
                onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t.allStatuses}</option>
                <option value="true">{t.activeOnly}</option>
                <option value="false">{t.inactiveOnly}</option>
              </select>

              <select
                value={filters.triggerType}
                onChange={(e) => setFilters(prev => ({ ...prev, triggerType: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t.allTriggers}</option>
                {Object.keys(TRIGGER_ICONS).map(type => (
                  <option key={type} value={type}>{getTriggerLabel(type)}</option>
                ))}
              </select>

              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Workflows List */}
          <div className="bg-white rounded-lg border border-gray-200">
            {workflowsLoading ? (
              <div className="px-6 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-3">
                  {language === 'no' ? 'Laster arbeidsflyter...' : 'Loading workflows...'}
                </p>
              </div>
            ) : filteredWorkflows.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredWorkflows.map(workflow => {
                  const TriggerIcon = TRIGGER_ICONS[workflow.trigger_type] || Zap;
                  const triggerColor = TRIGGER_COLORS[workflow.trigger_type] || 'gray';
                  const successRate = workflow.total_runs > 0
                    ? Math.round((workflow.successful_count / workflow.execution_count) * 100)
                    : 0;

                  return (
                    <div
                      key={workflow.id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Trigger Icon */}
                          <div className={`w-12 h-12 rounded-lg bg-${triggerColor}-100 flex items-center justify-center`}>
                            <TriggerIcon className={`w-6 h-6 text-${triggerColor}-600`} />
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                workflow.is_active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {workflow.is_active ? t.enabled : t.disabled}
                              </span>
                            </div>

                            {workflow.description && (
                              <p className="text-sm text-gray-500 mt-1">{workflow.description}</p>
                            )}

                            <div className="flex items-center gap-6 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <TriggerIcon className="w-3 h-3" />
                                {getTriggerLabel(workflow.trigger_type)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {t.lastRun}: {workflow.last_execution
                                  ? formatRelativeTime(workflow.last_execution)
                                  : t.never}
                              </span>
                              <span className="flex items-center gap-1">
                                <Play className="w-3 h-3" />
                                {t.totalRuns}: {workflow.execution_count || 0}
                              </span>
                              {workflow.execution_count > 0 && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  {t.successRate}: {successRate}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {/* Toggle */}
                          <button
                            onClick={() => toggleMutation.mutate(workflow.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              workflow.is_active
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={workflow.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {workflow.is_active ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Play className="w-5 h-5" />
                            )}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleEditWorkflow(workflow)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={t.edit}
                          >
                            <Edit className="w-5 h-5" />
                          </button>

                          {/* History */}
                          <button
                            onClick={() => {
                              setSelectedWorkflowId(workflow.id);
                              setExecutionFilters({ ...executionFilters, workflowId: workflow.id });
                              setActiveTab('executions');
                            }}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title={t.viewHistory}
                          >
                            <History className="w-5 h-5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteWorkflow(workflow)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={t.delete}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">{t.noWorkflows}</h3>
                <p className="text-sm text-gray-500 mt-1">{t.noWorkflowsDesc}</p>
                <button
                  onClick={() => setShowBuilder(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  {t.createWorkflow}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Executions Tab */}
      {activeTab === 'executions' && (
        <>
          {/* Filters */}
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {language === 'no' ? 'Filtrer:' : 'Filter:'}
                </span>
              </div>

              <select
                value={executionFilters.status}
                onChange={(e) => setExecutionFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t.allStatuses}</option>
                <option value="COMPLETED">{language === 'no' ? 'Fullfort' : 'Completed'}</option>
                <option value="RUNNING">{language === 'no' ? 'Kjorer' : 'Running'}</option>
                <option value="FAILED">{language === 'no' ? 'Feilet' : 'Failed'}</option>
                <option value="PENDING">{language === 'no' ? 'Venter' : 'Pending'}</option>
              </select>

              <select
                value={executionFilters.workflowId}
                onChange={(e) => setExecutionFilters(prev => ({ ...prev, workflowId: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{language === 'no' ? 'Alle arbeidsflyter' : 'All Workflows'}</option>
                {workflows.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>

              {executionFilters.workflowId && (
                <button
                  onClick={() => setExecutionFilters({ status: '', workflowId: '' })}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {language === 'no' ? 'Nullstill filter' : 'Clear filters'}
                </button>
              )}
            </div>
          </div>

          {/* Executions Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'no' ? 'Arbeidsflyt' : 'Workflow'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.patient}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.started}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {executionsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : executions.length > 0 ? (
                  executions.map(execution => {
                    const statusColor = STATUS_COLORS[execution.status] || 'gray';

                    return (
                      <tr key={execution.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {execution.workflow_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getTriggerLabel(execution.trigger_type)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {execution.patient_name || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${statusColor}-100 text-${statusColor}-700`}>
                            {execution.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatRelativeTime(execution.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {execution.current_step || 0}/{execution.total_steps || 0}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">{t.noExecutions}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Trigger Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.triggerStats}</h3>
            {statsLoading ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : stats.trigger_stats?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.trigger_stats.map(stat => {
                  const TriggerIcon = TRIGGER_ICONS[stat.trigger_type] || Zap;
                  const triggerColor = TRIGGER_COLORS[stat.trigger_type] || 'gray';

                  return (
                    <div
                      key={stat.trigger_type}
                      className={`p-4 rounded-lg bg-${triggerColor}-50 border border-${triggerColor}-200`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <TriggerIcon className={`w-5 h-5 text-${triggerColor}-600`} />
                        <span className="text-sm font-medium text-gray-700">
                          {getTriggerLabel(stat.trigger_type)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div>
                          <span className="font-medium text-gray-900">{stat.workflow_count}</span>
                          <span className="ml-1">
                            {language === 'no' ? 'arbeidsflyter' : 'workflows'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{stat.active_workflows}</span>
                          <span className="ml-1">
                            {language === 'no' ? 'aktive' : 'active'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{stat.total_executions}</span>
                          <span className="ml-1">
                            {language === 'no' ? 'utforelser' : 'runs'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-green-600">{stat.successful_executions}</span>
                          <span className="ml-1">
                            {language === 'no' ? 'vellykket' : 'success'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                {language === 'no' ? 'Ingen statistikk tilgjengelig' : 'No statistics available'}
              </p>
            )}
          </div>

          {/* Upcoming Triggers */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.upcomingTriggers}</h3>
            {stats.upcoming_triggers ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Birthdays */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-gray-700">{t.birthdays}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      stats.upcoming_triggers.birthdays?.has_active_workflow
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {stats.upcoming_triggers.birthdays?.has_active_workflow
                        ? t.hasActiveWorkflow
                        : t.noActiveWorkflow}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {stats.upcoming_triggers.birthdays?.count || 0}
                  </div>
                  <div className="space-y-1 text-sm text-gray-500">
                    {stats.upcoming_triggers.birthdays?.patients?.slice(0, 3).map(p => (
                      <div key={p.id} className="flex items-center justify-between">
                        <span>{p.first_name} {p.last_name}</span>
                        <span>{p.days_until_birthday}d</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recalls */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-gray-700">{t.recalls}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      stats.upcoming_triggers.recalls?.has_active_workflow
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {stats.upcoming_triggers.recalls?.has_active_workflow
                        ? t.hasActiveWorkflow
                        : t.noActiveWorkflow}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {stats.upcoming_triggers.recalls?.count || 0}
                  </div>
                  <div className="space-y-1 text-sm text-gray-500">
                    {stats.upcoming_triggers.recalls?.patients?.slice(0, 3).map(p => (
                      <div key={p.id} className="flex items-center justify-between">
                        <span>{p.first_name} {p.last_name}</span>
                        <span>{p.days_since_visit}d</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                {language === 'no' ? 'Laster...' : 'Loading...'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Add formatRelativeTime if not in utils
function formatRelativeTime(dateString) {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
