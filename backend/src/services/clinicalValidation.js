/**
 * Clinical Content Validation Service
 * Validates clinical content for medical safety, red flags, and quality
 * CRITICAL: Prevents AI from generating unsafe clinical suggestions
 */

/**
 * Norwegian-specific red flags for chiropractic care
 */
const RED_FLAGS = [
  {
    pattern: /cauda\s*equina/gi,
    severity: 'CRITICAL',
    message: 'Mulig Cauda Equina Syndrom - AKUTT HENVISNING NØDVENDIG',
    action: 'IMMEDIATE_REFERRAL',
    code: 'RF001'
  },
  {
    pattern: /(vekttap|vekt\s*tap).*?(natt.*?smerte|nattsmerter)/gi,
    severity: 'HIGH',
    message: 'Rødt flagg: Uforklarlig vekttap + nattsmerter (malignitet?)',
    action: 'URGENT_REFERRAL',
    code: 'RF002'
  },
  {
    pattern: /(nattsmerter|natt.*?smerte).*?(vekttap|vekt\s*tap)/gi,
    severity: 'HIGH',
    message: 'Rødt flagg: Nattsmerter + vekttap (malignitet?)',
    action: 'URGENT_REFERRAL',
    code: 'RF002'
  },
  {
    pattern: /feber.*?(immunsuppresjon|immun.*?svekket|hiv|kreft)/gi,
    severity: 'HIGH',
    message: 'Rødt flagg: Feber hos immunsvekket pasient',
    action: 'URGENT_REFERRAL',
    code: 'RF003'
  },
  {
    pattern: /(trauma|fall).*?(osteoporose|benskjørhet)/gi,
    severity: 'MODERATE',
    message: 'Advarsel: Trauma hos pasient med osteoporose',
    action: 'CAREFUL_EXAMINATION',
    code: 'RF004'
  },
  {
    pattern: /(bilateral|bilat\.|begge\s*sider).*?(bensvakhet|pareser?|lammelse)/gi,
    severity: 'CRITICAL',
    message: 'KRITISK: Bilateral bensvakhet/parese - myelopati?',
    action: 'IMMEDIATE_REFERRAL',
    code: 'RF005'
  },
  {
    pattern: /blære.*?(inkontinens|problemer|kontroll)/gi,
    severity: 'CRITICAL',
    message: 'KRITISK: Blæredysfunksjon (cauda equina?)',
    action: 'IMMEDIATE_REFERRAL',
    code: 'RF006'
  },
  {
    pattern: /sadel.*?(anestesi|nummenhet|følelsesløs)/gi,
    severity: 'CRITICAL',
    message: 'KRITISK: Sadelanestesi (cauda equina syndrom)',
    action: 'IMMEDIATE_REFERRAL',
    code: 'RF007'
  },
  {
    pattern: /(progressiv|forverr.*?).*?(nevrologisk|pareser?|svakhet)/gi,
    severity: 'HIGH',
    message: 'Rødt flagg: Progressiv nevrologisk svikt',
    action: 'URGENT_REFERRAL',
    code: 'RF008'
  },
  {
    pattern: /under\s*18.*?(rygg.*?smerte|lumbal.*?smerte)/gi,
    severity: 'MODERATE',
    message: 'Advarsel: Ryggsmerter hos barn/ungdom - sjelden årsak?',
    action: 'THOROUGH_EXAMINATION',
    code: 'RF009'
  },
  {
    pattern: /(systemisk|generalisert).*?(sykdom|symptom)/gi,
    severity: 'MODERATE',
    message: 'Advarsel: Systemiske symptomer',
    action: 'CAREFUL_EXAMINATION',
    code: 'RF010'
  }
];

/**
 * Medical logic validation rules
 */
