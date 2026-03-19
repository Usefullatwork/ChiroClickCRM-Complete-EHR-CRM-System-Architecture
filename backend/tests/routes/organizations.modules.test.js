/**
 * Organizations Modules Route Tests
 * Verifies PATCH /:id/modules endpoint: validation, whitelist, and DB update.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockQuery = jest.fn();

// Mock database
jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: mockQuery,
}));

// Mock logger
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock auth middleware (pass-through)
jest.unstable_mockModule('../../src/middleware/auth.js', () => ({
  requireAuth: (req, res, next) => next(),
  requireRole: () => (req, res, next) => next(),
  requireOrganization: (req, res, next) => next(),
}));

// Mock validation middleware (pass-through)
jest.unstable_mockModule('../../src/middleware/validation.js', () => ({
  default: () => (req, res, next) => next(),
}));

// Mock validators
jest.unstable_mockModule('../../src/validators/organization.validators.js', () => ({
  getOrganizationSchema: {},
  createOrganizationSchema: {},
  updateOrganizationSchema: {},
  updateCurrentOrganizationSchema: {},
  inviteUserSchema: {},
  updateOrganizationSettingsSchema: {},
}));

// Mock organization controller
jest.unstable_mockModule('../../src/controllers/organizations.js', () => ({
  getCurrentOrganization: jest.fn(),
  updateCurrentOrganization: jest.fn(),
  getCurrentOrganizationUsers: jest.fn(),
  inviteUser: jest.fn(),
  getOrganizations: jest.fn(),
  getOrganization: jest.fn(),
  createOrganization: jest.fn(),
  updateOrganization: jest.fn(),
  getOrganizationSettings: jest.fn(),
  updateOrganizationSettings: jest.fn(),
  getOrganizationStats: jest.fn(),
  checkOrganizationLimits: jest.fn(),
}));

// Mock featureGate
const mockClearModuleCache = jest.fn();
jest.unstable_mockModule('../../src/middleware/featureGate.js', () => ({
  requireModule: () => (req, res, next) => next(),
  clearModuleCache: mockClearModuleCache,
}));

// Import express and supertest for route testing
const express = (await import('express')).default;
const { default: request } = await import('supertest');
const { default: router } = await import('../../src/routes/organizations.js');

describe('PATCH /organizations/:id/modules', () => {
  let app;

  beforeEach(() => {
    mockQuery.mockReset();
    mockClearModuleCache.mockReset();
    app = express();
    app.use(express.json());
    app.use('/organizations', router);
  });

  it('should return 400 for invalid module names', async () => {
    const res = await request(app)
      .patch('/organizations/org1/modules')
      .send({ modules: { invalid_module: true } });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_MODULES');
    expect(res.body.invalid).toContain('invalid_module');
  });

  it('should return 400 when core_ehr is set to false', async () => {
    const res = await request(app)
      .patch('/organizations/org1/modules')
      .send({ modules: { core_ehr: false } });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('CANNOT_DISABLE_CORE');
  });

  it('should return 404 when organization not found', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await request(app)
      .patch('/organizations/org-notfound/modules')
      .send({ modules: { clinical_ai: true } });
    expect(res.status).toBe(404);
  });

  it('should return 200 with updated modules on success', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: 'org1',
          settings: {
            enabled_modules: { core_ehr: true, clinical_ai: true, exercise_rx: false },
          },
        },
      ],
    });
    const res = await request(app)
      .patch('/organizations/org1/modules')
      .send({ modules: { core_ehr: true, clinical_ai: true, exercise_rx: false } });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.modules).toBeDefined();
  });

  it('should call clearModuleCache after success', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ id: 'org1', settings: { enabled_modules: { core_ehr: true } } }],
    });
    await request(app)
      .patch('/organizations/org1/modules')
      .send({ modules: { core_ehr: true } });
    expect(mockClearModuleCache).toHaveBeenCalledWith('org1');
  });

  it('should validate against 8-module whitelist', async () => {
    // All 8 valid modules should pass
    mockQuery.mockResolvedValue({
      rows: [{ id: 'org1', settings: { enabled_modules: {} } }],
    });
    const res = await request(app)
      .patch('/organizations/org1/modules')
      .send({
        modules: {
          core_ehr: true,
          clinical_ai: true,
          exercise_rx: true,
          patient_portal: true,
          crm_marketing: true,
          advanced_clinical: true,
          analytics_reporting: true,
          multi_location: true,
        },
      });
    expect(res.status).toBe(200);
  });

  it('should return 500 on DB error', async () => {
    mockQuery.mockRejectedValue(new Error('DB connection lost'));
    const res = await request(app)
      .patch('/organizations/org1/modules')
      .send({ modules: { clinical_ai: true } });
    expect(res.status).toBe(500);
  });
});
