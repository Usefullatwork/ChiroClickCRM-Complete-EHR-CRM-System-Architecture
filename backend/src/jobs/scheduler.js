/**
 * Scheduled Jobs
 * Cron-based task scheduler for automated workflows
 * Includes communication queue, AI metrics, and retraining checks
 * Timezone: Europe/Oslo
 */

import cron from 'node-cron';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

// Timezone for Norway (Europe/Oslo)
const TIMEZONE = process.env.SCHEDULER_TIMEZONE || 'Europe/Oslo';

// Import services (with error handling for missing modules)
let aiLearningService = null;
let aiRetrainingService = null;
let automationsService = null;
let bulkCommunicationService = null;
let communicationsService = null;
let smartSchedulerService = null;
let recallEngine = null;
let reportService = null;

// Track running jobs to prevent overlap
const runningJobs = new Map();

// Store cron job references for management
const scheduledJobs = new Map();

/**
 * Load services dynamically with error handling
 */
const loadServices = async () => {
  try {
    aiLearningService = await import('../services/aiLearning.js');
    logger.info('AI Learning service loaded');
  } catch (e) {
    logger.warn('AI Learning service not available:', e.message);
  }

  try {
    aiRetrainingService = await import('../services/aiRetraining.js');
    logger.info('AI Retraining service loaded');
  } catch (e) {
    logger.warn('AI Retraining service not available:', e.message);
  }

  try {
    automationsService = await import('../services/automations/index.js');
    logger.info('Automations service loaded');
  } catch (e) {
    logger.warn('Automations service not available:', e.message);
  }

  try {
    bulkCommunicationService = await import('../services/bulkCommunication.js');
    logger.info('Bulk Communication service loaded');
  } catch (e) {
    logger.warn('Bulk Communication service not available:', e.message);
  }

  try {
    communicationsService = await import('../services/communications.js');
    logger.info('Communications service loaded');
  } catch (e) {
    logger.warn('Communications service not available:', e.message);
  }

  try {
    smartSchedulerService = await import('../services/smartScheduler.js');
    logger.info('Smart Scheduler service loaded');
  } catch (e) {
    logger.warn('Smart Scheduler service not available:', e.message);
  }

  try {
    recallEngine = await import('../services/recallEngine.js');
    logger.info('Recall Engine service loaded');
  } catch (e) {
    logger.warn('Recall Engine service not available:', e.message);
  }

  try {
    reportService = await import('../services/reportService.js');
    logger.info('Report service loaded');
  } catch (e) {
    logger.warn('Report service not available:', e.message);
  }
};

/**
 * Execute a job with error handling and overlap prevention
 */
const executeJob = async (jobName, handler, timeout = 300000) => {
  // Check if job is already running
  if (runningJobs.has(jobName)) {
    logger.warn(`Job ${jobName} is already running, skipping this execution`);
    return null;
  }

  const startTime = new Date();
  const jobId = `${jobName}_${startTime.getTime()}`;

  logger.info(`Starting job: ${jobName} (${jobId})`);
  runningJobs.set(jobName, jobId);

  try {
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Job timeout exceeded')), timeout);
    });

    // Execute job with timeout
    const result = await Promise.race([handler(), timeoutPromise]);

    const duration = Date.now() - startTime.getTime();

    // Log successful execution
    await logJobExecution(jobName, jobId, 'success', duration, result);

    // Update job status
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

    // Log failed execution
    await logJobExecution(jobName, jobId, 'failed', duration, null, error.message);

    // Update job status
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
 * Log job execution to database
 */
const logJobExecution = async (jobName, jobId, status, durationMs, result = null, error = null) => {
  try {
    await query(
      `INSERT INTO scheduled_job_logs (
        job_name,
        job_id,
        status,
        duration_ms,
        result,
        error_message,
        executed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT DO NOTHING`,
      [jobName, jobId, status, durationMs, result ? JSON.stringify(result) : null, error]
    );
  } catch (dbError) {
    // Log but don't fail - table might not exist yet
    logger.debug('Could not log job execution (table may not exist):', dbError.message);
  }
};

