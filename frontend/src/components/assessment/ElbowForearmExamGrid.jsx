import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, FileText } from 'lucide-react';
import QuickCheckboxGrid, {
  ELBOW_ROM_OPTIONS,
  ELBOW_LATERAL_EPICONDYLITIS_OPTIONS,
  ELBOW_MEDIAL_EPICONDYLITIS_OPTIONS,
  ELBOW_STABILITY_OPTIONS,
  ELBOW_CUBITAL_TUNNEL_OPTIONS,
  ELBOW_BURSITIS_OPTIONS,
  ELBOW_TREATMENT_OPTIONS
} from './QuickCheckboxGrid';

/**
 * ElbowForearmExamGrid - Comprehensive elbow and forearm examination component
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
  { id: 'lateral_epicondylitis', title: 'Lateral Epicondylitis (Tennis Elbow)', icon: '🎾' },
  { id: 'medial_epicondylitis', title: 'Medial Epicondylitis (Golfer\'s Elbow)', icon: '⛳' },
  { id: 'stability', title: 'Ligament Stability (UCL/LCL)', icon: '🔗' },
  { id: 'cubital_tunnel', title: 'Cubital Tunnel Syndrome', icon: '⚡' },
  { id: 'bursitis', title: 'Olecranon Bursitis', icon: '💧' },
  { id: 'treatment', title: 'Treatment Plan', icon: '📋' }
];

const SECTION_OPTIONS = {
  rom: ELBOW_ROM_OPTIONS,
  lateral_epicondylitis: ELBOW_LATERAL_EPICONDYLITIS_OPTIONS,
  medial_epicondylitis: ELBOW_MEDIAL_EPICONDYLITIS_OPTIONS,
  stability: ELBOW_STABILITY_OPTIONS,
  cubital_tunnel: ELBOW_CUBITAL_TUNNEL_OPTIONS,
  bursitis: ELBOW_BURSITIS_OPTIONS,
  treatment: ELBOW_TREATMENT_OPTIONS
};

// Clinical impression suggestions based on positive findings
const CLINICAL_IMPRESSIONS = {
  lateral_epicondylitis: {
    pattern: ['cozen_pos', 'mill_pos', 'mid_finger_ext_pos', 'lat_epic_tender'],
    diagnosis: 'Lateral Epicondylitis (Tennis Elbow)',
    icd10: 'M77.1'
  },
  medial_epicondylitis: {
    pattern: ['rev_cozen_pos', 'rev_mill_pos', 'med_epic_tender'],
    diagnosis: 'Medial Epicondylitis (Golfer\'s Elbow)',
    icd10: 'M77.0'
  },
  ucl_sprain: {
    pattern: ['valgus_30_pos', 'moving_valgus_pos', 'milking_maneuver_pos'],
    diagnosis: 'Ulnar Collateral Ligament Sprain',
    icd10: 'S53.44'
  },
  cubital_tunnel: {
    pattern: ['elbow_flex_test_pos', 'tinel_elbow_pos', 'froment_pos', 'cubital_4th_5th_numb'],
    diagnosis: 'Cubital Tunnel Syndrome (Ulnar Neuropathy)',
    icd10: 'G56.2'
  },
  olecranon_bursitis: {
    pattern: ['bursa_swelling', 'bursa_goose_egg', 'bursa_tender'],
    diagnosis: 'Olecranon Bursitis',
    icd10: 'M70.2'
  },
  septic_bursitis: {
    pattern: ['bursa_warm_red', 'bursa_swelling'],
    diagnosis: 'Possible Septic Bursitis - REFER',
    icd10: 'M70.2',
    urgent: true
  }
};

export default function ElbowForearmExamGrid({
  side = 'right', // 'left', 'right', or 'bilateral'
  selectedValues = {},
  onChange,
  showNarrative = true,
  language = 'EN',
  className = ''
}) {
  const [expandedSections, setExpandedSections] = useState(['rom']);
  const [activeTab, setActiveTab] = useState('exam');

  const toggleSection = (sectionId) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleSectionChange = (sectionId, values) => {
    onChange({
      ...selectedValues,
      [sectionId]: values
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

    Object.entries(CLINICAL_IMPRESSIONS).forEach(([key, impression]) => {
      const matchCount = impression.pattern.filter(p => allSelected.includes(p)).length;
      if (matchCount >= 2) {
        suggestions.push({
          ...impression,
          confidence: Math.round((matchCount / impression.pattern.length) * 100)
        });
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  };

  // Generate narrative documentation
  const generateNarrative = () => {
    const allSelected = getAllSelectedValues();
    if (allSelected.length === 0) return '';

    const sideText = side === 'bilateral' ? 'bilateral' : `${side}`;
    let narrative = `ELBOW EXAMINATION - ${sideText.toUpperCase()}\n\n`;

    // ROM findings
    const romFindings = selectedValues.rom || [];
    if (romFindings.length > 0) {
      narrative += 'Range of Motion:\n';
      romFindings.forEach(finding => {
        const option = Object.values(ELBOW_ROM_OPTIONS)
          .flat()
          .find(opt => opt.value === finding);
        if (option) narrative += `- ${option.label}\n`;
      });
      narrative += '\n';
    }

    // Special tests by condition
    const conditionSections = [
      { id: 'lateral_epicondylitis', title: 'Lateral Epicondylitis Tests' },
      { id: 'medial_epicondylitis', title: 'Medial Epicondylitis Tests' },
      { id: 'stability', title: 'Ligament Stability Tests' },
      { id: 'cubital_tunnel', title: 'Cubital Tunnel Tests' },
      { id: 'bursitis', title: 'Bursitis Findings' }
    ];

    conditionSections.forEach(({ id, title }) => {
      const findings = selectedValues[id] || [];
      if (findings.length > 0) {
        const options = SECTION_OPTIONS[id];
        const positiveFindings = [];
        const negativeFindings = [];
        const otherFindings = [];

        findings.forEach(finding => {
          const option = Object.values(options)
            .flat()
            .find(opt => opt.value === finding);
          if (option) {
            if (finding.includes('_pos')) {
              positiveFindings.push(option.label);
            } else if (finding.includes('_neg')) {
              negativeFindings.push(option.label);
            } else {
              otherFindings.push(option.label);
            }
          }
        });

        if (positiveFindings.length > 0 || negativeFindings.length > 0 || otherFindings.length > 0) {
          narrative += `${title}:\n`;
          positiveFindings.forEach(f => narrative += `- ${f}\n`);
          negativeFindings.forEach(f => narrative += `- ${f}\n`);
          otherFindings.forEach(f => narrative += `- ${f}\n`);
          narrative += '\n';
        }
      }
    });

    // Suggested diagnoses
    const diagnoses = getSuggestedDiagnoses();
    if (diagnoses.length > 0) {
      narrative += 'Clinical Impression:\n';
      diagnoses.forEach(dx => {
        const urgentTag = dx.urgent ? ' [URGENT]' : '';
        narrative += `- ${dx.diagnosis} (${dx.icd10})${urgentTag} - ${dx.confidence}% match\n`;
      });
      narrative += '\n';
    }

    // Treatment plan
    const treatmentFindings = selectedValues.treatment || [];
    if (treatmentFindings.length > 0) {
      narrative += 'Treatment Plan:\n';
      treatmentFindings.forEach(finding => {
        const option = Object.values(ELBOW_TREATMENT_OPTIONS)
          .flat()
          .find(opt => opt.value === finding);
        if (option) narrative += `- ${option.label}\n`;
      });
    }

    return narrative;
  };

  const totalSelected = getAllSelectedValues().length;
  const suggestedDiagnoses = getSuggestedDiagnoses();
  const hasUrgentFinding = suggestedDiagnoses.some(dx => dx.urgent);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-teal-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💪</span>
            <div>
              <h2 className="font-semibold text-gray-900">Elbow & Forearm Examination</h2>
              <p className="text-sm text-gray-500">
                {side === 'bilateral' ? 'Bilateral' : `${side.charAt(0).toUpperCase() + side.slice(1)} side`}
                {totalSelected > 0 && ` • ${totalSelected} findings selected`}
              </p>
            </div>
          </div>

          {/* Side selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Side:</span>
            <div className="flex rounded-lg overflow-hidden border border-gray-300">
              {['left', 'right', 'bilateral'].map(s => (
                <button
                  key={s}
                  onClick={() => onChange({ ...selectedValues, _side: s })}
                  className={`px-3 py-1 text-sm ${
                    side === s
                      ? 'bg-green-600 text-white'
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
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Examination
          </button>
          <button
            onClick={() => setActiveTab('narrative')}
            className={`px-3 py-1 text-sm font-medium rounded-md flex items-center gap-1 ${
              activeTab === 'narrative'
                ? 'bg-white text-green-700 shadow-sm'
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
          {/* Urgent Alert for possible infection */}
          {hasUrgentFinding && (
            <div className="p-3 bg-red-50 border-b border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">URGENT: Possible Infection Detected</p>
                  <p className="text-sm text-red-700 mt-1">
                    Warm, red bursitis may indicate septic bursitis. Consider immediate referral for aspiration and culture.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Diagnoses Alert */}
          {suggestedDiagnoses.length > 0 && !hasUrgentFinding && (
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
          {EXAM_SECTIONS.map(section => {
            const isExpanded = expandedSections.includes(section.id);
            const sectionValues = selectedValues[section.id] || [];
            const positiveCount = sectionValues.filter(v => v.includes('_pos')).length;

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
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
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
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Copy to Clipboard
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-white p-4 rounded border border-gray-200 max-h-96 overflow-y-auto">
              {generateNarrative() || 'No findings selected. Select examination findings to generate documentation.'}
            </pre>
          </div>
        </div>
      )}

      {/* Footer with quick stats */}
      {totalSelected > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {totalSelected} findings documented
            </span>
            <div className="flex items-center gap-4">
              {suggestedDiagnoses.length > 0 && (
                <span className={`font-medium ${hasUrgentFinding ? 'text-red-600' : 'text-amber-600'}`}>
                  {suggestedDiagnoses.length} suggested {suggestedDiagnoses.length === 1 ? 'diagnosis' : 'diagnoses'}
                  {hasUrgentFinding && ' (URGENT)'}
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
export const ELBOW_EXAM_PRESETS = {
  lateralEpicondylitis: {
    name: 'Tennis Elbow Screen',
    sections: ['rom', 'lateral_epicondylitis'],
    description: 'Quick screen for lateral epicondylitis'
  },
  medialEpicondylitis: {
    name: 'Golfer\'s Elbow Screen',
    sections: ['rom', 'medial_epicondylitis'],
    description: 'Quick screen for medial epicondylitis'
  },
  uclScreen: {
    name: 'UCL Injury Screen',
    sections: ['rom', 'stability'],
    description: 'Ulnar collateral ligament evaluation (throwers)'
  },
  cubitalTunnelScreen: {
    name: 'Cubital Tunnel Screen',
    sections: ['rom', 'cubital_tunnel'],
    description: 'Ulnar nerve compression evaluation'
  },
  bursitisScreen: {
    name: 'Bursitis Screen',
    sections: ['rom', 'bursitis'],
    description: 'Olecranon bursitis evaluation'
  },
  comprehensiveExam: {
    name: 'Comprehensive Exam',
    sections: ['rom', 'lateral_epicondylitis', 'medial_epicondylitis', 'stability', 'cubital_tunnel', 'bursitis'],
    description: 'Full elbow examination'
  }
};

// Export Norwegian terminology mappings
export const ELBOW_NORWEGIAN_TERMS = {
  'Lateral Epicondylitis': 'Lateral epikondylitt (tennisalbue)',
  'Medial Epicondylitis': 'Medial epikondylitt (golfalbue)',
  'Ulnar Collateral Ligament Sprain': 'UCL distorsjon',
  'Cubital Tunnel Syndrome': 'Kubitaltunnelsyndrom',
  'Olecranon Bursitis': 'Olekranonbursitt',
  'Range of Motion': 'Bevegelsesutslag',
  'Treatment Plan': 'Behandlingsplan'
};
