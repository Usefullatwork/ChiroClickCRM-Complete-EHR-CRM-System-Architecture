/**
 * ManualMuscleTesting Component
 *
 * Comprehensive manual muscle testing panel with 16 standardized muscle groups,
 * bilateral testing, and grading system (0-5 with sub-grades).
 *
 * Based on standardized MMT protocols for chiropractic and physical therapy.
 */

import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react';

// MMT Grading Scale with descriptions
const MMT_GRADES = [
  {
    value: '5',
    label: '5',
    description: 'Normal - Full ROM against gravity with maximal resistance',
  },
  {
    value: '5-',
    label: '5-',
    description: 'Normal minus - Full ROM against gravity, breaks with strong resistance',
  },
  {
    value: '4+',
    label: '4+',
    description: 'Good plus - Full ROM against gravity with strong resistance',
  },
  {
    value: '4',
    label: '4',
    description: 'Good - Full ROM against gravity with moderate resistance',
  },
  {
    value: '4-',
    label: '4-',
    description: 'Good minus - Full ROM against gravity with slight resistance',
  },
  {
    value: '3+',
    label: '3+',
    description: 'Fair plus - Full ROM against gravity with minimal resistance',
  },
  { value: '3', label: '3', description: 'Fair - Full ROM against gravity only' },
  { value: '3-', label: '3-', description: 'Fair minus - Partial ROM against gravity' },
  { value: '2+', label: '2+', description: 'Poor plus - Initiates movement against gravity' },
  { value: '2', label: '2', description: 'Poor - Full ROM with gravity eliminated' },
  { value: '2-', label: '2-', description: 'Poor minus - Partial ROM with gravity eliminated' },
  {
    value: '1',
    label: '1',
    description: 'Trace - Visible/palpable muscle contraction, no movement',
  },
  { value: '0', label: '0', description: 'Zero - No visible or palpable contraction' },
  { value: 'NT', label: 'NT', description: 'Not Tested' },
];

