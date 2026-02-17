/**
 * ActivatorMethodPanel Component
 *
 * Activator Method leg length analysis and spinal screening panel
 * for chiropractic assessment using the Activator protocol.
 */

import _React, { useMemo, useState } from 'react';
import {
  Zap,
  AlertTriangle,
  CheckCircle,
  MinusCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
} from 'lucide-react';

// Leg length findings
const LEG_LENGTH_FINDINGS = [
  { value: 'equal', label: 'Equal', labelNo: 'Lik', color: 'bg-green-100 text-green-700' },
  {
    value: 'right_short',
    label: 'Right Short',
    labelNo: 'Høyre kort',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    value: 'left_short',
    label: 'Left Short',
    labelNo: 'Venstre kort',
    color: 'bg-amber-100 text-amber-700',
  },
];

// Dynamic response options
const DYNAMIC_RESPONSES = [
  {
    value: 'no_change',
    label: 'No Change',
    labelNo: 'Ingen endring',
    color: 'bg-green-100 text-green-700',
  },
  {
    value: 'right_shortens',
    label: 'Right Shortens',
    labelNo: 'Høyre forkortes',
    color: 'bg-red-100 text-red-700',
  },
  {
    value: 'left_shortens',
    label: 'Left Shortens',
    labelNo: 'Venstre forkortes',
    color: 'bg-red-100 text-red-700',
  },
  {
    value: 'lengthens',
    label: 'Lengthens',
    labelNo: 'Forlenges',
    color: 'bg-blue-100 text-blue-700',
  },
];

// Palpation findings
const PALPATION_FINDINGS = [
  {
    value: 'NT',
    label: 'Not Tested',
    labelNo: 'Ikke testet',
    color: 'bg-gray-100 text-gray-500',
    icon: MinusCircle,
  },
  {
    value: 'normal',
    label: 'Normal',
    labelNo: 'Normal',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
  },
  {
    value: 'restriction',
    label: 'Restriction',
    labelNo: 'Restriksjon',
    color: 'bg-red-100 text-red-700',
    icon: AlertTriangle,
  },
];

