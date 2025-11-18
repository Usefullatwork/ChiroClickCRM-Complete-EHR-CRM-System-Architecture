/**
 * Training Data Anonymization Service
 * Remove PII from clinical documents for AI training (GDPR compliant)
 */

import logger from '../utils/logger.js';

/**
 * Anonymize Norwegian national ID (personnummer)
 */
const anonymizeNationalId = (text) => {
  // Pattern: 11 digits (DDMMYYXXXXX) with optional spaces
  return text.replace(/\b\d{6}[\s-]?\d{5}\b/g, '[PERSONNUMMER]');
};

/**
 * Anonymize Norwegian phone numbers
 */
const anonymizePhone = (text) => {
  // Norwegian mobile: +47 or 47 followed by 8 digits
  return text
    .replace(/(\+47|47)[\s-]?[4-9]\d{2}[\s-]?\d{2}[\s-]?\d{3}/g, '[TELEFON]')
    .replace(/[4-9]\d{2}[\s-]?\d{2}[\s-]?\d{3}/g, '[TELEFON]');
};

/**
 * Anonymize email addresses
 */
const anonymizeEmail = (text) => {
  return text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EPOST]');
};

/**
 * Anonymize Norwegian addresses
 */
const anonymizeAddress = (text) => {
  // Pattern: Street name + number, postal code + city
  let anonymized = text;

  // Postal codes (4 digits followed by city name)
  anonymized = anonymized.replace(/\b\d{4}\s+[A-ZÆØÅ][a-zæøåA-ZÆØÅ\s-]+/g, '[ADRESSE]');

  // Street addresses (capitalized word(s) followed by numbers)
  anonymized = anonymized.replace(/[A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)*\s+\d+[A-Za-z]?/g, '[GATEADRESSE]');

  return anonymized;
};

/**
 * Anonymize names
 * Uses a list of common Norwegian names
 */
const anonymizeNames = (text, knownNames = []) => {
  let anonymized = text;

  // Common Norwegian first names
  const commonNorwegianNames = [
    'Ole', 'Jan', 'Per', 'Lars', 'Bjørn', 'Knut', 'Arne', 'Svein', 'Kjell', 'Hans',
    'Eva', 'Anne', 'Kari', 'Marit', 'Ingrid', 'Liv', 'Solveig', 'Astrid', 'Gerd', 'Hilde',
    'Maria', 'Nora', 'Emma', 'Sofia', 'Maja', 'Ella', 'Olivia', 'Sofie', 'Emilie', 'Leah',
    'Lucas', 'Emil', 'Oliver', 'Filip', 'Noah', 'William', 'Aksel', 'Oskar', 'Kasper', 'Mathias'
  ];

  // Merge with known patient names
  const allNames = [...new Set([...commonNorwegianNames, ...knownNames])];

  // Replace names (case-insensitive)
  allNames.forEach(name => {
    const regex = new RegExp(`\\b${name}\\b`, 'gi');
    anonymized = anonymized.replace(regex, '[NAVN]');
  });

  return anonymized;
};

/**
 * Anonymize dates (keep format for temporal patterns but remove specificity)
 */
const anonymizeDates = (text, mode = 'replace') => {
  if (mode === 'replace') {
    // Replace specific dates with placeholder
    return text
      .replace(/\b\d{1,2}[./]\d{1,2}[./]\d{4}\b/g, '[DATO]')
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '[DATO]');
  } else if (mode === 'generalize') {
    // Keep year and month, remove day
    return text
      .replace(/\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b/g, (match, day, month, year) => `XX.${month}.${year}`)
      .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (match, year, month, day) => `${year}-${month}-XX`);
  }
  return text;
};

/**
 * Anonymize ages (replace exact ages with age ranges)
 */
const anonymizeAges = (text) => {
  return text.replace(/\b(\d{1,3})\s*år\b/gi, (match, age) => {
    const ageNum = parseInt(age);
    if (ageNum < 18) return '[ALDER: BARN]';
    if (ageNum < 30) return '[ALDER: 18-30]';
    if (ageNum < 50) return '[ALDER: 30-50]';
    if (ageNum < 70) return '[ALDER: 50-70]';
    return '[ALDER: 70+]';
  });
};

/**
 * Remove patient identifiers from SOAP notes
 */
