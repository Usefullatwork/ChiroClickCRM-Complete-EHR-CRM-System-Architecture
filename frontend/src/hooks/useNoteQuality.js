/**
 * useNoteQuality Hook
 * Watches encounter state from Zustand store and provides
 * debounced quality feedback as the clinician types.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import useEncounterStore, { selectEncounterData } from '../stores/encounterStore';
import {
  checkCompleteness,
  checkRedFlags,
  getQualityLevel,
  generateSuggestions,
} from '../services/noteQualityService';

/**
 * Custom hook for real-time note quality checking
 * @param {object} options
 * @param {number} options.debounceMs - Debounce delay in ms (default 500)
 * @param {boolean} options.enabled - Whether quality checking is active (default true)
 * @returns {{ quality: 'green'|'yellow'|'red', score: number, warnings: string[], suggestions: string[], sectionScores: object, redFlags: object }}
 */
export function useNoteQuality({ debounceMs = 500, enabled = true } = {}) {
  const encounterData = useEncounterStore(selectEncounterData);
  const [result, setResult] = useState({
    quality: 'red',
    score: 0,
    warnings: [],
    suggestions: [],
    sectionScores: { subjective: 0, objective: 0, assessment: 0, plan: 0 },
    redFlags: { found: false, flags: [] },
  });

  const timerRef = useRef(null);

  // Build the text to check from subjective fields
  const subjectiveText = useMemo(() => {
    const subj = encounterData.subjective || {};
    return [subj.chief_complaint, subj.history, subj.onset, subj.pain_description]
      .filter(Boolean)
      .join(' ');
  }, [encounterData.subjective]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const completeness = checkCompleteness(encounterData, encounterData.encounter_type);
      const redFlags = checkRedFlags(subjectiveText);
      const quality = getQualityLevel(completeness.score);
      const suggestions = generateSuggestions(completeness, encounterData.encounter_type);

      const warnings = [
        ...completeness.missing,
        ...(redFlags.found
          ? redFlags.flags.map(
              (f) =>
                `${f.severity === 'high' ? 'VIKTIG' : 'Merk'}: "${f.keyword}" - vurder henvisning`
            )
          : []),
      ];

      setResult({
        quality,
        score: completeness.score,
        warnings,
        suggestions,
        sectionScores: completeness.sectionScores,
        redFlags,
      });
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [encounterData, subjectiveText, enabled, debounceMs]);

  return result;
}

export default useNoteQuality;
