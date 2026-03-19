/**
 * Context Manager Tests
 * Verifies tiered context loading, caching, token budget, and cache invalidation.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

const mockQuery = jest.fn();

// Mock database
jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: mockQuery,
}));

// Mock logger
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('contextManager — feature flag OFF', () => {
  let buildTieredContext;

  beforeEach(async () => {
    jest.resetModules();
    delete process.env.CONTEXT_TIERED_ENABLED;
    const mod = await import('../../src/services/ai/contextManager.js');
    buildTieredContext = mod.buildTieredContext;
  });

  it('should return empty result when TIERED_ENABLED is false', async () => {
    const result = await buildTieredContext('soap_notes', {
      patientId: 'p1',
      organizationId: 'org1',
    });
    expect(result).toEqual({ contextText: '', tiers: [], tokenEstimate: 0 });
  });
});

describe('contextManager — feature flag ON', () => {
  let buildTieredContext, invalidatePatientContext, clearContextCache;

  beforeEach(async () => {
    jest.resetModules();
    mockQuery.mockReset();
    process.env.CONTEXT_TIERED_ENABLED = 'true';
    const mod = await import('../../src/services/ai/contextManager.js');
    buildTieredContext = mod.buildTieredContext;
    invalidatePatientContext = mod.invalidatePatientContext;
    clearContextCache = mod.clearContextCache;
  });

  afterEach(() => {
    clearContextCache?.();
    delete process.env.CONTEXT_TIERED_ENABLED;
  });

  // --- Guard clauses ---

  it('should return empty when patientId is missing', async () => {
    const result = await buildTieredContext('soap_notes', { organizationId: 'org1' });
    expect(result).toEqual({ contextText: '', tiers: [], tokenEstimate: 0 });
  });

  it('should return empty when organizationId is missing', async () => {
    const result = await buildTieredContext('soap_notes', { patientId: 'p1' });
    expect(result).toEqual({ contextText: '', tiers: [], tokenEstimate: 0 });
  });

  // --- L0 loading ---

  it('should build demographics with age from DOB', async () => {
    // Use a DOB clearly 45 years ago (Jan 1 avoids boundary issues)
    const dobYear = new Date().getFullYear() - 46;
    const dob = `${dobYear}-01-01T00:00:00.000Z`;
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          first_name: 'Ola',
          date_of_birth: dob,
          gender: 'Mann',
          medical_history: null,
          current_medications: ['Ibuprofen', 'Paracet'],
          allergies: ['Penicillin'],
          red_flags: ['Nattsmerter'],
          contraindications: ['HVLA cervical'],
        },
      ],
    });

    const result = await buildTieredContext('spell_check', {
      patientId: 'p1',
      organizationId: 'org1',
    });

    expect(result.contextText).toContain(`${46} år`);
    expect(result.contextText).toContain('Mann');
    expect(result.contextText).toContain('Ibuprofen, Paracet');
    expect(result.contextText).toContain('Penicillin');
    expect(result.contextText).toContain('Nattsmerter');
    expect(result.contextText).toContain('HVLA cervical');
  });

  it('should return empty L0 on DB error (graceful)', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB down'));
    const result = await buildTieredContext('spell_check', {
      patientId: 'p1',
      organizationId: 'org1',
    });
    expect(result.contextText).toBe('');
  });

  it('should return empty L0 when patient not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const result = await buildTieredContext('spell_check', {
      patientId: 'p1',
      organizationId: 'org1',
    });
    expect(result.contextText).toBe('');
  });

  // --- L1 loading ---

  it('should fetch last 3 encounters and format SOAP + ICPC codes', async () => {
    // L0 query
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          first_name: 'Ola',
          date_of_birth: '1980-01-01',
          gender: 'Mann',
          current_medications: null,
          allergies: null,
          red_flags: null,
          contraindications: null,
        },
      ],
    });
    // L1 query
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          subjective: { chief_complaint: 'Korsryggsmerter' },
          objective: null,
          assessment: null,
          plan: { follow_up: 'Kontroll om 2 uker' },
          icpc_codes: ['L84', 'L03'],
          created_at: '2026-03-10',
        },
      ],
    });

    const result = await buildTieredContext('soap_notes', {
      patientId: 'p1',
      organizationId: 'org1',
    });

    expect(result.contextText).toContain('Korsryggsmerter');
    expect(result.contextText).toContain('L84, L03');
    expect(result.contextText).toContain('Kontroll om 2 uker');
    expect(result.tiers).toEqual(['L0', 'L1']);
  });

  it('should cache L1 (second call skips DB query)', async () => {
    // First call: L0 + L1
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ first_name: 'Ola', date_of_birth: '1980-01-01', gender: 'M' }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            subjective: { chief_complaint: 'Smerte' },
            plan: null,
            icpc_codes: null,
            created_at: '2026-03-10',
          },
        ],
      });

    await buildTieredContext('soap_notes', { patientId: 'p1', organizationId: 'org1' });

    // Second call: L0 refetched (ttl=0), L1 cached
    mockQuery.mockResolvedValueOnce({
      rows: [{ first_name: 'Ola', date_of_birth: '1980-01-01', gender: 'M' }],
    });

    await buildTieredContext('soap_notes', { patientId: 'p1', organizationId: 'org1' });

    // L0 called twice, L1 called only once (cached)
    expect(mockQuery).toHaveBeenCalledTimes(3); // 2x L0 + 1x L1
  });

  // --- L2 loading ---

  it('should fetch historical encounters for L2 tasks', async () => {
    // L0
    mockQuery.mockResolvedValueOnce({
      rows: [{ first_name: 'Ola', date_of_birth: '1980-01-01', gender: 'M' }],
    });
    // L1
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          subjective: { chief_complaint: 'Smerte' },
          plan: null,
          icpc_codes: null,
          created_at: '2026-03-10',
        },
      ],
    });
    // L2
    mockQuery.mockResolvedValueOnce({
      rows: [
        { complaint: 'Korsrygg', icpc_codes: ['L84'], created_at: '2026-03-01' },
        { complaint: 'Nakke', icpc_codes: ['L83'], created_at: '2026-02-15' },
      ],
    });

    const result = await buildTieredContext('referral_letter', {
      patientId: 'p1',
      organizationId: 'org1',
    });

    expect(result.contextText).toContain('Behandlingshistorikk');
    expect(result.contextText).toContain('Korsrygg');
    expect(result.tiers).toEqual(['L0', 'L1', 'L2']);
  });

  // --- Token budget ---

  it('should truncate text exceeding tier maxTokens', async () => {
    // L0 returns a very long string (> 500 tokens = 2000 chars)
    const longText = 'X'.repeat(3000);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          first_name: 'Ola',
          date_of_birth: '1980-01-01',
          gender: longText,
          current_medications: null,
          allergies: null,
          red_flags: null,
          contraindications: null,
        },
      ],
    });

    const result = await buildTieredContext('spell_check', {
      patientId: 'p1',
      organizationId: 'org1',
    });

    // Should be truncated with ... appended
    expect(result.contextText).toContain('...');
    // Total should not exceed budget
    expect(result.tokenEstimate).toBeLessThanOrEqual(3000);
  });

  // --- Context wrapping ---

  it('should wrap output in Pasientkontekst markers', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          first_name: 'Ola',
          date_of_birth: '1990-01-01',
          gender: 'Mann',
          current_medications: ['Ibuprofen'],
          allergies: null,
          red_flags: null,
          contraindications: null,
        },
      ],
    });

    const result = await buildTieredContext('spell_check', {
      patientId: 'p1',
      organizationId: 'org1',
    });

    expect(result.contextText).toMatch(/^--- Pasientkontekst ---/);
    expect(result.contextText).toMatch(/--- Slutt kontekst ---$/);
  });

  // --- Cache management ---

  it('invalidatePatientContext() should clear all 3 tiers', async () => {
    // Populate L0 + L1 cache
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ first_name: 'Ola', date_of_birth: '1980-01-01', gender: 'M' }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            subjective: { chief_complaint: 'X' },
            plan: null,
            icpc_codes: null,
            created_at: '2026-03-10',
          },
        ],
      });

    await buildTieredContext('soap_notes', { patientId: 'p1', organizationId: 'org1' });
    invalidatePatientContext('p1');

    // After invalidation, L1 must be refetched
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ first_name: 'Ola', date_of_birth: '1980-01-01', gender: 'M' }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            subjective: { chief_complaint: 'Y' },
            plan: null,
            icpc_codes: null,
            created_at: '2026-03-10',
          },
        ],
      });

    const result = await buildTieredContext('soap_notes', {
      patientId: 'p1',
      organizationId: 'org1',
    });
    // Should have new data
    expect(result.contextText).toContain('Y');
    // L1 was fetched again (4 total queries: 2x L0 + 2x L1)
    expect(mockQuery).toHaveBeenCalledTimes(4);
  });

  it('clearContextCache() should clear everything', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ first_name: 'Ola', date_of_birth: '1980-01-01', gender: 'M' }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            subjective: { chief_complaint: 'X' },
            plan: null,
            icpc_codes: null,
            created_at: '2026-03-10',
          },
        ],
      });

    await buildTieredContext('soap_notes', { patientId: 'p1', organizationId: 'org1' });
    clearContextCache();

    mockQuery
      .mockResolvedValueOnce({
        rows: [{ first_name: 'Ola', date_of_birth: '1980-01-01', gender: 'M' }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            subjective: { chief_complaint: 'Z' },
            plan: null,
            icpc_codes: null,
            created_at: '2026-03-10',
          },
        ],
      });

    const result = await buildTieredContext('soap_notes', {
      patientId: 'p1',
      organizationId: 'org1',
    });
    expect(result.contextText).toContain('Z');
  });
});
