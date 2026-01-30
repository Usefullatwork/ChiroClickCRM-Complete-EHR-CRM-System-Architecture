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
} from './useKeyboardShortcuts';

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
export {
  default as useClinicalPreferences,
  NOTATION_METHODS,
} from './useClinicalPreferences';
