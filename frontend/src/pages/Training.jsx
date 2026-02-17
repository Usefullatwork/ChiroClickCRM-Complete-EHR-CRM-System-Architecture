/**
 * Training Management Page
 * Manage AI model training pipeline, model lifecycle, and analytics
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Brain,
  FileText,
  Database,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Upload,
  RefreshCw,
  TestTube,
  Plus,
  Server,
  BarChart3,
  TrendingUp,
  Target,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { trainingAPI } from '../services/api';
import { useTranslation } from '../i18n';

const TABS = [
  { id: 'models', label: 'Modeller' },
  { id: 'analytics', label: 'Analyse' },
];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Training() {
  const { _t } = useTranslation('common');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('models');
  const [newExamples, setNewExamples] = useState('');
  const [testPrompt, setTestPrompt] = useState('');
  const [selectedTestModel, setSelectedTestModel] = useState('chiro-no');
  const [testResult, setTestResult] = useState(null);

  // Queries
  const statusQuery = useQuery({
    queryKey: ['training-status'],
    queryFn: async () => {
      const res = await trainingAPI.getStatus();
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  const dataQuery = useQuery({
    queryKey: ['training-data'],
    queryFn: async () => {
      const res = await trainingAPI.getData();
      return res.data.data;
    },
  });

  // Mutations
  const rebuildMutation = useMutation({
    mutationFn: () => trainingAPI.rebuild(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-status'] });
    },
  });

  const backupMutation = useMutation({
    mutationFn: () => trainingAPI.backup(),
  });

  const restoreMutation = useMutation({
    mutationFn: () => trainingAPI.restore(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-status'] });
    },
  });

  const addExamplesMutation = useMutation({
    mutationFn: (jsonlContent) => trainingAPI.addExamples(jsonlContent),
    onSuccess: () => {
      setNewExamples('');
      queryClient.invalidateQueries({ queryKey: ['training-data'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: ({ model, prompt }) => trainingAPI.testModel(model, prompt),
    onSuccess: (res) => {
      setTestResult(res.data.data);
    },
  });

  const status = statusQuery.data;
  const trainingData = dataQuery.data;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">AI Model Management</h1>
        </div>
        <p className="text-gray-600">
          Administrer AI-modeller, treningsdata og modellbygging for ChiroClick.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'models' && (
        <ModelsTab
          statusQuery={statusQuery}
          dataQuery={dataQuery}
          status={status}
          trainingData={trainingData}
          rebuildMutation={rebuildMutation}
          backupMutation={backupMutation}
          restoreMutation={restoreMutation}
          addExamplesMutation={addExamplesMutation}
          testMutation={testMutation}
          newExamples={newExamples}
          setNewExamples={setNewExamples}
          testPrompt={testPrompt}
          setTestPrompt={setTestPrompt}
          selectedTestModel={selectedTestModel}
          setSelectedTestModel={setSelectedTestModel}
          testResult={testResult}
        />
      )}

      {activeTab === 'analytics' && <AnalyticsTab />}
    </div>
  );
}

// ====================================================================
// Models Tab (existing content)
// ====================================================================
function ModelsTab({
  statusQuery,
  dataQuery,
  status,
  trainingData,
  rebuildMutation,
  backupMutation,
  restoreMutation,
  addExamplesMutation,
  testMutation,
  newExamples,
  setNewExamples,
  testPrompt,
  setTestPrompt,
  selectedTestModel,
  setSelectedTestModel,
  testResult,
}) {
  return (
    <>
      {/* Model Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Server className="w-5 h-5" />
            Modellstatus
          </h2>
          <button
            onClick={() => statusQuery.refetch()}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 inline mr-1 ${statusQuery.isFetching ? 'animate-spin' : ''}`}
            />
            Oppdater
          </button>
        </div>

        {statusQuery.isLoading ? (
          <div className="text-gray-500">Laster...</div>
        ) : statusQuery.isError ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-700 font-medium">Feil ved henting av status</div>
            <div className="text-red-600 text-sm mt-1">
              {statusQuery.error?.response?.data?.error ||
                statusQuery.error?.message ||
                'Ukjent feil'}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div
                className={`w-3 h-3 rounded-full ${status?.ollamaRunning ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="text-sm">
                Ollama: {status?.ollamaRunning ? 'Kjorer' : 'Ikke tilgjengelig'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {status?.models &&
                Object.entries(status.models).map(([name, info]) => (
                  <div
                    key={name}
                    className={`border rounded-lg p-3 ${info.exists ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {info.exists ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-medium text-sm">{name}</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {info.exists ? info.size || 'Installert' : 'Mangler'}
                    </p>
                  </div>
                ))}
            </div>

            {status?.missingModels > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {status.missingModels} modell(er) mangler. Bruk &quot;Rebuild&quot; eller
                  &quot;Restore&quot; nedenfor.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ActionCard
          icon={<RefreshCw className="w-5 h-5" />}
          title="Rebuild Models"
          description="Regenerer Modelfiles fra treningsdata og opprett Ollama-modeller pa nytt."
          buttonText={rebuildMutation.isPending ? 'Bygger...' : 'Rebuild'}
          onClick={() => rebuildMutation.mutate()}
          disabled={rebuildMutation.isPending}
          result={rebuildMutation.data?.data}
          error={rebuildMutation.error}
          color="blue"
        />
        <ActionCard
          icon={<Download className="w-5 h-5" />}
          title="Backup Models"
          description="Eksporter modeller til prosjektmappen for overforing til annen maskin."
          buttonText={backupMutation.isPending ? 'Eksporterer...' : 'Backup'}
          onClick={() => backupMutation.mutate()}
          disabled={backupMutation.isPending}
          result={backupMutation.data?.data}
          error={backupMutation.error}
          color="green"
        />
        <ActionCard
          icon={<Upload className="w-5 h-5" />}
          title="Restore Models"
          description="Gjenopprett modeller fra backup uten a laste ned base-modeller pa nytt."
          buttonText={restoreMutation.isPending ? 'Gjenoppretter...' : 'Restore'}
          onClick={() => restoreMutation.mutate()}
          disabled={restoreMutation.isPending}
          result={restoreMutation.data?.data}
          error={restoreMutation.error}
          color="purple"
        />
      </div>

      {/* Training Data */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Treningsdata
        </h2>

        {dataQuery.isLoading ? (
          <div className="text-gray-500">Laster...</div>
        ) : (
          <>
            <div className="mb-4">
              <span className="text-2xl font-bold text-blue-600">
                {trainingData?.totalExamples || 0}
              </span>
              <span className="text-gray-600 ml-2">totale eksempler</span>
            </div>

            <div className="space-y-2 mb-6">
              {trainingData?.files?.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{file.examples} eksempler</span>
                    <span>{file.sizeKB} KB</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Legg til eksempler (JSONL-format)
              </h3>
              <textarea
                value={newExamples}
                onChange={(e) => setNewExamples(e.target.value)}
                rows={4}
                placeholder={
                  '{"prompt": "Skriv SOAP-notat for...", "response": "S: ..."}\n{"prompt": "...", "response": "..."}'
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  En JSON-linje per eksempel. Felt: prompt, response/completion.
                </p>
                <button
                  onClick={() => addExamplesMutation.mutate(newExamples)}
                  disabled={!newExamples.trim() || addExamplesMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  {addExamplesMutation.isPending ? 'Legger til...' : 'Legg til'}
                </button>
              </div>
              {addExamplesMutation.isSuccess && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                  Lagt til {addExamplesMutation.data?.data?.data?.added || 0} eksempler.
                  {addExamplesMutation.data?.data?.data?.errors?.length > 0 && (
                    <span className="text-yellow-700 ml-2">
                      {addExamplesMutation.data.data.data.errors.length} feil.
                    </span>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Test Model */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Test modell
        </h2>

        <div className="flex gap-3 mb-3">
          <select
            value={selectedTestModel}
            onChange={(e) => setSelectedTestModel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="chiro-no">chiro-no (Primer)</option>
            <option value="chiro-fast">chiro-fast (Rask)</option>
            <option value="chiro-norwegian">chiro-norwegian (Norsk)</option>
            <option value="chiro-medical">chiro-medical (Medisinsk)</option>
          </select>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="Skriv en test-prompt (eller la blank for standard)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() =>
              testMutation.mutate({ model: selectedTestModel, prompt: testPrompt || undefined })
            }
            disabled={testMutation.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 text-sm whitespace-nowrap"
          >
            {testMutation.isPending ? (
              <>
                <Clock className="w-4 h-4 inline mr-1 animate-spin" /> Tester...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 inline mr-1" /> Kjor test
              </>
            )}
          </button>
        </div>

        {testResult && (
          <div className="mt-4 border rounded-lg p-4 bg-gray-50">
            <div className="text-xs text-gray-500 mb-1">
              Modell: {testResult.model} | Prompt: {testResult.prompt}
            </div>
            <div className="whitespace-pre-wrap text-sm font-mono">{testResult.response}</div>
          </div>
        )}

        {testMutation.isError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            Feil: {testMutation.error?.response?.data?.error || testMutation.error?.message}
          </div>
        )}
      </div>
    </>
  );
}

// ====================================================================
// Analytics Tab
// ====================================================================
function AnalyticsTab() {
  const [dateRange, setDateRange] = useState('30');

  const getDateParams = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(dateRange));
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const performanceQuery = useQuery({
    queryKey: ['analytics-performance', dateRange],
    queryFn: async () => {
      const res = await trainingAPI.getAnalyticsPerformance(getDateParams());
      return res.data.data;
    },
  });

  const usageQuery = useQuery({
    queryKey: ['analytics-usage', dateRange],
    queryFn: async () => {
      const res = await trainingAPI.getAnalyticsUsage(getDateParams());
      return res.data.data;
    },
  });

  const suggestionsQuery = useQuery({
    queryKey: ['analytics-suggestions', dateRange],
    queryFn: async () => {
      const res = await trainingAPI.getAnalyticsSuggestions({ limit: 30, ...getDateParams() });
      return res.data.data;
    },
  });

  const redFlagQuery = useQuery({
    queryKey: ['analytics-red-flags', dateRange],
    queryFn: async () => {
      const res = await trainingAPI.getAnalyticsRedFlags(getDateParams());
      return res.data.data;
    },
  });

  const comparisonQuery = useQuery({
    queryKey: ['analytics-comparison', dateRange],
    queryFn: async () => {
      const res = await trainingAPI.getAnalyticsComparison(getDateParams());
      return res.data.data;
    },
  });

  const comparison = comparisonQuery.data || [];
  const usage = usageQuery.data || { daily: [], taskTypes: [] };
  const redFlag = redFlagQuery.data || { summary: {}, trend: [] };
  const suggestions = suggestionsQuery.data || [];

  const exportSuggestionsCSV = () => {
    if (!suggestions.length) return;
    const headers = ['Dato', 'Type', 'Modell', 'Konfidens', 'Latens (ms)', 'Status', 'Vurdering'];
    const rows = suggestions.map((s) => [
      new Date(s.created_at).toLocaleDateString('nb-NO'),
      s.task_type,
      s.model_name,
      s.confidence_score ? (s.confidence_score * 100).toFixed(0) + '%' : '',
      s.latency_ms || '',
      s.accepted === true ? 'Godkjent' : s.accepted === false ? 'Avvist' : 'Venter',
      s.user_rating || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-forslag-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportComparisonCSV = () => {
    if (!comparison.length) return;
    const headers = [
      'Modell',
      'Totale forslag',
      'Godkjenningsrate (%)',
      'Gj.sn. vurdering',
      'Gj.sn. latens (ms)',
      'Tilbakemeldinger',
    ];
    const rows = comparison.map((c) => [
      c.model_name,
      c.total_suggestions,
      c.approval_rate,
      c.avg_user_rating || '',
      c.avg_latency_ms || '',
      c.total_feedback,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modellsammenligning-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = performanceQuery.isLoading || usageQuery.isLoading;

  if (isLoading) {
    return <div className="text-gray-500 p-6">Laster analysedata...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">AI-analyse</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Periode:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="7">Siste 7 dager</option>
            <option value="30">Siste 30 dager</option>
            <option value="90">Siste 90 dager</option>
            <option value="365">Siste 12 maneder</option>
          </select>
        </div>
      </div>

      {/* Model Comparison Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Modellsammenligning
          </h2>
          {comparison.length > 0 && (
            <button
              onClick={exportComparisonCSV}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
          )}
        </div>
        {comparison.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Ingen data enna. AI-forslag vil vises her etter bruk.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="model_name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="approval_rate" name="Godkjenningsrate (%)" fill="#3b82f6" />
              <Bar dataKey="avg_user_rating" name="Gj.sn. vurdering" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* A/B Model Routing View */}
      {comparison.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            A/B Modellsammenligning - Detaljert
          </h2>

          {comparison.some((c) => parseInt(c.total_feedback) < 30) && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Statistisk usikre resultater — noen modeller har under 30 tilbakemeldinger. Vent til
                flere data er samlet inn for palitelige sammenligninger.
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Modell</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Totale forslag</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">
                    Godkjenningsrate
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">
                    Gj.sn. vurdering
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Gj.sn. latens</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">
                    Tilbakemeldinger
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((c) => (
                  <tr key={c.model_name} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm font-medium">{c.model_name}</td>
                    <td className="py-3 px-4 text-right">{c.total_suggestions}</td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          parseFloat(c.approval_rate) >= 80
                            ? 'bg-green-100 text-green-700'
                            : parseFloat(c.approval_rate) >= 60
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {c.approval_rate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">{c.avg_user_rating || '-'}</td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {c.avg_latency_ms ? `${c.avg_latency_ms}ms` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={
                          parseInt(c.total_feedback) < 30 ? 'text-amber-600 font-medium' : ''
                        }
                      >
                        {c.total_feedback}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-1">Modellruting (MODEL_ROUTING)</p>
            <p className="text-xs text-blue-700">
              Oppgaver rutes automatisk til den best egnede modellen basert pa type: Norsk tekst
              &rarr; chiro-norwegian, Medisinsk &rarr; chiro-medical, Hurtig &rarr; chiro-fast,
              Generell &rarr; chiro-no. Konfigureres via miljovaribler.
            </p>
          </div>
        </div>
      )}

      {/* Usage Volume + Task Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Request Volume */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Daglig bruk
          </h2>
          {usage.daily.length === 0 ? (
            <p className="text-gray-500 text-sm">Ingen data enna.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={[...usage.daily].reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
                  }
                />
                <YAxis />
                <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString('nb-NO')} />
                <Line
                  type="monotone"
                  dataKey="request_count"
                  name="Foresporsler"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Task Type Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Oppgavefordeling
          </h2>
          {usage.taskTypes.length === 0 ? (
            <p className="text-gray-500 text-sm">Ingen data enna.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={usage.taskTypes}
                  dataKey="count"
                  nameKey="task_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ task_type, percent }) =>
                    `${task_type} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {usage.taskTypes.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Red Flag Accuracy */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Red Flag - noyaktighet
        </h2>
        {!redFlag.summary?.total_red_flag_checks ||
        parseInt(redFlag.summary.total_red_flag_checks) === 0 ? (
          <p className="text-gray-500 text-sm">Ingen red flag-analyser registrert enna.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Totale analyser" value={redFlag.summary.total_red_flag_checks} />
            <StatCard
              label="Korrekt identifisert"
              value={redFlag.summary.true_positives || 0}
              color="green"
            />
            <StatCard
              label="Falske positive"
              value={redFlag.summary.false_positives || 0}
              color="red"
            />
            <StatCard
              label="Presisjonsrate"
              value={`${redFlag.summary.precision_rate || 0}%`}
              color="blue"
            />
          </div>
        )}
      </div>

      {/* Recent Suggestions Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Siste AI-forslag</h2>
          {suggestions.length > 0 && (
            <button
              onClick={exportSuggestionsCSV}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
          )}
        </div>
        {suggestions.length === 0 ? (
          <p className="text-gray-500 text-sm">Ingen forslag registrert enna.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Tidspunkt</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Type</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Modell</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Konfidens</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Latens</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-600">
                      {new Date(s.created_at).toLocaleString('nb-NO', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{s.task_type}</span>
                    </td>
                    <td className="py-2 px-3 font-mono text-xs">{s.model_name}</td>
                    <td className="py-2 px-3">
                      {s.confidence_score ? `${(s.confidence_score * 100).toFixed(0)}%` : '-'}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {s.latency_ms ? `${s.latency_ms}ms` : '-'}
                    </td>
                    <td className="py-2 px-3">
                      {s.accepted === true && (
                        <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs">
                          Godkjent
                        </span>
                      )}
                      {s.accepted === false && (
                        <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded text-xs">
                          Avvist
                        </span>
                      )}
                      {s.accepted === null && (
                        <span className="text-gray-500 bg-gray-50 px-2 py-0.5 rounded text-xs">
                          Venter
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ====================================================================
// Shared components
// ====================================================================

function StatCard({ label, value, color = 'gray' }) {
  const colorClasses = {
    gray: 'text-gray-900',
    green: 'text-green-700',
    red: 'text-red-700',
    blue: 'text-blue-700',
  };

  return (
    <div className="border rounded-lg p-4 text-center">
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  buttonText,
  onClick,
  disabled,
  result,
  error,
  color,
}) {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
  };

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-gray-100 rounded-lg">{icon}</div>
        <h3 className="font-bold">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full px-4 py-2 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium ${colorClasses[color]}`}
      >
        {buttonText}
      </button>

      {result && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
          {result.success !== false ? 'OK' : 'Feil'}
          {result.steps && (
            <span className="ml-1">
              ({result.steps.filter((s) => s.success).length}/{result.steps.length} steg)
            </span>
          )}
          {result.results && (
            <span className="ml-1">
              ({result.results.filter((r) => r.success).length}/{result.results.length} modeller)
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
          {error.response?.data?.error || error.message}
        </div>
      )}
    </div>
  );
}
