/**
 * Alert Service
 * Dispatches operational alerts via email, GitHub Issues, or console
 * Includes debounce to prevent alert storms
 */

import logger from '../utils/logger.js';
import nodemailer from 'nodemailer';

// Severity levels
export const SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
};

// Debounce state: Map<string, number> (key -> last alert timestamp)
const alertHistory = new Map();
const DEBOUNCE_MS = 3600000; // 1 hour per service per severity

/**
 * Send an operational alert via the best available channel.
 * Debounces duplicate alerts (same service + severity) within DEBOUNCE_MS.
 *
 * @param {Object} params
 * @param {string} params.service - Originating service name
 * @param {string} params.severity - SEVERITY.INFO | WARNING | CRITICAL
 * @param {string} params.title - Short alert title
 * @param {string} params.message - Detailed alert message
 * @param {Object} [params.details] - Optional structured details
 * @returns {Promise<{dispatched: boolean, channel: string, debounced: boolean}>}
 */
export async function sendAlert({ service, severity, title, message, details }) {
  const debounceKey = `${service}:${severity}`;
  const now = Date.now();
  const lastSent = alertHistory.get(debounceKey);

  // Check debounce
  if (lastSent && now - lastSent < DEBOUNCE_MS) {
    logger.debug(
      `Alert debounced: ${debounceKey} (sent ${Math.round((now - lastSent) / 1000)}s ago)`
    );
    return { dispatched: false, channel: 'none', debounced: true };
  }

  // Record this alert timestamp
  alertHistory.set(debounceKey, now);

  // Always log via Winston regardless of dispatch method
  logAlert(title, message, severity, details);

  // Try email first
  if (process.env.SMTP_HOST && process.env.ADMIN_EMAIL) {
    try {
      await sendEmail(title, message, severity, details);
      return { dispatched: true, channel: 'email', debounced: false };
    } catch (err) {
      logger.warn(`Email alert failed, trying next channel: ${err.message}`);
    }
  }

  // Try GitHub issue
  if (process.env.GITHUB_TOKEN) {
    try {
      await createGitHubIssue(title, message, severity, details);
      return { dispatched: true, channel: 'github', debounced: false };
    } catch (err) {
      logger.warn(`GitHub issue alert failed, falling back to console: ${err.message}`);
    }
  }

  // Console fallback (already logged above via logAlert)
  return { dispatched: true, channel: 'console', debounced: false };
}

/**
 * Send alert via email using nodemailer.
 * Gracefully fails if SMTP is not configured.
 *
 * @param {string} title
 * @param {string} message
 * @param {string} severity
 * @param {Object} [details]
 */
async function sendEmail(title, message, severity, details) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const timestamp = new Date().toISOString();
  const detailsBlock = details ? `\n\nDetails:\n${JSON.stringify(details, null, 2)}` : '';

  await transporter.sendMail({
    from: process.env.SMTP_USER || 'alerts@chiroclickehr.no',
    to: process.env.ADMIN_EMAIL,
    subject: `[ChiroClickEHR ${severity}] ${title}`,
    text: `${message}\n\nTimestamp: ${timestamp}${detailsBlock}`,
  });

  logger.info(`Alert email sent to ${process.env.ADMIN_EMAIL}: ${title}`);
}

/**
 * Create a GitHub issue for the alert.
 * Gracefully fails if GITHUB_TOKEN is not set or @octokit/rest is unavailable.
 *
 * @param {string} title
 * @param {string} message
 * @param {string} severity
 * @param {Object} [details]
 */
async function createGitHubIssue(title, message, severity, details) {
  let Octokit;
  try {
    const mod = await import('@octokit/rest');
    Octokit = mod.Octokit;
  } catch {
    throw new Error('@octokit/rest is not installed');
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const repo = process.env.GITHUB_REPO || 'Usefullatwork/ChiroClickEHR';
  const [owner, repoName] = repo.split('/');
  const timestamp = new Date().toISOString();
  const detailsBlock = details
    ? `\n\n### Details\n\`\`\`json\n${JSON.stringify(details, null, 2)}\n\`\`\``
    : '';

  await octokit.issues.create({
    owner,
    repo: repoName,
    title: `[${severity}] ${title}`,
    body: `${message}\n\n**Timestamp:** ${timestamp}${detailsBlock}`,
    labels: ['alert', severity.toLowerCase()],
  });

  logger.info(`GitHub issue created: [${severity}] ${title}`);
}

/**
 * Log alert via Winston logger (console/file fallback).
 *
 * @param {string} title
 * @param {string} message
 * @param {string} severity
 * @param {Object} [details]
 */
function logAlert(title, message, severity, details) {
  const payload = { service: 'alert', title, message, ...(details && { details }) };

  switch (severity) {
    case SEVERITY.CRITICAL:
      logger.error(payload);
      break;
    case SEVERITY.WARNING:
      logger.warn(payload);
      break;
    case SEVERITY.INFO:
    default:
      logger.info(payload);
      break;
  }
}

/**
 * Clear the debounce history. Useful for testing.
 */
export function clearAlertHistory() {
  alertHistory.clear();
}
