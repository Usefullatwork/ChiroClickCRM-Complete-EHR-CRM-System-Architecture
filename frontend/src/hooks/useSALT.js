/**
 * useSALT - Same As Last Time Hook
 *
 * Provides functionality to fetch and apply previous encounter data
 * for faster clinical documentation. This implements the SALT (Same As Last Time)
 * pattern from Healthcare UX best practices.
 *
 * Features:
 * - Fetch last similar encounter for a patient
 * - Match by chief complaint similarity
 * - Apply all or individual SOAP sections
 * - Track match confidence score
 */

import { useState, useEffect, useCallback } from 'react';
import { encountersAPI } from '../services/api';

/**
 * @param {string} patientId - Patient UUID
 * @param {object} options - Configuration options
 * @param {string} options.currentEncounterId - ID of current encounter to exclude
 * @param {string} options.chiefComplaint - Chief complaint to match against
 * @param {number} options.maxAgeDays - Max age of encounters to consider (default 365)
 * @param {boolean} options.autoFetch - Whether to fetch on mount (default true)
 */
export function useSALT(patientId, options = {}) {
  const { currentEncounterId, chiefComplaint, maxAgeDays = 365, autoFetch = true } = options;

  // State
  const [previousEncounter, setPreviousEncounter] = useState(null);
  const [matchScore, setMatchScore] = useState(0);
  const [daysSince, setDaysSince] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Fetch last similar encounter
  const fetchSimilar = useCallback(
    async (complaint = chiefComplaint) => {
      if (!patientId) {
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await encountersAPI.getLastSimilar(patientId, {
          chiefComplaint: complaint,
          excludeId: currentEncounterId,
          maxAgeDays,
        });

        const { encounter, matchScore: score, daysSince: days } = response.data;

        setPreviousEncounter(encounter);
        setMatchScore(score || 0);
        setDaysSince(days);
        setIsDismissed(false);

        return encounter;
      } catch (err) {
        console.error('SALT fetch failed:', err);
        setError(err.message || 'Failed to fetch similar encounter');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [patientId, currentEncounterId, chiefComplaint, maxAgeDays]
  );

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && patientId) {
      fetchSimilar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, patientId]); // Only run on mount

  // Refetch when chief complaint changes (debounced)
  useEffect(() => {
    if (!autoFetch || !chiefComplaint || chiefComplaint.length < 3) {
      return;
    }

    const timeout = setTimeout(() => {
      fetchSimilar(chiefComplaint);
    }, 1000);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiefComplaint]);

  /**
   * Apply all sections from previous encounter
   * @returns {object} All SOAP sections from previous encounter
   */
  const applyAll = useCallback(() => {
    if (!previousEncounter) {
      return null;
    }

    return {
      subjective: previousEncounter.subjective || {},
      objective: previousEncounter.objective || {},
      assessment: previousEncounter.assessment || {},
      plan: previousEncounter.plan || {},
      icpc_codes: previousEncounter.icpc_codes || [],
    };
  }, [previousEncounter]);

  /**
   * Apply specific section from previous encounter
   * @param {string} section - 'subjective', 'objective', 'assessment', or 'plan'
   * @returns {object} The requested section data
   */
  const applySection = useCallback(
    (section) => {
      if (!previousEncounter) {
        return null;
      }

      switch (section) {
        case 'subjective':
          return previousEncounter.subjective || {};
        case 'objective':
          return previousEncounter.objective || {};
        case 'assessment':
          return {
            ...previousEncounter.assessment,
            icpc_codes: previousEncounter.icpc_codes,
          };
        case 'plan':
          return previousEncounter.plan || {};
        default:
          return null;
      }
    },
    [previousEncounter]
  );

  /**
   * Get specific field from previous encounter
   * @param {string} section - SOAP section
   * @param {string} field - Field name within section
   * @returns {any} Field value
   */
  const getField = useCallback(
    (section, field) => {
      if (!previousEncounter || !previousEncounter[section]) {
        return null;
      }
      return previousEncounter[section][field];
    },
    [previousEncounter]
  );

  /**
   * Dismiss the SALT suggestion
   */
  const dismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  /**
   * Reset and refetch
   */
  const reset = useCallback(() => {
    setIsDismissed(false);
    fetchSimilar();
  }, [fetchSimilar]);

  // Computed properties
  const hasPreviousEncounter = !!previousEncounter && !isDismissed;
  const isHighConfidence = matchScore >= 0.8;
  const isMediumConfidence = matchScore >= 0.5 && matchScore < 0.8;
  const isLowConfidence = matchScore > 0 && matchScore < 0.5;

  // Format days since for display
  const daysSinceText =
    daysSince !== null
      ? daysSince === 0
        ? 'I dag'
        : daysSince === 1
          ? '1 dag siden'
          : `${daysSince} dager siden`
      : null;

  return {
    // State
    previousEncounter,
    matchScore,
    daysSince,
    daysSinceText,
    isLoading,
    error,
    isDismissed,

    // Computed
    hasPreviousEncounter,
    isHighConfidence,
    isMediumConfidence,
    isLowConfidence,

    // Actions
    fetchSimilar,
    applyAll,
    applySection,
    getField,
    dismiss,
    reset,
  };
}

export default useSALT;
