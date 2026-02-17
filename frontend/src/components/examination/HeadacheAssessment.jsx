/**
 * HeadacheAssessment Component
 *
 * Comprehensive headache assessment including type classification,
 * location, triggers, associated symptoms, and red flag screening.
 */

import _React, { useMemo, _useState } from 'react';
import { AlertTriangle, Clock, Zap, Target, Activity, _Info, _CheckCircle } from 'lucide-react';

// Headache types with diagnostic criteria
const HEADACHE_TYPES = [
  {
    id: 'tension',
    name: 'Tension-Type Headache',
    nameNo: 'Tensjonotypehodepine',
    features: ['Bilateral', 'Pressing/tightening', 'Mild-moderate', 'Not aggravated by activity'],
    featuresNo: [
      'Bilateral',
      'Pressende/strammende',
      'Mild-moderat',
      'Ikke forverret av aktivitet',
    ],
    duration: '30 min - 7 days',
    durationNo: '30 min - 7 dager',
  },
  {
    id: 'migraine_without_aura',
    name: 'Migraine without Aura',
    nameNo: 'Migrene uten aura',
    features: [
      'Unilateral',
      'Pulsating',
      'Moderate-severe',
      'Aggravated by activity',
      'Nausea/photophobia',
    ],
    featuresNo: [
      'Unilateral',
      'Pulserende',
      'Moderat-alvorlig',
      'Forverret av aktivitet',
      'Kvalme/lysømfintlighet',
    ],
    duration: '4-72 hours',
    durationNo: '4-72 timer',
  },
  {
    id: 'migraine_with_aura',
    name: 'Migraine with Aura',
    nameNo: 'Migrene med aura',
    features: ['Visual/sensory aura', 'Aura 5-60 min before headache', 'Fully reversible'],
    featuresNo: ['Visuell/sensorisk aura', 'Aura 5-60 min før hodepine', 'Fullstendig reversibel'],
    duration: '4-72 hours',
    durationNo: '4-72 timer',
  },
  {
    id: 'cluster',
    name: 'Cluster Headache',
    nameNo: 'Klasehodepine',
    features: ['Unilateral periorbital', 'Severe', 'Autonomic symptoms', 'Restlessness'],
    featuresNo: ['Unilateral periorbital', 'Alvorlig', 'Autonome symptomer', 'Rastløshet'],
    duration: '15-180 min, multiple/day',
    durationNo: '15-180 min, flere/dag',
  },
  {
    id: 'cervicogenic',
    name: 'Cervicogenic Headache',
    nameNo: 'Cervikogen hodepine',
    features: ['Unilateral', 'Starts in neck', 'Reduced neck ROM', 'Provoked by neck movement'],
    featuresNo: [
      'Unilateral',
      'Starter i nakken',
      'Redusert nakke-ROM',
      'Utløst av nakkebevegelse',
    ],
    duration: 'Variable, related to neck position',
    durationNo: 'Variabel, relatert til nakkestilling',
  },
  {
    id: 'medication_overuse',
    name: 'Medication Overuse Headache',
    nameNo: 'Medisinoverforbrukshodepine',
    features: ['Daily/near-daily', 'Worsens with analgesics', '>15 days/month medication use'],
    featuresNo: ['Daglig/nesten daglig', 'Forverres med analgetika', '>15 dager/måned medisinbruk'],
    duration: 'Chronic',
    durationNo: 'Kronisk',
  },
];

// Pain locations
const HEADACHE_LOCATIONS = [
  { id: 'frontal', name: 'Frontal', nameNo: 'Frontal' },
  { id: 'temporal_left', name: 'Left Temporal', nameNo: 'Venstre temporal' },
  { id: 'temporal_right', name: 'Right Temporal', nameNo: 'Høyre temporal' },
  { id: 'parietal', name: 'Parietal', nameNo: 'Parietal' },
  { id: 'occipital', name: 'Occipital', nameNo: 'Oksipital' },
  { id: 'periorbital_left', name: 'Left Periorbital', nameNo: 'Venstre periorbital' },
  { id: 'periorbital_right', name: 'Right Periorbital', nameNo: 'Høyre periorbital' },
  { id: 'vertex', name: 'Vertex', nameNo: 'Vertex' },
  { id: 'diffuse', name: 'Diffuse/Global', nameNo: 'Diffus/Global' },
  { id: 'neck', name: 'Neck/Suboccipital', nameNo: 'Nakke/Suboksipital' },
];

