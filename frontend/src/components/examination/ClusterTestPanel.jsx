/**
 * ClusterTestPanel Component
 *
 * Diagnostic cluster testing interface for improved diagnostic accuracy.
 * Implements evidence-based test clusters with automatic scoring and alerts.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Activity,
  Brain,
  Ear,
  Skull,
  FileText,
  RefreshCw,
  Smile,
} from 'lucide-react';
import { CLUSTER_TESTS, _CLUSTER_THRESHOLDS, SEVERITY } from '../../data/examinationProtocols';

// Cluster type icons
const CLUSTER_ICONS = {
  cerebellar: Brain,
  vestibular: Ear,
  cervicogenic: Activity,
  myelopathy: AlertTriangle,
  upperCervicalInstability: Skull,
  tmj: Smile,
};

/**
 * Individual cluster test item
 */
function ClusterTestItem({ test, value, onChange, readOnly = false }) {
  return (
    <div
      className={`p-3 border rounded-lg ${
        value === true
          ? 'border-amber-300 bg-amber-50'
          : value === false
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex gap-2 mt-0.5">
          <button
            onClick={() => onChange(test.id, true)}
            disabled={readOnly}
            className={`p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              value === true
                ? 'bg-amber-500 text-white'
                : 'bg-gray-200 text-gray-500 hover:bg-amber-200'
            }`}
            title="Positiv"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChange(test.id, false)}
            disabled={readOnly}
            className={`p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              value === false
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-500 hover:bg-green-200'
            }`}
            title="Negativ"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1">
          <h4
            className={`font-medium text-sm ${value === true ? 'text-amber-700' : 'text-gray-700'}`}
          >
            {test.name}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">{test.criteria}</p>
          {value === true && test.interpretation && (
            <p className="text-xs text-amber-600 mt-1 italic">→ {test.interpretation}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Cluster score indicator
 */
function ClusterScoreIndicator({ score, threshold, total, critical }) {
  const percentage = (score / total) * 100;
  const isPositive = score >= threshold;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isPositive ? (critical ? 'bg-red-500' : 'bg-amber-500') : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div
        className={`text-sm font-bold ${
          isPositive ? (critical ? 'text-red-600' : 'text-amber-600') : 'text-green-600'
        }`}
      >
        {score}/{total}
      </div>
    </div>
  );
}

/**
 * Single cluster test panel
 */
function ClusterPanel({
  cluster,
  values = {},
  onChange,
  lang = 'no',
  expanded,
  onToggle,
  readOnly = false,
}) {
  const Icon = CLUSTER_ICONS[cluster.id] || Activity;

  // Calculate score
  const score = useMemo(() => {
    return cluster.tests.filter((test) => {
      const val = values[test.id];
      // Handle inverted logic (e.g., skew deviation test)
      if (test.invertedLogic) {
        return val === false;
      }
      return val === true;
    }).length;
  }, [cluster.tests, values]);

  const isPositive = score >= cluster.threshold;
  const _severity = cluster.critical ? SEVERITY.CRITICAL : SEVERITY.HIGH;

  const handleTestChange = (testId, value) => {
    onChange({
      ...values,
      [testId]: value,
    });
  };

  // Get assessment message
  const getAssessment = () => {
    if (cluster.criteria) {
      if (score >= cluster.criteria.high.score) {
        return { level: 'high', ...cluster.criteria.high };
      } else if (score >= cluster.criteria.moderate.score) {
        return { level: 'moderate', ...cluster.criteria.moderate };
      }
      return { level: 'low', ...cluster.criteria.low };
    }
    return null;
  };

  const assessment = getAssessment();

  return (
    <div
      className={`border rounded-lg overflow-hidden ${
        isPositive ? (cluster.critical ? 'border-red-300' : 'border-amber-300') : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-center justify-between
                   ${isPositive ? (cluster.critical ? 'bg-red-50' : 'bg-amber-50') : 'bg-gray-50'}`}
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Icon
            className={`w-5 h-5 ${
              isPositive ? (cluster.critical ? 'text-red-500' : 'text-amber-500') : 'text-gray-500'
            }`}
          />
          <div className="text-left">
            <h3
              className={`font-medium ${
                isPositive
                  ? cluster.critical
                    ? 'text-red-700'
                    : 'text-amber-700'
                  : 'text-gray-700'
              }`}
            >
              {lang === 'no' ? cluster.name : cluster.nameEn}
            </h3>
            <p className="text-xs text-gray-500">
              {lang === 'no' ? 'Terskel' : 'Threshold'}: ≥{cluster.threshold}/{cluster.total}
              {cluster.sensitivity &&
                ` | Sens: ${cluster.sensitivity}%, Spes: ${cluster.specificity}%`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ClusterScoreIndicator
            score={score}
            threshold={cluster.threshold}
            total={cluster.total}
            critical={cluster.critical}
          />
          {isPositive && (
            <AlertTriangle
              className={`w-5 h-5 ${cluster.critical ? 'text-red-500' : 'text-amber-500'}`}
            />
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Note/warning */}
          {cluster.note && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              <strong>OBS:</strong> {cluster.note}
            </div>
          )}

          {/* Critical action warning */}
          {isPositive && cluster.critical && cluster.action && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-700 text-sm">
                    {lang === 'no' ? 'KRITISK HANDLING PÅKREVD' : 'CRITICAL ACTION REQUIRED'}
                  </h4>
                  <p className="text-sm text-red-600 mt-1">{cluster.action}</p>
                </div>
              </div>
            </div>
          )}

          {/* Assessment result */}
          {assessment && (
            <div
              className={`p-3 rounded-lg ${
                assessment.level === 'high'
                  ? 'bg-red-50 border border-red-200'
                  : assessment.level === 'moderate'
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-green-50 border border-green-200'
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  assessment.level === 'high'
                    ? 'text-red-700'
                    : assessment.level === 'moderate'
                      ? 'text-amber-700'
                      : 'text-green-700'
                }`}
              >
                {assessment.message}
              </p>
              {assessment.action && (
                <p className="text-xs mt-1 text-gray-600">→ {assessment.action}</p>
              )}
            </div>
          )}

          {/* Tests */}
          <div className="space-y-2">
            {cluster.tests.map((test) => (
              <ClusterTestItem
                key={test.id}
                test={test}
                value={values[test.id]}
                onChange={handleTestChange}
                readOnly={readOnly}
              />
            ))}
          </div>

          {/* Red flags */}
          {cluster.redFlags && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {lang === 'no' ? 'Røde flagg (HENVIS AKUTT)' : 'Red Flags (URGENT REFERRAL)'}
              </h4>
              <ul className="mt-2 space-y-1">
                {cluster.redFlags.map((flag, idx) => (
                  <li key={idx} className="text-xs text-red-600 flex items-start gap-2">
                    <span>•</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Differentials */}
          {cluster.differentials && isPositive && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-700 text-sm">
                {lang === 'no' ? 'Differensialdiagnoser' : 'Differential Diagnoses'}
              </h4>
              <ul className="mt-2 space-y-1">
                {cluster.differentials.map((diff, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                    <span>•</span>
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* HINTS+ Protocol for vestibular */}
          {cluster.hintsPlus && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-700 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {cluster.hintsPlus.name}
              </h4>
              <ul className="mt-2 space-y-1">
                {cluster.hintsPlus.redFlags.map((flag, idx) => (
                  <li
                    key={idx}
                    className={`text-xs flex items-start gap-2 ${flag.good ? 'text-green-600' : 'text-purple-600'}`}
                  >
                    <span>{flag.good ? '✓' : '⚠'}</span>
                    <span>
                      <strong>{flag.name}:</strong> {flag.meaning}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs font-medium text-purple-700">{cluster.hintsPlus.action}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Main ClusterTestPanel component
 */
export default function ClusterTestPanel({
  values = {},
  onChange,
  lang = 'no',
  readOnly = false,
  onGenerateReport,
}) {
  const [expandedClusters, setExpandedClusters] = useState({});

  const handleClusterToggle = (clusterId) => {
    setExpandedClusters((prev) => ({
      ...prev,
      [clusterId]: !prev[clusterId],
    }));
  };

  const handleClusterChange = (clusterId, clusterValues) => {
    onChange({
      ...values,
      [clusterId]: clusterValues,
    });
  };

  const handleReset = () => {
    onChange({});
    setExpandedClusters({});
  };

  // Calculate overall summary
  const summary = useMemo(() => {
    const results = [];

    Object.entries(CLUSTER_TESTS).forEach(([key, cluster]) => {
      const clusterValues = values[key] || {};
      const score = cluster.tests.filter((test) => {
        const val = clusterValues[test.id];
        if (test.invertedLogic) {
          return val === false;
        }
        return val === true;
      }).length;

      if (score >= cluster.threshold) {
        results.push({
          id: key,
          name: lang === 'no' ? cluster.name : cluster.nameEn,
          score,
          total: cluster.total,
          critical: cluster.critical,
        });
      }
    });

    return results;
  }, [values, lang]);

  // Generate report
  const generateReport = useCallback(() => {
    const lines = [];
    lines.push('KLUSTER-TEST RAPPORT\n');
    lines.push(`Dato: ${new Date().toLocaleDateString('nb-NO')}\n`);

    Object.entries(CLUSTER_TESTS).forEach(([key, cluster]) => {
      const clusterValues = values[key] || {};
      const testedCount = Object.keys(clusterValues).length;

      if (testedCount === 0) {
        return;
      }

      const score = cluster.tests.filter((test) => {
        const val = clusterValues[test.id];
        if (test.invertedLogic) {
          return val === false;
        }
        return val === true;
      }).length;

      const isPositive = score >= cluster.threshold;
      const clusterName = lang === 'no' ? cluster.name : cluster.nameEn;

      lines.push(
        `\n${clusterName}: ${score}/${cluster.total} ${isPositive ? '(POSITIV)' : '(Negativ)'}`
      );

      if (isPositive) {
        const positiveTests = cluster.tests.filter((test) => {
          const val = clusterValues[test.id];
          if (test.invertedLogic) {
            return val === false;
          }
          return val === true;
        });

        positiveTests.forEach((test) => {
          lines.push(`  • ${test.name}`);
        });

        if (cluster.critical && cluster.action) {
          lines.push(`  ⚠ HANDLING: ${cluster.action}`);
        }
      }
    });

    if (summary.length > 0) {
      lines.push('\n\nKONKLUSJON:');
      summary.forEach((s) => {
        lines.push(`• ${s.name}: ${s.score}/${s.total} ${s.critical ? '(KRITISK)' : ''}`);
      });
    } else {
      lines.push('\n\nKONKLUSJON: Ingen positive klustere.');
    }

    return lines.join('\n');
  }, [values, summary, lang]);

  const handleGenerateReport = () => {
    const report = generateReport();
    if (onGenerateReport) {
      onGenerateReport(report);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            {lang === 'no' ? 'Diagnostiske kluster-tester' : 'Diagnostic Cluster Tests'}
          </h2>
          <p className="text-sm text-gray-500">
            {lang === 'no'
              ? 'Kombiner flere tester for økt diagnostisk nøyaktighet'
              : 'Combine multiple tests for improved diagnostic accuracy'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600
                      border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {lang === 'no' ? 'Nullstill' : 'Reset'}
          </button>
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-600 text-white
                      rounded-lg hover:bg-teal-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            {lang === 'no' ? 'Generer rapport' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Summary alert */}
      {summary.length > 0 && (
        <div
          className={`p-4 rounded-lg border ${
            summary.some((s) => s.critical)
              ? 'bg-red-50 border-red-300'
              : 'bg-amber-50 border-amber-300'
          }`}
        >
          <h3
            className={`font-semibold flex items-center gap-2 ${
              summary.some((s) => s.critical) ? 'text-red-700' : 'text-amber-700'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            {lang === 'no' ? 'Positive klustere funnet' : 'Positive Clusters Found'}
          </h3>
          <ul className="mt-2 space-y-1">
            {summary.map((s) => (
              <li
                key={s.id}
                className={`text-sm ${s.critical ? 'text-red-600 font-medium' : 'text-amber-600'}`}
              >
                • {s.name}: {s.score}/{s.total} {s.critical && '⚠ KRITISK'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cluster panels */}
      <div className="space-y-3">
        {Object.entries(CLUSTER_TESTS).map(([key, cluster]) => (
          <ClusterPanel
            key={key}
            cluster={cluster}
            values={values[key] || {}}
            onChange={(v) => handleClusterChange(key, v)}
            lang={lang}
            expanded={expandedClusters[key] || false}
            onToggle={() => handleClusterToggle(key)}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}
