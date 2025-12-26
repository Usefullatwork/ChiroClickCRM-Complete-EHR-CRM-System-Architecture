/**
 * Clinical Content Validation Service
 * Validates clinical content for safety, red flags, and medical logic
 *
 * Features:
 * - Red flag pattern detection (cauda equina, malignancy, fracture, infection)
 * - Medical logic validation (diagnosis-treatment matching)
 * - Confidence scoring for AI suggestions
 * - Human-in-the-loop workflow support
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

// ============================================================================
// RED FLAG PATTERNS - Norwegian and English
// ============================================================================

const RED_FLAG_PATTERNS = {
  // CRITICAL - Requires immediate referral
  cauda_equina: {
    patterns: [
      /cauda\s*equina/i,
      /blære.*forstyrrelser?/i,
      /tarm.*forstyrrelser?/i,
      /sadel.*nummenhet/i,
      /sadelformet\s*anestesi/i,
      /bilateral.*svakhet/i,
      /urin.*inkontinens/i,
      /avføring.*inkontinens/i,
      /bladder\s*dysfunction/i,
      /bowel\s*dysfunction/i,
      /saddle\s*anesthesia/i,
      /bilateral.*weakness/i,
      /perianal.*numbness/i
    ],
    severity: 'CRITICAL',
    message_no: 'KRITISK: Mulig cauda equina syndrom - Akutt henvisning påkrevd!',
    message_en: 'CRITICAL: Possible cauda equina syndrome - Immediate referral required!',
    action: 'IMMEDIATE_REFERRAL'
  },

  // HIGH - Malignancy indicators
  malignancy: {
    patterns: [
      /vekttap.*natt.*smerte/i,
      /uforklarlig\s*vekttap/i,
      /nattlige?\s*smerter/i,
      /tidligere\s*kreft/i,
      /cancer.*history/i,
      /unexplained\s*weight\s*loss/i,
      /night\s*pain/i,
      /constant\s*pain/i,
      /age\s*[>5][05]/i,
      /alder\s*over\s*50/i,
      /progressiv.*forverring/i,
      /progressive.*worsening/i
    ],
    severity: 'HIGH',
    message_no: 'HØYT: Mulige malignitetsindikatorer - Vurder henvisning til lege',
    message_en: 'HIGH: Possible malignancy indicators - Consider medical referral',
    action: 'MEDICAL_EVALUATION'
  },

  // HIGH - Infection indicators
  infection: {
    patterns: [
      /feber/i,
      /fever/i,
      /immunsuppresjon/i,
      /immunocompromised/i,
      /iv\s*drug/i,
      /intravenøs/i,
      /hiv/i,
      /diabetes.*infeksjon/i,
      /recent\s*surgery/i,
      /nylig\s*operasjon/i,
      /open\s*wound/i,
      /åpent\s*sår/i,
      /systemisk\s*sykdom/i
    ],
    severity: 'HIGH',
    message_no: 'HØYT: Mulige infeksjonsindikatorer - Vurder medisinsk evaluering',
    message_en: 'HIGH: Possible infection indicators - Consider medical evaluation',
    action: 'MEDICAL_EVALUATION'
  },

  // HIGH - Fracture risk
  fracture: {
    patterns: [
      /betydelig\s*trauma/i,
      /significant\s*trauma/i,
      /osteoporose/i,
      /osteoporosis/i,
      /steroid.*bruk/i,
      /steroid.*use/i,
      /fall.*fra.*høyde/i,
      /fall.*from.*height/i,
      /bilulykke/i,
      /motor.*vehicle.*accident/i,
      /mva/i,
      /strukturell\s*deformitet/i,
      /structural\s*deformity/i
    ],
    severity: 'HIGH',
    message_no: 'HØYT: Mulig frakturrisiko - Vurder bildediagnostikk',
    message_en: 'HIGH: Possible fracture risk - Consider imaging',
    action: 'IMAGING_RECOMMENDED'
  },

  // MODERATE - Inflammatory conditions
  inflammatory: {
    patterns: [
      /morgenstivhet.*[>3]0\s*min/i,
      /morning\s*stiffness.*[>3]0/i,
      /gradvis\s*debut/i,
      /insidious\s*onset/i,
      /ung\s*alder.*rygg/i,
      /young.*age.*back/i,
      /alternerende\s*ballesmerter/i,
      /alternating\s*buttock/i,
      /bedring\s*ved\s*aktivitet/i,
      /improves\s*with\s*activity/i,
      /ankyloserende/i,
      /ankylosing/i,
      /psoriasis.*artritt/i
    ],
    severity: 'MODERATE',
    message_no: 'MODERAT: Mulige inflammatoriske indikatorer - Vurder revmatologisk utredning',
    message_en: 'MODERATE: Possible inflammatory indicators - Consider rheumatologic workup',
    action: 'SPECIALIST_REFERRAL'
  },

  // MODERATE - Neurological compromise
  neurological: {
    patterns: [
      /progressiv.*svakhet/i,
      /progressive.*weakness/i,
      /bilateral.*symptom/i,
      /myelopati/i,
      /myelopathy/i,
      /hyperrefleksi/i,
      /hyperreflexia/i,
      /babinski.*positiv/i,
      /positive.*babinski/i,
      /clonus/i,
      /gange.*forstyrrelse/i,
      /gait.*disturbance/i
    ],
    severity: 'MODERATE',
    message_no: 'MODERAT: Nevrologiske symptomer - Grundig nevrologisk evaluering anbefales',
    message_en: 'MODERATE: Neurological symptoms - Thorough neurological evaluation recommended',
    action: 'NEUROLOGICAL_EVALUATION'
  },

  // LOW - Vascular
  vascular: {
    patterns: [
      /pulserende.*smerte/i,
      /pulsating.*pain/i,
      /abdominalt\s*aneurisme/i,
      /abdominal\s*aneurysm/i,
      /claudicatio/i,
      /claudication/i,
      /kald.*ekstremitet/i,
      /cold.*extremity/i
    ],
    severity: 'LOW',
    message_no: 'LAV: Mulige vaskulære indikatorer - Vurder vaskulær evaluering ved behov',
    message_en: 'LOW: Possible vascular indicators - Consider vascular evaluation if indicated',
    action: 'MONITOR'
  }
};

// ============================================================================
// MEDICATION INTERACTION WARNINGS
// ============================================================================

const MEDICATION_WARNINGS = {
  anticoagulants: {
    medications: ['warfarin', 'marevan', 'xarelto', 'eliquis', 'pradaxa', 'heparin', 'fragmin', 'klexane', 'aspirin', 'plavix', 'brilique'],
    warning_no: 'Pasient bruker antikoagulantia - Forsiktighet med manipulasjon',
    warning_en: 'Patient on anticoagulants - Caution with manipulation',
    severity: 'MODERATE',
    contraindications: ['HVLA', 'aggressive_manipulation']
  },
  steroids: {
    medications: ['prednisolon', 'prednisone', 'cortison', 'dexametason', 'metylprednisolon'],
    warning_no: 'Langtidsbruk av steroider - Økt frakturrisiko',
    warning_en: 'Long-term steroid use - Increased fracture risk',
    severity: 'MODERATE',
    contraindications: ['HVLA_spine']
  },
  bisphosphonates: {
    medications: ['alendronat', 'fosamax', 'alendronate', 'risedronate', 'zoledronic'],
    warning_no: 'Pasient behandles for osteoporose - Forsiktighet med manipulasjon',
    warning_en: 'Patient treated for osteoporosis - Caution with manipulation',
    severity: 'MODERATE',
    contraindications: ['HVLA_spine', 'aggressive_mobilization']
  }
};

// ============================================================================
// DIAGNOSIS-TREATMENT VALIDATION RULES
// ============================================================================

const TREATMENT_RULES = {
  // Cervical rules
  L01: { // Neck symptom
    recommended: ['SMT_cervical', 'mobilization', 'soft_tissue', 'exercise'],
    caution: ['HVLA_upper_cervical'],
    contraindicated_with: ['vertebral_artery_insufficiency', 'cervical_myelopathy']
  },
  L85: { // Nerve root syndrome
    recommended: ['mobilization', 'neural_mobilization', 'exercise'],
    caution: ['HVLA', 'traction'],
    contraindicated_with: ['progressive_neurological_deficit', 'cauda_equina']
  },
  L03: { // Low back symptom
    recommended: ['SMT_lumbar', 'mobilization', 'exercise', 'advice'],
    caution: [],
    contraindicated_with: ['cauda_equina', 'fracture', 'malignancy']
  },
  N01: { // Headache
    recommended: ['SMT_cervical', 'soft_tissue_suboccipital', 'posture_advice'],
    caution: ['HVLA_upper_cervical'],
    contraindicated_with: ['thunderclap_headache', 'meningitis', 'intracranial_pathology']
  }
};

// ============================================================================
// MAIN VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate clinical content for safety and quality
 * @param {string} content - Clinical text content to validate
 * @param {Object} context - Clinical context (patient data, diagnosis, treatment)
 * @returns {Object} Validation result with warnings and recommendations
 */
