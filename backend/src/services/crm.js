/**
 * CRM Service
 * Business logic for Customer Relationship Management
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

// =============================================================================
// LEADS
// =============================================================================

/**
 * Get leads with filters and pagination
 */
export const getLeads = async (clinicId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    status,
    source,
    assignedTo,
    temperature,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = options;

  const offset = (page - 1) * limit;
  const params = [clinicId];
  let paramCount = 1;

  let whereClause = 'WHERE l.organization_id = $1';

  if (status) {
    paramCount++;
    whereClause += ` AND l.status = $${paramCount}`;
    params.push(status);
  }

  if (source) {
    paramCount++;
    whereClause += ` AND l.source = $${paramCount}`;
    params.push(source);
  }

  if (assignedTo) {
    paramCount++;
    whereClause += ` AND l.assigned_to = $${paramCount}`;
    params.push(assignedTo);
  }

  if (temperature) {
    paramCount++;
    whereClause += ` AND l.temperature = $${paramCount}`;
    params.push(temperature);
  }

  if (search) {
    paramCount++;
    whereClause += ` AND (l.first_name ILIKE $${paramCount} OR l.last_name ILIKE $${paramCount} OR l.email ILIKE $${paramCount} OR l.phone ILIKE $${paramCount})`;
    params.push(`%${search}%`);
  }

  const validSortColumns = ['created_at', 'first_name', 'last_name', 'score', 'status', 'next_follow_up_date'];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM leads l ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total);

  // Get leads
  params.push(limit, offset);
  const result = await query(
    `SELECT l.*, u.first_name as assigned_first_name, u.last_name as assigned_last_name
     FROM leads l
     LEFT JOIN users u ON l.assigned_to = u.id
     ${whereClause}
     ORDER BY ${sortColumn} ${order}
     LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
    params
  );

  return {
    leads: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get lead by ID
 */
export const getLeadById = async (clinicId, leadId) => {
  const result = await query(
    `SELECT l.*,
            u.first_name as assigned_first_name, u.last_name as assigned_last_name,
            p.id as converted_patient_id, p.first_name as converted_patient_first_name
     FROM leads l
     LEFT JOIN users u ON l.assigned_to = u.id
     LEFT JOIN patients p ON l.converted_patient_id = p.id
     WHERE l.organization_id = $1 AND l.id = $2`,
    [clinicId, leadId]
  );

  if (result.rows.length === 0) return null;

  // Get activities
  const activities = await query(
    `SELECT la.*, u.first_name, u.last_name
     FROM lead_activities la
     LEFT JOIN users u ON la.user_id = u.id
     WHERE la.lead_id = $1
     ORDER BY la.created_at DESC
     LIMIT 50`,
    [leadId]
  );

  return {
    ...result.rows[0],
    activities: activities.rows
  };
};

/**
 * Create lead
 */
export const createLead = async (data) => {
  const {
    organization_id, first_name, last_name, email, phone, source, source_detail,
    primary_interest, chief_complaint, notes, assigned_to
  } = data;

  const result = await query(
    `INSERT INTO leads (
      organization_id, first_name, last_name, email, phone, source, source_detail,
      primary_interest, chief_complaint, notes, assigned_to, temperature
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'WARM')
    RETURNING *`,
    [organization_id, first_name, last_name, email, phone, source, source_detail,
     primary_interest, chief_complaint, notes, assigned_to]
  );

  // Log activity
  await query(
    `INSERT INTO lead_activities (lead_id, activity_type, description)
     VALUES ($1, 'CREATED', 'Lead opprettet')`,
    [result.rows[0].id]
  );

  return result.rows[0];
};

/**
 * Update lead
 */
export const updateLead = async (clinicId, leadId, data) => {
  const fields = [];
  const values = [clinicId, leadId];
  let paramCount = 2;

  const allowedFields = [
    'first_name', 'last_name', 'email', 'phone', 'status', 'score',
    'temperature', 'assigned_to', 'primary_interest', 'chief_complaint',
    'notes', 'next_follow_up_date', 'lost_reason'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
    }
  }

  if (fields.length === 0) return null;

  fields.push('updated_at = CURRENT_TIMESTAMP');

  const result = await query(
    `UPDATE leads SET ${fields.join(', ')}
     WHERE organization_id = $1 AND id = $2
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * Convert lead to patient
 */
export const convertLeadToPatient = async (clinicId, leadId, patientData) => {
  const lead = await getLeadById(clinicId, leadId);
  if (!lead) throw new Error('Lead not found');

  // Create patient from lead data
  const patientResult = await query(
    `INSERT INTO patients (
      organization_id, first_name, last_name, email, phone,
      acquisition_source, lifecycle_stage, status
    ) VALUES ($1, $2, $3, $4, $5, $6, 'NEW', 'ACTIVE')
    RETURNING *`,
    [clinicId, lead.first_name, lead.last_name, lead.email, lead.phone, lead.source]
  );

  const patient = patientResult.rows[0];

  // Update lead status
  await query(
    `UPDATE leads SET
      status = 'CONVERTED',
      converted_patient_id = $1,
      converted_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [patient.id, leadId]
  );

  // Log activity
  await query(
    `INSERT INTO lead_activities (lead_id, activity_type, description, new_value)
     VALUES ($1, 'CONVERTED', 'Lead konvertert til pasient', $2)`,
    [leadId, patient.id]
  );

  return { lead, patient };
};

/**
 * Get lead pipeline stats
 */
export const getLeadPipelineStats = async (clinicId) => {
  const result = await query(
    `SELECT
      status,
      COUNT(*) as count,
      AVG(score) as avg_score
     FROM leads
     WHERE organization_id = $1
     GROUP BY status
     ORDER BY
       CASE status
         WHEN 'NEW' THEN 1
         WHEN 'CONTACTED' THEN 2
         WHEN 'QUALIFIED' THEN 3
         WHEN 'APPOINTMENT_BOOKED' THEN 4
         WHEN 'SHOWED' THEN 5
         WHEN 'CONVERTED' THEN 6
         WHEN 'LOST' THEN 7
         WHEN 'NURTURING' THEN 8
       END`,
    [clinicId]
  );

  // Calculate conversion rate
  const totalResult = await query(
    `SELECT
      COUNT(*) FILTER (WHERE status = 'CONVERTED') as converted,
      COUNT(*) as total
     FROM leads WHERE organization_id = $1`,
    [clinicId]
  );

  const { converted, total } = totalResult.rows[0];

  return {
    stages: result.rows,
    conversionRate: total > 0 ? (converted / total * 100).toFixed(1) : 0,
    totalLeads: parseInt(total)
  };
};

// =============================================================================
// PATIENT LIFECYCLE
// =============================================================================

/**
 * Get patients by lifecycle stage
 */
export const getPatientsByLifecycle = async (clinicId, options = {}) => {
  const { stage, page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;
  const params = [clinicId];
  let paramCount = 1;

  let whereClause = 'WHERE organization_id = $1';
  if (stage) {
    paramCount++;
    whereClause += ` AND lifecycle_stage = $${paramCount}`;
    params.push(stage);
  }

  const countResult = await query(
    `SELECT COUNT(*) as total FROM patients ${whereClause}`,
    params
  );

  params.push(limit, offset);
  const result = await query(
    `SELECT id, first_name, last_name, email, phone, lifecycle_stage,
            engagement_score, is_vip, last_visit_date, total_visits, tags
     FROM patients
     ${whereClause}
     ORDER BY last_visit_date DESC NULLS LAST
     LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
    params
  );

  return {
    patients: result.rows,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].total),
      totalPages: Math.ceil(countResult.rows[0].total / limit)
    }
  };
};

