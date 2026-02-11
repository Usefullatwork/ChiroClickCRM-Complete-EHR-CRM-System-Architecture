/**
 * CRM Lifecycle Service
 * Patient lifecycle tracking, referrals, and surveys
 */

import { query } from '../../config/database.js';

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

  const countResult = await query(`SELECT COUNT(*) as total FROM patients ${whereClause}`, params);

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
      totalPages: Math.ceil(countResult.rows[0].total / limit),
    },
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
      totalPages: Math.ceil(countResult.rows[0].total / limit),
    },
  };
};

/**
 * Create referral
 */
export const createReferral = async (data) => {
  const {
    organization_id,
    referrer_patient_id,
    referrer_name,
    referrer_email,
    referrer_phone,
    referred_name,
    referred_email,
    referred_phone,
    reward_type,
    reward_amount,
    reward_description,
    notes,
  } = data;

  const result = await query(
    `INSERT INTO referrals (
      organization_id, referrer_patient_id, referrer_name, referrer_email, referrer_phone,
      referred_name, referred_email, referred_phone, reward_type, reward_amount,
      reward_description, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      organization_id,
      referrer_patient_id,
      referrer_name,
      referrer_email,
      referrer_phone,
      referred_name,
      referred_email,
      referred_phone,
      reward_type,
      reward_amount,
      reward_description,
      notes,
    ]
  );

  // Update referrer's referral count
  if (referrer_patient_id) {
    await query(`UPDATE patients SET referral_count = referral_count + 1 WHERE id = $1`, [
      referrer_patient_id,
    ]);
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
  const { organization_id, name, description, survey_type, questions, auto_send, send_after_days } =
    data;

  const result = await query(
    `INSERT INTO surveys (organization_id, name, description, survey_type, questions, auto_send, send_after_days)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      organization_id,
      name,
      description,
      survey_type,
      JSON.stringify(questions || []),
      auto_send,
      send_after_days,
    ]
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
      totalPages: Math.ceil(countResult.rows[0].total / limit),
    },
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
       AND sr.completed_at >= CURRENT_DATE - make_interval(days => $2)`,
    [clinicId, days]
  );

  const data = result.rows[0];
  const total = parseInt(data.total) || 1;
  const nps = (data.promoters / total - data.detractors / total) * 100;

  return {
    nps: Math.round(nps),
    promoters: parseInt(data.promoters),
    passives: parseInt(data.passives),
    detractors: parseInt(data.detractors),
    total: parseInt(data.total),
    avgScore: parseFloat(data.avg_score) || 0,
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
      totalPages: Math.ceil(countResult.rows[0].total / limit),
    },
  };
};

/**
 * Log communication
 */
export const logCommunication = async (data) => {
  const {
    organization_id,
    patient_id,
    lead_id,
    user_id,
    channel,
    direction,
    subject,
    message,
    template_used,
    contact_value,
    status,
    campaign_id,
  } = data;

  const result = await query(
    `INSERT INTO communication_log (
      organization_id, patient_id, lead_id, user_id, channel, direction,
      subject, message, template_used, contact_value, status, campaign_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      organization_id,
      patient_id,
      lead_id,
      user_id,
      channel,
      direction,
      subject,
      message,
      template_used,
      contact_value,
      status || 'SENT',
      campaign_id,
    ]
  );

  // Update patient last contact date
  if (patient_id) {
    await query(`UPDATE patients SET last_contact_date = CURRENT_TIMESTAMP WHERE id = $1`, [
      patient_id,
    ]);
  }

  return result.rows[0];
};
