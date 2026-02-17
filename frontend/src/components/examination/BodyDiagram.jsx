/**
 * BodyDiagram Component
 *
 * Interactive body diagram for marking:
 * - Pain locations with VAS intensity
 * - Trigger points (TP)
 * - Ligament tenderness (LG)
 * - Tendon issues (TN)
 * - Skin changes (SK)
 * - Fascial restrictions (FS)
 * - Dermatome patterns
 * - Referred pain patterns
 */

import { useState, useCallback, useRef } from 'react';
import { X, Trash2, ZoomIn, ZoomOut } from 'lucide-react';

// Marker types with colors - expanded for better clinical documentation
const MARKER_TYPES = {
  pain: { label: 'Smerte', labelEn: 'Pain', color: '#ef4444', symbol: '●', category: 'pain' },
  sharp_pain: {
    label: 'Skarp smerte',
    labelEn: 'Sharp Pain',
    color: '#dc2626',
    symbol: '✦',
    category: 'pain',
  },
  dull_pain: {
    label: 'Dump smerte',
    labelEn: 'Dull Pain',
    color: '#f87171',
    symbol: '◆',
    category: 'pain',
  },
  burning: {
    label: 'Brennende',
    labelEn: 'Burning',
    color: '#ea580c',
    symbol: '🔥',
    category: 'pain',
  },
  tp: {
    label: 'Triggerpunkt (TP)',
    labelEn: 'Trigger Point',
    color: '#f97316',
    symbol: 'TP',
    category: 'tissue',
  },
  tp_active: {
    label: 'Aktiv TP',
    labelEn: 'Active TP',
    color: '#c2410c',
    symbol: 'TA',
    category: 'tissue',
  },
  tp_latent: {
    label: 'Latent TP',
    labelEn: 'Latent TP',
    color: '#fb923c',
    symbol: 'TL',
    category: 'tissue',
  },
  lg: {
    label: 'Ligament (LG)',
    labelEn: 'Ligament',
    color: '#eab308',
    symbol: 'LG',
    category: 'tissue',
  },
  tn: { label: 'Sene (TN)', labelEn: 'Tendon', color: '#22c55e', symbol: 'TN', category: 'tissue' },
  tendinopathy: {
    label: 'Tendinopati',
    labelEn: 'Tendinopathy',
    color: '#16a34a',
    symbol: 'TD',
    category: 'tissue',
  },
  sk: { label: 'Hud (SK)', labelEn: 'Skin', color: '#3b82f6', symbol: 'SK', category: 'tissue' },
  fs: {
    label: 'Fascial (FS)',
    labelEn: 'Fascial',
    color: '#8b5cf6',
    symbol: 'FS',
    category: 'tissue',
  },
  adhesion: {
    label: 'Adhesjon',
    labelEn: 'Adhesion',
    color: '#7c3aed',
    symbol: 'AD',
    category: 'tissue',
  },
  numbness: {
    label: 'Nummenhet',
    labelEn: 'Numbness',
    color: '#64748b',
    symbol: '○',
    category: 'neuro',
  },
  tingling: {
    label: 'Prikking',
    labelEn: 'Tingling',
    color: '#475569',
    symbol: '∿',
    category: 'neuro',
  },
  weakness: {
    label: 'Svakhet',
    labelEn: 'Weakness',
    color: '#334155',
    symbol: 'W',
    category: 'neuro',
  },
  radiation: {
    label: 'Utstråling',
    labelEn: 'Radiation',
    color: '#ec4899',
    symbol: '→',
    category: 'referral',
  },
  referred: {
    label: 'Referert smerte',
    labelEn: 'Referred Pain',
    color: '#db2777',
    symbol: 'R',
    category: 'referral',
  },
  spasm: { label: 'Spasme', labelEn: 'Spasm', color: '#0891b2', symbol: 'SP', category: 'muscle' },
  hypertonicity: {
    label: 'Hypertonus',
    labelEn: 'Hypertonicity',
    color: '#0e7490',
    symbol: 'HT',
    category: 'muscle',
  },
  atrophy: {
    label: 'Atrofi',
    labelEn: 'Atrophy',
    color: '#155e75',
    symbol: 'AT',
    category: 'muscle',
  },
  swelling: {
    label: 'Hevelse',
    labelEn: 'Swelling',
    color: '#0284c7',
    symbol: 'SW',
    category: 'other',
  },
  warmth: { label: 'Varme', labelEn: 'Warmth', color: '#f59e0b', symbol: '☀', category: 'other' },
  crepitus: {
    label: 'Krepitasjon',
    labelEn: 'Crepitus',
    color: '#71717a',
    symbol: 'CR',
    category: 'other',
  },
};