/**
 * Get lifecycle statistics
 */
export const getLifecycleStats = async (clinicId) => {
  const result = await query(
    `SELECT
      lifecycle_stage,
      COUNT(*) as count,
      AVG(engagement_score) as avg_engagement,
      AVG(total_revenue) as avg_revenue
     FROM patients
     WHERE organization_id = $1
     GROUP BY lifecycle_stage`,
    [clinicId]
  );

  return result.rows;
};

/**
 * Update patient lifecycle
 */
export const updatePatientLifecycle = async (clinicId, patientId, data) => {
  const { stage, engagementScore, tags } = data;
  const updates = [];
  const params = [clinicId, patientId];
  let paramCount = 2;

  if (stage) {
    paramCount++;
    updates.push(`lifecycle_stage = $${paramCount}`);
    params.push(stage);
  }

  if (engagementScore !== undefined) {
    paramCount++;
    updates.push(`engagement_score = $${paramCount}`);
    params.push(engagementScore);
  }

  if (tags) {
    paramCount++;
    updates.push(`tags = $${paramCount}`);
    params.push(JSON.stringify(tags));
  }

  if (updates.length === 0) return null;

  const result = await query(
    `UPDATE patients SET ${updates.join(', ')}
     WHERE organization_id = $1 AND id = $2
     RETURNING *`,
    params
  );

  return result.rows[0];
};

