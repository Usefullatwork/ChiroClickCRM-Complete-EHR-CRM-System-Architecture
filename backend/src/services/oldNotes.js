/**
 * Old Journal Notes Service
 * Handles import, processing, and organization of old patient journal notes
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import {
  organizeOldJournalNotes,
  organizeMultipleNotes,
  mergeOrganizedNotes
} from './ai.js';

/**
 * Create a new batch for importing notes
 */
export const createBatch = async (organizationId, patientId, batchName, uploadedBy) => {
  const result = await query(
    `INSERT INTO imported_notes_batches
     (organization_id, patient_id, batch_name, uploaded_by, upload_date, batch_status)
     VALUES ($1, $2, $3, $4, NOW(), 'uploading')
     RETURNING *`,
    [organizationId, patientId, batchName, uploadedBy]
  );

  return result.rows[0];
};

/**
 * Import a single old journal note
 */
export const importJournalNote = async (data) => {
  const {
    patientId,
    organizationId,
    originalContent,
    originalFilename,
    uploadedBy,
    batchId = null
  } = data;

  try {
    // Insert the note
    const result = await query(
      `INSERT INTO imported_journal_notes
       (patient_id, organization_id, original_content, original_filename,
        uploaded_by, upload_date, processing_status)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'pending')
       RETURNING *`,
      [patientId, organizationId, originalContent, originalFilename, uploadedBy]
    );

    const note = result.rows[0];

    // Link to batch if provided
    if (batchId) {
      await query(
        `INSERT INTO batch_notes (batch_id, note_id) VALUES ($1, $2)`,
        [batchId, note.id]
      );

      // Update batch totals
      await query(
        `UPDATE imported_notes_batches
         SET total_notes = total_notes + 1
         WHERE id = $1`,
        [batchId]
      );
    }

    logger.info(`Imported journal note ${note.id} for patient ${patientId}`);
    return note;

  } catch (error) {
    logger.error('Error importing journal note:', error);
    throw error;
  }
};

/**
 * Import multiple journal notes at once
 */
export const importMultipleNotes = async (notes, patientId, organizationId, uploadedBy, batchName = null) => {
  try {
    // Create batch
    const batch = await createBatch(organizationId, patientId, batchName || `Import ${new Date().toISOString()}`, uploadedBy);

    const importedNotes = [];
    for (const note of notes) {
      const imported = await importJournalNote({
        patientId,
        organizationId,
        originalContent: note.content,
        originalFilename: note.filename,
        uploadedBy,
        batchId: batch.id
      });
      importedNotes.push(imported);
    }

    // Update batch status
    await query(
      `UPDATE imported_notes_batches
       SET batch_status = 'processing'
       WHERE id = $1`,
      [batch.id]
    );

    return {
      batch,
      notes: importedNotes
    };

  } catch (error) {
    logger.error('Error importing multiple notes:', error);
    throw error;
  }
};

/**
 * Process a single note with AI
 */
export const processNoteWithAI = async (noteId, patientContext = {}) => {
  try {
    // Get the note
    const noteResult = await query(
      `SELECT * FROM imported_journal_notes WHERE id = $1`,
      [noteId]
    );

    if (noteResult.rows.length === 0) {
      throw new Error('Note not found');
    }

    const note = noteResult.rows[0];

    // Update status to processing
    await query(
      `UPDATE imported_journal_notes
       SET processing_status = 'processing'
       WHERE id = $1`,
      [noteId]
    );

    // Process with AI
    const aiResult = await organizeOldJournalNotes(note.original_content, patientContext);

    if (aiResult.success) {
      // Update note with AI results
      await query(
        `UPDATE imported_journal_notes
         SET ai_organized_data = $1,
             generated_soap = $2,
             suggested_encounter_date = $3,
             suggested_encounter_type = $4,
             suggested_diagnosis_codes = $5,
             ai_confidence_score = $6,
             ai_model_used = $7,
             ai_processing_date = NOW(),
             processing_status = 'completed'
         WHERE id = $8`,
        [
          JSON.stringify(aiResult.organizedData.structured_data || {}),
          JSON.stringify(aiResult.organizedData.soap || {}),
          aiResult.organizedData.suggested_date || null,
          aiResult.organizedData.suggested_encounter_type || 'FOLLOWUP',
          aiResult.organizedData.structured_data?.diagnoses || null,
          aiResult.organizedData.confidence_score || 0.5,
          aiResult.model,
          noteId
        ]
      );

      // Get updated note
      const updatedResult = await query(
        `SELECT * FROM imported_journal_notes WHERE id = $1`,
        [noteId]
      );

      return {
        success: true,
        note: updatedResult.rows[0],
        aiResult
      };

    } else {
      // Mark as failed
      await query(
        `UPDATE imported_journal_notes
         SET processing_status = 'failed'
         WHERE id = $1`,
        [noteId]
      );

      return {
        success: false,
        error: aiResult.error
      };
    }

  } catch (error) {
    logger.error(`Error processing note ${noteId}:`, error);

    // Mark as failed
    await query(
      `UPDATE imported_journal_notes
       SET processing_status = 'failed'
       WHERE id = $1`,
      [noteId]
    );

    throw error;
  }
};

