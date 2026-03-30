/**
 * LayerControls - Left panel with layer toggles, symptom selector, and info display
 *
 * Controls which anatomical layers are visible on the body chart,
 * provides symptom type selection, and shows details for selected items.
 */

import { Eye, EyeOff, Zap, Activity, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { DERMATOMES, MUSCLES, SYMPTOM_COLORS } from './bodyChartData';

export default function LayerControls({
  t,
  lang,
  layers,
  toggleLayer,
  layerPanelOpen,
  setLayerPanelOpen,
  selectedSymptom,
  setSelectedSymptom,
  selectedDermatome,
  selectedTriggerPoint,
}) {
  return (
    <div className="w-56 border-r border-gray-200 bg-gray-50">
      {/* Layer toggles */}
      <div className="p-3 border-b border-gray-200">
        <button
          onClick={() => setLayerPanelOpen(!layerPanelOpen)}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700"
        >
          {t.layers}
          {layerPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {layerPanelOpen && (
          <div className="mt-3 space-y-2">
            {[
              { key: 'outline', icon: Circle, label: t.outline },
              { key: 'dermatomes', icon: Zap, label: t.dermatomes },
              { key: 'muscles', icon: Activity, label: t.muscles },
              { key: 'triggerPoints', icon: Circle, label: t.triggerPoints },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => toggleLayer(key)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                  layers[key]
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                }`}
              >
                {layers[key] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Symptom selector */}
      <div className="p-3 border-b border-gray-200">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Symptom</p>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(SYMPTOM_COLORS)
            .slice(0, 6)
            .map(([symptom, color]) => (
              <button
                key={symptom}
                onClick={() => setSelectedSymptom(symptom)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  selectedSymptom === symptom
                    ? 'bg-gray-200 ring-2 ring-blue-500'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                {symptom}
              </button>
            ))}
        </div>
      </div>

      {/* Info panel */}
      <div className="p-3">
        {selectedDermatome && (
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t.selectedDermatome}
            </p>
            <p className="font-bold text-gray-900">{selectedDermatome}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {DERMATOMES[selectedDermatome]?.[lang]?.area ||
                DERMATOMES[selectedDermatome]?.en?.area}
            </p>
          </div>
        )}

        {selectedTriggerPoint && (
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t.selectedMuscle}
            </p>
            <p className="font-bold text-gray-900">
              {MUSCLES[selectedTriggerPoint.muscle]?.[lang]?.name ||
                MUSCLES[selectedTriggerPoint.muscle]?.en?.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {typeof selectedTriggerPoint.triggerPoint.referral === 'object'
                ? selectedTriggerPoint.triggerPoint.referral[lang] ||
                  selectedTriggerPoint.triggerPoint.referral.en
                : selectedTriggerPoint.triggerPoint.referral}
            </p>
          </div>
        )}

        {!selectedDermatome && !selectedTriggerPoint && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{t.noSelection}</p>
        )}
      </div>
    </div>
  );
}
