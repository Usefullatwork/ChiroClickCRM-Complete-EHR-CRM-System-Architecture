/**
 * Treatment Plan Service
 * Business logic for treatment plans, milestones, and sessions
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Create a new treatment plan
 */
export async function createPlan(planData) {
  const {
    patientId,
    organizationId,
    practitionerId,
    title,
    conditionDescription,
    diagnosisCode,
    frequency,
    totalSessions,
    startDate,
    targetEndDate,
    goals,
    status,
    notes,
  } = planData;

  if (!patientId || !organizationId || !practitionerId || !title || !startDate) {
    throw new Error(
      'Missing required fields: patientId, organizationId, practitionerId, title, startDate'
    );
  }

  const result = await query(
    `INSERT INTO treatment_plans
      (patient_id, organization_id, practitioner_id, title, condition_description,
       diagnosis_code, frequency, total_sessions, start_date, target_end_date,
       goals, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      patientId,
      organizationId,
      practitionerId,
      title,
      conditionDescription || null,
      diagnosisCode || null,
      frequency || null,
      totalSessions || null,
      startDate,
      targetEndDate || null,
      JSON.stringify(goals || []),
      status || 'active',
      notes || null,
    ]
  );

  logger.info('Treatment plan created', { planId: result.rows[0].id, patientId });
  return result.rows[0];
}

/**
 * Get a single treatment plan with milestones and sessions
 */
export async function getPlan(id, orgId) {
  const planResult = await query(
    `SELECT * FROM treatment_plans WHERE id = $1 AND organization_id = $2`,
    [id, orgId]
  );

  if (planResult.rows.length === 0) return null;

  const plan = planResult.rows[0];

  const [milestonesResult, sessionsResult] = await Promise.all([
    query(
      `SELECT * FROM treatment_plan_milestones WHERE plan_id = $1 ORDER BY target_date ASC, created_at ASC`,
      [id]
    ),
    query(`SELECT * FROM treatment_plan_sessions WHERE plan_id = $1 ORDER BY session_number ASC`, [
      id,
    ]),
  ]);

  return {
    ...plan,
    milestones: milestonesResult.rows,
    sessions: sessionsResult.rows,
  };
}

/**
 * Get all treatment plans for a patient
 */
export async function getPatientPlans(patientId, orgId, statusFilter) {
  let sql = `SELECT * FROM treatment_plans WHERE patient_id = $1 AND organization_id = $2`;
  const params = [patientId, orgId];

  if (statusFilter) {
    params.push(statusFilter);
    sql += ` AND status = $${params.length}`;
  }

  sql += ' ORDER BY created_at DESC';

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Update a treatment plan
 */
export async function updatePlan(id, orgId, updates) {
  const allowedFields = [
    'title',
    'condition_description',
    'diagnosis_code',
    'frequency',
    'total_sessions',
    'start_date',
    'target_end_date',
    'goals',
    'status',
    'notes',
  ];

  const setClauses = [];
  const params = [id, orgId];
  let paramIndex = 3;

  for (const [key, value] of Object.entries(updates)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    if (allowedFields.includes(snakeKey)) {
      setClauses.push(`${snakeKey} = $${paramIndex}`);
      params.push(snakeKey === 'goals' ? JSON.stringify(value) : value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }

  setClauses.push(`updated_at = NOW()`);

  const result = await query(
    `UPDATE treatment_plans SET ${setClauses.join(', ')}
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    params
  );

  if (result.rows.length === 0) return null;

  logger.info('Treatment plan updated', { planId: id });
  return result.rows[0];
}

/**
 * Add a milestone to a plan
 */