export const validateClinicalContent = async (content, context = {}) => {
  const result = {
    isValid: true,
    hasRedFlags: false,
    requiresReview: false,
    confidence: 1.0,
    warnings: [],
    errors: [],
    recommendations: [],
    riskLevel: 'LOW',
    canProceed: true
  };

  try {
    // 1. Check for red flags in content
    const redFlagResults = checkRedFlagsInContent(content);
    if (redFlagResults.length > 0) {
      result.hasRedFlags = true;
      result.warnings.push(...redFlagResults);

      // Determine highest severity
      const severities = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'];
      for (const severity of severities) {
        if (redFlagResults.some(r => r.severity === severity)) {
          result.riskLevel = severity;
          break;
        }
      }

      if (result.riskLevel === 'CRITICAL') {
        result.canProceed = false;
        result.requiresReview = true;
        result.confidence = 0.2;
      } else if (result.riskLevel === 'HIGH') {
        result.requiresReview = true;
        result.confidence = 0.5;
      }
    }

    // 2. Check patient context for medication warnings
    if (context.patient?.current_medications) {
      const medWarnings = checkMedicationWarnings(context.patient.current_medications);
      if (medWarnings.length > 0) {
        result.warnings.push(...medWarnings);
        result.requiresReview = true;
        result.confidence = Math.min(result.confidence, 0.7);
      }
    }

    // 3. Validate diagnosis-treatment logic
    if (context.diagnosis && context.treatment) {
      const logicCheck = validateMedicalLogic(context.diagnosis, context.treatment, context);
      if (!logicCheck.valid) {
        result.errors.push(...logicCheck.errors);
        result.warnings.push(...logicCheck.warnings);
        result.isValid = false;
        result.confidence = Math.min(result.confidence, 0.4);
      }
      result.recommendations.push(...logicCheck.recommendations);
    }

    // 4. Age-based checks
    if (context.patient?.age) {
      const ageWarnings = checkAgeRelatedRisks(context.patient.age, content, context);
      if (ageWarnings.length > 0) {
        result.warnings.push(...ageWarnings);
      }
    }

    // 5. Check existing patient red flags
    if (context.patient?.red_flags?.length > 0) {
      result.warnings.push({
        type: 'patient_red_flag',
        severity: 'MODERATE',
        message: `Patient has documented red flags: ${context.patient.red_flags.join(', ')}`,
        action: 'REVIEW_HISTORY'
      });
      result.requiresReview = true;
    }

    // 6. Set final confidence based on all factors
    result.confidence = Math.max(0, Math.min(1, result.confidence));

    // Require review if confidence is low
    if (result.confidence < 0.7) {
      result.requiresReview = true;
    }

    return result;

  } catch (error) {
    logger.error('Clinical validation error:', error);
    return {
      ...result,
      isValid: false,
      errors: [{ type: 'system_error', message: error.message }],
      requiresReview: true,
      confidence: 0
    };
  }
};