// Activator Method tests
const ACTIVATOR_TESTS = {
  legLength: {
    name: 'Leg Length Analysis',
    nameNo: 'Benlengdeanalyse',
    description: 'Supine leg length comparison for functional assessment',
    descriptionNo: 'Ryggliggende benlengdesammenligning for funksjonell vurdering',
    tests: [
      {
        id: 'static_leg_length',
        name: 'Static Leg Length',
        nameNo: 'Statisk benlengde',
        type: 'leg_length',
        technique: 'Compare leg lengths with patient prone, feet dorsiflexed',
        techniqueNo: 'Sammenlign benlengder med pasient mageliggende, føtter dorsalflektert',
        interpretation: 'Anatomical vs functional leg length difference',
        interpretationNo: 'Anatomisk vs funksjonell benlengdeforskjell',
      },
    ],
  },
  dynamicHead: {
    name: 'Dynamic Head Tests',
    nameNo: 'Dynamiske hodetester',
    description: 'Observe leg length changes with head position changes',
    descriptionNo: 'Observer benlengdeendringer med hodeposisjonsendringer',
    tests: [
      {
        id: 'dynamic_head_lift',
        name: 'Dynamic Head Lift',
        nameNo: 'Dynamisk hodeløft',
        type: 'dynamic',
        technique: 'Patient lifts head into extension, observe leg length change',
        techniqueNo: 'Pasient løfter hodet i ekstensjon, observer benlengdeendring',
        positive: 'Cervical dysfunction indicated',
        positiveNo: 'Cervical dysfunksjon indikert',
      },
      {
        id: 'dynamic_head_rotation_right',
        name: 'Dynamic Head Rotation Right',
        nameNo: 'Dynamisk hoderotasjon høyre',
        type: 'dynamic',
        technique: 'Patient rotates head right, observe leg length change',
        techniqueNo: 'Pasient roterer hodet til høyre, observer benlengdeendring',
        positive: 'C1-C2 dysfunction',
        positiveNo: 'C1-C2 dysfunksjon',
      },
      {
        id: 'dynamic_head_rotation_left',
        name: 'Dynamic Head Rotation Left',
        nameNo: 'Dynamisk hoderotasjon venstre',
        type: 'dynamic',
        technique: 'Patient rotates head left, observe leg length change',
        techniqueNo: 'Pasient roterer hodet til venstre, observer benlengdeendring',
        positive: 'C1-C2 dysfunction',
        positiveNo: 'C1-C2 dysfunksjon',
      },
      {
        id: 'dynamic_head_flexion',
        name: 'Dynamic Head Flexion',
        nameNo: 'Dynamisk hodefleksjon',
        type: 'dynamic',
        technique: 'Patient tucks chin to chest, observe leg length change',
        techniqueNo: 'Pasient fører haken mot brystet, observer benlengdeendring',
        positive: 'Upper cervical dysfunction',
        positiveNo: 'Øvre cervical dysfunksjon',
      },
    ],
  },
  palpationScreening: {
    name: 'Palpation Screening',
    nameNo: 'Palpasjonsscreening',
    description: 'Spinal palpation for segmental dysfunction',
    descriptionNo: 'Spinal palpasjon for segmentell dysfunksjon',
    tests: [
      {
        id: 'c0_c1',
        name: 'C0-C1 (Occiput-Atlas)',
        nameNo: 'C0-C1 (Occiput-Atlas)',
        type: 'palpation',
        interpretation: 'Occipitocervical dysfunction',
        interpretationNo: 'Occipitocervical dysfunksjon',
      },
      {
        id: 'c1_c2',
        name: 'C1-C2 (Atlas-Axis)',
        nameNo: 'C1-C2 (Atlas-Axis)',
        type: 'palpation',
        interpretation: 'Atlantoaxial dysfunction',
        interpretationNo: 'Atlantoaksial dysfunksjon',
      },
      {
        id: 'c2_c3',
        name: 'C2-C3',
        nameNo: 'C2-C3',
        type: 'palpation',
        interpretation: 'Upper cervical dysfunction',
        interpretationNo: 'Øvre cervical dysfunksjon',
      },
      {
        id: 'c3_c4',
        name: 'C3-C4',
        nameNo: 'C3-C4',
        type: 'palpation',
        interpretation: 'Mid cervical dysfunction',
        interpretationNo: 'Midt-cervical dysfunksjon',
      },
      {
        id: 'c4_c5',
        name: 'C4-C5',
        nameNo: 'C4-C5',
        type: 'palpation',
        interpretation: 'Mid cervical dysfunction',
        interpretationNo: 'Midt-cervical dysfunksjon',
      },
      {
        id: 'c5_c6',
        name: 'C5-C6',
        nameNo: 'C5-C6',
        type: 'palpation',
        interpretation: 'Lower cervical dysfunction',
        interpretationNo: 'Nedre cervical dysfunksjon',
      },
      {
        id: 'c6_c7',
        name: 'C6-C7',
        nameNo: 'C6-C7',
        type: 'palpation',
        interpretation: 'Cervicothoracic junction',
        interpretationNo: 'Cervicotorakal overgang',
      },
      {
        id: 'c7_t1',
        name: 'C7-T1',
        nameNo: 'C7-T1',
        type: 'palpation',
        interpretation: 'Cervicothoracic junction',
        interpretationNo: 'Cervicotorakal overgang',
      },
    ],
  },
  thoracicScreening: {
    name: 'Thoracic Screening',
    nameNo: 'Torakal screening',
    description: 'Thoracic spine palpation screening',
    descriptionNo: 'Torakal columna palpasjonsscreening',
    tests: [
      { id: 't1_t2', name: 'T1-T2', nameNo: 'T1-T2', type: 'palpation' },
      { id: 't2_t3', name: 'T2-T3', nameNo: 'T2-T3', type: 'palpation' },
      { id: 't3_t4', name: 'T3-T4', nameNo: 'T3-T4', type: 'palpation' },
      { id: 't4_t5', name: 'T4-T5', nameNo: 'T4-T5', type: 'palpation' },
      { id: 't5_t6', name: 'T5-T6', nameNo: 'T5-T6', type: 'palpation' },
      { id: 't6_t7', name: 'T6-T7', nameNo: 'T6-T7', type: 'palpation' },
      { id: 't7_t8', name: 'T7-T8', nameNo: 'T7-T8', type: 'palpation' },
      { id: 't8_t9', name: 'T8-T9', nameNo: 'T8-T9', type: 'palpation' },
      { id: 't9_t10', name: 'T9-T10', nameNo: 'T9-T10', type: 'palpation' },
      { id: 't10_t11', name: 'T10-T11', nameNo: 'T10-T11', type: 'palpation' },
      { id: 't11_t12', name: 'T11-T12', nameNo: 'T11-T12', type: 'palpation' },
      { id: 't12_l1', name: 'T12-L1', nameNo: 'T12-L1', type: 'palpation' },
    ],
  },
  lumbarScreening: {
    name: 'Lumbar Screening',
    nameNo: 'Lumbal screening',
    description: 'Lumbar spine palpation screening',
    descriptionNo: 'Lumbal columna palpasjonsscreening',
    tests: [
      { id: 'l1_l2', name: 'L1-L2', nameNo: 'L1-L2', type: 'palpation' },
      { id: 'l2_l3', name: 'L2-L3', nameNo: 'L2-L3', type: 'palpation' },
      { id: 'l3_l4', name: 'L3-L4', nameNo: 'L3-L4', type: 'palpation' },
      { id: 'l4_l5', name: 'L4-L5', nameNo: 'L4-L5', type: 'palpation' },
      { id: 'l5_s1', name: 'L5-S1', nameNo: 'L5-S1', type: 'palpation' },
      { id: 'sacrum', name: 'Sacrum', nameNo: 'Sacrum', type: 'palpation' },
      { id: 'si_right', name: 'SI Joint Right', nameNo: 'IS-ledd høyre', type: 'palpation' },
      { id: 'si_left', name: 'SI Joint Left', nameNo: 'IS-ledd venstre', type: 'palpation' },
    ],
  },
};

