/**
 * Clinical Safety Guardrails Service
 *
 * Implements input validation, output filtering, and safety checks
 * for clinical AI assistance based on:
 * - NeMo Guardrails patterns
 * - CHECK framework for hallucination detection
 * - HIPAA compliance requirements
 *
 * Reference: Clinical LLM safety best practices (2025)
 */

import logger from '../utils/logger.js';

// =============================================================================
// Configuration
// =============================================================================

const GUARDRAILS_CONFIG = {
  // Maximum lengths for various content types
  maxLengths: {
    prompt: 8000, // Max input tokens (approximate)
    response: 4000, // Max output tokens
    patientContext: 2000, // Max patient history context
  },

  // Confidence thresholds for clinical content
  confidenceThresholds: {
    diagnosis: 0.85, // High confidence required for diagnoses
    treatment: 0.8, // Treatment recommendations
    medication: 0.9, // Medication-related content
    referral: 0.75, // Referral suggestions
    general: 0.6, // General clinical text
  },

  // Response time limits (ms)
  timeouts: {
    simple: 5000, // Simple completions
    complex: 15000, // Complex reasoning
    rag: 10000, // RAG-augmented queries
  },
};

// =============================================================================
// Blocked Content Patterns
// =============================================================================

// HIPAA-sensitive patterns that should never appear in outputs
const HIPAA_PATTERNS = [
  // Norwegian personal numbers (fødselsnummer)
  /\b\d{6}\s?\d{5}\b/g,
  // Email addresses (should be redacted)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Phone numbers (Norwegian format)
  /\b(?:\+47\s?)?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\b/g,
  // Credit card numbers
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  // Bank account numbers (Norwegian)
  /\b\d{4}\s?\d{2}\s?\d{5}\b/g,
];

// Dangerous medical content that requires human review
const DANGEROUS_PATTERNS = {
  // Specific diagnoses that should not be made by AI
  diagnoses: [
    /\b(kreft|cancer|malign|tumor)\b/i,
    /\b(hjerneslag|stroke|TIA|hjerneinfarkt)\b/i,
    /\b(hjerteinfarkt|myokardinfarkt|MI)\b/i,
    /\b(meningitt|encephalitt)\b/i,
    /\b(cauda equina|ryggmargsskade)\b/i,
    /\b(aneurysme|aortadisseksjon)\b/i,
    /\b(lungeemboli|DVT|dyp venetrombose)\b/i,
  ],

  // Medication dosages (should be verified)
  medications: [
    /\b\d+\s*(mg|ml|mcg|g|IE)\b/i,
    /\b(morfin|oxycontin|fentanyl|tramadol)\b/i,
    /\b(warfarin|marevan|pradaxa|eliquis)\b/i,
  ],

  // Urgent symptoms requiring immediate action
  redFlags: [
    /\b(akutt|emergency|911|113|legevakt)\b/i,
    /\b(bevisstløs|unconscious|koma)\b/i,
    /\b(pulsløs|hjertestans|cardiac arrest)\b/i,
    /\b(respirasjonssvikt|pustevansker)\b/i,
    /\b(anafylaksi|allergisk sjokk)\b/i,
  ],
};

// Topics outside chiropractic scope
const OUT_OF_SCOPE_PATTERNS = [
  /\b(psykiatrisk|psychiatric|schizophrenia|bipolar)\b/i,
  /\b(selvmord|suicide|suicidal)\b/i,
  /\b(gravid|pregnancy|fødsel)\b/i, // Unless relevant to MSK
  /\b(diabetes|insulin|blodsukker)\b/i,
  /\b(blodtrykk|hypertensjon)\b/i,
];

// =============================================================================
// Input Validation
// =============================================================================

