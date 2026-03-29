/**
 * PDF Generator Service — Barrel re-export
 * Sub-modules: pdfTreatmentSummary.js, pdfReferralLetter.js, pdfSickNote.js
 */

import { formatNorwegianDate, formatNorwegianCurrency } from './pdf-utils.js';

// Re-export formatters for backward compatibility
export { formatNorwegianDate, formatNorwegianCurrency };

export { generateTreatmentSummary } from './pdfTreatmentSummary.js';
export { generateReferralLetter } from './pdfReferralLetter.js';
export { generateSickNote, generateInvoice } from './pdfSickNote.js';

// Default export for backward compatibility
import { generateTreatmentSummary } from './pdfTreatmentSummary.js';
import { generateReferralLetter } from './pdfReferralLetter.js';
import { generateSickNote, generateInvoice } from './pdfSickNote.js';

export default {
  generateTreatmentSummary,
  generateReferralLetter,
  generateSickNote,
  generateInvoice,
  formatNorwegianDate,
  formatNorwegianCurrency,
};
