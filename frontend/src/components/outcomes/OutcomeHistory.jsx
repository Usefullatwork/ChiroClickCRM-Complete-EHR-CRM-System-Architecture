/**
 * Outcome History Component
 *
 * Displays patient outcome measure history with:
 * - Progress charts over time
 * - Score comparisons
 * - Clinical significance indicators
 * - Export capabilities
 *
 * Bilingual: English/Norwegian
 */

import React, { useState, useMemo } from 'react';
import { QUESTIONNAIRES, calculateChange } from './questionnaires';

// =============================================================================
// TRANSLATIONS
// =============================================================================

const TRANSLATIONS = {
  en: {
    outcomeHistory: 'Outcome History',
    noData: 'No outcome measures recorded yet',
    startNew: 'Start New Assessment',
    viewDetails: 'View Details',
    date: 'Date',
    score: 'Score',
    change: 'Change',
    interpretation: 'Status',
    improved: 'Improved',
    worsened: 'Worsened',
    stable: 'Stable',
    baseline: 'Baseline',
    latest: 'Latest',
    trend: 'Trend',
    overall: 'Overall Change',
    assessments: 'assessments',
    significantImprovement: 'Significant Improvement',
    noSignificantChange: 'No Significant Change',
    significantWorsening: 'Significant Worsening',
    export: 'Export',
    print: 'Print',
    lastAssessment: 'Last Assessment',
    firstAssessment: 'First Assessment',
    daysSinceBaseline: 'days since baseline',
    selectMeasure: 'Select Measure',
    all: 'All Measures',
  },
  no: {
    outcomeHistory: 'Utfallshistorikk',
    noData: 'Ingen utfallsmål registrert ennå',
    startNew: 'Start ny vurdering',
    viewDetails: 'Se detaljer',
    date: 'Dato',
    score: 'Score',
    change: 'Endring',
    interpretation: 'Status',
    improved: 'Forbedret',
    worsened: 'Forverret',
    stable: 'Stabil',
    baseline: 'Utgangspunkt',
    latest: 'Siste',
    trend: 'Trend',
    overall: 'Total endring',
    assessments: 'vurderinger',
    significantImprovement: 'Betydelig forbedring',
    noSignificantChange: 'Ingen betydelig endring',
    significantWorsening: 'Betydelig forverring',
    export: 'Eksporter',
    print: 'Skriv ut',
    lastAssessment: 'Siste vurdering',
    firstAssessment: 'Første vurdering',
    daysSinceBaseline: 'dager siden utgangspunkt',
    selectMeasure: 'Velg mål',
    all: 'Alle mål',
  },
};

// =============================================================================
// MOCK DATA - Replace with real API data
// =============================================================================

const MOCK_HISTORY = {
  NDI: [
    { id: 1, date: '2024-01-02', score: 34, percentage: 68 },
    { id: 2, date: '2024-01-16', score: 28, percentage: 56 },
    { id: 3, date: '2024-01-30', score: 22, percentage: 44 },
    { id: 4, date: '2024-02-13', score: 18, percentage: 36 },
    { id: 5, date: '2024-02-27', score: 14, percentage: 28 },
  ],
  ODI: [
    { id: 1, date: '2024-01-02', score: 32, percentage: 64 },
    { id: 2, date: '2024-01-30', score: 24, percentage: 48 },
    { id: 3, date: '2024-02-27', score: 16, percentage: 32 },
  ],
  VAS: [
    { id: 1, date: '2024-01-02', score: 72, percentage: 72 },
    { id: 2, date: '2024-01-09', score: 65, percentage: 65 },
    { id: 3, date: '2024-01-16', score: 55, percentage: 55 },
    { id: 4, date: '2024-01-23', score: 48, percentage: 48 },
    { id: 5, date: '2024-01-30', score: 42, percentage: 42 },
    { id: 6, date: '2024-02-06', score: 35, percentage: 35 },
    { id: 7, date: '2024-02-13', score: 30, percentage: 30 },
    { id: 8, date: '2024-02-20', score: 25, percentage: 25 },
  ],
  NRS: [
    { id: 1, date: '2024-01-02', score: 7, percentage: 70 },
    { id: 2, date: '2024-01-16', score: 5, percentage: 50 },
    { id: 3, date: '2024-01-30', score: 4, percentage: 40 },
    { id: 4, date: '2024-02-13', score: 3, percentage: 30 },
  ],
};

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Simple Line Chart (SVG-based, no external dependencies)
 */
