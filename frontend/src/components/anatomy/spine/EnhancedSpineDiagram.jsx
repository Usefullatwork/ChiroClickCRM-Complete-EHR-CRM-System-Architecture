/**
 * EnhancedSpineDiagram - Anatomically accurate SVG spine diagram
 *
 * Features:
 * - Realistic vertebra shapes (not simple rectangles)
 * - Posterior view showing spinous processes
 * - Left/Right paraspinal regions
 * - Click-to-select with direction popup
 * - Color-coded findings
 * - Smooth animations
 */
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import useAnatomyClick, { FINDING_TYPES, STANDARD_DIRECTIONS, SI_DIRECTIONS } from '../hooks/useAnatomyClick';

// Vertebra configuration with anatomically-informed shapes
const VERTEBRAE = {
  cervical: {
    label: 'Cervical',
    color: '#3B82F6', // Blue
    lightColor: '#DBEAFE',
    segments: [
      { id: 'C1', y: 20, width: 32, height: 12, special: 'atlas' },
      { id: 'C2', y: 34, width: 34, height: 13, special: 'axis' },
      { id: 'C3', y: 49, width: 36, height: 12 },
      { id: 'C4', y: 63, width: 37, height: 12 },
      { id: 'C5', y: 77, width: 38, height: 12 },
      { id: 'C6', y: 91, width: 40, height: 13 },
      { id: 'C7', y: 106, width: 42, height: 14 }
    ]
  },
  thoracic: {
    label: 'Thoracic',
    color: '#10B981', // Green
    lightColor: '#D1FAE5',
    segments: [
      { id: 'T1', y: 124, width: 44, height: 14 },
      { id: 'T2', y: 140, width: 45, height: 14 },
      { id: 'T3', y: 156, width: 46, height: 14 },
      { id: 'T4', y: 172, width: 47, height: 14 },
      { id: 'T5', y: 188, width: 48, height: 15 },
      { id: 'T6', y: 205, width: 48, height: 15 },
      { id: 'T7', y: 222, width: 49, height: 15 },
      { id: 'T8', y: 239, width: 50, height: 15 },
      { id: 'T9', y: 256, width: 51, height: 15 },
      { id: 'T10', y: 273, width: 52, height: 16 },
      { id: 'T11', y: 291, width: 54, height: 16 },
      { id: 'T12', y: 309, width: 56, height: 17 }
    ]
  },
  lumbar: {
    label: 'Lumbar',
    color: '#F59E0B', // Orange
    lightColor: '#FEF3C7',
    segments: [
      { id: 'L1', y: 330, width: 58, height: 18 },
      { id: 'L2', y: 350, width: 60, height: 19 },
      { id: 'L3', y: 371, width: 62, height: 20 },
      { id: 'L4', y: 393, width: 64, height: 21 },
      { id: 'L5', y: 416, width: 66, height: 22 }
    ]
  },
  sacral: {
    label: 'Sacral',
    color: '#EF4444', // Red
    lightColor: '#FEE2E2',
    segments: [
      { id: 'Sacrum', y: 442, width: 70, height: 35, special: 'sacrum' },
      { id: 'Coccyx', y: 480, width: 24, height: 18, special: 'coccyx' }
    ]
  }
};

// SI Joint and Ilium configuration
const PELVIS = {
  siJoints: [
    { id: 'SI-L', x: 35, y: 450, side: 'left' },
    { id: 'SI-R', x: 165, y: 450, side: 'right' }
  ],
  iliums: [
    { id: 'L-Ilium', x: 20, y: 445, side: 'left' },
    { id: 'R-Ilium', x: 150, y: 445, side: 'right' }
  ]
};

// Finding color mapping
const FINDING_COLORS = {
  subluxation: '#EF4444',
  fixation: '#F97316',
  restriction: '#EAB308',
  tenderness: '#A855F7',
  spasm: '#3B82F6',
  hypermobility: '#10B981'
};