export const anonymizeSOAPNote = (soapNote, options = {}) => {
  const {
    preserveDates = false,
    knownPatientNames = [],
    aggressive = false
  } = options;

  let anonymized = typeof soapNote === 'string' ? soapNote : JSON.stringify(soapNote);

  // Always remove these
  anonymized = anonymizeNationalId(anonymized);
  anonymized = anonymizePhone(anonymized);
  anonymized = anonymizeEmail(anonymized);
  anonymized = anonymizeAddress(anonymized);

  // Optional: dates
  if (!preserveDates) {
    anonymized = anonymizeDates(anonymized, aggressive ? 'replace' : 'generalize');
  }

  // Names
  anonymized = anonymizeNames(anonymized, knownPatientNames);

  // Ages (generalize to ranges)
  anonymized = anonymizeAges(anonymized);

  // Aggressive mode: remove more patterns
  if (aggressive) {
    // Remove any remaining numbers that might be IDs
    anonymized = anonymized.replace(/\b[0-9]{5,}\b/g, '[ID]');

    // Remove URLs
    anonymized = anonymized.replace(/https?:\/\/[^\s]+/g, '[URL]');
  }

  return anonymized;
};

/**
 * Anonymize clinical encounter for training
 */
export const anonymizeEncounter = (encounter) => {
  return {
    encounter_type: encounter.encounter_type,
    subjective: anonymizeSOAPNote(encounter.subjective),
    objective: anonymizeSOAPNote(encounter.objective),
    assessment: anonymizeSOAPNote(encounter.assessment),
    plan: anonymizeSOAPNote(encounter.plan),
    treatment_notes: encounter.treatment_notes ? anonymizeSOAPNote(encounter.treatment_notes) : null,
    // Keep clinical codes (they're not PII)
    diagnosis_codes: encounter.diagnosis_codes,
    treatment_codes: encounter.treatment_codes,
    duration_minutes: encounter.duration_minutes
  };
};

/**
 * Batch anonymize multiple documents
 */
export const batchAnonymize = (documents, options = {}) => {
  const results = [];
  const errors = [];

  documents.forEach((doc, index) => {
    try {
      const anonymized = anonymizeSOAPNote(doc.text || doc.content, options);
      results.push({
        ...doc,
        originalText: undefined, // Remove original
        text: anonymized,
        anonymized: true,
        anonymizedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Error anonymizing document ${index}:`, error);
      errors.push({
        index,
        error: error.message
      });
    }
  });

  return {
    anonymized: results,
    errors,
    total: documents.length,
    success: results.length,
    failed: errors.length
  };
};

/**
 * Create training examples from anonymized clinical notes
 * Format for Ollama fine-tuning
 */
export const createTrainingExamples = (anonymizedEncounters) => {
  const examples = [];

  anonymizedEncounters.forEach(encounter => {
    // Example 1: Subjective -> Objective prediction
    if (encounter.subjective && encounter.objective) {
      examples.push({
        prompt: `Basert på følgende subjektive funn, hva ville du forvente å finne ved objektiv undersøkelse?\n\nSubjektivt: ${encounter.subjective}`,
        response: `Objektivt: ${encounter.objective}`
      });
    }

    // Example 2: Subjective + Objective -> Assessment
    if (encounter.subjective && encounter.objective && encounter.assessment) {
      examples.push({
        prompt: `Gitt følgende funn, hva er din vurdering?\n\nSubjektivt: ${encounter.subjective}\n\nObjektivt: ${encounter.objective}`,
        response: `Vurdering: ${encounter.assessment}`
      });
    }

    // Example 3: SOAP -> Treatment plan
    if (encounter.plan) {
      examples.push({
        prompt: `Basert på følgende journalnotat, hva er behandlingsplanen?\n\nS: ${encounter.subjective}\nO: ${encounter.objective}\nA: ${encounter.assessment}`,
        response: `Plan: ${encounter.plan}`
      });
    }

    // Example 4: Diagnosis code suggestion
    if (encounter.diagnosis_codes && encounter.diagnosis_codes.length > 0) {
      examples.push({
        prompt: `Foreslå passende diagnosekoder (ICPC-2) for følgende:\n\nSubjektivt: ${encounter.subjective}\nObjektivt: ${encounter.objective}`,
        response: `Diagnosekoder: ${encounter.diagnosis_codes.join(', ')}`
      });
    }
  });

  return examples;
};

/**
 * Validate anonymization (ensure no PII remains)
 */
export const validateAnonymization = (text) => {
  const warnings = [];

  // Check for potential PII patterns
  if (/\d{11}/.test(text)) warnings.push('Possible personnummer found');
  if (/\d{8}/.test(text)) warnings.push('Possible phone number found');
  if (/@/.test(text)) warnings.push('Possible email found');
  if (/\d{4}\s+[A-ZÆØÅ]/.test(text)) warnings.push('Possible address found');

  return {
    isClean: warnings.length === 0,
    warnings
  };
};

export default {
  anonymizeSOAPNote,
  anonymizeEncounter,
  batchAnonymize,
  createTrainingExamples,
  validateAnonymization
};
