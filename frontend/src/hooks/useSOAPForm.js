import { useState, useRef } from 'react';

/**
 * SOAP form state: encounter data, auto-save, timer, amendments, kiosk intake
 */
export function useSOAPForm(patientId) {
  const [encounterData, setEncounterData] = useState({
    patient_id: patientId,
    encounter_date: new Date().toISOString().split('T')[0],
    encounter_type: 'FOLLOWUP',
    duration_minutes: 30,
    subjective: {
      chief_complaint: '',
      history: '',
      onset: '',
      pain_description: '',
      aggravating_factors: '',
      relieving_factors: '',
    },
    objective: {
      observation: '',
      palpation: '',
      rom: '',
      ortho_tests: '',
      neuro_tests: '',
      posture: '',
    },
    assessment: {
      clinical_reasoning: '',
      differential_diagnosis: '',
      prognosis: '',
      red_flags_checked: true,
    },
    plan: {
      treatment: '',
      exercises: '',
      advice: '',
      follow_up: '',
      referrals: '',
    },
    icpc_codes: [],
    icd10_codes: [],
    treatments: [],
    vas_pain_start: 5,
    vas_pain_end: 3,
  });

  // Amendment State
  const [showAmendmentForm, setShowAmendmentForm] = useState(false);
  const [amendmentContent, setAmendmentContent] = useState('');
  const [amendmentType, setAmendmentType] = useState('ADDENDUM');
  const [amendmentReason, setAmendmentReason] = useState('');

  // Auto-save
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveTimerRef = useRef(null);

  // Timer
  const [encounterStartTime] = useState(() => new Date());
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const timerIntervalRef = useRef(null);

  // Treatment billing
  const [selectedTakster, setSelectedTakster] = useState(['l214']);
  const [showTakster, setShowTakster] = useState(false);

  // Kiosk
  const [kioskDataApplied, setKioskDataApplied] = useState(false);

  // Refs
  const textAreaRefs = useRef({});
  const palpationRef = useRef(null);
  const sectionRefs = useRef({});

  return {
    encounterData,
    setEncounterData,
    showAmendmentForm,
    setShowAmendmentForm,
    amendmentContent,
    setAmendmentContent,
    amendmentType,
    setAmendmentType,
    amendmentReason,
    setAmendmentReason,
    autoSaveStatus,
    setAutoSaveStatus,
    lastSaved,
    setLastSaved,
    autoSaveTimerRef,
    encounterStartTime,
    elapsedTime,
    setElapsedTime,
    timerIntervalRef,
    selectedTakster,
    setSelectedTakster,
    showTakster,
    setShowTakster,
    kioskDataApplied,
    setKioskDataApplied,
    textAreaRefs,
    palpationRef,
    sectionRefs,
  };
}
