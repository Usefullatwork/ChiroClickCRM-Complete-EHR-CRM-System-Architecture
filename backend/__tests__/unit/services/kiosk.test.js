/**
 * Unit Tests for Kiosk, Macros, and Search Services
 * Tests kiosk check-in flow, macro expansion/CRUD, search indexing/query
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

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/utils/errors.js', () => {
  class NotFoundError extends Error {
    constructor(entity, id) {
      super(`${entity} not found: ${id}`);
      this.name = 'NotFoundError';
      this.entity = entity;
      this.entityId = id;
    }
  }
  class BusinessLogicError extends Error {
    constructor(message) {
      super(message);
      this.name = 'BusinessLogicError';
    }
  }
  return { NotFoundError, BusinessLogicError };
});

const mockHybridCache = {
  get: jest.fn(),
  set: jest.fn(),
};

jest.unstable_mockModule('../../../src/utils/hybridCache.js', () => ({
  default: mockHybridCache,
  CacheKeys: {
    patientSearch: (orgId, q) => `patient:search:${orgId}:${q.toLowerCase()}`,
    diagnosisSearch: (q) => `diagnosis:search:${q.toLowerCase()}`,
  },
}));

// Import after mocking
const { checkIn, getIntakeForm, submitIntakeForm, submitConsent, getQueue } =
  await import('../../../src/services/kiosk.js');

const { macroService } = await import('../../../src/services/macros.js');

const { searchPatients, searchDiagnosis, searchEncounters, globalSearch, suggestCompletions } =
  await import('../../../src/services/search.js');

const { NotFoundError, BusinessLogicError } = await import('../../../src/utils/errors.js');

// ===========================================================================
// KIOSK SERVICE
// ===========================================================================

describe('Kiosk Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHybridCache.get.mockResolvedValue(null);
    mockHybridCache.set.mockResolvedValue(undefined);
  });

  describe('checkIn', () => {
    it('should check in a patient and return queue position', async () => {
      const apptRow = {
        id: 'appt-1',
        patient_id: 'pat-1',
        status: 'scheduled',
        practitioner_id: 'prac-1',
        start_time: '2026-03-27T09:00:00Z',
        end_time: '2026-03-27T09:30:00Z',
        appointment_type: 'FOLLOW_UP',
        first_name: 'Ola',
        last_name: 'Nordmann',
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [apptRow] }) // SELECT appointment
        .mockResolvedValueOnce({ rows: [] }) // UPDATE status
        .mockResolvedValueOnce({ rows: [{ position: '2' }] }); // COUNT queue

      const result = await checkIn('pat-1', 'appt-1');

      expect(result.checkedIn).toBe(true);
      expect(result.queuePosition).toBe(3);
      expect(result.appointment.id).toBe('appt-1');
      expect(result.appointment.patientName).toBe('Ola Nordmann');
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it('should throw NotFoundError when appointment does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(checkIn('pat-1', 'appt-999')).rejects.toThrow(NotFoundError);
    });

    it('should throw BusinessLogicError when already checked in', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'appt-1', status: 'checked_in', practitioner_id: 'prac-1' }],
      });

      await expect(checkIn('pat-1', 'appt-1')).rejects.toThrow(BusinessLogicError);
    });

    it('should throw BusinessLogicError when appointment is completed', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'appt-1', status: 'completed', practitioner_id: 'prac-1' }],
      });

      await expect(checkIn('pat-1', 'appt-1')).rejects.toThrow(BusinessLogicError);
    });
  });

  describe('getIntakeForm', () => {
    const patientRow = {
      id: 'pat-1',
      first_name: 'Kari',
      last_name: 'Hansen',
      date_of_birth: '1985-06-15',
      email: 'kari@example.com',
      phone: '+4712345678',
      allergies: ['Penicillin'],
      current_medications: [],
      red_flags: null,
      contraindications: null,
      emergency_contact_name: 'Per Hansen',
      emergency_contact_phone: '+4787654321',
    };

    it('should return intake form with prefilled patient data', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [patientRow] });

      const result = await getIntakeForm('pat-1');

      expect(result.patientInfo.name).toBe('Kari Hansen');
      expect(result.form.sections).toBeInstanceOf(Array);
      expect(result.form.sections.length).toBeGreaterThanOrEqual(4);
      expect(result.form.encounterType).toBe('FOLLOW_UP');
    });

    it('should add vestibular section when encounterType is VESTIBULAR', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [patientRow] });

      const result = await getIntakeForm('pat-1', 'VESTIBULAR');

      const vestSection = result.form.sections.find((s) => s.id === 'vestibular');
      expect(vestSection).toBeDefined();
      expect(vestSection.title).toBe('Svimmelhet');
    });

    it('should throw NotFoundError when patient does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(getIntakeForm('pat-999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('submitIntakeForm', () => {
    it('should store intake form and detect red flags', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'pat-1', organization_id: 'org-1' }] }) // patient check
        .mockResolvedValueOnce({ rows: [] }) // INSERT intake form
        .mockResolvedValueOnce({ rows: [] }); // UPDATE red_flags

      const formData = { weight_loss: true, night_pain: true, fever: false };
      const result = await submitIntakeForm('pat-1', formData);

      expect(result.stored).toBe(true);
      expect(result.redFlagsDetected).toContain('weight_loss');
      expect(result.redFlagsDetected).toContain('night_pain');
      expect(result.redFlagsDetected).not.toContain('fever');
    });

    it('should throw NotFoundError when patient does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(submitIntakeForm('pat-999', {})).rejects.toThrow(NotFoundError);
    });
  });

  describe('submitConsent', () => {
    it('should store consent and return signed timestamp', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'pat-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await submitConsent('pat-1', 'treatment', 'base64sig==');

      expect(result.stored).toBe(true);
      expect(result.consentType).toBe('treatment');
      expect(result.signedAt).toBeInstanceOf(Date);
    });

    it('should throw BusinessLogicError when signature is missing', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'pat-1' }] });

      await expect(submitConsent('pat-1', 'treatment', '')).rejects.toThrow(BusinessLogicError);
    });
  });

  describe('getQueue', () => {
    it('should return ordered queue for a practitioner', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            appointment_id: 'appt-1',
            patient_id: 'pat-1',
            patient_name: 'Ola Nordmann',
            start_time: '2026-03-27T09:00:00Z',
            end_time: '2026-03-27T09:30:00Z',
            status: 'checked_in',
            checked_in_at: '2026-03-27T08:50:00Z',
            appointment_type: 'INITIAL',
          },
          {
            appointment_id: 'appt-2',
            patient_id: 'pat-2',
            patient_name: 'Kari Hansen',
            start_time: '2026-03-27T09:30:00Z',
            end_time: '2026-03-27T10:00:00Z',
            status: 'scheduled',
            checked_in_at: null,
            appointment_type: 'FOLLOW_UP',
          },
        ],
      });

      const result = await getQueue('prac-1');

      expect(result).toHaveLength(2);
      expect(result[0].position).toBe(1);
      expect(result[0].patientName).toBe('Ola Nordmann');
      expect(result[1].position).toBe(2);
      expect(result[1].status).toBe('scheduled');
    });
  });
});

// ===========================================================================
// MACROS SERVICE
// ===========================================================================

describe('Macros Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    macroService.cache.clear();
  });

  describe('expandMacro', () => {
    it('should expand patient variables in macro text', () => {
      const ctx = {
        patient: { first_name: 'Ola', last_name: 'Nordmann', gender: 'M' },
      };

      const result = macroService.expandMacro(
        'Pasient: {{patient.fullName}}, {{patient.pronoun}} rapporterer smerter.',
        ctx
      );

      expect(result).toContain('Ola Nordmann');
      expect(result).toContain('Han');
    });

    it('should handle conditional blocks', () => {
      const ctx = { patient: { isNew: true } };

      const text = '{{#if patient.isNew}}Ny pasient opprettet.{{/if}} Velkommen.';
      const result = macroService.expandMacro(text, ctx);

      expect(result).toContain('Ny pasient opprettet.');
      expect(result).toContain('Velkommen.');
    });

    it('should remove conditional block when condition is false', () => {
      const ctx = { patient: { isNew: false } };

      const text = '{{#if patient.isNew}}Ny pasient opprettet.{{/if}} Velkommen.';
      const result = macroService.expandMacro(text, ctx);

      expect(result).not.toContain('Ny pasient opprettet.');
      expect(result).toContain('Velkommen.');
    });
  });

  describe('getMacroMatrix', () => {
    it('should load macros from DB and organize by category', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'm-1',
            category: 'Spine',
            subcategory: null,
            macro_name: 'Lumbar HVLA',
            macro_text: 'HVLA L4/L5 utfort.',
            shortcut_key: 'F1',
            soap_section: 'P',
            is_favorite: false,
            usage_count: 10,
            display_order: 1,
          },
          {
            id: 'm-2',
            category: 'Spine',
            subcategory: 'Cervical',
            macro_name: 'Cervical mobilisering',
            macro_text: 'Mobilisering C3-C5.',
            shortcut_key: 'F2',
            soap_section: 'P',
            is_favorite: true,
            usage_count: 25,
            display_order: 2,
          },
        ],
      });

      const matrix = await macroService.getMacroMatrix('org-1');

      expect(matrix.Spine).toBeDefined();
      expect(matrix.Spine.macros).toHaveLength(1);
      expect(matrix.Spine.subcategories.Cervical).toHaveLength(1);
      expect(matrix.Spine.macros[0].name).toBe('Lumbar HVLA');
    });

    it('should return cached macros on second call', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await macroService.getMacroMatrix('org-1');
      const second = await macroService.getMacroMatrix('org-1');

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(second).toBeDefined();
    });
  });

  describe('createMacro', () => {
    it('should insert a new macro and invalidate cache', async () => {
      const newRow = {
        id: 'm-new',
        organization_id: 'org-1',
        category: 'Shoulder',
        macro_name: 'Supraspinatus test',
        macro_text: 'Positiv supraspinatus test venstre.',
      };
      mockQuery.mockResolvedValueOnce({ rows: [newRow] });

      // Pre-fill cache
      macroService.cache.set('macros:org-1', { data: {}, timestamp: Date.now() });

      const result = await macroService.createMacro('org-1', {
        category: 'Shoulder',
        name: 'Supraspinatus test',
        text: 'Positiv supraspinatus test venstre.',
        soapSection: 'O',
        createdBy: 'user-1',
      });

      expect(result.id).toBe('m-new');
      expect(macroService.cache.has('macros:org-1')).toBe(false);
    });
  });

  describe('deleteMacro', () => {
    it('should soft-delete a macro and invalidate cache', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'm-1' }] });
      macroService.cache.set('macros:org-1', { data: {}, timestamp: Date.now() });

      const result = await macroService.deleteMacro('org-1', 'm-1');

      expect(result.id).toBe('m-1');
      expect(macroService.cache.has('macros:org-1')).toBe(false);
    });
  });

  describe('searchMacros', () => {
    it('should return matching macros ordered by usage', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'm-1',
            category: 'Spine',
            macro_name: 'Lumbar',
            macro_text: 'L4/L5',
            soap_section: 'P',
          },
        ],
      });

      const results = await macroService.searchMacros('org-1', 'Lumbar');

      expect(results).toHaveLength(1);
      expect(results[0].macro_name).toBe('Lumbar');
    });
  });
});

// ===========================================================================
// SEARCH SERVICE
// ===========================================================================

describe('Search Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHybridCache.get.mockResolvedValue(null);
    mockHybridCache.set.mockResolvedValue(undefined);
  });

  describe('searchPatients', () => {
    it('should return patients matching full-text search', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'pat-1',
              first_name: 'Ola',
              last_name: 'Nordmann',
              rank: 0.8,
              headline: '<mark>Ola</mark>',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const result = await searchPatients('org-1', 'Ola');

      expect(result.patients).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.query).toBe('Ola');
    });

    it('should return empty results for empty search term', async () => {
      const result = await searchPatients('org-1', '');

      expect(result.patients).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return cached results when available', async () => {
      mockHybridCache.get.mockResolvedValueOnce({
        patients: [{ id: 'pat-cached' }],
        total: 1,
        query: 'test',
      });

      const result = await searchPatients('org-1', 'test');

      expect(result.patients[0].id).toBe('pat-cached');
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should fall back to ILIKE search when full-text fails', async () => {
      // Full-text search throws
      mockQuery
        .mockRejectedValueOnce(new Error('search_vector column missing'))
        // Fallback ILIKE query
        .mockResolvedValueOnce({
          rows: [{ id: 'pat-fb', first_name: 'Ola', last_name: 'Nordmann' }],
        });

      const result = await searchPatients('org-1', 'Ola');

      expect(result.patients).toHaveLength(1);
      expect(result.fallback).toBe(true);
    });
  });

  describe('searchDiagnosis', () => {
    it('should return matching diagnosis codes', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ code: 'L03', description_no: 'Korsryggsymptomer', system: 'ICPC-2', rank: 0.9 }],
      });

      const result = await searchDiagnosis('korsrygg');

      expect(result.codes).toHaveLength(1);
      expect(result.codes[0].code).toBe('L03');
    });

    it('should return empty results for blank search', async () => {
      const result = await searchDiagnosis('   ');

      expect(result.codes).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('searchEncounters', () => {
    it('should return matching encounters with patient info', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'enc-1',
            patient_id: 'pat-1',
            encounter_date: '2026-03-20',
            encounter_type: 'FOLLOW_UP',
            patient_first_name: 'Ola',
            patient_last_name: 'Nordmann',
            rank: 0.7,
            headline: 'Smerter i <mark>korsrygg</mark>',
          },
        ],
      });

      const result = await searchEncounters('org-1', 'korsrygg');

      expect(result.encounters).toHaveLength(1);
      expect(result.encounters[0].patient_first_name).toBe('Ola');
    });

    it('should return empty results for blank query', async () => {
      const result = await searchEncounters('org-1', '');

      expect(result.encounters).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('suggestCompletions', () => {
    it('should return patient name suggestions for prefix', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ suggestion: 'Ola' }, { suggestion: 'Olav' }],
      });

      const result = await suggestCompletions('org-1', 'Ol');

      expect(result).toEqual(['Ola', 'Olav']);
    });

    it('should return empty array when prefix is too short', async () => {
      const result = await suggestCompletions('org-1', 'O');

      expect(result).toEqual([]);
    });
  });
});
