/**
 * Clinical Validation Service
 * Provides AI safety validation, red flag detection, and human-in-the-loop workflows
 * for Norwegian chiropractic practice
 */

import logger from '../utils/logger.js';

// ============================================================================
// RED FLAG PATTERNS (Evidence-based screening criteria)
// ============================================================================

const RED_FLAGS = {
    // Lumbar Red Flags (Cauda Equina Syndrome indicators)
    lumbar: {
        patterns: [
            { pattern: /sadel.*(parestesi|anestesi)/i, severity: 'CRITICAL', description: 'Mulig cauda equina syndrom' },
            { pattern: /bilateral.*(smerter?|symptom)/i, severity: 'HIGH', description: 'Bilaterale symptomer' },
            { pattern: /blære.*(dysfunksjon|inkontinens|retensjon)/i, severity: 'CRITICAL', description: 'Blæredysfunksjon' },
            { pattern: /tarm.*(dysfunksjon|inkontinens)/i, severity: 'CRITICAL', description: 'Tarmdysfunksjon' },
            { pattern: /progres.*(nevrologisk|pareser?|svakhet)/i, severity: 'HIGH', description: 'Progredierende nevrologiske symptomer' },
            { pattern: /gang.*(vansker?|ustabil|ataksi)/i, severity: 'HIGH', description: 'Gangforstyrrelser' }
        ],
        urgentReferralThreshold: 'CRITICAL'
    },

    // Cervical Red Flags (Myelopathy indicators)
    cervical: {
        patterns: [
            { pattern: /l'hermitte/i, severity: 'HIGH', description: 'L\'Hermitte\'s sign positiv' },
            { pattern: /spastis/i, severity: 'HIGH', description: 'Spastisitet' },
            { pattern: /hyperrefleksi/i, severity: 'HIGH', description: 'Hyperrefleksi' },
            { pattern: /babinski.*(positiv|\+)/i, severity: 'HIGH', description: 'Positiv Babinski' },
            { pattern: /clonus/i, severity: 'HIGH', description: 'Clonus tilstede' },
            { pattern: /hoffman.*(positiv|\+)/i, severity: 'MEDIUM', description: 'Positiv Hoffman\'s sign' },
            { pattern: /bilateral.*(pareser?|svakhet|symptom)/i, severity: 'HIGH', description: 'Bilaterale symptomer' }
        ],
        urgentReferralThreshold: 'HIGH'
    },

    // Ottawa Ankle Rules
    ankleOttawa: {
        patterns: [
            { pattern: /malleol.*(ømhet|palp.*smert)/i, severity: 'MEDIUM', description: 'Malleol ømhet' },
            { pattern: /proksimal.*(fibula|tibia).*ømhet/i, severity: 'MEDIUM', description: 'Proksimal fibula/tibia ømhet' },
            { pattern: /5\.\s*metatars.*(ømhet|palp.*smert)/i, severity: 'MEDIUM', description: '5. metatars ømhet' },
            { pattern: /navicular.*(ømhet|palp.*smert)/i, severity: 'MEDIUM', description: 'Naviculare ømhet' },
            { pattern: /ikke.*vektbær/i, severity: 'HIGH', description: 'Ikke vektbærende' }
        ],
        urgentReferralThreshold: 'HIGH'
    },

    // Systemic Red Flags
    systemic: {
        patterns: [
            { pattern: /uforklarlig.*vekttap/i, severity: 'HIGH', description: 'Uforklarlig vekttap' },
            { pattern: /nattsvette/i, severity: 'MEDIUM', description: 'Nattesvette' },
            { pattern: /feber.*uten.*(infeksjon|forklaring)/i, severity: 'HIGH', description: 'Uforklart feber' },
            { pattern: /kreft.*(historikk|tidligere|malign)/i, severity: 'HIGH', description: 'Krefthistorikk' },
            { pattern: /immun.*(svekket|supprimert|kompromittert)/i, severity: 'MEDIUM', description: 'Immunsuppresjon' },
            { pattern: /osteoporose/i, severity: 'MEDIUM', description: 'Osteoporose' },
            { pattern: /steroid.*bruk/i, severity: 'MEDIUM', description: 'Langvarig steroidbruk' },
            { pattern: /iv.*stoffmisbruk/i, severity: 'HIGH', description: 'IV stoffmisbruk' }
        ],
        urgentReferralThreshold: 'HIGH'
    },

    // Cardiac Red Flags (for chest/thoracic pain)
    cardiac: {
        patterns: [
            { pattern: /bryst.*(trykkende|klem|tung)/i, severity: 'CRITICAL', description: 'Trykkende brystsmerter' },
            { pattern: /strål.*(arm|kjeve|skulder)/i, severity: 'HIGH', description: 'Utstråling til arm/kjeve' },
            { pattern: /dyspné|tungpust/i, severity: 'HIGH', description: 'Dyspné' },
            { pattern: /svimmelhet.*bryst/i, severity: 'HIGH', description: 'Svimmelhet med brystsymptomer' },
            { pattern: /synkope/i, severity: 'CRITICAL', description: 'Synkope' },
            { pattern: /palpita/i, severity: 'MEDIUM', description: 'Palpitasjoner' }
        ],
        urgentReferralThreshold: 'CRITICAL'
    },

    // Vascular Red Flags
    vascular: {
        patterns: [
            { pattern: /5d.*(svimmelhet|diplopi|dysartri|dysfagi|drop)/i, severity: 'CRITICAL', description: '5 D\'s positiv' },
            { pattern: /vertebrobasil/i, severity: 'HIGH', description: 'Vertebrobasilær insuffisiens' },
            { pattern: /wallenberg/i, severity: 'CRITICAL', description: 'Wallenberg syndrom symptomer' },
            { pattern: /horner.*(syndrom|tegn)/i, severity: 'HIGH', description: 'Horner\'s syndrom' },
            { pattern: /puls.*(fraværende|asymmetr)/i, severity: 'HIGH', description: 'Pulsforstyrrelser' }
        ],
        urgentReferralThreshold: 'HIGH'
    }
};