// ============================================================
// JOB HANDLERS
// ============================================================

/**
 * Process pending communications queue
 * HOURLY: At minute 0 of every hour
 */
const processCommunicationQueue = async () => {
  if (!bulkCommunicationService && !communicationsService) {
    logger.debug('Communication services not available');
    return { skipped: true, reason: 'service_not_available' };
  }

  logger.info('Processing communication queue...');

  const result = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  try {
    // Get pending communications
    const pendingResult = await query(
      `SELECT cq.*, p.first_name, p.last_name, p.phone, p.email, p.organization_id
       FROM communication_queue cq
       JOIN patients p ON p.id = cq.patient_id
       WHERE cq.status = 'pending'
         AND cq.scheduled_at <= NOW()
       ORDER BY cq.priority DESC, cq.scheduled_at ASC
       LIMIT 100`
    );

    const pendingItems = pendingResult.rows;
    logger.info(`Found ${pendingItems.length} pending communications`);

    for (const item of pendingItems) {
      result.processed++;

      try {
        // Check patient communication preferences
        const prefsResult = await query(
          `SELECT * FROM patient_communication_preferences
           WHERE patient_id = $1`,
          [item.patient_id]
        );

        const prefs = prefsResult.rows[0];

        // Skip if patient has opted out
        if (prefs && !prefs[`${item.type.toLowerCase()}_enabled`]) {
          await query(
            `UPDATE communication_queue
             SET status = 'skipped', processed_at = NOW(), notes = 'Patient opted out'
             WHERE id = $1`,
            [item.id]
          );
          result.skipped++;
          continue;
        }

        // Send communication based on type
        if (item.type === 'SMS' && item.phone && communicationsService) {
          await communicationsService.sendSMS(
            item.organization_id,
            {
              patient_id: item.patient_id,
              recipient_phone: item.phone,
              content: item.content,
              template_id: item.template_id,
            },
            null // System user
          );
        } else if (item.type === 'EMAIL' && item.email && communicationsService) {
          await communicationsService.sendEmail(
            item.organization_id,
            {
              patient_id: item.patient_id,
              recipient_email: item.email,
              subject: item.subject,
              content: item.content,
              template_id: item.template_id,
            },
            null // System user
          );
        } else {
          throw new Error(`Missing contact info or service for ${item.type}`);
        }

        // Mark as sent
        await query(
          `UPDATE communication_queue
           SET status = 'sent', processed_at = NOW()
           WHERE id = $1`,
          [item.id]
        );
        result.sent++;
      } catch (sendError) {
        logger.error(`Failed to send communication ${item.id}:`, sendError);

        // Mark as failed with retry count
        await query(
          `UPDATE communication_queue
           SET status = CASE WHEN retry_count >= 3 THEN 'failed' ELSE 'pending' END,
               retry_count = retry_count + 1,
               last_error = $2,
               processed_at = NOW()
           WHERE id = $1`,
          [item.id, sendError.message]
        );
        result.failed++;
      }
    }

    logger.info('Communication queue processing complete:', result);
    return result;
  } catch (error) {
    logger.error('Error processing communication queue:', error);
    throw error;
  }
};

/**
 * Update daily AI metrics
 * DAILY: At midnight (00:00) Europe/Oslo
 */