class InputValidator {
  /**
   * Validate and sanitize user input before sending to LLM
   */
  static validate(input, options = {}) {
    const { type = 'general', strict = false } = options;
    const issues = [];
    const warnings = [];
    let sanitized = input;

    // Check length
    const maxLength = GUARDRAILS_CONFIG.maxLengths.prompt;
    if (input.length > maxLength * 4) {
      // Approximate char to token ratio
      issues.push({
        type: 'length',
        message: `Input exceeds maximum length (${input.length} chars)`,
        severity: 'error',
      });
      sanitized = input.substring(0, maxLength * 4);
    }

    // Check for injection attempts
    const injectionPatterns = [
      /ignore\s+(previous|all)\s+instructions/i,
      /system\s*:\s*you\s+are/i,
      /pretend\s+you\s+are/i,
      /act\s+as\s+if/i,
      /disregard\s+your\s+training/i,
      /jailbreak/i,
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(input)) {
        issues.push({
          type: 'injection',
          message: 'Potential prompt injection detected',
          severity: 'error',
        });
        break;
      }
    }

    // Check for HIPAA-sensitive content in prompts
    for (const pattern of HIPAA_PATTERNS) {
      if (pattern.test(input)) {
        warnings.push({
          type: 'hipaa',
          message: 'Input contains potentially sensitive personal information',
          severity: 'warning',
        });
        // Redact sensitive content
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      }
    }

    // Check for out-of-scope requests
    if (strict) {
      for (const pattern of OUT_OF_SCOPE_PATTERNS) {
        if (pattern.test(input)) {
          warnings.push({
            type: 'scope',
            message: 'Request may be outside chiropractic scope',
            severity: 'warning',
          });
          break;
        }
      }
    }

    return {
      valid: issues.length === 0,
      sanitized,
      issues,
      warnings,
      metadata: {
        originalLength: input.length,
        sanitizedLength: sanitized.length,
        type,
      },
    };
  }

  /**
   * Validate clinical context (patient history, etc.)
   */
  static validateContext(context) {
    if (!context) {
      return { valid: true, context: null };
    }

    let sanitizedContext = context;

    // Remove any HIPAA-sensitive data from context
    for (const pattern of HIPAA_PATTERNS) {
      sanitizedContext = sanitizedContext.replace(pattern, '[REDACTED]');
    }

    // Truncate if too long
    const maxLength = GUARDRAILS_CONFIG.maxLengths.patientContext;
    if (sanitizedContext.length > maxLength * 4) {
      sanitizedContext = `${sanitizedContext.substring(0, maxLength * 4)}...[truncated]`;
    }

    return {
      valid: true,
      context: sanitizedContext,
      truncated: sanitizedContext !== context,
    };
  }
}

// =============================================================================
// Output Filtering
// =============================================================================

class OutputFilter {
  /**
   * Filter and validate LLM output before returning to user
   */
  static filter(output, options = {}) {
    const { type = 'general', addDisclaimer = true } = options;
    const flags = [];
    const warnings = [];
    let filtered = output;

    // Redact any HIPAA-sensitive content that leaked through
    for (const pattern of HIPAA_PATTERNS) {
      if (pattern.test(filtered)) {
        filtered = filtered.replace(pattern, '[REDACTED]');
        flags.push({
          type: 'hipaa_leak',
          severity: 'high',
          message: 'Sensitive information redacted from output',
        });
      }
    }

    // Check for dangerous medical content
    for (const [category, patterns] of Object.entries(DANGEROUS_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(filtered)) {
          flags.push({
            type: `dangerous_${category}`,
            severity: 'medium',
            message: `Output contains ${category} content requiring verification`,
            pattern: pattern.toString(),
          });
        }
      }
    }

    // Add appropriate disclaimers based on content type
    if (addDisclaimer && type === 'diagnosis') {
      const disclaimer =
        '\n\n---\n*Denne vurderingen er generert av AI og må verifiseres av behandlende kiropraktor.*';
      if (!filtered.includes(disclaimer)) {
        filtered += disclaimer;
      }
    }

    // Check for hallucination indicators
    const hallucinationIndicators = this.detectHallucinationRisk(filtered);

