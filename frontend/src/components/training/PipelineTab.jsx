/**
 * PipelineTab — Training pipeline dashboard
 *
 * Features:
 * - Status banner: Idle / Running / Failed
 * - Trigger card with dry run toggle and model selector
 * - 6-step progress tracker
 * - Retraining history table
 * - Model versions with rollback
 * - RLAIF section
 */

import { useState } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Zap,
  RotateCcw,
  Activity,
} from 'lucide-react';
import {
  useRetrainingStatus,
  useRetrainingHistory,
  useTriggerRetraining,
  useRollbackModel,
  useRLAIFStats,
  useGeneratePreferencePairs,
} from '../../hooks/useAITraining';

const PIPELINE_STEPS = [
  { key: 'export', label: 'Eksporter' },
  { key: 'merge', label: 'Sla sammen' },
  { key: 'convert', label: 'Konverter' },
  { key: 'build', label: 'Bygg' },
  { key: 'test', label: 'Test' },
  { key: 'activate', label: 'Aktiver' },
];

const MODEL_OPTIONS = [
  { value: '', label: 'Alle modeller' },
  { value: 'chiro-no', label: 'chiro-no (Standard)' },
  { value: 'chiro-fast', label: 'chiro-fast (Rask)' },
  { value: 'chiro-norwegian', label: 'chiro-norwegian (Norsk)' },
  { value: 'chiro-medical', label: 'chiro-medical (Medisinsk)' },
];