// Generate vertebra SVG path (anatomically-styled)
function generateVertebraPath(x, y, width, height, special) {
  const cx = x + width / 2;

  if (special === 'atlas') {
    // C1 Atlas - ring shape
    return `
      M ${cx - width/2} ${y + height/2}
      Q ${cx - width/2} ${y} ${cx} ${y}
      Q ${cx + width/2} ${y} ${cx + width/2} ${y + height/2}
      Q ${cx + width/2} ${y + height} ${cx} ${y + height}
      Q ${cx - width/2} ${y + height} ${cx - width/2} ${y + height/2}
      Z
    `;
  }

  if (special === 'axis') {
    // C2 Axis - with dens projection
    const densHeight = 6;
    return `
      M ${cx} ${y - densHeight}
      L ${cx + 4} ${y}
      L ${cx + width/2 - 2} ${y + 2}
      Q ${cx + width/2} ${y + height/2} ${cx + width/2 - 2} ${y + height - 2}
      L ${cx - width/2 + 2} ${y + height - 2}
      Q ${cx - width/2} ${y + height/2} ${cx - width/2 + 2} ${y + 2}
      L ${cx - 4} ${y}
      Z
    `;
  }

  if (special === 'sacrum') {
    // Sacrum - triangular fused segment
    return `
      M ${cx - width/2 + 5} ${y}
      L ${cx + width/2 - 5} ${y}
      Q ${cx + width/2} ${y + 5} ${cx + width/2 - 8} ${y + height * 0.4}
      L ${cx + 8} ${y + height - 5}
      Q ${cx} ${y + height} ${cx - 8} ${y + height - 5}
      L ${cx - width/2 + 8} ${y + height * 0.4}
      Q ${cx - width/2} ${y + 5} ${cx - width/2 + 5} ${y}
      Z
    `;
  }

  if (special === 'coccyx') {
    // Coccyx - small pointed shape
    return `
      M ${cx - width/2} ${y}
      L ${cx + width/2} ${y}
      L ${cx + width/3} ${y + height * 0.6}
      L ${cx} ${y + height}
      L ${cx - width/3} ${y + height * 0.6}
      Z
    `;
  }

  // Standard vertebra shape with transverse processes
  const processWidth = width * 0.3;
  const bodyWidth = width * 0.6;

  return `
    M ${cx - bodyWidth/2} ${y + 2}
    Q ${cx - bodyWidth/2 - 2} ${y} ${cx - bodyWidth/2 - processWidth/2} ${y + height * 0.3}
    L ${cx - bodyWidth/2 - processWidth} ${y + height * 0.4}
    L ${cx - bodyWidth/2 - processWidth} ${y + height * 0.6}
    L ${cx - bodyWidth/2 - processWidth/2} ${y + height * 0.7}
    Q ${cx - bodyWidth/2 - 2} ${y + height} ${cx - bodyWidth/2} ${y + height - 2}
    L ${cx + bodyWidth/2} ${y + height - 2}
    Q ${cx + bodyWidth/2 + 2} ${y + height} ${cx + bodyWidth/2 + processWidth/2} ${y + height * 0.7}
    L ${cx + bodyWidth/2 + processWidth} ${y + height * 0.6}
    L ${cx + bodyWidth/2 + processWidth} ${y + height * 0.4}
    L ${cx + bodyWidth/2 + processWidth/2} ${y + height * 0.3}
    Q ${cx + bodyWidth/2 + 2} ${y} ${cx + bodyWidth/2} ${y + 2}
    Z
  `;
}

