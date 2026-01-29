/**
 * BPPVTestPanel Component
 *
 * Benign Paroxysmal Positional Vertigo testing panel with bilateral
 * Dix-Hallpike, Supine Roll, and treatment protocol support.
 */

import React, { useMemo, useState } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MinusCircle,
  Info,
  ChevronDown,
  ChevronUp,
  PlayCircle
} from 'lucide-react';

// Finding states for BPPV tests
const FINDING_STATES = [
  { value: 'NT', label: 'Not Tested', labelNo: 'Ikke testet', color: 'bg-gray-100 text-gray-500', icon: MinusCircle },
  { value: 'negative', label: 'Negative', labelNo: 'Negativ', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  { value: 'positive', label: 'Positive', labelNo: 'Positiv', color: 'bg-red-100 text-red-700', icon: XCircle },
  { value: 'equivocal', label: 'Equivocal', labelNo: 'Usikker', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle }
];

// Nystagmus types
const NYSTAGMUS_TYPES = [
  { id: 'none', label: 'Ingen nystagmus', labelEn: 'No nystagmus' },
  { id: 'geotropic_torsional', label: 'Geotropisk torsjonell', labelEn: 'Geotropic torsional' },
  { id: 'ageotropic', label: 'Ageotropisk', labelEn: 'Ageotropic' },
  { id: 'vertical_downbeat', label: 'Downbeat vertikal', labelEn: 'Downbeat vertical' },
  { id: 'vertical_upbeat', label: 'Upbeat vertikal', labelEn: 'Upbeat vertical' },
  { id: 'horizontal_geotropic', label: 'Geotropisk horisontal', labelEn: 'Geotropic horizontal' },
  { id: 'horizontal_ageotropic', label: 'Ageotropisk horisontal', labelEn: 'Ageotropic horizontal' }
];

// Intensity options
const INTENSITY_OPTIONS = ['Svak', 'Moderat', 'Sterk'];

// BPPV test categories
const BPPV_TESTS = {
  posterior: {
    name: 'Posterior Kanal Tests',
    nameNo: 'Posterior kanal tester',
    prevalence: '80-90% av BPPV',
    tests: [
      {
        id: 'dix_hallpike_right',
        name: 'Dix-Hallpike Right',
        nameNo: 'Dix-Hallpike høyre',
        technique: 'Pasient sittende, hode rotert 45° høyre. Legg raskt bakover med hode hengende 30° under benknivå.',
        techniqueEn: 'Patient seated, head rotated 45° right. Rapidly lay back with head hanging 30° below table.',
        canal: 'Right posterior canal',
        treatment: 'Epley mot høyre'
      },
      {
        id: 'dix_hallpike_left',
        name: 'Dix-Hallpike Left',
        nameNo: 'Dix-Hallpike venstre',
        technique: 'Pasient sittende, hode rotert 45° venstre. Legg raskt bakover med hode hengende 30° under benknivå.',
        techniqueEn: 'Patient seated, head rotated 45° left. Rapidly lay back with head hanging 30° below table.',
        canal: 'Left posterior canal',
        treatment: 'Epley mot venstre'
      }
    ]
  },
  lateral: {
    name: 'Lateral Canal Tests',
    nameNo: 'Lateral kanal tester',
    prevalence: '~15% av BPPV',
    tests: [
      {
        id: 'supine_roll_right',
        name: 'Supine Roll Right',
        nameNo: 'Supine roll høyre',
        technique: 'Pasient ryggliggende. Roter hodet 90° mot høyre.',
        techniqueEn: 'Patient supine. Rotate head 90° to the right.',
        canal: 'Lateral canal assessment',
        treatment: 'Gufoni eller BBQ roll'
      },
      {
        id: 'supine_roll_left',
        name: 'Supine Roll Left',
        nameNo: 'Supine roll venstre',
        technique: 'Pasient ryggliggende. Roter hodet 90° mot venstre.',
        techniqueEn: 'Patient supine. Rotate head 90° to the left.',
        canal: 'Lateral canal assessment',
        treatment: 'Gufoni eller BBQ roll'
      },
      {
        id: 'bow_and_lean',
        name: 'Bow and Lean Test',
        nameNo: 'Bow and Lean test',
        technique: 'Pasient sittende. Bøy hodet fremover (bow), deretter lent bakover (lean). Observer nystagmus.',
        techniqueEn: 'Patient seated. Flex head forward (bow), then extend back (lean). Observe nystagmus.',
        canal: 'Lateral canal differentiation',
        treatment: 'Avhenger av variant'
      }
    ]
  },
  anterior: {
    name: 'Anterior Canal Tests',
    nameNo: 'Anterior kanal tester',
    prevalence: '<5% av BPPV',
    tests: [
      {
        id: 'deep_head_hanging',
        name: 'Deep Head Hanging (Yacovino)',
        nameNo: 'Deep Head Hanging',
        technique: 'Pasient ryggliggende. Heng hodet over benkekant i ekstensjon.',
        techniqueEn: 'Patient supine. Extend head over edge of table.',
        canal: 'Anterior canal',
        treatment: 'Yacovino manøver'
      }
    ]
  }
};

// Treatment protocols
const TREATMENT_PROTOCOLS = {
  epley: {
    name: 'Epley Manøver',
    indication: 'Posterior kanal BPPV',
    steps: [
      'Pasient sittende, hode rotert 45° mot affisert side',
      'Legg raskt bakover, hode hengende 30° under benk (hold 2 min)',
      'Rotér hodet 90° mot motsatt side (hold 2 min)',
      'Rotér kropp til sidelliggende, hode 45° ned (hold 2 min)',
      'Sitt langsomt opp med hodet lett bøyd fremover'
    ]
  },
  semont: {
    name: 'Semont Manøver',
    indication: 'Posterior kanal BPPV',
    steps: [
      'Pasient sittende, hode rotert 45° bort fra affisert side',
      'Rask bevegelse til sideliggende på affisert side (hold 2 min)',
      'Rask bevegelse gjennom sittende til motsatt side (hold 2 min)',
      'Sitt langsomt opp'
    ]
  },
  gufoni: {
    name: 'Gufoni Manøver',
    indication: 'Lateral kanal BPPV (geotropisk)',
    steps: [
      'Pasient sittende',
      'Rask bevegelse til sideliggende på IKKE-affisert side (hold 1 min)',
      'Rotér hodet 45° ned mot gulv (hold 2 min)',
      'Sitt langsomt opp'
    ]
  },
  bbq: {
    name: 'BBQ Roll (Lempert)',
    indication: 'Lateral kanal BPPV (geotropisk)',
    steps: [
      'Pasient ryggliggende',
      'Rotér 90° steg for steg bort fra affisert side',
      'Hold hvert steg 30-60 sekunder',
      'Fortsett til 360° rotasjon fullført'
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
 * Test item component for BPPV tests
 */
function BPPVTestItem({ test, values, onChange, lang, showTechnique = false }) {
  const resultKey = `${test.id}_result`;
  const nystagmusKey = `${test.id}_nystagmus`;
  const intensityKey = `${test.id}_intensity`;
  const latencyKey = `${test.id}_latency`;
  const durationKey = `${test.id}_duration`;
  const vertigoKey = `${test.id}_vertigo`;
  const notesKey = `${test.id}_notes`;

  const isPositive = values[resultKey] === 'positive';

  return (
    <div className={`p-3 bg-white rounded-lg border ${isPositive ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h5 className="font-medium text-gray-700">
            {lang === 'no' ? test.nameNo : test.name}
          </h5>
          {showTechnique && (
            <p className="text-xs text-gray-500 mt-1">
              {lang === 'no' ? test.technique : test.techniqueEn}
            </p>
          )}
        </div>

        <FindingToggle
          value={values[resultKey] || 'NT'}
          onChange={(v) => onChange({ ...values, [resultKey]: v })}
          lang={lang}
        />
      </div>

      {/* Detailed findings for positive tests */}
      {isPositive && (
        <div className="mt-3 space-y-2 pt-3 border-t border-red-200">
          {/* Nystagmus type */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-24">{lang === 'no' ? 'Nystagmus:' : 'Nystagmus:'}</span>
            <select
              value={values[nystagmusKey] || ''}
              onChange={(e) => onChange({ ...values, [nystagmusKey]: e.target.value })}
              className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
            >
              <option value="">{lang === 'no' ? 'Velg type...' : 'Select type...'}</option>
              {NYSTAGMUS_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                  {lang === 'no' ? type.label : type.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Intensity */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-24">{lang === 'no' ? 'Intensitet:' : 'Intensity:'}</span>
            <div className="flex gap-1">
              {INTENSITY_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange({ ...values, [intensityKey]: opt })}
                  className={`px-2 py-1 text-xs rounded border ${
                    values[intensityKey] === opt
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Characteristics */}
          <div className="flex flex-wrap gap-3 text-xs">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={values[latencyKey] || false}
                onChange={(e) => onChange({ ...values, [latencyKey]: e.target.checked })}
                className="w-3 h-3"
              />
              <span>{lang === 'no' ? 'Latency <5s' : 'Latency <5s'}</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={values[durationKey] || false}
                onChange={(e) => onChange({ ...values, [durationKey]: e.target.checked })}
                className="w-3 h-3"
              />
              <span>{lang === 'no' ? 'Varighet <60s' : 'Duration <60s'}</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={values[vertigoKey] || false}
                onChange={(e) => onChange({ ...values, [vertigoKey]: e.target.checked })}
                className="w-3 h-3"
              />
              <span>{lang === 'no' ? 'Vertigo provosert' : 'Vertigo provoked'}</span>
            </label>
          </div>

          {/* Notes */}
          <input
            type="text"
            value={values[notesKey] || ''}
            onChange={(e) => onChange({ ...values, [notesKey]: e.target.value })}
            placeholder={lang === 'no' ? 'Tilleggsnotater...' : 'Additional notes...'}
            className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
          />

          {/* Suggested treatment */}
          <div className="flex items-center gap-2 text-xs text-teal-700 bg-teal-50 p-2 rounded">
            <PlayCircle className="w-4 h-4" />
            <span>{lang === 'no' ? 'Anbefalt behandling:' : 'Recommended treatment:'} {test.treatment}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Category section for BPPV tests
 */
function CategorySection({ categoryKey, category, values, onChange, lang, expanded, onToggle, showTechnique }) {
  const positiveCount = useMemo(() => {
    return category.tests.filter(test => values[`${test.id}_result`] === 'positive').length;
  }, [category.tests, values]);

  return (
    <div className={`border rounded-lg overflow-hidden ${positiveCount > 0 ? 'border-red-200' : 'border-gray-200'}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          <RotateCcw className={`w-5 h-5 ${positiveCount > 0 ? 'text-red-600' : 'text-teal-600'}`} />
          <div className="text-left">
            <span className="font-medium text-gray-700">
              {lang === 'no' ? category.nameNo : category.name}
            </span>
            <span className="text-xs text-gray-500 ml-2">({category.prevalence})</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {positiveCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
              {positiveCount} {lang === 'no' ? 'positiv' : 'positive'}
            </span>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="p-3 space-y-2 bg-gray-50">
          {category.tests.map(test => (
            <BPPVTestItem
              key={test.id}
              test={test}
              values={values}
              onChange={onChange}
              lang={lang}
              showTechnique={showTechnique}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Treatment protocol modal/section
 */
function TreatmentProtocol({ protocol, lang, onClose }) {
  return (
    <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-teal-800">{protocol.name}</h4>
        {onClose && (
          <button onClick={onClose} className="text-teal-600 hover:text-teal-800">
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>
      <p className="text-xs text-teal-600 mb-3">{lang === 'no' ? 'Indikasjon:' : 'Indication:'} {protocol.indication}</p>
      <ol className="space-y-2">
        {protocol.steps.map((step, idx) => (
          <li key={idx} className="flex gap-2 text-sm text-teal-700">
            <span className="flex-shrink-0 w-5 h-5 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs">
              {idx + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Main BPPVTestPanel component
 */
export default function BPPVTestPanel({
  values = {},
  onChange,
  lang = 'no',
  readOnly = false,
  showTechnique = true,
  onGenerateNarrative
}) {
  const [expandedCategories, setExpandedCategories] = useState(new Set(['posterior', 'lateral']));
  const [selectedTreatment, setSelectedTreatment] = useState(null);

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

    Object.values(BPPV_TESTS).forEach(category => {
      category.tests.forEach(test => {
        const result = values[`${test.id}_result`];
        if (result && result !== 'NT') {
          tested++;
          if (result === 'positive') positive++;
        }
      });
    });

    return { tested, positive };
  }, [values]);

  // Determine affected canal
  const diagnosis = useMemo(() => {
    const findings = [];

    if (values['dix_hallpike_right_result'] === 'positive') {
      findings.push({ canal: 'Right posterior canal BPPV', treatment: 'epley' });
    }
    if (values['dix_hallpike_left_result'] === 'positive') {
      findings.push({ canal: 'Left posterior canal BPPV', treatment: 'epley' });
    }
    if (values['supine_roll_right_result'] === 'positive' || values['supine_roll_left_result'] === 'positive') {
      const rightIntensity = values['supine_roll_right_intensity'];
      const leftIntensity = values['supine_roll_left_intensity'];
      const nystagmus = values['supine_roll_right_nystagmus'] || values['supine_roll_left_nystagmus'];

      if (nystagmus?.includes('geotropic')) {
        findings.push({
          canal: `Lateral canal BPPV (geotropic) - ${rightIntensity > leftIntensity ? 'Right' : 'Left'} side`,
          treatment: 'gufoni'
        });
      } else if (nystagmus?.includes('ageotropic')) {
        findings.push({
          canal: `Lateral canal BPPV (ageotropic) - ${rightIntensity < leftIntensity ? 'Right' : 'Left'} side`,
          treatment: 'gufoni'
        });
      }
    }
    if (values['deep_head_hanging_result'] === 'positive') {
      findings.push({ canal: 'Anterior canal BPPV', treatment: 'yacovino' });
    }

    return findings;
  }, [values]);

  // Generate narrative
  const generateNarrative = useMemo(() => {
    if (summary.tested === 0) {
      return lang === 'no' ? 'BPPV-testing ikke utført.' : 'BPPV testing not performed.';
    }

    if (summary.positive === 0) {
      return lang === 'no'
        ? 'BPPV-testing: Dix-Hallpike og Supine Roll tester negative bilateralt. Ingen tegn til benign paroksysmal posisjonsvertigo.'
        : 'BPPV testing: Dix-Hallpike and Supine Roll tests negative bilaterally. No signs of benign paroxysmal positional vertigo.';
    }

    const diagnosisText = diagnosis.map(d => d.canal).join('; ');
    return lang === 'no'
      ? `BPPV-testing: Positiv for ${diagnosisText}. Karakteristisk latency og nystagmusmønster konsistent med kanalolithiasis.`
      : `BPPV testing: Positive for ${diagnosisText}. Characteristic latency and nystagmus pattern consistent with canalithiasis.`;
  }, [values, summary, diagnosis, lang]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {lang === 'no' ? 'BPPV Testing' : 'BPPV Testing'}
          </h3>
          <p className="text-sm text-gray-500">
            {lang === 'no' ? 'Benign paroksysmal posisjonsvertigo' : 'Benign Paroxysmal Positional Vertigo'}
          </p>
          {summary.tested > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {summary.tested} {lang === 'no' ? 'tester' : 'tests'}
              {summary.positive > 0 && (
                <span className="text-red-600 ml-2">
                  {summary.positive} {lang === 'no' ? 'positive' : 'positive'}
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

      {/* Diagnosis summary if positive */}
      {diagnosis.length > 0 && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">
                {lang === 'no' ? 'BPPV Diagnostisert' : 'BPPV Diagnosed'}
              </p>
              {diagnosis.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between mt-1">
                  <span className="text-sm text-red-700">{d.canal}</span>
                  <button
                    onClick={() => setSelectedTreatment(d.treatment)}
                    className="text-xs px-2 py-1 bg-teal-600 text-white rounded hover:bg-teal-700"
                  >
                    {lang === 'no' ? 'Vis behandling' : 'Show treatment'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Treatment protocol if selected */}
      {selectedTreatment && TREATMENT_PROTOCOLS[selectedTreatment] && (
        <TreatmentProtocol
          protocol={TREATMENT_PROTOCOLS[selectedTreatment]}
          lang={lang}
          onClose={() => setSelectedTreatment(null)}
        />
      )}

      {/* Test Categories */}
      <div className="space-y-2">
        {Object.entries(BPPV_TESTS).map(([key, category]) => (
          <CategorySection
            key={key}
            categoryKey={key}
            category={category}
            values={values}
            onChange={onChange}
            lang={lang}
            expanded={expandedCategories.has(key)}
            onToggle={() => toggleCategory(key)}
            showTechnique={showTechnique}
          />
        ))}
      </div>

      {/* Red flags */}
      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-amber-700">
            <p className="font-medium mb-1">{lang === 'no' ? 'Røde flagg for sentral årsak:' : 'Red flags for central cause:'}</p>
            <ul className="space-y-0.5 text-amber-600">
              <li>{lang === 'no' ? 'Vertikal nystagmus uten torsjon' : 'Vertical nystagmus without torsion'}</li>
              <li>{lang === 'no' ? 'Ingen latency' : 'No latency'}</li>
              <li>{lang === 'no' ? 'Ingen fatigering ved repetisjon' : 'No fatigue with repetition'}</li>
              <li>{lang === 'no' ? 'Retningsendring nystagmus' : 'Direction-changing nystagmus'}</li>
              <li>{lang === 'no' ? 'Ledsagende nevrologiske symptomer' : 'Associated neurological symptoms'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick treatment selection */}
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs font-medium text-gray-600 mb-2">
          {lang === 'no' ? 'Behandlingsprotokoller:' : 'Treatment Protocols:'}
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TREATMENT_PROTOCOLS).map(([key, protocol]) => (
            <button
              key={key}
              onClick={() => setSelectedTreatment(key)}
              className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-teal-50 hover:border-teal-300"
            >
              {protocol.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export { BPPV_TESTS, TREATMENT_PROTOCOLS, NYSTAGMUS_TYPES };
