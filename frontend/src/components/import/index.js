/**
 * Import Components
 *
 * Components for importing patient data from various sources:
 * - CSV files with column mapping
 * - vCard (.vcf) files
 * - Excel files
 * - Google Contacts
 */

export { default as CSVColumnMapper, PATIENT_FIELDS, STANDARD_MAPPINGS, parseCSV, autoDetectMappings } from './CSVColumnMapper';
export { default as ImportWizard, IMPORT_TABS } from './ImportWizard';
export { default as VCardImport, parseVCard, parseVCardEntry, validateContact } from './VCardImport';

// Re-export translations for external use
export { TRANSLATIONS as CSVTranslations } from './CSVColumnMapper';
export { TRANSLATIONS as ImportWizardTranslations } from './ImportWizard';
export { TRANSLATIONS as VCardTranslations } from './VCardImport';
