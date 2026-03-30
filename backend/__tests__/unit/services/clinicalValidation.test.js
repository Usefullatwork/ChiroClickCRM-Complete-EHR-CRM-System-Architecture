/**
 * Unit Tests for Clinical Validation Service (src/services/clinical/clinicalValidation.js)
 * Tests red flag detection, contraindication checks, SOAP completeness, confidence scoring,
 * medication warnings, age-related risks, and medical logic validation.
 */

import { jest } from '@jest/globals';

// No external imports in the service, but required by the mocking pattern:
jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
  getClient: jest.fn(),
  default: { query: jest.fn(), transaction: jest.fn(), getClient: jest.fn() },
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const {
  validateClinicalContent,
  validateSOAPCompleteness,
  calculateConfidence,
  checkRedFlagsInContent,
  checkMedicationWarnings,
  checkAgeRelatedRisks,
  validateMedicalLogic,
} = await import('../../../src/services/clinical/clinicalValidation.js');

describe('clinicalValidation service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // checkRedFlagsInContent
  // ===========================================================================

  describe('checkRedFlagsInContent', () => {
    it('should return empty array for null/undefined content', () => {
      expect(checkRedFlagsInContent(null)).toEqual([]);
      expect(checkRedFlagsInContent(undefined)).toEqual([]);
    });

    it('should return empty array for benign clinical text', () => {
      const result = checkRedFlagsInContent('Pasient har mild ryggsmerte, bedres med hvile.');
      expect(result).toHaveLength(0);
    });

    it('should detect cauda equina pattern as CRITICAL', () => {
      const result = checkRedFlagsInContent('Mulig cauda equina kompresjon observert.');
      expect(result.length).toBeGreaterThan(0);
      const flag = result.find((f) => f.flag === 'cauda_equina');
      expect(flag).toBeDefined();
      expect(flag.severity).toBe('CRITICAL');
      expect(flag.action).toBe('IMMEDIATE_REFERRAL');
    });

    it('should detect bladder dysfunction as CRITICAL cauda equina flag', () => {
      const result = checkRedFlagsInContent('Blæreforstyrrelse og nedsatt kraft i bena.');
      const flag = result.find((f) => f.code === 'RF006');
      expect(flag).toBeDefined();
      expect(flag.severity).toBe('CRITICAL');
    });

    it('should detect saddle anesthesia as CRITICAL', () => {
      const result = checkRedFlagsInContent('Sadel-nummenhet og inkontinens.');
      expect(result.some((f) => f.category === 'cauda_equina')).toBe(true);
    });

    it('should detect weight loss + night pain combination as HIGH severity malignancy flag', () => {
      const result = checkRedFlagsInContent('Vekttap og nattsmerter siste måneder.');
      const flag = result.find((f) => f.flag === 'malignancy');
      expect(flag).toBeDefined();
      expect(flag.severity).toBe('HIGH');
      expect(flag.action).toBe('URGENT_REFERRAL');
    });

    it('should detect fever + immunosuppression combination as HIGH severity infection flag', () => {
      const result = checkRedFlagsInContent('Feber hos pasient med immunsuppresjon.');
      const flag = result.find((f) => f.flag === 'infection');
      expect(flag).toBeDefined();
      expect(flag.severity).toBe('HIGH');
    });

    it('should detect trauma + osteoporosis as MODERATE fracture flag', () => {
      const result = checkRedFlagsInContent('Pasient hadde fall, og har osteoporose.');
      const flag = result.find((f) => f.flag === 'fracture');
      expect(flag).toBeDefined();
      expect(flag.severity).toBe('MODERATE');
    });

    it('should return flag objects with required fields', () => {
      const result = checkRedFlagsInContent('cauda equina mistenkt');
      expect(result.length).toBeGreaterThan(0);
      const flag = result[0];
      expect(flag).toHaveProperty('flag');
      expect(flag).toHaveProperty('category');
      expect(flag).toHaveProperty('severity');
      expect(flag).toHaveProperty('message');
      expect(flag).toHaveProperty('action');
      expect(flag).toHaveProperty('code');
      expect(flag).toHaveProperty('matches');
    });
  });

  // ===========================================================================
  // validateClinicalContent
  // ===========================================================================

  describe('validateClinicalContent', () => {
    it('should return isValid=false and an error when content is missing', async () => {
      const result = await validateClinicalContent(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('validation_error');
    });

    it('should return isValid=false when content is not a string', async () => {
      const result = await validateClinicalContent(42);
      expect(result.isValid).toBe(false);
    });

    it('should pass for safe, well-formed clinical text', async () => {
      const content =
        'Pasient palpasjon av cervical region. Mobilisering utført. Smerte VAS 4/10. ROM normal.';
      const result = await validateClinicalContent(content);
      expect(result.isValid).toBe(true);
      expect(result.hasRedFlags).toBe(false);
    });

    it('should detect critical red flag and set canProceed=false', async () => {
      const result = await validateClinicalContent(
        'Cauda equina syndrom mistenkt ved undersøkelse.'
      );
      expect(result.hasRedFlags).toBe(true);
      expect(result.riskLevel).toBe('CRITICAL');
      expect(result.canProceed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect HIGH severity red flag and set canProceed=false', async () => {
      const result = await validateClinicalContent('Vekttap og nattsmerter er til stede.');
      expect(result.riskLevel).toBe('HIGH');
      expect(result.canProceed).toBe(false);
    });

    it('should detect MODERATE red flag and leave canProceed state determined by errors', async () => {
      const result = await validateClinicalContent('Trauma hos pasient med osteoporose.');
      expect(result.riskLevel).toBe('MODERATE');
      // No CRITICAL errors pushed — isValid depends on errors array
      expect(result.hasRedFlags).toBe(true);
    });

    it('should cap confidence at 0.3 when risk level is CRITICAL', async () => {
      const result = await validateClinicalContent(
        'Cauda equina syndrom og blæreforstyrrelse. Pasient palpasjon ROM mobilisering VAS nakke cervical.\nMer info:\n1234'
      );
      expect(result.confidence).toBeLessThanOrEqual(0.3);
    });

    it('should cap confidence at 0.5 when risk level is HIGH', async () => {
      const result = await validateClinicalContent(
        'Vekttap og nattsmerter. Pasient palpasjon mobilisering VAS ROM nakke cervical.\nMer info:\n1234'
      );
      expect(result.confidence).toBeLessThanOrEqual(0.5);
    });

    it('should scan context fields for red flags', async () => {
      const result = await validateClinicalContent('Normal tekst.', {
        subjective: 'cauda equina',
        objective: 'ingenting',
        assessment: '',
        plan: '',
      });
      expect(result.hasRedFlags).toBe(true);
      expect(result.riskLevel).toBe('CRITICAL');
    });

    it('should add patient red flag warnings when context.patient.red_flags is set', async () => {
      const result = await validateClinicalContent('Normal klinisk tekst.', {
        patient: { red_flags: ['cauda equina suspected'] },
      });
      expect(result.requiresReview).toBe(true);
      const patientFlag = result.warnings.find((w) => w.type === 'patient_red_flag');
      expect(patientFlag).toBeDefined();
      expect(patientFlag.severity).toBe('HIGH');
    });

    it('should detect PII (11-digit number) and add pii_warning', async () => {
      const result = await validateClinicalContent('Pasient har id 12345678901 i systemet.');
      const piiWarning = result.warnings.find((w) => w.type === 'pii_warning');
      expect(piiWarning).toBeDefined();
    });

    it('should detect email address and add pii_warning', async () => {
      const result = await validateClinicalContent('Kontakt pasient@example.com for mer info.');
      const piiWarning = result.warnings.find((w) => w.type === 'pii_warning');
      expect(piiWarning).toBeDefined();
    });

    it('should add medication warnings when patient medications include anticoagulants', async () => {
      const result = await validateClinicalContent('Normal undersøkelse.', {
        patient: { current_medications: ['Warfarin 5mg'] },
      });
      expect(result.requiresReview).toBe(true);
      const medWarning = result.warnings.find((w) => w.type === 'medication_warning');
      expect(medWarning).toBeDefined();
      expect(medWarning.category).toBe('anticoagulants');
    });
  });

  // ===========================================================================
  // validateSOAPCompleteness
  // ===========================================================================

  describe('validateSOAPCompleteness', () => {
    it('should return isComplete=true for a fully-filled encounter', () => {
      const encounter = {
        subjective: 'Pasient rapporterer smerte i korsryggen siden forrige uke.',
        objective: 'Palpasjon avdekker ømhet L4-L5. Test utført.',
        assessment: 'Lumbar muskelstrekk',
        plan: 'Mobilisering og hjemmeøvelser',
      };
      const result = validateSOAPCompleteness(encounter);
      expect(result.isComplete).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should flag missing subjective field', () => {
      const result = validateSOAPCompleteness({
        objective: 'Observasjon utført.',
        assessment: 'Diagnose',
        plan: 'Plan',
      });
      expect(result.isComplete).toBe(false);
      expect(result.missing.some((m) => m.includes('Subjektiv'))).toBe(true);
    });

    it('should flag too-short subjective (under 10 chars)', () => {
      const result = validateSOAPCompleteness({
        subjective: 'kort',
        objective: 'Palpasjon observasjon.',
        assessment: 'Diagnose',
        plan: 'Plan',
      });
      expect(result.isComplete).toBe(false);
    });

    it('should flag missing objective field', () => {
      const result = validateSOAPCompleteness({
        subjective: 'Pasient har vondt i ryggen.',
        assessment: 'Diagnose',
        plan: 'Plan',
      });
      expect(result.isComplete).toBe(false);
      expect(result.missing.some((m) => m.includes('Objektiv'))).toBe(true);
    });

    it('should flag missing assessment', () => {
      const result = validateSOAPCompleteness({
        subjective: 'Pasient rapporterer smerter.',
        objective: 'Palpasjon avdekker ømhet.',
        plan: 'Plan',
      });
      expect(result.isComplete).toBe(false);
      expect(result.missing.some((m) => m.includes('Vurdering'))).toBe(true);
    });

    it('should flag missing plan', () => {
      const result = validateSOAPCompleteness({
        subjective: 'Pasient rapporterer smerter.',
        objective: 'Palpasjon avdekker ømhet.',
        assessment: 'Diagnose',
      });
      expect(result.isComplete).toBe(false);
      expect(result.missing.some((m) => m.includes('Plan'))).toBe(true);
    });

    it('should warn when subjective has no description of complaints', () => {
      const result = validateSOAPCompleteness({
        subjective: 'Pasienten er her for konsultasjon.',
        objective: 'Palpasjon observasjon test utført.',
        assessment: 'Diagnose',
        plan: 'Plan',
      });
      expect(result.warnings.some((w) => w.includes('Subjektiv'))).toBe(true);
    });

    it('should warn when objective lacks clinical findings keywords', () => {
      const result = validateSOAPCompleteness({
        subjective: 'Pasient har vondt i ryggen.',
        objective: 'Pasienten er i god form og virker normal.',
        assessment: 'Diagnose',
        plan: 'Plan',
      });
      expect(result.warnings.some((w) => w.includes('Objektiv'))).toBe(true);
    });
  });

  // ===========================================================================
  // calculateConfidence
  // ===========================================================================

  describe('calculateConfidence', () => {
    it('should return a number between 0 and 1', () => {
      const score = calculateConfidence('Normal clinical note with palpasjon.');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should penalise very short content (under 20 chars)', () => {
      const score = calculateConfidence('ok');
      expect(score).toBeLessThan(0.5);
    });

    it('should boost score for content in optimal range (50-2000 chars)', () => {
      const content = 'Palpasjon av cervical region. '.repeat(5); // ~150 chars
      const score = calculateConfidence(content);
      expect(score).toBeGreaterThan(0.5);
    });

    it('should boost score when multiple medical terms are present', () => {
      const richContent =
        'Palpasjon mobilisering HVLA smerte VAS 5/10 ROM nakke cervical pasient behandling.';
      const poorContent = 'Pasienten kom inn og vi pratet litt.';
      expect(calculateConfidence(richContent)).toBeGreaterThan(calculateConfidence(poorContent));
    });

    it('should apply hasSimilarCases context bonus', () => {
      const base = calculateConfidence('Palpasjon utført.', {});
      const withCases = calculateConfidence('Palpasjon utført.', { hasSimilarCases: true });
      expect(withCases).toBeGreaterThan(base);
    });

    it('should apply templateMatch context bonus when score > 0.8', () => {
      const base = calculateConfidence('Palpasjon utført.', {});
      const withTemplate = calculateConfidence('Palpasjon utført.', { templateMatch: 0.9 });
      expect(withTemplate).toBeGreaterThan(base);
    });
  });

  // ===========================================================================
  // checkMedicationWarnings
  // ===========================================================================

  describe('checkMedicationWarnings', () => {
    it('should return empty array for empty medication list', () => {
      expect(checkMedicationWarnings([])).toHaveLength(0);
    });

    it('should warn for warfarin (anticoagulant)', () => {
      const warnings = checkMedicationWarnings(['Warfarin 5mg daglig']);
      expect(warnings.some((w) => w.category === 'anticoagulants')).toBe(true);
      expect(warnings.find((w) => w.category === 'anticoagulants').severity).toBe('HIGH');
    });

    it('should warn for xarelto (anticoagulant)', () => {
      const warnings = checkMedicationWarnings(['Xarelto 20mg']);
      expect(warnings.some((w) => w.category === 'anticoagulants')).toBe(true);
    });

    it('should warn for prednisolon (steroid)', () => {
      const warnings = checkMedicationWarnings(['Prednisolon 5mg']);
      expect(warnings.some((w) => w.category === 'steroids')).toBe(true);
      expect(warnings.find((w) => w.category === 'steroids').severity).toBe('MODERATE');
    });

    it('should warn for fosamax (bisphosphonate)', () => {
      const warnings = checkMedicationWarnings(['Fosamax 70mg ukentlig']);
      expect(warnings.some((w) => w.category === 'bisphosphonates')).toBe(true);
    });

    it('should accept (content, medications) signature for backwards compat', () => {
      const warnings = checkMedicationWarnings('some content', ['Warfarin 5mg']);
      expect(warnings.some((w) => w.category === 'anticoagulants')).toBe(true);
    });

    it('should produce multiple warnings for multiple matching medications', () => {
      const warnings = checkMedicationWarnings(['Warfarin 5mg', 'Prednisolon 5mg']);
      expect(warnings.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ===========================================================================
  // checkAgeRelatedRisks
  // ===========================================================================

  describe('checkAgeRelatedRisks', () => {
    it('should return pediatric warning for patient under 18', () => {
      const warnings = checkAgeRelatedRisks(15, 'back pain');
      expect(warnings.some((w) => w.type === 'PEDIATRIC')).toBe(true);
    });

    it('should warn for first episode after age 50', () => {
      const warnings = checkAgeRelatedRisks(55, 'first episode back pain');
      expect(warnings.some((w) => w.type === 'RED_FLAG')).toBe(true);
    });

    it('should return geriatric warning for patient aged 65+', () => {
      const warnings = checkAgeRelatedRisks(70, 'chronic back pain');
      expect(warnings.some((w) => w.type === 'GERIATRIC')).toBe(true);
    });

    it('should add red flag for new onset symptoms in elderly patient', () => {
      const warnings = checkAgeRelatedRisks(68, 'sudden onset back pain');
      const types = warnings.map((w) => w.type);
      expect(types).toContain('GERIATRIC');
      expect(types).toContain('RED_FLAG');
    });

    it('should return empty array for healthy mid-age patient without red flag complaint', () => {
      const warnings = checkAgeRelatedRisks(35, 'chronic mild back pain');
      expect(warnings).toHaveLength(0);
    });
  });

  // ===========================================================================
  // validateMedicalLogic
  // ===========================================================================

  describe('validateMedicalLogic', () => {
    it('should return valid=true for safe treatment-diagnosis pairing', () => {
      const result = validateMedicalLogic('M54.5', 'mobilization', {});
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid=false and error for HVLA_cervical with myelopathy contraindication', () => {
      const result = validateMedicalLogic('M47', 'HVLA_cervical', {
        patient: { contraindications: ['cervical myelopathy'], red_flags: [] },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === 'contraindication')).toBe(true);
    });

    it('should block treatment when cauda equina is in patient red flags', () => {
      const result = validateMedicalLogic('M51', 'mobilization', {
        patient: { contraindications: [], red_flags: ['cauda equina suspected'] },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === 'red_flag')).toBe(true);
    });

    it('should add exercise recommendation when treatment is exercise', () => {
      const result = validateMedicalLogic('M54.5', 'exercise', {});
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].recommended).toBe('exercise therapy');
    });
  });
});
