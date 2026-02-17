/**
 * Email Service
 * Comprehensive email sending with Nodemailer
 * Supports SMTP, templating, and tracking
 *
 * @module services/emailService
 */

import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// CONFIGURATION
// =============================================================================

const config = {
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  },
  defaults: {
    fromName: process.env.SMTP_FROM_NAME || 'ChiroClickCRM',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@chiroclickcrm.no',
    replyTo: process.env.SMTP_REPLY_TO || null,
  },
  tracking: {
    enabled: process.env.EMAIL_TRACKING_ENABLED === 'true',
    baseUrl: process.env.FRONTEND_URL || 'https://app.chiroclick.no',
  },
};

// =============================================================================
// TRANSPORTER SETUP
// =============================================================================

let transporter = null;

/**
 * Initialize the email transporter
 */
const initializeTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (!config.smtp.host || !config.smtp.auth.user || !config.smtp.auth.pass) {
    logger.warn('Email service: SMTP not configured, emails will be logged only');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.auth,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
  });

  // Verify connection
  transporter.verify((error) => {
    if (error) {
      logger.error('Email transporter verification failed:', error);
    } else {
      logger.info('Email transporter ready');
    }
  });

  return transporter;
};

// Initialize on module load
initializeTransporter();

// =============================================================================
// TEMPLATE ENGINE
// =============================================================================

/**
 * Load and compile an HTML email template
 *
 * @param {string} templateName - Template file name (without .html)
 * @param {Object} variables - Variables to replace in template
 * @returns {Promise<string>} Compiled HTML
 */
export const compileTemplate = async (templateName, variables = {}) => {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.html`);
    let html = await fs.readFile(templatePath, 'utf8');

    // Replace all {{variable}} placeholders
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value || '');
    }

    // Handle conditional blocks {{#if variable}}content{{/if}}
    html = html.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) =>
      variables[varName] ? content : ''
    );

    // Handle loops {{#each items}}content{{/each}}
    html = html.replace(
      /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g,
      (match, arrayName, itemTemplate) => {
        const items = variables[arrayName];
        if (!Array.isArray(items)) {
          return '';
        }

        return items
          .map((item, index) => {
            let itemHtml = itemTemplate;
            for (const [key, value] of Object.entries(item)) {
              itemHtml = itemHtml.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
            }
            itemHtml = itemHtml.replace(/{{@index}}/g, index);
            itemHtml = itemHtml.replace(/{{@number}}/g, index + 1);
            return itemHtml;
          })
          .join('');
      }
    );

    return html;
  } catch (error) {
    logger.error(`Error compiling email template ${templateName}:`, error);
    throw new Error(`Failed to compile email template: ${templateName}`);
  }
};

// =============================================================================
// EMAIL SENDING
// =============================================================================

/**
 * Send an email
 *
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.text] - Plain text content (auto-generated if not provided)
 * @param {string} [options.from] - Sender email
 * @param {string} [options.replyTo] - Reply-to email
 * @param {Array} [options.attachments] - Array of attachment objects
 * @param {Object} [options.tracking] - Tracking options
 * @returns {Promise<Object>} Send result
 */
export const sendEmail = async (options) => {
  const { to, subject, html, text, from, replyTo, attachments = [], tracking = {} } = options;

  if (!to || !subject || !html) {
    throw new Error('Missing required email fields: to, subject, html');
  }

  // Prepare mail options
  const mailOptions = {
    from: from || `${config.defaults.fromName} <${config.defaults.fromEmail}>`,
    to,
    subject,
    html,
    text: text || stripHtml(html),
    replyTo: replyTo || config.defaults.replyTo,
    attachments: attachments.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType || 'application/octet-stream',
      cid: att.cid || undefined,
    })),
  };

  // Add tracking pixel if enabled
  if (config.tracking.enabled && tracking.emailId) {
    const trackingPixel = `<img src="${config.tracking.baseUrl}/api/emails/track/${tracking.emailId}/open" width="1" height="1" style="display:none;" />`;
    mailOptions.html = mailOptions.html.replace('</body>', `${trackingPixel}</body>`);
  }

  // Send email
  if (transporter) {
    try {
      const result = await transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to}`, { messageId: result.messageId, subject });

      return {
        success: true,
        provider: 'smtp',
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
      };
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  } else {
    // Development mode - log email
    logger.info('Email (not sent - no SMTP configured):', {
      to,
      subject,
      htmlPreview: html.substring(0, 200),
    });

    return {
      success: false,
      provider: 'none',
      message: 'SMTP not configured. Email logged for development.',
      email: { to, subject },
    };
  }
};

