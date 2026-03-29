/**
 * CRM Controller — Barrel re-export
 * Sub-modules: crmCore.js, crmAnalytics.js
 */

// Core: Leads, lifecycle, referrals, surveys, communications
export {
  getLeads,
  getLead,
  createLead,
  updateLead,
  convertLead,
  getLeadPipeline,
  getPatientsByLifecycle,
  getLifecycleStats,
  updatePatientLifecycle,
  getReferrals,
  createReferral,
  updateReferral,
  getReferralStats,
  getSurveys,
  createSurvey,
  getSurveyResponses,
  getNPSStats,
  getCommunications,
  logCommunication,
} from './crmCore.js';

// Analytics: Campaigns, workflows, retention, waitlist, overview, settings
export {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  launchCampaign,
  getCampaignStats,
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  toggleWorkflow,
  getRetentionDashboard,
  getChurnAnalysis,
  getCohortRetention,
  getWaitlist,
  addToWaitlist,
  updateWaitlistEntry,
  notifyWaitlist,
  getCRMOverview,
  getCRMSettings,
  updateCRMSettings,
} from './crmAnalytics.js';