    return {
      output: filtered,
      flags,
      warnings,
      hallucinationRisk: hallucinationIndicators,
      requiresReview: flags.some((f) => f.severity === 'high'),
      metadata: {
        originalLength: output.length,
        filteredLength: filtered.length,
        type,
      },
    };
  }

  /**
   * Detect potential hallucination indicators (CHECK framework)
   */
  static detectHallucinationRisk(text) {
    const indicators = [];
    let riskScore = 0;

    // Check for overly specific numbers without source
    const specificNumbers = text.match(/\b\d{2,}\s*%\b/g);
    if (specificNumbers && specificNumbers.length > 2) {
      indicators.push('Multiple specific percentages without citation');
      riskScore += 0.2;
    }

    // Check for definitive language about uncertain topics
    const definitivePatterns = [
      /\b(alltid|always|never|aldri)\b/i,
      /\b(garantert|guaranteed|sikkert)\b/i,
      /\b(100%|perfekt|perfect)\b/i,
    ];
    for (const pattern of definitivePatterns) {
      if (pattern.test(text)) {
        indicators.push('Overly definitive language detected');
        riskScore += 0.15;
        break;
      }
    }

    // Check for fabricated references
    const referencePatterns = [
      /\b(studie fra \d{4}|study from \d{4})\b/i,
      /\b(ifølge forskning|according to research)\b/i,
    ];
    for (const pattern of referencePatterns) {
      if (pattern.test(text)) {
        indicators.push('Unverified research claim');
        riskScore += 0.25;
      }
    }

    // Check for inconsistent information
    const contradictions = this.detectContradictions(text);
    if (contradictions.length > 0) {
      indicators.push('Potential self-contradiction');
      riskScore += 0.3;
    }

    return {
      score: Math.min(riskScore, 1.0),
      level: riskScore < 0.3 ? 'low' : riskScore < 0.6 ? 'medium' : 'high',
      indicators,
    };
  }

  /**
   * Detect contradictions within text
   */
  static detectContradictions(text) {
    const contradictions = [];

    // Simple pattern matching for common contradictions
    const contradictionPairs = [
      [/\b(normal|normalt)\b/i, /\b(unormal|abnormal|patologisk)\b/i],
      [/\b(positiv|positive)\b/i, /\b(negativ|negative)\b/i],
      [/\b(høyre|right)\b/i, /\b(venstre|left)\b/i],
      [/\b(økt|increased|elevated)\b/i, /\b(redusert|decreased|reduced)\b/i],
    ];

    // Check sentences for contradicting terms about the same subject
    const sentences = text.split(/[.!?]\s+/);
    for (const sentence of sentences) {
      for (const [pattern1, pattern2] of contradictionPairs) {
        if (pattern1.test(sentence) && pattern2.test(sentence)) {
          contradictions.push({
            sentence,
            patterns: [pattern1.toString(), pattern2.toString()],
          });
        }
      }
    }

    return contradictions;
  }
}

// =============================================================================
// Clinical Heuristics
// =============================================================================

class ClinicalHeuristics {
  /**
   * Check if response is clinically appropriate
   */
  static check(response, context = {}) {
    const { patientAge, chiefComplaint, soapSection } = context;
    const issues = [];

    // Age-appropriate recommendations
    if (patientAge) {
      const ageIssues = this.checkAgeAppropriate(response, patientAge);
      issues.push(...ageIssues);
    }

    // SOAP section consistency
    if (soapSection) {
      const soapIssues = this.checkSOAPConsistency(response, soapSection);
      issues.push(...soapIssues);
    }

    // Red flag recognition
    if (chiefComplaint) {
      const redFlagIssues = this.checkRedFlags(response, chiefComplaint);
      issues.push(...redFlagIssues);
    }

    return {
      appropriate: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
    };
  }

