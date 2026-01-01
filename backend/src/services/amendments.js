/**
 * Encounter Amendments Service
 * Business logic for amendments to signed clinical encounters
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import { BusinessLogicError } from '../utils/errors.js';

/**
 * Create amendment for signed encounter
 */
export const createAmendment = async (organizationId, encounterId, userId, amendmentData) => {
  try {
    // Verify encounter exists and is signed
    const encounterResult = await query(
      'SELECT signed_at FROM clinical_encounters WHERE organization_id = $1 AND id = $2',
      [organizationId, encounterId]
    );

    if (encounterResult.rows.length === 0) {
      throw new BusinessLogicError('Encounter not found');
    }

    if (!encounterResult.rows[0].signed_at) {
      throw new BusinessLogicError('Cannot add amendment to unsigned encounter. Edit the encounter directly instead.');
    }

    const result = await query(
      `INSERT INTO encounter_amendments (
        encounter_id,
        organization_id,
        author_id,
        amendment_type,
        reason,
        content,
        affected_sections
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        encounterId,
        organizationId,
        userId,
        amendmentData.amendment_type || 'ADDENDUM',
        amendmentData.reason || null,
        amendmentData.content,
        JSON.stringify(amendmentData.affected_sections || [])
      ]
    );

    logger.info('Amendment created:', {
      organizationId,
      encounterId,
      amendmentId: result.rows[0].id,
      type: amendmentData.amendment_type
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error creating amendment:', error);
    throw error;
  }
};

/**
 * Get amendments for an encounter
 */
export const getEncounterAmendments = async (organizationId, encounterId) => {
  try {
    const result = await query(
      `SELECT
        ea.*,
        u.first_name || ' ' || u.last_name as author_name,
        su.first_name || ' ' || su.last_name as signed_by_name
      FROM encounter_amendments ea
      LEFT JOIN users u ON u.id = ea.author_id
      LEFT JOIN users su ON su.id = ea.signed_by
      WHERE ea.organization_id = $1 AND ea.encounter_id = $2
      ORDER BY ea.created_at ASC`,
      [organizationId, encounterId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting amendments:', error);
    throw error;
  }
};

/**
 * Sign amendment (make it part of official record)
 */
export const signAmendment = async (organizationId, amendmentId, userId) => {
  try {
    const result = await query(
      `UPDATE encounter_amendments
       SET signed_at = NOW(), signed_by = $3
       WHERE organization_id = $1 AND id = $2 AND signed_at IS NULL
       RETURNING *`,
      [organizationId, amendmentId, userId]
    );

    if (result.rows.length === 0) {
      throw new BusinessLogicError('Amendment not found or already signed');
    }

    logger.info('Amendment signed:', {
      organizationId,
      amendmentId,
      signedBy: userId
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error signing amendment:', error);
    throw error;
  }
};

/**
 * Delete unsigned amendment (only author can delete)
 */
export const deleteAmendment = async (organizationId, amendmentId, userId) => {
  try {
    const result = await query(
      `DELETE FROM encounter_amendments
       WHERE organization_id = $1 AND id = $2 AND author_id = $3 AND signed_at IS NULL
       RETURNING id`,
      [organizationId, amendmentId, userId]
    );

    if (result.rows.length === 0) {
      throw new BusinessLogicError('Amendment not found, already signed, or you are not the author');
    }

    logger.info('Amendment deleted:', {
      organizationId,
      amendmentId,
      deletedBy: userId
    });

    return true;
  } catch (error) {
    logger.error('Error deleting amendment:', error);
    throw error;
  }
};

export default {
  createAmendment,
  getEncounterAmendments,
  signAmendment,
  deleteAmendment
};
