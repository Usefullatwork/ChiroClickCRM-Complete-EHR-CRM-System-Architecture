/**
 * CRM Components - Patient Engagement & Communication
 *
 * Phase 4 Components:
 * - Waitlist Management (Jane App style)
 * - Recall/Reminder Campaigns (CT Engage style)
 * - Two-Way SMS Communication
 * - Contact Sync (Google/Microsoft)
 */

// Waitlist Management
export {
  default as WaitlistManager,
  WaitlistCompact,
  PRIORITY_LEVELS,
  TIME_PREFERENCES,
  DAY_PREFERENCES,
} from './WaitlistManager';

// Recall & Reminder Campaigns
export {
  default as RecallManager,
  RecallCompact,
  RECALL_TYPES,
  MESSAGE_TEMPLATES,
} from './RecallManager';

// Two-Way SMS Communication
export {
  default as SMSConversation,
  UnreadBadge,
  ConversationPreview,
} from './SMSConversation';
