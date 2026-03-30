/**
 * Unit Tests for noteValidator.js
 *
 * Tests SOAP note completeness validation, field requirements, diagnosis code
 * validation, red flag integration, and completeness scoring.
 */

import { jest } from '@jest/globals';

// ------------------------------------------------------------------
// Mock database + logger (pulled in transitively by redFlagEngine)
// ------------------------------------------------------------------
const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  getClient: jest.fn(),
  default: { query: mockQuery, transaction: jest.fn(), getClient: jest.fn() },
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ------------------------------------------------------------------
// Mock redFlagEngine — called with text, returns configurable results
// ------------------------------------------------------------------
let mockScanForRedFlags;
let mockCalculateRiskScore;

jest.unstable_mockModule('../../../src/services/clinical/redFlagEngine.js', () => ({
  scanForRedFlags: (...args) => mockScanForRedFlags(...args),
  calculateRiskScore: (...args) => mockCalculateRiskScore(...args),
  RED_FLAG_CATEGORIES: {},
  RED_FLAG_RULES: [],
  getScreeningQuestions: () => [],
  generateAlert: () => null,
  logRedFlagDetection: async () => {},
  default: {},
}));

// ------------------------------------------------------------------
// Mock clinicalValidation — checkRedFlagsInContent + checkMedicationWarnings
// ------------------------------------------------------------------
let mockCheckRedFlagsInContent;
let mockCheckMedicationWarnings;

jest.unstable_mockModule('../../../src/services/clinical/clinicalValidation.js', () => ({
  checkRedFlagsInContent: (...args) => mockCheckRedFlagsInContent(...args),
  checkMedicationWarnings: (...args) => mockCheckMedicationWarnings(...args),
  validateClinicalContent: jest.fn(),
  validateSOAPCompleteness: jest.fn(),
  calculateConfidence: jest.fn(),
  validateClinicalMiddleware: jest.fn(),
  validateMedicalLogic: jest.fn(),
  checkAgeRelatedRisks: jest.fn(),
  default: {},
}));

// ------------------------------------------------------------------
// Import service under test AFTER mocks are registered
// ------------------------------------------------------------------
const { validate } = await import('../../../src/services/clinical/noteValidator.js');

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/** Minimal valid SOAP note — chief complaint is present and long enough */
const makeValidData = (overrides = {}) => ({
  subjective: { chief_complaint: 'Korsryggsmerter siden forrige uke' },
  objective: 'Begrenset bevegelse i lumbalregionen ved fleksjon',
  assessment: 'L4-L5 dysfunksjon med muskelguarding observert',
  plan: 'Manipulasjon, hjemmeøvelser og oppfølging om to uker',
  ...overrides,
});

// ------------------------------------------------------------------
// Setup / teardown
// ------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();

  // Default: no red flags from either engine
  mockScanForRedFlags = () => [];
  mockCalculateRiskScore = () => ({ score: 0, level: 'LOW' });
  mockCheckRedFlagsInContent = () => [];
  mockCheckMedicationWarnings = () => [];
});

// ===========================================================================
// validate — input guard
// ===========================================================================

describe('validate — input guard', () => {
  it('should return invalid with canSave=false when data is null', () => {
    const result = validate(null);
    expect(result.valid).toBe(false);
    expect(result.canSave).toBe(false);
    expect(result.errors).toContain('No data provided');
  });

  it('should return invalid when data is a primitive string', () => {
    const result = validate('soap text');
    expect(result.valid).toBe(false);
    expect(result.canSave).toBe(false);
  });

  it('should return invalid when data is undefined', () => {
    const result = validate(undefined);
    expect(result.valid).toBe(false);
    expect(result.canSave).toBe(false);
  });
});

// ===========================================================================
// validate — chief complaint requirement
// ===========================================================================

describe('validate — chief complaint requirement', () => {
  it('should be invalid when chief complaint is missing entirely', () => {
    const result = validate({
      subjective: {},
      objective: 'text here ok',
      assessment: 'ok',
      plan: 'ok',
    });
    expect(result.valid).toBe(false);
    expect(result.canSave).toBe(false);
    expect(result.errors.some((e) => /hovedklage|chief complaint/i.test(e))).toBe(true);
  });

  it('should be invalid when chief complaint is too short (< 3 chars)', () => {
    const result = validate({
      subjective: { chief_complaint: 'ab' },
      objective: 'ok',
      assessment: 'ok',
      plan: 'ok',
    });
    expect(result.valid).toBe(false);
    expect(result.canSave).toBe(false);
  });

  it('should accept chief complaint via camelCase alias (chiefComplaint)', () => {
    const data = {
      subjective: { chiefComplaint: 'Nakkesmerter ved bevegelse' },
      objective: 'Palpasjon viser økt tonus i nakkemuskulatur',
      assessment: 'Cervikalt bekkenleire C3-C5',
      plan: 'Manipulasjon og mobilisering',
    };
    const result = validate(data);
    expect(result.valid).toBe(true);
    expect(result.canSave).toBe(true);
  });

  it('should accept chief complaint via Norwegian alias (hovedklage)', () => {
    const data = {
      subjective: { hovedklage: 'Hodepine morgen og kveld' },
      objective: 'ROM nedsatt i cervikal',
      assessment: 'Cervikogen hodepine diagnose',
      plan: 'Behandling med manipulasjon',
    };
    const result = validate(data);
    expect(result.valid).toBe(true);
  });

  it('should accept chief complaint when subjective is a plain string', () => {
    const data = {
      subjective: 'Skuldersmerte og stivhet',
      objective: 'Begrenset abduksjon høyre skulder',
      assessment: 'Rotatorcuff irritasjon mistenkt',
      plan: 'Mobilisering og øvelser',
    };
    const result = validate(data);
    expect(result.valid).toBe(true);
  });
});

