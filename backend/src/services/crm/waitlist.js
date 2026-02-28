/**
 * CRM Waitlist Service
 * Waitlist management, notifications, CRM overview, and settings
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';
import { getNPSStats } from './lifecycle.js';

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
      totalPages: Math.ceil(countResult.rows[0].total / limit),
    },
  };
};

/**
 * Add to waitlist
 */
export const addToWaitlist = async (data) => {
  const {
    organization_id,
    patient_id,
    preferred_practitioner_id,
    preferred_days,
    preferred_time_start,
    preferred_time_end,
    service_type,
    duration_minutes,
    priority,
    notes,
    expires_at,
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
    [
      organization_id,
      patient_id,
      preferred_practitioner_id,
      JSON.stringify(preferred_days || []),
      preferred_time_start,
      preferred_time_end,
      service_type,
      duration_minutes || 30,
      priority || 'NORMAL',
      notes,
      expires_at,
    ]
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
    'status',
    'priority',
    'preferred_days',
    'preferred_time_start',
    'preferred_time_end',
    'notes',
    'booked_appointment_id',
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
    }
  }

  if (fields.length === 0) {
    return null;
  }

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
  const { _slotDate, _slotTime, practitionerId } = slotInfo;

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
  const entryIds = entries.rows.map((e) => e.id);
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
    patients: entries.rows.map((e) => ({
      id: e.patient_id,
      name: `${e.first_name} ${e.last_name}`,
      phone: e.phone,
      email: e.email,
    })),
  };
};

// =============================================================================
// CRM OVERVIEW
// =============================================================================

/**
 * Get CRM overview dashboard
 */
export const getCRMOverview = async (clinicId) => {
  // Run queries in parallel with fallbacks for missing tables
  const [leads, lifecycle, referrals, nps, waitlist] = await Promise.all([
    query(
      `SELECT COUNT(*) FILTER (WHERE status = 'NEW') as new_leads FROM leads WHERE organization_id = $1`,
      [clinicId]
    ).catch(() => ({ rows: [{ new_leads: 0 }] })),
    query(
      `SELECT lifecycle_stage, COUNT(*) as count FROM patients WHERE organization_id = $1 GROUP BY lifecycle_stage`,
      [clinicId]
    ).catch(() => ({ rows: [] })),
    query(
      `SELECT COUNT(*) FILTER (WHERE status = 'PENDING') as pending FROM referrals WHERE organization_id = $1`,
      [clinicId]
    ).catch(() => ({ rows: [{ pending: 0 }] })),
    getNPSStats(clinicId, '30d').catch(() => ({ nps: 0 })),
    query(
      `SELECT COUNT(*) as count FROM waitlist WHERE organization_id = $1 AND status = 'ACTIVE'`,
      [clinicId]
    ).catch(() => ({ rows: [{ count: 0 }] })),
  ]);

  const lifecycleMap = {};
  lifecycle.rows.forEach((row) => {
    lifecycleMap[row.lifecycle_stage] = parseInt(row.count);
  });

  return {
    newLeads: parseInt(leads.rows[0].new_leads) || 0,
    activePatients: lifecycleMap['ACTIVE'] || 0,
    atRiskPatients: lifecycleMap['AT_RISK'] || 0,
    pendingReferrals: parseInt(referrals.rows[0].pending) || 0,
    avgNPS: nps.nps,
    waitlistCount: parseInt(waitlist.rows[0].count) || 0,
  };
};

// =============================================================================
// CRM SETTINGS
// =============================================================================

/**
 * Get CRM settings
 */
export const getCRMSettings = async (_clinicId) =>
  // For now, return default settings
  // In production, this would be stored in a settings table
  ({
    checkInFrequencyDays: 30,
    atRiskThresholdDays: 42,
    inactiveThresholdDays: 90,
    lostThresholdDays: 180,
    autoSendSurveys: true,
    surveyDelayDays: 1,
    enableReferralProgram: true,
    defaultReferralReward: { type: 'DISCOUNT', amount: 20, description: '20% rabatt' },
    enableWaitlist: true,
    maxWaitlistNotifications: 3,
  });

/**
 * Update CRM settings
 */
export const updateCRMSettings = async (clinicId, settings) => {
  // In production, save to database
  // For now, just return the settings
  logger.info('CRM settings updated for clinic:', clinicId, settings);
  return settings;
};