function SimpleLineChart({ data, maxValue, lang, color = '#3b82f6' }) {
  if (!data || data.length === 0) return null;

  const width = 400;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate points
  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartWidth,
    y: padding.top + chartHeight - (d.percentage / maxValue) * chartHeight,
    ...d,
  }));

  // Generate path
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Generate area path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Y-axis labels
  const yLabels = [0, 25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Grid lines */}
      {yLabels.map((val) => (
        <g key={val}>
          <line
            x1={padding.left}
            y1={padding.top + chartHeight - (val / maxValue) * chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight - (val / maxValue) * chartHeight}
            stroke="#e5e7eb"
            strokeDasharray="4"
          />
          <text
            x={padding.left - 10}
            y={padding.top + chartHeight - (val / maxValue) * chartHeight + 4}
            textAnchor="end"
            className="text-xs fill-gray-500"
          >
            {val}%
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill={color} fillOpacity="0.1" />

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="6" fill="white" stroke={color} strokeWidth="2" />
          {/* Date label */}
          {(i === 0 || i === points.length - 1 || i === Math.floor(points.length / 2)) && (
            <text
              x={p.x}
              y={height - 10}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {new Date(p.date).toLocaleDateString(lang === 'no' ? 'nb-NO' : 'en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </text>
          )}
        </g>
      ))}

      {/* Trend arrow */}
      {data.length >= 2 && (
        <g>
          {data[0].percentage > data[data.length - 1].percentage ? (
            <text x={width - 30} y={30} className="text-2xl fill-green-500">↓</text>
          ) : data[0].percentage < data[data.length - 1].percentage ? (
            <text x={width - 30} y={30} className="text-2xl fill-red-500">↑</text>
          ) : (
            <text x={width - 30} y={30} className="text-2xl fill-gray-500">→</text>
          )}
        </g>
      )}
    </svg>
  );
}

/**
 * Summary Card
 */
function SummaryCard({ questionnaireId, history, lang }) {
  const t = TRANSLATIONS[lang];
  const questionnaire = QUESTIONNAIRES[questionnaireId];

  if (!history || history.length === 0) return null;

  const baseline = history[0];
  const latest = history[history.length - 1];
  const change = calculateChange(baseline.percentage, latest.percentage, questionnaire.scoring.mcid);
  const daysSinceBaseline = Math.floor(
    (new Date(latest.date) - new Date(baseline.date)) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {questionnaire.name[lang]}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {history.length} {t.assessments}
        </span>
      </div>

      {/* Chart */}
      <div className="mb-4">
        <SimpleLineChart
          data={history}
          maxValue={100}
          lang={lang}
          color={change.absoluteChange > 0 ? '#22c55e' : change.absoluteChange < 0 ? '#ef4444' : '#6b7280'}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t.baseline}</div>
          <div className="text-xl font-bold text-gray-700 dark:text-gray-300">
            {baseline.percentage}%
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t.latest}</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {latest.percentage}%
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t.change}</div>
          <div className={`text-xl font-bold ${
            change.absoluteChange > 0 ? 'text-green-600' :
            change.absoluteChange < 0 ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {change.absoluteChange > 0 ? '-' : change.absoluteChange < 0 ? '+' : ''}
            {Math.abs(change.absoluteChange)}%
          </div>
        </div>
      </div>

      {/* Clinical Significance */}
      {change.clinicallySignificant && (
        <div className={`mt-4 p-3 rounded-lg text-center text-sm font-medium ${
          change.significance === 'improved'
            ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {change.significance === 'improved' ? '✓ ' : '⚠ '}
          {change.significance === 'improved' ? t.significantImprovement : t.significantWorsening}
        </div>
      )}

      {/* Days Since Baseline */}
      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {daysSinceBaseline} {t.daysSinceBaseline}
      </div>
    </div>
  );
}

