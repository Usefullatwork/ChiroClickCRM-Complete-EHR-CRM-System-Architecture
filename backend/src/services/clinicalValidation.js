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
    flag: 'cauda_equina',
    category: 'cauda_equina',
    message: 'Mulig Cauda Equina Syndrom - AKUTT HENVISNING NØDVENDIG',
    action: 'IMMEDIATE_REFERRAL',
    code: 'RF001',
  },
  {
    pattern:
      /(vekttap|vekt\s*tap|unexplained\s*weight\s*loss|weight\s*loss).*?(natt.*?smerte|nattsmerter|night\s*pain|nocturnal\s*pain)/gi,
    severity: 'HIGH',
    flag: 'malignancy',
    category: 'malignancy',
    message: 'Rødt flagg: Uforklarlig vekttap + nattsmerter (malignitet?)',
    action: 'URGENT_REFERRAL',
    code: 'RF002',
  },
  {
    pattern:
      /(nattsmerter|natt.*?smerte|night\s*pain|nocturnal\s*pain).*?(vekttap|vekt\s*tap|weight\s*loss)/gi,
    severity: 'HIGH',
    flag: 'malignancy',
    category: 'malignancy',
    message: 'Rødt flagg: Nattsmerter + vekttap (malignitet?)',
    action: 'URGENT_REFERRAL',
    code: 'RF002',
  },
  {
    pattern:
      /(uforklarlig\s*vekttap|unexplained\s*weight\s*loss).*?(nattlige\s*smerter|natt.*?vekker|night.*?wake)/gi,
    severity: 'HIGH',
    flag: 'malignancy',
    category: 'malignancy',
    message: 'Rødt flagg: Uforklarlig vekttap + nattlige smerter (malignitet?)',
    action: 'URGENT_REFERRAL',
    code: 'RF002b',
  },
  {
    pattern: /(nattlige\s*smerter|natt.*?vekker).*?(uforklarlig\s*vekttap)/gi,
    severity: 'HIGH',
    flag: 'malignancy',
    category: 'malignancy',
    message: 'Rødt flagg: Nattlige smerter + uforklarlig vekttap (malignitet?)',
    action: 'URGENT_REFERRAL',
    code: 'RF002c',
  },
  {
    pattern:
      /(feber|fever).*?(immunsuppresjon|immun.*?svekket|immunocompromised|immunosuppressed|hiv|kreft|chemotherapy|cancer)/gi,
    severity: 'HIGH',
    flag: 'infection',
    category: 'infection',
    message: 'Rødt flagg: Feber hos immunsvekket pasient',
    action: 'URGENT_REFERRAL',
    code: 'RF003',
  },
  {
    pattern: /(trauma|fall|accident|ulykke|bilulykke).*?(osteoporose|benskjørhet|osteoporosis)/gi,
    severity: 'MODERATE',
    flag: 'fracture',
    category: 'fracture',
    message: 'Advarsel: Trauma hos pasient med osteoporose',
    action: 'CAREFUL_EXAMINATION',
    code: 'RF004',
  },
  {
    pattern: /(osteoporose|benskjørhet|osteoporosis).*?(trauma|fall|accident|ulykke|bilulykke)/gi,
    severity: 'MODERATE',
    flag: 'fracture',
    category: 'fracture',
    message: 'Advarsel: Osteoporose + trauma (frakturrisiko)',
    action: 'CAREFUL_EXAMINATION',
    code: 'RF004b',
  },
  {
    pattern:
      /(bilateral|bilat\.|begge\s*sider|both\s*legs).*?(bensvakhet|pareser?|lammelse|weakness|svakhet)/gi,
    severity: 'CRITICAL',
    flag: 'neurological',
    category: 'cauda_equina',
    message: 'KRITISK: Bilateral bensvakhet/parese - myelopati?',
    action: 'IMMEDIATE_REFERRAL',
    code: 'RF005',
  },
  {
    pattern:
      /(blæreforstyrr|blære.*?(inkontinens|problemer|kontroll|dysfunksjon)|bladder\s*(dysfunction|disturbance|incontinence|retention)|difficulty\s*urinat)/gi,
    severity: 'CRITICAL',
    flag: 'cauda_equina',
    category: 'cauda_equina',
    message: 'KRITISK: Blæredysfunksjon (cauda equina?)',
    action: 'IMMEDIATE_REFERRAL',
    code: 'RF006',
  },
  {
    pattern: /(sadel|saddle).*?(anestesi|nummenhet|følelsesløs|numbness|anesthesia)/gi,
    severity: 'CRITICAL',
    flag: 'cauda_equina',
    category: 'cauda_equina',
    message: 'KRITISK: Sadelanestesi (cauda equina syndrom)',
    action: 'IMMEDIATE_REFERRAL',
    code: 'RF007',
  },
  {
    pattern: /nummenhet\s*mellom\s*bena/gi,
    severity: 'CRITICAL',
    flag: 'cauda_equina',
    category: 'cauda_equina',
    message: 'KRITISK: Nummenhet mellom bena (cauda equina?)',
    action: 'IMMEDIATE_REFERRAL',
    code: 'RF007b',
  },
  {
    pattern:
      /(progressiv|progressive|forverr.*?).*?(nevrologisk|neurological|pareser?|svakhet|weakness)/gi,
    severity: 'HIGH',
    flag: 'neurological',
    category: 'neurological',
    message: 'Rødt flagg: Progressiv nevrologisk svikt',
    action: 'URGENT_REFERRAL',
    code: 'RF008',
  },
  {
    pattern: /(hyperreflexia|hyperrefleksi).*?(weakness|svakhet|paresis|parese)/gi,
    severity: 'HIGH',
    flag: 'neurological',
    category: 'neurological',
    message: 'Rødt flagg: Hyperrefleksi med svakhet - myelopati?',
    action: 'URGENT_REFERRAL',
    code: 'RF008b',
  },
  {
    pattern: /(weakness|svakhet|paresis|parese).*?(hyperreflexia|hyperrefleksi)/gi,
    severity: 'HIGH',
    flag: 'neurological',
    category: 'neurological',
    message: 'Rødt flagg: Svakhet med hyperrefleksi - myelopati?',
    action: 'URGENT_REFERRAL',
    code: 'RF008c',
  },
  {
    pattern: /under\s*18.*?(rygg.*?smerte|lumbal.*?smerte)/gi,
    severity: 'MODERATE',
    flag: 'pediatric',
    category: 'pediatric',
    message: 'Advarsel: Ryggsmerter hos barn/ungdom - sjelden årsak?',
    action: 'THOROUGH_EXAMINATION',
    code: 'RF009',
  },
  {
    pattern: /(systemisk|generalisert).*?(sykdom|symptom)/gi,
    severity: 'MODERATE',
    flag: 'systemic',
    category: 'systemic',
    message: 'Advarsel: Systemiske symptomer',
    action: 'CAREFUL_EXAMINATION',
    code: 'RF010',
  },
  {
    pattern: /(morning\s*stiffness|morgenstivhet).*?(improv|bedre|activity|aktivitet)/gi,
    severity: 'MODERATE',
    flag: 'inflammatory',
    category: 'inflammatory',
    message: 'Rødt flagg: Morgenstivhet som bedres med aktivitet (inflammatorisk?)',
    action: 'CAREFUL_EXAMINATION',
    code: 'RF011',
  },
  {
    pattern: /sadel-?nummenhet/gi,
    severity: 'CRITICAL',
    flag: 'cauda_equina',
    category: 'cauda_equina',
    message: 'KRITISK: Sadel-nummenhet (cauda equina syndrom)',
    action: 'IMMEDIATE_REFERRAL',
    code: 'RF012',
  },
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
      const hasLongTermPlan = /12.*?behandling|langsiktig|kronisk.*?behandling/gi.test(
        context.plan
      );
      return !(hasAcutePain && hasLongTermPlan);
    },
    message: 'Logikkfeil: Akutt smerte med langsiktig behandlingsplan',
    severity: 'MODERATE',
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
    severity: 'MODERATE',
  },
  {
    id: 'LR003',
    check: (context) => {
      // Nevrologiske funn bør føre til nevrologisk undersøkelse i plan
      const hasNeuroFindings = /pareser?|reflek.*?reduser|sensibilitet.*?reduser/gi.test(
        context.objective
      );
      const hasNeuroExam = /nevrologisk|neuro.*?test|reflek.*?test/gi.test(context.plan);
      if (hasNeuroFindings && !hasNeuroExam) return false;
      return true;
    },
    message: 'Logikkfeil: Nevrologiske funn uten nevrologisk oppfølging i plan',
    severity: 'HIGH',
  },
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

  // Contains medical terminology (Norwegian and English)
  const medicalTerms = [
    /palpasjon|palperer|palpation/gi,
    /mobilisering|mobilitet|mobilization/gi,
    /hvla|bvm|manipulation/gi,
    /smerte.*?(skala|vas|nrs)|pain.*?(scale|score)/gi,
    /rom\b|bevegelsesutslag|range\s*of\s*motion/gi,
    /pasient|patient/gi,
    /nakke|cervical|neck/gi,
  ];

  let termsFound = 0;
  medicalTerms.forEach((term) => {
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
    canProceed: true,
    riskLevel: 'LOW',
    confidence: 0,
    warnings: [],
    errors: [],
    redFlags: [],
  };

  if (!content || typeof content !== 'string') {
    checks.isValid = false;
    checks.errors.push({
      type: 'validation_error',
      message: 'Innhold mangler eller er ugyldig',
    });
    return checks;
  }

  const allText = [content, context.subjective, context.objective, context.assessment, context.plan]
    .filter(Boolean)
    .join(' ');

  // 1. Check for red flags
  RED_FLAGS.forEach((flagDef) => {
    const matches = allText.match(flagDef.pattern);
    if (matches) {
      checks.hasRedFlags = true;
      checks.requiresReview = true;

      const redFlagEntry = {
        type: 'red_flag',
        flag: flagDef.flag,
        category: flagDef.category,
        severity: flagDef.severity,
        message: flagDef.message,
        action: flagDef.action,
        code: flagDef.code,
        matches: matches,
      };

      checks.redFlags.push(redFlagEntry);

      if (flagDef.severity === 'CRITICAL') {
        checks.errors.push(redFlagEntry);
      } else {
        checks.warnings.push(redFlagEntry);
      }
    }
  });

  // Determine risk level based on red flags
  if (checks.redFlags.some((rf) => rf.severity === 'CRITICAL')) {
    checks.riskLevel = 'CRITICAL';
    checks.canProceed = false;
  } else if (checks.redFlags.some((rf) => rf.severity === 'HIGH')) {
    checks.riskLevel = 'HIGH';
    checks.canProceed = false;
  } else if (checks.redFlags.some((rf) => rf.severity === 'MODERATE')) {
    checks.riskLevel = 'MODERATE';
  }

  // 2. Check medical logic
  if (context.subjective && context.plan) {
    LOGIC_RULES.forEach((rule) => {
      try {
        const isValid = rule.check(context);
        if (!isValid) {
          const logicWarning = {
            type: 'logic_warning',
            severity: rule.severity,
            message: rule.message,
            code: rule.id,
          };

          checks.warnings.push(logicWarning);
          if (rule.severity === 'HIGH') {
            checks.requiresReview = true;
          }
        }
      } catch (error) {
        // Logic rule evaluation failed silently - non-critical
      }
    });
  }

  // 3. Calculate confidence score
  checks.confidence = calculateConfidence(content, {
    hasSimilarCases: context.similarCasesCount > 0,
    templateMatch: context.templateMatchScore || 0,
  });

  // Reduce confidence when red flags are present
  if (checks.riskLevel === 'CRITICAL') {
    checks.confidence = Math.min(checks.confidence, 0.3);
  } else if (checks.riskLevel === 'HIGH') {
    checks.confidence = Math.min(checks.confidence, 0.5);
  }

  // 3b. Check medication warnings from patient context
  if (context.patient?.current_medications?.length > 0) {
    const medWarnings = checkMedicationWarnings(context.patient.current_medications);
    if (medWarnings.length > 0) {
      checks.requiresReview = true;
      checks.warnings.push(...medWarnings);
    }
  }

  // 3c. Check patient red flags from context
  if (context.patient?.red_flags?.length > 0) {
    checks.requiresReview = true;
    context.patient.red_flags.forEach((rf) => {
      checks.warnings.push({
        type: 'patient_red_flag',
        severity: 'HIGH',
        message: `Patient red flag: ${rf}`,
      });
    });
  }

  // 4. Require review if low confidence
  if (checks.confidence < 0.6) {
    checks.requiresReview = true;
    checks.warnings.push({
      type: 'low_confidence',
      severity: 'MODERATE',
      message: `Lav konfidenscore (${(checks.confidence * 100).toFixed(0)}%). Anbefaler manuell gjennomgang.`,
    });
  }

  // 5. Check for PII (Personally Identifiable Information)
  const piiPatterns = [
    { pattern: /\d{11}/g, message: 'Mulig personnummer oppdaget' },
    { pattern: /\d{8}/g, message: 'Mulig telefonnummer oppdaget' },
    {
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      message: 'E-postadresse oppdaget',
    },
  ];

  piiPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(allText)) {
      checks.warnings.push({
        type: 'pii_warning',
        severity: 'MODERATE',
        message: message,
      });
    }
  });

  // Determine if valid overall
  checks.isValid = checks.errors.length === 0;

  // canProceed is false when there are critical errors or critical risk level
  if (checks.errors.length > 0 || checks.riskLevel === 'CRITICAL' || checks.riskLevel === 'HIGH') {
    checks.canProceed = false;
  }

  return checks;
};

