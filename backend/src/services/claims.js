/**
 * Claims Service
 * Manages insurance claims with EDI 837/835 support
 *
 * EDI 837P: Professional claim submission
 * EDI 835: Electronic Remittance Advice (payment/denial response)
 */

import { query, _transaction } from '../config/database.js';
import { getBillingModifier } from './episodes.js';
import logger from '../utils/logger.js';

// Claim statuses
export const CLAIM_STATUS = {
  DRAFT: 'DRAFT', // Being prepared
  READY: 'READY', // Ready for submission
  SUBMITTED: 'SUBMITTED', // Sent to clearinghouse
  ACCEPTED: 'ACCEPTED', // Acknowledged by payer
  REJECTED: 'REJECTED', // Rejected by clearinghouse
  DENIED: 'DENIED', // Denied by payer
  PENDING: 'PENDING', // Awaiting payer decision
  PAID: 'PAID', // Fully paid
  PARTIAL: 'PARTIAL', // Partially paid
  APPEALED: 'APPEALED', // Under appeal
  WRITTEN_OFF: 'WRITTEN_OFF', // Written off
};

// Common CPT codes for chiropractic
export const CHIROPRACTIC_CPT_CODES = {
  CMT_1_2_REGIONS: '98940',
  CMT_3_4_REGIONS: '98941',
  CMT_5_REGIONS: '98942',
  EVALUATION_NEW: '99203',
  EVALUATION_EST: '99213',
  REEXAMINATION: '99214',
  THERAPEUTIC_EXERCISE: '97110',
  MANUAL_THERAPY: '97140',
  NEUROMUSCULAR_REEDUC: '97112',
  HOT_COLD_PACKS: '97010',
  ELECTRICAL_STIM: '97032',
  ULTRASOUND: '97035',
  TRACTION: '97012',
};

// Billing modifiers
export const MODIFIERS = {
  AT: 'AT', // Active Treatment
  GA: 'GA', // ABN on file (waiver)
  GZ: 'GZ', // No ABN on file (expect denial, can't bill patient)
  GP: 'GP', // Physical Therapy
  25: '25', // Significant, separately identifiable E/M
  59: '59', // Distinct procedural service
  XE: 'XE', // Separate encounter
  XS: 'XS', // Separate structure
  XP: 'XP', // Separate practitioner
  XU: 'XU', // Unusual non-overlapping service
};

/**
 * Create a new claim from encounter
 */
export const createClaim = async (organizationId, claimData) => {
  const {
    patient_id,
    encounter_id,
    episode_id = null,
    service_date,
    rendering_provider_id,
    payer_name,
    payer_id,
    subscriber_id,
    group_number = null,
    diagnosis_codes = [],
    line_items = [],
    place_of_service = '11', // 11 = Office
  } = claimData;

  // Calculate totals from line items
  const total_charge = line_items.reduce((sum, item) => sum + (item.charge_amount || 0), 0);

  // Get billing modifier based on episode status
  let primary_modifier = null;
  if (episode_id) {
    primary_modifier = await getBillingModifier(episode_id, patient_id);
  }

  // Generate claim number
  const claimNumber = await generateClaimNumber(organizationId);

  const result = await query(
    `INSERT INTO claims (
      organization_id,
      patient_id,
      encounter_id,
      episode_id,
      claim_number,
      service_date,
      place_of_service,
      rendering_provider_id,
      payer_name,
      payer_id,
      subscriber_id,
      group_number,
      diagnosis_codes,
      line_items,
      total_charge,
      primary_modifier,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'DRAFT')
    RETURNING *`,
    [
      organizationId,
      patient_id,
      encounter_id,
      episode_id,
      claimNumber,
      service_date,
      place_of_service,
      rendering_provider_id,
      payer_name,
      payer_id,
      subscriber_id,
      group_number,
      JSON.stringify(diagnosis_codes),
      JSON.stringify(line_items),
      total_charge,
      primary_modifier,
    ]
  );

  logger.info(`Claim created: ${result.rows[0].claim_number}`);
  return result.rows[0];
};

/**
 * Generate unique claim number
 */
const generateClaimNumber = async (organizationId) => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');

  const result = await query(
    `SELECT COUNT(*) as count
     FROM claims
     WHERE organization_id = $1
       AND claim_number LIKE $2`,
    [organizationId, `CLM-${year}${month}-%`]
  );

  const sequence = parseInt(result.rows[0].count) + 1;
  return `CLM-${year}${month}-${String(sequence).padStart(5, '0')}`;
};

/**
 * Get claim by ID
 */
export const getClaimById = async (organizationId, claimId) => {
  const result = await query(
    `SELECT c.*,
            p.first_name || ' ' || p.last_name as patient_name,
            p.solvit_id,
            u.first_name || ' ' || u.last_name as provider_name,
            u.hpr_number as provider_npi,
            e.status as episode_status,
            e.abn_on_file
     FROM claims c
     JOIN patients p ON p.id = c.patient_id
     LEFT JOIN users u ON u.id = c.rendering_provider_id
     LEFT JOIN care_episodes e ON e.id = c.episode_id
     WHERE c.id = $1 AND c.organization_id = $2`,
    [claimId, organizationId]
  );

  return result.rows[0] || null;
};

