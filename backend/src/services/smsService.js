/**
 * SMS Service
 * Comprehensive SMS sending with Twilio
 * Supports templating, bulk sending, and tracking
 *
 * @module services/smsService
 */

import { query } from '../config/database.js'
import logger from '../utils/logger.js'

// =============================================================================
// CONFIGURATION
// =============================================================================

const config = {
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID
  },
  defaults: {
    countryCode: '+47', // Norway
    maxLength: 1600, // Extended SMS limit
    segmentLength: 160
  },
  rateLimits: {
    perPatientPerDay: parseInt(process.env.SMS_RATE_LIMIT_PER_PATIENT || '5'),
    perOrgPerHour: parseInt(process.env.SMS_RATE_LIMIT_PER_ORG_HOUR || '100')
  }
}

// =============================================================================
// TWILIO CLIENT
// =============================================================================

let twilioClient = null

/**
 * Initialize Twilio client
 */
const initializeTwilioClient = async () => {
  if (twilioClient) return twilioClient

  if (!config.twilio.accountSid || !config.twilio.authToken) {
    logger.warn('SMS service: Twilio not configured, SMS will be logged only')
    return null
  }

  try {
    // Dynamic import for Twilio
    const twilio = await import('twilio')
    twilioClient = twilio.default(
      config.twilio.accountSid,
      config.twilio.authToken
    )
    logger.info('Twilio client initialized')
    return twilioClient
  } catch (error) {
    logger.error('Failed to initialize Twilio client:', error)
    return null
  }
}

// =============================================================================
// PHONE NUMBER UTILITIES
// =============================================================================

/**
 * Normalize phone number to E.164 format
 *
 * @param {string} phone - Phone number
 * @param {string} [defaultCountryCode='+47'] - Default country code
 * @returns {string} Normalized phone number
 */
export const normalizePhoneNumber = (phone, defaultCountryCode = config.defaults.countryCode) => {
  if (!phone) return null

  // Remove all non-digit characters except leading +
  let normalized = phone.replace(/[^\d+]/g, '')

  // Handle various formats
  if (normalized.startsWith('00')) {
    // International format with 00
    normalized = '+' + normalized.substring(2)
  } else if (!normalized.startsWith('+')) {
    // Assume local number, add country code
    if (normalized.startsWith('0')) {
      normalized = normalized.substring(1)
    }
    normalized = defaultCountryCode + normalized
  }

  return normalized
}

/**
 * Validate phone number format
 *
 * @param {string} phone - Phone number
 * @returns {boolean} Is valid
 */
export const isValidPhoneNumber = (phone) => {
  const normalized = normalizePhoneNumber(phone)
  if (!normalized) return false

  // Basic E.164 validation
  const e164Regex = /^\+[1-9]\d{6,14}$/
  return e164Regex.test(normalized)
}

// =============================================================================
// SMS SENDING
// =============================================================================

/**
 * Send an SMS message
 *
 * @param {Object} options - SMS options
 * @param {string} options.to - Recipient phone number
 * @param {string} options.message - Message content
 * @param {string} [options.from] - Sender phone number
 * @param {Object} [options.metadata] - Additional metadata
 * @returns {Promise<Object>} Send result
 */
export const sendSMS = async (options) => {
  const {
    to,
    message,
    from = config.twilio.fromNumber,
    metadata = {}
  } = options

  if (!to || !message) {
    throw new Error('Missing required SMS fields: to, message')
  }

  const normalizedTo = normalizePhoneNumber(to)

  if (!isValidPhoneNumber(normalizedTo)) {
    throw new Error(`Invalid phone number: ${to}`)
  }

  // Check message length
  if (message.length > config.defaults.maxLength) {
    throw new Error(`Message too long. Max ${config.defaults.maxLength} characters.`)
  }

  const segments = Math.ceil(message.length / config.defaults.segmentLength)

  // Initialize Twilio client if needed
  const client = await initializeTwilioClient()

  if (client) {
    try {
      const messageOptions = {
        body: message,
        to: normalizedTo
      }

      // Use messaging service or from number
      if (config.twilio.messagingServiceSid) {
        messageOptions.messagingServiceSid = config.twilio.messagingServiceSid
      } else {
        messageOptions.from = from
      }

      const result = await client.messages.create(messageOptions)

      logger.info(`SMS sent to ${normalizedTo}`, {
        sid: result.sid,
        status: result.status,
        segments
      })

      return {
        success: true,
        provider: 'twilio',
        messageId: result.sid,
        status: result.status,
        segments,
        to: normalizedTo
      }
    } catch (error) {
      logger.error(`Failed to send SMS to ${normalizedTo}:`, error)
      throw error
    }
  } else {
    // Development mode - log SMS
    logger.info('SMS (not sent - Twilio not configured):', {
      to: normalizedTo,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      segments
    })

    return {
      success: false,
      provider: 'none',
      message: 'Twilio not configured. SMS logged for development.',
      segments,
      to: normalizedTo,
      sms: { to: normalizedTo, message }
    }
  }
}