/**
 * Process all notes in a batch
 */
export const processBatchWithAI = async (batchId, patientContext = {}) => {
  try {
    // Get all notes in batch
    const notesResult = await query(
      `SELECT n.* FROM imported_journal_notes n
       JOIN batch_notes bn ON n.id = bn.note_id
       WHERE bn.batch_id = $1 AND n.processing_status = 'pending'`,
      [batchId]
    );

    const results = [];

    for (const note of notesResult.rows) {
      try {
        const result = await processNoteWithAI(note.id, patientContext);
        results.push(result);

        // Update batch progress
        await query(
          `UPDATE imported_notes_batches
           SET processed_notes = processed_notes + 1
           WHERE id = $1`,
          [batchId]
        );

      } catch (error) {
        logger.error(`Failed to process note ${note.id} in batch ${batchId}:`, error);
        results.push({
          success: false,
          noteId: note.id,
          error: error.message
        });
      }
    }

    // Update batch status
    await query(
      `UPDATE imported_notes_batches
       SET batch_status = 'completed'
       WHERE id = $1`,
      [batchId]
    );

    return {
      batchId,
      totalProcessed: results.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      results
    };

  } catch (error) {
    logger.error(`Error processing batch ${batchId}:`, error);
    throw error;
  }
};

/**
 * Get all imported notes for a patient
 */
export const getPatientImportedNotes = async (patientId, organizationId, filters = {}) => {
  const { status, approved, limit = 50, offset = 0 } = filters;

  let whereClause = 'WHERE patient_id = $1 AND organization_id = $2';
  const params = [patientId, organizationId];
  let paramCount = 2;

  if (status) {
    paramCount++;
    whereClause += ` AND processing_status = $${paramCount}`;
    params.push(status);
  }

  if (approved !== undefined) {
    paramCount++;
    whereClause += ` AND approved = $${paramCount}`;
    params.push(approved);
  }

  const result = await query(
    `SELECT * FROM imported_journal_notes
     ${whereClause}
     ORDER BY upload_date DESC
     LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
    [...params, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM imported_journal_notes ${whereClause}`,
    params
  );

  return {
    notes: result.rows,
    total: parseInt(countResult.rows[0].count),
    limit,
    offset
  };
};

/**
 * Get a single imported note by ID
 */
