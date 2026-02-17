/**
 * Body Chart Component
 * Interactive visual body diagram for pain/symptom documentation
 * Allows clicking/drawing to mark pain locations and patterns
 */

import _React, { useState, _useRef, useCallback, useEffect } from 'react';

// Body region definitions with SVG path coordinates
const BODY_REGIONS = {
  anterior: {
    head: {
      label: 'Hode',
      path: 'M150,20 C180,20 200,50 200,80 C200,110 180,130 150,130 C120,130 100,110 100,80 C100,50 120,20 150,20',
    },
    neck: { label: 'Nakke', path: 'M135,130 L165,130 L170,160 L130,160 Z' },
    rightShoulder: { label: 'Høyre skulder', path: 'M170,160 L220,180 L210,210 L165,195 Z' },
    leftShoulder: { label: 'Venstre skulder', path: 'M130,160 L80,180 L90,210 L135,195 Z' },
    chest: { label: 'Bryst', path: 'M130,160 L170,160 L180,250 L120,250 Z' },
    rightArm: { label: 'Høyre arm', path: 'M210,210 L240,320 L225,325 L200,220 Z' },
    leftArm: { label: 'Venstre arm', path: 'M90,210 L60,320 L75,325 L100,220 Z' },
    rightHand: { label: 'Høyre hånd', path: 'M240,320 L250,370 L230,370 L225,325 Z' },
    leftHand: { label: 'Venstre hånd', path: 'M60,320 L50,370 L70,370 L75,325 Z' },
    abdomen: { label: 'Mage', path: 'M120,250 L180,250 L185,350 L115,350 Z' },
    pelvis: { label: 'Bekken', path: 'M115,350 L185,350 L190,400 L110,400 Z' },
    rightThigh: { label: 'Høyre lår', path: 'M150,400 L190,400 L185,520 L155,520 Z' },
    leftThigh: { label: 'Venstre lår', path: 'M110,400 L150,400 L145,520 L115,520 Z' },
    rightKnee: { label: 'Høyre kne', path: 'M155,520 L185,520 L183,560 L157,560 Z' },
    leftKnee: { label: 'Venstre kne', path: 'M115,520 L145,520 L143,560 L117,560 Z' },
    rightLeg: { label: 'Høyre legg', path: 'M157,560 L183,560 L180,680 L160,680 Z' },
    leftLeg: { label: 'Venstre legg', path: 'M117,560 L143,560 L140,680 L120,680 Z' },
    rightFoot: { label: 'Høyre fot', path: 'M160,680 L180,680 L185,720 L155,720 Z' },
    leftFoot: { label: 'Venstre fot', path: 'M120,680 L140,680 L145,720 L115,720 Z' },
  },
  posterior: {
    headBack: {
      label: 'Bakhode',
      path: 'M150,20 C180,20 200,50 200,80 C200,110 180,130 150,130 C120,130 100,110 100,80 C100,50 120,20 150,20',
    },
    neckBack: { label: 'Nakke bak', path: 'M135,130 L165,130 L170,160 L130,160 Z' },
    upperBack: { label: 'Øvre rygg', path: 'M120,160 L180,160 L185,250 L115,250 Z' },
    middleBack: { label: 'Midtre rygg', path: 'M115,250 L185,250 L188,320 L112,320 Z' },
    lowerBack: { label: 'Korsrygg', path: 'M112,320 L188,320 L190,400 L110,400 Z' },
    rightScapula: { label: 'Høyre skulderblad', path: 'M165,180 L200,190 L195,250 L170,245 Z' },
    leftScapula: { label: 'Venstre skulderblad', path: 'M135,180 L100,190 L105,250 L130,245 Z' },
    rightGluteal: { label: 'Høyre sete', path: 'M150,400 L190,400 L188,450 L152,450 Z' },
    leftGluteal: { label: 'Venstre sete', path: 'M110,400 L150,400 L148,450 L112,450 Z' },
    rightHamstring: { label: 'Høyre bakside lår', path: 'M152,450 L188,450 L185,520 L155,520 Z' },
    leftHamstring: { label: 'Venstre bakside lår', path: 'M112,450 L148,450 L145,520 L115,520 Z' },
    rightCalf: { label: 'Høyre legg bak', path: 'M157,560 L183,560 L180,680 L160,680 Z' },
    leftCalf: { label: 'Venstre legg bak', path: 'M117,560 L143,560 L140,680 L120,680 Z' },
  },
};

