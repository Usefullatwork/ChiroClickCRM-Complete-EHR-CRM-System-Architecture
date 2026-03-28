/**
 * Shared PDF utility functions used by both pdf.js and pdfGenerator.js.
 *
 * Provides: font management, document creation/buffering, formatters,
 * reusable drawing helpers, and Norwegian text constants.
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import logger from '../../utils/logger.js';

// ── Norwegian text constants ──────────────────────────────────────────
export const TEXT = {
  TREATMENT_SUMMARY: 'Behandlingssammendrag',
  REFERRAL_LETTER: 'Henvisning',
  SICK_NOTE: 'Sykmelding',
  INVOICE: 'Faktura',
  PATIENT: 'Pasient',
  DOB: 'F\u00f8dselsdato',
  DIAGNOSIS: 'Diagnose',
  CLINICAL_FINDINGS: 'Kliniske funn',
  ASSESSMENT: 'Vurdering',
  PLAN: 'Plan',
  DATE: 'Dato',
  PAGE: 'Side',
  SUBJECTIVE: 'Subjektivt',
  OBJECTIVE: 'Objektivt',
  CHIEF_COMPLAINT: 'Hovedplage',
  HISTORY: 'Sykehistorie',
  OBSERVATION: 'Observasjon',
  PALPATION: 'Palpasjon',
  ROM: 'Bevegelighet (ROM)',
  ORTHO_TESTS: 'Ortopediske tester',
  NEURO_TESTS: 'Nevrologiske tester',
  PROGNOSIS: 'Prognose',
  TREATMENT: 'Behandling',
  EXERCISES: '\u00d8velser',
  ADVICE: 'R\u00e5d',
  FOLLOWUP: 'Oppf\u00f8lging',
  ENCOUNTER_HISTORY: 'Konsultasjonshistorikk',
  OUTCOME_SCORES: 'Utfallsm\u00e5l',
  GENERATED: 'Generert',
  CONTACT: 'Kontakt',
  PHONE: 'Tlf',
  ORG_NR: 'Org.nr',
  HPR_NR: 'HPR-nummer',
  FROM: 'Fra',
  TO: 'Til',
  RE: 'Vedr.',
  REASON_REFERRAL: 'Grunn til henvisning',
  RELEVANT_FINDINGS: 'Relevante funn',
  DURATION: 'Varighet',
  WORK_RESTRICTIONS: 'Arbeidsrestriksjoner',
  FUNCTIONAL_CAPACITY: 'Funksjonsvurdering',
  INVOICE_NR: 'Fakturanr',
  INVOICE_DATE: 'Fakturadato',
  DUE_DATE: 'Forfallsdato',
  SUBTOTAL: 'Subtotal',
  VAT: 'MVA',
  TOTAL: 'Totalt',
  AMOUNT_DUE: '\u00c5 betale',
  PAYMENT_INFO: 'Betalingsinformasjon',
  ACCOUNT_NR: 'Kontonummer',
  KID_NR: 'KID-nummer',
  REGARDS: 'Med vennlig hilsen',
  CHIROPRACTOR: 'Kiropraktor',
};

// ── Font management ───────────────────────────────────────────────────

let cachedFontPath = null;
let cachedBoldFontPath = null;
let fontChecked = false;

/**
 * Locate a Unicode-capable font on the system (runs once, caches result).
 */
export function findFont() {
  if (fontChecked) {
    return;
  }
  fontChecked = true;

  const candidates = [
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/calibri.ttf',
    'C:/Windows/Fonts/segoeui.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/System/Library/Fonts/Helvetica.ttc',
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      cachedFontPath = p;
      // Try bold variant
      const boldPaths = [
        p.replace(/\.ttf$/i, 'bd.ttf'),
        p.replace(/\.ttf$/i, '-Bold.ttf'),
        p.replace(/\.ttf$/i, 'b.ttf'),
      ];
      for (const bp of boldPaths) {
        if (fs.existsSync(bp)) {
          cachedBoldFontPath = bp;
          break;
        }
      }
      logger.info(`pdf-utils: Using font ${cachedFontPath}`);
      return;
    }
  }
  logger.warn('pdf-utils: No Unicode font found, Norwegian characters may render incorrectly');
}