const updateDailyAIMetrics = async () => {
  if (!aiLearningService) {
    logger.debug('AI Learning service not available');
    return { skipped: true, reason: 'service_not_available' };
  }

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    logger.info('Updating daily AI metrics for', yesterday.toISOString().split('T')[0]);
    await aiLearningService.updateDailyMetrics(yesterday);

    // Get summary for logging
    const metricsResult = await query(
      `SELECT
        suggestion_type,
        COUNT(*) as total,
        SUM(CASE WHEN accepted = true THEN 1 ELSE 0 END) as accepted,
        ROUND(AVG(confidence_score)::numeric, 2) as avg_confidence,
        ROUND(AVG(user_rating)::numeric, 2) as avg_rating
       FROM ai_feedback
       WHERE DATE(created_at) = $1
       GROUP BY suggestion_type`,
      [yesterday.toISOString().split('T')[0]]
    );

    const result = {
      date: yesterday.toISOString().split('T')[0],
      metrics: metricsResult.rows,
    };

    logger.info('Daily AI metrics updated:', result);
    return result;
  } catch (error) {
    logger.error('Error updating daily AI metrics:', error);
    throw error;
  }
};

/**
 * Check if AI retraining is needed
 * WEEKLY: Monday at 06:00 Europe/Oslo
 */
const checkRetrainingNeeded = async () => {
  if (!aiLearningService || !aiRetrainingService) {
    logger.debug('AI services not available for retraining check');
    return { skipped: true, reason: 'service_not_available' };
  }

  try {
    logger.info('Checking if AI retraining is needed...');

    // Use the retraining service's check function
    const result = await aiRetrainingService.checkAndTriggerRetraining();

    if (result.triggered) {
      logger.info('Retraining triggered:', result);
    } else {
      logger.info('No retraining needed:', result.reason);
    }

    return result;
  } catch (error) {
    logger.error('Error checking retraining threshold:', error);
    throw error;
  }
};

/**
 * Process automation triggers
 * HOURLY: At minute 0 of every hour
 */
const processAutomations = async () => {
  if (!automationsService) {
    logger.debug('Automations service not available');
    return { skipped: true, reason: 'service_not_available' };
  }

  try {
    logger.info('Starting automation processing...');
    const result = await automationsService.processAutomations();
    logger.info('Automations processed', { result });
    return result;
  } catch (error) {
    logger.error('Error processing automations:', error);
    throw error;
  }
};

/**
 * Process condition-based recall schedules
 * DAILY: At 08:00 Europe/Oslo
 */
const processRecallSchedules = async () => {
  if (!recallEngine) {
    logger.debug('Recall Engine service not available');
    return { skipped: true, reason: 'service_not_available' };
  }

  try {
    logger.info('Processing recall schedules...');
    const result = await recallEngine.processRecalls();
    logger.info('Recall processing complete:', result);
    return result;
  } catch (error) {
    logger.error('Error processing recall schedules:', error);
    throw error;
  }
};

/**
 * Send weekly AI analytics digest report
 * WEEKLY: Monday at 07:00 Europe/Oslo
 */
const sendWeeklyAIDigest = async () => {
  if (!reportService) {
    logger.debug('Report service not available');
    return { skipped: true, reason: 'service_not_available' };
  }

  try {
    logger.info('Sending weekly AI analytics digest...');
    const result = await reportService.generateWeeklyAIDigest();
    logger.info('Weekly AI digest complete:', { totalSuggestions: result.stats.totalSuggestions });
    return result.stats;
  } catch (error) {
    logger.error('Error sending weekly AI digest:', error);
    throw error;
  }
};

/**
 * Generate daily patient follow-up reminders
 * DAILY: At 08:00 Europe/Oslo
 */
const generateFollowUpReminders = async () => {
  if (!automationsService) {
    logger.debug('Automations service not available');
    return { skipped: true, reason: 'service_not_available' };
  }

  try {
    logger.info('Generating daily follow-up reminders...');

    const result = { recalls: 0, birthdays: 0 };

    // Check for patients needing 3-month recall
    const recall3m = await automationsService.checkDaysSinceVisitTriggers(90, 'RECALL_3M');
    result.recalls += recall3m?.count || 0;

    // Check for patients needing 6-month recall
    const recall6m = await automationsService.checkDaysSinceVisitTriggers(180, 'RECALL_6M');
    result.recalls += recall6m?.count || 0;

    // Check for upcoming birthdays
    const birthdays = await automationsService.checkBirthdayTriggers();
    result.birthdays = birthdays?.count || 0;

    logger.info('Follow-up reminders generated:', result);
    return result;
  } catch (error) {
    logger.error('Error generating follow-up reminders:', error);
    throw error;
  }
};

