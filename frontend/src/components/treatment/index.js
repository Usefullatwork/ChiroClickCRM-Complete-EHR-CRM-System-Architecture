/**
 * Treatment Plan Components
 *
 * Internal clinical tracking tools (NOT patient-facing sales packages):
 * - Care plan documentation for clinical records
 * - Phase-based treatment tracking for internal use
 * - Goal setting for clinical outcomes
 * - Progress monitoring for KPIs
 *
 * Note: In Norway, treatment plans cannot be sold as packages.
 * This is an internal tool for practitioner planning and statistics only.
 */

export {
  default as TreatmentPlan,
  PhaseCard,
  GoalTracker,
  VisitProgress,
  TemplateSelector,
  PLAN_TEMPLATES,
} from './TreatmentPlan';
