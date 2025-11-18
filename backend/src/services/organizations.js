/**
 * Organizations Service
 * Manages multi-tenant organization setup and configuration
 */

import { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all organizations (admin only)
 */
export const getAllOrganizations = async (options = {}) => {
  const {
    page = 1,
    limit = 50,
    search = '',
    status = null
  } = options;

  const offset = (page - 1) * limit;
  let whereConditions = [];
  let params = [];
  let paramIndex = 1;

  if (search) {
    whereConditions.push(`(name ILIKE $${paramIndex} OR org_number ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (status) {
    whereConditions.push(`status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM organizations ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get paginated results
  const result = await query(
    `SELECT
      id,
      name,
      org_number,
      email,
      phone,
      address,
      postal_code,
      city,
      country,
      subscription_tier,
      subscription_status,
      max_practitioners,
      max_patients,
      status,
      created_at,
      updated_at,
      (SELECT COUNT(*) FROM users WHERE organization_id = organizations.id) as practitioner_count,
      (SELECT COUNT(*) FROM patients WHERE organization_id = organizations.id) as patient_count
    FROM organizations
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return {
    organizations: result.rows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get organization by ID
 */
export const getOrganizationById = async (organizationId) => {
  const result = await query(
    `SELECT
      o.*,
      (SELECT COUNT(*) FROM users WHERE organization_id = o.id) as practitioner_count,
      (SELECT COUNT(*) FROM patients WHERE organization_id = o.id) as patient_count,
      (SELECT COUNT(*) FROM clinical_encounters WHERE organization_id = o.id) as encounter_count,
      (SELECT COUNT(*) FROM appointments WHERE organization_id = o.id) as appointment_count
    FROM organizations o
    WHERE o.id = $1`,
    [organizationId]
  );

  return result.rows[0] || null;
};

/**
 * Create new organization
 */
export const createOrganization = async (orgData) => {
  const {
    name,
    org_number,
    email,
    phone,
    address,
    postal_code,
    city,
    country = 'Norway',
    subscription_tier = 'BASIC',
    max_practitioners = 5,
    max_patients = 500,
    settings = {}
  } = orgData;

  return await transaction(async (client) => {
    // Create organization
    const orgResult = await client.query(
      `INSERT INTO organizations (
        name,
        org_number,
        email,
        phone,
        address,
        postal_code,
        city,
        country,
        subscription_tier,
        subscription_status,
        max_practitioners,
        max_patients,
        settings,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE', $10, $11, $12, 'ACTIVE')
      RETURNING *`,
      [name, org_number, email, phone, address, postal_code, city, country, subscription_tier, max_practitioners, max_patients, JSON.stringify(settings)]
    );

    const organization = orgResult.rows[0];

    // Create default message templates
    const templates = [
      {
        name: 'Appointment Reminder',
        type: 'SMS',
        subject: null,
        content: 'Hei {{patient_name}}! Påminnelse om time hos {{clinic_name}} den {{appointment_date}} kl {{appointment_time}}.',
        variables: ['patient_name', 'clinic_name', 'appointment_date', 'appointment_time']
      },
      {
        name: 'Appointment Confirmation',
        type: 'EMAIL',
        subject: 'Timebekreftelse - {{clinic_name}}',
        content: 'Hei {{patient_name}},\n\nDin time er bekreftet:\nDato: {{appointment_date}}\nKlokkeslett: {{appointment_time}}\nPraktiker: {{practitioner_name}}\n\nMed vennlig hilsen,\n{{clinic_name}}',
        variables: ['patient_name', 'clinic_name', 'appointment_date', 'appointment_time', 'practitioner_name']
      },
      {
        name: '3-Month Recall',
        type: 'SMS',
        subject: null,
        content: 'Hei {{patient_name}}! Det har gått 3 måneder siden sist. Trenger du en ny time? Ring oss på {{clinic_phone}}.',
        variables: ['patient_name', 'clinic_phone']
      }
    ];

    for (const template of templates) {
      await client.query(
        `INSERT INTO message_templates (organization_id, name, type, subject, content, variables)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [organization.id, template.name, template.type, template.subject, template.content, JSON.stringify(template.variables)]
      );
    }

    logger.info(`Organization created: ${organization.id} - ${name}`);
    return organization;
  });
};

/**
 * Update organization
 */
export const updateOrganization = async (organizationId, updateData) => {
  const allowedFields = [
    'name', 'email', 'phone', 'address', 'postal_code', 'city', 'country',
    'subscription_tier', 'max_practitioners', 'max_patients', 'settings', 'status'
  ];

  const updates = [];
  const params = [organizationId];
  let paramIndex = 2;

  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      if (key === 'settings') {
        updates.push(`${key} = $${paramIndex}::jsonb`);
        params.push(JSON.stringify(value));
      } else {
        updates.push(`${key} = $${paramIndex}`);
        params.push(value);
      }
      paramIndex++;
    }
  }

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  const result = await query(
    `UPDATE organizations
     SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    throw new Error('Organization not found');
  }

  logger.info(`Organization updated: ${organizationId}`);
  return result.rows[0];
};

/**
 * Get organization settings
 */
export const getOrganizationSettings = async (organizationId) => {
  const result = await query(
    `SELECT settings FROM organizations WHERE id = $1`,
    [organizationId]
  );

  if (result.rows.length === 0) {
    throw new Error('Organization not found');
  }

  return result.rows[0].settings || {};
};

/**
 * Update organization settings
 */
export const updateOrganizationSettings = async (organizationId, settings) => {
  const result = await query(
    `UPDATE organizations
     SET settings = settings || $1::jsonb, updated_at = NOW()
     WHERE id = $2
     RETURNING settings`,
    [JSON.stringify(settings), organizationId]
  );

  if (result.rows.length === 0) {
    throw new Error('Organization not found');
  }

  logger.info(`Organization settings updated: ${organizationId}`);
  return result.rows[0].settings;
};

/**
 * Get organization statistics
 */
export const getOrganizationStats = async (organizationId) => {
  const result = await query(
    `SELECT
      (SELECT COUNT(*) FROM users WHERE organization_id = $1) as total_users,
      (SELECT COUNT(*) FROM users WHERE organization_id = $1 AND role = 'PRACTITIONER') as practitioners,
      (SELECT COUNT(*) FROM patients WHERE organization_id = $1) as total_patients,
      (SELECT COUNT(*) FROM patients WHERE organization_id = $1 AND status = 'ACTIVE') as active_patients,
      (SELECT COUNT(*) FROM clinical_encounters WHERE organization_id = $1) as total_encounters,
      (SELECT COUNT(*) FROM clinical_encounters WHERE organization_id = $1 AND created_at >= NOW() - INTERVAL '30 days') as encounters_this_month,
      (SELECT COUNT(*) FROM appointments WHERE organization_id = $1 AND status = 'SCHEDULED') as upcoming_appointments,
      (SELECT SUM(gross_amount) FROM financial_metrics WHERE organization_id = $1 AND created_at >= NOW() - INTERVAL '30 days') as revenue_this_month
    `,
    [organizationId]
  );

  return result.rows[0];
};

/**
 * Check organization limits
 */
export const checkOrganizationLimits = async (organizationId) => {
  const org = await getOrganizationById(organizationId);

  if (!org) {
    throw new Error('Organization not found');
  }

  const withinLimits = {
    practitioners: org.practitioner_count < org.max_practitioners,
    patients: org.patient_count < org.max_patients,
    canAddPractitioner: org.practitioner_count < org.max_practitioners,
    canAddPatient: org.patient_count < org.max_patients
  };

  return {
    organization: org,
    limits: {
      practitioners: {
        current: org.practitioner_count,
        max: org.max_practitioners,
        available: org.max_practitioners - org.practitioner_count
      },
      patients: {
        current: org.patient_count,
        max: org.max_patients,
        available: org.max_patients - org.patient_count
      }
    },
    withinLimits
  };
};

export default {
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  getOrganizationSettings,
  updateOrganizationSettings,
  getOrganizationStats,
  checkOrganizationLimits
};