// Pain types with colors
const PAIN_TYPES = [
  { id: 'sharp', label: 'Stikkende', color: '#ef4444', icon: '⚡' },
  { id: 'dull', label: 'Dump/verkende', color: '#f97316', icon: '○' },
  { id: 'burning', label: 'Brennende', color: '#eab308', icon: '🔥' },
  { id: 'numbness', label: 'Nummenhet', color: '#3b82f6', icon: '◇' },
  { id: 'tingling', label: 'Prikking', color: '#8b5cf6', icon: '✦' },
  { id: 'radiation', label: 'Utstråling', color: '#ec4899', icon: '→' },
];

// Pain intensity scale
const INTENSITY_LEVELS = [
  { level: 1, label: 'Minimal', color: '#86efac' },
  { level: 2, label: 'Lett', color: '#fde047' },
  { level: 3, label: 'Moderat', color: '#fb923c' },
  { level: 4, label: 'Sterk', color: '#f87171' },
  { level: 5, label: 'Ekstrem', color: '#dc2626' },
];

/**
 * Body Outline SVG Component
 */
const BodyOutline = ({ view, markers, onRegionClick, selectedRegion, highlightedRegions }) => {
  const regions = BODY_REGIONS[view] || BODY_REGIONS.anterior;

  return (
    <svg viewBox="0 0 300 750" className="w-full h-auto max-h-[500px]">
      {/* Background body silhouette */}
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Body outline */}
      <ellipse cx="150" cy="400" rx="100" ry="320" fill="#f3f4f6" filter="url(#shadow)" />

      {/* Clickable regions */}
      {Object.entries(regions).map(([regionId, region]) => {
        const isSelected = selectedRegion === regionId;
        const isHighlighted = highlightedRegions?.includes(regionId);
        const regionMarkers = markers?.filter((m) => m.region === regionId) || [];
        const hasMarkers = regionMarkers.length > 0;

        return (
          <g key={regionId}>
            <path
              d={region.path}
              fill={
                hasMarkers ? `${regionMarkers[0].color}40` : isHighlighted ? '#bfdbfe' : '#e5e7eb'
              }
              stroke={isSelected ? '#2563eb' : hasMarkers ? regionMarkers[0].color : '#9ca3af'}
              strokeWidth={isSelected ? 3 : 1}
              className="cursor-pointer transition-all duration-150 hover:fill-blue-100"
              onClick={() => onRegionClick(regionId, region.label)}
            />
            {/* Pain markers */}
            {regionMarkers.map((marker, idx) => (
              <circle
                key={idx}
                cx={marker.x || 150}
                cy={marker.y || 100}
                r={8 + marker.intensity}
                fill={marker.color}
                fillOpacity={0.7}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </g>
        );
      })}

      {/* Labels */}
      <text x="150" y="15" textAnchor="middle" className="text-xs fill-gray-500">
        {view === 'anterior' ? 'Forfra' : 'Bakfra'}
      </text>
    </svg>
  );
};

/**
 * Pain Type Selector
 */
const PainTypeSelector = ({ selected, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {PAIN_TYPES.map((type) => (
        <button
          key={type.id}
          onClick={() => onSelect(type)}
          className={`
            px-3 py-1.5 rounded-full text-sm font-medium transition-all
            ${selected?.id === type.id ? 'ring-2 ring-offset-2 ring-blue-500' : 'hover:bg-gray-100'}
          `}
          style={{
            backgroundColor: selected?.id === type.id ? `${type.color}20` : undefined,
            borderColor: type.color,
            borderWidth: '2px',
            color: type.color,
          }}
        >
          {type.icon} {type.label}
        </button>
      ))}
    </div>
  );
};

/**
 * Intensity Selector
 */
const IntensitySelector = ({ selected, onSelect }) => {
  return (
    <div className="flex gap-1">
      {INTENSITY_LEVELS.map((level) => (
        <button
          key={level.level}
          onClick={() => onSelect(level)}
          className={`
            w-10 h-10 rounded-lg font-bold transition-all
            ${selected?.level === level.level ? 'ring-2 ring-offset-2 ring-gray-800 scale-110' : 'hover:scale-105'}
          `}
          style={{ backgroundColor: level.color }}
          title={level.label}
        >
          {level.level}
        </button>
      ))}
    </div>
  );
};

/**
 * Main Body Chart Component
 */
export const BodyChart = ({
  initialMarkers = [],
  onChange,
  readOnly = false,
  showLegend = true,
}) => {
  const [view, setView] = useState('anterior');
  const [markers, setMarkers] = useState(initialMarkers);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedPainType, setSelectedPainType] = useState(PAIN_TYPES[0]);
  const [selectedIntensity, setSelectedIntensity] = useState(INTENSITY_LEVELS[2]);
  const [_notes, _setNotes] = useState('');

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange(markers);
    }
  }, [markers, onChange]);

  // Handle region click
  const handleRegionClick = useCallback(
    (regionId, regionLabel) => {
      if (readOnly) {
        return;
      }

      setSelectedRegion(regionId);

      // Add or update marker
      const existingMarkerIndex = markers.findIndex(
        (m) => m.region === regionId && m.view === view
      );

      if (existingMarkerIndex >= 0) {
        // Update existing marker
        const newMarkers = [...markers];
        newMarkers[existingMarkerIndex] = {
          ...newMarkers[existingMarkerIndex],
          painType: selectedPainType.id,
          color: selectedPainType.color,
          intensity: selectedIntensity.level,
        };
        setMarkers(newMarkers);
      } else {
        // Add new marker
        setMarkers([
          ...markers,
          {
            id: `${Date.now()}`,
            region: regionId,
            regionLabel,
            view,
            painType: selectedPainType.id,
            painTypeLabel: selectedPainType.label,
            color: selectedPainType.color,
            intensity: selectedIntensity.level,
            intensityLabel: selectedIntensity.label,
            notes: '',
          },
        ]);
      }
    },
    [view, selectedPainType, selectedIntensity, markers, readOnly]
  );

  // Remove marker
  const handleRemoveMarker = useCallback(
    (markerId) => {
      setMarkers(markers.filter((m) => m.id !== markerId));
    },
    [markers]
  );

  // Clear all markers
  const handleClearAll = useCallback(() => {
    setMarkers([]);
    setSelectedRegion(null);
  }, []);

  // Generate text summary
  const generateSummary = useCallback(() => {
    if (markers.length === 0) {
      return '';
    }

    const summary = markers
      .map((m) => `${m.regionLabel}: ${m.painTypeLabel} smerte, intensitet ${m.intensity}/5`)
      .join('. ');

    return `${summary}.`;
  }, [markers]);

  return (
    <div className="body-chart bg-white rounded-xl shadow-sm border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Smertekart</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setView('anterior')}
            className={`px-3 py-1 rounded-lg text-sm ${view === 'anterior' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Forfra
          </button>
          <button
            onClick={() => setView('posterior')}
            className={`px-3 py-1 rounded-lg text-sm ${view === 'posterior' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Bakfra
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Body diagram */}
        <div className="flex justify-center">
          <BodyOutline
            view={view}
            markers={markers.filter((m) => m.view === view)}
            onRegionClick={handleRegionClick}
            selectedRegion={selectedRegion}
          />
        </div>

        {/* Controls and markers list */}
        <div className="space-y-4">
          {!readOnly && (
            <>
              {/* Pain type selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Smertetype</label>
                <PainTypeSelector selected={selectedPainType} onSelect={setSelectedPainType} />
              </div>

              {/* Intensity selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intensitet (1-5)
                </label>
                <IntensitySelector selected={selectedIntensity} onSelect={setSelectedIntensity} />
              </div>
            </>
          )}

          {/* Markers list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Markerte områder ({markers.length})
              </label>
              {!readOnly && markers.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Fjern alle
                </button>
              )}
            </div>

            {markers.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                Klikk på et område for å markere smerte
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {markers.map((marker) => (
                  <div
                    key={marker.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: marker.color }}
                      />
                      <span className="text-sm font-medium">{marker.regionLabel}</span>
                      <span className="text-xs text-gray-500">
                        {marker.painTypeLabel}, {marker.intensity}/5
                      </span>
                    </div>
                    {!readOnly && (
                      <button
                        onClick={() => handleRemoveMarker(marker.id)}
                        className="text-gray-400 hover:text-red-500 text-sm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generated summary */}
          {markers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tekstsammendrag
              </label>
              <div className="p-3 bg-blue-50 rounded-lg text-sm">{generateSummary()}</div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            {PAIN_TYPES.map((type) => (
              <div key={type.id} className="flex items-center gap-1">
                <span style={{ color: type.color }}>{type.icon}</span>
                <span>{type.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BodyChart;
