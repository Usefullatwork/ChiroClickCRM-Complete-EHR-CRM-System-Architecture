/**
 * CRM Campaigns Service
 * Campaign management, launch, stats, and workflows
 */

import { query } from '../../config/database.js';

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

  const countResult = await query(`SELECT COUNT(*) as total FROM campaigns ${whereClause}`, params);

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
      totalPages: Math.ceil(countResult.rows[0].total / limit),
    },
  };
};

/**
 * Get campaign by ID
 */
export const getCampaignById = async (clinicId, campaignId) => {
  const result = await query(`SELECT * FROM campaigns WHERE organization_id = $1 AND id = $2`, [
    clinicId,
    campaignId,
  ]);
  return result.rows[0] || null;
};

/**
 * Create campaign
 */
export const createCampaign = async (data) => {
  const {
    organization_id,
    name,
    description,
    campaign_type,
    channels,
    sms_template,
    email_subject,
    email_template,
    target_segment,
    scheduled_at,
    created_by,
  } = data;

  const result = await query(
    `INSERT INTO campaigns (
      organization_id, name, description, campaign_type, channels,
      sms_template, email_subject, email_template, target_segment,
      scheduled_at, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      organization_id,
      name,
      description,
      campaign_type,
      JSON.stringify(channels || ['SMS']),
      sms_template,
      email_subject,
      email_template,
      JSON.stringify(target_segment || {}),
      scheduled_at,
      created_by,
    ]
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
    'name',
    'description',
    'campaign_type',
    'channels',
    'sms_template',
    'email_subject',
    'email_template',
    'target_segment',
    'status',
    'scheduled_at',
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
    stats: recipientStats.rows[0],
  };
};

// =============================================================================
// WORKFLOWS (CRM-level workflow CRUD)
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
  const result = await query(`SELECT * FROM workflows WHERE organization_id = $1 AND id = $2`, [
    clinicId,
    workflowId,
  ]);
  return result.rows[0] || null;
};

/**
 * Create workflow
 */
export const createWorkflow = async (data) => {
  const {
    organization_id,
    name,
    description,
    trigger_type,
    trigger_config,
    actions,
    conditions,
    max_runs_per_patient,
    created_by,
  } = data;

  const result = await query(
    `INSERT INTO workflows (
      organization_id, name, description, trigger_type, trigger_config,
      actions, conditions, max_runs_per_patient, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      organization_id,
      name,
      description,
      trigger_type,
      JSON.stringify(trigger_config || {}),
      JSON.stringify(actions || []),
      JSON.stringify(conditions || []),
      max_runs_per_patient || 1,
      created_by,
    ]
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
    'name',
    'description',
    'trigger_type',
    'trigger_config',
    'actions',
    'conditions',
    'max_runs_per_patient',
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
