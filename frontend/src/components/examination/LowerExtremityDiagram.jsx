/**
 * LowerExtremityDiagram Component
 *
 * Visual diagram for lower extremity tests showing:
 * - Left and right legs clearly marked
 * - Sciatic nerve path
 * - Dermatome zones (L4, L5, S1)
 * - Click to mark symptom radiation
 * - Test-specific overlays (SLR angle, etc.)
 */

import React, { useState, useCallback, useRef } from 'react';
import { Trash2, RotateCcw } from 'lucide-react';

// Dermatome colors
const DERMATOME_COLORS = {
  L4: { fill: 'rgba(59, 130, 246, 0.2)', stroke: '#3b82f6' },  // Blue
  L5: { fill: 'rgba(16, 185, 129, 0.2)', stroke: '#10b981' },  // Green
  S1: { fill: 'rgba(239, 68, 68, 0.2)', stroke: '#ef4444' },   // Red
  S2: { fill: 'rgba(168, 85, 247, 0.2)', stroke: '#a855f7' },  // Purple
};

// Marker types for symptoms
const MARKER_TYPES = {
  pain: { label: 'Smerte', labelEn: 'Pain', color: '#ef4444', symbol: '●' },
  radiation: { label: 'Utstråling', labelEn: 'Radiation', color: '#f97316', symbol: '→' },
  numbness: { label: 'Nummenhet', labelEn: 'Numbness', color: '#64748b', symbol: '○' },
  tingling: { label: 'Prikking', labelEn: 'Tingling', color: '#8b5cf6', symbol: '∿' },
  weakness: { label: 'Svakhet', labelEn: 'Weakness', color: '#0891b2', symbol: 'W' },
};

/**
 * SVG Lower Body - Posterior view of legs
 */
