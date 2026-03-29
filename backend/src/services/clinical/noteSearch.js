/**
 * Clinical Note Search
 * Full-text search across clinical notes
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';

/**
 * Search notes
 */
export const searchNotes = async (organizationId, searchQuery, options = {}) => {
  const { limit = 20, patientId = null } = options;

  try {
    let whereClause =
      "WHERE cn.organization_id = $1 AND cn.search_vector @@ plainto_tsquery('simple', $2)";
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
