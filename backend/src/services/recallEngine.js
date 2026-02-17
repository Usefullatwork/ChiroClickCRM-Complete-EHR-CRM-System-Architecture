/**
 * Smart Recall Engine
 * Condition-based recall rules for patient follow-ups
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import { createNotification } from './notifications.js';

// Default recall intervals by diagnosis category (in days)
const DEFAULT_RECALL_RULES = {
  acute_pain: {
    label: 'Akutt smerte',
    intervals: [14, 42],
    description: '2-ukers sjekk, 6-ukers re-evaluering',
  },
  chronic_pain: {
    label: 'Kronisk smerte',
    intervals: [90, 180, 365],
    description: '3, 6 og 12 måneders oppfølging',
  },
  post_surgery: {
    label: 'Postoperativ',
    intervals: [14, 42, 90, 180],
    description: '2-ukers, 6-ukers, 3 og 6 måneders kontroll',
  },
  maintenance: {
    label: 'Vedlikehold/Wellness',
    intervals: [28, 56],
    description: '4 og 8 ukers vedlikeholdsbesøk',
  },
  vestibular: {
    label: 'Vestibulær',
    intervals: [7, 21, 60],
    description: '1-ukes, 3-ukers, 2 måneders kontroll',
  },
  pediatric: {
    label: 'Barn/Ungdom',
    intervals: [30, 90, 180],
    description: '1, 3 og 6 måneders oppfølging',
  },
};

/**
 * Get recall rules for an organization (defaults merged with org overrides)
 */
export const getRecallRules = async (orgId) => {
  try {
    const result = await query(
      `SELECT setting_value FROM organization_settings
       WHERE organization_id = $1 AND setting_key = 'recall_rules'`,
      [orgId]
    );

    if (result.rows.length > 0 && result.rows[0].setting_value) {
      const orgRules =
        typeof result.rows[0].setting_value === 'string'
          ? JSON.parse(result.rows[0].setting_value)
          : result.rows[0].setting_value;
      // Merge org overrides on top of defaults
      return { ...DEFAULT_RECALL_RULES, ...orgRules };
    }

    return { ...DEFAULT_RECALL_RULES };
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      logger.debug('organization_settings table not found, using defaults');
      return { ...DEFAULT_RECALL_RULES };
    }
    logger.error('Error getting recall rules:', error);
    return { ...DEFAULT_RECALL_RULES };
  }
};

/**
 * Update recall rules for an organization
 */
export const updateRecallRules = async (orgId, rules) => {
  try {
    await query(
      `INSERT INTO organization_settings (organization_id, setting_key, setting_value)
       VALUES ($1, 'recall_rules', $2)
       ON CONFLICT (organization_id, setting_key)
       DO UPDATE SET setting_value = $2, updated_at = NOW()`,
      [orgId, JSON.stringify(rules)]
    );

    logger.info(`Recall rules updated for org ${orgId}`);
    return await getRecallRules(orgId);
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      logger.debug('organization_settings table not found, cannot save rules');
      return { ...DEFAULT_RECALL_RULES, ...rules };
    }
    logger.error('Error updating recall rules:', error);
    throw error;
  }
};

/**
 * Get recall schedule for a specific patient
 */
export const getRecallSchedule = async (orgId, patientId) => {
  try {
    // Get patient's active treatment plans and diagnoses
    const plansResult = await query(
      `SELECT tp.id, tp.diagnosis, tp.category, tp.status, tp.start_date, tp.end_date
       FROM treatment_plans tp
       WHERE tp.organization_id = $1 AND tp.patient_id = $2
       ORDER BY tp.created_at DESC`,
      [orgId, patientId]
    );

    // Get existing follow-ups for this patient
    const followUpsResult = await query(
      `SELECT id, follow_up_type, reason, due_date, status, created_at
       FROM follow_ups
       WHERE organization_id = $1 AND patient_id = $2
       ORDER BY due_date ASC`,
      [orgId, patientId]
    );

    // Get recall rules
    const rules = await getRecallRules(orgId);

    // Calculate upcoming recall dates based on treatment plans
    const upcomingRecalls = [];
    const today = new Date();

    for (const plan of plansResult.rows) {
      const category = plan.category || 'chronic_pain';
      const rule = rules[category];
      if (!rule) {
        continue;
      }

      const startDate = plan.end_date ? new Date(plan.end_date) : new Date(plan.start_date);

      for (const intervalDays of rule.intervals) {
        const recallDate = new Date(startDate);
        recallDate.setDate(recallDate.getDate() + intervalDays);

        // Check if a follow-up already exists for this date (within 3-day window)
        const existingFollowUp = followUpsResult.rows.find((fu) => {
          const fuDate = new Date(fu.due_date);
          const diff = Math.abs(fuDate - recallDate) / (1000 * 60 * 60 * 24);
          return diff <= 3;
        });

        upcomingRecalls.push({
          planId: plan.id,
          diagnosis: plan.diagnosis,
          category,
          categoryLabel: rule.label,
          intervalDays,
          recallDate: recallDate.toISOString().split('T')[0],
          isPast: recallDate < today,
          hasFollowUp: !!existingFollowUp,
          followUpId: existingFollowUp?.id || null,
          followUpStatus: existingFollowUp?.status || null,
        });
      }
    }

    return {
      patientId,
      plans: plansResult.rows,
      existingFollowUps: followUpsResult.rows,
      upcomingRecalls: upcomingRecalls.sort(
        (a, b) => new Date(a.recallDate) - new Date(b.recallDate)
      ),
    };
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      logger.debug('Required tables not found for recall schedule');
      return { patientId, plans: [], existingFollowUps: [], upcomingRecalls: [] };
    }
    logger.error('Error getting recall schedule:', error);
    throw error;
  }
};

