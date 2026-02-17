/**
 * Auto-Save Hook
 * Saves form data to localStorage with debounce
 * Restores on mount, clears on successful submit
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const AUTOSAVE_PREFIX = 'chiroclickcrm_autosave_';
const DEFAULT_DEBOUNCE = 2000; // 2 seconds

export const useAutoSave = (key, _initialData = {}, options = {}) => {
  const { debounceMs = DEFAULT_DEBOUNCE, enabled = true } = options;
  const storageKey = `${AUTOSAVE_PREFIX}${key}`;
  const timerRef = useRef(null);
  const [hasRecoveredData, setHasRecoveredData] = useState(false);

  // Try to recover saved data on mount
  const getRecoveredData = useCallback(() => {
    if (!enabled) {
      return null;
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data && parsed.timestamp) {
          // Only recover data less than 24 hours old
          const age = Date.now() - parsed.timestamp;
          if (age < 24 * 60 * 60 * 1000) {
            return parsed.data;
          }
          // Expired - clean up
          localStorage.removeItem(storageKey);
        }
      }
    } catch (e) {
      localStorage.removeItem(storageKey);
    }
    return null;
  }, [storageKey, enabled]);

  // Check on mount
  useEffect(() => {
    const recovered = getRecoveredData();
    if (recovered) {
      setHasRecoveredData(true);
    }
  }, [getRecoveredData]);

  // Save function (debounced)
  const save = useCallback(
    (data) => {
      if (!enabled) {
        return;
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              data,
              timestamp: Date.now(),
            })
          );
        } catch (e) {
          // localStorage full or unavailable
        }
      }, debounceMs);
    },
    [storageKey, debounceMs, enabled]
  );

  // Clear saved data (call after successful submit)
  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    localStorage.removeItem(storageKey);
    setHasRecoveredData(false);
  }, [storageKey]);

  // Dismiss recovery without using the data
  const dismissRecovery = useCallback(() => {
    clear();
  }, [clear]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    save,
    clear,
    recoveredData: hasRecoveredData ? getRecoveredData() : null,
    hasRecoveredData,
    dismissRecovery,
  };
};

export default useAutoSave;
