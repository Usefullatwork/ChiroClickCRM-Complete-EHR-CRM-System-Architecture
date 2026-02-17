/**
 * useRedFlagScreening Hook
 *
 * React hook for real-time red flag screening in clinical encounters.
 * Provides automatic detection and alerting for serious pathology indicators.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  screenText,
  screenPatient,
  screenAge,
  screenExaminationFindings,
  SEVERITY,
} from '../services/redFlagScreeningService';

/**
 * Hook for real-time red flag screening
 * @param {Object} options - Configuration options
 * @param {string} options.lang - Language code ('en' or 'no')
 * @param {boolean} options.autoScreen - Enable automatic screening on data change
 * @param {number} options.debounceMs - Debounce delay for text screening
 * @param {Function} options.onCriticalFlag - Callback when critical flag detected
 * @returns {Object} Screening state and functions
 */
export function useRedFlagScreening({
  lang = 'en',
  autoScreen = true,
  debounceMs = 500,
  onCriticalFlag,
} = {}) {
  const [flags, setFlags] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    requiresImmediateAction: false,
    categories: [],
  });
  const [isScreening, setIsScreening] = useState(false);
  const [lastScreened, setLastScreened] = useState(null);
  const [acknowledgedFlags, setAcknowledgedFlags] = useState(new Set());
  const debounceTimerRef = useRef(null);
  const previousCriticalRef = useRef(false);

  // Screen text with debouncing
  const screenTextDebounced = useCallback(
    (text) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        setIsScreening(true);
        const results = screenText(text, lang);
        updateFlags(results);
        setIsScreening(false);
      }, debounceMs);
    },
    [lang, debounceMs, updateFlags]
  );

  // Update flags and trigger callbacks
  const updateFlags = useCallback(
    (newFlags) => {
      setFlags(newFlags);
      setLastScreened(new Date().toISOString());

      const newSummary = {
        total: newFlags.length,
        critical: newFlags.filter((f) => f.severity === SEVERITY.CRITICAL).length,
        high: newFlags.filter((f) => f.severity === SEVERITY.HIGH).length,
        medium: newFlags.filter((f) => f.severity === SEVERITY.MEDIUM).length,
        low: newFlags.filter((f) => f.severity === SEVERITY.LOW).length,
        requiresImmediateAction: newFlags.some((f) => f.severity === SEVERITY.CRITICAL),
        categories: [...new Set(newFlags.map((f) => f.category))],
      };
      setSummary(newSummary);

      // Trigger callback for new critical flags
      const hasCritical = newSummary.critical > 0;
      if (hasCritical && !previousCriticalRef.current && onCriticalFlag) {
        const criticalFlags = newFlags.filter((f) => f.severity === SEVERITY.CRITICAL);
        onCriticalFlag(criticalFlags);
      }
      previousCriticalRef.current = hasCritical;
    },
    [onCriticalFlag]
  );

  // Screen full patient data
  const screenFullPatient = useCallback(
    (patientData) => {
      setIsScreening(true);
      const results = screenPatient(patientData, lang);
      updateFlags(results.flags);
      setIsScreening(false);
      return results;
    },
    [lang, updateFlags]
  );

  // Screen specific text immediately
  const screenTextImmediate = useCallback(
    (text) => {
      setIsScreening(true);
      const results = screenText(text, lang);
      updateFlags(results);
      setIsScreening(false);
      return results;
    },
    [lang, updateFlags]
  );

  // Screen age
  const screenPatientAge = useCallback(
    (age) => {
      return screenAge(age, lang);
    },
    [lang]
  );

  // Screen examination
  const screenExam = useCallback(
    (findings) => {
      return screenExaminationFindings(findings, lang);
    },
    [lang]
  );

  // Acknowledge a flag
  const acknowledgeFlag = useCallback((flagId) => {
    setAcknowledgedFlags((prev) => new Set([...prev, flagId]));
  }, []);

  // Acknowledge all flags
  const acknowledgeAllFlags = useCallback(() => {
    setAcknowledgedFlags(new Set(flags.map((f) => f.id)));
  }, [flags]);

  // Reset acknowledgements
  const resetAcknowledgements = useCallback(() => {
    setAcknowledgedFlags(new Set());
  }, []);

  // Clear all flags
  const clearFlags = useCallback(() => {
    setFlags([]);
    setSummary({
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      requiresImmediateAction: false,
      categories: [],
    });
    setAcknowledgedFlags(new Set());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Unacknowledged flags
  const unacknowledgedFlags = useMemo(() => {
    return flags.filter((f) => !acknowledgedFlags.has(f.id));
  }, [flags, acknowledgedFlags]);

  // Has unacknowledged critical
  const hasUnacknowledgedCritical = useMemo(() => {
    return unacknowledgedFlags.some((f) => f.severity === SEVERITY.CRITICAL);
  }, [unacknowledgedFlags]);

  return {
    // State
    flags,
    summary,
    isScreening,
    lastScreened,
    acknowledgedFlags,
    unacknowledgedFlags,
    hasUnacknowledgedCritical,

    // Screening functions
    screenText: autoScreen ? screenTextDebounced : screenTextImmediate,
    screenTextImmediate,
    screenFullPatient,
    screenPatientAge,
    screenExam,

    // Acknowledgement functions
    acknowledgeFlag,
    acknowledgeAllFlags,
    resetAcknowledgements,

    // Utility
    clearFlags,
  };
}

/**
 * Hook for screening a single text field
 * Simpler hook for individual input fields
 */
export function useTextFieldScreening(initialValue = '', lang = 'en') {
  const [value, setValue] = useState(initialValue);
  const [flags, setFlags] = useState([]);

  useEffect(() => {
    if (value.length > 10) {
      // Only screen if meaningful text
      const timer = setTimeout(() => {
        const results = screenText(value, lang);
        setFlags(results);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setFlags([]);
    }
  }, [value, lang]);

  const hasCritical = flags.some((f) => f.severity === SEVERITY.CRITICAL);
  const hasHigh = flags.some((f) => f.severity === SEVERITY.HIGH);

  return {
    value,
    setValue,
    flags,
    hasCritical,
    hasHigh,
    hasFlags: flags.length > 0,
  };
}

export default useRedFlagScreening;
