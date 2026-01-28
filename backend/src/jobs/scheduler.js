/**
 * Job Scheduler Service
 * Manages background jobs using node-cron for automated workflows, follow-ups, and maintenance
 */

import cron from 'node-cron';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

// Store active cron jobs
const activeJobs = new Map();

// Scheduler state
let isRunning = false;
let timezone = 'Europe/Oslo';

/**
 * Log job execution to database
 */
const logJobExecution = async (jobName, jobId, status, durationMs = null, result = null, errorMessage = null) => {
  try {
    await query(
      `INSERT INTO scheduled_job_logs (job_name, job_id, status, duration_ms, result, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [jobName, jobId, status, durationMs, result ? JSON.stringify(result) : null, errorMessage]
    );
  } catch (error) {
    logger.error('Failed to log job execution:', error);
  }
};

/**
 * Wrap job handler with error handling and logging
 */
const createJobWrapper = (jobName, handler) => {
  return async () => {
    const startTime = Date.now();
    const jobId = `${jobName}-${Date.now()}`;

    logger.info(`[Scheduler] Starting job: ${jobName}`);

    try {
      const result = await handler();
      const duration = Date.now() - startTime;

      await logJobExecution(jobName, jobId, 'COMPLETED', duration, result);
      logger.info(`[Scheduler] Completed job: ${jobName} (${duration}ms)`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      await logJobExecution(jobName, jobId, 'FAILED', duration, null, error.message);
      logger.error(`[Scheduler] Failed job: ${jobName}`, error);

      throw error;
    }
  };
};

// ============================================================================
// JOB HANDLERS
// ============================================================================

/**
 * Process scheduled workflow actions
 * Checks workflow_scheduled_actions table for pending actions due to run
 */
const processScheduledWorkflowActions = async () => {
  const result = await query(
    `SELECT wsa.*, we.patient_id, we.lead_id,
            COALESCE(w.organization_id, w.clinic_id) as organization_id
     FROM workflow_scheduled_actions wsa
     JOIN workflow_executions we ON we.id = wsa.execution_id
     JOIN workflows w ON w.id = we.workflow_id
     WHERE wsa.status = 'PENDING'
       AND wsa.scheduled_for <= NOW()
     ORDER BY wsa.scheduled_for ASC
     LIMIT 100`
  );

  if (result.rows.length === 0) {
    return { processed: 0 };
  }

  let processed = 0;
  let failed = 0;

  for (const action of result.rows) {
    try {
      // Mark as processing
      await query(
        `UPDATE workflow_scheduled_actions SET status = 'PROCESSING' WHERE id = $1`,
        [action.id]
      );

      // Execute the action (import dynamically to avoid circular deps)
      const { executeAction } = await import('./actionExecutor.js');
      await executeAction(action.organization_id, action.action_type, action.action_config, {
        patientId: action.patient_id,
        leadId: action.lead_id,
        executionId: action.execution_id
      });

      // Mark as completed
      await query(
        `UPDATE workflow_scheduled_actions SET status = 'COMPLETED', completed_at = NOW() WHERE id = $1`,
        [action.id]
      );

      processed++;
    } catch (error) {
      logger.error(`Failed to process scheduled action ${action.id}:`, error);

      await query(
        `UPDATE workflow_scheduled_actions SET status = 'FAILED', error_message = $2 WHERE id = $1`,
        [action.id, error.message]
      );

      failed++;
    }
  }

  return { processed, failed, total: result.rows.length };
};

/**
 * Process overdue follow-ups
 * Finds follow-ups that are past due and haven't been contacted
 */
const processOverdueFollowups = async () => {
  // Get all organizations with overdue follow-ups
  const result = await query(
    `SELECT DISTINCT f.organization_id
     FROM follow_ups f
     WHERE f.status = 'PENDING'
       AND f.due_date < CURRENT_DATE
       AND f.communication_sent = false`
  );

  let totalOverdue = 0;

  for (const { organization_id } of result.rows) {
    // Count overdue for this org (we don't auto-send, just flag them)
    const countResult = await query(
      `SELECT COUNT(*) as count
       FROM follow_ups
       WHERE organization_id = $1
         AND status = 'PENDING'
         AND due_date < CURRENT_DATE
         AND communication_sent = false`,
      [organization_id]
    );

    totalOverdue += parseInt(countResult.rows[0].count);
  }

  return { overdueCount: totalOverdue, organizationsChecked: result.rows.length };
};

/**
 * Update patient lifecycle stages
 * Automatically transitions patients based on visit history
 */
const updateLifecycleStages = async () => {
  // Update all patients based on their last visit date
  const result = await query(
    `UPDATE patients p
     SET lifecycle_stage =
       CASE
         WHEN p.total_visits = 0 OR p.last_visit_date IS NULL THEN 'NEW'
         WHEN p.total_visits <= 2 AND (CURRENT_DATE - p.last_visit_date) <= 30 THEN 'ONBOARDING'
         WHEN (CURRENT_DATE - p.last_visit_date) <= 42 THEN 'ACTIVE'
         WHEN (CURRENT_DATE - p.last_visit_date) <= 90 THEN 'AT_RISK'
         WHEN (CURRENT_DATE - p.last_visit_date) <= 180 THEN 'INACTIVE'
         ELSE 'LOST'
       END,
       updated_at = NOW()
     WHERE p.lifecycle_stage IS DISTINCT FROM
       CASE
         WHEN p.total_visits = 0 OR p.last_visit_date IS NULL THEN 'NEW'
         WHEN p.total_visits <= 2 AND (CURRENT_DATE - p.last_visit_date) <= 30 THEN 'ONBOARDING'
         WHEN (CURRENT_DATE - p.last_visit_date) <= 42 THEN 'ACTIVE'
         WHEN (CURRENT_DATE - p.last_visit_date) <= 90 THEN 'AT_RISK'
         WHEN (CURRENT_DATE - p.last_visit_date) <= 180 THEN 'INACTIVE'
         ELSE 'LOST'
       END
     RETURNING id, lifecycle_stage`
  );

  return { updated: result.rowCount };
};

/**
 * Clean up expired auth tokens and sessions
 */
const cleanupAuthTokens = async () => {
  try {
    await query(`SELECT cleanup_auth_tokens()`);
    return { success: true };
  } catch (error) {
    // Function may not exist yet
    logger.warn('cleanup_auth_tokens function not available:', error.message);

    // Fallback: manual cleanup
    const sessionsResult = await query(`DELETE FROM sessions WHERE expires_at < NOW()`);
    return { sessionsDeleted: sessionsResult.rowCount };
  }
};

/**
 * Process pending campaigns
 * Checks for campaigns scheduled to start
 */
const processPendingCampaigns = async () => {
  const result = await query(
    `SELECT * FROM campaigns
     WHERE status = 'SCHEDULED'
       AND scheduled_at <= NOW()
     LIMIT 10`
  );

  let started = 0;

  for (const campaign of result.rows) {
    try {
      // Mark as running
      await query(
        `UPDATE campaigns SET status = 'RUNNING', started_at = NOW() WHERE id = $1`,
        [campaign.id]
      );
      started++;

      logger.info(`Started campaign: ${campaign.name} (${campaign.id})`);
    } catch (error) {
      logger.error(`Failed to start campaign ${campaign.id}:`, error);
    }
  }

  return { started };
};

/**
 * Check for birthday patients today
 * Returns patients with birthdays for potential automation
 */
const checkBirthdays = async () => {
  const result = await query(
    `SELECT p.id, p.organization_id, p.first_name, p.last_name, p.date_of_birth
     FROM patients p
     WHERE EXTRACT(MONTH FROM p.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(DAY FROM p.date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE)
       AND p.status = 'ACTIVE'`
  );

  // Trigger birthday workflows for each patient
  for (const patient of result.rows) {
    try {
      const { detectAndTriggerWorkflows } = await import('./triggerDetector.js');
      await detectAndTriggerWorkflows(patient.organization_id, 'BIRTHDAY', { patientId: patient.id });
    } catch (error) {
      logger.error(`Failed to trigger birthday workflow for patient ${patient.id}:`, error);
    }
  }

  return { birthdayCount: result.rows.length };
};

// ============================================================================
// SCHEDULER MANAGEMENT
// ============================================================================

/**
 * Initialize the scheduler with all configured jobs
 */
export const initializeScheduler = async () => {
  if (isRunning) {
    logger.warn('[Scheduler] Already running');
    return { success: true, message: 'Already running', jobCount: activeJobs.size, timezone };
  }

  logger.info('[Scheduler] Initializing...');

  // Job definitions: [name, cronExpression, handler]
  const jobs = [
    // Every minute - process scheduled workflow actions
    ['processScheduledWorkflowActions', '* * * * *', processScheduledWorkflowActions],

    // Every 15 minutes - check overdue follow-ups
    ['processOverdueFollowups', '*/15 * * * *', processOverdueFollowups],

    // Every hour - process pending campaigns
    ['processPendingCampaigns', '0 * * * *', processPendingCampaigns],

    // Daily at 2:00 AM - update lifecycle stages
    ['updateLifecycleStages', '0 2 * * *', updateLifecycleStages],

    // Daily at 3:00 AM - cleanup auth tokens
    ['cleanupAuthTokens', '0 3 * * *', cleanupAuthTokens],

    // Daily at 8:00 AM - check birthdays
    ['checkBirthdays', '0 8 * * *', checkBirthdays],
  ];

  for (const [name, cronExpression, handler] of jobs) {
    try {
      const wrappedHandler = createJobWrapper(name, handler);
      const job = cron.schedule(cronExpression, wrappedHandler, {
        scheduled: true,
        timezone
      });

      activeJobs.set(name, {
        job,
        cronExpression,
        lastRun: null,
        nextRun: getNextRunTime(cronExpression),
        status: 'ACTIVE'
      });

      logger.info(`[Scheduler] Registered job: ${name} (${cronExpression})`);
    } catch (error) {
      logger.error(`[Scheduler] Failed to register job ${name}:`, error);
    }
  }

  isRunning = true;
  logger.info(`[Scheduler] Started with ${activeJobs.size} jobs`);

  return { success: true, jobCount: activeJobs.size, timezone };
};

/**
 * Shutdown the scheduler
 */
export const shutdownScheduler = () => {
  if (!isRunning) {
    return;
  }

  logger.info('[Scheduler] Shutting down...');

  for (const [name, { job }] of activeJobs) {
    try {
      job.stop();
      logger.info(`[Scheduler] Stopped job: ${name}`);
    } catch (error) {
      logger.error(`[Scheduler] Error stopping job ${name}:`, error);
    }
  }

  activeJobs.clear();
  isRunning = false;

  logger.info('[Scheduler] Shutdown complete');
};

/**
 * Get scheduler status and job details
 */
export const getSchedulerStatus = () => {
  const jobs = [];

  for (const [name, jobInfo] of activeJobs) {
    jobs.push({
      name,
      cronExpression: jobInfo.cronExpression,
      status: jobInfo.status,
      lastRun: jobInfo.lastRun,
      nextRun: jobInfo.nextRun
    });
  }

  return {
    running: isRunning,
    timezone,
    jobCount: activeJobs.size,
    jobs
  };
};

/**
 * Schedule a new job dynamically
 */
export const scheduleJob = async (jobName, cronExpression, handler) => {
  if (activeJobs.has(jobName)) {
    throw new Error(`Job ${jobName} already exists`);
  }

  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }

  const wrappedHandler = createJobWrapper(jobName, handler);
  const job = cron.schedule(cronExpression, wrappedHandler, {
    scheduled: true,
    timezone
  });

  activeJobs.set(jobName, {
    job,
    cronExpression,
    lastRun: null,
    nextRun: getNextRunTime(cronExpression),
    status: 'ACTIVE'
  });

  logger.info(`[Scheduler] Added job: ${jobName} (${cronExpression})`);

  return { id: jobName, name: jobName, cronExpression };
};

/**
 * Cancel a scheduled job
 */
export const cancelJob = async (jobId) => {
  const jobInfo = activeJobs.get(jobId);

  if (!jobInfo) {
    return false;
  }

  jobInfo.job.stop();
  activeJobs.delete(jobId);

  logger.info(`[Scheduler] Cancelled job: ${jobId}`);

  return true;
};

/**
 * Manually run a job
 */
export const runJobNow = async (jobName) => {
  const handlers = {
    processScheduledWorkflowActions,
    processOverdueFollowups,
    processPendingCampaigns,
    updateLifecycleStages,
    cleanupAuthTokens,
    checkBirthdays
  };

  const handler = handlers[jobName];
  if (!handler) {
    throw new Error(`Unknown job: ${jobName}`);
  }

  const wrappedHandler = createJobWrapper(jobName, handler);
  return await wrappedHandler();
};

/**
 * Get recent job logs
 */
export const getJobLogs = async (limit = 50, jobName = null) => {
  let sql = `
    SELECT * FROM scheduled_job_logs
    ${jobName ? 'WHERE job_name = $2' : ''}
    ORDER BY executed_at DESC
    LIMIT $1
  `;

  const params = jobName ? [limit, jobName] : [limit];
  const result = await query(sql, params);

  return result.rows;
};

/**
 * Calculate next run time from cron expression
 */
const getNextRunTime = (cronExpression) => {
  // Simple approximation - node-cron doesn't expose next run
  // For accurate timing, would need to parse cron expression
  return new Date().toISOString();
};

export default {
  initializeScheduler,
  shutdownScheduler,
  getSchedulerStatus,
  scheduleJob,
  cancelJob,
  runJobNow,
  getJobLogs
};
