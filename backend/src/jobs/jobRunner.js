/**
 * Job Runner
 * Core infrastructure for scheduled job execution with overlap prevention,
 * timeout handling, and database logging.
 *
 * @module jobs/jobRunner
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/** Track running jobs to prevent overlap */
export const runningJobs = new Map();

/** Store cron job references for management */
export const scheduledJobs = new Map();

/**
 * Execute a job with error handling and overlap prevention.
 *
 * @param {string} jobName - Unique job identifier
 * @param {Function} handler - Async handler returning result object
 * @param {number} timeout - Timeout in ms (default 300 000)
 * @returns {Promise<Object|null>} Handler result or null on failure
 */
export const executeJob = async (jobName, handler, timeout = 300000) => {
  if (runningJobs.has(jobName)) {
    logger.warn(`Job ${jobName} is already running, skipping this execution`);
    return null;
  }

  const startTime = new Date();
  const jobId = `${jobName}_${startTime.getTime()}`;

  logger.info(`Starting job: ${jobName} (${jobId})`);
  runningJobs.set(jobName, jobId);

  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Job timeout exceeded')), timeout);
    });

    const result = await Promise.race([handler(), timeoutPromise]);
    const duration = Date.now() - startTime.getTime();

    await logJobExecution(jobName, jobId, 'success', duration, result);

    const jobInfo = scheduledJobs.get(jobName);
    if (jobInfo) {
      jobInfo.lastRun = startTime;
      jobInfo.lastStatus = 'success';
      jobInfo.lastDuration = duration;
    }

    logger.info(`Job completed: ${jobName} (${duration}ms)`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime.getTime();

    logger.error(`Job failed: ${jobName}`, error);
    await logJobExecution(jobName, jobId, 'failed', duration, null, error.message);

    const jobInfo = scheduledJobs.get(jobName);
    if (jobInfo) {
      jobInfo.lastRun = startTime;
      jobInfo.lastStatus = 'failed';
      jobInfo.lastError = error.message;
    }

    return null;
  } finally {
    runningJobs.delete(jobName);
  }
};

/**
 * Log job execution to the database.
 *
 * @param {string} jobName
 * @param {string} jobId
 * @param {string} status - 'success' | 'failed'
 * @param {number} durationMs
 * @param {Object|null} result
 * @param {string|null} error
 */
export const logJobExecution = async (
  jobName,
  jobId,
  status,
  durationMs,
  result = null,
  error = null
) => {
  try {
    await query(
      `INSERT INTO scheduled_job_logs (
        job_name, job_id, status, duration_ms, result, error_message, executed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT DO NOTHING`,
      [jobName, jobId, status, durationMs, result ? JSON.stringify(result) : null, error]
    );
  } catch (dbError) {
    logger.debug('Could not log job execution (table may not exist):', dbError.message);
  }
};

/**
 * Load services dynamically with error handling.
 * Returns an object with loaded service references.
 *
 * @returns {Promise<Object>} Loaded services
 */
export const loadServices = async () => {
  const services = {
    aiLearningService: null,
    aiRetrainingService: null,
    automationsService: null,
    bulkCommunicationService: null,
    communicationsService: null,
    smartSchedulerService: null,
    recallEngine: null,
    reportService: null,
    appointmentRemindersService: null,
  };

  const loads = [
    ['aiLearningService', '../services/training/aiLearning.js', 'AI Learning'],
    ['automationsService', '../services/automations/index.js', 'Automations'],
    [
      'bulkCommunicationService',
      '../services/communication/bulkCommunication.js',
      'Bulk Communication',
    ],
    ['communicationsService', '../services/communication/communications.js', 'Communications'],
    ['smartSchedulerService', '../services/practice/smartScheduler.js', 'Smart Scheduler'],
    ['recallEngine', '../services/practice/recallEngine.js', 'Recall Engine'],
    [
      'appointmentRemindersService',
      '../services/communication/appointmentReminders.js',
      'Appointment Reminders',
    ],
    ['reportService', '../services/clinical/reportService.js', 'Report'],
  ];

  for (const [key, modulePath, label] of loads) {
    try {
      services[key] = await import(modulePath);
      logger.info(`${label} service loaded`);
    } catch (e) {
      logger.warn(`${label} service not available:`, e.message);
    }
  }

  // AIRetrainingService needs special handling (named export)
  try {
    const mod = await import('../application/services/AIRetrainingService.js');
    services.aiRetrainingService = mod.aiRetrainingService;
    logger.info('AI Retraining service loaded');
  } catch (e) {
    logger.warn('AI Retraining service not available:', e.message);
  }

  return services;
};
