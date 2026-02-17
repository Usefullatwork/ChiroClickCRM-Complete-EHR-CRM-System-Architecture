/**
 * Billing Validator Unit Tests
 * Tests Joi schemas for billing, episodes, and claims
 */

import Joi from 'joi';
import {
  createEpisodeSchema,
  getPatientEpisodesSchema,
  getEpisodeSchema,
  updateEpisodeProgressSchema,
  episodeReevalSchema,
  episodeMaintenanceSchema,
  episodeABNSchema,
  episodeDischargeSchema,
  getBillingModifierSchema,
  listClaimsSchema,
  createClaimSchema,
  getClaimSchema,
  updateClaimLineItemsSchema,
  submitClaimSchema,
  processRemittanceSchema,
  appealClaimSchema,
  writeOffClaimSchema,
  suggestCMTSchema,
} from '../../src/validators/billing.validators.js';

const validUUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Billing Validators', () => {
  // ===========================================================================
  // EPISODE SCHEMAS
  // ===========================================================================

  describe('createEpisodeSchema', () => {
    it('should accept valid episode data', () => {
      const { error } = createEpisodeSchema.body.validate({
        patient_id: validUUID,
        diagnosis_codes: ['M54.5', 'M54.4'],
        primary_diagnosis: 'Lumbar disc herniation',
        notes: 'Initial episode',
      });
      expect(error).toBeUndefined();
    });

    it('should accept minimal data (patient_id only)', () => {
      const { error } = createEpisodeSchema.body.validate({
        patient_id: validUUID,
      });
      expect(error).toBeUndefined();
    });

    it('should reject missing patient_id', () => {
      const { error } = createEpisodeSchema.body.validate({
        diagnosis_codes: ['M54.5'],
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('patient_id');
    });

    it('should reject invalid patient_id format', () => {
      const { error } = createEpisodeSchema.body.validate({
        patient_id: 'not-a-uuid',
      });
      expect(error).toBeDefined();
    });
  });

  describe('getPatientEpisodesSchema', () => {
    it('should accept valid patientId param', () => {
      const { error } = getPatientEpisodesSchema.params.validate({
        patientId: validUUID,
      });
      expect(error).toBeUndefined();
    });

    it('should reject missing patientId', () => {
      const { error } = getPatientEpisodesSchema.params.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('getEpisodeSchema', () => {
    it('should accept valid episodeId param', () => {
      const { error } = getEpisodeSchema.params.validate({ episodeId: validUUID });
      expect(error).toBeUndefined();
    });

    it('should reject invalid episodeId', () => {
      const { error } = getEpisodeSchema.params.validate({ episodeId: 'bad' });
      expect(error).toBeDefined();
    });
  });

  describe('updateEpisodeProgressSchema', () => {
    it('should accept valid progress update', () => {
      const { error } = updateEpisodeProgressSchema.body.validate({
        visit_number: 5,
        pain_level: 4,
        functional_improvement: 30,
        notes: 'Patient improving',
      });
      expect(error).toBeUndefined();
    });

    it('should reject pain_level above 10', () => {
      const { error } = updateEpisodeProgressSchema.body.validate({
        pain_level: 12,
      });
      expect(error).toBeDefined();
    });

    it('should reject visit_number below 1', () => {
      const { error } = updateEpisodeProgressSchema.body.validate({
        visit_number: 0,
      });
      expect(error).toBeDefined();
    });

    it('should accept valid episodeId param', () => {
      const { error } = updateEpisodeProgressSchema.params.validate({
        episodeId: validUUID,
      });
      expect(error).toBeUndefined();
    });
  });

  describe('episodeReevalSchema', () => {
    it('should accept valid reeval data', () => {
      const { error } = episodeReevalSchema.body.validate({
        findings: 'Improved ROM',
        recommendation: 'Continue treatment',
        continue_treatment: true,
      });
      expect(error).toBeUndefined();
    });

    it('should accept empty body', () => {
      const { error } = episodeReevalSchema.body.validate({});
      expect(error).toBeUndefined();
    });
  });

  describe('episodeMaintenanceSchema', () => {
    it('should accept valid maintenance data', () => {
      const { error } = episodeMaintenanceSchema.body.validate({
        reason: 'MMI reached',
        frequency: 'Monthly',
      });
      expect(error).toBeUndefined();
    });
  });

  describe('episodeABNSchema', () => {
    it('should accept valid ABN data', () => {
      const { error } = episodeABNSchema.body.validate({
        signed: true,
        signed_date: '2026-01-15T00:00:00.000Z',
        patient_choice: 'proceed',
      });
      expect(error).toBeUndefined();
    });

    it('should reject invalid date format', () => {
      const { error } = episodeABNSchema.body.validate({
        signed_date: 'not-a-date',
      });
      expect(error).toBeDefined();
    });
  });

  describe('episodeDischargeSchema', () => {
    it('should accept valid discharge data', () => {
      const { error } = episodeDischargeSchema.body.validate({
        reason: 'Treatment complete',
        outcome: 'Resolved',
        recommendations: 'Continue exercises',
      });
      expect(error).toBeUndefined();
    });
  });

  // ===========================================================================
  // BILLING MODIFIER
  // ===========================================================================

  describe('getBillingModifierSchema', () => {
    it('should accept valid episodeId and patientId params', () => {
      const { error } = getBillingModifierSchema.params.validate({
        episodeId: validUUID,
        patientId: validUUID,
      });
      expect(error).toBeUndefined();
    });

    it('should reject missing patientId', () => {
      const { error } = getBillingModifierSchema.params.validate({
        episodeId: validUUID,
      });
      expect(error).toBeDefined();
    });

    it('should reject invalid UUID format', () => {
      const { error } = getBillingModifierSchema.params.validate({
        episodeId: 'bad',
        patientId: validUUID,
      });
      expect(error).toBeDefined();
    });
  });

  // ===========================================================================
  // CLAIMS SCHEMAS
  // ===========================================================================

  describe('listClaimsSchema', () => {
    it('should accept empty query (uses defaults)', () => {
      const { error, value } = listClaimsSchema.query.validate({});
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(50);
    });

    it('should accept all filter params', () => {
      const { error } = listClaimsSchema.query.validate({
        page: 2,
        limit: 25,
        status: 'pending',
        patient_id: validUUID,
        payer_id: 'NAV',
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      });
      expect(error).toBeUndefined();
    });

    it('should reject page below 1', () => {
      const { error } = listClaimsSchema.query.validate({ page: 0 });
      expect(error).toBeDefined();
    });

    it('should reject limit above 100', () => {
      const { error } = listClaimsSchema.query.validate({ limit: 200 });
      expect(error).toBeDefined();
    });
  });

  describe('createClaimSchema', () => {
    it('should accept valid claim data', () => {
      const { error } = createClaimSchema.body.validate({
        patient_id: validUUID,
        encounter_id: validUUID,
        episode_id: validUUID,
        line_items: [{ cpt_code: '98941', units: 1, modifier: 'AT' }],
        diagnosis_codes: ['M54.5'],
        notes: 'Standard CMT claim',
      });
      expect(error).toBeUndefined();
    });

    it('should reject missing patient_id', () => {
      const { error } = createClaimSchema.body.validate({
        line_items: [{ cpt_code: '98941', units: 1 }],
      });
      expect(error).toBeDefined();
    });

    it('should reject line_item without cpt_code', () => {
      const { error } = createClaimSchema.body.validate({
        patient_id: validUUID,
        line_items: [{ units: 1 }],
      });
      expect(error).toBeDefined();
    });
  });

  describe('getClaimSchema', () => {
    it('should accept valid claimId', () => {
      const { error } = getClaimSchema.params.validate({ claimId: validUUID });
      expect(error).toBeUndefined();
    });

    it('should reject invalid claimId', () => {
      const { error } = getClaimSchema.params.validate({ claimId: 'xyz' });
      expect(error).toBeDefined();
    });
  });

  describe('updateClaimLineItemsSchema', () => {
    it('should accept valid line items update', () => {
      const { error } = updateClaimLineItemsSchema.body.validate({
        line_items: [{ cpt_code: '98940', units: 1 }],
      });
      expect(error).toBeUndefined();
    });

    it('should reject missing line_items', () => {
      const { error } = updateClaimLineItemsSchema.body.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('submitClaimSchema', () => {
    it('should accept valid claimId param', () => {
      const { error } = submitClaimSchema.params.validate({ claimId: validUUID });
      expect(error).toBeUndefined();
    });
  });

  describe('processRemittanceSchema', () => {
    it('should accept valid remittance data', () => {
      const { error } = processRemittanceSchema.body.validate({
        paid_amount: 75.0,
        adjustment_amount: 10.0,
        adjustment_reason: 'Contractual',
        check_number: 'CHK12345',
        payment_date: '2026-01-20',
      });
      expect(error).toBeUndefined();
    });

    it('should accept valid params', () => {
      const { error } = processRemittanceSchema.params.validate({
        claimId: validUUID,
      });
      expect(error).toBeUndefined();
    });
  });

  describe('appealClaimSchema', () => {
    it('should accept valid appeal data', () => {
      const { error } = appealClaimSchema.body.validate({
        reason: 'Documentation supports medical necessity',
        supporting_docs: ['doc1.pdf', 'doc2.pdf'],
      });
      expect(error).toBeUndefined();
    });

    it('should reject missing reason', () => {
      const { error } = appealClaimSchema.body.validate({
        supporting_docs: ['doc.pdf'],
      });
      expect(error).toBeDefined();
    });
  });

  describe('writeOffClaimSchema', () => {
    it('should accept valid write-off data', () => {
      const { error } = writeOffClaimSchema.body.validate({
        reason: 'Patient hardship',
      });
      expect(error).toBeUndefined();
    });

    it('should reject missing reason', () => {
      const { error } = writeOffClaimSchema.body.validate({});
      expect(error).toBeDefined();
    });
  });

  // ===========================================================================
  // SUGGEST CMT
  // ===========================================================================

  describe('suggestCMTSchema', () => {
    it('should accept 1-2 regions', () => {
      const { error } = suggestCMTSchema.body.validate({ regions_count: 2 });
      expect(error).toBeUndefined();
    });

    it('should accept 5 regions (maximum)', () => {
      const { error } = suggestCMTSchema.body.validate({ regions_count: 5 });
      expect(error).toBeUndefined();
    });

    it('should reject 0 regions', () => {
      const { error } = suggestCMTSchema.body.validate({ regions_count: 0 });
      expect(error).toBeDefined();
    });

    it('should reject regions above 5', () => {
      const { error } = suggestCMTSchema.body.validate({ regions_count: 6 });
      expect(error).toBeDefined();
    });

    it('should reject missing regions_count', () => {
      const { error } = suggestCMTSchema.body.validate({});
      expect(error).toBeDefined();
    });

    it('should reject non-integer regions_count', () => {
      const { error } = suggestCMTSchema.body.validate({ regions_count: 2.5 });
      expect(error).toBeDefined();
    });
  });
});
