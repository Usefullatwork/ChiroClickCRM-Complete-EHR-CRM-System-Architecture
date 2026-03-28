/**
 * Unit Tests for clinicalWorkflow.js and clinicalEvals.js
 *
 * clinicalWorkflow — state machine functions:
 *   startEncounter, recordExamination, recordTreatment, finalizeEncounter
 *   + exported helpers: mapFindingsToObjective, mapTreatmentsToPlan
 *
 * clinicalEvals — evaluation scoring:
 *   getEvalSummary, runEvalBatch (partial — avoids live AI calls)
 */

import { jest } from '@jest/globals';

// ─── Database mock ────────────────────────────────────────────────────────────
// resetMocks:true resets the mock between tests, so we use module-level let
// variables and reassign them in beforeEach (same pattern as clinicalOrchestrator).
let mockQuery;
let mockTransaction;

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: (...args) => mockQuery(...args),
  transaction: (...args) => mockTransaction(...args),
  getClient: jest.fn(),
  default: {
    query: (...args) => mockQuery(...args),
    transaction: (...args) => mockTransaction(...args),
    getClient: jest.fn(),
  },
}));

// ─── Logger mock ─────────────────────────────────────────────────────────────
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ─── encounterService mock ────────────────────────────────────────────────────
let mockCreateEncounter;
let mockGetEncounterById;
let mockGetPatientEncounterHistory;
let mockCheckRedFlags;
let mockUpdateEncounter;
let mockGenerateFormattedNote;

jest.unstable_mockModule('../../../src/services/encounters.js', () => ({
  createEncounter: (...args) => mockCreateEncounter(...args),
  getEncounterById: (...args) => mockGetEncounterById(...args),
  getPatientEncounterHistory: (...args) => mockGetPatientEncounterHistory(...args),
  checkRedFlags: (...args) => mockCheckRedFlags(...args),
  updateEncounter: (...args) => mockUpdateEncounter(...args),
  generateFormattedNote: (...args) => mockGenerateFormattedNote(...args),
  default: {},
}));

// ─── examinationService mock ──────────────────────────────────────────────────
let mockCreateFinding;

jest.unstable_mockModule('../../../src/services/examinations.js', () => ({
  createFinding: (...args) => mockCreateFinding(...args),
  default: {},
}));

// ─── treatmentService mock ────────────────────────────────────────────────────
let mockGetTreatmentCode;
let mockIncrementTreatmentUsageCount;
let mockCalculateTreatmentPrice;

jest.unstable_mockModule('../../../src/services/treatments.js', () => ({
  getTreatmentCode: (...args) => mockGetTreatmentCode(...args),
  incrementTreatmentUsageCount: (...args) => mockIncrementTreatmentUsageCount(...args),
  calculateTreatmentPrice: (...args) => mockCalculateTreatmentPrice(...args),
  default: {},
}));

// ─── noteValidator mock ───────────────────────────────────────────────────────
let mockValidateNote;

jest.unstable_mockModule('../../../src/services/noteValidator.js', () => ({
  validate: (...args) => mockValidateNote(...args),
}));

// ─── aiProviderFactory mock (needed by clinicalEvals) ─────────────────────────
jest.unstable_mockModule('../../../src/services/providers/aiProviderFactory.js', () => ({
  getAIProvider: () => ({ generate: jest.fn() }),
}));

// ─── Lazy imports (after all mocks) ──────────────────────────────────────────
const workflowModule = await import('../../../src/services/clinicalWorkflow.js');
const {
  startEncounter,
  recordExamination,
  recordTreatment,
  finalizeEncounter,
  mapFindingsToObjective,
  mapTreatmentsToPlan,
} = workflowModule;

const evalsModule = await import('../../../src/services/clinicalEvals.js');
const { getEvalSummary, runEvalBatch, GRADING_SYSTEM } = evalsModule;

// ─── Test fixtures ────────────────────────────────────────────────────────────
const ORG_ID = 'org-001';
const PATIENT_ID = 'pat-001';
const ENCOUNTER_ID = 'enc-001';
const PRACTITIONER_ID = 'prac-001';

