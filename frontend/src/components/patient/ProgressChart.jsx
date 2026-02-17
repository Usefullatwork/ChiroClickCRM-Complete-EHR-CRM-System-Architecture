/**
 * ProgressChart Component
 * Viser pasientens fremgang over tid med diagram
 *
 * Displays patient's progress over time with charts
 */

import _React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  _Calendar,
  _Target,
  Award,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

/**
 * ProgressChart Component
 * Diagramkomponent for a vise treningsfremgang
 *
 * @param {Object} props - Component props
 * @param {Array} props.data - Progress data array
 * @param {string} props.metric - Metric to display ('completion', 'pain', 'difficulty')
 * @param {string} props.period - Time period ('week', 'month', 'quarter')
 * @param {Function} props.onPeriodChange - Callback when period changes
 * @returns {JSX.Element} Progress chart component
 */
export default function ProgressChart({
  data = [],
  metric = 'completion',
  period = 'week',
  onPeriodChange,
}) {
  const [selectedMetric, setSelectedMetric] = useState(metric);
  const [currentPeriod, setCurrentPeriod] = useState(period);
  const [periodOffset, setPeriodOffset] = useState(0);

  /**
   * Get metric label in Norwegian
   * Henter metrisk etikett pa norsk
   */
  const getMetricLabel = (m) => {
    const labels = {
      completion: 'Fullforingsgrad',
      pain: 'Smerteniva',
      difficulty: 'Vanskelighetsgrad',
      frequency: 'Treningsfrekvens',
    };
    return labels[m] || m;
  };

  /**
   * Get period label in Norwegian
   * Henter periode-etikett pa norsk
   */
  const getPeriodLabel = (p) => {
    const labels = {
      week: 'Denne uken',
      month: 'Denne maneden',
      quarter: 'Siste 3 maneder',
    };
    return labels[p] || p;
  };

  /**
   * Calculate statistics from data
   * Beregner statistikk fra data
   */
  const statistics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        average: 0,
        trend: 0,
        total: 0,
        best: 0,
        streak: 0,
      };
    }

    const values = data.map((d) => d.value || 0);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
    const trend = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    return {
      average: Math.round(average),
      trend: Math.round(trend),
      total: values.reduce((a, b) => a + b, 0),
      best: Math.max(...values),
      streak: calculateStreak(data),
    };
  }, [data]);

  /**
   * Calculate current streak
   * Beregner navarende rekke
   */
  function calculateStreak(progressData) {
    if (!progressData || progressData.length === 0) {
      return 0;
    }

    let streak = 0;
    const sortedData = [...progressData].sort((a, b) => new Date(b.date) - new Date(a.date));

    for (const item of sortedData) {
      if (item.completed) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  /**
   * Get period navigation label
   */
  const getPeriodOffsetLabel = () => {
    if (periodOffset === 0) {
      return getPeriodLabel(currentPeriod);
    }
    const abs = Math.abs(periodOffset);
    const unit =
      currentPeriod === 'week'
        ? abs === 1
          ? 'uke'
          : 'uker'
        : currentPeriod === 'month'
          ? abs === 1
            ? 'maned'
            : 'maneder'
          : abs === 1
            ? 'kvartal'
            : 'kvartaler';
    return `${abs} ${unit} siden`;
  };

  /**
   * Handle period navigation
   * Handterer periodenavigasjon
   */
  const handlePeriodChange = (direction) => {
    const newOffset = direction === 'prev' ? periodOffset - 1 : Math.min(periodOffset + 1, 0);
    setPeriodOffset(newOffset);
    if (onPeriodChange) {
      onPeriodChange(direction, newOffset);
    }
  };

  /**
   * Get bar color based on metric
   * Henter stolpefarge basert pa metrikk
   */
  const getBarColor = (value, maxValue) => {
    const percentage = (value / maxValue) * 100;
    if (selectedMetric === 'pain') {
      // Lower is better for pain
      // Lavere er bedre for smerte
      if (percentage <= 30) {
        return 'bg-green-500';
      }
      if (percentage <= 60) {
        return 'bg-yellow-500';
      }
      return 'bg-red-500';
    }
    // Higher is better for completion/frequency
    // Hoyere er bedre for fullforingsgrad/frekvens
    if (percentage >= 70) {
      return 'bg-green-500';
    }
    if (percentage >= 40) {
      return 'bg-yellow-500';
    }
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header / Overskrift */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Fremgang</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {getMetricLabel(selectedMetric)} - {getPeriodOffsetLabel()}
          </p>
        </div>

        {/* Period Navigation / Periodenavigasjon */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePeriodChange('prev')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <select
            value={currentPeriod}
            onChange={(e) => setCurrentPeriod(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="week">Uke</option>
            <option value="month">Maned</option>
            <option value="quarter">Kvartal</option>
          </select>
          <button
            onClick={() => handlePeriodChange('next')}
            disabled={periodOffset >= 0}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Metric Selector / Metrikk-velger */}
      <div className="flex gap-2 mb-6">
        {['completion', 'pain', 'difficulty', 'frequency'].map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMetric(m)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              selectedMetric === m
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {getMetricLabel(m)}
          </button>
        ))}
      </div>

      {/* Statistics Cards / Statistikkort */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-semibold text-gray-900">{statistics.average}%</p>
          <p className="text-xs text-gray-500 mt-1">Gjennomsnitt</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div
            className={`flex items-center justify-center gap-1 text-2xl font-semibold ${
              statistics.trend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {statistics.trend >= 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            {Math.abs(statistics.trend)}%
          </div>
          <p className="text-xs text-gray-500 mt-1">Trend</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-semibold text-gray-900">{statistics.best}%</p>
          <p className="text-xs text-gray-500 mt-1">Beste dag</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-2xl font-semibold text-orange-600">
            <Award className="w-5 h-5" />
            {statistics.streak}
          </div>
          <p className="text-xs text-gray-500 mt-1">Rekke</p>
        </div>
      </div>

      {/* Chart Area / Diagramomrade */}
      <div className="h-48 flex items-end gap-1">
        {data && data.length > 0 ? (
          data.map((item, index) => {
            const maxValue = Math.max(...data.map((d) => d.value || 0), 100);
            const height = ((item.value || 0) / maxValue) * 100;

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t transition-all hover:opacity-80 ${getBarColor(item.value, maxValue)}`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${item.date}: ${item.value}%`}
                />
                <span className="text-xs text-gray-500 mt-2 rotate-45 origin-left">
                  {item.label ||
                    new Date(item.date).toLocaleDateString('no-NO', { weekday: 'short' })}
                </span>
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Ingen data tilgjengelig</p>
              <p className="text-xs text-gray-400 mt-1">Fullfør øvelser for å se fremgangen din</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend / Forklaring */}
      <div className="flex items-center justify-center gap-6 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-gray-600">God</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span className="text-gray-600">Middels</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-gray-600">Trenger forbedring</span>
        </div>
      </div>
    </div>
  );
}
