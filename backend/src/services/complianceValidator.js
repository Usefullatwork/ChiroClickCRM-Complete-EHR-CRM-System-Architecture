/**
 * Compliance Validator
 *
 * Validates PII redaction before Claude API calls and ensures
 * required disclaimers are present in AI-generated responses.
 * Required for Norwegian GDPR (Personopplysningsloven) compliance
 * when sending data to cloud APIs.
 */

import logger from '../utils/logger.js';

/**
 * Norwegian PII patterns to detect and redact
 */
const PII_PATTERNS = [
  { name: 'fodselsnummer', pattern: /\b\d{6}\s?\d{5}\b/g, replacement: '[FØDSELSNUMMER FJERNET]' },
  { name: 'phone', pattern: /\b(?:\+47\s?)?[49]\d{7}\b/g, replacement: '[TELEFON FJERNET]' },
  {
    name: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[E-POST FJERNET]',
  },
  {
    name: 'address',
    pattern: /\b\d{4}\s+[A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)*\b/g,
    replacement: '[ADRESSE FJERNET]',
  },
  {
    name: 'bankAccount',
    pattern: /\b\d{4}\s?\d{2}\s?\d{5}\b/g,
    replacement: '[KONTONUMMER FJERNET]',
  },
];

/**
 * Required disclaimer for AI-generated clinical content
 */
const CLINICAL_DISCLAIMER = {
  no: 'AI-generert innhold — må vurderes og godkjennes av kvalifisert helsepersonell før klinisk bruk.',
  en: 'AI-generated content — must be reviewed and approved by qualified healthcare professional before clinical use.',
};

/**
 * Validate and redact PII from text before sending to cloud API.
 * Returns { cleanText, redacted, redactedItems }
 */
export function redactPII(text) {
  if (!text || typeof text !== 'string')
    return { cleanText: text, redacted: false, redactedItems: [] };

  let cleanText = text;
  const redactedItems = [];

  for (const { name, pattern, replacement } of PII_PATTERNS) {
    const matches = cleanText.match(pattern);
    if (matches) {
      redactedItems.push({ type: name, count: matches.length });
      cleanText = cleanText.replace(pattern, replacement);
    }
  }

  const redacted = redactedItems.length > 0;
  if (redacted) {
    logger.info('PII redacted before cloud API call', {
      itemCount: redactedItems.reduce((sum, i) => sum + i.count, 0),
      types: redactedItems.map((i) => i.type),
    });
  }

  return { cleanText, redacted, redactedItems };
}

/**
 * Validate that a prompt is safe to send to a cloud API.
 * Returns { valid, issues }
 */
export function validateForCloudAPI(text) {
  const issues = [];

  if (!text || typeof text !== 'string') {
    issues.push('Empty or invalid text');
    return { valid: false, issues };
  }

  // Check for PII that should have been redacted
  const { redactedItems } = redactPII(text);
  if (redactedItems.length > 0) {
    issues.push(
      `Contains ${redactedItems.length} PII types: ${redactedItems.map((i) => i.type).join(', ')}`
    );
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Add required disclaimer to AI-generated response
 */
export function addDisclaimer(text, language = 'no') {
  if (!text) return text;
  const disclaimer = CLINICAL_DISCLAIMER[language] || CLINICAL_DISCLAIMER.no;
  return `${text}\n\n---\n${disclaimer}`;
}

/**
 * Full compliance pipeline: validate → redact → return clean text
 */
export function ensureCompliance(text, options = {}) {
  const { autoRedact = true, requireDisclaimer = false, language = 'no' } = options;

  const validation = validateForCloudAPI(text);

  if (!validation.valid && autoRedact) {
    const { cleanText, redactedItems } = redactPII(text);
    return {
      text: cleanText,
      compliant: true,
      autoRedacted: true,
      redactedItems,
    };
  }

  return {
    text,
    compliant: validation.valid,
    autoRedacted: false,
    issues: validation.issues,
  };
}

export { PII_PATTERNS, CLINICAL_DISCLAIMER };