// =============================================================================
// REFERRALS
// =============================================================================

/**
 * Get referrals
 */
export const getReferrals = async (clinicId, options = {}) => {
  const { page = 1, limit = 20, status } = options;
  const offset = (page - 1) * limit;
  const params = [clinicId];
  let paramCount = 1;

  let whereClause = 'WHERE r.organization_id = $1';
  if (status) {
    paramCount++;
    whereClause += ` AND r.status = $${paramCount}`;
    params.push(status);
  }

  const countResult = await query(
    `SELECT COUNT(*) as total FROM referrals r ${whereClause}`,
    params
  );

  params.push(limit, offset);
  const result = await query(
    `SELECT r.*,
            rp.first_name as referrer_first_name, rp.last_name as referrer_last_name,
            ref.first_name as referred_first_name, ref.last_name as referred_last_name
     FROM referrals r
     LEFT JOIN patients rp ON r.referrer_patient_id = rp.id
     LEFT JOIN patients ref ON r.referred_patient_id = ref.id
     ${whereClause}
     ORDER BY r.created_at DESC
     LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
    params
  );

  return {
    referrals: result.rows,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].total),
      totalPages: Math.ceil(countResult.rows[0].total / limit)
    }
  };
};

/**
 * Create referral
 */
export const createReferral = async (data) => {
  const {
    organization_id, referrer_patient_id, referrer_name, referrer_email, referrer_phone,
    referred_name, referred_email, referred_phone, reward_type, reward_amount,
    reward_description, notes
  } = data;

  const result = await query(
    `INSERT INTO referrals (
      organization_id, referrer_patient_id, referrer_name, referrer_email, referrer_phone,
      referred_name, referred_email, referred_phone, reward_type, reward_amount,
      reward_description, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [organization_id, referrer_patient_id, referrer_name, referrer_email, referrer_phone,
     referred_name, referred_email, referred_phone, reward_type, reward_amount,
     reward_description, notes]
  );

  // Update referrer's referral count
  if (referrer_patient_id) {
    await query(
      `UPDATE patients SET referral_count = referral_count + 1 WHERE id = $1`,
      [referrer_patient_id]
    );
  }

  return result.rows[0];
};

/**
 * Update referral
 */
export const updateReferral = async (clinicId, referralId, data) => {
  const fields = [];
  const values = [clinicId, referralId];
  let paramCount = 2;

  const allowedFields = ['status', 'reward_issued', 'notes', 'referred_patient_id'];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(value);

      if (key === 'reward_issued' && value === true) {
        fields.push('reward_issued_at = CURRENT_TIMESTAMP');
      }
      if (key === 'status' && value === 'CONVERTED') {
        fields.push('converted_at = CURRENT_TIMESTAMP');
      }
    }
  }

  if (fields.length === 0) return null;

  const result = await query(
    `UPDATE referrals SET ${fields.join(', ')}
     WHERE organization_id = $1 AND id = $2
     RETURNING *`,
    values
  );

  return result.rows[0];
};

/**
 * Get referral stats
 */
export const getReferralStats = async (clinicId) => {
  const result = await query(
    `SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
      COUNT(*) FILTER (WHERE status = 'CONVERTED') as converted,
      COUNT(*) FILTER (WHERE reward_issued = true) as rewards_issued,
      SUM(CASE WHEN reward_issued = true THEN reward_amount ELSE 0 END) as total_rewards
     FROM referrals
     WHERE organization_id = $1`,
    [clinicId]
  );

  return result.rows[0];
};

// =============================================================================
// SURVEYS
// =============================================================================

/**
 * Get surveys
 */
export const getSurveys = async (clinicId) => {
  const result = await query(
    `SELECT s.*,
            COUNT(sr.id) as total_responses,
            AVG(sr.nps_score) as avg_nps
     FROM surveys s
     LEFT JOIN survey_responses sr ON s.id = sr.survey_id
     WHERE s.organization_id = $1
     GROUP BY s.id
     ORDER BY s.created_at DESC`,
    [clinicId]
  );

  return result.rows;
};

/**
 * Create survey
 */