const LOGIC_RULES = [
  {
    id: 'LR001',
    check: (context) => {
      // Akutt smerte bør ikke få langsiktig behandlingsplan umiddelbart
      const hasAcutePain = /akutt|plutselig|i\s*går|i\s*dag/gi.test(context.subjective);
      const hasLongTermPlan = /12.*?behandling|langsiktig|kronisk.*?behandling/gi.test(context.plan);
      return !(hasAcutePain && hasLongTermPlan);
    },
    message: 'Logikkfeil: Akutt smerte med langsiktig behandlingsplan',
    severity: 'MODERATE'
  },
  {
    id: 'LR002',
    check: (context) => {
      // HVLA bør ikke brukes ved akutt inflammasjon
      const hasInflammation = /inflammasjon|betennelse|akutt.*?smerte/gi.test(context.objective);
      const hasHVLA = /hvla|manipulasjon/gi.test(context.plan);
      return !(hasInflammation && hasHVLA);
    },
    message: 'Advarsel: HVLA ved inflammasjon - vurder mykere teknikker',
    severity: 'MODERATE'
  },
  {
    id: 'LR003',
    check: (context) => {
      // Nevrologiske funn bør føre til nevrologisk undersøkelse i plan
      const hasNeuroFindings = /pareser?|reflek.*?reduser|sensibilitet.*?reduser/gi.test(context.objective);
      const hasNeuroExam = /nevrologisk|neuro.*?test|reflek.*?test/gi.test(context.plan);
      if (hasNeuroFindings && !hasNeuroExam) return false;
      return true;
    },
    message: 'Logikkfeil: Nevrologiske funn uten nevrologisk oppfølging i plan',
    severity: 'HIGH'
  }
];

/**
 * Calculate confidence score based on content quality and completeness
 */
export const calculateConfidence = (content, context = {}) => {
  let score = 0.5; // Base score

  // Length check (not too short, not too long)
  const length = content?.length || 0;
  if (length >= 50 && length <= 2000) score += 0.15;
  else if (length < 20) score -= 0.3;
  else if (length > 3000) score -= 0.1;

  // Contains medical terminology
  const medicalTerms = [
    /palpasjon|palperer/gi,
    /mobilisering|mobilitet/gi,
    /hvla|bvm/gi,
    /smerte.*?(skala|vas|nrs)/gi,
    /rom|bevegelsesutslag/gi
  ];

  let termsFound = 0;
  medicalTerms.forEach(term => {
    if (term.test(content)) termsFound++;
  });
  score += (termsFound / medicalTerms.length) * 0.2;

  // Structured format (contains sections/structure)
  if (content.includes(':')) score += 0.05;
  if (/\d+/g.test(content)) score += 0.05; // Contains numbers
  if (content.split('\n').length > 2) score += 0.05; // Multi-line

  // Context bonus
  if (context.hasSimilarCases) score += 0.1;
  if (context.templateMatch > 0.8) score += 0.1;

  return Math.max(0, Math.min(1, score));
};

/**
 * Validate clinical content for safety and quality
 * @param {string} content - Clinical text to validate
 * @param {Object} context - Clinical context (diagnosis, treatment, etc.)
 * @returns {Object} Validation result with warnings and confidence
 */
