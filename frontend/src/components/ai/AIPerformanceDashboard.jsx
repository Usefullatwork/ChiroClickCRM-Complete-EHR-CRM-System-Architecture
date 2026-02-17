/**
 * AI Performance Dashboard
 *
 * Comprehensive dashboard for monitoring AI system health and performance:
 * - Overall acceptance/rejection rates
 * - Performance metrics by suggestion type
 * - Trend charts over time
 * - Common corrections patterns
 * - Retraining status and triggers
 * - Model version history
 *
 * Norwegian and English support
 */

import { useState, _useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  _Brain,
  _TrendingUp,
  _TrendingDown,
  ThumbsUp,
  _ThumbsDown,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  _Calendar,
  ArrowUpRight,
  ArrowDownRight,
  _Percent,
  Star,
  Activity,
  _Database,
  _Settings,
  Download,
  Loader2,
  _FileText,
  GitBranch,
  _RotateCcw,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { aiFeedbackAPI } from '../../services/api';

// Translations
const TEXTS = {
  NO: {
    title: 'AI Ytelsesdashbord',
    subtitle: 'Overvak AI-ytelse og laering',
    overview: 'Oversikt',
    totalInteractions: 'Totale Interaksjoner',
    acceptanceRate: 'Godkjenningsrate',
    avgRating: 'Gj.snitt Vurdering',
    avgTimeToDecision: 'Gj.snitt Beslutningstid',
    byType: 'Etter Type',
    trends: 'Trender',
    last7Days: 'Siste 7 dager',
    last30Days: 'Siste 30 dager',
    last90Days: 'Siste 90 dager',
    commonCorrections: 'Vanlige Korreksjoner',
    correctionPattern: 'Korreksjonsmonster',
    occurrences: 'Forekomster',
    retrainingStatus: 'Retreningstatus',
    needsRetraining: 'Trenger Retrening',
    noRetrainingNeeded: 'Ingen retrening nodvendig',
    triggerRetraining: 'Start Retrening',
    retrainingHistory: 'Retrenigshistorikk',
    modelVersion: 'Modellversjon',
    rollback: 'Tilbakestill',
    exportData: 'Eksporter Data',
    suggestionTypes: {
      soap_suggestion: 'SOAP-forslag',
      diagnosis_suggestion: 'Diagnosforslag',
      red_flag_analysis: 'Rodt Flagg-analyse',
      clinical_summary: 'Klinisk Sammendrag',
      spell_check: 'Stavekontroll',
    },
    metrics: {
      accepted: 'Godkjent',
      rejected: 'Avvist',
      modified: 'Modifisert',
    },
    noData: 'Ingen data tilgjengelig',
    loading: 'Laster...',
    error: 'Feil ved lasting av data',
    refresh: 'Oppdater',
    timeRanges: {
      day: 'Dag',
      week: 'Uke',
      month: 'Maned',
    },
    performance: {
      excellent: 'Utmerket',
      good: 'Bra',
      fair: 'Ok',
      poor: 'Darlig',
    },
    seconds: 'sekunder',
  },
  EN: {
    title: 'AI Performance Dashboard',
    subtitle: 'Monitor AI performance and learning',
    overview: 'Overview',
    totalInteractions: 'Total Interactions',
    acceptanceRate: 'Acceptance Rate',
    avgRating: 'Avg. Rating',
    avgTimeToDecision: 'Avg. Decision Time',
    byType: 'By Type',
    trends: 'Trends',
    last7Days: 'Last 7 days',
    last30Days: 'Last 30 days',
    last90Days: 'Last 90 days',
    commonCorrections: 'Common Corrections',
    correctionPattern: 'Correction Pattern',
    occurrences: 'Occurrences',
    retrainingStatus: 'Retraining Status',
    needsRetraining: 'Needs Retraining',
    noRetrainingNeeded: 'No retraining needed',
    triggerRetraining: 'Trigger Retraining',
    retrainingHistory: 'Retraining History',
    modelVersion: 'Model Version',
    rollback: 'Rollback',
    exportData: 'Export Data',
    suggestionTypes: {
      soap_suggestion: 'SOAP Suggestion',
      diagnosis_suggestion: 'Diagnosis Suggestion',
      red_flag_analysis: 'Red Flag Analysis',
      clinical_summary: 'Clinical Summary',
      spell_check: 'Spell Check',
    },
    metrics: {
      accepted: 'Accepted',
      rejected: 'Rejected',
      modified: 'Modified',
    },
    noData: 'No data available',
    loading: 'Loading...',
    error: 'Error loading data',
    refresh: 'Refresh',
    timeRanges: {
      day: 'Day',
      week: 'Week',
      month: 'Month',
    },
    performance: {
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      poor: 'Poor',
    },
    seconds: 'seconds',
  },
};

// Helper to format percentage
const formatPercent = (value) => {
  if (value === null || value === undefined) {
    return '-';
  }
  return `${parseFloat(value).toFixed(1)}%`;
};

// Helper to get performance rating
const getPerformanceRating = (acceptanceRate) => {
  if (acceptanceRate >= 80) {
    return { level: 'excellent', color: 'teal' };
  }
  if (acceptanceRate >= 60) {
    return { level: 'good', color: 'blue' };
  }
  if (acceptanceRate >= 40) {
    return { level: 'fair', color: 'amber' };
  }
  return { level: 'poor', color: 'red' };
};

// Mini bar chart component
const MiniBarChart = ({ data, maxValue, label, color = 'teal' }) => {
  const percentage = maxValue > 0 ? (data / maxValue) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{data}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-${color}-500 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Stat Card component
const StatCard = ({ icon: Icon, label, value, subValue, trend, color = 'slate' }) => {
  const isPositiveTrend = trend > 0;
  const TrendIcon = isPositiveTrend ? ArrowUpRight : ArrowDownRight;

  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg bg-${color}-100`}>
            <Icon className={`w-5 h-5 text-${color}-600`} />
          </div>
          {trend !== undefined && (
            <div
              className={`flex items-center text-sm ${isPositiveTrend ? 'text-teal-600' : 'text-red-600'}`}
            >
              <TrendIcon className="w-4 h-4" />
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
          {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
        </div>
      </CardBody>
    </Card>
  );
};

// Suggestion Type Card
const SuggestionTypeCard = ({ type, data, t, maxTotal }) => {
  const acceptanceRate = data.total > 0 ? (data.accepted / data.total) * 100 : 0;

  const performance = getPerformanceRating(acceptanceRate);

  return (
    <Card className="overflow-hidden">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-slate-900">{t.suggestionTypes[type] || type}</h4>
          <Badge variant={performance.color}>{formatPercent(acceptanceRate)}</Badge>
        </div>

        <div className="space-y-2">
          <MiniBarChart
            data={data.accepted || 0}
            maxValue={maxTotal}
            label={t.metrics.accepted}
            color="teal"
          />
          <MiniBarChart
            data={data.modified || 0}
            maxValue={maxTotal}
            label={t.metrics.modified}
            color="blue"
          />
          <MiniBarChart
            data={data.rejected || 0}
            maxValue={maxTotal}
            label={t.metrics.rejected}
            color="red"
          />
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{t.totalInteractions}</span>
            <span className="font-medium">{data.total || 0}</span>
          </div>
          {data.avg_rating && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-500">{t.avgRating}</span>
              <span className="font-medium flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                {parseFloat(data.avg_rating).toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

// Main Dashboard Component
export default function AIPerformanceDashboard({ language = 'NO' }) {
  const t = TEXTS[language] || TEXTS.NO;
  const queryClient = useQueryClient();

  const [timeRange, setTimeRange] = useState('30');

  // Fetch performance metrics
  const {
    data: performanceData,
    isLoading: performanceLoading,
    error: performanceError,
    refetch: refetchPerformance,
  } = useQuery({
    queryKey: ['ai-performance', timeRange],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const response = await aiFeedbackAPI.getPerformanceMetrics({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        groupBy: 'day',
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch retraining status
  const { data: retrainingStatus, isLoading: retrainingLoading } = useQuery({
    queryKey: ['ai-retraining-status'],
    queryFn: async () => {
      const response = await aiFeedbackAPI.getRetrainingStatus();
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Fetch common corrections
  const { data: correctionsData, isLoading: correctionsLoading } = useQuery({
    queryKey: ['ai-corrections', timeRange],
    queryFn: async () => {
      const response = await aiFeedbackAPI.getCommonCorrections({
        days: parseInt(timeRange),
        minOccurrences: 3,
      });
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch retraining history
  const { data: retrainingHistory } = useQuery({
    queryKey: ['ai-retraining-history'],
    queryFn: async () => {
      const response = await aiFeedbackAPI.getRetrainingHistory({ limit: 5 });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Trigger retraining mutation
  const triggerRetrainingMutation = useMutation({
    mutationFn: async () => {
      return await aiFeedbackAPI.triggerRetraining();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ai-retraining-status']);
      queryClient.invalidateQueries(['ai-retraining-history']);
    },
  });

  // Export feedback mutation
  const exportMutation = useMutation({
    mutationFn: async (format) => {
      return await aiFeedbackAPI.exportFeedback({ format, days: parseInt(timeRange) });
    },
  });

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!performanceData?.byType) {
      return { total: 0, accepted: 0, rejected: 0, modified: 0, avgRating: 0, avgTime: 0 };
    }

    const types = performanceData.byType;
    let total = 0;
    let accepted = 0;
    let rejected = 0;
    let modified = 0;
    let ratingSum = 0;
    let ratingCount = 0;
    let timeSum = 0;
    let timeCount = 0;

    Object.values(types).forEach((data) => {
      total += data.total || 0;
      accepted += data.accepted || 0;
      rejected += data.rejected || 0;
      modified += data.modified || 0;
      if (data.avg_rating) {
        ratingSum += parseFloat(data.avg_rating) * data.total;
        ratingCount += data.total;
      }
      if (data.avg_time_to_decision) {
        timeSum += data.avg_time_to_decision * data.total;
        timeCount += data.total;
      }
    });

    return {
      total,
      accepted,
      rejected,
      modified,
      acceptanceRate: total > 0 ? (accepted / total) * 100 : 0,
      avgRating: ratingCount > 0 ? ratingSum / ratingCount : 0,
      avgTime: timeCount > 0 ? timeSum / timeCount : 0,
    };
  }, [performanceData]);

  // Find max total for scaling bars
  const maxTotal = useMemo(() => {
    if (!performanceData?.byType) {
      return 1;
    }
    return Math.max(...Object.values(performanceData.byType).map((d) => d.total || 0), 1);
  }, [performanceData]);

  const isLoading = performanceLoading || retrainingLoading || correctionsLoading;

  if (isLoading && !performanceData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{t.loading}</span>
        </div>
      </div>
    );
  }

  if (performanceError) {
    return (
      <Alert variant="danger" title={t.error}>
        <p>{performanceError.message}</p>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => refetchPerformance()}
          className="mt-2"
        >
          {t.refresh}
        </Button>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
          <p className="text-slate-500">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
          >
            <option value="7">{t.last7Days}</option>
            <option value="30">{t.last30Days}</option>
            <option value="90">{t.last90Days}</option>
          </select>
          <Button
            variant="secondary"
            icon={Download}
            onClick={() => exportMutation.mutate('csv')}
            loading={exportMutation.isPending}
          >
            {t.exportData}
          </Button>
          <Button variant="ghost" icon={RefreshCw} onClick={() => refetchPerformance()} />
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          label={t.totalInteractions}
          value={summaryMetrics.total.toLocaleString()}
          color="blue"
        />
        <StatCard
          icon={ThumbsUp}
          label={t.acceptanceRate}
          value={formatPercent(summaryMetrics.acceptanceRate)}
          color={getPerformanceRating(summaryMetrics.acceptanceRate).color}
        />
        <StatCard
          icon={Star}
          label={t.avgRating}
          value={summaryMetrics.avgRating > 0 ? summaryMetrics.avgRating.toFixed(1) : '-'}
          subValue="/5.0"
          color="yellow"
        />
        <StatCard
          icon={Clock}
          label={t.avgTimeToDecision}
          value={summaryMetrics.avgTime > 0 ? `${(summaryMetrics.avgTime / 1000).toFixed(1)}` : '-'}
          subValue={t.seconds}
          color="purple"
        />
      </div>

      {/* By Type Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t.byType}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performanceData?.byType &&
            Object.entries(performanceData.byType).map(([type, data]) => (
              <SuggestionTypeCard key={type} type={type} data={data} t={t} maxTotal={maxTotal} />
            ))}
          {(!performanceData?.byType || Object.keys(performanceData.byType).length === 0) && (
            <div className="col-span-3 text-center py-8 text-slate-500">{t.noData}</div>
          )}
        </div>
      </div>

      {/* Retraining & Corrections Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retraining Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{t.retrainingStatus}</h3>
              <Button
                variant="primary"
                size="sm"
                icon={triggerRetrainingMutation.isPending ? Loader2 : RefreshCw}
                onClick={() => triggerRetrainingMutation.mutate()}
                loading={triggerRetrainingMutation.isPending}
                disabled={triggerRetrainingMutation.isPending}
              >
                {t.triggerRetraining}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {/* Current Status */}
            <div className="mb-4">
              {retrainingStatus?.needsRetraining ? (
                <Alert variant="warning" className="mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{t.needsRetraining}</span>
                  </div>
                  {retrainingStatus.triggeredTypes?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {retrainingStatus.triggeredTypes.map((type) => (
                        <Badge key={type} variant="warning">
                          {t.suggestionTypes[type] || type}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Alert>
              ) : (
                <Alert variant="success">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.noRetrainingNeeded}</span>
                  </div>
                </Alert>
              )}
            </div>

            {/* Retraining History */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">{t.retrainingHistory}</h4>
              {retrainingHistory?.length > 0 ? (
                <div className="space-y-2">
                  {retrainingHistory.map((event, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">
                          {event.model_version || `v${idx + 1}`}
                        </span>
                        {event.suggestion_types && (
                          <Badge variant="default" className="text-xs">
                            {event.suggestion_types.join(', ')}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {event.created_at ? new Date(event.created_at).toLocaleDateString() : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">{t.noData}</p>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Common Corrections */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900">{t.commonCorrections}</h3>
          </CardHeader>
          <CardBody>
            {correctionsData?.length > 0 ? (
              <div className="space-y-3">
                {correctionsData.slice(0, 10).map((correction, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {correction.original_text || correction.pattern}
                        </p>
                        {correction.corrected_text && (
                          <p className="text-sm text-teal-600 truncate mt-1">
                            &rarr; {correction.corrected_text}
                          </p>
                        )}
                      </div>
                      <Badge variant="default">
                        {correction.count || correction.occurrences} {t.occurrences.toLowerCase()}
                      </Badge>
                    </div>
                    {correction.suggestion_type && (
                      <div className="mt-2">
                        <Badge variant="info" className="text-xs">
                          {t.suggestionTypes[correction.suggestion_type] ||
                            correction.suggestion_type}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">{t.noData}</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export { TEXTS, StatCard, SuggestionTypeCard };
