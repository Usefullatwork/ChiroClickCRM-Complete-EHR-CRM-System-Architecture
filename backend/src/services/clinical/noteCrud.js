/**
 * Clinical Notes CRUD Operations
 * Core note creation, reading, updating, deletion, and signing
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';
import { BusinessLogicError } from '../../utils/errors.js';
import { validate as validateNote } from './noteValidator.js';

/**
 * Get all clinical notes with filters
 */
export const getAllNotes = async (organizationId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    patientId = null,
    practitionerId = null,
    startDate = null,
    endDate = null,
    noteType = null,
    templateType = null,
    status = null,
    isDraft = null,
    search = null,
  } = options;

  const offset = (page - 1) * limit;

  try {
    let whereClause = 'WHERE cn.organization_id = $1';
    const params = [organizationId];
    let paramIndex = 2;

    if (patientId) {
      params.push(patientId);
      whereClause += ` AND cn.patient_id = $${paramIndex}`;
      paramIndex++;
    }
    if (practitionerId) {
      params.push(practitionerId);
      whereClause += ` AND cn.practitioner_id = $${paramIndex}`;
      paramIndex++;
    }
    if (startDate) {
      params.push(startDate);
      whereClause += ` AND cn.note_date >= $${paramIndex}`;
      paramIndex++;
    }
    if (endDate) {
      params.push(endDate);
      whereClause += ` AND cn.note_date <= $${paramIndex}`;
      paramIndex++;
    }
    if (noteType) {
      params.push(noteType);
      whereClause += ` AND cn.note_type = $${paramIndex}`;
      paramIndex++;
    }
    if (templateType) {
      params.push(templateType);
      whereClause += ` AND cn.template_type = $${paramIndex}`;
      paramIndex++;
    }
    if (status) {
      params.push(status);
      whereClause += ` AND cn.status = $${paramIndex}`;
      paramIndex++;
    }
    if (isDraft !== null) {
      whereClause += ` AND cn.is_draft = ${isDraft}`;
    }
    if (search) {
      params.push(search);
      whereClause += ` AND cn.search_vector @@ plainto_tsquery('simple', $${paramIndex})`;
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM clinical_notes cn ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT
        cn.*,
        p.first_name || ' ' || p.last_name as patient_name,
        p.solvit_id,
        u.first_name || ' ' || u.last_name as practitioner_name
      FROM clinical_notes cn
      JOIN patients p ON p.id = cn.patient_id
      LEFT JOIN users u ON u.id = cn.practitioner_id
      ${whereClause}
      ORDER BY cn.note_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      notes: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting clinical notes:', error);
    throw error;
  }
};

/**
 * Get clinical note by ID
 */
export const getNoteById = async (organizationId, noteId) => {
  try {
    const result = await query(
      `SELECT
        cn.*,
        p.first_name || ' ' || p.last_name as patient_name,
        p.solvit_id, p.date_of_birth, p.red_flags, p.contraindications,
        p.allergies, p.current_medications,
        u.first_name || ' ' || u.last_name as practitioner_name, u.hpr_number,
        s.first_name || ' ' || s.last_name as signed_by_name
      FROM clinical_notes cn
      JOIN patients p ON p.id = cn.patient_id
      LEFT JOIN users u ON u.id = cn.practitioner_id
      LEFT JOIN users s ON s.id = cn.signed_by
      WHERE cn.organization_id = $1 AND cn.id = $2`,
      [organizationId, noteId]
    );

    return result.rows.length === 0 ? null : result.rows[0];
  } catch (error) {
    logger.error('Error getting clinical note:', error);
    throw error;
  }
};

/**
 * Get notes for a patient
 */