/**
 * Send SMS using a template
 *
 * @param {Object} options - SMS options
 * @param {string} options.to - Recipient phone number
 * @param {string} options.template - Template string with {{variables}}
 * @param {Object} options.variables - Variables to replace
 * @returns {Promise<Object>} Send result
 */
export const sendTemplatedSMS = async (options) => {
  const { to, template, variables = {} } = options

  let message = template
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    message = message.replace(regex, value || '')
  }

  return sendSMS({ to, message })
}

/**
 * Send bulk SMS messages
 *
 * @param {Array<Object>} messages - Array of SMS objects
 * @param {number} [delayMs=500] - Delay between messages
 * @returns {Promise<Object>} Bulk send results
 */
export const sendBulkSMS = async (messages, delayMs = 500) => {
  const results = {
    total: messages.length,
    sent: 0,
    failed: 0,
    details: []
  }

  for (const sms of messages) {
    try {
      const result = await sendSMS(sms)
      if (result.success) {
        results.sent++
      } else {
        results.failed++
      }
      results.details.push({ to: sms.to, ...result })

      // Rate limiting delay
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    } catch (error) {
      results.failed++
      results.details.push({
        to: sms.to,
        success: false,
        error: error.message
      })
    }
  }

  return results
}

// =============================================================================
// SPECIALIZED SMS FUNCTIONS
// =============================================================================

/**
 * Send exercise program link via SMS
 *
 * @param {Object} params - Parameters
 * @param {Object} params.patient - Patient object
 * @param {string} params.portalLink - Magic link to exercises
 * @param {Object} params.organization - Organization object
 * @returns {Promise<Object>} Send result
 */
export const sendExerciseProgramSMS = async (params) => {
  const { patient, portalLink, organization } = params

  const patientPhone = patient.phone || patient.mobile

  if (!patientPhone) {
    throw new Error('Patient does not have a phone number')
  }

  const message = `Hei ${patient.firstName || patient.first_name || ''}! Ovelsesprogrammet ditt fra ${organization.name} er klart. Se ovelsene med video her: ${portalLink}`

  return sendSMS({
    to: patientPhone,
    message,
    metadata: {
      type: 'exercise_program',
      patientId: patient.id,
      organizationId: organization.id
    }
  })
}

/**
 * Send appointment reminder via SMS
 *
 * @param {Object} params - Parameters
 * @param {Object} params.patient - Patient object
 * @param {Object} params.appointment - Appointment object
 * @param {Object} params.organization - Organization object
 * @returns {Promise<Object>} Send result
 */
