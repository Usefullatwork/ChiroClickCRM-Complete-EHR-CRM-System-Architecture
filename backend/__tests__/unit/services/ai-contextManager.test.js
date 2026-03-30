/**
 * Unit Tests for AI Context Manager
 * Tests tiered context assembly (L0/L1/L2), token counting, truncation, caching, and pruning.
 *
 * NOTE: CONTEXT_TIERED_ENABLED is a module-level const read at import time.
 * We must set it in the environment BEFORE the module is loaded.
 */

import { jest } from '@jest/globals';

// Enable tiered context BEFORE module import so the flag is captured correctly.
process.env.CONTEXT_TIERED_ENABLED = 'true';

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

// Import AFTER mocks are registered
const { buildTieredContext, invalidatePatientContext, clearContextCache, TIERED_ENABLED } =
  await import('../../../src/services/ai/contextManager.js');

const logger = (await import('../../../src/utils/logger.js')).default;

// ─── Shared test fixtures ───────────────────────────────────────────────────

const PATIENT_ID = 'patient-001';
const ORG_ID = 'org-001';

const patientRow = {
  first_name: 'Ola',
  date_of_birth: '1980-06-15',
  gender: 'male',
  current_medications: ['Ibuprofen', 'Paracetamol'],
  allergies: ['Penicillin'],
  red_flags: ['Cauda equina'],
  contraindications: ['Anticoagulants'],
};

const encounterRow = {
  subjective: { chief_complaint: 'Lower back pain' },
  icpc_codes: ['L03', 'L84'],
  plan: { follow_up: 'Review in 2 weeks' },
  created_at: '2026-01-10T10:00:00Z',
};

const historyRow = {
  icpc_codes: ['L03'],
  complaint: 'Neck stiffness',
  created_at: '2025-12-01T09:00:00Z',
};

// ============================================================================
// FEATURE FLAG
// ============================================================================

describe('TIERED_ENABLED feature flag', () => {
  it('is true when CONTEXT_TIERED_ENABLED env var is set to "true"', () => {
    expect(TIERED_ENABLED).toBe(true);
  });
});

// ============================================================================
// MISSING OPTIONS — early-exit paths
// ============================================================================

describe('buildTieredContext — missing options (early exit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearContextCache();
  });

  it('returns empty result when patientId is missing', async () => {
    const result = await buildTieredContext('soap_notes', { organizationId: ORG_ID });
    expect(result).toEqual({ contextText: '', tiers: [], tokenEstimate: 0 });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns empty result when organizationId is missing', async () => {
    const result = await buildTieredContext('soap_notes', { patientId: PATIENT_ID });
    expect(result).toEqual({ contextText: '', tiers: [], tokenEstimate: 0 });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns empty result when options object is omitted entirely', async () => {
    const result = await buildTieredContext('soap_notes');
    expect(result).toEqual({ contextText: '', tiers: [], tokenEstimate: 0 });
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

// ============================================================================
// L0 CONTEXT (patient safety data — always fresh, ttl = 0)
// ============================================================================

describe('buildTieredContext — L0 context assembly', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearContextCache();
  });

  it('builds L0 context with medications, allergies, red flags and contraindications', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [patientRow] });

    const result = await buildTieredContext('spell_check', {
      patientId: PATIENT_ID,
      organizationId: ORG_ID,
    });

    expect(result.contextText).toContain('Pasient:');
    expect(result.contextText).toContain('Medisiner: Ibuprofen, Paracetamol');
    expect(result.contextText).toContain('Allergier: Penicillin');
    expect(result.contextText).toContain('Røde flagg: Cauda equina');
    expect(result.contextText).toContain('Kontraindikasjoner: Anticoagulants');
    expect(result.tiers).toEqual(['L0']);
    expect(result.tokenEstimate).toBeGreaterThan(0);
  });

  it('wraps context with delimiter markers', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [patientRow] });

    const result = await buildTieredContext('spell_check', {
      patientId: PATIENT_ID,
      organizationId: ORG_ID,
    });

    expect(result.contextText).toMatch(/^--- Pasientkontekst ---/);
    expect(result.contextText).toMatch(/--- Slutt kontekst ---$/);
  });

  it('returns empty contextText when patient is not found in DB', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await buildTieredContext('spell_check', {
      patientId: PATIENT_ID,
      organizationId: ORG_ID,
    });

    expect(result.contextText).toBe('');
    expect(result.tokenEstimate).toBe(0);
  });

  it('returns empty contextText and logs a warning when DB throws', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

    const result = await buildTieredContext('spell_check', {
      patientId: PATIENT_ID,
      organizationId: ORG_ID,
    });

    expect(result.contextText).toBe('');
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('L0'), expect.any(String));
  });

  it('computes age from date_of_birth and includes it in output', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ ...patientRow, date_of_birth: '1990-01-01' }] });

    const result = await buildTieredContext('spell_check', {
      patientId: PATIENT_ID,
      organizationId: ORG_ID,
    });

    expect(result.contextText).toMatch(/\d+ år/);
  });

  it('handles null date_of_birth gracefully', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...patientRow, date_of_birth: null }],
    });

    const result = await buildTieredContext('spell_check', {
      patientId: PATIENT_ID,
      organizationId: ORG_ID,
    });

    expect(result.contextText).toContain('alder ukjent');
  });
});