// Pain qualities
const PAIN_QUALITIES = [
  { id: 'pressing', name: 'Pressing/Tightening', nameNo: 'Pressende/Strammende' },
  { id: 'pulsating', name: 'Pulsating/Throbbing', nameNo: 'Pulserende/Bankende' },
  { id: 'stabbing', name: 'Stabbing/Sharp', nameNo: 'Stikkende/Skarp' },
  { id: 'dull', name: 'Dull/Aching', nameNo: 'Dump/Verkende' },
  { id: 'burning', name: 'Burning', nameNo: 'Brennende' },
  { id: 'electric', name: 'Electric/Shooting', nameNo: 'Elektrisk/Skytende' },
];

// Associated symptoms
const ASSOCIATED_SYMPTOMS = [
  { id: 'nausea', name: 'Nausea', nameNo: 'Kvalme', category: 'migraine' },
  { id: 'vomiting', name: 'Vomiting', nameNo: 'Oppkast', category: 'migraine' },
  { id: 'photophobia', name: 'Photophobia', nameNo: 'Lysømfintlighet', category: 'migraine' },
  { id: 'phonophobia', name: 'Phonophobia', nameNo: 'Lydømfintlighet', category: 'migraine' },
  { id: 'osmophobia', name: 'Osmophobia', nameNo: 'Luktømfintlighet', category: 'migraine' },
  { id: 'visual_aura', name: 'Visual Aura', nameNo: 'Visuell aura', category: 'aura' },
  { id: 'sensory_aura', name: 'Sensory Aura', nameNo: 'Sensorisk aura', category: 'aura' },
  { id: 'speech_aura', name: 'Speech Disturbance', nameNo: 'Taleforstyrrelser', category: 'aura' },
  { id: 'lacrimation', name: 'Lacrimation', nameNo: 'Tåreflod', category: 'autonomic' },
  { id: 'rhinorrhea', name: 'Rhinorrhea', nameNo: 'Rennende nese', category: 'autonomic' },
  { id: 'ptosis', name: 'Ptosis', nameNo: 'Ptose', category: 'autonomic' },
  { id: 'miosis', name: 'Miosis', nameNo: 'Miose', category: 'autonomic' },
  {
    id: 'conjunctival_injection',
    name: 'Conjunctival Injection',
    nameNo: 'Konjunktival injeksjon',
    category: 'autonomic',
  },
  {
    id: 'neck_pain',
    name: 'Neck Pain/Stiffness',
    nameNo: 'Nakkesmerter/-stivhet',
    category: 'cervical',
  },
  { id: 'dizziness', name: 'Dizziness', nameNo: 'Svimmelhet', category: 'other' },
  { id: 'fatigue', name: 'Fatigue', nameNo: 'Tretthet', category: 'other' },
];

// Triggers
const TRIGGERS = [
  { id: 'stress', name: 'Stress', nameNo: 'Stress' },
  { id: 'sleep_deprivation', name: 'Sleep Deprivation', nameNo: 'Søvnmangel' },
  { id: 'oversleep', name: 'Oversleeping', nameNo: 'For mye søvn' },
  { id: 'hunger', name: 'Hunger/Fasting', nameNo: 'Sult/Faste' },
  { id: 'dehydration', name: 'Dehydration', nameNo: 'Dehydrering' },
  { id: 'alcohol', name: 'Alcohol', nameNo: 'Alkohol' },
  { id: 'caffeine', name: 'Caffeine Withdrawal', nameNo: 'Koffeinabstinens' },
  { id: 'weather', name: 'Weather Changes', nameNo: 'Værforandringer' },
  { id: 'bright_light', name: 'Bright Light', nameNo: 'Sterkt lys' },
  { id: 'loud_noise', name: 'Loud Noise', nameNo: 'Høy lyd' },
  { id: 'strong_odors', name: 'Strong Odors', nameNo: 'Sterke lukter' },
  { id: 'hormonal', name: 'Hormonal (Menstrual)', nameNo: 'Hormonelle (Menstruasjon)' },
  { id: 'food', name: 'Specific Foods', nameNo: 'Spesifikke matvarer' },
  { id: 'neck_position', name: 'Neck Position/Movement', nameNo: 'Nakkestilling/-bevegelse' },
  { id: 'exercise', name: 'Exercise', nameNo: 'Trening' },
];

