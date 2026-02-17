import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Shield,
  Clock,
  FileText,
  Zap,
} from 'lucide-react';

/**
 * ComplianceEngine - Automated compliance checking and conditional logic
 *
 * Features:
 * - Real-time compliance validation as you document
 * - Conditional logic gates (if treatment X, require qualifier Y)
 * - CPT/ICD-10 code matching validation
 * - Time requirement enforcement
 * - Insurance compliance rules
 * - Red flag detection
 */

// =============================================================================
// COMPLIANCE RULES DATABASE
// =============================================================================

// Treatment-to-qualifier rules (ChiroTouch style)
const TREATMENT_QUALIFIERS = {
  adjustment: {
    required: ['subluxation_finding', 'joint_dysfunction'],
    recommended: ['palpation_finding', 'rom_restriction'],
    text_requirements: {
      objective: [
        'subluxation',
        'joint dysfunction',
        'vertebral',
        'spinal segment',
        'motion restriction',
      ],
    },
    auto_insert:
      'Palpation to the spinal segment revealed segmental joint dysfunction, point tenderness, and motion restriction.',
  },
  therapeutic_stretching: {
    required: ['time_documented'],
    minimum_time: 8,
    time_unit: 'minutes',
    auto_insert: '– 8 minutes',
    warning: 'Therapeutic stretching requires time documentation (minimum 8 minutes) for CPT 97110',
  },
  therapeutic_exercise: {
    required: ['time_documented'],
    minimum_time: 8,
    time_unit: 'minutes',
    auto_insert: '– 8 minutes',
    warning: 'Therapeutic exercise requires time documentation (minimum 8 minutes) for CPT 97110',
  },
  manual_therapy: {
    required: ['time_documented', 'body_region'],
    minimum_time: 8,
    time_unit: 'minutes',
    auto_insert: '– 8 minutes',
    warning: 'Manual therapy requires time documentation (minimum 8 minutes) for CPT 97140',
  },
  iastm: {
    required: ['time_documented'],
    minimum_time: 8,
    time_unit: 'minutes',
    auto_insert: '– 8 minutes',
    warning: 'IASTM requires time documentation (minimum 8 minutes)',
  },
  electrical_stimulation: {
    required: ['time_documented', 'body_region'],
    minimum_time: 15,
    time_unit: 'minutes',
    auto_insert: 'for 15 minutes',
    warning: 'E-stim requires time documentation',
  },
  ultrasound: {
    required: ['time_documented', 'body_region', 'intensity'],
    minimum_time: 5,
    time_unit: 'minutes',
    auto_insert: 'at 1.0 W/cm² for 5 minutes',
    warning: 'Ultrasound requires time and intensity documentation',
  },
  traction: {
    required: ['time_documented'],
    minimum_time: 15,
    time_unit: 'minutes',
    auto_insert: 'for 15 minutes',
    warning: 'Traction requires time documentation',
  },
};

// Diagnosis-to-treatment matching rules
const DIAGNOSIS_TREATMENT_RULES = {
  // Subluxation codes require adjustment documentation
  'M99.01': {
    // Segmental dysfunction cervical
    requires_treatments: ['adjustment', 'manipulation'],
    requires_findings: ['subluxation', 'joint dysfunction', 'motion restriction'],
  },
  'M99.03': {
    // Segmental dysfunction lumbar
    requires_treatments: ['adjustment', 'manipulation'],
    requires_findings: ['subluxation', 'joint dysfunction', 'motion restriction'],
  },
  'M54.5': {
    // Low back pain
    requires_findings: ['tenderness', 'spasm', 'pain', 'restricted'],
    recommended_treatments: ['adjustment', 'therapeutic_exercise', 'manual_therapy'],
  },
  'M54.2': {
    // Cervicalgia
    requires_findings: ['tenderness', 'spasm', 'pain', 'restricted'],
    recommended_treatments: ['adjustment', 'therapeutic_exercise', 'manual_therapy'],
  },
  'G89.29': {
    // Chronic pain
    requires_findings: ['chronic', 'duration', 'ongoing'],
    warning: 'Chronic pain diagnosis requires duration documentation',
  },
};

