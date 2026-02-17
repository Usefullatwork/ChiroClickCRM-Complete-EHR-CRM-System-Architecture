/**
 * NerveTensionTests Component
 *
 * Neural tension / neurodynamic testing panel including SLR, Slump,
 * Upper Limb Tension Tests (ULTT), femoral nerve stretch, and more.
 */

import _React, { useMemo, useState } from 'react';
import {
  Zap,
  AlertTriangle,
  _CheckCircle,
  _XCircle,
  _MinusCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Map,
} from 'lucide-react';
import LowerExtremityDiagram from './LowerExtremityDiagram';
import UpperExtremityDiagram from './UpperExtremityDiagram';

// Finding states
const FINDING_STATES = [
  { value: 'NT', label: 'Not Tested', labelNo: 'Ikke testet', color: 'bg-gray-100 text-gray-500' },
  {
    value: 'negative',
    label: 'Negative',
    labelNo: 'Negativ',
    color: 'bg-green-100 text-green-700',
  },
  { value: 'positive', label: 'Positive', labelNo: 'Positiv', color: 'bg-red-100 text-red-700' },
  {
    value: 'equivocal',
    label: 'Equivocal',
    labelNo: 'Usikker',
    color: 'bg-amber-100 text-amber-700',
  },
];

// Nerve tension tests organized by region
const NERVE_TENSION_TESTS = {
  lowerLimb: {
    name: 'Lower Limb Neural Tension',
    nameNo: 'Underekstremitet nervestrekk',
    tests: [
      {
        id: 'slr',
        name: 'Straight Leg Raise (SLR)',
        nameNo: 'Strakt benløft (SLR)',
        nerve: 'Sciatic (L4-S3)',
        nerveNo: 'Isjiasnerven (L4-S3)',
        technique: 'Lift leg with knee extended. Note angle of symptom reproduction.',
        techniqueNo: 'Løft benet med kneet ekstendert. Noter vinkel for symptomreproduksjon.',
        sensitizers: ['Ankle dorsiflexion', 'Hip adduction', 'Hip internal rotation'],
        sensitizersNo: ['Ankeldorsalfleksjon', 'Hofteadduksjon', 'Hofte intern rotasjon'],
        positive: 'Radiating leg pain below knee <70°',
        positiveNo: 'Utstrålende bensmerter under kneet <70°',
        bilateral: true,
      },
      {
        id: 'crossed_slr',
        name: 'Crossed SLR (Well Leg Raise)',
        nameNo: 'Krysset SLR',
        nerve: 'Sciatic - indicates central disc',
        nerveNo: 'Isjiasnerven - indikerer sentral diskusprolaps',
        technique: 'SLR on unaffected side reproduces symptoms in affected leg.',
        techniqueNo: 'SLR på uaffisert side reproduserer symptomer i affisert ben.',
        positive: 'Pain in opposite leg (highly specific for disc herniation)',
        positiveNo: 'Smerte i motsatt ben (høy spesifisitet for diskusprolaps)',
        bilateral: true,
      },
      {
        id: 'bragard',
        name: "Bragard's Test",
        nameNo: 'Bragards test',
        nerve: 'Sciatic - sensitizing maneuver',
        nerveNo: 'Isjiasnerven - sensitiserende manøver',
        technique: 'Lower leg slightly from SLR endpoint, then dorsiflex ankle.',
        techniqueNo: 'Senk benet litt fra SLR endepunkt, deretter dorsalflexter ankelen.',
        positive: 'Return of radiating symptoms',
        positiveNo: 'Gjenkomst av utstrålende symptomer',
        bilateral: true,
      },
      {
        id: 'slump',
        name: 'Slump Test',
        nameNo: 'Slump-test',
        nerve: 'Entire neuraxis (dura, spinal cord, sciatic)',
        nerveNo: 'Hele nervesystemet (dura, ryggmarg, isjiasnerven)',
        technique: 'Sitting: flex spine, neck, extend knee, dorsiflex ankle.',
        techniqueNo: 'Sittende: flekter rygg, nakke, ekstender kne, dorsalflekter ankel.',
        sensitizers: ['Cervical flexion', 'Knee extension', 'Ankle dorsiflexion'],
        sensitizersNo: ['Cervikalfleksjon', 'Kneekstensjon', 'Ankeldorsalfleksjon'],
        positive: 'Reproduction of symptoms, relieved by neck extension',
        positiveNo: 'Reproduksjon av symptomer, lindres ved nakkeekstensjon',
        bilateral: true,
      },
      {
        id: 'femoral_stretch',
        name: 'Femoral Nerve Stretch',
        nameNo: 'Femoral nerve strekk',
        nerve: 'Femoral (L2-L4)',
        nerveNo: 'N. femoralis (L2-L4)',
        technique: 'Prone: flex knee, extend hip while stabilizing pelvis.',
        techniqueNo: 'Mageliggende: flekter kne, ekstender hofte mens bekkenet stabiliseres.',
        sensitizers: ['Knee flexion', 'Hip extension'],
        sensitizersNo: ['Knefleksjon', 'Hofteekstensjon'],
        positive: 'Anterior thigh pain radiating to knee',
        positiveNo: 'Fremre lårsmerter som stråler til kne',
        bilateral: true,
      },
      {
        id: 'prone_knee_bend',
        name: 'Prone Knee Bend (PKB)',
        nameNo: 'Mageliggende knefleksjon',
        nerve: 'Femoral (L2-L4)',
        nerveNo: 'N. femoralis (L2-L4)',
        technique: 'Prone: passively flex knee to heel touching buttock.',
        techniqueNo: 'Mageliggende: passiv knefleksjon til hælen berører setet.',
        positive: 'Anterior thigh pain, hip flexion to relieve',
        positiveNo: 'Fremre lårsmerter, hoftefleksjon lindrer',
        bilateral: true,
      },
      {
        id: 'saphenous',
        name: 'Saphenous Nerve Test',
        nameNo: 'Saphenusnerve test',
        nerve: 'Saphenous (L3-L4)',
        nerveNo: 'N. saphenus (L3-L4)',
        technique: 'Prone: hip extension + adduction + knee flexion.',
        techniqueNo: 'Mageliggende: hofteekstensjon + adduksjon + knefleksjon.',
        positive: 'Medial knee/leg pain',
        positiveNo: 'Medial kne/ben smerte',
        bilateral: true,
      },
    ],
  },
  upperLimb: {
    name: 'Upper Limb Tension Tests (ULTT)',
    nameNo: 'Overekstremitet nervestrekk (ULTT)',
    tests: [
      {
        id: 'ultt1_median',
        name: 'ULTT1 - Median Nerve (Elvey)',
        nameNo: 'ULTT1 - N. medianus (Elvey)',
        nerve: 'Median (C5-T1)',
        nerveNo: 'N. medianus (C5-T1)',
        technique:
          'Shoulder depression → abduction 90° → supination → wrist/finger extension → elbow extension → lateral neck flexion away.',
        techniqueNo:
          'Skulder depresjon → abduksjon 90° → supinasjon → håndledd/finger ekstensjon → albue ekstensjon → lateral nakkefleksjon bort.',
        sensitizers: ['Cervical lateral flexion away', 'Wrist extension', 'Finger extension'],
        sensitizersNo: ['Cervikal lateral fleksjon bort', 'Håndleddekstensjon', 'Fingerekstensjon'],
        positive: 'Reproduction of arm symptoms, relieved by neck lateral flexion toward',
        positiveNo: 'Reproduksjon av armsymptomer, lindres ved lateral nakkefleksjon mot',
        bilateral: true,
      },
      {
        id: 'ultt2a_median',
        name: 'ULTT2a - Median Nerve Bias',
        nameNo: 'ULTT2a - N. medianus fokus',
        nerve: 'Median (C5-T1)',
        nerveNo: 'N. medianus (C5-T1)',
        technique:
          'Shoulder depression → elbow extension → lateral rotation → wrist/finger/thumb extension.',
        techniqueNo:
          'Skulder depresjon → albue ekstensjon → lateral rotasjon → håndledd/finger/tommel ekstensjon.',
        positive: 'Anterior arm/forearm symptoms',
        positiveNo: 'Fremre arm/underarm symptomer',
        bilateral: true,
      },
      {
        id: 'ultt2b_radial',
        name: 'ULTT2b - Radial Nerve Bias',
        nameNo: 'ULTT2b - N. radialis fokus',
        nerve: 'Radial (C5-T1)',
        nerveNo: 'N. radialis (C5-T1)',
        technique:
          'Shoulder depression → elbow extension → medial rotation → wrist/finger flexion → ulnar deviation.',
        techniqueNo:
          'Skulder depresjon → albue ekstensjon → medial rotasjon → håndledd/finger fleksjon → ulnardeviasjon.',
        sensitizers: ['Shoulder medial rotation', 'Wrist flexion'],
        sensitizersNo: ['Skulder medial rotasjon', 'Håndleddfleksjon'],
        positive: 'Posterior arm/lateral forearm symptoms',
        positiveNo: 'Bakre arm/lateral underarm symptomer',
        bilateral: true,
      },
      {
        id: 'ultt3_ulnar',
        name: 'ULTT3 - Ulnar Nerve',
        nameNo: 'ULTT3 - N. ulnaris',
        nerve: 'Ulnar (C8-T1)',
        nerveNo: 'N. ulnaris (C8-T1)',
        technique:
          'Shoulder depression → wrist/finger extension → forearm pronation → elbow flexion → shoulder lateral rotation → shoulder abduction.',
        techniqueNo:
          'Skulder depresjon → håndledd/finger ekstensjon → underarm pronasjon → albue fleksjon → skulder lateral rotasjon → skulder abduksjon.',
        sensitizers: ['Elbow flexion', 'Cervical lateral flexion away'],
        sensitizersNo: ['Albuefleksjon', 'Cervikal lateral fleksjon bort'],
        positive: 'Medial elbow/forearm/4th-5th finger symptoms',
        positiveNo: 'Medial albue/underarm/4.-5. finger symptomer',
        bilateral: true,
      },
    ],
  },
  cervical: {
    name: 'Cervical Neural Tests',
    nameNo: 'Cervikale nervetester',
    tests: [
      {
        id: 'spurling',
        name: "Spurling's Test",
        nameNo: 'Spurlings test',
        nerve: 'Cervical nerve roots',
        nerveNo: 'Cervikale nerverøtter',
        technique: 'Cervical extension + lateral flexion + compression.',
        techniqueNo: 'Cervikal ekstensjon + lateral fleksjon + kompresjon.',
        positive: 'Radiating arm pain (dermatomal pattern)',
        positiveNo: 'Utstrålende armsmerter (dermatomalt mønster)',
        bilateral: true,
      },
      {
        id: 'distraction',
        name: 'Cervical Distraction Test',
        nameNo: 'Cervikal distraksjonstest',
        nerve: 'Cervical nerve roots',
        nerveNo: 'Cervikale nerverøtter',
        technique: 'Apply axial traction to cervical spine.',
        techniqueNo: 'Påfør aksial traksjon til cervikalkolumna.',
        positive: 'Relief of arm symptoms (foraminal stenosis)',
        positiveNo: 'Lindring av armsymptomer (foraminal stenose)',
        bilateral: false,
      },
      {
        id: 'shoulder_abduction',
        name: 'Shoulder Abduction Relief',
        nameNo: 'Skulderabduksjonstest',
        nerve: 'Cervical nerve roots',
        nerveNo: 'Cervikale nerverøtter',
        technique: 'Patient places hand on top of head (abducts shoulder).',
        techniqueNo: 'Pasienten legger hånden på toppen av hodet (abduserer skulderen).',
        positive: 'Relief suggests radiculopathy, worsening suggests TOS',
        positiveNo: 'Lindring indikerer radikulopati, forverring indikerer TOS',
        bilateral: true,
      },
    ],
  },
};