export const createSurvey = async (data) => {
  const { organization_id, name, description, survey_type, questions, auto_send, send_after_days } = data;

  const result = await query(
    `INSERT INTO surveys (organization_id, name, description, survey_type, questions, auto_send, send_after_days)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [organization_id, name, description, survey_type, JSON.stringify(questions || []), auto_send, send_after_days]
  );

  return result.rows[0];
};

/**
 * Get survey responses
 */
export const getSurveyResponses = async (clinicId, surveyId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM survey_responses sr
     JOIN surveys s ON sr.survey_id = s.id
     WHERE s.organization_id = $1 AND sr.survey_id = $2`,
    [clinicId, surveyId]
  );

  const result = await query(
    `SELECT sr.*, p.first_name, p.last_name
     FROM survey_responses sr
     JOIN surveys s ON sr.survey_id = s.id
     LEFT JOIN patients p ON sr.patient_id = p.id
     WHERE s.organization_id = $1 AND sr.survey_id = $2
     ORDER BY sr.completed_at DESC NULLS LAST
     LIMIT $3 OFFSET $4`,
    [clinicId, surveyId, limit, offset]
  );

  return {
    responses: result.rows,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].total),
      totalPages: Math.ceil(countResult.rows[0].total / limit)
    }
  };
};

/**
 * Get NPS stats
 */
export const getNPSStats = async (clinicId, period = '30d') => {
  const days = parseInt(period) || 30;

  const result = await query(
    `SELECT
      COUNT(*) FILTER (WHERE nps_category = 'PROMOTER') as promoters,
      COUNT(*) FILTER (WHERE nps_category = 'PASSIVE') as passives,
      COUNT(*) FILTER (WHERE nps_category = 'DETRACTOR') as detractors,
      COUNT(*) as total,
      AVG(nps_score) as avg_score
     FROM survey_responses sr
     JOIN surveys s ON sr.survey_id = s.id
     WHERE s.organization_id = $1
       AND sr.nps_score IS NOT NULL
       AND sr.completed_at >= CURRENT_DATE - INTERVAL '${days} days'`,
    [clinicId]
  );

  const data = result.rows[0];
  const total = parseInt(data.total) || 1;
  const nps = ((data.promoters / total) - (data.detractors / total)) * 100;

  return {
    nps: Math.round(nps),
    promoters: parseInt(data.promoters),
    passives: parseInt(data.passives),
    detractors: parseInt(data.detractors),
    total: parseInt(data.total),
    avgScore: parseFloat(data.avg_score) || 0
  };
};

// =============================================================================
// COMMUNICATIONS
// =============================================================================

/**
 * Get communication history
 */