/**
 * Get claims with filters
 */
export const getClaims = async (organizationId, options = {}) => {
  const {
    page = 1,
    limit = 50,
    status = null,
    patient_id = null,
    payer_id = null,
    start_date = null,
    end_date = null,
  } = options;

  const offset = (page - 1) * limit;
  const whereConditions = ['c.organization_id = $1'];
  const params = [organizationId];
  let paramIndex = 2;

  if (status) {
    whereConditions.push(`c.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (patient_id) {
    whereConditions.push(`c.patient_id = $${paramIndex}`);
    params.push(patient_id);
    paramIndex++;
  }

  if (payer_id) {
    whereConditions.push(`c.payer_id = $${paramIndex}`);
    params.push(payer_id);
    paramIndex++;
  }

  if (start_date) {
    whereConditions.push(`c.service_date >= $${paramIndex}`);
    params.push(start_date);
    paramIndex++;
  }

  if (end_date) {
    whereConditions.push(`c.service_date <= $${paramIndex}`);
    params.push(end_date);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  // Get count
  const countResult = await query(`SELECT COUNT(*) FROM claims c WHERE ${whereClause}`, params);

  // Get claims
  const result = await query(
    `SELECT c.*,
            p.first_name || ' ' || p.last_name as patient_name
     FROM claims c
     JOIN patients p ON p.id = c.patient_id
     WHERE ${whereClause}
     ORDER BY c.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return {
    claims: result.rows,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].count),
      pages: Math.ceil(countResult.rows[0].count / limit),
    },
  };
};

/**
 * Update claim line items
 */
export const updateClaimLineItems = async (organizationId, claimId, lineItems) => {
  const total_charge = lineItems.reduce((sum, item) => sum + (item.charge_amount || 0), 0);

  const result = await query(
    `UPDATE claims
     SET line_items = $3,
         total_charge = $4,
         updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [claimId, organizationId, JSON.stringify(lineItems), total_charge]
  );

  if (result.rows.length === 0) {
    throw new Error('Claim not found');
  }

  return result.rows[0];
};

/**
 * Submit claim for processing
 */
export const submitClaim = async (organizationId, claimId, userId) => {
  // First validate the claim is complete
  const claim = await getClaimById(organizationId, claimId);
  if (!claim) {
    throw new Error('Claim not found');
  }

  const errors = validateClaimForSubmission(claim);
  if (errors.length > 0) {
    throw new Error(`Claim validation failed: ${errors.join(', ')}`);
  }

  // Generate EDI 837P data
  const edi837Data = generateEDI837P(claim);

  const result = await query(
    `UPDATE claims
     SET status = 'SUBMITTED',
         submitted_at = NOW(),
         submitted_by = $3,
         edi_837_data = $4,
         updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [claimId, organizationId, userId, edi837Data]
  );

  logger.info(`Claim submitted: ${claim.claim_number}`);
  return result.rows[0];
};

/**
 * Validate claim before submission
 */
const validateClaimForSubmission = (claim) => {
  const errors = [];

  if (!claim.patient_id) {
    errors.push('Patient required');
  }
  if (!claim.payer_id) {
    errors.push('Payer ID required');
  }
  if (!claim.subscriber_id) {
    errors.push('Subscriber ID required');
  }
  if (!claim.service_date) {
    errors.push('Service date required');
  }
  if (!claim.rendering_provider_id) {
    errors.push('Rendering provider required');
  }

  const diagnosisCodes = JSON.parse(claim.diagnosis_codes || '[]');
  if (diagnosisCodes.length === 0) {
    errors.push('At least one diagnosis code required');
  }

  const lineItems = JSON.parse(claim.line_items || '[]');
  if (lineItems.length === 0) {
    errors.push('At least one line item required');
  }

  lineItems.forEach((item, index) => {
    if (!item.cpt_code) {
      errors.push(`Line ${index + 1}: CPT code required`);
    }
    if (!item.charge_amount || item.charge_amount <= 0) {
      errors.push(`Line ${index + 1}: Valid charge amount required`);
    }
  });

  return errors;
};

/**
 * Generate EDI 837P format (simplified structure)
 * In production, use a proper EDI library
 */
