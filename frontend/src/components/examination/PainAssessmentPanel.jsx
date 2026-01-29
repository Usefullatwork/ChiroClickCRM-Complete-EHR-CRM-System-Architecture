/**
 * PainAssessmentPanel Component
 *
 * Comprehensive pain assessment with VAS scale, quality descriptors,
 * location, timing, and aggravating/relieving factors.
 */

import React, { useMemo, useState } from 'react';
import {
  Activity,
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Zap,
  Flame,
  Target
} from 'lucide-react';

// Pain quality descriptors
const PAIN_QUALITIES = [
  { id: 'aching', name: 'Aching', nameNo: 'Verkende', icon: '😣', category: 'nociceptive' },
  { id: 'sharp', name: 'Sharp', nameNo: 'Skarp', icon: '⚡', category: 'nociceptive' },
  { id: 'stabbing', name: 'Stabbing', nameNo: 'Stikkende', icon: '🗡️', category: 'nociceptive' },
  { id: 'throbbing', name: 'Throbbing', nameNo: 'Bankende', icon: '💓', category: 'nociceptive' },
  { id: 'dull', name: 'Dull', nameNo: 'Dump', icon: '😶', category: 'nociceptive' },
  { id: 'burning', name: 'Burning', nameNo: 'Brennende', icon: '🔥', category: 'neuropathic' },
  { id: 'tingling', name: 'Tingling', nameNo: 'Prikkende', icon: '✨', category: 'neuropathic' },
  { id: 'numbness', name: 'Numbness', nameNo: 'Nummenhet', icon: '🧊', category: 'neuropathic' },
  { id: 'electric', name: 'Electric/Shooting', nameNo: 'Elektrisk/Skytende', icon: '⚡', category: 'neuropathic' },
  { id: 'pins_needles', name: 'Pins & Needles', nameNo: 'Prikking', icon: '📍', category: 'neuropathic' },
  { id: 'cramping', name: 'Cramping', nameNo: 'Krampaktig', icon: '💪', category: 'nociceptive' },
  { id: 'pressure', name: 'Pressure', nameNo: 'Trykk', icon: '⬇️', category: 'nociceptive' }
];

// Pain timing patterns
const TIMING_PATTERNS = [
  { id: 'constant', name: 'Constant', nameNo: 'Konstant' },
  { id: 'intermittent', name: 'Intermittent', nameNo: 'Periodisk' },
  { id: 'morning', name: 'Worse in morning', nameNo: 'Verre om morgenen' },
  { id: 'evening', name: 'Worse in evening', nameNo: 'Verre om kvelden' },
  { id: 'night', name: 'Worse at night', nameNo: 'Verre om natten' },
  { id: 'activity', name: 'With activity', nameNo: 'Ved aktivitet' },
  { id: 'rest', name: 'At rest', nameNo: 'I hvile' },
  { id: 'progressive', name: 'Getting worse', nameNo: 'Forverres' },
  { id: 'improving', name: 'Getting better', nameNo: 'Bedres' },
  { id: 'stable', name: 'Stable', nameNo: 'Stabil' }
];

// Common aggravating factors
const AGGRAVATING_FACTORS = [
  { id: 'sitting', name: 'Sitting', nameNo: 'Sitting' },
  { id: 'standing', name: 'Standing', nameNo: 'Ståing' },
  { id: 'walking', name: 'Walking', nameNo: 'Gåing' },
  { id: 'bending', name: 'Bending', nameNo: 'Bøying' },
  { id: 'lifting', name: 'Lifting', nameNo: 'Løfting' },
  { id: 'twisting', name: 'Twisting', nameNo: 'Vridning' },
  { id: 'reaching', name: 'Reaching', nameNo: 'Strekking' },
  { id: 'coughing', name: 'Coughing/Sneezing', nameNo: 'Hosting/Nysing' },
  { id: 'stairs', name: 'Stairs', nameNo: 'Trapper' },
  { id: 'driving', name: 'Driving', nameNo: 'Bilkjøring' },
  { id: 'sleep_position', name: 'Certain sleep positions', nameNo: 'Visse sovstillinger' },
  { id: 'weather', name: 'Weather changes', nameNo: 'Værforandringer' },
  { id: 'stress', name: 'Stress', nameNo: 'Stress' },
  { id: 'cold', name: 'Cold', nameNo: 'Kulde' }
];

