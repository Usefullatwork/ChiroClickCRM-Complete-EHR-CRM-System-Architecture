/**
 * Exercise Validator Unit Tests
 * Tests Joi schemas for exercise library, prescriptions, and templates
 */

import Joi from 'joi';
import {
  listExercisesSchema,
  createExerciseSchema,
  updateExerciseSchema,
  getExerciseSchema,
  createPrescriptionSchema,
  getPatientPrescriptionsSchema,
  getPrescriptionSchema,
  updatePrescriptionSchema,
  updatePrescriptionStatusSchema,
  createTemplateSchema,
  updateTemplateSchema,
  deleteTemplateSchema,
  sendEmailSchema,
} from '../../src/validators/exercise.validators.js';

const validUUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Exercise Validators', () => {
  // ===========================================================================
  // LIST EXERCISES
  // ===========================================================================

  describe('listExercisesSchema', () => {
    it('should accept empty query (uses defaults)', () => {
      const { error, value } = listExercisesSchema.query.validate({});
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(20);
    });

    it('should accept all filter params', () => {
      const { error } = listExercisesSchema.query.validate({
        category: 'stretching',
        bodyRegion: 'cervical',
        difficulty: 'easy',
        search: 'chin tuck',
        page: 2,
        limit: 50,
      });
      expect(error).toBeUndefined();
    });

    it('should accept body_region alternative param', () => {
      const { error } = listExercisesSchema.query.validate({
        body_region: 'lumbar',
      });
      expect(error).toBeUndefined();
    });

    it('should accept q alternative search param', () => {
      const { error } = listExercisesSchema.query.validate({
        q: 'stretch',
      });
      expect(error).toBeUndefined();
    });

    it('should reject search string over 200 chars', () => {
      const { error } = listExercisesSchema.query.validate({
        search: 'a'.repeat(201),
      });
      expect(error).toBeDefined();
    });

    it('should reject page below 1', () => {
      const { error } = listExercisesSchema.query.validate({ page: 0 });
      expect(error).toBeDefined();
    });

    it('should reject limit above 100', () => {
      const { error } = listExercisesSchema.query.validate({ limit: 150 });
      expect(error).toBeDefined();
    });
  });

  // ===========================================================================
  // CREATE EXERCISE
  // ===========================================================================

  describe('createExerciseSchema', () => {
    const validExercise = {
      name: 'Chin Tuck',
      name_en: 'Chin Tuck',
      category: 'strengthening',
      body_region: 'cervical',
      difficulty: 'easy',
      instructions: 'Trekk haken inn mot halsen. Hold i 5 sekunder.',
      instructions_en: 'Pull chin toward neck. Hold for 5 seconds.',
      sets: 3,
      reps: 10,
      hold_seconds: 5,
      frequency: '3x daily',
    };

    it('should accept valid exercise data', () => {
      const { error } = createExerciseSchema.body.validate(validExercise);
      expect(error).toBeUndefined();
    });

    it('should accept minimal required fields', () => {
      const { error } = createExerciseSchema.body.validate({
        name: 'Bird Dog',
        category: 'strengthening',
        body_region: 'lumbar',
        instructions: 'Start on all fours...',
      });
      expect(error).toBeUndefined();
    });

    it('should reject missing name', () => {
      const { error } = createExerciseSchema.body.validate({
        category: 'stretching',
        body_region: 'cervical',
        instructions: 'test',
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    it('should reject missing category', () => {
      const { error } = createExerciseSchema.body.validate({
        name: 'Test',
        body_region: 'cervical',
        instructions: 'test',
      });
      expect(error).toBeDefined();
    });

    it('should reject missing body_region', () => {
      const { error } = createExerciseSchema.body.validate({
        name: 'Test',
        category: 'stretching',
        instructions: 'test',
      });
      expect(error).toBeDefined();
    });

    it('should reject missing instructions', () => {
      const { error } = createExerciseSchema.body.validate({
        name: 'Test',
        category: 'stretching',
        body_region: 'cervical',
      });
      expect(error).toBeDefined();
    });

    it('should accept valid difficulty levels (case insensitive)', () => {
      for (const diff of ['easy', 'moderate', 'hard', 'EASY', 'MODERATE', 'HARD']) {
        const { error } = createExerciseSchema.body.validate({
          name: 'Test',
          category: 'stretching',
          body_region: 'cervical',
          instructions: 'test',
          difficulty: diff,
        });
        expect(error).toBeUndefined();
      }
    });

    it('should reject invalid difficulty', () => {
      const { error } = createExerciseSchema.body.validate({
        name: 'Test',
        category: 'stretching',
        body_region: 'cervical',
        instructions: 'test',
        difficulty: 'extreme',
      });
      expect(error).toBeDefined();
    });

    it('should accept name up to 200 characters', () => {
      const { error } = createExerciseSchema.body.validate({
        name: 'A'.repeat(200),
        category: 'stretching',
        body_region: 'cervical',
        instructions: 'test',
      });
      expect(error).toBeUndefined();
    });

    it('should reject name over 200 characters', () => {
      const { error } = createExerciseSchema.body.validate({
        name: 'A'.repeat(201),
        category: 'stretching',
        body_region: 'cervical',
        instructions: 'test',
      });
      expect(error).toBeDefined();
    });

    it('should accept null/empty image and video URLs', () => {
      const { error } = createExerciseSchema.body.validate({
        name: 'Test',
        category: 'stretching',
        body_region: 'cervical',
        instructions: 'test',
        image_url: null,
        video_url: '',
      });
      expect(error).toBeUndefined();
    });

    it('should accept contraindications array', () => {
      const { error } = createExerciseSchema.body.validate({
        name: 'Test',
        category: 'stretching',
        body_region: 'cervical',
        instructions: 'test',
        contraindications: ['Acute disc herniation', 'Fracture'],
      });
      expect(error).toBeUndefined();
    });
  });

  // ===========================================================================
  // UPDATE EXERCISE
  // ===========================================================================

  describe('updateExerciseSchema', () => {
    it('should accept valid params UUID', () => {
      const { error } = updateExerciseSchema.params.validate({ id: validUUID });
      expect(error).toBeUndefined();
    });

    it('should reject invalid params UUID', () => {
      const { error } = updateExerciseSchema.params.validate({ id: 'bad' });
      expect(error).toBeDefined();
    });

    it('should accept partial body update', () => {
      const { error } = updateExerciseSchema.body.validate({
        name: 'Updated Exercise Name',
      });
      expect(error).toBeUndefined();
    });

    it('should reject empty body (min 1 field required)', () => {
      const { error } = updateExerciseSchema.body.validate({});
      expect(error).toBeDefined();
    });
  });

  // ===========================================================================
  // GET EXERCISE
  // ===========================================================================

  describe('getExerciseSchema', () => {
    it('should accept valid UUID param', () => {
      const { error } = getExerciseSchema.params.validate({ id: validUUID });
      expect(error).toBeUndefined();
    });

    it('should reject missing id', () => {
      const { error } = getExerciseSchema.params.validate({});
      expect(error).toBeDefined();
    });
  });

  // ===========================================================================
  // PRESCRIPTIONS
  // ===========================================================================

  describe('createPrescriptionSchema', () => {
    it('should accept valid prescription data', () => {
      const { error } = createPrescriptionSchema.body.validate({
        patient_id: validUUID,
        exercises: [{ exercise_id: validUUID, sets: 3, reps: 10 }],
        notes: 'Focus on posture',
        start_date: '2026-01-15',
        end_date: '2026-02-15',
        frequency: 'Daily',
      });
      expect(error).toBeUndefined();
    });

    it('should reject missing patient_id', () => {
      const { error } = createPrescriptionSchema.body.validate({
        exercises: [{ exercise_id: validUUID }],
      });
      expect(error).toBeDefined();
    });

    it('should reject missing exercises array', () => {
      const { error } = createPrescriptionSchema.body.validate({
        patient_id: validUUID,
      });
      expect(error).toBeDefined();
    });

    it('should accept optional program_id', () => {
      const { error } = createPrescriptionSchema.body.validate({
        patient_id: validUUID,
        exercises: [{ exercise_id: validUUID }],
        program_id: validUUID,
      });
      expect(error).toBeUndefined();
    });
  });

  describe('getPatientPrescriptionsSchema', () => {
    it('should accept valid patientId param', () => {
      const { error } = getPatientPrescriptionsSchema.params.validate({
        patientId: validUUID,
      });
      expect(error).toBeUndefined();
    });

    it('should reject missing patientId', () => {
      const { error } = getPatientPrescriptionsSchema.params.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('getPrescriptionSchema', () => {
    it('should accept valid UUID', () => {
      const { error } = getPrescriptionSchema.params.validate({ id: validUUID });
      expect(error).toBeUndefined();
    });
  });

  describe('updatePrescriptionSchema', () => {
    it('should accept partial update', () => {
      const { error } = updatePrescriptionSchema.body.validate({
        notes: 'Updated notes',
        frequency: 'Twice daily',
      });
      expect(error).toBeUndefined();
    });

    it('should reject empty body (min 1 field required)', () => {
      const { error } = updatePrescriptionSchema.body.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('updatePrescriptionStatusSchema', () => {
    it('should accept valid status', () => {
      const { error } = updatePrescriptionStatusSchema.body.validate({
        status: 'completed',
      });
      expect(error).toBeUndefined();
    });

    it('should reject missing status', () => {
      const { error } = updatePrescriptionStatusSchema.body.validate({});
      expect(error).toBeDefined();
    });
  });

  // ===========================================================================
  // TEMPLATES
  // ===========================================================================

  describe('createTemplateSchema', () => {
    it('should accept valid template data', () => {
      const { error } = createTemplateSchema.body.validate({
        name: 'McGill Big 3',
        description: 'Core stabilization program',
        exercises: [{ exercise_id: validUUID, sets: 3 }],
        category: 'strengthening',
        body_region: 'lumbar',
        difficulty: 'moderate',
      });
      expect(error).toBeUndefined();
    });

    it('should reject missing name', () => {
      const { error } = createTemplateSchema.body.validate({
        exercises: [{ exercise_id: validUUID }],
      });
      expect(error).toBeDefined();
    });

    it('should reject missing exercises', () => {
      const { error } = createTemplateSchema.body.validate({
        name: 'Test Template',
      });
      expect(error).toBeDefined();
    });

    it('should reject name over 200 chars', () => {
      const { error } = createTemplateSchema.body.validate({
        name: 'A'.repeat(201),
        exercises: [{ exercise_id: validUUID }],
      });
      expect(error).toBeDefined();
    });
  });

  describe('updateTemplateSchema', () => {
    it('should accept valid params UUID', () => {
      const { error } = updateTemplateSchema.params.validate({ id: validUUID });
      expect(error).toBeUndefined();
    });

    it('should accept partial body update', () => {
      const { error } = updateTemplateSchema.body.validate({
        name: 'Updated Template',
      });
      expect(error).toBeUndefined();
    });

    it('should reject empty body (min 1 field required)', () => {
      const { error } = updateTemplateSchema.body.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('deleteTemplateSchema', () => {
    it('should accept valid UUID', () => {
      const { error } = deleteTemplateSchema.params.validate({ id: validUUID });
      expect(error).toBeUndefined();
    });

    it('should reject invalid UUID', () => {
      const { error } = deleteTemplateSchema.params.validate({ id: 'bad' });
      expect(error).toBeDefined();
    });
  });

  // ===========================================================================
  // SEND EMAIL
  // ===========================================================================

  describe('sendEmailSchema', () => {
    it('should accept valid email data', () => {
      const { error } = sendEmailSchema.body.validate({
        email: 'patient@example.com',
        patient_id: validUUID,
      });
      expect(error).toBeUndefined();
    });

    it('should accept valid params UUID', () => {
      const { error } = sendEmailSchema.params.validate({ id: validUUID });
      expect(error).toBeUndefined();
    });

    it('should reject invalid email format', () => {
      const { error } = sendEmailSchema.body.validate({
        email: 'not-an-email',
      });
      expect(error).toBeDefined();
    });
  });
});
