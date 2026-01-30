/**
 * Tests for Clinical Encounters Service
 */

import { jest } from '@jest/globals';

// Mock the database
const mockPool = {
  query: jest.fn()
};

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  default: { pool: mockPool }
}));

// Import after mocking
const encountersService = await import('../../../src/services/encounters.js');

describe('Encounters Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEncounter', () => {
    it('should create a new clinical encounter', async () => {
      const mockEncounter = {
        id: 'enc-123',
        patient_id: 'pat-123',
        practitioner_id: 'prac-123',
        encounter_type: 'initial',
        chief_complaint: 'Low back pain',
        subjective: 'Patient reports LBP for 2 weeks',
        objective: 'Tenderness L4-L5, reduced ROM',
        assessment: 'L4-L5 subluxation complex',
        plan: 'Adjustment, home exercises',
        status: 'in_progress'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockEncounter] });

      const result = await encountersService.createEncounter({
        patientId: 'pat-123',
        practitionerId: 'prac-123',
        organizationId: 'org-123',
        encounterType: 'initial',
        chiefComplaint: 'Low back pain'
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('enc-123');
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      await expect(encountersService.createEncounter({}))
        .rejects.toThrow();
    });
  });

  describe('updateSOAPNote', () => {
    it('should update SOAP sections', async () => {
      const mockUpdated = {
        id: 'enc-123',
        subjective: 'Updated subjective',
        objective: 'Updated objective',
        assessment: 'Updated assessment',
        plan: 'Updated plan'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUpdated] });

      const result = await encountersService.updateSOAPNote('enc-123', {
        subjective: 'Updated subjective',
        objective: 'Updated objective',
        assessment: 'Updated assessment',
        plan: 'Updated plan'
      });

      expect(result.subjective).toBe('Updated subjective');
    });

    it('should not allow updates to signed encounters', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'enc-123', signed_at: new Date() }]
      });

      await expect(encountersService.updateSOAPNote('enc-123', { subjective: 'test' }))
        .rejects.toThrow(/signed/i);
    });
  });

  describe('signEncounter', () => {
    it('should sign an encounter and make it immutable', async () => {
      const mockSigned = {
        id: 'enc-123',
        signed_at: new Date(),
        signed_by: 'prac-123'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [{ status: 'completed' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [mockSigned] });

      const result = await encountersService.signEncounter('enc-123', 'prac-123');

      expect(result.signed_at).toBeDefined();
      expect(result.signed_by).toBe('prac-123');
    });

    it('should require completed status before signing', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ status: 'in_progress' }] });

      await expect(encountersService.signEncounter('enc-123', 'prac-123'))
        .rejects.toThrow(/not completed/i);
    });
  });

  describe('addDiagnosis', () => {
    it('should add ICPC-2 diagnosis code', async () => {
      const mockDiagnosis = {
        id: 'diag-123',
        encounter_id: 'enc-123',
        code: 'L03',
        description: 'Low back symptom/complaint',
        code_system: 'ICPC-2',
        is_primary: true
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockDiagnosis] });

      const result = await encountersService.addDiagnosis('enc-123', {
        code: 'L03',
        description: 'Low back symptom/complaint',
        codeSystem: 'ICPC-2',
        isPrimary: true
      });

      expect(result.code).toBe('L03');
      expect(result.is_primary).toBe(true);
    });

    it('should validate ICPC-2 code format', async () => {
      await expect(encountersService.addDiagnosis('enc-123', {
        code: 'INVALID',
        codeSystem: 'ICPC-2'
      })).rejects.toThrow(/invalid code/i);
    });
  });

  describe('addTreatment', () => {
    it('should add treatment with takst code', async () => {
      const mockTreatment = {
        id: 'treat-123',
        encounter_id: 'enc-123',
        code: 'L215',
        description: 'Diversified adjustment',
        region: 'lumbar',
        technique: 'diversified'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockTreatment] });

      const result = await encountersService.addTreatment('enc-123', {
        code: 'L215',
        description: 'Diversified adjustment',
        region: 'lumbar',
        technique: 'diversified'
      });

      expect(result.code).toBe('L215');
      expect(result.technique).toBe('diversified');
    });
  });

  describe('generateClinicalNarrative', () => {
    it('should generate formatted SOAP narrative', async () => {
      const mockEncounter = {
        id: 'enc-123',
        subjective: 'Patient reports LBP',
        objective: 'ROM reduced, tenderness present',
        assessment: 'L4-L5 subluxation',
        plan: 'Adjustment x3/week',
        diagnoses: [{ code: 'L03', description: 'LBP' }],
        treatments: [{ code: 'L215', description: 'Adjustment' }]
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockEncounter] });

      const narrative = await encountersService.generateClinicalNarrative('enc-123');

      expect(narrative).toContain('SUBJECTIVE');
      expect(narrative).toContain('Patient reports LBP');
      expect(narrative).toContain('OBJECTIVE');
      expect(narrative).toContain('ASSESSMENT');
      expect(narrative).toContain('PLAN');
    });
  });
});

describe('SOAP Note Validation', () => {
  describe('validateSOAPContent', () => {
    it('should accept valid SOAP content', () => {
      const validSOAP = {
        subjective: 'Patient reports pain in lower back for 3 days.',
        objective: 'ROM: Flexion 60%, Extension 40%. Tenderness L4-L5.',
        assessment: 'L4-L5 subluxation complex with muscle spasm.',
        plan: '1. Adjustment 2. Ice 15min 3. Return in 2 days'
      };

      expect(() => encountersService.validateSOAPContent(validSOAP)).not.toThrow();
    });

    it('should require minimum content length', () => {
      const shortSOAP = {
        subjective: 'Pain',
        objective: '',
        assessment: '',
        plan: ''
      };

      expect(() => encountersService.validateSOAPContent(shortSOAP))
        .toThrow(/minimum/i);
    });
  });
});

describe('Clinical Measurements', () => {
  describe('recordVASScore', () => {
    it('should record VAS pain score', async () => {
      const mockMeasurement = {
        id: 'meas-123',
        encounter_id: 'enc-123',
        measurement_type: 'VAS',
        value: 7,
        body_region: 'lower_back'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockMeasurement] });

      const result = await encountersService.recordVASScore('enc-123', {
        value: 7,
        bodyRegion: 'lower_back'
      });

      expect(result.value).toBe(7);
      expect(result.measurement_type).toBe('VAS');
    });

    it('should validate VAS score range (0-10)', async () => {
      await expect(encountersService.recordVASScore('enc-123', { value: 11 }))
        .rejects.toThrow(/range/i);

      await expect(encountersService.recordVASScore('enc-123', { value: -1 }))
        .rejects.toThrow(/range/i);
    });
  });

  describe('recordROMFindings', () => {
    it('should record ROM measurements', async () => {
      const mockROM = {
        id: 'rom-123',
        encounter_id: 'enc-123',
        measurement_type: 'ROM',
        region: 'cervical',
        flexion: 60,
        extension: 45,
        rotation_left: 70,
        rotation_right: 75
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockROM] });

      const result = await encountersService.recordROMFindings('enc-123', {
        region: 'cervical',
        flexion: 60,
        extension: 45,
        rotationLeft: 70,
        rotationRight: 75
      });

      expect(result.region).toBe('cervical');
      expect(result.flexion).toBe(60);
    });
  });
});