// ============================================================================
// CONFIDENCE SCORING
// ============================================================================

const CONFIDENCE_THRESHOLDS = {
    HIGH: 0.85,
    MEDIUM: 0.70,
    LOW: 0.50
};

/**
 * Calculate confidence score for AI suggestion
 * @param {Object} suggestion - AI-generated suggestion
 * @param {Object} context - Clinical context
 * @returns {number} Confidence score between 0 and 1
 */
const calculateConfidenceScore = (suggestion, context = {}) => {
    let score = 0.5; // Base score

    // Increase score for structured input
    if (context.hasStructuredInput) score += 0.1;

    // Increase score for complete SOAP documentation
    if (context.soapCompleteness >= 0.8) score += 0.15;

    // Decrease score for ambiguous terms
    if (suggestion.containsAmbiguity) score -= 0.2;

    // Increase score for matching clinical patterns
    if (context.matchesPatterns) score += 0.1;

    // Decrease score for complex cases
    if (context.isComplexCase) score -= 0.15;

    // Cap between 0 and 1
    return Math.max(0, Math.min(1, score));
};

// ============================================================================
// VALIDATION SERVICE
// ============================================================================

class ClinicalValidationService {
    constructor() {
        this.redFlags = RED_FLAGS;
    }

    /**
     * Validate clinical text for red flags
     * @param {string} text - Clinical text to analyze
     * @param {string} bodyRegion - Body region for context-specific checks
     * @returns {Object} Validation result with findings
     */
    validateClinicalText(text, bodyRegion = null) {
        const findings = [];
        const categoriesChecked = [];

        // Determine which categories to check
        const categoriesToCheck = bodyRegion
            ? [bodyRegion, 'systemic']
            : Object.keys(this.redFlags);

        for (const category of categoriesToCheck) {
            if (!this.redFlags[category]) continue;

            categoriesChecked.push(category);
            const categoryFlags = this.redFlags[category];

            for (const flag of categoryFlags.patterns) {
                if (flag.pattern.test(text)) {
                    findings.push({
                        category,
                        severity: flag.severity,
                        description: flag.description,
                        matchedPattern: flag.pattern.toString(),
                        requiresAction: flag.severity === 'CRITICAL' || flag.severity === 'HIGH'
                    });
                }
            }
        }

        // Determine overall severity
        const hasCritical = findings.some(f => f.severity === 'CRITICAL');
        const hasHigh = findings.some(f => f.severity === 'HIGH');
        const overallSeverity = hasCritical ? 'CRITICAL' : (hasHigh ? 'HIGH' : 'LOW');

        return {
            hasRedFlags: findings.length > 0,
            overallSeverity,
            findings,
            categoriesChecked,
            requiresUrgentAction: hasCritical,
            requiresProviderReview: hasCritical || hasHigh,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Validate AI suggestion with human-in-the-loop workflow
     * @param {Object} suggestion - AI-generated suggestion
     * @param {Object} context - Clinical context
     * @returns {Object} Validated suggestion with review requirements
     */
    async validateAISuggestion(suggestion, context = {}) {
        const confidence = calculateConfidenceScore(suggestion, context);
        const confidenceLevel = confidence >= CONFIDENCE_THRESHOLDS.HIGH ? 'HIGH'
            : confidence >= CONFIDENCE_THRESHOLDS.MEDIUM ? 'MEDIUM' : 'LOW';

        // Check for red flags in the suggestion
        const redFlagCheck = this.validateClinicalText(
            suggestion.text || '',
            context.bodyRegion
        );

        // Determine if human review is required
        const requiresReview =
            confidenceLevel !== 'HIGH' ||
            redFlagCheck.hasRedFlags ||
            context.isFirstTimePatient ||
            context.hasPreExistingConditions;

        const result = {
            originalSuggestion: suggestion,
            validation: {
                confidence,
                confidenceLevel,
                redFlags: redFlagCheck,
                requiresReview,
                reviewReason: this.getReviewReason(confidenceLevel, redFlagCheck, context),
                autoApproved: !requiresReview
            },
            workflow: {
                status: requiresReview ? 'PENDING_REVIEW' : 'AUTO_APPROVED',
                reviewedBy: null,
                reviewedAt: null,
                reviewDecision: null,
                modifiedSuggestion: null
            },
            metadata: {
                validatedAt: new Date().toISOString(),
                aiModel: context.aiModel || 'unknown',
                validationVersion: '1.0'
            }
        };

        // Log for audit
        logger.info('AI suggestion validated', {
            suggestionId: suggestion.id,
            confidence,
            requiresReview,
            hasRedFlags: redFlagCheck.hasRedFlags
        });

        return result;
    }

    /**
     * Get human-readable review reason
     */
    getReviewReason(confidenceLevel, redFlagCheck, context) {
        const reasons = [];

        if (confidenceLevel === 'LOW') {
            reasons.push('Lav AI-konfidens');
        } else if (confidenceLevel === 'MEDIUM') {
            reasons.push('Moderat AI-konfidens');
        }

        if (redFlagCheck.hasRedFlags) {
            reasons.push(`Røde flagg oppdaget: ${redFlagCheck.findings.map(f => f.description).join(', ')}`);
        }

        if (context.isFirstTimePatient) {
            reasons.push('Ny pasient - krever ekstra gjennomgang');
        }

        if (context.hasPreExistingConditions) {
            reasons.push('Eksisterende tilstander krever vurdering');
        }

        return reasons.length > 0 ? reasons.join('; ') : 'Automatisk godkjent';
    }

    /**
     * Record provider review of AI suggestion
     */
    async recordReview(suggestionId, reviewData) {
        const { reviewerId, decision, modifiedText, notes } = reviewData;

        const review = {
            suggestionId,
            reviewerId,
            decision, // 'APPROVE', 'MODIFY', 'REJECT'
            modifiedText: decision === 'MODIFY' ? modifiedText : null,
            notes,
            reviewedAt: new Date().toISOString()
        };

        logger.info('AI suggestion reviewed', {
            suggestionId,
            reviewerId,
            decision
        });

        return review;
    }

    /**
     * Check if treatment plan is appropriate for diagnosis
     */
    validateTreatmentForDiagnosis(diagnosis, treatment, patientContext = {}) {
        const warnings = [];
        const contraindications = [];

        // Example contraindication checks
        if (diagnosis.icd10Code?.startsWith('M54') && treatment.type === 'MANIPULATION') {
            // Check for manipulation contraindications in low back pain
            if (patientContext.hasOsteoporosis) {
                contraindications.push({
                    treatment: 'Manipulasjon',
                    reason: 'Osteoporose er en relativ kontraindikasjon',
                    severity: 'HIGH'
                });
            }

            if (patientContext.isOnAnticoagulants) {
                warnings.push({
                    treatment: 'Manipulasjon',
                    reason: 'Pasient bruker antikoagulantia - vurder blødningsrisiko',
                    severity: 'MEDIUM'
                });
            }
        }

        return {
            isValid: contraindications.length === 0,
            warnings,
            contraindications,
            requiresJustification: contraindications.length > 0
        };
    }

    /**
     * Get body region from clinical text
     */
    detectBodyRegion(text) {
        const regions = {
            cervical: /nakke|cervic|c[1-7]|atlas|axis/i,
            thoracic: /thorak|bryst|t[1-9]|t1[0-2]|ribben/i,
            lumbar: /korsrygg|lumba|l[1-5]|bekken/i,
            ankle: /ankel|fot|malleol/i,
            shoulder: /skulder|rotator|supraspinatus/i,
            knee: /kne|patell|menisk/i
        };

        for (const [region, pattern] of Object.entries(regions)) {
            if (pattern.test(text)) {
                return region;
            }
        }

        return null;
    }
}

// Export singleton instance
export const clinicalValidation = new ClinicalValidationService();

export default clinicalValidation;
