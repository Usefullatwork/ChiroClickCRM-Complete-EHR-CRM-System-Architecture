/**
 * Unit Tests for Clinical Templates Service
 * Tests CRUD, search, test library, phrases, red flags,
 * screening, test clusters, FMS templates, and user preferences.
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

// Import after mocking
const templatesService = await import('../../../src/services/templates.js');

describe('Templates Service', () => {
  const testOrgId = 'org-001';
  const testUserId = 'user-001';
  const testTemplateId = 'tpl-abc';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // getAllTemplates
  // ===========================================================================

  describe('getAllTemplates', () => {
    it('should return templates with default options', async () => {
      const mockTemplates = [{ id: 'tpl-1', template_name: 'Template 1', category: 'Subjective' }];
      mockQuery
        .mockResolvedValueOnce({ rows: mockTemplates })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] });

      const result = await templatesService.getAllTemplates(testOrgId);

      expect(result.templates).toEqual(mockTemplates);
      expect(result.total).toBe(1);
      expect(result.limit).toBe(100);
      expect(result.offset).toBe(0);
      expect(mockQuery).toHaveBeenCalledTimes(2);
      // Check default language NO is passed
      expect(mockQuery.mock.calls[0][1][1]).toBe('NO');
    });

    it('should apply category filter when provided', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await templatesService.getAllTemplates(testOrgId, { category: 'Objective' });

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain('Objective');
    });

    it('should apply subcategory and soapSection filters', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await templatesService.getAllTemplates(testOrgId, {
        category: 'Subjective',
        subcategory: 'Pain',
        soapSection: 'S',
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain('Subjective');
      expect(params).toContain('Pain');
      expect(params).toContain('S');
    });

    it('should apply search filter with ILIKE pattern', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await templatesService.getAllTemplates(testOrgId, { search: 'neck' });

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain('neck');
      expect(params).toContain('%neck%');
    });

    it('should respect favoritesOnly flag', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await templatesService.getAllTemplates(testOrgId, { favoritesOnly: true });

      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('is_favorite = true');
    });

    it('should pass custom limit and offset', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await templatesService.getAllTemplates(testOrgId, { limit: 25, offset: 50 });

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain(25);
      expect(params).toContain(50);
    });
  });

  // ===========================================================================
  // getTemplatesByCategory
  // ===========================================================================

  describe('getTemplatesByCategory', () => {
    it('should organize templates into nested category structure', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { category: 'Subjective', subcategory: 'Pain', templates: [{ id: '1' }] },
          { category: 'Subjective', subcategory: null, templates: [{ id: '2' }] },
          { category: 'Objective', subcategory: 'ROM', templates: [{ id: '3' }] },
        ],
      });

      const result = await templatesService.getTemplatesByCategory(testOrgId);

      expect(result.Subjective.Pain).toEqual([{ id: '1' }]);
      expect(result.Subjective.General).toEqual([{ id: '2' }]);
      expect(result.Objective.ROM).toEqual([{ id: '3' }]);
    });

    it('should pass language parameter to query', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await templatesService.getTemplatesByCategory(testOrgId, 'EN');

      expect(mockQuery.mock.calls[0][1]).toEqual([testOrgId, 'EN']);
    });
  });

  // ===========================================================================
  // getTemplateById
  // ===========================================================================

  describe('getTemplateById', () => {
    it('should return template when found', async () => {
      const mockTemplate = { id: testTemplateId, template_name: 'Test Template' };
      mockQuery.mockResolvedValueOnce({ rows: [mockTemplate] });

      const result = await templatesService.getTemplateById(testOrgId, testTemplateId);

      expect(result).toEqual(mockTemplate);
      expect(mockQuery.mock.calls[0][1]).toEqual([testTemplateId, testOrgId]);
    });

    it('should throw when template not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(templatesService.getTemplateById(testOrgId, 'nonexistent')).rejects.toThrow(
        'Template not found'
      );
    });
  });

  // ===========================================================================
  // createTemplate
  // ===========================================================================

  describe('createTemplate', () => {
    it('should insert template with all fields', async () => {
      const templateData = {
        category: 'Subjective',
        subcategory: 'Pain',
        templateName: 'Neck Pain',
        templateText: 'Patient reports neck pain',
        language: 'NO',
        soapSection: 'S',
        isFavorite: true,
      };

      const mockCreated = { id: 'new-tpl', ...templateData };
      mockQuery.mockResolvedValueOnce({ rows: [mockCreated] });

      const result = await templatesService.createTemplate(testOrgId, testUserId, templateData);

      expect(result).toEqual(mockCreated);
      const params = mockQuery.mock.calls[0][1];
      expect(params[0]).toBe(testOrgId);
      expect(params[1]).toBe('Subjective');
      expect(params[2]).toBe('Pain');
      expect(params[3]).toBe('Neck Pain');
      expect(params[4]).toBe('Patient reports neck pain');
      expect(params[5]).toBe('NO');
      expect(params[6]).toBe('S');
      expect(params[7]).toBe(true);
      expect(params[8]).toBe(testUserId);
    });

    it('should use default language NO and isFavorite false', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-tpl' }] });

      await templatesService.createTemplate(testOrgId, testUserId, {
        category: 'Assessment',
        templateName: 'Basic',
        templateText: 'Text',
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params[5]).toBe('NO'); // default language
      expect(params[7]).toBe(false); // default isFavorite
    });
  });

  // ===========================================================================
  // updateTemplate
  // ===========================================================================

  describe('updateTemplate', () => {
    it('should update non-system template owned by organization', async () => {
      // First call is getTemplateById
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: testTemplateId, is_system: false, organization_id: testOrgId }],
      });
      // Second call is the UPDATE
      const updatedRow = { id: testTemplateId, template_name: 'Updated' };
      mockQuery.mockResolvedValueOnce({ rows: [updatedRow] });

      const result = await templatesService.updateTemplate(testOrgId, testTemplateId, {
        templateName: 'Updated',
      });

      expect(result).toEqual(updatedRow);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should throw when attempting to modify system template', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: testTemplateId, is_system: true, organization_id: testOrgId }],
      });

      await expect(
        templatesService.updateTemplate(testOrgId, testTemplateId, { templateName: 'X' })
      ).rejects.toThrow('Cannot modify system templates');
    });

    it('should throw when attempting to modify template from other organization', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: testTemplateId, is_system: false, organization_id: 'other-org' }],
      });

      await expect(
        templatesService.updateTemplate(testOrgId, testTemplateId, { templateName: 'X' })
      ).rejects.toThrow('Cannot modify templates from other organizations');
    });
  });

  // ===========================================================================
  // deleteTemplate
  // ===========================================================================

  describe('deleteTemplate', () => {
    it('should delete non-system template owned by organization', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: testTemplateId, is_system: false, organization_id: testOrgId }],
        })
        .mockResolvedValueOnce({ rows: [] });

      const result = await templatesService.deleteTemplate(testOrgId, testTemplateId);

      expect(result).toEqual({ message: 'Template deleted successfully' });
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should throw when attempting to delete system template', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: testTemplateId, is_system: true, organization_id: testOrgId }],
      });

      await expect(templatesService.deleteTemplate(testOrgId, testTemplateId)).rejects.toThrow(
        'Cannot delete system templates'
      );
    });

    it('should throw when attempting to delete template from other organization', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: testTemplateId, is_system: false, organization_id: 'other-org' }],
      });

      await expect(templatesService.deleteTemplate(testOrgId, testTemplateId)).rejects.toThrow(
        'Cannot delete templates from other organizations'
      );
    });
  });

  // ===========================================================================
  // toggleFavorite
  // ===========================================================================

  describe('toggleFavorite', () => {
    it('should toggle favorite status and return updated template', async () => {
      const toggled = { id: testTemplateId, is_favorite: true };
      mockQuery.mockResolvedValueOnce({ rows: [toggled] });

      const result = await templatesService.toggleFavorite(testOrgId, testTemplateId);

      expect(result).toEqual(toggled);
    });

    it('should throw when template not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(templatesService.toggleFavorite(testOrgId, 'missing')).rejects.toThrow(
        'Template not found'
      );
    });
  });

  // ===========================================================================
  // incrementUsage
  // ===========================================================================

  describe('incrementUsage', () => {
    it('should call increment_template_usage function', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await templatesService.incrementUsage(testTemplateId);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('increment_template_usage'), [
        testTemplateId,
      ]);
    });
  });

  // ===========================================================================
  // getCategories
  // ===========================================================================

  describe('getCategories', () => {
    it('should return category list with counts', async () => {
      const categories = [
        { category: 'Assessment', template_count: 5 },
        { category: 'Subjective', template_count: 12 },
      ];
      mockQuery.mockResolvedValueOnce({ rows: categories });

      const result = await templatesService.getCategories(testOrgId);

      expect(result).toEqual(categories);
      expect(mockQuery.mock.calls[0][1]).toEqual([testOrgId, 'NO']);
    });

    it('should accept custom language', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await templatesService.getCategories(testOrgId, 'EN');

      expect(mockQuery.mock.calls[0][1]).toEqual([testOrgId, 'EN']);
    });
  });

  // ===========================================================================
  // searchTemplates
  // ===========================================================================

  describe('searchTemplates', () => {
    it('should search with full-text and ILIKE', async () => {
      const searchResults = [{ id: 'tpl-1', rank: 0.8 }];
      mockQuery.mockResolvedValueOnce({ rows: searchResults });

      const result = await templatesService.searchTemplates(testOrgId, 'neck pain');

      expect(result).toEqual(searchResults);
      const params = mockQuery.mock.calls[0][1];
      expect(params).toEqual([testOrgId, 'NO', 'neck pain', '%neck pain%']);
    });

    it('should pass custom language', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await templatesService.searchTemplates(testOrgId, 'back', 'EN');

      expect(mockQuery.mock.calls[0][1][1]).toBe('EN');
    });
  });

  // ===========================================================================
  // getTestsLibrary
  // ===========================================================================

  describe('getTestsLibrary', () => {
    it('should return all tests with default language', async () => {
      const tests = [{ id: '1', test_name: 'Spurling Test' }];
      mockQuery.mockResolvedValueOnce({ rows: tests });

      const result = await templatesService.getTestsLibrary();

      expect(result).toEqual(tests);
      expect(mockQuery.mock.calls[0][1][0]).toBe('NO');
    });

    it('should apply testCategory, bodyRegion, system, and search filters', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await templatesService.getTestsLibrary({
        testCategory: 'Orthopedic',
        bodyRegion: 'Cervical',
        system: 'MSK',
        search: 'spurling',
        language: 'EN',
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain('EN');
      expect(params).toContain('Orthopedic');
      expect(params).toContain('Cervical');
      expect(params).toContain('MSK');
      expect(params).toContain('%spurling%');
    });
  });

  // ===========================================================================
  // getTestByCode
  // ===========================================================================

  describe('getTestByCode', () => {
    it('should return test when found', async () => {
      const test = { id: '1', code: 'SPUR01', test_name: 'Spurling' };
      mockQuery.mockResolvedValueOnce({ rows: [test] });

      const result = await templatesService.getTestByCode('SPUR01');

      expect(result).toEqual(test);
      expect(mockQuery.mock.calls[0][1]).toEqual(['SPUR01', 'NO']);
    });

    it('should throw when test not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(templatesService.getTestByCode('INVALID')).rejects.toThrow('Test not found');
    });
  });

  // ===========================================================================
  // getUserPreferences
  // ===========================================================================

  describe('getUserPreferences', () => {
    it('should return existing preferences', async () => {
      const prefs = { id: 'pref-1', user_id: testUserId, preferred_language: 'NO' };
      mockQuery.mockResolvedValueOnce({ rows: [prefs] });

      const result = await templatesService.getUserPreferences(testUserId, testOrgId);

      expect(result).toEqual(prefs);
    });

    it('should create default preferences when none exist', async () => {
      const newPrefs = {
        id: 'pref-new',
        user_id: testUserId,
        preferred_language: 'NO',
        favorite_template_ids: [],
      };
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // SELECT returns empty
        .mockResolvedValueOnce({ rows: [newPrefs] }); // INSERT returns new prefs

      const result = await templatesService.getUserPreferences(testUserId, testOrgId);

      expect(result).toEqual(newPrefs);
      expect(mockQuery).toHaveBeenCalledTimes(2);
      // Verify INSERT was called
      expect(mockQuery.mock.calls[1][0]).toContain('INSERT INTO user_template_preferences');
    });
  });

  // ===========================================================================
  // addFavoriteTemplate
  // ===========================================================================

  describe('addFavoriteTemplate', () => {
    it('should append template ID and track usage analytics', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // array_append
        .mockResolvedValueOnce({ rows: [] }); // analytics insert

      await templatesService.addFavoriteTemplate(testUserId, testOrgId, testTemplateId);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery.mock.calls[0][0]).toContain('array_append');
      expect(mockQuery.mock.calls[1][0]).toContain('template_usage_analytics');
    });
  });

  // ===========================================================================
  // removeFavoriteTemplate
  // ===========================================================================

  describe('removeFavoriteTemplate', () => {
    it('should remove template ID from favorites', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await templatesService.removeFavoriteTemplate(testUserId, testOrgId, testTemplateId);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery.mock.calls[0][0]).toContain('array_remove');
      expect(mockQuery.mock.calls[0][1]).toEqual([testUserId, testOrgId, testTemplateId]);
    });
  });

  // ===========================================================================
  // getPhrases
  // ===========================================================================

  describe('getPhrases', () => {
    it('should return phrases with default language', async () => {
      const phrases = [{ id: '1', phrase: 'Smerter i nakke' }];
      mockQuery.mockResolvedValueOnce({ rows: phrases });

      const result = await templatesService.getPhrases(testOrgId);

      expect(result).toEqual(phrases);
      expect(mockQuery.mock.calls[0][1]).toEqual([testOrgId, 'NO']);
    });

    it('should apply category and search filters', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await templatesService.getPhrases(testOrgId, {
        category: 'Pain',
        search: 'neck',
        language: 'EN',
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain('EN');
      expect(params).toContain('Pain');
      expect(params).toContain('%neck%');
      expect(params).toContain('neck');
    });
  });

  // ===========================================================================
  // getPhrasesByRegion
  // ===========================================================================

  describe('getPhrasesByRegion', () => {
    it('should return phrases filtered by body region', async () => {
      const phrases = [{ id: '1', phrase: 'ROM limited' }];
      mockQuery.mockResolvedValueOnce({ rows: phrases });

      const result = await templatesService.getPhrasesByRegion(testOrgId, 'Cervical');

      expect(result).toEqual(phrases);
      expect(mockQuery.mock.calls[0][1]).toEqual([testOrgId, 'Cervical', 'NO']);
    });
  });

  // ===========================================================================
  // getRedFlags
  // ===========================================================================

  describe('getRedFlags', () => {
    it('should return all red flags with default language', async () => {
      const flags = [{ id: '1', flag_name: 'Cauda equina' }];
      mockQuery.mockResolvedValueOnce({ rows: flags });

      const result = await templatesService.getRedFlags();

      expect(result).toEqual(flags);
      expect(mockQuery.mock.calls[0][1][0]).toBe('NO');
    });

    it('should apply pathologyCategory, bodyRegion, and significanceLevel filters', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await templatesService.getRedFlags({
        pathologyCategory: 'Neurological',
        bodyRegion: 'Lumbar',
        significanceLevel: 'HIGH',
        language: 'EN',
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain('EN');
      expect(params).toContain('Neurological');
      expect(params).toContain('Lumbar');
      expect(params).toContain('HIGH');
    });
  });

  // ===========================================================================
  // screenRedFlags
  // ===========================================================================

  describe('screenRedFlags', () => {
    it('should return LOW risk when no flags match', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await templatesService.screenRedFlags(
        { age: 35, gender: 'M' },
        ['headache'],
        ['normal ROM']
      );

      expect(result.riskLevel).toBe('LOW');
      expect(result.redFlagsIdentified).toEqual([]);
      expect(result.patientAge).toBe(35);
    });

    it('should identify HIGH risk red flag from symptoms', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            code: 'RF001',
            flag_name: 'Cauda Equina',
            pathology_category: 'Neurological',
            description: 'bladder dysfunction',
            significance_level: 'HIGH',
            recommended_action: 'Refer immediately',
          },
        ],
      });

      const result = await templatesService.screenRedFlags(
        { age: 45, gender: 'F' },
        ['bladder dysfunction'],
        []
      );

      expect(result.riskLevel).toBe('HIGH');
      expect(result.redFlagsIdentified).toHaveLength(1);
      expect(result.redFlagsIdentified[0].code).toBe('RF001');
      expect(result.recommendedActions).toContain('Refer immediately');
    });

    it('should identify red flags from findings when symptoms do not match', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            code: 'RF002',
            flag_name: 'Fracture',
            pathology_category: 'Trauma',
            description: 'point tenderness',
            significance_level: 'MODERATE',
            recommended_action: 'X-ray',
          },
        ],
      });

      const result = await templatesService.screenRedFlags(
        { age: 60, gender: 'M' },
        ['unrelated symptom'],
        ['point tenderness']
      );

      expect(result.riskLevel).toBe('MODERATE');
      expect(result.redFlagsIdentified).toHaveLength(1);
      expect(result.redFlagsIdentified[0].code).toBe('RF002');
    });

    it('should handle null symptoms and findings', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            code: 'RF003',
            flag_name: 'Something',
            pathology_category: 'General',
            description: 'test flag',
            significance_level: 'LOW',
            recommended_action: null,
          },
        ],
      });

      const result = await templatesService.screenRedFlags({ age: 30, gender: 'M' }, null, null);

      expect(result.riskLevel).toBe('LOW');
      expect(result.redFlagsIdentified).toEqual([]);
    });
  });

  // ===========================================================================
  // getTestClusters
  // ===========================================================================

  describe('getTestClusters', () => {
    it('should return clusters with default language', async () => {
      const clusters = [{ id: '1', cluster_name: 'Lumbar disc' }];
      mockQuery.mockResolvedValueOnce({ rows: clusters });

      const result = await templatesService.getTestClusters();

      expect(result).toEqual(clusters);
      expect(mockQuery.mock.calls[0][1][0]).toBe('NO');
    });

    it('should filter by bodyRegion', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await templatesService.getTestClusters({ bodyRegion: 'Shoulder' });

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain('Shoulder');
    });
  });

  // ===========================================================================
  // getTestClusterByCondition
  // ===========================================================================

  describe('getTestClusterByCondition', () => {
    it('should return cluster when found', async () => {
      const cluster = { id: '1', cluster_name: 'Rotator cuff' };
      mockQuery.mockResolvedValueOnce({ rows: [cluster] });

      const result = await templatesService.getTestClusterByCondition('rotator cuff');

      expect(result).toEqual(cluster);
      expect(mockQuery.mock.calls[0][1]).toEqual(['%rotator cuff%', 'NO']);
    });

    it('should throw when cluster not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(templatesService.getTestClusterByCondition('nonexistent')).rejects.toThrow(
        'Cluster not found'
      );
    });
  });

  // ===========================================================================
  // getFMSTemplates
  // ===========================================================================

  describe('getFMSTemplates', () => {
    it('should return FMS templates with default language', async () => {
      const fmsTemplates = [{ id: '1', name: 'Deep Squat', code: 'fms_squat' }];
      mockQuery.mockResolvedValueOnce({ rows: fmsTemplates });

      const result = await templatesService.getFMSTemplates();

      expect(result).toEqual(fmsTemplates);
      expect(mockQuery.mock.calls[0][1]).toEqual(['NO']);
    });

    it('should pass EN language', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await templatesService.getFMSTemplates('EN');

      expect(mockQuery.mock.calls[0][1]).toEqual(['EN']);
    });
  });

  // ===========================================================================
  // Default export
  // ===========================================================================

  describe('default export', () => {
    it('should export all service functions', () => {
      const defaultExport = templatesService.default;
      expect(typeof defaultExport.getAllTemplates).toBe('function');
      expect(typeof defaultExport.getTemplatesByCategory).toBe('function');
      expect(typeof defaultExport.getTemplateById).toBe('function');
      expect(typeof defaultExport.createTemplate).toBe('function');
      expect(typeof defaultExport.updateTemplate).toBe('function');
      expect(typeof defaultExport.deleteTemplate).toBe('function');
      expect(typeof defaultExport.toggleFavorite).toBe('function');
      expect(typeof defaultExport.incrementUsage).toBe('function');
      expect(typeof defaultExport.getCategories).toBe('function');
      expect(typeof defaultExport.searchTemplates).toBe('function');
      expect(typeof defaultExport.getTestsLibrary).toBe('function');
      expect(typeof defaultExport.getTestByCode).toBe('function');
      expect(typeof defaultExport.getUserPreferences).toBe('function');
      expect(typeof defaultExport.addFavoriteTemplate).toBe('function');
      expect(typeof defaultExport.removeFavoriteTemplate).toBe('function');
      expect(typeof defaultExport.getPhrases).toBe('function');
      expect(typeof defaultExport.getPhrasesByRegion).toBe('function');
      expect(typeof defaultExport.getRedFlags).toBe('function');
      expect(typeof defaultExport.screenRedFlags).toBe('function');
      expect(typeof defaultExport.getTestClusters).toBe('function');
      expect(typeof defaultExport.getTestClusterByCondition).toBe('function');
      expect(typeof defaultExport.getFMSTemplates).toBe('function');
    });
  });
});
