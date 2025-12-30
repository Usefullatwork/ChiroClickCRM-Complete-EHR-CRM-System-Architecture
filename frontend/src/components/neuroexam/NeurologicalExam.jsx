/**
 * NeurologicalExam Component
 *
 * Comprehensive neurological examination interface with:
 * - Cluster-based testing (7 diagnostic clusters)
 * - Real-time scoring with threshold indicators
 * - Red flag detection with automatic alerts
 * - Auto-generated clinical narratives
 * - BPPV canal differentiation
 * - Bilingual support (Norwegian/English)
 *
 * Integrates with existing SOAP documentation workflow
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Brain,
  Eye,
  Activity,
  Stethoscope,
  FileText,
  RotateCcw,
  Save,
  AlertCircle,
  ArrowRight,
  Info
} from 'lucide-react';

import {
  EXAM_CLUSTERS,
  calculateClusterScore,
  checkRedFlags,
  generateNarrative,
  formatNarrativeForSOAP,
  diagnoseBPPV
} from './neurologicalExamDefinitions';

// =============================================================================
// TRANSLATIONS
// =============================================================================

const TRANSLATIONS = {
  no: {
    title: 'Nevrologisk Undersøkelse',
    subtitle: 'Kluster-basert diagnostisk protokoll',
    selectCluster: 'Velg undersøkelse',
    allClusters: 'Alle klustere',
    score: 'Score',
    threshold: 'Terskel for diagnose',
    interpretation: 'Tolkning',
    redFlagAlert: 'RØDT FLAGG',
    referralNeeded: 'Henvisning nødvendig',
    action: 'Handling',
    generateNarrative: 'Generer klinisk notat',
    clearAll: 'Nullstill',
    save: 'Lagre',
    positive: 'Positiv',
    negative: 'Negativ',
    testResults: 'Testresultater',
    clusterSummary: 'Kluster-oppsummering',
    noTestsPerformed: 'Ingen tester utført',
    criticalWarning: 'KRITISK ADVARSEL',
    stopTreatment: 'STOPP BEHANDLING',
    urgentReferral: 'AKUTT HENVISNING',
    affectedSide: 'Affisert side',
    treatment: 'Behandling',
    bppvDiagnosis: 'BPPV Diagnose',
    hintsProtocol: 'HINTS+ Protokoll',
    centralSigns: 'Sentrale tegn (ekskluder hjerneslag)',
    completed: 'Fullført',
    inProgress: 'Pågår',
    notStarted: 'Ikke startet'
  },
  en: {
    title: 'Neurological Examination',
    subtitle: 'Cluster-based diagnostic protocol',
    selectCluster: 'Select examination',
    allClusters: 'All clusters',
    score: 'Score',
    threshold: 'Diagnostic threshold',
    interpretation: 'Interpretation',
    redFlagAlert: 'RED FLAG',
    referralNeeded: 'Referral needed',
    action: 'Action',
    generateNarrative: 'Generate clinical note',
    clearAll: 'Clear all',
    save: 'Save',
    positive: 'Positive',
    negative: 'Negative',
    testResults: 'Test Results',
    clusterSummary: 'Cluster Summary',
    noTestsPerformed: 'No tests performed',
    criticalWarning: 'CRITICAL WARNING',
    stopTreatment: 'STOP TREATMENT',
    urgentReferral: 'URGENT REFERRAL',
    affectedSide: 'Affected side',
    treatment: 'Treatment',
    bppvDiagnosis: 'BPPV Diagnosis',
    hintsProtocol: 'HINTS+ Protocol',
    centralSigns: 'Central signs (exclude stroke)',
    completed: 'Completed',
    inProgress: 'In progress',
    notStarted: 'Not started'
  }
};

// Cluster icons mapping
const CLUSTER_ICONS = {
  CEREBELLAR: Brain,
  VESTIBULAR: Activity,
  BPPV: RotateCcw,
  CERVICOGENIC: Stethoscope,
  TMJ: Activity,
  UPPER_CERVICAL_INSTABILITY: AlertTriangle,
  MYELOPATHY: AlertCircle,
  VNG_OCULOMOTOR: Eye,
  ACTIVATOR: Activity
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Cluster Selection Sidebar
 */
