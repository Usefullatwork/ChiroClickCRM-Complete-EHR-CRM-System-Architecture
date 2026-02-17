/**
 * SensoryExamination Component
 *
 * Comprehensive sensory examination panel for neurological assessment.
 * Includes light touch, sharp/dull, vibration, position sense,
 * stereognosis, graphesthesia, and 2-point discrimination.
 */

import _React, { useMemo, useState } from 'react';
import {
  Hand,
  Zap,
  CircleDot,
  ChevronDown,
  ChevronUp,
  _AlertTriangle,
  _CheckCircle,
  _XCircle,
  _MinusCircle,
  Info,
} from 'lucide-react';

// Sensory modalities
const SENSORY_MODALITIES = [
  {
    id: 'light_touch',
    name: 'Light Touch',
    nameNo: 'Lett berøring',
    description: 'Test with cotton wisp or fingertip',
    descriptionNo: 'Test med bomullsdott eller fingerspiss',
    icon: Hand,
    pathway: 'Dorsal columns / Spinothalamic',
    pathwayNo: 'Bakstrengene / Spinothalamicus',
  },
  {
    id: 'pinprick',
    name: 'Pinprick (Sharp/Dull)',
    nameNo: 'Nålestikk (Skarp/Stump)',
    description: 'Test with pin or broken tongue depressor',
    descriptionNo: 'Test med nål eller knukket tungespattel',
    icon: Zap,
    pathway: 'Spinothalamic tract',
    pathwayNo: 'Tractus spinothalamicus',
  },
  {
    id: 'vibration',
    name: 'Vibration',
    nameNo: 'Vibrasjon',
    description: '128Hz tuning fork on bony prominences',
    descriptionNo: '128Hz stemmegaffel på benete prominenser',
    icon: CircleDot,
    pathway: 'Dorsal columns',
    pathwayNo: 'Bakstrengene',
  },
  {
    id: 'proprioception',
    name: 'Proprioception (Position Sense)',
    nameNo: 'Propriosepsjon (Stillingssans)',
    description: 'Move digit up/down with eyes closed',
    descriptionNo: 'Beveg finger/tå opp/ned med lukkede øyne',
    icon: Hand,
    pathway: 'Dorsal columns',
    pathwayNo: 'Bakstrengene',
  },
  {
    id: 'temperature',
    name: 'Temperature',
    nameNo: 'Temperatur',
    description: 'Test with cold tuning fork or test tubes',
    descriptionNo: 'Test med kald stemmegaffel eller reagensrør',
    icon: Zap,
    pathway: 'Spinothalamic tract',
    pathwayNo: 'Tractus spinothalamicus',
  },
];

// Cortical sensory modalities
const CORTICAL_MODALITIES = [
  {
    id: 'stereognosis',
    name: 'Stereognosis',
    nameNo: 'Stereognosi',
    description: 'Identify object by touch with eyes closed (coin, key, pen)',
    descriptionNo: 'Identifiser gjenstand ved berøring med lukkede øyne (mynt, nøkkel, penn)',
    pathway: 'Parietal cortex',
    pathwayNo: 'Parietalkorteks',
  },
  {
    id: 'graphesthesia',
    name: 'Graphesthesia',
    nameNo: 'Grafestesi',
    description: 'Identify number/letter drawn on palm with eyes closed',
    descriptionNo: 'Identifiser tall/bokstav tegnet i håndflaten med lukkede øyne',
    pathway: 'Parietal cortex',
    pathwayNo: 'Parietalkorteks',
  },
  {
    id: 'two_point',
    name: 'Two-Point Discrimination',
    nameNo: 'Topunktsdiskriminasjon',
    description: 'Distinguish one vs two points (fingertip: 2-4mm normal)',
    descriptionNo: 'Skille en vs to punkter (fingerspiss: 2-4mm normalt)',
    pathway: 'Dorsal columns / Parietal cortex',
    pathwayNo: 'Bakstrengene / Parietalkorteks',
  },
  {
    id: 'extinction',
    name: 'Sensory Extinction',
    nameNo: 'Sensorisk ekstinksjon',
    description: 'Bilateral simultaneous stimulation - failure to perceive one side',
    descriptionNo: 'Bilateral simultan stimulering - manglende persepsjon på én side',
    pathway: 'Parietal cortex (neglect)',
    pathwayNo: 'Parietalkorteks (neglekt)',
  },
];

