/**
 * AIPerformance Dashboard Page
 *
 * Dashboard page showing AI performance metrics:
 * - Overall acceptance rate chart (line chart over time)
 * - Breakdown by suggestion type (bar chart)
 * - Recent corrections table
 * - Retraining status indicator
 * - Export feedback button
 */

import _React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  Edit3,
  _AlertTriangle,
  BarChart3,
  LineChart,
  Clock,
  Star,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  useAIPerformanceMetrics,
  useMyAIFeedback,
  useMyAIFeedbackStats,
  useAIRetrainingStatus,
  useExportAIFeedback,
} from '../hooks/useAIFeedback';

// Bilingual text support
const TEXTS = {
  NO: {
    title: 'AI-ytelse',
    subtitle: 'Overvak og analyser AI-forslagsytelse',
    acceptanceRate: 'Akseptrate',
    avgRating: 'Gjennomsnittlig vurdering',
    totalSuggestions: 'Totale forslag',
    avgDecisionTime: 'Gjennomsnittlig beslutningstid',
    acceptanceOverTime: 'Akseptrate over tid',
    byType: 'Etter forslagstype',
    recentCorrections: 'Nylige korreksjoner',
    retrainingStatus: 'Opplaeringstatus',
    export: 'Eksporter data',
    exporting: 'Eksporterer...',
    refresh: 'Oppdater',
    filters: 'Filtre',
    dateRange: 'Tidsperiode',
    last7Days: 'Siste 7 dager',
    last30Days: 'Siste 30 dager',
    last90Days: 'Siste 90 dager',
    lastYear: 'Siste ar',
    groupBy: 'Grupper etter',
    day: 'Dag',
    week: 'Uke',
    month: 'Maned',
    noData: 'Ingen data tilgjengelig',
    loading: 'Laster...',
    types: {
      subjective: 'Subjektiv',
      objective: 'Objektiv',
      assessment: 'Vurdering',
      plan: 'Plan',
      diagnosis: 'Diagnose',
      treatment: 'Behandling',
      summary: 'Sammendrag',
    },
    retraining: {
      ready: 'Klar for opplaering',
      inProgress: 'Opplaering pagar',
      scheduled: 'Planlagt',
      notNeeded: 'Ikke nodvendig',
      pendingFeedback: 'Ventende tilbakemeldinger',
      lastTrained: 'Sist opplaert',
      threshold: 'Terskel',
    },
    actions: {
      accepted: 'Godkjent',
      modified: 'Redigert',
      rejected: 'Avvist',
    },
  },
  EN: {
    title: 'AI Performance',
    subtitle: 'Monitor and analyze AI suggestion performance',
    acceptanceRate: 'Acceptance Rate',
    avgRating: 'Average Rating',
    totalSuggestions: 'Total Suggestions',
    avgDecisionTime: 'Avg Decision Time',
    acceptanceOverTime: 'Acceptance Rate Over Time',
    byType: 'By Suggestion Type',
    recentCorrections: 'Recent Corrections',
    retrainingStatus: 'Retraining Status',
    export: 'Export Data',
    exporting: 'Exporting...',
    refresh: 'Refresh',
    filters: 'Filters',
    dateRange: 'Date Range',
    last7Days: 'Last 7 days',
    last30Days: 'Last 30 days',
    last90Days: 'Last 90 days',
    lastYear: 'Last year',
    groupBy: 'Group by',
    day: 'Day',
    week: 'Week',
    month: 'Month',
    noData: 'No data available',
    loading: 'Loading...',
    types: {
      subjective: 'Subjective',
      objective: 'Objective',
      assessment: 'Assessment',
      plan: 'Plan',
      diagnosis: 'Diagnosis',
      treatment: 'Treatment',
      summary: 'Summary',
    },
    retraining: {
      ready: 'Ready for Retraining',
      inProgress: 'Retraining in Progress',
      scheduled: 'Scheduled',
      notNeeded: 'Not Needed',
      pendingFeedback: 'Pending Feedback',
      lastTrained: 'Last Trained',
      threshold: 'Threshold',
    },
    actions: {
      accepted: 'Accepted',
      modified: 'Modified',
      rejected: 'Rejected',
    },
  },
};

/**
 * Simple Line Chart Component (CSS-based, like KPIChart)
 */
