import { useState } from 'react';

/**
 * AI assistant state: suggestions, loading, red flags, warnings, diagnosis search
 */
export function useAIState() {
  const [redFlagAlerts, setRedFlagAlerts] = useState([]);
  const [clinicalWarnings, setClinicalWarnings] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [currentMacroMatch, setCurrentMacroMatch] = useState('');
  const [syncStatus, setSyncStatus] = useState({ pending: 0, lastSync: null, error: null });

  return {
    redFlagAlerts,
    setRedFlagAlerts,
    clinicalWarnings,
    setClinicalWarnings,
    aiSuggestions,
    setAiSuggestions,
    aiLoading,
    setAiLoading,
    activeField,
    setActiveField,
    diagnosisSearch,
    setDiagnosisSearch,
    currentMacroMatch,
    setCurrentMacroMatch,
    syncStatus,
    setSyncStatus,
  };
}