const generateEDI837P = (claim) => {
  // This is a simplified representation
  // Real EDI 837P has strict segment and element requirements
  const segments = [];
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .substring(0, 14);

  // ISA - Interchange Control Header
  segments.push(
    `ISA*00*          *00*          *ZZ*SENDER_ID      *ZZ*RECEIVER_ID    *${timestamp.substring(0, 6)}*${timestamp.substring(6, 10)}*^*00501*${claim.id.substring(0, 9)}*0*P*:~`
  );

  // GS - Functional Group Header
  segments.push(
    `GS*HC*SENDER_ID*RECEIVER_ID*${timestamp.substring(0, 8)}*${timestamp.substring(8, 12)}*1*X*005010X222A1~`
  );

  // ST - Transaction Set Header
  segments.push(`ST*837*0001*005010X222A1~`);

  // BHT - Beginning of Hierarchical Transaction
  segments.push(
    `BHT*0019*00*${claim.claim_number}*${timestamp.substring(0, 8)}*${timestamp.substring(8, 12)}*CH~`
  );

  // ... Additional segments would follow (NM1, PER, HL, CLM, etc.)
  // This is simplified for demonstration

  segments.push(
    `CLM*${claim.claim_number}*${claim.total_charge}***${claim.place_of_service}:B:1*Y*A*Y*Y~`
  );

  // Diagnosis codes
  const diagnoses = JSON.parse(claim.diagnosis_codes || '[]');
  diagnoses.forEach((diag, i) => {
    segments.push(`HI*${i === 0 ? 'ABK' : 'ABF'}:${diag.code}~`);
  });

  // Line items
  const lineItems = JSON.parse(claim.line_items || '[]');
  lineItems.forEach((item, i) => {
    const modifiers = (item.modifiers || []).join(':');
    segments.push(`LX*${i + 1}~`);
    segments.push(
      `SV1*HC:${item.cpt_code}${modifiers ? `:${modifiers}` : ''}*${item.charge_amount}*UN*${item.units || 1}***${(item.diagnosis_pointers || [1]).join(':')}~`
    );
  });

  // Transaction Set Trailer
  segments.push(`SE*${segments.length}*0001~`);
  segments.push(`GE*1*1~`);
  segments.push(`IEA*1*${claim.id.substring(0, 9)}~`);

  return segments.join('\n');
};

/**
 * Process payment/remittance (EDI 835)
 */
export const processRemittance = async (organizationId, claimId, remittanceData) => {
  const {
    payer_claim_number = null,
    total_allowed,
    total_paid,
    total_adjustment,
    patient_responsibility,
    payment_date,
    check_eft_number = null,
    denial_reason_codes = [],
    _line_item_adjustments = [],
    edi_835_data = null,
  } = remittanceData;

  // Determine new status based on payment
  let newStatus = 'PAID';
  if (total_paid === 0 && denial_reason_codes.length > 0) {
    newStatus = 'DENIED';
  } else if (total_paid > 0 && total_paid < total_allowed) {
    newStatus = 'PARTIAL';
  }

  const result = await query(
    `UPDATE claims
     SET status = $3,
         payer_claim_number = $4,
         total_allowed = $5,
         total_paid = $6,
         total_adjustment = $7,
         patient_responsibility = $8,
         payment_date = $9,
         check_eft_number = $10,
         denial_reason_codes = $11,
         response_received_at = NOW(),
         edi_835_data = $12,
         updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      claimId,
      organizationId,
      newStatus,
      payer_claim_number,
      total_allowed,
      total_paid,
      total_adjustment,
      patient_responsibility,
      payment_date,
      check_eft_number,
      denial_reason_codes,
      edi_835_data,
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('Claim not found');
  }

  logger.info(`Remittance processed for claim: ${claimId}, status: ${newStatus}`);
  return result.rows[0];
};

/**
 * Get claims summary by status
 */
export const getClaimsSummary = async (organizationId) => {
  const result = await query(`SELECT * FROM claims_summary WHERE organization_id = $1`, [
    organizationId,
  ]);

  return result.rows;
};

/**
 * Get outstanding claims
 */
export const getOutstandingClaims = async (organizationId) => {
  const result = await query(`SELECT * FROM outstanding_claims WHERE organization_id = $1`, [
    organizationId,
  ]);

  return result.rows;
};

/**
 * Get suggested CMT code based on regions treated
 */
export const getSuggestedCMTCode = async (regionsCount) => {
  const result = await query(`SELECT suggest_cmt_code($1) as cpt_code`, [regionsCount]);

  return result.rows[0].cpt_code;
};

/**
 * Appeal a denied claim
 */
export const appealClaim = async (organizationId, claimId, appealData) => {
  const { appeal_notes, appeal_deadline = null } = appealData;

  const result = await query(
    `UPDATE claims
     SET status = 'APPEALED',
         appeal_submitted_at = NOW(),
         appeal_notes = $3,
         appeal_deadline = $4,
         updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [claimId, organizationId, appeal_notes, appeal_deadline]
  );

  if (result.rows.length === 0) {
    throw new Error('Claim not found');
  }

  logger.info(`Claim appealed: ${claimId}`);
  return result.rows[0];
};

/**
 * Write off a claim
 */
export const writeOffClaim = async (organizationId, claimId, reason) => {
  const result = await query(
    `UPDATE claims
     SET status = 'WRITTEN_OFF',
         denial_notes = $3,
         updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [claimId, organizationId, reason]
  );

  if (result.rows.length === 0) {
    throw new Error('Claim not found');
  }

  logger.info(`Claim written off: ${claimId}`);
  return result.rows[0];
};

export default {
  CLAIM_STATUS,
  CHIROPRACTIC_CPT_CODES,
  MODIFIERS,
  createClaim,
  getClaimById,
  getClaims,
  updateClaimLineItems,
  submitClaim,
  processRemittance,
  getClaimsSummary,
  getOutstandingClaims,
  getSuggestedCMTCode,
  appealClaim,
  writeOffClaim,
};
