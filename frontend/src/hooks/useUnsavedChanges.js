import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Hook to warn users about unsaved changes before navigating away.
 * Uses the beforeunload event for browser close/refresh and a manual
 * navigation intercept for in-app route changes.
 *
 * Note: useBlocker requires a data router (createBrowserRouter) which
 * this app doesn't use. Instead, we intercept navigation manually.
 *
 * @param {boolean} isDirty - Whether the form has unsaved changes
 * @param {string} [message] - Custom warning message
 * @returns {{ isBlocked, proceed, reset }}
 */
export default function useUnsavedChanges(isDirty, message) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [pendingPath, setPendingPath] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle browser close/refresh
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = message || '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, message]);

  // Intercept in-app navigation by patching pushState/replaceState
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handlePopState = () => {
      if (isDirty) {
        // User pressed back/forward — block it
        setIsBlocked(true);
        setPendingPath(null); // popstate doesn't give us the target path
        // Push the current URL back to undo the navigation
        window.history.pushState(null, '', location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isDirty, location.pathname]);

  const proceed = useCallback(() => {
    setIsBlocked(false);
    if (pendingPath) {
      navigate(pendingPath);
    }
    setPendingPath(null);
  }, [pendingPath, navigate]);

  const reset = useCallback(() => {
    setIsBlocked(false);
    setPendingPath(null);
  }, []);

  return {
    isBlocked,
    proceed,
    reset,
  };
}