export default function PipelineTab() {
  const [dryRun, setDryRun] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [expandedEvent, setExpandedEvent] = useState(null);

  const statusQuery = useRetrainingStatus();
  const historyQuery = useRetrainingHistory(20);
  const triggerMutation = useTriggerRetraining();
  const rollbackMutation = useRollbackModel();
  const rlaifStatsQuery = useRLAIFStats();
  const generatePairsMutation = useGeneratePreferencePairs();

  const status = statusQuery.data;
  const history = historyQuery.data || [];
  const rlaifStats = rlaifStatsQuery.data;

  const pipelineRunning = status?.status === 'in_progress';
  const pipelineFailed = status?.status === 'failed';

  const handleTrigger = () => {
    const opts = { dryRun };
    if (selectedModel) opts.modelName = selectedModel;
    triggerMutation.mutate(opts);
  };

  const getStepStatus = (stepKey) => {
    if (!status?.currentStep) return 'pending';
    const currentIdx = PIPELINE_STEPS.findIndex((s) => s.key === status.currentStep);
    const thisIdx = PIPELINE_STEPS.findIndex((s) => s.key === stepKey);
    if (pipelineFailed && thisIdx === currentIdx) return 'failed';
    if (thisIdx < currentIdx) return 'done';
    if (thisIdx === currentIdx) return 'running';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div
        className={`rounded-lg p-4 border ${
          pipelineRunning
            ? 'bg-blue-50 border-blue-200'
            : pipelineFailed
              ? 'bg-red-50 border-red-200'
              : 'bg-green-50 border-green-200'
        }`}
      >
        <div className="flex items-center gap-3">
          {pipelineRunning ? (
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          ) : pipelineFailed ? (
            <XCircle className="w-6 h-6 text-red-600" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          )}
          <div>
            <p className="font-medium">
              {pipelineRunning
                ? 'Treningspipeline kjorer...'
                : pipelineFailed
                  ? 'Siste kjoring feilet'
                  : 'Pipeline ledig'}
            </p>
            {status?.lastRunAt && (
              <p className="text-sm text-gray-600">
                Sist kjort: {new Date(status.lastRunAt).toLocaleString('nb-NO')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 6-Step Progress Tracker */}
      {(pipelineRunning || pipelineFailed) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Fremdrift</h3>
          <div className="flex items-center justify-between">
            {PIPELINE_STEPS.map((step, i) => {
              const stepStatus = getStepStatus(step.key);
              return (
                <div key={step.key} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        stepStatus === 'done'
                          ? 'bg-green-500 text-white'
                          : stepStatus === 'running'
                            ? 'bg-blue-500 text-white animate-pulse'
                            : stepStatus === 'failed'
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {stepStatus === 'done' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : stepStatus === 'failed' ? (
                        <XCircle className="w-4 h-4" />
                      ) : stepStatus === 'running' ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className="text-xs mt-1 text-gray-600">{step.label}</span>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div
                      className={`w-12 h-0.5 mx-1 ${
                        stepStatus === 'done' ? 'bg-green-400' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trigger Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Play className="w-5 h-5" />
          Start trening
        </h3>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modell</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded"
            />
            Torkjoring (dry run)
          </label>
          <button
            onClick={handleTrigger}
            disabled={pipelineRunning || triggerMutation.isPending}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {triggerMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 inline mr-1 animate-spin" /> Starter...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 inline mr-1" /> Start trening
              </>
            )}
          </button>
        </div>
        {triggerMutation.isError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {triggerMutation.error?.response?.data?.error || triggerMutation.error?.message}
          </div>
        )}
        {triggerMutation.isSuccess && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            Trening startet{dryRun ? ' (torkjoring)' : ''}.
          </div>
        )}
      </div>

      {/* Retraining History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Treningshistorikk
        </h3>
        {history.length === 0 ? (
          <p className="text-gray-500 text-sm">Ingen tidligere treningskjoringer.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-2 px-3 text-left font-medium text-gray-600">Dato</th>
                  <th className="py-2 px-3 text-left font-medium text-gray-600">Trigger</th>
                  <th className="py-2 px-3 text-right font-medium text-gray-600">Eksempler</th>
                  <th className="py-2 px-3 text-left font-medium text-gray-600">Status</th>
                  <th className="py-2 px-3 text-left font-medium text-gray-600">Detaljer</th>
                </tr>
              </thead>
              <tbody>
                {history.map((event) => (
                  <tr key={event.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-600">
                      {new Date(event.created_at).toLocaleString('nb-NO', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {event.trigger_type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">{event.training_samples_count || '-'}</td>
                    <td className="py-2 px-3">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="py-2 px-3">
                      {event.test_results && (
                        <button
                          onClick={() =>
                            setExpandedEvent(expandedEvent === event.id ? null : event.id)
                          }
                          className="text-blue-600 text-xs hover:underline flex items-center gap-1"
                        >
                          Testresultater <ChevronDown className="w-3 h-3" />
                        </button>
                      )}
                      {expandedEvent === event.id && event.test_results && (
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(event.test_results, null, 2)}
                        </pre>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Model Versions & Rollback */}
      {status?.modelVersions && status.modelVersions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Modellversjoner
          </h3>
          <div className="space-y-2">
            {status.modelVersions.map((v) => (
              <div key={v.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <span className="font-medium text-sm">{v.model_name}</span>
                  <span className="ml-2 text-xs text-gray-500">v{v.version}</span>
                  {v.is_active && (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      Aktiv
                    </span>
                  )}
                </div>
                {!v.is_active && (
                  <button
                    onClick={() => rollbackMutation.mutate(v.version)}
                    disabled={rollbackMutation.isPending}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Tilbakerull
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RLAIF Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          RLAIF (AI-assistert feedback)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{rlaifStats?.totalPairs || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Preferansepar generert</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700">
              {rlaifStats?.totalEvaluations || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">Evalueringer</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">
              {rlaifStats?.avgQualityScore
                ? `${(rlaifStats.avgQualityScore * 100).toFixed(0)}%`
                : '-'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Gj.sn. kvalitetsscore</div>
          </div>
        </div>
        <button
          onClick={() => generatePairsMutation.mutate({ suggestions: [], maxPairs: 50 })}
          disabled={generatePairsMutation.isPending}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:bg-gray-400"
        >
          {generatePairsMutation.isPending ? 'Genererer...' : 'Generer preferansepar'}
        </button>
        {generatePairsMutation.isSuccess && (
          <p className="mt-2 text-sm text-green-700">
            Genererte {generatePairsMutation.data?.data?.data?.pairsGenerated || 0} par.
          </p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    completed: { bg: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    failed: { bg: 'bg-red-100 text-red-700', icon: XCircle },
    in_progress: { bg: 'bg-blue-100 text-blue-700', icon: RefreshCw },
    pending: { bg: 'bg-yellow-100 text-yellow-700', icon: Clock },
    rolled_back: { bg: 'bg-orange-100 text-orange-700', icon: RotateCcw },
  };
  const c = config[status] || config.pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${c.bg}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}
