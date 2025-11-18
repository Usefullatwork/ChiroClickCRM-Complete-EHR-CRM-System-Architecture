/**
 * Clinical Encounters Service
 * Business logic for SOAP notes and clinical documentation
 */

import { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all encounters with filters
 */
export const getAllEncounters = async (organizationId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    patientId = null,
    practitionerId = null,
    startDate = null,
    endDate = null,
    encounterType = null,
    signed = null
  } = options;

  const offset = (page - 1) * limit;

  try {
    let whereClause = 'WHERE ce.organization_id = $1';
    const params = [organizationId];
    let paramIndex = 2;

    if (patientId) {
      params.push(patientId);
      whereClause += ` AND ce.patient_id = $${paramIndex}`;
      paramIndex++;
    }

    if (practitionerId) {
      params.push(practitionerId);
      whereClause += ` AND ce.practitioner_id = $${paramIndex}`;
      paramIndex++;
    }

    if (startDate) {
      params.push(startDate);
      whereClause += ` AND ce.encounter_date >= $${paramIndex}`;
      paramIndex++;
    }

    if (endDate) {
      params.push(endDate);
      whereClause += ` AND ce.encounter_date <= $${paramIndex}`;
      paramIndex++;
    }

    if (encounterType) {
      params.push(encounterType);
      whereClause += ` AND ce.encounter_type = $${paramIndex}`;
      paramIndex++;
    }

    if (signed !== null) {
      whereClause += ` AND ce.signed_at IS ${signed ? 'NOT NULL' : 'NULL'}`;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM clinical_encounters ce ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get encounters
    params.push(limit, offset);
    const result = await query(
      `SELECT
        ce.*,
        p.first_name || ' ' || p.last_name as patient_name,
        p.solvit_id,
        u.first_name || ' ' || u.last_name as practitioner_name
      FROM clinical_encounters ce
      JOIN patients p ON p.id = ce.patient_id
      LEFT JOIN users u ON u.id = ce.practitioner_id
      ${whereClause}
      ORDER BY ce.encounter_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      encounters: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error getting encounters:', error);
    throw error;
  }
};

/**
 * Get encounter by ID
 */
export const getEncounterById = async (organizationId, encounterId) => {
  try {
    const result = await query(
      `SELECT
        ce.*,
        p.first_name || ' ' || p.last_name as patient_name,
        p.solvit_id,
        p.date_of_birth,
        p.red_flags,
        p.contraindications,
        p.allergies,
        p.current_medications,
        u.first_name || ' ' || u.last_name as practitioner_name,
        u.hpr_number
      FROM clinical_encounters ce
      JOIN patients p ON p.id = ce.patient_id
      LEFT JOIN users u ON u.id = ce.practitioner_id
      WHERE ce.organization_id = $1 AND ce.id = $2`,
      [organizationId, encounterId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting encounter:', error);
    throw error;
  }
};

/**
 * Get encounters for a patient
 */
export const getPatientEncounters = async (organizationId, patientId, limit = 10) => {
  try {
    const result = await query(
      `SELECT
        ce.*,
        u.first_name || ' ' || u.last_name as practitioner_name
      FROM clinical_encounters ce
      LEFT JOIN users u ON u.id = ce.practitioner_id
      WHERE ce.organization_id = $1 AND ce.patient_id = $2
      ORDER BY ce.encounter_date DESC
      LIMIT $3`,
      [organizationId, patientId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting patient encounters:', error);
    throw error;
  }
};

/**
 * Create new encounter
 */
export const createEncounter = async (organizationId, encounterData) => {
  try {
    const result = await query(
      `INSERT INTO clinical_encounters (
        organization_id,
        patient_id,
        practitioner_id,
        encounter_date,
        encounter_type,
        duration_minutes,
        subjective,
        objective,
        assessment,
        plan,
        icpc_codes,
        icd10_codes,
        treatments,
        vas_pain_start,
        vas_pain_end,
        nav_series_number,
        nav_diagnosis_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING *`,
      [
        organizationId,
        encounterData.patient_id,
        encounterData.practitioner_id,
        encounterData.encounter_date || new Date(),
        encounterData.encounter_type,
        encounterData.duration_minutes || 30,
        JSON.stringify(encounterData.subjective || {}),
        JSON.stringify(encounterData.objective || {}),
        JSON.stringify(encounterData.assessment || {}),
        JSON.stringify(encounterData.plan || {}),
        encounterData.icpc_codes || [],
        encounterData.icd10_codes || [],
        JSON.stringify(encounterData.treatments || []),
        encounterData.vas_pain_start || null,
        encounterData.vas_pain_end || null,
        encounterData.nav_series_number || null,
        encounterData.nav_diagnosis_date || null
      ]
    );

    logger.info('Encounter created:', {
      organizationId,
      encounterId: result.rows[0].id,
      patientId: encounterData.patient_id
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error creating encounter:', error);
    throw error;
  }
};

/**
 * Update encounter
 */
export const updateEncounter = async (organizationId, encounterId, encounterData) => {
  try {
    // Check if encounter is signed (immutable)
    const existingResult = await query(
      'SELECT signed_at FROM clinical_encounters WHERE organization_id = $1 AND id = $2',
      [organizationId, encounterId]
    );

    if (existingResult.rows.length === 0) {
      return null;
    }

    if (existingResult.rows[0].signed_at) {
      throw new Error('Cannot update signed encounter. Create an amendment instead.');
    }

    // Build UPDATE clause
    const updateFields = [];
    const params = [organizationId, encounterId];
    let paramIndex = 3;

    const allowedFields = [
      'encounter_date', 'encounter_type', 'duration_minutes',
      'subjective', 'objective', 'assessment', 'plan',
      'icpc_codes', 'icd10_codes', 'treatments',
      'vas_pain_start', 'vas_pain_end',
      'nav_series_number', 'nav_diagnosis_date'
    ];

    for (const field of allowedFields) {
      if (encounterData[field] !== undefined) {
        // JSON fields need stringification
        const jsonFields = ['subjective', 'objective', 'assessment', 'plan', 'treatments'];
        const value = jsonFields.includes(field)
          ? JSON.stringify(encounterData[field])
          : encounterData[field];

        updateFields.push(`${field} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    const result = await query(
      `UPDATE clinical_encounters
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE organization_id = $1 AND id = $2
       RETURNING *`,
      params
    );

    logger.info('Encounter updated:', {
      organizationId,
      encounterId,
      fieldsUpdated: updateFields.length
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error updating encounter:', error);
    throw error;
  }
};

/**
 * Sign encounter (makes it immutable)
 */
export const signEncounter = async (organizationId, encounterId, userId) => {
  try {
    const result = await query(
      `UPDATE clinical_encounters
       SET signed_at = NOW(), signed_by = $3, is_current = true
       WHERE organization_id = $1 AND id = $2 AND signed_at IS NULL
       RETURNING *`,
      [organizationId, encounterId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Encounter not found or already signed');
    }

    logger.info('Encounter signed:', {
      organizationId,
      encounterId,
      signedBy: userId
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error signing encounter:', error);
    throw error;
  }
};

/**
 * Generate formatted note for SolvIt/GP letters
 */
export const generateFormattedNote = async (organizationId, encounterId) => {
  try {
    const encounter = await getEncounterById(organizationId, encounterId);

    if (!encounter) {
      throw new Error('Encounter not found');
    }

    // Parse JSON fields
    const subjective = encounter.subjective || {};
    const objective = encounter.objective || {};
    const assessment = encounter.assessment || {};
    const plan = encounter.plan || {};

    // Generate formatted note
    let note = `KLINISK NOTAT\n\n`;
    note += `Pasient: ${encounter.patient_name}\n`;
    note += `Dato: ${new Date(encounter.encounter_date).toLocaleDateString('no-NO')}\n`;
    note += `Behandler: ${encounter.practitioner_name}${encounter.hpr_number ? ` (HPR: ${encounter.hpr_number})` : ''}\n\n`;

    // Subjective
    note += `SUBJEKTIVT (S):\n`;
    if (subjective.chief_complaint) note += `Hovedplage: ${subjective.chief_complaint}\n`;
    if (subjective.history) note += `Anamnese: ${subjective.history}\n`;
    if (subjective.onset) note += `Debut: ${subjective.onset}\n`;
    if (subjective.pain_description) note += `Smertebeskrivelse: ${subjective.pain_description}\n`;
    if (encounter.vas_pain_start !== null) note += `VAS ved start: ${encounter.vas_pain_start}/10\n`;
    note += `\n`;

    // Objective
    note += `OBJEKTIVT (O):\n`;
    if (objective.observation) note += `Observasjon: ${objective.observation}\n`;
    if (objective.palpation) note += `Palpasjon: ${objective.palpation}\n`;
    if (objective.rom) note += `Bevegelighet: ${objective.rom}\n`;
    if (objective.ortho_tests) note += `Ortopediske tester: ${objective.ortho_tests}\n`;
    if (objective.neuro_tests) note += `Nevrologiske tester: ${objective.neuro_tests}\n`;
    note += `\n`;

    // Assessment
    note += `VURDERING (A):\n`;
    if (encounter.icpc_codes && encounter.icpc_codes.length > 0) {
      note += `Diagnose (ICPC-2): ${encounter.icpc_codes.join(', ')}\n`;
    }
    if (encounter.icd10_codes && encounter.icd10_codes.length > 0) {
      note += `Diagnose (ICD-10): ${encounter.icd10_codes.join(', ')}\n`;
    }
    if (assessment.clinical_reasoning) note += `Klinisk resonnement: ${assessment.clinical_reasoning}\n`;
    if (assessment.prognosis) note += `Prognose: ${assessment.prognosis}\n`;
    note += `\n`;

    // Plan
    note += `PLAN (P):\n`;
    if (plan.treatment) note += `Behandling: ${plan.treatment}\n`;
    if (plan.exercises) note += `Hjemmeøvelser: ${plan.exercises}\n`;
    if (plan.advice) note += `Råd: ${plan.advice}\n`;
    if (plan.follow_up) note += `Oppfølging: ${plan.follow_up}\n`;
    if (encounter.vas_pain_end !== null) note += `VAS ved slutt: ${encounter.vas_pain_end}/10\n`;

    // Update encounter with generated note
    await query(
      'UPDATE clinical_encounters SET generated_note = $1 WHERE id = $2',
      [note, encounterId]
    );

    return note;
  } catch (error) {
    logger.error('Error generating formatted note:', error);
    throw error;
  }
};

/**
 * Get encounter history for patient (for clinical context)
 */
export const getPatientEncounterHistory = async (organizationId, patientId) => {
  try {
    const result = await query(
      `SELECT
        ce.id,
        ce.encounter_date,
        ce.encounter_type,
        ce.icpc_codes,
        ce.icd10_codes,
        ce.vas_pain_start,
        ce.vas_pain_end,
        u.first_name || ' ' || u.last_name as practitioner_name
      FROM clinical_encounters ce
      LEFT JOIN users u ON u.id = ce.practitioner_id
      WHERE ce.organization_id = $1 AND ce.patient_id = $2
      ORDER BY ce.encounter_date DESC
      LIMIT 20`,
      [organizationId, patientId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting encounter history:', error);
    throw error;
  }
};

/**
 * Check for clinical red flags
 */
export const checkRedFlags = async (patientId, encounterData) => {
  try {
    // Get patient data
    const patientResult = await query(
      `SELECT red_flags, contraindications, current_medications, date_of_birth
       FROM patients WHERE id = $1`,
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      return { alerts: [], warnings: [] };
    }

    const patient = patientResult.rows[0];
    const alerts = [];
    const warnings = [];

    // Check patient age
    const age = Math.floor((new Date() - new Date(patient.date_of_birth)) / 31557600000);
    if (age < 18) {
      warnings.push('Patient is under 18 years old');
    }
    if (age > 75) {
      warnings.push('Patient is over 75 years old - consider age-related contraindications');
    }

    // Check red flags
    if (patient.red_flags && patient.red_flags.length > 0) {
      for (const flag of patient.red_flags) {
        alerts.push(`Red flag: ${flag}`);
      }
    }

    // Check contraindications
    if (patient.contraindications && patient.contraindications.length > 0) {
      for (const contraindication of patient.contraindications) {
        alerts.push(`Contraindication: ${contraindication}`);
      }
    }

    // Check medications (anticoagulants are particularly important)
    if (patient.current_medications && patient.current_medications.length > 0) {
      const anticoagulants = ['Warfarin', 'Aspirin', 'Xarelto', 'Eliquis', 'Pradaxa'];
      for (const med of patient.current_medications) {
        if (anticoagulants.some(ac => med.toLowerCase().includes(ac.toLowerCase()))) {
          warnings.push(`Patient on anticoagulant: ${med} - use caution with manipulation`);
        }
      }
    }

    // Check for excessive visits without improvement
    const visitsResult = await query(
      `SELECT COUNT(*) as recent_visits
       FROM clinical_encounters
       WHERE patient_id = $1
         AND encounter_date > NOW() - INTERVAL '30 days'`,
      [patientId]
    );

    if (parseInt(visitsResult.rows[0].recent_visits) > 6) {
      warnings.push('Patient has had >6 visits in the last 30 days - consider referral if no improvement');
    }

    return { alerts, warnings };
  } catch (error) {
    logger.error('Error checking red flags:', error);
    throw error;
  }
};

export default {
  getAllEncounters,
  getEncounterById,
  getPatientEncounters,
  createEncounter,
  updateEncounter,
  signEncounter,
  generateFormattedNote,
  getPatientEncounterHistory,
  checkRedFlags
};
