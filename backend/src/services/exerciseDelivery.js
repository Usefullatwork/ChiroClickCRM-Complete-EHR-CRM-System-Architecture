/**
 * Exercise Delivery Service
 * Handles PDF generation and email delivery of exercise prescriptions
 *
 * @module services/exerciseDelivery
 */

import PDFDocument from 'pdfkit';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import { sendEmail } from './email.js';
import exerciseLibraryService from './exerciseLibrary.js';

// ============================================================================
// PDF GENERATION
// ============================================================================

/**
 * Generate PDF for an exercise prescription
 */
export const generatePrescriptionPDF = async (organizationId, prescriptionId) => {
  try {
    const prescription = await exerciseLibraryService.getPrescriptionById(
      organizationId,
      prescriptionId
    );

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    // Get organization details for letterhead
    const orgResult = await query(
      `SELECT name, address, phone, email, logo_url FROM organizations WHERE id = $1`,
      [organizationId]
    );
    const organization = orgResult.rows[0];

    return new Promise((resolve, reject) => {
      const chunks = [];
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Øvelsesprogram - ${prescription.patient_name}`,
          Author: organization.name,
          Subject: 'Exercise Prescription',
          Keywords: 'exercise, prescription, rehabilitation',
        },
      });

      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text(organization.name, { align: 'center' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(organization.address || '', { align: 'center' })
        .text(`Tlf: ${organization.phone || ''} | E-post: ${organization.email || ''}`, {
          align: 'center',
        });

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Title
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('Øvelsesprogram / Exercise Program', { align: 'center' });

      doc.moveDown();

      // Patient and prescription info
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Pasient / Patient: ', { continued: true })
        .font('Helvetica')
        .text(prescription.patient_name);

      doc
        .font('Helvetica-Bold')
        .text('Foreskrevet av / Prescribed by: ', { continued: true })
        .font('Helvetica')
        .text(prescription.prescribed_by_name);

      doc
        .font('Helvetica-Bold')
        .text('Dato / Date: ', { continued: true })
        .font('Helvetica')
        .text(new Date(prescription.prescribed_at).toLocaleDateString('nb-NO'));

      if (prescription.patient_instructions) {
        doc.moveDown();
        doc.font('Helvetica-Bold').text('Instruksjoner / Instructions:');
        doc.font('Helvetica').text(prescription.patient_instructions);
      }

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Exercises
      if (prescription.exercises && prescription.exercises.length > 0) {
        prescription.exercises.forEach((prescribedExercise, index) => {
          const exercise = prescribedExercise.exercise;

          // Check if we need a new page
          if (doc.y > 650) {
            doc.addPage();
          }

          // Exercise number and name
          doc
            .fontSize(13)
            .font('Helvetica-Bold')
            .text(`${index + 1}. ${exercise.nameNorwegian || exercise.name}`);

          // Category and difficulty
          doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#666666')
            .text(
              `${exercise.category} | ${exercise.difficultyLevel === 'beginner' ? 'Nybegynner' : exercise.difficultyLevel === 'intermediate' ? 'Middels' : 'Avansert'}`
            )
            .fillColor('#000000');

          doc.moveDown(0.5);

          // Parameters box
          const params = [];
          if (prescribedExercise.sets) {
            params.push(`${prescribedExercise.sets} sett`);
          }
          if (prescribedExercise.reps) {
            params.push(`${prescribedExercise.reps} repetisjoner`);
          }
          if (prescribedExercise.holdSeconds) {
            params.push(`Hold ${prescribedExercise.holdSeconds} sek`);
          }
          if (prescribedExercise.frequencyPerDay) {
            params.push(`${prescribedExercise.frequencyPerDay}x daglig`);
          }

          if (params.length > 0) {
            doc
              .fontSize(10)
              .font('Helvetica-Bold')
              .text(`Dosering: ${params.join(' | ')}`);
          }

          doc.moveDown(0.5);

          // Instructions
          doc
            .fontSize(10)
            .font('Helvetica')
            .text(exercise.instructionsNorwegian || exercise.instructions, {
              align: 'left',
              lineGap: 2,
            });

          // Custom instructions
          if (prescribedExercise.customInstructions) {
            doc
              .moveDown(0.3)
              .font('Helvetica-Oblique')
              .text(`Spesielle instruksjoner: ${prescribedExercise.customInstructions}`);
          }

          // Precautions
          if (exercise.precautions && exercise.precautions.length > 0) {
            doc
              .moveDown(0.3)
              .fontSize(9)
              .font('Helvetica-Bold')
              .fillColor('#cc6600')
              .text('⚠ Forsiktighetsregler: ', { continued: true })
              .font('Helvetica')
              .text(exercise.precautions.join(', '))
              .fillColor('#000000');
          }

          doc.moveDown();

          // Separator line
          if (index < prescription.exercises.length - 1) {
            doc
              .strokeColor('#cccccc')
              .moveTo(50, doc.y)
              .lineTo(545, doc.y)
              .stroke()
              .strokeColor('#000000');
            doc.moveDown();
          }
        });
      }

      // Footer with portal link
      doc.moveDown(2);

      if (prescription.portal_access_token) {
        const portalUrl = `${process.env.FRONTEND_URL || 'https://app.chiroclick.no'}/portal/exercises/${prescription.portal_access_token}`;

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Se øvelsene med video online:', { align: 'center' });

        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#0066cc')
          .text(portalUrl, { align: 'center', link: portalUrl })
          .fillColor('#000000');
      }

      // Disclaimer
      doc.moveDown(2);
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#666666')
        .text(
          'Dette øvelsesprogrammet er tilpasset deg basert på din undersøkelse. Stopp øvelsene hvis du opplever økt smerte og kontakt klinikken. Programmet er gyldig i 90 dager.',
          {
            align: 'center',
          }
        )
        .text(
          'This exercise program is customized based on your examination. Stop exercises if you experience increased pain and contact the clinic. Valid for 90 days.',
          {
            align: 'center',
          }
        );

      doc.end();
    });
  } catch (error) {
    logger.error('Error generating prescription PDF:', error);
    throw error;
  }
};

// ============================================================================
// EMAIL DELIVERY
// ============================================================================

/**
 * Send exercise prescription via email
 */
export const sendPrescriptionEmail = async (organizationId, prescriptionId, _options = {}) => {
  try {
    const prescription = await exerciseLibraryService.getPrescriptionById(
      organizationId,
      prescriptionId
    );

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    if (!prescription.patient_email) {
      throw new Error('Patient does not have an email address');
    }

    // Get organization for sender info
    const orgResult = await query(`SELECT name, email FROM organizations WHERE id = $1`, [
      organizationId,
    ]);
    const organization = orgResult.rows[0];

    // Generate PDF
    const pdfBuffer = await generatePrescriptionPDF(organizationId, prescriptionId);

    // Build portal URL
    const portalUrl = `${process.env.FRONTEND_URL || 'https://app.chiroclick.no'}/portal/exercises/${prescription.portal_access_token}`;

    // Email content
    const emailContent = {
      to: prescription.patient_email,
      from: organization.email || 'noreply@chiroclick.no',
      subject: `Ditt øvelsesprogram fra ${organization.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Ditt øvelsesprogram</h2>

          <p>Hei ${prescription.patient_name?.split(' ')[0] || ''},</p>

          <p>Vedlagt finner du øvelsesprogrammet som ble foreskrevet til deg av ${prescription.prescribed_by_name} hos ${organization.name}.</p>

          ${
            prescription.patient_instructions
              ? `
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Instruksjoner:</strong><br>
            ${prescription.patient_instructions}
          </div>
          `
              : ''
          }

          <p>Programmet inneholder ${prescription.exercises?.length || 0} øvelser som er tilpasset dine behov.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${portalUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Se øvelsene med video
            </a>
          </div>

          <p style="font-size: 14px; color: #666;">
            Du kan også finne øvelsene i vedlegget som PDF.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #666;">
            Stopp øvelsene hvis du opplever økt smerte og ta kontakt med klinikken.<br>
            Denne linken er gyldig i 90 dager.
          </p>

          <p style="font-size: 12px; color: #666;">
            Med vennlig hilsen,<br>
            ${organization.name}
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Øvelsesprogram_${prescription.patient_name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    // Send email
    const emailResult = await sendEmail(emailContent);

    // Update prescription email status
    await exerciseLibraryService.updatePrescriptionEmailStatus(prescriptionId, true);

    logger.info('Exercise prescription email sent:', {
      organizationId,
      prescriptionId,
      patientEmail: prescription.patient_email,
    });

    return {
      success: true,
      messageId: emailResult?.messageId,
    };
  } catch (error) {
    logger.error('Error sending prescription email:', error);

    // Update email status as failed
    await exerciseLibraryService.updatePrescriptionEmailStatus(prescriptionId, false);

    throw error;
  }
};

/**
 * Send reminder email for exercise compliance
 */
export const sendExerciseReminder = async (organizationId, prescriptionId) => {
  try {
    const prescription = await exerciseLibraryService.getPrescriptionById(
      organizationId,
      prescriptionId
    );

    if (!prescription || !prescription.patient_email) {
      throw new Error('Prescription not found or patient has no email');
    }

    // Get organization for sender info
    const orgResult = await query(`SELECT name, email FROM organizations WHERE id = $1`, [
      organizationId,
    ]);
    const organization = orgResult.rows[0];

    const portalUrl = `${process.env.FRONTEND_URL || 'https://app.chiroclick.no'}/portal/exercises/${prescription.portal_access_token}`;

    const emailContent = {
      to: prescription.patient_email,
      from: organization.email || 'noreply@chiroclick.no',
      subject: `Påminnelse: Ditt øvelsesprogram fra ${organization.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Påminnelse om øvelser</h2>

          <p>Hei ${prescription.patient_name?.split(' ')[0] || ''},</p>

          <p>Dette er en vennlig påminnelse om øvelsesprogrammet ditt. Regelmessig gjennomføring av øvelsene er viktig for din bedring.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${portalUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Gå til øvelsene
            </a>
          </div>

          <p style="font-size: 12px; color: #666;">
            Ta kontakt med klinikken hvis du har spørsmål om øvelsene.<br>
            Med vennlig hilsen,<br>
            ${organization.name}
          </p>
        </div>
      `,
    };

    const emailResult = await sendEmail(emailContent);

    logger.info('Exercise reminder email sent:', {
      organizationId,
      prescriptionId,
      patientEmail: prescription.patient_email,
    });

    return {
      success: true,
      messageId: emailResult?.messageId,
    };
  } catch (error) {
    logger.error('Error sending exercise reminder:', error);
    throw error;
  }
};

/**
 * Send SMS link to patient portal
 */
export const sendPortalSMS = async (organizationId, prescriptionId) => {
  try {
    const prescription = await exerciseLibraryService.getPrescriptionById(
      organizationId,
      prescriptionId
    );

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    // Get patient phone
    const patientResult = await query(`SELECT phone FROM patients WHERE id = $1`, [
      prescription.patient_id,
    ]);
    const patient = patientResult.rows[0];

    if (!patient?.phone) {
      throw new Error('Patient does not have a phone number');
    }

    const portalUrl = `${process.env.FRONTEND_URL || 'https://app.chiroclick.no'}/portal/exercises/${prescription.portal_access_token}`;

    // Use SMS service (assumes sendSMS is available from another service)
    const { sendSMS } = await import('./sms.js');

    const message = `Hei! Øvelsesprogrammet ditt er klart. Se øvelsene med video her: ${portalUrl}`;

    await sendSMS({
      organizationId,
      to: patient.phone,
      message,
    });

    logger.info('Exercise portal SMS sent:', {
      organizationId,
      prescriptionId,
      patientPhone: `${patient.phone.substring(0, 4)}****`,
    });

    return { success: true };
  } catch (error) {
    logger.error('Error sending portal SMS:', error);
    throw error;
  }
};

export default {
  generatePrescriptionPDF,
  sendPrescriptionEmail,
  sendExerciseReminder,
  sendPortalSMS,
};