/**
 * Send scheduled appointment reminders
 * HOURLY: At minute 0 of every hour
 */
const sendAppointmentReminders = async () => {
  if (!automationsService) {
    logger.debug('Automations service not available');
    return { skipped: true, reason: 'service_not_available' };
  }

  try {
    logger.info('Checking for appointment reminders...');
    const result = await automationsService.checkAppointmentReminders24h();
    logger.info('Appointment reminders processed:', result);
    return result;
  } catch (error) {
    logger.error('Error sending appointment reminders:', error);
    throw error;
  }
};

/**
 * Process smart scheduled communications
 * HOURLY: At minute 30 of every hour
 * Sends follow-up texts that are due, respects appointment conflicts
 */
const processSmartScheduledComms = async () => {
  if (!smartSchedulerService) {
    logger.debug('Smart Scheduler service not available');
    return { skipped: true, reason: 'service_not_available' };
  }

  try {
    logger.info('Processing smart scheduled communications...');
    const result = await smartSchedulerService.processDueCommunications();
    logger.info('Smart scheduled communications processed:', result);
    return result;
  } catch (error) {
    logger.error('Error processing smart scheduled communications:', error);
    throw error;
  }
};

/**
 * Clean up old audit logs
 * MONTHLY: On the 1st at 03:00 Europe/Oslo
 */
const cleanupOldLogs = async () => {
  try {
    logger.info('Starting monthly cleanup...');

    const result = {
      auditLogs: 0,
      jobLogs: 0,
      sessions: 0,
    };

    // Keep audit logs for 2 years (GDPR compliance)
    try {
      const auditResult = await query(`
        DELETE FROM audit_logs
        WHERE created_at < NOW() - INTERVAL '2 years'
      `);
      result.auditLogs = auditResult.rowCount;
    } catch (e) {
      logger.debug('audit_logs cleanup skipped (table may not exist)');
    }

    // Delete old job logs (keep 30 days)
    try {
      const jobLogsResult = await query(`
        DELETE FROM scheduled_job_logs
        WHERE executed_at < NOW() - INTERVAL '30 days'
      `);
      result.jobLogs = jobLogsResult.rowCount;
    } catch (e) {
      logger.debug('scheduled_job_logs cleanup skipped (table may not exist)');
    }

    // Delete expired sessions (keep 7 days after expiry)
    try {
      const sessionsResult = await query(`
        DELETE FROM user_sessions
        WHERE expires_at < NOW() - INTERVAL '7 days'
      `);
      result.sessions = sessionsResult.rowCount;
    } catch (e) {
      logger.debug('user_sessions cleanup skipped (table may not exist)');
    }

    logger.info('Monthly cleanup complete:', result);
    return result;
  } catch (error) {
    logger.error('Error in monthly cleanup:', error);
    throw error;
  }
};

/**
 * Backup AI training data
 * DAILY: At 01:00 Europe/Oslo
 */
