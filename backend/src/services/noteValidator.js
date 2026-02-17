/**
 * Note Validation Service
 * Validates clinical notes for completeness, safety, and coding correctness.
 * Integrates with redFlagEngine and clinicalValidation for comprehensive checks.
 */

import { normalizeSoapData, getRequiredFields } from '../utils/soapSchema.js';
import { scanForRedFlags, calculateRiskScore } from './redFlagEngine.js';
import { checkRedFlagsInContent, checkMedicationWarnings } from './clinicalValidation.js';

/**
 * ICPC-2 code format: letter + 2 digits (e.g. L03, A97)
 */
const ICPC2_PATTERN = /^[A-Z]\d{2}$/;

/**
 * ICD-10 code format: letter + 2 digits, optional dot + more digits (e.g. M54.5, G43.0)
 */
const ICD10_PATTERN = /^[A-Z]\d{2}(\.\d{1,4})?$/;

/**
 * Minimum content length (chars) for a section to be considered meaningfully filled
 */
const MIN_CONTENT_LENGTH = 10;

/**
 * Extract text content from a SOAP section.
 * Sections can be strings or objects with subfields.
 */
function extractSectionText(section) {
  if (!section) {
    return '';
  }
  if (typeof section === 'string') {
    return section;
  }
  if (typeof section === 'object') {
    return Object.values(section)
      .filter((v) => typeof v === 'string')
      .join(' ');
  }
  return '';
}

/**
 * Check if a section has meaningful content
 */
function sectionHasContent(section) {
  const text = extractSectionText(section);
  return text.trim().length >= MIN_CONTENT_LENGTH;
}

/**
 * Get the chief complaint from subjective data (handles various field names)
 */
function getChiefComplaint(subjective) {
  if (!subjective) {
    return null;
  }
  if (typeof subjective === 'string') {
    return subjective;
  }
  return (
    subjective.chief_complaint ||
    subjective.chiefComplaint ||
    subjective.hovedklage ||
    subjective.hovedplage ||
    null
  );
}

/**
 * Calculate completeness score (0-100)
 * 25 points per SOAP section, bonus for diagnosis codes
 */
function calculateCompletenessScore(data, _encounterType) {
  let score = 0;
  const _maxSectionScore = 25;

  // Subjective (25 pts)
  if (sectionHasContent(data.subjective)) {
    score += 15;
    if (getChiefComplaint(data.subjective)) {
      score += 10;
    }
  }

  // Objective (25 pts)
  if (sectionHasContent(data.objective)) {
    score += 25;
  }

  // Assessment (25 pts)
  if (sectionHasContent(data.assessment)) {
    score += 20;
    // Bonus for diagnosis codes
    const hasIcpc = data.icpc_codes?.length > 0 || data.icpcCodes?.length > 0;
    const hasIcd10 = data.icd10_codes?.length > 0 || data.icd10Codes?.length > 0;
    if (hasIcpc || hasIcd10) {
      score += 5;
    }
  }

  // Plan (25 pts)
  if (sectionHasContent(data.plan)) {
    score += 25;
  }

  return Math.min(100, score);
}

/**
 * Validate ICPC-2 codes
 */
function validateIcpcCodes(codes) {
  const errors = [];
  if (!codes || !Array.isArray(codes)) {
    return errors;
  }

  for (const code of codes) {
    if (typeof code !== 'string') {
      errors.push(`Invalid ICPC-2 code format: ${code}`);
      continue;
    }
    const normalized = code.trim().toUpperCase();
    if (!ICPC2_PATTERN.test(normalized)) {
      errors.push(`Invalid ICPC-2 code format "${code}" - expected format: A00-Z99`);
    }
  }

  return errors;
}

/**
 * Validate ICD-10 codes
 */
function validateIcd10Codes(codes) {
  const errors = [];
  if (!codes || !Array.isArray(codes)) {
    return errors;
  }

  for (const code of codes) {
    if (typeof code !== 'string') {
      errors.push(`Invalid ICD-10 code format: ${code}`);
      continue;
    }
    const normalized = code.trim().toUpperCase();
    if (!ICD10_PATTERN.test(normalized)) {
      errors.push(
        `Invalid ICD-10 code format "${code}" - expected format: A00-Z99 or A00.0-Z99.99`
      );
    }
  }

  return errors;
}

/**
 * Main validation function.
 *
 * @param {Object} data - SOAP data (subjective, objective, assessment, plan, icpc_codes, icd10_codes, etc.)
 * @param {string} encounterType - 'INITIAL', 'FOLLOW_UP', 'SOAP', 'VESTIBULAR', etc.
 * @param {Object} context - Optional context (patient info, medications)
 * @returns {Object} Validation result
 */