// RED FLAGS - SNOOPY mnemonic
const RED_FLAGS = [
  {
    id: 'systemic',
    name: 'Systemic symptoms (fever, weight loss, cancer)',
    nameNo: 'Systemiske symptomer (feber, vekttap, kreft)',
    letter: 'S',
  },
  { id: 'neurological', name: 'Neurological deficits', nameNo: 'Nevrologiske utfall', letter: 'N' },
  {
    id: 'onset',
    name: 'Sudden Onset (thunderclap)',
    nameNo: 'Plutselig debut (tordenskrallhodepine)',
    letter: 'O',
  },
  {
    id: 'older',
    name: 'Older age onset (>50 years)',
    nameNo: 'Debut i høy alder (>50 år)',
    letter: 'O',
  },
  {
    id: 'pattern',
    name: 'Pattern change (progressive, daily)',
    nameNo: 'Mønsterendring (progressiv, daglig)',
    letter: 'P',
  },
  {
    id: 'positional',
    name: 'Positional (worse lying/standing)',
    nameNo: 'Stillingsavhengig (verre liggende/stående)',
    letter: 'P',
  },
  { id: 'papilledema', name: 'Papilledema', nameNo: 'Papilleødem', letter: 'P' },
  { id: 'pregnancy', name: 'Pregnancy/Postpartum', nameNo: 'Graviditet/Postpartum', letter: 'Y' },
];

/**
 * Chip selector for multi-select options
 */
