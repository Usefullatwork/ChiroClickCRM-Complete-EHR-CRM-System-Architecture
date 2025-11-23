import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { encountersAPI, examinationsAPI } from '../services/api';
import { TrendingDown, TrendingUp, Minus, Calendar, ChevronDown, ChevronRight } from 'lucide-react';

export default function ExaminationHistory({ patientId, currentEncounterId }) {
  const [selectedPastEncounter, setSelectedPastEncounter] = useState(null);
  const [expandedTests, setExpandedTests] = useState({});

  // Fetch patient's previous encounters
  const { data: encounters } = useQuery({
    queryKey: ['patient-encounters', patientId],
    queryFn: () => encountersAPI.getByPatient(patientId),
    enabled: !!patientId,
  });

  // Fetch current encounter findings
  const { data: currentFindings } = useQuery({
    queryKey: ['examination-findings', currentEncounterId],
    queryFn: () => examinationsAPI.getFindingsByEncounter(currentEncounterId),
    enabled: !!currentEncounterId,
  });

  // Fetch past encounter findings
  const { data: pastFindings } = useQuery({
    queryKey: ['examination-findings', selectedPastEncounter],
    queryFn: () => examinationsAPI.getFindingsByEncounter(selectedPastEncounter),
    enabled: !!selectedPastEncounter,
  });

  const getComparisonIcon = (current, past) => {
    if (!past) return <Minus className="w-4 h-4 text-gray-400" />;

    const currentScore = getResultScore(current);
    const pastScore = getResultScore(past);

    if (currentScore < pastScore) {
      return <TrendingDown className="w-4 h-4 text-red-500" title="Forverret" />;
    } else if (currentScore > pastScore) {
      return <TrendingUp className="w-4 h-4 text-green-500" title="Forbedret" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" title="Uendret" />;
  };

  const getResultScore = (result) => {
    switch (result) {
      case 'negative': return 3; // Best
      case 'equivocal': return 2;
      case 'positive': return 1;
      case 'not_tested': return 0; // Worst
      default: return 0;
    }
  };

  const getResultText = (result) => {
    switch (result) {
      case 'positive': return 'Positiv';
      case 'negative': return 'Negativ';
      case 'equivocal': return 'Uklar';
      case 'not_tested': return 'Ikke testet';
      default: return result;
    }
  };

  const toggleTestExpansion = (testId) => {
    setExpandedTests(prev => ({
      ...prev,
      [testId]: !prev[testId]
    }));
  };

  const compareFindings = () => {
    if (!currentFindings?.data || !pastFindings?.data) return [];

    const comparisons = [];
    const pastFindingsMap = new Map(
      pastFindings.data.map(f => [f.test_name, f])
    );

    currentFindings.data.forEach(currentFinding => {
      const pastFinding = pastFindingsMap.get(currentFinding.test_name);
      comparisons.push({
        current: currentFinding,
        past: pastFinding,
      });
    });

    return comparisons;
  };

  const comparisons = compareFindings();

  // Filter encounters to exclude current one
  const availableEncounters = encounters?.data?.filter(
    e => e.id !== currentEncounterId
  ).sort((a, b) => new Date(b.encounter_date) - new Date(a.encounter_date)) || [];

  if (!patientId) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-900">Sammenligning med tidligere</h3>
      </div>

      {availableEncounters.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Ingen tidligere konsultasjoner</p>
          <p className="text-xs text-gray-500 mt-1">Sammenligningen vil vises når pasienten har flere konsultasjoner</p>
        </div>
      ) : (
        <>
          {/* Select Past Encounter */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Sammenlign med:
            </label>
            <select
              value={selectedPastEncounter || ''}
              onChange={(e) => setSelectedPastEncounter(e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Velg tidligere konsultasjon...</option>
              {availableEncounters.map(encounter => (
                <option key={encounter.id} value={encounter.id}>
                  {new Date(encounter.encounter_date).toLocaleDateString('nb-NO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {encounter.subjective?.chief_complaint && ` - ${encounter.subjective.chief_complaint}`}
                </option>
              ))}
            </select>
          </div>

          {/* Comparison Results */}
          {selectedPastEncounter && comparisons.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-700">Test</span>
                <div className="flex gap-8">
                  <span className="text-xs font-medium text-gray-700">Tidligere</span>
                  <span className="text-xs font-medium text-gray-700">Nå</span>
                  <span className="text-xs font-medium text-gray-700">Trend</span>
                </div>
              </div>

              {comparisons.map((comparison, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleTestExpansion(comparison.current.id)}
                    className="w-full px-3 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {expandedTests[comparison.current.id] ? (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span className="text-xs font-medium text-gray-900 text-left">
                        {comparison.current.test_name}
                      </span>
                    </div>

                    <div className="flex gap-8 items-center">
                      <span className={`text-xs w-16 text-right ${
                        comparison.past ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {comparison.past ? getResultText(comparison.past.result) : 'N/A'}
                      </span>
                      <span className={`text-xs w-16 text-right font-medium ${
                        comparison.current.result === 'positive' ? 'text-red-600' :
                        comparison.current.result === 'negative' ? 'text-green-600' :
                        'text-gray-700'
                      }`}>
                        {getResultText(comparison.current.result)}
                      </span>
                      <div className="w-8 flex justify-center">
                        {getComparisonIcon(comparison.current.result, comparison.past?.result)}
                      </div>
                    </div>
                  </button>

                  {expandedTests[comparison.current.id] && (
                    <div className="px-3 py-3 bg-gray-50 border-t border-gray-200 text-xs space-y-2">
                      {/* Current Details */}
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Nå:</p>
                        {comparison.current.findings_text && (
                          <p className="text-gray-600 bg-white p-2 rounded">
                            {comparison.current.findings_text}
                          </p>
                        )}
                        {comparison.current.pain_score !== null && (
                          <p className="text-gray-600 mt-1">
                            <span className="font-medium">Smerte:</span> {comparison.current.pain_score}/10
                          </p>
                        )}
                      </div>

                      {/* Past Details */}
                      {comparison.past && (
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Tidligere:</p>
                          {comparison.past.findings_text && (
                            <p className="text-gray-600 bg-white p-2 rounded">
                              {comparison.past.findings_text}
                            </p>
                          )}
                          {comparison.past.pain_score !== null && (
                            <p className="text-gray-600 mt-1">
                              <span className="font-medium">Smerte:</span> {comparison.past.pain_score}/10
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-lg font-bold text-green-600">
                        {comparisons.filter(c =>
                          c.past && getResultScore(c.current.result) > getResultScore(c.past.result)
                        ).length}
                      </span>
                    </div>
                    <p className="text-xs text-green-700">Forbedret</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Minus className="w-4 h-4 text-gray-600" />
                      <span className="text-lg font-bold text-gray-600">
                        {comparisons.filter(c =>
                          c.past && getResultScore(c.current.result) === getResultScore(c.past.result)
                        ).length}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700">Uendret</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <span className="text-lg font-bold text-red-600">
                        {comparisons.filter(c =>
                          c.past && getResultScore(c.current.result) < getResultScore(c.past.result)
                        ).length}
                      </span>
                    </div>
                    <p className="text-xs text-red-700">Forverret</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedPastEncounter && comparisons.length === 0 && (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Ingen felles undersøkelser å sammenligne</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