const makeEncounter = (overrides = {}) => ({
  id: ENCOUNTER_ID,
  organization_id: ORG_ID,
  patient_id: PATIENT_ID,
  practitioner_id: PRACTITIONER_ID,
  encounter_type: 'FOLLOW_UP',
  signed_at: null,
  objective: {},
  plan: {},
  subjective: {},
  assessment: {},
  icd10_codes: [],
  icpc_codes: [],
  vas_pain_start: null,
  vas_pain_end: null,
  duration_minutes: 30,
  encounter_date: new Date('2026-01-01'),
  ...overrides,
});

// =============================================================================
// clinicalWorkflow — mapFindingsToObjective (pure helper)
// =============================================================================

describe('mapFindingsToObjective', () => {
  it('merges free-text exam fields into objective', () => {
    const result = mapFindingsToObjective(
      {},
      { observation: 'antalgic gait', palpation: 'L4 tender', rom: '50%', ortho_tests: 'SLR neg' },
      []
    );
    expect(result.observation).toBe('antalgic gait');
    expect(result.palpation).toBe('L4 tender');
    expect(result.rom).toBe('50%');
    expect(result.ortho_tests).toBe('SLR neg');
  });

  it('builds structured_findings summary from stored findings', () => {
    const findings = [
      { test_name: 'SLR', result: 'positive', laterality: 'left', findings_text: 'radiculopathy' },
      { test_name: 'Kemp', result: 'negative', laterality: null, findings_text: null },
    ];
    const result = mapFindingsToObjective({}, {}, findings);
    expect(result.structured_findings).toHaveLength(2);
    expect(result.structured_findings[0]).toContain('SLR');
    expect(result.structured_findings[0]).toContain('positive');
    expect(result.structured_findings[0]).toContain('left');
    expect(result.structured_findings[0]).toContain('radiculopathy');
  });

  it('appends to existing structured_findings rather than overwriting', () => {
    const existing = { structured_findings: ['prior finding'] };
    const result = mapFindingsToObjective(existing, {}, [
      { test_name: 'new test', result: 'positive' },
    ]);
    expect(result.structured_findings).toHaveLength(2);
    expect(result.structured_findings[0]).toBe('prior finding');
  });
});

// =============================================================================
// clinicalWorkflow — mapTreatmentsToPlan (pure helper)
// =============================================================================

describe('mapTreatmentsToPlan', () => {
  it('sets treatment description when treatment_description is provided', () => {
    const result = mapTreatmentsToPlan({}, { treatment_description: 'Manipulation L4/L5' });
    expect(result.treatment).toBe('Manipulation L4/L5');
  });

  it('builds treatments_performed array from individual treatments', () => {
    const result = mapTreatmentsToPlan(
      {},
      {
        treatments: [
          { description: 'Chiro adjust', region: 'lumbar', notes: 'HVT' },
          { code: 'A101', region: null, notes: null },
        ],
      }
    );
    expect(result.treatments_performed).toHaveLength(2);
    expect(result.treatments_performed[0]).toContain('Chiro adjust');
    expect(result.treatments_performed[0]).toContain('lumbar');
    expect(result.treatments_performed[0]).toContain('HVT');
    expect(result.treatments_performed[1]).toBe('A101');
  });

  it('merges exercises, advice, follow_up, and referral fields', () => {
    const result = mapTreatmentsToPlan(
      {},
      {
        exercises: ['cat-cow', 'bird-dog'],
        advice: 'avoid heavy lifting',
        follow_up: '1 week',
        referral: 'physio',
      }
    );
    expect(result.exercises).toEqual(['cat-cow', 'bird-dog']);
    expect(result.advice).toBe('avoid heavy lifting');
    expect(result.follow_up).toBe('1 week');
    expect(result.referral).toBe('physio');
  });
});

// =============================================================================
// clinicalWorkflow — startEncounter
// =============================================================================

