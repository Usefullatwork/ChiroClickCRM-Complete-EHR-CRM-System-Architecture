import { useEffect, useCallback, useState } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Hook to warn users about unsaved changes before navigating away.
 * Uses react-router-dom's useBlocker for in-app navigation
 * and the beforeunload event for browser close/refresh.
 *
 * @param {boolean} isDirty - Whether the form has unsaved changes
 * @param {string} [message] - Custom warning message
 * @returns {{ isBlocked, proceed, reset }}
 */
export default function useUnsavedChanges(isDirty, message) {
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        isDirty && currentLocation.pathname !== nextLocation.pathname,
      [isDirty]
    )
  );

  // Handle browser close/refresh
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = message || '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, message]);

  return {
    isBlocked: blocker.state === 'blocked',
    proceed: blocker.state === 'blocked' ? () => blocker.proceed() : () => {},
    reset: blocker.state === 'blocked' ? () => blocker.reset() : () => {},
  };
}
