/**
 * One-time localStorage migration: ChiroClickCRM → ChiroClickEHR
 *
 * Renames all legacy localStorage keys so returning users keep their
 * preferences (theme, autosave drafts, clinical prefs, language, etc.)
 * after the rebrand.
 *
 * Idempotent — guarded by a "migration complete" flag.
 */

const MIGRATION_FLAG = 'chiroclickehr_ls_migrated';

const EXACT_RENAMES = {
  // Settings / clinical
  chiroclick_clinical_prefs: 'chiroclickehr_clinical_prefs',
  chiroclickcrm_theme: 'chiroclickehr_theme',
  chiroclick_lang: 'chiroclickehr_lang',

  // AI
  chiroclick_ai_config: 'chiroclickehr_ai_config',

  // Contact sync
  chiroclick_google_token: 'chiroclickehr_google_token',
  chiroclick_microsoft_token: 'chiroclickehr_microsoft_token',
  chiroclick_sync_config: 'chiroclickehr_sync_config',
  chiroclick_last_sync: 'chiroclickehr_last_sync',

  // Messaging
  chiroclick_messaging_config: 'chiroclickehr_messaging_config',
  chiroclick_conversations: 'chiroclickehr_conversations',
  chiroclick_message_templates: 'chiroclickehr_message_templates',
};

/** Prefix-based catch-all for autosave keys */
const PREFIX_RENAMES = [{ from: 'chiroclickcrm_autosave_', to: 'chiroclickehr_autosave_' }];

export function migrateLocalStorage() {
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  // 1. Exact key renames
  for (const [oldKey, newKey] of Object.entries(EXACT_RENAMES)) {
    const value = localStorage.getItem(oldKey);
    if (value !== null) {
      localStorage.setItem(newKey, value);
      localStorage.removeItem(oldKey);
    }
  }

  // 2. Prefix renames (autosave drafts, etc.)
  for (const { from, to } of PREFIX_RENAMES) {
    const keysToRename = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(from)) {
        keysToRename.push(key);
      }
    }
    for (const key of keysToRename) {
      const value = localStorage.getItem(key);
      const newKey = to + key.slice(from.length);
      localStorage.setItem(newKey, value);
      localStorage.removeItem(key);
    }
  }

  localStorage.setItem(MIGRATION_FLAG, '1');
}