// Muscle groups organized by region with nerve roots
const MUSCLE_GROUPS = {
  cervical: {
    name: 'Cervical',
    nameNo: 'Cervikalkolumna',
    muscles: [
      {
        id: 'neck_flexion',
        name: 'Neck Flexion',
        nameNo: 'Nakkefleksjon',
        nerveRoot: 'C1-C2',
        primaryMuscle: 'SCM, Longus Colli',
        position: 'Supine',
        positionNo: 'Ryggliggende',
      },
      {
        id: 'neck_extension',
        name: 'Neck Extension',
        nameNo: 'Nakkeekstensjon',
        nerveRoot: 'C1-C4',
        primaryMuscle: 'Upper Trapezius, Splenius',
        position: 'Prone',
        positionNo: 'Mageliggende',
      },
    ],
  },
  upperExtremity: {
    name: 'Upper Extremity',
    nameNo: 'Overekstremitet',
    muscles: [
      {
        id: 'shoulder_abduction',
        name: 'Shoulder Abduction',
        nameNo: 'Skulder abduksjon',
        nerveRoot: 'C5',
        primaryMuscle: 'Deltoid, Supraspinatus',
        position: 'Sitting',
        positionNo: 'Sittende',
      },
      {
        id: 'shoulder_external_rotation',
        name: 'Shoulder External Rotation',
        nameNo: 'Skulder ekstern rotasjon',
        nerveRoot: 'C5-C6',
        primaryMuscle: 'Infraspinatus, Teres Minor',
        position: 'Sitting/Prone',
        positionNo: 'Sittende/Mageliggende',
      },
      {
        id: 'elbow_flexion',
        name: 'Elbow Flexion',
        nameNo: 'Albuefleksjon',
        nerveRoot: 'C5-C6',
        primaryMuscle: 'Biceps Brachii',
        position: 'Sitting',
        positionNo: 'Sittende',
      },
      {
        id: 'elbow_extension',
        name: 'Elbow Extension',
        nameNo: 'Albueekstensjon',
        nerveRoot: 'C7',
        primaryMuscle: 'Triceps Brachii',
        position: 'Sitting/Prone',
        positionNo: 'Sittende/Mageliggende',
      },
      {
        id: 'wrist_extension',
        name: 'Wrist Extension',
        nameNo: 'Håndleddekstensjon',
        nerveRoot: 'C6-C7',
        primaryMuscle: 'ECRL, ECRB, ECU',
        position: 'Sitting',
        positionNo: 'Sittende',
      },
      {
        id: 'wrist_flexion',
        name: 'Wrist Flexion',
        nameNo: 'Håndleddfleksjon',
        nerveRoot: 'C7-C8',
        primaryMuscle: 'FCR, FCU, PL',
        position: 'Sitting',
        positionNo: 'Sittende',
      },
      {
        id: 'finger_abduction',
        name: 'Finger Abduction',
        nameNo: 'Fingerabduksjon',
        nerveRoot: 'T1',
        primaryMuscle: 'Dorsal Interossei',
        position: 'Sitting',
        positionNo: 'Sittende',
      },
      {
        id: 'thumb_opposition',
        name: 'Thumb Opposition',
        nameNo: 'Tommel opposisjon',
        nerveRoot: 'C8-T1',
        primaryMuscle: 'Opponens Pollicis',
        position: 'Sitting',
        positionNo: 'Sittende',
      },
    ],
  },
  trunk: {
    name: 'Trunk',
    nameNo: 'Trunkus',
    muscles: [
      {
        id: 'trunk_flexion',
        name: 'Trunk Flexion',
        nameNo: 'Trunkusfleksjon',
        nerveRoot: 'T6-T12',
        primaryMuscle: 'Rectus Abdominis',
        position: 'Supine',
        positionNo: 'Ryggliggende',
      },
      {
        id: 'trunk_rotation',
        name: 'Trunk Rotation',
        nameNo: 'Trunkusrotasjon',
        nerveRoot: 'T6-T12',
        primaryMuscle: 'Obliques',
        position: 'Supine',
        positionNo: 'Ryggliggende',
      },
    ],
  },
  lowerExtremity: {
    name: 'Lower Extremity',
    nameNo: 'Underekstremitet',
    muscles: [
      {
        id: 'hip_flexion',
        name: 'Hip Flexion',
        nameNo: 'Hoftefleksjon',
        nerveRoot: 'L1-L2',
        primaryMuscle: 'Iliopsoas',
        position: 'Sitting/Supine',
        positionNo: 'Sittende/Ryggliggende',
      },
      {
        id: 'hip_extension',
        name: 'Hip Extension',
        nameNo: 'Hofteekstensjon',
        nerveRoot: 'L5-S1',
        primaryMuscle: 'Gluteus Maximus',
        position: 'Prone',
        positionNo: 'Mageliggende',
      },
      {
        id: 'hip_abduction',
        name: 'Hip Abduction',
        nameNo: 'Hofteabduksjon',
        nerveRoot: 'L4-S1',
        primaryMuscle: 'Gluteus Medius',
        position: 'Side-lying',
        positionNo: 'Sideliggende',
      },
      {
        id: 'hip_adduction',
        name: 'Hip Adduction',
        nameNo: 'Hofteadduksjon',
        nerveRoot: 'L2-L4',
        primaryMuscle: 'Adductors',
        position: 'Side-lying',
        positionNo: 'Sideliggende',
      },
      {
        id: 'knee_extension',
        name: 'Knee Extension',
        nameNo: 'Kneekstensjon',
        nerveRoot: 'L3-L4',
        primaryMuscle: 'Quadriceps',
        position: 'Sitting',
        positionNo: 'Sittende',
      },
      {
        id: 'knee_flexion',
        name: 'Knee Flexion',
        nameNo: 'Knefleksjon',
        nerveRoot: 'L5-S2',
        primaryMuscle: 'Hamstrings',
        position: 'Prone',
        positionNo: 'Mageliggende',
      },
      {
        id: 'ankle_dorsiflexion',
        name: 'Ankle Dorsiflexion',
        nameNo: 'Ankeldorsalfleksjon',
        nerveRoot: 'L4-L5',
        primaryMuscle: 'Tibialis Anterior',
        position: 'Sitting/Supine',
        positionNo: 'Sittende/Ryggliggende',
      },
      {
        id: 'ankle_plantarflexion',
        name: 'Ankle Plantarflexion',
        nameNo: 'Ankelplantarfleksjon',
        nerveRoot: 'S1-S2',
        primaryMuscle: 'Gastrocnemius, Soleus',
        position: 'Standing/Prone',
        positionNo: 'Stående/Mageliggende',
      },
      {
        id: 'great_toe_extension',
        name: 'Great Toe Extension',
        nameNo: 'Stortåekstensjon',
        nerveRoot: 'L5',
        primaryMuscle: 'EHL',
        position: 'Sitting/Supine',
        positionNo: 'Sittende/Ryggliggende',
      },
    ],
  },
};

