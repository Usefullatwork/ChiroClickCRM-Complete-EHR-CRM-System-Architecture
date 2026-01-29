/**
 * AnatomicalSpine Component
 * Detailed anatomical spine diagram with discs, nerve roots, and facet joints
 * Enhanced version of SpineDiagram for clinical documentation
 */

import React, { useState, useCallback, useMemo } from 'react';
import { RotateCcw, Layers, Zap, Circle } from 'lucide-react';

// Vertebrae with anatomical positions
const VERTEBRAE = [
  // Cervical
  { id: 'C1', label: 'C1 Atlas', region: 'cervical', y: 30, width: 28, hasDisc: false },
  { id: 'C2', label: 'C2 Axis', region: 'cervical', y: 48, width: 30, hasDisc: true },
  { id: 'C3', label: 'C3', region: 'cervical', y: 68, width: 32, hasDisc: true },
  { id: 'C4', label: 'C4', region: 'cervical', y: 88, width: 34, hasDisc: true },
  { id: 'C5', label: 'C5', region: 'cervical', y: 108, width: 36, hasDisc: true },
  { id: 'C6', label: 'C6', region: 'cervical', y: 128, width: 38, hasDisc: true },
  { id: 'C7', label: 'C7', region: 'cervical', y: 148, width: 40, hasDisc: true },
  // Thoracic
  { id: 'T1', label: 'T1', region: 'thoracic', y: 172, width: 42, hasDisc: true },
  { id: 'T2', label: 'T2', region: 'thoracic', y: 192, width: 43, hasDisc: true },
  { id: 'T3', label: 'T3', region: 'thoracic', y: 212, width: 44, hasDisc: true },
  { id: 'T4', label: 'T4', region: 'thoracic', y: 232, width: 45, hasDisc: true },
  { id: 'T5', label: 'T5', region: 'thoracic', y: 252, width: 46, hasDisc: true },
  { id: 'T6', label: 'T6', region: 'thoracic', y: 272, width: 46, hasDisc: true },
  { id: 'T7', label: 'T7', region: 'thoracic', y: 292, width: 46, hasDisc: true },
  { id: 'T8', label: 'T8', region: 'thoracic', y: 312, width: 47, hasDisc: true },
  { id: 'T9', label: 'T9', region: 'thoracic', y: 332, width: 48, hasDisc: true },
  { id: 'T10', label: 'T10', region: 'thoracic', y: 352, width: 49, hasDisc: true },
  { id: 'T11', label: 'T11', region: 'thoracic', y: 372, width: 50, hasDisc: true },
  { id: 'T12', label: 'T12', region: 'thoracic', y: 392, width: 52, hasDisc: true },
  // Lumbar
  { id: 'L1', label: 'L1', region: 'lumbar', y: 418, width: 54, hasDisc: true },
  { id: 'L2', label: 'L2', region: 'lumbar', y: 444, width: 56, hasDisc: true },
  { id: 'L3', label: 'L3', region: 'lumbar', y: 470, width: 58, hasDisc: true },
  { id: 'L4', label: 'L4', region: 'lumbar', y: 496, width: 60, hasDisc: true },
  { id: 'L5', label: 'L5', region: 'lumbar', y: 522, width: 62, hasDisc: true },
  // Sacral
  { id: 'S1', label: 'Sacrum', region: 'sacral', y: 555, width: 70, hasDisc: false }
];

// Disc labels (between vertebrae)
const DISCS = VERTEBRAE.filter(v => v.hasDisc).map((v, i) => ({
  id: `disc_${v.id}`,
  label: i === 0 ? 'C2-C3' : `${VERTEBRAE[VERTEBRAE.findIndex(x => x.id === v.id) - 1]?.id}-${v.id}`,
  vertebra: v.id,
  y: v.y - 8
}));