describe('startEncounter', () => {
  beforeEach(() => {
    mockQuery = jest.fn();
    mockTransaction = jest.fn();
    mockCreateEncounter = jest.fn();
    mockGetPatientEncounterHistory = jest.fn();
    mockCheckRedFlags = jest.fn();
  });

  it('returns encounter and context on success', async () => {
    const enc = makeEncounter({ id: 'enc-new' });
    mockCreateEncounter.mockResolvedValue(enc);
    mockGetPatientEncounterHistory.mockResolvedValue([]);
    mockCheckRedFlags.mockResolvedValue({ alerts: [], warnings: [] });
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: PATIENT_ID,
          first_name: 'Ola',
          last_name: 'Nordmann',
          date_of_birth: '1980-01-01',
          red_flags: [],
          contraindications: [],
          allergies: ['penicillin'],
          current_medications: [],
          status: 'ACTIVE',
        },
      ],
    });

    const result = await startEncounter(ORG_ID, PATIENT_ID, 'INITIAL', PRACTITIONER_ID);

    expect(result.encounter).toBeDefined();
    expect(result.encounter.id).toBe('enc-new');
    expect(result.context.patient).not.toBeNull();
    expect(result.context.patient.name).toBe('Ola Nordmann');
    expect(result.context.patient.allergies).toContain('penicillin');
    expect(result.context.alerts).toEqual([]);
  });

  it('sets patient to null when patient query returns no rows', async () => {
    mockCreateEncounter.mockResolvedValue(makeEncounter());
    mockGetPatientEncounterHistory.mockResolvedValue([]);
    mockCheckRedFlags.mockResolvedValue({ alerts: ['red flag!'], warnings: [] });
    mockQuery.mockResolvedValue({ rows: [] });

    const result = await startEncounter(ORG_ID, PATIENT_ID, 'FOLLOW_UP', PRACTITIONER_ID);

    expect(result.context.patient).toBeNull();
    expect(result.context.alerts).toEqual(['red flag!']);
  });
});

// =============================================================================
// clinicalWorkflow — recordExamination
// =============================================================================

describe('recordExamination', () => {
  beforeEach(() => {
    mockQuery = jest.fn();
    mockTransaction = jest.fn();
    mockGetEncounterById = jest.fn();
    mockCreateFinding = jest.fn();
    mockUpdateEncounter = jest.fn();
  });

  it('returns updated encounter and suggestions on success', async () => {
    mockGetEncounterById.mockResolvedValue(makeEncounter());
    mockCreateFinding.mockResolvedValue({
      test_name: 'SLR',
      result: 'positive',
      laterality: 'left',
      category: 'orthopaedic',
      findings_text: null,
    });
    mockUpdateEncounter.mockResolvedValue(
      makeEncounter({ objective: { structured_findings: ['SLR: positive (left)'] } })
    );

    const result = await recordExamination(
      ORG_ID,
      ENCOUNTER_ID,
      {
        findings: [{ test_name: 'SLR', result: 'positive', laterality: 'left' }],
        bodyRegion: 'lumbar',
      },
      PRACTITIONER_ID
    );

    expect(result.updated).toBeDefined();
    expect(result.suggestions).toBeInstanceOf(Array);
  });

  it('throws NotFoundError when encounter does not exist', async () => {
    mockGetEncounterById.mockResolvedValue(null);

    await expect(
      recordExamination(ORG_ID, ENCOUNTER_ID, { findings: [] }, PRACTITIONER_ID)
    ).rejects.toThrow('not found');
  });

  it('throws BusinessLogicError when encounter is already signed', async () => {
    mockGetEncounterById.mockResolvedValue(makeEncounter({ signed_at: new Date() }));

    await expect(
      recordExamination(ORG_ID, ENCOUNTER_ID, { findings: [] }, PRACTITIONER_ID)
    ).rejects.toThrow('signed');
  });

  it('generates warning suggestion when positive findings are present', async () => {
    mockGetEncounterById.mockResolvedValue(makeEncounter());
    mockCreateFinding.mockResolvedValue({
      test_name: 'DeKlein',
      result: 'positive',
      laterality: null,
      category: 'vascular',
      findings_text: null,
    });
    mockUpdateEncounter.mockResolvedValue(makeEncounter());

    const result = await recordExamination(
      ORG_ID,
      ENCOUNTER_ID,
      { findings: [{ test_name: 'DeKlein', result: 'positive' }], bodyRegion: 'cervical' },
      PRACTITIONER_ID
    );

    const warning = result.suggestions.find((s) => s.type === 'warning');
    expect(warning).toBeDefined();
    expect(warning.message).toMatch(/positive finding/i);
  });

  it('suggests neurological screening for cervical region without neuro findings', async () => {
    mockGetEncounterById.mockResolvedValue(makeEncounter());
    mockCreateFinding.mockResolvedValue({
      test_name: 'ROM',
      result: 'reduced',
      laterality: null,
      category: 'range_of_motion',
      findings_text: null,
    });
    mockUpdateEncounter.mockResolvedValue(makeEncounter());

    const result = await recordExamination(
      ORG_ID,
      ENCOUNTER_ID,
      { findings: [{ test_name: 'ROM', result: 'reduced' }], bodyRegion: 'cervical' },
      PRACTITIONER_ID
    );

    const info = result.suggestions.find(
      (s) => s.type === 'info' && s.message.includes('neurological')
    );
    expect(info).toBeDefined();
  });
});

