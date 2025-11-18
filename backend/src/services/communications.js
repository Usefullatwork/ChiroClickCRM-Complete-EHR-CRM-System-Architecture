/**
 * Communications Service
 * SMS and Email communications with tracking
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all communications
 */
export const getAllCommunications = async (organizationId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    patientId = null,
    type = null,
    startDate = null,
    endDate = null
  } = options;

  const offset = (page - 1) * limit;

  try {
    let whereClause = 'WHERE c.organization_id = $1';
    const params = [organizationId];
    let paramIndex = 2;

    if (patientId) {
      params.push(patientId);
      whereClause += ` AND c.patient_id = $${paramIndex}`;
      paramIndex++;
    }

    if (type) {
      params.push(type);
      whereClause += ` AND c.type = $${paramIndex}`;
      paramIndex++;
    }

    if (startDate) {
      params.push(startDate);
      whereClause += ` AND c.sent_at >= $${paramIndex}`;
      paramIndex++;
    }

    if (endDate) {
      params.push(endDate);
      whereClause += ` AND c.sent_at <= $${paramIndex}`;
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM communications c ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT
        c.*,
        p.first_name || ' ' || p.last_name as patient_name,
        u.first_name || ' ' || u.last_name as sent_by_name
      FROM communications c
      JOIN patients p ON p.id = c.patient_id
      LEFT JOIN users u ON u.id = c.sent_by
      ${whereClause}
      ORDER BY c.sent_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      communications: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error getting communications:', error);
    throw error;
  }
};

/**
 * Send SMS (Telnyx integration placeholder)
 */
export const sendSMS = async (organizationId, smsData, userId) => {
  try {
    // TODO: Integrate with Telnyx API
    // For now, just log the communication

    const result = await query(
      `INSERT INTO communications (
        organization_id,
        patient_id,
        type,
        direction,
        template_id,
        content,
        sent_by,
        recipient_phone,
        sent_at,
        external_id,
        cost_amount
      ) VALUES ($1, $2, 'SMS', 'OUTBOUND', $3, $4, $5, $6, NOW(), $7, $8)
      RETURNING *`,
      [
        organizationId,
        smsData.patient_id,
        smsData.template_id || null,
        smsData.content,
        userId,
        smsData.recipient_phone,
        `TELNYX-${Date.now()}`, // Mock external ID
        0.007 // Telnyx cost per SMS
      ]
    );

    logger.info('SMS logged:', {
      organizationId,
      patientId: smsData.patient_id,
      phone: smsData.recipient_phone
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error sending SMS:', error);
    throw error;
  }
};

/**
 * Send Email (SMTP placeholder)
 */
export const sendEmail = async (organizationId, emailData, userId) => {
  try {
    // TODO: Integrate with SMTP/SendGrid

    const result = await query(
      `INSERT INTO communications (
        organization_id,
        patient_id,
        type,
        direction,
        template_id,
        subject,
        content,
        sent_by,
        recipient_email,
        sent_at
      ) VALUES ($1, $2, 'EMAIL', 'OUTBOUND', $3, $4, $5, $6, $7, NOW())
      RETURNING *`,
      [
        organizationId,
        emailData.patient_id,
        emailData.template_id || null,
        emailData.subject,
        emailData.content,
        userId,
        emailData.recipient_email
      ]
    );

    logger.info('Email logged:', {
      organizationId,
      patientId: emailData.patient_id,
      email: emailData.recipient_email
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Get message templates
 */
export const getTemplates = async (organizationId, type = null) => {
  try {
    let whereClause = 'WHERE organization_id = $1 AND is_active = true';
    const params = [organizationId];

    if (type) {
      params.push(type);
      whereClause += ` AND type = $2`;
    }

    const result = await query(
      `SELECT * FROM message_templates ${whereClause} ORDER BY category, name`,
      params
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting templates:', error);
    throw error;
  }
};

/**
 * Create template
 */
export const createTemplate = async (organizationId, templateData) => {
  try {
    const result = await query(
      `INSERT INTO message_templates (
        organization_id,
        name,
        type,
        category,
        language,
        subject,
        body,
        available_variables
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        organizationId,
        templateData.name,
        templateData.type,
        templateData.category || null,
        templateData.language || 'NO',
        templateData.subject || null,
        templateData.body,
        templateData.available_variables || []
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error creating template:', error);
    throw error;
  }
};

/**
 * Get communication statistics
 */
export const getCommunicationStats = async (organizationId, startDate, endDate) => {
  try {
    const result = await query(
      `SELECT
        type,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE delivered_at IS NOT NULL) as delivered,
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
        COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked,
        COUNT(*) FILTER (WHERE resulted_in_booking = true) as resulted_in_booking
      FROM communications
      WHERE organization_id = $1
        AND sent_at BETWEEN $2 AND $3
      GROUP BY type`,
      [organizationId, startDate, endDate]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting communication stats:', error);
    throw error;
  }
};

export default {
  getAllCommunications,
  sendSMS,
  sendEmail,
  getTemplates,
  createTemplate,
  getCommunicationStats
};
