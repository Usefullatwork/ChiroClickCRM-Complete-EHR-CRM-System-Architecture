import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Global keyboard shortcuts for the application.
 * Ctrl+K: Open command palette (handled in DashboardLayout)
 * Ctrl+N: Navigate to new patient
 * Ctrl+/: Toggle shortcut help modal
 */
export default function useGlobalKeyboardShortcuts() {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback(
    (e) => {
      // Don't fire when user is typing in an input/textarea
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) {
        // Only allow Escape in inputs
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;

      // Ctrl+K is now handled by DashboardLayout for the command palette

      if (isCtrl && e.key === 'n') {
        e.preventDefault();
        navigate('/patients/new');
      }

      if (isCtrl && e.key === '/') {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      }

      if (e.key === 'Escape') {
        setShowHelp(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { showHelp, setShowHelp };
}

export const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: 'Command palette' },
  { keys: ['Ctrl', 'N'], description: 'New patient' },
  { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts' },
  { keys: ['Esc'], description: 'Close dialogs' },
];
