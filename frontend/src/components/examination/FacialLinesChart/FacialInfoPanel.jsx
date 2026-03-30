/**
 * FacialInfoPanel - Right panel showing selected point/line info and marked points
 */

import { Zap } from 'lucide-react';

export default function FacialInfoPanel({ t, lang, selectedTriggerPoint, selectedLine, markers }) {
  return (
    <div className="w-72 border-l border-gray-200 p-3 bg-gray-50">
      {/* Selected Trigger Point Info */}
      {selectedTriggerPoint && (
        <div className="bg-white rounded-lg p-3 mb-3 border border-orange-200">
          <h4 className="font-medium text-gray-800 text-sm mb-2 flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedTriggerPoint.muscle.color }}
            />
            {selectedTriggerPoint.muscle[lang]?.name || selectedTriggerPoint.muscle.en.name}
          </h4>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t.muscleInfo}</span>
              <p className="text-sm text-gray-700">
                {selectedTriggerPoint.muscle[lang]?.description ||
                  selectedTriggerPoint.muscle.en.description}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t.referralPattern}</span>
              <p className="text-sm text-gray-700 font-medium">
                {typeof selectedTriggerPoint.triggerPoint.referral === 'object'
                  ? selectedTriggerPoint.triggerPoint.referral[lang] ||
                    selectedTriggerPoint.triggerPoint.referral.en
                  : selectedTriggerPoint.triggerPoint.referral}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selected Line Info */}
      {selectedLine && (
        <div className="bg-white rounded-lg p-3 mb-3 border border-blue-200">
          <h4 className="font-medium text-gray-800 text-sm mb-2 flex items-center gap-2">
            <div className="w-8 h-1 rounded" style={{ backgroundColor: selectedLine.color }} />
            {selectedLine[lang]?.name || selectedLine.en.name}
          </h4>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Description</span>
              <p className="text-sm text-gray-700">
                {selectedLine[lang]?.description || selectedLine.en.description}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t.technique}</span>
              <p className="text-sm text-gray-700 font-medium">
                {selectedLine[lang]?.technique || selectedLine.en.technique}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Selection */}
      {!selectedTriggerPoint && !selectedLine && (
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-gray-400 dark:text-gray-300" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.noSelection}</p>
        </div>
      )}

      {/* Marked Points List */}
      {markers && markers.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {lang === 'no' ? 'Markerte punkter' : 'Marked Points'}
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {markers.map((marker, idx) => (
              <div
                key={marker.id || idx}
                className="bg-white rounded p-2 text-xs border border-gray-200"
              >
                <div className="font-medium text-gray-800">{marker.muscle}</div>
                <div className="text-gray-500 dark:text-gray-400 truncate">
                  {marker.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