// Red flags that should trigger alerts
const RED_FLAGS = {
  subjective: [
    {
      pattern: /bowel|bladder|incontinence/i,
      alert: 'Cauda equina symptoms - urgent evaluation needed',
      severity: 'critical',
    },
    {
      pattern: /night sweats|unexplained weight loss|fever/i,
      alert: 'Constitutional symptoms - rule out serious pathology',
      severity: 'high',
    },
    {
      pattern: /worst headache|thunderclap/i,
      alert: 'Sudden severe headache - rule out SAH',
      severity: 'critical',
    },
    {
      pattern: /chest pain|shortness of breath/i,
      alert: 'Cardiac symptoms - ensure appropriate workup',
      severity: 'high',
    },
    {
      pattern: /bilateral|both legs|saddle/i,
      alert: 'Bilateral symptoms - consider central pathology',
      severity: 'high',
    },
    {
      pattern: /trauma|accident|fall/i,
      alert: 'Trauma history - rule out fracture/instability',
      severity: 'medium',
    },
    {
      pattern: /cancer|tumor|malignancy/i,
      alert: 'History of malignancy - rule out metastatic disease',
      severity: 'high',
    },
    {
      pattern: /numbness.*progressing|weakness.*progressing/i,
      alert: 'Progressive neurological symptoms - urgent evaluation',
      severity: 'critical',
    },
  ],
  objective: [
    {
      pattern: /absent reflex|areflexia/i,
      alert: 'Absent reflexes - neurological deficit',
      severity: 'high',
    },
    {
      pattern: /positive babinski|clonus/i,
      alert: 'Upper motor neuron signs present',
      severity: 'high',
    },
    {
      pattern: /3\/5|2\/5|1\/5|0\/5/i,
      alert: 'Motor weakness documented - monitor closely',
      severity: 'medium',
    },
  ],
};

// Time-based rules
const _TIME_RULES = {
  total_treatment_time: {
    minimum: 8,
    warning_at: 7,
    message: 'Total treatment time should be documented',
  },
  e_m_code_time: {
    99212: { min: 10, max: 19 },
    99213: { min: 20, max: 29 },
    99214: { min: 30, max: 39 },
    99215: { min: 40, max: Infinity },
  },
};

// =============================================================================
// COMPLIANCE CHECK FUNCTIONS
// =============================================================================

// Check text for required keywords
function checkTextForKeywords(text, keywords) {
  if (!text || !keywords) {
    return false;
  }
  const lowerText = text.toLowerCase();
  return keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()));
}

