/**
 * Clinical Preferences Hook
 * Manages user preferences for clinical documentation
 */

import { useState, useCallback } from 'react';

export const NOTATION_METHODS = [
  { id: 'standard', name: { no: 'Standard', en: 'Standard' }, isVisual: false },
  { id: 'segment_listing', name: { no: 'Segmentlisting', en: 'Segment Listing' }, isVisual: false },
  {
    id: 'gonstead_listing',
    name: { no: 'Gonstead Listing', en: 'Gonstead Listing' },
    isVisual: false,
  },
  { id: 'diversified_notation', name: { no: 'Diversifisert', en: 'Diversified' }, isVisual: false },
  { id: 'soap_narrative', name: { no: 'SOAP Narrativ', en: 'SOAP Narrative' }, isVisual: false },
  { id: 'body_chart', name: { no: 'Kroppskart', en: 'Body Chart' }, isVisual: true },
  {
    id: 'anatomical_chart',
    name: { no: 'Anatomisk Kart', en: 'Anatomical Chart' },
    isVisual: true,
  },
  {
    id: 'activator_protocol',
    name: { no: 'Activator Protokoll', en: 'Activator Protocol' },
    isVisual: true,
  },
  { id: 'facial_lines', name: { no: 'Ansiktslinjer', en: 'Facial Lines' }, isVisual: true },
];

const defaultPreferences = {
  adjustmentNotation: 'standard',
  language: 'no',
  autoSave: true,
  showQuickPalpation: true,
  defaultDuration: 30,
  soapSectionOrder: 'soap', // 'soap' (S->O->A->P) or 'asoap' (A->S->O->P)
};

export const useClinicalPreferences = () => {
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('clinicalPreferences');
      return saved ? { ...defaultPreferences, ...JSON.parse(saved) } : defaultPreferences;
    } catch {
      return defaultPreferences;
    }
  });

  const updatePreference = useCallback((key, value) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('clinicalPreferences', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetPreferences = useCallback(() => {
    localStorage.removeItem('clinicalPreferences');
    setPreferences(defaultPreferences);
  }, []);

  const getNotationName = useCallback(
    (lang = preferences.language) => {
      const method = NOTATION_METHODS.find((m) => m.id === preferences.adjustmentNotation);
      return method ? method.name[lang] || method.name.no : 'Standard';
    },
    [preferences.adjustmentNotation, preferences.language]
  );

  const getNotationMethod = useCallback(() => {
    return (
      NOTATION_METHODS.find((m) => m.id === preferences.adjustmentNotation) || NOTATION_METHODS[0]
    );
  }, [preferences.adjustmentNotation]);

  // Computed values
  const currentNotationMethod =
    NOTATION_METHODS.find((m) => m.id === preferences.adjustmentNotation) || NOTATION_METHODS[0];
  const isVisualNotation = currentNotationMethod?.isVisual || false;

  return {
    ...preferences,
    preferences,
    updatePreference,
    resetPreferences,
    getNotationName,
    getNotationMethod,
    currentNotationMethod,
    isVisualNotation,
    notationMethods: NOTATION_METHODS,
  };
};

export default useClinicalPreferences;
