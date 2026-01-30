/**
 * DeepTendonReflexPanel Component
 *
 * Interactive deep tendon reflex testing panel with 0-4+ grading,
 * bilateral comparison, and pathological reflex assessment.
 */

import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

// DTR Grading Scale
const DTR_GRADES = [
  { value: '0', label: '0', description: 'Absent', descriptionNo: 'Fraværende', color: 'bg-red-100 text-red-700 border-red-300' },
  { value: '1', label: '1+', description: 'Diminished/Hyporeflexic', descriptionNo: 'Nedsatt/Hyporefleksi', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: '2', label: '2+', description: 'Normal', descriptionNo: 'Normal', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: '3', label: '3+', description: 'Brisk/Hyperreflexic', descriptionNo: 'Livlig/Hyperrefleksi', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { value: '4', label: '4+', description: 'Clonus', descriptionNo: 'Klonus', color: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'NT', label: 'NT', description: 'Not Tested', descriptionNo: 'Ikke testet', color: 'bg-gray-100 text-gray-500 border-gray-300' }
];

// Deep Tendon Reflexes
const DEEP_TENDON_REFLEXES = [
  {
    id: 'biceps',
    name: 'Biceps',
    nameNo: 'Biceps',
    nerveRoot: 'C5-C6',
    nerve: 'Musculocutaneous',
    nerveNo: 'N. musculocutaneus',
    technique: 'Strike biceps tendon with arm flexed',
    techniqueNo: 'Slå på bicepssenen med armen flektert'
  },
  {
    id: 'brachioradialis',
    name: 'Brachioradialis',
    nameNo: 'Brachioradialis',
    nerveRoot: 'C5-C6',
    nerve: 'Radial',
    nerveNo: 'N. radialis',
    technique: 'Strike distal radius with forearm neutral',
    techniqueNo: 'Slå på distale radius med underarmen i nøytral'
  },
  {
    id: 'triceps',
    name: 'Triceps',
    nameNo: 'Triceps',
    nerveRoot: 'C7-C8',
    nerve: 'Radial',
    nerveNo: 'N. radialis',
    technique: 'Strike triceps tendon above olecranon',
    techniqueNo: 'Slå på tricepssenen over olecranon'
  },
  {
    id: 'finger_flexor',
    name: 'Finger Flexors',
    nameNo: 'Fingerfleksorer',
    nerveRoot: 'C8',
    nerve: 'Median/Ulnar',
    nerveNo: 'N. medianus/N. ulnaris',
    technique: 'Strike examiner finger across patient palm',
    techniqueNo: 'Slå på undersøkers finger over pasientens håndflate'
  },
  {
    id: 'patellar',
    name: 'Patellar (Knee Jerk)',
    nameNo: 'Patellar (Knerefleks)',
    nerveRoot: 'L3-L4',
    nerve: 'Femoral',
    nerveNo: 'N. femoralis',
    technique: 'Strike patellar tendon with knee flexed',
    techniqueNo: 'Slå på patellarsenen med kneet flektert'
  },
  {
    id: 'hamstring',
    name: 'Medial Hamstring',
    nameNo: 'Medial hamstring',
    nerveRoot: 'L5',
    nerve: 'Sciatic',
    nerveNo: 'N. ischiadicus',
    technique: 'Strike medial hamstring tendon',
    techniqueNo: 'Slå på medial hamstringsene'
  },
  {
    id: 'achilles',
    name: 'Achilles (Ankle Jerk)',
    nameNo: 'Achilles (Ankelrefleks)',
    nerveRoot: 'S1-S2',
    nerve: 'Tibial',
    nerveNo: 'N. tibialis',
    technique: 'Strike Achilles tendon with foot dorsiflexed',
    techniqueNo: 'Slå på akillessenen med foten dorsalflektert'
  }
];

// Pathological Reflexes
const PATHOLOGICAL_REFLEXES = [
  {
    id: 'babinski',
    name: 'Babinski Sign',
    nameNo: 'Babinskis tegn',
    technique: 'Stroke lateral sole from heel to toes',
    techniqueNo: 'Stryk lateral fotsåle fra hæl til tær',
    positive: 'Great toe extension, fanning of other toes',
    positiveNo: 'Stortåekstensjon, vifte av andre tær',
    significance: 'Upper motor neuron lesion',
    significanceNo: 'Øvre motornevron-lesjon'
  },
  {
    id: 'hoffmann',
    name: "Hoffman's Sign",
    nameNo: 'Hoffmanns tegn',
    technique: 'Flick distal phalanx of middle finger',
    techniqueNo: 'Knips distale falang av langfinger',
    positive: 'Flexion of thumb and index finger',
    positiveNo: 'Fleksjon av tommel og pekefinger',
    significance: 'Cervical myelopathy / UMN lesion',
    significanceNo: 'Cervikal myelopati / ØMN-lesjon'
  },
  {
    id: 'clonus_ankle',
    name: 'Ankle Clonus',
    nameNo: 'Ankelklonus',
    technique: 'Rapidly dorsiflex foot and maintain pressure',
    techniqueNo: 'Rask dorsalfleksjon av foten og hold trykk',
    positive: 'Sustained rhythmic contractions (>3 beats)',
    positiveNo: 'Vedvarende rytmiske kontraksjoner (>3 slag)',
    significance: 'Upper motor neuron lesion',
    significanceNo: 'Øvre motornevron-lesjon'
  },
  {
    id: 'clonus_patellar',
    name: 'Patellar Clonus',
    nameNo: 'Patellarklonus',
    technique: 'Rapidly push patella distally',
    techniqueNo: 'Rask distal skyving av patella',
    positive: 'Sustained rhythmic bouncing',
    positiveNo: 'Vedvarende rytmisk hopping',
    significance: 'Upper motor neuron lesion',
    significanceNo: 'Øvre motornevron-lesjon'
  },
  {
    id: 'jaw_jerk',
    name: 'Jaw Jerk',
    nameNo: 'Kjeverefleks',
    technique: 'Tap chin with mouth slightly open',
    techniqueNo: 'Bank på haken med munnen litt åpen',
    positive: 'Brisk jaw closure',
    positiveNo: 'Livlig kjevesammenbitn',
    significance: 'Bilateral UMN lesion above pons',
    significanceNo: 'Bilateral ØMN-lesjon over pons'
  },
  {
    id: 'abdominal',
    name: 'Abdominal Reflexes',
    nameNo: 'Abdominalreflekser',
    technique: 'Stroke each quadrant toward umbilicus',
    techniqueNo: 'Stryk hver kvadrant mot navlen',
    positive: 'Absent = UMN lesion',
    positiveNo: 'Fraværende = ØMN-lesjon',
    significance: 'T7-T12 segments',
    significanceNo: 'T7-T12 segmenter'
  }
];

/**
 * Grade selector button
 */
function GradeButton({ value, currentValue, onChange, lang }) {
  const grade = DTR_GRADES.find(g => g.value === value);
  const isSelected = currentValue === value;

  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`w-10 h-10 rounded-lg border-2 font-bold text-sm transition-all
                 ${isSelected ? grade.color + ' border-current shadow-md scale-105' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}
      title={lang === 'no' ? grade.descriptionNo : grade.description}
    >
      {grade.label}
    </button>
  );
}

/**
 * DTR row component
 */
function DTRRow({ reflex, values, onChange, lang, showTechnique = false }) {
  const leftKey = `${reflex.id}_left`;
  const rightKey = `${reflex.id}_right`;
  const leftValue = values[leftKey] || 'NT';
  const rightValue = values[rightKey] || 'NT';

  const handleChange = (key, value) => {
    onChange({ ...values, [key]: value });
  };

  // Check for asymmetry
  const hasAsymmetry = () => {
    if (leftValue === 'NT' || rightValue === 'NT') return false;
    return Math.abs(parseInt(leftValue) - parseInt(rightValue)) >= 2;
  };

  // Check for abnormal values
  const isAbnormal = (value) => {
    return value === '0' || value === '4';
  };

  return (
    <tr className={`border-t border-gray-100 ${hasAsymmetry() ? 'bg-amber-50' : ''}`}>
      <td className="px-3 py-3">
        <div>
          <span className="font-medium text-gray-700">
            {lang === 'no' ? reflex.nameNo : reflex.name}
          </span>
          {showTechnique && (
            <p className="text-xs text-gray-500 mt-0.5">
              {lang === 'no' ? reflex.techniqueNo : reflex.technique}
            </p>
          )}
        </div>
      </td>
      <td className="px-2 py-3 text-center">
        <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">
          {reflex.nerveRoot}
        </span>
      </td>
      <td className="px-2 py-3">
        <div className="flex justify-center gap-1">
          {DTR_GRADES.map(grade => (
            <GradeButton
              key={grade.value}
              value={grade.value}
              currentValue={leftValue}
              onChange={(v) => handleChange(leftKey, v)}
              lang={lang}
            />
          ))}
        </div>
        {isAbnormal(leftValue) && (
          <div className="flex justify-center mt-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
        )}
      </td>
      <td className="px-2 py-3">
        <div className="flex justify-center gap-1">
          {DTR_GRADES.map(grade => (
            <GradeButton
              key={grade.value}
              value={grade.value}
              currentValue={rightValue}
              onChange={(v) => handleChange(rightKey, v)}
              lang={lang}
            />
          ))}
        </div>
        {isAbnormal(rightValue) && (
          <div className="flex justify-center mt-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
        )}
      </td>
    </tr>
  );
}

/**
 * Pathological reflex item
 */
function PathologicalReflexItem({ reflex, values, onChange, lang }) {
  const leftKey = `${reflex.id}_left`;
  const rightKey = `${reflex.id}_right`;

  const options = [
    { value: 'NT', label: lang === 'no' ? 'IT' : 'NT', color: 'bg-gray-100 text-gray-500' },
    { value: 'negative', label: lang === 'no' ? 'Neg' : 'Neg', color: 'bg-green-100 text-green-700' },
    { value: 'positive', label: lang === 'no' ? 'Pos' : 'Pos', color: 'bg-red-100 text-red-700' },
    { value: 'equivocal', label: lang === 'no' ? '?' : '?', color: 'bg-amber-100 text-amber-700' }
  ];

  return (
    <div className={`p-3 rounded-lg border ${values[leftKey] === 'positive' || values[rightKey] === 'positive' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h5 className="font-medium text-gray-700">
            {lang === 'no' ? reflex.nameNo : reflex.name}
          </h5>
          <p className="text-xs text-gray-500 mt-0.5">
            {lang === 'no' ? reflex.techniqueNo : reflex.technique}
          </p>
          {(values[leftKey] === 'positive' || values[rightKey] === 'positive') && (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ {lang === 'no' ? reflex.significanceNo : reflex.significance}
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <div className="text-center">
            <span className="text-xs text-gray-400 block mb-1">{lang === 'no' ? 'V' : 'L'}</span>
            <div className="flex gap-1">
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...values, [leftKey]: opt.value })}
                  className={`px-2 py-1 text-xs rounded border transition-colors
                             ${values[leftKey] === opt.value ? opt.color + ' border-current font-medium' : 'bg-white border-gray-200 text-gray-400'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="text-center">
            <span className="text-xs text-gray-400 block mb-1">{lang === 'no' ? 'H' : 'R'}</span>
            <div className="flex gap-1">
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...values, [rightKey]: opt.value })}
                  className={`px-2 py-1 text-xs rounded border transition-colors
                             ${values[rightKey] === opt.value ? opt.color + ' border-current font-medium' : 'bg-white border-gray-200 text-gray-400'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Quick set all buttons
 */
function QuickSetPanel({ values, onChange, lang }) {
  const setAllDTR = (grade) => {
    const updates = { ...values };
    DEEP_TENDON_REFLEXES.forEach(r => {
      updates[`${r.id}_left`] = grade;
      updates[`${r.id}_right`] = grade;
    });
    onChange(updates);
  };

  return (
    <div className="bg-teal-50 rounded-lg p-3 border border-teal-100">
      <span className="text-sm font-medium text-teal-800 block mb-2">
        {lang === 'no' ? 'Hurtigvalg - Sett alle DTR:' : 'Quick Set - All DTRs:'}
      </span>
      <div className="flex flex-wrap gap-2">
        {DTR_GRADES.filter(g => g.value !== 'NT').map(grade => (
          <button
            key={grade.value}
            type="button"
            onClick={() => setAllDTR(grade.value)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${grade.color}`}
          >
            {grade.label} - {lang === 'no' ? grade.descriptionNo : grade.description}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Main DeepTendonReflexPanel component
 */
export default function DeepTendonReflexPanel({
  values = {},
  onChange,
  lang = 'no',
  readOnly = false,
  showTechnique = false,
  onGenerateNarrative
}) {
  const [showPathological, setShowPathological] = useState(true);

  // Calculate summary
  const summary = useMemo(() => {
    let tested = 0;
    let abnormal = 0;
    let asymmetric = 0;

    DEEP_TENDON_REFLEXES.forEach(r => {
      const left = values[`${r.id}_left`];
      const right = values[`${r.id}_right`];

      if (left && left !== 'NT') tested++;
      if (right && right !== 'NT') tested++;

      if (left === '0' || left === '4') abnormal++;
      if (right === '0' || right === '4') abnormal++;

      if (left && right && left !== 'NT' && right !== 'NT') {
        if (Math.abs(parseInt(left) - parseInt(right)) >= 2) asymmetric++;
      }
    });

    // Check pathological reflexes
    let pathologicalPositive = 0;
    PATHOLOGICAL_REFLEXES.forEach(r => {
      if (values[`${r.id}_left`] === 'positive') pathologicalPositive++;
      if (values[`${r.id}_right`] === 'positive') pathologicalPositive++;
    });

    return { tested, abnormal, asymmetric, pathologicalPositive };
  }, [values]);

  // Generate narrative
  const generateNarrative = useMemo(() => {
    const findings = [];

    // DTR findings
    const dtrFindings = [];
    DEEP_TENDON_REFLEXES.forEach(r => {
      const left = values[`${r.id}_left`];
      const right = values[`${r.id}_right`];

      if (left && left !== 'NT' && left !== '2') {
        const grade = DTR_GRADES.find(g => g.value === left);
        dtrFindings.push(`${lang === 'no' ? r.nameNo : r.name} ${lang === 'no' ? 'venstre' : 'left'}: ${grade?.label} (${lang === 'no' ? grade?.descriptionNo : grade?.description})`);
      }
      if (right && right !== 'NT' && right !== '2') {
        const grade = DTR_GRADES.find(g => g.value === right);
        dtrFindings.push(`${lang === 'no' ? r.nameNo : r.name} ${lang === 'no' ? 'høyre' : 'right'}: ${grade?.label} (${lang === 'no' ? grade?.descriptionNo : grade?.description})`);
      }
    });

    if (dtrFindings.length > 0) {
      findings.push(`DTR: ${dtrFindings.join(', ')}`);
    } else if (summary.tested > 0) {
      findings.push(lang === 'no' ? 'DTR: Alle testede reflekser normale (2+) bilateralt.' : 'DTRs: All tested reflexes normal (2+) bilaterally.');
    }

    // Pathological reflexes
    const pathFindings = [];
    PATHOLOGICAL_REFLEXES.forEach(r => {
      const left = values[`${r.id}_left`];
      const right = values[`${r.id}_right`];

      if (left === 'positive' || right === 'positive') {
        let side = '';
        if (left === 'positive' && right === 'positive') {
          side = lang === 'no' ? 'bilateralt' : 'bilaterally';
        } else if (left === 'positive') {
          side = lang === 'no' ? 'venstre' : 'left';
        } else {
          side = lang === 'no' ? 'høyre' : 'right';
        }
        pathFindings.push(`${lang === 'no' ? r.nameNo : r.name} ${lang === 'no' ? 'positiv' : 'positive'} ${side}`);
      }
    });

    if (pathFindings.length > 0) {
      findings.push(`${lang === 'no' ? 'Patologiske reflekser' : 'Pathological reflexes'}: ${pathFindings.join(', ')}`);
    }

    return findings.length > 0 ? findings.join('. ') + '.' : (lang === 'no' ? 'Refleksundersøkelse ikke utført.' : 'Reflex examination not performed.');
  }, [values, summary, lang]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {lang === 'no' ? 'Dype senereflekser (DTR)' : 'Deep Tendon Reflexes (DTR)'}
          </h3>
          {summary.tested > 0 && (
            <p className="text-sm text-gray-500">
              {summary.tested} {lang === 'no' ? 'tester' : 'tests'}
              {summary.abnormal > 0 && (
                <span className="text-red-600 ml-2">• {summary.abnormal} {lang === 'no' ? 'abnormale' : 'abnormal'}</span>
              )}
              {summary.asymmetric > 0 && (
                <span className="text-amber-600 ml-2">• {summary.asymmetric} {lang === 'no' ? 'asymmetri' : 'asymmetry'}</span>
              )}
              {summary.pathologicalPositive > 0 && (
                <span className="text-red-600 ml-2">• {summary.pathologicalPositive} {lang === 'no' ? 'patologiske +' : 'pathological +'}</span>
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

      {/* Quick Set */}
      <QuickSetPanel values={values} onChange={onChange} lang={lang} />

      {/* Grading Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {DTR_GRADES.filter(g => g.value !== 'NT').map(grade => (
          <div key={grade.value} className={`px-2 py-1 rounded ${grade.color}`}>
            <span className="font-bold">{grade.label}</span> = {lang === 'no' ? grade.descriptionNo : grade.description}
          </div>
        ))}
      </div>

      {/* DTR Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                {lang === 'no' ? 'Refleks' : 'Reflex'}
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                {lang === 'no' ? 'Nerverot' : 'Nerve Root'}
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                {lang === 'no' ? 'Venstre' : 'Left'}
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                {lang === 'no' ? 'Høyre' : 'Right'}
              </th>
            </tr>
          </thead>
          <tbody>
            {DEEP_TENDON_REFLEXES.map(reflex => (
              <DTRRow
                key={reflex.id}
                reflex={reflex}
                values={values}
                onChange={onChange}
                lang={lang}
                showTechnique={showTechnique}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pathological Reflexes */}
      <div>
        <button
          type="button"
          onClick={() => setShowPathological(!showPathological)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
        >
          {showPathological ? '▼' : '▶'} {lang === 'no' ? 'Patologiske reflekser' : 'Pathological Reflexes'}
        </button>

        {showPathological && (
          <div className="space-y-2">
            {PATHOLOGICAL_REFLEXES.map(reflex => (
              <PathologicalReflexItem
                key={reflex.id}
                reflex={reflex}
                values={values}
                onChange={onChange}
                lang={lang}
              />
            ))}
          </div>
        )}
      </div>

      {/* Clinical significance */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-blue-700">
            <p className="font-medium mb-1">{lang === 'no' ? 'Klinisk tolkning:' : 'Clinical Interpretation:'}</p>
            <ul className="space-y-0.5 text-blue-600">
              <li>• {lang === 'no' ? 'Hyporefleksi (0-1+): LMN lesjon, polynevropati, myopati' : 'Hyporeflexia (0-1+): LMN lesion, polyneuropathy, myopathy'}</li>
              <li>• {lang === 'no' ? 'Hyperrefleksi (3-4+): UMN lesjon, myelopati' : 'Hyperreflexia (3-4+): UMN lesion, myelopathy'}</li>
              <li>• {lang === 'no' ? 'Asymmetri: Fokal nerverotsaffeksjon' : 'Asymmetry: Focal nerve root involvement'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export { DTR_GRADES, DEEP_TENDON_REFLEXES, PATHOLOGICAL_REFLEXES };
