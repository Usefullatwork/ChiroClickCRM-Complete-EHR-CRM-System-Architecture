/**
 * SALT (Same As Last Time) Service
 * Clones last encounter with one click, stripping date-specific content
 * Common pattern in chiropractic practice for follow-up visits
 */

import { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';

// ============================================================================
// DATE-SPECIFIC PATTERNS TO STRIP
// ============================================================================

const DATE_PATTERNS = [
  // Norwegian date formats
  /\b\d{1,2}\.\s?\d{1,2}\.\s?\d{2,4}\b/g, // 01.01.2024, 1.1.24
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // 01/01/2024
  /\b\d{4}-\d{2}-\d{2}\b/g, // 2024-01-01 (ISO)

  // Day names
  /\b(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)\b/gi,
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,

  // Time references
  /\bi dag\b/gi,
  /\bi går\b/gi,
  /\bfor \d+ dager? siden\b/gi,
  /\bsiste \d+ (dag|dager|uke|uker)\b/gi,
  /\bdenne uken?\b/gi,
  /\bforrige uke\b/gi,
  /\bneste uke\b/gi,

  // Specific time references
  /\bkl\.?\s?\d{1,2}[:.]\d{2}\b/gi, // kl. 14:30, kl 14.30
  /\b\d{1,2}[:.]\d{2}\b/g, // 14:30, 14.30
];

// ============================================================================
// CONTENT TO PRESERVE
// ============================================================================

const PRESERVE_PATTERNS = {
  // VAS scores should be preserved as they're clinical data
  vas: /VAS\s*\d+[-/]\d+/gi,

  // ROM measurements
  rom: /\d+°|\d+ grader/gi,

  // Muscle grades
  muscle: /\d\/\d/g, // 5/5, 4/5

  // Reference to body parts with numbers
  vertebrae: /[CTLS]\d+(-\d+)?/gi, // C5, T1-4, L5-S1
};

// ============================================================================
// SALT SERVICE CLASS
// ============================================================================

class SALTService {
  constructor() {
    this.placeholder = '___'; // Placeholder for stripped content
  }

  /**
   * Get last encounter for a patient
   * @param {string} patientId - Patient UUID
   * @param {string} organizationId - Organization UUID
   * @returns {Object|null} Last encounter or null
   */
  async getLastEncounter(patientId, organizationId) {
    const result = await query(
      `
            SELECT
                id,
                encounter_date,
                encounter_type,
                chief_complaint,
                subjective,
                objective,
                assessment,
                plan,
                provider_id,
                diagnoses,
                treatments_performed,
                vitals
            FROM clinical_encounters
            WHERE patient_id = $1
              AND organization_id = $2
              AND is_locked = true
            ORDER BY encounter_date DESC, created_at DESC
            LIMIT 1
        `,
      [patientId, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Clone encounter with SALT functionality
   * @param {string} patientId - Patient UUID
   * @param {string} providerId - Provider UUID
   * @param {Object} options - SALT options
   * @returns {Object} New encounter pre-filled with SALT data
   */
  async cloneEncounter(patientId, providerId, options = {}) {
    const startTime = Date.now();
    const {
      organizationId,
      stripDates = true,
      preserveVitals = false,
      preserveDiagnoses = true,
      preserveTreatments = true,
      customSections = null, // { subjective: true, objective: true, etc. }
    } = options;

    // Get last encounter
    const lastEncounter = await this.getLastEncounter(patientId, organizationId);

    if (!lastEncounter) {
      logger.info('SALT: No previous encounter found', { patientId });
      return null;
    }

    // Determine which sections to include
    const sectionsToClone = customSections || {
      subjective: true,
      objective: true,
      assessment: true,
      plan: true,
    };

    // Build new encounter data
    const newEncounter = {
      patient_id: patientId,
      provider_id: providerId,
      organization_id: organizationId,
      encounter_date: new Date().toISOString().split('T')[0],
      encounter_type: lastEncounter.encounter_type,
      chief_complaint: lastEncounter.chief_complaint,

      // SALT-processed sections
      subjective: sectionsToClone.subjective
        ? this.processSection(lastEncounter.subjective, stripDates)
        : null,
      objective: sectionsToClone.objective
        ? this.processSection(lastEncounter.objective, stripDates)
        : null,
      assessment: sectionsToClone.assessment
        ? this.processSection(lastEncounter.assessment, stripDates)
        : null,
      plan: sectionsToClone.plan ? this.processSection(lastEncounter.plan, stripDates) : null,

      // Metadata
      salt_source_encounter_id: lastEncounter.id,
      is_salt_clone: true,
      is_locked: false,
    };

    // Optionally preserve diagnoses
    if (preserveDiagnoses && lastEncounter.diagnoses) {
      newEncounter.diagnoses = lastEncounter.diagnoses;
    }

    // Optionally preserve treatments
    if (preserveTreatments && lastEncounter.treatments_performed) {
      newEncounter.treatments_performed = lastEncounter.treatments_performed;
    }

    // Optionally preserve vitals (usually you want fresh vitals)
    if (preserveVitals && lastEncounter.vitals) {
      newEncounter.vitals = lastEncounter.vitals;
    }

    const duration = Date.now() - startTime;
    logger.info('SALT encounter cloned', {
      patientId,
      sourceEncounterId: lastEncounter.id,
      duration,
      strippedDates: stripDates,
    });

    return newEncounter;
  }

  /**
   * Process a SOAP section: strip date-specific content while preserving clinical data
   * @param {string} text - Section text
   * @param {boolean} stripDates - Whether to strip dates
   * @returns {string} Processed text
   */
  processSection(text, stripDates = true) {
    if (!text) {
      return null;
    }

    let processed = text;

    if (stripDates) {
      // First, protect clinical measurements
      const protectedSegments = [];
      let protectionIndex = 0;

      // Temporarily replace patterns we want to preserve
      for (const [_name, pattern] of Object.entries(PRESERVE_PATTERNS)) {
        processed = processed.replace(pattern, (match) => {
          const placeholder = `__PRESERVE_${protectionIndex}__`;
          protectedSegments.push({ placeholder, value: match });
          protectionIndex++;
          return placeholder;
        });
      }

      // Strip date-specific content
      for (const pattern of DATE_PATTERNS) {
        processed = processed.replace(pattern, this.placeholder);
      }

      // Restore protected segments
      for (const { placeholder, value } of protectedSegments) {
        processed = processed.replace(placeholder, value);
      }

      // Clean up multiple consecutive placeholders
      processed = processed.replace(
        new RegExp(`(${this.placeholder}\\s*)+`, 'g'),
        `${this.placeholder} `
      );

      // Clean up orphaned placeholders at start/end of sentences
      processed = processed.replace(new RegExp(`^${this.placeholder}\\s*`, 'gm'), '');
      processed = processed.replace(new RegExp(`\\s*${this.placeholder}$`, 'gm'), '');
    }

    return processed.trim();
  }

  /**
   * Create SALT encounter in database
   */
  async createSALTEncounter(patientId, providerId, options) {
    const encounterData = await this.cloneEncounter(patientId, providerId, options);

    if (!encounterData) {
      return null;
    }

    return await transaction(async (client) => {
      const result = await client.query(
        `
                INSERT INTO clinical_encounters (
                    patient_id,
                    provider_id,
                    organization_id,
                    encounter_date,
                    encounter_type,
                    chief_complaint,
                    subjective,
                    objective,
                    assessment,
                    plan,
                    diagnoses,
                    treatments_performed,
                    vitals,
                    salt_source_encounter_id,
                    is_salt_clone,
                    created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $2)
                RETURNING *
            `,
        [
          encounterData.patient_id,
          encounterData.provider_id,
          encounterData.organization_id,
          encounterData.encounter_date,
          encounterData.encounter_type,
          encounterData.chief_complaint,
          encounterData.subjective,
          encounterData.objective,
          encounterData.assessment,
          encounterData.plan,
          JSON.stringify(encounterData.diagnoses),
          JSON.stringify(encounterData.treatments_performed),
          JSON.stringify(encounterData.vitals),
          encounterData.salt_source_encounter_id,
          true,
        ]
      );

      return result.rows[0];
    });
  }

  /**
   * Get SALT preview (without creating)
   */
  async getSALTPreview(patientId, options) {
    const lastEncounter = await this.getLastEncounter(patientId, options.organizationId);

    if (!lastEncounter) {
      return { available: false, reason: 'No previous encounter found' };
    }

    // Calculate days since last visit
    const lastDate = new Date(lastEncounter.encounter_date);
    const daysSince = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));

    return {
      available: true,
      lastEncounter: {
        id: lastEncounter.id,
        date: lastEncounter.encounter_date,
        daysSince,
        type: lastEncounter.encounter_type,
        chiefComplaint: lastEncounter.chief_complaint,
      },
      preview: {
        subjective: this.processSection(lastEncounter.subjective, true)?.substring(0, 200),
        objective: this.processSection(lastEncounter.objective, true)?.substring(0, 200),
        assessment: this.processSection(lastEncounter.assessment, true)?.substring(0, 200),
        plan: this.processSection(lastEncounter.plan, true)?.substring(0, 200),
      },
      warnings: this.getWarnings(daysSince, lastEncounter),
    };
  }

  /**
   * Get warnings about SALT usage
   */
  getWarnings(daysSince, _lastEncounter) {
    const warnings = [];

    if (daysSince > 30) {
      warnings.push({
        level: 'warning',
        message: `Siste konsultasjon var for ${daysSince} dager siden. Vurder om SALT er hensiktsmessig.`,
      });
    }

    if (daysSince > 90) {
      warnings.push({
        level: 'error',
        message: 'Mer enn 3 måneder siden sist. Anbefaler ny fullstendig undersøkelse.',
      });
    }

    return warnings;
  }
}

// Export singleton instance
export const saltService = new SALTService();

export default saltService;