/**
 * Finding toggle with angle input for SLR
 */
function FindingToggle({
  value,
  onChange,
  disabled = false,
  lang = 'no',
  showAngle = false,
  angle,
  onAngleChange,
}) {
  const _current = FINDING_STATES.find((s) => s.value === value) || FINDING_STATES[0];

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {FINDING_STATES.map((state) => (
          <button
            key={state.value}
            type="button"
            onClick={() => !disabled && onChange(state.value)}
            disabled={disabled}
            className={`px-2 py-1 text-xs rounded border transition-colors
                       ${value === state.value ? `${state.color} border-current font-medium` : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}
          >
            {lang === 'no' ? state.labelNo : state.label}
          </button>
        ))}
      </div>

      {showAngle && value === 'positive' && (
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            max="90"
            value={angle || ''}
            onChange={(e) => onAngleChange(e.target.value)}
            placeholder="°"
            className="w-12 px-1 py-1 text-xs border border-gray-200 rounded text-center"
          />
          <span className="text-xs text-gray-400">°</span>
        </div>
      )}
    </div>
  );
}

/**
 * Test item component
 */
function TestItem({ test, values, onChange, lang }) {
  const leftKey = `${test.id}_left`;
  const rightKey = `${test.id}_right`;
  const leftAngleKey = `${test.id}_left_angle`;
  const rightAngleKey = `${test.id}_right_angle`;
  const notesKey = `${test.id}_notes`;

  const isPositive = values[leftKey] === 'positive' || values[rightKey] === 'positive';

  return (
    <div
      className={`p-3 rounded-lg border ${isPositive ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h5 className="font-medium text-gray-700">{lang === 'no' ? test.nameNo : test.name}</h5>
          <p className="text-xs text-teal-600 mt-0.5">
            {lang === 'no' ? test.nerveNo : test.nerve}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {lang === 'no' ? test.techniqueNo : test.technique}
          </p>
          {test.sensitizers && (
            <p className="text-xs text-purple-600 mt-1">
              <span className="font-medium">
                {lang === 'no' ? 'Sensitisere: ' : 'Sensitizers: '}
              </span>
              {(lang === 'no' ? test.sensitizersNo : test.sensitizers).join(', ')}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        {test.bilateral ? (
          <>
            <div>
              <span className="text-xs text-gray-400 block mb-1">
                {lang === 'no' ? 'Venstre' : 'Left'}
              </span>
              <FindingToggle
                value={values[leftKey] || 'NT'}
                onChange={(v) => onChange({ ...values, [leftKey]: v })}
                lang={lang}
                showAngle={test.id === 'slr'}
                angle={values[leftAngleKey]}
                onAngleChange={(v) => onChange({ ...values, [leftAngleKey]: v })}
              />
            </div>
            <div>
              <span className="text-xs text-gray-400 block mb-1">
                {lang === 'no' ? 'Høyre' : 'Right'}
              </span>
              <FindingToggle
                value={values[rightKey] || 'NT'}
                onChange={(v) => onChange({ ...values, [rightKey]: v })}
                lang={lang}
                showAngle={test.id === 'slr'}
                angle={values[rightAngleKey]}
                onAngleChange={(v) => onChange({ ...values, [rightAngleKey]: v })}
              />
            </div>
          </>
        ) : (
          <div>
            <span className="text-xs text-gray-400 block mb-1">
              {lang === 'no' ? 'Resultat' : 'Result'}
            </span>
            <FindingToggle
              value={values[leftKey] || 'NT'}
              onChange={(v) => onChange({ ...values, [leftKey]: v })}
              lang={lang}
            />
          </div>
        )}
      </div>

      {isPositive && (
        <div className="mt-2">
          <p className="text-xs text-red-600">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            {lang === 'no' ? 'Positiv: ' : 'Positive: '}
            {lang === 'no' ? test.positiveNo : test.positive}
          </p>
          <input
            type="text"
            value={values[notesKey] || ''}
            onChange={(e) => onChange({ ...values, [notesKey]: e.target.value })}
            placeholder={lang === 'no' ? 'Beskriv funn...' : 'Describe findings...'}
            className="mt-2 w-full px-2 py-1 text-xs border border-gray-200 rounded"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Category section
 */
function CategorySection({ _categoryKey, category, values, onChange, lang, expanded, onToggle }) {
  const positiveCount = useMemo(() => {
    let count = 0;
    category.tests.forEach((test) => {
      if (values[`${test.id}_left`] === 'positive') {
        count++;
      }
      if (test.bilateral && values[`${test.id}_right`] === 'positive') {
        count++;
      }
    });
    return count;
  }, [category.tests, values]);

  return (
    <div
      className={`border rounded-lg overflow-hidden ${positiveCount > 0 ? 'border-red-200' : 'border-gray-200'}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          <Zap className={`w-5 h-5 ${positiveCount > 0 ? 'text-red-600' : 'text-teal-600'}`} />
          <span className="font-medium text-gray-700">
            {lang === 'no' ? category.nameNo : category.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {positiveCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
              {positiveCount} {lang === 'no' ? 'positiv' : 'positive'}
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
          {category.tests.map((test) => (
            <TestItem key={test.id} test={test} values={values} onChange={onChange} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main NerveTensionTests component
 */
export default function NerveTensionTests({
  values = {},
  onChange,
  lang = 'no',
  readOnly = false,
  onGenerateNarrative,
}) {
  const [expandedCategories, setExpandedCategories] = useState(new Set(['lowerLimb', 'upperLimb']));
  const [showLowerDiagram, setShowLowerDiagram] = useState(true);
  const [showUpperDiagram, setShowUpperDiagram] = useState(true);
  const [lowerMarkers, setLowerMarkers] = useState(values.lowerDiagramMarkers || []);
  const [upperMarkers, setUpperMarkers] = useState(values.upperDiagramMarkers || []);

  // Get SLR angles from values - ensure valid numbers
  const slrLeftAngle =
    values.slr_left_angle && !isNaN(parseInt(values.slr_left_angle))
      ? parseInt(values.slr_left_angle)
      : null;
  const slrRightAngle =
    values.slr_right_angle && !isNaN(parseInt(values.slr_right_angle))
      ? parseInt(values.slr_right_angle)
      : null;

  // SLR Angles parsed for diagram markers

  // Update lower diagram markers
  const handleLowerDiagramChange = (markers) => {
    setLowerMarkers(markers);
    onChange({ ...values, lowerDiagramMarkers: markers });
  };

  // Update upper diagram markers
  const handleUpperDiagramChange = (markers) => {
    setUpperMarkers(markers);
    onChange({ ...values, upperDiagramMarkers: markers });
  };

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
    let positive = 0;

    Object.values(NERVE_TENSION_TESTS).forEach((category) => {
      category.tests.forEach((test) => {
        if (values[`${test.id}_left`] && values[`${test.id}_left`] !== 'NT') {
          tested++;
          if (values[`${test.id}_left`] === 'positive') {
            positive++;
          }
        }
        if (test.bilateral && values[`${test.id}_right`] && values[`${test.id}_right`] !== 'NT') {
          tested++;
          if (values[`${test.id}_right`] === 'positive') {
            positive++;
          }
        }
      });
    });

    return { tested, positive };
  }, [values]);

  // Generate narrative
  const generateNarrative = useMemo(() => {
    const positiveFindings = [];
    const negativeTests = [];

    Object.values(NERVE_TENSION_TESTS).forEach((category) => {
      category.tests.forEach((test) => {
        const leftVal = values[`${test.id}_left`];
        const rightVal = values[`${test.id}_right`];
        const leftAngle = values[`${test.id}_left_angle`];
        const rightAngle = values[`${test.id}_right_angle`];
        const notes = values[`${test.id}_notes`];

        const testName = lang === 'no' ? test.nameNo : test.name;

        if (leftVal === 'positive' || rightVal === 'positive') {
          let finding = testName;

          if (test.bilateral) {
            if (leftVal === 'positive' && rightVal === 'positive') {
              finding += ` (${lang === 'no' ? 'bilateralt positiv' : 'bilateral positive'}`;
              if (leftAngle && rightAngle) {
                finding += ` V:${leftAngle}° H:${rightAngle}°`;
              }
              finding += ')';
            } else if (leftVal === 'positive') {
              finding += ` (${lang === 'no' ? 'venstre positiv' : 'left positive'}`;
              if (leftAngle) {
                finding += ` ${leftAngle}°`;
              }
              finding += ')';
            } else {
              finding += ` (${lang === 'no' ? 'høyre positiv' : 'right positive'}`;
              if (rightAngle) {
                finding += ` ${rightAngle}°`;
              }
              finding += ')';
            }
          } else {
            finding += ` (${lang === 'no' ? 'positiv' : 'positive'})`;
          }

          if (notes) {
            finding += `: ${notes}`;
          }
          positiveFindings.push(finding);
        } else if (leftVal === 'negative' || rightVal === 'negative') {
          negativeTests.push(testName);
        }
      });
    });

    if (positiveFindings.length === 0 && negativeTests.length === 0) {
      return lang === 'no'
        ? 'Nervestrekkstester ikke utført.'
        : 'Neural tension tests not performed.';
    }

    let narrative = '';
    if (positiveFindings.length > 0) {
      narrative += `${lang === 'no' ? 'Positive nervestrekkstester' : 'Positive neural tension tests'}: ${positiveFindings.join('. ')}. `;
    }
    if (negativeTests.length > 0 && positiveFindings.length === 0) {
      narrative += `${lang === 'no' ? 'Nervestrekkstester negative' : 'Neural tension tests negative'}: ${negativeTests.join(', ')}.`;
    }

    return narrative.trim();
  }, [values, lang]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {lang === 'no' ? 'Nervestrekkstester' : 'Neural Tension Tests'}
          </h3>
          {summary.tested > 0 && (
            <p className="text-sm text-gray-500">
              {summary.tested} {lang === 'no' ? 'tester' : 'tests'}
              {summary.positive > 0 && (
                <span className="text-red-600 ml-2">
                  • {summary.positive} {lang === 'no' ? 'positive' : 'positive'}
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

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {FINDING_STATES.map((state) => (
          <div key={state.value} className={`px-2 py-1 rounded ${state.color}`}>
            {lang === 'no' ? state.labelNo : state.label}
          </div>
        ))}
      </div>

      {/* Lower Extremity Diagram */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowLowerDiagram(!showLowerDiagram)}
          className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100"
        >
          <div className="flex items-center gap-3">
            <Map className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-700">
              {lang === 'no'
                ? 'Underekstremitet Diagram (SLR, Slump)'
                : 'Lower Extremity Diagram (SLR, Slump)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {lowerMarkers.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                {lowerMarkers.length} {lang === 'no' ? 'markering' : 'markers'}
              </span>
            )}
            {showLowerDiagram ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {showLowerDiagram && (
          <div className="p-4 bg-white">
            <p className="text-xs text-gray-500 mb-3">
              {lang === 'no'
                ? 'Klikk på diagrammet for å markere symptomer. Viser isjiasnerven (gul) og dermatomer (L4, L5, S1).'
                : 'Click on the diagram to mark symptoms. Shows sciatic nerve (yellow) and dermatomes (L4, L5, S1).'}
            </p>

            {/* SLR Angle Display - Always visible when angles are set */}
            {(slrLeftAngle !== null || slrRightAngle !== null) && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center gap-4">
                <span className="text-sm font-semibold text-red-700">SLR:</span>
                {slrLeftAngle !== null && (
                  <span className="text-sm text-red-600">
                    {lang === 'no' ? 'Venstre' : 'Left'}: <strong>{slrLeftAngle}°</strong>
                  </span>
                )}
                {slrRightAngle !== null && (
                  <span className="text-sm text-red-600">
                    {lang === 'no' ? 'Høyre' : 'Right'}: <strong>{slrRightAngle}°</strong>
                  </span>
                )}
              </div>
            )}

            <LowerExtremityDiagram
              markers={lowerMarkers}
              onChange={handleLowerDiagramChange}
              lang={lang}
              slrAngleLeft={slrLeftAngle}
              slrAngleRight={slrRightAngle}
              showDermatomes={true}
              showNerves={true}
              readOnly={readOnly}
            />
          </div>
        )}
      </div>

      {/* Upper Extremity Diagram */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowUpperDiagram(!showUpperDiagram)}
          className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100"
        >
          <div className="flex items-center gap-3">
            <Map className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-gray-700">
              {lang === 'no' ? 'Overekstremitet Diagram (ULTT)' : 'Upper Extremity Diagram (ULTT)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {upperMarkers.length > 0 && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                {upperMarkers.length} {lang === 'no' ? 'markering' : 'markers'}
              </span>
            )}
            {showUpperDiagram ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {showUpperDiagram && (
          <div className="p-4 bg-white">
            <p className="text-xs text-gray-500 mb-3">
              {lang === 'no'
                ? 'Klikk på diagrammet for å markere symptomer. Viser median-, ulnar- og radialisnervene samt dermatomer (C5-T1).'
                : 'Click on the diagram to mark symptoms. Shows median, ulnar, and radial nerves with dermatomes (C5-T1).'}
            </p>
            <UpperExtremityDiagram
              markers={upperMarkers}
              onChange={handleUpperDiagramChange}
              lang={lang}
              showDermatomes={true}
              showNerves={true}
              readOnly={readOnly}
            />
          </div>
        )}
      </div>

      {/* Test Categories */}
      <div className="space-y-2">
        {Object.entries(NERVE_TENSION_TESTS).map(([key, category]) => (
          <CategorySection
            key={key}
            categoryKey={key}
            category={category}
            values={values}
            onChange={onChange}
            lang={lang}
            expanded={expandedCategories.has(key)}
            onToggle={() => toggleCategory(key)}
          />
        ))}
      </div>

      {/* Clinical info */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-blue-700">
            <p className="font-medium mb-1">{lang === 'no' ? 'Tolkning:' : 'Interpretation:'}</p>
            <ul className="space-y-0.5 text-blue-600">
              <li>
                •{' '}
                {lang === 'no'
                  ? 'Positiv test: Reproduserer pasientens symptomer'
                  : 'Positive test: Reproduces patient symptoms'}
              </li>
              <li>
                •{' '}
                {lang === 'no'
                  ? 'Strukturell differensiering: Symptomer endres med sensitisering'
                  : 'Structural differentiation: Symptoms change with sensitizers'}
              </li>
              <li>
                •{' '}
                {lang === 'no'
                  ? 'SLR <30°: Stor diskusprolaps, >70°: Lite spesifikk'
                  : 'SLR <30°: Large disc herniation, >70°: Less specific'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export { NERVE_TENSION_TESTS, FINDING_STATES };
