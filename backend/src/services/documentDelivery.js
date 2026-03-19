/**
 * Document Delivery Service
 * Coordinates PDF generation, portal document creation, and delivery via email/SMS.
 * All patient-facing text in Norwegian.
 *
 * @module services/documentDelivery
 */

import crypto from 'crypto';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import {
  generateTreatmentSummary,
  generateReferralLetter,
  generateSickNote,
} from './pdfGenerator.js';
import { sendEmail } from './emailService.js';
import { sendSMS } from './smsService.js';

// ── Constants ────────────────────────────────────────────────────────────
const VALID_DOC_TYPES = [
  'treatment_summary',
  'referral_letter',
  'sick_note',
  'invoice',
  'exercise_prescription',
];
const TOKEN_EXPIRY_HOURS = 72;
const PORTAL_BASE_URL = process.env.PORTAL_BASE_URL || 'https://portal.chiroclickehr.no';

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure download token (48-byte hex).
 * @returns {string}
 */
function generateDownloadToken() {
  return crypto.randomBytes(48).toString('hex');
}

/**
 * Generate a PDF for the given document type.
 * @param {string} documentType
 * @param {string} documentId
 * @param {string} organizationId
 * @returns {Promise<{buffer: Buffer, filename: string}>}
 */
async function generatePdf(documentType, documentId, organizationId) {
  let buffer;

  switch (documentType) {
    case 'treatment_summary': {
      const encRes = await query(
        `SELECT patient_id FROM clinical_encounters WHERE id = $1 AND organization_id = $2`,
        [documentId, organizationId]
      );
      if (encRes.rows.length === 0) {
        throw new Error('Encounter not found for treatment summary');
      }
      const patientId = encRes.rows[0].patient_id;
      buffer = await generateTreatmentSummary(patientId, organizationId);
      break;
    }
    case 'referral_letter': {
      const refRes = await query(
        `SELECT ce.id AS encounter_id, ce.organization_id
         FROM clinical_encounters ce
         WHERE ce.id = $1 AND ce.organization_id = $2`,
        [documentId, organizationId]
      );
      if (refRes.rows.length === 0) {
        throw new Error('Encounter not found for referral letter');
      }
      buffer = await generateReferralLetter({
        orgId: organizationId,
        encounterId: documentId,
      });
      break;
    }
    case 'sick_note': {
      const snRes = await query(
        `SELECT patient_id FROM clinical_encounters WHERE id = $1 AND organization_id = $2`,
        [documentId, organizationId]
      );
      if (snRes.rows.length === 0) {
        throw new Error('Encounter not found for sick note');
      }
      buffer = await generateSickNote({
        patientId: snRes.rows[0].patient_id,
        orgId: organizationId,
        encounterId: documentId,
      });
      break;
    }
    default:
      throw new Error(`Unsupported document type for PDF generation: ${documentType}`);
  }

  const filename = `${documentType}_${documentId.slice(0, 8)}.pdf`;
  return { buffer, filename };
}

/**
 * Create a portal document record with a secure download token.
 * @param {string} organizationId
 * @param {string} patientId
 * @param {string} documentType
 * @param {string} documentId
 * @param {string} title
 * @param {string} createdBy
 * @returns {Promise<Object>}
 */
async function createPortalDocument(
  organizationId,
  patientId,
  documentType,
  documentId,
  title,
  createdBy
) {
  const token = generateDownloadToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  const result = await query(
    `INSERT INTO portal_documents
       (organization_id, patient_id, document_type, document_id, title, download_token, token_expires_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, download_token, title, token_expires_at`,
    [organizationId, patientId, documentType, documentId, title, token, expiresAt, createdBy]
  );

  return result.rows[0];
}

/**
 * Log a communication record (email or SMS sent).
 * @param {string} organizationId
 * @param {string} patientId
 * @param {string} type - 'EMAIL' or 'SMS'
 * @param {string} subject
 * @param {string} content
 * @param {string} sentBy - user ID
 * @returns {Promise<Object>}
 */
async function logCommunication(organizationId, patientId, type, subject, content, sentBy) {
  const result = await query(
    `INSERT INTO communications
       (organization_id, patient_id, type, direction, subject, content, sent_by, status, sent_at)
     VALUES ($1, $2, $3, 'OUTBOUND', $4, $5, $6, 'SENT', NOW())
     RETURNING id`,
    [organizationId, patientId, type, subject, content, sentBy]
  );

  return result.rows[0];
}

// ── Main entry point ─────────────────────────────────────────────────────