export const sendAppointmentReminderSMS = async (params) => {
  const { patient, appointment, organization } = params

  const patientPhone = patient.phone || patient.mobile

  if (!patientPhone) {
    throw new Error('Patient does not have a phone number')
  }

  const appointmentDate = new Date(appointment.start_time || appointment.startTime)
  const dateStr = appointmentDate.toLocaleDateString('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
  const timeStr = appointmentDate.toLocaleTimeString('nb-NO', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const message = `Paminnelse: Du har time hos ${organization.name} ${dateStr} kl. ${timeStr}. Kan du ikke mote? Ring oss pa ${organization.phone || 'klinikken'}.`

  return sendSMS({
    to: patientPhone,
    message,
    metadata: {
      type: 'appointment_reminder',
      patientId: patient.id,
      appointmentId: appointment.id,
      organizationId: organization.id
    }
  })
}

/**
 * Send appointment confirmation via SMS
 *
 * @param {Object} params - Parameters
 * @returns {Promise<Object>} Send result
 */
export const sendAppointmentConfirmationSMS = async (params) => {
  const { patient, appointment, organization } = params

  const patientPhone = patient.phone || patient.mobile

  if (!patientPhone) {
    throw new Error('Patient does not have a phone number')
  }

  const appointmentDate = new Date(appointment.start_time || appointment.startTime)
  const dateStr = appointmentDate.toLocaleDateString('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
  const timeStr = appointmentDate.toLocaleTimeString('nb-NO', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const message = `Bekreftelse: Timen din hos ${organization.name} er ${dateStr} kl. ${timeStr}. Vi gleder oss til a se deg! Adr: ${organization.address || 'Se nettsiden var'}`

  return sendSMS({
    to: patientPhone,
    message,
    metadata: {
      type: 'appointment_confirmation',
      patientId: patient.id,
      appointmentId: appointment.id,
      organizationId: organization.id
    }
  })
}

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Check if SMS can be sent (rate limiting)
 *
 * @param {string} organizationId - Organization ID
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} Rate limit status
 */
export const checkRateLimits = async (organizationId, patientId) => {
  try {
    // Check patient rate limit (per day)
    const patientResult = await query(
      `SELECT COUNT(*) FROM communications
       WHERE patient_id = $1
         AND type = 'SMS'
         AND sent_at > NOW() - INTERVAL '24 hours'`,
      [patientId]
    )
    const patientCount = parseInt(patientResult.rows[0].count)

    // Check organization rate limit (per hour)
    const orgResult = await query(
      `SELECT COUNT(*) FROM communications
       WHERE organization_id = $1
         AND type = 'SMS'
         AND sent_at > NOW() - INTERVAL '1 hour'`,
      [organizationId]
    )
    const orgCount = parseInt(orgResult.rows[0].count)

    const patientAllowed = patientCount < config.rateLimits.perPatientPerDay
    const orgAllowed = orgCount < config.rateLimits.perOrgPerHour

    return {
      allowed: patientAllowed && orgAllowed,
      patientLimit: {
        current: patientCount,
        max: config.rateLimits.perPatientPerDay,
        allowed: patientAllowed
      },
      organizationLimit: {
        current: orgCount,
        max: config.rateLimits.perOrgPerHour,
        allowed: orgAllowed
      }
    }
  } catch (error) {
    logger.error('Error checking SMS rate limits:', error)
    // Default to allowing on error to not block legitimate use
    return { allowed: true }
  }
}

// =============================================================================
// DELIVERY STATUS
// =============================================================================

/**
 * Handle Twilio webhook for delivery status
 *
 * @param {Object} webhookData - Twilio webhook data
 * @returns {Promise<void>}
 */
export const handleDeliveryStatus = async (webhookData) => {
  try {
    const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = webhookData

    logger.info('SMS delivery status update:', {
      sid: MessageSid,
      status: MessageStatus,
      errorCode: ErrorCode
    })

    // Map Twilio status to our status
    const statusMap = {
      queued: 'PENDING',
      sending: 'PENDING',
      sent: 'SENT',
      delivered: 'DELIVERED',
      failed: 'FAILED',
      undelivered: 'FAILED'
    }

    const internalStatus = statusMap[MessageStatus] || MessageStatus

    // Update communication record
    let updateQuery
    if (internalStatus === 'DELIVERED') {
      updateQuery = `
        UPDATE communications
        SET delivered_at = NOW(),
            external_status = $2
        WHERE external_id = $1`
    } else if (internalStatus === 'FAILED') {
      updateQuery = `
        UPDATE communications
        SET failed_at = NOW(),
            failure_reason = $2
        WHERE external_id = $1`
    } else {
      updateQuery = `
        UPDATE communications
        SET external_status = $2
        WHERE external_id = $1`
    }

    await query(updateQuery, [
      MessageSid,
      ErrorMessage || MessageStatus
    ])
  } catch (error) {
    logger.error('Error handling SMS delivery status:', error)
  }
}

// =============================================================================
// CONFIGURATION CHECK
// =============================================================================

/**
 * Verify Twilio configuration
 *
 * @returns {Promise<Object>} Configuration status
 */
export const verifyConfiguration = async () => {
  const status = {
    configured: !!(config.twilio.accountSid && config.twilio.authToken),
    hasFromNumber: !!config.twilio.fromNumber,
    hasMessagingService: !!config.twilio.messagingServiceSid,
    verified: false
  }

  if (status.configured) {
    const client = await initializeTwilioClient()
    if (client) {
      try {
        // Verify by fetching account info
        const account = await client.api.accounts(config.twilio.accountSid).fetch()
        status.verified = true
        status.accountStatus = account.status
      } catch (error) {
        status.error = error.message
      }
    }
  }

  return status
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  sendSMS,
  sendTemplatedSMS,
  sendBulkSMS,
  sendExerciseProgramSMS,
  sendAppointmentReminderSMS,
  sendAppointmentConfirmationSMS,
  normalizePhoneNumber,
  isValidPhoneNumber,
  checkRateLimits,
  handleDeliveryStatus,
  verifyConfiguration
}
