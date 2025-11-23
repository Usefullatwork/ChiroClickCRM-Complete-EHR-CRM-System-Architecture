/**
 * Patient Entity Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Patient } from '../../../src/domain/entities/Patient.js';

describe('Patient Entity', () => {
  let patientData;

  beforeEach(() => {
    patientData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      organization_id: '123e4567-e89b-12d3-a456-426614174001',
      solvit_id: 'SOL123',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1980-01-15',
      email: 'john.doe@example.com',
      phone: '+4712345678',
      status: 'ACTIVE',
      category: 'OSLO',
      total_visits: 5,
      lifetime_value: 3000
    };
  });

  describe('Constructor', () => {
    it('should create a patient instance with valid data', () => {
      const patient = new Patient(patientData);

      expect(patient.id).toBe(patientData.id);
      expect(patient.firstName).toBe('John');
      expect(patient.lastName).toBe('Doe');
      expect(patient.status).toBe('ACTIVE');
    });

    it('should set default status to ACTIVE if not provided', () => {
      const data = { ...patientData };
      delete data.status;
      const patient = new Patient(data);

      expect(patient.status).toBe('ACTIVE');
    });

    it('should set default total visits to 0 if not provided', () => {
      const data = { ...patientData };
      delete data.total_visits;
      const patient = new Patient(data);

      expect(patient.totalVisits).toBe(0);
    });
  });

  describe('Business Rules', () => {
    it('should return full name correctly', () => {
      const patient = new Patient(patientData);
      expect(patient.fullName).toBe('John Doe');
    });

    it('should identify active patients correctly', () => {
      const patient = new Patient(patientData);
      expect(patient.isActive()).toBe(true);

      patient.status = 'INACTIVE';
      expect(patient.isActive()).toBe(false);
    });

    it('should identify high-value patients (>= 5000 NOK)', () => {
      const patient = new Patient(patientData);
      expect(patient.isHighValue()).toBe(false);

      patient.lifetimeValue = 5000;
      expect(patient.isHighValue()).toBe(true);

      patient.lifetimeValue = 6000;
      expect(patient.isHighValue()).toBe(true);
    });

    it('should calculate age correctly', () => {
      const patient = new Patient(patientData);
      const age = patient.getAge();

      // Calculate expected age
      const today = new Date();
      const birthYear = 1980;
      const expectedAge = today.getFullYear() - birthYear;

      expect(age).toBeGreaterThanOrEqual(expectedAge - 1);
      expect(age).toBeLessThanOrEqual(expectedAge);
    });

    it('should return null age if date of birth is missing', () => {
      const data = { ...patientData };
      delete data.date_of_birth;
      const patient = new Patient(data);

      expect(patient.getAge()).toBeNull();
    });

    it('should identify patients needing follow-up', () => {
      const patient = new Patient(patientData);

      // No follow-up date set
      expect(patient.needsFollowUp()).toBe(false);

      // Follow-up date in the past
      patient.shouldBeFollowedUp = '2020-01-01';
      expect(patient.needsFollowUp()).toBe(true);

      // Follow-up date in the future
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      patient.shouldBeFollowedUp = futureDate.toISOString().split('T')[0];
      expect(patient.needsFollowUp()).toBe(false);
    });

    it('should determine recommended contact method', () => {
      const patient = new Patient(patientData);

      // Preferred method set
      patient.preferredContactMethod = 'EMAIL';
      expect(patient.getRecommendedContactMethod()).toBe('EMAIL');

      // No preference, has phone
      patient.preferredContactMethod = null;
      expect(patient.getRecommendedContactMethod()).toBe('SMS');

      // No phone, has email
      patient.phone = null;
      expect(patient.getRecommendedContactMethod()).toBe('EMAIL');

      // No phone or email
      patient.email = null;
      expect(patient.getRecommendedContactMethod()).toBe('PHONE');
    });
  });

  describe('Validation', () => {
    it('should validate a complete patient', () => {
      const patient = new Patient(patientData);
      const validation = patient.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should require first name', () => {
      const data = { ...patientData };
      delete data.first_name;
      const patient = new Patient(data);
      const validation = patient.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('First name is required');
    });

    it('should require last name', () => {
      const data = { ...patientData };
      delete data.last_name;
      const patient = new Patient(data);
      const validation = patient.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Last name is required');
    });

    it('should require date of birth', () => {
      const data = { ...patientData };
      delete data.date_of_birth;
      const patient = new Patient(data);
      const validation = patient.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Date of birth is required');
    });

    it('should require SolvIT ID', () => {
      const data = { ...patientData };
      delete data.solvit_id;
      const patient = new Patient(data);
      const validation = patient.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('SolvIT ID is required');
    });

    it('should validate status values', () => {
      const patient = new Patient(patientData);
      patient.status = 'INVALID_STATUS';
      const validation = patient.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Data Conversion', () => {
    it('should convert to database format correctly', () => {
      const patient = new Patient(patientData);
      const dbData = patient.toDatabase();

      expect(dbData.organization_id).toBe(patientData.organization_id);
      expect(dbData.first_name).toBe(patientData.first_name);
      expect(dbData.last_name).toBe(patientData.last_name);
      expect(dbData.solvit_id).toBe(patientData.solvit_id);
    });

    it('should create from database row', () => {
      const patient = Patient.fromDatabase(patientData);

      expect(patient).toBeInstanceOf(Patient);
      expect(patient.firstName).toBe(patientData.first_name);
      expect(patient.lastName).toBe(patientData.last_name);
    });
  });
});