// Marker categories for organized selection
const MARKER_CATEGORIES = {
  pain: { label: 'Smerte', labelEn: 'Pain' },
  tissue: { label: 'Vev', labelEn: 'Tissue' },
  neuro: { label: 'Nevrologisk', labelEn: 'Neurological' },
  muscle: { label: 'Muskel', labelEn: 'Muscle' },
  referral: { label: 'Referert', labelEn: 'Referral' },
  other: { label: 'Annet', labelEn: 'Other' },
};

// Body regions for quick selection
const _BODY_REGIONS = {
  head: { x: 50, y: 5, label: 'Hode' },
  neck: { x: 50, y: 12, label: 'Nakke' },
  shoulder_r: { x: 30, y: 18, label: 'Skulder H' },
  shoulder_l: { x: 70, y: 18, label: 'Skulder V' },
  upper_back: { x: 50, y: 25, label: 'Øvre rygg' },
  mid_back: { x: 50, y: 35, label: 'Midtre rygg' },
  lower_back: { x: 50, y: 45, label: 'Korsrygg' },
  hip_r: { x: 35, y: 52, label: 'Hofte H' },
  hip_l: { x: 65, y: 52, label: 'Hofte V' },
  knee_r: { x: 40, y: 72, label: 'Kne H' },
  knee_l: { x: 60, y: 72, label: 'Kne V' },
  ankle_r: { x: 42, y: 92, label: 'Ankel H' },
  ankle_l: { x: 58, y: 92, label: 'Ankel V' },
};

/**
 * SVG Body outline - Posterior view
 */