/**
 * History Table
 */
function HistoryTable({ questionnaireId, history, lang }) {
  const t = TRANSLATIONS[lang];
  const questionnaire = QUESTIONNAIRES[questionnaireId];

  if (!history || history.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {questionnaire.name[lang]} - {t.outcomeHistory}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {t.date}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {t.score}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {t.change}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {t.interpretation}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {history.map((entry, index) => {
              const prevEntry = index > 0 ? history[index - 1] : null;
              const change = prevEntry
                ? calculateChange(prevEntry.percentage, entry.percentage, questionnaire.scoring.mcid)
                : null;

              const interpretation = questionnaire.scoring.interpretation.find(
                (i) => entry.percentage >= i.min && entry.percentage <= i.max
              );

              return (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {new Date(entry.date).toLocaleDateString(lang === 'no' ? 'nb-NO' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {index === 0 && (
                      <span className="ml-2 text-xs text-gray-500">({t.baseline})</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {entry.percentage}%
                    <span className="ml-1 text-gray-500">({entry.score})</span>
                  </td>
                  <td className="px-6 py-4">
                    {change ? (
                      <span className={`inline-flex items-center text-sm font-medium ${
                        change.absoluteChange > 0 ? 'text-green-600' :
                        change.absoluteChange < 0 ? 'text-red-600' :
                        'text-gray-500'
                      }`}>
                        {change.absoluteChange > 0 ? '↓ -' : change.absoluteChange < 0 ? '↑ +' : ''}
                        {Math.abs(change.absoluteChange)}%
                        {change.clinicallySignificant && ' *'}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      interpretation?.color === 'green' ? 'bg-green-100 text-green-800' :
                      interpretation?.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      interpretation?.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                      interpretation?.color === 'red' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {interpretation?.label[lang]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function OutcomeHistory({
  patientId,
  history = MOCK_HISTORY,
  onStartNew,
  lang = 'en',
}) {
  const t = TRANSLATIONS[lang];
  const [selectedMeasure, setSelectedMeasure] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  // Get available measures from history
  const availableMeasures = useMemo(() => {
    return Object.keys(history).filter((key) => history[key]?.length > 0);
  }, [history]);

  // Filter history based on selection
  const filteredHistory = useMemo(() => {
    if (selectedMeasure === 'all') {
      return history;
    }
    return { [selectedMeasure]: history[selectedMeasure] };
  }, [history, selectedMeasure]);

  if (availableMeasures.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t.noData}
        </h3>
        <button
          onClick={onStartNew}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t.startNew}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.outcomeHistory}
        </h2>
        <div className="flex items-center gap-3">
          {/* Measure Filter */}
          <select
            value={selectedMeasure}
            onChange={(e) => setSelectedMeasure(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">{t.all}</option>
            {availableMeasures.map((measure) => (
              <option key={measure} value={measure}>
                {QUESTIONNAIRES[measure]?.shortName || measure}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Table
            </button>
          </div>

          {/* New Assessment */}
          <button
            onClick={onStartNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + {t.startNew}
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(filteredHistory).map(([id, data]) => (
            data && data.length > 0 && (
              <SummaryCard
                key={id}
                questionnaireId={id}
                history={data}
                lang={lang}
              />
            )
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredHistory).map(([id, data]) => (
            data && data.length > 0 && (
              <HistoryTable
                key={id}
                questionnaireId={id}
                history={data}
                lang={lang}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
}

// Named exports
export { SummaryCard, HistoryTable, SimpleLineChart };
