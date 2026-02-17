/**
 * DynamicPositionalTestPanel Component
 *
 * Dynamic positional muscle testing panel for challenge testing
 * to identify dysfunctional areas through position-specific weakness.
 */

import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MinusCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';

// Finding states
const FINDING_STATES = [
  {
    value: 'NT',
    label: 'Not Tested',
    labelNo: 'Ikke testet',
    color: 'bg-gray-100 text-gray-500',
    icon: MinusCircle,
  },
  {
    value: 'strong',
    label: 'Strong/Locked',
    labelNo: 'Sterk/låst',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
  },
  {
    value: 'weak',
    label: 'Weak/Unlocked',
    labelNo: 'Svak/ikke-låst',
    color: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
];

// Dynamic positional tests
const DYNAMIC_TESTS = {
  baseline: {
    name: 'Baseline Testing',
    nameNo: 'Baseline testing',
    description: 'Establish baseline indicator muscle strength before challenge testing',
    descriptionNo: 'Etabler baseline indikatormuskel styrke før challenge-testing',
    tests: [
      {
        id: 'baseline_deltoid',
        name: 'Baseline Deltoid Anterior',
        nameNo: 'Baseline deltoid anterior',
        technique: 'Test shoulder flexion strength with patient seated, arm forward',
        techniqueNo: 'Test skulderstyrke med pasient sittende, arm fremover',
        interpretation: 'Must be strong to proceed with challenge testing',
        interpretationNo: 'Må være sterk for å fortsette med challenge-testing',
      },
    ],
  },
  cervical: {
    name: 'Cervical Challenges',
    nameNo: 'Cervical challenges',
    description: 'Test indicator muscle in various cervical positions',
    descriptionNo: 'Test indikatormuskel i ulike cervical posisjoner',
    tests: [
      {
        id: 'cervical_flexion_challenge',
        name: 'Cervical Flexion Challenge',
        nameNo: 'Cervical fleksjon challenge',
        technique: 'Patient flexes neck fully, retest indicator muscle',
        techniqueNo: 'Pasient flekterer nakken helt, retest indikatormuskel',
        positive: 'Suboccipital/upper cervical dysfunction',
        positiveNo: 'Suboksipital/øvre cervical dysfunksjon',
      },
      {
        id: 'cervical_extension_challenge',
        name: 'Cervical Extension Challenge',
        nameNo: 'Cervical ekstensjon challenge',
        technique: 'Patient extends neck fully, retest indicator muscle',
        techniqueNo: 'Pasient ekstenderer nakken helt, retest indikatormuskel',
        positive: 'Lower cervical/thoracic junction dysfunction',
        positiveNo: 'Nedre cervical/thoracic overgang dysfunksjon',
      },
      {
        id: 'cervical_rotation_right',
        name: 'Cervical Rotation Right Challenge',
        nameNo: 'Cervical rotasjon høyre challenge',
        technique: 'Patient rotates head fully right, retest indicator',
        techniqueNo: 'Pasient roterer hodet helt til høyre, retest indikator',
        positive: 'C1-C2 dysfunction, vertebral artery',
        positiveNo: 'C1-C2 dysfunksjon, vertebral arterie',
      },
      {
        id: 'cervical_rotation_left',
        name: 'Cervical Rotation Left Challenge',
        nameNo: 'Cervical rotasjon venstre challenge',
        technique: 'Patient rotates head fully left, retest indicator',
        techniqueNo: 'Pasient roterer hodet helt til venstre, retest indikator',
        positive: 'C1-C2 dysfunction, vertebral artery',
        positiveNo: 'C1-C2 dysfunksjon, vertebral arterie',
      },
      {
        id: 'cervical_lateral_right',
        name: 'Cervical Lateral Flexion Right',
        nameNo: 'Cervical lateral fleksjon høyre',
        technique: 'Patient tilts head right, retest indicator',
        techniqueNo: 'Pasient vipper hodet til høyre, retest indikator',
        positive: 'Ipsilateral scalene/SCM involvement',
        positiveNo: 'Ipsilateral scalene/SCM involvering',
      },
      {
        id: 'cervical_lateral_left',
        name: 'Cervical Lateral Flexion Left',
        nameNo: 'Cervical lateral fleksjon venstre',
        technique: 'Patient tilts head left, retest indicator',
        techniqueNo: 'Pasient vipper hodet til venstre, retest indikator',
        positive: 'Ipsilateral scalene/SCM involvement',
        positiveNo: 'Ipsilateral scalene/SCM involvering',
      },
    ],
  },
  tmj: {
    name: 'TMJ Challenges',
    nameNo: 'TMJ challenges',
    description: 'Test indicator muscle with TMJ position changes',
    descriptionNo: 'Test indikatormuskel med TMJ posisjonsendringer',
    tests: [
      {
        id: 'jaw_open_challenge',
        name: 'Jaw Maximum Opening Challenge',
        nameNo: 'Kjeve maksimal åpning challenge',
        technique: 'Patient opens jaw fully, retest indicator',
        techniqueNo: 'Pasient åpner kjeven helt, retest indikator',
        positive: 'TMJ dysfunction, C1-C2 instability',
        positiveNo: 'TMJ dysfunksjon, C1-C2 instabilitet',
      },
      {
        id: 'lateral_deviation_right',
        name: 'Lateral Mandible Deviation Right',
        nameNo: 'Lateral mandibel deviasjon høyre',
        technique: 'Patient deviates jaw right, retest indicator',
        techniqueNo: 'Pasient devierer kjeven til høyre, retest indikator',
        positive: 'Ipsilateral TMJ, SCM, scalene',
        positiveNo: 'Ipsilateral TMJ, SCM, scalene',
      },
      {
        id: 'lateral_deviation_left',
        name: 'Lateral Mandible Deviation Left',
        nameNo: 'Lateral mandibel deviasjon venstre',
        technique: 'Patient deviates jaw left, retest indicator',
        techniqueNo: 'Pasient devierer kjeven til venstre, retest indikator',
        positive: 'Ipsilateral TMJ, SCM, scalene',
        positiveNo: 'Ipsilateral TMJ, SCM, scalene',
      },
      {
        id: 'teeth_clenched',
        name: 'Teeth Clenched Challenge',
        nameNo: 'Tenner sammenbitt challenge',
        technique: 'Patient clenches teeth firmly, retest indicator',
        techniqueNo: 'Pasient biter tennene sammen, retest indikator',
        positive: 'Masticatory muscle tension, TMJ dysfunction',
        positiveNo: 'Tyggemuskulatur spenning, TMJ dysfunksjon',
      },
    ],
  },
  visual: {
    name: 'Visual Challenges',
    nameNo: 'Visuelle challenges',
    description: 'Test indicator muscle with eye position changes',
    descriptionNo: 'Test indikatormuskel med øyeposisjonsendringer',
    tests: [
      {
        id: 'eyes_closed',
        name: 'Eyes Closed Challenge',
        nameNo: 'Øyne lukket challenge',
        technique: 'Patient closes eyes, retest indicator',
        techniqueNo: 'Pasient lukker øynene, retest indikator',
        positive: 'Visual-vestibular integration dysfunction',
        positiveNo: 'Visuell-vestibulær integrasjon dysfunksjon',
      },
      {
        id: 'gaze_right',
        name: 'Maximum Right Gaze Challenge',
        nameNo: 'Øyne maksimal høyre gaze',
        technique: 'Patient looks maximally right, retest indicator',
        techniqueNo: 'Pasient ser maksimalt til høyre, retest indikator',
        positive: 'Oculomotor dysfunction',
        positiveNo: 'Okulomotorisk dysfunksjon',
      },
      {
        id: 'gaze_left',
        name: 'Maximum Left Gaze Challenge',
        nameNo: 'Øyne maksimal venstre gaze',
        technique: 'Patient looks maximally left, retest indicator',
        techniqueNo: 'Pasient ser maksimalt til venstre, retest indikator',
        positive: 'Oculomotor dysfunction',
        positiveNo: 'Okulomotorisk dysfunksjon',
      },
      {
        id: 'gaze_up',
        name: 'Maximum Up Gaze Challenge',
        nameNo: 'Øyne maksimal oppover gaze',
        technique: 'Patient looks maximally up, retest indicator',
        techniqueNo: 'Pasient ser maksimalt oppover, retest indikator',
        positive: 'Suboccipital/cervical extension involvement',
        positiveNo: 'Suboksipital/cervical ekstensjon involvering',
      },
      {
        id: 'gaze_down',
        name: 'Maximum Down Gaze Challenge',
        nameNo: 'Øyne maksimal nedover gaze',
        technique: 'Patient looks maximally down, retest indicator',
        techniqueNo: 'Pasient ser maksimalt nedover, retest indikator',
        positive: 'Cervical flexion involvement',
        positiveNo: 'Cervical fleksjon involvering',
      },
    ],
  },
};

/**
 * Finding toggle button
 */
function FindingToggle({ value, onChange, disabled = false, lang = 'no' }) {
  const currentIndex = FINDING_STATES.findIndex((s) => s.value === value);
  const current = FINDING_STATES[currentIndex] || FINDING_STATES[0];
  const Icon = current.icon;

  const handleClick = () => {
    if (disabled) {
      return;
    }
    const nextIndex = (currentIndex + 1) % FINDING_STATES.length;
    onChange(FINDING_STATES[nextIndex].value);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium
                 border transition-colors ${current.color}
                 ${disabled ? 'opacity-50' : 'hover:opacity-80'}`}
    >
      <Icon className="w-3 h-3" />
      <span>{lang === 'no' ? current.labelNo : current.label}</span>
    </button>
  );
}

/**
 * Test item component
 */
function TestItem({ test, values, onChange, lang, showDetails = false }) {
  const resultKey = `${test.id}_result`;
  const notesKey = `${test.id}_notes`;
  const isWeak = values[resultKey] === 'weak';

  return (
    <div
      className={`p-3 bg-white rounded-lg border ${isWeak ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
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

        <FindingToggle
          value={values[resultKey] || 'NT'}
          onChange={(v) => onChange({ ...values, [resultKey]: v })}
          lang={lang}
        />
      </div>

      {/* Show interpretation for weak findings */}
      {isWeak && test.positive && (
        <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 text-xs text-amber-700">
          <Zap className="w-3 h-3 inline mr-1" />
          {lang === 'no' ? test.positiveNo : test.positive}
        </div>
      )}

      {/* Notes for weak findings */}
      {isWeak && (
        <input
          type="text"
          value={values[notesKey] || ''}
          onChange={(e) => onChange({ ...values, [notesKey]: e.target.value })}
          placeholder={lang === 'no' ? 'Tilleggsnotater...' : 'Additional notes...'}
          className="mt-2 w-full px-2 py-1 text-xs border border-gray-200 rounded"
        />
      )}
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
  const weakCount = useMemo(() => {
    return category.tests.filter((test) => values[`${test.id}_result`] === 'weak').length;
  }, [category.tests, values]);

  return (
    <div
      className={`border rounded-lg overflow-hidden ${weakCount > 0 ? 'border-red-200' : 'border-gray-200'}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          <Activity className={`w-5 h-5 ${weakCount > 0 ? 'text-red-600' : 'text-teal-600'}`} />
          <div className="text-left">
            <span className="font-medium text-gray-700">
              {lang === 'no' ? category.nameNo : category.name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {weakCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
              {weakCount} {lang === 'no' ? 'svak' : 'weak'}
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
          <p className="text-xs text-gray-500 mb-2">
            {lang === 'no' ? category.descriptionNo : category.description}
          </p>
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
 * Main DynamicPositionalTestPanel component
 */
export default function DynamicPositionalTestPanel({
  values = {},
  onChange,
  lang = 'no',
  _readOnly = false,
  showDetails = true,
  onGenerateNarrative,
}) {
  const [expandedCategories, setExpandedCategories] = useState(new Set(['baseline', 'cervical']));

  const toggleCategory = (key) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedCategories(newExpanded);
  };

  // Check if baseline is strong
  const baselineStrong = values['baseline_deltoid_result'] === 'strong';

  // Calculate summary
  const summary = useMemo(() => {
    let tested = 0;
    let weak = 0;

    Object.values(DYNAMIC_TESTS).forEach((category) => {
      category.tests.forEach((test) => {
        const result = values[`${test.id}_result`];
        if (result && result !== 'NT') {
          tested++;
          if (result === 'weak') {
            weak++;
          }
        }
      });
    });

    return { tested, weak };
  }, [values]);

  // Identify dysfunctional areas
  const dysfunctionalAreas = useMemo(() => {
    const areas = [];

    Object.values(DYNAMIC_TESTS).forEach((category) => {
      category.tests.forEach((test) => {
        if (values[`${test.id}_result`] === 'weak' && test.positive) {
          areas.push({
            test: lang === 'no' ? test.nameNo : test.name,
            area: lang === 'no' ? test.positiveNo : test.positive,
          });
        }
      });
    });

    return areas;
  }, [values, lang]);

  // Generate narrative
  const generateNarrative = useMemo(() => {
    if (summary.tested === 0) {
      return lang === 'no'
        ? 'Dynamisk posisjonell testing ikke utført.'
        : 'Dynamic positional testing not performed.';
    }

    if (!baselineStrong) {
      return lang === 'no'
        ? 'Dynamisk posisjonell testing: Baseline indikatormuskel ikke sterk nok for gyldig testing.'
        : 'Dynamic positional testing: Baseline indicator muscle not strong enough for valid testing.';
    }

    if (summary.weak === 0) {
      return lang === 'no'
        ? 'Dynamisk posisjonell testing: Alle challenge-tester negative. Ingen posisjonsavhengig svakhet påvist.'
        : 'Dynamic positional testing: All challenge tests negative. No position-dependent weakness detected.';
    }

    const areasList = dysfunctionalAreas.map((a) => a.area).join('; ');
    return lang === 'no'
      ? `Dynamisk posisjonell testing: ${summary.weak} positive challenges indikerer dysfunksjon i: ${areasList}.`
      : `Dynamic positional testing: ${summary.weak} positive challenges indicate dysfunction in: ${areasList}.`;
  }, [values, summary, baselineStrong, dysfunctionalAreas, lang]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {lang === 'no' ? 'Dynamisk Posisjonell Testing' : 'Dynamic Positional Testing'}
          </h3>
          <p className="text-sm text-gray-500">
            {lang === 'no'
              ? 'Challenge-testing for å identifisere dysfunksjonelle områder'
              : 'Challenge testing to identify dysfunctional areas'}
          </p>
          {summary.tested > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {summary.tested} {lang === 'no' ? 'tester' : 'tests'}
              {summary.weak > 0 && (
                <span className="text-red-600 ml-2">
                  {summary.weak} {lang === 'no' ? 'svake' : 'weak'}
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

      {/* Baseline warning */}
      {!baselineStrong && summary.tested > 0 && (
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              {lang === 'no'
                ? 'Baseline indikatormuskel må være sterk for gyldig challenge-testing'
                : 'Baseline indicator muscle must be strong for valid challenge testing'}
            </p>
          </div>
        </div>
      )}

      {/* Dysfunctional areas summary */}
      {dysfunctionalAreas.length > 0 && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="font-medium text-red-800 mb-2">
            {lang === 'no'
              ? 'Identifiserte dysfunksjonelle områder:'
              : 'Identified dysfunctional areas:'}
          </p>
          <ul className="space-y-1">
            {dysfunctionalAreas.map((area, idx) => (
              <li key={idx} className="text-sm text-red-700 flex items-center gap-2">
                <Zap className="w-3 h-3" />
                <span className="font-medium">{area.test}:</span>
                <span>{area.area}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Test Categories */}
      <div className="space-y-2">
        {Object.entries(DYNAMIC_TESTS).map(([key, category]) => (
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
              {lang === 'no' ? 'Kliniske prinsipper:' : 'Clinical Principles:'}
            </p>
            <ul className="space-y-0.5 text-blue-600">
              <li>
                {lang === 'no'
                  ? 'Svak i posisjon = dysfunksjon i område assosiert med posisjonen'
                  : 'Weak in position = dysfunction in area associated with position'}
              </li>
              <li>
                {lang === 'no'
                  ? 'Konsistent svakhet indikerer primær dysfunksjon'
                  : 'Consistent weakness indicates primary dysfunction'}
              </li>
              <li>
                {lang === 'no'
                  ? 'Bruk funn til å veilede behandling'
                  : 'Use findings to guide treatment'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export { DYNAMIC_TESTS, FINDING_STATES };
