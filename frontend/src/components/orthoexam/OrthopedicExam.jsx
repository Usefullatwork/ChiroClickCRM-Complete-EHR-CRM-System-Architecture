/**
 * Orthopedic Examination Component
 * Cluster-based orthopedic testing with auto-scoring
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ORTHO_EXAM_CLUSTERS,
  calculateOrthoClusterScore,
  checkOrthoRedFlags,
  generateOrthoNarrative,
  getClustersByRegion,
  getAvailableRegions
} from './orthopedicExamDefinitions';
import {
  Activity, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp,
  ArrowRight, Clipboard, FileText, RotateCcw
} from 'lucide-react';

// Body region icons and colors
const REGION_CONFIG = {
  SHOULDER: { icon: '🦾', color: 'blue', label: { no: 'Skulder', en: 'Shoulder' } },
  ELBOW: { icon: '💪', color: 'indigo', label: { no: 'Albue', en: 'Elbow' } },
  WRIST_HAND: { icon: '✋', color: 'violet', label: { no: 'Håndledd/Hånd', en: 'Wrist/Hand' } },
  HIP: { icon: '🦵', color: 'emerald', label: { no: 'Hofte', en: 'Hip' } },
  KNEE: { icon: '🦿', color: 'teal', label: { no: 'Kne', en: 'Knee' } },
  ANKLE_FOOT: { icon: '🦶', color: 'cyan', label: { no: 'Ankel/Fot', en: 'Ankle/Foot' } },
  LUMBAR: { icon: '🔙', color: 'amber', label: { no: 'Lumbal', en: 'Lumbar' } },
  SACROILIAC: { icon: '🔘', color: 'orange', label: { no: 'SI-ledd', en: 'Sacroiliac' } }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function RegionSelector({ selectedRegion, onSelectRegion, clusterResults, language }) {
  const regions = getAvailableRegions();

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {regions.map(region => {
        const config = REGION_CONFIG[region] || { icon: '📍', color: 'gray', label: { no: region, en: region } };
        const clusters = getClustersByRegion(region);
        const testedCount = clusters.filter(c => clusterResults[c.id]).length;

        return (
          <button
            key={region}
            onClick={() => onSelectRegion(region)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedRegion === region
                ? `bg-${config.color}-100 text-${config.color}-800 border-2 border-${config.color}-400`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
            }`}
          >
            <span className="text-lg">{config.icon}</span>
            <span>{config.label[language]}</span>
            {testedCount > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full bg-${config.color}-200`}>
                {testedCount}/{clusters.length}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ClusterCard({ cluster, results, onTestResult, expanded, onToggle, language }) {
  const score = results ? calculateOrthoClusterScore(cluster.id, results) : null;
  const hasResults = results && Object.keys(results).length > 0;

  return (
    <div className={`border rounded-lg overflow-hidden mb-3 ${
      cluster.redFlagCluster ? 'border-red-300 bg-red-50' : 'border-gray-200'
    }`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 ${
          cluster.redFlagCluster ? 'bg-red-100 hover:bg-red-150' : 'bg-gray-50 hover:bg-gray-100'
        } transition-colors`}
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">{cluster.name[language]}</span>
          {cluster.redFlagCluster && (
            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
              RED FLAG
            </span>
          )}
          {score && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              score.meetsThreshold
                ? cluster.redFlagCluster ? 'bg-red-600 text-white' : 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}>
              {score.positive}/{score.total}
              {score.meetsThreshold && ' ✓'}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {/* Tests */}
      {expanded && (
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-600 mb-3">{cluster.description[language]}</p>

          {cluster.tests.map(test => (
            <TestRow
              key={test.id}
              test={test}
              result={results?.[test.id]}
              onResult={(result) => onTestResult(test.id, result)}
              language={language}
            />
          ))}

          {/* Diagnostic Criteria */}
          <div className={`mt-4 p-3 rounded-lg ${
            score?.meetsThreshold
              ? cluster.redFlagCluster ? 'bg-red-100' : 'bg-green-100'
              : 'bg-gray-100'
          }`}>
            <p className="text-sm font-medium">
              {language === 'no' ? 'Diagnostiske kriterier: ' : 'Diagnostic criteria: '}
              {cluster.diagnosticCriteria.threshold}/{cluster.diagnosticCriteria.total} positive
            </p>
            {score?.meetsThreshold && (
              <p className={`text-sm mt-1 ${cluster.redFlagCluster ? 'text-red-700' : 'text-green-700'}`}>
                ✓ {cluster.diagnosticCriteria.interpretation[language]}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TestRow({ test, result, onResult, language }) {
  const [showDetails, setShowDetails] = useState(false);
  const [notes, setNotes] = useState(result?.notes || '');
  const [side, setSide] = useState(result?.side || '');

  const handleResultChange = (newResult) => {
    onResult({
      result: newResult,
      side: side || undefined,
      notes: notes || undefined
    });
  };

  return (
    <div className={`border rounded-lg p-3 ${
      test.redFlag ? 'border-red-200 bg-red-50' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{test.name[language]}</span>
            {test.redFlag && (
              <AlertTriangle size={16} className="text-red-500" />
            )}
            {test.sensitivity && (
              <span className="text-xs text-gray-500">
                Se: {Math.round(test.sensitivity * 100)}% / Sp: {Math.round(test.specificity * 100)}%
              </span>
            )}
          </div>
          {test.target && (
            <p className="text-xs text-gray-500 mt-0.5">
              Target: {test.target}
            </p>
          )}
        </div>

        {/* Result buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleResultChange('positive')}
            className={`p-2 rounded-lg transition-colors ${
              result?.result === 'positive'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-red-100'
            }`}
            title="Positive"
          >
            <XCircle size={18} />
          </button>
          <button
            onClick={() => handleResultChange('negative')}
            className={`p-2 rounded-lg transition-colors ${
              result?.result === 'negative'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-green-100'
            }`}
            title="Negative"
          >
            <CheckCircle size={18} />
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <ChevronDown size={18} className={showDetails ? 'rotate-180' : ''} />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
          <div>
            <label className="text-xs font-medium text-gray-600">
              {language === 'no' ? 'Prosedyre' : 'Procedure'}
            </label>
            <p className="text-sm text-gray-700">{test.procedure[language]}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">
              {language === 'no' ? 'Positiv ved' : 'Positive finding'}
            </label>
            <p className="text-sm text-gray-700">{test.positive[language]}</p>
          </div>

          {/* Side selector */}
          <div className="flex items-center gap-4">
            <label className="text-xs font-medium text-gray-600">
              {language === 'no' ? 'Side' : 'Side'}
            </label>
            <div className="flex gap-2">
              {['left', 'right', 'bilateral'].map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setSide(s);
                    if (result?.result) {
                      onResult({ ...result, side: s });
                    }
                  }}
                  className={`px-2 py-1 text-xs rounded ${
                    side === s ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {s === 'left' ? (language === 'no' ? 'Venstre' : 'Left') :
                   s === 'right' ? (language === 'no' ? 'Høyre' : 'Right') :
                   (language === 'no' ? 'Bilateral' : 'Bilateral')}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-600">
              {language === 'no' ? 'Notater' : 'Notes'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (result?.result) {
                  onResult({ ...result, notes });
                }
              }}
              placeholder={language === 'no' ? 'Legg til notater...' : 'Add notes...'}
              className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>

          {/* Grading if available */}
          {test.grading && (
            <div>
              <label className="text-xs font-medium text-gray-600">
                {language === 'no' ? 'Gradering' : 'Grading'}
              </label>
              <div className="flex gap-2 mt-1">
                {Object.entries(test.grading).map(([grade, desc]) => (
                  <span key={grade} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {grade}: {desc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Red flag warning */}
          {test.redFlag && test.redFlagCondition && (
            <div className="bg-red-100 border border-red-300 rounded p-2 mt-2">
              <p className="text-xs text-red-700 font-medium">
                ⚠️ {test.redFlagCondition}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RedFlagAlert({ redFlags, language }) {
  if (!redFlags || redFlags.length === 0) return null;

  return (
    <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="text-red-600" size={24} />
        <h3 className="font-bold text-red-800">
          {language === 'no' ? 'RØDE FLAGG PÅVIST' : 'RED FLAGS DETECTED'}
        </h3>
      </div>
      <ul className="space-y-2">
        {redFlags.map((rf, i) => (
          <li key={i} className="text-red-700">
            <strong>{rf.testName?.[language] || rf.clusterName?.[language]}:</strong> {rf.action}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NarrativePanel({ narrative, onCopy, language }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <FileText size={18} />
          {language === 'no' ? 'Klinisk Narrativ' : 'Clinical Narrative'}
        </h3>
        <button
          onClick={onCopy}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Clipboard size={14} />
          {language === 'no' ? 'Kopier' : 'Copy'}
        </button>
      </div>
      <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
        {narrative || (language === 'no' ? 'Ingen tester utført ennå...' : 'No tests performed yet...')}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function OrthopedicExam({
  patientId,
  encounterId,
  onExamChange,
  initialData,
  language = 'no'
}) {
  const [selectedRegion, setSelectedRegion] = useState('SHOULDER');
  const [clusterResults, setClusterResults] = useState(initialData?.clusterResults || {});
  const [expandedClusters, setExpandedClusters] = useState({});
  const [redFlags, setRedFlags] = useState([]);
  const [narrative, setNarrative] = useState('');

  // Update narrative and red flags when results change
  useEffect(() => {
    const allResults = {};
    Object.entries(clusterResults).forEach(([clusterId, results]) => {
      Object.entries(results).forEach(([testId, result]) => {
        allResults[testId] = result;
      });
    });

    const newRedFlags = checkOrthoRedFlags(allResults);
    setRedFlags(newRedFlags);

    const newNarrative = generateOrthoNarrative({ clusterResults, redFlags: newRedFlags }, language);
    setNarrative(newNarrative);

    // Notify parent
    if (onExamChange) {
      onExamChange({
        clusterResults,
        redFlags: newRedFlags,
        narrative: newNarrative,
        clusterScores: Object.keys(clusterResults).reduce((acc, clusterId) => {
          acc[clusterId] = calculateOrthoClusterScore(clusterId, clusterResults[clusterId]);
          return acc;
        }, {})
      });
    }
  }, [clusterResults, language]);

  const handleTestResult = useCallback((clusterId, testId, result) => {
    setClusterResults(prev => ({
      ...prev,
      [clusterId]: {
        ...prev[clusterId],
        [testId]: result
      }
    }));
  }, []);

  const toggleCluster = useCallback((clusterId) => {
    setExpandedClusters(prev => ({
      ...prev,
      [clusterId]: !prev[clusterId]
    }));
  }, []);

  const copyNarrative = useCallback(() => {
    navigator.clipboard.writeText(narrative);
  }, [narrative]);

  const resetExam = useCallback(() => {
    setClusterResults({});
    setExpandedClusters({});
    setRedFlags([]);
    setNarrative('');
  }, []);

  const regionClusters = getClustersByRegion(selectedRegion);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="text-blue-600" size={24} />
          {language === 'no' ? 'Ortopedisk Undersøkelse' : 'Orthopedic Examination'}
        </h2>
        <button
          onClick={resetExam}
          className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
        >
          <RotateCcw size={14} />
          {language === 'no' ? 'Nullstill' : 'Reset'}
        </button>
      </div>

      {/* Red Flag Alerts */}
      <RedFlagAlert redFlags={redFlags} language={language} />

      {/* Region Selector */}
      <RegionSelector
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
        clusterResults={clusterResults}
        language={language}
      />

      {/* Clusters for Selected Region */}
      <div className="space-y-3">
        {regionClusters.map(cluster => (
          <ClusterCard
            key={cluster.id}
            cluster={cluster}
            results={clusterResults[cluster.id]}
            onTestResult={(testId, result) => handleTestResult(cluster.id, testId, result)}
            expanded={expandedClusters[cluster.id]}
            onToggle={() => toggleCluster(cluster.id)}
            language={language}
          />
        ))}
      </div>

      {/* Narrative Output */}
      <NarrativePanel
        narrative={narrative}
        onCopy={copyNarrative}
        language={language}
      />
    </div>
  );
}

// Compact version for embedding
export function OrthopedicExamCompact(props) {
  return (
    <div className="max-h-96 overflow-y-auto">
      <OrthopedicExam {...props} />
    </div>
  );
}
