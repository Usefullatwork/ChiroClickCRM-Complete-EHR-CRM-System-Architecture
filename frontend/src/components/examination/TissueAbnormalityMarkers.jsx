/**
 * TissueAbnormalityMarkers Component
 *
 * Panel for documenting tissue abnormalities including:
 * TP (Trigger Points), LG (Ligaments), TN (Tendons),
 * SK (Skin), FS (Fascial Restrictions)
 *
 * Designed to integrate with BodyDiagram component.
 */

import _React, { useMemo, useState } from 'react';
import { Target, ChevronDown, ChevronUp, Plus, X, Info, Crosshair } from 'lucide-react';

// Tissue abnormality types
const TISSUE_TYPES = [
  {
    id: 'TP',
    name: 'Trigger Point',
    nameNo: 'Triggerpunkt',
    color: '#ef4444', // red
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    description: 'Hyperirritable spot in skeletal muscle',
    descriptionNo: 'Hyperirritabelt punkt i skjelettmuskel',
  },
  {
    id: 'LG',
    name: 'Ligament',
    nameNo: 'Ligament',
    color: '#3b82f6', // blue
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    description: 'Ligament tenderness or laxity',
    descriptionNo: 'Ligamentømhet eller laksitet',
  },
  {
    id: 'TN',
    name: 'Tendon',
    nameNo: 'Sene',
    color: '#8b5cf6', // purple
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    description: 'Tendon pathology (tendinopathy, tear)',
    descriptionNo: 'Senepatologi (tendinopati, ruptur)',
  },
  {
    id: 'SK',
    name: 'Skin',
    nameNo: 'Hud',
    color: '#f59e0b', // amber
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-300',
    description: 'Skin changes, scars, adhesions',
    descriptionNo: 'Hudforandringer, arr, sammenvoksinger',
  },
  {
    id: 'FS',
    name: 'Fascial Restriction',
    nameNo: 'Fascierestriksjon',
    color: '#10b981', // emerald
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-300',
    description: 'Fascial tension or adhesion',
    descriptionNo: 'Fasciespenning eller adhesjon',
  },
  {
    id: 'MS',
    name: 'Muscle Spasm',
    nameNo: 'Muskelspasme',
    color: '#ec4899', // pink
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-300',
    description: 'Involuntary muscle contraction',
    descriptionNo: 'Ufrivillig muskelkontraksjon',
  },
  {
    id: 'ED',
    name: 'Edema',
    nameNo: 'Ødem',
    color: '#06b6d4', // cyan
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-300',
    description: 'Swelling or fluid accumulation',
    descriptionNo: 'Hevelse eller væskeansamling',
  },
  {
    id: 'AT',
    name: 'Atrophy',
    nameNo: 'Atrofi',
    color: '#6b7280', // gray
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    description: 'Muscle wasting',
    descriptionNo: 'Muskelatrofi',
  },
];

// Severity levels
const SEVERITY_LEVELS = [
  { value: 'mild', label: 'Mild', labelNo: 'Mild', color: 'bg-green-100 text-green-700' },
  {
    value: 'moderate',
    label: 'Moderate',
    labelNo: 'Moderat',
    color: 'bg-amber-100 text-amber-700',
  },
  { value: 'severe', label: 'Severe', labelNo: 'Alvorlig', color: 'bg-red-100 text-red-700' },
];

// Common body regions for quick selection
const BODY_REGIONS = [
  { id: 'cervical_upper', name: 'Upper Cervical', nameNo: 'Øvre cervikal' },
  { id: 'cervical_lower', name: 'Lower Cervical', nameNo: 'Nedre cervikal' },
  { id: 'thoracic_upper', name: 'Upper Thoracic', nameNo: 'Øvre thorakal' },
  { id: 'thoracic_mid', name: 'Mid Thoracic', nameNo: 'Midtre thorakal' },
  { id: 'thoracic_lower', name: 'Lower Thoracic', nameNo: 'Nedre thorakal' },
  { id: 'lumbar', name: 'Lumbar', nameNo: 'Lumbal' },
  { id: 'sacroiliac_left', name: 'Left SI Joint', nameNo: 'Venstre SI-ledd' },
  { id: 'sacroiliac_right', name: 'Right SI Joint', nameNo: 'Høyre SI-ledd' },
  { id: 'shoulder_left', name: 'Left Shoulder', nameNo: 'Venstre skulder' },
  { id: 'shoulder_right', name: 'Right Shoulder', nameNo: 'Høyre skulder' },
  { id: 'hip_left', name: 'Left Hip', nameNo: 'Venstre hofte' },
  { id: 'hip_right', name: 'Right Hip', nameNo: 'Høyre hofte' },
  { id: 'scapula_left', name: 'Left Scapula', nameNo: 'Venstre scapula' },
  { id: 'scapula_right', name: 'Right Scapula', nameNo: 'Høyre scapula' },
  { id: 'trapezius_left', name: 'Left Trapezius', nameNo: 'Venstre trapezius' },
  { id: 'trapezius_right', name: 'Right Trapezius', nameNo: 'Høyre trapezius' },
  { id: 'piriformis_left', name: 'Left Piriformis', nameNo: 'Venstre piriformis' },
  { id: 'piriformis_right', name: 'Right Piriformis', nameNo: 'Høyre piriformis' },
  { id: 'psoas_left', name: 'Left Psoas', nameNo: 'Venstre psoas' },
  { id: 'psoas_right', name: 'Right Psoas', nameNo: 'Høyre psoas' },
];

