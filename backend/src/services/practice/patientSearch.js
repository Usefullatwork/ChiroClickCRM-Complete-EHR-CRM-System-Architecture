/**
 * Patient Search — Basic and advanced patient search with filtering.
 *
 * @module services/practice/patientSearch
 */

import { query } from '../../config/database.js';
import { maskSensitive } from '../../utils/encryption.js';
import logger from '../../utils/logger.js';

/**
 * Search patients (basic quick search)
 */
export const searchPatients = async (organizationId, searchTerm, limit = 10) => {
  try {
    const result = await query(
      `SELECT
        id,
        solvit_id,
        first_name,
        last_name,
        date_of_birth,
        email,
        phone,
        status,
        last_visit_date
      FROM patients
      WHERE organization_id = $1
        AND (
          first_name ILIKE $2 OR
          last_name ILIKE $2 OR
          email ILIKE $2 OR
          phone ILIKE $2 OR
          solvit_id ILIKE $2
        )
        AND status = 'ACTIVE'
      ORDER BY last_name, first_name
      LIMIT $3`,
      [organizationId, `%${searchTerm}%`, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error searching patients:', error);
    throw error;
  }
};

/**
 * Advanced patient search with multiple filters
 * Supports: name, phone, email, DOB ranges, visit dates, status, category
 * @param {string} organizationId - Organization ID
 * @param {object} filters - Search filters from validated query params
 * @returns {Promise<{patients: array, pagination: object}>}
 */
export const advancedSearchPatients = async (organizationId, filters = {}) => {
  const {
    // General search
    q,
    // Specific field searches
    name,
    phone,
    email,
    // Date of birth filters
    date_of_birth,
    dob_from,
    dob_to,
    // Visit date filters
    last_visit_from,
    last_visit_to,
    first_visit_from,
    first_visit_to,
    // Created date filters
    created_from,
    created_to,
    // Status and category
    status,
    category,
    // Therapist
    preferred_therapist_id,
    // Follow-up filters
    needs_followup,
    followup_before,
    // Sorting
    sort_by = 'last_name',
    sort_order = 'asc',
    // Pagination
    page = 1,
    limit = 20,
  } = filters;

  const offset = (page - 1) * limit;

  try {
    // Build WHERE clause dynamically
    let whereClause = 'WHERE p.organization_id = $1';
    const params = [organizationId];
    let paramIndex = 2;

    // General search (searches name, email, phone)
    if (q) {
      params.push(`%${q}%`);
      whereClause += ` AND (
        p.first_name ILIKE $${paramIndex} OR
        p.last_name ILIKE $${paramIndex} OR
        CONCAT(p.first_name, ' ', p.last_name) ILIKE $${paramIndex} OR
        p.email ILIKE $${paramIndex} OR
        p.phone ILIKE $${paramIndex} OR
        REPLACE(p.phone, ' ', '') ILIKE $${paramIndex} OR
        p.solvit_id ILIKE $${paramIndex}
      )`;
      paramIndex++;
    }

    // Name search (first or last name)
    if (name) {
      params.push(`%${name}%`);
      whereClause += ` AND (
        p.first_name ILIKE $${paramIndex} OR
        p.last_name ILIKE $${paramIndex} OR
        CONCAT(p.first_name, ' ', p.last_name) ILIKE $${paramIndex}
      )`;
      paramIndex++;
    }

    // Phone search (normalized - strips non-digits for comparison)
    if (phone) {
      // Clean the search phone number for comparison
      const cleanPhone = phone.replace(/\D/g, '');
      params.push(`%${cleanPhone}%`);
      whereClause += ` AND REGEXP_REPLACE(p.phone, '[^0-9]', '', 'g') LIKE $${paramIndex}`;
      paramIndex++;
    }

    // Email search
    if (email) {
      params.push(`%${email}%`);
      whereClause += ` AND p.email ILIKE $${paramIndex}`;
      paramIndex++;
    }

    // Exact date of birth
    if (date_of_birth) {
      params.push(date_of_birth);
      whereClause += ` AND p.date_of_birth = $${paramIndex}`;
      paramIndex++;
    }

    // Date of birth range
    if (dob_from) {
      params.push(dob_from);
      whereClause += ` AND p.date_of_birth >= $${paramIndex}`;
      paramIndex++;
    }
    if (dob_to) {
      params.push(dob_to);
      whereClause += ` AND p.date_of_birth <= $${paramIndex}`;
      paramIndex++;
    }

    // Last visit date range
    if (last_visit_from) {
      params.push(last_visit_from);
      whereClause += ` AND p.last_visit_date >= $${paramIndex}`;
      paramIndex++;
    }
    if (last_visit_to) {
      params.push(last_visit_to);
      whereClause += ` AND p.last_visit_date <= $${paramIndex}`;
      paramIndex++;
    }

    // First visit date range
    if (first_visit_from) {
      params.push(first_visit_from);
      whereClause += ` AND p.first_visit_date >= $${paramIndex}`;
      paramIndex++;
    }
    if (first_visit_to) {
      params.push(first_visit_to);
      whereClause += ` AND p.first_visit_date <= $${paramIndex}`;
      paramIndex++;
    }

    // Created date range
    if (created_from) {
      params.push(created_from);
      whereClause += ` AND p.created_at >= $${paramIndex}`;
      paramIndex++;
    }
    if (created_to) {
      params.push(created_to);
      whereClause += ` AND p.created_at <= $${paramIndex}`;
      paramIndex++;
    }

    // Status filter
    if (status) {
      params.push(status);
      whereClause += ` AND p.status = $${paramIndex}`;
      paramIndex++;
    }

    // Category filter
    if (category) {
      params.push(category);
      whereClause += ` AND p.category = $${paramIndex}`;
      paramIndex++;
    }

    // Preferred therapist filter
    if (preferred_therapist_id) {
      params.push(preferred_therapist_id);
      whereClause += ` AND p.preferred_therapist_id = $${paramIndex}`;
      paramIndex++;
    }

    // Needs follow-up filter
    if (needs_followup === true) {
      whereClause += ` AND p.should_be_followed_up IS NOT NULL AND p.should_be_followed_up <= NOW()`;
    }

    // Follow-up before date
    if (followup_before) {
      params.push(followup_before);
      whereClause += ` AND p.should_be_followed_up IS NOT NULL AND p.should_be_followed_up <= $${paramIndex}`;
      paramIndex++;
    }

    // Validate sort column to prevent SQL injection
    const validSortColumns = {
      name: 'p.last_name',
      last_name: 'p.last_name',
      first_name: 'p.first_name',
      date_of_birth: 'p.date_of_birth',
      last_visit: 'p.last_visit_date',
      created_at: 'p.created_at',
    };
    const sortColumn = validSortColumns[sort_by] || 'p.last_name';
    const sortDirection = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Get total count
    const countResult = await query(`SELECT COUNT(*) FROM patients p ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    // Get patients with pagination
    params.push(limit, offset);
    const result = await query(
      `SELECT
        p.*,
        COUNT(DISTINCT ce.id) as total_encounters,
        COUNT(DISTINCT a.id) FILTER (WHERE a.start_time >= NOW()) as upcoming_appointments,
        MAX(ce.encounter_date) as last_encounter_date
      FROM patients p
      LEFT JOIN clinical_encounters ce ON ce.patient_id = p.id
      LEFT JOIN appointments a ON a.patient_id = p.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY ${sortColumn} ${sortDirection}, p.last_name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    // Mask sensitive data
    const patients = result.rows.map((patient) => ({
      ...patient,
      encrypted_personal_number: patient.encrypted_personal_number
        ? maskSensitive(patient.encrypted_personal_number, 3)
        : null,
    }));

    return {
      patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      filters_applied: {
        q,
        name,
        phone,
        email,
        date_of_birth,
        dob_from,
        dob_to,
        last_visit_from,
        last_visit_to,
        status,
        category,
        sort_by,
        sort_order,
      },
    };
  } catch (error) {
    logger.error('Error in advanced patient search:', error);
    throw error;
  }
};
