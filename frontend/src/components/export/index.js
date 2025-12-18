/**
 * Export Components - Norwegian Healthcare Format Export
 *
 * Phase 5 Components:
 * - Norwegian Export Formats (PDF, XML, JSON, CSV)
 * - KITH-inspired XML format
 * - Journal Entry (Journalnotat) templates
 * - ICPC-2 and Takster code formatting
 */

// Norwegian Export Panel
export {
  default as NorwegianExport,
  ExportButton,
  EXPORT_FORMATS,
  EXPORT_TEMPLATES,
} from './NorwegianExport';

// Norwegian Document Templates
export {
  default as NorwegianDocumentTemplates,
  DOCUMENT_TEMPLATES,
  generateDocument,
  formatNorwegianDate,
  formatNorwegianPhone,
  formatPersonnummer,
} from './NorwegianTemplates';