/**
 * Single marker entry component
 */
function MarkerEntry({ marker, _index, onChange, onRemove, lang }) {
  const tissueType = TISSUE_TYPES.find((t) => t.id === marker.type);

  return (
    <div
      className={`p-3 rounded-lg border ${tissueType?.bgColor || 'bg-gray-100'} ${tissueType?.borderColor || 'border-gray-300'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-xs font-bold rounded ${tissueType?.bgColor} ${tissueType?.textColor}`}
          >
            {marker.type}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {tissueType ? (lang === 'no' ? tissueType.nameNo : tissueType.name) : marker.type}
          </span>
        </div>
        <button type="button" onClick={onRemove} className="text-gray-400 hover:text-red-500">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            {lang === 'no' ? 'Lokasjon' : 'Location'}
          </label>
          <select
            value={marker.location || ''}
            onChange={(e) => onChange({ ...marker, location: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
          >
            <option value="">{lang === 'no' ? '-- Velg --' : '-- Select --'}</option>
            {BODY_REGIONS.map((region) => (
              <option key={region.id} value={region.id}>
                {lang === 'no' ? region.nameNo : region.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">
            {lang === 'no' ? 'Alvorlighetsgrad' : 'Severity'}
          </label>
          <div className="flex gap-1">
            {SEVERITY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => onChange({ ...marker, severity: level.value })}
                className={`flex-1 px-2 py-1 text-xs rounded border transition-colors
                           ${
                             marker.severity === level.value
                               ? `${level.color} border-current font-medium`
                               : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                           }`}
              >
                {lang === 'no' ? level.labelNo : level.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2">
        <input
          type="text"
          value={marker.notes || ''}
          onChange={(e) => onChange({ ...marker, notes: e.target.value })}
          placeholder={lang === 'no' ? 'Tilleggsnotater...' : 'Additional notes...'}
          className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
        />
      </div>

      {/* Custom location if region doesn't fit */}
      {marker.location === '' && (
        <div className="mt-2">
          <input
            type="text"
            value={marker.customLocation || ''}
            onChange={(e) => onChange({ ...marker, customLocation: e.target.value })}
            placeholder={lang === 'no' ? 'Egendefinert lokasjon...' : 'Custom location...'}
            className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Quick add panel
 */
function QuickAddPanel({ onAdd, lang }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <span className="text-xs font-medium text-gray-500 block mb-2">
        {lang === 'no' ? 'Hurtigtillegg:' : 'Quick Add:'}
      </span>
      <div className="flex flex-wrap gap-2">
        {TISSUE_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onAdd(type.id)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors
                       ${type.bgColor} ${type.textColor} ${type.borderColor} hover:opacity-80`}
          >
            <Plus className="w-3 h-3" />
            {type.id}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Summary by type
 */
function MarkerSummary({ markers, _lang }) {
  const summary = useMemo(() => {
    const counts = {};
    markers.forEach((m) => {
      counts[m.type] = (counts[m.type] || 0) + 1;
    });
    return counts;
  }, [markers]);

  if (Object.keys(summary).length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(summary).map(([type, count]) => {
        const tissueType = TISSUE_TYPES.find((t) => t.id === type);
        return (
          <span
            key={type}
            className={`px-2 py-1 text-xs rounded-full ${tissueType?.bgColor} ${tissueType?.textColor}`}
          >
            {count}x {type}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Legend component
 */
function MarkerLegend({ lang, expanded, onToggle }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100"
      >
        <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <Info className="w-4 h-4" />
          {lang === 'no' ? 'Markørtegn (Legend)' : 'Marker Legend'}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="p-3 grid md:grid-cols-2 gap-2">
          {TISSUE_TYPES.map((type) => (
            <div key={type.id} className="flex items-start gap-2">
              <span
                className={`px-2 py-0.5 text-xs font-bold rounded ${type.bgColor} ${type.textColor}`}
                style={{ minWidth: '32px', textAlign: 'center' }}
              >
                {type.id}
              </span>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {lang === 'no' ? type.nameNo : type.name}
                </span>
                <p className="text-xs text-gray-500">
                  {lang === 'no' ? type.descriptionNo : type.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main TissueAbnormalityMarkers component
 */
export default function TissueAbnormalityMarkers({
  values = { markers: [] },
  onChange,
  lang = 'no',
  _readOnly = false,
  onGenerateNarrative,
  onSelectForDiagram, // Callback to integrate with BodyDiagram
}) {
  const [showLegend, setShowLegend] = useState(false);
  const markers = values.markers || [];

  const addMarker = (type) => {
    const newMarker = {
      id: Date.now(),
      type,
      location: '',
      severity: 'moderate',
      notes: '',
    };
    onChange({ ...values, markers: [...markers, newMarker] });
  };

  const updateMarker = (index, updatedMarker) => {
    const newMarkers = [...markers];
    newMarkers[index] = updatedMarker;
    onChange({ ...values, markers: newMarkers });
  };

  const removeMarker = (index) => {
    onChange({ ...values, markers: markers.filter((_, i) => i !== index) });
  };

  // Generate narrative
  const generateNarrative = useMemo(() => {
    if (markers.length === 0) {
      return lang === 'no'
        ? 'Ingen vevsabnormaliteter registrert.'
        : 'No tissue abnormalities documented.';
    }

    // Group by type
    const byType = {};
    markers.forEach((m) => {
      if (!byType[m.type]) {
        byType[m.type] = [];
      }
      const _tissueType = TISSUE_TYPES.find((t) => t.id === m.type);
      const region = BODY_REGIONS.find((r) => r.id === m.location);
      const locationName = region
        ? lang === 'no'
          ? region.nameNo
          : region.name
        : m.customLocation || (lang === 'no' ? 'uspesifisert' : 'unspecified');

      const severity = SEVERITY_LEVELS.find((s) => s.value === m.severity);
      const severityName = severity ? (lang === 'no' ? severity.labelNo : severity.label) : '';

      byType[m.type].push(`${locationName} (${severityName})${m.notes ? `: ${m.notes}` : ''}`);
    });

    const narrativeParts = Object.entries(byType).map(([type, locations]) => {
      const tissueType = TISSUE_TYPES.find((t) => t.id === type);
      const typeName = tissueType ? (lang === 'no' ? tissueType.nameNo : tissueType.name) : type;
      return `${typeName}: ${locations.join(', ')}`;
    });

    return `${lang === 'no' ? 'Palpasjonsfunn:' : 'Palpation findings:'} ${narrativeParts.join('. ')}.`;
  }, [markers, lang]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-teal-600" />
            {lang === 'no' ? 'Vevsabnormaliteter' : 'Tissue Abnormalities'}
          </h3>
          {markers.length > 0 && (
            <div className="mt-1">
              <MarkerSummary markers={markers} lang={lang} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onSelectForDiagram && (
            <button
              type="button"
              onClick={onSelectForDiagram}
              className="px-3 py-1.5 text-sm border border-teal-300 text-teal-700 rounded-lg
                        hover:bg-teal-50 flex items-center gap-1"
            >
              <Target className="w-4 h-4" />
              {lang === 'no' ? 'Merk på diagram' : 'Mark on Diagram'}
            </button>
          )}
          {onGenerateNarrative && markers.length > 0 && (
            <button
              onClick={() => onGenerateNarrative(generateNarrative)}
              className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              {lang === 'no' ? 'Generer tekst' : 'Generate Text'}
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <MarkerLegend lang={lang} expanded={showLegend} onToggle={() => setShowLegend(!showLegend)} />

      {/* Quick Add */}
      <QuickAddPanel onAdd={addMarker} lang={lang} />

      {/* Marker list */}
      {markers.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Crosshair className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">
            {lang === 'no' ? 'Ingen markører lagt til' : 'No markers added'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {lang === 'no'
              ? 'Bruk hurtigtillegg-knappene ovenfor for å legge til funn'
              : 'Use quick add buttons above to add findings'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {markers.map((marker, index) => (
            <MarkerEntry
              key={marker.id || index}
              marker={marker}
              index={index}
              onChange={(updated) => updateMarker(index, updated)}
              onRemove={() => removeMarker(index)}
              lang={lang}
            />
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-blue-700">
            <p className="font-medium mb-1">{lang === 'no' ? 'Tips:' : 'Tips:'}</p>
            <ul className="space-y-0.5 text-blue-600">
              <li>
                •{' '}
                {lang === 'no'
                  ? 'TP = Triggerpunkt, LG = Ligament, TN = Sene, SK = Hud, FS = Fascie'
                  : 'TP = Trigger Point, LG = Ligament, TN = Tendon, SK = Skin, FS = Fascia'}
              </li>
              <li>
                •{' '}
                {lang === 'no'
                  ? 'Klikk "Merk på diagram" for å plassere markører visuelt på kroppsfiguren'
                  : 'Click "Mark on Diagram" to place markers visually on the body figure'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export { TISSUE_TYPES, SEVERITY_LEVELS, BODY_REGIONS };