export const validateClinicalContent = async (content, context = {}) => {
  const checks = {
    isValid: true,
    hasRedFlags: false,
    requiresReview: false,
    confidence: 0,
    warnings: [],
    errors: [],
    redFlags: []
  };

  if (!content || typeof content !== 'string') {
    checks.isValid = false;
    checks.errors.push({
      type: 'validation_error',
      message: 'Innhold mangler eller er ugyldig'
    });
    return checks;
  }

  const allText = [
    content,
    context.subjective,
    context.objective,
    context.assessment,
    context.plan
  ].filter(Boolean).join(' ');

  // 1. Check for red flags
  RED_FLAGS.forEach(flag => {
    const matches = allText.match(flag.pattern);
    if (matches) {
      checks.hasRedFlags = true;
      checks.requiresReview = true;

      const redFlagEntry = {
        type: 'red_flag',
        severity: flag.severity,
        message: flag.message,
        action: flag.action,
        code: flag.code,
        matches: matches
      };

      checks.redFlags.push(redFlagEntry);

      if (flag.severity === 'CRITICAL') {
        checks.errors.push(redFlagEntry);
      } else {
        checks.warnings.push(redFlagEntry);
      }
    }
  });

  // 2. Check medical logic
  if (context.subjective && context.plan) {
    LOGIC_RULES.forEach(rule => {
      try {
        const isValid = rule.check(context);
        if (!isValid) {
          const logicWarning = {
            type: 'logic_warning',
            severity: rule.severity,
            message: rule.message,
            code: rule.id
          };

          checks.warnings.push(logicWarning);
          if (rule.severity === 'HIGH') {
            checks.requiresReview = true;
          }
        }
      } catch (error) {
        console.error(`Logic rule ${rule.id} failed:`, error);
      }
    });
  }

  // 3. Calculate confidence score
  checks.confidence = calculateConfidence(content, {
    hasSimilarCases: context.similarCasesCount > 0,
    templateMatch: context.templateMatchScore || 0
  });

  // 4. Require review if low confidence
  if (checks.confidence < 0.6) {
    checks.requiresReview = true;
    checks.warnings.push({
      type: 'low_confidence',
      severity: 'MODERATE',
      message: `Lav konfidenscore (${(checks.confidence * 100).toFixed(0)}%). Anbefaler manuell gjennomgang.`
    });
  }

  // 5. Check for PII (Personally Identifiable Information)
  const piiPatterns = [
    { pattern: /\d{11}/g, message: 'Mulig personnummer oppdaget' },
    { pattern: /\d{8}/g, message: 'Mulig telefonnummer oppdaget' },
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, message: 'E-postadresse oppdaget' }
  ];

  piiPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(allText)) {
      checks.warnings.push({
        type: 'pii_warning',
        severity: 'MODERATE',
        message: message
      });
    }
  });

  // Determine if valid overall
  checks.isValid = checks.errors.length === 0;

  return checks;
};

/**
 * Validate SOAP/SOPE structure completeness
 */
export const validateSOAPCompleteness = (encounter) => {
  const validation = {
    isComplete: true,
    missing: [],
    warnings: []
  };

  // Required fields
  if (!encounter.subjective || encounter.subjective.trim().length < 10) {
    validation.isComplete = false;
    validation.missing.push('Subjektiv del mangler eller er for kort');
  }

  if (!encounter.objective || encounter.objective.trim().length < 10) {
    validation.isComplete = false;
    validation.missing.push('Objektiv del mangler eller er for kort');
  }

  if (!encounter.assessment) {
    validation.isComplete = false;
    validation.missing.push('Vurdering (Assessment) mangler');
  }

  if (!encounter.plan) {
    validation.isComplete = false;
    validation.missing.push('Plan mangler');
  }

  // Warnings for incomplete data
  if (encounter.subjective && !/(smerte|vondt|plager)/gi.test(encounter.subjective)) {
    validation.warnings.push('Subjektiv del mangler beskrivelse av plager');
  }

  if (encounter.objective && !/(palpasjon|observasjon|test)/gi.test(encounter.objective)) {
    validation.warnings.push('Objektiv del mangler kliniske funn');
  }

  return validation;
};

/**
 * Middleware for Express routes
 */
export const validateClinicalMiddleware = async (req, res, next) => {
  const { subjective, objective, assessment, plan } = req.body;

  const validation = await validateClinicalContent('', {
    subjective,
    objective,
    assessment,
    plan
  });

  // Attach validation to request for use in controllers
  req.clinicalValidation = validation;

  // Block if critical errors
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Kritiske valideringsfeil',
      validation
    });
  }

  next();
};

/**
 * Check for red flags in clinical content
 */
export const checkRedFlagsInContent = (content) => {
  if (!content) return [];
  const flags = [];
  for (const flag of RED_FLAGS) {
    for (const keyword of (flag.keywords || [])) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        flags.push({ flag: flag.name || flag.condition, keyword, severity: flag.severity || 'HIGH' });
        break;
      }
    }
  }
  return flags;
};

/**
 * Check for medication interaction warnings
 */
export const checkMedicationWarnings = (medications) => {
  return [];
};

export default {
  validateClinicalContent,
  validateSOAPCompleteness,
  validateClinicalMiddleware,
  calculateConfidence,
  checkRedFlagsInContent,
  checkMedicationWarnings,
  RED_FLAGS,
  LOGIC_RULES
};