function LegsPosterior({ width = 300, height = 350, showDermatomes = true, showNerves = true }) {
  const legWidth = 50;
  const legSpacing = 40;
  const leftLegX = width / 2 - legSpacing;
  const rightLegX = width / 2 + legSpacing;

  return (
    <g>
      {/* Pelvis/Hip area */}
      <path
        d={`M ${width/2 - 80} 20
            C ${width/2 - 60} 10, ${width/2 + 60} 10, ${width/2 + 80} 20
            L ${width/2 + 70} 50
            C ${width/2 + 40} 60, ${width/2 - 40} 60, ${width/2 - 70} 50
            Z`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />

      {/* Sacrum */}
      <path
        d={`M ${width/2 - 20} 25 L ${width/2} 55 L ${width/2 + 20} 25`}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1"
      />
      <text x={width/2} y={40} fontSize="8" fill="#9ca3af" textAnchor="middle">SAC</text>

      {/* LEFT LEG */}
      <g id="left-leg">
        {/* Thigh */}
        <path
          d={`M ${leftLegX - legWidth/2} 55
              L ${leftLegX - legWidth/2 + 5} 160
              C ${leftLegX - legWidth/2 + 5} 170, ${leftLegX + legWidth/2 - 5} 170, ${leftLegX + legWidth/2 - 5} 160
              L ${leftLegX + legWidth/2} 55`}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.5"
        />

        {/* Knee */}
        <ellipse cx={leftLegX} cy={175} rx={legWidth/2 - 5} ry={15}
          fill="none" stroke="#d1d5db" strokeWidth="1" />

        {/* Lower leg */}
        <path
          d={`M ${leftLegX - legWidth/2 + 8} 185
              L ${leftLegX - legWidth/2 + 10} 290
              C ${leftLegX - legWidth/2 + 10} 300, ${leftLegX + legWidth/2 - 10} 300, ${leftLegX + legWidth/2 - 10} 290
              L ${leftLegX + legWidth/2 - 8} 185`}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.5"
        />

        {/* Foot */}
        <ellipse cx={leftLegX} cy={315} rx={legWidth/2 - 5} ry={18}
          fill="none" stroke="#9ca3af" strokeWidth="1.5" />

        {/* Dermatome zones - Left */}
        {showDermatomes && (
          <>
            {/* L4 - Medial leg/ankle */}
            <path
              d={`M ${leftLegX + 15} 200
                  L ${leftLegX + 20} 280
                  L ${leftLegX + 10} 310
                  L ${leftLegX - 5} 280
                  L ${leftLegX} 200 Z`}
              fill={DERMATOME_COLORS.L4.fill}
              stroke={DERMATOME_COLORS.L4.stroke}
              strokeWidth="0.5"
              strokeDasharray="3,2"
            />
            <text x={leftLegX + 5} y={250} fontSize="7" fill={DERMATOME_COLORS.L4.stroke} fontWeight="bold">L4</text>

            {/* L5 - Dorsum of foot, lateral leg */}
            <path
              d={`M ${leftLegX - 5} 200
                  L ${leftLegX - 15} 280
                  L ${leftLegX - 5} 320
                  L ${leftLegX + 10} 320
                  L ${leftLegX + 5} 280
                  L ${leftLegX + 5} 200 Z`}
              fill={DERMATOME_COLORS.L5.fill}
              stroke={DERMATOME_COLORS.L5.stroke}
              strokeWidth="0.5"
              strokeDasharray="3,2"
            />
            <text x={leftLegX - 10} y={260} fontSize="7" fill={DERMATOME_COLORS.L5.stroke} fontWeight="bold">L5</text>

            {/* S1 - Lateral foot, posterior leg */}
            <path
              d={`M ${leftLegX - 20} 185
                  L ${leftLegX - 25} 280
                  L ${leftLegX - 15} 330
                  L ${leftLegX + 5} 330
                  L ${leftLegX - 10} 280
                  L ${leftLegX - 15} 185 Z`}
              fill={DERMATOME_COLORS.S1.fill}
              stroke={DERMATOME_COLORS.S1.stroke}
              strokeWidth="0.5"
              strokeDasharray="3,2"
            />
            <text x={leftLegX - 20} y={270} fontSize="7" fill={DERMATOME_COLORS.S1.stroke} fontWeight="bold">S1</text>
          </>
        )}

        {/* Sciatic nerve path - Left */}
        {showNerves && (
          <path
            d={`M ${leftLegX + 5} 45
                C ${leftLegX + 5} 80, ${leftLegX} 120, ${leftLegX - 5} 160
                L ${leftLegX - 5} 175
                C ${leftLegX - 8} 200, ${leftLegX - 10} 250, ${leftLegX - 8} 290`}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="3"
            strokeOpacity="0.6"
            strokeLinecap="round"
          />
        )}

        {/* Label */}
        <text x={leftLegX} y={345} fontSize="10" fill="#6b7280" textAnchor="middle" fontWeight="bold">
          V / L
        </text>
      </g>

      {/* RIGHT LEG */}
      <g id="right-leg">
        {/* Thigh */}
        <path
          d={`M ${rightLegX - legWidth/2} 55
              L ${rightLegX - legWidth/2 + 5} 160
              C ${rightLegX - legWidth/2 + 5} 170, ${rightLegX + legWidth/2 - 5} 170, ${rightLegX + legWidth/2 - 5} 160
              L ${rightLegX + legWidth/2} 55`}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.5"
        />

        {/* Knee */}
        <ellipse cx={rightLegX} cy={175} rx={legWidth/2 - 5} ry={15}
          fill="none" stroke="#d1d5db" strokeWidth="1" />

        {/* Lower leg */}
        <path
          d={`M ${rightLegX - legWidth/2 + 8} 185
              L ${rightLegX - legWidth/2 + 10} 290
              C ${rightLegX - legWidth/2 + 10} 300, ${rightLegX + legWidth/2 - 10} 300, ${rightLegX + legWidth/2 - 10} 290
              L ${rightLegX + legWidth/2 - 8} 185`}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.5"
        />

        {/* Foot */}
        <ellipse cx={rightLegX} cy={315} rx={legWidth/2 - 5} ry={18}
          fill="none" stroke="#9ca3af" strokeWidth="1.5" />

        {/* Dermatome zones - Right */}
        {showDermatomes && (
          <>
            {/* L4 */}
            <path
              d={`M ${rightLegX - 15} 200
                  L ${rightLegX - 20} 280
                  L ${rightLegX - 10} 310
                  L ${rightLegX + 5} 280
                  L ${rightLegX} 200 Z`}
              fill={DERMATOME_COLORS.L4.fill}
              stroke={DERMATOME_COLORS.L4.stroke}
              strokeWidth="0.5"
              strokeDasharray="3,2"
            />
            <text x={rightLegX - 5} y={250} fontSize="7" fill={DERMATOME_COLORS.L4.stroke} fontWeight="bold">L4</text>

            {/* L5 */}
            <path
              d={`M ${rightLegX + 5} 200
                  L ${rightLegX + 15} 280
                  L ${rightLegX + 5} 320
                  L ${rightLegX - 10} 320
                  L ${rightLegX - 5} 280
                  L ${rightLegX - 5} 200 Z`}
              fill={DERMATOME_COLORS.L5.fill}
              stroke={DERMATOME_COLORS.L5.stroke}
              strokeWidth="0.5"
              strokeDasharray="3,2"
            />
            <text x={rightLegX + 10} y={260} fontSize="7" fill={DERMATOME_COLORS.L5.stroke} fontWeight="bold">L5</text>

            {/* S1 */}
            <path
              d={`M ${rightLegX + 20} 185
                  L ${rightLegX + 25} 280
                  L ${rightLegX + 15} 330
                  L ${rightLegX - 5} 330
                  L ${rightLegX + 10} 280
                  L ${rightLegX + 15} 185 Z`}
              fill={DERMATOME_COLORS.S1.fill}
              stroke={DERMATOME_COLORS.S1.stroke}
              strokeWidth="0.5"
              strokeDasharray="3,2"
            />
            <text x={rightLegX + 20} y={270} fontSize="7" fill={DERMATOME_COLORS.S1.stroke} fontWeight="bold">S1</text>
          </>
        )}

        {/* Sciatic nerve path - Right */}
        {showNerves && (
          <path
            d={`M ${rightLegX - 5} 45
                C ${rightLegX - 5} 80, ${rightLegX} 120, ${rightLegX + 5} 160
                L ${rightLegX + 5} 175
                C ${rightLegX + 8} 200, ${rightLegX + 10} 250, ${rightLegX + 8} 290`}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="3"
            strokeOpacity="0.6"
            strokeLinecap="round"
          />
        )}

        {/* Label */}
        <text x={rightLegX} y={345} fontSize="10" fill="#6b7280" textAnchor="middle" fontWeight="bold">
          H / R
        </text>
      </g>

      {/* Nerve legend */}
      {showNerves && (
        <g transform={`translate(${width - 70}, 10)`}>
          <rect x="0" y="0" width="65" height="20" fill="white" fillOpacity="0.9" rx="3" />
          <line x1="5" y1="10" x2="20" y2="10" stroke="#fbbf24" strokeWidth="3" strokeOpacity="0.6" />
          <text x="25" y="14" fontSize="8" fill="#6b7280">N. ischiadicus</text>
        </g>
      )}
    </g>
  );
}

/**
 * SLR Angle visualization - filled wedge/bar style
 */
function SLRAngleOverlay({ side, angle, x, y }) {
  if (!angle || angle <= 0) return null;

  const radius = 50;
  const innerRadius = 15;
  const angleRad = (angle * Math.PI) / 180;

  // Calculate end points for outer arc
  const outerEndX = x + Math.sin(angleRad) * radius;
  const outerEndY = y - Math.cos(angleRad) * radius;

  // Calculate end points for inner arc
  const innerEndX = x + Math.sin(angleRad) * innerRadius;
  const innerEndY = y - Math.cos(angleRad) * innerRadius;

  // Filled wedge path (pie slice / bar shape)
  const largeArc = angle > 180 ? 1 : 0;
  const wedgePath = `
    M ${x} ${y - innerRadius}
    L ${x} ${y - radius}
    A ${radius} ${radius} 0 ${largeArc} 1 ${outerEndX} ${outerEndY}
    L ${innerEndX} ${innerEndY}
    A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x} ${y - innerRadius}
    Z
  `;

  // Color based on angle severity
  const getColor = (ang) => {
    if (ang < 30) return { fill: '#ef4444', stroke: '#dc2626' }; // Red - severe
    if (ang < 45) return { fill: '#f97316', stroke: '#ea580c' }; // Orange - moderate
    if (ang < 60) return { fill: '#eab308', stroke: '#ca8a04' }; // Yellow - mild
    return { fill: '#22c55e', stroke: '#16a34a' }; // Green - normal
  };

  const colors = getColor(angle);

  return (
    <g>
      {/* Reference line (vertical/table) */}
      <line
        x1={x} y1={y} x2={x} y2={y - radius - 5}
        stroke="#9ca3af" strokeWidth="1" strokeDasharray="4,2"
      />

      {/* Filled wedge/bar */}
      <path
        d={wedgePath}
        fill={colors.fill}
        fillOpacity="0.6"
        stroke={colors.stroke}
        strokeWidth="2"
      />

      {/* Leg line indicator */}
      <line
        x1={x} y1={y} x2={outerEndX} y2={outerEndY}
        stroke={colors.stroke} strokeWidth="3" strokeLinecap="round"
      />

      {/* Angle label with background */}
      <g transform={`translate(${x + Math.sin(angleRad / 2) * (radius + 18)}, ${y - Math.cos(angleRad / 2) * (radius + 18)})`}>
        <rect
          x="-14" y="-10"
          width="28" height="18"
          fill="white"
          stroke={colors.stroke}
          strokeWidth="1"
          rx="3"
        />
        <text
          x="0" y="4"
          fontSize="11"
          fontWeight="bold"
          fill={colors.stroke}
          textAnchor="middle"
        >
          {angle}°
        </text>
      </g>
    </g>
  );
}

/**
 * Marker on diagram
 */
function DiagramMarker({ marker, onRemove, selected, onSelect }) {
  const type = MARKER_TYPES[marker.type] || MARKER_TYPES.pain;
  const size = selected ? 12 : 10;

  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(marker.id);
      }}
    >
      <circle
        cx={marker.x}
        cy={marker.y}
        r={size}
        fill={type.color}
        fillOpacity={0.3}
        stroke={type.color}
        strokeWidth={selected ? 2 : 1}
      />
      <text
        x={marker.x}
        y={marker.y + 4}
        fontSize="10"
        fontWeight="bold"
        fill={type.color}
        textAnchor="middle"
      >
        {type.symbol}
      </text>
      {selected && (
        <g onClick={(e) => { e.stopPropagation(); onRemove(marker.id); }}>
          <circle cx={marker.x + 10} cy={marker.y - 10} r={6} fill="#ef4444" />
          <text x={marker.x + 10} y={marker.y - 7} fontSize="8" fill="white" textAnchor="middle">×</text>
        </g>
      )}
    </g>
  );
}

