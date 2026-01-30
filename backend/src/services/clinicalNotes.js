/**
 * Clinical Notes Service
 * Business logic for SOAP documentation and clinical note management
 */

import { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';
import { BusinessLogicError } from '../utils/errors.js';

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
    search = null
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

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM clinical_notes cn ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get notes
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
        pages: Math.ceil(total / limit)
      }
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
        p.solvit_id,
        p.date_of_birth,
        p.red_flags,
        p.contraindications,
        p.allergies,
        p.current_medications,
        u.first_name || ' ' || u.last_name as practitioner_name,
        u.hpr_number,
        s.first_name || ' ' || s.last_name as signed_by_name
      FROM clinical_notes cn
      JOIN patients p ON p.id = cn.patient_id
      LEFT JOIN users u ON u.id = cn.practitioner_id
      LEFT JOIN users s ON s.id = cn.signed_by
      WHERE cn.organization_id = $1 AND cn.id = $2`,
      [organizationId, noteId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
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
      `SELECT
        cn.*,
        u.first_name || ' ' || u.last_name as practitioner_name
      FROM clinical_notes cn
      LEFT JOIN users u ON u.id = cn.practitioner_id
      ${whereClause}
      ORDER BY cn.note_date DESC
      LIMIT $3`,
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
    const result = await query(
      `INSERT INTO clinical_notes (
        organization_id,
        patient_id,
        practitioner_id,
        note_type,
        template_type,
        note_date,
        status,
        subjective,
        objective,
        assessment,
        plan,
        icd10_codes,
        icpc_codes,
        vestibular_data,
        duration_minutes,
        vas_pain_start,
        vas_pain_end,
        prescribed_exercises,
        is_draft,
        draft_saved_at,
        auto_save_data,
        encounter_id,
        created_by
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
        userId
      ]
    );

    logger.info('Clinical note created:', {
      organizationId,
      noteId: result.rows[0].id,
      patientId: noteData.patient_id
    });

    return result.rows[0];
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
    // Check if note is signed (immutable)
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

    // Build UPDATE clause
    const updateFields = [];
    const params = [organizationId, noteId];
    let paramIndex = 3;

    const allowedFields = [
      'note_type', 'template_type', 'note_date', 'status',
      'subjective', 'objective', 'assessment', 'plan',
      'icd10_codes', 'icpc_codes', 'vestibular_data',
      'duration_minutes', 'vas_pain_start', 'vas_pain_end',
      'prescribed_exercises', 'is_draft', 'auto_save_data'
    ];

    const jsonFields = ['subjective', 'objective', 'assessment', 'plan', 'vestibular_data', 'prescribed_exercises', 'auto_save_data'];

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

    // Add draft timestamp if saving as draft
    if (noteData.is_draft) {
      updateFields.push(`draft_saved_at = NOW()`);
    }

    // Add updated_by
    updateFields.push(`updated_by = $${paramIndex}`);
    params.push(userId);

    const result = await query(
      `UPDATE clinical_notes
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE organization_id = $1 AND id = $2
       RETURNING *`,
      params
    );

    logger.info('Clinical note updated:', {
      organizationId,
      noteId,
      fieldsUpdated: updateFields.length
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
    // Generate signature hash
    const noteResult = await query(
      'SELECT * FROM clinical_notes WHERE organization_id = $1 AND id = $2',
      [organizationId, noteId]
    );

    if (noteResult.rows.length === 0) {
      throw new Error('Note not found');
    }

    const note = noteResult.rows[0];
    if (note.signed_at) {
      throw new BusinessLogicError('Note is already signed');
    }

    // Create signature hash from content
    const contentString = JSON.stringify({
      subjective: note.subjective,
      objective: note.objective,
      assessment: note.assessment,
      plan: note.plan,
      icd10_codes: note.icd10_codes,
      icpc_codes: note.icpc_codes
    });

    // Simple hash for integrity verification (in production, use crypto)
    const signatureHash = Buffer.from(contentString).toString('base64').slice(0, 64);

    const result = await query(
      `UPDATE clinical_notes
       SET signed_at = NOW(),
           signed_by = $3,
           signature_hash = $4,
           is_draft = false,
           status = 'signed',
           auto_save_data = NULL
       WHERE organization_id = $1 AND id = $2 AND signed_at IS NULL
       RETURNING *`,
      [organizationId, noteId, userId, signatureHash]
    );

    if (result.rows.length === 0) {
      throw new Error('Note not found or already signed');
    }

    logger.info('Clinical note signed:', {
      organizationId,
      noteId,
      signedBy: userId
    });

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
      `DELETE FROM clinical_notes
       WHERE organization_id = $1 AND id = $2 AND signed_at IS NULL
       RETURNING id`,
      [organizationId, noteId]
    );

    if (result.rows.length === 0) {
      throw new BusinessLogicError('Note not found or cannot delete signed notes');
    }

    logger.info('Clinical note deleted:', {
      organizationId,
      noteId,
      deletedBy: userId
    });

    return { deleted: true, id: noteId };
  } catch (error) {
    logger.error('Error deleting clinical note:', error);
    throw error;
  }
};