/**
 * Validate SOAP/SOPE structure completeness
 */
export const validateSOAPCompleteness = (encounter) => {
  const validation = {
    isComplete: true,
    missing: [],
    warnings: [],
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
    plan,
  });

  // Attach validation to request for use in controllers
  req.clinicalValidation = validation;

  // Block if critical errors
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Kritiske valideringsfeil',
      validation,
    });
  }

  next();
};

/**
 * Check content for red flags only
 * @param {string} content - Content to check
 * @returns {Array} Array of detected red flags
 */
export const checkRedFlagsInContent = (content) => {
  if (!content) return [];

  const detectedFlags = [];

  RED_FLAGS.forEach((flagDef) => {
    const matches = content.match(flagDef.pattern);
    if (matches) {
      detectedFlags.push({
        flag: flagDef.flag,
        category: flagDef.category,
        severity: flagDef.severity,
        message: flagDef.message,
        action: flagDef.action,
        code: flagDef.code,
        matches: matches,
      });
    }
  });

  return detectedFlags;
};

/**
 * Medication warnings - checks for medication-related red flags
 * Accepts either (medications) or (content, medications) for backwards compatibility
 * @param {string|Array} contentOrMedications - Content string or medications array
 * @param {Array} [medicationsArg] - Patient's current medications (when first arg is content)
 * @returns {Array} Array of medication warnings
 */
