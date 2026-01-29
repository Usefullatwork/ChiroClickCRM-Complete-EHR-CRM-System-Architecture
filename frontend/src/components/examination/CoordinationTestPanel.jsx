/**
 * CoordinationTestPanel Component
 *
 * Cerebellar and coordination testing panel including finger-to-nose,
 * heel-to-shin, rapid alternating movements, Romberg, and gait tests.
 */

import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MinusCircle,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Finding states
const FINDING_STATES = [
  { value: 'NT', label: 'Not Tested', labelNo: 'Ikke testet', color: 'bg-gray-100 text-gray-500', icon: MinusCircle },
  { value: 'normal', label: 'Normal', labelNo: 'Normal', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  { value: 'abnormal', label: 'Abnormal', labelNo: 'Patologisk', color: 'bg-red-100 text-red-700', icon: XCircle },
  { value: 'equivocal', label: 'Equivocal', labelNo: 'Usikker', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle }
];

// Coordination tests organized by category
const COORDINATION_TESTS = {
  limb: {
    name: 'Limb Coordination',
    nameNo: 'Ekstremitetskoordinasjon',
    tests: [
      {
        id: 'finger_nose',
        name: 'Finger-to-Nose Test',
        nameNo: 'Finger-til-nese test',
        technique: 'Touch examiner finger then own nose repeatedly',
        techniqueNo: 'Berør undersøkers finger, deretter egen nese gjentatte ganger',
        bilateral: true,
        findings: {
          normal: 'Smooth, accurate movement',
          normalNo: 'Jevn, presis bevegelse',
          abnormal: 'Dysmetria, intention tremor, past-pointing',
          abnormalNo: 'Dysmetri, intensjonstremor, past-pointing'
        }
      },
      {
        id: 'finger_nose_eyes_closed',
        name: 'Finger-to-Nose (Eyes Closed)',
        nameNo: 'Finger-til-nese (Øyne lukket)',
        technique: 'Touch own nose with eyes closed',
        techniqueNo: 'Berør egen nese med lukkede øyne',
        bilateral: true,
        findings: {
          normal: 'Accurate placement',
          normalNo: 'Presis plassering',
          abnormal: 'Proprioceptive deficit if worsens',
          abnormalNo: 'Proprioseptiv defekt hvis forverres'
        }
      },
      {
        id: 'heel_shin',
        name: 'Heel-to-Shin Test',
        nameNo: 'Hæl-til-skinneben test',
        technique: 'Run heel smoothly down opposite shin',
        techniqueNo: 'Før hælen jevnt ned motsatt skinneben',
        bilateral: true,
        findings: {
          normal: 'Smooth tracking along shin',
          normalNo: 'Jevn føring langs skinnebeinet',
          abnormal: 'Ataxia, irregular path, overshooting',
          abnormalNo: 'Ataksi, ujevn bane, overskyting'
        }
      },
      {
        id: 'finger_finger',
        name: 'Finger-to-Finger Test',
        nameNo: 'Finger-til-finger test',
        technique: 'Touch index fingers together with eyes closed',
        techniqueNo: 'Berør pekefingrene sammen med lukkede øyne',
        bilateral: false,
        findings: {
          normal: 'Accurate finger meeting',
          normalNo: 'Presis møte av fingre',
          abnormal: 'Misses midline - proprioceptive loss',
          abnormalNo: 'Bommer på midtlinjen - proprioseptivt tap'
        }
      }
    ]
  },
  rapid: {
    name: 'Rapid Alternating Movements',
    nameNo: 'Raske alternerende bevegelser',
    tests: [
      {
        id: 'diadochokinesia',
        name: 'Dysdiadochokinesia',
        nameNo: 'Dysdiadokokinesi',
        technique: 'Rapidly pronate/supinate hands on thighs',
        techniqueNo: 'Rask pronasjon/supinasjon av hender på lår',
        bilateral: true,
        findings: {
          normal: 'Smooth, rhythmic movements',
          normalNo: 'Jevne, rytmiske bevegelser',
          abnormal: 'Irregular rhythm, amplitude, timing',
          abnormalNo: 'Ujevn rytme, amplitude, timing'
        }
      },
      {
        id: 'finger_tapping',
        name: 'Finger Tapping',
        nameNo: 'Fingertrommeing',
        technique: 'Tap thumb with index finger rapidly',
        techniqueNo: 'Trommer med pekefinger mot tommel raskt',
        bilateral: true,
        findings: {
          normal: 'Fast, regular rhythm',
          normalNo: 'Rask, jevn rytme',
          abnormal: 'Bradykinesia, irregular amplitude',
          abnormalNo: 'Bradykinesi, ujevn amplitude'
        }
      },
      {
        id: 'foot_tapping',
        name: 'Foot Tapping',
        nameNo: 'Fottapping',
        technique: 'Tap foot rapidly on floor',
        techniqueNo: 'Trommer foten raskt på gulvet',
        bilateral: true,
        findings: {
          normal: 'Fast, regular rhythm',
          normalNo: 'Rask, jevn rytme',
          abnormal: 'Slow, irregular, fatigues quickly',
          abnormalNo: 'Langsom, ujevn, trettbar'
        }
      }
    ]
  },
  balance: {
    name: 'Balance & Stance',
    nameNo: 'Balanse og stilling',
    tests: [
      {
        id: 'romberg',
        name: 'Romberg Test',
        nameNo: 'Rombergs test',
        technique: 'Stand feet together, eyes closed, 30 seconds',
        techniqueNo: 'Stå med føttene sammen, øyne lukket, 30 sekunder',
        bilateral: false,
        findings: {
          normal: 'Minimal sway, maintains balance',
          normalNo: 'Minimal svai, opprettholder balanse',
          abnormal: 'Falls/steps to side (positive)',
          abnormalNo: 'Faller/tar skritt til siden (positiv)'
        }
      },
      {
        id: 'sharpened_romberg',
        name: 'Sharpened Romberg (Tandem)',
        nameNo: 'Skjerpet Romberg (Tandem)',
        technique: 'Stand heel-to-toe, eyes closed',
        techniqueNo: 'Stå hæl-til-tå, øyne lukket',
        bilateral: false,
        findings: {
          normal: 'Maintains >30 seconds',
          normalNo: 'Opprettholder >30 sekunder',
          abnormal: 'Unable to maintain position',
          abnormalNo: 'Klarer ikke opprettholde stilling'
        }
      },
      {
        id: 'single_leg_stance',
        name: 'Single Leg Stance',
        nameNo: 'Enstående benstilling',
        technique: 'Stand on one leg, eyes open then closed',
        techniqueNo: 'Stå på ett ben, øyne åpne så lukket',
        bilateral: true,
        findings: {
          normal: '>30s eyes open, >5s eyes closed',
          normalNo: '>30s øyne åpne, >5s øyne lukket',
          abnormal: 'Unable to maintain or asymmetric',
          abnormalNo: 'Klarer ikke opprettholde eller asymmetrisk'
        }
      }
    ]
  },
  gait: {
    name: 'Gait Assessment',
    nameNo: 'Gangevurdering',
    tests: [
      {
        id: 'regular_gait',
        name: 'Regular Gait',
        nameNo: 'Normal gange',
        technique: 'Walk across room, observe pattern',
        techniqueNo: 'Gå over rommet, observer mønster',
        bilateral: false,
        findings: {
          normal: 'Symmetric, smooth, appropriate arm swing',
          normalNo: 'Symmetrisk, jevn, passende armsving',
          abnormal: 'Ataxic, wide-based, shuffling, etc.',
          abnormalNo: 'Ataktisk, bredbasert, shufflende, etc.'
        }
      },
      {
        id: 'tandem_gait',
        name: 'Tandem Gait',
        nameNo: 'Tandemgange',
        technique: 'Walk heel-to-toe in straight line',
        techniqueNo: 'Gå hæl-til-tå i rett linje',
        bilateral: false,
        findings: {
          normal: 'Maintains straight line without stepping out',
          normalNo: 'Opprettholder rett linje uten å tre ut',
          abnormal: 'Sways, steps out, unable to perform',
          abnormalNo: 'Svinger, trer ut, klarer ikke utføre'
        }
      },
      {
        id: 'heel_walk',
        name: 'Heel Walking',
        nameNo: 'Hælgange',
        technique: 'Walk on heels for several steps',
        techniqueNo: 'Gå på hælene noen skritt',
        bilateral: false,
        findings: {
          normal: 'Maintains dorsiflexion bilaterally',
          normalNo: 'Opprettholder dorsalfleksjon bilateralt',
          abnormal: 'Foot drop (L4-L5 weakness)',
          abnormalNo: 'Fotdropp (L4-L5 svakhet)'
        }
      },
      {
        id: 'toe_walk',
        name: 'Toe Walking',
        nameNo: 'Tågange',
        technique: 'Walk on toes for several steps',
        techniqueNo: 'Gå på tå noen skritt',
        bilateral: false,
        findings: {
          normal: 'Maintains plantar flexion bilaterally',
          normalNo: 'Opprettholder plantarfleksjon bilateralt',
          abnormal: 'Weakness (S1-S2)',
          abnormalNo: 'Svakhet (S1-S2)'
        }
      },
      {
        id: 'hop_test',
        name: 'Hopping Test',
        nameNo: 'Hoppetest',
        technique: 'Hop on each foot several times',
        techniqueNo: 'Hopp på hver fot noen ganger',
        bilateral: true,
        findings: {
          normal: 'Equal power and stability',
          normalNo: 'Lik kraft og stabilitet',
          abnormal: 'Asymmetric strength or balance',
          abnormalNo: 'Asymmetrisk styrke eller balanse'
        }
      }
    ]
  }
};

/**
 * Finding toggle button
 */
function FindingToggle({ value, onChange, disabled = false, lang = 'no' }) {
  const currentIndex = FINDING_STATES.findIndex(s => s.value === value) || 0;
  const current = FINDING_STATES[currentIndex] || FINDING_STATES[0];
  const Icon = current.icon;

  const handleClick = () => {
    if (disabled) return;
    const nextIndex = (currentIndex + 1) % FINDING_STATES.length;
    onChange(FINDING_STATES[nextIndex].value);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
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
function TestItem({ test, values, onChange, lang, showFindings = false }) {
  const leftKey = `${test.id}_left`;
  const rightKey = `${test.id}_right`;
  const notesKey = `${test.id}_notes`;

  return (
    <div className="p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h5 className="font-medium text-gray-700">
            {lang === 'no' ? test.nameNo : test.name}
          </h5>
          <p className="text-xs text-gray-500 mt-0.5">
            {lang === 'no' ? test.techniqueNo : test.technique}
          </p>
          {showFindings && (
            <div className="mt-2 text-xs space-y-0.5">
              <p className="text-green-600">✓ {lang === 'no' ? test.findings.normalNo : test.findings.normal}</p>
              <p className="text-red-600">✗ {lang === 'no' ? test.findings.abnormalNo : test.findings.abnormal}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {test.bilateral ? (
            <>
              <div className="text-center">
                <span className="text-[10px] text-gray-400 block mb-1">{lang === 'no' ? 'V' : 'L'}</span>
                <FindingToggle
                  value={values[leftKey] || 'NT'}
                  onChange={(v) => onChange({ ...values, [leftKey]: v })}
                  lang={lang}
                />
              </div>
              <div className="text-center">
                <span className="text-[10px] text-gray-400 block mb-1">{lang === 'no' ? 'H' : 'R'}</span>
                <FindingToggle
                  value={values[rightKey] || 'NT'}
                  onChange={(v) => onChange({ ...values, [rightKey]: v })}
                  lang={lang}
                />
              </div>
            </>
          ) : (
            <FindingToggle
              value={values[leftKey] || 'NT'}
              onChange={(v) => onChange({ ...values, [leftKey]: v })}
              lang={lang}
            />
          )}
        </div>
      </div>

      {/* Notes field for abnormal findings */}
      {(values[leftKey] === 'abnormal' || values[rightKey] === 'abnormal') && (
        <input
          type="text"
          value={values[notesKey] || ''}
          onChange={(e) => onChange({ ...values, [notesKey]: e.target.value })}
          placeholder={lang === 'no' ? 'Beskriv funn...' : 'Describe findings...'}
          className="mt-2 w-full px-2 py-1 text-xs border border-gray-200 rounded"
        />
      )}
    </div>
  );
}

/**
 * Category section
 */
function CategorySection({ categoryKey, category, values, onChange, lang, expanded, onToggle, showFindings }) {
  const abnormalCount = useMemo(() => {
    let count = 0;
    category.tests.forEach(test => {
      if (values[`${test.id}_left`] === 'abnormal') count++;
      if (test.bilateral && values[`${test.id}_right`] === 'abnormal') count++;
    });
    return count;
  }, [category.tests, values]);

  return (
    <div className={`border rounded-lg overflow-hidden ${abnormalCount > 0 ? 'border-red-200' : 'border-gray-200'}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          <Activity className={`w-5 h-5 ${abnormalCount > 0 ? 'text-red-600' : 'text-teal-600'}`} />
          <span className="font-medium text-gray-700">
            {lang === 'no' ? category.nameNo : category.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {abnormalCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
              {abnormalCount} {lang === 'no' ? 'patologisk' : 'abnormal'}
            </span>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="p-3 space-y-2 bg-gray-50">
          {category.tests.map(test => (
            <TestItem
              key={test.id}
              test={test}
              values={values}
              onChange={onChange}
              lang={lang}
              showFindings={showFindings}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Quick screening panel
 */
function QuickScreening({ values, onChange, lang }) {
  const quickTests = [
    { id: 'finger_nose', label: 'FTN', labelNo: 'F-N' },
    { id: 'heel_shin', label: 'HTS', labelNo: 'H-S' },
    { id: 'diadochokinesia', label: 'RAM', labelNo: 'RAB' },
    { id: 'romberg', label: 'Romberg', labelNo: 'Romberg' },
    { id: 'tandem_gait', label: 'Tandem', labelNo: 'Tandem' }
  ];

  const setAllNormal = () => {
    const updates = { ...values };
    quickTests.forEach(t => {
      updates[`${t.id}_left`] = 'normal';
      updates[`${t.id}_right`] = 'normal';
    });
    onChange(updates);
  };

  return (
    <div className="bg-teal-50 rounded-lg p-3 border border-teal-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-teal-800">
          {lang === 'no' ? 'Hurtigscreening' : 'Quick Screening'}
        </span>
        <button
          type="button"
          onClick={setAllNormal}
          className="px-2 py-1 text-xs bg-teal-600 text-white rounded hover:bg-teal-700"
        >
          {lang === 'no' ? 'Alle normale' : 'All Normal'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {quickTests.map(test => {
          const isNormal = values[`${test.id}_left`] === 'normal';
          const isAbnormal = values[`${test.id}_left`] === 'abnormal';

          return (
            <span
              key={test.id}
              className={`px-2 py-1 rounded text-xs
                         ${isNormal ? 'bg-green-100 text-green-700' :
                           isAbnormal ? 'bg-red-100 text-red-700' :
                           'bg-gray-100 text-gray-600'}`}
            >
              {lang === 'no' ? test.labelNo : test.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Main CoordinationTestPanel component
 */
export default function CoordinationTestPanel({
  values = {},
  onChange,
  lang = 'no',
  readOnly = false,
  showFindings = false,
  onGenerateNarrative
}) {
  const [expandedCategories, setExpandedCategories] = useState(new Set(['limb', 'balance', 'gait']));

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
    let abnormal = 0;

    Object.values(COORDINATION_TESTS).forEach(category => {
      category.tests.forEach(test => {
        if (values[`${test.id}_left`] && values[`${test.id}_left`] !== 'NT') {
          tested++;
          if (values[`${test.id}_left`] === 'abnormal') abnormal++;
        }
        if (test.bilateral && values[`${test.id}_right`] && values[`${test.id}_right`] !== 'NT') {
          tested++;
          if (values[`${test.id}_right`] === 'abnormal') abnormal++;
        }
      });
    });

    return { tested, abnormal };
  }, [values]);

  // Generate narrative
  const generateNarrative = useMemo(() => {
    const abnormalFindings = [];

    Object.values(COORDINATION_TESTS).forEach(category => {
      category.tests.forEach(test => {
        const leftVal = values[`${test.id}_left`];
        const rightVal = values[`${test.id}_right`];
        const notes = values[`${test.id}_notes`];

        if (leftVal === 'abnormal' || rightVal === 'abnormal') {
          const testName = lang === 'no' ? test.nameNo : test.name;
          let finding = testName;

          if (test.bilateral) {
            if (leftVal === 'abnormal' && rightVal === 'abnormal') {
              finding += ` (${lang === 'no' ? 'bilateralt patologisk' : 'bilateral abnormal'})`;
            } else if (leftVal === 'abnormal') {
              finding += ` (${lang === 'no' ? 'venstre patologisk' : 'left abnormal'})`;
            } else {
              finding += ` (${lang === 'no' ? 'høyre patologisk' : 'right abnormal'})`;
            }
          } else {
            finding += ` (${lang === 'no' ? 'patologisk' : 'abnormal'})`;
          }

          if (notes) {
            finding += `: ${notes}`;
          }

          abnormalFindings.push(finding);
        }
      });
    });

    if (abnormalFindings.length === 0) {
      if (summary.tested === 0) {
        return lang === 'no' ? 'Koordinasjonstesting ikke utført.' : 'Coordination testing not performed.';
      }
      return lang === 'no'
        ? 'Koordinasjon: Alle testede funksjoner normale. Ingen dysmetri, ataksi eller balanseforstyrrelser.'
        : 'Coordination: All tested functions normal. No dysmetria, ataxia, or balance disturbance.';
    }

    return `${lang === 'no' ? 'Koordinasjonsfunn' : 'Coordination findings'}: ${abnormalFindings.join('. ')}.`;
  }, [values, summary, lang]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {lang === 'no' ? 'Koordinasjon og cerebellar funksjon' : 'Coordination & Cerebellar Function'}
          </h3>
          {summary.tested > 0 && (
            <p className="text-sm text-gray-500">
              {summary.tested} {lang === 'no' ? 'tester' : 'tests'}
              {summary.abnormal > 0 && (
                <span className="text-red-600 ml-2">• {summary.abnormal} {lang === 'no' ? 'patologiske' : 'abnormal'}</span>
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

      {/* Quick Screening */}
      <QuickScreening values={values} onChange={onChange} lang={lang} />

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {FINDING_STATES.map(state => {
          const Icon = state.icon;
          return (
            <div key={state.value} className={`flex items-center gap-1 px-2 py-1 rounded ${state.color}`}>
              <Icon className="w-3 h-3" />
              <span>{lang === 'no' ? state.labelNo : state.label}</span>
            </div>
          );
        })}
      </div>

      {/* Test Categories */}
      <div className="space-y-2">
        {Object.entries(COORDINATION_TESTS).map(([key, category]) => (
          <CategorySection
            key={key}
            categoryKey={key}
            category={category}
            values={values}
            onChange={onChange}
            lang={lang}
            expanded={expandedCategories.has(key)}
            onToggle={() => toggleCategory(key)}
            showFindings={showFindings}
          />
        ))}
      </div>

      {/* Clinical patterns */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-blue-700">
            <p className="font-medium mb-1">{lang === 'no' ? 'Kliniske mønstre:' : 'Clinical Patterns:'}</p>
            <ul className="space-y-0.5 text-blue-600">
              <li>• {lang === 'no' ? 'Cerebellar ataksi: Dysmetri, dysdiadokokinesi, intensjonstremor' : 'Cerebellar ataxia: Dysmetria, dysdiadochokinesia, intention tremor'}</li>
              <li>• {lang === 'no' ? 'Sensorisk ataksi: Romberg positiv, forverres ved øyne lukket' : 'Sensory ataxia: Romberg positive, worsens with eyes closed'}</li>
              <li>• {lang === 'no' ? 'Vestibulær dysfunksjon: Lateralisert fall, nystagmus' : 'Vestibular dysfunction: Lateralized fall, nystagmus'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export { COORDINATION_TESTS, FINDING_STATES };