/**
 * Generate formatted note for export/print
 */
export const generateFormattedNote = async (organizationId, noteId) => {
  try {
    const note = await getNoteById(organizationId, noteId);

    if (!note) {
      throw new Error('Note not found');
    }

    // Parse JSON fields
    const subjective = note.subjective || {};
    const objective = note.objective || {};
    const assessment = note.assessment || {};
    const plan = note.plan || {};

    // Generate formatted note in Norwegian
    let formattedNote = `KLINISK NOTAT\n\n`;
    formattedNote += `Pasient: ${note.patient_name}\n`;
    formattedNote += `Dato: ${new Date(note.note_date).toLocaleDateString('no-NO')}\n`;
    formattedNote += `Behandler: ${note.practitioner_name}${note.hpr_number ? ` (HPR: ${note.hpr_number})` : ''}\n`;
    formattedNote += `Notattype: ${note.template_type}\n\n`;

    // Subjective
    formattedNote += `SUBJEKTIVT (S):\n`;
    if (subjective.chief_complaint) formattedNote += `Hovedplage: ${subjective.chief_complaint}\n`;
    if (subjective.history) formattedNote += `Anamnese: ${subjective.history}\n`;
    if (subjective.onset) formattedNote += `Debut: ${subjective.onset}\n`;
    if (subjective.pain_description) formattedNote += `Smertebeskrivelse: ${subjective.pain_description}\n`;
    if (subjective.aggravating_factors) formattedNote += `Forverrende faktorer: ${subjective.aggravating_factors}\n`;
    if (subjective.relieving_factors) formattedNote += `Lindrende faktorer: ${subjective.relieving_factors}\n`;
    if (note.vas_pain_start !== null) formattedNote += `VAS ved start: ${note.vas_pain_start}/10\n`;
    formattedNote += `\n`;

    // Objective
    formattedNote += `OBJEKTIVT (O):\n`;
    if (objective.observation) formattedNote += `Observasjon: ${objective.observation}\n`;
    if (objective.palpation) formattedNote += `Palpasjon: ${objective.palpation}\n`;
    if (objective.rom) formattedNote += `Bevegelighet: ${objective.rom}\n`;
    if (objective.ortho_tests) formattedNote += `Ortopediske tester: ${objective.ortho_tests}\n`;
    if (objective.neuro_tests) formattedNote += `Nevrologiske tester: ${objective.neuro_tests}\n`;
    if (objective.vital_signs) formattedNote += `Vitale tegn: ${objective.vital_signs}\n`;
    formattedNote += `\n`;

    // Assessment
    formattedNote += `VURDERING (A):\n`;
    if (note.icpc_codes && note.icpc_codes.length > 0) {
      formattedNote += `Diagnose (ICPC-2): ${note.icpc_codes.join(', ')}\n`;
    }
    if (note.icd10_codes && note.icd10_codes.length > 0) {
      formattedNote += `Diagnose (ICD-10): ${note.icd10_codes.join(', ')}\n`;
    }
    if (assessment.clinical_reasoning) formattedNote += `Klinisk resonnement: ${assessment.clinical_reasoning}\n`;
    if (assessment.prognosis) formattedNote += `Prognose: ${assessment.prognosis}\n`;
    formattedNote += `\n`;

    // Plan
    formattedNote += `PLAN (P):\n`;
    if (plan.treatment) formattedNote += `Behandling: ${plan.treatment}\n`;
    if (plan.exercises) formattedNote += `Hjemmeovelser: ${plan.exercises}\n`;
    if (plan.advice) formattedNote += `Rad: ${plan.advice}\n`;
    if (plan.follow_up) formattedNote += `Oppfolging: ${plan.follow_up}\n`;
    if (note.vas_pain_end !== null) formattedNote += `VAS ved slutt: ${note.vas_pain_end}/10\n`;

    // Vestibular specific
    if (note.vestibular_data && note.template_type === 'VESTIBULAR') {
      formattedNote += `\nVESTIBULAR VURDERING:\n`;
      const vestibular = note.vestibular_data;
      if (vestibular.primary_diagnosis) formattedNote += `Diagnose: ${vestibular.primary_diagnosis}\n`;
      if (vestibular.dhi_score) formattedNote += `DHI Score: ${vestibular.dhi_score}/100\n`;
      if (vestibular.maneuvers_performed?.length > 0) {
        formattedNote += `Utforte manovrer: ${vestibular.maneuvers_performed.map(m => m.type).join(', ')}\n`;
      }
    }

    // Signature
    if (note.signed_at) {
      formattedNote += `\n---\n`;
      formattedNote += `Signert: ${new Date(note.signed_at).toLocaleString('no-NO')}\n`;
      formattedNote += `Signert av: ${note.signed_by_name}\n`;
    }

    // Update note with generated text
    await query(
      'UPDATE clinical_notes SET generated_note = $1 WHERE id = $2',
      [formattedNote, noteId]
    );

    return formattedNote;
  } catch (error) {
    logger.error('Error generating formatted note:', error);
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
      `SELECT * FROM clinical_note_templates
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
      `SELECT
        cn.*,
        p.first_name || ' ' || p.last_name as patient_name
      FROM clinical_notes cn
      JOIN patients p ON p.id = cn.patient_id
      WHERE cn.organization_id = $1
        AND cn.practitioner_id = $2
        AND cn.is_draft = true
        AND cn.signed_at IS NULL
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
 * Search notes
 */
export const searchNotes = async (organizationId, searchQuery, options = {}) => {
  const { limit = 20, patientId = null } = options;

  try {
    let whereClause = 'WHERE cn.organization_id = $1 AND cn.search_vector @@ plainto_tsquery(\'simple\', $2)';
    const params = [organizationId, searchQuery];
    let paramIndex = 3;

    if (patientId) {
      params.push(patientId);
      whereClause += ` AND cn.patient_id = $${paramIndex}`;
      paramIndex++;
    }

    params.push(limit);

    const result = await query(
      `SELECT
        cn.*,
        p.first_name || ' ' || p.last_name as patient_name,
        ts_rank(cn.search_vector, plainto_tsquery('simple', $2)) as rank
      FROM clinical_notes cn
      JOIN patients p ON p.id = cn.patient_id
      ${whereClause}
      ORDER BY rank DESC
      LIMIT $${paramIndex}`,
      params
    );

    return result.rows;
  } catch (error) {
    logger.error('Error searching notes:', error);
    throw error;
  }
};

/**
 * Generate PDF document for clinical note
 * Generates a professional PDF with Norwegian formatting
 */
export const generateNotePDF = async (organizationId, noteId, options = {}) => {
  // Dynamic import for PDFKit
  const PDFDocument = (await import('pdfkit')).default;

  try {
    const note = await getNoteById(organizationId, noteId);

    if (!note) {
      throw new Error('Note not found');
    }

    // Parse JSON fields
    const subjective = typeof note.subjective === 'string'
      ? JSON.parse(note.subjective)
      : note.subjective || {};
    const objective = typeof note.objective === 'string'
      ? JSON.parse(note.objective)
      : note.objective || {};
    const assessment = typeof note.assessment === 'string'
      ? JSON.parse(note.assessment)
      : note.assessment || {};
    const plan = typeof note.plan === 'string'
      ? JSON.parse(note.plan)
      : note.plan || {};
    const vestibularData = note.vestibular_data
      ? (typeof note.vestibular_data === 'string'
          ? JSON.parse(note.vestibular_data)
          : note.vestibular_data)
      : null;

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Klinisk Notat - ${note.patient_name}`,
        Author: note.practitioner_name || 'ChiroClickCRM',
        Subject: 'Klinisk Notat',
        CreationDate: new Date()
      }
    });

    // Collect PDF data in buffer
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    // Helper function to add section header
    const addSectionHeader = (title) => {
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a365d').text(title);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
      doc.moveDown(0.3);
      doc.font('Helvetica').fillColor('#000000').fontSize(10);
    };

    // Helper function to add field
    const addField = (label, value, inline = false) => {
      if (value !== null && value !== undefined && value !== '') {
        if (inline) {
          doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
          doc.font('Helvetica').text(String(value));
        } else {
          doc.font('Helvetica-Bold').text(`${label}:`);
          doc.font('Helvetica').text(String(value), { indent: 10 });
        }
        doc.moveDown(0.3);
      }
    };

    // ==== HEADER ====
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1a365d').text('KLINISK NOTAT', { align: 'center' });
    doc.moveDown(0.5);

    // Clinic info (could be customized per organization)
    doc.fontSize(10).font('Helvetica').fillColor('#4a5568');
    doc.text('Klinikk', { align: 'center' });
    doc.moveDown(1);

    // ==== PATIENT INFO BOX ====
    doc.rect(50, doc.y, 495, 80).stroke('#e2e8f0');
    const infoBoxY = doc.y + 10;

    doc.fillColor('#000000').fontSize(10);
    doc.text(`Pasient: ${note.patient_name}`, 60, infoBoxY);
    if (note.date_of_birth) {
      doc.text(`Fodselsdato: ${new Date(note.date_of_birth).toLocaleDateString('no-NO')}`, 300, infoBoxY);
    }
    doc.text(`Dato: ${new Date(note.note_date).toLocaleDateString('no-NO')}`, 60, infoBoxY + 20);
    doc.text(`Behandler: ${note.practitioner_name || 'Ikke angitt'}`, 300, infoBoxY + 20);
    if (note.hpr_number) {
      doc.text(`HPR: ${note.hpr_number}`, 300, infoBoxY + 40);
    }
    doc.text(`Notattype: ${getTemplateTypeLabel(note.template_type)}`, 60, infoBoxY + 40);
    if (note.duration_minutes) {
      doc.text(`Varighet: ${note.duration_minutes} min`, 60, infoBoxY + 60);
    }

    doc.y = infoBoxY + 90;

    // ==== VAS SCORES ====
    if (note.vas_pain_start !== null || note.vas_pain_end !== null) {
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Bold').text('Smerteskala (VAS):', { continued: true });
      doc.font('Helvetica');
      if (note.vas_pain_start !== null) {
        doc.text(` Start: ${note.vas_pain_start}/10`, { continued: note.vas_pain_end !== null });
      }
      if (note.vas_pain_end !== null) {
        doc.text(` Slutt: ${note.vas_pain_end}/10`);
      }
    }

    // ==== SUBJECTIVE ====
    addSectionHeader('SUBJEKTIVT (S)');
    addField('Hovedklage', subjective.chiefComplaint || subjective.chief_complaint || subjective.hovedklage);
    addField('Anamnese', subjective.history || subjective.anamnese);
    addField('Debut', subjective.onset || subjective.debut);
    addField('Smertebeskrivelse', subjective.painDescription || subjective.pain_description);
    addField('Lokalisasjon', subjective.location || subjective.lokalisasjon);
    addField('Utstralende smerte', subjective.radiation || subjective.utstralende);
    addField('Forverrende faktorer', subjective.aggravatingFactors || subjective.aggravating_factors);
    addField('Lindrende faktorer', subjective.relievingFactors || subjective.relieving_factors);
    addField('Nattlig smerte', subjective.nightPain || subjective.night_pain);
    addField('Tidligere behandling', subjective.previousTreatment || subjective.previous_treatment);

    // ==== OBJECTIVE ====
    addSectionHeader('OBJEKTIVT (O)');
    addField('Observasjon', objective.observation || objective.observasjon);
    addField('Holdning', objective.posture || objective.holdning);
    addField('Gange', objective.gait || objective.gange);
    addField('Palpasjon', objective.palpation || objective.palpasjon);
    addField('Bevegelighet (ROM)', objective.rom || objective.bevegelighet);
    addField('Ortopediske tester', objective.orthoTests || objective.ortho_tests);
    addField('Nevrologiske tester', objective.neuroTests || objective.neuro_tests);

    // Vital signs
    if (objective.vitalSigns || objective.vital_signs) {
      const vitals = objective.vitalSigns || objective.vital_signs;
      let vitalStr = '';
      if (vitals.bloodPressure) vitalStr += `BT: ${vitals.bloodPressure} mmHg  `;
      if (vitals.pulse) vitalStr += `Puls: ${vitals.pulse}/min  `;
      if (vitals.temperature) vitalStr += `Temp: ${vitals.temperature}°C  `;
      if (vitals.respiration) vitalStr += `Resp: ${vitals.respiration}/min`;
      if (vitalStr) addField('Vitale tegn', vitalStr.trim());
    }

    addField('Funn', objective.findings || objective.funn);

    // ==== ASSESSMENT ====
    addSectionHeader('VURDERING (A)');

    // Diagnosis codes
    if (note.icd10_codes && note.icd10_codes.length > 0) {
      addField('ICD-10 Diagnosekoder', note.icd10_codes.join(', '));
    }
    if (note.icpc_codes && note.icpc_codes.length > 0) {
      addField('ICPC-2 Diagnosekoder', note.icpc_codes.join(', '));
    }

    addField('Klinisk vurdering', assessment.clinicalReasoning || assessment.clinical_reasoning || assessment.vurdering);
    addField('Diagnose', assessment.diagnosis || assessment.diagnose);
    addField('Differensialdiagnoser', assessment.differentialDiagnosis || assessment.differential_diagnosis);
    addField('Prognose', assessment.prognosis || assessment.prognose);
    addField('Alvorlighetsgrad', assessment.severity || assessment.alvorlighet);

    // Red flags
    if (assessment.redFlags && assessment.redFlags.length > 0) {
      doc.font('Helvetica-Bold').fillColor('#c53030').text('Rode flagg:');
      doc.font('Helvetica').fillColor('#000000');
      assessment.redFlags.forEach(flag => {
        doc.text(`  • ${flag}`, { indent: 10 });
      });
      doc.moveDown(0.3);
    }

    // ==== PLAN ====
    addSectionHeader('PLAN (P)');
    addField('Behandling utfort', plan.treatment || plan.behandling);
    addField('Teknikker brukt', plan.techniques || plan.teknikker);
    addField('Hjemmeovelser', plan.exercises || plan.hjemmeovelser);
    addField('Rad og veiledning', plan.advice || plan.rad);
    addField('Oppfolging', plan.followUp || plan.follow_up || plan.oppfolging);
    addField('Neste time', plan.nextAppointment || plan.next_appointment);
    addField('Malsettinger', plan.goals || plan.malsettinger);
    addField('Henvisning', plan.referral || plan.henvisning);

    // ==== VESTIBULAR DATA (if applicable) ====
    if (vestibularData && note.template_type === 'VESTIBULAR') {
      addSectionHeader('VESTIBULAR VURDERING');
      addField('Diagnose', vestibularData.primaryDiagnosis || vestibularData.primary_diagnosis);
      addField('DHI Score', vestibularData.dhiScore ? `${vestibularData.dhiScore}/100` : null);
      addField('Vertigo varighet', vestibularData.vertigoDuration);
      addField('Triggere', vestibularData.triggers);

      if (vestibularData.maneuversPerformed && vestibularData.maneuversPerformed.length > 0) {
        doc.font('Helvetica-Bold').text('Utforte manovrer:');
        vestibularData.maneuversPerformed.forEach(m => {
          doc.font('Helvetica').text(`  • ${m.type}: ${m.result || 'Utfort'}`, { indent: 10 });
        });
        doc.moveDown(0.3);
      }

      if (vestibularData.nystagmusFindings) {
        addField('Nystagmus funn', vestibularData.nystagmusFindings);
      }
    }

    // ==== PRESCRIBED EXERCISES ====
    if (note.prescribed_exercises && note.prescribed_exercises.length > 0) {
      const exercises = typeof note.prescribed_exercises === 'string'
        ? JSON.parse(note.prescribed_exercises)
        : note.prescribed_exercises;

      if (exercises.length > 0) {
        addSectionHeader('FORESKREVNE OVELSER');
        exercises.forEach((ex, index) => {
          doc.font('Helvetica-Bold').text(`${index + 1}. ${ex.name || ex.exercise_name}`);
          if (ex.sets && ex.reps) {
            doc.font('Helvetica').text(`   ${ex.sets} sett x ${ex.reps} repetisjoner`, { indent: 10 });
          }
          if (ex.frequency) {
            doc.font('Helvetica').text(`   Frekvens: ${ex.frequency}`, { indent: 10 });
          }
          if (ex.instructions) {
            doc.font('Helvetica').text(`   Instruksjoner: ${ex.instructions}`, { indent: 10 });
          }
        });
        doc.moveDown(0.3);
      }
    }

    // ==== SIGNATURE ====
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown(0.5);

    if (note.signed_at) {
      doc.fontSize(9).fillColor('#2d3748');
      doc.font('Helvetica-Bold').text('Signert elektronisk');
      doc.font('Helvetica');
      doc.text(`Dato: ${new Date(note.signed_at).toLocaleString('no-NO')}`);
      doc.text(`Signert av: ${note.signed_by_name}`);
      if (note.signature_hash) {
        doc.fontSize(8).fillColor('#718096');
        doc.text(`Verifiseringskode: ${note.signature_hash.substring(0, 16)}...`);
      }
    } else {
      doc.fontSize(9).fillColor('#c53030');
      doc.font('Helvetica-Bold').text('UTKAST - IKKE SIGNERT');
      doc.font('Helvetica').fillColor('#718096');
      doc.text(`Sist lagret: ${new Date(note.draft_saved_at || note.updated_at).toLocaleString('no-NO')}`);
    }

    // Footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#a0aec0');
      doc.text(
        `Side ${i + 1} av ${pageCount} | Generert ${new Date().toLocaleString('no-NO')} | ChiroClickCRM`,
        50,
        doc.page.height - 30,
        { align: 'center', width: doc.page.width - 100 }
      );
    }

    // Finalize PDF
    doc.end();

    // Return as buffer
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
    });

  } catch (error) {
    logger.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Helper function to get template type label in Norwegian
 */
const getTemplateTypeLabel = (type) => {
  const labels = {
    'SOAP': 'SOAP Notat',
    'INITIAL': 'Forstegangsundersokelse',
    'FOLLOW_UP': 'Oppfolgingskonsultasjon',
    'VESTIBULAR': 'Vestibular Vurdering',
    'DISCHARGE': 'Avslutningsnotat',
    'PROGRESS': 'Fremdriftsnotat'
  };
  return labels[type] || type;
};

/**
 * Get note history (amendments and versions)
 */
export const getNoteHistory = async (organizationId, noteId) => {
  try {
    const result = await query(
      `SELECT
        id,
        version,
        amendment_text,
        amended_at,
        amended_by,
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
    // Verify note is signed
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

    // Create amendment record
    const result = await query(
      `INSERT INTO clinical_note_amendments (
        organization_id,
        note_id,
        amendment_text,
        reason,
        amended_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [organizationId, noteId, amendmentData.text, amendmentData.reason, userId]
    );

    // Update note to indicate it has amendments
    await query(
      `UPDATE clinical_notes
       SET has_amendments = true, updated_at = NOW()
       WHERE id = $1`,
      [noteId]
    );

    logger.info('Amendment created:', {
      organizationId,
      noteId,
      amendedBy: userId
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error creating amendment:', error);
    throw error;
  }
};

export default {
  getAllNotes,
  getNoteById,
  getPatientNotes,
  createNote,
  updateNote,
  autoSaveDraft,
  signNote,
  deleteNote,
  generateFormattedNote,
  generateNotePDF,
  getNoteTemplates,
  getUserDrafts,
  searchNotes,
  getNoteHistory,
  createAmendment
};