// Dermatome regions for testing
const DERMATOME_REGIONS = {
  upperExtremity: {
    name: 'Upper Extremity',
    nameNo: 'Overekstremitet',
    dermatomes: [
      { id: 'c4', level: 'C4', landmark: 'Top of shoulder', landmarkNo: 'Toppen av skulderen' },
      {
        id: 'c5',
        level: 'C5',
        landmark: 'Lateral arm (deltoid)',
        landmarkNo: 'Lateral arm (deltoid)',
      },
      {
        id: 'c6',
        level: 'C6',
        landmark: 'Thumb, lateral forearm',
        landmarkNo: 'Tommel, lateral underarm',
      },
      { id: 'c7', level: 'C7', landmark: 'Middle finger', landmarkNo: 'Langfinger' },
      {
        id: 'c8',
        level: 'C8',
        landmark: 'Little finger, medial forearm',
        landmarkNo: 'Lillefinger, medial underarm',
      },
      { id: 't1', level: 'T1', landmark: 'Medial arm', landmarkNo: 'Medial arm' },
    ],
  },
  trunk: {
    name: 'Trunk',
    nameNo: 'Trunkus',
    dermatomes: [
      { id: 't4', level: 'T4', landmark: 'Nipple line', landmarkNo: 'Brystvortenivå' },
      { id: 't7', level: 'T7', landmark: 'Xiphoid process', landmarkNo: 'Processus xiphoideus' },
      { id: 't10', level: 'T10', landmark: 'Umbilicus', landmarkNo: 'Navlen' },
      { id: 't12', level: 'T12', landmark: 'Inguinal ligament', landmarkNo: 'Lysken' },
    ],
  },
  lowerExtremity: {
    name: 'Lower Extremity',
    nameNo: 'Underekstremitet',
    dermatomes: [
      { id: 'l1', level: 'L1', landmark: 'Inguinal region', landmarkNo: 'Lyske' },
      { id: 'l2', level: 'L2', landmark: 'Anterior thigh', landmarkNo: 'Fremre lår' },
      { id: 'l3', level: 'L3', landmark: 'Medial knee', landmarkNo: 'Medialt kne' },
      { id: 'l4', level: 'L4', landmark: 'Medial malleolus', landmarkNo: 'Medial malleol' },
      {
        id: 'l5',
        level: 'L5',
        landmark: 'Dorsum of foot, great toe',
        landmarkNo: 'Fotrygg, stortå',
      },
      {
        id: 's1',
        level: 'S1',
        landmark: 'Lateral foot, little toe',
        landmarkNo: 'Lateral fot, lilletå',
      },
      { id: 's2', level: 'S2', landmark: 'Posterior thigh', landmarkNo: 'Bakre lår' },
      { id: 's3_s5', level: 'S3-S5', landmark: 'Perianal region', landmarkNo: 'Perianal region' },
    ],
  },
};

// Finding options
const FINDING_OPTIONS = [
  { value: 'NT', label: 'Not Tested', labelNo: 'Ikke testet', color: 'bg-gray-100 text-gray-500' },
  { value: 'normal', label: 'Normal', labelNo: 'Normal', color: 'bg-green-100 text-green-700' },
  {
    value: 'decreased',
    label: 'Decreased',
    labelNo: 'Nedsatt',
    color: 'bg-amber-100 text-amber-700',
  },
  { value: 'absent', label: 'Absent', labelNo: 'Fraværende', color: 'bg-red-100 text-red-700' },
  {
    value: 'increased',
    label: 'Increased',
    labelNo: 'Økt',
    color: 'bg-purple-100 text-purple-700',
  },
  {
    value: 'altered',
    label: 'Altered',
    labelNo: 'Forandret',
    color: 'bg-orange-100 text-orange-700',
  },
];