export const getCommunicationHistory = async (clinicId, options = {}) => {
  const { page = 1, limit = 50, patientId, leadId, channel, direction } = options;
  const offset = (page - 1) * limit;
  const params = [clinicId];
  let paramCount = 1;

  let whereClause = 'WHERE cl.organization_id = $1';

  if (patientId) {
    paramCount++;
    whereClause += ` AND cl.patient_id = $${paramCount}`;
    params.push(patientId);
  }

  if (leadId) {
    paramCount++;
    whereClause += ` AND cl.lead_id = $${paramCount}`;
    params.push(leadId);
  }

  if (channel) {
    paramCount++;
    whereClause += ` AND cl.channel = $${paramCount}`;
    params.push(channel);
  }

  if (direction) {
    paramCount++;
    whereClause += ` AND cl.direction = $${paramCount}`;
    params.push(direction);
  }

  const countResult = await query(
    `SELECT COUNT(*) as total FROM communication_log cl ${whereClause}`,
    params
  );

  params.push(limit, offset);
  const result = await query(
    `SELECT cl.*,
            p.first_name as patient_first_name, p.last_name as patient_last_name,
            u.first_name as user_first_name, u.last_name as user_last_name
     FROM communication_log cl
     LEFT JOIN patients p ON cl.patient_id = p.id
     LEFT JOIN users u ON cl.user_id = u.id
     ${whereClause}
     ORDER BY cl.created_at DESC
     LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
    params
  );

  return {
    communications: result.rows,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].total),
      totalPages: Math.ceil(countResult.rows[0].total / limit)
    }
  };
};

/**
 * Log communication
 */
export const logCommunication = async (data) => {
  const {
    organization_id, patient_id, lead_id, user_id, channel, direction,
    subject, message, template_used, contact_value, status, campaign_id
  } = data;

  const result = await query(
    `INSERT INTO communication_log (
      organization_id, patient_id, lead_id, user_id, channel, direction,
      subject, message, template_used, contact_value, status, campaign_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [organization_id, patient_id, lead_id, user_id, channel, direction,
     subject, message, template_used, contact_value, status || 'SENT', campaign_id]
  );

  // Update patient last contact date
  if (patient_id) {
    await query(
      `UPDATE patients SET last_contact_date = CURRENT_TIMESTAMP WHERE id = $1`,
      [patient_id]
    );
  }

  return result.rows[0];
};

// =============================================================================
// CAMPAIGNS
// =============================================================================

/**
 * Get campaigns
 */
export const getCampaigns = async (clinicId, options = {}) => {
  const { page = 1, limit = 20, status, type } = options;
  const offset = (page - 1) * limit;
  const params = [clinicId];
  let paramCount = 1;

  let whereClause = 'WHERE organization_id = $1';

  if (status) {
    paramCount++;
    whereClause += ` AND status = $${paramCount}`;
    params.push(status);
  }

  if (type) {
    paramCount++;
    whereClause += ` AND campaign_type = $${paramCount}`;
    params.push(type);
  }

  const countResult = await query(
    `SELECT COUNT(*) as total FROM campaigns ${whereClause}`,
    params
  );

  params.push(limit, offset);
  const result = await query(
    `SELECT * FROM campaigns
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
    params
  );

  return {
    campaigns: result.rows,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].total),
      totalPages: Math.ceil(countResult.rows[0].total / limit)
    }
  };
};

/**
 * Get campaign by ID
 */
export const getCampaignById = async (clinicId, campaignId) => {
  const result = await query(
    `SELECT * FROM campaigns WHERE organization_id = $1 AND id = $2`,
    [clinicId, campaignId]
  );
  return result.rows[0] || null;
};

/**
 * Create campaign
 */
export const createCampaign = async (data) => {
  const {
    organization_id, name, description, campaign_type, channels,
    sms_template, email_subject, email_template, target_segment,
    scheduled_at, created_by
  } = data;

  const result = await query(
    `INSERT INTO campaigns (
      organization_id, name, description, campaign_type, channels,
      sms_template, email_subject, email_template, target_segment,
      scheduled_at, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [organization_id, name, description, campaign_type, JSON.stringify(channels || ['SMS']),
     sms_template, email_subject, email_template, JSON.stringify(target_segment || {}),
     scheduled_at, created_by]
  );

  return result.rows[0];
};

/**
 * Update campaign
 */
export const updateCampaign = async (clinicId, campaignId, data) => {
  const fields = [];
  const values = [clinicId, campaignId];
  let paramCount = 2;

  const allowedFields = [
    'name', 'description', 'campaign_type', 'channels', 'sms_template',
    'email_subject', 'email_template', 'target_segment', 'status', 'scheduled_at'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
    }
  }

  if (fields.length === 0) return null;

  fields.push('updated_at = CURRENT_TIMESTAMP');

  const result = await query(
    `UPDATE campaigns SET ${fields.join(', ')}
     WHERE organization_id = $1 AND id = $2
     RETURNING *`,
    values
  );

  return result.rows[0];
};

/**
 * Launch campaign
 */
export const launchCampaign = async (clinicId, campaignId) => {
  const result = await query(
    `UPDATE campaigns SET
      status = 'RUNNING',
      started_at = CURRENT_TIMESTAMP
     WHERE organization_id = $1 AND id = $2 AND status IN ('DRAFT', 'SCHEDULED')
     RETURNING *`,
    [clinicId, campaignId]
  );

  return result.rows[0];
};

/**
 * Get campaign stats
 */
export const getCampaignStats = async (clinicId, campaignId) => {
  const campaign = await getCampaignById(clinicId, campaignId);
  if (!campaign) return null;

  const recipientStats = await query(
    `SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'SENT') as sent,
      COUNT(*) FILTER (WHERE status = 'DELIVERED') as delivered,
      COUNT(*) FILTER (WHERE status = 'OPENED') as opened,
      COUNT(*) FILTER (WHERE status = 'CLICKED') as clicked,
      COUNT(*) FILTER (WHERE status = 'CONVERTED') as converted,
      COUNT(*) FILTER (WHERE status = 'BOUNCED') as bounced
     FROM campaign_recipients
     WHERE campaign_id = $1`,
    [campaignId]
  );

  return {
    campaign,
    stats: recipientStats.rows[0]
  };
};

// =============================================================================
// WORKFLOWS
// =============================================================================

/**
 * Get workflows
 */
export const getWorkflows = async (clinicId) => {
  const result = await query(
    `SELECT w.*,
            COUNT(we.id) as total_executions,
            COUNT(we.id) FILTER (WHERE we.status = 'COMPLETED') as successful_executions
     FROM workflows w
     LEFT JOIN workflow_executions we ON w.id = we.workflow_id
     WHERE w.organization_id = $1
     GROUP BY w.id
     ORDER BY w.created_at DESC`,
    [clinicId]
  );

  return result.rows;
};

/**
 * Get workflow by ID
 */
export const getWorkflowById = async (clinicId, workflowId) => {
  const result = await query(
    `SELECT * FROM workflows WHERE organization_id = $1 AND id = $2`,
    [clinicId, workflowId]
  );
  return result.rows[0] || null;
};

/**
 * Create workflow
 */
export const createWorkflow = async (data) => {
  const {
    organization_id, name, description, trigger_type, trigger_config,
    actions, conditions, max_runs_per_patient, created_by
  } = data;

  const result = await query(
    `INSERT INTO workflows (
      organization_id, name, description, trigger_type, trigger_config,
      actions, conditions, max_runs_per_patient, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [organization_id, name, description, trigger_type,
     JSON.stringify(trigger_config || {}),
     JSON.stringify(actions || []),
     JSON.stringify(conditions || []),
     max_runs_per_patient || 1, created_by]
  );

  return result.rows[0];
};

/**
 * Update workflow
 */
export const updateWorkflow = async (clinicId, workflowId, data) => {
  const fields = [];
  const values = [clinicId, workflowId];
  let paramCount = 2;

  const allowedFields = [
    'name', 'description', 'trigger_type', 'trigger_config',
    'actions', 'conditions', 'max_runs_per_patient'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
    }
  }

  if (fields.length === 0) return null;

  fields.push('updated_at = CURRENT_TIMESTAMP');

  const result = await query(
    `UPDATE workflows SET ${fields.join(', ')}
     WHERE organization_id = $1 AND id = $2
     RETURNING *`,
    values
  );

  return result.rows[0];
};

/**
 * Toggle workflow active status
 */
export const toggleWorkflowActive = async (clinicId, workflowId) => {
  const result = await query(
    `UPDATE workflows SET
      is_active = NOT is_active,
      updated_at = CURRENT_TIMESTAMP
     WHERE organization_id = $1 AND id = $2
     RETURNING *`,
    [clinicId, workflowId]
  );

  return result.rows[0];
};

// =============================================================================
// RETENTION
// =============================================================================

/**
 * Get retention dashboard
 */
export const getRetentionDashboard = async (clinicId, period = '30d') => {
  const days = parseInt(period) || 30;

  // Lifecycle distribution
  const lifecycleResult = await query(
    `SELECT lifecycle_stage, COUNT(*) as count
     FROM patients
     WHERE organization_id = $1
     GROUP BY lifecycle_stage`,
    [clinicId]
  );

  // Retention rate (patients with visit in last X days vs total active)
  const retentionResult = await query(
    `SELECT
      COUNT(*) FILTER (WHERE last_visit_date >= CURRENT_DATE - INTERVAL '${days} days') as retained,
      COUNT(*) FILTER (WHERE lifecycle_stage IN ('ACTIVE', 'AT_RISK')) as total_trackable
     FROM patients
     WHERE organization_id = $1`,
    [clinicId]
  );

  const retention = retentionResult.rows[0];
  const retentionRate = retention.total_trackable > 0
    ? (retention.retained / retention.total_trackable * 100).toFixed(1)
    : 0;

  // Average visit frequency
  const frequencyResult = await query(
    `SELECT AVG(visit_frequency_days) as avg_frequency
     FROM patients
     WHERE organization_id = $1 AND visit_frequency_days > 0`,
    [clinicId]
  );

  return {
    lifecycleDistribution: lifecycleResult.rows,
    retentionRate: parseFloat(retentionRate),
    retainedPatients: parseInt(retention.retained),
    avgVisitFrequency: parseFloat(frequencyResult.rows[0].avg_frequency) || 0
  };
};

/**
 * Get churn analysis
 */
export const getChurnAnalysis = async (clinicId) => {
  // Patients who became inactive/lost in last 90 days
  const churnResult = await query(
    `SELECT
      COUNT(*) FILTER (WHERE lifecycle_stage = 'INACTIVE') as inactive,
      COUNT(*) FILTER (WHERE lifecycle_stage = 'LOST') as lost,
      COUNT(*) FILTER (WHERE lifecycle_stage = 'AT_RISK') as at_risk
     FROM patients
     WHERE organization_id = $1`,
    [clinicId]
  );

  // Churn by month (last 6 months)
  const monthlyChurn = await query(
    `SELECT
      DATE_TRUNC('month', created_at) as month,
      COUNT(*) as count
     FROM patient_value_history
     WHERE patient_id IN (
       SELECT id FROM patients WHERE organization_id = $1 AND lifecycle_stage IN ('INACTIVE', 'LOST')
     )
     AND created_at >= CURRENT_DATE - INTERVAL '6 months'
     GROUP BY DATE_TRUNC('month', created_at)
     ORDER BY month`,
    [clinicId]
  );

  return {
    current: churnResult.rows[0],
    trend: monthlyChurn.rows
  };
};

/**
 * Get cohort retention
 */
export const getCohortRetention = async (clinicId, months = 6) => {
  const result = await query(
    `WITH cohorts AS (
      SELECT
        DATE_TRUNC('month', first_visit_date) as cohort_month,
        id as patient_id
      FROM patients
      WHERE organization_id = $1
        AND first_visit_date >= CURRENT_DATE - INTERVAL '${months} months'
    )
    SELECT
      cohort_month,
      COUNT(*) as cohort_size,
      COUNT(*) FILTER (WHERE p.lifecycle_stage IN ('ACTIVE', 'ONBOARDING')) as still_active
    FROM cohorts c
    JOIN patients p ON c.patient_id = p.id
    GROUP BY cohort_month
    ORDER BY cohort_month`,
    [clinicId]
  );

  return result.rows.map(row => ({
    ...row,
    retention_rate: row.cohort_size > 0
      ? (row.still_active / row.cohort_size * 100).toFixed(1)
      : 0
  }));
};

// =============================================================================
// WAITLIST
// =============================================================================

/**
 * Get waitlist
 */
export const getWaitlist = async (clinicId, options = {}) => {
  const { page = 1, limit = 20, status = 'ACTIVE', practitionerId } = options;
  const offset = (page - 1) * limit;
  const params = [clinicId, status];
  let paramCount = 2;

  let whereClause = 'WHERE w.organization_id = $1 AND w.status = $2';

  if (practitionerId) {
    paramCount++;
    whereClause += ` AND w.preferred_practitioner_id = $${paramCount}`;
    params.push(practitionerId);
  }

  const countResult = await query(
    `SELECT COUNT(*) as total FROM waitlist w ${whereClause}`,
    params
  );

  params.push(limit, offset);
  const result = await query(
    `SELECT w.*,
            p.first_name, p.last_name, p.phone, p.email,
            u.first_name as practitioner_first_name, u.last_name as practitioner_last_name
     FROM waitlist w
     JOIN patients p ON w.patient_id = p.id
     LEFT JOIN users u ON w.preferred_practitioner_id = u.id
     ${whereClause}
     ORDER BY w.priority DESC, w.added_at ASC
     LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
    params
  );

  return {
    entries: result.rows,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].total),
      totalPages: Math.ceil(countResult.rows[0].total / limit)
    }
  };
};