// Nerve roots
const NERVE_ROOTS = [
  { id: 'C1_nerve', label: 'C1 nerve', vertebra: 'C1', y: 35 },
  { id: 'C2_nerve', label: 'C2 nerve', vertebra: 'C2', y: 55 },
  { id: 'C3_nerve', label: 'C3 nerve', vertebra: 'C3', y: 75 },
  { id: 'C4_nerve', label: 'C4 nerve', vertebra: 'C4', y: 95 },
  { id: 'C5_nerve', label: 'C5 nerve', vertebra: 'C5', y: 115 },
  { id: 'C6_nerve', label: 'C6 nerve', vertebra: 'C6', y: 135 },
  { id: 'C7_nerve', label: 'C7 nerve', vertebra: 'C7', y: 155 },
  { id: 'C8_nerve', label: 'C8 nerve', vertebra: 'T1', y: 175 },
  { id: 'T1_nerve', label: 'T1 nerve', vertebra: 'T1', y: 195 },
  { id: 'L1_nerve', label: 'L1 nerve', vertebra: 'L1', y: 425 },
  { id: 'L2_nerve', label: 'L2 nerve', vertebra: 'L2', y: 451 },
  { id: 'L3_nerve', label: 'L3 nerve', vertebra: 'L3', y: 477 },
  { id: 'L4_nerve', label: 'L4 nerve', vertebra: 'L4', y: 503 },
  { id: 'L5_nerve', label: 'L5 nerve', vertebra: 'L5', y: 529 },
  { id: 'S1_nerve', label: 'S1 nerve', vertebra: 'S1', y: 560 }
];

// Region colors
const REGION_COLORS = {
  cervical: { fill: '#dbeafe', stroke: '#3b82f6', text: '#1d4ed8' },
  thoracic: { fill: '#dcfce7', stroke: '#22c55e', text: '#15803d' },
  lumbar: { fill: '#fef3c7', stroke: '#f59e0b', text: '#b45309' },
  sacral: { fill: '#fee2e2', stroke: '#ef4444', text: '#b91c1c' }
};

// Finding types
const FINDING_TYPES = {
  subluxation: { label: 'Subluksasjon', abbrev: 'SUB', color: '#ef4444', priority: 1 },
  fixation: { label: 'Fiksasjon', abbrev: 'FIX', color: '#f97316', priority: 2 },
  restriction: { label: 'Restriksjon', abbrev: 'REST', color: '#eab308', priority: 3 },
  hypermobility: { label: 'Hypermobilitet', abbrev: 'HYP', color: '#8b5cf6', priority: 4 },
  disc_bulge: { label: 'Disc bulge', abbrev: 'DB', color: '#6366f1', priority: 5 },
  disc_herniation: { label: 'Disc herniation', abbrev: 'DH', color: '#dc2626', priority: 6 },
  stenosis: { label: 'Stenose', abbrev: 'STEN', color: '#be185d', priority: 7 },
  nerve_irritation: { label: 'Nerveirritasjon', abbrev: 'NI', color: '#0891b2', priority: 8 },
  facet_syndrome: { label: 'Fasettleddssyndrom', abbrev: 'FS', color: '#059669', priority: 9 },
  adjusted: { label: 'Justert', abbrev: '✓', color: '#22c55e', priority: 10 }
};

// Listing directions
const LISTINGS = [
  { id: 'none', label: '-', description: 'Ingen' },
  { id: 'PL', label: 'PL', description: 'Posterior Left' },
  { id: 'PR', label: 'PR', description: 'Posterior Right' },
  { id: 'PS', label: 'PS', description: 'Posterior Superior' },
  { id: 'PI', label: 'PI', description: 'Posterior Inferior' },
  { id: 'AS', label: 'AS', description: 'Anterior Superior' },
  { id: 'AI', label: 'AI', description: 'Anterior Inferior' },
  { id: 'RL', label: 'RL', description: 'Right Lateral' },
  { id: 'LL', label: 'LL', description: 'Left Lateral' },
  { id: 'RR', label: 'RR', description: 'Right Rotation' },
  { id: 'LR', label: 'LR', description: 'Left Rotation' }
];