function ClusterSelector({ clusters, selectedCluster, onSelect, testResults, lang }) {
  const t = TRANSLATIONS[lang];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">{t.selectCluster}</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {Object.entries(clusters).map(([clusterId, cluster]) => {
          const Icon = CLUSTER_ICONS[clusterId] || Activity;
          const score = calculateClusterScore(clusterId, testResults);
          const hasResults = score.score > 0;
          const isSelected = selectedCluster === clusterId;
          const isCritical = cluster.isRedFlagCluster && score.meetsThreshold;

          return (
            <button
              key={clusterId}
              onClick={() => onSelect(clusterId)}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                isSelected
                  ? 'bg-blue-50 border-l-4 border-blue-600'
                  : isCritical
                  ? 'bg-red-50 border-l-4 border-red-600 hover:bg-red-100'
                  : 'hover:bg-gray-50 border-l-4 border-transparent'
              }`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  isCritical ? 'text-red-600' : isSelected ? 'text-blue-600' : 'text-gray-400'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${
                  isCritical ? 'text-red-900' : isSelected ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {cluster.name[lang]}
                </div>
                {hasResults && (
                  <div className={`text-xs ${
                    score.meetsThreshold
                      ? isCritical ? 'text-red-600' : 'text-orange-600'
                      : 'text-gray-500'
                  }`}>
                    {t.score}: {score.score}/{score.total}
                    {score.meetsThreshold && (
                      <span className="ml-1">
                        {isCritical ? '⚠️' : '●'}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {isCritical && (
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Individual Test Component
 */
function TestCard({ test, results, onChange, lang }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const testResults = results || { criteria: {} };

  const handleCriterionChange = (criterionId, checked) => {
    const criterion = test.criteria.find(c => c.id === criterionId);

    // If this is an exclusive criterion and it's being checked, clear others
    if (criterion?.exclusive && checked) {
      onChange({
        ...testResults,
        criteria: { [criterionId]: true }
      });
    } else {
      // If checking a non-exclusive criterion, remove any exclusive ones
      const newCriteria = { ...testResults.criteria };

      if (checked) {
        // Remove exclusive criteria when adding non-exclusive
        test.criteria.forEach(c => {
          if (c.exclusive && newCriteria[c.id]) {
            delete newCriteria[c.id];
          }
        });
      }

      newCriteria[criterionId] = checked;
      if (!checked) delete newCriteria[criterionId];

      onChange({
        ...testResults,
        criteria: newCriteria
      });
    }
  };

  const checkedCount = Object.values(testResults.criteria || {}).filter(Boolean).length;
  const hasPositiveFindings = test.criteria.some(c =>
    !c.exclusive && testResults.criteria?.[c.id]
  );

  return (
    <div className={`border rounded-lg overflow-hidden ${
      test.redFlag && hasPositiveFindings
        ? 'border-red-300 bg-red-50'
        : hasPositiveFindings
        ? 'border-orange-200 bg-orange-50'
        : 'border-gray-200 bg-white'
    }`}>
      {/* Test Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          {test.redFlag && hasPositiveFindings ? (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          ) : hasPositiveFindings ? (
            <CheckCircle className="w-5 h-5 text-orange-600" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
          )}
          <div>
            <h4 className={`font-medium ${
              test.redFlag && hasPositiveFindings ? 'text-red-900' : 'text-gray-900'
            }`}>
              {test.name[lang]}
            </h4>
            {test.subtitle && (
              <p className="text-xs text-gray-500">{test.subtitle[lang]}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {checkedCount > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              hasPositiveFindings
                ? 'bg-orange-200 text-orange-800'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {checkedCount}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Criteria Checkboxes */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {test.criteria.map(criterion => (
            <label
              key={criterion.id}
              className={`flex items-start gap-3 p-2 rounded cursor-pointer transition-colors ${
                testResults.criteria?.[criterion.id]
                  ? criterion.exclusive
                    ? 'bg-green-100'
                    : 'bg-orange-100'
                  : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={testResults.criteria?.[criterion.id] || false}
                onChange={(e) => handleCriterionChange(criterion.id, e.target.checked)}
                className="mt-0.5 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className={`text-sm ${
                testResults.criteria?.[criterion.id]
                  ? criterion.exclusive ? 'text-green-800' : 'text-orange-800'
                  : 'text-gray-700'
              }`}>
                {criterion.label[lang]}
                {criterion.exclusive && (
                  <span className="ml-2 text-xs text-gray-500">(negativ)</span>
                )}
              </span>
            </label>
          ))}

          {/* Value Input if present */}
          {test.valueInput && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {test.valueInput.label[lang]}
              </label>
              <input
                type={test.valueInput.type}
                value={testResults.value || ''}
                onChange={(e) => onChange({ ...testResults, value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Interpretation */}
          {test.interpretation && hasPositiveFindings && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${
              test.redFlag ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-800'
            }`}>
              <strong>→</strong> {test.interpretation[lang]}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Cluster Score Display
 */
