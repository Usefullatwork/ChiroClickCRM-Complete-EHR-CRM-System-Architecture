/**
 * React Hooks - ChiroClick CRM
 *
 * Custom hooks for:
 * - Keyboard shortcuts
 * - PWA/Offline support
 * - Application state
 */

// Keyboard Shortcuts
export {
  default as useKeyboardShortcuts,
  useKeyboardShortcuts as useShortcuts,
  KeyboardShortcutsProvider,
  SHORTCUTS,
} from './useKeyboardShortcuts.jsx';

// PWA / Offline Support
export {
  default as usePWA,
  registerServiceWorker,
  unregisterServiceWorker,
  saveOffline,
  getOffline,
  getAllOffline,
  deleteOffline,
  clearOffline,
  offlineFetch,
} from './usePWA';

// Clinical Preferences
export { default as useClinicalPreferences, NOTATION_METHODS } from './useClinicalPreferences';

// Patient Intake (Kiosk data)
export { default as usePatientIntake } from './usePatientIntake';

// Exercise Sync (offline support)
export { default as useExerciseSync } from './useExerciseSync';

// SALT - Same As Last Time (encounter template)
export { default as useSALT, useSALT as useSameAsLastTime } from './useSALT';

// Red Flag Screening
export { default as useRedFlagScreening } from './useRedFlagScreening';

// Patient Presence (WebSocket)
export { default as usePatientPresence } from './usePatientPresence';

// Text Expansion (slash commands)
export { default as useTextExpansion } from './useTextExpansion';