/**
 * Auto-create recall follow-ups when a treatment plan completes
 */
export const createRecallFromTreatmentPlan = async (orgId, planId) => {
  try {
    const planResult = await query(
      `SELECT tp.*, p.first_name, p.last_name
       FROM treatment_plans tp
       JOIN patients p ON p.id = tp.patient_id
       WHERE tp.id = $1 AND tp.organization_id = $2`,
      [planId, orgId]
    );

    if (planResult.rows.length === 0) {
      logger.warn(`Treatment plan ${planId} not found`);
      return [];
    }

    const plan = planResult.rows[0];
    const rules = await getRecallRules(orgId);
    const category = plan.category || 'chronic_pain';
    const rule = rules[category];

    if (!rule) {
      logger.info(`No recall rule for category ${category}`);
      return [];
    }

    const createdFollowUps = [];
    const baseDate = plan.end_date ? new Date(plan.end_date) : new Date();

    for (const intervalDays of rule.intervals) {
      const dueDate = new Date(baseDate);
      dueDate.setDate(dueDate.getDate() + intervalDays);

      try {
        const result = await query(
          `INSERT INTO follow_ups (
            organization_id, patient_id, follow_up_type, reason,
            due_date, priority, status, notes
          ) VALUES ($1, $2, 'RECALL', $3, $4, 'MEDIUM', 'PENDING', $5)
          RETURNING *`,
          [
            orgId,
            plan.patient_id,
            `Recall: ${rule.label} (${intervalDays} dager)`,
            dueDate.toISOString().split('T')[0],
            `Auto-opprettet fra behandlingsplan: ${plan.diagnosis || 'Ukjent diagnose'}`,
          ]
        );

        createdFollowUps.push(result.rows[0]);
      } catch (insertError) {
        logger.error(`Error creating recall follow-up for plan ${planId}:`, insertError);
      }
    }

    logger.info(`Created ${createdFollowUps.length} recall follow-ups for plan ${planId}`);
    return createdFollowUps;
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      logger.debug('Required tables not found for recall creation');
      return [];
    }
    logger.error('Error creating recall from treatment plan:', error);
    throw error;
  }
};

/**
 * Schedule recall for a patient based on a category
 */
export const schedulePatientRecall = async (orgId, patientId, category, startDate = null) => {
  const rules = await getRecallRules(orgId);
  const rule = rules[category];

  if (!rule) {
    throw new Error(`Unknown recall category: ${category}`);
  }

  const baseDate = startDate ? new Date(startDate) : new Date();
  const createdFollowUps = [];

  for (const intervalDays of rule.intervals) {
    const dueDate = new Date(baseDate);
    dueDate.setDate(dueDate.getDate() + intervalDays);

    try {
      const result = await query(
        `INSERT INTO follow_ups (
          organization_id, patient_id, follow_up_type, reason,
          due_date, priority, status, notes
        ) VALUES ($1, $2, 'RECALL', $3, $4, 'MEDIUM', 'PENDING', $5)
        RETURNING *`,
        [
          orgId,
          patientId,
          `Recall: ${rule.label} (${intervalDays} dager)`,
          dueDate.toISOString().split('T')[0],
          `Manuelt planlagt recall - ${rule.description}`,
        ]
      );

      createdFollowUps.push(result.rows[0]);
    } catch (insertError) {
      logger.error(`Error scheduling recall for patient ${patientId}:`, insertError);
    }
  }

  logger.info(
    `Scheduled ${createdFollowUps.length} recalls for patient ${patientId} (${category})`
  );
  return createdFollowUps;
};

/**
 * Process all due recalls across all organizations
 * Called by daily cron job
 */
export const processRecalls = async () => {
  try {
    // Find all due recalls that haven't been actioned
    const dueResult = await query(
      `SELECT
        f.id, f.organization_id, f.patient_id, f.reason, f.due_date,
        p.first_name, p.last_name,
        p.preferred_therapist_id
       FROM follow_ups f
       JOIN patients p ON p.id = f.patient_id
       WHERE f.follow_up_type = 'RECALL'
         AND f.status = 'PENDING'
         AND f.due_date <= CURRENT_DATE
       ORDER BY f.due_date ASC
       LIMIT 500`
    );

    const processed = { total: dueResult.rows.length, notified: 0, errors: 0 };

    for (const recall of dueResult.rows) {
      try {
        // Create notification for the practitioner
        const targetUserId = recall.preferred_therapist_id;
        if (targetUserId) {
          await createNotification({
            organizationId: recall.organization_id,
            userId: targetUserId,
            type: 'RECALL_ALERT',
            title: 'Recall forfalt',
            message: `${recall.first_name} ${recall.last_name} har en forfalt recall: ${recall.reason}`,
            link: `/patients/${recall.patient_id}`,
            priority: 'HIGH',
          });
          processed.notified++;
        }
      } catch (notifyError) {
        logger.error(`Error notifying for recall ${recall.id}:`, notifyError);
        processed.errors++;
      }
    }

    logger.info('Recall processing complete:', processed);
    return processed;
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      logger.debug('Follow-ups or patients table not found for recall processing');
      return { total: 0, notified: 0, errors: 0, skipped: true };
    }
    logger.error('Error processing recalls:', error);
    throw error;
  }
};

export default {
  getRecallRules,
  updateRecallRules,
  getRecallSchedule,
  createRecallFromTreatmentPlan,
  schedulePatientRecall,
  processRecalls,
};