function ClusterScoreCard({ cluster, score, lang }) {
  const t = TRANSLATIONS[lang];
  const isCritical = cluster.isRedFlagCluster && score.meetsThreshold;

  return (
    <div className={`p-4 rounded-lg ${
      isCritical
        ? 'bg-red-100 border-2 border-red-500'
        : score.meetsThreshold
        ? 'bg-orange-100 border-2 border-orange-500'
        : 'bg-gray-100 border border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className={`font-semibold ${
          isCritical ? 'text-red-900' : score.meetsThreshold ? 'text-orange-900' : 'text-gray-900'
        }`}>
          {cluster.name[lang]}
        </h4>
        <span className={`text-2xl font-bold ${
          isCritical ? 'text-red-600' : score.meetsThreshold ? 'text-orange-600' : 'text-gray-600'
        }`}>
          {score.score}/{score.total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full transition-all ${
            isCritical ? 'bg-red-500' : score.meetsThreshold ? 'bg-orange-500' : 'bg-blue-500'
          }`}
          style={{ width: `${(score.score / score.total) * 100}%` }}
        />
      </div>

      <div className="text-xs text-gray-600">
        {t.threshold}: ≥{score.threshold}/{score.total}
      </div>

      {score.interpretation && (
        <div className={`mt-2 text-sm font-medium ${
          isCritical ? 'text-red-800' : score.meetsThreshold ? 'text-orange-800' : 'text-gray-700'
        }`}>
          {score.interpretation.label[lang]}
        </div>
      )}

      {/* Critical Action */}
      {isCritical && cluster.criticalAction && (
        <div className="mt-3 p-2 bg-red-200 rounded text-sm text-red-900">
          <strong>{t.action}:</strong> {cluster.criticalAction[lang]}
        </div>
      )}

      {/* Referral Action */}
      {!isCritical && score.meetsThreshold && cluster.referralAction && (
        <div className="mt-3 p-2 bg-orange-200 rounded text-sm text-orange-900">
          <strong>{t.action}:</strong> {cluster.referralAction[lang]}
        </div>
      )}
    </div>
  );
}

/**
 * Red Flag Alert Banner
 */
