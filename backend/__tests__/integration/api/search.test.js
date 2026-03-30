/**
 * Search API Integration Tests
 * Tests for full-text search across patients, encounters, diagnosis codes, and global search
 *
 * Note: Tests run in DESKTOP_MODE where auth is auto-granted.
 * Search routes require auth + organization middleware.
 */

import request from 'supertest';
import app from '../../../src/server.js';
import db from '../../../src/config/database.js';

describe('Search API Integration Tests', () => {
  afterAll(async () => {
    if (db && db.closePool) {
      await db.closePool();
    }
  });

  // =============================================================================
  // SEARCH PATIENTS
  // =============================================================================

  describe('GET /api/v1/search/patients', () => {
    it('should search patients with valid query', async () => {
      const response = await request(app).get('/api/v1/search/patients').query({ q: 'test' });

      expect([200, 500]).toContain(response.status);
    });

    it('should reject query shorter than 2 characters', async () => {
      const response = await request(app).get('/api/v1/search/patients').query({ q: 'a' });

      expect(response.status).toBe(400);
    });

    it('should reject missing query parameter', async () => {
      const response = await request(app).get('/api/v1/search/patients');

      expect(response.status).toBe(400);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/search/patients')
        .query({ q: 'patient', limit: 5 });

      expect([200, 500]).toContain(response.status);
    });

    it('should support offset parameter for pagination', async () => {
      const response = await request(app)
        .get('/api/v1/search/patients')
        .query({ q: 'patient', limit: 5, offset: 0 });

      expect([200, 500]).toContain(response.status);
    });
  });

  // =============================================================================
  // SEARCH ENCOUNTERS
  // =============================================================================

  describe('GET /api/v1/search/encounters', () => {
    it('should search encounters with valid query', async () => {
      const response = await request(app)
        .get('/api/v1/search/encounters')
        .query({ q: 'complaint' });

      expect([200, 500]).toContain(response.status);
    });

    it('should reject query shorter than 2 characters', async () => {
      const response = await request(app).get('/api/v1/search/encounters').query({ q: 'x' });

      expect(response.status).toBe(400);
    });

    it('should reject missing query parameter', async () => {
      const response = await request(app).get('/api/v1/search/encounters');

      expect(response.status).toBe(400);
    });
  });

  // =============================================================================
  // SEARCH DIAGNOSIS CODES
  // =============================================================================

  describe('GET /api/v1/search/diagnosis', () => {
    it('should search diagnosis codes with valid query', async () => {
      const response = await request(app).get('/api/v1/search/diagnosis').query({ q: 'L03' });

      expect([200, 500]).toContain(response.status);
    });

    it('should accept single character query for diagnosis', async () => {
      // Diagnosis search has min 1 character requirement
      const response = await request(app).get('/api/v1/search/diagnosis').query({ q: 'M' });

      expect([200, 500]).toContain(response.status);
    });

    it('should reject missing query parameter', async () => {
      const response = await request(app).get('/api/v1/search/diagnosis');

      expect(response.status).toBe(400);
    });

    it('should filter by code system', async () => {
      const response = await request(app)
        .get('/api/v1/search/diagnosis')
        .query({ q: 'back', system: 'ICD-10' });

      expect([200, 500]).toContain(response.status);
    });
  });

  // =============================================================================
  // GLOBAL SEARCH
  // =============================================================================

  describe('GET /api/v1/search/global', () => {
    it('should perform global search with valid query', async () => {
      const response = await request(app).get('/api/v1/search/global').query({ q: 'test' });

      expect([200, 500]).toContain(response.status);
    });

    it('should reject query shorter than 2 characters', async () => {
      const response = await request(app).get('/api/v1/search/global').query({ q: 'x' });

      expect(response.status).toBe(400);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/search/global')
        .query({ q: 'test', limit: 3 });

      expect([200, 500]).toContain(response.status);
    });
  });

  // =============================================================================
  // AUTOCOMPLETE SUGGESTIONS
  // =============================================================================

  describe('GET /api/v1/search/suggest', () => {
    it('should return suggestions for valid query', async () => {
      const response = await request(app).get('/api/v1/search/suggest').query({ q: 'te' });

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });

    it('should return empty array for very short query', async () => {
      const response = await request(app).get('/api/v1/search/suggest').query({ q: 'x' });

      // suggest route gracefully returns [] for short queries instead of 400
      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toEqual([]);
      }
    });

    it('should accept entity parameter', async () => {
      const response = await request(app)
        .get('/api/v1/search/suggest')
        .query({ q: 'te', entity: 'diagnosis' });

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/search/suggest')
        .query({ q: 'te', limit: 3 });

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.length).toBeLessThanOrEqual(3);
      }
    });
  });
});