/**
 * Finding selector component
 */
function FindingSelector({ value, onChange, disabled = false, lang = 'no' }) {
  const [isOpen, setIsOpen] = useState(false);
  const current = FINDING_OPTIONS.find((o) => o.value === value) || FINDING_OPTIONS[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`px-2 py-1 text-xs font-medium rounded border min-w-[70px]
                   ${current.color} ${disabled ? 'opacity-50' : 'hover:opacity-80'}`}
      >
        {lang === 'no' ? current.labelNo : current.label}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 bg-white border rounded-lg shadow-lg overflow-hidden">
            {FINDING_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50
                           ${value === option.value ? 'bg-gray-100' : ''}`}
              >
                <span className={`inline-block px-1.5 py-0.5 rounded ${option.color}`}>
                  {lang === 'no' ? option.labelNo : option.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Dermatome testing row
 */
function DermatomeRow({ dermatome, modality, values, onChange, lang }) {
  const leftKey = `${modality}_${dermatome.id}_left`;
  const rightKey = `${modality}_${dermatome.id}_right`;

  return (
    <tr className="border-t border-gray-100">
      <td className="px-3 py-2">
        <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
          {dermatome.level}
        </span>
      </td>
      <td className="px-3 py-2 text-xs text-gray-600">
        {lang === 'no' ? dermatome.landmarkNo : dermatome.landmark}
      </td>
      <td className="px-2 py-2">
        <FindingSelector
          value={values[leftKey] || 'NT'}
          onChange={(v) => onChange({ ...values, [leftKey]: v })}
          lang={lang}
        />
      </td>
      <td className="px-2 py-2">
        <FindingSelector
          value={values[rightKey] || 'NT'}
          onChange={(v) => onChange({ ...values, [rightKey]: v })}
          lang={lang}
        />
      </td>
    </tr>
  );
}

/**
 * Modality section with dermatome testing
 */
function ModalitySection({ modality, values, onChange, lang, expanded, onToggle }) {
  const Icon = modality.icon || Hand;

  // Count abnormalities
  const abnormalCount = useMemo(() => {
    let count = 0;
    Object.entries(values).forEach(([key, val]) => {
      if (key.startsWith(modality.id) && val && val !== 'NT' && val !== 'normal') {
        count++;
      }
    });
    return count;
  }, [values, modality.id]);

  return (
    <div
      className={`border rounded-lg overflow-hidden
                    ${abnormalCount > 0 ? 'border-amber-200' : 'border-gray-200'}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${abnormalCount > 0 ? 'text-amber-600' : 'text-teal-600'}`} />
          <div className="text-left">
            <span className="font-medium text-gray-700">
              {lang === 'no' ? modality.nameNo : modality.name}
            </span>
            <p className="text-xs text-gray-500">
              {lang === 'no' ? modality.pathwayNo : modality.pathway}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {abnormalCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
              {abnormalCount} {lang === 'no' ? 'funn' : 'findings'}
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
        <div className="p-4 bg-white">
          <p className="text-xs text-gray-500 mb-3">
            {lang === 'no' ? modality.descriptionNo : modality.description}
          </p>

          {Object.entries(DERMATOME_REGIONS).map(([regionKey, region]) => (
            <div key={regionKey} className="mb-4 last:mb-0">
              <h5 className="text-xs font-medium text-gray-500 mb-2">
                {lang === 'no' ? region.nameNo : region.name}
              </h5>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500">
                    <th className="px-3 py-1 text-left w-16">{lang === 'no' ? 'Nivå' : 'Level'}</th>
                    <th className="px-3 py-1 text-left">
                      {lang === 'no' ? 'Landemerke' : 'Landmark'}
                    </th>
                    <th className="px-2 py-1 text-center w-20">{lang === 'no' ? 'V' : 'L'}</th>
                    <th className="px-2 py-1 text-center w-20">{lang === 'no' ? 'H' : 'R'}</th>
                  </tr>
                </thead>
                <tbody>
                  {region.dermatomes.map((dermatome) => (
                    <DermatomeRow
                      key={dermatome.id}
                      dermatome={dermatome}
                      modality={modality.id}
                      values={values}
                      onChange={onChange}
                      lang={lang}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Cortical sensory section
 */
function CorticalSensorySection({ values, onChange, lang, expanded, onToggle }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 font-bold text-sm">Cx</span>
          </div>
          <div className="text-left">
            <span className="font-medium text-gray-700">
              {lang === 'no' ? 'Kortikal Sensibilitet' : 'Cortical Sensation'}
            </span>
            <p className="text-xs text-gray-500">
              {lang === 'no' ? 'Parietallapp-funksjon' : 'Parietal lobe function'}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="p-4 bg-white space-y-3">
          {CORTICAL_MODALITIES.map((modality) => (
            <div
              key={modality.id}
              className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">
                  {lang === 'no' ? modality.nameNo : modality.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {lang === 'no' ? modality.descriptionNo : modality.description}
                </p>
              </div>
              <div className="flex gap-2">
                <div className="text-center">
                  <span className="text-[10px] text-gray-400 block mb-1">
                    {lang === 'no' ? 'V' : 'L'}
                  </span>
                  <FindingSelector
                    value={values[`${modality.id}_left`] || 'NT'}
                    onChange={(v) => onChange({ ...values, [`${modality.id}_left`]: v })}
                    lang={lang}
                  />
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-gray-400 block mb-1">
                    {lang === 'no' ? 'H' : 'R'}
                  </span>
                  <FindingSelector
                    value={values[`${modality.id}_right`] || 'NT'}
                    onChange={(v) => onChange({ ...values, [`${modality.id}_right`]: v })}
                    lang={lang}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Quick screening buttons
 */
function QuickScreening({ values, onChange, lang }) {
  const setAllNormal = (modality) => {
    const updates = { ...values };
    Object.values(DERMATOME_REGIONS).forEach((region) => {
      region.dermatomes.forEach((d) => {
        updates[`${modality}_${d.id}_left`] = 'normal';
        updates[`${modality}_${d.id}_right`] = 'normal';
      });
    });
    onChange(updates);
  };

  return (
    <div className="bg-teal-50 rounded-lg p-3 border border-teal-100">
      <span className="text-sm font-medium text-teal-800 block mb-2">
        {lang === 'no'
          ? 'Hurtigscreening - Sett alle normale:'
          : 'Quick Screening - Set all normal:'}
      </span>
      <div className="flex flex-wrap gap-2">
        {SENSORY_MODALITIES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setAllNormal(m.id)}
            className="px-2 py-1 text-xs bg-white border border-teal-200 rounded
                      hover:bg-teal-100 text-teal-700"
          >
            {lang === 'no' ? m.nameNo : m.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Main SensoryExamination component
 */
export default function SensoryExamination({
  values = {},
  onChange,
  lang = 'no',
  _readOnly = false,
  onGenerateNarrative,
}) {
  const [expandedSections, setExpandedSections] = useState(new Set(['light_touch', 'pinprick']));

  const toggleSection = (id) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  // Calculate summary
  const summary = useMemo(() => {
    let tested = 0;
    let abnormal = 0;

    Object.entries(values).forEach(([_key, val]) => {
      if (val && val !== 'NT') {
        tested++;
        if (val !== 'normal') {
          abnormal++;
        }
      }
    });

    return { tested, abnormal };
  }, [values]);

  // Generate narrative
  const generateNarrative = useMemo(() => {
    const findings = [];

    SENSORY_MODALITIES.forEach((modality) => {
      const modalityFindings = [];

      Object.values(DERMATOME_REGIONS).forEach((region) => {
        region.dermatomes.forEach((d) => {
          const leftVal = values[`${modality.id}_${d.id}_left`];
          const rightVal = values[`${modality.id}_${d.id}_right`];

          if (leftVal && leftVal !== 'NT' && leftVal !== 'normal') {
            modalityFindings.push(
              `${d.level} ${lang === 'no' ? 'venstre' : 'left'}: ${lang === 'no' ? FINDING_OPTIONS.find((o) => o.value === leftVal)?.labelNo : leftVal}`
            );
          }
          if (rightVal && rightVal !== 'NT' && rightVal !== 'normal') {
            modalityFindings.push(
              `${d.level} ${lang === 'no' ? 'høyre' : 'right'}: ${lang === 'no' ? FINDING_OPTIONS.find((o) => o.value === rightVal)?.labelNo : rightVal}`
            );
          }
        });
      });

      if (modalityFindings.length > 0) {
        findings.push(
          `${lang === 'no' ? modality.nameNo : modality.name}: ${modalityFindings.join(', ')}`
        );
      }
    });

    if (findings.length === 0) {
      return lang === 'no'
        ? 'Sensibilitetsundersøkelse: Intakt for alle testede modaliteter og dermatomer bilateralt.'
        : 'Sensory Examination: Intact for all tested modalities and dermatomes bilaterally.';
    }

    return `${lang === 'no' ? 'Sensibilitetsundersøkelse:' : 'Sensory Examination:'} ${findings.join('. ')}.`;
  }, [values, lang]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {lang === 'no' ? 'Sensibilitetsundersøkelse' : 'Sensory Examination'}
          </h3>
          {summary.tested > 0 && (
            <p className="text-sm text-gray-500">
              {summary.tested} {lang === 'no' ? 'tester' : 'tests'}
              {summary.abnormal > 0 && (
                <span className="text-amber-600 ml-2">
                  • {summary.abnormal} {lang === 'no' ? 'funn' : 'findings'}
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

      {/* Quick Screening */}
      <QuickScreening values={values} onChange={onChange} lang={lang} />

      {/* Primary Modalities */}
      <div className="space-y-2">
        {SENSORY_MODALITIES.map((modality) => (
          <ModalitySection
            key={modality.id}
            modality={modality}
            values={values}
            onChange={onChange}
            lang={lang}
            expanded={expandedSections.has(modality.id)}
            onToggle={() => toggleSection(modality.id)}
          />
        ))}
      </div>

      {/* Cortical Sensation */}
      <CorticalSensorySection
        values={values}
        onChange={onChange}
        lang={lang}
        expanded={expandedSections.has('cortical')}
        onToggle={() => toggleSection('cortical')}
      />

      {/* Clinical patterns info */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-blue-700">
            <p className="font-medium mb-1">
              {lang === 'no' ? 'Kliniske mønstre:' : 'Clinical Patterns:'}
            </p>
            <ul className="space-y-0.5 text-blue-600">
              <li>
                • {lang === 'no' ? 'Dermatomalt: Nerverotslesjon' : 'Dermatomal: Nerve root lesion'}
              </li>
              <li>
                •{' '}
                {lang === 'no'
                  ? 'Perifer nerve: Følger nerveforløp'
                  : 'Peripheral nerve: Follows nerve distribution'}
              </li>
              <li>
                •{' '}
                {lang === 'no' ? 'Hanske/strømpe: Polynevropati' : 'Glove/stocking: Polyneuropathy'}
              </li>
              <li>
                •{' '}
                {lang === 'no'
                  ? 'Sensory level: Ryggmargsskade'
                  : 'Sensory level: Spinal cord lesion'}
              </li>
              <li>
                •{' '}
                {lang === 'no' ? 'Hemianestesi: Sentral lesjon' : 'Hemianesthesia: Central lesion'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export { SENSORY_MODALITIES, CORTICAL_MODALITIES, DERMATOME_REGIONS, FINDING_OPTIONS };