export const checkMedicationWarnings = (contentOrMedications, medicationsArg) => {
  let content = '';
  let medications = [];

  // Support both signatures: (medications) and (content, medications)
  if (Array.isArray(contentOrMedications)) {
    medications = contentOrMedications;
  } else {
    content = contentOrMedications || '';
    medications = medicationsArg || [];
  }

  const warnings = [];

  // Check for anticoagulants (blood thinners)
  const anticoagulants = [
    'warfarin',
    'marevan',
    'eliquis',
    'xarelto',
    'pradaxa',
    'klexane',
    'fragmin',
    'aspirin',
    'albyl',
    'heparin',
    'plavix',
    'clopidogrel',
  ];

  if (medications.some((med) => anticoagulants.some((ac) => med.toLowerCase().includes(ac)))) {
    warnings.push({
      type: 'medication_warning',
      category: 'anticoagulants',
      severity: 'HIGH',
      message: 'Advarsel: Pasient på blodfortynnende/antikoagulant - forsiktighet med manipulasjon',
      action: 'CAUTION',
      contraindications: ['HVLA', 'aggressive soft tissue techniques'],
    });
  }

  // Check for steroid use
  const steroids = ['prednisolon', 'kortison', 'prednison', 'dexamethason', 'prednisolone'];
  if (medications.some((med) => steroids.some((s) => med.toLowerCase().includes(s)))) {
    warnings.push({
      type: 'medication_note',
      category: 'steroids',
      severity: 'MODERATE',
      message: 'Pasient bruker steroider - vær oppmerksom på benvev og bløtvev',
      action: 'NOTE',
      contraindications: ['HVLA on osteoporotic segments'],
    });
  }

  // Check for bisphosphonates (osteoporosis medications)
  const bisphosphonates = [
    'fosamax',
    'alendronate',
    'alendronat',
    'risedronate',
    'risedronat',
    'zoledronic',
    'zoledronsyre',
    'ibandronate',
    'ibandronat',
    'bonviva',
    'actonel',
  ];
  if (medications.some((med) => bisphosphonates.some((bp) => med.toLowerCase().includes(bp)))) {
    warnings.push({
      type: 'medication_warning',
      category: 'bisphosphonates',
      severity: 'MODERATE',
      message:
        'Pasient bruker bisfosfonater - indikerer osteoporose, forsiktighet med manipulasjon',
      action: 'CAUTION',
      contraindications: ['HVLA', 'forceful adjustments'],
    });
  }

  return warnings;
};

