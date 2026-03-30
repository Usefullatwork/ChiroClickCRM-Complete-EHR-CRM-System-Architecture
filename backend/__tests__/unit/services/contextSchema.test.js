/**
 * Unit Tests for AI Context Schema
 * Tests tier definitions, task-to-tier mapping, token budgets, and getTiersForTask logic.
 */

import { jest } from '@jest/globals';

// contextSchema is a pure module (no DB, no external deps) — import directly
const { CONTEXT_TIERS, TASK_TIER_MAP, TOTAL_CONTEXT_BUDGET, getTiersForTask } =
  await import('../../../src/services/ai/contextSchema.js');

// ============================================================================
// CONTEXT_TIERS — structure and values
// ============================================================================

describe('CONTEXT_TIERS — tier definitions', () => {
  it('defines exactly three tiers: L0, L1, L2', () => {
    const tierKeys = Object.keys(CONTEXT_TIERS);
    expect(tierKeys).toEqual(['L0', 'L1', 'L2']);
  });

  it('each tier has required properties: name, description, maxTokens, ttl, fields', () => {
    const requiredProps = ['name', 'description', 'maxTokens', 'ttl', 'fields'];
    for (const [tierKey, tier] of Object.entries(CONTEXT_TIERS)) {
      for (const prop of requiredProps) {
        expect(tier).toHaveProperty(prop);
      }
      expect(typeof tier.name).toBe('string');
      expect(typeof tier.description).toBe('string');
      expect(typeof tier.maxTokens).toBe('number');
      expect(typeof tier.ttl).toBe('number');
      expect(Array.isArray(tier.fields)).toBe(true);
      expect(tier.fields.length).toBeGreaterThan(0);
    }
  });

  it('L0 (critical) has ttl of 0 — always fetched fresh', () => {
    expect(CONTEXT_TIERS.L0.ttl).toBe(0);
    expect(CONTEXT_TIERS.L0.name).toBe('critical');
  });

  it('L1 (session) has a 5-minute TTL', () => {
    expect(CONTEXT_TIERS.L1.ttl).toBe(5 * 60 * 1000);
    expect(CONTEXT_TIERS.L1.name).toBe('session');
  });

  it('L2 (historical) has a 15-minute TTL', () => {
    expect(CONTEXT_TIERS.L2.ttl).toBe(15 * 60 * 1000);
    expect(CONTEXT_TIERS.L2.name).toBe('historical');
  });

  it('L0 includes patient safety fields: medications, allergies, red_flags, contraindications', () => {
    const safetyFields = ['medications', 'allergies', 'red_flags', 'contraindications'];
    for (const field of safetyFields) {
      expect(CONTEXT_TIERS.L0.fields).toContain(field);
    }
  });

  it('tier maxTokens increase from L0 to L2 (ascending budget)', () => {
    expect(CONTEXT_TIERS.L0.maxTokens).toBeLessThan(CONTEXT_TIERS.L1.maxTokens);
    expect(CONTEXT_TIERS.L1.maxTokens).toBeLessThan(CONTEXT_TIERS.L2.maxTokens);
  });

  it('sum of all tier maxTokens equals TOTAL_CONTEXT_BUDGET', () => {
    const sum =
      CONTEXT_TIERS.L0.maxTokens + CONTEXT_TIERS.L1.maxTokens + CONTEXT_TIERS.L2.maxTokens;
    expect(sum).toBe(TOTAL_CONTEXT_BUDGET);
  });
});

// ============================================================================
// TOTAL_CONTEXT_BUDGET
// ============================================================================

describe('TOTAL_CONTEXT_BUDGET', () => {
  it('is 3000 tokens', () => {
    expect(TOTAL_CONTEXT_BUDGET).toBe(3000);
  });
});

// ============================================================================
// TASK_TIER_MAP — task type to tier mapping
// ============================================================================

describe('TASK_TIER_MAP — task definitions', () => {
  it('maps every task type to a non-empty array of tier IDs', () => {
    for (const [task, tiers] of Object.entries(TASK_TIER_MAP)) {
      expect(Array.isArray(tiers)).toBe(true);
      expect(tiers.length).toBeGreaterThan(0);
      for (const tier of tiers) {
        expect(['L0', 'L1', 'L2']).toContain(tier);
      }
    }
  });

  it('every task includes L0 — patient safety is always required', () => {
    for (const [task, tiers] of Object.entries(TASK_TIER_MAP)) {
      expect(tiers).toContain('L0');
    }
  });

  it('quick tasks (spell_check, autocomplete) require only L0', () => {
    expect(TASK_TIER_MAP.spell_check).toEqual(['L0']);
    expect(TASK_TIER_MAP.autocomplete).toEqual(['L0']);
  });

  it('clinical documentation tasks (soap_notes, diagnosis_suggestion) require L0 + L1', () => {
    expect(TASK_TIER_MAP.soap_notes).toEqual(['L0', 'L1']);
    expect(TASK_TIER_MAP.diagnosis_suggestion).toEqual(['L0', 'L1']);
  });

  it('comprehensive tasks (clinical_summary, referral_letter) require L0 + L1 + L2', () => {
    expect(TASK_TIER_MAP.clinical_summary).toEqual(['L0', 'L1', 'L2']);
    expect(TASK_TIER_MAP.referral_letter).toEqual(['L0', 'L1', 'L2']);
  });

  it('red_flag_analysis and contraindication_check are L0 + L1', () => {
    expect(TASK_TIER_MAP.red_flag_analysis).toEqual(['L0', 'L1']);
    expect(TASK_TIER_MAP.contraindication_check).toEqual(['L0', 'L1']);
  });

  it('no task includes L2 without also including L1', () => {
    for (const [task, tiers] of Object.entries(TASK_TIER_MAP)) {
      if (tiers.includes('L2')) {
        expect(tiers).toContain('L1');
      }
    }
  });
});

// ============================================================================
// getTiersForTask — runtime tier resolution
// ============================================================================

describe('getTiersForTask', () => {
  it('returns ["L0"] for a known L0-only task (spell_check)', () => {
    expect(getTiersForTask('spell_check')).toEqual(['L0']);
  });

  it('returns ["L0", "L1"] for a known L0+L1 task (soap_notes)', () => {
    expect(getTiersForTask('soap_notes')).toEqual(['L0', 'L1']);
  });

  it('returns ["L0", "L1", "L2"] for a known comprehensive task (clinical_summary)', () => {
    expect(getTiersForTask('clinical_summary')).toEqual(['L0', 'L1', 'L2']);
  });

  it('defaults to ["L0"] for an unknown task type', () => {
    expect(getTiersForTask('completely_unknown_task')).toEqual(['L0']);
  });

  it('defaults to ["L0"] for undefined input', () => {
    expect(getTiersForTask(undefined)).toEqual(['L0']);
  });

  it('defaults to ["L0"] for null input', () => {
    expect(getTiersForTask(null)).toEqual(['L0']);
  });

  it('defaults to ["L0"] for empty string', () => {
    expect(getTiersForTask('')).toEqual(['L0']);
  });

  it('returns the same reference as TASK_TIER_MAP for known tasks', () => {
    const result = getTiersForTask('referral_letter');
    expect(result).toBe(TASK_TIER_MAP.referral_letter);
  });
});
