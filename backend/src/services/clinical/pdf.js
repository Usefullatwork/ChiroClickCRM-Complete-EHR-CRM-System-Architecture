/**
 * PDF Generation Service — SCOPE: Letters, invoices, custom PDFs, exercise handouts.
 * Called via controllers (e.g., pdf.controller.js).
 *
 * NOTE: Treatment summaries, referral letters, and sick notes live in
 * pdfGenerator.js. Both services are consumed via controllers/pdf.js
 * (routes never import services directly).
 *
 * Barrel re-export — all functions split into domain modules:
 *   pdfShared.js    — common drawing helpers (header, patient info, signature)
 *   pdfClinical.js  — patient letters (sick leave, referral, treatment summary, custom)
 *   pdfInvoice.js   — invoice PDF
 *   pdfReport.js    — exercise handout PDF
 */

export { generatePatientLetter, generateCustomPDF } from './pdfClinical.js';
export { generateInvoice } from './pdfInvoice.js';
export { generateExerciseHandout } from './pdfReport.js';

// Re-export shared helpers for any downstream consumer
export {
  fetchImageBuffer,
  drawHeader,
  drawPatientInfo,
  drawSectionHeader,
  drawSignature,
} from './pdfShared.js';

export default {
  generatePatientLetter: (await import('./pdfClinical.js')).generatePatientLetter,
  generateInvoice: (await import('./pdfInvoice.js')).generateInvoice,
  generateCustomPDF: (await import('./pdfClinical.js')).generateCustomPDF,
  generateExerciseHandout: (await import('./pdfReport.js')).generateExerciseHandout,
};
