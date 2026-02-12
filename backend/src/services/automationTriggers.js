/**
 * Automation Trigger Handlers
 *
 * Handles time-based and event-based trigger detection for workflow automation.
 * Includes efficient database queries for identifying patients matching trigger criteria.
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import * as automationService from './automations/index.js';

const { TRIGGER_TYPES } = automationService;

// =============================================================================
// TIME-BASED TRIGGER PROCESSING
// =============================================================================

/**
 * Process all time-based triggers
 * Should be called by a scheduled job (e.g., daily at 9 AM)
 */
export const processTimeTriggers = async (organizationId = null) => {
  try {
    logger.info('Processing time-based triggers', { organizationId });

    const results = {
      daysSinceVisit: await checkDaysSinceVisitTriggers(organizationId),
      birthday: await checkBirthdayTriggers(organizationId),
      total: 0,
    };

    results.total = results.daysSinceVisit.processed + results.birthday.processed;

    logger.info('Time-based triggers processed', results);
    return results;
  } catch (error) {
    logger.error('Error processing time triggers:', error);
    throw error;
  }
};

// =============================================================================
// DAYS SINCE VISIT TRIGGERS
// =============================================================================

/**
 * Find and trigger workflows for patients needing recalls
 * Based on days since last visit
 */
export const checkDaysSinceVisitTriggers = async (organizationId = null) => {
  try {
    // Get all active DAYS_SINCE_VISIT workflows
    let workflowQuery = `
      SELECT w.*
      FROM workflows w
      WHERE w.trigger_type = $1
        AND w.is_active = true
    `;
    const workflowParams = [TRIGGER_TYPES.DAYS_SINCE_VISIT];

    if (organizationId) {
      workflowParams.push(organizationId);
      workflowQuery += ` AND w.organization_id = $2`;
    }

    const workflowsResult = await query(workflowQuery, workflowParams);
    const workflows = workflowsResult.rows;

    if (workflows.length === 0) {
      return { processed: 0, message: 'No active DAYS_SINCE_VISIT workflows' };
    }

    let processedCount = 0;

    for (const workflow of workflows) {
      const config = workflow.trigger_config || {};
      const daysThreshold = config.days || 42; // Default: 6 weeks
      const excludeStatuses = config.exclude_statuses || ['INACTIVE', 'DECEASED'];

      // Find patients who:
      // 1. Haven't visited in X days
      // 2. Haven't already been processed by this workflow (or max_runs allows)
      // 3. Have active status
      // 4. Belong to this organization
      const patientsResult = await query(
        `SELECT p.*,
          EXTRACT(DAY FROM (CURRENT_DATE - p.last_visit_date)) AS days_since_visit
        FROM patients p
        WHERE p.organization_id = $1
          AND p.last_visit_date IS NOT NULL
          AND p.last_visit_date <= CURRENT_DATE - $2::INTEGER
          AND p.status NOT IN (SELECT UNNEST($3::VARCHAR[]))
          AND (
            $4 = 0  -- No limit on runs per patient
            OR (
              SELECT COUNT(*) FROM workflow_executions we
              WHERE we.workflow_id = $5 AND we.patient_id = p.id
                AND we.status IN ('COMPLETED', 'RUNNING')
            ) < $4
          )
          AND NOT EXISTS (
            -- Exclude if already triggered today
            SELECT 1 FROM workflow_executions we
            WHERE we.workflow_id = $5
              AND we.patient_id = p.id
              AND DATE(we.created_at) = CURRENT_DATE
          )
        ORDER BY p.last_visit_date ASC
        LIMIT 100`,
        [
          workflow.organization_id,
          daysThreshold,
          excludeStatuses,
          workflow.max_runs_per_patient || 1,
          workflow.id,
        ]
      );

      const patients = patientsResult.rows;

      logger.info(`Found ${patients.length} patients for DAYS_SINCE_VISIT workflow`, {
        workflowId: workflow.id,
        daysThreshold,
        organizationId: workflow.organization_id,
      });

      // Trigger workflow for each patient
      for (const patient of patients) {
        try {
          await automationService.triggerWorkflow(
            workflow.organization_id,
            TRIGGER_TYPES.DAYS_SINCE_VISIT,
            {
              patient_id: patient.id,
              days_since_visit: parseInt(patient.days_since_visit),
            }
          );
          processedCount++;
        } catch (triggerError) {
          logger.error('Error triggering workflow for patient:', {
            workflowId: workflow.id,
            patientId: patient.id,
            error: triggerError.message,
          });
        }
      }
    }

    return { processed: processedCount };
  } catch (error) {
    logger.error('Error checking days since visit triggers:', error);
    throw error;
  }
};

/**
 * Get patients who need recall based on configurable criteria
 */