/**
 * Check content for red flag patterns
 */
export const checkRedFlagsInContent = (content) => {
  const warnings = [];
  const contentLower = content.toLowerCase();

  for (const [flagName, flagConfig] of Object.entries(RED_FLAG_PATTERNS)) {
    for (const pattern of flagConfig.patterns) {
      if (pattern.test(content)) {
        warnings.push({
          type: 'red_flag',
          flag: flagName,
          severity: flagConfig.severity,
          message: flagConfig.message_en,
          message_no: flagConfig.message_no,
          action: flagConfig.action,
          matchedPattern: pattern.toString()
        });
        break; // Only report each flag type once
      }
    }
  }

  return warnings;
};

/**
 * Check for medication-related warnings
 */
export const checkMedicationWarnings = (medications) => {
  const warnings = [];
  const medsLower = medications.map(m => m.toLowerCase());

  for (const [category, config] of Object.entries(MEDICATION_WARNINGS)) {
    for (const med of config.medications) {
      if (medsLower.some(m => m.includes(med.toLowerCase()))) {
        warnings.push({
          type: 'medication_warning',
          category,
          severity: config.severity,
          message: config.warning_en,
          message_no: config.warning_no,
          contraindications: config.contraindications
        });
        break; // Only report each category once
      }
    }
  }

  return warnings;
};

/**
 * Validate medical logic (diagnosis-treatment matching)
 */
export const validateMedicalLogic = (diagnosis, treatment, context = {}) => {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    recommendations: []
  };

  // Get ICPC codes from diagnosis
  const icpcCodes = Array.isArray(diagnosis) ? diagnosis : [diagnosis];

  for (const code of icpcCodes) {
    const rules = TREATMENT_RULES[code];
    if (!rules) continue;

    // Check for contraindications
    const patientConditions = [
      ...(context.patient?.red_flags || []),
      ...(context.patient?.contraindications || [])
    ].map(c => c.toLowerCase().replace(/\s+/g, '_'));

    for (const contraindication of rules.contraindicated_with) {
      if (patientConditions.some(c => c.includes(contraindication.toLowerCase()))) {
        result.errors.push({
          type: 'contraindication',
          severity: 'HIGH',
          message: `Treatment may be contraindicated due to: ${contraindication}`,
          diagnosis: code
        });
        result.valid = false;
      }
    }

    // Add recommendations for caution
    if (rules.caution.length > 0) {
      result.warnings.push({
        type: 'caution',
        severity: 'MODERATE',
        message: `Use caution with: ${rules.caution.join(', ')}`,
        diagnosis: code
      });
    }

    // Add recommended treatments
    result.recommendations.push({
      diagnosis: code,
      recommended: rules.recommended
    });
  }

  return result;
};