/**
 * Grade selector dropdown
 */
function GradeSelector({ value, onChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedGrade = MMT_GRADES.find((g) => g.value === value) || { value: '', label: '-' };

  const getGradeColor = (grade) => {
    if (!grade || grade === 'NT') {
      return 'bg-gray-100 text-gray-600';
    }
    const numericValue = parseFloat(grade.replace('+', '.5').replace('-', '.25'));
    if (numericValue >= 4) {
      return 'bg-green-100 text-green-700 border-green-300';
    }
    if (numericValue >= 3) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
    if (numericValue >= 2) {
      return 'bg-orange-100 text-orange-700 border-orange-300';
    }
    return 'bg-red-100 text-red-700 border-red-300';
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-14 h-8 px-2 text-sm font-medium border rounded-md
                   flex items-center justify-center gap-1
                   ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
                   ${getGradeColor(value)}`}
      >
        {selectedGrade.label || '-'}
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div
            className="absolute z-20 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg
                         max-h-64 overflow-y-auto"
          >
            {MMT_GRADES.map((grade) => (
              <button
                key={grade.value}
                type="button"
                onClick={() => {
                  onChange(grade.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50
                           flex items-center gap-2 border-b border-gray-100 last:border-0
                           ${value === grade.value ? 'bg-teal-50' : ''}`}
              >
                <span
                  className={`w-8 h-6 flex items-center justify-center rounded text-xs font-medium
                                ${getGradeColor(grade.value)}`}
                >
                  {grade.label}
                </span>
                <span className="text-gray-600 text-xs">{grade.description}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Single muscle group row
 */
function MuscleRow({ muscle, values, onChange, lang = 'no', showDetails = false }) {
  const leftValue = values[`${muscle.id}_left`] || '';
  const rightValue = values[`${muscle.id}_right`] || '';
  const painLeft = values[`${muscle.id}_pain_left`] || false;
  const painRight = values[`${muscle.id}_pain_right`] || false;

  const handleChange = (field, value) => {
    onChange({
      ...values,
      [field]: value,
    });
  };

  const hasWeakness = (grade) => {
    if (!grade || grade === 'NT') {
      return false;
    }
    const numericValue = parseFloat(grade.replace('+', '.5').replace('-', '.25'));
    return numericValue < 4;
  };

  const hasAsymmetry = () => {
    if (!leftValue || !rightValue || leftValue === 'NT' || rightValue === 'NT') {
      return false;
    }
    const leftNum = parseFloat(leftValue.replace('+', '.5').replace('-', '.25'));
    const rightNum = parseFloat(rightValue.replace('+', '.5').replace('-', '.25'));
    return Math.abs(leftNum - rightNum) >= 1;
  };

  return (
    <tr className={`border-t border-gray-100 ${hasAsymmetry() ? 'bg-amber-50' : ''}`}>
      <td className="px-3 py-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            {lang === 'no' ? muscle.nameNo : muscle.name}
          </span>
          {showDetails && <span className="text-xs text-gray-500">{muscle.primaryMuscle}</span>}
        </div>
      </td>
      <td className="px-2 py-2 text-center">
        <span className="text-xs font-mono text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
          {muscle.nerveRoot}
        </span>
      </td>
      {showDetails && (
        <td className="px-2 py-2 text-center text-xs text-gray-500">
          {lang === 'no' ? muscle.positionNo : muscle.position}
        </td>
      )}
      <td className="px-2 py-2">
        <div className="flex items-center justify-center gap-2">
          <GradeSelector
            value={leftValue}
            onChange={(val) => handleChange(`${muscle.id}_left`, val)}
          />
          {hasWeakness(leftValue) && <AlertTriangle className="w-4 h-4 text-amber-500" />}
        </div>
      </td>
      <td className="px-2 py-2">
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={painLeft}
            onChange={(e) => handleChange(`${muscle.id}_pain_left`, e.target.checked)}
            className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500"
          />
        </div>
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center justify-center gap-2">
          <GradeSelector
            value={rightValue}
            onChange={(val) => handleChange(`${muscle.id}_right`, val)}
          />
          {hasWeakness(rightValue) && <AlertTriangle className="w-4 h-4 text-amber-500" />}
        </div>
      </td>
      <td className="px-2 py-2">
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={painRight}
            onChange={(e) => handleChange(`${muscle.id}_pain_right`, e.target.checked)}
            className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500"
          />
        </div>
      </td>
    </tr>
  );
}

/**
 * Region section with collapsible muscle groups
 */
function RegionSection({
  _regionKey,
  region,
  values,
  onChange,
  lang,
  showDetails,
  expanded,
  onToggle,
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50
                   hover:bg-gray-100 transition-colors"
      >
        <h4 className="font-medium text-gray-700">
          {lang === 'no' ? region.nameNo : region.name}
          <span className="ml-2 text-xs text-gray-500">
            ({region.muscles.length} {lang === 'no' ? 'muskler' : 'muscles'})
          </span>
        </h4>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-t border-gray-200">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                {lang === 'no' ? 'Muskel' : 'Muscle'}
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                {lang === 'no' ? 'Nerverot' : 'Nerve'}
              </th>
              {showDetails && (
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                  {lang === 'no' ? 'Posisjon' : 'Position'}
                </th>
              )}
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                {lang === 'no' ? 'Venstre' : 'Left'}
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-12">
                <span className="text-red-500">{lang === 'no' ? 'Sm.' : 'Pain'}</span>
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                {lang === 'no' ? 'Høyre' : 'Right'}
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-12">
                <span className="text-red-500">{lang === 'no' ? 'Sm.' : 'Pain'}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {region.muscles.map((muscle) => (
              <MuscleRow
                key={muscle.id}
                muscle={muscle}
                values={values}
                onChange={onChange}
                lang={lang}
                showDetails={showDetails}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/**
 * Quick test buttons for common myotome patterns
 */
function QuickTestPanel({ onSelectPattern, lang }) {
  const patterns = [
    {
      id: 'c5',
      label: 'C5',
      nameNo: 'C5 Myotom',
      muscles: ['shoulder_abduction', 'elbow_flexion'],
    },
    { id: 'c6', label: 'C6', nameNo: 'C6 Myotom', muscles: ['elbow_flexion', 'wrist_extension'] },
    { id: 'c7', label: 'C7', nameNo: 'C7 Myotom', muscles: ['elbow_extension', 'wrist_flexion'] },
    {
      id: 'c8',
      label: 'C8',
      nameNo: 'C8 Myotom',
      muscles: ['finger_abduction', 'thumb_opposition'],
    },
    { id: 'l2', label: 'L2', nameNo: 'L2 Myotom', muscles: ['hip_flexion'] },
    { id: 'l3', label: 'L3', nameNo: 'L3 Myotom', muscles: ['knee_extension'] },
    { id: 'l4', label: 'L4', nameNo: 'L4 Myotom', muscles: ['ankle_dorsiflexion'] },
    {
      id: 'l5',
      label: 'L5',
      nameNo: 'L5 Myotom',
      muscles: ['great_toe_extension', 'hip_abduction'],
    },
    {
      id: 's1',
      label: 'S1',
      nameNo: 'S1 Myotom',
      muscles: ['ankle_plantarflexion', 'knee_flexion'],
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-xs text-gray-500 self-center mr-2">
        {lang === 'no' ? 'Hurtigtest myotomer:' : 'Quick myotome tests:'}
      </span>
      {patterns.map((pattern) => (
        <button
          key={pattern.id}
          type="button"
          onClick={() => onSelectPattern(pattern.muscles)}
          className="px-2 py-1 text-xs font-medium text-teal-700 bg-teal-50
                    border border-teal-200 rounded hover:bg-teal-100 transition-colors"
        >
          {pattern.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Grading legend component
 */
function GradingLegend({ lang }) {
  const [showFull, setShowFull] = useState(false);

  return (
    <div className="bg-gray-50 rounded-lg p-3 text-xs">
      <button
        type="button"
        onClick={() => setShowFull(!showFull)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <Info className="w-4 h-4" />
        <span className="font-medium">{lang === 'no' ? 'Graderingsskala' : 'Grading Scale'}</span>
        {showFull ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showFull ? (
        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
          {MMT_GRADES.filter((g) => g.value !== 'NT').map((grade) => (
            <div key={grade.value} className="flex items-center gap-2">
              <span
                className="w-6 h-5 flex items-center justify-center bg-white border
                             border-gray-200 rounded text-xs font-medium"
              >
                {grade.label}
              </span>
              <span className="text-gray-600 truncate">{grade.description.split(' - ')[0]}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-1 flex flex-wrap gap-3 text-gray-500">
          <span>
            <strong>5</strong>=Normal
          </span>
          <span>
            <strong>4</strong>={lang === 'no' ? 'God' : 'Good'}
          </span>
          <span>
            <strong>3</strong>={lang === 'no' ? 'Moderat' : 'Fair'}
          </span>
          <span>
            <strong>2</strong>={lang === 'no' ? 'Svak' : 'Poor'}
          </span>
          <span>
            <strong>1</strong>={lang === 'no' ? 'Spor' : 'Trace'}
          </span>
          <span>
            <strong>0</strong>={lang === 'no' ? 'Ingen' : 'Zero'}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Main ManualMuscleTesting component
 */
export default function ManualMuscleTesting({
  values = {},
  onChange,
  lang = 'no',
  _readOnly = false,
  showDetails = false,
  onGenerateNarrative,
  defaultExpanded = ['upperExtremity', 'lowerExtremity'],
}) {
  const [expandedRegions, setExpandedRegions] = useState(new Set(defaultExpanded));
  const [_highlightedMuscles, setHighlightedMuscles] = useState(new Set());

  const toggleRegion = (regionKey) => {
    const newExpanded = new Set(expandedRegions);
    if (newExpanded.has(regionKey)) {
      newExpanded.delete(regionKey);
    } else {
      newExpanded.add(regionKey);
    }
    setExpandedRegions(newExpanded);
  };

  const handleSelectPattern = (muscleIds) => {
    // Expand all regions containing these muscles
    const regionsToExpand = new Set(expandedRegions);
    Object.entries(MUSCLE_GROUPS).forEach(([key, region]) => {
      if (region.muscles.some((m) => muscleIds.includes(m.id))) {
        regionsToExpand.add(key);
      }
    });
    setExpandedRegions(regionsToExpand);
    setHighlightedMuscles(new Set(muscleIds));

    // Clear highlight after 2 seconds
    setTimeout(() => setHighlightedMuscles(new Set()), 2000);
  };

  // Calculate summary statistics
  const summary = useMemo(() => {
    let total = 0;
    let weakness = 0;
    let painful = 0;
    let asymmetric = 0;

    Object.values(MUSCLE_GROUPS).forEach((region) => {
      region.muscles.forEach((muscle) => {
        const leftGrade = values[`${muscle.id}_left`];
        const rightGrade = values[`${muscle.id}_right`];

        if (leftGrade && leftGrade !== 'NT') {
          total++;
          const leftNum = parseFloat(leftGrade.replace('+', '.5').replace('-', '.25'));
          if (leftNum < 4) {
            weakness++;
          }
        }
        if (rightGrade && rightGrade !== 'NT') {
          total++;
          const rightNum = parseFloat(rightGrade.replace('+', '.5').replace('-', '.25'));
          if (rightNum < 4) {
            weakness++;
          }
        }

        if (values[`${muscle.id}_pain_left`]) {
          painful++;
        }
        if (values[`${muscle.id}_pain_right`]) {
          painful++;
        }

        // Check for asymmetry
        if (leftGrade && rightGrade && leftGrade !== 'NT' && rightGrade !== 'NT') {
          const leftNum = parseFloat(leftGrade.replace('+', '.5').replace('-', '.25'));
          const rightNum = parseFloat(rightGrade.replace('+', '.5').replace('-', '.25'));
          if (Math.abs(leftNum - rightNum) >= 1) {
            asymmetric++;
          }
        }
      });
    });

    return { total, weakness, painful, asymmetric };
  }, [values]);

  // Generate narrative text
  const generateNarrative = useMemo(() => {
    const findings = [];
    const weaknessByNerve = {};

    Object.values(MUSCLE_GROUPS).forEach((region) => {
      region.muscles.forEach((muscle) => {
        const leftGrade = values[`${muscle.id}_left`];
        const rightGrade = values[`${muscle.id}_right`];
        const painLeft = values[`${muscle.id}_pain_left`];
        const painRight = values[`${muscle.id}_pain_right`];

        const processGrade = (grade, side, hasPain) => {
          if (!grade || grade === 'NT') {
            return null;
          }
          const numericValue = parseFloat(grade.replace('+', '.5').replace('-', '.25'));

          if (numericValue < 4) {
            const muscleName = lang === 'no' ? muscle.nameNo : muscle.name;
            const sideLabel = lang === 'no' ? (side === 'left' ? 'venstre' : 'høyre') : side;
            const painText = hasPain ? (lang === 'no' ? ' med smerte' : ' with pain') : '';

            // Group by nerve root
            if (!weaknessByNerve[muscle.nerveRoot]) {
              weaknessByNerve[muscle.nerveRoot] = [];
            }
            weaknessByNerve[muscle.nerveRoot].push(
              `${muscleName} ${sideLabel}: ${grade}${painText}`
            );
          }
        };

        processGrade(leftGrade, 'left', painLeft);
        processGrade(rightGrade, 'right', painRight);
      });
    });

    // Build narrative
    if (Object.keys(weaknessByNerve).length === 0) {
      return lang === 'no'
        ? 'Manuell muskeltesting: Alle testede muskler viser normal styrke (5/5) bilateralt.'
        : 'Manual Muscle Testing: All tested muscles show normal strength (5/5) bilaterally.';
    }

    Object.entries(weaknessByNerve).forEach(([nerve, muscles]) => {
      findings.push(`${nerve}: ${muscles.join(', ')}`);
    });

    const prefix = lang === 'no' ? 'Manuell muskeltesting funn:' : 'MMT Findings:';
    return `${prefix} ${findings.join('. ')}.`;
  }, [values, lang]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {lang === 'no' ? 'Manuell Muskeltesting (MMT)' : 'Manual Muscle Testing (MMT)'}
          </h3>
          {summary.total > 0 && (
            <p className="text-sm text-gray-500">
              {summary.total} {lang === 'no' ? 'tester' : 'tests'}
              {summary.weakness > 0 && (
                <span className="text-amber-600 ml-2">
                  • {summary.weakness} {lang === 'no' ? 'svakhet' : 'weakness'}
                </span>
              )}
              {summary.asymmetric > 0 && (
                <span className="text-orange-600 ml-2">
                  • {summary.asymmetric} {lang === 'no' ? 'asymmetri' : 'asymmetry'}
                </span>
              )}
              {summary.painful > 0 && (
                <span className="text-red-600 ml-2">
                  • {summary.painful} {lang === 'no' ? 'smertefulle' : 'painful'}
                </span>
              )}
            </p>
          )}
        </div>

        {onGenerateNarrative && (
          <button
            onClick={() => onGenerateNarrative(generateNarrative)}
            className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg
                      hover:bg-teal-700 transition-colors"
          >
            {lang === 'no' ? 'Generer tekst' : 'Generate Text'}
          </button>
        )}
      </div>

      {/* Grading Legend */}
      <GradingLegend lang={lang} />

      {/* Quick Test Panel */}
      <QuickTestPanel onSelectPattern={handleSelectPattern} lang={lang} />

      {/* Muscle Groups */}
      <div className="space-y-3">
        {Object.entries(MUSCLE_GROUPS).map(([key, region]) => (
          <RegionSection
            key={key}
            regionKey={key}
            region={region}
            values={values}
            onChange={onChange}
            lang={lang}
            showDetails={showDetails}
            expanded={expandedRegions.has(key)}
            onToggle={() => toggleRegion(key)}
          />
        ))}
      </div>

      {/* Summary indicators */}
      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
          <span>{lang === 'no' ? 'Normal (≥4)' : 'Normal (≥4)'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded" />
          <span>{lang === 'no' ? 'Moderat (3)' : 'Fair (3)'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded" />
          <span>{lang === 'no' ? 'Svak (2)' : 'Poor (2)'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded" />
          <span>{lang === 'no' ? 'Spor/Ingen (0-1)' : 'Trace/Zero (0-1)'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-50 border border-amber-300 rounded" />
          <span>{lang === 'no' ? 'Asymmetri' : 'Asymmetry'}</span>
        </div>
      </div>
    </div>
  );
}

// Export grading and muscle data for use in other components
export { MMT_GRADES, MUSCLE_GROUPS };
