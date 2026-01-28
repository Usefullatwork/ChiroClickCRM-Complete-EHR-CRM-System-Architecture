/**
 * CRM API Integration Tests
 * Tests for Customer Relationship Management endpoints
 */

import request from 'supertest';
import app from '../../../src/server.js';
import db from '../../../src/config/database.js';
import {
  createTestOrganization,
  createTestUser,
  createTestSession,
  createTestPatient,
  createTestLead,
  createTestCampaign,
  cleanupTestData,
  setTenantContext,
  randomUUID
} from '../../helpers/testUtils.js';

describe('CRM API Integration Tests', () => {
  let testOrg;
  let testUser;
  let testSession;
  let testPatient;
  let testLead;

  beforeAll(async () => {
    // Create test organization
    testOrg = await createTestOrganization({ name: 'CRM Test Clinic' });

    // Set tenant context for RLS
    await setTenantContext(testOrg.id);

    // Create test user
    testUser = await createTestUser(testOrg.id, { role: 'ADMIN' });

    // Create session
    testSession = await createTestSession(testUser.id);

    // Create test patient for lifecycle tests
    testPatient = await createTestPatient(testOrg.id);

    // Create test lead
    testLead = await createTestLead(testOrg.id);
  });

  afterAll(async () => {
    await cleanupTestData(testOrg?.id);
    await db.closePool();
  });

  // =============================================================================
  // CRM OVERVIEW
  // =============================================================================

  describe('GET /api/v1/crm/overview', () => {
    it('should return CRM dashboard metrics', async () => {
      const response = await request(app)
        .get('/api/v1/crm/overview')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toHaveProperty('totalLeads');
      expect(response.body).toHaveProperty('newLeadsThisMonth');
      expect(response.body).toHaveProperty('conversionRate');
      expect(response.body).toHaveProperty('activePatients');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/crm/overview')
        .set('X-Organization-Id', testOrg.id)
        .expect(401);
    });

    it('should require organization ID', async () => {
      await request(app)
        .get('/api/v1/crm/overview')
        .set('Cookie', testSession.cookie)
        .expect(400);
    });
  });

  // =============================================================================
  // LEADS
  // =============================================================================

  describe('GET /api/v1/crm/leads', () => {
    it('should return paginated lead list', async () => {
      const response = await request(app)
        .get('/api/v1/crm/leads')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toHaveProperty('leads');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.leads)).toBe(true);
    });

    it('should filter leads by status', async () => {
      const response = await request(app)
        .get('/api/v1/crm/leads')
        .query({ status: 'NEW' })
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      response.body.leads.forEach(lead => {
        expect(lead.status).toBe('NEW');
      });
    });

    it('should filter leads by temperature', async () => {
      const response = await request(app)
        .get('/api/v1/crm/leads')
        .query({ temperature: 'WARM' })
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      response.body.leads.forEach(lead => {
        expect(lead.temperature).toBe('WARM');
      });
    });

    it('should search leads by name', async () => {
      const response = await request(app)
        .get('/api/v1/crm/leads')
        .query({ search: testLead.first_name })
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body.leads.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/crm/leads')
        .query({ page: 1, limit: 5 })
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
    });
  });

  describe('GET /api/v1/crm/leads/pipeline', () => {
    it('should return pipeline statistics', async () => {
      const response = await request(app)
        .get('/api/v1/crm/leads/pipeline')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toHaveProperty('stages');
      expect(Array.isArray(response.body.stages)).toBe(true);
    });
  });

  describe('GET /api/v1/crm/leads/:id', () => {
    it('should return lead by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/crm/leads/${testLead.id}`)
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body.id).toBe(testLead.id);
      expect(response.body.first_name).toBe(testLead.first_name);
    });

    it('should return 404 for non-existent lead', async () => {
      await request(app)
        .get(`/api/v1/crm/leads/${randomUUID()}`)
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(404);
    });

    it('should enforce organization isolation', async () => {
      const otherOrg = await createTestOrganization({ name: 'Other Org' });

      await request(app)
        .get(`/api/v1/crm/leads/${testLead.id}`)
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', otherOrg.id)
        .expect(404);

      await db.query('DELETE FROM organizations WHERE id = $1', [otherOrg.id]);
    });
  });

  describe('POST /api/v1/crm/leads', () => {
    it('should create a new lead', async () => {
      const leadData = {
        first_name: 'New',
        last_name: 'Lead',
        email: `newlead${Date.now()}@test.com`,
        phone: '+4799999999',
        source: 'referral',
        notes: 'Interested in chiropractic care'
      };

      const response = await request(app)
        .post('/api/v1/crm/leads')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send(leadData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.first_name).toBe(leadData.first_name);
      expect(response.body.status).toBe('NEW');
    });

    it('should reject lead without required fields', async () => {
      await request(app)
        .post('/api/v1/crm/leads')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send({ first_name: 'Only' })
        .expect(400);
    });

    it('should reject lead with invalid email', async () => {
      await request(app)
        .post('/api/v1/crm/leads')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send({
          first_name: 'Test',
          last_name: 'Invalid',
          email: 'not-an-email'
        })
        .expect(400);
    });
  });

  describe('PUT /api/v1/crm/leads/:id', () => {
    it('should update a lead', async () => {
      const updates = {
        status: 'contacted',
        temperature: 'hot',
        notes: 'Called and scheduled consultation'
      };

      const response = await request(app)
        .put(`/api/v1/crm/leads/${testLead.id}`)
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send(updates)
        .expect(200);

      expect(response.body.status).toBe('contacted');
      expect(response.body.temperature).toBe('hot');
    });
  });

  describe('POST /api/v1/crm/leads/:id/convert', () => {
    let convertibleLead;

    beforeAll(async () => {
      convertibleLead = await createTestLead(testOrg.id, {
        first_name: 'Convertible',
        last_name: 'Lead',
        email: `convert${Date.now()}@test.com`,
        status: 'qualified'
      });
    });

    it('should convert lead to patient', async () => {
      const response = await request(app)
        .post(`/api/v1/crm/leads/${convertibleLead.id}/convert`)
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send({ date_of_birth: '1985-05-15' })
        .expect(200);

      expect(response.body).toHaveProperty('patient');
      expect(response.body.patient.first_name).toBe('Convertible');
    });
  });

  // =============================================================================
  // LIFECYCLE
  // =============================================================================

  describe('GET /api/v1/crm/lifecycle', () => {
    it('should return patients by lifecycle stage', async () => {
      const response = await request(app)
        .get('/api/v1/crm/lifecycle')
        .query({ stage: 'active' })
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toHaveProperty('patients');
      expect(Array.isArray(response.body.patients)).toBe(true);
    });
  });

  describe('GET /api/v1/crm/lifecycle/stats', () => {
    it('should return lifecycle statistics', async () => {
      const response = await request(app)
        .get('/api/v1/crm/lifecycle/stats')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toHaveProperty('stages');
    });
  });

  describe('PUT /api/v1/crm/lifecycle/:patientId', () => {
    it('should update patient lifecycle stage', async () => {
      const response = await request(app)
        .put(`/api/v1/crm/lifecycle/${testPatient.id}`)
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send({ stage: 'at_risk', reason: 'No appointment in 60 days' })
        .expect(200);

      expect(response.body.lifecycle_stage).toBe('at_risk');
    });
  });

  // =============================================================================
  // CAMPAIGNS
  // =============================================================================

  describe('GET /api/v1/crm/campaigns', () => {
    let testCampaign;

    beforeAll(async () => {
      testCampaign = await createTestCampaign(testOrg.id);
    });

    it('should return campaign list', async () => {
      const response = await request(app)
        .get('/api/v1/crm/campaigns')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toHaveProperty('campaigns');
      expect(Array.isArray(response.body.campaigns)).toBe(true);
    });

    it('should filter campaigns by status', async () => {
      const response = await request(app)
        .get('/api/v1/crm/campaigns')
        .query({ status: 'draft' })
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      response.body.campaigns.forEach(campaign => {
        expect(campaign.status).toBe('draft');
      });
    });
  });

  describe('POST /api/v1/crm/campaigns', () => {
    it('should create a new campaign', async () => {
      const campaignData = {
        name: 'Welcome Campaign',
        type: 'email',
        subject: 'Welcome to our clinic!',
        content: 'Thank you for becoming a patient.',
        target_audience: { lifecycle_stage: 'new' }
      };

      const response = await request(app)
        .post('/api/v1/crm/campaigns')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send(campaignData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(campaignData.name);
      expect(response.body.status).toBe('draft');
    });
  });

  // =============================================================================
  // RETENTION
  // =============================================================================

  describe('GET /api/v1/crm/retention', () => {
    it('should return retention dashboard', async () => {
      const response = await request(app)
        .get('/api/v1/crm/retention')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toHaveProperty('retentionRate');
      expect(response.body).toHaveProperty('atRiskPatients');
    });

    it('should accept period parameter', async () => {
      const response = await request(app)
        .get('/api/v1/crm/retention')
        .query({ period: '90d' })
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toHaveProperty('retentionRate');
    });
  });

  describe('GET /api/v1/crm/retention/churn', () => {
    it('should return churn analysis', async () => {
      const response = await request(app)
        .get('/api/v1/crm/retention/churn')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toHaveProperty('churnRate');
      expect(response.body).toHaveProperty('churnedPatients');
    });
  });

  describe('GET /api/v1/crm/retention/cohorts', () => {
    it('should return cohort retention data', async () => {
      const response = await request(app)
        .get('/api/v1/crm/retention/cohorts')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toHaveProperty('cohorts');
      expect(Array.isArray(response.body.cohorts)).toBe(true);
    });
  });

  // =============================================================================
  // REFERRALS
  // =============================================================================

  describe('GET /api/v1/crm/referrals', () => {
    it('should return referral list', async () => {
      const response = await request(app)
        .get('/api/v1/crm/referrals')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toHaveProperty('referrals');
      expect(Array.isArray(response.body.referrals)).toBe(true);
    });
  });

  describe('GET /api/v1/crm/referrals/stats', () => {
    it('should return referral statistics', async () => {
      const response = await request(app)
        .get('/api/v1/crm/referrals/stats')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toHaveProperty('totalReferrals');
      expect(response.body).toHaveProperty('conversionRate');
    });
  });

  describe('POST /api/v1/crm/referrals', () => {
    it('should create a new referral', async () => {
      const referralData = {
        referrer_id: testPatient.id,
        referred_name: 'Friend Patient',
        referred_email: `referred${Date.now()}@test.com`,
        referred_phone: '+4711111111'
      };

      const response = await request(app)
        .post('/api/v1/crm/referrals')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send(referralData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.referrer_id).toBe(testPatient.id);
    });
  });

  // =============================================================================
  // SURVEYS & NPS
  // =============================================================================

  describe('GET /api/v1/crm/surveys/nps/stats', () => {
    it('should return NPS statistics', async () => {
      const response = await request(app)
        .get('/api/v1/crm/surveys/nps/stats')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toHaveProperty('npsScore');
      expect(response.body).toHaveProperty('promoters');
      expect(response.body).toHaveProperty('detractors');
      expect(response.body).toHaveProperty('passives');
    });
  });

  // =============================================================================
  // WORKFLOWS
  // =============================================================================

  describe('GET /api/v1/crm/workflows', () => {
    it('should return workflow list', async () => {
      const response = await request(app)
        .get('/api/v1/crm/workflows')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toHaveProperty('workflows');
      expect(Array.isArray(response.body.workflows)).toBe(true);
    });
  });

  describe('POST /api/v1/crm/workflows', () => {
    it('should create a new workflow', async () => {
      const workflowData = {
        name: 'Welcome Workflow',
        trigger: 'new_patient',
        actions: [
          { type: 'send_email', template: 'welcome' },
          { type: 'wait', duration: '3d' },
          { type: 'send_sms', template: 'follow_up' }
        ]
      };

      const response = await request(app)
        .post('/api/v1/crm/workflows')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send(workflowData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(workflowData.name);
    });
  });

  // =============================================================================
  // WAITLIST
  // =============================================================================

  describe('GET /api/v1/crm/waitlist', () => {
    it('should return waitlist entries', async () => {
      const response = await request(app)
        .get('/api/v1/crm/waitlist')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toHaveProperty('entries');
      expect(Array.isArray(response.body.entries)).toBe(true);
    });
  });

  describe('POST /api/v1/crm/waitlist', () => {
    it('should add patient to waitlist', async () => {
      const waitlistData = {
        patient_id: testPatient.id,
        preferred_time: 'morning',
        preferred_days: ['monday', 'wednesday', 'friday'],
        notes: 'Prefers early appointments'
      };

      const response = await request(app)
        .post('/api/v1/crm/waitlist')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send(waitlistData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.patient_id).toBe(testPatient.id);
    });
  });

  // =============================================================================
  // CRM SETTINGS
  // =============================================================================

  describe('GET /api/v1/crm/settings', () => {
    it('should return CRM settings', async () => {
      const response = await request(app)
        .get('/api/v1/crm/settings')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toHaveProperty('settings');
    });
  });

  describe('PUT /api/v1/crm/settings', () => {
    it('should update CRM settings (admin only)', async () => {
      const settings = {
        lead_auto_assign: true,
        follow_up_days: 7,
        nps_survey_enabled: true
      };

      const response = await request(app)
        .put('/api/v1/crm/settings')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send(settings)
        .expect(200);

      expect(response.body.settings.lead_auto_assign).toBe(true);
    });

    it('should reject non-admin users', async () => {
      const practitioner = await createTestUser(testOrg.id, {
        role: 'PRACTITIONER',
        email: `practitioner${Date.now()}@test.com`
      });
      const practitionerSession = await createTestSession(practitioner.id);

      await request(app)
        .put('/api/v1/crm/settings')
        .set('Cookie', practitionerSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send({ lead_auto_assign: false })
        .expect(403);
    });
  });
});