// ===========================================================================
// validate — section completeness warnings
// ===========================================================================

describe('validate — section completeness warnings', () => {
  it('should warn when objective section is missing', () => {
    const result = validate({ subjective: { chief_complaint: 'Korsryggsmerter i 3 uker' } });
    expect(result.warnings.some((w) => /objektiv/i.test(w))).toBe(true);
  });

  it('should warn when assessment section is missing', () => {
    const result = validate(makeValidData({ assessment: undefined }));
    expect(result.warnings.some((w) => /vurdering|assessment/i.test(w))).toBe(true);
  });

  it('should warn when plan is missing for INITIAL encounter type', () => {
    const result = validate(makeValidData({ plan: undefined }), 'INITIAL');
    expect(result.warnings.some((w) => /plan/i.test(w))).toBe(true);
  });

  it('should NOT warn about missing plan for FOLLOW_UP encounter type', () => {
    const result = validate(makeValidData({ plan: undefined }), 'FOLLOW_UP');
    const planWarnings = result.warnings.filter((w) => /plan mangler/i.test(w));
    expect(planWarnings).toHaveLength(0);
  });

  it('should not produce errors for a fully valid SOAP note', () => {
    const result = validate(makeValidData());
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toBe(true);
    expect(result.canSave).toBe(true);
  });
});

// ===========================================================================
// validate — diagnosis code validation
// ===========================================================================

describe('validate — ICPC-2 code validation', () => {
  it('should warn on malformed ICPC-2 code', () => {
    const data = makeValidData({ icpc_codes: ['INVALID', 'L03'] });
    const result = validate(data);
    const icpcWarn = result.warnings.find((w) => /INVALID/i.test(w));
    expect(icpcWarn).toBeDefined();
  });

  it('should accept valid ICPC-2 codes without warnings', () => {
    const data = makeValidData({ icpc_codes: ['L03', 'A97', 'Z00'] });
    const result = validate(data);
    const icpcWarns = result.warnings.filter((w) => /icpc/i.test(w.toLowerCase()));
    expect(icpcWarns).toHaveLength(0);
  });

  it('should warn on non-string ICPC-2 code entry', () => {
    const data = makeValidData({ icpc_codes: [123] });
    const result = validate(data);
    expect(result.warnings.some((w) => /invalid icpc/i.test(w))).toBe(true);
  });
});

describe('validate — ICD-10 code validation', () => {
  it('should warn on malformed ICD-10 code', () => {
    const data = makeValidData({ icd10_codes: ['bad-code'] });
    const result = validate(data);
    expect(result.warnings.some((w) => /bad-code/i.test(w))).toBe(true);
  });

  it('should accept valid ICD-10 codes (with and without sub-code)', () => {
    const data = makeValidData({ icd10_codes: ['M54', 'M54.5', 'G43.0'] });
    const result = validate(data);
    const icdWarns = result.warnings.filter((w) => /icd/i.test(w.toLowerCase()));
    expect(icdWarns).toHaveLength(0);
  });

  it('should suggest adding diagnosis codes when none are provided', () => {
    const result = validate(makeValidData());
    expect(result.suggestions.some((s) => /diagnosekoder/i.test(s))).toBe(true);
  });

  it('should NOT suggest adding codes when at least one ICPC-2 code is present', () => {
    const data = makeValidData({ icpc_codes: ['L03'] });
    const result = validate(data);
    const codeSuggestion = result.suggestions.find((s) => /diagnosekoder/i.test(s));
    expect(codeSuggestion).toBeUndefined();
  });
});

// ===========================================================================
// validate — red flag integration
// ===========================================================================