function ChipSelector({ items, selectedIds = [], onChange, lang = 'no' }) {
  const toggleItem = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => toggleItem(item.id)}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors
                     ${
                       selectedIds.includes(item.id)
                         ? 'bg-teal-100 border-teal-300 text-teal-700 font-medium'
                         : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                     }`}
        >
          {lang === 'no' ? item.nameNo : item.name}
        </button>
      ))}
    </div>
  );
}

/**
 * Headache type selector with feature matching
 */
function HeadacheTypeSection({ values, onChange, lang }) {
  const selectedType = HEADACHE_TYPES.find((t) => t.id === values.headacheType);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">
        {lang === 'no' ? 'Hodepinetype' : 'Headache Type'}
      </h4>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
        {HEADACHE_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange({ ...values, headacheType: type.id })}
            className={`p-3 rounded-lg border text-left transition-colors
                       ${
                         values.headacheType === type.id
                           ? 'bg-teal-50 border-teal-300'
                           : 'bg-white border-gray-200 hover:bg-gray-50'
                       }`}
          >
            <span className="font-medium text-sm text-gray-700">
              {lang === 'no' ? type.nameNo : type.name}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              {lang === 'no' ? type.durationNo : type.duration}
            </p>
          </button>
        ))}
      </div>

      {selectedType && (
        <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
          <p className="text-xs font-medium text-teal-700 mb-1">
            {lang === 'no' ? 'Diagnostiske trekk:' : 'Diagnostic features:'}
          </p>
          <ul className="text-xs text-teal-600 space-y-0.5">
            {(lang === 'no' ? selectedType.featuresNo : selectedType.features).map((f, i) => (
              <li key={i}>• {f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Red flags section
 */
function RedFlagsSection({ values, onChange, lang }) {
  const hasRedFlags = (values.redFlags || []).length > 0;

  return (
    <div
      className={`p-4 rounded-lg border ${hasRedFlags ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className={`w-5 h-5 ${hasRedFlags ? 'text-red-600' : 'text-gray-400'}`} />
        <h4 className="text-sm font-medium text-gray-700">
          {lang === 'no' ? 'Røde flagg' : 'Red Flags'} (SNOOPY)
        </h4>
        {hasRedFlags && (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
            {values.redFlags.length} {lang === 'no' ? 'identifisert' : 'identified'}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {RED_FLAGS.map((flag) => (
          <label
            key={flag.id}
            className={`flex items-start gap-2 p-2 rounded cursor-pointer
                       ${(values.redFlags || []).includes(flag.id) ? 'bg-red-100' : 'hover:bg-gray-100'}`}
          >
            <input
              type="checkbox"
              checked={(values.redFlags || []).includes(flag.id)}
              onChange={(e) => {
                const current = values.redFlags || [];
                if (e.target.checked) {
                  onChange({ ...values, redFlags: [...current, flag.id] });
                } else {
                  onChange({ ...values, redFlags: current.filter((id) => id !== flag.id) });
                }
              }}
              className="mt-0.5 w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
            />
            <div>
              <span className="text-xs font-bold text-gray-400 mr-1">{flag.letter}:</span>
              <span className="text-sm text-gray-700">
                {lang === 'no' ? flag.nameNo : flag.name}
              </span>
            </div>
          </label>
        ))}
      </div>

      {hasRedFlags && (
        <div className="mt-3 p-2 bg-red-100 rounded-lg">
          <p className="text-xs text-red-700 font-medium">
            ⚠️{' '}
            {lang === 'no'
              ? 'Røde flagg identifisert - vurder henvisning/utredning!'
              : 'Red flags identified - consider referral/investigation!'}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Main HeadacheAssessment component
 */
export default function HeadacheAssessment({
  values = {},
  onChange,
  lang = 'no',
  _readOnly = false,
  onGenerateNarrative,
}) {
  // Generate narrative
  const generateNarrative = useMemo(() => {
    const parts = [];

    // Type
    if (values.headacheType) {
      const type = HEADACHE_TYPES.find((t) => t.id === values.headacheType);
      if (type) {
        parts.push(
          `${lang === 'no' ? 'Hodepinetype' : 'Headache type'}: ${lang === 'no' ? type.nameNo : type.name}`
        );
      }
    }

    // Location
    if (values.locations?.length > 0) {
      const locs = values.locations
        .map((id) => HEADACHE_LOCATIONS.find((l) => l.id === id))
        .filter(Boolean)
        .map((l) => (lang === 'no' ? l.nameNo : l.name))
        .join(', ');
      parts.push(`${lang === 'no' ? 'Lokalisasjon' : 'Location'}: ${locs}`);
    }

    // Quality
    if (values.qualities?.length > 0) {
      const quals = values.qualities
        .map((id) => PAIN_QUALITIES.find((q) => q.id === id))
        .filter(Boolean)
        .map((q) => (lang === 'no' ? q.nameNo : q.name))
        .join(', ');
      parts.push(`${lang === 'no' ? 'Kvalitet' : 'Quality'}: ${quals}`);
    }

    // Intensity
    if (values.intensity) {
      parts.push(`${lang === 'no' ? 'Intensitet' : 'Intensity'}: ${values.intensity}/10`);
    }

    // Frequency
    if (values.frequency) {
      parts.push(`${lang === 'no' ? 'Frekvens' : 'Frequency'}: ${values.frequency}`);
    }

    // Duration
    if (values.duration) {
      parts.push(`${lang === 'no' ? 'Varighet' : 'Duration'}: ${values.duration}`);
    }

    // Associated symptoms
    if (values.symptoms?.length > 0) {
      const syms = values.symptoms
        .map((id) => ASSOCIATED_SYMPTOMS.find((s) => s.id === id))
        .filter(Boolean)
        .map((s) => (lang === 'no' ? s.nameNo : s.name))
        .join(', ');
      parts.push(`${lang === 'no' ? 'Ledsagende symptomer' : 'Associated symptoms'}: ${syms}`);
    }

    // Triggers
    if (values.triggers?.length > 0) {
      const trigs = values.triggers
        .map((id) => TRIGGERS.find((t) => t.id === id))
        .filter(Boolean)
        .map((t) => (lang === 'no' ? t.nameNo : t.name))
        .join(', ');
      parts.push(`${lang === 'no' ? 'Utløsende faktorer' : 'Triggers'}: ${trigs}`);
    }

    // Red flags
    if (values.redFlags?.length > 0) {
      const flags = values.redFlags
        .map((id) => RED_FLAGS.find((f) => f.id === id))
        .filter(Boolean)
        .map((f) => (lang === 'no' ? f.nameNo : f.name))
        .join(', ');
      parts.push(`⚠️ ${lang === 'no' ? 'RØDE FLAGG' : 'RED FLAGS'}: ${flags}`);
    }

    if (parts.length === 0) {
      return lang === 'no'
        ? 'Hodepineanamnese ikke dokumentert.'
        : 'Headache history not documented.';
    }

    return `${lang === 'no' ? 'Hodepineanamnese:' : 'Headache History:'} ${parts.join('. ')}.`;
  }, [values, lang]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {lang === 'no' ? 'Hodepineutredning' : 'Headache Assessment'}
          </h3>
          <p className="text-sm text-gray-500">
            {lang === 'no'
              ? 'Klassifisering og røde flagg-screening'
              : 'Classification and red flag screening'}
          </p>
        </div>

        {onGenerateNarrative && (
          <button
            onClick={() => onGenerateNarrative(generateNarrative)}
            className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            {lang === 'no' ? 'Generer tekst' : 'Generate Text'}
          </button>
        )}
      </div>

      {/* Red Flags - Priority! */}
      <RedFlagsSection values={values} onChange={onChange} lang={lang} />

      {/* Headache Type */}
      <HeadacheTypeSection values={values} onChange={onChange} lang={lang} />

      {/* Location */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Target className="w-4 h-4" />
          {lang === 'no' ? 'Lokalisasjon' : 'Location'}
        </h4>
        <ChipSelector
          items={HEADACHE_LOCATIONS}
          selectedIds={values.locations || []}
          onChange={(v) => onChange({ ...values, locations: v })}
          lang={lang}
        />
      </div>

      {/* Quality */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          {lang === 'no' ? 'Smertekvalitet' : 'Pain Quality'}
        </h4>
        <ChipSelector
          items={PAIN_QUALITIES}
          selectedIds={values.qualities || []}
          onChange={(v) => onChange({ ...values, qualities: v })}
          lang={lang}
        />
      </div>

      {/* Intensity, Frequency, Duration */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {lang === 'no' ? 'Intensitet (VAS)' : 'Intensity (VAS)'}
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={values.intensity || ''}
            onChange={(e) => onChange({ ...values, intensity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            placeholder="0-10"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {lang === 'no' ? 'Frekvens' : 'Frequency'}
          </label>
          <input
            type="text"
            value={values.frequency || ''}
            onChange={(e) => onChange({ ...values, frequency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            placeholder={lang === 'no' ? 'f.eks. 2-3x/uke' : 'e.g. 2-3x/week'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {lang === 'no' ? 'Varighet' : 'Duration'}
          </label>
          <input
            type="text"
            value={values.duration || ''}
            onChange={(e) => onChange({ ...values, duration: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            placeholder={lang === 'no' ? 'f.eks. 4-6 timer' : 'e.g. 4-6 hours'}
          />
        </div>
      </div>

      {/* Associated Symptoms */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          {lang === 'no' ? 'Ledsagende symptomer' : 'Associated Symptoms'}
        </h4>
        <ChipSelector
          items={ASSOCIATED_SYMPTOMS}
          selectedIds={values.symptoms || []}
          onChange={(v) => onChange({ ...values, symptoms: v })}
          lang={lang}
        />
      </div>

      {/* Triggers */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {lang === 'no' ? 'Utløsende faktorer' : 'Triggers'}
        </h4>
        <ChipSelector
          items={TRIGGERS}
          selectedIds={values.triggers || []}
          onChange={(v) => onChange({ ...values, triggers: v })}
          lang={lang}
        />
      </div>

      {/* Additional notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {lang === 'no' ? 'Tilleggsnotater' : 'Additional Notes'}
        </label>
        <textarea
          value={values.notes || ''}
          onChange={(e) => onChange({ ...values, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
          rows={3}
          placeholder={
            lang === 'no'
              ? 'Ytterligere relevante opplysninger...'
              : 'Additional relevant information...'
          }
        />
      </div>
    </div>
  );
}

export {
  HEADACHE_TYPES,
  HEADACHE_LOCATIONS,
  PAIN_QUALITIES,
  ASSOCIATED_SYMPTOMS,
  TRIGGERS,
  RED_FLAGS,
};
