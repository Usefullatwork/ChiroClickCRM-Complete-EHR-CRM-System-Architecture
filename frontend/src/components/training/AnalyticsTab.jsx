/**
 * AnalyticsTab - AI analytics dashboard with charts, A/B comparison, and CSV export
 * Extracted from Training.jsx for maintainability
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Target,
  Activity,
  FlaskConical,
  DollarSign,
  Database,
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
import { trainingAPI, aiAPI } from '../../services/api';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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

export default function AnalyticsTab() {
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

  const aiStatusQuery = useQuery({
    queryKey: ['ai-status-ab'],
    queryFn: async () => {
      const res = await aiAPI.getStatus();
      return res.data;
    },
    staleTime: 60000,
  });

  const costQuery = useQuery({
    queryKey: ['analytics-cost', dateRange],
    queryFn: async () => {
      const res = await trainingAPI.getCostPerSuggestion(getDateParams());
      return res.data.data;
    },
  });

  const providerQuery = useQuery({
    queryKey: ['analytics-provider', dateRange],
    queryFn: async () => {
      const res = await trainingAPI.getProviderValue(getDateParams());
      return res.data.data;
    },
  });

  const cacheQuery = useQuery({
    queryKey: ['analytics-cache', dateRange],
    queryFn: async () => {
      const res = await trainingAPI.getCacheTrends(getDateParams());
      return res.data.data;
    },
  });

  const comparison = comparisonQuery.data || [];
  const usage = usageQuery.data || { daily: [], taskTypes: [] };
  const redFlag = redFlagQuery.data || { summary: {}, trend: [] };
  const suggestions = suggestionsQuery.data || [];
  const abTesting = aiStatusQuery.data?.abTesting || {};
  const costData = costQuery.data || [];
  const providerData = providerQuery.data || [];
  const cacheData = cacheQuery.data || [];

  const exportSuggestionsCSV = () => {
    if (!suggestions.length) {
      return;
    }
    const headers = ['Dato', 'Type', 'Modell', 'Konfidens', 'Latens (ms)', 'Status', 'Vurdering'];
    const rows = suggestions.map((s) => [
      new Date(s.created_at).toLocaleDateString('nb-NO'),
      s.task_type,
      s.model_name,
      s.confidence_score ? `${(s.confidence_score * 100).toFixed(0)}%` : '',
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
    if (!comparison.length) {
      return;
    }
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

      {/* A/B Testing Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FlaskConical className="w-5 h-5" />
          A/B-testing konfigurasjon
        </h2>
        {Object.keys(abTesting).length === 0 ? (
          <p className="text-gray-500 text-sm">
            Ingen A/B-tester konfigurert. Sett miljovariabler som AB_SPLIT_V6=50 for a aktivere.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(abTesting).map(([model, config]) => (
              <div
                key={model}
                className={`border rounded-lg p-4 ${config.enabled ? 'border-teal-300 bg-teal-50' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-medium">{model}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${config.enabled ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {config.enabled ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>
                    Modell B: <span className="font-mono">{config.loraModel}</span>
                  </div>
                  <div>
                    Fordeling:{' '}
                    <span className="font-medium">
                      {100 - config.loraPercent}% / {config.loraPercent}%
                    </span>
                  </div>
                </div>
                {config.enabled && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-teal-600 h-2 rounded-full"
                      style={{ width: `${100 - config.loraPercent}%` }}
                    />
                  </div>
                )}
              </div>
            ))}

            {comparison.length >= 2 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-1">Signifikansindikator</p>
                {comparison.every((c) => parseInt(c.total_feedback) >= 30) ? (
                  <p className="text-xs text-green-700">
                    Tilstrekkelig data for sammenligning (
                    {comparison.map((c) => c.total_feedback).join(' / ')} tilbakemeldinger)
                  </p>
                ) : (
                  <p className="text-xs text-amber-700">
                    Utilstrekkelig data — trenger minst 30 tilbakemeldinger per modell (na:{' '}
                    {comparison.map((c) => c.total_feedback).join(' / ')})
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cost per Suggestion */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Kostnad per forslag
        </h2>
        {costData.length === 0 ? (
          <p className="text-gray-500 text-sm">Ingen kostnadsdata tilgjengelig.</p>
        ) : (
          <div className="space-y-2">
            {costData.map((item) => {
              const maxCost = Math.max(
                ...costData.map((d) => parseFloat(d.avg_cost_usd) || 0),
                0.01
              );
              const barWidth = ((parseFloat(item.avg_cost_usd) || 0) / maxCost) * 100;
              return (
                <div key={item.task_type} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-36 shrink-0">{item.task_type}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                    <div
                      className="bg-blue-500 h-5 rounded-full"
                      style={{ width: `${Math.max(barWidth, 2)}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-gray-700 w-24 text-right">
                    ${parseFloat(item.avg_cost_usd || 0).toFixed(4)}
                  </span>
                  <span className="text-xs text-gray-400 w-16 text-right">{item.count} stk</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Provider Value Comparison */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Leverandorsammenligning
        </h2>
        {providerData.length === 0 ? (
          <p className="text-gray-500 text-sm">Ingen leverandordata tilgjengelig.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Leverandor</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Forslag</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Gj.sn. latens</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Godkjent %</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Total kostnad</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">
                    Kostnad/forslag
                  </th>
                </tr>
              </thead>
              <tbody>
                {providerData.map((p) => (
                  <tr key={p.provider} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium capitalize">{p.provider}</td>
                    <td className="py-3 px-4 text-right">{p.total_suggestions}</td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {p.avg_latency_ms ? `${p.avg_latency_ms}ms` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.approval_rate ? `${p.approval_rate}%` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      ${parseFloat(p.total_cost_usd || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      ${parseFloat(p.cost_per_suggestion || 0).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cache Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Cache-trender
        </h2>
        {cacheData.length === 0 ? (
          <p className="text-gray-500 text-sm">Ingen cache-data tilgjengelig.</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={[...cacheData].reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) =>
                  new Date(d).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
                }
              />
              <YAxis />
              <Tooltip
                labelFormatter={(d) => new Date(d).toLocaleDateString('nb-NO')}
                formatter={(value, name) => {
                  if (name === 'Cache-treffrate') return `${value}%`;
                  return value;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="cache_hit_rate"
                name="Cache-treffrate"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="total_requests"
                name="Totale forsporsler"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