// =============================================================================
// clinicalWorkflow — recordTreatment
// =============================================================================

describe('recordTreatment', () => {
  beforeEach(() => {
    mockQuery = jest.fn();
    mockTransaction = jest.fn();
    mockGetEncounterById = jest.fn();
    mockGetTreatmentCode = jest.fn();
    mockIncrementTreatmentUsageCount = jest.fn();
    mockCalculateTreatmentPrice = jest.fn();
    mockUpdateEncounter = jest.fn();
  });

  it('returns updated encounter and billing codes on success', async () => {
    mockGetEncounterById.mockResolvedValue(makeEncounter());
    mockGetTreatmentCode.mockResolvedValue({
      code: 'A101',
      description: 'Chiropractic manipulation',
      default_price: 600,
      insurance_reimbursement: 200,
    });
    mockIncrementTreatmentUsageCount.mockResolvedValue(undefined);
    mockCalculateTreatmentPrice.mockResolvedValue({
      grossAmount: 600,
      insuranceAmount: 200,
      patientAmount: 400,
    });
    mockUpdateEncounter.mockResolvedValue(makeEncounter());

    const result = await recordTreatment(ORG_ID, ENCOUNTER_ID, {
      treatments: [{ code: 'A101', description: 'Chiropractic manipulation', region: 'lumbar' }],
    });

    expect(result.updated).toBeDefined();
    expect(result.billingCodes.codes).toHaveLength(1);
    expect(result.billingCodes.codes[0].code).toBe('A101');
    expect(result.billingCodes.grossAmount).toBe(600);
  });

  it('throws NotFoundError when encounter does not exist', async () => {
    mockGetEncounterById.mockResolvedValue(null);

    await expect(recordTreatment(ORG_ID, ENCOUNTER_ID, { treatments: [] })).rejects.toThrow(
      'not found'
    );
  });

  it('throws BusinessLogicError when encounter is already signed', async () => {
    mockGetEncounterById.mockResolvedValue(makeEncounter({ signed_at: new Date() }));

    await expect(recordTreatment(ORG_ID, ENCOUNTER_ID, { treatments: [] })).rejects.toThrow(
      'signed'
    );
  });

  it('returns zero billing amounts when no treatments have codes', async () => {
    mockGetEncounterById.mockResolvedValue(makeEncounter());
    mockUpdateEncounter.mockResolvedValue(makeEncounter());

    const result = await recordTreatment(ORG_ID, ENCOUNTER_ID, {
      treatments: [{ description: 'Manual therapy', region: 'thoracic' }],
    });

    expect(result.billingCodes.codes).toHaveLength(0);
    expect(result.billingCodes.grossAmount).toBe(0);
  });
});

// =============================================================================
// clinicalWorkflow — finalizeEncounter
// =============================================================================

