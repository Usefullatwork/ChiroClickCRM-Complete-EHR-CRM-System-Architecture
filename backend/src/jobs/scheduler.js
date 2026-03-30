/**
 * Scheduled Jobs — Barrel
 *
 * Cron-based task scheduler for automated workflows.
 * Delegates to domain-specific job modules:
 *   - jobRunner.js          (execution infrastructure)
 *   - communicationJobs.js  (SMS/email queues, reminders)
 *   - aiJobs.js             (metrics, retraining, digest, backup)
 *   - maintenanceJobs.js    (cleanup, health, follow-ups, automations, recalls)
 *
 * Timezone: Europe/Oslo
 *
 * @module jobs/scheduler
 */

import cron from 'node-cron';
import logger from '../utils/logger.js';

import { executeJob, loadServices, scheduledJobs, runningJobs } from './jobRunner.js';
import {
  processCommunicationQueue,
  sendAppointmentReminders,
  processSmartScheduledComms,
  processAppointmentRemindersQueue,
} from './communicationJobs.js';
import {
  updateDailyAIMetrics,
  checkRetrainingNeeded,
  sendWeeklyAIDigest,
  backupTrainingData,
} from './aiJobs.js';
import {
  cleanupOldLogs,
  healthCheck,
  generateFollowUpReminders,
  processAutomations,
  processRecallSchedules,
} from './maintenanceJobs.js';

const TIMEZONE = process.env.SCHEDULER_TIMEZONE || 'Europe/Oslo';

/** Services loaded at init time, passed into each job handler */
let services = {};

/**
 * Initialize all scheduled jobs
 */
export const initializeScheduler = async () => {
  services = await loadServices();

  logger.info(`Initializing scheduled jobs with timezone: ${TIMEZONE}`);

  // =====================================================
  // HOURLY JOBS
  // =====================================================

  const commQueueJob = cron.schedule(
    '0 * * * *',
    () => {
      executeJob('processCommunicationQueue', () => processCommunicationQueue(services), 300000);
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

  const automationsJob = cron.schedule(
    '0 * * * *',
    () => {
      executeJob('processAutomations', () => processAutomations(services), 300000);
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

  const appointmentJob = cron.schedule(
    '0 * * * *',
    () => {
      executeJob('sendAppointmentReminders', () => sendAppointmentReminders(services), 300000);
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

  const smartSchedulerJob = cron.schedule(
    '30 * * * *',
    () => {
      executeJob('processSmartScheduledComms', () => processSmartScheduledComms(services), 300000);
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

  const metricsJob = cron.schedule(
    '0 0 * * *',
    () => {
      executeJob('updateDailyAIMetrics', () => updateDailyAIMetrics(services), 600000);
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

  const backupJob = cron.schedule(
    '0 1 * * *',
    () => {
      executeJob('backupTrainingData', () => backupTrainingData(services), 900000);
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

  const followUpJob = cron.schedule(
    '0 8 * * *',
    () => {
      executeJob('generateFollowUpReminders', () => generateFollowUpReminders(services), 600000);
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

  const recallJob = cron.schedule(
    '0 8 * * *',
    () => {
      executeJob('processRecallSchedules', () => processRecallSchedules(services), 600000);
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

  const retrainingJob = cron.schedule(
    '0 6 * * 1',
    () => {
      executeJob('checkRetrainingNeeded', () => checkRetrainingNeeded(services), 1800000);
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

  const digestJob = cron.schedule(
    '0 7 * * 1',
    () => {
      executeJob('sendWeeklyAIDigest', () => sendWeeklyAIDigest(services), 120000);
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

  const healthJob = cron.schedule(
    '*/15 * * * *',
    () => {
      executeJob('healthCheck', () => healthCheck(services), 60000);
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

  const reminderQueueJob = cron.schedule(
    '*/15 * * * *',
    () => {
      executeJob(
        'processAppointmentRemindersQueue',
        () => processAppointmentRemindersQueue(services),
        120000
      );
    },
    { timezone: TIMEZONE }
  );
  scheduledJobs.set('processAppointmentRemindersQueue', {
    job: reminderQueueJob,
    description: 'Process due appointment reminders (SMS/Email)',
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
    processCommunicationQueue: () => processCommunicationQueue(services),
    processAutomations: () => processAutomations(services),
    updateDailyAIMetrics: () => updateDailyAIMetrics(services),
    checkRetrainingNeeded: () => checkRetrainingNeeded(services),
    generateFollowUpReminders: () => generateFollowUpReminders(services),
    processRecallSchedules: () => processRecallSchedules(services),
    sendAppointmentReminders: () => sendAppointmentReminders(services),
    processSmartScheduledComms: () => processSmartScheduledComms(services),
    sendWeeklyAIDigest: () => sendWeeklyAIDigest(services),
    cleanupOldLogs,
    backupTrainingData: () => backupTrainingData(services),
    healthCheck: () => healthCheck(services),
    processAppointmentRemindersQueue: () => processAppointmentRemindersQueue(services),
  };

  if (!jobs[jobName]) {
    throw new Error(`Unknown job: ${jobName}. Available jobs: ${Object.keys(jobs).join(', ')}`);
  }

  logger.info(`Manually running job: ${jobName}`);
  return await executeJob(jobName, jobs[jobName]);
};

/** Alias for runJob */
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
