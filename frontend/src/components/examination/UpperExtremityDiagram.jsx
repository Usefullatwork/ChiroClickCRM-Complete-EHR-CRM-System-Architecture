/**
 * UpperExtremityDiagram Component
 *
 * Visual diagram for upper extremity tests showing:
 * - Left and right arms clearly marked
 * - Major nerve paths (median, ulnar, radial)
 * - Dermatome zones (C5-T1)
 * - Click to mark symptom radiation
 */

import React, { useState, useCallback, useRef } from 'react';
import { Trash2 } from 'lucide-react';

// Dermatome colors for upper extremity
const DERMATOME_COLORS = {
  C5: { fill: 'rgba(239, 68, 68, 0.2)', stroke: '#ef4444' },   // Red
  C6: { fill: 'rgba(249, 115, 22, 0.2)', stroke: '#f97316' },  // Orange
  C7: { fill: 'rgba(234, 179, 8, 0.2)', stroke: '#eab308' },   // Yellow
  C8: { fill: 'rgba(34, 197, 94, 0.2)', stroke: '#22c55e' },   // Green
  T1: { fill: 'rgba(59, 130, 246, 0.2)', stroke: '#3b82f6' },  // Blue
};

// Nerve colors
const NERVE_COLORS = {
  median: { stroke: '#fbbf24', label: 'Median', labelNo: 'Medianus' },
  ulnar: { stroke: '#8b5cf6', label: 'Ulnar', labelNo: 'Ulnaris' },
  radial: { stroke: '#10b981', label: 'Radial', labelNo: 'Radialis' },
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
 * SVG Upper Body - Arms anterior view
 */
function ArmsAnterior({ width = 350, height = 300, showDermatomes = true, showNerves = true }) {
  const centerX = width / 2;
  const shoulderY = 40;
  const armLength = 180;

  return (
    <g>
      {/* Neck/Shoulder area */}
      <path
        d={`M ${centerX - 80} ${shoulderY}
            C ${centerX - 60} ${shoulderY - 20}, ${centerX + 60} ${shoulderY - 20}, ${centerX + 80} ${shoulderY}
            L ${centerX + 70} ${shoulderY + 30}
            C ${centerX + 40} ${shoulderY + 40}, ${centerX - 40} ${shoulderY + 40}, ${centerX - 70} ${shoulderY + 30}
            Z`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />

      {/* Cervical spine labels */}
      {['C5', 'C6', 'C7', 'C8', 'T1'].map((level, i) => (
        <text
          key={level}
          x={centerX}
          y={shoulderY - 5 + i * 8}
          fontSize="6"
          fill="#9ca3af"
          textAnchor="middle"
        >
          {level}
        </text>
      ))}

      {/* LEFT ARM */}
      <g id="left-arm">
        {/* Upper arm */}
        <path
          d={`M ${centerX - 70} ${shoulderY + 25}
              C ${centerX - 100} ${shoulderY + 40}, ${centerX - 120} ${shoulderY + 80}, ${centerX - 115} ${shoulderY + 120}
              L ${centerX - 105} ${shoulderY + 120}
              C ${centerX - 110} ${shoulderY + 85}, ${centerX - 90} ${shoulderY + 50}, ${centerX - 65} ${shoulderY + 35}`}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.5"
        />

        {/* Elbow */}
        <ellipse cx={centerX - 110} cy={shoulderY + 130} rx={12} ry={15}
          fill="none" stroke="#d1d5db" strokeWidth="1" />

        {/* Forearm */}
        <path
          d={`M ${centerX - 118} ${shoulderY + 145}
              L ${centerX - 125} ${shoulderY + 220}
              C ${centerX - 127} ${shoulderY + 230}, ${centerX - 100} ${shoulderY + 230}, ${centerX - 98} ${shoulderY + 220}
              L ${centerX - 102} ${shoulderY + 145}`}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.5"
        />

        {/* Hand */}
        <ellipse cx={centerX - 112} cy={shoulderY + 245} rx={15} ry={20}
          fill="none" stroke="#9ca3af" strokeWidth="1.5" />

        {/* Fingers outline */}
        <path
          d={`M ${centerX - 125} ${shoulderY + 250}
              L ${centerX - 130} ${shoulderY + 275}
              M ${centerX - 118} ${shoulderY + 255}
              L ${centerX - 120} ${shoulderY + 285}
              M ${centerX - 112} ${shoulderY + 258}
              L ${centerX - 112} ${shoulderY + 290}
              M ${centerX - 106} ${shoulderY + 255}
              L ${centerX - 104} ${shoulderY + 285}
              M ${centerX - 99} ${shoulderY + 250}
              L ${centerX - 95} ${shoulderY + 270}`}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1"
        />

        {/* Dermatome zones - Left */}
        {showDermatomes && (
          <>
            {/* C5 - Lateral arm */}
            <path
              d={`M ${centerX - 85} ${shoulderY + 40}
                  L ${centerX - 105} ${shoulderY + 80}
                  L ${centerX - 95} ${shoulderY + 100}
                  L ${centerX - 75} ${shoulderY + 60}
                  Z`}
              fill={DERMATOME_COLORS.C5.fill}
              stroke={DERMATOME_COLORS.C5.stroke}
              strokeWidth="0.5"
              strokeDasharray="3,2"
            />
            <text x={centerX - 90} y={shoulderY + 70} fontSize="7" fill={DERMATOME_COLORS.C5.stroke} fontWeight="bold">C5</text>

            {/* C6 - Lateral forearm, thumb */}
            <path
              d={`M ${centerX - 100} ${shoulderY + 150}
                  L ${centerX - 110} ${shoulderY + 200}
                  L ${centerX - 125} ${shoulderY + 260}
                  L ${centerX - 115} ${shoulderY + 200}
                  L ${centerX - 105} ${shoulderY + 150}
                  Z`}
              fill={DERMATOME_COLORS.C6.fill}
              stroke={DERMATOME_COLORS.C6.stroke}
              strokeWidth="0.5"
              strokeDasharray="3,2"
            />
            <text x={centerX - 115} y={shoulderY + 180} fontSize="7" fill={DERMATOME_COLORS.C6.stroke} fontWeight="bold">C6</text>

            {/* C7 - Middle finger */}
            <path
              d={`M ${centerX - 115} ${shoulderY + 250}
                  L ${centerX - 112} ${shoulderY + 290}
                  L ${centerX - 108} ${shoulderY + 250}
                  Z`}
              fill={DERMATOME_COLORS.C7.fill}
              stroke={DERMATOME_COLORS.C7.stroke}
              strokeWidth="0.5"
              strokeDasharray="3,2"
            />
            <text x={centerX - 112} y={shoulderY + 270} fontSize="6" fill={DERMATOME_COLORS.C7.stroke} fontWeight="bold">C7</text>

            {/* C8 - Medial forearm, little finger */}
            <path
              d={`M ${centerX - 115} ${shoulderY + 150}
                  L ${centerX - 120} ${shoulderY + 200}
                  L ${centerX - 100} ${shoulderY + 260}
                  L ${centerX - 108} ${shoulderY + 200}
                  L ${centerX - 112} ${shoulderY + 150}
                  Z`}
              fill={DERMATOME_COLORS.C8.fill}
              stroke={DERMATOME_COLORS.C8.stroke}
              strokeWidth="0.5"
              strokeDasharray="3,2"
            />
            <text x={centerX - 108} y={shoulderY + 190} fontSize="7" fill={DERMATOME_COLORS.C8.stroke} fontWeight="bold">C8</text>
          </>
        )}

        {/* Nerve paths - Left */}
        {showNerves && (
          <>
            {/* Median nerve */}
            <path
              d={`M ${centerX - 75} ${shoulderY + 35}
                  C ${centerX - 95} ${shoulderY + 60}, ${centerX - 108} ${shoulderY + 100}, ${centerX - 110} ${shoulderY + 130}
                  L ${centerX - 112} ${shoulderY + 200}
                  L ${centerX - 112} ${shoulderY + 250}`}
              fill="none"
              stroke={NERVE_COLORS.median.stroke}
              strokeWidth="2.5"
              strokeOpacity="0.6"
              strokeLinecap="round"
            />

            {/* Ulnar nerve */}
            <path
              d={`M ${centerX - 70} ${shoulderY + 40}
                  C ${centerX - 85} ${shoulderY + 70}, ${centerX - 105} ${shoulderY + 110}, ${centerX - 115} ${shoulderY + 130}
                  L ${centerX - 120} ${shoulderY + 200}
                  L ${centerX - 102} ${shoulderY + 260}`}
              fill="none"
              stroke={NERVE_COLORS.ulnar.stroke}
              strokeWidth="2.5"
              strokeOpacity="0.6"
              strokeLinecap="round"
            />

            {/* Radial nerve */}
            <path
              d={`M ${centerX - 75} ${shoulderY + 35}
                  C ${centerX - 100} ${shoulderY + 50}, ${centerX - 115} ${shoulderY + 90}, ${centerX - 108} ${shoulderY + 130}
                  L ${centerX - 105} ${shoulderY + 180}
                  L ${centerX - 125} ${shoulderY + 240}`}
              fill="none"
              stroke={NERVE_COLORS.radial.stroke}
              strokeWidth="2.5"
              strokeOpacity="0.6"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Label */}
        <text x={centerX - 112} y={height - 5} fontSize="10" fill="#6b7280" textAnchor="middle" fontWeight="bold">
          V / L
        </text>
      </g>

      {/* RIGHT ARM - mirrored */}
      <g id="right-arm">
        {/* Upper arm */}
        <path
          d={`M ${centerX + 70} ${shoulderY + 25}
              C ${centerX + 100} ${shoulderY + 40}, ${centerX + 120} ${shoulderY + 80}, ${centerX + 115} ${shoulderY + 120}
              L ${centerX + 105} ${shoulderY + 120}
              C ${centerX + 110} ${shoulderY + 85}, ${centerX + 90} ${shoulderY + 50}, ${centerX + 65} ${shoulderY + 35}`}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.5"
        />

        {/* Elbow */}
        <ellipse cx={centerX + 110} cy={shoulderY + 130} rx={12} ry={15}
          fill="none" stroke="#d1d5db" strokeWidth="1" />

        {/* Forearm */}
        <path
          d={`M ${centerX + 118} ${shoulderY + 145}
              L ${centerX + 125} ${shoulderY + 220}
              C ${centerX + 127} ${shoulderY + 230}, ${centerX + 100} ${shoulderY + 230}, ${centerX + 98} ${shoulderY + 220}
              L ${centerX + 102} ${shoulderY + 145}`}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.5"
        />

        {/* Hand */}
        <ellipse cx={centerX + 112} cy={shoulderY + 245} rx={15} ry={20}
          fill="none" stroke="#9ca3af" strokeWidth="1.5" />

        {/* Fingers outline */}
        <path
          d={`M ${centerX + 125} ${shoulderY + 250}
              L ${centerX + 130} ${shoulderY + 275}
              M ${centerX + 118} ${shoulderY + 255}
              L ${centerX + 120} ${shoulderY + 285}
              M ${centerX + 112} ${shoulderY + 258}
              L ${centerX + 112} ${shoulderY + 290}
              M ${centerX + 106} ${shoulderY + 255}
              L ${centerX + 104} ${shoulderY + 285}
              M ${centerX + 99} ${shoulderY + 250}
              L ${centerX + 95} ${shoulderY + 270}`}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1"
        />

        {/* Dermatome zones - Right (mirrored) */}
        {showDermatomes && (
          <>
            {/* C5 */}
            <path
              d={`M ${centerX + 85} ${shoulderY + 40}
                  L ${centerX + 105} ${shoulderY + 80}
                  L ${centerX + 95} ${shoulderY + 100}
                  L ${centerX + 75} ${shoulderY + 60}
                  Z`}
              fill={DERMATOME_COLORS.C5.fill}
              stroke={DERMATOME_COLORS.C5.stroke}
              strokeWidth="0.5"
              strokeDasharray="3,2"
            />
            <text x={centerX + 90} y={shoulderY + 70} fontSize="7" fill={DERMATOME_COLORS.C5.stroke} fontWeight="bold">C5</text>

            {/* C6 */}
            <path
              d={`M ${centerX + 100} ${shoulderY + 150}
                  L ${centerX + 110} ${shoulderY + 200}
                  L ${centerX + 125} ${shoulderY + 260}
                  L ${centerX + 115} ${shoulderY + 200}
                  L ${centerX + 105} ${shoulderY + 150}
                  Z`}
              fill={DERMATOME_COLORS.C6.fill}
              stroke={DERMATOME_COLORS.C6.stroke}
              strokeWidth="0.5"
              strokeDasharray="3,2"
            />
            <text x={centerX + 115} y={shoulderY + 180} fontSize="7" fill={DERMATOME_COLORS.C6.stroke} fontWeight="bold">C6</text>

            {/* C7 */}
            <path
              d={`M ${centerX + 115} ${shoulderY + 250}
                  L ${centerX + 112} ${shoulderY + 290}
                  L ${centerX + 108} ${shoulderY + 250}
                  Z`}
              fill={DERMATOME_COLORS.C7.fill}
              stroke={DERMATOME_COLORS.C7.stroke}
              strokeWidth="0.5"
              strokeDasharray="3,2"
            />
            <text x={centerX + 112} y={shoulderY + 270} fontSize="6" fill={DERMATOME_COLORS.C7.stroke} fontWeight="bold">C7</text>

            {/* C8 */}
            <path
              d={`M ${centerX + 115} ${shoulderY + 150}
                  L ${centerX + 120} ${shoulderY + 200}
                  L ${centerX + 100} ${shoulderY + 260}
                  L ${centerX + 108} ${shoulderY + 200}
                  L ${centerX + 112} ${shoulderY + 150}
                  Z`}
              fill={DERMATOME_COLORS.C8.fill}
              stroke={DERMATOME_COLORS.C8.stroke}
              strokeWidth="0.5"
              strokeDasharray="3,2"
            />
            <text x={centerX + 108} y={shoulderY + 190} fontSize="7" fill={DERMATOME_COLORS.C8.stroke} fontWeight="bold">C8</text>
          </>
        )}

        {/* Nerve paths - Right */}
        {showNerves && (
          <>
            {/* Median nerve */}
            <path
              d={`M ${centerX + 75} ${shoulderY + 35}
                  C ${centerX + 95} ${shoulderY + 60}, ${centerX + 108} ${shoulderY + 100}, ${centerX + 110} ${shoulderY + 130}
                  L ${centerX + 112} ${shoulderY + 200}
                  L ${centerX + 112} ${shoulderY + 250}`}
              fill="none"
              stroke={NERVE_COLORS.median.stroke}
              strokeWidth="2.5"
              strokeOpacity="0.6"
              strokeLinecap="round"
            />

            {/* Ulnar nerve */}
            <path
              d={`M ${centerX + 70} ${shoulderY + 40}
                  C ${centerX + 85} ${shoulderY + 70}, ${centerX + 105} ${shoulderY + 110}, ${centerX + 115} ${shoulderY + 130}
                  L ${centerX + 120} ${shoulderY + 200}
                  L ${centerX + 102} ${shoulderY + 260}`}
              fill="none"
              stroke={NERVE_COLORS.ulnar.stroke}
              strokeWidth="2.5"
              strokeOpacity="0.6"
              strokeLinecap="round"
            />

            {/* Radial nerve */}
            <path
              d={`M ${centerX + 75} ${shoulderY + 35}
                  C ${centerX + 100} ${shoulderY + 50}, ${centerX + 115} ${shoulderY + 90}, ${centerX + 108} ${shoulderY + 130}
                  L ${centerX + 105} ${shoulderY + 180}
                  L ${centerX + 125} ${shoulderY + 240}`}
              fill="none"
              stroke={NERVE_COLORS.radial.stroke}
              strokeWidth="2.5"
              strokeOpacity="0.6"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Label */}
        <text x={centerX + 112} y={height - 5} fontSize="10" fill="#6b7280" textAnchor="middle" fontWeight="bold">
          H / R
        </text>
      </g>

      {/* Nerve legend */}
      {showNerves && (
        <g transform={`translate(10, 10)`}>
          <rect x="0" y="0" width="80" height="50" fill="white" fillOpacity="0.9" rx="3" />
          {Object.entries(NERVE_COLORS).map(([key, nerve], i) => (
            <g key={key} transform={`translate(5, ${10 + i * 14})`}>
              <line x1="0" y1="0" x2="15" y2="0" stroke={nerve.stroke} strokeWidth="2.5" strokeOpacity="0.6" />
              <text x="20" y="4" fontSize="8" fill="#6b7280">{nerve.label}</text>
            </g>
          ))}
        </g>
      )}
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
 * Main UpperExtremityDiagram component
 */
export default function UpperExtremityDiagram({
  markers = [],
  onChange,
  lang = 'no',
  showDermatomes = true,
  showNerves = true,
  readOnly = false,
  compact = false
}) {
  const [selectedType, setSelectedType] = useState('pain');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const svgRef = useRef(null);

  const width = compact ? 280 : 350;
  const height = compact ? 250 : 300;

  const handleSvgClick = useCallback((e) => {
    if (readOnly) return;

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;

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

  const leftMarkers = markers.filter(m => m.side === 'left' || m.x < width / 2).length;
  const rightMarkers = markers.filter(m => m.side === 'right' || m.x >= width / 2).length;

  return (
    <div className={`flex ${compact ? 'gap-2' : 'gap-4'}`}>
      {/* Controls */}
      <div className={compact ? 'w-28 space-y-2' : 'w-36 space-y-3'}>
        <h4 className="text-xs font-semibold text-gray-600">
          {lang === 'no' ? 'Marker symptomer' : 'Mark symptoms'}
        </h4>

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
          {lang === 'no' ? 'Forfra (Anterior)' : 'Anterior View'}
        </div>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full cursor-crosshair"
          style={{ maxHeight: compact ? '220px' : '300px' }}
          onClick={handleSvgClick}
        >
          <ArmsAnterior
            width={width}
            height={height}
            showDermatomes={showDermatomes}
            showNerves={showNerves}
          />

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

export { MARKER_TYPES, DERMATOME_COLORS, NERVE_COLORS };
