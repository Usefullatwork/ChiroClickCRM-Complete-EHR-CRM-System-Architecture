/**
 * Unit Tests for Automation Triggers
 * Tests trigger type definitions and evaluation logic for all trigger types
 */

import { jest } from '@jest/globals';

const { TRIGGER_TYPES, evaluateTrigger } =
  await import('../../../src/services/automations/triggers.js');

// ---- Helpers ----
function makeWorkflow(triggerType, config = {}) {
  return { trigger_type: triggerType, trigger_config: config };
}

// ---- Tests ----

describe('automations/triggers', () => {
  // ─── TRIGGER_TYPES ──────────────────────────────────

  describe('TRIGGER_TYPES', () => {
    it('should define all expected trigger types', () => {
      expect(TRIGGER_TYPES.PATIENT_CREATED).toBe('PATIENT_CREATED');
      expect(TRIGGER_TYPES.APPOINTMENT_SCHEDULED).toBe('APPOINTMENT_SCHEDULED');
      expect(TRIGGER_TYPES.APPOINTMENT_COMPLETED).toBe('APPOINTMENT_COMPLETED');
      expect(TRIGGER_TYPES.APPOINTMENT_MISSED).toBe('APPOINTMENT_MISSED');
      expect(TRIGGER_TYPES.APPOINTMENT_CANCELLED).toBe('APPOINTMENT_CANCELLED');
      expect(TRIGGER_TYPES.ENCOUNTER_CREATED).toBe('ENCOUNTER_CREATED');
      expect(TRIGGER_TYPES.ENCOUNTER_SIGNED).toBe('ENCOUNTER_SIGNED');
      expect(TRIGGER_TYPES.DAYS_SINCE_VISIT).toBe('DAYS_SINCE_VISIT');
      expect(TRIGGER_TYPES.BIRTHDAY).toBe('BIRTHDAY');
      expect(TRIGGER_TYPES.LIFECYCLE_CHANGE).toBe('LIFECYCLE_CHANGE');
      expect(TRIGGER_TYPES.CUSTOM).toBe('CUSTOM');
    });

    it('should have 11 trigger types', () => {
      expect(Object.keys(TRIGGER_TYPES)).toHaveLength(11);
    });
  });

  // ─── evaluateTrigger ──────────────────────────────────

  describe('evaluateTrigger', () => {
    // --- PATIENT_CREATED ---
    it('should match PATIENT_CREATED when patient_id is present', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.PATIENT_CREATED);
      expect(evaluateTrigger(wf, { patient_id: 'p-1' })).toBe(true);
    });

    it('should not match PATIENT_CREATED when patient_id is missing', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.PATIENT_CREATED);
      expect(evaluateTrigger(wf, {})).toBe(false);
    });

    // --- APPOINTMENT_SCHEDULED ---
    it('should match APPOINTMENT_SCHEDULED when appointment_id is present', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.APPOINTMENT_SCHEDULED);
      expect(evaluateTrigger(wf, { appointment_id: 'a-1' })).toBe(true);
    });

    it('should not match APPOINTMENT_SCHEDULED when type does not match config', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.APPOINTMENT_SCHEDULED, { appointment_type: 'initial' });
      expect(evaluateTrigger(wf, { appointment_id: 'a-1', appointment_type: 'follow_up' })).toBe(
        false
      );
    });

    it('should match APPOINTMENT_SCHEDULED when type matches config', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.APPOINTMENT_SCHEDULED, { appointment_type: 'initial' });
      expect(evaluateTrigger(wf, { appointment_id: 'a-1', appointment_type: 'initial' })).toBe(
        true
      );
    });

    // --- APPOINTMENT_COMPLETED ---
    it('should match APPOINTMENT_COMPLETED when status is COMPLETED', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.APPOINTMENT_COMPLETED);
      expect(evaluateTrigger(wf, { appointment_id: 'a-1', status: 'COMPLETED' })).toBe(true);
    });

    it('should not match APPOINTMENT_COMPLETED when status is not COMPLETED', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.APPOINTMENT_COMPLETED);
      expect(evaluateTrigger(wf, { appointment_id: 'a-1', status: 'SCHEDULED' })).toBe(false);
    });

    // --- APPOINTMENT_MISSED ---
    it('should match APPOINTMENT_MISSED when status is NO_SHOW', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.APPOINTMENT_MISSED);
      expect(evaluateTrigger(wf, { appointment_id: 'a-1', status: 'NO_SHOW' })).toBe(true);
    });

    it('should not match APPOINTMENT_MISSED when status is COMPLETED', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.APPOINTMENT_MISSED);
      expect(evaluateTrigger(wf, { appointment_id: 'a-1', status: 'COMPLETED' })).toBe(false);
    });

    // --- APPOINTMENT_CANCELLED ---
    it('should match APPOINTMENT_CANCELLED when status is CANCELLED', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.APPOINTMENT_CANCELLED);
      expect(evaluateTrigger(wf, { appointment_id: 'a-1', status: 'CANCELLED' })).toBe(true);
    });

    // --- ENCOUNTER_CREATED ---
    it('should match ENCOUNTER_CREATED when encounter_id is present', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.ENCOUNTER_CREATED);
      expect(evaluateTrigger(wf, { encounter_id: 'e-1' })).toBe(true);
    });

    it('should not match ENCOUNTER_CREATED when encounter_type does not match config', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.ENCOUNTER_CREATED, { encounter_type: 'SOAP' });
      expect(evaluateTrigger(wf, { encounter_id: 'e-1', encounter_type: 'EXAM' })).toBe(false);
    });

    it('should match ENCOUNTER_CREATED when encounter_type matches config', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.ENCOUNTER_CREATED, { encounter_type: 'SOAP' });
      expect(evaluateTrigger(wf, { encounter_id: 'e-1', encounter_type: 'SOAP' })).toBe(true);
    });

    // --- ENCOUNTER_SIGNED ---
    it('should match ENCOUNTER_SIGNED when encounter_id and signed_by are present', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.ENCOUNTER_SIGNED);
      expect(evaluateTrigger(wf, { encounter_id: 'e-1', signed_by: 'user-1' })).toBe(true);
    });

    it('should not match ENCOUNTER_SIGNED when signed_by is missing', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.ENCOUNTER_SIGNED);
      expect(evaluateTrigger(wf, { encounter_id: 'e-1' })).toBe(false);
    });

    // --- DAYS_SINCE_VISIT ---
    it('should match DAYS_SINCE_VISIT when days exceed config', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.DAYS_SINCE_VISIT, { days: 42 });
      expect(evaluateTrigger(wf, { days_since_visit: 50 })).toBe(true);
    });

    it('should not match DAYS_SINCE_VISIT when days are below config', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.DAYS_SINCE_VISIT, { days: 42 });
      expect(evaluateTrigger(wf, { days_since_visit: 30 })).toBe(false);
    });

    it('should not match DAYS_SINCE_VISIT when days_since_visit is missing', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.DAYS_SINCE_VISIT, { days: 42 });
      expect(evaluateTrigger(wf, {})).toBe(false);
    });

    // --- BIRTHDAY ---
    it('should match BIRTHDAY when is_birthday is true', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.BIRTHDAY);
      expect(evaluateTrigger(wf, { is_birthday: true })).toBe(true);
    });

    it('should not match BIRTHDAY when is_birthday is false', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.BIRTHDAY);
      expect(evaluateTrigger(wf, { is_birthday: false })).toBe(false);
    });

    // --- LIFECYCLE_CHANGE ---
    it('should match LIFECYCLE_CHANGE when lifecycle_changed is true', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.LIFECYCLE_CHANGE);
      expect(evaluateTrigger(wf, { lifecycle_changed: true })).toBe(true);
    });

    it('should match LIFECYCLE_CHANGE with from_stage filter', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.LIFECYCLE_CHANGE, { from_stage: 'ACTIVE' });
      expect(
        evaluateTrigger(wf, {
          lifecycle_changed: true,
          previous_lifecycle: 'ACTIVE',
          new_lifecycle: 'AT_RISK',
        })
      ).toBe(true);
    });

    it('should not match LIFECYCLE_CHANGE when from_stage does not match', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.LIFECYCLE_CHANGE, { from_stage: 'NEW' });
      expect(evaluateTrigger(wf, { lifecycle_changed: true, previous_lifecycle: 'ACTIVE' })).toBe(
        false
      );
    });

    it('should match LIFECYCLE_CHANGE with to_stage filter', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.LIFECYCLE_CHANGE, { to_stage: 'LOST' });
      expect(evaluateTrigger(wf, { lifecycle_changed: true, new_lifecycle: 'LOST' })).toBe(true);
    });

    it('should not match LIFECYCLE_CHANGE when to_stage does not match', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.LIFECYCLE_CHANGE, { to_stage: 'LOST' });
      expect(evaluateTrigger(wf, { lifecycle_changed: true, new_lifecycle: 'ACTIVE' })).toBe(false);
    });

    // --- CUSTOM ---
    it('should match CUSTOM when event_type matches config', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.CUSTOM, { event_type: 'MANUAL_OUTREACH' });
      expect(evaluateTrigger(wf, { event_type: 'MANUAL_OUTREACH' })).toBe(true);
    });

    it('should not match CUSTOM when event_type does not match', () => {
      const wf = makeWorkflow(TRIGGER_TYPES.CUSTOM, { event_type: 'MANUAL_OUTREACH' });
      expect(evaluateTrigger(wf, { event_type: 'OTHER_EVENT' })).toBe(false);
    });

    // --- Unknown trigger ---
    it('should return false for unknown trigger type', () => {
      const wf = makeWorkflow('UNKNOWN_TRIGGER');
      expect(evaluateTrigger(wf, { patient_id: 'p-1' })).toBe(false);
    });

    // --- Edge: missing trigger_config ---
    it('should handle missing trigger_config gracefully', () => {
      const wf = { trigger_type: TRIGGER_TYPES.PATIENT_CREATED };
      expect(evaluateTrigger(wf, { patient_id: 'p-1' })).toBe(true);
    });
  });
});