// Common relieving factors
const RELIEVING_FACTORS = [
  { id: 'rest', name: 'Rest', nameNo: 'Hvile' },
  { id: 'movement', name: 'Movement', nameNo: 'Bevegelse' },
  { id: 'heat', name: 'Heat', nameNo: 'Varme' },
  { id: 'ice', name: 'Ice', nameNo: 'Is' },
  { id: 'medication', name: 'Medication', nameNo: 'Medisiner' },
  { id: 'position_change', name: 'Position change', nameNo: 'Stillingsskifte' },
  { id: 'lying_down', name: 'Lying down', nameNo: 'Ligge ned' },
  { id: 'massage', name: 'Massage', nameNo: 'Massasje' },
  { id: 'stretching', name: 'Stretching', nameNo: 'Tøying' },
  { id: 'pressure', name: 'Pressure', nameNo: 'Trykk' }
];

// Pain locations
const PAIN_LOCATIONS = [
  { id: 'head', name: 'Head', nameNo: 'Hode' },
  { id: 'neck', name: 'Neck', nameNo: 'Nakke' },
  { id: 'upper_back', name: 'Upper Back', nameNo: 'Øvre rygg' },
  { id: 'mid_back', name: 'Mid Back', nameNo: 'Midtre rygg' },
  { id: 'lower_back', name: 'Lower Back', nameNo: 'Korsrygg' },
  { id: 'shoulder_left', name: 'Left Shoulder', nameNo: 'Venstre skulder' },
  { id: 'shoulder_right', name: 'Right Shoulder', nameNo: 'Høyre skulder' },
  { id: 'arm_left', name: 'Left Arm', nameNo: 'Venstre arm' },
  { id: 'arm_right', name: 'Right Arm', nameNo: 'Høyre arm' },
  { id: 'hand_left', name: 'Left Hand', nameNo: 'Venstre hånd' },
  { id: 'hand_right', name: 'Right Hand', nameNo: 'Høyre hånd' },
  { id: 'hip_left', name: 'Left Hip', nameNo: 'Venstre hofte' },
  { id: 'hip_right', name: 'Right Hip', nameNo: 'Høyre hofte' },
  { id: 'leg_left', name: 'Left Leg', nameNo: 'Venstre ben' },
  { id: 'leg_right', name: 'Right Leg', nameNo: 'Høyre ben' },
  { id: 'foot_left', name: 'Left Foot', nameNo: 'Venstre fot' },
  { id: 'foot_right', name: 'Right Foot', nameNo: 'Høyre fot' },
  { id: 'chest', name: 'Chest', nameNo: 'Bryst' },
  { id: 'abdomen', name: 'Abdomen', nameNo: 'Mage' }
];

/**
 * VAS Slider component
 */