export function validate(data, encounterType = 'SOAP', context = {}) {
  const result = {
    valid: true,
    canSave: true,
    warnings: [],
    errors: [],
    redFlags: [],
    suggestions: [],
    completenessScore: 0,
  };

  if (!data || typeof data !== 'object') {
    result.valid = false;
    result.canSave = false;
    result.errors.push('No data provided');
    return result;
  }

  // Normalize field names
  const normalized = normalizeSoapData(data);
  const type = (encounterType || 'SOAP').toUpperCase();

  // 1. Check chief complaint (required for all types)
  const chiefComplaint = getChiefComplaint(normalized.subjective);
  if (!chiefComplaint || chiefComplaint.trim().length < 3) {
    result.errors.push('Hovedklage/chief complaint mangler eller er for kort');
    result.canSave = false;
    result.valid = false;
  }

  // 2. Check section presence
  if (!sectionHasContent(normalized.objective)) {
    result.warnings.push('Objektiv del mangler eller er for kort');
  }

  if (!sectionHasContent(normalized.assessment)) {
    result.warnings.push('Vurdering (Assessment) mangler eller er for kort');
  }

  if (!sectionHasContent(normalized.plan)) {
    if (type === 'INITIAL') {
      result.warnings.push('Plan mangler - anbefalt for førstegangsundersøkelse');
    }
    // For FOLLOW_UP, missing plan is ok (no warning)
  }

  // 3. Check required fields for encounter type
  const requiredFields = getRequiredFields(type);
  for (const [section, reqs] of Object.entries(requiredFields)) {
    const sectionData = normalized[section];
    if (!sectionData || typeof sectionData !== 'object') {
      continue;
    }

    for (const field of reqs.required) {
      if (field === 'chief_complaint') {
        continue;
      } // Already checked above
      const value = sectionData[field];
      if (!value || (typeof value === 'string' && value.trim().length < 3)) {
        result.suggestions.push(`Anbefalt felt mangler: ${section}.${field}`);
      }
    }
  }

  // 4. Validate diagnosis codes
  const icpcCodes = normalized.icpc_codes || normalized.icpcCodes || data.icpc_codes || [];
  const icd10Codes = normalized.icd10_codes || normalized.icd10Codes || data.icd10_codes || [];

  const icpcErrors = validateIcpcCodes(icpcCodes);
  const icd10Errors = validateIcd10Codes(icd10Codes);

  if (icpcErrors.length > 0) {
    result.warnings.push(...icpcErrors);
  }
  if (icd10Errors.length > 0) {
    result.warnings.push(...icd10Errors);
  }

  if (icpcCodes.length === 0 && icd10Codes.length === 0) {
    result.suggestions.push(
      'Ingen diagnosekoder angitt - vurder å legge til ICPC-2 eller ICD-10 kode'
    );
  }

  // 5. Red flag checks - integrate with redFlagEngine
  const allText = [
    extractSectionText(normalized.subjective),
    extractSectionText(normalized.objective),
    extractSectionText(normalized.assessment),
    extractSectionText(normalized.plan),
  ].join(' ');

  if (allText.trim().length > 0) {
    // Red flag engine scan
    const engineFlags = scanForRedFlags(allText, {
      age: context.patient?.age || context.age,
    });

    if (engineFlags.length > 0) {
      const _riskScore = calculateRiskScore(engineFlags, {
        age: context.patient?.age || context.age,
      });

      for (const flag of engineFlags) {
        result.redFlags.push({
          ruleId: flag.ruleId,
          category: flag.category,
          severity: flag.severity,
          message: flag.description?.no || flag.description?.en || flag.category,
          action: flag.action,
          timeframe: flag.timeframe,
        });
      }
    }

    // Also run clinicalValidation content check
    const contentFlags = checkRedFlagsInContent(allText);
    for (const flag of contentFlags) {
      // Avoid duplicates by checking code
      const isDuplicate = result.redFlags.some(
        (rf) => rf.ruleId === flag.code || rf.category === flag.category
      );
      if (!isDuplicate) {
        result.redFlags.push({
          ruleId: flag.code,
          category: flag.category,
          severity: flag.severity,
          message: flag.message,
          action: flag.action,
        });
      }
    }
  }

  // 6. Medication warnings from patient context
  if (context.patient?.current_medications?.length > 0) {
    const medWarnings = checkMedicationWarnings(context.patient.current_medications);
    for (const warn of medWarnings) {
      result.warnings.push(warn.message);
    }
  }

  // 7. Calculate completeness score
  result.completenessScore = calculateCompletenessScore(normalized, type);

  // Red flags are always flagged but canSave remains true (practitioner decides)
  // Only missing chief complaint blocks saving

  // Final validity: no errors means valid
  result.valid = result.errors.length === 0;

  return result;
}

export default {
  validate,
};
