/**
 * Keyboard Shortcuts Hook
 *
 * Global keyboard shortcuts for ChiroClick CRM:
 * - Navigation shortcuts
 * - Quick actions
 * - Form shortcuts
 * - Accessibility support
 *
 * Bilingual: English/Norwegian
 */

import { useEffect, useCallback, useMemo, useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// =============================================================================
// SHORTCUT DEFINITIONS
// =============================================================================

export const SHORTCUTS = {
  // Navigation
  GO_DASHBOARD: {
    keys: ['g', 'd'],
    description: { en: 'Go to Dashboard', no: 'Gå til kontrollpanel' },
    category: 'navigation',
  },
  GO_PATIENTS: {
    keys: ['g', 'p'],
    description: { en: 'Go to Patients', no: 'Gå til pasienter' },
    category: 'navigation',
  },
  GO_CALENDAR: {
    keys: ['g', 'c'],
    description: { en: 'Go to Calendar', no: 'Gå til kalender' },
    category: 'navigation',
  },
  GO_MESSAGES: {
    keys: ['g', 'm'],
    description: { en: 'Go to Messages', no: 'Gå til meldinger' },
    category: 'navigation',
  },
  GO_SETTINGS: {
    keys: ['g', 's'],
    description: { en: 'Go to Settings', no: 'Gå til innstillinger' },
    category: 'navigation',
  },
  GO_KPI: {
    keys: ['g', 'k'],
    description: { en: 'Go to KPI Dashboard', no: 'Gå til KPI' },
    category: 'navigation',
  },

  // Quick Actions
  NEW_PATIENT: {
    keys: ['n', 'p'],
    description: { en: 'New Patient', no: 'Ny pasient' },
    category: 'actions',
  },
  NEW_APPOINTMENT: {
    keys: ['n', 'a'],
    description: { en: 'New Appointment', no: 'Ny avtale' },
    category: 'actions',
  },
  NEW_NOTE: {
    keys: ['n', 'n'],
    description: { en: 'New SOAP Note', no: 'Nytt SOAP-notat' },
    category: 'actions',
  },
  QUICK_SEARCH: {
    keys: ['/', null],
    description: { en: 'Quick Search', no: 'Hurtigsøk' },
    category: 'actions',
    single: true,
  },
  COMMAND_PALETTE: {
    keys: ['Meta', 'k'],
    description: { en: 'Command Palette', no: 'Kommandopalett' },
    category: 'actions',
    combo: true,
  },

  // Form Actions
  SAVE: {
    keys: ['Meta', 's'],
    description: { en: 'Save', no: 'Lagre' },
    category: 'forms',
    combo: true,
  },
  CANCEL: {
    keys: ['Escape', null],
    description: { en: 'Cancel / Close', no: 'Avbryt / Lukk' },
    category: 'forms',
    single: true,
  },

  // Help
  SHOW_SHORTCUTS: {
    keys: ['?', null],
    description: { en: 'Show Shortcuts', no: 'Vis hurtigtaster' },
    category: 'help',
    single: true,
  },
};

// =============================================================================
// KEYBOARD SHORTCUTS CONTEXT
// =============================================================================

const KeyboardShortcutsContext = createContext(null);

export function KeyboardShortcutsProvider({ children, lang = 'en' }) {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const [commandPalette, setCommandPalette] = useState(false);
  const [pendingKey, setPendingKey] = useState(null);
  const [pendingTimeout, setPendingTimeout] = useState(null);

  // Custom action handlers (can be overridden by consumers)
  const [customHandlers, setCustomHandlers] = useState({});

  // Register a custom handler for a shortcut
  const registerHandler = useCallback((shortcutId, handler) => {
    setCustomHandlers((prev) => ({
      ...prev,
      [shortcutId]: handler,
    }));
    return () => {
      setCustomHandlers((prev) => {
        const next = { ...prev };
        delete next[shortcutId];
        return next;
      });
    };
  }, []);

  // Default handlers
  const defaultHandlers = useMemo(
    () => ({
      GO_DASHBOARD: () => navigate('/'),
      GO_PATIENTS: () => navigate('/patients'),
      GO_CALENDAR: () => navigate('/appointments'),
      GO_MESSAGES: () => navigate('/communications'),
      GO_SETTINGS: () => navigate('/settings'),
      GO_KPI: () => navigate('/kpi'),
      NEW_PATIENT: () => navigate('/patients/new'),
      NEW_APPOINTMENT: () => navigate('/appointments/new'),
      QUICK_SEARCH: () => {
        // Focus the search input if it exists
        const searchInput = document.querySelector('[data-search-input]');
        if (searchInput) {
          searchInput.focus();
        }
      },
      COMMAND_PALETTE: () => setCommandPalette(true),
      SHOW_SHORTCUTS: () => setShowHelp(true),
      CANCEL: () => {
        setShowHelp(false);
        setCommandPalette(false);
      },
    }),
    [navigate]
  );

  // Execute a shortcut
  const executeShortcut = useCallback(
    (shortcutId) => {
      // Check for custom handler first
      if (customHandlers[shortcutId]) {
        customHandlers[shortcutId]();
        return true;
      }
      // Fall back to default handler
      if (defaultHandlers[shortcutId]) {
        defaultHandlers[shortcutId]();
        return true;
      }
      return false;
    },
    [customHandlers, defaultHandlers]
  );

  // Main keyboard handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.contentEditable === 'true'
      ) {
        // Allow Escape to work in inputs
        if (e.key === 'Escape') {
          e.target.blur();
          executeShortcut('CANCEL');
        }
        // Allow Cmd/Ctrl+S to save
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          e.preventDefault();
          executeShortcut('SAVE');
        }
        return;
      }

      // Check for combo shortcuts (Cmd/Ctrl + key)
      if (e.metaKey || e.ctrlKey) {
        for (const [id, shortcut] of Object.entries(SHORTCUTS)) {
          if (shortcut.combo && shortcut.keys[1] === e.key.toLowerCase()) {
            e.preventDefault();
            executeShortcut(id);
            return;
          }
        }
        return;
      }

      // Check for single-key shortcuts
      for (const [id, shortcut] of Object.entries(SHORTCUTS)) {
        if (shortcut.single && shortcut.keys[0] === e.key) {
          e.preventDefault();
          executeShortcut(id);
          return;
        }
      }

      // Check for two-key sequences (g+d, n+p, etc.)
      const key = e.key.toLowerCase();

      if (pendingKey) {
        // We have a pending first key, check for match
        for (const [id, shortcut] of Object.entries(SHORTCUTS)) {
          if (
            !shortcut.single &&
            !shortcut.combo &&
            shortcut.keys[0] === pendingKey &&
            shortcut.keys[1] === key
          ) {
            e.preventDefault();
            clearTimeout(pendingTimeout);
            setPendingKey(null);
            executeShortcut(id);
            return;
          }
        }
        // No match, reset
        clearTimeout(pendingTimeout);
        setPendingKey(null);
      } else {
        // Check if this could be a first key
        const isFirstKey = Object.values(SHORTCUTS).some(
          (s) => !s.single && !s.combo && s.keys[0] === key
        );
        if (isFirstKey) {
          setPendingKey(key);
          // Reset after 1 second
          const timeout = setTimeout(() => {
            setPendingKey(null);
          }, 1000);
          setPendingTimeout(timeout);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingKey, pendingTimeout, executeShortcut]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pendingTimeout) {
        clearTimeout(pendingTimeout);
      }
    };
  }, [pendingTimeout]);

  const value = {
    shortcuts: SHORTCUTS,
    showHelp,
    setShowHelp,
    commandPalette,
    setCommandPalette,
    registerHandler,
    executeShortcut,
    lang,
    pendingKey,
  };

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
      {showHelp && <ShortcutsHelpModal lang={lang} onClose={() => setShowHelp(false)} />}
      {commandPalette && <CommandPalette lang={lang} onClose={() => setCommandPalette(false)} />}
    </KeyboardShortcutsContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardShortcutsProvider');
  }
  return context;
}

