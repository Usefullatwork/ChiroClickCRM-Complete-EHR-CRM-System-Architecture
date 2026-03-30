/**
 * MarkerLegend - Right panel showing placed markers with remove and narrative generation
 *
 * Displays a scrollable list of all markers placed on the current view,
 * with color-coded symptom indicators and a narrative generation button.
 */

import { FileText } from 'lucide-react';
import { MUSCLES, SYMPTOM_COLORS } from './bodyChartData';

export default function MarkerLegend({ t, lang, currentMarkers, removeMarker, generateNarrative }) {
  return (
    <div className="w-64 border-l border-gray-200 p-3">
      <h4 className="font-medium text-gray-700 mb-3">{t.triggerPoints}</h4>

      {currentMarkers.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.clickToMark}</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {currentMarkers.map((marker) => (
            <div key={marker.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
              <span
                className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                style={{ backgroundColor: SYMPTOM_COLORS[marker.symptom] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {marker.isTriggerPoint
                    ? MUSCLES[marker.muscle]?.[lang]?.name || marker.muscle
                    : marker.regionId}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{marker.description}</p>
              </div>
              <button
                onClick={() => removeMarker(marker.id)}
                className="text-gray-400 dark:text-gray-300 hover:text-red-500"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {currentMarkers.length > 0 && (
        <button
          onClick={generateNarrative}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          <FileText className="w-4 h-4" />
          {t.generateNarrative}
        </button>
      )}
    </div>
  );
}