  /**
   * Check age-appropriate content
   */
  static checkAgeAppropriate(response, age) {
    const issues = [];

    // Pediatric considerations (under 18)
    if (age < 18) {
      const adultOnlyPatterns = [
        /\b(hvervelblokkering|spinal manipulation)\b/i,
        /\b(nakkemanipulasjon|cervical manipulation)\b/i,
      ];
      for (const pattern of adultOnlyPatterns) {
        if (pattern.test(response)) {
          issues.push({
            type: 'age_inappropriate',
            message:
              'Response contains techniques that may not be appropriate for pediatric patients',
            severity: 'warning',
          });
        }
      }
    }

    // Geriatric considerations (over 65)
    if (age > 65) {
      const contraindicated = [/\b(høyhastighetsjustering|high-velocity)\b/i];
      for (const pattern of contraindicated) {
        if (pattern.test(response)) {
          issues.push({
            type: 'age_caution',
            message: 'Response contains techniques requiring extra caution in elderly patients',
            severity: 'warning',
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check SOAP section consistency
   */
  static checkSOAPConsistency(response, section) {
    const issues = [];

    const sectionPatterns = {
      Subjective: {
        expected: [/\b(pasient|rapporterer|beskriver|opplever|klager)\b/i],
        unexpected: [/\b(funn|palpasjon|test|diagnose|behandling)\b/i],
      },
      Objective: {
        expected: [/\b(funn|palpasjon|test|ROM|refleks|observert)\b/i],
        unexpected: [/\b(pasient sier|rapporterer|føler)\b/i],
      },
      Assessment: {
        expected: [/\b(vurdering|diagnose|mistanke|differensial)\b/i],
        unexpected: [/\b(behandling|plan|øvelser)\b/i],
      },
      Plan: {
        expected: [/\b(behandling|justering|mobilisering|øvelser|oppfølging)\b/i],
        unexpected: [/\b(diagnose|funn)\b/i],
      },
    };

    const patterns = sectionPatterns[section];
    if (patterns) {
      // Check for unexpected content in section
      for (const pattern of patterns.unexpected || []) {
        if (pattern.test(response)) {
          issues.push({
            type: 'soap_inconsistency',
            message: `Content may be more appropriate for a different SOAP section`,
            severity: 'info',
            section,
          });
          break;
        }
      }
    }

    return issues;
  }

  /**
   * Check for red flag recognition
   */
  static checkRedFlags(response, chiefComplaint) {
    const issues = [];

    // Red flags that should trigger referral mentions
    const redFlagConditions = {
      headache: [
        /thunderclap|tordenvær/i,
        /worst headache|verste hodepine/i,
        /fever.*headache|hodepine.*feber/i,
      ],
      backPain: [
        /cauda equina/i,
        /blære.*tarm|bladder.*bowel/i,
        /saddle|ridebukse/i,
        /bilateral|begge ben/i,
      ],
      neckPain: [/trauma|ulykke|fall/i, /weakness|svakhet/i, /bilateral arm/i],
    };

    // Check if response appropriately addresses red flags
    const lowerComplaint = chiefComplaint.toLowerCase();
    let relevantFlags = [];

    if (lowerComplaint.includes('hodepine') || lowerComplaint.includes('headache')) {
      relevantFlags = redFlagConditions.headache;
    } else if (lowerComplaint.includes('rygg') || lowerComplaint.includes('back')) {
      relevantFlags = redFlagConditions.backPain;
    } else if (lowerComplaint.includes('nakke') || lowerComplaint.includes('neck')) {
      relevantFlags = redFlagConditions.neckPain;
    }

    // If complaint matches red flag patterns, check response mentions them
    for (const pattern of relevantFlags) {
      if (
        pattern.test(chiefComplaint) &&
        !response.includes('røde flagg') &&
        !response.includes('red flag')
      ) {
        issues.push({
          type: 'red_flag_missing',
          message: 'Red flag condition mentioned but not addressed in response',
          severity: 'warning',
        });
        break;
      }
    }

    return issues;
  }
}

// =============================================================================
// Main Guardrails Service
// =============================================================================

class GuardrailsService {
  constructor() {
    this.config = GUARDRAILS_CONFIG;
    this.stats = {
      inputsValidated: 0,
      inputsBlocked: 0,
      outputsFiltered: 0,
      flagsRaised: 0,
    };
  }

  /**
   * Process input through all guardrails
   */
  async processInput(input, options = {}) {
    this.stats.inputsValidated++;

    const validation = InputValidator.validate(input, options);

    if (!validation.valid) {
      this.stats.inputsBlocked++;
      logger.warn('Guardrails blocked input', {
        issues: validation.issues,
        inputLength: input.length,
      });
    }

    const contextValidation = options.context
      ? InputValidator.validateContext(options.context)
      : { valid: true, context: null };

    return {
      ...validation,
      context: contextValidation.context,
      proceed: validation.valid,
    };
  }

  /**
   * Process output through all guardrails
   */
  async processOutput(output, options = {}) {
    this.stats.outputsFiltered++;

    // Filter output
    const filtered = OutputFilter.filter(output, options);

    // Check clinical heuristics if context provided
    let clinicalCheck = { appropriate: true, issues: [] };
    if (options.clinicalContext) {
      clinicalCheck = ClinicalHeuristics.check(filtered.output, options.clinicalContext);
    }

    // Combine all flags
    const allFlags = [...filtered.flags, ...clinicalCheck.issues];
    this.stats.flagsRaised += allFlags.length;

    if (allFlags.length > 0) {
      logger.info('Guardrails raised flags', {
        flags: allFlags.map((f) => f.type),
        outputLength: output.length,
      });
    }

    return {
      output: filtered.output,
      flags: allFlags,
      hallucinationRisk: filtered.hallucinationRisk,
      requiresReview: filtered.requiresReview || !clinicalCheck.appropriate,
      metadata: filtered.metadata,
    };
  }

  /**
   * Full pipeline: validate input, process output
   */
  async pipeline(input, generateFn, options = {}) {
    // Validate input
    const inputResult = await this.processInput(input, options);

    if (!inputResult.proceed) {
      return {
        success: false,
        error: 'Input validation failed',
        issues: inputResult.issues,
        output: null,
      };
    }

    // Generate output (using provided function)
    let rawOutput;
    try {
      rawOutput = await generateFn(inputResult.sanitized, inputResult.context);
    } catch (error) {
      logger.error('Generation failed in guardrails pipeline', { error: error.message });
      return {
        success: false,
        error: 'Generation failed',
        output: null,
      };
    }

    // Filter output
    const outputResult = await this.processOutput(rawOutput, options);

    return {
      success: true,
      output: outputResult.output,
      flags: outputResult.flags,
      hallucinationRisk: outputResult.hallucinationRisk,
      requiresReview: outputResult.requiresReview,
      inputWarnings: inputResult.warnings,
    };
  }

  /**
   * Get guardrails statistics
   */
  getStats() {
    return {
      ...this.stats,
      blockRate:
        this.stats.inputsValidated > 0
          ? `${((this.stats.inputsBlocked / this.stats.inputsValidated) * 100).toFixed(2)}%`
          : '0%',
      flagRate:
        this.stats.outputsFiltered > 0
          ? (this.stats.flagsRaised / this.stats.outputsFiltered).toFixed(2)
          : '0',
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      inputsValidated: 0,
      inputsBlocked: 0,
      outputsFiltered: 0,
      flagsRaised: 0,
    };
  }
}

// Singleton instance
const guardrailsService = new GuardrailsService();

export {
  GuardrailsService,
  guardrailsService,
  InputValidator,
  OutputFilter,
  ClinicalHeuristics,
  GUARDRAILS_CONFIG,
};

// Convenience exports
export const validateInput = (input, options) => InputValidator.validate(input, options);
export const filterOutput = (output, options) => OutputFilter.filter(output, options);
export const checkClinical = (response, context) => ClinicalHeuristics.check(response, context);