// ============================================================================
// L0 + L1 CONTEXT (clinical documentation tasks)
// ============================================================================

describe('buildTieredContext — L0 + L1 context (soap_notes task)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearContextCache();
  });

  it('includes recent encounter data from L1', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [patientRow] }) // L0
      .mockResolvedValueOnce({ rows: [encounterRow] }); // L1

    const result = await buildTieredContext('soap_notes', {
      patientId: PATIENT_ID,
      organizationId: ORG_ID,
    });

    expect(result.contextText).toContain('Siste konsultasjon:');
    expect(result.contextText).toContain('Lower back pain');
    expect(result.contextText).toContain('L03');
    expect(result.contextText).toContain('Review in 2 weeks');
    expect(result.tiers).toEqual(['L0', 'L1']);
  });

  it('omits L1 encounter section when no encounters exist', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [patientRow] }) // L0
      .mockResolvedValueOnce({ rows: [] }); // L1 — no encounters

    const result = await buildTieredContext('soap_notes', {
      patientId: PATIENT_ID,
      organizationId: ORG_ID,
    });

    expect(result.contextText).toContain('Medisiner:');
    expect(result.contextText).not.toContain('Siste konsultasjon:');
  });

  it('logs warning and continues when L1 query throws', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [patientRow] }) // L0 succeeds
      .mockRejectedValueOnce(new Error('L1 timeout')); // L1 fails

    const result = await buildTieredContext('soap_notes', {
      patientId: PATIENT_ID,
      organizationId: ORG_ID,
    });

    // L0 data is still present; L1 gracefully degraded
    expect(result.contextText).toContain('Medisiner:');
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('L1'), expect.any(String));
  });
});

// ============================================================================
// L0 + L1 + L2 CONTEXT (comprehensive tasks)
// ============================================================================

describe('buildTieredContext — L0 + L1 + L2 context (clinical_summary task)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearContextCache();
  });

  it('includes historical encounter data from L2', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [patientRow] }) // L0
      .mockResolvedValueOnce({ rows: [encounterRow] }) // L1
      .mockResolvedValueOnce({ rows: [historyRow] }); // L2

    const result = await buildTieredContext('clinical_summary', {
      patientId: PATIENT_ID,
      organizationId: ORG_ID,
    });

    expect(result.contextText).toContain('Behandlingshistorikk');
    expect(result.contextText).toContain('Neck stiffness');
    expect(result.tiers).toEqual(['L0', 'L1', 'L2']);
  });

  it('includes encounter count in L2 history header', async () => {
    const rows = [
      historyRow,
      { ...historyRow, complaint: 'Shoulder pain', created_at: '2025-11-01T09:00:00Z' },
    ];
    mockQuery
      .mockResolvedValueOnce({ rows: [patientRow] })
      .mockResolvedValueOnce({ rows: [encounterRow] })
      .mockResolvedValueOnce({ rows });

    const result = await buildTieredContext('clinical_summary', {
      patientId: PATIENT_ID,
      organizationId: ORG_ID,
    });

    expect(result.contextText).toContain('2 konsultasjoner');
  });
});

// ============================================================================
// TOKEN COUNTING AND CONTEXT TRUNCATION
// ============================================================================