// =============================================================================
// SHORTCUTS HELP MODAL
// =============================================================================

function ShortcutsHelpModal({ lang = 'en', onClose }) {
  const t = {
    en: {
      title: 'Keyboard Shortcuts',
      navigation: 'Navigation',
      actions: 'Quick Actions',
      forms: 'Forms',
      help: 'Help',
      close: 'Close',
      then: 'then',
    },
    no: {
      title: 'Hurtigtaster',
      navigation: 'Navigasjon',
      actions: 'Hurtighandlinger',
      forms: 'Skjemaer',
      help: 'Hjelp',
      close: 'Lukk',
      then: 'så',
    },
  }[lang];

  const formatKeys = (shortcut) => {
    if (shortcut.combo) {
      return (
        <span className="flex items-center gap-1">
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
            ⌘/{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
          </kbd>
          <span>+</span>
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
            {shortcut.keys[1].toUpperCase()}
          </kbd>
        </span>
      );
    }
    if (shortcut.single) {
      return (
        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
          {shortcut.keys[0]}
        </kbd>
      );
    }
    return (
      <span className="flex items-center gap-1">
        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
          {shortcut.keys[0]}
        </kbd>
        <span className="text-gray-400 text-xs">{t.then}</span>
        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
          {shortcut.keys[1]}
        </kbd>
      </span>
    );
  };

  const categories = {
    navigation: Object.entries(SHORTCUTS).filter(([, s]) => s.category === 'navigation'),
    actions: Object.entries(SHORTCUTS).filter(([, s]) => s.category === 'actions'),
    forms: Object.entries(SHORTCUTS).filter(([, s]) => s.category === 'forms'),
    help: Object.entries(SHORTCUTS).filter(([, s]) => s.category === 'help'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {t.navigation}
            </h3>
            <div className="space-y-2">
              {categories.navigation.map(([id, shortcut]) => (
                <div key={id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {shortcut.description[lang]}
                  </span>
                  {formatKeys(shortcut)}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {t.actions}
            </h3>
            <div className="space-y-2">
              {categories.actions.map(([id, shortcut]) => (
                <div key={id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {shortcut.description[lang]}
                  </span>
                  {formatKeys(shortcut)}
                </div>
              ))}
            </div>
          </div>

          {/* Forms */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {t.forms}
            </h3>
            <div className="space-y-2">
              {categories.forms.map(([id, shortcut]) => (
                <div key={id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {shortcut.description[lang]}
                  </span>
                  {formatKeys(shortcut)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COMMAND PALETTE
// =============================================================================

function CommandPalette({ lang = 'en', onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const t = {
    en: {
      placeholder: 'Type a command or search...',
      noResults: 'No results found',
      navigation: 'Navigation',
      actions: 'Actions',
    },
    no: {
      placeholder: 'Skriv en kommando eller søk...',
      noResults: 'Ingen resultater',
      navigation: 'Navigasjon',
      actions: 'Handlinger',
    },
  }[lang];

  const commands = [
    {
      id: 'dashboard',
      label: { en: 'Go to Dashboard', no: 'Gå til kontrollpanel' },
      action: () => navigate('/'),
    },
    {
      id: 'patients',
      label: { en: 'Go to Patients', no: 'Gå til pasienter' },
      action: () => navigate('/patients'),
    },
    {
      id: 'calendar',
      label: { en: 'Go to Calendar', no: 'Gå til kalender' },
      action: () => navigate('/appointments'),
    },
    {
      id: 'messages',
      label: { en: 'Go to Messages', no: 'Gå til meldinger' },
      action: () => navigate('/communications'),
    },
    {
      id: 'settings',
      label: { en: 'Go to Settings', no: 'Gå til innstillinger' },
      action: () => navigate('/settings'),
    },
    { id: 'kpi', label: { en: 'Go to KPI', no: 'Gå til KPI' }, action: () => navigate('/kpi') },
    {
      id: 'new-patient',
      label: { en: 'Create New Patient', no: 'Opprett ny pasient' },
      action: () => navigate('/patients/new'),
    },
    {
      id: 'new-appointment',
      label: { en: 'Create New Appointment', no: 'Opprett ny avtale' },
      action: () => navigate('/appointments/new'),
    },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label[lang].toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (command) => {
    command.action();
    onClose();
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.placeholder}
            autoFocus
            className="w-full px-4 py-2 text-lg bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        <div className="max-h-80 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">{t.noResults}</div>
          ) : (
            <div className="p-2">
              {filteredCommands.map((command) => (
                <button
                  key={command.id}
                  onClick={() => handleSelect(command)}
                  className="w-full px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-gray-900 dark:text-white">{command.label[lang]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useKeyboardShortcuts;