export async function addMilestone(planId, milestoneData) {
  const { title, description, targetDate, outcomeMeasure, targetScore } = milestoneData;

  if (!title) throw new Error('Milestone title is required');

  const result = await query(
    `INSERT INTO treatment_plan_milestones
      (plan_id, title, description, target_date, outcome_measure, target_score)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      planId,
      title,
      description || null,
      targetDate || null,
      outcomeMeasure || null,
      targetScore || null,
    ]
  );

  return result.rows[0];
}

/**
 * Update a milestone
 */
export async function updateMilestone(milestoneId, updates) {
  const allowedFields = [
    'title',
    'description',
    'target_date',
    'outcome_measure',
    'target_score',
    'actual_score',
    'status',
    'completed_at',
  ];

  const setClauses = [];
  const params = [milestoneId];
  let paramIndex = 2;

  for (const [key, value] of Object.entries(updates)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    if (allowedFields.includes(snakeKey)) {
      setClauses.push(`${snakeKey} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }

  // Auto-set completed_at when status is achieved
  if (updates.status === 'achieved' && !updates.completedAt) {
    setClauses.push(`completed_at = NOW()`);
  }

  const result = await query(
    `UPDATE treatment_plan_milestones SET ${setClauses.join(', ')}
     WHERE id = $1
     RETURNING *`,
    params
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

/**
 * Add a session to a plan
 */
export async function addSession(planId, sessionData) {
  const { sessionNumber, scheduledDate, notes } = sessionData;

  if (!sessionNumber) throw new Error('Session number is required');

  const result = await query(
    `INSERT INTO treatment_plan_sessions
      (plan_id, session_number, scheduled_date, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [planId, sessionNumber, scheduledDate || null, notes || null]
  );

  return result.rows[0];
}

/**
 * Complete a session — auto-increments the plan's completed_sessions count
 */
export async function completeSession(sessionId, encounterData) {
  const { encounterId, notes } = encounterData || {};

  const sessionResult = await query(
    `UPDATE treatment_plan_sessions
     SET status = 'completed', completed_date = CURRENT_DATE,
         encounter_id = COALESCE($2, encounter_id),
         notes = COALESCE($3, notes)
     WHERE id = $1
     RETURNING *`,
    [sessionId, encounterId || null, notes || null]
  );

  if (sessionResult.rows.length === 0) return null;

  const session = sessionResult.rows[0];

  // Increment completed_sessions on the plan
  await query(
    `UPDATE treatment_plans
     SET completed_sessions = completed_sessions + 1,
         updated_at = NOW()
     WHERE id = $1`,
    [session.plan_id]
  );

  logger.info('Session completed', { sessionId, planId: session.plan_id });
  return session;
}

/**
 * Get plan progress (percentage + milestone status)
 */
export async function getPlanProgress(planId) {
  const planResult = await query(
    `SELECT total_sessions, completed_sessions, status FROM treatment_plans WHERE id = $1`,
    [planId]
  );

  if (planResult.rows.length === 0) return null;

  const plan = planResult.rows[0];

  const milestonesResult = await query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'achieved') as achieved,
       COUNT(*) FILTER (WHERE status = 'missed') as missed,
       COUNT(*) FILTER (WHERE status = 'pending') as pending,
       COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress
     FROM treatment_plan_milestones
     WHERE plan_id = $1`,
    [planId]
  );

  const milestones = milestonesResult.rows[0];
  const sessionPercentage = plan.total_sessions
    ? Math.round((plan.completed_sessions / plan.total_sessions) * 100)
    : 0;

  return {
    planStatus: plan.status,
    sessions: {
      total: plan.total_sessions,
      completed: plan.completed_sessions,
      percentage: sessionPercentage,
    },
    milestones: {
      total: parseInt(milestones.total),
      achieved: parseInt(milestones.achieved),
      missed: parseInt(milestones.missed),
      pending: parseInt(milestones.pending),
      inProgress: parseInt(milestones.in_progress),
    },
  };
}

export default {
  createPlan,
  getPlan,
  getPatientPlans,
  updatePlan,
  addMilestone,
  updateMilestone,
  addSession,
  completeSession,
  getPlanProgress,
};
