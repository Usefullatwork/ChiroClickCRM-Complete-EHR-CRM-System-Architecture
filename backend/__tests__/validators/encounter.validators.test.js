/**
 * Encounter Validator Unit Tests
 * Tests Joi schemas for clinical encounter validation
 */

import Joi from 'joi';
import {
  createEncounterSchema,
  updateEncounterSchema,
  getEncounterSchema,
  signEncounterSchema,
  getEncountersSchema,
  generateNoteSchema,
} from '../../src/validators/encounter.validators.js';

const validUUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Encounter Validators', () => {
  // ===========================================================================
  // CREATE ENCOUNTER
  // ===========================================================================

  describe('createEncounterSchema', () => {
    const validData = {
      patient_id: validUUID,
      practitioner_id: validUUID,
      encounter_type: 'INITIAL',
      duration_minutes: 30,
      subjective: {
        chief_complaint: 'Lower back pain for 3 weeks',
        history: 'No prior episodes',
      },
      objective: {
        observation: 'Antalgic gait',
        palpation: 'Tenderness L4-L5',
      },
      assessment: {
        clinical_reasoning: 'Mechanical LBP',
        red_flags_checked: true,
      },
      plan: {
        treatment: 'CMT L4-L5',
        follow_up: '1 week',
      },
    };

    it('should accept valid encounter data', () => {
      const { error } = createEncounterSchema.body.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should accept minimal required fields only', () => {
      const { error } = createEncounterSchema.body.validate({
        patient_id: validUUID,
        practitioner_id: validUUID,
        encounter_type: 'FOLLOWUP',
      });
      expect(error).toBeUndefined();
    });

    it('should reject missing patient_id', () => {
      const { error } = createEncounterSchema.body.validate({
        practitioner_id: validUUID,
        encounter_type: 'INITIAL',
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('patient_id');
    });

    it('should reject missing practitioner_id', () => {
      const { error } = createEncounterSchema.body.validate({
        patient_id: validUUID,
        encounter_type: 'INITIAL',
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('practitioner_id');
    });

    it('should reject missing encounter_type', () => {
      const { error } = createEncounterSchema.body.validate({
        patient_id: validUUID,
        practitioner_id: validUUID,
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('encounter_type');
    });

    it('should reject invalid encounter_type', () => {
      const { error } = createEncounterSchema.body.validate({
        patient_id: validUUID,
        practitioner_id: validUUID,
        encounter_type: 'INVALID',
      });
      expect(error).toBeDefined();
    });

    it('should accept all valid encounter types', () => {
      for (const type of ['INITIAL', 'FOLLOWUP', 'REEXAM', 'EMERGENCY']) {
        const { error } = createEncounterSchema.body.validate({
          patient_id: validUUID,
          practitioner_id: validUUID,
          encounter_type: type,
        });
        expect(error).toBeUndefined();
      }
    });

    it('should reject invalid patient_id format', () => {
      const { error } = createEncounterSchema.body.validate({
        patient_id: 'not-a-uuid',
        practitioner_id: validUUID,
        encounter_type: 'INITIAL',
      });
      expect(error).toBeDefined();
    });

    it('should reject duration_minutes below minimum', () => {
      const { error } = createEncounterSchema.body.validate({
        patient_id: validUUID,
        practitioner_id: validUUID,
        encounter_type: 'INITIAL',
        duration_minutes: 2,
      });
      expect(error).toBeDefined();
    });

    it('should reject duration_minutes above maximum', () => {
      const { error } = createEncounterSchema.body.validate({
        patient_id: validUUID,
        practitioner_id: validUUID,
        encounter_type: 'INITIAL',
        duration_minutes: 200,
      });
      expect(error).toBeDefined();
    });

    it('should accept VAS pain scores in valid range', () => {
      const { error } = createEncounterSchema.body.validate({
        patient_id: validUUID,
        practitioner_id: validUUID,
        encounter_type: 'FOLLOWUP',
        vas_pain_start: 7,
        vas_pain_end: 4,
      });
      expect(error).toBeUndefined();
    });

    it('should reject VAS pain score above 10', () => {
      const { error } = createEncounterSchema.body.validate({
        patient_id: validUUID,
        practitioner_id: validUUID,
        encounter_type: 'FOLLOWUP',
        vas_pain_start: 11,
      });
      expect(error).toBeDefined();
    });

    it('should accept null VAS scores', () => {
      const { error } = createEncounterSchema.body.validate({
        patient_id: validUUID,
        practitioner_id: validUUID,
        encounter_type: 'FOLLOWUP',
        vas_pain_start: null,
        vas_pain_end: null,
      });
      expect(error).toBeUndefined();
    });

    it('should accept treatments array with valid items', () => {
      const { error } = createEncounterSchema.body.validate({
        patient_id: validUUID,
        practitioner_id: validUUID,
        encounter_type: 'FOLLOWUP',
        treatments: [
          { type: 'CMT', region: 'Lumbar', technique: 'Diversified', side: 'bilateral' },
          { type: 'Soft tissue', region: 'Thoracic', side: 'left' },
        ],
      });
      expect(error).toBeUndefined();
    });

    it('should reject treatment without required type field', () => {
      const { error } = createEncounterSchema.body.validate({
        patient_id: validUUID,
        practitioner_id: validUUID,
        encounter_type: 'FOLLOWUP',
        treatments: [{ region: 'Lumbar' }],
      });
      expect(error).toBeDefined();
    });

    it('should accept NAV series number in range 1-14', () => {
      const { error } = createEncounterSchema.body.validate({
        patient_id: validUUID,
        practitioner_id: validUUID,
        encounter_type: 'FOLLOWUP',
        nav_series_number: 7,
      });
      expect(error).toBeUndefined();
    });

    it('should reject NAV series number above 14', () => {
      const { error } = createEncounterSchema.body.validate({
        patient_id: validUUID,
        practitioner_id: validUUID,
        encounter_type: 'FOLLOWUP',
        nav_series_number: 15,
      });
      expect(error).toBeDefined();
    });

    it('should accept ICD-10 and ICPC code arrays', () => {
      const { error } = createEncounterSchema.body.validate({
        patient_id: validUUID,
        practitioner_id: validUUID,
        encounter_type: 'INITIAL',
        icd10_codes: ['M54.5', 'M54.4'],
        icpc_codes: ['L03'],
      });
      expect(error).toBeUndefined();
    });
  });

  // ===========================================================================
  // UPDATE ENCOUNTER
  // ===========================================================================

  describe('updateEncounterSchema', () => {
    it('should accept valid params with UUID', () => {
      const { error } = updateEncounterSchema.params.validate({ id: validUUID });
      expect(error).toBeUndefined();
    });

    it('should reject invalid params UUID', () => {
      const { error } = updateEncounterSchema.params.validate({ id: 'bad' });
      expect(error).toBeDefined();
    });

    it('should accept partial body updates', () => {
      const { error } = updateEncounterSchema.body.validate({
        encounter_type: 'REEXAM',
      });
      expect(error).toBeUndefined();
    });

    it('should reject empty body (min 1 field required)', () => {
      const { error } = updateEncounterSchema.body.validate({});
      expect(error).toBeDefined();
    });

    it('should accept SOAP note updates', () => {
      const { error } = updateEncounterSchema.body.validate({
        subjective: { chief_complaint: 'Updated complaint' },
        assessment: { clinical_reasoning: 'Updated assessment' },
      });
      expect(error).toBeUndefined();
    });
  });

  // ===========================================================================
  // GET ENCOUNTER BY ID
  // ===========================================================================

  describe('getEncounterSchema', () => {
    it('should accept valid UUID param', () => {
      const { error } = getEncounterSchema.params.validate({ id: validUUID });
      expect(error).toBeUndefined();
    });

    it('should reject missing id param', () => {
      const { error } = getEncounterSchema.params.validate({});
      expect(error).toBeDefined();
    });
  });

  // ===========================================================================
  // SIGN ENCOUNTER
  // ===========================================================================

  describe('signEncounterSchema', () => {
    it('should accept valid UUID param', () => {
      const { error } = signEncounterSchema.params.validate({ id: validUUID });
      expect(error).toBeUndefined();
    });

    it('should reject missing id', () => {
      const { error } = signEncounterSchema.params.validate({});
      expect(error).toBeDefined();
    });
  });

  // ===========================================================================
  // GET ENCOUNTERS LIST
  // ===========================================================================

  describe('getEncountersSchema', () => {
    it('should accept empty query (uses defaults)', () => {
      const { error, value } = getEncountersSchema.query.validate({});
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(20);
    });

    it('should accept pagination params', () => {
      const { error } = getEncountersSchema.query.validate({ page: 2, limit: 50 });
      expect(error).toBeUndefined();
    });

    it('should reject page below 1', () => {
      const { error } = getEncountersSchema.query.validate({ page: 0 });
      expect(error).toBeDefined();
    });

    it('should reject limit above 100', () => {
      const { error } = getEncountersSchema.query.validate({ limit: 200 });
      expect(error).toBeDefined();
    });

    it('should accept filter by encounterType', () => {
      const { error } = getEncountersSchema.query.validate({ encounterType: 'INITIAL' });
      expect(error).toBeUndefined();
    });

    it('should accept filter by signed boolean', () => {
      const { error } = getEncountersSchema.query.validate({ signed: true });
      expect(error).toBeUndefined();
    });

    it('should accept filter by patientId', () => {
      const { error } = getEncountersSchema.query.validate({ patientId: validUUID });
      expect(error).toBeUndefined();
    });
  });

  // ===========================================================================
  // GENERATE NOTE
  // ===========================================================================

  describe('generateNoteSchema', () => {
    it('should accept valid UUID param', () => {
      const { error } = generateNoteSchema.params.validate({ id: validUUID });
      expect(error).toBeUndefined();
    });

    it('should reject invalid UUID', () => {
      const { error } = generateNoteSchema.params.validate({ id: '123' });
      expect(error).toBeDefined();
    });
  });
});
