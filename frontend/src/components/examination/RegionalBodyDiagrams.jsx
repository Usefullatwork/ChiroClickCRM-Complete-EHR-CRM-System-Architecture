/**
 * RegionalBodyDiagrams Component
 *
 * Collection of regional body diagrams for clinical examination:
 * - Shoulder (anterior/posterior)
 * - Knee (anterior/posterior/lateral)
 * - Cervical spine
 * - Lumbar spine
 * - Hip
 * - Head/TMJ
 * - Ankle, Wrist, Elbow
 *
 * Each diagram supports:
 * - Click to mark findings
 * - Left/Right differentiation
 * - Anatomical landmarks
 *
 * Orchestrator — sub-modules in ./RegionalBodyDiagrams/
 */

import { useState, useCallback, useRef } from 'react';
import { Trash2 } from 'lucide-react';

import { MARKER_TYPES } from './RegionalBodyDiagrams/diagramData';
import {
  ShoulderDiagram,
  KneeDiagram,
  HipDiagram,
  AnkleDiagram,
} from './RegionalBodyDiagrams/JointDiagrams';
import {
  CervicalSpineDiagram,
  LumbarSpineDiagram,
  WristDiagram,
  ElbowDiagram,
  HeadTMJDiagram,
} from './RegionalBodyDiagrams/SpineAndExtremityDiagrams';
import DiagramMarker from './RegionalBodyDiagrams/DiagramMarker';

/**
 * Generic Regional Diagram Wrapper
 */
export default function RegionalBodyDiagram({
  region = 'shoulder',
  markers = [],
  onChange,
  lang = 'no',
  side = 'both',
  readOnly = false,
  compact = false,
}) {
  const [selectedType, setSelectedType] = useState('pain');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const svgRef = useRef(null);

  const configs = {
    shoulder: {
      width: 250,
      height: 200,
      Component: ShoulderDiagram,
      title: 'Skulder',
      titleEn: 'Shoulder',
    },
    knee: { width: 200, height: 250, Component: KneeDiagram, title: 'Kne', titleEn: 'Knee' },
    ankle: { width: 220, height: 200, Component: AnkleDiagram, title: 'Ankel', titleEn: 'Ankle' },
    wrist: {
      width: 220,
      height: 220,
      Component: WristDiagram,
      title: 'Håndledd',
      titleEn: 'Wrist',
    },
    elbow: { width: 200, height: 220, Component: ElbowDiagram, title: 'Albue', titleEn: 'Elbow' },
    cervical: {
      width: 200,
      height: 250,
      Component: CervicalSpineDiagram,
      title: 'Cervikalkolumna',
      titleEn: 'Cervical Spine',
    },
    lumbar: {
      width: 200,
      height: 250,
      Component: LumbarSpineDiagram,
      title: 'Lumbalkolumna',
      titleEn: 'Lumbar Spine',
    },
    hip: { width: 250, height: 220, Component: HipDiagram, title: 'Hofte', titleEn: 'Hip' },
    head: {
      width: 200,
      height: 200,
      Component: HeadTMJDiagram,
      title: 'Hode/TMJ',
      titleEn: 'Head/TMJ',
    },
  };

  const config = configs[region] || configs.shoulder;
  const { width, height, Component, title, titleEn } = config;

  const handleSvgClick = useCallback(
    (e) => {
      if (readOnly) {
        return;
      }
      const svg = svgRef.current;
      if (!svg) {
        return;
      }

      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * width;
      const y = ((e.clientY - rect.top) / rect.height) * height;

      const markerSide = x < width / 2 ? 'left' : 'right';

      onChange([
        ...markers,
        {
          id: `marker_${Date.now()}`,
          type: selectedType,
          x: Math.round(x),
          y: Math.round(y),
          side: markerSide,
          region,
        },
      ]);
      setSelectedMarker(null);
    },
    [markers, onChange, selectedType, width, height, readOnly, region]
  );

  const handleRemoveMarker = useCallback(
    (markerId) => {
      onChange(markers.filter((m) => m.id !== markerId));
      setSelectedMarker(null);
    },
    [markers, onChange]
  );

  return (
    <div className={`flex ${compact ? 'gap-2' : 'gap-4 flex-col md:flex-row'}`}>
      {/* Controls */}
      <div className={compact ? 'w-24 space-y-2' : 'w-full md:w-40 space-y-3'}>
        <h4 className={`font-semibold text-gray-700 ${compact ? 'text-xs' : 'text-sm'}`}>
          {lang === 'no' ? title : titleEn}
        </h4>

        <div className="space-y-1">
          {Object.entries(MARKER_TYPES).map(([key, type]) => (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              disabled={readOnly}
              className={`w-full text-left px-2 py-1 text-xs rounded flex items-center gap-2
                         ${selectedType === key ? 'bg-gray-100 ring-1 ring-gray-300' : 'hover:bg-gray-50'}`}
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
            onClick={() => {
              onChange([]);
              setSelectedMarker(null);
            }}
            className="w-full flex items-center justify-center gap-1 px-2 py-1 text-xs
                      text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            {lang === 'no' ? 'Fjern' : 'Clear'}
          </button>
        )}
      </div>

      {/* Diagram */}
      <div className="flex-1 border border-gray-200 rounded-lg bg-white p-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full cursor-crosshair"
          style={{ maxHeight: compact ? '180px' : '400px', minHeight: compact ? '150px' : '280px' }}
          onClick={handleSvgClick}
        >
          <Component width={width} height={height} side={side} />
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
    </div>
  );
}

export {
  ShoulderDiagram,
  KneeDiagram,
  AnkleDiagram,
  WristDiagram,
  ElbowDiagram,
  CervicalSpineDiagram,
  LumbarSpineDiagram,
  HipDiagram,
  HeadTMJDiagram,
  MARKER_TYPES,
};
