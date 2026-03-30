/**
 * FacialControls - Left panel with layer toggles, legend, and marker count
 */

import { Layers, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { FASCIAL_LINES, NERVE_ZONES } from './facialChartData';

export default function FacialControls({
  t,
  lang,
  showOutline,
  setShowOutline,
  showFascialLines,
  setShowFascialLines,
  showMuscles,
  setShowMuscles,
  showTriggerPoints,
  setShowTriggerPoints,
  showNerves,
  setShowNerves,
  showLegend,
  setShowLegend,
  markerCount,
}) {
  return (
    <div className="w-56 border-r border-gray-200 p-3 space-y-3 bg-gray-50">
      <div>
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          {t.layers}
        </h4>
        <div className="space-y-1.5">
          <button
            onClick={() => setShowOutline(!showOutline)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors
              ${showOutline ? 'bg-gray-200 text-gray-800' : 'bg-white text-gray-500 dark:text-gray-400 hover:bg-gray-100'}`}
          >
            {showOutline ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{t.outline}</span>
          </button>

          <button
            onClick={() => setShowFascialLines(!showFascialLines)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors
              ${showFascialLines ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-500 dark:text-gray-400 hover:bg-gray-100'}`}
          >
            {showFascialLines ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{t.fascialLines}</span>
          </button>

          <button
            onClick={() => setShowMuscles(!showMuscles)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors
              ${showMuscles ? 'bg-red-100 text-red-700' : 'bg-white text-gray-500 dark:text-gray-400 hover:bg-gray-100'}`}
          >
            {showMuscles ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{t.muscles}</span>
          </button>

          <button
            onClick={() => setShowTriggerPoints(!showTriggerPoints)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors
              ${showTriggerPoints ? 'bg-orange-100 text-orange-700' : 'bg-white text-gray-500 dark:text-gray-400 hover:bg-gray-100'}`}
          >
            {showTriggerPoints ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{t.triggerPoints}</span>
          </button>

          <button
            onClick={() => setShowNerves(!showNerves)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors
              ${showNerves ? 'bg-purple-100 text-purple-700' : 'bg-white text-gray-500 dark:text-gray-400 hover:bg-gray-100'}`}
          >
            {showNerves ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{t.nerves}</span>
          </button>
        </div>
      </div>

      {/* Legend Toggle */}
      <button
        onClick={() => setShowLegend(!showLegend)}
        className="w-full flex items-center justify-between px-2.5 py-2 bg-white rounded-lg
                  text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Legend
        </span>
        {showLegend ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Legend Content */}
      {showLegend && (
        <div className="bg-white rounded-lg p-3 space-y-3">
          {showFascialLines && (
            <div>
              <h5 className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                {t.fascialLines}
              </h5>
              <div className="space-y-1">
                {Object.entries(FASCIAL_LINES)
                  .slice(0, 5)
                  .map(([id, line]) => (
                    <div key={id} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-0.5 rounded" style={{ backgroundColor: line.color }} />
                      <span className="text-gray-600 dark:text-gray-300 truncate">
                        {line[lang]?.name || line.en.name}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {showNerves && (
            <div>
              <h5 className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                {t.nerves}
              </h5>
              <div className="space-y-1">
                {Object.entries(NERVE_ZONES).map(([id, zone]) => (
                  <div key={id} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: zone.color.replace('0.3', '0.6') }}
                    />
                    <span className="text-gray-600 dark:text-gray-300">
                      {zone[lang]?.name || zone.en.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Markers Count */}
      {markerCount > 0 && (
        <div className="bg-rose-50 rounded-lg p-3">
          <div className="text-xs font-medium text-rose-700">
            {markerCount} {lang === 'no' ? 'punkt markert' : 'points marked'}
          </div>
        </div>
      )}
    </div>
  );
}