/**
 * Add to waitlist
 */
export const addToWaitlist = async (data) => {
  const {
    organization_id, patient_id, preferred_practitioner_id, preferred_days,
    preferred_time_start, preferred_time_end, service_type, duration_minutes,
    priority, notes, expires_at
  } = data;

  const result = await query(
    `INSERT INTO waitlist (
      organization_id, patient_id, preferred_practitioner_id, preferred_days,
      preferred_time_start, preferred_time_end, service_type, duration_minutes,
      priority, notes, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (organization_id, patient_id, status)
    DO UPDATE SET
      preferred_practitioner_id = EXCLUDED.preferred_practitioner_id,
      preferred_days = EXCLUDED.preferred_days,
      notes = EXCLUDED.notes
    RETURNING *`,
    [organization_id, patient_id, preferred_practitioner_id,
     JSON.stringify(preferred_days || []),
     preferred_time_start, preferred_time_end, service_type,
     duration_minutes || 30, priority || 'NORMAL', notes, expires_at]
  );

  return result.rows[0];
};

/**
 * Update waitlist entry
 */
export const updateWaitlistEntry = async (clinicId, entryId, data) => {
  const fields = [];
  const values = [clinicId, entryId];
  let paramCount = 2;

  const allowedFields = [
    'status', 'priority', 'preferred_days', 'preferred_time_start',
    'preferred_time_end', 'notes', 'booked_appointment_id'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
    }
  }

  if (fields.length === 0) return null;

  const result = await query(
    `UPDATE waitlist SET ${fields.join(', ')}
     WHERE organization_id = $1 AND id = $2
     RETURNING *`,
    values
  );

  return result.rows[0];
};