describe('validate — red flag integration', () => {
  it('should populate redFlags from scanForRedFlags result', () => {
    mockScanForRedFlags = () => [
      {
        ruleId: 'CE001',
        category: 'cauda_equina',
        severity: 'CRITICAL',
        description: { no: 'Mulig cauda equina', en: 'Possible cauda equina' },
        action: 'IMMEDIATE_REFERRAL',
        timeframe: 'immediate',
      },
    ];

    const result = validate(makeValidData());
    expect(result.redFlags).toHaveLength(1);
    expect(result.redFlags[0].ruleId).toBe('CE001');
    expect(result.redFlags[0].severity).toBe('CRITICAL');
  });

  it('should populate redFlags from checkRedFlagsInContent result', () => {
    mockScanForRedFlags = () => [];
    mockCheckRedFlagsInContent = () => [
      {
        code: 'RF001',
        category: 'cauda_equina',
        severity: 'CRITICAL',
        message: 'Mulig Cauda Equina',
        action: 'IMMEDIATE_REFERRAL',
      },
    ];

    const result = validate(makeValidData());
    expect(result.redFlags).toHaveLength(1);
    expect(result.redFlags[0].ruleId).toBe('RF001');
  });

  it('should de-duplicate flags from both engines by ruleId/category', () => {
    const sharedCategory = 'cauda_equina';
    mockScanForRedFlags = () => [
      {
        ruleId: 'CE001',
        category: sharedCategory,
        severity: 'CRITICAL',
        description: { no: 'Cauda Equina' },
        action: 'IMMEDIATE_REFERRAL',
        timeframe: 'immediate',
      },
    ];
    mockCheckRedFlagsInContent = () => [
      {
        code: 'CE001', // same ruleId as above — should be treated as duplicate
        category: sharedCategory,
        severity: 'CRITICAL',
        message: 'Duplicate flag',
        action: 'IMMEDIATE_REFERRAL',
      },
    ];

    const result = validate(makeValidData());
    expect(result.redFlags).toHaveLength(1);
  });

  it('should still be canSave=true even when red flags are present', () => {
    mockScanForRedFlags = () => [
      {
        ruleId: 'CE001',
        category: 'cauda_equina',
        severity: 'CRITICAL',
        description: { no: 'Cauda Equina' },
        action: 'IMMEDIATE_REFERRAL',
        timeframe: 'immediate',
      },
    ];

    const result = validate(makeValidData());
    expect(result.canSave).toBe(true);
  });
});

// ===========================================================================
// validate — medication warnings
// ===========================================================================

describe('validate — medication warnings from context', () => {
  it('should add medication warnings when patient has current medications', () => {
    mockCheckMedicationWarnings = () => [
      { message: 'Warfarin: økt blødningsrisiko ved manipulasjon' },
    ];

    const context = {
      patient: { current_medications: ['warfarin'] },
    };
    const result = validate(makeValidData(), 'SOAP', context);
    expect(result.warnings.some((w) => /warfarin/i.test(w))).toBe(true);
  });

  it('should not call checkMedicationWarnings when no medications in context', () => {
    let called = false;
    mockCheckMedicationWarnings = () => {
      called = true;
      return [];
    };

    validate(makeValidData(), 'SOAP', { patient: { current_medications: [] } });
    expect(called).toBe(false);
  });
});

// ===========================================================================
// validate — completeness score
// ===========================================================================

describe('validate — completeness score', () => {
  it('should return score of 0 when no sections are filled', () => {
    // Only chief complaint present but too short → no sections
    const result = validate({ subjective: {} });
    expect(result.completenessScore).toBe(0);
  });

  it('should return score of 100 for a fully complete note with diagnosis codes', () => {
    const data = makeValidData({ icpc_codes: ['L03'] });
    const result = validate(data);
    expect(result.completenessScore).toBe(100);
  });

  it('should return partial score when only subjective and objective are filled', () => {
    const data = {
      subjective: { chief_complaint: 'Korsryggsmerter siden forrige uke' },
      objective: 'Palpasjon viser økt tonus lumbal muskulatur',
    };
    const result = validate(data);
    // 15 (sub content) + 10 (chief complaint) + 25 (objective) = 50
    expect(result.completenessScore).toBe(50);
  });
});

// ===========================================================================
// validate — result structure
// ===========================================================================

describe('validate — result structure', () => {
  it('should always return all required fields on the result object', () => {
    const result = validate(makeValidData());
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('canSave');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('redFlags');
    expect(result).toHaveProperty('suggestions');
    expect(result).toHaveProperty('completenessScore');
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.redFlags)).toBe(true);
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it('should use SOAP as default encounter type when none provided', () => {
    const result = validate(makeValidData());
    // SOAP type does not require plan — no plan warning expected
    expect(result.valid).toBe(true);
  });

  it('should handle encounter type case-insensitively', () => {
    const resultLower = validate(makeValidData(), 'initial');
    const resultUpper = validate(makeValidData(), 'INITIAL');
    expect(resultLower.valid).toBe(resultUpper.valid);
  });
});