function VASSlider({ value, onChange, label, labelNo, lang = 'no' }) {
  const getColor = (val) => {
    if (val <= 3) return 'bg-green-500';
    if (val <= 6) return 'bg-yellow-500';
    if (val <= 8) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getLabel = (val) => {
    if (val === 0) return lang === 'no' ? 'Ingen smerte' : 'No pain';
    if (val <= 3) return lang === 'no' ? 'Mild' : 'Mild';
    if (val <= 6) return lang === 'no' ? 'Moderat' : 'Moderate';
    if (val <= 8) return lang === 'no' ? 'Alvorlig' : 'Severe';
    return lang === 'no' ? 'Verst tenkelig' : 'Worst imaginable';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {lang === 'no' ? labelNo : label}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${getColor(value).replace('bg-', 'text-')}`}>
            {value}
          </span>
          <span className="text-xs text-gray-500">/10</span>
        </div>
      </div>

      <div className="relative">
        <input
          type="range"
          min="0"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right,
              #22c55e 0%, #22c55e 30%,
              #eab308 30%, #eab308 60%,
              #f97316 60%, #f97316 80%,
              #ef4444 80%, #ef4444 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      <p className="text-xs text-center text-gray-500">{getLabel(value)}</p>
    </div>
  );
}

/**
 * Multi-select chip group
 */
function ChipGroup({ items, selectedIds, onChange, lang = 'no' }) {
  const toggleItem = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => {
        const isSelected = selectedIds.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => toggleItem(item.id)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors
                       ${isSelected
                         ? 'bg-teal-100 border-teal-300 text-teal-700'
                         : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {item.icon && <span className="mr-1">{item.icon}</span>}
            {lang === 'no' ? item.nameNo : item.name}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Pain entry for a single location
 */
function PainEntry({ entry, index, onChange, onRemove, lang }) {
  const handleChange = (field, value) => {
    onChange({ ...entry, [field]: value });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-teal-600" />
          <select
            value={entry.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            className="text-sm font-medium border-0 bg-transparent focus:ring-0 cursor-pointer"
          >
            <option value="">{lang === 'no' ? '-- Velg lokasjon --' : '-- Select location --'}</option>
            {PAIN_LOCATIONS.map(loc => (
              <option key={loc.id} value={loc.id}>
                {lang === 'no' ? loc.nameNo : loc.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          {lang === 'no' ? 'Fjern' : 'Remove'}
        </button>
      </div>

      {/* VAS Scores */}
      <div className="grid md:grid-cols-3 gap-4">
        <VASSlider
          value={entry.current || 0}
          onChange={(v) => handleChange('current', v)}
          label="Current Pain"
          labelNo="Nåværende smerte"
          lang={lang}
        />
        <VASSlider
          value={entry.best || 0}
          onChange={(v) => handleChange('best', v)}
          label="Best (24h)"
          labelNo="Best (24t)"
          lang={lang}
        />
        <VASSlider
          value={entry.worst || 0}
          onChange={(v) => handleChange('worst', v)}
          label="Worst (24h)"
          labelNo="Verst (24t)"
          lang={lang}
        />
      </div>

      {/* Pain Quality */}
      <div>
        <h5 className="text-sm font-medium text-gray-700 mb-2">
          {lang === 'no' ? 'Smertekvalitet' : 'Pain Quality'}
        </h5>
        <ChipGroup
          items={PAIN_QUALITIES}
          selectedIds={entry.qualities || []}
          onChange={(v) => handleChange('qualities', v)}
          lang={lang}
        />
        {entry.qualities?.some(q => PAIN_QUALITIES.find(p => p.id === q)?.category === 'neuropathic') && (
          <div className="mt-2 flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
            <Zap className="w-3 h-3" />
            {lang === 'no' ? 'Nevropatiske trekk identifisert' : 'Neuropathic features identified'}
          </div>
        )}
      </div>

      {/* Timing */}
      <div>
        <h5 className="text-sm font-medium text-gray-700 mb-2">
          {lang === 'no' ? 'Tidsmønster' : 'Timing Pattern'}
        </h5>
        <ChipGroup
          items={TIMING_PATTERNS}
          selectedIds={entry.timing || []}
          onChange={(v) => handleChange('timing', v)}
          lang={lang}
        />
      </div>

      {/* Aggravating/Relieving */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-red-500" />
            {lang === 'no' ? 'Forverrende faktorer' : 'Aggravating Factors'}
          </h5>
          <ChipGroup
            items={AGGRAVATING_FACTORS}
            selectedIds={entry.aggravating || []}
            onChange={(v) => handleChange('aggravating', v)}
            lang={lang}
          />
        </div>
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-green-500" />
            {lang === 'no' ? 'Lindrende faktorer' : 'Relieving Factors'}
          </h5>
          <ChipGroup
            items={RELIEVING_FACTORS}
            selectedIds={entry.relieving || []}
            onChange={(v) => handleChange('relieving', v)}
            lang={lang}
          />
        </div>
      </div>

      {/* Radiation */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={entry.radiates || false}
            onChange={(e) => handleChange('radiates', e.target.checked)}
            className="w-4 h-4 text-teal-600 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">
            {lang === 'no' ? 'Smerten stråler ut' : 'Pain radiates'}
          </span>
        </label>
        {entry.radiates && (
          <input
            type="text"
            value={entry.radiationPattern || ''}
            onChange={(e) => handleChange('radiationPattern', e.target.value)}
            placeholder={lang === 'no' ? 'Beskriv utstråling...' : 'Describe radiation pattern...'}
            className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
          />
        )}
      </div>

      {/* Additional notes */}
      <div>
        <textarea
          value={entry.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder={lang === 'no' ? 'Tilleggsnotater...' : 'Additional notes...'}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none"
          rows={2}
        />
      </div>
    </div>
  );
}

/**
 * Main PainAssessmentPanel component
 */
export default function PainAssessmentPanel({
  values = { entries: [] },
  onChange,
  lang = 'no',
  readOnly = false,
  onGenerateNarrative
}) {
  const entries = values.entries || [];

  const addEntry = () => {
    onChange({
      ...values,
      entries: [...entries, { id: Date.now(), current: 0, best: 0, worst: 0 }]
    });
  };

  const updateEntry = (index, updatedEntry) => {
    const newEntries = [...entries];
    newEntries[index] = updatedEntry;
    onChange({ ...values, entries: newEntries });
  };

  const removeEntry = (index) => {
    onChange({
      ...values,
      entries: entries.filter((_, i) => i !== index)
    });
  };

  // Generate narrative
  const generateNarrative = useMemo(() => {
    if (entries.length === 0) {
      return lang === 'no' ? 'Ingen smerte rapportert.' : 'No pain reported.';
    }

    const narratives = entries.map(entry => {
      const location = PAIN_LOCATIONS.find(l => l.id === entry.location);
      const locationName = location ? (lang === 'no' ? location.nameNo : location.name) : '';

      const qualities = (entry.qualities || [])
        .map(q => PAIN_QUALITIES.find(p => p.id === q))
        .filter(Boolean)
        .map(q => lang === 'no' ? q.nameNo : q.name)
        .join(', ');

      let text = `${locationName}: VAS ${entry.current}/10 (${lang === 'no' ? 'beste' : 'best'} ${entry.best}/10, ${lang === 'no' ? 'verste' : 'worst'} ${entry.worst}/10)`;

      if (qualities) {
        text += `. ${lang === 'no' ? 'Kvalitet' : 'Quality'}: ${qualities}`;
      }

      if (entry.radiates && entry.radiationPattern) {
        text += `. ${lang === 'no' ? 'Stråler til' : 'Radiates to'}: ${entry.radiationPattern}`;
      }

      return text;
    });

    return `${lang === 'no' ? 'Smertevurdering:' : 'Pain Assessment:'} ${narratives.join('. ')}.`;
  }, [entries, lang]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {lang === 'no' ? 'Smertevurdering' : 'Pain Assessment'}
          </h3>
          {entries.length > 0 && (
            <p className="text-sm text-gray-500">
              {entries.length} {lang === 'no' ? 'smerteområder' : 'pain areas'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onGenerateNarrative && entries.length > 0 && (
            <button
              onClick={() => onGenerateNarrative(generateNarrative)}
              className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              {lang === 'no' ? 'Generer tekst' : 'Generate Text'}
            </button>
          )}
          <button
            type="button"
            onClick={addEntry}
            disabled={readOnly}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700
                      disabled:opacity-50"
          >
            + {lang === 'no' ? 'Legg til smerte' : 'Add Pain Location'}
          </button>
        </div>
      </div>

      {/* Pain Entries */}
      {entries.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">
            {lang === 'no' ? 'Ingen smerteområder registrert' : 'No pain areas recorded'}
          </p>
          <button
            type="button"
            onClick={addEntry}
            className="mt-2 text-teal-600 hover:text-teal-700 text-sm font-medium"
          >
            + {lang === 'no' ? 'Legg til første smerteområde' : 'Add first pain location'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <PainEntry
              key={entry.id || index}
              entry={entry}
              index={index}
              onChange={(updated) => updateEntry(index, updated)}
              onRemove={() => removeEntry(index)}
              lang={lang}
            />
          ))}
        </div>
      )}

      {/* Red flags */}
      {entries.some(e => e.worst >= 9 || e.qualities?.includes('numbness')) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">
              {lang === 'no' ? 'Røde flagg identifisert' : 'Red Flags Identified'}
            </span>
          </div>
          <ul className="mt-2 text-sm text-red-600 space-y-1 ml-7">
            {entries.some(e => e.worst >= 9) && (
              <li>• {lang === 'no' ? 'Alvorlig smerteintensitet (≥9/10)' : 'Severe pain intensity (≥9/10)'}</li>
            )}
            {entries.some(e => e.qualities?.includes('numbness')) && (
              <li>• {lang === 'no' ? 'Nummenhet rapportert - vurder nevrologisk undersøkelse' : 'Numbness reported - consider neurological examination'}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export { PAIN_QUALITIES, TIMING_PATTERNS, AGGRAVATING_FACTORS, RELIEVING_FACTORS, PAIN_LOCATIONS };
