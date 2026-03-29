/**
 * Maintenance Jobs
 * Scheduled handlers for cleanup, health checks, follow-up reminders,
 * automations processing, and recall schedules.
 *
 * @module jobs/maintenanceJobs
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Clean up old audit logs.
 * MONTHLY: On the 1st at 03:00 Europe/Oslo.
 *
 * @returns {Promise<Object>}
 */
export const cleanupOldLogs = async () => {
  try {
    logger.info('Starting monthly cleanup...');

    const result = { auditLogs: 0, jobLogs: 0, sessions: 0 };

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
 * System health check.
 * EVERY 15 MINUTES.
 *
 * @param {Object} services - Loaded service references
 * @returns {Promise<Object>}
 */
export const healthCheck = async (services) => {
  const { communicationsService } = services;

  const result = {
    database: false,
    communications: false,
    timestamp: new Date().toISOString(),
  };

  try {
    const dbResult = await query('SELECT 1 as check');
    result.database = dbResult.rows.length > 0;

    if (communicationsService?.checkConnectivity) {
      const connResult = await communicationsService.checkConnectivity();
      result.communications = connResult.overall;
    }

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

/**
 * Generate daily patient follow-up reminders.
 * DAILY: At 08:00 Europe/Oslo.
 *
 * @param {Object} services
 * @returns {Promise<Object>}
 */
export const generateFollowUpReminders = async (services) => {
  const { automationsService } = services;

  if (!automationsService) {
    logger.debug('Automations service not available');
    return { skipped: true, reason: 'service_not_available' };
  }

  try {
    logger.info('Generating daily follow-up reminders...');

    const result = { recalls: 0, birthdays: 0 };

    const recalls = await automationsService.checkDaysSinceVisitTriggers();
    result.recalls = recalls?.processed || 0;

    const birthdays = await automationsService.checkBirthdayTriggers();
    result.birthdays = birthdays?.processed || 0;

    logger.info('Follow-up reminders generated:', result);
    return result;
  } catch (error) {
    logger.error('Error generating follow-up reminders:', error);
    throw error;
  }
};

/**
 * Process automation triggers.
 * HOURLY: At minute 0 of every hour.
 *
 * @param {Object} services
 * @returns {Promise<Object>}
 */
export const processAutomations = async (services) => {
  const { automationsService } = services;

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
 * Process condition-based recall schedules.
 * DAILY: At 08:00 Europe/Oslo.
 *
 * @param {Object} services
 * @returns {Promise<Object>}
 */
export const processRecallSchedules = async (services) => {
  const { recallEngine } = services;

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