/**
 * Send email using a template
 *
 * @param {string} templateName - Template name
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {Object} options.variables - Template variables
 * @param {Array} [options.attachments] - Attachments
 * @returns {Promise<Object>} Send result
 */
export const sendTemplatedEmail = async (templateName, options) => {
  const { to, subject, variables = {}, attachments = [] } = options;

  const html = await compileTemplate(templateName, variables);

  return sendEmail({
    to,
    subject,
    html,
    attachments,
  });
};

/**
 * Send bulk emails (with rate limiting)
 *
 * @param {Array<Object>} emails - Array of email objects
 * @param {number} [delayMs=1000] - Delay between emails in ms
 * @returns {Promise<Object>} Bulk send results
 */
export const sendBulkEmails = async (emails, delayMs = 1000) => {
  const results = {
    total: emails.length,
    sent: 0,
    failed: 0,
    details: [],
  };

  for (const email of emails) {
    try {
      const result = await sendEmail(email);
      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
      }
      results.details.push({ to: email.to, ...result });

      // Rate limiting delay
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      results.failed++;
      results.details.push({
        to: email.to,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
};

// =============================================================================
// SPECIALIZED EMAIL FUNCTIONS
// =============================================================================

/**
 * Send exercise program email to patient
 *
 * @param {Object} params - Parameters
 * @param {Object} params.patient - Patient object
 * @param {Object} params.prescription - Prescription object with exercises
 * @param {Object} params.organization - Organization object
 * @param {string} params.portalLink - Magic link to patient portal
 * @param {Buffer} [params.pdfAttachment] - PDF attachment buffer
 * @returns {Promise<Object>} Send result
 */
export const sendExerciseProgramEmail = async (params) => {
  const { patient, prescription, organization, portalLink, pdfAttachment } = params;

  // Format exercises for template
  const exercises =
    prescription.exercises?.map((ex, index) => ({
      number: index + 1,
      name: ex.exercise?.nameNorwegian || ex.exercise?.name || 'Ovelse',
      thumbnailUrl:
        ex.exercise?.thumbnailUrl || `${config.tracking.baseUrl}/images/exercise-placeholder.png`,
      sets: ex.sets || '-',
      reps: ex.reps || '-',
      holdSeconds: ex.holdSeconds || '-',
      frequency: ex.frequencyPerDay ? `${ex.frequencyPerDay}x daglig` : '-',
      instructions: ex.exercise?.instructionsNorwegian || ex.exercise?.instructions || '',
      customInstructions: ex.customInstructions || '',
    })) || [];

  const variables = {
    patientFirstName: patient.firstName || patient.first_name || 'Pasient',
    patientFullName:
      `${patient.firstName || patient.first_name || ''} ${patient.lastName || patient.last_name || ''}`.trim(),
    clinicName: organization.name || 'Klinikken',
    clinicLogo:
      organization.logoUrl || organization.logo_url || `${config.tracking.baseUrl}/images/logo.png`,
    clinicPhone: organization.phone || '',
    clinicEmail: organization.email || '',
    clinicAddress: organization.address || '',
    prescribedBy: prescription.prescribed_by_name || 'Behandler',
    prescriptionDate: new Date(prescription.prescribed_at || Date.now()).toLocaleDateString(
      'nb-NO'
    ),
    patientInstructions: prescription.patient_instructions || '',
    exerciseCount: exercises.length,
    exercises: exercises,
    portalLink: portalLink,
    validDays: '90',
    currentYear: new Date().getFullYear(),
  };

  const attachments = [];

  if (pdfAttachment) {
    attachments.push({
      filename: `Ovelsesprogram_${patient.lastName || patient.last_name || 'Pasient'}_${new Date().toISOString().split('T')[0]}.pdf`,
      content: pdfAttachment,
      contentType: 'application/pdf',
    });
  }

  return sendTemplatedEmail('exerciseProgram', {
    to: patient.email,
    subject: `Ditt ovelsesprogram fra ${organization.name}`,
    variables,
    attachments,
  });
};

/**
 * Send appointment reminder email
 *
 * @param {Object} params - Parameters
 * @param {Object} params.patient - Patient object
 * @param {Object} params.appointment - Appointment object
 * @param {Object} params.organization - Organization object
 * @param {Object} params.provider - Provider/clinician object
 * @returns {Promise<Object>} Send result
 */
export const sendAppointmentReminderEmail = async (params) => {
  const { patient, appointment, organization, provider } = params;

  const appointmentDate = new Date(appointment.start_time || appointment.startTime);

  const variables = {
    patientFirstName: patient.firstName || patient.first_name || 'Pasient',
    clinicName: organization.name || 'Klinikken',
    clinicLogo:
      organization.logoUrl || organization.logo_url || `${config.tracking.baseUrl}/images/logo.png`,
    clinicPhone: organization.phone || '',
    clinicEmail: organization.email || '',
    clinicAddress: organization.address || '',
    appointmentDate: appointmentDate.toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    appointmentTime: appointmentDate.toLocaleTimeString('nb-NO', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    appointmentType: appointment.type || appointment.service_type || 'Time',
    providerName: provider
      ? `${provider.firstName || provider.first_name || ''} ${provider.lastName || provider.last_name || ''}`.trim()
      : '',
    duration: appointment.duration || 30,
    notes: appointment.notes || '',
    cancelLink: `${config.tracking.baseUrl}/appointments/cancel/${appointment.id}`,
    rescheduleLink: `${config.tracking.baseUrl}/appointments/reschedule/${appointment.id}`,
    currentYear: new Date().getFullYear(),
  };

  return sendTemplatedEmail('appointmentReminder', {
    to: patient.email,
    subject: `Paminnelse om time hos ${organization.name}`,
    variables,
  });
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Strip HTML tags to create plain text version
 *
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
const stripHtml = (html) =>
  html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Verify SMTP configuration
 *
 * @returns {Promise<Object>} Verification result
 */
export const verifyConfiguration = async () => {
  const status = {
    configured: !!(config.smtp.host && config.smtp.auth.user && config.smtp.auth.pass),
    verified: false,
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
  };

  if (status.configured && transporter) {
    try {
      await transporter.verify();
      status.verified = true;
    } catch (error) {
      status.error = error.message;
    }
  }

  return status;
};

/**
 * Track email open
 *
 * @param {string} emailId - Email ID
 * @returns {Promise<void>}
 */
export const trackOpen = async (emailId) => {
  try {
    await query(`UPDATE communications SET opened_at = NOW() WHERE id = $1 AND opened_at IS NULL`, [
      emailId,
    ]);
  } catch (error) {
    logger.error('Error tracking email open:', error);
  }
};

/**
 * Track email link click
 *
 * @param {string} emailId - Email ID
 * @param {string} linkUrl - Clicked link URL
 * @returns {Promise<void>}
 */
export const trackClick = async (emailId, linkUrl) => {
  try {
    await query(`UPDATE communications SET clicked_at = NOW() WHERE id = $1`, [emailId]);
    logger.info(`Email click tracked: ${emailId}`, { linkUrl });
  } catch (error) {
    logger.error('Error tracking email click:', error);
  }
};

// =============================================================================
// EXPORT
// =============================================================================

export default {
  sendEmail,
  sendTemplatedEmail,
  sendBulkEmails,
  sendExerciseProgramEmail,
  sendAppointmentReminderEmail,
  compileTemplate,
  verifyConfiguration,
  trackOpen,
  trackClick,
};