describe('token counting and truncation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearContextCache();
  });

  it('reports a positive tokenEstimate for non-empty context', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [patientRow] });

    const result = await buildTieredContext('spell_check', {
      patientId: PATIENT_ID,
      organizationId: ORG_ID,
    });

    expect(result.tokenEstimate).toBeGreaterThan(0);
    // Rough sanity check: 1 token ≈ 4 chars, context is ~200 chars
    expect(result.tokenEstimate).toBeLessThan(300);
  });

  it('truncates L0 tier text that exceeds maxTokens (500 tokens = 2000 chars)', async () => {
    // L0 maxTokens = 500 → truncateToTokens clips at 2000 chars
    const longMed = 'A'.repeat(3000);
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...patientRow, current_medications: [longMed] }],
    });

    const result = await buildTieredContext('spell_check', {
      patientId: PATIENT_ID,
      organizationId: ORG_ID,
    });

    // Token estimate should respect L0 budget ceiling; allow small overhead for prefix text
    expect(result.tokenEstimate).toBeLessThanOrEqual(600);
    expect(result.contextText).toContain('...');
  });

  it('keeps combined tokenEstimate within TOTAL_CONTEXT_BUDGET across all tiers', async () => {
    // clinical_summary loads L0 + L1 + L2.
    // Each tier truncates its text to its own maxTokens before the budget check,
    // so the aggregate must stay within TOTAL_CONTEXT_BUDGET (3000).
    const longMeds = ['X'.repeat(3000)]; // L0 content > maxTokens → gets truncated to 500 tokens
    const longComplaint = 'Y'.repeat(5000); // L1 content > maxTokens → gets truncated to 1000 tokens
    const longHistory = [
      { icpc_codes: ['L03'], complaint: 'Z'.repeat(8000), created_at: '2025-12-01T09:00:00Z' },
    ]; // L2 content > maxTokens → gets truncated to 1500 tokens

    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...patientRow, current_medications: longMeds }] })
      .mockResolvedValueOnce({
        rows: [{ ...encounterRow, subjective: { chief_complaint: longComplaint } }],
      })
      .mockResolvedValueOnce({ rows: longHistory });

    const result = await buildTieredContext('clinical_summary', {
      patientId: PATIENT_ID,
      organizationId: ORG_ID,
    });

    expect(result.tokenEstimate).toBeLessThanOrEqual(3000);
    // All three tiers were requested
    expect(result.tiers).toEqual(['L0', 'L1', 'L2']);
    // Truncation markers present because content exceeded tier maxTokens
    expect(result.contextText).toContain('...');
  });
});

// ============================================================================
// CACHE: INVALIDATION AND TTL
// ============================================================================

describe('invalidatePatientContext — cache invalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearContextCache();
  });

  it('re-fetches L1 data after invalidating patient context', async () => {
    // First call — populates L1 cache
    mockQuery
      .mockResolvedValueOnce({ rows: [patientRow] }) // L0
      .mockResolvedValueOnce({ rows: [encounterRow] }); // L1

    await buildTieredContext('soap_notes', { patientId: PATIENT_ID, organizationId: ORG_ID });
    expect(mockQuery).toHaveBeenCalledTimes(2);

    jest.clearAllMocks();

    // Invalidate patient — clears L1 and L2 cache entries
    invalidatePatientContext(PATIENT_ID);

    // Second call — L1 must be re-fetched (L0 is always fresh anyway)
    mockQuery
      .mockResolvedValueOnce({ rows: [patientRow] }) // L0
      .mockResolvedValueOnce({ rows: [encounterRow] }); // L1 re-fetched

    await buildTieredContext('soap_notes', { patientId: PATIENT_ID, organizationId: ORG_ID });
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('does not re-fetch L1 within TTL when cache is warm', async () => {
    // Warm L1 cache
    mockQuery
      .mockResolvedValueOnce({ rows: [patientRow] }) // L0
      .mockResolvedValueOnce({ rows: [encounterRow] }); // L1

    await buildTieredContext('soap_notes', { patientId: PATIENT_ID, organizationId: ORG_ID });
    jest.clearAllMocks();

    // Second call — L1 served from cache; only L0 re-fetched (ttl = 0)
    mockQuery.mockResolvedValueOnce({ rows: [patientRow] });

    await buildTieredContext('soap_notes', { patientId: PATIENT_ID, organizationId: ORG_ID });
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});

describe('clearContextCache — full cache flush', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearContextCache();
  });

  it('forces re-fetch of all tiers after clearing the whole cache', async () => {
    // Warm both L0 and L1
    mockQuery
      .mockResolvedValueOnce({ rows: [patientRow] })
      .mockResolvedValueOnce({ rows: [encounterRow] });

    await buildTieredContext('soap_notes', { patientId: PATIENT_ID, organizationId: ORG_ID });
    jest.clearAllMocks();

    // Flush everything
    clearContextCache();

    // Both queries must fire again
    mockQuery
      .mockResolvedValueOnce({ rows: [patientRow] })
      .mockResolvedValueOnce({ rows: [encounterRow] });

    await buildTieredContext('soap_notes', { patientId: PATIENT_ID, organizationId: ORG_ID });
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});

// ============================================================================
// UNKNOWN / FALLBACK TASK TYPE
// ============================================================================

describe('buildTieredContext — unknown task type', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearContextCache();
  });

  it('defaults to L0 tier for unrecognised task types', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [patientRow] });

    const result = await buildTieredContext('unknown_task_xyz', {
      patientId: PATIENT_ID,
      organizationId: ORG_ID,
    });

    expect(result.tiers).toEqual(['L0']);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});