export const getPatientNotes = async (organizationId, patientId, options = {}) => {
  const { limit = 20, includesDrafts = false } = options;

  try {
    let whereClause = 'WHERE cn.organization_id = $1 AND cn.patient_id = $2';
    if (!includesDrafts) {
      whereClause += ' AND cn.is_draft = false';
    }

    const result = await query(
      `SELECT cn.*, u.first_name || ' ' || u.last_name as practitioner_name
      FROM clinical_notes cn
      LEFT JOIN users u ON u.id = cn.practitioner_id
      ${whereClause}
      ORDER BY cn.note_date DESC LIMIT $3`,
      [organizationId, patientId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting patient notes:', error);
    throw error;
  }
};

/**
 * Create new clinical note
 */
export const createNote = async (organizationId, noteData, userId) => {
  try {
    const validation = validateNote(
      noteData,
      noteData.note_type || noteData.template_type || 'SOAP'
    );
    if (!validation.canSave) {
      throw new BusinessLogicError(`Validation failed: ${validation.errors.join('; ')}`);
    }

    const result = await query(
      `INSERT INTO clinical_notes (
        organization_id, patient_id, practitioner_id, note_type, template_type,
        note_date, status, subjective, objective, assessment, plan,
        icd10_codes, icpc_codes, vestibular_data, duration_minutes,
        vas_pain_start, vas_pain_end, prescribed_exercises,
        is_draft, draft_saved_at, auto_save_data, encounter_id, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      ) RETURNING *`,
      [
        organizationId,
        noteData.patient_id,
        noteData.practitioner_id || userId,
        noteData.note_type || 'SOAP',
        noteData.template_type || 'standard',
        noteData.note_date || new Date(),
        noteData.status || 'draft',
        JSON.stringify(noteData.subjective || {}),
        JSON.stringify(noteData.objective || {}),
        JSON.stringify(noteData.assessment || {}),
        JSON.stringify(noteData.plan || {}),
        noteData.icd10_codes || [],
        noteData.icpc_codes || [],
        noteData.vestibular_data ? JSON.stringify(noteData.vestibular_data) : null,
        noteData.duration_minutes || 30,
        noteData.vas_pain_start || null,
        noteData.vas_pain_end || null,
        JSON.stringify(noteData.prescribed_exercises || []),
        noteData.is_draft !== false,
        noteData.is_draft !== false ? new Date() : null,
        noteData.auto_save_data ? JSON.stringify(noteData.auto_save_data) : null,
        noteData.encounter_id || null,
        userId,
      ]
    );

    logger.info('Clinical note created:', {
      organizationId,
      noteId: result.rows[0].id,
      patientId: noteData.patient_id,
    });

    const noteResult = result.rows[0];
    if (validation.warnings.length > 0 || validation.redFlags.length > 0) {
      noteResult._validation = {
        warnings: validation.warnings,
        redFlags: validation.redFlags,
        completenessScore: validation.completenessScore,
        suggestions: validation.suggestions,
      };
    }

    return noteResult;
  } catch (error) {
    logger.error('Error creating clinical note:', error);
    throw error;
  }
};

/**
 * Update clinical note
 */
export const updateNote = async (organizationId, noteId, noteData, userId) => {
  try {
    const existingResult = await query(
      'SELECT signed_at, is_draft FROM clinical_notes WHERE organization_id = $1 AND id = $2',
      [organizationId, noteId]
    );

    if (existingResult.rows.length === 0) {
      return null;
    }
    if (existingResult.rows[0].signed_at) {
      throw new BusinessLogicError('Cannot update signed note. Create an amendment instead.');
    }

    const updateFields = [];
    const params = [organizationId, noteId];
    let paramIndex = 3;

    const allowedFields = [
      'note_type',
      'template_type',
      'note_date',
      'status',
      'subjective',
      'objective',
      'assessment',
      'plan',
      'icd10_codes',
      'icpc_codes',
      'vestibular_data',
      'duration_minutes',
      'vas_pain_start',
      'vas_pain_end',
      'prescribed_exercises',
      'is_draft',
      'auto_save_data',
    ];
    const jsonFields = [
      'subjective',
      'objective',
      'assessment',
      'plan',
      'vestibular_data',
      'prescribed_exercises',
      'auto_save_data',
    ];

    for (const field of allowedFields) {
      if (noteData[field] !== undefined) {
        const value = jsonFields.includes(field)
          ? JSON.stringify(noteData[field])
          : noteData[field];
        updateFields.push(`${field} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    if (noteData.is_draft) {
      updateFields.push(`draft_saved_at = NOW()`);
    }
    updateFields.push(`updated_by = $${paramIndex}`);
    params.push(userId);

    const result = await query(
      `UPDATE clinical_notes SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE organization_id = $1 AND id = $2 RETURNING *`,
      params
    );

    logger.info('Clinical note updated:', {
      organizationId,
      noteId,
      fieldsUpdated: updateFields.length,
    });
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating clinical note:', error);
    throw error;
  }
};

/**
 * Auto-save draft note
 */
export const autoSaveDraft = async (organizationId, noteId, autoSaveData, userId) => {
  try {
    const result = await query(
      `UPDATE clinical_notes
       SET auto_save_data = $3, draft_saved_at = NOW(), updated_by = $4, updated_at = NOW()
       WHERE organization_id = $1 AND id = $2 AND signed_at IS NULL
       RETURNING id, draft_saved_at`,
      [organizationId, noteId, JSON.stringify(autoSaveData), userId]
    );

    if (result.rows.length === 0) {
      throw new BusinessLogicError('Note not found or already signed');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error auto-saving draft:', error);
    throw error;
  }
};

/**
 * Sign clinical note (makes it immutable)
 */
export const signNote = async (organizationId, noteId, userId) => {
  try {
    const noteResult = await query(
      `SELECT id, organization_id, signed_at, subjective, objective, assessment, plan, icd10_codes, icpc_codes
       FROM clinical_notes WHERE organization_id = $1 AND id = $2`,
      [organizationId, noteId]
    );

    if (noteResult.rows.length === 0) {
      throw new Error('Note not found');
    }
    const note = noteResult.rows[0];
    if (note.signed_at) {
      throw new BusinessLogicError('Note is already signed');
    }

    const contentString = JSON.stringify({
      subjective: note.subjective,
      objective: note.objective,
      assessment: note.assessment,
      plan: note.plan,
      icd10_codes: note.icd10_codes,
      icpc_codes: note.icpc_codes,
    });
    const signatureHash = Buffer.from(contentString).toString('base64').slice(0, 64);

    const result = await query(
      `UPDATE clinical_notes
       SET signed_at = NOW(), signed_by = $3, signature_hash = $4,
           is_draft = false, status = 'signed', auto_save_data = NULL
       WHERE organization_id = $1 AND id = $2 AND signed_at IS NULL
       RETURNING *`,
      [organizationId, noteId, userId, signatureHash]
    );

    if (result.rows.length === 0) {
      throw new Error('Note not found or already signed');
    }

    logger.info('Clinical note signed:', { organizationId, noteId, signedBy: userId });
    return result.rows[0];
  } catch (error) {
    logger.error('Error signing clinical note:', error);
    throw error;
  }
};

/**
 * Delete clinical note (only drafts)
 */
export const deleteNote = async (organizationId, noteId, userId) => {
  try {
    const result = await query(
      `DELETE FROM clinical_notes WHERE organization_id = $1 AND id = $2 AND signed_at IS NULL RETURNING id`,
      [organizationId, noteId]
    );

    if (result.rows.length === 0) {
      throw new BusinessLogicError('Note not found or cannot delete signed notes');
    }

    logger.info('Clinical note deleted:', { organizationId, noteId, deletedBy: userId });
    return { deleted: true, id: noteId };
  } catch (error) {
    logger.error('Error deleting clinical note:', error);
    throw error;
  }
};

/**
 * Get note templates
 */
export const getNoteTemplates = async (organizationId, options = {}) => {
  const { templateType = null, category = null, activeOnly = true } = options;

  try {
    let whereClause = 'WHERE (organization_id = $1 OR is_system_template = true)';
    const params = [organizationId];
    let paramIndex = 2;

    if (activeOnly) {
      whereClause += ' AND is_active = true';
    }
    if (templateType) {
      params.push(templateType);
      whereClause += ` AND template_type = $${paramIndex}`;
      paramIndex++;
    }
    if (category) {
      params.push(category);
      whereClause += ` AND category = $${paramIndex}`;
      paramIndex++;
    }

    const result = await query(
      `SELECT id, organization_id, name, description, template_type, category,
              subjective_template, objective_template, assessment_template, plan_template,
              default_duration, default_codes, is_active, is_system_template, usage_count,
              created_at, updated_at, created_by
       FROM clinical_note_templates
       ${whereClause}
       ORDER BY is_system_template DESC, usage_count DESC, name ASC`,
      params
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting note templates:', error);
    throw error;
  }
};

/**
 * Get draft notes for a user
 */
export const getUserDrafts = async (organizationId, userId) => {
  try {
    const result = await query(
      `SELECT cn.*, p.first_name || ' ' || p.last_name as patient_name
      FROM clinical_notes cn
      JOIN patients p ON p.id = cn.patient_id
      WHERE cn.organization_id = $1 AND cn.practitioner_id = $2
        AND cn.is_draft = true AND cn.signed_at IS NULL
      ORDER BY cn.draft_saved_at DESC`,
      [organizationId, userId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting user drafts:', error);
    throw error;
  }
};

/**
 * Get note history (amendments and versions)
 */
export const getNoteHistory = async (organizationId, noteId) => {
  try {
    const result = await query(
      `SELECT id, version, amendment_text, amended_at, amended_by,
              u.first_name || ' ' || u.last_name as amended_by_name
      FROM clinical_note_amendments cna
      LEFT JOIN users u ON u.id = cna.amended_by
      WHERE cna.organization_id = $1 AND cna.note_id = $2
      ORDER BY cna.amended_at DESC`,
      [organizationId, noteId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting note history:', error);
    throw error;
  }
};

/**
 * Create amendment for signed note
 */
export const createAmendment = async (organizationId, noteId, amendmentData, userId) => {
  try {
    const noteResult = await query(
      'SELECT signed_at FROM clinical_notes WHERE organization_id = $1 AND id = $2',
      [organizationId, noteId]
    );

    if (noteResult.rows.length === 0) {
      throw new Error('Note not found');
    }
    if (!noteResult.rows[0].signed_at) {
      throw new BusinessLogicError('Can only amend signed notes. Use update for draft notes.');
    }

    const result = await query(
      `INSERT INTO clinical_note_amendments (organization_id, note_id, amendment_text, reason, amended_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [organizationId, noteId, amendmentData.text, amendmentData.reason, userId]
    );

    await query(
      `UPDATE clinical_notes SET has_amendments = true, updated_at = NOW() WHERE id = $1`,
      [noteId]
    );

    logger.info('Amendment created:', { organizationId, noteId, amendedBy: userId });
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating amendment:', error);
    throw error;
  }
};