const AcceptanceLineChart = ({ data = [], color = '#14b8a6' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <p>No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.acceptanceRate || 0), 100);
  const minValue = Math.min(...data.map((d) => d.acceptanceRate || 0), 0);

  const chartData = data.map((item) => ({
    ...item,
    percentage: ((item.acceptanceRate - minValue) / (maxValue - minValue)) * 100 || 0,
  }));

  // SVG line chart
  const svgWidth = 100;
  const svgHeight = 100;
  const points = chartData
    .map((item, index) => {
      const x = chartData.length === 1 ? svgWidth / 2 : (index / (chartData.length - 1)) * svgWidth;
      const y = svgHeight - item.percentage;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="space-y-4">
      <div className="h-64 relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line key={y} x1="0" y1={y} x2={svgWidth} y2={y} stroke="#e2e8f0" strokeWidth="0.5" />
          ))}

          {/* Area under line */}
          <polygon
            points={`0,${svgHeight} ${points} ${svgWidth},${svgHeight}`}
            fill={color}
            fillOpacity="0.1"
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {chartData.map((item, index) => {
            const x =
              chartData.length === 1 ? svgWidth / 2 : (index / (chartData.length - 1)) * svgWidth;
            const y = svgHeight - item.percentage;
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  fill="white"
                  stroke={color}
                  strokeWidth="2"
                  className="cursor-pointer"
                >
                  <title>{`${item.period}: ${item.acceptanceRate?.toFixed(1)}%`}</title>
                </circle>
              </g>
            );
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-500 -ml-8">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2">
          {chartData.slice(0, 7).map((item, index) => (
            <span
              key={index}
              className="text-xs text-slate-600 font-medium truncate"
              style={{ maxWidth: `${100 / Math.min(chartData.length, 7)}%` }}
            >
              {item.period}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Bar Chart Component for type breakdown
 */
const TypeBarChart = ({ data = [], language = 'NO' }) => {
  const t = TEXTS[language] || TEXTS.NO;

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <p>{t.noData}</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.total || 0));

  const colors = {
    subjective: '#3b82f6',
    objective: '#10b981',
    assessment: '#f59e0b',
    plan: '#8b5cf6',
    diagnosis: '#ef4444',
    treatment: '#06b6d4',
    summary: '#6b7280',
  };

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const _percentage = maxValue > 0 ? (item.total / maxValue) * 100 : 0;
        const acceptedPercentage = item.total > 0 ? (item.accepted / item.total) * 100 : 0;
        const color = colors[item.type?.toLowerCase()] || '#6b7280';
        const typeLabel = t.types[item.type?.toLowerCase()] || item.type;

        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{typeLabel}</span>
              <div className="flex items-center gap-3">
                <span className="text-slate-500">{item.total} total</span>
                <span className="text-green-600 font-medium">
                  {acceptedPercentage.toFixed(0)}% accepted
                </span>
              </div>
            </div>
            <div className="h-6 bg-slate-100 rounded-lg overflow-hidden flex">
              {/* Accepted portion */}
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${(item.accepted / maxValue) * 100}%`,
                  backgroundColor: color,
                }}
                title={`Accepted: ${item.accepted}`}
              />
              {/* Modified portion */}
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${(item.modified / maxValue) * 100}%`,
                  backgroundColor: color,
                  opacity: 0.6,
                }}
                title={`Modified: ${item.modified}`}
              />
              {/* Rejected portion */}
              <div
                className="h-full bg-red-400 transition-all duration-500"
                style={{
                  width: `${(item.rejected / maxValue) * 100}%`,
                }}
                title={`Rejected: ${item.rejected}`}
              />
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-teal-500" />
          <span className="text-xs text-slate-600">{t.actions.accepted}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-teal-500 opacity-60" />
          <span className="text-xs text-slate-600">{t.actions.modified}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-400" />
          <span className="text-xs text-slate-600">{t.actions.rejected}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Retraining Status Component
 */
const RetrainingStatusCard = ({ status, language = 'NO' }) => {
  const t = TEXTS[language] || TEXTS.NO;

  const getStatusConfig = (retrainingStatus) => {
    switch (retrainingStatus) {
      case 'ready':
        return {
          label: t.retraining.ready,
          icon: Zap,
          color: 'text-amber-600 bg-amber-100',
          badgeVariant: 'warning',
        };
      case 'in_progress':
        return {
          label: t.retraining.inProgress,
          icon: RefreshCw,
          color: 'text-blue-600 bg-blue-100',
          badgeVariant: 'info',
          animate: true,
        };
      case 'scheduled':
        return {
          label: t.retraining.scheduled,
          icon: Calendar,
          color: 'text-purple-600 bg-purple-100',
          badgeVariant: 'default',
        };
      default:
        return {
          label: t.retraining.notNeeded,
          icon: CheckCircle,
          color: 'text-green-600 bg-green-100',
          badgeVariant: 'success',
        };
    }
  };

  const config = getStatusConfig(status?.status);
  const StatusIcon = config.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-teal-600" />
          <h3 className="text-lg font-semibold text-slate-900">{t.retrainingStatus}</h3>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${config.color}`}>
              <StatusIcon size={24} className={config.animate ? 'animate-spin' : ''} />
            </div>
            <div>
              <Badge variant={config.badgeVariant} size="md">
                {config.label}
              </Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            <div>
              <p className="text-xs text-slate-500">{t.retraining.pendingFeedback}</p>
              <p className="text-lg font-bold text-slate-900">
                {status?.pendingFeedbackCount || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t.retraining.threshold}</p>
              <p className="text-lg font-bold text-slate-900">{status?.threshold || 50}</p>
            </div>
            {status?.lastTrainedAt && (
              <div className="col-span-2">
                <p className="text-xs text-slate-500">{t.retraining.lastTrained}</p>
                <p className="text-sm font-medium text-slate-700">
                  {new Date(status.lastTrainedAt).toLocaleString(
                    language === 'NO' ? 'nb-NO' : 'en-US'
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Progress to threshold */}
          {status?.threshold && (
            <div className="pt-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Progress to retraining</span>
                <span>
                  {Math.min(
                    100,
                    Math.round((status.pendingFeedbackCount / status.threshold) * 100)
                  )}
                  %
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (status.pendingFeedbackCount / status.threshold) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

/**
 * Recent Corrections Table
 */
const RecentCorrectionsTable = ({ corrections = [], language = 'NO' }) => {
  const t = TEXTS[language] || TEXTS.NO;

  const getActionIcon = (correctionType) => {
    switch (correctionType) {
      case 'accepted_as_is':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'modified':
        return <Edit3 size={16} className="text-blue-600" />;
      case 'rejected':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(language === 'NO' ? 'nb-NO' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (corrections.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>{t.noData}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Action</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Rating</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Time</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {corrections.map((correction, idx) => (
            <tr key={correction.id || idx} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <Badge variant="default" size="sm">
                  {t.types[correction.suggestionType?.toLowerCase()] || correction.suggestionType}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {getActionIcon(correction.correctionType)}
                  <span className="text-sm text-slate-700">
                    {t.actions[
                      correction.correctionType === 'accepted_as_is'
                        ? 'accepted'
                        : correction.correctionType
                    ] || correction.correctionType}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-slate-700">
                    {correction.userRating}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">
                {correction.timeToDecision
                  ? `${Math.round(correction.timeToDecision / 1000)}s`
                  : '-'}
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">
                {formatDate(correction.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Main AIPerformance Page Component
 */
export default function AIPerformance() {
  const language = 'NO'; // Could be from context/settings
  const t = TEXTS[language] || TEXTS.NO;

  // Filter state
  const [dateRange, setDateRange] = useState('30');
  const [groupBy, setGroupBy] = useState('day');

  // Calculate dates
  const endDate = useMemo(() => new Date().toISOString(), []);
  const startDate = useMemo(() => {
    const days = parseInt(dateRange);
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  }, [dateRange]);

  // Fetch data
  const {
    data: metricsData,
    isLoading: metricsLoading,
    refetch: refetchMetrics,
  } = useAIPerformanceMetrics({ groupBy, startDate, endDate });

  const { data: feedbackData, isLoading: feedbackLoading } = useMyAIFeedback({
    limit: 10,
    startDate,
    endDate,
  });

  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useMyAIFeedbackStats();

  const { data: retrainingStatus, isLoading: _retrainingLoading } = useAIRetrainingStatus();

  const exportMutation = useExportAIFeedback();

  // Process metrics for charts
  const acceptanceOverTime = useMemo(() => {
    if (!metricsData?.metrics) {
      return [];
    }
    // Group by period and calculate acceptance rate
    const grouped = {};
    metricsData.metrics.forEach((item) => {
      if (!grouped[item.period]) {
        grouped[item.period] = { total: 0, accepted: 0 };
      }
      grouped[item.period].total += item.total_suggestions || 0;
      grouped[item.period].accepted += (item.accepted_as_is || 0) + (item.modified || 0);
    });

    return Object.entries(grouped)
      .map(([period, data]) => ({
        period,
        acceptanceRate: data.total > 0 ? (data.accepted / data.total) * 100 : 0,
      }))
      .sort((a, b) => new Date(a.period) - new Date(b.period));
  }, [metricsData]);

  const byTypeData = useMemo(() => {
    if (!metricsData?.metrics) {
      return [];
    }
    // Group by suggestion type
    const grouped = {};
    metricsData.metrics.forEach((item) => {
      const type = item.suggestion_type || 'unknown';
      if (!grouped[type]) {
        grouped[type] = { type, total: 0, accepted: 0, modified: 0, rejected: 0 };
      }
      grouped[type].total += item.total_suggestions || 0;
      grouped[type].accepted += item.accepted_as_is || 0;
      grouped[type].modified += item.modified || 0;
      grouped[type].rejected += item.rejected || 0;
    });

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [metricsData]);

  // Overall stats
  const overallStats = statsData || {
    totalFeedback: 0,
    acceptanceRate: 0,
    avgRating: 0,
    avgDecisionTime: 0,
  };

  const isLoading = metricsLoading || feedbackLoading || statsLoading;

  const handleRefresh = () => {
    refetchMetrics();
    refetchStats();
  };

  const handleExport = () => {
    exportMutation.mutate({ format: 'csv', startDate, endDate });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Brain size={28} className="text-teal-600" />
            {t.title}
          </h1>
          <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            icon={RefreshCw}
            className={isLoading ? 'animate-pulse' : ''}
          >
            {t.refresh}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
            disabled={exportMutation.isLoading}
            loading={exportMutation.isLoading}
            icon={Download}
          >
            {exportMutation.isLoading ? t.exporting : t.export}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700">{t.filters}:</span>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="text-sm border border-slate-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-teal-500"
              >
                <option value="7">{t.last7Days}</option>
                <option value="30">{t.last30Days}</option>
                <option value="90">{t.last90Days}</option>
                <option value="365">{t.lastYear}</option>
              </select>
            </div>

            {/* Group By */}
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-slate-400" />
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="text-sm border border-slate-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-teal-500"
              >
                <option value="day">{t.day}</option>
                <option value="week">{t.week}</option>
                <option value="month">{t.month}</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Acceptance Rate */}
        <Card>
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t.acceptanceRate}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {overallStats.acceptanceRate?.toFixed(1) || 0}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {overallStats.acceptanceRate >= 70 ? (
                    <TrendingUp size={14} className="text-green-600" />
                  ) : (
                    <TrendingDown size={14} className="text-red-600" />
                  )}
                  <span
                    className={`text-xs ${overallStats.acceptanceRate >= 70 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {overallStats.acceptanceRate >= 70 ? 'Good' : 'Needs improvement'}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Average Rating */}
        <Card>
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t.avgRating}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {overallStats.avgRating?.toFixed(1) || 0}
                  <span className="text-lg font-normal text-slate-500">/5</span>
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={12}
                      className={
                        star <= Math.round(overallStats.avgRating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300'
                      }
                    />
                  ))}
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star size={24} className="text-yellow-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Total Suggestions */}
        <Card>
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t.totalSuggestions}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {overallStats.totalFeedback || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">In selected period</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Brain size={24} className="text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Average Decision Time */}
        <Card>
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t.avgDecisionTime}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {overallStats.avgDecisionTime
                    ? `${Math.round(overallStats.avgDecisionTime / 1000)}s`
                    : '0s'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Per suggestion</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock size={24} className="text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acceptance Over Time */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LineChart size={20} className="text-teal-600" />
              <h3 className="text-lg font-semibold text-slate-900">{t.acceptanceOverTime}</h3>
            </div>
          </CardHeader>
          <CardBody>
            {metricsLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw size={24} className="text-teal-600 animate-spin" />
              </div>
            ) : (
              <AcceptanceLineChart data={acceptanceOverTime} color="#14b8a6" />
            )}
          </CardBody>
        </Card>

        {/* By Type */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-teal-600" />
              <h3 className="text-lg font-semibold text-slate-900">{t.byType}</h3>
            </div>
          </CardHeader>
          <CardBody>
            {metricsLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw size={24} className="text-teal-600 animate-spin" />
              </div>
            ) : (
              <TypeBarChart data={byTypeData} language={language} />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Corrections */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Edit3 size={20} className="text-teal-600" />
                <h3 className="text-lg font-semibold text-slate-900">{t.recentCorrections}</h3>
              </div>
            </CardHeader>
            <CardBody>
              {feedbackLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw size={24} className="text-teal-600 animate-spin" />
                </div>
              ) : (
                <RecentCorrectionsTable
                  corrections={feedbackData?.feedback || []}
                  language={language}
                />
              )}
            </CardBody>
          </Card>
        </div>

        {/* Retraining Status */}
        <RetrainingStatusCard status={retrainingStatus} language={language} />
      </div>
    </div>
  );
}
