/**
 * PDF Shared Utilities — Common drawing helpers used across all PDF generators.
 *
 * @module services/clinical/pdfShared
 */

import https from 'https';
import http from 'http';
import { fontName, formatNorwegianDate } from './pdf-utils.js';

/**
 * Fetch image from URL and return as buffer
 * @param {string} url - Image URL
 * @returns {Promise<Buffer|null>} Image buffer or null if failed
 */
export const fetchImageBuffer = async (url) => {
  if (!url) {
    return null;
  }

  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeout = setTimeout(() => {
      resolve(null);
    }, 5000); // 5 second timeout

    protocol
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          clearTimeout(timeout);
          resolve(null);
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          clearTimeout(timeout);
          resolve(Buffer.concat(chunks));
        });
        response.on('error', () => {
          clearTimeout(timeout);
          resolve(null);
        });
      })
      .on('error', () => {
        clearTimeout(timeout);
        resolve(null);
      });
  });
};

/**
 * Draw document header with clinic info
 * @param {PDFDocument} doc - PDF document
 * @param {Object} data - Document data
 * @param {string} title - Document title
 */
export const drawHeader = (doc, data, title) => {
  // Title
  doc.fontSize(20).font(fontName(true)).text(title, { align: 'center' });
  doc.moveDown(0.5);

  // Horizontal line
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);

  // Clinic info (right aligned)
  const _startY = doc.y;
  doc.fontSize(10).font(fontName(false));
  doc.text(data.clinic_name || 'Klinikk', { align: 'right' });
  doc.text(data.clinic_address || '', { align: 'right' });
  if (data.clinic_phone) {
    doc.text(`Tlf: ${data.clinic_phone}`, { align: 'right' });
  }
  if (data.org_number) {
    doc.text(`Org.nr: ${data.org_number}`, { align: 'right' });
  }
  doc.moveDown(0.5);

  // Date
  doc.text(`Dato: ${formatNorwegianDate(new Date())}`, { align: 'right' });
  doc.moveDown(1.5);
};

/**
 * Draw patient info box
 * @param {PDFDocument} doc - PDF document
 * @param {Object} data - Patient data
 */
export const drawPatientInfo = (doc, data) => {
  const boxTop = doc.y;

  // Background box
  doc.rect(50, boxTop, 495, 70).fill('#f5f5f5');

  // Patient info text
  doc.fillColor('#000000').fontSize(10).font(fontName(true));
  doc.text('Pasientinformasjon:', 60, boxTop + 10);
  doc.font(fontName(false));
  doc.text(`Navn: ${data.first_name || ''} ${data.last_name || ''}`, 60, boxTop + 25);
  doc.text(`F\u00f8dselsdato: ${formatNorwegianDate(data.date_of_birth)}`, 60, boxTop + 40);

  const address = [data.address, data.postal_code, data.city].filter(Boolean).join(', ');
  if (address) {
    doc.text(`Adresse: ${address}`, 60, boxTop + 55);
  }

  doc.y = boxTop + 80;
  doc.moveDown(1);
};

/**
 * Draw section header
 * @param {PDFDocument} doc - PDF document
 * @param {string} title - Section title
 */
export const drawSectionHeader = (doc, title) => {
  doc.fontSize(12).font(fontName(true)).fillColor('#333333');
  doc.text(title);
  doc.moveDown(0.3);
  doc.font(fontName(false)).fontSize(10).fillColor('#000000');
};

/**
 * Draw signature section
 * @param {PDFDocument} doc - PDF document
 * @param {Object} data - Practitioner data
 */
export const drawSignature = (doc, data) => {
  doc.moveDown(2);
  doc.fontSize(10).font(fontName(false));
  doc.text('Med vennlig hilsen,');
  doc.moveDown(2);

  // Signature line
  doc.moveTo(50, doc.y).lineTo(200, doc.y).stroke();
  doc.moveDown(0.5);

  doc.font(fontName(true));
  doc.text(data.practitioner_name || 'Behandler');
  doc.font(fontName(false));
  doc.text('Kiropraktor');
  if (data.hpr_number) {
    doc.text(`HPR-nummer: ${data.hpr_number}`);
  }
};
