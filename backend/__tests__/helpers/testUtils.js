/**
 * Test Utilities
 * Common helpers for integration tests
 */

// Set test environment
process.env.NODE_ENV = 'test';

import db from '../../src/config/database.js';
import crypto from 'crypto';

/**
 * Create a test organization
 * @param {object} overrides - Override default values
 * @returns {Promise<object>} Created organization
 */
export async function createTestOrganization(overrides = {}) {
  const defaults = {
    name: `Test Clinic ${Date.now()}`,
    org_number: `${Math.floor(100000000 + Math.random() * 900000000)}`,
    subscription_tier: 'PRO',
    is_active: true,
    settings: {}
  };

  const data = { ...defaults, ...overrides };

  const result = await db.query(
    `INSERT INTO organizations (name, org_number, subscription_tier, is_active, settings)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.name, data.org_number, data.subscription_tier, data.is_active, JSON.stringify(data.settings)]
  );

  return result.rows[0];
}

/**
 * Create a test user with password
 * @param {string} organizationId - Organization UUID
 * @param {object} overrides - Override default values
 * @returns {Promise<object>} Created user
 */
export async function createTestUser(organizationId, overrides = {}) {
  const timestamp = Date.now();
  const defaults = {
    email: `testuser${timestamp}@test.com`,
    first_name: 'Test',
    last_name: 'User',
    role: 'PRACTITIONER',
    is_active: true,
    email_verified: true
  };

  const data = { ...defaults, ...overrides };

  // Hash password (simplified for tests - in production use bcrypt)
  const passwordHash = crypto.createHash('sha256').update('testpassword123').digest('hex');

  const result = await db.query(
    `INSERT INTO users (organization_id, email, first_name, last_name, role, is_active, password_hash, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, email, first_name, last_name, role, organization_id`,
    [organizationId, data.email, data.first_name, data.last_name, data.role, data.is_active, passwordHash, data.email_verified]
  );

  return result.rows[0];
}

/**
 * Create a test session for a user
 * @param {string} userId - User UUID
 * @returns {Promise<object>} Session with ID and token
 */
export async function createTestSession(userId) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.query(
    `INSERT INTO sessions (id, user_id, expires_at, fresh)
     VALUES ($1, $2, $3, true)`,
    [sessionId, userId, expiresAt]
  );

  return {
    sessionId,
    expiresAt,
    cookie: `session=${sessionId}`
  };
}

/**
 * Create a test patient
 * @param {string} organizationId - Organization UUID
 * @param {object} overrides - Override default values
 * @returns {Promise<object>} Created patient
 */
export async function createTestPatient(organizationId, overrides = {}) {
  const timestamp = Date.now();
  const defaults = {
    solvit_id: `TEST-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
    first_name: 'Test',
    last_name: `Patient${timestamp}`,
    email: `patient${timestamp}@test.com`,
    phone: '+4712345678',
    date_of_birth: '1990-01-01',
    lifecycle_stage: 'ACTIVE'
  };

  const data = { ...defaults, ...overrides };

  const result = await db.query(
    `INSERT INTO patients (organization_id, solvit_id, first_name, last_name, email, phone, date_of_birth, lifecycle_stage)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [organizationId, data.solvit_id, data.first_name, data.last_name, data.email, data.phone, data.date_of_birth, data.lifecycle_stage]
  );

  return result.rows[0];
}

/**
 * Create a test encounter
 * @param {string} organizationId - Organization UUID
 * @param {string} patientId - Patient UUID
 * @param {string} practitionerId - Practitioner UUID
 * @param {object} overrides - Override default values
 * @returns {Promise<object>} Created encounter
 */
export async function createTestEncounter(organizationId, patientId, practitionerId, overrides = {}) {
  const defaults = {
    encounter_type: 'FOLLOWUP',
    status: 'in_progress',
    chief_complaint: 'Test complaint',
    subjective: {},
    objective: {},
    assessment: {},
    plan: {}
  };

  const data = { ...defaults, ...overrides };

  const result = await db.query(
    `INSERT INTO clinical_encounters (organization_id, patient_id, practitioner_id, encounter_type, status, encounter_date, subjective, objective, assessment, plan)
     VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9)
     RETURNING *`,
    [organizationId, patientId, practitionerId, data.encounter_type, data.status, JSON.stringify(data.subjective), JSON.stringify(data.objective), JSON.stringify(data.assessment), JSON.stringify(data.plan)]
  );

  return result.rows[0];
}

/**
 * Create a test lead for CRM
 * @param {string} organizationId - Organization UUID
 * @param {object} overrides - Override default values
 * @returns {Promise<object>} Created lead
 */
export async function createTestLead(organizationId, overrides = {}) {
  const timestamp = Date.now();
  const defaults = {
    first_name: 'Lead',
    last_name: `Test${timestamp}`,
    email: `lead${timestamp}@test.com`,
    phone: '+4798765432',
    source: 'WEBSITE',
    status: 'NEW',
    temperature: 'WARM'
  };

  const data = { ...defaults, ...overrides };

  const result = await db.query(
    `INSERT INTO leads (organization_id, first_name, last_name, email, phone, source, status, temperature)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [organizationId, data.first_name, data.last_name, data.email, data.phone, data.source, data.status, data.temperature]
  );

  return result.rows[0];
}

