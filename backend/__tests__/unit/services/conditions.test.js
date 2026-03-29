/**
 * Unit Tests for Automation Conditions
 * Tests all condition operators and evaluation logic
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const { OPERATORS, evaluateConditions } =
  await import('../../../src/services/automations/conditions.js');

// ---- Helpers ----
function makeWorkflow(conditions) {
  return { conditions };
}

function makePatient(overrides = {}) {
  return {
    status: 'active',
    lifecycle_stage: 'ONBOARDING',
    first_name: 'Ola',
    last_name: 'Nordmann',
    total_visits: 5,
    age: 35,
    tags: ['vip', 'chronic'],
    email: 'ola@test.no',
    phone: '+4712345678',
    nested: { deep: { value: 42 } },
    ...overrides,
  };
}

// ---- Tests ----

describe('automations/conditions', () => {
  // ─── OPERATORS ──────────────────────────────────

  describe('OPERATORS', () => {
    it('should define all expected operators', () => {
      expect(OPERATORS.EQUALS).toBe('equals');
      expect(OPERATORS.NOT_EQUALS).toBe('not_equals');
      expect(OPERATORS.GREATER_THAN).toBe('greater_than');
      expect(OPERATORS.LESS_THAN).toBe('less_than');
      expect(OPERATORS.CONTAINS).toBe('contains');
      expect(OPERATORS.NOT_CONTAINS).toBe('not_contains');
      expect(OPERATORS.IS_EMPTY).toBe('is_empty');
      expect(OPERATORS.IS_NOT_EMPTY).toBe('is_not_empty');
      expect(OPERATORS.IN).toBe('in');
      expect(OPERATORS.NOT_IN).toBe('not_in');
    });
  });

  // ─── evaluateConditions ──────────────────────────────

  describe('evaluateConditions', () => {
    it('should return true when no conditions are specified', () => {
      const result = evaluateConditions(makeWorkflow([]), makePatient());
      expect(result).toBe(true);
    });

    it('should return true when conditions is undefined', () => {
      const result = evaluateConditions({}, makePatient());
      expect(result).toBe(true);
    });

    // --- EQUALS ---
    it('should evaluate EQUALS correctly (match)', () => {
      const wf = makeWorkflow([{ field: 'status', operator: 'equals', value: 'active' }]);
      expect(evaluateConditions(wf, makePatient())).toBe(true);
    });

    it('should evaluate EQUALS correctly (no match)', () => {
      const wf = makeWorkflow([{ field: 'status', operator: 'equals', value: 'inactive' }]);
      expect(evaluateConditions(wf, makePatient())).toBe(false);
    });

    // --- NOT_EQUALS ---
    it('should evaluate NOT_EQUALS correctly', () => {
      const wf = makeWorkflow([{ field: 'status', operator: 'not_equals', value: 'inactive' }]);
      expect(evaluateConditions(wf, makePatient())).toBe(true);
    });

    // --- GREATER_THAN ---
    it('should evaluate GREATER_THAN correctly (true)', () => {
      const wf = makeWorkflow([{ field: 'total_visits', operator: 'greater_than', value: 3 }]);
      expect(evaluateConditions(wf, makePatient())).toBe(true);
    });

    it('should evaluate GREATER_THAN correctly (false)', () => {
      const wf = makeWorkflow([{ field: 'total_visits', operator: 'greater_than', value: 10 }]);
      expect(evaluateConditions(wf, makePatient())).toBe(false);
    });

    // --- LESS_THAN ---
    it('should evaluate LESS_THAN correctly (true)', () => {
      const wf = makeWorkflow([{ field: 'total_visits', operator: 'less_than', value: 10 }]);
      expect(evaluateConditions(wf, makePatient())).toBe(true);
    });

    it('should evaluate LESS_THAN correctly (false)', () => {
      const wf = makeWorkflow([{ field: 'total_visits', operator: 'less_than', value: 2 }]);
      expect(evaluateConditions(wf, makePatient())).toBe(false);
    });

    // --- CONTAINS ---
    it('should evaluate CONTAINS on string (match)', () => {
      const wf = makeWorkflow([{ field: 'first_name', operator: 'contains', value: 'Ol' }]);
      expect(evaluateConditions(wf, makePatient())).toBe(true);
    });

    it('should evaluate CONTAINS on string (case-insensitive)', () => {
      const wf = makeWorkflow([{ field: 'first_name', operator: 'contains', value: 'ola' }]);
      expect(evaluateConditions(wf, makePatient())).toBe(true);
    });

    it('should evaluate CONTAINS on array', () => {
      const wf = makeWorkflow([{ field: 'tags', operator: 'contains', value: 'vip' }]);
      expect(evaluateConditions(wf, makePatient())).toBe(true);
    });

    it('should evaluate CONTAINS on array (no match)', () => {
      const wf = makeWorkflow([{ field: 'tags', operator: 'contains', value: 'new' }]);
      expect(evaluateConditions(wf, makePatient())).toBe(false);
    });

    // --- NOT_CONTAINS ---
    it('should evaluate NOT_CONTAINS on string', () => {
      const wf = makeWorkflow([{ field: 'first_name', operator: 'not_contains', value: 'Kari' }]);
      expect(evaluateConditions(wf, makePatient())).toBe(true);
    });

    it('should evaluate NOT_CONTAINS on array', () => {
      const wf = makeWorkflow([{ field: 'tags', operator: 'not_contains', value: 'new' }]);
      expect(evaluateConditions(wf, makePatient())).toBe(true);
    });

    // --- IS_EMPTY ---
    it('should evaluate IS_EMPTY for null value', () => {
      const wf = makeWorkflow([{ field: 'middle_name', operator: 'is_empty' }]);
      expect(evaluateConditions(wf, makePatient({ middle_name: null }))).toBe(true);
    });

    it('should evaluate IS_EMPTY for empty string', () => {
      const wf = makeWorkflow([{ field: 'middle_name', operator: 'is_empty' }]);
      expect(evaluateConditions(wf, makePatient({ middle_name: '' }))).toBe(true);
    });

    it('should evaluate IS_EMPTY for empty array', () => {
      const wf = makeWorkflow([{ field: 'empty_tags', operator: 'is_empty' }]);
      expect(evaluateConditions(wf, makePatient({ empty_tags: [] }))).toBe(true);
    });

    it('should evaluate IS_EMPTY as false for non-empty value', () => {
      const wf = makeWorkflow([{ field: 'first_name', operator: 'is_empty' }]);
      expect(evaluateConditions(wf, makePatient())).toBe(false);
    });

    // --- IS_NOT_EMPTY ---
    it('should evaluate IS_NOT_EMPTY for non-empty value', () => {
      const wf = makeWorkflow([{ field: 'first_name', operator: 'is_not_empty' }]);
      expect(evaluateConditions(wf, makePatient())).toBe(true);
    });

    it('should evaluate IS_NOT_EMPTY as false for null', () => {
      const wf = makeWorkflow([{ field: 'missing', operator: 'is_not_empty' }]);
      expect(evaluateConditions(wf, makePatient({ missing: null }))).toBe(false);
    });

    // --- IN ---
    it('should evaluate IN operator (match)', () => {
      const wf = makeWorkflow([
        { field: 'status', operator: 'in', value: ['active', 'onboarding'] },
      ]);
      expect(evaluateConditions(wf, makePatient())).toBe(true);
    });

    it('should evaluate IN operator (no match)', () => {
      const wf = makeWorkflow([{ field: 'status', operator: 'in', value: ['inactive', 'lost'] }]);
      expect(evaluateConditions(wf, makePatient())).toBe(false);
    });

    // --- NOT_IN ---
    it('should evaluate NOT_IN operator (match)', () => {
      const wf = makeWorkflow([
        { field: 'status', operator: 'not_in', value: ['inactive', 'lost'] },
      ]);
      expect(evaluateConditions(wf, makePatient())).toBe(true);
    });

    // --- AND logic ---
    it('should require ALL conditions to pass (AND logic)', () => {
      const wf = makeWorkflow([
        { field: 'status', operator: 'equals', value: 'active' },
        { field: 'total_visits', operator: 'greater_than', value: 3 },
      ]);
      expect(evaluateConditions(wf, makePatient())).toBe(true);
    });

    it('should fail if any condition fails (AND logic)', () => {
      const wf = makeWorkflow([
        { field: 'status', operator: 'equals', value: 'active' },
        { field: 'total_visits', operator: 'greater_than', value: 100 },
      ]);
      expect(evaluateConditions(wf, makePatient())).toBe(false);
    });

    // --- Nested value ---
    it('should resolve nested property with dot notation', () => {
      const wf = makeWorkflow([{ field: 'nested.deep.value', operator: 'equals', value: 42 }]);
      expect(evaluateConditions(wf, makePatient())).toBe(true);
    });

    it('should return undefined for non-existent nested path', () => {
      const wf = makeWorkflow([{ field: 'nested.missing.path', operator: 'is_empty' }]);
      expect(evaluateConditions(wf, makePatient())).toBe(true);
    });

    // --- Unknown operator ---
    it('should return true for unknown operator', () => {
      const wf = makeWorkflow([{ field: 'status', operator: 'UNKNOWN_OP', value: 'x' }]);
      expect(evaluateConditions(wf, makePatient())).toBe(true);
    });
  });
});
