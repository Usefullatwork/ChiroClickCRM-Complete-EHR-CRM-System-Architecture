import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  Pause,
  Plus,
  ArrowRight,
  Clock,
  Mail,
  MessageSquare,
  UserPlus,
  Calendar,
  Star,
  AlertTriangle,
  CheckCircle,
  _XCircle,
  Edit,
  _Trash2,
  Copy,
  ChevronRight,
  _Settings,
  Activity,
  Loader2,
} from 'lucide-react';
import { crmAPI } from '../../services/api';
import toast from '../../utils/toast';
import logger from '../../utils/logger';

const WorkflowBuilder = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Trigger types
  const triggerTypes = [
    {
      id: 'NEW_PATIENT',
      label: 'Ny Pasient',
      icon: UserPlus,
      description: 'Når en ny pasient registreres',
    },
    {
      id: 'APPOINTMENT_BOOKED',
      label: 'Time Booket',
      icon: Calendar,
      description: 'Når en time blir bestilt',
    },
    {
      id: 'APPOINTMENT_COMPLETED',
      label: 'Behandling Fullført',
      icon: CheckCircle,
      description: 'Etter en behandling',
    },
    { id: 'NO_VISIT', label: 'Ingen Besøk', icon: Clock, description: 'X dager uten besøk' },
    { id: 'BIRTHDAY', label: 'Bursdag', icon: Star, description: 'På pasientens bursdag' },
    {
      id: 'LIFECYCLE_CHANGE',
      label: 'Statusendring',
      icon: Activity,
      description: 'Når livssyklus endres',
    },
  ];

  // Action types
  const actionTypes = [
    { id: 'SEND_EMAIL', label: 'Send E-post', icon: Mail },
    { id: 'SEND_SMS', label: 'Send SMS', icon: MessageSquare },
    { id: 'CREATE_TASK', label: 'Opprett Oppgave', icon: CheckCircle },
    { id: 'WAIT', label: 'Vent', icon: Clock },
    { id: 'UPDATE_PATIENT', label: 'Oppdater Pasient', icon: UserPlus },
  ];

  // Fetch workflows from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await crmAPI.getWorkflows();
        const workflowData = (response.data?.workflows || response.data || []).map((w) => ({
          id: w.id,
          name: w.name,
          description: w.description,
          trigger: w.trigger_type || w.trigger,
          triggerConfig: w.trigger_config,
          status: w.status || 'DRAFT',
          executionCount: w.execution_count || 0,
          successRate: w.success_rate || 0,
          lastExecuted: w.last_executed_at,
          steps: w.steps || [],
        }));
        setWorkflows(workflowData);
      } catch (err) {
        logger.error('Error fetching workflows:', err);
        setError(err.message || 'Failed to load workflows');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Create new workflow
  const _handleCreateWorkflow = async (workflowData) => {
    try {
      const response = await crmAPI.createWorkflow(workflowData);
      setWorkflows((prev) => [...prev, response.data]);
      setShowNewWorkflow(false);
    } catch (err) {
      logger.error('Error creating workflow:', err);
      toast.error(`Failed to create workflow: ${err.message}`);
    }
  };

  // Toggle workflow (activate/pause)
  const _handleToggleWorkflow = async (workflowId, active) => {
    try {
      await crmAPI.toggleWorkflow(workflowId, active);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === workflowId ? { ...w, status: active ? 'ACTIVE' : 'PAUSED' } : w))
      );
    } catch (err) {
      logger.error('Error toggling workflow:', err);
      toast.error(`Failed to toggle workflow: ${err.message}`);
    }
  };

  // Status config
  const statusConfig = {
    ACTIVE: { label: 'Aktiv', color: 'bg-green-100 text-green-700', icon: Play },
    PAUSED: { label: 'Pauset', color: 'bg-yellow-100 text-yellow-700', icon: Pause },
    DRAFT: { label: 'Utkast', color: 'bg-gray-100 text-gray-700', icon: Edit },
  };

  // Filter workflows
  const filteredWorkflows = workflows.filter((w) => {
    if (activeTab === 'active') {
      return w.status === 'ACTIVE';
    }
    if (activeTab === 'paused') {
      return w.status === 'PAUSED';
    }
    if (activeTab === 'draft') {
      return w.status === 'DRAFT';
    }
    return true;
  });

  // Stats
  const stats = {
    total: workflows.length,
    active: workflows.filter((w) => w.status === 'ACTIVE').length,
    totalExecutions: workflows.reduce((sum, w) => sum + w.executionCount, 0),
    avgSuccessRate: Math.round(
      workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length
    ),
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('nb-NO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Laster automatiseringer...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Prøv igjen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Automatiseringer</h2>
          <p className="text-gray-600">Sett opp automatiske arbeidsflyter for pasientoppfølging</p>
        </div>
        <button
          onClick={() => setShowNewWorkflow(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ny Automatisering
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-600">Totalt Arbeidsflyter</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Play className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
          <p className="text-sm text-gray-600">Aktive</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalExecutions.toLocaleString('nb-NO')}
          </p>
          <p className="text-sm text-gray-600">Totalt Kjøringer</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.avgSuccessRate}%</p>
          <p className="text-sm text-gray-600">Gj.snitt Suksessrate</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {[
          {
            id: 'active',
            label: 'Aktive',
            count: workflows.filter((w) => w.status === 'ACTIVE').length,
          },
          {
            id: 'paused',
            label: 'Pauset',
            count: workflows.filter((w) => w.status === 'PAUSED').length,
          },
          {
            id: 'draft',
            label: 'Utkast',
            count: workflows.filter((w) => w.status === 'DRAFT').length,
          },
          { id: 'all', label: 'Alle', count: workflows.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {filteredWorkflows.map((workflow) => {
          const trigger = triggerTypes.find((t) => t.id === workflow.trigger);
          const TriggerIcon = trigger?.icon || Zap;
          const status = statusConfig[workflow.status];
          const StatusIcon = status.icon;

          return (
            <div
              key={workflow.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedWorkflow(workflow)}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-gray-900">{workflow.name}</h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{workflow.description}</p>

                  {/* Workflow steps preview */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                      <TriggerIcon className="w-3 h-3" />
                      {trigger?.label}
                    </div>
                    {workflow.steps.slice(0, 4).map((step, index) => {
                      const action = actionTypes.find((a) => a.id === step.type);
                      const ActionIcon = action?.icon || Zap;
                      return (
                        <React.Fragment key={index}>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            <ActionIcon className="w-3 h-3" />
                            {action?.label}
                          </div>
                        </React.Fragment>
                      );
                    })}
                    {workflow.steps.length > 4 && (
                      <span className="text-xs text-gray-500">
                        +{workflow.steps.length - 4} mer
                      </span>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex gap-6 text-center flex-shrink-0">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{workflow.executionCount}</p>
                    <p className="text-xs text-gray-500">Kjøringer</p>
                  </div>
                  <div>
                    <p
                      className={`text-lg font-bold ${
                        workflow.successRate >= 90
                          ? 'text-green-600'
                          : workflow.successRate >= 70
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {workflow.successRate}%
                    </p>
                    <p className="text-xs text-gray-500">Suksess</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {workflow.status === 'ACTIVE' ? (
                    <button
                      className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg"
                      title="Pause"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg"
                      title="Aktiver"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                    title="Rediger"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                    title="Kopier"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Last executed */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Sist kjørt: {formatDateTime(workflow.lastExecuted)}
                </span>
                <button className="text-blue-500 hover:underline flex items-center gap-1">
                  Se detaljer <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Workflow Modal */}
      {showNewWorkflow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ny Automatisering</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Navn</label>
                <input
                  type="text"
                  placeholder="F.eks. 'Velkomstsekvens'"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
                <input
                  type="text"
                  placeholder="Kort beskrivelse av automatiseringen..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Utløser (Trigger)
                </label>
                <div className="space-y-2">
                  {triggerTypes.map((trigger) => {
                    const Icon = trigger.icon;
                    return (
                      <button
                        key={trigger.id}
                        className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center gap-3 text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{trigger.label}</p>
                          <p className="text-sm text-gray-500">{trigger.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewWorkflow(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Avbryt
              </button>
              <button
                onClick={() => setShowNewWorkflow(false)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Neste: Legg til Handlinger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Detail Modal */}
      {selectedWorkflow && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedWorkflow(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedWorkflow.name}</h3>
                <p className="text-gray-500">{selectedWorkflow.description}</p>
              </div>
              <button
                onClick={() => setSelectedWorkflow(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ×
              </button>
            </div>

            {/* Workflow Steps Visual */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-4">Arbeidsflyt</h4>
              <div className="relative">
                {/* Trigger */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    {(() => {
                      const trigger = triggerTypes.find((t) => t.id === selectedWorkflow.trigger);
                      const TriggerIcon = trigger?.icon || Zap;
                      return <TriggerIcon className="w-6 h-6 text-blue-600" />;
                    })()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {triggerTypes.find((t) => t.id === selectedWorkflow.trigger)?.label}
                    </p>
                    <p className="text-sm text-gray-500">Utløser</p>
                  </div>
                </div>

                {/* Steps */}
                {selectedWorkflow.steps.map((step, index) => {
                  const action = actionTypes.find((a) => a.id === step.type);
                  const ActionIcon = action?.icon || Zap;
                  return (
                    <div key={index} className="flex items-center gap-4 mb-4 ml-6">
                      <div className="w-8 border-l-2 border-gray-200 h-8 -mt-8" />
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center -ml-5">
                        <ActionIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{action?.label}</p>
                        {step.config?.days && (
                          <p className="text-sm text-gray-500">Vent {step.config.days} dag(er)</p>
                        )}
                        {step.config?.hours && (
                          <p className="text-sm text-gray-500">Vent {step.config.hours} time(r)</p>
                        )}
                        {step.config?.template && (
                          <p className="text-sm text-gray-500">Mal: {step.config.template}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {selectedWorkflow.executionCount}
                </p>
                <p className="text-sm text-gray-500">Totalt Kjøringer</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p
                  className={`text-2xl font-bold ${
                    selectedWorkflow.successRate >= 90 ? 'text-green-600' : 'text-yellow-600'
                  }`}
                >
                  {selectedWorkflow.successRate}%
                </p>
                <p className="text-sm text-gray-500">Suksessrate</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  {formatDateTime(selectedWorkflow.lastExecuted)}
                </p>
                <p className="text-sm text-gray-500">Sist Kjørt</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedWorkflow(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Lukk
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2">
                <Edit className="w-4 h-4" />
                Rediger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilder;