/**
 * Create a test campaign
 * @param {string} organizationId - Organization UUID
 * @param {object} overrides - Override default values
 * @returns {Promise<object>} Created campaign
 */
export async function createTestCampaign(organizationId, overrides = {}) {
  const defaults = {
    name: `Test Campaign ${Date.now()}`,
    campaign_type: 'RECALL',
    status: 'DRAFT',
    email_subject: 'Test Subject',
    email_template: 'Test content',
    sms_template: 'Test SMS'
  };

  const data = { ...defaults, ...overrides };

  const result = await db.query(
    `INSERT INTO campaigns (organization_id, name, campaign_type, status, email_subject, email_template, sms_template)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [organizationId, data.name, data.campaign_type, data.status, data.email_subject, data.email_template, data.sms_template]
  );

  return result.rows[0];
}

/**
 * Set tenant context for RLS
 * @param {string} organizationId - Organization UUID
 */
export async function setTenantContext(organizationId) {
  await db.query(`SELECT set_config('app.current_tenant', $1, false)`, [organizationId]);
}

/**
 * Cleanup test organization and all related data
 * @param {string} organizationId - Organization UUID to cleanup
 */
export async function cleanupTestData(organizationId) {
  if (!organizationId) return;

  // Helper to safely delete from a table (ignores if table doesn't exist)
  const safeDelete = async (query, params) => {
    try {
      await db.query(query, params);
    } catch (error) {
      // Ignore "relation does not exist" errors
      if (!error.message.includes('does not exist')) {
        console.error('Cleanup error:', error.message);
      }
    }
  };

  // Delete in correct order due to foreign keys
  await safeDelete('DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE organization_id = $1)', [organizationId]);
  await safeDelete('DELETE FROM encounter_amendments WHERE encounter_id IN (SELECT id FROM clinical_encounters WHERE organization_id = $1)', [organizationId]);
  await safeDelete('DELETE FROM clinical_encounters WHERE organization_id = $1', [organizationId]);
  await safeDelete('DELETE FROM leads WHERE organization_id = $1', [organizationId]);
  await safeDelete('DELETE FROM campaigns WHERE organization_id = $1', [organizationId]);
  await safeDelete('DELETE FROM patients WHERE organization_id = $1', [organizationId]);
  await safeDelete('DELETE FROM users WHERE organization_id = $1', [organizationId]);
  await safeDelete('DELETE FROM organizations WHERE id = $1', [organizationId]);
}

/**
 * Generate a random UUID for testing non-existent resources
 * @returns {string} Random UUID
 */
export function randomUUID() {
  return crypto.randomUUID();
}

/**
 * Wait for a specified duration (useful for rate limiting tests)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
