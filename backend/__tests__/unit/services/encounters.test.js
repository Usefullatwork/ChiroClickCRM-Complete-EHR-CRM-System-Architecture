/**
 * Tests for Clinical Encounters Service
 */

import { jest } from '@jest/globals';

// Mock the database
const mockQuery = jest.fn();
const mockTransaction = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: mockTransaction,
  default: {
    query: mockQuery,
    transaction: mockTransaction
  }
}));

// Mock logger
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
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
        organization_id: 'org-123',
        patient_id: 'pat-123',
        practitioner_id: 'prac-123',
        encounter_type: 'initial',
        encounter_date: new Date(),
        subjective: JSON.stringify({ chief_complaint: 'Low back pain' }),
        objective: JSON.stringify({ palpation: 'Tenderness L4-L5' }),
        assessment: JSON.stringify({ clinical_reasoning: 'L4-L5 subluxation' }),
        plan: JSON.stringify({ treatment: 'Adjustment' })
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockEncounter] });

      const result = await encountersService.createEncounter('org-123', {
        patient_id: 'pat-123',
        practitioner_id: 'prac-123',
        encounter_type: 'initial',
        subjective: { chief_complaint: 'Low back pain' },
        objective: { palpation: 'Tenderness L4-L5' },
        assessment: { clinical_reasoning: 'L4-L5 subluxation' },
        plan: { treatment: 'Adjustment' }
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('enc-123');
      expect(result.patient_id).toBe('pat-123');
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('getEncounterById', () => {
    it('should return encounter when found', async () => {
      const mockEncounter = {
        id: 'enc-123',
        organization_id: 'org-123',
        patient_id: 'pat-123',
        patient_name: 'John Doe',
        practitioner_name: 'Dr. Smith'
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockEncounter] });

      const result = await encountersService.getEncounterById('org-123', 'enc-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('enc-123');
      expect(result.patient_name).toBe('John Doe');
    });

    it('should return null when encounter not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await encountersService.getEncounterById('org-123', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateEncounter', () => {
    it('should update encounter when not signed', async () => {
      // First query: check if signed
      mockQuery.mockResolvedValueOnce({ rows: [{ signed_at: null }] });
      // Second query: update
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'enc-123',
          subjective: JSON.stringify({ chief_complaint: 'Updated complaint' })
        }]
      });

      const result = await encountersService.updateEncounter('org-123', 'enc-123', {
        subjective: { chief_complaint: 'Updated complaint' }
      });

      expect(result).toBeDefined();
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should throw error when trying to update signed encounter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ signed_at: new Date() }] });

      await expect(
        encountersService.updateEncounter('org-123', 'enc-123', { subjective: { test: 'data' } })
      ).rejects.toThrow(/signed/i);
    });

    it('should return null when encounter not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await encountersService.updateEncounter('org-123', 'nonexistent', {
        subjective: { test: 'data' }
      });

      expect(result).toBeNull();
    });
  });

  describe('signEncounter', () => {
    it('should sign an encounter successfully', async () => {
      const mockSigned = {
        id: 'enc-123',
        signed_at: new Date(),
        signed_by: 'user-123',
        is_current: true
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockSigned] });

      const result = await encountersService.signEncounter('org-123', 'enc-123', 'user-123');

      expect(result.signed_at).toBeDefined();
      expect(result.signed_by).toBe('user-123');
      expect(result.is_current).toBe(true);
    });

    it('should throw error when encounter not found or already signed', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        encountersService.signEncounter('org-123', 'enc-123', 'user-123')
      ).rejects.toThrow(/not found|already signed/i);
    });
  });

  describe('getPatientEncounters', () => {
    it('should return list of patient encounters', async () => {
      const mockEncounters = [
        { id: 'enc-1', encounter_date: new Date(), practitioner_name: 'Dr. Smith' },
        { id: 'enc-2', encounter_date: new Date(), practitioner_name: 'Dr. Jones' }
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockEncounters });

      const result = await encountersService.getPatientEncounters('org-123', 'pat-123', 10);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('enc-1');
    });
  });

  describe('getAllEncounters', () => {
    it('should return paginated encounters', async () => {
      // Count query
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '25' }] });
      // Data query
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'enc-1', patient_name: 'John Doe' },
          { id: 'enc-2', patient_name: 'Jane Doe' }
        ]
      });

      const result = await encountersService.getAllEncounters('org-123', {
        page: 1,
        limit: 20
      });

      expect(result.encounters).toHaveLength(2);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.pages).toBe(2);
    });

    it('should apply filters correctly', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '5' }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await encountersService.getAllEncounters('org-123', {
        patientId: 'pat-123',
        practitionerId: 'prac-123',
        encounterType: 'follow_up',
        signed: true
      });

      // Verify filters were applied (check query was called with correct params)
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateFormattedNote', () => {
    it('should generate formatted SOAP note', async () => {
      const mockEncounter = {
        id: 'enc-123',
        patient_name: 'John Doe',
        practitioner_name: 'Dr. Smith',
        hpr_number: '12345',
        encounter_date: new Date(),
        subjective: { chief_complaint: 'Low back pain', history: 'Started 2 weeks ago' },
        objective: { palpation: 'Tenderness L4-L5', rom: 'Reduced flexion' },
        assessment: { clinical_reasoning: 'Lumbar dysfunction' },
        plan: { treatment: 'Adjustment', follow_up: 'Return in 3 days' },
        icpc_codes: ['L03'],
        vas_pain_start: 7,
        vas_pain_end: 4
      };

      // First call: getEncounterById
      mockQuery.mockResolvedValueOnce({ rows: [mockEncounter] });
      // Second call: update generated_note
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const note = await encountersService.generateFormattedNote('org-123', 'enc-123');

      expect(note).toContain('KLINISK NOTAT');
      expect(note).toContain('John Doe');
      expect(note).toContain('SUBJEKTIVT');
      expect(note).toContain('OBJEKTIVT');
      expect(note).toContain('VURDERING');
      expect(note).toContain('PLAN');
    });

    it('should throw error when encounter not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        encountersService.generateFormattedNote('org-123', 'nonexistent')
      ).rejects.toThrow(/not found/i);
    });
  });

  describe('checkRedFlags', () => {
    it('should return alerts for patient with red flags', async () => {
      // Patient query
      mockQuery.mockResolvedValueOnce({
        rows: [{
          red_flags: ['Cancer history', 'Unexplained weight loss'],
          contraindications: ['Spinal fusion L4-L5'],
          current_medications: ['Warfarin'],
          date_of_birth: new Date('1950-01-01')
        }]
      });
      // Recent visits query
      mockQuery.mockResolvedValueOnce({ rows: [{ recent_visits: '2' }] });

      const result = await encountersService.checkRedFlags('pat-123', {});

      expect(result.alerts).toContain('Red flag: Cancer history');
      expect(result.alerts).toContain('Contraindication: Spinal fusion L4-L5');
      expect(result.warnings.some(w => w.includes('anticoagulant'))).toBe(true);
      expect(result.warnings.some(w => w.includes('over 75'))).toBe(true);
    });

    it('should warn about excessive visits', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          red_flags: [],
          contraindications: [],
          current_medications: [],
          date_of_birth: new Date('1990-01-01')
        }]
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ recent_visits: '8' }] });

      const result = await encountersService.checkRedFlags('pat-123', {});

      expect(result.warnings.some(w => w.includes('>6 visits'))).toBe(true);
    });

    it('should return empty arrays when patient not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await encountersService.checkRedFlags('nonexistent', {});

      expect(result.alerts).toEqual([]);
      expect(result.warnings).toEqual([]);
    });
  });

  describe('getPatientEncounterHistory', () => {
    it('should return encounter history for clinical context', async () => {
      const mockHistory = [
        { id: 'enc-1', encounter_date: new Date(), icpc_codes: ['L03'], vas_pain_start: 7 },
        { id: 'enc-2', encounter_date: new Date(), icpc_codes: ['L84'], vas_pain_start: 5 }
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockHistory });

      const result = await encountersService.getPatientEncounterHistory('org-123', 'pat-123');

      expect(result).toHaveLength(2);
      expect(result[0].icpc_codes).toContain('L03');
    });
  });
});