const backupTrainingData = async () => {
  if (!aiLearningService) {
    logger.debug('AI Learning service not available for backup');
    return { skipped: true, reason: 'service_not_available' };
  }

  try {
    logger.info('Backing up training data...');

    const fs = await import('fs');
    const path = await import('path');

    const TRAINING_DIR = process.env.TRAINING_DATA_DIR || './training_data';
    const BACKUP_DIR = path.default.join(TRAINING_DIR, 'backup');

    // Ensure backup directory exists
    if (!fs.default.existsSync(BACKUP_DIR)) {
      fs.default.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Export current feedback data
    const feedbackData = await aiLearningService.exportFeedbackForTraining({
      days: 30,
      format: 'json',
    });

    // Write backup file
    const timestamp = new Date().toISOString().split('T')[0];
    const backupPath = path.default.join(BACKUP_DIR, `feedback_backup_${timestamp}.json`);

    fs.default.writeFileSync(backupPath, JSON.stringify(feedbackData, null, 2));

    // Clean up old backups (keep 7 days)
    const backupFiles = fs.default
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('feedback_backup_'))
      .sort()
      .reverse();

    let removed = 0;
    for (let i = 7; i < backupFiles.length; i++) {
      fs.default.unlinkSync(path.default.join(BACKUP_DIR, backupFiles[i]));
      removed++;
    }

    const result = {
      backupPath,
      recordsBackedUp: Array.isArray(feedbackData) ? feedbackData.length : 0,
      oldBackupsRemoved: removed,
    };

    logger.info('Training data backup complete:', result);
    return result;
  } catch (error) {
    logger.error('Error backing up training data:', error);
    throw error;
  }
};

/**
 * System health check
 * EVERY 15 MINUTES
 */
const healthCheck = async () => {
  const result = {
    database: false,
    communications: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Check database
    const dbResult = await query('SELECT 1 as check');
    result.database = dbResult.rows.length > 0;

    // Check communications connectivity
    if (communicationsService?.checkConnectivity) {
      const connResult = await communicationsService.checkConnectivity();
      result.communications = connResult.overall;
    }

    // Log any issues
    if (!result.database) {
      logger.error('Health check: Database connection failed');
    }
    if (!result.communications && communicationsService) {
      logger.warn('Health check: Communications connectivity issues');
    }

    return result;
  } catch (error) {
    logger.error('Health check failed:', error);
    return result;
  }
};

// ============================================================
// SCHEDULER INITIALIZATION
// ============================================================

/**
 * Initialize all scheduled jobs
 */
