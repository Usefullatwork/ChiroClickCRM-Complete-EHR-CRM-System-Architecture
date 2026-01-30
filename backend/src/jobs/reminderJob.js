/**
 * Reminder Job
 *
 * Cron job for scheduled automated reminders.
 * Processes appointment reminders, exercise reminders, follow-ups, and birthday greetings.
 *
 * Schedule:
 * - Appointment 24h reminders: Every hour (checks for appointments 24h ahead)
 * - Appointment 1h reminders: Every 15 minutes (checks for appointments 1h ahead)
 * - Exercise inactivity: Daily at 10:00 Europe/Oslo
 * - Follow-up reminders: Daily at 09:00 Europe/Oslo
 * - Birthday greetings: Daily at 08:00 Europe/Oslo
 * - Days since visit: Weekly on Monday at 10:00 Europe/Oslo
 *
 * Timezone: Europe/Oslo
 */

import cron from 'node-cron';
import logger from '../utils/logger.js';
import { query } from '../config/database.js';
import automatedCommsService from '../services/automatedComms.js';

// Timezone for Norway
const TIMEZONE = process.env.SCHEDULER_TIMEZONE || 'Europe/Oslo';

// Track running jobs to prevent overlap
const runningJobs = new Map();

// Store scheduled job references
const reminderJobs = new Map();

/**
 * Execute a job with error handling and overlap prevention
 */