/**
 * Leg length selector
 */
function LegLengthSelector({ value, onChange, lang }) {
  return (
    <div className="flex gap-2">
      {LEG_LENGTH_FINDINGS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs rounded border transition-colors ${
            value === opt.value
              ? `${opt.color} border-current`
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {lang === 'no' ? opt.labelNo : opt.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Dynamic response selector
 */
function DynamicResponseSelector({ value, onChange, lang }) {
  return (
    <div className="flex flex-wrap gap-1">
      {DYNAMIC_RESPONSES.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-2 py-1 text-xs rounded border transition-colors ${
            value === opt.value
              ? `${opt.color} border-current`
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {lang === 'no' ? opt.labelNo : opt.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Palpation finding toggle
 */
function PalpationToggle({ value, onChange, lang }) {
  const currentIndex = PALPATION_FINDINGS.findIndex((s) => s.value === value);
  const current = PALPATION_FINDINGS[currentIndex] || PALPATION_FINDINGS[0];
  const Icon = current.icon;

  const handleClick = () => {
    const nextIndex = (currentIndex + 1) % PALPATION_FINDINGS.length;
    onChange(PALPATION_FINDINGS[nextIndex].value);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                 border transition-colors ${current.color} hover:opacity-80`}
    >
      <Icon className="w-3 h-3" />
      <span>{lang === 'no' ? current.labelNo : current.label}</span>
    </button>
  );
}

/**
 * Test item based on type
 */
function TestItem({ test, values, onChange, lang, showDetails }) {
  const resultKey = `${test.id}_result`;
  const differenceKey = `${test.id}_mm`;

  if (test.type === 'leg_length') {
    return (
      <div className="p-3 bg-white rounded-lg border border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h5 className="font-medium text-gray-700">{lang === 'no' ? test.nameNo : test.name}</h5>
            {showDetails && (
              <p className="text-xs text-gray-500 mt-1">
                {lang === 'no' ? test.techniqueNo : test.technique}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <LegLengthSelector
            value={values[resultKey]}
            onChange={(v) => onChange({ ...values, [resultKey]: v })}
            lang={lang}
          />
          {(values[resultKey] === 'right_short' || values[resultKey] === 'left_short') && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">
                {lang === 'no' ? 'Differanse:' : 'Difference:'}
              </span>
              <input
                type="number"
                value={values[differenceKey] || ''}
                onChange={(e) => onChange({ ...values, [differenceKey]: e.target.value })}
                placeholder="mm"
                className="w-16 px-2 py-1 text-xs border border-gray-200 rounded"
              />
              <span className="text-xs text-gray-500">mm</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (test.type === 'dynamic') {
    const isPositive = values[resultKey] && values[resultKey] !== 'no_change';

    return (
      <div
        className={`p-3 bg-white rounded-lg border ${isPositive ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h5 className="font-medium text-gray-700">{lang === 'no' ? test.nameNo : test.name}</h5>
            {showDetails && (
              <p className="text-xs text-gray-500 mt-1">
                {lang === 'no' ? test.techniqueNo : test.technique}
              </p>
            )}
          </div>
        </div>
        <div className="mt-2">
          <DynamicResponseSelector
            value={values[resultKey]}
            onChange={(v) => onChange({ ...values, [resultKey]: v })}
            lang={lang}
          />
        </div>
        {isPositive && test.positive && (
          <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 text-xs text-amber-700">
            <Zap className="w-3 h-3 inline mr-1" />
            {lang === 'no' ? test.positiveNo : test.positive}
          </div>
        )}
      </div>
    );
  }

  // Palpation type
  const isRestriction = values[resultKey] === 'restriction';

  return (
    <div
      className={`flex items-center justify-between p-2 bg-white rounded border ${
        isRestriction ? 'border-red-200 bg-red-50' : 'border-gray-200'
      }`}
    >
      <span className="text-sm text-gray-700">{lang === 'no' ? test.nameNo : test.name}</span>
      <PalpationToggle
        value={values[resultKey] || 'NT'}
        onChange={(v) => onChange({ ...values, [resultKey]: v })}
        lang={lang}
      />
    </div>
  );
}

/**
 * Category section
 */
function CategorySection({
  _categoryKey,
  category,
  values,
  onChange,
  lang,
  expanded,
  onToggle,
  showDetails,
}) {
  const restrictionCount = useMemo(() => {
    return category.tests.filter((test) => {
      const result = values[`${test.id}_result`];
      if (test.type === 'palpation') {
        return result === 'restriction';
      }
      if (test.type === 'dynamic') {
        return result && result !== 'no_change';
      }
      return false;
    }).length;
  }, [category.tests, values]);

  return (
    <div
      className={`border rounded-lg overflow-hidden ${restrictionCount > 0 ? 'border-red-200' : 'border-gray-200'}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          <ArrowUpDown
            className={`w-5 h-5 ${restrictionCount > 0 ? 'text-red-600' : 'text-teal-600'}`}
          />
          <span className="font-medium text-gray-700">
            {lang === 'no' ? category.nameNo : category.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {restrictionCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
              {restrictionCount}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-3 space-y-2 bg-gray-50">
          {category.description && (
            <p className="text-xs text-gray-500 mb-2">
              {lang === 'no' ? category.descriptionNo : category.description}
            </p>
          )}
          {category.tests.map((test) => (
            <TestItem
              key={test.id}
              test={test}
              values={values}
              onChange={onChange}
              lang={lang}
              showDetails={showDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main ActivatorMethodPanel component
 */
export default function ActivatorMethodPanel({
  values = {},
  onChange,
  lang = 'no',
  _readOnly = false,
  showDetails = true,
  onGenerateNarrative,
}) {
  const [expandedCategories, setExpandedCategories] = useState(
    new Set(['legLength', 'dynamicHead', 'palpationScreening'])
  );

  const toggleCategory = (key) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedCategories(newExpanded);
  };

  // Calculate summary
  const summary = useMemo(() => {
    let tested = 0;
    let restrictions = 0;

    Object.values(ACTIVATOR_TESTS).forEach((category) => {
      category.tests.forEach((test) => {
        const result = values[`${test.id}_result`];
        if (result && result !== 'NT') {
          tested++;
          if (result === 'restriction' || (test.type === 'dynamic' && result !== 'no_change')) {
            restrictions++;
          }
        }
      });
    });

    return { tested, restrictions };
  }, [values]);

  // Collect all restrictions for summary
  const restrictedSegments = useMemo(() => {
    const segments = [];

    Object.values(ACTIVATOR_TESTS).forEach((category) => {
      category.tests.forEach((test) => {
        const result = values[`${test.id}_result`];
        if (result === 'restriction') {
          segments.push(lang === 'no' ? test.nameNo : test.name);
        }
      });
    });

    return segments;
  }, [values, lang]);

  // Generate narrative
  const generateNarrative = useMemo(() => {
    if (summary.tested === 0) {
      return lang === 'no'
        ? 'Aktivator metode screening ikke utført.'
        : 'Activator Method screening not performed.';
    }

    const staticLeg = values['static_leg_length_result'];
    let narrative = lang === 'no' ? 'Aktivator metode: ' : 'Activator Method: ';

    // Leg length
    if (staticLeg === 'equal') {
      narrative += lang === 'no' ? 'Benlengde lik. ' : 'Leg length equal. ';
    } else if (staticLeg === 'right_short') {
      const mm = values['static_leg_length_mm'];
      narrative +=
        lang === 'no'
          ? `Høyre ben kort${mm ? ` (${mm}mm)` : ''}. `
          : `Right leg short${mm ? ` (${mm}mm)` : ''}. `;
    } else if (staticLeg === 'left_short') {
      const mm = values['static_leg_length_mm'];
      narrative +=
        lang === 'no'
          ? `Venstre ben kort${mm ? ` (${mm}mm)` : ''}. `
          : `Left leg short${mm ? ` (${mm}mm)` : ''}. `;
    }

    // Restrictions
    if (restrictedSegments.length > 0) {
      narrative +=
        lang === 'no'
          ? `Restriksjoner funnet i: ${restrictedSegments.join(', ')}.`
          : `Restrictions found at: ${restrictedSegments.join(', ')}.`;
    } else if (summary.tested > 0) {
      narrative +=
        lang === 'no'
          ? 'Ingen segmentelle restriksjoner påvist.'
          : 'No segmental restrictions detected.';
    }

    return narrative;
  }, [values, summary, restrictedSegments, lang]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {lang === 'no' ? 'Aktivator Metode' : 'Activator Method'}
          </h3>
          <p className="text-sm text-gray-500">
            {lang === 'no'
              ? 'Benlengdeanalyse og spinal screening'
              : 'Leg length analysis and spinal screening'}
          </p>
          {summary.tested > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {summary.tested} {lang === 'no' ? 'segmenter testet' : 'segments tested'}
              {summary.restrictions > 0 && (
                <span className="text-red-600 ml-2">
                  {summary.restrictions} {lang === 'no' ? 'restriksjoner' : 'restrictions'}
                </span>
              )}
            </p>
          )}
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

      {/* Restrictions summary */}
      {restrictedSegments.length > 0 && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="font-medium text-red-800 mb-2">
            {lang === 'no' ? 'Identifiserte restriksjoner:' : 'Identified restrictions:'}
          </p>
          <div className="flex flex-wrap gap-1">
            {restrictedSegments.map((seg, idx) => (
              <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                {seg}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Test Categories */}
      <div className="space-y-2">
        {Object.entries(ACTIVATOR_TESTS).map(([key, category]) => (
          <CategorySection
            key={key}
            categoryKey={key}
            category={category}
            values={values}
            onChange={onChange}
            lang={lang}
            expanded={expandedCategories.has(key)}
            onToggle={() => toggleCategory(key)}
            showDetails={showDetails}
          />
        ))}
      </div>

      {/* Clinical notes */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-blue-700">
            <p className="font-medium mb-1">
              {lang === 'no' ? 'Aktivator protokoll:' : 'Activator Protocol:'}
            </p>
            <ul className="space-y-0.5 text-blue-600">
              <li>
                {lang === 'no'
                  ? 'Dynamisk benlengdeendring indikerer segmentell dysfunksjon'
                  : 'Dynamic leg length change indicates segmental dysfunction'}
              </li>
              <li>
                {lang === 'no'
                  ? 'Restriksjon ved palpasjon bekrefter behov for justering'
                  : 'Palpation restriction confirms need for adjustment'}
              </li>
              <li>
                {lang === 'no'
                  ? 'Re-test etter justering for å bekrefte korrigering'
                  : 'Re-test after adjustment to confirm correction'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ACTIVATOR_TESTS, LEG_LENGTH_FINDINGS, DYNAMIC_RESPONSES };
