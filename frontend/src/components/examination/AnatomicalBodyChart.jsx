/**
 * AnatomicalBodyChart - Detailed anatomical body diagram with layers
 *
 * Features:
 * - Detailed anatomical SVG with proper proportions
 * - Dermatome overlay (C2-S5 nerve distribution)
 * - Muscle anatomy layer with trigger points
 * - Toggle controls for each layer
 * - Bilingual support (Norwegian/English)
 *
 * Orchestrator component — sub-modules in ./AnatomicalBodyChart/
 */

import { useState, useCallback, useMemo } from 'react';
import { Layers, RotateCcw } from 'lucide-react';

import {
  LABELS,
  DERMATOMES,
  MUSCLES,
  DERMATOME_REGIONS,
  ANATOMICAL_PATHS,
  SYMPTOM_COLORS,
} from './AnatomicalBodyChart/bodyChartData';
import BodyOutline from './AnatomicalBodyChart/BodyOutline';
import DermatomeLayer from './AnatomicalBodyChart/DermatomeLayer';
import TriggerPointLayer from './AnatomicalBodyChart/TriggerPointLayer';
import LayerControls from './AnatomicalBodyChart/LayerControls';
import MarkerLegend from './AnatomicalBodyChart/MarkerLegend';

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function AnatomicalBodyChart({
  value = { markers: [], selectedRegions: [] },
  onChange,
  onGenerateNarrative,
  lang = 'en',
  className = '',
}) {
  const t = LABELS[lang] || LABELS.en;

  // View state
  const [view, setView] = useState('front');

  // Layer visibility
  const [layers, setLayers] = useState({
    outline: true,
    dermatomes: false,
    muscles: false,
    triggerPoints: false,
  });

  // Layer panel expanded
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);

  // Selected info
  const [selectedDermatome, setSelectedDermatome] = useState(null);
  const [_selectedMuscle, setSelectedMuscle] = useState(null);
  const [selectedTriggerPoint, setSelectedTriggerPoint] = useState(null);

  // Symptom selection
  const [selectedSymptom, setSelectedSymptom] = useState('pain');
  const [intensity, _setIntensity] = useState(5);

  // Toggle layer
  const toggleLayer = useCallback((layer) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  // Handle dermatome click
  const handleDermatomeClick = useCallback((dermatomeId) => {
    setSelectedDermatome(dermatomeId);
    setSelectedMuscle(null);
    setSelectedTriggerPoint(null);
  }, []);

  // Handle trigger point click - add marker
  const handleTriggerPointClick = useCallback(
    (muscle, triggerPoint) => {
      setSelectedTriggerPoint({ muscle, triggerPoint });

      // Add marker at trigger point location
      const newMarker = {
        id: Date.now(),
        regionId: `tp_${triggerPoint.id}`,
        view,
        symptom: selectedSymptom,
        intensity,
        description:
          typeof triggerPoint.referral === 'object'
            ? triggerPoint.referral[lang] || triggerPoint.referral.en
            : triggerPoint.referral,
        cx: triggerPoint.cx,
        cy: triggerPoint.cy,
        isTriggerPoint: true,
        muscle: muscle,
      };

      const newMarkers = [...(value.markers || []), newMarker];
      onChange({ ...value, markers: newMarkers });
    },
    [view, selectedSymptom, intensity, value, onChange, lang]
  );

  // Remove marker
  const removeMarker = useCallback(
    (markerId) => {
      const newMarkers = (value.markers || []).filter((m) => m.id !== markerId);
      onChange({ ...value, markers: newMarkers });
    },
    [value, onChange]
  );

  // Clear all
  const clearAll = useCallback(() => {
    onChange({ markers: [], selectedRegions: [] });
    setSelectedDermatome(null);
    setSelectedMuscle(null);
    setSelectedTriggerPoint(null);
  }, [onChange]);

  // Generate narrative
  const generateNarrative = useCallback(() => {
    const markers = value.markers || [];
    if (markers.length === 0) {
      return '';
    }

    const parts = [];

    // Group by trigger points vs regular markers
    const tpMarkers = markers.filter((m) => m.isTriggerPoint);
    const regularMarkers = markers.filter((m) => !m.isTriggerPoint);

    if (tpMarkers.length > 0) {
      const tpList = tpMarkers.map((m) => {
        const muscle = MUSCLES[m.muscle];
        const muscleName = muscle ? muscle[lang]?.name || muscle.en.name : m.muscle;
        return `${muscleName} (${m.description})`;
      });

      parts.push(
        lang === 'no'
          ? `Triggerpunkter identifisert: ${tpList.join(', ')}.`
          : `Trigger points identified: ${tpList.join(', ')}.`
      );
    }

    if (regularMarkers.length > 0) {
      const regionList = regularMarkers.map((m) => {
        const symptomLabel =
          lang === 'no'
            ? {
                pain: 'smerte',
                aching: 'verkende',
                sharp: 'stikkende',
                burning: 'brennende',
                numbness: 'nummenhet',
                tingling: 'prikking',
                weakness: 'svakhet',
                stiffness: 'stivhet',
                swelling: 'hevelse',
                tenderness: 'ømhet',
              }[m.symptom]
            : m.symptom;
        return `${m.regionId} (${symptomLabel}, ${m.intensity}/10)`;
      });

      parts.push(
        lang === 'no'
          ? `Symptomområder: ${regionList.join(', ')}.`
          : `Symptom areas: ${regionList.join(', ')}.`
      );
    }

    const narrative = parts.join(' ');
    if (onGenerateNarrative) {
      onGenerateNarrative(narrative);
    }
    return narrative;
  }, [value.markers, lang, onGenerateNarrative]);

  // Get current view markers
  const currentMarkers = useMemo(
    () => (value.markers || []).filter((m) => m.view === view),
    [value.markers, view]
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            {t.title}
          </h3>

          {/* View toggle */}
          <div className="flex items-center gap-2">
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              {['front', 'back'].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    view === v
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {t[v]}
                </button>
              ))}
            </div>

            {currentMarkers.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                <RotateCcw className="w-4 h-4" />
                {t.clearAll}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Layer Controls Panel */}
        <LayerControls
          t={t}
          lang={lang}
          layers={layers}
          toggleLayer={toggleLayer}
          layerPanelOpen={layerPanelOpen}
          setLayerPanelOpen={setLayerPanelOpen}
          selectedSymptom={selectedSymptom}
          setSelectedSymptom={setSelectedSymptom}
          selectedDermatome={selectedDermatome}
          selectedTriggerPoint={selectedTriggerPoint}
        />

        {/* SVG Body Diagram */}
        <div className="flex-1 p-4">
          <svg viewBox="0 0 200 500" className="w-full max-w-md mx-auto">
            {/* Body outline */}
            {layers.outline && <BodyOutline view={view} />}

            {/* Dermatome layer */}
            {layers.dermatomes && (
              <DermatomeLayer
                view={view}
                selectedDermatome={selectedDermatome}
                onDermatomeClick={handleDermatomeClick}
              />
            )}

            {/* Trigger points layer */}
            {layers.triggerPoints && (
              <TriggerPointLayer
                selectedSymptom={selectedSymptom}
                selectedTriggerPoint={selectedTriggerPoint}
                currentMarkers={currentMarkers}
                onTriggerPointClick={handleTriggerPointClick}
              />
            )}

            {/* Markers */}
            {currentMarkers
              .filter((m) => !m.isTriggerPoint)
              .map((marker) => (
                <g key={marker.id}>
                  <circle
                    cx={marker.cx || 100}
                    cy={marker.cy || 100}
                    r="10"
                    fill={SYMPTOM_COLORS[marker.symptom]}
                    fillOpacity="0.8"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <text
                    x={marker.cx || 100}
                    y={marker.cy || 100}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="8"
                    fontWeight="bold"
                    fill="#fff"
                  >
                    {marker.intensity}
                  </text>
                </g>
              ))}
          </svg>
        </div>

        {/* Marker Legend */}
        <MarkerLegend
          t={t}
          lang={lang}
          currentMarkers={currentMarkers}
          removeMarker={removeMarker}
          generateNarrative={generateNarrative}
        />
      </div>
    </div>
  );
}

// Export data for use elsewhere
export { DERMATOMES, MUSCLES, DERMATOME_REGIONS, ANATOMICAL_PATHS };
