/**
 * FacialLinesChart - Detailed facial anatomy chart with treatment lines
 *
 * Features:
 * - Detailed SVG face diagram (anterior and lateral views)
 * - Fascial lines overlay for manual therapy
 * - Facial muscle trigger points
 * - Cranial nerve distribution zones
 * - Toggle controls for each layer
 * - Bilingual support (Norwegian/English)
 *
 * Orchestrator — sub-modules in ./FacialLinesChart/
 */

import { useState, useCallback } from 'react';
import { User, FileText, RotateCcw } from 'lucide-react';

import {
  LABELS,
  FASCIAL_LINES,
  FACIAL_MUSCLES,
  NERVE_ZONES,
} from './FacialLinesChart/facialChartData';
import FacialControls from './FacialLinesChart/FacialControls';
import FacialSvgDiagram from './FacialLinesChart/FacialSvgDiagram';
import FacialInfoPanel from './FacialLinesChart/FacialInfoPanel';

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function FacialLinesChart({
  value = { markers: [], selectedPoints: [] },
  onChange,
  onGenerateNarrative,
  lang = 'no',
  className = '',
}) {
  const t = LABELS[lang];

  // Layer visibility states
  const [showOutline, setShowOutline] = useState(true);
  const [showFascialLines, setShowFascialLines] = useState(true);
  const [showMuscles, setShowMuscles] = useState(false);
  const [showTriggerPoints, setShowTriggerPoints] = useState(true);
  const [showNerves, setShowNerves] = useState(false);

  // UI states
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedTriggerPoint, setSelectedTriggerPoint] = useState(null);
  const [showLegend, setShowLegend] = useState(true);

  // Handle trigger point click
  const handleTriggerPointClick = useCallback(
    (muscle, triggerPoint) => {
      setSelectedTriggerPoint({ muscle, triggerPoint });
      setSelectedLine(null);

      if (onChange) {
        const newMarker = {
          id: Date.now(),
          type: 'triggerPoint',
          muscleId: muscle.en.name,
          pointId: triggerPoint.id,
          description:
            typeof triggerPoint.referral === 'object'
              ? triggerPoint.referral[lang] || triggerPoint.referral.en
              : triggerPoint.referral,
          muscle: muscle[lang]?.name || muscle.en.name,
        };

        onChange({
          ...value,
          markers: [...(value.markers || []), newMarker],
        });
      }
    },
    [onChange, value, lang]
  );

  // Handle fascial line click
  const handleLineClick = useCallback((lineId, line) => {
    setSelectedLine({ id: lineId, ...line });
    setSelectedTriggerPoint(null);
  }, []);

  // Generate narrative
  const handleGenerateNarrative = useCallback(() => {
    if (!value.markers || value.markers.length === 0) {
      return;
    }

    const narrativeLines = [];
    const triggerPointMarkers = value.markers.filter((m) => m.type === 'triggerPoint');
    const lineMarkers = value.markers.filter((m) => m.type === 'fascialLine');

    if (triggerPointMarkers.length > 0) {
      const header =
        lang === 'no'
          ? 'Ansikts-triggerpunkter identifisert:'
          : 'Facial trigger points identified:';
      const points = triggerPointMarkers.map((m) => `${m.muscle} (${m.description})`).join(', ');
      narrativeLines.push(`${header} ${points}.`);
    }

    if (lineMarkers.length > 0) {
      const header = lang === 'no' ? 'Fascielinjer behandlet:' : 'Fascial lines treated:';
      const lines = lineMarkers.map((m) => m.lineName).join(', ');
      narrativeLines.push(`${header} ${lines}.`);
    }

    const narrative = narrativeLines.join('\n\n');
    if (onGenerateNarrative) {
      onGenerateNarrative(narrative);
    }
  }, [value.markers, lang, onGenerateNarrative]);

  // Clear all
  const handleClearAll = useCallback(() => {
    if (onChange) {
      onChange({ markers: [], selectedPoints: [] });
    }
    setSelectedLine(null);
    setSelectedTriggerPoint(null);
  }, [onChange]);

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{t.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateNarrative}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200
                        text-rose-700 rounded-lg text-sm transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              {t.generateNarrative}
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200
                        text-gray-600 dark:text-gray-300 rounded-lg text-sm transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t.clearAll}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Panel - Layer Controls */}
        <FacialControls
          t={t}
          lang={lang}
          showOutline={showOutline}
          setShowOutline={setShowOutline}
          showFascialLines={showFascialLines}
          setShowFascialLines={setShowFascialLines}
          showMuscles={showMuscles}
          setShowMuscles={setShowMuscles}
          showTriggerPoints={showTriggerPoints}
          setShowTriggerPoints={setShowTriggerPoints}
          showNerves={showNerves}
          setShowNerves={setShowNerves}
          showLegend={showLegend}
          setShowLegend={setShowLegend}
          markerCount={value.markers ? value.markers.length : 0}
        />

        {/* Center - SVG Face Diagram */}
        <FacialSvgDiagram
          showNerves={showNerves}
          showOutline={showOutline}
          showFascialLines={showFascialLines}
          showTriggerPoints={showTriggerPoints}
          selectedLine={selectedLine}
          selectedTriggerPoint={selectedTriggerPoint}
          markers={value.markers}
          onLineClick={handleLineClick}
          onTriggerPointClick={handleTriggerPointClick}
        />

        {/* Right Panel - Info */}
        <FacialInfoPanel
          t={t}
          lang={lang}
          selectedTriggerPoint={selectedTriggerPoint}
          selectedLine={selectedLine}
          markers={value.markers}
        />
      </div>
    </div>
  );
}

// Export data for external use
export { FASCIAL_LINES, FACIAL_MUSCLES, NERVE_ZONES };
export { LABELS as FACIAL_LABELS };
