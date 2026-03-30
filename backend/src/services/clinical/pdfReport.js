/**
 * PDF Report Generation — Exercise handout PDFs.
 *
 * @module services/clinical/pdfReport
 */

import logger from '../../utils/logger.js';
import { query } from '../../config/database.js';
import { fontName, formatNorwegianDate, createDoc, docToBuffer } from './pdf-utils.js';
import { fetchImageBuffer } from './pdfShared.js';

/**
 * Generate exercise handout PDF for a patient
 * @param {string} organizationId - Organization ID
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} PDF buffer and metadata
 */
export const generateExerciseHandout = async (organizationId, patientId) => {
  try {
    // Get patient info
    const patientResult = await query(
      `SELECT p.*, o.name as clinic_name, o.address as clinic_address, o.phone as clinic_phone
       FROM patients p
       JOIN organizations o ON o.id = p.organization_id
       WHERE p.id = $1 AND p.organization_id = $2`,
      [patientId, organizationId]
    );

    if (patientResult.rows.length === 0) {
      throw new Error('Patient not found');
    }

    const patient = patientResult.rows[0];

    // Get active exercise prescriptions with full exercise details
    const exercisesResult = await query(
      `SELECT pep.*,
              e.video_url, e.image_url, e.thumbnail_url,
              e.contraindications, e.precautions,
              e.instructions_no, e.instructions_en
       FROM patient_exercise_prescriptions pep
       LEFT JOIN exercise_library e ON e.id = pep.exercise_id
       WHERE pep.patient_id = $1 AND pep.organization_id = $2 AND pep.status = 'active'
       ORDER BY pep.created_at DESC`,
      [patientId, organizationId]
    );

    const exercises = exercisesResult.rows;
    const doc = createDoc();

    // Use Unicode font throughout
    const font = fontName(false);
    const fontBold = fontName(true);

    // Header
    doc.fontSize(20).font(fontBold).text('Ditt øvelsesprogram', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Clinic info (right aligned)
    doc.fontSize(10).font(font);
    doc.text(patient.clinic_name || 'Klinikk', { align: 'right' });
    if (patient.clinic_address) {
      doc.text(patient.clinic_address, { align: 'right' });
    }
    if (patient.clinic_phone) {
      doc.text(`Tlf: ${patient.clinic_phone}`, { align: 'right' });
    }
    doc.moveDown(1);

    // Patient info
    doc.fontSize(12).font(font);
    doc.text(`Pasient: ${patient.first_name} ${patient.last_name}`);
    doc.text(`Dato: ${formatNorwegianDate(new Date())}`);
    doc.moveDown(1);

    // Introduction
    doc.fontSize(10).font(font);
    doc.text(
      'Her er dine foreskrevne øvelser. Følg instruksjonene nøye og kontakt din behandler ved spørsmål.',
      { align: 'justify' }
    );
    doc.moveDown(1);

    // Frequency labels in Norwegian
    const frequencyLabels = {
      daily: 'Daglig',
      '2x_daily': '2 ganger daglig',
      '3x_week': '3 ganger per uke',
      weekly: 'Ukentlig',
      as_needed: 'Ved behov',
    };

    // Exercises
    if (exercises.length === 0) {
      doc.text('Ingen aktive øvelser.', { align: 'center' });
    } else {
      for (let index = 0; index < exercises.length; index++) {
        const exercise = exercises[index];

        // Check if we need a new page
        if (doc.y > 600) {
          doc.addPage();
        }

        // Exercise number and name
        doc.fontSize(14).font(fontBold).fillColor('#2d7d46');
        doc.text(`${index + 1}. ${exercise.exercise_name}`);
        doc.fillColor('#000000');
        doc.moveDown(0.3);

        // Try to fetch and embed image
        const imageUrl = exercise.image_url || exercise.thumbnail_url;
        let imageEmbedded = false;

        if (imageUrl) {
          try {
            const imageBuffer = await fetchImageBuffer(imageUrl);
            if (imageBuffer && imageBuffer.length > 0) {
              const imageX = 380;
              const imageY = doc.y;
              const imageWidth = 150;
              const imageHeight = 100;

              doc.image(imageBuffer, imageX, imageY, {
                fit: [imageWidth, imageHeight],
                align: 'center',
                valign: 'center',
              });
              imageEmbedded = true;
            }
          } catch (imgErr) {
            logger.debug(
              `Could not embed image for exercise ${exercise.exercise_code}: ${imgErr.message}`
            );
          }
        }

        // Dosing info box (narrower if image is present)
        const dosingTop = doc.y;
        const dosingWidth = imageEmbedded ? 300 : 200;
        doc.rect(50, dosingTop, dosingWidth, 50).fill('#f5f9f6');
        doc.fillColor('#000000').fontSize(10).font(fontBold);
        doc.text('Dosering:', 60, dosingTop + 8);
        doc.font(font);
        doc.text(
          `${exercise.sets || 3} sett × ${exercise.reps || 10} repetisjoner`,
          60,
          dosingTop + 22
        );
        if (exercise.hold_seconds) {
          doc.text(`Hold: ${exercise.hold_seconds} sekunder`, 60, dosingTop + 36);
        }
        doc.text(
          `Frekvens: ${frequencyLabels[exercise.frequency] || exercise.frequency}`,
          170,
          dosingTop + 22
        );

        doc.y = dosingTop + (imageEmbedded ? 110 : 60);

        // Instructions (prefer Norwegian, fallback to English or stored instructions)
        const instructions =
          exercise.instructions_no || exercise.exercise_instructions || exercise.instructions_en;
        if (instructions) {
          doc.fontSize(10).font(fontBold);
          doc.text('Instruksjoner:');
          doc.font(font);
          doc.text(instructions, { align: 'justify' });
          doc.moveDown(0.5);
        }

        // Custom instructions from practitioner
        if (exercise.custom_instructions) {
          doc.fontSize(10).font(fontBold).fillColor('#1e5db8');
          doc.text('Fra din behandler:');
          doc.font(font);
          doc.text(exercise.custom_instructions, { align: 'justify' });
          doc.fillColor('#000000');
          doc.moveDown(0.5);
        }

        // Precautions
        if (exercise.precautions) {
          doc.fontSize(9).font(fontBold).fillColor('#b86e00');
          doc.text('Forsiktighetsregler: ', { continued: true });
          doc.font(font);
          doc.text(exercise.precautions);
          doc.fillColor('#000000');
          doc.moveDown(0.3);
        }

        // Contraindications
        if (exercise.contraindications) {
          doc.fontSize(9).font(fontBold).fillColor('#b82e2e');
          doc.text('Kontraindikasjoner: ', { continued: true });
          doc.font(font);
          doc.text(exercise.contraindications);
          doc.fillColor('#000000');
          doc.moveDown(0.3);
        }

        // Video link if available
        if (exercise.video_url) {
          doc.fontSize(9).fillColor('#0066cc');
          doc.text('Se video: ', { continued: true });
          doc.text(exercise.video_url, { link: exercise.video_url, underline: true });
          doc.fillColor('#000000');
        }

        doc.moveDown(1);

        // Separator line
        if (index < exercises.length - 1) {
          doc.moveTo(50, doc.y).lineTo(545, doc.y).dash(3, { space: 3 }).stroke();
          doc.undash();
          doc.moveDown(0.5);
        }
      }
    }

    // Tracking table
    if (exercises.length > 0) {
      if (doc.y > 500) {
        doc.addPage();
      }

      doc.moveDown(1);
      doc.fontSize(12).font(fontBold);
      doc.text('Ukentlig oppfølgingsskjema', { align: 'center' });
      doc.moveDown(0.5);

      // Create a simple tracking grid
      const tableTop = doc.y;
      const cellWidth = 28;
      const rowHeight = 25;
      const days = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

      // Header row
      doc.rect(50, tableTop, 170, rowHeight).fill('#f0f0f0');
      doc.fillColor('#000000').fontSize(9).font(fontBold);
      doc.text('Øvelse', 55, tableTop + 8);

      days.forEach((day, i) => {
        doc.rect(220 + i * cellWidth, tableTop, cellWidth, rowHeight).stroke();
        doc.text(day, 223 + i * cellWidth, tableTop + 8, { width: cellWidth - 6, align: 'center' });
      });

      // Exercise rows (max 8 to fit on page)
      const maxRows = Math.min(exercises.length, 8);
      for (let i = 0; i < maxRows; i++) {
        const rowY = tableTop + rowHeight + i * rowHeight;
        doc.rect(50, rowY, 170, rowHeight).stroke();
        doc.font(font).fontSize(8);

        // Truncate exercise name if too long
        let name = exercises[i].exercise_name;
        if (name.length > 25) {
          name = `${name.substring(0, 22)}...`;
        }
        doc.text(name, 55, rowY + 8, { width: 160 });

        // Day cells
        days.forEach((_, j) => {
          doc.rect(220 + j * cellWidth, rowY, cellWidth, rowHeight).stroke();
        });
      }

      doc.y = tableTop + rowHeight + maxRows * rowHeight + 10;
    }

    // Footer instructions
    doc.moveDown(1);
    doc.fontSize(9).font(font).fillColor('#666666');
    doc.text('Tips:');
    doc.list(
      [
        'Gjør øvelsene som vist av behandleren din',
        'Stopp hvis du opplever økt smerte',
        'Marker av når du har gjennomført øvelsene',
        'Ta med dette skjemaet til neste konsultasjon',
      ],
      { bulletRadius: 2, textIndent: 15 }
    );

    doc.fillColor('#000000');

    // Convert to buffer
    const pdfBuffer = await docToBuffer(doc);

    logger.info(`Generated exercise handout PDF for patient ${patientId}`, {
      size: pdfBuffer.length,
      exerciseCount: exercises.length,
    });

    return {
      buffer: pdfBuffer,
      contentType: 'application/pdf',
      filename: `Ovelsesprogram_${patient.last_name}_${formatNorwegianDate(new Date()).replace(/\./g, '-')}.pdf`,
      patientId,
      exerciseCount: exercises.length,
    };
  } catch (error) {
    logger.error('Error generating exercise handout:', error);
    throw error;
  }
};