export default function AnatomicalSpine({
  findings = {},
  onChange,
  readOnly = false,
  showDiscs = true,
  showNerves = true,
  showLabels = true,
  compact = false,
  className = ''
}) {
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedType, setSelectedType] = useState('vertebra'); // 'vertebra', 'disc', 'nerve'
  const [selectedFinding, setSelectedFinding] = useState('subluxation');
  const [selectedListing, setSelectedListing] = useState('none');
  const [showLayers, setShowLayers] = useState({ discs: showDiscs, nerves: showNerves });

  const getElementFindings = useCallback((elementId) => {
    return Object.values(findings).filter(f => f.elementId === elementId);
  }, [findings]);

  const hasFindings = useCallback((elementId) => {
    return getElementFindings(elementId).length > 0;
  }, [getElementFindings]);

  const getElementColor = useCallback((elementId) => {
    const elementFindings = getElementFindings(elementId);
    if (elementFindings.length === 0) return null;

    // Return highest priority finding color
    const sorted = elementFindings.sort((a, b) =>
      (FINDING_TYPES[a.type]?.priority || 99) - (FINDING_TYPES[b.type]?.priority || 99)
    );
    return FINDING_TYPES[sorted[0].type]?.color;
  }, [getElementFindings]);

  const addFinding = useCallback((elementId, elementLabel, elementType) => {
    if (readOnly) return;

    const key = `${elementId}_${selectedFinding}`;
    const newFindings = { ...findings };

    if (newFindings[key]) {
      delete newFindings[key];
    } else {
      newFindings[key] = {
        elementId,
        elementLabel,
        elementType,
        type: selectedFinding,
        typeLabel: FINDING_TYPES[selectedFinding].label,
        listing: selectedListing,
        color: FINDING_TYPES[selectedFinding].color,
        timestamp: new Date().toISOString()
      };
    }

    onChange?.(newFindings);
  }, [findings, selectedFinding, selectedListing, onChange, readOnly]);

  const clearAll = () => {
    onChange?.({});
    setSelectedElement(null);
  };

  const generateNarrative = useMemo(() => {
    const findingsList = Object.values(findings);
    if (findingsList.length === 0) return null;

    // Group by type
    const grouped = {};
    findingsList.forEach(f => {
      if (!grouped[f.type]) grouped[f.type] = [];
      const listingText = f.listing !== 'none' ? ` (${f.listing})` : '';
      grouped[f.type].push(`${f.elementLabel}${listingText}`);
    });

    const narratives = [];

    Object.entries(grouped).forEach(([type, elements]) => {
      const typeInfo = FINDING_TYPES[type];
      if (typeInfo) {
        narratives.push(`${typeInfo.label}: ${elements.join(', ')}`);
      }
    });

    return narratives;
  }, [findings]);

  const totalFindings = Object.keys(findings).length;
  const centerX = 100;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">Anatomisk Ryggdiagram</h3>
          {totalFindings > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              {totalFindings} funn
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLayers(l => ({ ...l, discs: !l.discs }))}
            className={`p-1.5 rounded ${showLayers.discs ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:bg-gray-100'}`}
            title="Vis/skjul discer"
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowLayers(l => ({ ...l, nerves: !l.nerves }))}
            className={`p-1.5 rounded ${showLayers.nerves ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400 hover:bg-gray-100'}`}
            title="Vis/skjul nerver"
          >
            <Zap className="w-4 h-4" />
          </button>
          {totalFindings > 0 && !readOnly && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
            >
              <RotateCcw className="w-3 h-3" />
              Nullstill
            </button>
          )}
        </div>
      </div>

      <div className={`${compact ? '' : 'grid grid-cols-1 lg:grid-cols-2'}`}>
        {/* Anatomical diagram */}
        <div className="p-4 flex justify-center">
          <svg viewBox="0 0 200 620" className="w-48 h-auto">
            <defs>
              <linearGradient id="spineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f3f4f6" />
                <stop offset="50%" stopColor="#e5e7eb" />
                <stop offset="100%" stopColor="#f3f4f6" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Spinal canal background */}
            <rect x={centerX - 4} y="25" width="8" height="545" rx="4" fill="#fef3c7" opacity="0.5" />

            {/* Nerve roots */}
            {showLayers.nerves && NERVE_ROOTS.map(nerve => {
              const nerveColor = getElementColor(nerve.id);
              return (
                <g key={nerve.id}>
                  {/* Left nerve */}
                  <path
                    d={`M${centerX - 5},${nerve.y} Q${centerX - 30},${nerve.y + 5} ${centerX - 45},${nerve.y + 15}`}
                    fill="none"
                    stroke={nerveColor || '#fbbf24'}
                    strokeWidth={nerveColor ? 2.5 : 1.5}
                    className={`cursor-pointer ${!readOnly ? 'hover:stroke-yellow-500' : ''}`}
                    onClick={() => !readOnly && addFinding(nerve.id, nerve.label, 'nerve')}
                    filter={nerveColor ? 'url(#glow)' : undefined}
                  />
                  {/* Right nerve */}
                  <path
                    d={`M${centerX + 5},${nerve.y} Q${centerX + 30},${nerve.y + 5} ${centerX + 45},${nerve.y + 15}`}
                    fill="none"
                    stroke={nerveColor || '#fbbf24'}
                    strokeWidth={nerveColor ? 2.5 : 1.5}
                    className={`cursor-pointer ${!readOnly ? 'hover:stroke-yellow-500' : ''}`}
                    onClick={() => !readOnly && addFinding(nerve.id, nerve.label, 'nerve')}
                    filter={nerveColor ? 'url(#glow)' : undefined}
                  />
                </g>
              );
            })}

            {/* Intervertebral discs */}
            {showLayers.discs && VERTEBRAE.filter(v => v.hasDisc).map((v, i) => {
              const discId = `disc_${v.id}`;
              const discColor = getElementColor(discId);
              const prevV = VERTEBRAE[VERTEBRAE.findIndex(x => x.id === v.id) - 1];
              const discLabel = prevV ? `${prevV.id}-${v.id}` : v.id;

              return (
                <ellipse
                  key={discId}
                  cx={centerX}
                  cy={v.y - 6}
                  rx={v.width / 2 - 2}
                  ry={3}
                  fill={discColor ? discColor + 'aa' : '#93c5fd'}
                  stroke={discColor || '#60a5fa'}
                  strokeWidth={discColor ? 2 : 1}
                  className={`cursor-pointer ${!readOnly ? 'hover:fill-blue-300' : ''}`}
                  onClick={() => !readOnly && addFinding(discId, discLabel + ' disc', 'disc')}
                />
              );
            })}

            {/* Vertebrae */}
            {VERTEBRAE.map((v) => {
              const colors = REGION_COLORS[v.region];
              const findingColor = getElementColor(v.id);
              const isSelected = selectedElement === v.id;

              return (
                <g key={v.id}>
                  {/* Vertebra body */}
                  <rect
                    x={centerX - v.width / 2}
                    y={v.y}
                    width={v.width}
                    height={v.region === 'lumbar' ? 18 : v.region === 'sacral' ? 40 : 14}
                    rx={3}
                    fill={findingColor ? findingColor + '40' : colors.fill}
                    stroke={findingColor || (isSelected ? '#2563eb' : colors.stroke)}
                    strokeWidth={isSelected ? 2 : 1}
                    className={`cursor-pointer transition-all ${!readOnly ? 'hover:opacity-80' : ''}`}
                    onClick={() => {
                      if (!readOnly) {
                        setSelectedElement(v.id);
                        addFinding(v.id, v.label, 'vertebra');
                      }
                    }}
                  />

                  {/* Transverse processes (simplified) */}
                  {v.region !== 'sacral' && (
                    <>
                      <line
                        x1={centerX - v.width / 2}
                        y1={v.y + 7}
                        x2={centerX - v.width / 2 - 8}
                        y2={v.y + 7}
                        stroke={findingColor || colors.stroke}
                        strokeWidth={findingColor ? 2 : 1}
                      />
                      <line
                        x1={centerX + v.width / 2}
                        y1={v.y + 7}
                        x2={centerX + v.width / 2 + 8}
                        y2={v.y + 7}
                        stroke={findingColor || colors.stroke}
                        strokeWidth={findingColor ? 2 : 1}
                      />
                    </>
                  )}

                  {/* Label */}
                  {showLabels && (
                    <text
                      x={centerX}
                      y={v.y + (v.region === 'lumbar' ? 12 : v.region === 'sacral' ? 25 : 10)}
                      textAnchor="middle"
                      fontSize={v.region === 'thoracic' ? 6 : 7}
                      fontWeight="bold"
                      fill={findingColor ? '#fff' : colors.text}
                      className="pointer-events-none"
                    >
                      {v.id}
                    </text>
                  )}

                  {/* Finding indicator */}
                  {hasFindings(v.id) && (
                    <circle
                      cx={centerX + v.width / 2 + 12}
                      cy={v.y + 7}
                      r={4}
                      fill={findingColor}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  )}
                </g>
              );
            })}

            {/* Region labels */}
            <text x="5" y="90" fontSize="8" fill="#3b82f6" fontWeight="bold" transform="rotate(-90, 5, 90)">CERVICAL</text>
            <text x="5" y="290" fontSize="8" fill="#22c55e" fontWeight="bold" transform="rotate(-90, 5, 290)">THORACIC</text>
            <text x="5" y="470" fontSize="8" fill="#f59e0b" fontWeight="bold" transform="rotate(-90, 5, 470)">LUMBAR</text>
            <text x="5" y="570" fontSize="8" fill="#ef4444" fontWeight="bold" transform="rotate(-90, 5, 570)">SACRAL</text>

            {/* Legend indicators */}
            {showLayers.discs && (
              <g>
                <ellipse cx="175" cy="15" rx="8" ry="3" fill="#93c5fd" stroke="#60a5fa" />
                <text x="175" y="28" fontSize="6" fill="#6b7280" textAnchor="middle">Disc</text>
              </g>
            )}
            {showLayers.nerves && (
              <g>
                <path d="M165,40 Q175,45 185,50" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="175" y="60" fontSize="6" fill="#6b7280" textAnchor="middle">Nerve</text>
              </g>
            )}
          </svg>
        </div>

        {/* Controls panel */}
        <div className="p-4 border-l border-gray-200 space-y-4">
          {/* Finding type selector */}
          {!readOnly && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Funntype
              </label>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(FINDING_TYPES).map(([key, type]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedFinding(key)}
                    className={`px-2 py-1 text-xs rounded transition-all text-left ${
                      selectedFinding === key
                        ? 'ring-2 ring-offset-1'
                        : 'hover:bg-gray-100'
                    }`}
                    style={{
                      backgroundColor: selectedFinding === key ? type.color + '20' : undefined,
                      borderColor: type.color,
                      borderWidth: '1px',
                      color: type.color
                    }}
                  >
                    {type.abbrev} {type.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Listing selector */}
          {!readOnly && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Listing/Retning
              </label>
              <div className="flex flex-wrap gap-1">
                {LISTINGS.map((listing) => (
                  <button
                    key={listing.id}
                    onClick={() => setSelectedListing(listing.id)}
                    className={`px-2 py-1 text-xs rounded transition-all ${
                      selectedListing === listing.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    title={listing.description}
                  >
                    {listing.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current findings */}
          {totalFindings > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Registrerte funn ({totalFindings})
              </label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {Object.entries(findings).map(([key, f]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: f.color }}
                      />
                      <span className="font-medium">{f.elementLabel}</span>
                      <span className="text-gray-500">
                        {f.typeLabel}
                        {f.listing !== 'none' && ` (${f.listing})`}
                      </span>
                    </div>
                    {!readOnly && (
                      <button
                        onClick={() => {
                          const newFindings = { ...findings };
                          delete newFindings[key];
                          onChange?.(newFindings);
                        }}
                        className="text-gray-400 hover:text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick region selectors */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Hurtigvalg
            </label>
            <div className="grid grid-cols-4 gap-1">
              {['cervical', 'thoracic', 'lumbar', 'sacral'].map((region) => (
                <div key={region} className="space-y-0.5">
                  <div
                    className="text-[10px] font-medium px-1 rounded-t"
                    style={{
                      backgroundColor: REGION_COLORS[region].fill,
                      color: REGION_COLORS[region].text
                    }}
                  >
                    {region.charAt(0).toUpperCase() + region.slice(1, 4)}
                  </div>
                  {VERTEBRAE.filter(v => v.region === region).map((v) => (
                    <button
                      key={v.id}
                      onClick={() => !readOnly && addFinding(v.id, v.label, 'vertebra')}
                      className={`w-full px-1 py-0.5 text-[9px] rounded transition-all ${
                        hasFindings(v.id)
                          ? 'text-white font-medium'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      style={hasFindings(v.id) ? { backgroundColor: getElementColor(v.id) } : {}}
                    >
                      {v.id}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generated narrative */}
      {generateNarrative && generateNarrative.length > 0 && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-200 rounded-b-lg">
          <label className="block text-xs font-medium text-green-800 mb-2">
            Ryggfunn (til journal):
          </label>
          <ul className="space-y-1">
            {generateNarrative.map((line, i) => (
              <li key={i} className="text-sm text-green-900">• {line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export { VERTEBRAE, FINDING_TYPES, LISTINGS, REGION_COLORS };