/**
 * Return the font name to pass to PDFKit, falling back to Helvetica
 * when no Unicode font was found.
 *
 * @param {boolean} bold - Whether to use the bold variant
 * @returns {string} Font name for doc.font()
 */
export function fontName(bold = false) {
  if (cachedFontPath) {
    return bold ? 'Unicode-Bold' : 'Unicode';
  }
  return bold ? 'Helvetica-Bold' : 'Helvetica';
}

// ── Formatting helpers ────────────────────────────────────────────────

/**
 * Format date as dd.mm.yyyy (Norwegian convention).
 * @param {Date|string} date
 * @returns {string}
 */
export function formatNorwegianDate(date) {
  if (!date) {
    return '';
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

/**
 * Format amount as Norwegian currency: "1 234,50 kr".
 * @param {number|null} amount
 * @returns {string}
 */
export function formatNorwegianCurrency(amount) {
  if (amount === null || amount === undefined) {
    return '0,00 kr';
  }
  const num = Number(amount);
  const parts = num.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${intPart},${parts[1]} kr`;
}

// ── Document helpers ──────────────────────────────────────────────────

/**
 * Create a new A4 PDFDocument with buffered pages and Unicode font registered.
 * @param {string} [title='ChiroClick Dokument'] - PDF metadata title
 * @returns {PDFDocument}
 */
export function createDoc(title = 'ChiroClick Dokument') {
  findFont();

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 60, bottom: 60, left: 50, right: 50 },
    bufferPages: true,
    info: {
      Title: title,
      Author: 'ChiroClick EHR',
      Creator: 'ChiroClick PDF Generator',
    },
  });

  if (cachedFontPath) {
    try {
      doc.registerFont('Unicode', cachedFontPath);
      doc.registerFont('Unicode-Bold', cachedBoldFontPath || cachedFontPath);
    } catch (err) {
      logger.warn(`pdf-utils: Failed to register font: ${err.message}`);
    }
  }

  return doc;
}

/**
 * Finalize a PDFDocument and return its contents as a Buffer.
 * @param {PDFDocument} doc
 * @returns {Promise<Buffer>}
 */
export function docToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

// ── Reusable drawing primitives ───────────────────────────────────────

/**
 * Add header with clinic info to the PDF.
 * @param {PDFDocument} doc
 * @param {Object} clinic - { name, address, phone, email, org_number }
 * @param {string} title - Document title
 */
export function addHeader(doc, clinic, title) {
  const f = fontName(true);
  const fNormal = fontName(false);

  // Clinic name
  doc
    .fontSize(16)
    .font(f)
    .text(clinic.name || 'Klinikk', 50, 30);
  doc.fontSize(9).font(fNormal);
  if (clinic.address) {
    const addr =
      typeof clinic.address === 'object'
        ? [clinic.address.street, clinic.address.postal_code, clinic.address.city]
            .filter(Boolean)
            .join(', ')
        : clinic.address;
    doc.text(addr);
  }
  if (clinic.phone) {
    doc.text(`${TEXT.PHONE}: ${clinic.phone}`);
  }
  if (clinic.email) {
    doc.text(clinic.email);
  }
  if (clinic.org_number) {
    doc.text(`${TEXT.ORG_NR}: ${clinic.org_number}`);
  }

  // Title (right side)
  doc.fontSize(20).font(f).text(title, 300, 30, { width: 245, align: 'right' });

  // Date below title
  doc
    .fontSize(9)
    .font(fNormal)
    .text(`${TEXT.DATE}: ${formatNorwegianDate(new Date())}`, 300, doc.y, {
      width: 245,
      align: 'right',
    });

  // Separator line
  const lineY = Math.max(doc.y + 10, 100);
  doc.moveTo(50, lineY).lineTo(545, lineY).lineWidth(1).stroke('#333333');
  doc.y = lineY + 15;
}

/**
 * Add footer with page numbers and generated date.
 * @param {PDFDocument} doc
 * @param {Object} clinic - { name, phone }
 */
export function addFooter(doc, clinic) {
  const range = doc.bufferedPageRange();
  const totalPages = range.count;

  for (let i = range.start; i < range.start + totalPages; i++) {
    doc.switchToPage(i);

    const bottom = doc.page.height - 40;

    // Footer line
    doc
      .moveTo(50, bottom - 10)
      .lineTo(545, bottom - 10)
      .lineWidth(0.5)
      .stroke('#cccccc');

    doc.fontSize(7).font(fontName(false)).fillColor('#888888');

    // Left: generated date
    doc.text(`${TEXT.GENERATED}: ${formatNorwegianDate(new Date())}`, 50, bottom, {
      width: 200,
      align: 'left',
    });

    // Center: clinic contact
    const contactParts = [
      clinic.name,
      clinic.phone ? `${TEXT.PHONE}: ${clinic.phone}` : null,
    ].filter(Boolean);
    doc.text(contactParts.join(' | '), 200, bottom, { width: 200, align: 'center' });

    // Right: page number
    doc.text(`${TEXT.PAGE} ${i - range.start + 1} / ${totalPages}`, 400, bottom, {
      width: 145,
      align: 'right',
    });
  }

  doc.fillColor('#000000');
}

/**
 * Add patient info block with background.
 * @param {PDFDocument} doc
 * @param {Object} patient - { first_name, last_name, date_of_birth, phone, email, solvit_id }
 */
export function addPatientInfo(doc, patient) {
  const f = fontName(false);
  const fb = fontName(true);
  const top = doc.y;

  doc.rect(50, top, 495, 60).fill('#f5f7fa');
  doc.fillColor('#000000');

  doc
    .fontSize(10)
    .font(fb)
    .text(`${TEXT.PATIENT}:`, 60, top + 8);
  doc.font(f);
  doc.text(`${patient.first_name || ''} ${patient.last_name || ''}`, 120, top + 8);

  doc.font(fb).text(`${TEXT.DOB}:`, 60, top + 22);
  doc.font(f).text(formatNorwegianDate(patient.date_of_birth), 140, top + 22);

  if (patient.phone) {
    doc.font(fb).text(`${TEXT.PHONE}:`, 300, top + 8);
    doc.font(f).text(patient.phone, 330, top + 8);
  }
  if (patient.email) {
    doc.font(fb).text('E-post:', 300, top + 22);
    doc.font(f).text(patient.email, 345, top + 22);
  }

  if (patient.solvit_id) {
    doc.font(fb).text('Pasient-ID:', 60, top + 38);
    doc.font(f).text(patient.solvit_id, 140, top + 38);
  }

  doc.y = top + 70;
  doc.moveDown(0.5);
}

/**
 * Draw a section heading.
 * @param {PDFDocument} doc
 * @param {string} text
 */
export function sectionHeading(doc, text) {
  doc.fontSize(12).font(fontName(true)).fillColor('#1a3c5e');
  doc.text(text);
  doc.moveDown(0.2);
  doc.fillColor('#000000').font(fontName(false)).fontSize(10);
}

/**
 * Draw a labeled value: "Label: Value". Skips if value is falsy.
 * @param {PDFDocument} doc
 * @param {string} label
 * @param {string|number} value
 */
export function labeledValue(doc, label, value) {
  if (!value) {
    return;
  }
  doc.font(fontName(true)).text(`${label}: `, { continued: true });
  doc.font(fontName(false)).text(String(value));
}

/**
 * Check if there is enough space on the current page; if not, add a new page.
 * @param {PDFDocument} doc
 * @param {number} [requiredSpace=100] - vertical space needed in points
 * @returns {boolean} true if a new page was added
 */
export function needsNewPage(doc, requiredSpace = 100) {
  if (doc.y + requiredSpace > doc.page.height - 80) {
    doc.addPage();
    return true;
  }
  return false;
}
