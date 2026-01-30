/**
 * Email Service
 * Unified email sending interface
 * Supports Outlook (Graph API) and SMTP fallback
 */

import nodemailer from 'nodemailer'
import logger from '../utils/logger.js'
import * as outlookBridge from './outlookBridge.js'

// SMTP Configuration (fallback)
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASSWORD = process.env.SMTP_PASSWORD
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'ChiroClickCRM'
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'noreply@chiroclickcrm.no'

// Create SMTP transporter if configured
let smtpTransporter = null
if (SMTP_HOST && SMTP_USER && SMTP_PASSWORD) {
  smtpTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD
    }
  })
}

/**
 * Send email using available provider
 * Tries Outlook first, then falls back to SMTP
 *
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.body - Email body (HTML supported)
 * @param {string} [options.from] - Sender email (optional)
 * @param {Array} [options.attachments] - Array of attachments
 * @returns {Promise<Object>} Send result
 */
export const sendEmail = async (options) => {
  const { to, subject, body, from, attachments = [] } = options

  if (!to || !subject || !body) {
    throw new Error('Missing required email fields: to, subject, body')
  }

  // Try Outlook first if configured
  const outlookConfigured = process.env.OUTLOOK_CLIENT_ID && process.env.OUTLOOK_CLIENT_SECRET

  if (outlookConfigured) {
    try {
      const result = await outlookBridge.sendEmail({
        toRecipients: [{ emailAddress: { address: to } }],
        subject: subject,
        body: {
          contentType: 'HTML',
          content: body
        },
        attachments: attachments.map(att => ({
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: att.filename,
          contentBytes: att.content.toString('base64')
        }))
      })

      logger.info(`Email sent via Outlook to ${to}`)
      return {
        success: true,
        provider: 'outlook',
        messageId: result.messageId
      }
    } catch (outlookError) {
      logger.warn('Outlook email failed, trying SMTP fallback:', outlookError.message)
    }
  }

  // Fall back to SMTP
  if (smtpTransporter) {
    try {
      const mailOptions = {
        from: from || `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`,
        to: to,
        subject: subject,
        html: body,
        attachments: attachments.map(att => ({
          filename: att.filename,
          content: att.content
        }))
      }

      const result = await smtpTransporter.sendMail(mailOptions)

      logger.info(`Email sent via SMTP to ${to}`)
      return {
        success: true,
        provider: 'smtp',
        messageId: result.messageId
      }
    } catch (smtpError) {
      logger.error('SMTP email failed:', smtpError.message)
      throw new Error(`Failed to send email: ${smtpError.message}`)
    }
  }

  // No email provider configured - log for development
  logger.warn(`Email not sent (no provider configured): To: ${to}, Subject: ${subject}`)
  return {
    success: false,
    provider: 'none',
    message: 'No email provider configured. Email logged for development.',
    email: { to, subject, bodyPreview: body.substring(0, 100) }
  }
}

/**
 * Send bulk emails
 *
 * @param {Array<Object>} emails - Array of email options
 * @returns {Promise<Object>} Bulk send result
 */
export const sendBulkEmails = async (emails) => {
  const results = {
    total: emails.length,
    sent: 0,
    failed: 0,
    details: []
  }

  for (const email of emails) {
    try {
      const result = await sendEmail(email)
      if (result.success) {
        results.sent++
      } else {
        results.failed++
      }
      results.details.push({ ...result, to: email.to })
    } catch (error) {
      results.failed++
      results.details.push({
        success: false,
        to: email.to,
        error: error.message
      })
    }
  }

  return results
}

/**
 * Verify email configuration
 *
 * @returns {Promise<Object>} Configuration status
 */
export const verifyConfiguration = async () => {
  const status = {
    outlookConfigured: !!(process.env.OUTLOOK_CLIENT_ID && process.env.OUTLOOK_CLIENT_SECRET),
    smtpConfigured: !!(SMTP_HOST && SMTP_USER && SMTP_PASSWORD),
    ready: false
  }

  if (status.smtpConfigured && smtpTransporter) {
    try {
      await smtpTransporter.verify()
      status.smtpVerified = true
    } catch (error) {
      status.smtpVerified = false
      status.smtpError = error.message
    }
  }

  status.ready = status.outlookConfigured || status.smtpVerified
  return status
}

export default {
  sendEmail,
  sendBulkEmails,
  verifyConfiguration
}