export const initializeScheduler = async () => {
  await loadServices();

  logger.info(`Initializing scheduled jobs with timezone: ${TIMEZONE}`);

  // =====================================================
  // HOURLY JOBS
  // =====================================================

  // Process communication queue - At minute 0 of every hour
  const commQueueJob = cron.schedule(
    '0 * * * *',
    () => {
      executeJob('processCommunicationQueue', processCommunicationQueue, 300000);
    },
    { timezone: TIMEZONE }
  );
  scheduledJobs.set('processCommunicationQueue', {
    job: commQueueJob,
    description: 'Process pending communication queue (SMS, Email)',
    schedule: '0 * * * *',
    lastRun: null,
    lastStatus: null,
  });

  // Process automations - At minute 0 of every hour
  const automationsJob = cron.schedule(
    '0 * * * *',
    () => {
      executeJob('processAutomations', processAutomations, 300000);
    },
    { timezone: TIMEZONE }
  );
  scheduledJobs.set('processAutomations', {
    job: automationsJob,
    description: 'Process automation triggers',
    schedule: '0 * * * *',
    lastRun: null,
    lastStatus: null,
  });

  // Send appointment reminders - At minute 0 of every hour
  const appointmentJob = cron.schedule(
    '0 * * * *',
    () => {
      executeJob('sendAppointmentReminders', sendAppointmentReminders, 300000);
    },
    { timezone: TIMEZONE }
  );
  scheduledJobs.set('sendAppointmentReminders', {
    job: appointmentJob,
    description: 'Send scheduled appointment reminders',
    schedule: '0 * * * *',
    lastRun: null,
    lastStatus: null,
  });

  // Process smart scheduled communications - At minute 30 of every hour
  const smartSchedulerJob = cron.schedule(
    '30 * * * *',
    () => {
      executeJob('processSmartScheduledComms', processSmartScheduledComms, 300000);
    },
    { timezone: TIMEZONE }
  );
  scheduledJobs.set('processSmartScheduledComms', {
    job: smartSchedulerJob,
    description:
      'Process appointment-aware scheduled communications (follow-ups with conflict detection)',
    schedule: '30 * * * *',
    lastRun: null,
    lastStatus: null,
  });

  // =====================================================
  // DAILY JOBS
  // =====================================================

  // Update daily AI metrics - Daily at midnight (00:00)
  const metricsJob = cron.schedule(
    '0 0 * * *',
    () => {
      executeJob('updateDailyAIMetrics', updateDailyAIMetrics, 600000);
    },
    { timezone: TIMEZONE }
  );
  scheduledJobs.set('updateDailyAIMetrics', {
    job: metricsJob,
    description: 'Update daily AI performance metrics',
    schedule: '0 0 * * *',
    lastRun: null,
    lastStatus: null,
  });

  // Backup training data - Daily at 01:00
  const backupJob = cron.schedule(
    '0 1 * * *',
    () => {
      executeJob('backupTrainingData', backupTrainingData, 900000);
    },
    { timezone: TIMEZONE }
  );
  scheduledJobs.set('backupTrainingData', {
    job: backupJob,
    description: 'Backup AI training data and model files',
    schedule: '0 1 * * *',
    lastRun: null,
    lastStatus: null,
  });

  // Generate follow-up reminders - Daily at 08:00
  const followUpJob = cron.schedule(
    '0 8 * * *',
    () => {
      executeJob('generateFollowUpReminders', generateFollowUpReminders, 600000);
    },
    { timezone: TIMEZONE }
  );
  scheduledJobs.set('generateFollowUpReminders', {
    job: followUpJob,
    description: 'Generate daily patient follow-up reminders',
    schedule: '0 8 * * *',
    lastRun: null,
    lastStatus: null,
  });

  // Process recall schedules - Daily at 08:00
  const recallJob = cron.schedule(
    '0 8 * * *',
    () => {
      executeJob('processRecallSchedules', processRecallSchedules, 600000);
    },
    { timezone: TIMEZONE }
  );
  scheduledJobs.set('processRecallSchedules', {
    job: recallJob,
    description: 'Process condition-based recall schedules and create follow-ups',
    schedule: '0 8 * * *',
    lastRun: null,
    lastStatus: null,
  });

  // =====================================================
  // WEEKLY JOBS
  // =====================================================

  // Check retraining threshold - Weekly Monday at 06:00
  const retrainingJob = cron.schedule(
    '0 6 * * 1',
    () => {
      executeJob('checkRetrainingNeeded', checkRetrainingNeeded, 1800000);
    },
    { timezone: TIMEZONE }
  );
  scheduledJobs.set('checkRetrainingNeeded', {
    job: retrainingJob,
    description: 'Check if AI retraining threshold is reached',
    schedule: '0 6 * * 1',
    lastRun: null,
    lastStatus: null,
  });

  // Weekly AI analytics digest - Monday at 07:00
  const digestJob = cron.schedule(
    '0 7 * * 1',
    () => {
      executeJob('sendWeeklyAIDigest', sendWeeklyAIDigest, 120000);
    },
    { timezone: TIMEZONE }
  );
  scheduledJobs.set('sendWeeklyAIDigest', {
    job: digestJob,
    description: 'Send weekly AI analytics digest email',
    schedule: '0 7 * * 1',
    lastRun: null,
    lastStatus: null,
  });

  // =====================================================
  // MONTHLY JOBS
  // =====================================================

  // Clean up old logs - Monthly on the 1st at 03:00
  const cleanupJob = cron.schedule(
    '0 3 1 * *',
    () => {
      executeJob('cleanupOldLogs', cleanupOldLogs, 1200000);
    },
    { timezone: TIMEZONE }
  );
  scheduledJobs.set('cleanupOldLogs', {
    job: cleanupJob,
    description: 'Clean up old audit logs and expired sessions',
    schedule: '0 3 1 * *',
    lastRun: null,
    lastStatus: null,
  });

  // =====================================================
  // FREQUENT JOBS
  // =====================================================

  // Health check - Every 15 minutes
  const healthJob = cron.schedule(
    '*/15 * * * *',
    () => {
      executeJob('healthCheck', healthCheck, 60000);
    },
    { timezone: TIMEZONE }
  );
  scheduledJobs.set('healthCheck', {
    job: healthJob,
    description: 'System health check and monitoring',
    schedule: '*/15 * * * *',
    lastRun: null,
    lastStatus: null,
  });

  logger.info(`Scheduled jobs initialized successfully (${scheduledJobs.size} jobs)`);

  return {
    jobCount: scheduledJobs.size,
    timezone: TIMEZONE,
    jobs: Array.from(scheduledJobs.keys()),
  };
};

