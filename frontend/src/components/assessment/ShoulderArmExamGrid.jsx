import { useState } from 'react';
import { ChevronDown, ChevronUp, _Check, AlertCircle, FileText } from 'lucide-react';
import QuickCheckboxGrid, {
  SHOULDER_ROM_OPTIONS,
  SHOULDER_IMPINGEMENT_OPTIONS,
  SHOULDER_ROTATOR_CUFF_OPTIONS,
  SHOULDER_INSTABILITY_OPTIONS,
  SHOULDER_LABRAL_OPTIONS,
  SHOULDER_BICEPS_OPTIONS,
  SHOULDER_AC_JOINT_OPTIONS,
  SHOULDER_FROZEN_OPTIONS,
  SHOULDER_TREATMENT_OPTIONS,
} from './QuickCheckboxGrid';

/**
 * ShoulderArmExamGrid - Comprehensive shoulder and arm examination component
 * Based on orthopedic examination protocols for chiropractic/physiotherapy practice
 *
 * Features:
 * - Structured examination flow
 * - Condition-specific test batteries
 * - Auto-generates clinical documentation
 * - Supports both Norwegian and English terminology
 */

const EXAM_SECTIONS = [
  { id: 'rom', title: 'Range of Motion', icon: '🔄' },
  { id: 'impingement', title: 'Impingement Tests', icon: '⚠️' },
  { id: 'rotator_cuff', title: 'Rotator Cuff Tests', icon: '💪' },
  { id: 'instability', title: 'Instability Tests', icon: '🎯' },
  { id: 'labral', title: 'Labral/SLAP Tests', icon: '🔍' },
  { id: 'biceps', title: 'Biceps Tests', icon: '💪' },
  { id: 'ac_joint', title: 'AC Joint Tests', icon: '🦴' },
  { id: 'frozen', title: 'Frozen Shoulder', icon: '❄️' },
  { id: 'treatment', title: 'Treatment Plan', icon: '📋' },
];

const SECTION_OPTIONS = {
  rom: SHOULDER_ROM_OPTIONS,
  impingement: SHOULDER_IMPINGEMENT_OPTIONS,
  rotator_cuff: SHOULDER_ROTATOR_CUFF_OPTIONS,
  instability: SHOULDER_INSTABILITY_OPTIONS,
  labral: SHOULDER_LABRAL_OPTIONS,
  biceps: SHOULDER_BICEPS_OPTIONS,
  ac_joint: SHOULDER_AC_JOINT_OPTIONS,
  frozen: SHOULDER_FROZEN_OPTIONS,
  treatment: SHOULDER_TREATMENT_OPTIONS,
};

// Clinical impression suggestions based on positive findings
const CLINICAL_IMPRESSIONS = {
  impingement: {
    pattern: ['hawkins_pos', 'neer_pos', 'painful_arc_pos'],
    diagnosis: 'Subacromial Impingement Syndrome',
    icd10: 'M75.4',
  },
  rotator_cuff_strain: {
    pattern: ['empty_can_pos', 'drop_arm_pos'],
    diagnosis: 'Rotator Cuff Strain/Tendinopathy',
    icd10: 'M75.1',
  },
  subscapularis: {
    pattern: ['lift_off_pos', 'bear_hug_pos', 'ir_lag_pos'],
    diagnosis: 'Subscapularis Tendinopathy',
    icd10: 'M75.1',
  },
  bicipital: {
    pattern: ['speed_pos', 'yergason_pos'],
    diagnosis: 'Bicipital Tendinopathy',
    icd10: 'M75.2',
  },
  labral: {
    pattern: ['obrien_pos', 'clunk_pos', 'crank_pos', 'biceps_load_pos'],
    diagnosis: 'Glenoid Labral Tear (SLAP Lesion)',
    icd10: 'S43.43',
  },
  anterior_instability: {
    pattern: ['ant_appr_pos', 'relocation_pos'],
    diagnosis: 'Anterior GH Instability',
    icd10: 'M24.41',
  },
  ac_sprain: {
    pattern: ['ac_shear_pos', 'piano_key_pos', 'horiz_add_pos'],
    diagnosis: 'AC Joint Sprain/Separation',
    icd10: 'S43.1',
  },
  frozen_shoulder: {
    pattern: ['frozen_capsular_pattern', 'frozen_er_limited'],
    diagnosis: 'Adhesive Capsulitis (Frozen Shoulder)',
    icd10: 'M75.0',
  },
};

