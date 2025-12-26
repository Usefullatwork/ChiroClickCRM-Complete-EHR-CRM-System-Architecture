/**
 * Patient Validator Tests
 * Tests for Joi validation schemas
 */

import { describe, it, expect } from '@jest/globals';
import Joi from 'joi';
import {
  createPatientSchema,
  updatePatientSchema,
  getPatientSchema,
  deletePatientSchema,
  searchPatientsSchema
} from '../../src/validators/patient.validators.js';

describe('Patient Validators', () => {

  describe('createPatientSchema', () => {
    const schema = createPatientSchema.body;

    it('should validate a complete valid patient', () => {
      const validPatient = {
        solvit_id: 'SOL-12345',
        first_name: 'Ola',
        last_name: 'Nordmann',
        date_of_birth: '1990-05-15',
        gender: 'MALE',
        email: 'ola@example.no',
        phone: '+4712345678',
        consent_sms: true,
        consent_email: true,
        consent_data_storage: true
      };

      const { error } = schema.validate(validPatient);
      expect(error).toBeUndefined();
    });

    it('should require solvit_id', () => {
      const patient = {
        first_name: 'Ola',
        last_name: 'Nordmann',
        date_of_birth: '1990-05-15'
      };

      const { error } = schema.validate(patient);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('solvit_id');
    });

    it('should require first_name', () => {
      const patient = {
        solvit_id: 'SOL-12345',
        last_name: 'Nordmann',
        date_of_birth: '1990-05-15'
      };

      const { error } = schema.validate(patient);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('first_name');
    });

    it('should require last_name', () => {
      const patient = {
        solvit_id: 'SOL-12345',
        first_name: 'Ola',
        date_of_birth: '1990-05-15'
      };

      const { error } = schema.validate(patient);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('last_name');
    });

    it('should require date_of_birth', () => {
      const patient = {
        solvit_id: 'SOL-12345',
        first_name: 'Ola',
        last_name: 'Nordmann'
      };

      const { error } = schema.validate(patient);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('date_of_birth');
    });

    it('should validate date_of_birth format (ISO)', () => {
      const patient = {
        solvit_id: 'SOL-12345',
        first_name: 'Ola',
        last_name: 'Nordmann',
        date_of_birth: 'invalid-date'
      };

      const { error } = schema.validate(patient);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('date_of_birth');
    });

    it('should validate gender enum', () => {
      const patient = {
        solvit_id: 'SOL-12345',
        first_name: 'Ola',
        last_name: 'Nordmann',
        date_of_birth: '1990-05-15',
        gender: 'INVALID'
      };

      const { error } = schema.validate(patient);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('gender');
    });

    it('should accept valid gender values', () => {
      const genders = ['MALE', 'FEMALE', 'OTHER'];

      genders.forEach(gender => {
        const patient = {
          solvit_id: 'SOL-12345',
          first_name: 'Test',
          last_name: 'Person',
          date_of_birth: '1990-01-01',
          gender
        };

        const { error } = schema.validate(patient);
        expect(error).toBeUndefined();
      });
    });

    it('should validate email format', () => {
      const patient = {
        solvit_id: 'SOL-12345',
        first_name: 'Ola',
        last_name: 'Nordmann',
        date_of_birth: '1990-05-15',
        email: 'not-an-email'
      };

      const { error } = schema.validate(patient);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });

    it('should validate status enum', () => {
      const validStatuses = ['ACTIVE', 'INACTIVE', 'FINISHED', 'DECEASED'];

      validStatuses.forEach(status => {
        const patient = {
          solvit_id: 'SOL-12345',
          first_name: 'Test',
          last_name: 'Person',
          date_of_birth: '1990-01-01',
          status
        };

        const { error } = schema.validate(patient);
        expect(error).toBeUndefined();
      });
    });

    it('should validate category enum', () => {
      const validCategories = ['OSLO', 'OUTSIDE_OSLO', 'TRAVELING', 'REFERRED'];

      validCategories.forEach(category => {
        const patient = {
          solvit_id: 'SOL-12345',
          first_name: 'Test',
          last_name: 'Person',
          date_of_birth: '1990-01-01',
          category
        };

        const { error } = schema.validate(patient);
        expect(error).toBeUndefined();
      });
    });

    it('should validate preferred_contact_method enum', () => {
      const validMethods = ['SMS', 'EMAIL', 'PHONE'];

      validMethods.forEach(method => {
        const patient = {
          solvit_id: 'SOL-12345',
          first_name: 'Test',
          last_name: 'Person',
          date_of_birth: '1990-01-01',
          preferred_contact_method: method
        };

        const { error } = schema.validate(patient);
        expect(error).toBeUndefined();
      });
    });

    it('should accept arrays for red_flags', () => {
      const patient = {
        solvit_id: 'SOL-12345',
        first_name: 'Ola',
        last_name: 'Nordmann',
        date_of_birth: '1990-05-15',
        red_flags: ['Osteoporosis', 'Cancer history']
      };

      const { error } = schema.validate(patient);
      expect(error).toBeUndefined();
    });

    it('should accept arrays for allergies', () => {
      const patient = {
        solvit_id: 'SOL-12345',
        first_name: 'Ola',
        last_name: 'Nordmann',
        date_of_birth: '1990-05-15',
        allergies: ['Penicillin', 'Latex']
      };

      const { error } = schema.validate(patient);
      expect(error).toBeUndefined();
    });

    it('should enforce max length on first_name', () => {
      const patient = {
        solvit_id: 'SOL-12345',
        first_name: 'A'.repeat(101),
        last_name: 'Nordmann',
        date_of_birth: '1990-05-15'
      };

      const { error } = schema.validate(patient);
      expect(error).toBeDefined();
    });

    it('should enforce max length on solvit_id', () => {
      const patient = {
        solvit_id: 'A'.repeat(51),
        first_name: 'Ola',
        last_name: 'Nordmann',
        date_of_birth: '1990-05-15'
      };

      const { error } = schema.validate(patient);
      expect(error).toBeDefined();
    });
  });

  describe('updatePatientSchema', () => {
    const paramsSchema = updatePatientSchema.params;
    const bodySchema = updatePatientSchema.body;

    it('should require UUID in params', () => {
      const { error } = paramsSchema.validate({ id: 'not-a-uuid' });
      expect(error).toBeDefined();
    });

    it('should accept valid UUID in params', () => {
      const { error } = paramsSchema.validate({
        id: '123e4567-e89b-12d3-a456-426614174000'
      });
      expect(error).toBeUndefined();
    });

    it('should require at least one field in body', () => {
      const { error } = bodySchema.validate({});
      expect(error).toBeDefined();
    });

    it('should allow partial updates', () => {
      const { error } = bodySchema.validate({ first_name: 'NewName' });
      expect(error).toBeUndefined();
    });

    it('should validate fields in update', () => {
      const { error } = bodySchema.validate({ email: 'invalid-email' });
      expect(error).toBeDefined();
    });
  });

  describe('getPatientSchema', () => {
    const schema = getPatientSchema.params;

    it('should require UUID', () => {
      const { error } = schema.validate({ id: 'not-a-uuid' });
      expect(error).toBeDefined();
    });

    it('should accept valid UUID', () => {
      const { error } = schema.validate({
        id: '123e4567-e89b-12d3-a456-426614174000'
      });
      expect(error).toBeUndefined();
    });
  });

  describe('deletePatientSchema', () => {
    const schema = deletePatientSchema.params;

    it('should require UUID', () => {
      const { error } = schema.validate({});
      expect(error).toBeDefined();
    });

    it('should accept valid UUID', () => {
      const { error } = schema.validate({
        id: '123e4567-e89b-12d3-a456-426614174000'
      });
      expect(error).toBeUndefined();
    });
  });

  describe('searchPatientsSchema', () => {
    const schema = searchPatientsSchema.query;

    it('should allow empty query', () => {
      const { error, value } = schema.validate({});
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(20);
    });

    it('should validate status enum in search', () => {
      const { error } = schema.validate({ status: 'INVALID' });
      expect(error).toBeDefined();
    });

    it('should validate category enum in search', () => {
      const { error } = schema.validate({ category: 'INVALID' });
      expect(error).toBeDefined();
    });

    it('should enforce min page of 1', () => {
      const { error } = schema.validate({ page: 0 });
      expect(error).toBeDefined();
    });

    it('should enforce max limit of 100', () => {
      const { error } = schema.validate({ limit: 101 });
      expect(error).toBeDefined();
    });

    it('should accept valid search parameters', () => {
      const { error } = schema.validate({
        q: 'Ola Nordmann',
        status: 'ACTIVE',
        category: 'OSLO',
        page: 2,
        limit: 50
      });
      expect(error).toBeUndefined();
    });

    it('should enforce max length on search query', () => {
      const { error } = schema.validate({ q: 'A'.repeat(201) });
      expect(error).toBeDefined();
    });
  });
});
