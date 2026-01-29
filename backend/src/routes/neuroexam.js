/**
 * Neurological Examination API Routes
 *
 * Endpoints for managing neurological examinations:
 * - Create/update examination sessions
 * - Save test results
 * - Generate clinical narratives
 * - Track red flags and referrals
 * - BPPV treatment logging
 */

import express from 'express';
const router = express.Router();
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import { body, param, query, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { logAudit } from '../utils/audit.js';

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

const validateExamId = [
  param('examId').isUUID().withMessage('Invalid examination ID')
];

const validateCreateExam = [
  body('patientId').isUUID().withMessage('Valid patient ID required'),
  body('encounterId').optional().isUUID(),
  body('examType').optional().isIn(['COMPREHENSIVE', 'SCREENING', 'FOLLOW_UP'])
];

const validateTestResults = [
  body('testResults').isObject().withMessage('Test results must be an object'),
  body('clusterScores').optional().isObject()
];

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /api/v1/neuroexam
 * List neurological examinations for organization
 */
router.get('/',
  requireAuth,
  requireOrganization,
  [
    query('patientId').optional().isUUID(),
    query('status').optional().isIn(['IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'AMENDED']),
    query('hasRedFlags').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        patientId,
        status,
        hasRedFlags,
        limit = 50,
        offset = 0
      } = req.query;

      let queryText = `
        SELECT
          ne.*,
          p.first_name || ' ' || p.last_name as patient_name,
          u.first_name || ' ' || u.last_name as practitioner_name
        FROM neurological_examinations ne
        JOIN patients p ON p.id = ne.patient_id
        LEFT JOIN users u ON u.id = ne.practitioner_id
        WHERE ne.organization_id = $1
      `;
      const params = [req.organizationId];
      let paramIndex = 2;

      if (patientId) {
        queryText += ` AND ne.patient_id = $${paramIndex++}`;
        params.push(patientId);
      }

      if (status) {
        queryText += ` AND ne.status = $${paramIndex++}`;
        params.push(status);
      }

      if (hasRedFlags !== undefined) {
        queryText += ` AND ne.has_red_flags = $${paramIndex++}`;
        params.push(hasRedFlags === 'true');
      }

      queryText += ` ORDER BY ne.exam_date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await pool.query(queryText, params);

      res.json({
        data: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: result.rowCount
        }
      });

    } catch (error) {
      console.error('Error fetching neurological examinations:', error);
      res.status(500).json({ error: 'Failed to fetch examinations' });
    }
  }
);

/**
 * GET /api/v1/neuroexam/:examId
 * Get single neurological examination
 */
router.get('/:examId',
  requireAuth,
  requireOrganization,
  validateExamId,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { examId } = req.params;

      const result = await pool.query(`
        SELECT
          ne.*,
          p.first_name || ' ' || p.last_name as patient_name,
          p.date_of_birth as patient_dob,
          u.first_name || ' ' || u.last_name as practitioner_name
        FROM neurological_examinations ne
        JOIN patients p ON p.id = ne.patient_id
        LEFT JOIN users u ON u.id = ne.practitioner_id
        WHERE ne.id = $1 AND ne.organization_id = $2
      `, [examId, req.organizationId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Examination not found' });
      }

      // Get detailed test results
      const testResults = await pool.query(`
        SELECT * FROM neuro_exam_test_results
        WHERE examination_id = $1
        ORDER BY cluster_id, test_id
      `, [examId]);

      // Get vestibular findings if present
      const vestibularFindings = await pool.query(`
        SELECT * FROM vestibular_findings
        WHERE examination_id = $1
      `, [examId]);

      res.json({
        data: {
          ...result.rows[0],
          detailed_test_results: testResults.rows,
          vestibular_findings: vestibularFindings.rows[0] || null
        }
      });

    } catch (error) {
      console.error('Error fetching examination:', error);
      res.status(500).json({ error: 'Failed to fetch examination' });
    }
  }
);

/**
 * POST /api/v1/neuroexam
 * Create new neurological examination
 */
router.post('/',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN', 'PRACTITIONER']),
  validateCreateExam,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        patientId,
        encounterId,
        examType = 'COMPREHENSIVE',
        testResults = {},
        clusterScores = {},
        redFlags = [],
        bppvDiagnosis,
        narrativeText
      } = req.body;

      await client.query('BEGIN');

      // Create examination record
      const examResult = await client.query(`
        INSERT INTO neurological_examinations (
          organization_id,
          patient_id,
          encounter_id,
          practitioner_id,
          exam_type,
          test_results,
          cluster_scores,
          red_flags,
          bppv_diagnosis,
          narrative_text,
          narrative_generated_at,
          referral_recommended,
          referral_urgency,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        req.organizationId,
        patientId,
        encounterId || null,
        req.userId,
        examType,
        JSON.stringify(testResults),
        JSON.stringify(clusterScores),
        JSON.stringify(redFlags),
        bppvDiagnosis ? JSON.stringify(bppvDiagnosis) : null,
        narrativeText || null,
        narrativeText ? new Date() : null,
        redFlags.length > 0,
        determineReferralUrgency(redFlags, clusterScores),
        'IN_PROGRESS'
      ]);

      const examId = examResult.rows[0].id;

      // Insert normalized test results
      for (const [testId, testData] of Object.entries(testResults)) {
        if (testData && testData.criteria) {
          const positiveCriteria = Object.entries(testData.criteria)
            .filter(([, val]) => val)
            .map(([key]) => key);

          const isPositive = positiveCriteria.length > 0;
          const clusterId = determineClusterId(testId);

          await client.query(`
            INSERT INTO neuro_exam_test_results (
              examination_id,
              cluster_id,
              test_id,
              is_positive,
              positive_criteria,
              measured_value,
              side,
              is_red_flag,
              clinician_notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            examId,
            clusterId,
            testId,
            isPositive,
            positiveCriteria,
            testData.value || null,
            testData.side || 'N/A',
            testData.isRedFlag || false,
            testData.notes || null
          ]);
        }
      }

      await client.query('COMMIT');

      // Audit log
      await logAudit({
        organizationId: req.organizationId,
        userId: req.userId,
        action: 'CREATE',
        resourceType: 'NEUROLOGICAL_EXAM',
        resourceId: examId,
        details: { patientId, examType, hasRedFlags: redFlags.length > 0 }
      });

      res.status(201).json({
        data: examResult.rows[0],
        message: 'Examination created successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating examination:', error);
      res.status(500).json({ error: 'Failed to create examination' });
    } finally {
      client.release();
    }
  }
);

/**
 * PUT /api/v1/neuroexam/:examId
 * Update neurological examination
 */
router.put('/:examId',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN', 'PRACTITIONER']),
  validateExamId,
  validateTestResults,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { examId } = req.params;
      const {
        testResults,
        clusterScores,
        redFlags,
        bppvDiagnosis,
        narrativeText,
        status
      } = req.body;

      await client.query('BEGIN');

      // Check exam exists and belongs to organization
      const existing = await client.query(`
        SELECT * FROM neurological_examinations
        WHERE id = $1 AND organization_id = $2
      `, [examId, req.organizationId]);

      if (existing.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Examination not found' });
      }

      // Update examination
      const updateResult = await client.query(`
        UPDATE neurological_examinations SET
          test_results = COALESCE($1, test_results),
          cluster_scores = COALESCE($2, cluster_scores),
          red_flags = COALESCE($3, red_flags),
          bppv_diagnosis = COALESCE($4, bppv_diagnosis),
          narrative_text = COALESCE($5, narrative_text),
          narrative_generated_at = CASE WHEN $5 IS NOT NULL THEN NOW() ELSE narrative_generated_at END,
          referral_recommended = COALESCE($6, referral_recommended),
          referral_urgency = COALESCE($7, referral_urgency),
          status = COALESCE($8, status),
          completed_at = CASE WHEN $8 = 'COMPLETED' THEN NOW() ELSE completed_at END,
          updated_at = NOW()
        WHERE id = $9
        RETURNING *
      `, [
        testResults ? JSON.stringify(testResults) : null,
        clusterScores ? JSON.stringify(clusterScores) : null,
        redFlags ? JSON.stringify(redFlags) : null,
        bppvDiagnosis ? JSON.stringify(bppvDiagnosis) : null,
        narrativeText,
        redFlags ? redFlags.length > 0 : null,
        redFlags ? determineReferralUrgency(redFlags, clusterScores) : null,
        status,
        examId
      ]);

      // Update normalized test results
      if (testResults) {
        // Delete existing and re-insert
        await client.query('DELETE FROM neuro_exam_test_results WHERE examination_id = $1', [examId]);

        for (const [testId, testData] of Object.entries(testResults)) {
          if (testData && testData.criteria) {
            const positiveCriteria = Object.entries(testData.criteria)
              .filter(([, val]) => val)
              .map(([key]) => key);

            await client.query(`
              INSERT INTO neuro_exam_test_results (
                examination_id, cluster_id, test_id, is_positive, positive_criteria,
                measured_value, side, is_red_flag, clinician_notes
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
              examId,
              determineClusterId(testId),
              testId,
              positiveCriteria.length > 0,
              positiveCriteria,
              testData.value || null,
              testData.side || 'N/A',
              testData.isRedFlag || false,
              testData.notes || null
            ]);
          }
        }
      }

      await client.query('COMMIT');

      // Audit log
      await logAudit({
        organizationId: req.organizationId,
        userId: req.userId,
        action: 'UPDATE',
        resourceType: 'NEUROLOGICAL_EXAM',
        resourceId: examId,
        details: { status, hasRedFlags: redFlags?.length > 0 }
      });

      res.json({
        data: updateResult.rows[0],
        message: 'Examination updated successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating examination:', error);
      res.status(500).json({ error: 'Failed to update examination' });
    } finally {
      client.release();
    }
  }
);

