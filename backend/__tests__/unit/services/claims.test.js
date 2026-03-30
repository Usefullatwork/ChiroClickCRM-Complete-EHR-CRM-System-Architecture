/**
 * Unit Tests for Claims Service
 * Tests claim creation, submission, status tracking, HELFO/EDI format generation,
 * remittance processing, appeal, and write-off flows.
 */

import { jest } from '@jest/globals';

// Mock database
const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  getClient: jest.fn(),
  default: {
    query: mockQuery,
    transaction: jest.fn(),
    getClient: jest.fn(),
  },
}));

// Mock logger
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock episodes service (getBillingModifier)
const mockGetBillingModifier = jest.fn();

jest.unstable_mockModule('../../../src/services/clinical/episodes.js', () => ({
  getBillingModifier: mockGetBillingModifier,
  default: {
    getBillingModifier: mockGetBillingModifier,
  },
}));

// Import after mocking
const claimsService = await import('../../../src/services/practice/claims.js');

describe('Claims Service', () => {
  const testOrgId = 'org-test-001';
  const testClaimId = 'claim-abc-123';
  const testPatientId = 'patient-xyz-789';
  const testUserId = 'user-provider-001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // CONSTANTS
  // ===========================================================================

  describe('CLAIM_STATUS', () => {
    it('should export all claim statuses', () => {
      const { CLAIM_STATUS } = claimsService;
      expect(CLAIM_STATUS.DRAFT).toBe('DRAFT');
      expect(CLAIM_STATUS.READY).toBe('READY');
      expect(CLAIM_STATUS.SUBMITTED).toBe('SUBMITTED');
      expect(CLAIM_STATUS.ACCEPTED).toBe('ACCEPTED');
      expect(CLAIM_STATUS.REJECTED).toBe('REJECTED');
      expect(CLAIM_STATUS.DENIED).toBe('DENIED');
      expect(CLAIM_STATUS.PENDING).toBe('PENDING');
      expect(CLAIM_STATUS.PAID).toBe('PAID');
      expect(CLAIM_STATUS.PARTIAL).toBe('PARTIAL');
      expect(CLAIM_STATUS.APPEALED).toBe('APPEALED');
      expect(CLAIM_STATUS.WRITTEN_OFF).toBe('WRITTEN_OFF');
    });
  });

  describe('CHIROPRACTIC_CPT_CODES', () => {
    it('should export standard chiropractic CPT codes', () => {
      const { CHIROPRACTIC_CPT_CODES } = claimsService;
      expect(CHIROPRACTIC_CPT_CODES.CMT_1_2_REGIONS).toBe('98940');
      expect(CHIROPRACTIC_CPT_CODES.CMT_3_4_REGIONS).toBe('98941');
      expect(CHIROPRACTIC_CPT_CODES.CMT_5_REGIONS).toBe('98942');
      expect(CHIROPRACTIC_CPT_CODES.EVALUATION_NEW).toBe('99203');
      expect(CHIROPRACTIC_CPT_CODES.THERAPEUTIC_EXERCISE).toBe('97110');
      expect(CHIROPRACTIC_CPT_CODES.MANUAL_THERAPY).toBe('97140');
    });
  });

  describe('MODIFIERS', () => {
    it('should export billing modifiers', () => {
      const { MODIFIERS } = claimsService;
      expect(MODIFIERS.AT).toBe('AT');
      expect(MODIFIERS.GA).toBe('GA');
      expect(MODIFIERS.GZ).toBe('GZ');
      expect(MODIFIERS.GP).toBe('GP');
      expect(MODIFIERS['25']).toBe('25');
      expect(MODIFIERS['59']).toBe('59');
    });
  });

  // ===========================================================================
  // createClaim
  // ===========================================================================

  describe('createClaim', () => {
    const baseClaimData = {
      patient_id: testPatientId,
      encounter_id: 'enc-001',
      service_date: '2026-03-15',
      rendering_provider_id: testUserId,
      payer_name: 'HELFO',
      payer_id: 'HELFO-001',
      subscriber_id: 'SUB-12345',
      diagnosis_codes: [{ code: 'M54.5' }],
      line_items: [{ cpt_code: '98941', charge_amount: 850, units: 1 }],
    };

    it('should create a claim with DRAFT status and return it', async () => {
      const fakeClaim = {
        id: testClaimId,
        organization_id: testOrgId,
        claim_number: 'CLM-202603-00001',
        status: 'DRAFT',
        total_charge: 850,
        ...baseClaimData,
      };

      // generateClaimNumber count query
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      // INSERT query
      mockQuery.mockResolvedValueOnce({ rows: [fakeClaim] });

      const result = await claimsService.createClaim(testOrgId, baseClaimData);

      expect(result).toEqual(fakeClaim);
      expect(result.status).toBe('DRAFT');
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should calculate total_charge from line items', async () => {
      const multiItemData = {
        ...baseClaimData,
        line_items: [
          { cpt_code: '98941', charge_amount: 850, units: 1 },
          { cpt_code: '97140', charge_amount: 400, units: 1 },
        ],
      };

      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: testClaimId,
            total_charge: 1250,
            claim_number: 'CLM-202603-00001',
          },
        ],
      });

      await claimsService.createClaim(testOrgId, multiItemData);

      // The INSERT call is the second query; verify total_charge param (index 14)
      const insertCall = mockQuery.mock.calls[1];
      expect(insertCall[1][14]).toBe(1250); // total_charge
    });

    it('should call getBillingModifier when episode_id is provided', async () => {
      const dataWithEpisode = {
        ...baseClaimData,
        episode_id: 'episode-001',
      };

      mockGetBillingModifier.mockResolvedValueOnce('AT');
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: testClaimId,
            primary_modifier: 'AT',
            claim_number: 'CLM-202603-00001',
          },
        ],
      });

      await claimsService.createClaim(testOrgId, dataWithEpisode);

      expect(mockGetBillingModifier).toHaveBeenCalledWith('episode-001', testPatientId);
    });

    it('should not call getBillingModifier when no episode_id', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: testClaimId,
            claim_number: 'CLM-202603-00001',
          },
        ],
      });

      await claimsService.createClaim(testOrgId, baseClaimData);

      expect(mockGetBillingModifier).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // getClaimById
  // ===========================================================================

  describe('getClaimById', () => {
    it('should return the claim with patient and provider details', async () => {
      const fakeClaim = {
        id: testClaimId,
        organization_id: testOrgId,
        patient_name: 'Ola Nordmann',
        provider_name: 'Dr. Hansen',
      };
      mockQuery.mockResolvedValueOnce({ rows: [fakeClaim] });

      const result = await claimsService.getClaimById(testOrgId, testClaimId);

      expect(result).toEqual(fakeClaim);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM claims c'), [
        testClaimId,
        testOrgId,
      ]);
    });

    it('should return null when claim not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await claimsService.getClaimById(testOrgId, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // getClaims
  // ===========================================================================

  describe('getClaims', () => {
    it('should return claims with pagination', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '2' }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'claim-1', patient_name: 'Patient A' },
          { id: 'claim-2', patient_name: 'Patient B' },
        ],
      });

      const result = await claimsService.getClaims(testOrgId, { page: 1, limit: 50 });

      expect(result.claims).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pages).toBe(1);
    });

    it('should apply status filter when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'claim-1', status: 'SUBMITTED' }],
      });

      await claimsService.getClaims(testOrgId, { status: 'SUBMITTED' });

      // Both count and select queries should include status filter
      const countCall = mockQuery.mock.calls[0];
      expect(countCall[0]).toContain('c.status = $2');
      expect(countCall[1]).toContain('SUBMITTED');
    });

    it('should apply date range filters', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await claimsService.getClaims(testOrgId, {
        start_date: '2026-01-01',
        end_date: '2026-03-31',
      });

      const countCall = mockQuery.mock.calls[0];
      expect(countCall[0]).toContain('c.service_date >= $');
      expect(countCall[0]).toContain('c.service_date <= $');
    });
  });

  // ===========================================================================
  // updateClaimLineItems
  // ===========================================================================

  describe('updateClaimLineItems', () => {
    it('should update line items and recalculate total', async () => {
      const newLineItems = [
        { cpt_code: '98941', charge_amount: 900, units: 1 },
        { cpt_code: '97110', charge_amount: 350, units: 2 },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: testClaimId, total_charge: 1250 }],
      });

      const result = await claimsService.updateClaimLineItems(testOrgId, testClaimId, newLineItems);

      expect(result.id).toBe(testClaimId);
      const callArgs = mockQuery.mock.calls[0][1];
      expect(callArgs[3]).toBe(1250); // total_charge = 900 + 350
    });

    it('should throw when claim not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(claimsService.updateClaimLineItems(testOrgId, 'bad-id', [])).rejects.toThrow(
        'Claim not found'
      );
    });
  });

  // ===========================================================================
  // submitClaim
  // ===========================================================================

  describe('submitClaim', () => {
    const validClaim = {
      id: testClaimId,
      organization_id: testOrgId,
      patient_id: testPatientId,
      payer_id: 'HELFO-001',
      subscriber_id: 'SUB-12345',
      service_date: '2026-03-15',
      rendering_provider_id: testUserId,
      claim_number: 'CLM-202603-00001',
      total_charge: 850,
      place_of_service: '11',
      diagnosis_codes: JSON.stringify([{ code: 'M54.5' }]),
      line_items: JSON.stringify([{ cpt_code: '98941', charge_amount: 850, units: 1 }]),
    };

    it('should submit a valid claim and generate EDI 837P data', async () => {
      // getClaimById query
      mockQuery.mockResolvedValueOnce({ rows: [validClaim] });
      // UPDATE to SUBMITTED
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...validClaim, status: 'SUBMITTED' }],
      });

      const result = await claimsService.submitClaim(testOrgId, testClaimId, testUserId);

      expect(result.status).toBe('SUBMITTED');
      // Verify the UPDATE query includes edi_837_data
      const updateCall = mockQuery.mock.calls[1];
      expect(updateCall[0]).toContain('edi_837_data');
      expect(updateCall[1][3]).toContain('ISA*'); // EDI data starts with ISA
    });

    it('should throw when claim not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(claimsService.submitClaim(testOrgId, testClaimId, testUserId)).rejects.toThrow(
        'Claim not found'
      );
    });

    it('should throw validation error when required fields missing', async () => {
      const incompleteClaim = {
        ...validClaim,
        payer_id: null,
        subscriber_id: null,
        diagnosis_codes: '[]',
        line_items: '[]',
      };
      mockQuery.mockResolvedValueOnce({ rows: [incompleteClaim] });

      await expect(claimsService.submitClaim(testOrgId, testClaimId, testUserId)).rejects.toThrow(
        'Claim validation failed'
      );
    });

    it('should include diagnosis codes in EDI 837P output', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [validClaim] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...validClaim, status: 'SUBMITTED' }],
      });

      await claimsService.submitClaim(testOrgId, testClaimId, testUserId);

      const updateCall = mockQuery.mock.calls[1];
      const ediData = updateCall[1][3];
      expect(ediData).toContain('HI*ABK:M54.5');
    });

    it('should include line items in EDI 837P output', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [validClaim] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...validClaim, status: 'SUBMITTED' }],
      });

      await claimsService.submitClaim(testOrgId, testClaimId, testUserId);

      const updateCall = mockQuery.mock.calls[1];
      const ediData = updateCall[1][3];
      expect(ediData).toContain('SV1*HC:98941');
      expect(ediData).toContain('LX*1');
    });
  });

  // ===========================================================================
  // processRemittance
  // ===========================================================================

  describe('processRemittance', () => {
    it('should set status to PAID when fully paid', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: testClaimId,
            status: 'PAID',
            total_paid: 850,
          },
        ],
      });

      const result = await claimsService.processRemittance(testOrgId, testClaimId, {
        total_allowed: 850,
        total_paid: 850,
        total_adjustment: 0,
        patient_responsibility: 0,
        payment_date: '2026-03-20',
      });

      expect(result.status).toBe('PAID');
      const callArgs = mockQuery.mock.calls[0][1];
      expect(callArgs[2]).toBe('PAID'); // newStatus param
    });

    it('should set status to DENIED when no payment and denial codes exist', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: testClaimId,
            status: 'DENIED',
            total_paid: 0,
          },
        ],
      });

      const result = await claimsService.processRemittance(testOrgId, testClaimId, {
        total_allowed: 850,
        total_paid: 0,
        total_adjustment: 850,
        patient_responsibility: 0,
        payment_date: '2026-03-20',
        denial_reason_codes: ['CO-97'],
      });

      expect(result.status).toBe('DENIED');
      const callArgs = mockQuery.mock.calls[0][1];
      expect(callArgs[2]).toBe('DENIED');
    });

    it('should set status to PARTIAL when paid less than allowed', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: testClaimId,
            status: 'PARTIAL',
            total_paid: 500,
          },
        ],
      });

      const result = await claimsService.processRemittance(testOrgId, testClaimId, {
        total_allowed: 850,
        total_paid: 500,
        total_adjustment: 200,
        patient_responsibility: 150,
        payment_date: '2026-03-20',
      });

      expect(result.status).toBe('PARTIAL');
      const callArgs = mockQuery.mock.calls[0][1];
      expect(callArgs[2]).toBe('PARTIAL');
    });

    it('should throw when claim not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        claimsService.processRemittance(testOrgId, 'bad-id', {
          total_allowed: 0,
          total_paid: 0,
          total_adjustment: 0,
          patient_responsibility: 0,
          payment_date: '2026-03-20',
        })
      ).rejects.toThrow('Claim not found');
    });
  });

  // ===========================================================================
  // getClaimsSummary
  // ===========================================================================

  describe('getClaimsSummary', () => {
    it('should return summary rows for the organization', async () => {
      const summaryRows = [
        { status: 'SUBMITTED', claim_count: 5, total_charges: 4250 },
        { status: 'PAID', claim_count: 10, total_charges: 8500 },
      ];
      mockQuery.mockResolvedValueOnce({ rows: summaryRows });

      const result = await claimsService.getClaimsSummary(testOrgId);

      expect(result).toEqual(summaryRows);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('claims_summary'), [
        testOrgId,
      ]);
    });
  });

  // ===========================================================================
  // getOutstandingClaims
  // ===========================================================================

  describe('getOutstandingClaims', () => {
    it('should return outstanding claims for the organization', async () => {
      const outstandingRows = [{ id: 'claim-1', days_outstanding: 30, total_charge: 850 }];
      mockQuery.mockResolvedValueOnce({ rows: outstandingRows });

      const result = await claimsService.getOutstandingClaims(testOrgId);

      expect(result).toEqual(outstandingRows);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('outstanding_claims'), [
        testOrgId,
      ]);
    });
  });

  // ===========================================================================
  // getSuggestedCMTCode
  // ===========================================================================

  describe('getSuggestedCMTCode', () => {
    it('should return CPT code based on region count', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ cpt_code: '98941' }] });

      const result = await claimsService.getSuggestedCMTCode(3);

      expect(result).toBe('98941');
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('suggest_cmt_code'), [3]);
    });
  });

  // ===========================================================================
  // appealClaim
  // ===========================================================================

  describe('appealClaim', () => {
    it('should set claim status to APPEALED with notes', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: testClaimId,
            status: 'APPEALED',
            appeal_notes: 'Additional documentation provided',
          },
        ],
      });

      const result = await claimsService.appealClaim(testOrgId, testClaimId, {
        appeal_notes: 'Additional documentation provided',
        appeal_deadline: '2026-04-15',
      });

      expect(result.status).toBe('APPEALED');
      const callArgs = mockQuery.mock.calls[0][1];
      expect(callArgs[2]).toBe('Additional documentation provided');
      expect(callArgs[3]).toBe('2026-04-15');
    });

    it('should throw when claim not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        claimsService.appealClaim(testOrgId, 'bad-id', { appeal_notes: 'test' })
      ).rejects.toThrow('Claim not found');
    });
  });

  // ===========================================================================
  // writeOffClaim
  // ===========================================================================

  describe('writeOffClaim', () => {
    it('should set claim status to WRITTEN_OFF with reason', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: testClaimId,
            status: 'WRITTEN_OFF',
            denial_notes: 'Patient hardship',
          },
        ],
      });

      const result = await claimsService.writeOffClaim(testOrgId, testClaimId, 'Patient hardship');

      expect(result.status).toBe('WRITTEN_OFF');
      const callArgs = mockQuery.mock.calls[0][1];
      expect(callArgs[2]).toBe('Patient hardship');
    });

    it('should throw when claim not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(claimsService.writeOffClaim(testOrgId, 'bad-id', 'reason')).rejects.toThrow(
        'Claim not found'
      );
    });
  });
});