export default function ShoulderArmExamGrid({
  side = 'right', // 'left', 'right', or 'bilateral'
  selectedValues = {},
  onChange,
  _showNarrative = true,
  _language = 'EN',
  className = '',
}) {
  const [expandedSections, setExpandedSections] = useState(['rom']);
  const [activeTab, setActiveTab] = useState('exam');

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((s) => s !== sectionId) : [...prev, sectionId]
    );
  };

  const handleSectionChange = (sectionId, values) => {
    onChange({
      ...selectedValues,
      [sectionId]: values,
    });
  };

  // Get all selected values across all sections
  const getAllSelectedValues = () => {
    return Object.values(selectedValues).flat();
  };

  // Determine suggested diagnoses based on findings
  const getSuggestedDiagnoses = () => {
    const allSelected = getAllSelectedValues();
    const suggestions = [];

    Object.entries(CLINICAL_IMPRESSIONS).forEach(([_key, impression]) => {
      const matchCount = impression.pattern.filter((p) => allSelected.includes(p)).length;
      if (matchCount >= 2) {
        suggestions.push({
          ...impression,
          confidence: Math.round((matchCount / impression.pattern.length) * 100),
        });
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  };

  // Generate narrative documentation
  const generateNarrative = () => {
    const allSelected = getAllSelectedValues();
    if (allSelected.length === 0) {
      return '';
    }

    const sideText = side === 'bilateral' ? 'bilateral' : `${side}`;
    let narrative = `SHOULDER EXAMINATION - ${sideText.toUpperCase()}\n\n`;

    // ROM findings
    const romFindings = selectedValues.rom || [];
    if (romFindings.length > 0) {
      narrative += 'Range of Motion:\n';
      romFindings.forEach((finding) => {
        const option = Object.values(SHOULDER_ROM_OPTIONS)
          .flat()
          .find((opt) => opt.value === finding);
        if (option) {
          narrative += `- ${option.label}\n`;
        }
      });
      narrative += '\n';
    }

    // Special tests
    const testSections = [
      'impingement',
      'rotator_cuff',
      'instability',
      'labral',
      'biceps',
      'ac_joint',
    ];
    const positiveTests = [];
    const negativeTests = [];

    testSections.forEach((section) => {
      const findings = selectedValues[section] || [];
      findings.forEach((finding) => {
        const options = SECTION_OPTIONS[section];
        const option = Object.values(options)
          .flat()
          .find((opt) => opt.value === finding);
        if (option) {
          if (finding.includes('_pos')) {
            positiveTests.push(option.label);
          } else if (finding.includes('_neg')) {
            negativeTests.push(option.label);
          }
        }
      });
    });

    if (positiveTests.length > 0) {
      narrative += 'Positive Special Tests:\n';
      positiveTests.forEach((test) => {
        narrative += `- ${test}\n`;
      });
      narrative += '\n';
    }

    if (negativeTests.length > 0) {
      narrative += 'Negative Special Tests:\n';
      negativeTests.forEach((test) => {
        narrative += `- ${test}\n`;
      });
      narrative += '\n';
    }

    // Suggested diagnoses
    const diagnoses = getSuggestedDiagnoses();
    if (diagnoses.length > 0) {
      narrative += 'Clinical Impression:\n';
      diagnoses.forEach((dx) => {
        narrative += `- ${dx.diagnosis} (${dx.icd10}) - ${dx.confidence}% match\n`;
      });
      narrative += '\n';
    }

    // Treatment plan
    const treatmentFindings = selectedValues.treatment || [];
    if (treatmentFindings.length > 0) {
      narrative += 'Treatment Plan:\n';
      treatmentFindings.forEach((finding) => {
        const option = Object.values(SHOULDER_TREATMENT_OPTIONS)
          .flat()
          .find((opt) => opt.value === finding);
        if (option) {
          narrative += `- ${option.label}\n`;
        }
      });
    }

    return narrative;
  };

  const totalSelected = getAllSelectedValues().length;
  const suggestedDiagnoses = getSuggestedDiagnoses();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦴</span>
            <div>
              <h2 className="font-semibold text-gray-900">Shoulder & Arm Examination</h2>
              <p className="text-sm text-gray-500">
                {side === 'bilateral'
                  ? 'Bilateral'
                  : `${side.charAt(0).toUpperCase() + side.slice(1)} side`}
                {totalSelected > 0 && ` • ${totalSelected} findings selected`}
              </p>
            </div>
          </div>

          {/* Side selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Side:</span>
            <div className="flex rounded-lg overflow-hidden border border-gray-300">
              {['left', 'right', 'bilateral'].map((s) => (
                <button
                  key={s}
                  onClick={() => onChange({ ...selectedValues, _side: s })}
                  className={`px-3 py-1 text-sm ${
                    side === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s === 'bilateral' ? 'Both' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-3">
          <button
            onClick={() => setActiveTab('exam')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              activeTab === 'exam'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Examination
          </button>
          <button
            onClick={() => setActiveTab('narrative')}
            className={`px-3 py-1 text-sm font-medium rounded-md flex items-center gap-1 ${
              activeTab === 'narrative'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Documentation
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'exam' ? (
        <div className="divide-y divide-gray-100">
          {/* Suggested Diagnoses Alert */}
          {suggestedDiagnoses.length > 0 && (
            <div className="p-3 bg-amber-50 border-b border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Suggested Diagnoses:</p>
                  <ul className="mt-1 space-y-1">
                    {suggestedDiagnoses.slice(0, 3).map((dx, i) => (
                      <li key={i} className="text-sm text-amber-700">
                        {dx.diagnosis} ({dx.icd10}) - {dx.confidence}% confidence
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Exam Sections */}
          {EXAM_SECTIONS.map((section) => {
            const isExpanded = expandedSections.includes(section.id);
            const sectionValues = selectedValues[section.id] || [];
            const positiveCount = sectionValues.filter((v) => v.includes('_pos')).length;

            return (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{section.icon}</span>
                    <span className="font-medium text-gray-900">{section.title}</span>
                    {sectionValues.length > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {sectionValues.length}
                      </span>
                    )}
                    {positiveCount > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                        {positiveCount} positive
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    <QuickCheckboxGrid
                      title=""
                      categories={SECTION_OPTIONS[section.id]}
                      selectedValues={sectionValues}
                      onChange={(values) => handleSectionChange(section.id, values)}
                      columns={2}
                      showGeneratedText={false}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Documentation Tab */
        <div className="p-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Generated Clinical Documentation</h3>
              <button
                onClick={() => navigator.clipboard.writeText(generateNarrative())}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Copy to Clipboard
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-white p-4 rounded border border-gray-200 max-h-96 overflow-y-auto">
              {generateNarrative() ||
                'No findings selected. Select examination findings to generate documentation.'}
            </pre>
          </div>
        </div>
      )}

      {/* Footer with quick stats */}
      {totalSelected > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{totalSelected} findings documented</span>
            <div className="flex items-center gap-4">
              {suggestedDiagnoses.length > 0 && (
                <span className="text-amber-600 font-medium">
                  {suggestedDiagnoses.length} suggested{' '}
                  {suggestedDiagnoses.length === 1 ? 'diagnosis' : 'diagnoses'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export condition-specific quick exam presets
export const SHOULDER_EXAM_PRESETS = {
  impingementScreen: {
    name: 'Impingement Screen',
    sections: ['rom', 'impingement'],
    description: 'Quick screen for subacromial impingement',
  },
  rotatorCuffScreen: {
    name: 'Rotator Cuff Screen',
    sections: ['rom', 'rotator_cuff', 'impingement'],
    description: 'Comprehensive rotator cuff evaluation',
  },
  instabilityScreen: {
    name: 'Instability Screen',
    sections: ['rom', 'instability', 'labral'],
    description: 'GH instability and labral assessment',
  },
  frozenShoulderScreen: {
    name: 'Frozen Shoulder Screen',
    sections: ['rom', 'frozen'],
    description: 'Adhesive capsulitis evaluation',
  },
  comprehensiveExam: {
    name: 'Comprehensive Exam',
    sections: ['rom', 'impingement', 'rotator_cuff', 'instability', 'labral', 'biceps', 'ac_joint'],
    description: 'Full shoulder examination',
  },
};
