import { useState } from 'react';
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * SpineDiagram - Detailed vertebra-by-vertebra spine assessment
 * Inspired by ChiroTouch's spine diagram with subluxation markers
 *
 * Features:
 * - Click individual vertebrae (C1-S1)
 * - Mark subluxations with side (L/R/B)
 * - Color-coded severity
 * - Auto-generates clinical narrative
 */

// Vertebra definitions
const SPINE_REGIONS = {
  cervical: {
    label: 'Cervical',
    color: 'blue',
    vertebrae: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7']
  },
  thoracic: {
    label: 'Thoracic',
    color: 'green',
    vertebrae: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
  },
  lumbar: {
    label: 'Lumbar',
    color: 'orange',
    vertebrae: ['L1', 'L2', 'L3', 'L4', 'L5']
  },
  sacral: {
    label: 'Sacral/Pelvis',
    color: 'red',
    vertebrae: ['Sacrum', 'R Ilium', 'L Ilium', 'Coccyx']
  }
};

const FINDING_TYPES = {
  subluxation: { label: 'Subluxation', color: 'red', abbrev: 'SUB' },
  fixation: { label: 'Fixation', color: 'orange', abbrev: 'FIX' },
  restriction: { label: 'Restriction', color: 'yellow', abbrev: 'REST' },
  tenderness: { label: 'Tenderness', color: 'purple', abbrev: 'TTP' },
  spasm: { label: 'Muscle Spasm', color: 'blue', abbrev: 'SP' }
};

const SIDES = {
  L: 'Left',
  R: 'Right',
  B: 'Bilateral',
  C: 'Central'
};

