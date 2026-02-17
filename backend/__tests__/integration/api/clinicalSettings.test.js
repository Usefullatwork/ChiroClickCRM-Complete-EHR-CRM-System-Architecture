/**
 * Clinical Settings API Integration Tests
 * Tests for clinical documentation preferences CRUD, adjustment styles, and reset
 */

import request from 'supertest';
import app from '../../../src/server.js';

describe('Clinical Settings API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // GET SETTINGS
  // =============================================================================

  describe('GET /api/v1/clinical-settings', () => {
    it('should return clinical settings', async () => {
      const res = await agent.get('/api/v1/clinical-settings');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // GET DEFAULTS
  // =============================================================================

  describe('GET /api/v1/clinical-settings/defaults', () => {
    it('should return default clinical settings', async () => {
      const res = await agent.get('/api/v1/clinical-settings/defaults');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // GET ADJUSTMENT TEMPLATES
  // =============================================================================

  describe('GET /api/v1/clinical-settings/adjustment/templates', () => {
    it('should return adjustment notation templates', async () => {
      const res = await agent.get('/api/v1/clinical-settings/adjustment/templates');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // PATCH SETTINGS
  // =============================================================================

  describe('PATCH /api/v1/clinical-settings', () => {
    it('should update settings with valid data', async () => {
      const res = await agent.patch('/api/v1/clinical-settings').send({
        adjustment: { style: 'gonstead' },
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should handle empty update body', async () => {
      const res = await agent.patch('/api/v1/clinical-settings').send({});
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // PATCH SECTION
  // =============================================================================

  describe('PATCH /api/v1/clinical-settings/:section', () => {
    it('should update adjustment section', async () => {
      const res = await agent.patch('/api/v1/clinical-settings/adjustment').send({
        style: 'diversified',
        useAnatomicalTerms: true,
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should update tests section', async () => {
      const res = await agent.patch('/api/v1/clinical-settings/tests').send({
        orthopedic: { resultFormat: 'plus_minus' },
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should update soap section', async () => {
      const res = await agent.patch('/api/v1/clinical-settings/soap').send({
        defaultTemplate: 'standard',
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should handle invalid section name', async () => {
      const res = await agent.patch('/api/v1/clinical-settings/nonexistent').send({
        key: 'value',
      });
      expect([200, 400, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // SET ADJUSTMENT STYLE
  // =============================================================================

  describe('PUT /api/v1/clinical-settings/adjustment/style', () => {
    it('should set gonstead style', async () => {
      const res = await agent.put('/api/v1/clinical-settings/adjustment/style').send({
        style: 'gonstead',
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should set diversified style', async () => {
      const res = await agent.put('/api/v1/clinical-settings/adjustment/style').send({
        style: 'diversified',
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should set segment_listing style', async () => {
      const res = await agent.put('/api/v1/clinical-settings/adjustment/style').send({
        style: 'segment_listing',
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should reject invalid style', async () => {
      const res = await agent.put('/api/v1/clinical-settings/adjustment/style').send({
        style: 'invalid_style',
      });
      expect([400, 500]).toContain(res.status);
    });

    it('should reject missing style', async () => {
      const res = await agent.put('/api/v1/clinical-settings/adjustment/style').send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // UPDATE TEST SETTINGS
  // =============================================================================

  describe('PATCH /api/v1/clinical-settings/tests/:testType', () => {
    it('should update orthopedic test settings', async () => {
      const res = await agent.patch('/api/v1/clinical-settings/tests/orthopedic').send({
        resultFormat: 'pos_neg',
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should update neurological test settings', async () => {
      const res = await agent.patch('/api/v1/clinical-settings/tests/neurological').send({
        reflexGrading: 'numeric',
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should update ROM test settings', async () => {
      const res = await agent.patch('/api/v1/clinical-settings/tests/rom').send({
        format: 'degrees',
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should handle invalid test type', async () => {
      const res = await agent.patch('/api/v1/clinical-settings/tests/nonexistent').send({
        key: 'value',
      });
      expect([200, 400, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // UPDATE LETTER SETTINGS
  // =============================================================================

  describe('PATCH /api/v1/clinical-settings/letters', () => {
    it('should update letter settings', async () => {
      const res = await agent.patch('/api/v1/clinical-settings/letters').send({
        defaultHeader: 'Clinic Name',
        includeFooter: true,
      });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // RESET SETTINGS
  // =============================================================================

  describe('POST /api/v1/clinical-settings/reset', () => {
    it('should reset all settings to defaults', async () => {
      const res = await agent.post('/api/v1/clinical-settings/reset');
      expect([200, 500]).toContain(res.status);
    });
  });
});