export const getImportedNoteById = async (noteId, organizationId) => {
  const result = await query(
    `SELECT * FROM imported_journal_notes
     WHERE id = $1 AND organization_id = $2`,
    [noteId, organizationId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};

/**
 * Review and approve/reject a processed note
 */
export const reviewNote = async (noteId, reviewData) => {
  const { reviewedBy, approved, reviewNotes } = reviewData;

  const result = await query(
    `UPDATE imported_journal_notes
     SET reviewed_by = $1,
         reviewed_date = NOW(),
         review_notes = $2,
         approved = $3,
         processing_status = 'reviewed'
     WHERE id = $4
     RETURNING *`,
    [reviewedBy, reviewNotes, approved, noteId]
  );

  if (result.rows.length === 0) {
    throw new Error('Note not found');
  }

  // Update batch approved count if applicable
  await query(
    `UPDATE imported_notes_batches b
     SET approved_notes = (
       SELECT COUNT(*) FROM imported_journal_notes n
       JOIN batch_notes bn ON n.id = bn.note_id
       WHERE bn.batch_id = b.id AND n.approved = true
     )
     WHERE b.id IN (
       SELECT batch_id FROM batch_notes WHERE note_id = $1
     )`,
    [noteId]
  );

  return result.rows[0];
};

/**
 * Convert an approved note to a clinical encounter
 */
export const convertToEncounter = async (noteId, userId, organizationId) => {
  try {
    // Get the note
    const note = await getImportedNoteById(noteId, organizationId);

    if (!note) {
      throw new Error('Note not found');
    }

    if (!note.approved) {
      throw new Error('Note must be approved before conversion');
    }

    if (note.converted_to_encounter_id) {
      throw new Error('Note has already been converted to an encounter');
    }

    // Create clinical encounter from the generated SOAP data
    const encounterResult = await query(
      `INSERT INTO clinical_encounters
       (patient_id, organization_id, encounter_date, encounter_type,
        subjective, objective, assessment, plan, icpc_codes,
        created_by, created_at, version, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 1, 'DRAFT')
       RETURNING *`,
      [
        note.patient_id,
        organizationId,
        note.suggested_encounter_date || new Date(),
        note.suggested_encounter_type || 'FOLLOWUP',
        note.generated_soap?.subjective || {},
        note.generated_soap?.objective || {},
        note.generated_soap?.assessment || {},
        note.generated_soap?.plan || {},
        note.suggested_diagnosis_codes || [],
        userId
      ]
    );

    const encounter = encounterResult.rows[0];

    // Update the note to mark it as converted
    await query(
      `UPDATE imported_journal_notes
       SET converted_to_encounter_id = $1,
           conversion_date = NOW()
       WHERE id = $2`,
      [encounter.id, noteId]
    );

    logger.info(`Converted imported note ${noteId} to encounter ${encounter.id}`);

    return {
      success: true,
      encounter,
      noteId
    };

  } catch (error) {
    logger.error(`Error converting note ${noteId} to encounter:`, error);
    throw error;
  }
};

/**
 * Get batch information with progress
 */
export const getBatchInfo = async (batchId, organizationId) => {
  const batchResult = await query(
    `SELECT * FROM imported_notes_batches
     WHERE id = $1 AND organization_id = $2`,
    [batchId, organizationId]
  );

  if (batchResult.rows.length === 0) {
    return null;
  }

  const batch = batchResult.rows[0];

  // Get notes in batch
  const notesResult = await query(
    `SELECT n.* FROM imported_journal_notes n
     JOIN batch_notes bn ON n.id = bn.note_id
     WHERE bn.batch_id = $1
     ORDER BY n.upload_date DESC`,
    [batchId]
  );

  return {
    ...batch,
    notes: notesResult.rows
  };
};

/**
 * Delete an imported note
 */
export const deleteImportedNote = async (noteId, organizationId) => {
  // Check if already converted to encounter
  const note = await getImportedNoteById(noteId, organizationId);

  if (!note) {
    throw new Error('Note not found');
  }

  if (note.converted_to_encounter_id) {
    throw new Error('Cannot delete a note that has been converted to an encounter');
  }

  await query(
    `DELETE FROM imported_journal_notes
     WHERE id = $1 AND organization_id = $2`,
    [noteId, organizationId]
  );

  logger.info(`Deleted imported note ${noteId}`);
  return { success: true };
};

/**
 * Update the SOAP data for a note (manual editing before approval)
 */
export const updateNoteSoapData = async (noteId, organizationId, soapData) => {
  const result = await query(
    `UPDATE imported_journal_notes
     SET generated_soap = $1,
         updated_at = NOW()
     WHERE id = $2 AND organization_id = $3
     RETURNING *`,
    [JSON.stringify(soapData), noteId, organizationId]
  );

  if (result.rows.length === 0) {
    throw new Error('Note not found');
  }

  return result.rows[0];
};

export default {
  createBatch,
  importJournalNote,
  importMultipleNotes,
  processNoteWithAI,
  processBatchWithAI,
  getPatientImportedNotes,
  getImportedNoteById,
  reviewNote,
  convertToEncounter,
  getBatchInfo,
  deleteImportedNote,
  updateNoteSoapData
};