/**
 * POST /api/v1/neuroexam/:examId/complete
 * Mark examination as complete
 */
router.post('/:examId/complete',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN', 'PRACTITIONER']),
  validateExamId,
  async (req, res) => {
    try {
      const { examId } = req.params;
      const { narrativeText } = req.body;

      const result = await pool.query(`
        UPDATE neurological_examinations SET
          status = 'COMPLETED',
          completed_at = NOW(),
          narrative_text = COALESCE($1, narrative_text),
          narrative_generated_at = CASE WHEN $1 IS NOT NULL THEN NOW() ELSE narrative_generated_at END,
          updated_at = NOW()
        WHERE id = $2 AND organization_id = $3
        RETURNING *
      `, [narrativeText, examId, req.organizationId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Examination not found' });
      }

      res.json({
        data: result.rows[0],
        message: 'Examination marked as complete'
      });

    } catch (error) {
      console.error('Error completing examination:', error);
      res.status(500).json({ error: 'Failed to complete examination' });
    }
  }
);

/**
 * POST /api/v1/neuroexam/:examId/referral
 * Record referral sent
 */
router.post('/:examId/referral',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN', 'PRACTITIONER']),
  validateExamId,
  [
    body('specialty').notEmpty().withMessage('Specialty required'),
    body('urgency').isIn(['ROUTINE', 'URGENT', 'EMERGENT'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { examId } = req.params;
      const { specialty, urgency, notes } = req.body;

      const result = await pool.query(`
        UPDATE neurological_examinations SET
          referral_specialty = $1,
          referral_urgency = $2,
          referral_sent_at = NOW(),
          updated_at = NOW()
        WHERE id = $3 AND organization_id = $4
        RETURNING *
      `, [specialty, urgency, examId, req.organizationId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Examination not found' });
      }

      // Audit log
      await logAudit({
        organizationId: req.organizationId,
        userId: req.userId,
        action: 'REFERRAL_SENT',
        resourceType: 'NEUROLOGICAL_EXAM',
        resourceId: examId,
        details: { specialty, urgency }
      });

      res.json({
        data: result.rows[0],
        message: 'Referral recorded'
      });

    } catch (error) {
      console.error('Error recording referral:', error);
      res.status(500).json({ error: 'Failed to record referral' });
    }
  }
);

/**
 * POST /api/v1/neuroexam/bppv-treatment
 * Log BPPV treatment
 */
router.post('/bppv-treatment',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN', 'PRACTITIONER']),
  [
    body('examId').optional().isUUID(),
    body('patientId').isUUID(),
    body('canalAffected').isIn(['POSTERIOR', 'LATERAL', 'ANTERIOR']),
    body('sideAffected').isIn(['LEFT', 'RIGHT']),
    body('treatmentManeuver').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        examId,
        patientId,
        canalAffected,
        sideAffected,
        variant,
        treatmentManeuver,
        repetitions,
        preVAS,
        postVAS,
        immediateResolution,
        homeExercises,
        notes
      } = req.body;

      const result = await pool.query(`
        INSERT INTO bppv_treatments (
          examination_id,
          patient_id,
          practitioner_id,
          canal_affected,
          side_affected,
          variant,
          treatment_maneuver,
          repetitions,
          pre_treatment_vertigo_vas,
          post_treatment_vertigo_vas,
          immediate_resolution,
          home_exercises_prescribed,
          brandt_daroff_prescribed,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        examId || null,
        patientId,
        req.userId,
        canalAffected,
        sideAffected,
        variant || null,
        treatmentManeuver,
        repetitions || 1,
        preVAS || null,
        postVAS || null,
        immediateResolution || false,
        homeExercises || false,
        homeExercises || false,
        notes || null
      ]);

      res.status(201).json({
        data: result.rows[0],
        message: 'BPPV treatment logged successfully'
      });

    } catch (error) {
      console.error('Error logging BPPV treatment:', error);
      res.status(500).json({ error: 'Failed to log treatment' });
    }
  }
);

/**
 * GET /api/v1/neuroexam/red-flags
 * Get all pending red flag alerts
 */
router.get('/alerts/red-flags',
  requireAuth,
  requireOrganization,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT * FROM neuro_red_flag_alerts
        WHERE organization_id = $1
        ORDER BY
          CASE referral_urgency WHEN 'EMERGENT' THEN 1 WHEN 'URGENT' THEN 2 ELSE 3 END,
          exam_date DESC
        LIMIT 50
      `, [req.organizationId]);

      res.json({ data: result.rows });

    } catch (error) {
      console.error('Error fetching red flag alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  }
);

/**
 * GET /api/v1/neuroexam/patient/:patientId/history
 * Get patient's neurological exam history
 */
router.get('/patient/:patientId/history',
  requireAuth,
  requireOrganization,
  [param('patientId').isUUID()],
  async (req, res) => {
    try {
      const { patientId } = req.params;

      const result = await pool.query(`
        SELECT
          ne.id,
          ne.exam_date,
          ne.exam_type,
          ne.status,
          ne.cluster_scores,
          ne.has_red_flags,
          ne.bppv_diagnosis,
          ne.referral_recommended,
          ne.referral_urgency,
          u.first_name || ' ' || u.last_name as practitioner_name
        FROM neurological_examinations ne
        LEFT JOIN users u ON u.id = ne.practitioner_id
        WHERE ne.patient_id = $1 AND ne.organization_id = $2
        ORDER BY ne.exam_date DESC
        LIMIT 20
      `, [patientId, req.organizationId]);

      // Get BPPV treatment history
      const bppvHistory = await pool.query(`
        SELECT * FROM bppv_treatment_outcomes
        WHERE patient_id = $1
        ORDER BY treatment_date DESC
        LIMIT 10
      `, [patientId]);

      res.json({
        data: {
          examinations: result.rows,
          bppvTreatments: bppvHistory.rows
        }
      });

    } catch (error) {
      console.error('Error fetching patient history:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  }
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Determine cluster ID from test ID
 */
function determineClusterId(testId) {
  const clusterMappings = {
    'saccade_': 'CEREBELLAR',
    'smooth_pursuit': 'CEREBELLAR',
    'gaze_evoked': 'CEREBELLAR',
    'finger_nose': 'CEREBELLAR',
    'dysdiadocho': 'CEREBELLAR',
    'tandem': 'CEREBELLAR',
    'romberg': 'CEREBELLAR',
    'heel_knee': 'CEREBELLAR',
    'spontaneous_nystagmus': 'VESTIBULAR',
    'head_impulse': 'VESTIBULAR',
    'caloric': 'VESTIBULAR',
    'skew': 'VESTIBULAR',
    'gait_head': 'VESTIBULAR',
    'dynamic_visual': 'VESTIBULAR',
    'dix_hallpike': 'BPPV',
    'supine_roll': 'BPPV',
    'bow_and_lean': 'BPPV',
    'deep_head': 'BPPV',
    'cervical_rom': 'CERVICOGENIC',
    'pursuit_neck': 'CERVICOGENIC',
    'flexion_rotation': 'CERVICOGENIC',
    'vertebral_artery': 'CERVICOGENIC',
    'joint_position': 'CERVICOGENIC',
    'palpation': 'CERVICOGENIC',
    'provocation': 'CERVICOGENIC',
    'tmj': 'TMJ',
    'masseter': 'TMJ',
    'mandibular': 'TMJ',
    'cervical_mandibular': 'TMJ',
    'sharp_purser': 'UPPER_CERVICAL_INSTABILITY',
    'alar': 'UPPER_CERVICAL_INSTABILITY',
    'transverse': 'UPPER_CERVICAL_INSTABILITY',
    'membrana': 'UPPER_CERVICAL_INSTABILITY',
    'hoffmann': 'MYELOPATHY',
    'hyperreflexia': 'MYELOPATHY',
    'babinski': 'MYELOPATHY',
    'lhermitte': 'MYELOPATHY',
    'hand_function': 'MYELOPATHY',
    'leg_length': 'ACTIVATOR',
    'segmental': 'ACTIVATOR'
  };

  for (const [prefix, cluster] of Object.entries(clusterMappings)) {
    if (testId.startsWith(prefix) || testId.includes(prefix)) {
      return cluster;
    }
  }

  return 'OTHER';
}

/**
 * Determine referral urgency based on red flags and scores
 */
function determineReferralUrgency(redFlags, clusterScores) {
  if (!redFlags || redFlags.length === 0) return null;

  // Check for myelopathy red flags
  const hasMyelopathy = redFlags.some(f =>
    f.clusterId === 'MYELOPATHY' ||
    f.testId?.includes('hoffmann') ||
    f.testId?.includes('babinski') ||
    f.testId?.includes('lhermitte')
  );

  if (hasMyelopathy) return 'EMERGENT';

  // Check for upper cervical instability
  const hasInstability = redFlags.some(f =>
    f.clusterId === 'UPPER_CERVICAL_INSTABILITY' ||
    f.testId?.includes('sharp_purser') ||
    f.testId?.includes('alar') ||
    f.testId?.includes('transverse')
  );

  if (hasInstability) return 'EMERGENT';

  // Check for central vestibular signs (HINTS+)
  const hasCentralSigns = redFlags.some(f =>
    f.testId?.includes('skew') ||
    f.label?.toLowerCase().includes('central')
  );

  if (hasCentralSigns) return 'URGENT';

  // Default for other red flags
  return 'ROUTINE';
}

export default router;
