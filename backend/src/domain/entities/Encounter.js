/**
 * Encounter Domain Entity
 * Encapsulates business rules for clinical encounters (SOAP notes)
 */

export class Encounter {
  constructor(data) {
    this.id = data.id;
    this.organizationId = data.organization_id;
    this.patientId = data.patient_id;
    this.practitionerId = data.practitioner_id;
    this.encounterDate = data.encounter_date;
    this.encounterType = data.encounter_type || 'FOLLOWUP';
    this.durationMinutes = data.duration_minutes || 30;

    // SOAP components
    this.subjective = data.subjective || {};
    this.objective = data.objective || {};
    this.assessment = data.assessment || {};
    this.plan = data.plan || {};

    // Clinical data
    this.icpcCodes = data.icpc_codes || [];
    this.icd10Codes = data.icd10_codes || [];
    this.treatmentCodes = data.treatment_codes || [];
    this.vasPain = data.vas_pain;

    // Status
    this.status = data.status || 'IN_PROGRESS';
    this.isSigned = data.is_signed || false;
    this.signedAt = data.signed_at;
    this.signedBy = data.signed_by;

    // Red flags
    this.redFlagsIdentified = data.red_flags_identified || [];

    // Timestamps
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Valid encounter types
   */
  static get ENCOUNTER_TYPES() {
    return ['INITIAL', 'FOLLOWUP', 'REASSESSMENT', 'DISCHARGE', 'EMERGENCY'];
  }

  /**
   * Valid statuses
   */
  static get STATUSES() {
    return ['IN_PROGRESS', 'COMPLETED', 'SIGNED', 'AMENDED'];
  }

  /**
   * RED FLAG symptoms that require immediate attention
   */
  static get RED_FLAGS() {
    return [
      'CAUDA_EQUINA', // Cauda equina syndrome
      'SEVERE_TRAUMA', // Recent significant trauma
      'PROGRESSIVE_NEURO', // Progressive neurological deficit
      'CANCER_HISTORY', // History of cancer with new pain
      'UNEXPLAINED_WEIGHT_LOSS', // Unexplained weight loss
      'FEVER_INFECTION', // Fever or signs of infection
      'NIGHT_PAIN', // Severe night pain
      'IMMUNOSUPPRESSION', // Immunosuppression
      'OSTEOPOROSIS_RISK', // High osteoporosis risk with trauma
      'VASCULAR_SYMPTOMS', // Vascular symptoms
    ];
  }

  /**
   * Check if encounter can be edited
   */
  canEdit() {
    return !this.isSigned;
  }

  /**
   * Check if encounter can be signed
   */
  canSign() {
    if (this.isSigned) {
      return false;
    }
    if (this.status !== 'COMPLETED') {
      return false;
    }

    // Must have at least assessment and plan
    const hasAssessment =
      this.assessment.clinical_impression || this.assessment.diagnoses?.length > 0;
    const hasPlan = this.plan.treatment_provided || this.plan.recommendations;

    return hasAssessment && hasPlan;
  }

  /**
   * Sign the encounter (makes it immutable)
   */
  sign(practitionerId) {
    if (!this.canSign()) {
      throw new Error('Encounter cannot be signed in current state');
    }

    this.isSigned = true;
    this.signedAt = new Date();
    this.signedBy = practitionerId;
    this.status = 'SIGNED';
  }

  /**
   * Check for red flags in subjective and objective data
   */
  checkRedFlags() {
    const identifiedFlags = [];

    const chiefComplaint = this.subjective.chief_complaint?.toLowerCase() || '';
    const observations = this.objective.observations?.toLowerCase() || '';
    const combined = `${chiefComplaint} ${observations}`;

    // Check for cauda equina symptoms
    if (
      combined.includes('bladder') ||
      combined.includes('bowel') ||
      combined.includes('saddle') ||
      combined.includes('bilateral leg')
    ) {
      identifiedFlags.push('CAUDA_EQUINA');
    }

    // Check for progressive neurological symptoms
    if (combined.includes('progressive') && combined.includes('weakness')) {
      identifiedFlags.push('PROGRESSIVE_NEURO');
    }

    // Check for unexplained weight loss
    if (combined.includes('weight loss') && combined.includes('unexplained')) {
      identifiedFlags.push('UNEXPLAINED_WEIGHT_LOSS');
    }

    // Check for fever
    if (combined.includes('fever') || combined.includes('infection')) {
      identifiedFlags.push('FEVER_INFECTION');
    }

    // Check for night pain
    if (combined.includes('night pain') || combined.includes('wakes from pain')) {
      identifiedFlags.push('NIGHT_PAIN');
    }

    this.redFlagsIdentified = identifiedFlags;
    return identifiedFlags;
  }

  /**
   * Has red flags
   */
  hasRedFlags() {
    return this.redFlagsIdentified.length > 0;
  }

  /**
   * Calculate VAS improvement from previous encounter
   */
  calculateVASImprovement(previousVAS) {
    if (this.vasPain === null || previousVAS === null) {
      return null;
    }
    return previousVAS - this.vasPain;
  }

  /**
   * Generate formatted SOAP note text
   */
  generateFormattedNote() {
    let note = '';

    // Subjective
    note += '=== SUBJECTIVE ===\n';
    if (this.subjective.chief_complaint) {
      note += `Chief Complaint: ${this.subjective.chief_complaint}\n`;
    }
    if (this.subjective.history_present_illness) {
      note += `HPI: ${this.subjective.history_present_illness}\n`;
    }
    if (this.vasPain !== null) {
      note += `Pain (VAS 0-10): ${this.vasPain}\n`;
    }

    // Objective
    note += '\n=== OBJECTIVE ===\n';
    if (this.objective.observations) {
      note += `Observations: ${this.objective.observations}\n`;
    }
    if (this.objective.examination_findings) {
      note += `Examination: ${this.objective.examination_findings}\n`;
    }

    // Assessment
    note += '\n=== ASSESSMENT ===\n';
    if (this.assessment.clinical_impression) {
      note += `Clinical Impression: ${this.assessment.clinical_impression}\n`;
    }
    if (this.icpcCodes.length > 0) {
      note += `ICPC-2: ${this.icpcCodes.join(', ')}\n`;
    }

    // Plan
    note += '\n=== PLAN ===\n';
    if (this.plan.treatment_provided) {
      note += `Treatment: ${this.plan.treatment_provided}\n`;
    }
    if (this.plan.recommendations) {
      note += `Recommendations: ${this.plan.recommendations}\n`;
    }
    if (this.plan.follow_up) {
      note += `Follow-up: ${this.plan.follow_up}\n`;
    }

    return note;
  }

  /**
   * Validate encounter data
   */
  validate() {
    const errors = [];

    if (!this.patientId) {
      errors.push('Patient ID is required');
    }

    if (!this.practitionerId) {
      errors.push('Practitioner ID is required');
    }

    if (!this.encounterDate) {
      errors.push('Encounter date is required');
    }

    if (!Encounter.ENCOUNTER_TYPES.includes(this.encounterType)) {
      errors.push(`Encounter type must be one of: ${Encounter.ENCOUNTER_TYPES.join(', ')}`);
    }

    if (!Encounter.STATUSES.includes(this.status)) {
      errors.push(`Status must be one of: ${Encounter.STATUSES.join(', ')}`);
    }

    if (this.vasPain !== null && (this.vasPain < 0 || this.vasPain > 10)) {
      errors.push('VAS pain must be between 0 and 10');
    }

    if (this.durationMinutes < 5 || this.durationMinutes > 240) {
      errors.push('Duration must be between 5 and 240 minutes');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert to database format
   */
  toDatabase() {
    return {
      id: this.id,
      organization_id: this.organizationId,
      patient_id: this.patientId,
      practitioner_id: this.practitionerId,
      encounter_date: this.encounterDate,
      encounter_type: this.encounterType,
      duration_minutes: this.durationMinutes,
      subjective: this.subjective,
      objective: this.objective,
      assessment: this.assessment,
      plan: this.plan,
      icpc_codes: this.icpcCodes,
      icd10_codes: this.icd10Codes,
      treatment_codes: this.treatmentCodes,
      vas_pain: this.vasPain,
      status: this.status,
      is_signed: this.isSigned,
      signed_at: this.signedAt,
      signed_by: this.signedBy,
      red_flags_identified: this.redFlagsIdentified,
    };
  }

  /**
   * Create from database row
   */
  static fromDatabase(row) {
    return new Encounter(row);
  }
}

export default Encounter;