export default function SpineDiagram({
  findings = {},
  onChange,
  showNarrative = true,
  compact = false,
  className = ''
}) {
  const [selectedVertebra, setSelectedVertebra] = useState(null);
  const [expandedRegions, setExpandedRegions] = useState({
    cervical: true,
    thoracic: true,
    lumbar: true,
    sacral: true
  });

  const toggleRegion = (region) => {
    setExpandedRegions(prev => ({
      ...prev,
      [region]: !prev[region]
    }));
  };

  const addFinding = (vertebra, type, side) => {
    const key = `${vertebra}_${type}_${side}`;
    const newFindings = { ...findings };

    if (newFindings[key]) {
      delete newFindings[key];
    } else {
      newFindings[key] = {
        vertebra,
        type,
        side,
        timestamp: new Date().toISOString()
      };
    }

    onChange(newFindings);
    setSelectedVertebra(null);
  };

  const clearAll = () => {
    onChange({});
  };

  const hasFinding = (vertebra) => {
    return Object.values(findings).some(f => f.vertebra === vertebra);
  };

  const getVertebraFindings = (vertebra) => {
    return Object.values(findings).filter(f => f.vertebra === vertebra);
  };

  const getVertebraColor = (vertebra) => {
    const vFindings = getVertebraFindings(vertebra);
    if (vFindings.length === 0) return 'bg-gray-200';

    // Priority: subluxation > fixation > restriction > tenderness > spasm
    if (vFindings.some(f => f.type === 'subluxation')) return 'bg-red-500';
    if (vFindings.some(f => f.type === 'fixation')) return 'bg-orange-500';
    if (vFindings.some(f => f.type === 'restriction')) return 'bg-yellow-500';
    if (vFindings.some(f => f.type === 'tenderness')) return 'bg-purple-500';
    return 'bg-blue-500';
  };

  // Generate ChiroTouch-style narrative
  const generateNarrative = () => {
    const findingsList = Object.values(findings);
    if (findingsList.length === 0) return null;

    // Group by type
    const grouped = {};
    findingsList.forEach(f => {
      if (!grouped[f.type]) grouped[f.type] = [];
      grouped[f.type].push(f);
    });

    const narratives = [];

    // Subluxations
    if (grouped.subluxation) {
      const subs = grouped.subluxation.map(f =>
        `${f.side !== 'C' ? SIDES[f.side].toLowerCase() + ' ' : ''}${f.vertebra}`
      );
      narratives.push(`Spinal Restrictions/Subluxations: ${subs.join(', ')}`);
    }

    // Fixations
    if (grouped.fixation) {
      const fixes = grouped.fixation.map(f =>
        `${f.side !== 'C' ? SIDES[f.side].toLowerCase() + ' ' : ''}${f.vertebra}`
      );
      narratives.push(`Segmental Fixations: ${fixes.join(', ')}`);
    }

    // Restrictions
    if (grouped.restriction) {
      const rests = grouped.restriction.map(f => f.vertebra);
      narratives.push(`Motion Restrictions noted at: ${rests.join(', ')}`);
    }

    // Tenderness
    if (grouped.tenderness) {
      const tends = grouped.tenderness.map(f =>
        `${f.side !== 'C' ? SIDES[f.side].toLowerCase() + ' ' : ''}${f.vertebra}`
      );
      narratives.push(`Pain/Tenderness: ${tends.join(', ')}`);
    }

    // Spasm
    if (grouped.spasm) {
      const spasms = grouped.spasm.map(f => f.vertebra);
      narratives.push(`Muscle Spasm(s): Hypertonic tissue tone at ${spasms.join(', ')}`);
    }

    return narratives;
  };

  const narrative = generateNarrative();
  const totalFindings = Object.keys(findings).length;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">Spinal Assessment</h3>
          {totalFindings > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              {totalFindings} findings
            </span>
          )}
        </div>
        {totalFindings > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <div className={`${compact ? '' : 'grid grid-cols-1 lg:grid-cols-2'}`}>
        {/* Visual Spine Diagram */}
        <div className="p-4 flex justify-center">
          <div className="relative">
            {/* Spine column visual */}
            <svg viewBox="0 0 120 400" className="w-32 h-auto">
              {/* Background spine shape */}
              <path
                d="M60,10 Q70,10 70,20 L70,380 Q70,390 60,390 Q50,390 50,380 L50,20 Q50,10 60,10"
                className="fill-gray-100 stroke-gray-300"
                strokeWidth="1"
              />

              {/* Cervical region */}
              {SPINE_REGIONS.cervical.vertebrae.map((v, i) => {
                const y = 15 + i * 18;
                const finding = hasFinding(v);
                return (
                  <g key={v}>
                    <rect
                      x="45"
                      y={y}
                      width="30"
                      height="14"
                      rx="3"
                      className={`cursor-pointer transition-all ${
                        finding ? getVertebraColor(v) : 'fill-blue-200 hover:fill-blue-300'
                      } ${selectedVertebra === v ? 'stroke-blue-600 stroke-2' : 'stroke-blue-400'}`}
                      onClick={() => setSelectedVertebra(selectedVertebra === v ? null : v)}
                    />
                    <text
                      x="60"
                      y={y + 10}
                      textAnchor="middle"
                      className={`text-[8px] font-bold pointer-events-none ${
                        finding ? 'fill-white' : 'fill-blue-800'
                      }`}
                    >
                      {v}
                    </text>
                  </g>
                );
              })}

              {/* Thoracic region */}
              {SPINE_REGIONS.thoracic.vertebrae.map((v, i) => {
                const y = 140 + i * 16;
                const finding = hasFinding(v);
                return (
                  <g key={v}>
                    <rect
                      x="42"
                      y={y}
                      width="36"
                      height="13"
                      rx="3"
                      className={`cursor-pointer transition-all ${
                        finding ? getVertebraColor(v) : 'fill-green-200 hover:fill-green-300'
                      } ${selectedVertebra === v ? 'stroke-green-600 stroke-2' : 'stroke-green-400'}`}
                      onClick={() => setSelectedVertebra(selectedVertebra === v ? null : v)}
                    />
                    <text
                      x="60"
                      y={y + 10}
                      textAnchor="middle"
                      className={`text-[7px] font-bold pointer-events-none ${
                        finding ? 'fill-white' : 'fill-green-800'
                      }`}
                    >
                      {v}
                    </text>
                  </g>
                );
              })}

              {/* Lumbar region */}
              {SPINE_REGIONS.lumbar.vertebrae.map((v, i) => {
                const y = 335 + i * 18;
                const finding = hasFinding(v);
                return (
                  <g key={v}>
                    <rect
                      x="40"
                      y={y}
                      width="40"
                      height="15"
                      rx="4"
                      className={`cursor-pointer transition-all ${
                        finding ? getVertebraColor(v) : 'fill-orange-200 hover:fill-orange-300'
                      } ${selectedVertebra === v ? 'stroke-orange-600 stroke-2' : 'stroke-orange-400'}`}
                      onClick={() => setSelectedVertebra(selectedVertebra === v ? null : v)}
                    />
                    <text
                      x="60"
                      y={y + 11}
                      textAnchor="middle"
                      className={`text-[8px] font-bold pointer-events-none ${
                        finding ? 'fill-white' : 'fill-orange-800'
                      }`}
                    >
                      {v}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Side indicators */}
            <div className="absolute top-0 left-0 text-xs text-gray-500 font-medium">L</div>
            <div className="absolute top-0 right-0 text-xs text-gray-500 font-medium">R</div>
          </div>

          {/* Sacrum/Pelvis buttons */}
          <div className="ml-4 flex flex-col justify-end gap-2 pb-4">
            {SPINE_REGIONS.sacral.vertebrae.map(v => {
              const finding = hasFinding(v);
              return (
                <button
                  key={v}
                  onClick={() => setSelectedVertebra(selectedVertebra === v ? null : v)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                    finding
                      ? `${getVertebraColor(v)} text-white`
                      : selectedVertebra === v
                        ? 'bg-red-100 border-2 border-red-400 text-red-800'
                        : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        {/* Finding Selection Panel */}
        <div className="p-4 border-l border-gray-200">
          {selectedVertebra ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">
                  Add Finding: <span className="text-blue-600">{selectedVertebra}</span>
                </h4>
                <button
                  onClick={() => setSelectedVertebra(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Finding Type Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Finding Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(FINDING_TYPES).map(([key, type]) => (
                    <div key={key} className="space-y-1">
                      <div className="text-xs font-medium text-gray-700">{type.label}</div>
                      <div className="flex gap-1">
                        {Object.entries(SIDES).map(([sideKey, sideLabel]) => {
                          const isActive = findings[`${selectedVertebra}_${key}_${sideKey}`];
                          return (
                            <button
                              key={sideKey}
                              onClick={() => addFinding(selectedVertebra, key, sideKey)}
                              className={`px-2 py-1 text-xs rounded transition-all ${
                                isActive
                                  ? `bg-${type.color}-500 text-white`
                                  : `bg-gray-100 text-gray-600 hover:bg-${type.color}-100`
                              }`}
                              title={sideLabel}
                            >
                              {sideKey}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current findings for this vertebra */}
              {getVertebraFindings(selectedVertebra).length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    Current Findings for {selectedVertebra}
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {getVertebraFindings(selectedVertebra).map(f => (
                      <span
                        key={`${f.vertebra}_${f.type}_${f.side}`}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {FINDING_TYPES[f.type].abbrev} {f.side}
                        <button
                          onClick={() => addFinding(f.vertebra, f.type, f.side)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <p className="text-sm text-gray-500 mb-4">
                Click a vertebra on the spine diagram to add findings
              </p>

              {/* Legend */}
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-500">Legend</h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(FINDING_TYPES).map(([key, type]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded bg-${type.color}-500`}></div>
                      <span>{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick summary of all findings */}
              {totalFindings > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="text-xs font-medium text-gray-500 mb-2">All Findings</h5>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {Object.values(findings).map(f => (
                      <span
                        key={`${f.vertebra}_${f.type}_${f.side}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded text-white bg-${FINDING_TYPES[f.type].color}-500`}
                      >
                        {f.vertebra} {FINDING_TYPES[f.type].abbrev} {f.side}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Generated Narrative */}
      {showNarrative && narrative && narrative.length > 0 && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-200 rounded-b-lg">
          <label className="block text-xs font-medium text-green-800 mb-2">
            Daily Objective Findings:
          </label>
          <ul className="space-y-1">
            {narrative.map((line, i) => (
              <li key={i} className="text-sm text-green-900">• {line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Quick vertebra selection buttons (alternative to visual diagram)
export function QuickVertebraSelect({ findings = {}, onChange }) {
  const toggleVertebra = (vertebra, type = 'subluxation', side = 'C') => {
    const key = `${vertebra}_${type}_${side}`;
    const newFindings = { ...findings };

    if (newFindings[key]) {
      delete newFindings[key];
    } else {
      newFindings[key] = { vertebra, type, side, timestamp: new Date().toISOString() };
    }

    onChange(newFindings);
  };

  const hasAnyFinding = (vertebra) => {
    return Object.values(findings).some(f => f.vertebra === vertebra);
  };

  return (
    <div className="space-y-3">
      {Object.entries(SPINE_REGIONS).map(([regionKey, region]) => (
        <div key={regionKey}>
          <label className="block text-xs font-medium text-gray-500 mb-1">{region.label}</label>
          <div className="flex flex-wrap gap-1">
            {region.vertebrae.map(v => (
              <button
                key={v}
                onClick={() => toggleVertebra(v)}
                className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                  hasAnyFinding(v)
                    ? 'bg-red-500 text-white'
                    : `bg-${region.color}-100 text-${region.color}-800 hover:bg-${region.color}-200`
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