/**
 * Check age-related risk factors
 */
export const checkAgeRelatedRisks = (age, content, context = {}) => {
  const warnings = [];

  if (age < 18) {
    warnings.push({
      type: 'age_warning',
      severity: 'MODERATE',
      message: 'Pediatric patient - Ensure appropriate techniques and consent',
      action: 'PEDIATRIC_PROTOCOL'
    });
  }

  if (age >= 65) {
    warnings.push({
      type: 'age_warning',
      severity: 'LOW',
      message: 'Geriatric patient - Consider bone density and comorbidities',
      action: 'GERIATRIC_CONSIDERATIONS'
    });

    // Enhanced check for elderly with certain symptoms
    if (/new.*onset|plutselig|sudden/i.test(content)) {
      warnings.push({
        type: 'age_warning',
        severity: 'MODERATE',
        message: 'New onset symptoms in elderly - Consider serious pathology',
        action: 'MEDICAL_EVALUATION'
      });
    }
  }

  if (age >= 50 && /first.*episode|første.*gang/i.test(content)) {
    warnings.push({
      type: 'age_warning',
      severity: 'MODERATE',
      message: 'First episode of back pain after age 50 - Screen for red flags',
      action: 'RED_FLAG_SCREENING'
    });
  }

  return warnings;
};

/**
 * Calculate confidence score for AI suggestion
 */
export const calculateConfidence = async (suggestion, context = {}) => {
  let confidence = 0.8; // Base confidence

  // Reduce confidence for complex cases
  if (context.patient?.red_flags?.length > 0) {
    confidence -= 0.1 * Math.min(context.patient.red_flags.length, 3);
  }

  // Reduce confidence for elderly or pediatric
  if (context.patient?.age) {
    if (context.patient.age < 18 || context.patient.age > 75) {
      confidence -= 0.1;
    }
  }

  // Reduce confidence for multiple diagnoses
  if (context.diagnoses?.length > 2) {
    confidence -= 0.1;
  }

  // Increase confidence if similar suggestions were accepted before
  if (context.organizationId) {
    try {
      const acceptanceRate = await getHistoricalAcceptanceRate(
        context.organizationId,
        context.suggestionType
      );
      if (acceptanceRate > 0.8) {
        confidence += 0.1;
      } else if (acceptanceRate < 0.5) {
        confidence -= 0.15;
      }
    } catch (error) {
      // Ignore database errors for confidence calculation
    }
  }

  return Math.max(0.1, Math.min(1.0, confidence));
};

/**
 * Get historical acceptance rate for suggestion type
 */
const getHistoricalAcceptanceRate = async (organizationId, suggestionType) => {
  try {
    const result = await query(
      `SELECT acceptance_rate
       FROM ai_performance_metrics
       WHERE organization_id = $1
         AND suggestion_type = $2
         AND metric_date >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY metric_date DESC
       LIMIT 1`,
      [organizationId, suggestionType]
    );
    return result.rows[0]?.acceptance_rate / 100 || 0.7;
  } catch (error) {
    return 0.7; // Default
  }
};

/**
 * Record validation result for learning
 */
export const recordValidationResult = async (validationResult, context = {}) => {
  try {
    await query(
      `INSERT INTO ai_learning_data (
        organization_id,
        encounter_id,
        learning_type,
        ai_suggestion,
        ai_confidence,
        outcome_data,
        practitioner_id
      ) VALUES ($1, $2, 'validation', $3, $4, $5, $6)
      ON CONFLICT (encounter_id) DO UPDATE SET
        outcome_data = EXCLUDED.outcome_data,
        updated_at = NOW()`,
      [
        context.organizationId,
        context.encounterId,
        JSON.stringify(context.suggestion),
        validationResult.confidence,
        JSON.stringify(validationResult),
        context.practitionerId
      ]
    );
  } catch (error) {
    logger.error('Failed to record validation result:', error);
  }
};

export default {
  validateClinicalContent,
  checkRedFlagsInContent,
  checkMedicationWarnings,
  validateMedicalLogic,
  checkAgeRelatedRisks,
  calculateConfidence,
  recordValidationResult,
  RED_FLAG_PATTERNS,
  MEDICATION_WARNINGS,
  TREATMENT_RULES
};