/**
 * Main LowerExtremityDiagram component
 */
export default function LowerExtremityDiagram({
  markers = [],
  onChange,
  lang = 'no',
  slrAngleLeft = null,
  slrAngleRight = null,
  showDermatomes = true,
  showNerves = true,
  readOnly = false,
  compact = false
}) {
  const [selectedType, setSelectedType] = useState('pain');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const svgRef = useRef(null);

  const width = compact ? 220 : 300;
  const height = compact ? 280 : 350;

  const handleSvgClick = useCallback((e) => {
    if (readOnly) return;

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;

    // Determine which leg was clicked
    const side = x < width / 2 ? 'left' : 'right';

    const newMarker = {
      id: `marker_${Date.now()}`,
      type: selectedType,
      x: Math.round(x),
      y: Math.round(y),
      side,
      note: ''
    };

    onChange([...markers, newMarker]);
    setSelectedMarker(null);
  }, [markers, onChange, selectedType, width, height, readOnly]);

  const handleRemoveMarker = useCallback((markerId) => {
    onChange(markers.filter(m => m.id !== markerId));
    setSelectedMarker(null);
  }, [markers, onChange]);

  const handleClearAll = () => {
    onChange([]);
    setSelectedMarker(null);
  };

  // Count markers by side
  const leftMarkers = markers.filter(m => m.side === 'left' || m.x < width / 2).length;
  const rightMarkers = markers.filter(m => m.side === 'right' || m.x >= width / 2).length;

  return (
    <div className={`flex ${compact ? 'gap-2' : 'gap-4'}`}>
      {/* Controls */}
      <div className={compact ? 'w-28 space-y-2' : 'w-36 space-y-3'}>
        <h4 className="text-xs font-semibold text-gray-600">
          {lang === 'no' ? 'Marker symptomer' : 'Mark symptoms'}
        </h4>

        {/* Marker type selector */}
        <div className="space-y-1">
          {Object.entries(MARKER_TYPES).map(([key, type]) => (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              disabled={readOnly}
              className={`w-full text-left px-2 py-1 text-xs rounded flex items-center gap-2
                         ${selectedType === key
                           ? 'bg-gray-100 ring-1 ring-gray-300'
                           : 'hover:bg-gray-50'}`}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px]"
                style={{ backgroundColor: type.color }}
              >
                {type.symbol}
              </span>
              <span className="text-gray-700 truncate">
                {lang === 'no' ? type.label : type.labelEn}
              </span>
            </button>
          ))}
        </div>

        {/* Clear button */}
        {markers.length > 0 && !readOnly && (
          <button
            onClick={handleClearAll}
            className="w-full flex items-center justify-center gap-1 px-2 py-1 text-xs
                      text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            {lang === 'no' ? 'Fjern alle' : 'Clear'}
          </button>
        )}

        {/* Marker counts */}
        {markers.length > 0 && (
          <div className="text-[10px] text-gray-500 space-y-0.5">
            <div>V/L: {leftMarkers} {lang === 'no' ? 'markering' : 'marker'}(s)</div>
            <div>H/R: {rightMarkers} {lang === 'no' ? 'markering' : 'marker'}(s)</div>
          </div>
        )}
      </div>

      {/* Diagram */}
      <div className="flex-1 border border-gray-200 rounded-lg bg-white p-2">
        <div className="text-center text-xs text-gray-400 mb-1">
          {lang === 'no' ? 'Bakfra (Posterior)' : 'Posterior View'}
        </div>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full cursor-crosshair"
          style={{ maxHeight: compact ? '250px' : '350px' }}
          onClick={handleSvgClick}
        >
          <LegsPosterior
            width={width}
            height={height}
            showDermatomes={showDermatomes}
            showNerves={showNerves}
          />

          {/* SLR Angle overlays - positioned at hip level */}
          {slrAngleLeft && (
            <SLRAngleOverlay
              side="left"
              angle={slrAngleLeft}
              x={width / 2 - 40}
              y={55}
            />
          )}
          {slrAngleRight && (
            <SLRAngleOverlay
              side="right"
              angle={slrAngleRight}
              x={width / 2 + 40}
              y={55}
            />
          )}

          {/* Angle labels at bottom */}
          {(slrAngleLeft || slrAngleRight) && (
            <g>
              <rect x={width/2 - 70} y={height - 30} width={140} height={25} fill="white" fillOpacity="0.9" rx="4" stroke="#ef4444" strokeWidth="1" />
              <text x={width/2} y={height - 12} fontSize="11" fill="#ef4444" textAnchor="middle" fontWeight="bold">
                SLR: {slrAngleLeft ? `V ${slrAngleLeft}°` : ''} {slrAngleLeft && slrAngleRight ? ' | ' : ''} {slrAngleRight ? `H ${slrAngleRight}°` : ''}
              </text>
            </g>
          )}

          {/* Markers */}
          {markers.map((marker) => (
            <DiagramMarker
              key={marker.id}
              marker={marker}
              selected={selectedMarker === marker.id}
              onSelect={setSelectedMarker}
              onRemove={handleRemoveMarker}
            />
          ))}
        </svg>
      </div>

      {/* Dermatome legend */}
      {showDermatomes && (
        <div className={compact ? 'w-16' : 'w-20'}>
          <h4 className="text-[10px] font-semibold text-gray-500 mb-2">
            {lang === 'no' ? 'Dermatom' : 'Dermatome'}
          </h4>
          <div className="space-y-1">
            {Object.entries(DERMATOME_COLORS).map(([level, colors]) => (
              <div key={level} className="flex items-center gap-1">
                <span
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: colors.fill, border: `1px solid ${colors.stroke}` }}
                />
                <span className="text-[10px] font-mono text-gray-600">{level}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { MARKER_TYPES, DERMATOME_COLORS };