export const getPatientsNeedingRecall = async (organizationId, options = {}) => {
  const {
    daysSinceVisit = 42,
    limit = 50,
    excludeStatuses = ['INACTIVE', 'DECEASED'],
    includeLifecycleStages = null,
    sortBy = 'last_visit_date',
    sortOrder = 'ASC',
  } = options;

  try {
    let whereClause = `
      WHERE p.organization_id = $1
        AND p.last_visit_date IS NOT NULL
        AND p.last_visit_date <= CURRENT_DATE - $2::INTEGER
        AND p.status NOT IN (SELECT UNNEST($3::VARCHAR[]))
    `;
    const params = [organizationId, daysSinceVisit, excludeStatuses];
    let paramIndex = 4;

    if (includeLifecycleStages && includeLifecycleStages.length > 0) {
      params.push(includeLifecycleStages);
      whereClause += ` AND p.lifecycle_stage IN (SELECT UNNEST($${paramIndex}::VARCHAR[]))`;
      paramIndex++;
    }

    params.push(limit);

    const validSortFields = ['last_visit_date', 'first_name', 'last_name', 'total_visits'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'last_visit_date';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const result = await query(
      `SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.last_visit_date,
        p.total_visits,
        p.lifecycle_stage,
        p.status,
        EXTRACT(DAY FROM (CURRENT_DATE - p.last_visit_date)) AS days_since_visit
      FROM patients p
      ${whereClause}
      ORDER BY ${sortField} ${order}
      LIMIT $${paramIndex}`,
      params
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting patients needing recall:', error);
    throw error;
  }
};

// =============================================================================
// BIRTHDAY TRIGGERS
// =============================================================================

/**
 * Find and trigger workflows for upcoming/current birthdays
 */
export const checkBirthdayTriggers = async (organizationId = null) => {
  try {
    // Get all active BIRTHDAY workflows
    let workflowQuery = `
      SELECT w.*
      FROM workflows w
      WHERE w.trigger_type = $1
        AND w.is_active = true
    `;
    const workflowParams = [TRIGGER_TYPES.BIRTHDAY];

    if (organizationId) {
      workflowParams.push(organizationId);
      workflowQuery += ` AND w.organization_id = $2`;
    }

    const workflowsResult = await query(workflowQuery, workflowParams);
    const workflows = workflowsResult.rows;

    if (workflows.length === 0) {
      return { processed: 0, message: 'No active BIRTHDAY workflows' };
    }

    let processedCount = 0;

    for (const workflow of workflows) {
      const config = workflow.trigger_config || {};
      const daysBefore = config.days_before || 0; // 0 = on birthday, 3 = 3 days before
      const excludeStatuses = config.exclude_statuses || ['INACTIVE', 'DECEASED'];

      // Find patients with birthdays
      const patientsResult = await query(
        `SELECT p.*,
          DATE_PART('day', p.date_of_birth) AS birth_day,
          DATE_PART('month', p.date_of_birth) AS birth_month,
          EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth)) AS age
        FROM patients p
        WHERE p.organization_id = $1
          AND p.date_of_birth IS NOT NULL
          AND p.status NOT IN (SELECT UNNEST($2::VARCHAR[]))
          AND (
            -- Birthday is today (adjusted for days_before)
            (DATE_PART('month', p.date_of_birth) = DATE_PART('month', CURRENT_DATE + $3::INTEGER)
             AND DATE_PART('day', p.date_of_birth) = DATE_PART('day', CURRENT_DATE + $3::INTEGER))
          )
          AND (
            $4 = 0  -- No limit on runs per patient
            OR (
              SELECT COUNT(*) FROM workflow_executions we
              WHERE we.workflow_id = $5 AND we.patient_id = p.id
                AND we.status IN ('COMPLETED', 'RUNNING')
                AND EXTRACT(YEAR FROM we.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            ) < $4
          )
          AND NOT EXISTS (
            -- Exclude if already triggered this year
            SELECT 1 FROM workflow_executions we
            WHERE we.workflow_id = $5
              AND we.patient_id = p.id
              AND EXTRACT(YEAR FROM we.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
              AND we.trigger_type = $6
          )
        ORDER BY p.last_name, p.first_name
        LIMIT 100`,
        [
          workflow.organization_id,
          excludeStatuses,
          daysBefore,
          workflow.max_runs_per_patient || 1,
          workflow.id,
          TRIGGER_TYPES.BIRTHDAY,
        ]
      );

      const patients = patientsResult.rows;

      logger.info(`Found ${patients.length} patients for BIRTHDAY workflow`, {
        workflowId: workflow.id,
        daysBefore,
        organizationId: workflow.organization_id,
      });

      // Trigger workflow for each patient
      for (const patient of patients) {
        try {
          await automationService.triggerWorkflow(
            workflow.organization_id,
            TRIGGER_TYPES.BIRTHDAY,
            {
              patient_id: patient.id,
              is_birthday: true,
              age: parseInt(patient.age) + 1, // Age they're turning
              birth_date: patient.date_of_birth,
            }
          );
          processedCount++;
        } catch (triggerError) {
          logger.error('Error triggering birthday workflow for patient:', {
            workflowId: workflow.id,
            patientId: patient.id,
            error: triggerError.message,
          });
        }
      }
    }

    return { processed: processedCount };
  } catch (error) {
    logger.error('Error checking birthday triggers:', error);
    throw error;
  }
};

/**
 * Get patients with upcoming birthdays
 */
export const getUpcomingBirthdays = async (organizationId, options = {}) => {
  const { daysAhead = 7, limit = 50, excludeStatuses = ['INACTIVE', 'DECEASED'] } = options;

  try {
    const result = await query(
      `SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.date_of_birth,
        EXTRACT(YEAR FROM AGE(
          MAKE_DATE(
            EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
            EXTRACT(MONTH FROM p.date_of_birth)::INTEGER,
            EXTRACT(DAY FROM p.date_of_birth)::INTEGER
          ),
          p.date_of_birth
        )) + 1 AS turning_age,
        MAKE_DATE(
          EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
          EXTRACT(MONTH FROM p.date_of_birth)::INTEGER,
          EXTRACT(DAY FROM p.date_of_birth)::INTEGER
        ) - CURRENT_DATE AS days_until_birthday
      FROM patients p
      WHERE p.organization_id = $1
        AND p.date_of_birth IS NOT NULL
        AND p.status NOT IN (SELECT UNNEST($2::VARCHAR[]))
        AND (
          -- Birthday is within the next X days (this year)
          MAKE_DATE(
            EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
            EXTRACT(MONTH FROM p.date_of_birth)::INTEGER,
            EXTRACT(DAY FROM p.date_of_birth)::INTEGER
          ) BETWEEN CURRENT_DATE AND CURRENT_DATE + $3::INTEGER
          OR
          -- Birthday is in the next year (for late December when looking at early January)
          MAKE_DATE(
            EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER + 1,
            EXTRACT(MONTH FROM p.date_of_birth)::INTEGER,
            EXTRACT(DAY FROM p.date_of_birth)::INTEGER
          ) BETWEEN CURRENT_DATE AND CURRENT_DATE + $3::INTEGER
        )
      ORDER BY
        MAKE_DATE(
          EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
          EXTRACT(MONTH FROM p.date_of_birth)::INTEGER,
          EXTRACT(DAY FROM p.date_of_birth)::INTEGER
        )
      LIMIT $4`,
      [organizationId, excludeStatuses, daysAhead, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting upcoming birthdays:', error);
    throw error;
  }
};

// =============================================================================
// APPOINTMENT TRIGGERS
// =============================================================================

/**
 * Check appointment-based triggers
 * Called after appointment status changes
 */
export const checkAppointmentTriggers = async (organizationId, appointment, previousStatus) => {
  try {
    const triggerType = mapAppointmentStatusToTrigger(appointment.status, previousStatus);

    if (!triggerType) {
      logger.debug('No trigger type for appointment status change', {
        status: appointment.status,
        previousStatus,
      });
      return { triggered: 0 };
    }

    const result = await automationService.triggerWorkflow(organizationId, triggerType, {
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      status: appointment.status,
      previous_status: previousStatus,
      appointment_type: appointment.appointment_type,
      practitioner_id: appointment.practitioner_id,
      start_time: appointment.start_time,
    });

    return result;
  } catch (error) {
    logger.error('Error checking appointment triggers:', error);
    throw error;
  }
};

/**
 * Map appointment status to trigger type
 */
const mapAppointmentStatusToTrigger = (newStatus, previousStatus) => {
  switch (newStatus) {
    case 'SCHEDULED':
    case 'CONFIRMED':
      if (!previousStatus || previousStatus === 'CANCELLED') {
        return TRIGGER_TYPES.APPOINTMENT_SCHEDULED;
      }
      return null;

    case 'COMPLETED':
      return TRIGGER_TYPES.APPOINTMENT_COMPLETED;

    case 'NO_SHOW':
      return TRIGGER_TYPES.APPOINTMENT_MISSED;

    case 'CANCELLED':
      return TRIGGER_TYPES.APPOINTMENT_CANCELLED;

    default:
      return null;
  }
};

/**
 * Get appointments needing follow-up based on status
 */
export const getAppointmentsNeedingFollowUp = async (organizationId, options = {}) => {
  const { status = 'NO_SHOW', daysAgo = 7, limit = 50 } = options;

  try {
    const result = await query(
      `SELECT
        a.*,
        p.first_name || ' ' || p.last_name AS patient_name,
        p.phone AS patient_phone,
        p.email AS patient_email,
        u.first_name || ' ' || u.last_name AS practitioner_name
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      LEFT JOIN users u ON u.id = a.practitioner_id
      WHERE a.organization_id = $1
        AND a.status = $2
        AND a.start_time >= CURRENT_DATE - $3::INTEGER
        AND a.start_time < CURRENT_DATE
        AND NOT EXISTS (
          -- Exclude if follow-up already exists
          SELECT 1 FROM follow_ups f
          WHERE f.patient_id = a.patient_id
            AND f.organization_id = a.organization_id
            AND f.auto_generated = true
            AND f.created_at > a.start_time
        )
      ORDER BY a.start_time DESC
      LIMIT $4`,
      [organizationId, status, daysAgo, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting appointments needing follow-up:', error);
    throw error;
  }
};

// =============================================================================
// PATIENT EVENT TRIGGERS
// =============================================================================

/**
 * Check patient creation trigger
 */
export const checkPatientCreatedTrigger = async (organizationId, patientId) => {
  try {
    return await automationService.triggerWorkflow(organizationId, TRIGGER_TYPES.PATIENT_CREATED, {
      patient_id: patientId,
    });
  } catch (error) {
    logger.error('Error checking patient created trigger:', error);
    throw error;
  }
};

/**
 * Check patient lifecycle change trigger
 */
export const checkLifecycleChangeTrigger = async (
  organizationId,
  patientId,
  previousLifecycle,
  newLifecycle
) => {
  try {
    if (previousLifecycle === newLifecycle) {
      return { triggered: 0 };
    }

    return await automationService.triggerWorkflow(organizationId, TRIGGER_TYPES.LIFECYCLE_CHANGE, {
      patient_id: patientId,
      lifecycle_changed: true,
      previous_lifecycle: previousLifecycle,
      new_lifecycle: newLifecycle,
    });
  } catch (error) {
    logger.error('Error checking lifecycle change trigger:', error);
    throw error;
  }
};

// =============================================================================
// TRIGGER STATISTICS
// =============================================================================

/**
 * Get trigger statistics for an organization
 */
export const getTriggerStats = async (organizationId) => {
  try {
    const result = await query(
      `SELECT
        w.trigger_type,
        COUNT(DISTINCT w.id) AS workflow_count,
        COUNT(DISTINCT CASE WHEN w.is_active THEN w.id END) AS active_workflows,
        COUNT(we.id) AS total_executions,
        COUNT(CASE WHEN we.status = 'COMPLETED' THEN 1 END) AS successful_executions,
        COUNT(CASE WHEN we.status = 'FAILED' THEN 1 END) AS failed_executions,
        MAX(we.created_at) AS last_execution
      FROM workflows w
      LEFT JOIN workflow_executions we ON we.workflow_id = w.id
      WHERE w.organization_id = $1
      GROUP BY w.trigger_type
      ORDER BY total_executions DESC`,
      [organizationId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting trigger stats:', error);
    throw error;
  }
};

/**
 * Get upcoming triggers that will fire soon
 */
export const getUpcomingTriggers = async (organizationId, options = {}) => {
  const { daysAhead = 7 } = options;

  try {
    const birthdays = await getUpcomingBirthdays(organizationId, { daysAhead, limit: 10 });
    const recalls = await getPatientsNeedingRecall(organizationId, { limit: 10 });

    // Get active workflows to understand what will trigger
    const workflowsResult = await query(
      `SELECT trigger_type, COUNT(*) as count
      FROM workflows
      WHERE organization_id = $1 AND is_active = true
      GROUP BY trigger_type`,
      [organizationId]
    );

    const activeWorkflows = workflowsResult.rows.reduce((acc, row) => {
      acc[row.trigger_type] = parseInt(row.count);
      return acc;
    }, {});

    return {
      birthdays: {
        count: birthdays.length,
        patients: birthdays,
        has_active_workflow: !!activeWorkflows[TRIGGER_TYPES.BIRTHDAY],
      },
      recalls: {
        count: recalls.length,
        patients: recalls,
        has_active_workflow: !!activeWorkflows[TRIGGER_TYPES.DAYS_SINCE_VISIT],
      },
      active_workflows: activeWorkflows,
    };
  } catch (error) {
    logger.error('Error getting upcoming triggers:', error);
    throw error;
  }
};

export default {
  processTimeTriggers,
  checkDaysSinceVisitTriggers,
  getPatientsNeedingRecall,
  checkBirthdayTriggers,
  getUpcomingBirthdays,
  checkAppointmentTriggers,
  getAppointmentsNeedingFollowUp,
  checkPatientCreatedTrigger,
  checkLifecycleChangeTrigger,
  getTriggerStats,
  getUpcomingTriggers,
};