// Check if time is documented in text
function extractTimeFromText(text) {
  if (!text) {
    return null;
  }
  const patterns = [
    /(\d+)\s*minutes?/i,
    /(\d+)\s*mins?/i,
    /for\s*(\d+)/i,
    /–\s*(\d+)/,
    /-\s*(\d+)\s*min/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  return null;
}

// Main compliance checker
export function checkCompliance(encounterData) {
  const issues = [];
  const warnings = [];
  const suggestions = [];
  const autoInserts = [];

  // Combine all text fields for checking
  const subjectiveText = [
    encounterData.subjective?.chief_complaint,
    encounterData.subjective?.history,
    encounterData.subjective?.onset,
    encounterData.subjective?.pain_description,
  ]
    .filter(Boolean)
    .join(' ');

  const objectiveText = [
    encounterData.objective?.observation,
    encounterData.objective?.palpation,
    encounterData.objective?.rom,
    encounterData.objective?.ortho_tests,
    encounterData.objective?.neuro_tests,
  ]
    .filter(Boolean)
    .join(' ');

  const planText = [
    encounterData.plan?.treatment,
    encounterData.plan?.exercises,
    encounterData.plan?.advice,
  ]
    .filter(Boolean)
    .join(' ');

  // =============================================================================
  // 1. RED FLAG DETECTION
  // =============================================================================
  RED_FLAGS.subjective.forEach(({ pattern, alert, severity }) => {
    if (pattern.test(subjectiveText)) {
      issues.push({
        type: 'red_flag',
        severity,
        section: 'subjective',
        message: alert,
        icon: AlertTriangle,
      });
    }
  });

  RED_FLAGS.objective.forEach(({ pattern, alert, severity }) => {
    if (pattern.test(objectiveText)) {
      issues.push({
        type: 'red_flag',
        severity,
        section: 'objective',
        message: alert,
        icon: AlertTriangle,
      });
    }
  });

  // =============================================================================
  // 2. TREATMENT QUALIFIER CHECKS
  // =============================================================================
  const selectedTreatments = encounterData.treatments_selected || [];

  // Check adjustment documentation
  if (
    selectedTreatments.some(
      (t) =>
        t.toLowerCase().includes('adjust') ||
        t.toLowerCase().includes('manipulation') ||
        t.toLowerCase().includes('diversified') ||
        t.toLowerCase().includes('gonstead')
    )
  ) {
    const hasSubluixationFinding = checkTextForKeywords(objectiveText, [
      'subluxation',
      'joint dysfunction',
      'segmental',
      'motion restriction',
      'vertebral',
    ]);

    if (!hasSubluixationFinding && !Object.keys(encounterData.spinal_findings || {}).length) {
      issues.push({
        type: 'missing_qualifier',
        severity: 'high',
        section: 'objective',
        message:
          'Adjustment performed but no subluxation/joint dysfunction documented in Objective',
        suggestion: TREATMENT_QUALIFIERS.adjustment.auto_insert,
        icon: FileText,
      });
      autoInserts.push({
        section: 'objective',
        field: 'palpation',
        text: TREATMENT_QUALIFIERS.adjustment.auto_insert,
      });
    }
  }

  // Check time-based treatments
  const timeBasedTreatments = [
    'therapeutic_stretching',
    'therapeutic_exercise',
    'manual_therapy',
    'iastm',
    'electrical_stimulation',
    'ultrasound',
    'traction',
    'massage',
    'stretch',
  ];

  selectedTreatments.forEach((treatment) => {
    const treatmentLower = treatment.toLowerCase();
    timeBasedTreatments.forEach((timeTreatment) => {
      if (
        treatmentLower.includes(timeTreatment.replace('_', ' ')) ||
        treatmentLower.includes(timeTreatment.replace('_', ''))
      ) {
        const rule = TREATMENT_QUALIFIERS[timeTreatment];
        if (rule && rule.minimum_time) {
          const documentedTime = extractTimeFromText(planText);
          if (!documentedTime) {
            warnings.push({
              type: 'missing_time',
              severity: 'medium',
              section: 'plan',
              message: rule.warning || `${treatment} requires time documentation`,
              suggestion: rule.auto_insert,
              icon: Clock,
            });
            autoInserts.push({
              section: 'plan',
              field: 'treatment',
              text: rule.auto_insert,
              appendTo: treatment,
            });
          } else if (documentedTime < rule.minimum_time) {
            warnings.push({
              type: 'insufficient_time',
              severity: 'medium',
              section: 'plan',
              message: `${treatment} documented time (${documentedTime} min) is less than required minimum (${rule.minimum_time} min)`,
              icon: Clock,
            });
          }
        }
      }
    });
  });

  // =============================================================================
  // 3. DIAGNOSIS-TREATMENT MATCHING
  // =============================================================================
  const diagnoses = [...(encounterData.icpc_codes || []), ...(encounterData.icd10_codes || [])];

  diagnoses.forEach((code) => {
    const rule = DIAGNOSIS_TREATMENT_RULES[code];
    if (rule) {
      // Check required findings
      if (rule.requires_findings) {
        const hasFindings = checkTextForKeywords(objectiveText, rule.requires_findings);
        if (!hasFindings) {
          warnings.push({
            type: 'diagnosis_finding_mismatch',
            severity: 'medium',
            section: 'objective',
            message: `Diagnosis ${code} typically requires documentation of: ${rule.requires_findings.join(', ')}`,
            icon: FileText,
          });
        }
      }

      // Check required treatments
      if (rule.requires_treatments) {
        const hasTreatment = selectedTreatments.some((t) =>
          rule.requires_treatments.some((rt) => t.toLowerCase().includes(rt))
        );
        if (!hasTreatment) {
          suggestions.push({
            type: 'recommended_treatment',
            severity: 'low',
            section: 'plan',
            message: `Diagnosis ${code} typically includes: ${rule.requires_treatments.join(' or ')}`,
            icon: Info,
          });
        }
      }
    }
  });

  // =============================================================================
  // 4. COMPLETENESS CHECKS
  // =============================================================================

  // Check for chief complaint
  if (!encounterData.subjective?.chief_complaint?.trim()) {
    issues.push({
      type: 'missing_field',
      severity: 'high',
      section: 'subjective',
      message: 'Chief complaint is required',
      icon: XCircle,
    });
  }

  // Check for at least one objective finding
  const hasObjectiveFindings =
    objectiveText.trim().length > 20 ||
    encounterData.observation_findings?.length > 0 ||
    encounterData.palpation_findings?.length > 0 ||
    encounterData.rom_findings?.length > 0 ||
    Object.keys(encounterData.spinal_findings || {}).length > 0;

  if (!hasObjectiveFindings) {
    issues.push({
      type: 'missing_field',
      severity: 'high',
      section: 'objective',
      message: 'Objective findings are required',
      icon: XCircle,
    });
  }

  // Check for diagnosis
  if (diagnoses.length === 0) {
    warnings.push({
      type: 'missing_diagnosis',
      severity: 'medium',
      section: 'assessment',
      message: 'No diagnosis code selected',
      icon: FileText,
    });
  }

  // Check for treatment documented
  if (selectedTreatments.length === 0 && !planText.trim()) {
    warnings.push({
      type: 'missing_treatment',
      severity: 'medium',
      section: 'plan',
      message: 'No treatment documented',
      icon: FileText,
    });
  }

  // =============================================================================
  // RETURN RESULTS
  // =============================================================================

  const isCompliant =
    issues.filter((i) => i.severity === 'critical' || i.severity === 'high').length === 0;
  const score = calculateComplianceScore(issues, warnings, suggestions);

  return {
    isCompliant,
    score,
    issues,
    warnings,
    suggestions,
    autoInserts,
    summary: generateComplianceSummary(issues, warnings, suggestions),
  };
}

// Calculate compliance score (0-100)
function calculateComplianceScore(issues, warnings, _suggestions) {
  let score = 100;

  issues.forEach((issue) => {
    if (issue.severity === 'critical') {
      score -= 25;
    } else if (issue.severity === 'high') {
      score -= 15;
    } else if (issue.severity === 'medium') {
      score -= 10;
    } else {
      score -= 5;
    }
  });

  warnings.forEach((warning) => {
    if (warning.severity === 'high') {
      score -= 8;
    } else if (warning.severity === 'medium') {
      score -= 5;
    } else {
      score -= 2;
    }
  });

  return Math.max(0, Math.min(100, score));
}

// Generate summary
function generateComplianceSummary(issues, warnings, suggestions) {
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const highCount = issues.filter((i) => i.severity === 'high').length;

  if (criticalCount > 0) {
    return `${criticalCount} critical issue(s) require immediate attention`;
  } else if (highCount > 0) {
    return `${highCount} high-priority issue(s) should be addressed`;
  } else if (warnings.length > 0) {
    return `${warnings.length} warning(s) - review recommended`;
  } else if (suggestions.length > 0) {
    return `Note is compliant. ${suggestions.length} suggestion(s) available.`;
  }
  return 'Note is fully compliant';
}

// =============================================================================
// COMPLIANCE COMPONENTS
// =============================================================================

// Main Compliance Panel Component
export default function CompliancePanel({ encounterData, onApplyAutoInsert, className = '' }) {
  const [compliance, setCompliance] = useState(null);
  const [expanded, setExpanded] = useState(true);

  // Run compliance check whenever data changes
  useEffect(() => {
    const result = checkCompliance(encounterData);
    setCompliance(result);
  }, [encounterData]);

  if (!compliance) {
    return null;
  }

  const { isCompliant, score, issues, warnings, suggestions, autoInserts, summary } = compliance;

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
          isCompliant ? 'bg-green-50' : issues.length > 0 ? 'bg-red-50' : 'bg-yellow-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <Shield
            className={`w-5 h-5 ${
              isCompliant
                ? 'text-green-600'
                : issues.length > 0
                  ? 'text-red-600'
                  : 'text-yellow-600'
            }`}
          />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Compliance Check</h3>
            <p className="text-xs text-gray-600">{summary}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Score Badge */}
          <div
            className={`
            px-3 py-1 rounded-full text-sm font-bold
            ${
              score >= 90
                ? 'bg-green-100 text-green-800'
                : score >= 70
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }
          `}
          >
            {score}%
          </div>
          <span className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="divide-y divide-gray-100">
          {/* Critical/High Issues */}
          {issues.length > 0 && (
            <div className="p-4">
              <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Issues ({issues.length})
              </h4>
              <div className="space-y-2">
                {issues.map((issue, index) => (
                  <ComplianceItem
                    key={index}
                    item={issue}
                    onApplyFix={issue.suggestion ? () => onApplyAutoInsert?.(issue) : null}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="p-4">
              <h4 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Warnings ({warnings.length})
              </h4>
              <div className="space-y-2">
                {warnings.map((warning, index) => (
                  <ComplianceItem
                    key={index}
                    item={warning}
                    onApplyFix={warning.suggestion ? () => onApplyAutoInsert?.(warning) : null}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-4">
              <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Suggestions ({suggestions.length})
              </h4>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <ComplianceItem key={index} item={suggestion} onApplyFix={null} />
                ))}
              </div>
            </div>
          )}

          {/* All Clear */}
          {issues.length === 0 && warnings.length === 0 && suggestions.length === 0 && (
            <div className="p-4 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-medium">All compliance checks passed!</p>
            </div>
          )}

          {/* Auto-Fix All Button */}
          {autoInserts.length > 0 && onApplyAutoInsert && (
            <div className="p-4 bg-gray-50">
              <button
                onClick={() => autoInserts.forEach((ai) => onApplyAutoInsert(ai))}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Auto-Fix All Issues ({autoInserts.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Individual compliance item
function ComplianceItem({ item, onApplyFix }) {
  const Icon = item.icon || AlertTriangle;

  const severityColors = {
    critical: 'bg-red-100 border-red-200 text-red-800',
    high: 'bg-red-50 border-red-100 text-red-700',
    medium: 'bg-yellow-50 border-yellow-100 text-yellow-700',
    low: 'bg-blue-50 border-blue-100 text-blue-700',
  };

  return (
    <div
      className={`p-3 rounded-lg border ${severityColors[item.severity] || severityColors.medium}`}
    >
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm">{item.message}</p>
          {item.suggestion && (
            <p className="text-xs mt-1 opacity-75">Suggested fix: "{item.suggestion}"</p>
          )}
        </div>
        {onApplyFix && (
          <button
            onClick={onApplyFix}
            className="px-2 py-1 text-xs bg-white rounded border hover:bg-gray-50"
          >
            Fix
          </button>
        )}
      </div>
    </div>
  );
}

// Compact compliance indicator
export function ComplianceIndicator({ encounterData, onClick }) {
  const [compliance, setCompliance] = useState(null);

  useEffect(() => {
    const result = checkCompliance(encounterData);
    setCompliance(result);
  }, [encounterData]);

  if (!compliance) {
    return null;
  }

  const { isCompliant, score, issues, warnings } = compliance;
  const totalIssues = issues.length + warnings.length;

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors
        ${
          isCompliant
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : totalIssues > 0
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
        }
      `}
    >
      <Shield className="w-4 h-4" />
      <span className="text-sm font-medium">{score}%</span>
      {totalIssues > 0 && (
        <span className="px-1.5 py-0.5 text-xs bg-white/50 rounded-full">{totalIssues}</span>
      )}
    </button>
  );
}

// Export rules for external use
export { TREATMENT_QUALIFIERS, DIAGNOSIS_TREATMENT_RULES, RED_FLAGS };