function BodyOutlinePosterior({ width = 200, _height = 400 }) {
  return (
    <g>
      {/* Head */}
      <ellipse
        cx={width / 2}
        cy={30}
        rx={25}
        ry={30}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />

      {/* Neck */}
      <rect
        x={width / 2 - 12}
        y={55}
        width={24}
        height={20}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
        rx="5"
      />

      {/* Torso */}
      <path
        d={`M ${width / 2 - 45} 75
            C ${width / 2 - 50} 90, ${width / 2 - 50} 150, ${width / 2 - 35} 190
            L ${width / 2 - 25} 210
            L ${width / 2 + 25} 210
            L ${width / 2 + 35} 190
            C ${width / 2 + 50} 150, ${width / 2 + 50} 90, ${width / 2 + 45} 75
            Z`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />

      {/* Spine line */}
      <line
        x1={width / 2}
        y1={75}
        x2={width / 2}
        y2={200}
        stroke="#d1d5db"
        strokeWidth="1"
        strokeDasharray="4,2"
      />

      {/* Spine segments */}
      {[...Array(7)].map((_, i) => (
        <g key={`c${i}`}>
          <rect
            x={width / 2 - 8}
            y={78 + i * 8}
            width={16}
            height={6}
            fill="none"
            stroke="#d1d5db"
            strokeWidth="0.5"
            rx="2"
          />
          <text x={width / 2 - 18} y={84 + i * 8} fontSize="6" fill="#9ca3af">
            C{i + 1}
          </text>
        </g>
      ))}
      {[...Array(12)].map((_, i) => (
        <g key={`t${i}`}>
          <rect
            x={width / 2 - 8}
            y={134 + i * 5}
            width={16}
            height={4}
            fill="none"
            stroke="#d1d5db"
            strokeWidth="0.5"
            rx="1"
          />
          <text x={width / 2 + 12} y={138 + i * 5} fontSize="5" fill="#9ca3af">
            T{i + 1}
          </text>
        </g>
      ))}

      {/* Left Arm */}
      <path
        d={`M ${width / 2 - 45} 80
            C ${width / 2 - 70} 90, ${width / 2 - 80} 120, ${width / 2 - 75} 180
            L ${width / 2 - 70} 180
            C ${width / 2 - 75} 130, ${width / 2 - 60} 100, ${width / 2 - 45} 85`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />

      {/* Right Arm */}
      <path
        d={`M ${width / 2 + 45} 80
            C ${width / 2 + 70} 90, ${width / 2 + 80} 120, ${width / 2 + 75} 180
            L ${width / 2 + 70} 180
            C ${width / 2 + 75} 130, ${width / 2 + 60} 100, ${width / 2 + 45} 85`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />

      {/* Left Leg */}
      <path
        d={`M ${width / 2 - 25} 210
            L ${width / 2 - 30} 300
            C ${width / 2 - 32} 340, ${width / 2 - 28} 370, ${width / 2 - 30} 390
            L ${width / 2 - 20} 390
            C ${width / 2 - 18} 370, ${width / 2 - 22} 340, ${width / 2 - 20} 300
            L ${width / 2 - 15} 210`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />

      {/* Right Leg */}
      <path
        d={`M ${width / 2 + 25} 210
            L ${width / 2 + 30} 300
            C ${width / 2 + 32} 340, ${width / 2 + 28} 370, ${width / 2 + 30} 390
            L ${width / 2 + 20} 390
            C ${width / 2 + 18} 370, ${width / 2 + 22} 340, ${width / 2 + 20} 300
            L ${width / 2 + 15} 210`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />

      {/* Lumbar spine */}
      {[...Array(5)].map((_, i) => (
        <g key={`l${i}`}>
          <rect
            x={width / 2 - 10}
            y={195 - i * 6}
            width={20}
            height={5}
            fill="none"
            stroke="#d1d5db"
            strokeWidth="0.5"
            rx="2"
          />
          <text x={width / 2 - 22} y={199 - i * 6} fontSize="6" fill="#9ca3af">
            L{5 - i}
          </text>
        </g>
      ))}

      {/* Sacrum */}
      <path
        d={`M ${width / 2 - 15} 198 L ${width / 2} 215 L ${width / 2 + 15} 198`}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="0.5"
      />
      <text x={width / 2 - 22} y={210} fontSize="6" fill="#9ca3af">
        SAC
      </text>
    </g>
  );
}

/**
 * SVG Body outline - Anterior view
 */
function BodyOutlineAnterior({ width = 200, _height = 400 }) {
  return (
    <g>
      {/* Head */}
      <ellipse
        cx={width / 2}
        cy={30}
        rx={25}
        ry={30}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      {/* Face features */}
      <ellipse
        cx={width / 2 - 8}
        cy={25}
        rx={3}
        ry={2}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="0.5"
      />
      <ellipse
        cx={width / 2 + 8}
        cy={25}
        rx={3}
        ry={2}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="0.5"
      />
      <path
        d={`M ${width / 2 - 4} 35 Q ${width / 2} 38, ${width / 2 + 4} 35`}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="0.5"
      />

      {/* Neck */}
      <rect
        x={width / 2 - 12}
        y={55}
        width={24}
        height={20}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
        rx="5"
      />

      {/* Torso - front view with chest/abdomen */}
      <path
        d={`M ${width / 2 - 45} 75
            C ${width / 2 - 50} 90, ${width / 2 - 50} 150, ${width / 2 - 35} 190
            L ${width / 2 - 25} 210
            L ${width / 2 + 25} 210
            L ${width / 2 + 35} 190
            C ${width / 2 + 50} 150, ${width / 2 + 50} 90, ${width / 2 + 45} 75
            Z`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />

      {/* Clavicles */}
      <path
        d={`M ${width / 2 - 10} 78 L ${width / 2 - 40} 85`}
        stroke="#d1d5db"
        strokeWidth="0.5"
      />
      <path
        d={`M ${width / 2 + 10} 78 L ${width / 2 + 40} 85`}
        stroke="#d1d5db"
        strokeWidth="0.5"
      />

      {/* Sternum */}
      <line x1={width / 2} y1={78} x2={width / 2} y2={130} stroke="#d1d5db" strokeWidth="1" />

      {/* Ribs (front) */}
      {[...Array(6)].map((_, i) => (
        <g key={`rib${i}`}>
          <path
            d={`M ${width / 2 - 5} ${90 + i * 8} Q ${width / 2 - 25} ${95 + i * 8}, ${width / 2 - 40} ${88 + i * 8}`}
            fill="none"
            stroke="#d1d5db"
            strokeWidth="0.5"
          />
          <path
            d={`M ${width / 2 + 5} ${90 + i * 8} Q ${width / 2 + 25} ${95 + i * 8}, ${width / 2 + 40} ${88 + i * 8}`}
            fill="none"
            stroke="#d1d5db"
            strokeWidth="0.5"
          />
        </g>
      ))}

      {/* Umbilicus */}
      <circle cx={width / 2} cy={165} r={3} fill="none" stroke="#d1d5db" strokeWidth="0.5" />

      {/* Left Arm */}
      <path
        d={`M ${width / 2 - 45} 80
            C ${width / 2 - 70} 90, ${width / 2 - 80} 120, ${width / 2 - 75} 180
            L ${width / 2 - 70} 180
            C ${width / 2 - 75} 130, ${width / 2 - 60} 100, ${width / 2 - 45} 85`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      {/* Left hand */}
      <ellipse
        cx={width / 2 - 72}
        cy={190}
        rx={8}
        ry={12}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1"
      />

      {/* Right Arm */}
      <path
        d={`M ${width / 2 + 45} 80
            C ${width / 2 + 70} 90, ${width / 2 + 80} 120, ${width / 2 + 75} 180
            L ${width / 2 + 70} 180
            C ${width / 2 + 75} 130, ${width / 2 + 60} 100, ${width / 2 + 45} 85`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      {/* Right hand */}
      <ellipse
        cx={width / 2 + 72}
        cy={190}
        rx={8}
        ry={12}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1"
      />

      {/* Left Leg */}
      <path
        d={`M ${width / 2 - 25} 210
            L ${width / 2 - 30} 300
            C ${width / 2 - 32} 340, ${width / 2 - 28} 370, ${width / 2 - 30} 390
            L ${width / 2 - 20} 390
            C ${width / 2 - 18} 370, ${width / 2 - 22} 340, ${width / 2 - 20} 300
            L ${width / 2 - 15} 210`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      {/* Left knee */}
      <ellipse
        cx={width / 2 - 25}
        cy={290}
        rx={8}
        ry={10}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="0.5"
      />

      {/* Right Leg */}
      <path
        d={`M ${width / 2 + 25} 210
            L ${width / 2 + 30} 300
            C ${width / 2 + 32} 340, ${width / 2 + 28} 370, ${width / 2 + 30} 390
            L ${width / 2 + 20} 390
            C ${width / 2 + 18} 370, ${width / 2 + 22} 340, ${width / 2 + 20} 300
            L ${width / 2 + 15} 210`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      {/* Right knee */}
      <ellipse
        cx={width / 2 + 25}
        cy={290}
        rx={8}
        ry={10}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="0.5"
      />

      {/* Labels */}
      <text x={width / 2 - 35} y={100} fontSize="5" fill="#9ca3af">
        Skulder V
      </text>
      <text x={width / 2 + 20} y={100} fontSize="5" fill="#9ca3af">
        Skulder H
      </text>
    </g>
  );
}

/**
 * Marker component with VAS intensity display
 */
function Marker({ marker, onRemove, selected, onSelect }) {
  const type = MARKER_TYPES[marker.type];
  // Size scales with VAS intensity for pain markers (1-10 => 8-14)
  const baseSize = marker.vas ? 6 + marker.vas * 0.8 : 10;
  const size = selected ? baseSize + 2 : baseSize;

  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(marker.id);
      }}
    >
      {/* Outer ring */}
      <circle
        cx={marker.x}
        cy={marker.y}
        r={size}
        fill={type.color}
        fillOpacity={marker.vas ? 0.2 + marker.vas / 20 : 0.3}
        stroke={type.color}
        strokeWidth={selected ? 2 : 1}
      />
      {/* Symbol */}
      <text
        x={marker.x}
        y={marker.y + 3}
        fontSize={marker.vas && marker.vas > 7 ? '9' : '8'}
        fontWeight="bold"
        fill={type.color}
        textAnchor="middle"
      >
        {type.symbol}
      </text>
      {/* VAS number for pain markers */}
      {marker.vas && (
        <g>
          <circle cx={marker.x + size - 2} cy={marker.y - size + 2} r={5} fill={type.color} />
          <text
            x={marker.x + size - 2}
            y={marker.y - size + 5}
            fontSize="6"
            fontWeight="bold"
            fill="white"
            textAnchor="middle"
          >
            {marker.vas}
          </text>
        </g>
      )}
      {/* Delete button when selected */}
      {selected && (
        <g
          onClick={(e) => {
            e.stopPropagation();
            onRemove(marker.id);
          }}
        >
          <circle cx={marker.x + size + 4} cy={marker.y - size - 4} r={6} fill="#ef4444" />
          <X
            x={marker.x + size}
            y={marker.y - size - 8}
            width={8}
            height={8}
            stroke="white"
            strokeWidth={2}
          />
        </g>
      )}
    </g>
  );
}

/**
 * Main BodyDiagram component
 */
export default function BodyDiagram({
  markers = [],
  onChange,
  lang = 'no',
  view: initialView = 'posterior',
  readOnly = false,
}) {
  const [selectedType, setSelectedType] = useState('pain');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('pain');
  const [zoom, setZoom] = useState(1);
  const [currentView, setCurrentView] = useState(initialView);
  const [vasIntensity, setVasIntensity] = useState(5);
  const svgRef = useRef(null);

  const width = 200;
  const height = 400;

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
      const x = (((e.clientX - rect.left) / rect.width) * width) / zoom;
      const y = (((e.clientY - rect.top) / rect.height) * height) / zoom;

      const newMarker = {
        id: `marker_${Date.now()}`,
        type: selectedType,
        x: Math.round(x),
        y: Math.round(y),
        view: currentView,
        vas: MARKER_TYPES[selectedType].category === 'pain' ? vasIntensity : null,
        note: '',
      };

      onChange([...markers, newMarker]);
      setSelectedMarker(null);
    },
    [markers, onChange, selectedType, zoom, readOnly, width, height, currentView, vasIntensity]
  );

  const handleRemoveMarker = useCallback(
    (markerId) => {
      onChange(markers.filter((m) => m.id !== markerId));
      setSelectedMarker(null);
    },
    [markers, onChange]
  );

  const handleClearAll = () => {
    onChange([]);
    setSelectedMarker(null);
  };

  // Generate text summary of markers
  const generateSummary = useCallback(() => {
    const grouped = {};
    markers.forEach((marker) => {
      const type = MARKER_TYPES[marker.type];
      const label = lang === 'no' ? type.label : type.labelEn;
      if (!grouped[label]) {
        grouped[label] = [];
      }
      grouped[label].push(marker);
    });

    return Object.entries(grouped)
      .map(([type, items]) => `${type}: ${items.length} markering(er)`)
      .join('. ');
  }, [markers, lang]);

  // Filter markers for current view
  const viewMarkers = markers.filter((m) => !m.view || m.view === currentView);

  // Get markers by category
  const categoryMarkers = Object.entries(MARKER_TYPES).filter(
    ([_, type]) => type.category === selectedCategory
  );

  return (
    <div className="flex gap-4">
      {/* Controls */}
      <div className="w-44 space-y-3">
        {/* View Toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setCurrentView('posterior')}
            disabled={readOnly}
            className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors
                       ${
                         currentView === 'posterior'
                           ? 'bg-teal-600 text-white'
                           : 'bg-white text-gray-600 hover:bg-gray-50'
                       }`}
          >
            {lang === 'no' ? 'Bakfra' : 'Posterior'}
          </button>
          <button
            onClick={() => setCurrentView('anterior')}
            disabled={readOnly}
            className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors
                       ${
                         currentView === 'anterior'
                           ? 'bg-teal-600 text-white'
                           : 'bg-white text-gray-600 hover:bg-gray-50'
                       }`}
          >
            {lang === 'no' ? 'Forfra' : 'Anterior'}
          </button>
        </div>

        {/* Category Tabs */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {lang === 'no' ? 'Kategori' : 'Category'}
          </h3>
          <div className="flex flex-wrap gap-1">
            {Object.entries(MARKER_CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                disabled={readOnly}
                className={`px-2 py-1 text-xs rounded-full transition-colors
                           ${
                             selectedCategory === key
                               ? 'bg-teal-100 text-teal-700 font-medium'
                               : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                           }`}
              >
                {lang === 'no' ? cat.label : cat.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Marker Types for selected category */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {lang === 'no' ? 'Markeringstype' : 'Marker Type'}
          </h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {categoryMarkers.map(([key, type]) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                disabled={readOnly}
                className={`w-full text-left px-2 py-1.5 text-xs rounded-md flex items-center gap-2
                           transition-colors ${
                             selectedType === key
                               ? 'bg-gray-100 ring-1 ring-gray-300'
                               : 'hover:bg-gray-50'
                           }`}
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                  style={{ backgroundColor: type.color }}
                >
                  {type.symbol.length <= 2 ? type.symbol : type.symbol[0]}
                </span>
                <span className="text-gray-700 truncate">
                  {lang === 'no' ? type.label : type.labelEn}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* VAS Scale for pain markers */}
        {MARKER_TYPES[selectedType]?.category === 'pain' && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              VAS {lang === 'no' ? 'Intensitet' : 'Intensity'}: {vasIntensity}/10
            </h3>
            <input
              type="range"
              min="1"
              max="10"
              value={vasIntensity}
              onChange={(e) => setVasIntensity(parseInt(e.target.value))}
              disabled={readOnly}
              className="w-full h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>{lang === 'no' ? 'Mild' : 'Mild'}</span>
              <span>{lang === 'no' ? 'Moderat' : 'Moderate'}</span>
              <span>{lang === 'no' ? 'Alvorlig' : 'Severe'}</span>
            </div>
          </div>
        )}

        <div className="border-t pt-3 space-y-2">
          <div className="flex gap-1">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
              className="flex-1 p-1.5 text-gray-600 hover:bg-gray-100 rounded"
              title="Zoom inn"
            >
              <ZoomIn className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
              className="flex-1 p-1.5 text-gray-600 hover:bg-gray-100 rounded"
              title="Zoom ut"
            >
              <ZoomOut className="w-4 h-4 mx-auto" />
            </button>
          </div>

          <button
            onClick={handleClearAll}
            disabled={readOnly || markers.length === 0}
            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs
                      text-red-600 hover:bg-red-50 rounded-md transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3 h-3" />
            {lang === 'no' ? 'Fjern alle' : 'Clear all'}
          </button>
        </div>

        {/* Marker count */}
        {markers.length > 0 && (
          <div className="text-xs text-gray-500 border-t pt-2">
            {markers.length} {lang === 'no' ? 'markering(er)' : 'marker(s)'}
          </div>
        )}
      </div>

      {/* Body diagram SVG */}
      <div className="flex-1 border border-gray-200 rounded-lg bg-white p-2">
        <div className="text-center text-xs text-gray-400 mb-1">
          {currentView === 'posterior'
            ? lang === 'no'
              ? 'Bakfra'
              : 'Posterior'
            : lang === 'no'
              ? 'Forfra'
              : 'Anterior'}
          <span className="ml-2 text-gray-300">
            ({viewMarkers.length} {lang === 'no' ? 'markering(er)' : 'marker(s)'})
          </span>
        </div>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full cursor-crosshair"
          style={{ maxHeight: '500px', transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          onClick={handleSvgClick}
        >
          {currentView === 'posterior' ? (
            <BodyOutlinePosterior width={width} height={height} />
          ) : (
            <BodyOutlineAnterior width={width} height={height} />
          )}

          {/* Markers for current view */}
          {viewMarkers.map((marker) => (
            <Marker
              key={marker.id}
              marker={marker}
              selected={selectedMarker === marker.id}
              onSelect={setSelectedMarker}
              onRemove={handleRemoveMarker}
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="w-40 text-xs text-gray-500">
        <h4 className="font-medium text-gray-700 mb-2">{lang === 'no' ? 'Legende' : 'Legend'}</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {Object.entries(MARKER_CATEGORIES).map(([catKey, cat]) => {
            const catTypes = Object.entries(MARKER_TYPES).filter(([_, t]) => t.category === catKey);
            const hasMarkers = markers.some((m) => MARKER_TYPES[m.type]?.category === catKey);
            if (catTypes.length === 0) {
              return null;
            }
            return (
              <div key={catKey} className={hasMarkers ? 'opacity-100' : 'opacity-50'}>
                <div className="font-medium text-gray-600 text-[10px] uppercase tracking-wide">
                  {lang === 'no' ? cat.label : cat.labelEn}
                </div>
                <ul className="space-y-0.5 ml-1">
                  {catTypes.slice(0, 4).map(([key, type]) => (
                    <li key={key} className="flex items-center gap-1">
                      <span
                        className="w-3 h-3 rounded-full flex items-center justify-center text-white text-[7px] font-bold"
                        style={{ backgroundColor: type.color }}
                      >
                        {type.symbol.length <= 2 ? type.symbol : ''}
                      </span>
                      <span className="truncate">{lang === 'no' ? type.label : type.labelEn}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {markers.length > 0 && (
          <div className="mt-3 pt-2 border-t">
            <h4 className="font-medium text-gray-700 mb-1">
              {lang === 'no' ? 'Sammendrag' : 'Summary'}
            </h4>
            <p className="text-gray-600 text-[10px] leading-relaxed">{generateSummary()}</p>

            {/* VAS Summary for pain markers */}
            {markers.filter((m) => m.vas).length > 0 && (
              <div className="mt-2 pt-1 border-t border-dashed">
                <span className="font-medium">VAS: </span>
                {(() => {
                  const painMarkers = markers.filter((m) => m.vas);
                  const avgVas =
                    painMarkers.reduce((sum, m) => sum + m.vas, 0) / painMarkers.length;
                  const maxVas = Math.max(...painMarkers.map((m) => m.vas));
                  return (
                    <span>
                      {lang === 'no' ? 'Gj.snitt' : 'Avg'}: {avgVas.toFixed(1)}, Max: {maxVas}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