describe('finalizeEncounter', () => {
  beforeEach(() => {
    mockQuery = jest.fn();
    mockTransaction = jest.fn();
    mockGetEncounterById = jest.fn();
    mockGenerateFormattedNote = jest.fn();
    mockValidateNote = jest.fn();
  });

  it('returns note, signed, and followUpSuggested on success', async () => {
    const enc = makeEncounter({ encounter_type: 'INITIAL', vas_pain_end: null, plan: {} });
    mockGetEncounterById.mockResolvedValue(enc);
    mockGenerateFormattedNote.mockResolvedValue({ formatted: 'SOAP note text' });
    mockValidateNote.mockReturnValue({ canSave: true, errors: [] });

    const fakeSignedRow = { id: ENCOUNTER_ID, signed_at: new Date(), signed_by: PRACTITIONER_ID };
    mockTransaction.mockImplementation(async (fn) => {
      const fakeClient = { query: jest.fn().mockResolvedValue({ rows: [fakeSignedRow] }) };
      return fn(fakeClient);
    });

    const result = await finalizeEncounter(ORG_ID, ENCOUNTER_ID, PRACTITIONER_ID);

    expect(result.note).toBeDefined();
    expect(result.signed).toBeDefined();
    expect(result.signed.signed_by).toBe(PRACTITIONER_ID);
    expect(result.followUpSuggested.recommended).toBe(true);
    expect(result.followUpSuggested.reason).toMatch(/Initial encounter/);
  });

  it('throws NotFoundError when encounter does not exist', async () => {
    mockGetEncounterById.mockResolvedValue(null);

    await expect(finalizeEncounter(ORG_ID, ENCOUNTER_ID, PRACTITIONER_ID)).rejects.toThrow(
      'not found'
    );
  });

  it('throws BusinessLogicError when encounter is already finalized', async () => {
    mockGetEncounterById.mockResolvedValue(makeEncounter({ signed_at: new Date() }));

    await expect(finalizeEncounter(ORG_ID, ENCOUNTER_ID, PRACTITIONER_ID)).rejects.toThrow(
      'already finalized'
    );
  });

  it('throws BusinessLogicError when note validation fails', async () => {
    mockGetEncounterById.mockResolvedValue(makeEncounter());
    mockGenerateFormattedNote.mockResolvedValue({});
    mockValidateNote.mockReturnValue({ canSave: false, errors: ['Chief complaint missing'] });

    await expect(finalizeEncounter(ORG_ID, ENCOUNTER_ID, PRACTITIONER_ID)).rejects.toThrow(
      'Validation failed'
    );
  });

  it('recommends follow-up in 3 days when VAS end score > 6', async () => {
    const enc = makeEncounter({ encounter_type: 'FOLLOW_UP', vas_pain_end: 8, plan: {} });
    mockGetEncounterById.mockResolvedValue(enc);
    mockGenerateFormattedNote.mockResolvedValue({});
    mockValidateNote.mockReturnValue({ canSave: true, errors: [] });

    const fakeRow = { id: ENCOUNTER_ID, signed_at: new Date(), signed_by: PRACTITIONER_ID };
    mockTransaction.mockImplementation(async (fn) => {
      const fakeClient = { query: jest.fn().mockResolvedValue({ rows: [fakeRow] }) };
      return fn(fakeClient);
    });

    const result = await finalizeEncounter(ORG_ID, ENCOUNTER_ID, PRACTITIONER_ID);

    expect(result.followUpSuggested.recommended).toBe(true);
    expect(result.followUpSuggested.suggestedDays).toBe(3);
  });
});

// =============================================================================
// clinicalEvals — getEvalSummary
// =============================================================================

describe('getEvalSummary', () => {
  beforeEach(() => {
    mockQuery = jest.fn();
  });

  it('returns summary stats from database query', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ total_evals: '42', avg_duration_ms: 1234 }],
    });

    const result = await getEvalSummary();

    expect(result.total_evals).toBe('42');
    expect(result.avg_duration_ms).toBe(1234);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('returns zero defaults when database query throws', async () => {
    mockQuery.mockRejectedValue(new Error('Table does not exist'));

    const result = await getEvalSummary();

    expect(result.total_evals).toBe(0);
    expect(result.avg_duration_ms).toBe(0);
  });

  it('returns zero defaults when query returns no rows', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const result = await getEvalSummary();

    expect(result.total_evals).toBe(0);
    expect(result.avg_duration_ms).toBe(0);
  });
});

// =============================================================================
// clinicalEvals — GRADING_SYSTEM constant
// =============================================================================

describe('GRADING_SYSTEM', () => {
  it('is a non-empty string containing evaluation criteria', () => {
    expect(typeof GRADING_SYSTEM).toBe('string');
    expect(GRADING_SYSTEM.length).toBeGreaterThan(50);
    expect(GRADING_SYSTEM).toContain('accuracy');
    expect(GRADING_SYSTEM).toContain('safety');
  });
});