const executeJob = async (jobName, handler, timeout = 300000) => {
  if (runningJobs.has(jobName)) {
    logger.warn(`Reminder job ${jobName} is already running, skipping`);
    return null;
  }

  const startTime = Date.now();
  const jobId = `${jobName}_${startTime}`;

  logger.info(`Starting reminder job: ${jobName} (${jobId})`);
  runningJobs.set(jobName, jobId);

  try {
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Job timeout exceeded')), timeout);
    });

    // Execute job with timeout
    const result = await Promise.race([handler(), timeoutPromise]);

    const duration = Date.now() - startTime;
    logger.info(`Reminder job completed: ${jobName} (${duration}ms)`, { result });

    // Log job execution
    await logJobExecution(jobName, jobId, 'success', duration, result);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Reminder job failed: ${jobName}`, error);

    await logJobExecution(jobName, jobId, 'failed', duration, null, error.message);

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
    logger.debug('Could not log job execution:', dbError.message);
  }
};

// ============================================================
// JOB HANDLERS
// ============================================================

/**
 * Process 24-hour appointment reminders
 */
const processAppointment24hReminders = async () => {
  logger.info('Processing 24-hour appointment reminders...');
  return await automatedCommsService.checkAppointmentReminders24h();
};

/**
 * Process 1-hour appointment reminders
 */
const processAppointment1hReminders = async () => {
  logger.info('Processing 1-hour appointment reminders...');
  return await automatedCommsService.checkAppointmentReminders1h();
};

/**
 * Process exercise inactivity reminders
 */
const processExerciseReminders = async () => {
  logger.info('Processing exercise inactivity reminders...');
  return await automatedCommsService.checkExerciseInactivity(7);
};

/**
 * Process follow-up reminders
 */
const processFollowUpReminders = async () => {
  logger.info('Processing follow-up reminders...');
  return await automatedCommsService.checkFollowUpReminders();
};

/**
 * Process birthday greetings
 */
const processBirthdayGreetings = async () => {
  logger.info('Processing birthday greetings...');
  return await automatedCommsService.checkBirthdayGreetings();
};

/**
 * Process days-since-visit recalls
 * Checks for 90-day and 180-day recalls
 */
const processDaysSinceVisitRecalls = async () => {
  logger.info('Processing days-since-visit recalls...');

  const results = {
    '90_days': { count: 0, error: null },
    '180_days': { count: 0, error: null }
  };

  try {
    const result90 = await automatedCommsService.checkDaysSinceVisit(90);
    results['90_days'].count = result90.count;
  } catch (error) {
    results['90_days'].error = error.message;
  }

  try {
    const result180 = await automatedCommsService.checkDaysSinceVisit(180);
    results['180_days'].count = result180.count;
  } catch (error) {
    results['180_days'].error = error.message;
  }

  return results;
};

/**
 * Run all automated reminder checks
 */
const processAllReminders = async () => {
  logger.info('Running all reminder checks...');
  return await automatedCommsService.runAutomatedChecks();
};

// ============================================================
// SCHEDULER INITIALIZATION
// ============================================================

/**
 * Initialize all reminder jobs
 */
export const initializeReminderJobs = () => {
  logger.info(`Initializing reminder jobs with timezone: ${TIMEZONE}`);

  // =====================================================
  // FREQUENT JOBS (Appointment Reminders)
  // =====================================================

  // 24-hour appointment reminders - Every hour at minute 0
  const apt24hJob = cron.schedule('0 * * * *', () => {
    executeJob('appointment_reminder_24h', processAppointment24hReminders, 300000);
  }, { timezone: TIMEZONE });
  reminderJobs.set('appointment_reminder_24h', {
    job: apt24hJob,
    description: 'Send 24-hour appointment reminders',
    schedule: '0 * * * *'
  });

  // 1-hour appointment reminders - Every 15 minutes
  const apt1hJob = cron.schedule('*/15 * * * *', () => {
    executeJob('appointment_reminder_1h', processAppointment1hReminders, 300000);
  }, { timezone: TIMEZONE });
  reminderJobs.set('appointment_reminder_1h', {
    job: apt1hJob,
    description: 'Send 1-hour appointment reminders',
    schedule: '*/15 * * * *'
  });

  // =====================================================
  // DAILY JOBS
  // =====================================================

  // Birthday greetings - Daily at 08:00
  const birthdayJob = cron.schedule('0 8 * * *', () => {
    executeJob('birthday_greetings', processBirthdayGreetings, 600000);
  }, { timezone: TIMEZONE });
  reminderJobs.set('birthday_greetings', {
    job: birthdayJob,
    description: 'Send birthday greetings',
    schedule: '0 8 * * *'
  });

  // Follow-up reminders - Daily at 09:00
  const followUpJob = cron.schedule('0 9 * * *', () => {
    executeJob('followup_reminders', processFollowUpReminders, 600000);
  }, { timezone: TIMEZONE });
  reminderJobs.set('followup_reminders', {
    job: followUpJob,
    description: 'Send follow-up scheduling reminders',
    schedule: '0 9 * * *'
  });

  // Exercise inactivity reminders - Daily at 10:00
  const exerciseJob = cron.schedule('0 10 * * *', () => {
    executeJob('exercise_inactivity', processExerciseReminders, 600000);
  }, { timezone: TIMEZONE });
  reminderJobs.set('exercise_inactivity', {
    job: exerciseJob,
    description: 'Send exercise program inactivity reminders',
    schedule: '0 10 * * *'
  });

  // =====================================================
  // WEEKLY JOBS
  // =====================================================

  // Days-since-visit recalls - Weekly Monday at 10:00
  const daysSinceJob = cron.schedule('0 10 * * 1', () => {
    executeJob('days_since_visit_recall', processDaysSinceVisitRecalls, 900000);
  }, { timezone: TIMEZONE });
  reminderJobs.set('days_since_visit_recall', {
    job: daysSinceJob,
    description: 'Send visit recall reminders (90/180 days)',
    schedule: '0 10 * * 1'
  });

  logger.info(`Reminder jobs initialized successfully (${reminderJobs.size} jobs)`);

  return {
    jobCount: reminderJobs.size,
    timezone: TIMEZONE,
    jobs: Array.from(reminderJobs.keys())
  };
};

/**
 * Get status of all reminder jobs
 */
export const getReminderJobStatus = () => {
  const status = [];

  for (const [jobName, jobInfo] of reminderJobs) {
    status.push({
      name: jobName,
      description: jobInfo.description,
      schedule: jobInfo.schedule,
      isRunning: runningJobs.has(jobName)
    });
  }

  return {
    timezone: TIMEZONE,
    totalJobs: reminderJobs.size,
    runningJobs: runningJobs.size,
    jobs: status
  };
};

/**
 * Manually trigger a specific reminder job
 */
export const triggerReminderJob = async (jobName) => {
  const jobs = {
    appointment_reminder_24h: processAppointment24hReminders,
    appointment_reminder_1h: processAppointment1hReminders,
    birthday_greetings: processBirthdayGreetings,
    followup_reminders: processFollowUpReminders,
    exercise_inactivity: processExerciseReminders,
    days_since_visit_recall: processDaysSinceVisitRecalls,
    all_reminders: processAllReminders
  };

  if (!jobs[jobName]) {
    throw new Error(`Unknown reminder job: ${jobName}. Available: ${Object.keys(jobs).join(', ')}`);
  }

  logger.info(`Manually triggering reminder job: ${jobName}`);
  return await executeJob(jobName, jobs[jobName]);
};

/**
 * Stop a specific reminder job
 */
export const stopReminderJob = (jobName) => {
  const jobInfo = reminderJobs.get(jobName);

  if (!jobInfo) {
    throw new Error(`Reminder job not found: ${jobName}`);
  }

  jobInfo.job.stop();
  logger.info(`Stopped reminder job: ${jobName}`);
  return { stopped: true, jobName };
};

/**
 * Start a specific reminder job
 */
export const startReminderJob = (jobName) => {
  const jobInfo = reminderJobs.get(jobName);

  if (!jobInfo) {
    throw new Error(`Reminder job not found: ${jobName}`);
  }

  jobInfo.job.start();
  logger.info(`Started reminder job: ${jobName}`);
  return { started: true, jobName };
};

/**
 * Shutdown all reminder jobs
 */
export const shutdownReminderJobs = () => {
  logger.info('Shutting down reminder jobs...');

  for (const [jobName, jobInfo] of reminderJobs) {
    jobInfo.job.stop();
    logger.info(`Stopped reminder job: ${jobName}`);
  }

  reminderJobs.clear();
  runningJobs.clear();

  logger.info('Reminder jobs shutdown complete');
};

export default {
  initializeReminderJobs,
  getReminderJobStatus,
  triggerReminderJob,
  stopReminderJob,
  startReminderJob,
  shutdownReminderJobs
};
