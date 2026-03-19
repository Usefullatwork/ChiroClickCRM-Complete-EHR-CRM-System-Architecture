/**
 * Context Schema Tests
 * Verifies tier definitions, token budgets, and task-tier mapping.
 */

import { describe, it, expect } from '@jest/globals';

const { CONTEXT_TIERS, TASK_TIER_MAP, TOTAL_CONTEXT_BUDGET, getTiersForTask } =
  await import('../../src/services/ai/contextSchema.js');

describe('contextSchema', () => {
  describe('CONTEXT_TIERS', () => {
    it('should define L0 with maxTokens=500 and ttl=0', () => {
      expect(CONTEXT_TIERS.L0).toMatchObject({ maxTokens: 500, ttl: 0 });
    });

    it('should define L1 with maxTokens=1000 and ttl=300000', () => {
      expect(CONTEXT_TIERS.L1).toMatchObject({ maxTokens: 1000, ttl: 300000 });
    });

    it('should define L2 with maxTokens=1500 and ttl=900000', () => {
      expect(CONTEXT_TIERS.L2).toMatchObject({ maxTokens: 1500, ttl: 900000 });
    });

    it('should include expected fields for each tier', () => {
      expect(CONTEXT_TIERS.L0.fields).toContain('demographics');
      expect(CONTEXT_TIERS.L0.fields).toContain('red_flags');
      expect(CONTEXT_TIERS.L1.fields).toContain('recent_encounters');
      expect(CONTEXT_TIERS.L2.fields).toContain('encounter_history');
    });
  });

  describe('TOTAL_CONTEXT_BUDGET', () => {
    it('should be 3000', () => {
      expect(TOTAL_CONTEXT_BUDGET).toBe(3000);
    });
  });

  describe('getTiersForTask()', () => {
    it('should return ["L0"] for spell_check', () => {
      expect(getTiersForTask('spell_check')).toEqual(['L0']);
    });

    it('should return ["L0", "L1"] for soap_notes', () => {
      expect(getTiersForTask('soap_notes')).toEqual(['L0', 'L1']);
    });

    it('should return ["L0", "L1", "L2"] for referral_letter', () => {
      expect(getTiersForTask('referral_letter')).toEqual(['L0', 'L1', 'L2']);
    });

    it('should default to ["L0"] for unknown task types', () => {
      expect(getTiersForTask('unknown_task')).toEqual(['L0']);
      expect(getTiersForTask('')).toEqual(['L0']);
    });
  });

  describe('TASK_TIER_MAP completeness', () => {
    it('should map all L0-only tasks correctly', () => {
      for (const task of ['spell_check', 'autocomplete', 'abbreviation', 'quick_suggestion']) {
        expect(TASK_TIER_MAP[task]).toEqual(['L0']);
      }
    });

    it('should map all L0+L1 tasks correctly', () => {
      for (const task of ['soap_notes', 'diagnosis_suggestion', 'red_flag_analysis']) {
        expect(TASK_TIER_MAP[task]).toEqual(['L0', 'L1']);
      }
    });

    it('should map all L0+L1+L2 tasks correctly', () => {
      for (const task of ['clinical_summary', 'referral_letter', 'differential_diagnosis']) {
        expect(TASK_TIER_MAP[task]).toEqual(['L0', 'L1', 'L2']);
      }
    });
  });
});
