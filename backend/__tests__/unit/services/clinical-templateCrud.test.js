/**
 * Unit Tests for Template CRUD (src/services/clinical/templateCrud.js)
 * Tests template management, favorites, search, phrases
 */

import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

const {
  getAllTemplates,
  getTemplatesByCategory,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  toggleFavorite,
  incrementUsage,
  getCategories,
  searchTemplates,
  getUserPreferences,
  addFavoriteTemplate,
  removeFavoriteTemplate,
  getPhrases,
  getPhrasesByRegion,
  getFMSTemplates,
} = await import('../../../src/services/clinical/templateCrud.js');

describe('templateCrud', () => {
  const ORG_ID = 'org-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // getAllTemplates
  // ===========================================================================
  describe('getAllTemplates', () => {
    it('should return templates with pagination info', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 't1' }] })
        .mockResolvedValueOnce({ rows: [{ total: '5' }] });

      const result = await getAllTemplates(ORG_ID);
      expect(result.templates).toHaveLength(1);
      expect(result.total).toBe(5);
    });

    it('should filter by category', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await getAllTemplates(ORG_ID, { category: 'subjective' });
      expect(mockQuery.mock.calls[0][0]).toContain('category');
    });

    it('should filter by soapSection', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await getAllTemplates(ORG_ID, { soapSection: 'S' });
      expect(mockQuery.mock.calls[0][0]).toContain('soap_section');
    });

    it('should filter favorites only', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await getAllTemplates(ORG_ID, { favoritesOnly: true });
      expect(mockQuery.mock.calls[0][0]).toContain('is_favorite = true');
    });

    it('should apply search filter', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await getAllTemplates(ORG_ID, { search: 'nakke' });
      expect(mockQuery.mock.calls[0][0]).toContain('ILIKE');
    });
  });

  // ===========================================================================
  // getTemplatesByCategory
  // ===========================================================================
  describe('getTemplatesByCategory', () => {
    it('should return templates organized by category', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ category: 'subjective', subcategory: 'pain', templates: [{ id: 't1' }] }],
      });
      const result = await getTemplatesByCategory(ORG_ID);
      expect(result.subjective).toBeDefined();
      expect(result.subjective.pain).toBeDefined();
    });
  });

  // ===========================================================================
  // getTemplateById
  // ===========================================================================
  describe('getTemplateById', () => {
    it('should return template when found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 't1', template_name: 'Test' }] });
      const result = await getTemplateById(ORG_ID, 't1');
      expect(result.id).toBe('t1');
    });

    it('should throw when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(getTemplateById(ORG_ID, 'missing')).rejects.toThrow('Template not found');
    });
  });

  // ===========================================================================
  // createTemplate
  // ===========================================================================
  describe('createTemplate', () => {
    it('should create template and return row', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-t1' }] });
      const result = await createTemplate(ORG_ID, 'user-1', {
        category: 'subjective',
        templateName: 'Test Template',
        templateText: 'Template text content',
      });
      expect(result.id).toBe('new-t1');
    });
  });

  // ===========================================================================
  // updateTemplate
  // ===========================================================================
  describe('updateTemplate', () => {
    it('should update non-system template', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 't1', is_system: false, organization_id: ORG_ID }] })
        .mockResolvedValueOnce({ rows: [{ id: 't1', template_name: 'Updated' }] });

      const result = await updateTemplate(ORG_ID, 't1', { templateName: 'Updated' });
      expect(result.template_name).toBe('Updated');
    });

    it('should throw when modifying system template', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 't1', is_system: true, organization_id: ORG_ID }],
      });
      await expect(updateTemplate(ORG_ID, 't1', { templateName: 'x' })).rejects.toThrow(
        'Cannot modify system templates'
      );
    });

    it('should throw when modifying other org template', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 't1', is_system: false, organization_id: 'other-org' }],
      });
      await expect(updateTemplate(ORG_ID, 't1', { templateName: 'x' })).rejects.toThrow(
        'Cannot modify templates from other organizations'
      );
    });
  });

  // ===========================================================================
  // deleteTemplate
  // ===========================================================================
  describe('deleteTemplate', () => {
    it('should delete non-system template', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 't1', is_system: false, organization_id: ORG_ID }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await deleteTemplate(ORG_ID, 't1');
      expect(result.message).toContain('deleted');
    });

    it('should throw when deleting system template', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 't1', is_system: true, organization_id: ORG_ID }],
      });
      await expect(deleteTemplate(ORG_ID, 't1')).rejects.toThrow('Cannot delete system templates');
    });
  });

  // ===========================================================================
  // toggleFavorite
  // ===========================================================================
  describe('toggleFavorite', () => {
    it('should toggle favorite status', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 't1', is_favorite: true }] });
      const result = await toggleFavorite(ORG_ID, 't1');
      expect(result.is_favorite).toBe(true);
    });

    it('should throw when template not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(toggleFavorite(ORG_ID, 'missing')).rejects.toThrow('Template not found');
    });
  });

  // ===========================================================================
  // incrementUsage
  // ===========================================================================
  describe('incrementUsage', () => {
    it('should call increment function', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await incrementUsage('t1');
      expect(mockQuery.mock.calls[0][0]).toContain('increment_template_usage');
    });
  });

  // ===========================================================================
  // getCategories
  // ===========================================================================
  describe('getCategories', () => {
    it('should return distinct categories', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ category: 'subjective', template_count: '5' }] });
      const result = await getCategories(ORG_ID);
      expect(result).toHaveLength(1);
    });
  });

  // ===========================================================================
  // searchTemplates
  // ===========================================================================
  describe('searchTemplates', () => {
    it('should search templates by query', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 't1', rank: 0.8 }] });
      const result = await searchTemplates(ORG_ID, 'nakke');
      expect(result).toHaveLength(1);
    });
  });

  // ===========================================================================
  // getUserPreferences
  // ===========================================================================
  describe('getUserPreferences', () => {
    it('should return existing preferences', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 'u-1', preferred_language: 'NO' }] });
      const result = await getUserPreferences('u-1', ORG_ID);
      expect(result.preferred_language).toBe('NO');
    });

    it('should create default preferences when not found', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ user_id: 'u-1', preferred_language: 'NO' }] });

      const result = await getUserPreferences('u-1', ORG_ID);
      expect(result.preferred_language).toBe('NO');
    });
  });

  // ===========================================================================
  // addFavoriteTemplate / removeFavoriteTemplate
  // ===========================================================================
  describe('addFavoriteTemplate', () => {
    it('should add template to favorites and log usage', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await addFavoriteTemplate('u-1', ORG_ID, 't1');
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('removeFavoriteTemplate', () => {
    it('should remove template from favorites', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await removeFavoriteTemplate('u-1', ORG_ID, 't1');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // getPhrases / getPhrasesByRegion / getFMSTemplates
  // ===========================================================================
  describe('getPhrases', () => {
    it('should return phrases for organization', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1', phrase: 'Test phrase' }] });
      const result = await getPhrases(ORG_ID);
      expect(result).toHaveLength(1);
    });

    it('should filter by category', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await getPhrases(ORG_ID, { category: 'findings' });
      expect(mockQuery.mock.calls[0][0]).toContain('category');
    });
  });

  describe('getPhrasesByRegion', () => {
    it('should return phrases filtered by body region', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1' }] });
      const result = await getPhrasesByRegion(ORG_ID, 'cervical');
      expect(result).toHaveLength(1);
    });
  });

  describe('getFMSTemplates', () => {
    it('should return FMS templates', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'fms1', code: 'fms_test' }] });
      const result = await getFMSTemplates();
      expect(result).toHaveLength(1);
    });
  });
});