// ============================================================
// SCHEDULER MANAGEMENT
// ============================================================

/**
 * Get status of all scheduled jobs
 */
export const getSchedulerStatus = () => {
  const status = [];

  for (const [jobName, jobInfo] of scheduledJobs) {
    status.push({
      name: jobName,
      description: jobInfo.description,
      schedule: jobInfo.schedule,
      lastRun: jobInfo.lastRun,
      lastStatus: jobInfo.lastStatus,
      lastDuration: jobInfo.lastDuration,
      lastError: jobInfo.lastError,
      isRunning: runningJobs.has(jobName),
    });
  }

  return {
    timezone: TIMEZONE,
    totalJobs: scheduledJobs.size,
    runningJobs: runningJobs.size,
    jobs: status,
  };
};

/**
 * Run a specific job manually (for testing/admin)
 */
export const runJob = async (jobName) => {
  const jobs = {
    processCommunicationQueue,
    processAutomations,
    updateDailyAIMetrics,
    checkRetrainingNeeded,
    generateFollowUpReminders,
    processRecallSchedules,
    sendAppointmentReminders,
    processSmartScheduledComms,
    sendWeeklyAIDigest,
    cleanupOldLogs,
    backupTrainingData,
    healthCheck,
  };

  if (!jobs[jobName]) {
    throw new Error(`Unknown job: ${jobName}. Available jobs: ${Object.keys(jobs).join(', ')}`);
  }

  logger.info(`Manually running job: ${jobName}`);
  return await executeJob(jobName, jobs[jobName]);
};

/**
 * Alias for runJob
 */
export const triggerJob = runJob;

/**
 * Stop a specific job
 */
export const stopJob = (jobName) => {
  const jobInfo = scheduledJobs.get(jobName);

  if (!jobInfo) {
    throw new Error(`Job not found: ${jobName}`);
  }

  jobInfo.job.stop();
  logger.info(`Stopped job: ${jobName}`);
  return { stopped: true, jobName };
};

/**
 * Start a specific job
 */
export const startJob = (jobName) => {
  const jobInfo = scheduledJobs.get(jobName);

  if (!jobInfo) {
    throw new Error(`Job not found: ${jobName}`);
  }

  jobInfo.job.start();
  logger.info(`Started job: ${jobName}`);
  return { started: true, jobName };
};

/**
 * Shutdown scheduler gracefully
 */
export const shutdownScheduler = () => {
  logger.info('Shutting down scheduler...');

  for (const [jobName, jobInfo] of scheduledJobs) {
    jobInfo.job.stop();
    logger.info(`Stopped job: ${jobName}`);
  }

  scheduledJobs.clear();
  runningJobs.clear();

  logger.info('Scheduler shutdown complete');
};

export default {
  initializeScheduler,
  getSchedulerStatus,
  runJob,
  triggerJob,
  stopJob,
  startJob,
  shutdownScheduler,
};
