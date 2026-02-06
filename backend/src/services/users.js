/**
 * Users Service
 * Manages practitioners and staff within organizations
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import * as organizationService from './organizations.js';

/**
 * Get all users in an organization
 */
export const getAllUsers = async (organizationId, options = {}) => {
  const { page = 1, limit = 50, search = '', role = null, status = null } = options;

  const offset = (page - 1) * limit;
  let whereConditions = ['organization_id = $1'];
  let params = [organizationId];
  let paramIndex = 2;

  if (search) {
    whereConditions.push(
      `(first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`
    );
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (role) {
    whereConditions.push(`role = $${paramIndex}`);
    params.push(role);
    paramIndex++;
  }

  if (status) {
    whereConditions.push(`status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countResult = await query(`SELECT COUNT(*) FROM users WHERE ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count);

  // Get paginated results
  const result = await query(
    `SELECT
      id,

      organization_id,
      email,
      first_name,
      last_name,
      role,
      hpr_number,
      specialization,
      phone,
      status,
      last_login,
      created_at,
      updated_at
    FROM users
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return {
    users: result.rows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get user by ID
 */
export const getUserById = async (organizationId, userId) => {
  const result = await query(
    `SELECT
      id,

      organization_id,
      email,
      first_name,
      last_name,
      role,
      hpr_number,
      specialization,
      phone,
      status,
      preferences,
      last_login,
      created_at,
      updated_at
    FROM users
    WHERE id = $1 AND organization_id = $2`,
    [userId, organizationId]
  );

  return result.rows[0] || null;
};

/**
 * Create new user
 */
export const createUser = async (organizationId, userData) => {
  const {
    email,
    first_name,
    last_name,
    role = 'PRACTITIONER',
    hpr_number = null,
    specialization = null,
    phone = null,
  } = userData;

  // Check organization limits
  if (role === 'PRACTITIONER' || role === 'ADMIN') {
    const limits = await organizationService.checkOrganizationLimits(organizationId);
    if (!limits.withinLimits.practitioners) {
      throw new Error(
        `Organization has reached maximum practitioner limit (${limits.limits.practitioners.max})`
      );
    }
  }

  const result = await query(
    `INSERT INTO users (
      organization_id,
      email,
      first_name,
      last_name,
      role,
      hpr_number,
      specialization,
      phone,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
    RETURNING *`,
    [organizationId, email, first_name, last_name, role, hpr_number, specialization, phone]
  );

  logger.info(`User created: ${result.rows[0].id} - ${email} in organization: ${organizationId}`);
  return result.rows[0];
};

/**
 * Update user
 */
export const updateUser = async (organizationId, userId, updateData) => {
  const allowedFields = [
    'first_name',
    'last_name',
    'role',
    'hpr_number',
    'specialization',
    'phone',
    'status',
    'preferences',
  ];

  const updates = [];
  const params = [userId, organizationId];
  let paramIndex = 3;

  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      if (key === 'preferences') {
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
    `UPDATE users
     SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  logger.info(`User updated: ${userId}`);
  return result.rows[0];
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (organizationId, userId, preferences) => {
  const result = await query(
    `UPDATE users
     SET preferences = preferences || $1::jsonb, updated_at = NOW()
     WHERE id = $2 AND organization_id = $3
     RETURNING preferences`,
    [JSON.stringify(preferences), userId, organizationId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  logger.info(`User preferences updated: ${userId}`);
  return result.rows[0].preferences;
};

/**
 * Update last login
 */
export const updateLastLogin = async (userId) => {
  await query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [userId]);
};

/**
 * Deactivate user
 */
export const deactivateUser = async (organizationId, userId) => {
  const result = await query(
    `UPDATE users
     SET status = 'INACTIVE', updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [userId, organizationId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  logger.info(`User deactivated: ${userId}`);
  return result.rows[0];
};

/**
 * Reactivate user
 */
export const reactivateUser = async (organizationId, userId) => {
  const result = await query(
    `UPDATE users
     SET status = 'ACTIVE', updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [userId, organizationId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  logger.info(`User reactivated: ${userId}`);
  return result.rows[0];
};

/**
 * Get user statistics
 */
export const getUserStats = async (organizationId, userId) => {
  const result = await query(
    `SELECT
      (SELECT COUNT(*) FROM clinical_encounters WHERE practitioner_id = $1 AND organization_id = $2) as total_encounters,
      (SELECT COUNT(*) FROM clinical_encounters WHERE practitioner_id = $1 AND organization_id = $2 AND created_at >= NOW() - INTERVAL '30 days') as encounters_this_month,
      (SELECT COUNT(DISTINCT patient_id) FROM clinical_encounters WHERE practitioner_id = $1 AND organization_id = $2) as unique_patients,
      (SELECT COUNT(*) FROM appointments WHERE practitioner_id = $1 AND organization_id = $2 AND status = 'SCHEDULED') as upcoming_appointments,
      (SELECT AVG(vas_pain_start - COALESCE(vas_pain_end, vas_pain_start)) FROM clinical_encounters WHERE practitioner_id = $1 AND organization_id = $2 AND vas_pain_start IS NOT NULL) as avg_pain_reduction
    `,
    [userId, organizationId]
  );

  return result.rows[0];
};

/**
 * Get practitioners (for dropdown/selection)
 */
export const getPractitioners = async (organizationId) => {
  const result = await query(
    `SELECT
      id,
      first_name,
      last_name,
      email,
      hpr_number,
      specialization,
      status
    FROM users
    WHERE organization_id = $1
      AND role IN ('PRACTITIONER', 'ADMIN')
      AND status = 'ACTIVE'
    ORDER BY first_name, last_name`,
    [organizationId]
  );

  return result.rows;
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPreferences,
  updateLastLogin,
  deactivateUser,
  reactivateUser,
  getUserStats,
  getPractitioners,
};