/**
 * Deliver a document to a patient via email, SMS, or both.
 * Creates a portal document record, generates the PDF, and sends it.
 *
 * @param {string} organizationId
 * @param {string} documentType - one of VALID_DOC_TYPES
 * @param {string} documentId - the source document UUID
 * @param {string} patientId
 * @param {string} method - 'email', 'sms', or 'both'
 * @param {Object} [options]
 * @param {string} [options.userId] - the user triggering the delivery
 * @returns {Promise<Object>}
 */
export async function deliverDocument(
  organizationId,
  documentType,
  documentId,
  patientId,
  method,
  options = {}
) {
  // Validate document type
  if (!VALID_DOC_TYPES.includes(documentType)) {
    throw new Error(`Invalid document type: ${documentType}`);
  }

  // Fetch patient
  const patientRes = await query(
    `SELECT id, first_name, last_name, email, phone
     FROM patients
     WHERE id = $1 AND organization_id = $2`,
    [patientId, organizationId]
  );

  if (patientRes.rows.length === 0) {
    throw new Error('Patient not found');
  }
  const patient = patientRes.rows[0];

  // Generate PDF
  const pdfResult = await generatePdf(documentType, documentId, organizationId);

  // Create portal document record
  const docTitle = buildDocumentTitle(documentType);
  const portalDoc = await createPortalDocument(
    organizationId,
    patientId,
    documentType,
    documentId,
    docTitle,
    options.userId || null
  );

  const portalLink = `${PORTAL_BASE_URL}/documents/${portalDoc.download_token}`;
  const deliveryStatus = { email: false, sms: false };

  // Deliver via email
  if (method === 'email' || method === 'both') {
    if (!patient.email) {
      throw new Error('Patient has no email address');
    }

    const emailHtml = buildEmailHtml(patient, portalDoc, portalLink);

    await sendEmail({
      to: patient.email,
      subject: `Dokument: ${portalDoc.title}`,
      html: emailHtml,
      attachments: [
        {
          filename: pdfResult.filename,
          content: pdfResult.buffer,
          contentType: 'application/pdf',
        },
      ],
    });

    await logCommunication(
      organizationId,
      patientId,
      'EMAIL',
      `Dokument: ${portalDoc.title}`,
      `Dokument sendt til ${patient.email}`,
      options.userId || null
    );

    deliveryStatus.email = true;
    logger.info('Document delivered via email', {
      documentType,
      patientId: patientId.slice(0, 8) + '...',
    });
  }

  // Deliver via SMS
  if (method === 'sms' || method === 'both') {
    if (!patient.phone) {
      throw new Error('Patient has no phone number');
    }

    const smsText = buildSmsText(patient, portalDoc, portalLink);

    await sendSMS({
      to: patient.phone,
      message: smsText,
    });

    await logCommunication(
      organizationId,
      patientId,
      'SMS',
      `Dokument: ${portalDoc.title}`,
      smsText,
      options.userId || null
    );

    deliveryStatus.sms = true;
    logger.info('Document delivered via SMS', {
      documentType,
      patientId: patientId.slice(0, 8) + '...',
    });
  }

  return {
    portalDocumentId: portalDoc.id,
    downloadToken: portalDoc.download_token,
    deliveryStatus,
  };
}

// ── Template builders ────────────────────────────────────────────────────

/**
 * Build a Norwegian document title from the type.
 * @param {string} documentType
 * @returns {string}
 */
function buildDocumentTitle(documentType) {
  const titles = {
    treatment_summary: 'Behandlingssammendrag',
    referral_letter: 'Henvisning',
    sick_note: 'Sykmelding',
    invoice: 'Faktura',
    exercise_prescription: 'Treningsprogram',
  };
  return titles[documentType] || documentType;
}

/**
 * Build HTML email body for document delivery.
 * @param {Object} patient
 * @param {Object} portalDoc
 * @param {string} portalLink
 * @returns {string}
 */
function buildEmailHtml(patient, portalDoc, portalLink) {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Nytt dokument tilgjengelig</h2>
  <p>Hei ${patient.first_name},</p>
  <p>Et nytt dokument er tilgjengelig for deg: <strong>${portalDoc.title}</strong></p>
  <p>Du kan laste det ned fra pasientportalen:</p>
  <a href="${portalLink}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Last ned dokument</a>
  <p style="margin-top: 16px; color: #666; font-size: 14px;">Dokumentet er vedlagt som PDF. Lenken utl\u00f8per om ${TOKEN_EXPIRY_HOURS} timer.</p>
</div>`;
}

/**
 * Build SMS text for document delivery.
 * @param {Object} patient
 * @param {Object} portalDoc
 * @param {string} portalLink
 * @returns {string}
 */
function buildSmsText(patient, portalDoc, portalLink) {
  return `Hei ${patient.first_name}, et nytt dokument er tilgjengelig: ${portalDoc.title}. Last ned her: ${portalLink} (utl\u00f8per om ${TOKEN_EXPIRY_HOURS}t)`;
}