/**
 * Validate medical logic for treatment-diagnosis pairing
 */
export const validateMedicalLogic = (diagnosisCode, treatment, context = {}) => {
  const errors = [];
  const recommendations = [];
  let valid = true;

  const contraindications = context.patient?.contraindications || [];
  const redFlags = context.patient?.red_flags || [];

  // Check contraindications for cervical HVLA
  if (treatment === 'HVLA_cervical' && contraindications.some((c) => /myelopathy/i.test(c))) {
    errors.push({
      type: 'contraindication',
      message: 'Cervical myelopathy is a contraindication for HVLA',
    });
    valid = false;
  }

  // Check red flags
  if (redFlags.some((f) => /cauda equina/i.test(f))) {
    errors.push({
      type: 'red_flag',
      message: 'Cauda equina suspected - refer for emergency evaluation',
    });
    valid = false;
  }

  // Add exercise recommendations
  if (treatment === 'exercise') {
    recommendations.push({ recommended: 'exercise therapy', evidence: 'Grade A' });
  }

  return { valid, errors, recommendations };
};

/**
 * Check age-related clinical risks
 */
export const checkAgeRelatedRisks = (age, complaint, context = {}) => {
  const warnings = [];

  if (age < 18) {
    warnings.push({
      type: 'PEDIATRIC',
      action: 'PEDIATRIC_PROTOCOL',
      message: 'Pediatric patient - consider age-appropriate assessment',
      severity: 'INFO',
    });
  }

  if (age >= 50 && age < 65) {
    if (complaint && /first\s*episode|first\s*time|new\s*onset|f.rste\s*gang/i.test(complaint)) {
      warnings.push({
        type: 'RED_FLAG',
        action: 'RED_FLAG_SCREENING',
        message: 'First episode after 50 - red flag screening recommended',
        severity: 'MODERATE',
      });
    }
  }

  if (age >= 65) {
    warnings.push({
      type: 'GERIATRIC',
      action: 'GERIATRIC_PROTOCOL',
      message: 'Geriatric patient - consider age-related comorbidities',
      severity: 'WARNING',
    });
    if (complaint && /sudden|acute|new\s*onset|plutselig/i.test(complaint)) {
      warnings.push({
        type: 'RED_FLAG',
        action: 'RED_FLAG_SCREENING',
        message: 'New onset symptoms in elderly - rule out serious pathology',
        severity: 'MODERATE',
      });
    }
  }

  return warnings;
};

export default {
  validateClinicalContent,
  validateSOAPCompleteness,
  validateClinicalMiddleware,
  calculateConfidence,
  checkRedFlagsInContent,
  checkMedicationWarnings,
  checkAgeRelatedRisks,
  validateMedicalLogic,
  RED_FLAGS,
  LOGIC_RULES,
};