/**
 * Notify waitlist patients
 */
export const notifyWaitlistPatients = async (clinicId, slotInfo) => {
  const { slotDate, slotTime, practitionerId } = slotInfo;

  // Find matching waitlist entries
  let whereClause = 'WHERE w.organization_id = $1 AND w.status = $2';
  const params = [clinicId, 'ACTIVE'];
  let paramCount = 2;

  if (practitionerId) {
    paramCount++;
    whereClause += ` AND (w.preferred_practitioner_id = $${paramCount} OR w.preferred_practitioner_id IS NULL)`;
    params.push(practitionerId);
  }

  const entries = await query(
    `SELECT w.*, p.first_name, p.last_name, p.phone, p.email
     FROM waitlist w
     JOIN patients p ON w.patient_id = p.id
     ${whereClause}
     ORDER BY w.priority DESC, w.added_at ASC
     LIMIT 10`,
    params
  );

  // Update notification count
  const entryIds = entries.rows.map(e => e.id);
  if (entryIds.length > 0) {
    await query(
      `UPDATE waitlist SET
        last_notified_at = CURRENT_TIMESTAMP,
        notification_count = notification_count + 1,
        status = 'NOTIFIED'
       WHERE id = ANY($1)`,
      [entryIds]
    );
  }

  return {
    notified: entries.rows.length,
    patients: entries.rows.map(e => ({
      id: e.patient_id,
      name: `${e.first_name} ${e.last_name}`,
      phone: e.phone,
      email: e.email
    }))
  };
};