function RedFlagAlert({ redFlags, lang }) {
  const t = TRANSLATIONS[lang];

  if (redFlags.length === 0) return null;

  const hasCritical = redFlags.some(f =>
    f.clusterId === 'MYELOPATHY' || f.clusterId === 'UPPER_CERVICAL_INSTABILITY'
  );

  return (
    <div className={`rounded-lg p-4 mb-6 ${
      hasCritical ? 'bg-red-600' : 'bg-red-500'
    }`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-white flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-2">
            {hasCritical ? t.criticalWarning : t.redFlagAlert}
          </h3>
          <ul className="space-y-2">
            {redFlags.map((flag, i) => (
              <li key={i} className="text-white text-sm">
                <strong>{flag.testName?.[lang] || flag.flag?.[lang]}:</strong>{' '}
                {flag.interpretation?.[lang]}
              </li>
            ))}
          </ul>
          {hasCritical && (
            <div className="mt-3 p-2 bg-white/20 rounded text-white font-semibold">
              {t.stopTreatment} - {t.urgentReferral}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * BPPV Diagnosis Panel
 */
function BPPVDiagnosisPanel({ testResults, lang }) {
  const t = TRANSLATIONS[lang];
  const diagnosis = diagnoseBPPV(testResults);

  if (!diagnosis.type) return null;

  const subCluster = EXAM_CLUSTERS.BPPV.subClusters[diagnosis.type];

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
        <RotateCcw className="w-5 h-5" />
        {t.bppvDiagnosis}
      </h4>
      <div className="space-y-2 text-sm">
        <div>
          <strong>Type:</strong> {subCluster?.name[lang]}
        </div>
        {diagnosis.affectedSide && (
          <div>
            <strong>{t.affectedSide}:</strong> {diagnosis.affectedSide === 'right' ? 'Høyre/Right' : 'Venstre/Left'}
          </div>
        )}
        <div>
          <strong>Confidence:</strong> {diagnosis.confidence}
        </div>
        {diagnosis.treatment && (
          <div className="mt-2 p-2 bg-purple-100 rounded">
            <strong>{t.treatment}:</strong> {diagnosis.treatment[lang]}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * HINTS+ Protocol Panel
 */
function HINTSPanel({ cluster, testResults, lang }) {
  const t = TRANSLATIONS[lang];

  if (!cluster.hintsPlus) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
        <Info className="w-5 h-5" />
        {t.hintsProtocol}
      </h4>
      <p className="text-sm text-yellow-800 mb-3">{t.centralSigns}</p>
      <div className="space-y-2">
        {cluster.hintsPlus.centralSigns.map(sign => (
          <label key={sign.id} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={testResults[`hints_${sign.id}`] || false}
              onChange={(e) => {
                // This would need to be hooked up to state management
              }}
              className="mt-0.5"
            />
            <span className="text-yellow-900">{sign.label[lang]}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 p-2 bg-yellow-100 rounded text-sm text-yellow-900">
        {cluster.hintsPlus.action[lang]}
      </div>
    </div>
  );
}

/**
 * Generated Narrative Display
 */
function NarrativeDisplay({ narratives, lang }) {
  const t = TRANSLATIONS[lang];

  if (narratives.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t.noTestsPerformed}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {narratives.map((cluster, i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h4 className="font-medium text-gray-900">{cluster.clusterName}</h4>
            <span className="text-sm text-gray-600">{t.score}: {cluster.score}</span>
          </div>
          <div className="p-4 space-y-2">
            {cluster.interpretation && (
              <div className="text-sm font-medium text-orange-700 mb-2">
                {t.interpretation}: {cluster.interpretation}
              </div>
            )}
            {cluster.tests.map((test, j) => (
              <div key={j} className="text-sm">
                <strong>{test.testName}:</strong>
                <ul className="ml-4 list-disc list-inside text-gray-700">
                  {test.findings.map((finding, k) => (
                    <li key={k}>{finding}</li>
                  ))}
                </ul>
                {test.interpretation && (
                  <div className="ml-4 text-blue-700 mt-1">→ {test.interpretation}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function NeurologicalExam({
  initialResults = {},
  onSave,
  onNarrativeGenerated,
  patientId,
  encounterId,
  lang = 'no'
}) {
  const t = TRANSLATIONS[lang];

  // State
  const [selectedCluster, setSelectedCluster] = useState('CEREBELLAR');
  const [testResults, setTestResults] = useState(initialResults);
  const [showNarrative, setShowNarrative] = useState(false);

  // Computed values
  const redFlags = useMemo(() => checkRedFlags(testResults), [testResults]);
  const narratives = useMemo(() => generateNarrative(testResults, lang), [testResults, lang]);
  const currentCluster = EXAM_CLUSTERS[selectedCluster];
  const currentScore = useMemo(
    () => calculateClusterScore(selectedCluster, testResults),
    [selectedCluster, testResults]
  );

  // Handlers
  const handleTestChange = useCallback((testId, results) => {
    setTestResults(prev => ({
      ...prev,
      [testId]: results
    }));
  }, []);

  const handleClearAll = useCallback(() => {
    setTestResults({});
  }, []);

  const handleSave = useCallback(() => {
    const data = {
      patientId,
      encounterId,
      testResults,
      scores: Object.keys(EXAM_CLUSTERS).reduce((acc, clusterId) => {
        acc[clusterId] = calculateClusterScore(clusterId, testResults);
        return acc;
      }, {}),
      redFlags,
      narrative: formatNarrativeForSOAP(narratives, lang),
      timestamp: new Date().toISOString()
    };

    if (onSave) {
      onSave(data);
    }

    if (onNarrativeGenerated) {
      onNarrativeGenerated(formatNarrativeForSOAP(narratives, lang));
    }
  }, [testResults, redFlags, narratives, patientId, encounterId, lang, onSave, onNarrativeGenerated]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="w-7 h-7 text-blue-600" />
              {t.title}
            </h1>
            <p className="text-sm text-gray-600">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNarrative(!showNarrative)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
            >
              <FileText className="w-4 h-4" />
              {t.generateNarrative}
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <RotateCcw className="w-4 h-4" />
              {t.clearAll}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              {t.save}
            </button>
          </div>
        </div>
      </div>

      {/* Red Flag Alert */}
      {redFlags.length > 0 && (
        <div className="px-6 pt-4">
          <RedFlagAlert redFlags={redFlags} lang={lang} />
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        <div className="flex gap-6">
          {/* Sidebar - Cluster Selection */}
          <div className="w-72 flex-shrink-0">
            <ClusterSelector
              clusters={EXAM_CLUSTERS}
              selectedCluster={selectedCluster}
              onSelect={setSelectedCluster}
              testResults={testResults}
              lang={lang}
            />

            {/* Score Summary */}
            <div className="mt-4">
              <ClusterScoreCard
                cluster={currentCluster}
                score={currentScore}
                lang={lang}
              />
            </div>
          </div>

          {/* Main Panel - Tests */}
          <div className="flex-1">
            {showNarrative ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  {t.testResults}
                </h3>
                <NarrativeDisplay narratives={narratives} lang={lang} />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cluster Description */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    {currentCluster.name[lang]}
                  </h2>
                  <p className="text-sm text-gray-600">{currentCluster.description[lang]}</p>

                  {/* Diagnostic Criteria Info */}
                  {currentCluster.diagnosticCriteria && (
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        {t.threshold}: <strong>≥{currentCluster.diagnosticCriteria.threshold}/{currentCluster.diagnosticCriteria.total}</strong>
                      </span>
                      {currentCluster.diagnosticCriteria.sensitivity && (
                        <span className="text-gray-500">
                          Sens: {currentCluster.diagnosticCriteria.sensitivity}% | Spec: {currentCluster.diagnosticCriteria.specificity}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* BPPV Diagnosis Panel */}
                {selectedCluster === 'BPPV' && (
                  <BPPVDiagnosisPanel testResults={testResults} lang={lang} />
                )}

                {/* HINTS+ Panel */}
                {selectedCluster === 'VESTIBULAR' && (
                  <HINTSPanel cluster={currentCluster} testResults={testResults} lang={lang} />
                )}

                {/* Red Flags Panel */}
                {currentCluster.redFlags && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      {currentCluster.redFlags.name[lang]}
                    </h4>
                    <div className="space-y-2">
                      {currentCluster.redFlags.items.map(flag => (
                        <label key={flag.id} className="flex items-start gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={testResults[`${selectedCluster}_redFlag_${flag.id}`] || false}
                            onChange={(e) => {
                              setTestResults(prev => ({
                                ...prev,
                                [`${selectedCluster}_redFlag_${flag.id}`]: e.target.checked
                              }));
                            }}
                            className="mt-0.5 text-red-600"
                          />
                          <span className="text-red-800">{flag.label[lang]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tests Grid */}
                <div className="grid gap-4">
                  {currentCluster.tests?.map(test => (
                    <TestCard
                      key={test.id}
                      test={test}
                      results={testResults[test.id]}
                      onChange={(results) => handleTestChange(test.id, results)}
                      lang={lang}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COMPACT VERSION (for embedding in SOAP)
// =============================================================================

export function NeurologicalExamCompact({
  testResults = {},
  onChange,
  lang = 'no'
}) {
  const t = TRANSLATIONS[lang];
  const [expandedCluster, setExpandedCluster] = useState(null);

  const scores = useMemo(() => {
    return Object.keys(EXAM_CLUSTERS).reduce((acc, clusterId) => {
      acc[clusterId] = calculateClusterScore(clusterId, testResults);
      return acc;
    }, {});
  }, [testResults]);

  const hasAnyResults = Object.values(scores).some(s => s.score > 0);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          {t.title}
        </h3>
        {hasAnyResults && (
          <span className="text-xs text-gray-500">{t.inProgress}</span>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {Object.entries(EXAM_CLUSTERS).map(([clusterId, cluster]) => {
          const score = scores[clusterId];
          const isExpanded = expandedCluster === clusterId;
          const isCritical = cluster.isRedFlagCluster && score.meetsThreshold;

          return (
            <div key={clusterId}>
              <button
                onClick={() => setExpandedCluster(isExpanded ? null : clusterId)}
                className={`w-full px-4 py-2 flex items-center justify-between text-left ${
                  isCritical ? 'bg-red-50' : score.meetsThreshold ? 'bg-orange-50' : ''
                }`}
              >
                <span className={`text-sm ${
                  isCritical ? 'text-red-900 font-medium' : 'text-gray-900'
                }`}>
                  {cluster.name[lang]}
                </span>
                <div className="flex items-center gap-2">
                  {score.score > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      isCritical
                        ? 'bg-red-200 text-red-800'
                        : score.meetsThreshold
                        ? 'bg-orange-200 text-orange-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {score.score}/{score.total}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 py-3 bg-gray-50 space-y-2">
                  {cluster.tests?.slice(0, 5).map(test => (
                    <div key={test.id} className="text-xs">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={testResults[test.id]?.positive || false}
                          onChange={(e) => {
                            onChange?.({
                              ...testResults,
                              [test.id]: {
                                ...testResults[test.id],
                                positive: e.target.checked
                              }
                            });
                          }}
                          className="h-3 w-3"
                        />
                        <span className="text-gray-700">{test.name[lang]}</span>
                      </label>
                    </div>
                  ))}
                  {cluster.tests?.length > 5 && (
                    <div className="text-xs text-gray-500 pt-1">
                      +{cluster.tests.length - 5} more tests...
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