// Direction popup component
const DirectionPopup = ({ segment, position, onSelect, onClose, templates }) => {
  const popupRef = useRef(null);
  const isSI = segment?.startsWith('SI-') || segment?.includes('Ilium');
  const directions = isSI
    ? [...STANDARD_DIRECTIONS, ...SI_DIRECTIONS]
    : STANDARD_DIRECTIONS;

  // Get template text
  const getTemplateText = (directionId) => {
    const segmentTemplates = templates?.[segment] || [];
    const template = segmentTemplates.find(t => t.direction === directionId);
    return template?.text_template || `${segment} ${directionId}. `;
  };

  return (
    <div
      ref={popupRef}
      className="absolute z-50 bg-white rounded-lg shadow-xl border border-slate-200 p-2 min-w-[150px]"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateY(-50%)'
      }}
    >
      <div className="text-xs font-semibold text-slate-700 mb-2 px-1 border-b pb-1">
        {segment}
      </div>
      <div className="grid grid-cols-3 gap-1">
        {directions.map((dir) => (
          <button
            key={dir.id}
            onClick={() => {
              onSelect(getTemplateText(dir.id));
              onClose();
            }}
            className="px-2 py-1.5 text-xs font-medium rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
            title={dir.title}
          >
            {dir.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function EnhancedSpineDiagram({
  findings = {},
  onChange,
  onInsertText,
  templates = {},
  showNarrative = true,
  showLegend = true,
  compact = false,
  className = ''
}) {
  const [selectedVertebra, setSelectedVertebra] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [hoveredVertebra, setHoveredVertebra] = useState(null);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // Check if vertebra has findings
  const hasFinding = useCallback((vertebraId) => {
    return Object.values(findings).some(f => f.vertebra === vertebraId);
  }, [findings]);

  // Get findings for vertebra
  const getVertebraFindings = useCallback((vertebraId) => {
    return Object.values(findings).filter(f => f.vertebra === vertebraId);
  }, [findings]);

  // Get dominant finding color for vertebra
  const getFindingColor = useCallback((vertebraId) => {
    const vFindings = getVertebraFindings(vertebraId);
    if (vFindings.length === 0) return null;

    // Priority order
    const priority = ['subluxation', 'fixation', 'restriction', 'tenderness', 'spasm', 'hypermobility'];
    for (const type of priority) {
      if (vFindings.some(f => f.type === type)) {
        return FINDING_COLORS[type];
      }
    }
    return FINDING_COLORS.subluxation;
  }, [getVertebraFindings]);

  // Handle vertebra click
  const handleVertebraClick = useCallback((vertebraId, event) => {
    if (onInsertText) {
      // Text insertion mode - show direction popup
      const rect = event.currentTarget.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect() || { top: 0, left: 0 };

      setPopupPosition({
        top: rect.top - containerRect.top + rect.height / 2,
        left: rect.right - containerRect.left + 10
      });
      setSelectedVertebra(vertebraId);
    } else if (onChange) {
      // Finding toggle mode
      setSelectedVertebra(prev => prev === vertebraId ? null : vertebraId);
    }
  }, [onInsertText, onChange]);

  // Handle direction select
  const handleDirectionSelect = useCallback((text) => {
    if (onInsertText) {
      onInsertText(text);
    }
    setSelectedVertebra(null);
  }, [onInsertText]);

  // Add finding
  const addFinding = useCallback((vertebra, type, side) => {
    if (!onChange) return;

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
  }, [findings, onChange]);

  // Clear all
  const clearAll = useCallback(() => {
    if (onChange) {
      onChange({});
    }
    setSelectedVertebra(null);
  }, [onChange]);

  // Generate narrative
  const narrative = useMemo(() => {
    const findingsList = Object.values(findings);
    if (findingsList.length === 0) return [];

    const grouped = {};
    findingsList.forEach(f => {
      if (!grouped[f.type]) grouped[f.type] = [];
      grouped[f.type].push(f);
    });

    const narratives = [];

    if (grouped.subluxation) {
      const items = grouped.subluxation.map(f =>
        `${f.side !== 'central' ? f.side + ' ' : ''}${f.vertebra}`
      );
      narratives.push(`Subluksasjoner: ${items.join(', ')}`);
    }

    if (grouped.fixation) {
      narratives.push(`Fiksasjoner: ${grouped.fixation.map(f => f.vertebra).join(', ')}`);
    }

    if (grouped.restriction) {
      narratives.push(`Restriksjoner: ${grouped.restriction.map(f => f.vertebra).join(', ')}`);
    }

    if (grouped.tenderness) {
      const items = grouped.tenderness.map(f =>
        `${f.side !== 'central' ? f.side + ' ' : ''}${f.vertebra}`
      );
      narratives.push(`Palpasjonsømhet: ${items.join(', ')}`);
    }

    if (grouped.spasm) {
      narratives.push(`Muskelspasmer: ${grouped.spasm.map(f => f.vertebra).join(', ')}`);
    }

    return narratives;
  }, [findings]);

  const totalFindings = Object.keys(findings).length;
  const viewBoxWidth = 200;
  const viewBoxHeight = 520;

  return (
    <div ref={containerRef} className={`bg-white border border-gray-200 rounded-lg relative ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-white border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">Spinal Vurdering</h3>
          {totalFindings > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              {totalFindings} funn
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Zoom ut"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Zoom inn"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {totalFindings > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800"
            >
              <RotateCcw className="w-3 h-3" />
              Nullstill
            </button>
          )}
        </div>
      </div>

      <div className={compact ? '' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
        {/* SVG Spine Diagram */}
        <div className="p-4 flex justify-center overflow-auto">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            className="transition-transform duration-200"
            style={{
              width: `${180 * zoom}px`,
              height: `${450 * zoom}px`,
              maxHeight: compact ? '350px' : '500px'
            }}
          >
            {/* Background spinal canal */}
            <path
              d="M100,15 Q105,15 105,25 L108,440 Q108,500 100,505 Q92,500 92,440 L95,25 Q95,15 100,15"
              fill="#F3F4F6"
              stroke="#E5E7EB"
              strokeWidth="1"
            />

            {/* Left/Right labels */}
            <text x="25" y="12" className="text-[10px] font-medium fill-gray-400">V</text>
            <text x="170" y="12" className="text-[10px] font-medium fill-gray-400">H</text>

            {/* Render vertebrae by region */}
            {Object.entries(VERTEBRAE).map(([regionKey, region]) => (
              <g key={regionKey}>
                {/* Region label */}
                <text
                  x="5"
                  y={region.segments[0].y + 5}
                  className="text-[8px] font-medium"
                  fill={region.color}
                  opacity="0.7"
                >
                  {region.label[0]}
                </text>

                {region.segments.map((seg) => {
                  const x = 100 - seg.width / 2;
                  const findingColor = getFindingColor(seg.id);
                  const isSelected = selectedVertebra === seg.id;
                  const isHovered = hoveredVertebra === seg.id;

                  return (
                    <g key={seg.id}>
                      {/* Vertebra shape */}
                      <path
                        d={generateVertebraPath(x, seg.y, seg.width, seg.height, seg.special)}
                        fill={findingColor || (isHovered ? region.color : region.lightColor)}
                        stroke={isSelected ? '#1F2937' : region.color}
                        strokeWidth={isSelected ? 2 : 1}
                        className="cursor-pointer transition-all duration-150"
                        onClick={(e) => handleVertebraClick(seg.id, e)}
                        onMouseEnter={() => setHoveredVertebra(seg.id)}
                        onMouseLeave={() => setHoveredVertebra(null)}
                        style={{
                          filter: isHovered ? 'brightness(0.95)' : 'none'
                        }}
                      />

                      {/* Vertebra label */}
                      <text
                        x="100"
                        y={seg.y + seg.height / 2 + 3}
                        textAnchor="middle"
                        className={`text-[7px] font-bold pointer-events-none ${
                          findingColor ? 'fill-white' : 'fill-gray-700'
                        }`}
                      >
                        {seg.id}
                      </text>

                      {/* Finding indicator dots */}
                      {getVertebraFindings(seg.id).length > 1 && (
                        <circle
                          cx={100 + seg.width / 2 + 5}
                          cy={seg.y + seg.height / 2}
                          r="4"
                          fill="#EF4444"
                          className="pointer-events-none"
                        >
                          <title>{getVertebraFindings(seg.id).length} funn</title>
                        </circle>
                      )}
                    </g>
                  );
                })}
              </g>
            ))}

            {/* SI Joints */}
            {PELVIS.siJoints.map((si) => {
              const findingColor = getFindingColor(si.id);
              const isSelected = selectedVertebra === si.id;
              const isHovered = hoveredVertebra === si.id;

              return (
                <g key={si.id}>
                  <ellipse
                    cx={si.x}
                    cy={si.y}
                    rx="12"
                    ry="20"
                    fill={findingColor || (isHovered ? '#EF4444' : '#FEE2E2')}
                    stroke={isSelected ? '#1F2937' : '#EF4444'}
                    strokeWidth={isSelected ? 2 : 1}
                    className="cursor-pointer transition-all"
                    onClick={(e) => handleVertebraClick(si.id, e)}
                    onMouseEnter={() => setHoveredVertebra(si.id)}
                    onMouseLeave={() => setHoveredVertebra(null)}
                  />
                  <text
                    x={si.x}
                    y={si.y + 3}
                    textAnchor="middle"
                    className={`text-[6px] font-bold pointer-events-none ${
                      findingColor ? 'fill-white' : 'fill-red-800'
                    }`}
                  >
                    SI
                  </text>
                </g>
              );
            })}

            {/* Iliums (pelvis outline) */}
            <path
              d="M20,440 Q10,460 15,490 Q25,510 50,505 L85,470"
              fill="none"
              stroke="#FCA5A5"
              strokeWidth="2"
              className="pointer-events-none"
            />
            <path
              d="M180,440 Q190,460 185,490 Q175,510 150,505 L115,470"
              fill="none"
              stroke="#FCA5A5"
              strokeWidth="2"
              className="pointer-events-none"
            />
          </svg>
        </div>

        {/* Finding Selection Panel (when not in text insertion mode) */}
        {!onInsertText && !compact && (
          <div className="p-4 border-l border-gray-200">
            {selectedVertebra ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    Legg til funn: <span className="text-blue-600">{selectedVertebra}</span>
                  </h4>
                  <button
                    onClick={() => setSelectedVertebra(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ×
                  </button>
                </div>

                {/* Finding types grid */}
                <div className="space-y-3">
                  {Object.entries(FINDING_TYPES).map(([key, type]) => (
                    <div key={key}>
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: type.color }}
                        />
                        <span className="text-xs font-medium text-gray-700">{type.labelNo}</span>
                      </div>
                      <div className="flex gap-1">
                        {['left', 'right', 'bilateral', 'central'].map(side => {
                          const isActive = findings[`${selectedVertebra}_${key}_${side}`];
                          return (
                            <button
                              key={side}
                              onClick={() => addFinding(selectedVertebra, key, side)}
                              className={`px-2 py-1 text-xs rounded transition-all ${
                                isActive
                                  ? 'text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                              style={isActive ? { backgroundColor: type.color } : {}}
                            >
                              {side === 'left' ? 'V' : side === 'right' ? 'H' : side === 'bilateral' ? 'B' : 'S'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  Klikk på en vertebra for å legge til funn
                </p>

                {/* Legend */}
                {showLegend && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-500">Fargekoder</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(FINDING_TYPES).map(([key, type]) => (
                        <div key={key} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: type.color }}
                          />
                          <span>{type.labelNo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All findings summary */}
                {totalFindings > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-xs font-medium text-gray-500 mb-2">Alle funn</h5>
                    <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                      {Object.values(findings).map(f => (
                        <span
                          key={`${f.vertebra}_${f.type}_${f.side}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded text-white"
                          style={{ backgroundColor: FINDING_COLORS[f.type] }}
                        >
                          {f.vertebra} {f.side !== 'central' ? f.side[0].toUpperCase() : ''}
                          <button
                            onClick={() => addFinding(f.vertebra, f.type, f.side)}
                            className="hover:opacity-75"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Direction Popup (for text insertion mode) */}
      {selectedVertebra && onInsertText && (
        <DirectionPopup
          segment={selectedVertebra}
          position={popupPosition}
          onSelect={handleDirectionSelect}
          onClose={() => setSelectedVertebra(null)}
          templates={templates}
        />
      )}

      {/* Generated Narrative */}
      {showNarrative && narrative.length > 0 && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-200 rounded-b-lg">
          <label className="block text-xs font-medium text-green-800 mb-2">
            Objektive funn:
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

// Compact version for sidebar
export function CompactSpineDiagram({ findings, onChange, onInsertText, templates }) {
  return (
    <EnhancedSpineDiagram
      findings={findings}
      onChange={onChange}
      onInsertText={onInsertText}
      templates={templates}
      showNarrative={false}
      showLegend={false}
      compact={true}
      className="border-0"
    />
  );
}
