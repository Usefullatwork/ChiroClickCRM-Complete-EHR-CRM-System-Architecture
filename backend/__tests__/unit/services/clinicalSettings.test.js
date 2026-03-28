/**
 * Tests for Clinical Settings Service
 * Tests get/update/reset settings, template defaults, validation, organization isolation
 */

import { jest } from '@jest/globals';

// Mock database
const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  getClient: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue(true),
  closePool: jest.fn(),
  setTenantContext: jest.fn(),
  clearTenantContext: jest.fn(),
  queryWithTenant: jest.fn(),
  default: {
    query: mockQuery,
    transaction: jest.fn(),
    getClient: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
    closePool: jest.fn(),
    setTenantContext: jest.fn(),
    clearTenantContext: jest.fn(),
    queryWithTenant: jest.fn(),
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

// Dynamic import after mocks
const {
  DEFAULT_CLINICAL_SETTINGS,
  getClinicalSettings,
  updateClinicalSettings,
  resetClinicalSettings,
  getAdjustmentNotationTemplates,
} = await import('../../../src/services/clinicalSettings.js');

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const ORG_ID_2 = '22222222-2222-2222-2222-222222222222';

describe('Clinical Settings Service', () => {
  // ============================================================
  // DEFAULT_CLINICAL_SETTINGS structure
  // ============================================================
  describe('DEFAULT_CLINICAL_SETTINGS', () => {
    it('should have all top-level sections', () => {
      expect(DEFAULT_CLINICAL_SETTINGS).toHaveProperty('adjustment');
      expect(DEFAULT_CLINICAL_SETTINGS).toHaveProperty('tests');
      expect(DEFAULT_CLINICAL_SETTINGS).toHaveProperty('letters');
      expect(DEFAULT_CLINICAL_SETTINGS).toHaveProperty('soap');
      expect(DEFAULT_CLINICAL_SETTINGS).toHaveProperty('ai');
      expect(DEFAULT_CLINICAL_SETTINGS).toHaveProperty('display');
    });

    it('should default adjustment style to segment_listing', () => {
      expect(DEFAULT_CLINICAL_SETTINGS.adjustment.style).toBe('segment_listing');
    });

    it('should include Gonstead listings for posterior rotation, sacrum, and pelvis', () => {
      const gonstead = DEFAULT_CLINICAL_SETTINGS.adjustment.gonstead;
      expect(gonstead.listings.posteriorRotation).toEqual(
        expect.arrayContaining(['PR', 'PL', 'PRS', 'PLS', 'PRI', 'PLI'])
      );
      expect(gonstead.listings.sacrum).toEqual(expect.arrayContaining(['AS', 'AI', 'PI', 'PS']));
      expect(gonstead.listings.pelvis).toEqual(expect.arrayContaining(['PI', 'AS', 'IN', 'EX']));
    });

    it('should default SOAP pain scale to VAS and diagnosis system to both', () => {
      expect(DEFAULT_CLINICAL_SETTINGS.soap.subjective.painScaleType).toBe('vas');
      expect(DEFAULT_CLINICAL_SETTINGS.soap.assessment.diagnosisSystem).toBe('both');
    });

    it('should default letter date format to norwegian', () => {
      expect(DEFAULT_CLINICAL_SETTINGS.letters.defaultStructure.dateFormat).toBe('norwegian');
    });
  });

  // ============================================================
  // getClinicalSettings
  // ============================================================
  describe('getClinicalSettings', () => {
    it('should return defaults when organization has no saved settings', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ clinical_settings: null }],
      });

      const result = await getClinicalSettings(ORG_ID);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('clinical'), [ORG_ID]);
      expect(result.adjustment.style).toBe('segment_listing');
      expect(result.soap.subjective.painScaleType).toBe('vas');
      expect(result.display.language).toBe('no');
    });

    it('should deep merge saved settings with defaults', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            clinical_settings: {
              adjustment: { style: 'gonstead' },
              display: { language: 'en' },
            },
          },
        ],
      });

      const result = await getClinicalSettings(ORG_ID);

      // Overridden values
      expect(result.adjustment.style).toBe('gonstead');
      expect(result.display.language).toBe('en');

      // Default values still present (not wiped by partial override)
      expect(result.adjustment.gonstead.useFullNotation).toBe(true);
      expect(result.soap.subjective.painScaleType).toBe('vas');
      expect(result.tests.orthopedic.resultFormat).toBe('plus_minus');
    });

    it('should throw when organization is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(getClinicalSettings(ORG_ID)).rejects.toThrow('Organization not found');
    });
  });

  // ============================================================
  // updateClinicalSettings
  // ============================================================
  describe('updateClinicalSettings', () => {
    it('should merge partial settings and return merged result with defaults', async () => {
      // First call: SELECT current settings
      mockQuery.mockResolvedValueOnce({
        rows: [{ settings: { clinical: { adjustment: { style: 'gonstead' } } } }],
      });
      // Second call: UPDATE returning new clinical settings
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            clinical_settings: {
              adjustment: { style: 'gonstead' },
              display: { language: 'en' },
            },
          },
        ],
      });

      const result = await updateClinicalSettings(ORG_ID, { display: { language: 'en' } });

      // Verify UPDATE query called with merged JSON
      expect(mockQuery).toHaveBeenCalledTimes(2);
      const updateCall = mockQuery.mock.calls[1];
      expect(updateCall[0]).toContain('UPDATE');
      const parsedPayload = JSON.parse(updateCall[1][0]);
      expect(parsedPayload.display.language).toBe('en');
      expect(updateCall[1][1]).toBe(ORG_ID);

      // Result merges with defaults
      expect(result.adjustment.style).toBe('gonstead');
      expect(result.display.language).toBe('en');
      expect(result.soap).toBeDefined();
    });

    it('should throw when organization is not found on update', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(updateClinicalSettings(ORG_ID, { display: { language: 'en' } })).rejects.toThrow(
        'Organization not found'
      );
    });

    it('should handle update when org has no prior settings', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ settings: null }],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            clinical_settings: {
              adjustment: { style: 'diversified' },
            },
          },
        ],
      });

      const result = await updateClinicalSettings(ORG_ID, {
        adjustment: { style: 'diversified' },
      });

      expect(result.adjustment.style).toBe('diversified');
      expect(result.adjustment.diversified.useAnatomicalTerms).toBe(true);
    });
  });

  // ============================================================
  // resetClinicalSettings
  // ============================================================
  describe('resetClinicalSettings', () => {
    it('should reset to defaults and return DEFAULT_CLINICAL_SETTINGS', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await resetClinicalSettings(ORG_ID);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('UPDATE'), [ORG_ID]);
      expect(result).toEqual(DEFAULT_CLINICAL_SETTINGS);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

      await expect(resetClinicalSettings(ORG_ID)).rejects.toThrow('DB connection lost');
    });
  });

  // ============================================================
  // getAdjustmentNotationTemplates
  // ============================================================
  describe('getAdjustmentNotationTemplates', () => {
    it('should return segment_listing templates by default', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ clinical_settings: null }],
      });

      const templates = await getAdjustmentNotationTemplates(ORG_ID);

      expect(templates.style).toBe('segment_listing');
      expect(templates.regions).toHaveProperty('cervical');
      expect(templates.regions).toHaveProperty('thoracic');
      expect(templates.regions).toHaveProperty('lumbar');
      expect(templates.regions).toHaveProperty('sacrum');
      expect(templates.regions).toHaveProperty('pelvis');

      // Segment listing produces segment + direction entries
      const cervical = templates.regions.cervical;
      expect(cervical.length).toBeGreaterThan(0);
      expect(cervical[0]).toHaveProperty('segment');
      expect(cervical[0]).toHaveProperty('direction');
      expect(cervical[0]).toHaveProperty('text');
      expect(cervical[0]).toHaveProperty('shortText');
    });

    it('should return Gonstead templates when style is gonstead', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            clinical_settings: {
              adjustment: { style: 'gonstead' },
            },
          },
        ],
      });

      const templates = await getAdjustmentNotationTemplates(ORG_ID);

      expect(templates.style).toBe('gonstead');

      // Cervical region should have listing-based entries
      const cervical = templates.regions.cervical;
      expect(cervical.length).toBeGreaterThan(0);
      expect(cervical[0]).toHaveProperty('segment');
      expect(cervical[0]).toHaveProperty('listing');
      expect(cervical[0]).toHaveProperty('direction');

      // Pelvis templates include side (hoyre/venstre)
      const pelvis = templates.regions.pelvis;
      expect(pelvis.length).toBeGreaterThan(0);
      const pelvisTexts = pelvis.map((t) => t.text);
      expect(pelvisTexts.some((t) => t.includes('Høyre'))).toBe(true);
      expect(pelvisTexts.some((t) => t.includes('Venstre'))).toBe(true);
    });

    it('should return Diversified templates when style is diversified', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            clinical_settings: {
              adjustment: { style: 'diversified' },
            },
          },
        ],
      });

      const templates = await getAdjustmentNotationTemplates(ORG_ID);

      expect(templates.style).toBe('diversified');

      const lumbar = templates.regions.lumbar;
      expect(lumbar.length).toBeGreaterThan(0);
      expect(lumbar[0]).toHaveProperty('segment');
      expect(lumbar[0]).toHaveProperty('restriction');
      expect(lumbar[0]).toHaveProperty('direction');
      expect(lumbar[0]).toHaveProperty('text');
    });
  });

  // ============================================================
  // Organization isolation
  // ============================================================
  describe('Organization Isolation', () => {
    it('should pass the correct organization ID to queries', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ clinical_settings: { adjustment: { style: 'gonstead' } } }],
      });

      await getClinicalSettings(ORG_ID_2);

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [ORG_ID_2]);
    });
  });

  // ============================================================
  // Validation rules (deep merge edge cases)
  // ============================================================
  describe('Deep merge behavior', () => {
    it('should preserve default array values when not overridden', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            clinical_settings: {
              soap: { subjective: { painScaleType: 'nrs' } },
            },
          },
        ],
      });

      const result = await getClinicalSettings(ORG_ID);

      // Overridden scalar
      expect(result.soap.subjective.painScaleType).toBe('nrs');
      // Default arrays preserved
      expect(result.soap.subjective.defaultQuestionnaires).toEqual(['ODI', 'NDI', 'FABQ']);
      expect(result.tests.orthopedic.quickTests).toEqual(
        expect.arrayContaining(['Kemp', 'SLR', 'Braggard'])
      );
    });

    it('should allow array override to replace defaults', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            clinical_settings: {
              soap: {
                subjective: { defaultQuestionnaires: ['DASH', 'SF-36'] },
              },
            },
          },
        ],
      });

      const result = await getClinicalSettings(ORG_ID);

      // Array should be fully replaced, not merged
      expect(result.soap.subjective.defaultQuestionnaires).toEqual(['DASH', 'SF-36']);
    });
  });
});