// =============================================================================
// CRM OVERVIEW
// =============================================================================

/**
 * Get CRM overview dashboard
 */
export const getCRMOverview = async (clinicId) => {
  // Run queries in parallel
  const [leads, lifecycle, referrals, nps, waitlist] = await Promise.all([
    query(`SELECT COUNT(*) FILTER (WHERE status = 'NEW') as new_leads FROM leads WHERE organization_id = $1`, [clinicId]),
    query(`SELECT lifecycle_stage, COUNT(*) as count FROM patients WHERE organization_id = $1 GROUP BY lifecycle_stage`, [clinicId]),
    query(`SELECT COUNT(*) FILTER (WHERE status = 'PENDING') as pending FROM referrals WHERE organization_id = $1`, [clinicId]),
    getNPSStats(clinicId, '30d'),
    query(`SELECT COUNT(*) as count FROM waitlist WHERE organization_id = $1 AND status = 'ACTIVE'`, [clinicId])
  ]);

  const lifecycleMap = {};
  lifecycle.rows.forEach(row => {
    lifecycleMap[row.lifecycle_stage] = parseInt(row.count);
  });

  return {
    newLeads: parseInt(leads.rows[0].new_leads) || 0,
    activePatients: lifecycleMap['ACTIVE'] || 0,
    atRiskPatients: lifecycleMap['AT_RISK'] || 0,
    pendingReferrals: parseInt(referrals.rows[0].pending) || 0,
    avgNPS: nps.nps,
    waitlistCount: parseInt(waitlist.rows[0].count) || 0
  };
};

// =============================================================================
// CRM SETTINGS
// =============================================================================

/**
 * Get CRM settings
 */
export const getCRMSettings = async (clinicId) => {
  // For now, return default settings
  // In production, this would be stored in a settings table
  return {
    checkInFrequencyDays: 30,
    atRiskThresholdDays: 42,
    inactiveThresholdDays: 90,
    lostThresholdDays: 180,
    autoSendSurveys: true,
    surveyDelayDays: 1,
    enableReferralProgram: true,
    defaultReferralReward: { type: 'DISCOUNT', amount: 20, description: '20% rabatt' },
    enableWaitlist: true,
    maxWaitlistNotifications: 3
  };
};

/**
 * Update CRM settings
 */
export const updateCRMSettings = async (clinicId, settings) => {
  // In production, save to database
  // For now, just return the settings
  logger.info('CRM settings updated for clinic:', clinicId, settings);
  return settings;
};
