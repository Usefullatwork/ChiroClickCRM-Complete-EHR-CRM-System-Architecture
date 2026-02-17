/**
 * Clinical Encounter - "Scandi-Clinical Modern" Design
 *
 * Merged version: New UI design + Full functionality from old version
 * - Split-pane layout with patient context sidebar
 * - All SOAP sections visible at once
 * - Quick phrase chips & Takster auto-totaling
 * - Full API integration, save/load, AI assistant, exam panels
 *
 * Refactored: Components extracted to components/encounter/ and hooks/
 */

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { encountersAPI, patientsAPI, diagnosisAPI, treatmentsAPI, aiAPI } from '../services/api';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Save,
  Activity,
  Clock,
  Search,
  X,
  Sparkles,
  Brain,
  BookOpen,
  Loader2,
  Lock,
  Target,
  Settings,
} from 'lucide-react';
import TemplatePicker from '../components/TemplatePicker';
import { usePatientIntake } from '../hooks/usePatientIntake';
import { useClinicalPreferences } from '../hooks';
import {
  BodyChartPanel,
  AnatomicalBodyChart,
  ActivatorMethodPanel,
  FacialLinesChart,
} from '../components/examination';
import { ExercisePanel } from '../components/exercises';
import QuickPalpationSpine from '../components/clinical/QuickPalpationSpine';
import { SALTBanner, EnhancedClinicalTextarea } from '../components/clinical';
import { AIDiagnosisSidebar } from '../components/clinical';
import { ConnectionStatus } from '../components/common';
import toast from '../utils/toast';

// Extracted components
import { useClinicalEncounterState } from '../hooks/useClinicalEncounterState';
import { PatientInfoSidebar } from '../components/encounter/PatientInfoSidebar';
import { DiagnosisPanel } from '../components/encounter/DiagnosisPanel';
import { TaksterPanel, taksterNorwegian } from '../components/encounter/TaksterPanel';
import { ExamPanelManager } from '../components/encounter/ExamPanelManager';

// --- STATIC DATA ---

// Enhanced quick phrases - expanded based on competitor analysis (ChiroTouch, ChiroSpring)
const quickPhrases = {
  subjective: [
    'Bedring siden sist',
    'Betydelig bedring',
    'Ingen endring',
    'Noe verre',
    'Betydelig verre',
    'Verre om morgenen',
    'Verre om kvelden',
    'Varierende gjennom dagen',
    'Konstante smerter',
    'Smerter ved l\u00F8ft',
    'Smerter ved sitting',
    'Smerter ved gange',
    'Smerter ved b\u00F8ying',
    'Stivhet etter hvile',
    'Utstråling til ben',
    'Utstråling til arm',
    'Nummenhet/prikking',
    'Hodepine assosiert',
  ],
  objective: [
    'Normal ROM alle retninger',
    'Redusert fleksjon',
    'Redusert ekstensjon',
    'Redusert rotasjon bilat',
    'Redusert lateralfleksjon',
    'Muskelspasme palperes',
    'Triggerpunkt identifisert',
    '\u00D8mhet over fasettledd',
    'Segmentell dysfunksjon',
    'Positiv SLR venstre',
    'Positiv SLR h\u00F8yre',
    'Negativ SLR bilat',
    "Positiv Kemp's test",
    'Positiv facettbelastning',
  ],
  assessment: [
    'God respons p\u00E5 behandling',
    'Moderat respons',
    'Begrenset respons',
    'Stabil tilstand',
    'Progresjon som forventet',
    'Vurderer henvisning',
  ],
  plan: [
    'Fortsett n\u00E5v\u00E6rende behandlingsplan',
    '\u00D8kt behandlingsfrekvens',
    'Redusert behandlingsfrekvens',
    'Hjemme\u00F8velser gjennomg\u00E5tt',
    'Ergonomisk veiledning gitt',
    'Kontroll om 1 uke',
  ],
};

// Macro system - Type ".xx" to expand
const macros = {
  '.bs': 'Bedring siden sist. ',
  '.ie': 'Ingen endring siden forrige konsultasjon. ',
  '.vm': 'Verre om morgenen, bedre utover dagen. ',
  '.kons': 'Konstante smerter, VAS ',
  '.ust': 'Utstråling til ',
  '.nrom': 'Normal ROM i alle retninger. ',
  '.rrom': 'Redusert ROM: ',
  '.palp': 'Ved palpasjon: ',
  '.spasme': 'Muskelspasme palperes paravertebralt. ',
  '.trigger': 'Triggerpunkt identifisert i ',
  '.seg': 'Segmentell dysfunksjon ',
  '.c': 'Cervical ',
  '.t': 'Thorakal ',
  '.l': 'Lumbal ',
  '.si': 'SI-ledd ',
  '.hvla': 'HVLA manipulasjon ',
  '.mob': 'Mobilisering ',
  '.soft': 'Bl\u00F8tvevsbehandling ',
  '.dry': 'Dry needling ',
  '.tape': 'Kinesiotaping ',
  '.fu1': 'Oppf\u00F8lging om 1 uke. ',
  '.fu2': 'Oppf\u00F8lging om 2 uker. ',
  '.\u00F8v': 'Hjemme\u00F8velser gjennomg\u00E5tt og demonstrert. ',
  '.erg': 'Ergonomisk veiledning gitt. ',
  '.hen': 'Henvisning vurderes til ',
  '.godr': 'God respons p\u00E5 behandling. Fortsetter n\u00E5v\u00E6rende plan. ',
  '.modr': 'Moderat respons. Justerer behandlingsplan. ',
  '.begr': 'Begrenset respons. Vurderer alternativ tiln\u00E6rming. ',
};

// Keyboard shortcuts reference
const keyboardShortcuts = {
  'Ctrl+S': 'Lagre notat',
  'Ctrl+Shift+S': 'Lagre og signer',
  'Ctrl+1': 'G\u00E5 til Subjektivt',
  'Ctrl+2': 'G\u00E5 til Objektivt',
  'Ctrl+3': 'G\u00E5 til Vurdering',
  'Ctrl+4': 'G\u00E5 til Plan',
  'Ctrl+T': '\u00C5pne maler',
  'Ctrl+L': 'SALT - Kopier fra forrige',
  Esc: 'Lukk dialoger',
};

// ---------------------------

export default function ClinicalEncounter() {
  const { patientId, encounterId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // All local state from custom hook
  const state = useClinicalEncounterState(patientId);

  // Destructure for convenience
  const {
    encounterData,
    setEncounterData,
    redFlagAlerts,
    setRedFlagAlerts,
    clinicalWarnings,
    aiSuggestions,
    setAiSuggestions,
    aiLoading,
    setAiLoading,
    neuroExamData,
    setNeuroExamData,
    orthoExamData,
    setOrthoExamData,
    activeField,
    setActiveField,
    diagnosisSearch,
    setDiagnosisSearch,
    showDiagnosisDropdown,
    setShowDiagnosisDropdown,
    showAIAssistant,
    setShowAIAssistant,
    showTemplatePicker,
    setShowTemplatePicker,
    showKeyboardHelp,
    setShowKeyboardHelp,
    showMacroHint,
    setShowMacroHint,
    currentMacroMatch,
    setCurrentMacroMatch,
    showSALTBanner,
    setShowSALTBanner,
    saltBannerExpanded,
    setSaltBannerExpanded,
    showAIDiagnosisSidebar,
    setShowAIDiagnosisSidebar,
    selectedTakster,
    setSelectedTakster,
    showTakster,
    setShowTakster,
    autoSaveStatus,
    setAutoSaveStatus,
    lastSaved,
    setLastSaved,
    elapsedTime,
    setElapsedTime,
    encounterStartTime,
    showAmendmentForm,
    setShowAmendmentForm,
    amendmentContent,
    setAmendmentContent,
    amendmentType,
    setAmendmentType,
    amendmentReason,
    setAmendmentReason,
    showExercisePanel,
    setShowExercisePanel,
    kioskDataApplied,
    setKioskDataApplied,
    // Notation
    notationData,
    setNotationData,
    notationNarrative,
    setNotationNarrative,
    // Refs
    textAreaRefs,
    palpationRef,
    autoSaveTimerRef,
    sectionRefs,
    timerIntervalRef,
  } = state;

  // Clinical Preferences (notation method selection)
  const {
    preferences: clinicalPrefs,
    currentNotationMethod,
    getNotationName,
    isVisualNotation,
    language: clinicalLang,
  } = useClinicalPreferences();

  // Fetch patient data
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsAPI.getById(patientId),
    enabled: !!patientId,
  });

  // Fetch kiosk intake data if patient checked in via kiosk
  const appointmentId = patient?.currentAppointmentId || null;
  const {
    intake: kioskIntake,
    subjectiveNarrative: kioskSubjective,
    hasIntake: hasKioskIntake,
  } = usePatientIntake(appointmentId);

  // Pre-populate from kiosk check-in data
  useEffect(() => {
    if (hasKioskIntake && kioskSubjective && !kioskDataApplied && !encounterId) {
      setEncounterData((prev) => ({
        ...prev,
        subjective: {
          ...prev.subjective,
          chief_complaint: kioskSubjective,
        },
        vas_pain_start: kioskIntake?.painLevel ?? prev.vas_pain_start,
      }));
      setKioskDataApplied(true);
    }
  }, [hasKioskIntake, kioskSubjective, kioskIntake, kioskDataApplied, encounterId]);

  // Fetch encounter if editing
  const { data: existingEncounter } = useQuery({
    queryKey: ['encounter', encounterId],
    queryFn: () => encountersAPI.getById(encounterId),
    enabled: !!encounterId,
  });

  // Load existing encounter data
  useEffect(() => {
    if (existingEncounter?.data) {
      setEncounterData((prev) => ({
        ...prev,
        ...existingEncounter.data,
        encounter_date: new Date(existingEncounter.data.encounter_date).toISOString().split('T')[0],
      }));
      setRedFlagAlerts(existingEncounter.data.redFlagAlerts || []);
      state.setClinicalWarnings(existingEncounter.data.clinicalWarnings || []);
    }
  }, [existingEncounter]);

  // Fetch diagnosis codes
  const { data: commonDiagnoses } = useQuery({
    queryKey: ['diagnosis', 'common'],
    queryFn: () => diagnosisAPI.getCommon(),
  });

  // Fetch treatment codes
  const { data: commonTreatments } = useQuery({
    queryKey: ['treatments', 'common'],
    queryFn: () => treatmentsAPI.getCommon(),
  });

  // SALT: Fetch previous encounter for this patient
  const { data: previousEncounters } = useQuery({
    queryKey: ['encounters', 'patient', patientId, 'previous'],
    queryFn: async () => {
      const response = await encountersAPI.getAll({ patientId, signed: true, limit: 10 });
      const encounters = response?.data?.encounters || response?.data?.data || response?.data || [];
      const previous = encounters
        .filter((e) => e.id !== encounterId)
        .sort((a, b) => new Date(b.encounter_date) - new Date(a.encounter_date));
      return previous[0] || null;
    },
    enabled: !!patientId,
  });

  // Save encounter mutation
  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (encounterId) {
        return encountersAPI.update(encounterId, data);
      }
      return encountersAPI.create(data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['encounters']);
      queryClient.invalidateQueries(['patient', patientId]);
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      if (!encounterId && response?.data?.id) {
        navigate(`/patients/${patientId}/encounter/${response.data.id}`, { replace: true });
      }
    },
    onError: () => {
      setAutoSaveStatus('unsaved');
    },
  });

  // Sign encounter mutation
  const signMutation = useMutation({
    mutationFn: (id) => encountersAPI.sign(id),
    onSuccess: () => {
      setEncounterData((prev) => ({
        ...prev,
        signed_at: new Date().toISOString(),
      }));
      queryClient.invalidateQueries(['encounter', encounterId]);
      queryClient.invalidateQueries(['encounters']);
    },
  });

  // Check if encounter is signed (immutable)
  const isSigned = !!encounterData.signed_at;

  // Fetch amendments for signed encounter
  const { data: amendments, refetch: refetchAmendments } = useQuery({
    queryKey: ['amendments', encounterId],
    queryFn: () => encountersAPI.getAmendments(encounterId),
    enabled: !!encounterId && isSigned,
  });

  // Create amendment mutation
  const createAmendmentMutation = useMutation({
    mutationFn: (data) => encountersAPI.createAmendment(encounterId, data),
    onSuccess: () => {
      setShowAmendmentForm(false);
      setAmendmentContent('');
      setAmendmentReason('');
      refetchAmendments();
      queryClient.invalidateQueries(['amendments', encounterId]);
    },
  });

  // Sign amendment mutation
  const signAmendmentMutation = useMutation({
    mutationFn: (amendmentId) => encountersAPI.signAmendment(encounterId, amendmentId),
    onSuccess: () => {
      refetchAmendments();
      queryClient.invalidateQueries(['amendments', encounterId]);
    },
  });

  const handleCreateAmendment = () => {
    if (!amendmentContent.trim()) return;
    createAmendmentMutation.mutate({
      amendment_type: amendmentType,
      reason: amendmentReason,
      content: amendmentContent,
    });
  };

  // === ENCOUNTER TIMER ===
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now - encounterStartTime) / 1000);
      const mins = String(Math.floor(diff / 60)).padStart(2, '0');
      const secs = String(diff % 60).padStart(2, '0');
      setElapsedTime(`${mins}:${secs}`);
    }, 1000);
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [encounterStartTime]);

  // === ENCOUNTER TYPE SMART DEFAULTS ===
  const applyEncounterTypeDefaults = (type) => {
    setEncounterData((prev) => {
      const updates = { ...prev, encounter_type: type };
      switch (type) {
        case 'INITIAL':
          updates.duration_minutes = 45;
          break;
        case 'FOLLOWUP':
          updates.duration_minutes = 20;
          break;
        case 'MAINTENANCE':
          updates.duration_minutes = 15;
          break;
        case 'REEXAM':
          updates.duration_minutes = 30;
          break;
        case 'EMERGENCY':
          updates.duration_minutes = 30;
          break;
        default:
          break;
      }
      return updates;
    });
  };

  // === EFFICIENCY FEATURES ===

  const expandMacro = (text, cursorPosition) => {
    const beforeCursor = text.substring(0, cursorPosition);
    const macroMatch = beforeCursor.match(/(\.[a-z\u00F8\u00E6\u00E50-9]+)$/i);
    if (macroMatch) {
      const macroKey = macroMatch[1].toLowerCase();
      const expansion = macros[macroKey];
      if (expansion) {
        const newText =
          text.substring(0, cursorPosition - macroKey.length) +
          expansion +
          text.substring(cursorPosition);
        return {
          expanded: true,
          text: newText,
          newCursorPosition: cursorPosition - macroKey.length + expansion.length,
        };
      }
    }
    return { expanded: false, text, newCursorPosition: cursorPosition };
  };

  const handleTextInputWithMacros = (e, section, field) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    if (e.nativeEvent.data === ' ' || e.nativeEvent.inputType === 'insertLineBreak') {
      const result = expandMacro(value.slice(0, -1), cursorPos - 1);
      if (result.expanded) {
        const finalValue = result.text + (e.nativeEvent.data === ' ' ? '' : '\n');
        if (section) {
          setEncounterData((prev) => ({
            ...prev,
            [section]: { ...prev[section], [field]: finalValue },
          }));
        }
        setTimeout(() => {
          if (e.target) {
            e.target.selectionStart = result.newCursorPosition + 1;
            e.target.selectionEnd = result.newCursorPosition + 1;
          }
        }, 0);
        setAutoSaveStatus('unsaved');
        return true;
      }
    }
    const beforeCursor = value.substring(0, cursorPos);
    const partialMatch = beforeCursor.match(/(\.[a-z\u00F8\u00E6\u00E50-9]*)$/i);
    if (partialMatch && partialMatch[1].length > 1) {
      const partial = partialMatch[1].toLowerCase();
      const matches = Object.keys(macros).filter((k) => k.startsWith(partial));
      if (matches.length > 0 && matches[0] !== partial) {
        setCurrentMacroMatch(matches[0] + ' \u2192 ' + macros[matches[0]].substring(0, 30) + '...');
        setShowMacroHint(true);
      } else {
        setShowMacroHint(false);
      }
    } else {
      setShowMacroHint(false);
    }
    return false;
  };

  // SALT - Same As Last Time
  const handleSALT = (section = null) => {
    if (!previousEncounters) {
      toast.info('Ingen tidligere konsultasjon funnet for denne pasienten.');
      return;
    }
    const prev = previousEncounters;
    if (section) {
      if (prev[section]) {
        setEncounterData((current) => ({
          ...current,
          [section]: { ...current[section], ...prev[section] },
        }));
      }
    } else {
      setEncounterData((current) => ({
        ...current,
        subjective: prev.subjective || current.subjective,
        objective: prev.objective || current.objective,
        assessment: prev.assessment || current.assessment,
        plan: prev.plan || current.plan,
        vas_pain_start: prev.vas_pain_end || current.vas_pain_start,
      }));
      if (prev.treatments?.length > 0) {
        const prevTakstIds = prev.treatments
          .map((t) => taksterNorwegian.find((tak) => tak.code === t.code)?.id)
          .filter(Boolean);
        if (prevTakstIds.length > 0) {
          setSelectedTakster(prevTakstIds);
        }
      }
    }
    setAutoSaveStatus('unsaved');
  };

  // Auto-save functionality
  const triggerAutoSave = () => {
    if (isSigned || autoSaveStatus === 'saved') return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      if (encounterId && !isSigned) {
        setAutoSaveStatus('saving');
        handleSave();
      }
    }, 3000);
  };

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        if (!isSigned) handleSave();
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        if (!isSigned && encounterId) {
          handleSave();
          setTimeout(() => signMutation.mutate(encounterId), 500);
        }
      }
      if (e.ctrlKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const sections = ['subjective', 'objective', 'assessment', 'plan'];
        const section = sections[parseInt(e.key) - 1];
        const ref = sectionRefs.current[section];
        if (ref) ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        setShowTemplatePicker(true);
      }
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        if (!isSigned) handleSALT();
      }
      if (e.key === 'Escape') {
        setShowTemplatePicker(false);
        setShowAIAssistant(false);
        setShowKeyboardHelp(false);
        setShowAmendmentForm(false);
      }
      if (e.key === 'F1') {
        e.preventDefault();
        setShowKeyboardHelp((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSigned, encounterId]);

  // Auto-save effect
  useEffect(() => {
    if (encounterId && !isSigned) {
      setAutoSaveStatus('unsaved');
      triggerAutoSave();
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [encounterData, selectedTakster]);

  // Helper: Remove empty strings from object
  const cleanEmptyStrings = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const cleanedNested = cleanEmptyStrings(value);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else if (value !== '' && value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };

  const handleSave = () => {
    const baseData = {
      patient_id: patientId,
      practitioner_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      encounter_date: encounterData.encounter_date,
      encounter_type: encounterData.encounter_type,
      duration_minutes: encounterData.duration_minutes,
      vas_pain_start: encounterData.vas_pain_start,
      vas_pain_end: encounterData.vas_pain_end,
      status: 'DRAFT',
    };
    const subjective = cleanEmptyStrings(encounterData.subjective);
    const objective = cleanEmptyStrings(encounterData.objective);
    const assessment = cleanEmptyStrings(encounterData.assessment);
    const plan = cleanEmptyStrings(encounterData.plan);
    const treatments = selectedTakster
      .map((id) => {
        const takst = taksterNorwegian.find((t) => t.id === id);
        return takst
          ? { code: takst.code, name: takst.name, price: takst.price, type: 'CHIROPRACTIC' }
          : null;
      })
      .filter(Boolean);
    const dataToSave = {
      ...baseData,
      ...(Object.keys(subjective).length > 0 && { subjective }),
      ...(Object.keys(objective).length > 0 && { objective }),
      ...(Object.keys(assessment).length > 0 && { assessment }),
      ...(Object.keys(plan).length > 0 && { plan }),
      treatments,
      icpc_codes: encounterData.icpc_codes || [],
      icd10_codes: encounterData.icd10_codes || [],
    };
    saveMutation.mutate(dataToSave);
  };

  const handleSignAndLock = async () => {
    if (!encounterId) {
      const baseData = {
        patient_id: patientId,
        practitioner_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        encounter_date: encounterData.encounter_date,
        encounter_type: encounterData.encounter_type,
        duration_minutes: encounterData.duration_minutes,
        vas_pain_start: encounterData.vas_pain_start,
        vas_pain_end: encounterData.vas_pain_end,
        status: 'DRAFT',
      };
      const subjective = cleanEmptyStrings(encounterData.subjective);
      const objective = cleanEmptyStrings(encounterData.objective);
      const assessment = cleanEmptyStrings(encounterData.assessment);
      const plan = cleanEmptyStrings(encounterData.plan);
      const treatments = selectedTakster
        .map((id) => {
          const takst = taksterNorwegian.find((t) => t.id === id);
          return takst
            ? { code: takst.code, name: takst.name, price: takst.price, type: 'CHIROPRACTIC' }
            : null;
        })
        .filter(Boolean);
      const dataToSave = {
        ...baseData,
        ...(Object.keys(subjective).length > 0 && { subjective }),
        ...(Object.keys(objective).length > 0 && { objective }),
        ...(Object.keys(assessment).length > 0 && { assessment }),
        ...(Object.keys(plan).length > 0 && { plan }),
        treatments,
        icpc_codes: encounterData.icpc_codes || [],
        icd10_codes: encounterData.icd10_codes || [],
      };
      try {
        const response = await encountersAPI.create(dataToSave);
        const newId = response?.data?.id;
        if (newId) {
          await encountersAPI.sign(newId);
          queryClient.invalidateQueries(['encounters']);
          navigate(`/patients/${patientId}/encounter/${newId}`, { replace: true });
        }
      } catch (error) {
        // Error handled by mutation onError callback
      }
    } else {
      handleSave();
      setTimeout(() => signMutation.mutate(encounterId), 500);
    }
  };

  const updateField = (section, field, value) => {
    setEncounterData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleQuickPhrase = (phrase, section, field) => {
    const currentValue = encounterData[section][field] || '';
    const newValue = currentValue + (currentValue ? '\n' : '') + '\u2022 ' + phrase;
    updateField(section, field, newValue);
  };

  const toggleDiagnosis = (diagnosis) => {
    setEncounterData((prev) => {
      const exists = prev.icpc_codes.includes(diagnosis.code);
      return {
        ...prev,
        icpc_codes: exists
          ? prev.icpc_codes.filter((c) => c !== diagnosis.code)
          : [...prev.icpc_codes, diagnosis.code],
      };
    });
    setDiagnosisSearch('');
    setShowDiagnosisDropdown(false);
  };

  const removeDiagnosisCode = (code) => {
    setEncounterData((prev) => ({
      ...prev,
      icpc_codes: prev.icpc_codes.filter((c) => c !== code),
    }));
  };

  const toggleTakst = (takstId) => {
    setSelectedTakster((prev) =>
      prev.includes(takstId) ? prev.filter((t) => t !== takstId) : [...prev, takstId]
    );
  };

  // AI Suggestions
  const getAISuggestions = async () => {
    setAiLoading(true);
    try {
      const soapData = {
        subjective: encounterData.subjective,
        objective: encounterData.objective,
        assessment: encounterData.assessment,
        icpc_codes: encounterData.icpc_codes,
      };
      const patientContext = {
        age: patient?.data?.date_of_birth
          ? Math.floor((new Date() - new Date(patient.data.date_of_birth)) / 31557600000)
          : null,
        gender: patient?.data?.gender,
        medical_history: patient?.data?.medical_history,
        current_medications: patient?.data?.current_medications,
        red_flags: patient?.data?.red_flags,
        contraindications: patient?.data?.contraindications,
      };
      const [diagnosisResponse, redFlagResponse] = await Promise.allSettled([
        aiAPI.suggestDiagnosis(soapData),
        aiAPI.analyzeRedFlags(patientContext, soapData),
      ]);
      const suggestions = { diagnosis: [], treatment: [], followUp: [], clinicalReasoning: '' };
      if (diagnosisResponse.status === 'fulfilled' && diagnosisResponse.value?.data) {
        const diagData = diagnosisResponse.value.data;
        suggestions.diagnosis = diagData.codes || [];
        suggestions.clinicalReasoning = diagData.reasoning || diagData.suggestion || '';
      }
      if (redFlagResponse.status === 'fulfilled' && redFlagResponse.value?.data) {
        const redFlagData = redFlagResponse.value.data;
        if (redFlagData.recommendReferral) {
          suggestions.followUp.push(`\u26A0\uFE0F ${redFlagData.analysis}`);
        }
        if (redFlagData.riskLevel && redFlagData.riskLevel !== 'LOW') {
          suggestions.clinicalReasoning += `\n\nRisikoniv\u00E5: ${redFlagData.riskLevel}`;
        }
      }
      if (suggestions.diagnosis.length === 0 && !suggestions.clinicalReasoning) {
        Object.assign(suggestions, generateMockSuggestions(encounterData.subjective));
      }
      setAiSuggestions(suggestions);
    } catch (error) {
      setAiSuggestions(generateMockSuggestions(encounterData.subjective));
    } finally {
      setAiLoading(false);
    }
  };

  const generateMockSuggestions = (subjective) => {
    const suggestions = { diagnosis: [], treatment: [], followUp: [], clinicalReasoning: '' };
    const complaint = (subjective.chief_complaint || '').toLowerCase();
    const history = (subjective.history || '').toLowerCase();
    const combined = complaint + ' ' + history;
    if (combined.includes('rygg') || combined.includes('back')) {
      suggestions.diagnosis.push('L03 - Korsryggsmerter');
      suggestions.diagnosis.push('L84 - Ryggsyndrom uten utstråling');
      suggestions.treatment.push('HVLA manipulasjon lumbal');
      suggestions.treatment.push('Bl\u00F8tvevsbehandling');
      suggestions.clinicalReasoning =
        'Basert p\u00E5 lumbal smertepresentasjon, vurder mekanisk korsryggsmerte. Utelukk r\u00F8de flagg.';
    }
    if (combined.includes('nakke') || combined.includes('neck')) {
      suggestions.diagnosis.push('L01 - Nakkesmerter');
      suggestions.diagnosis.push('L83 - Nakkesyndrom');
      suggestions.treatment.push('Cervical mobilisering');
      suggestions.clinicalReasoning =
        'Nakkesmertepresentasjon tyder p\u00E5 cervikal facettdysfunksjon eller muskelspenning.';
    }
    if (suggestions.diagnosis.length === 0) {
      suggestions.clinicalReasoning = 'Fyll ut subjektive og objektive funn for AI-forslag.';
    }
    return suggestions;
  };

  // Exam handlers
  const handleNeuroExamChange = (examData) => {
    setNeuroExamData(examData);
    if (examData?.narrative) updateField('objective', 'neuro_tests', examData.narrative);
    if (examData?.redFlags?.length > 0) {
      const neuroRedFlags = examData.redFlags.map(
        (rf) => `NEURO: ${rf.description} - ${rf.action}`
      );
      setRedFlagAlerts((prev) => [
        ...prev.filter((a) => !a.startsWith('NEURO:')),
        ...neuroRedFlags,
      ]);
    }
  };

  const handleOrthoExamChange = (examData) => {
    setOrthoExamData(examData);
    if (examData?.narrative) updateField('objective', 'ortho_tests', examData.narrative);
    if (examData?.redFlags?.length > 0) {
      const orthoRedFlags = examData.redFlags.map(
        (rf) => `ORTHO: ${rf.testName?.no || rf.clusterName?.no} - ${rf.action}`
      );
      setRedFlagAlerts((prev) => [
        ...prev.filter((a) => !a.startsWith('ORTHO:')),
        ...orthoRedFlags,
      ]);
    }
  };

  const handleTemplateSelect = (templateText) => {
    if (!activeField) return;
    const [section, field] = activeField.split('.');
    const currentValue = encounterData[section]?.[field] || '';
    updateField(section, field, currentValue + (currentValue ? '\n' : '') + templateText);
  };

  const handleSpineTextInsert = (text) => {
    const currentValue = encounterData.objective.palpation || '';
    const newValue = currentValue + (currentValue && !currentValue.endsWith(' ') ? ' ' : '') + text;
    setEncounterData((prev) => ({
      ...prev,
      objective: { ...prev.objective, palpation: newValue },
    }));
    setAutoSaveStatus('unsaved');
    if (palpationRef.current) {
      palpationRef.current.focus();
      setTimeout(() => {
        if (palpationRef.current) {
          palpationRef.current.selectionStart = palpationRef.current.value.length;
          palpationRef.current.selectionEnd = palpationRef.current.value.length;
        }
      }, 0);
    }
  };

  // Computed values
  const totalPrice = taksterNorwegian
    .filter((t) => selectedTakster.includes(t.id))
    .reduce((sum, t) => sum + t.price, 0);

  const patientData = patient?.data;
  const patientAge = patientData?.date_of_birth
    ? Math.floor((new Date() - new Date(patientData.date_of_birth)) / 31557600000)
    : null;
  const patientInitials = patientData
    ? `${patientData.first_name?.[0] || ''}${patientData.last_name?.[0] || ''}`.toUpperCase()
    : '??';
  const patientRedFlags = patientData?.red_flags || [];
  const patientContraindications = patientData?.contraindications || [];

  // Filter diagnoses for search
  const allDiagnoses = commonDiagnoses?.data || [];
  const filteredDiagnoses = allDiagnoses.filter(
    (d) =>
      d.code?.toLowerCase().includes(diagnosisSearch.toLowerCase()) ||
      d.description_no?.toLowerCase().includes(diagnosisSearch.toLowerCase())
  );

  // ===============================================================
  // RENDER
  // ===============================================================
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Quick Palpation Spine Sidebar - Always visible right side */}
      <div className="fixed right-0 top-0 w-44 h-full z-20 shadow-lg">
        <QuickPalpationSpine onInsertText={handleSpineTextInsert} disabled={isSigned} />
      </div>

      {/* Main content wrapper with right margin to accommodate spine sidebar */}
      <div className="flex flex-1 mr-44">
        {/* 1. LEFT SIDEBAR - PATIENT CONTEXT & SAFETY */}
        <PatientInfoSidebar
          patientData={patientData}
          patientLoading={patientLoading}
          patientInitials={patientInitials}
          patientAge={patientAge}
          patientRedFlags={patientRedFlags}
          patientContraindications={patientContraindications}
          redFlagAlerts={redFlagAlerts}
          clinicalWarnings={clinicalWarnings}
          aiSuggestions={aiSuggestions}
          onNavigateBack={() => navigate(`/patients/${patientId}`)}
          onOpenAIAssistant={() => setShowAIAssistant(true)}
          onOpenTemplatePicker={() => setShowTemplatePicker(true)}
        />

        {/* 2. MAIN CONTENT - SOAP DOCUMENTATION */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header Bar */}
          <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center space-x-4">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${isSigned ? 'bg-slate-100 text-slate-500' : 'bg-teal-50 text-teal-700'} text-sm font-medium border ${isSigned ? 'border-slate-200' : 'border-teal-200'}`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <input
                  type="date"
                  value={encounterData.encounter_date}
                  onChange={(e) =>
                    setEncounterData((prev) => ({ ...prev, encounter_date: e.target.value }))
                  }
                  disabled={isSigned}
                  className="bg-transparent border-none focus:outline-none text-sm disabled:cursor-not-allowed"
                />
              </span>
              <select
                value={encounterData.encounter_type}
                onChange={(e) => applyEncounterTypeDefaults(e.target.value)}
                disabled={isSigned}
                className="text-sm text-slate-600 bg-transparent border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="INITIAL">F\u00F8rstegangs</option>
                <option value="FOLLOWUP">Oppf\u00F8lging</option>
                <option value="MAINTENANCE">Vedlikehold</option>
                <option value="REEXAM">Re-unders\u00F8kelse</option>
                <option value="EMERGENCY">Akutt</option>
              </select>
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <input
                  type="number"
                  value={encounterData.duration_minutes}
                  onChange={(e) =>
                    setEncounterData((prev) => ({
                      ...prev,
                      duration_minutes: parseInt(e.target.value) || 30,
                    }))
                  }
                  disabled={isSigned}
                  className="w-12 text-center bg-transparent border border-slate-200 rounded px-1 disabled:opacity-50 disabled:cursor-not-allowed"
                />{' '}
                min
              </span>
              <span
                className="text-sm text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-200"
                title="Tid brukt"
              >
                <Clock className="h-3.5 w-3.5 text-teal-600" />
                <span className="font-mono text-teal-700 font-medium">{elapsedTime}</span>
              </span>
              <span
                className="text-sm font-medium flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md border border-green-200 text-green-700"
                title="Takster total"
              >
                {totalPrice} kr
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!isSigned && previousEncounters && (
                <button
                  onClick={() => handleSALT()}
                  className="text-xs px-2 py-1 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors flex items-center gap-1"
                  title="SALT: Kopier fra forrige konsultasjon (Ctrl+L)"
                >
                  <BookOpen className="h-3 w-3" />
                  SALT
                </button>
              )}
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                title="Tastatursnarveier (F1)"
              >
                {'\u2328\uFE0F'}
              </button>
              {autoSaveStatus === 'saving' && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Lagrer...
                </span>
              )}
              {autoSaveStatus === 'saved' && lastSaved && (
                <span
                  className="text-xs text-green-600 flex items-center gap-1"
                  title={`Lagret ${lastSaved.toLocaleTimeString()}`}
                >
                  <Check className="h-3 w-3" />
                  Auto-lagret
                </span>
              )}
              {autoSaveStatus === 'unsaved' && encounterId && !isSigned && (
                <span className="text-xs text-amber-500 flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Ulagrede endringer
                </span>
              )}
              {isSigned ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium">
                  <Lock className="h-3 w-3" />
                  Signert & L\u00E5st
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-600 text-xs">
                  <Activity className="h-3 w-3" />
                  {encounterId ? 'Redigerer' : 'Utkast'}
                </span>
              )}
            </div>
          </header>

          {/* Keyboard Shortcuts Help Modal */}
          {showKeyboardHelp && (
            <div
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
              onClick={() => setShowKeyboardHelp(false)}
            >
              <div
                className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {'\u2328\uFE0F'} Tastatursnarveier
                  </h3>
                  <button
                    onClick={() => setShowKeyboardHelp(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  {Object.entries(keyboardShortcuts).map(([key, desc]) => (
                    <div key={key} className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">{desc}</span>
                      <kbd className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">
                        {key}
                      </kbd>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="font-medium text-slate-700 mb-2">
                    {'\uD83D\uDCDD'} Makroer (skriv og trykk mellomrom)
                  </h4>
                  <div className="grid grid-cols-2 gap-1 text-xs max-h-40 overflow-y-auto">
                    {Object.entries(macros)
                      .slice(0, 10)
                      .map(([key, val]) => (
                        <div key={key} className="flex gap-1">
                          <code className="text-purple-600">{key}</code>
                          <span className="text-slate-500 truncate">{val.substring(0, 20)}...</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Macro hint tooltip */}
          {showMacroHint && currentMacroMatch && (
            <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
              {'\uD83D\uDCA1'} {currentMacroMatch}
            </div>
          )}

          {/* SCROLLABLE SOAP FORM */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              {/* SALT Banner */}
              {!isSigned && previousEncounters && showSALTBanner && (
                <SALTBanner
                  previousEncounter={previousEncounters}
                  onApplyAll={() => {
                    handleSALT();
                    setShowSALTBanner(false);
                  }}
                  onApplySection={(section) => handleSALT(section)}
                  onDismiss={() => setShowSALTBanner(false)}
                  isExpanded={saltBannerExpanded}
                  onToggleExpand={() => setSaltBannerExpanded(!saltBannerExpanded)}
                />
              )}

              {/* S - SUBJECTIVE */}
              <section
                data-testid="encounter-subjective"
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <span className="bg-blue-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
                      S
                    </span>
                    Subjektivt
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">VAS Start:</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={encounterData.vas_pain_start || 0}
                      onChange={(e) =>
                        setEncounterData((prev) => ({
                          ...prev,
                          vas_pain_start: parseInt(e.target.value),
                        }))
                      }
                      disabled={isSigned}
                      className="w-20 h-1.5 accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm font-semibold text-blue-600 w-6">
                      {encounterData.vas_pain_start || 0}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Hovedklage..."
                    value={encounterData.subjective.chief_complaint}
                    onChange={(e) => updateField('subjective', 'chief_complaint', e.target.value)}
                    disabled={isSigned}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                  <EnhancedClinicalTextarea
                    value={encounterData.subjective.history}
                    onChange={(val) => updateField('subjective', 'history', val)}
                    placeholder="Anamnese og symptombeskrivelse..."
                    label="Sykehistorie"
                    section="subjective"
                    field="history"
                    quickPhrases={quickPhrases.subjective}
                    disabled={isSigned}
                    rows={4}
                    showVoiceInput={true}
                    showAIButton={false}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Debut (n\u00E5r startet det?)"
                      value={encounterData.subjective.onset}
                      onChange={(e) => updateField('subjective', 'onset', e.target.value)}
                      disabled={isSigned}
                      className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                    <input
                      type="text"
                      placeholder="Smertebeskrivelse"
                      value={encounterData.subjective.pain_description}
                      onChange={(e) =>
                        updateField('subjective', 'pain_description', e.target.value)
                      }
                      disabled={isSigned}
                      className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </section>

              {/* O - OBJECTIVE */}
              <section
                data-testid="encounter-objective"
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-white border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <span className="bg-emerald-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
                      O
                    </span>
                    Objektivt
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  {/* Observation & Palpation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <EnhancedClinicalTextarea
                      value={encounterData.objective.observation}
                      onChange={(val) => updateField('objective', 'observation', val)}
                      placeholder="Observasjon (holdning, gange)..."
                      label="Observasjon"
                      section="objective"
                      field="observation"
                      disabled={isSigned}
                      rows={3}
                      showVoiceInput={true}
                      showAIButton={false}
                    />
                    <EnhancedClinicalTextarea
                      value={encounterData.objective.palpation}
                      onChange={(val) => updateField('objective', 'palpation', val)}
                      placeholder="Palpasjon (\u00F8mhet, spenninger)..."
                      label="Palpasjon"
                      section="objective"
                      field="palpation"
                      disabled={isSigned}
                      rows={3}
                      showVoiceInput={true}
                      showAIButton={false}
                    />
                  </div>

                  {/* ROM */}
                  <textarea
                    placeholder="Range of Motion (ROM)..."
                    value={encounterData.objective.rom}
                    onChange={(e) => updateField('objective', 'rom', e.target.value)}
                    disabled={isSigned}
                    className="w-full min-h-[60px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />

                  {/* All exam panels via ExamPanelManager */}
                  <ExamPanelManager
                    patientId={patientId}
                    encounterId={encounterId}
                    isSigned={isSigned}
                    showOrthoExam={state.showOrthoExam}
                    setShowOrthoExam={state.setShowOrthoExam}
                    orthoExamData={state.orthoExamData}
                    onOrthoExamChange={handleOrthoExamChange}
                    showNeuroExam={state.showNeuroExam}
                    setShowNeuroExam={state.setShowNeuroExam}
                    neuroExamData={state.neuroExamData}
                    onNeuroExamChange={handleNeuroExamChange}
                    showROMTable={state.showROMTable}
                    setShowROMTable={state.setShowROMTable}
                    romTableData={state.romTableData}
                    setRomTableData={state.setRomTableData}
                    showBodyDiagram={state.showBodyDiagram}
                    setShowBodyDiagram={state.setShowBodyDiagram}
                    bodyDiagramMarkers={state.bodyDiagramMarkers}
                    setBodyDiagramMarkers={state.setBodyDiagramMarkers}
                    showExamProtocol={state.showExamProtocol}
                    setShowExamProtocol={state.setShowExamProtocol}
                    examProtocolData={state.examProtocolData}
                    setExamProtocolData={state.setExamProtocolData}
                    showClusterTests={state.showClusterTests}
                    setShowClusterTests={state.setShowClusterTests}
                    clusterTestData={state.clusterTestData}
                    setClusterTestData={state.setClusterTestData}
                    showRegionalExam={state.showRegionalExam}
                    setShowRegionalExam={state.setShowRegionalExam}
                    regionalExamData={state.regionalExamData}
                    setRegionalExamData={state.setRegionalExamData}
                    showNeurologicalExam={state.showNeurologicalExam}
                    setShowNeurologicalExam={state.setShowNeurologicalExam}
                    neurologicalExamData={state.neurologicalExamData}
                    setNeurologicalExamData={state.setNeurologicalExamData}
                    showOutcomeMeasures={state.showOutcomeMeasures}
                    setShowOutcomeMeasures={state.setShowOutcomeMeasures}
                    outcomeMeasureType={state.outcomeMeasureType}
                    setOutcomeMeasureType={state.setOutcomeMeasureType}
                    outcomeMeasureData={state.outcomeMeasureData}
                    setOutcomeMeasureData={state.setOutcomeMeasureData}
                    showMMT={state.showMMT}
                    setShowMMT={state.setShowMMT}
                    mmtData={state.mmtData}
                    setMmtData={state.setMmtData}
                    showDTR={state.showDTR}
                    setShowDTR={state.setShowDTR}
                    dtrData={state.dtrData}
                    setDtrData={state.setDtrData}
                    showSensoryExam={state.showSensoryExam}
                    setShowSensoryExam={state.setShowSensoryExam}
                    sensoryExamData={state.sensoryExamData}
                    setSensoryExamData={state.setSensoryExamData}
                    showCranialNerves={state.showCranialNerves}
                    setShowCranialNerves={state.setShowCranialNerves}
                    cranialNerveData={state.cranialNerveData}
                    setCranialNerveData={state.setCranialNerveData}
                    showCoordination={state.showCoordination}
                    setShowCoordination={state.setShowCoordination}
                    coordinationData={state.coordinationData}
                    setCoordinationData={state.setCoordinationData}
                    showNerveTension={state.showNerveTension}
                    setShowNerveTension={state.setShowNerveTension}
                    nerveTensionData={state.nerveTensionData}
                    setNerveTensionData={state.setNerveTensionData}
                    showRegionalDiagrams={state.showRegionalDiagrams}
                    setShowRegionalDiagrams={state.setShowRegionalDiagrams}
                    regionalDiagramData={state.regionalDiagramData}
                    setRegionalDiagramData={state.setRegionalDiagramData}
                    selectedRegion={state.selectedRegion}
                    setSelectedRegion={state.setSelectedRegion}
                    showPainAssessment={state.showPainAssessment}
                    setShowPainAssessment={state.setShowPainAssessment}
                    painAssessmentData={state.painAssessmentData}
                    setPainAssessmentData={state.setPainAssessmentData}
                    showHeadacheAssessment={state.showHeadacheAssessment}
                    setShowHeadacheAssessment={state.setShowHeadacheAssessment}
                    headacheData={state.headacheData}
                    setHeadacheData={state.setHeadacheData}
                    showTissueMarkers={state.showTissueMarkers}
                    setShowTissueMarkers={state.setShowTissueMarkers}
                    tissueMarkerData={state.tissueMarkerData}
                    setTissueMarkerData={state.setTissueMarkerData}
                    updateField={updateField}
                    encounterData={encounterData}
                  />

                  <textarea
                    ref={(el) => (textAreaRefs.current['objective.ortho_tests'] = el)}
                    placeholder="Ortopediske tester (sammendrag)..."
                    value={encounterData.objective.ortho_tests}
                    onChange={(e) => updateField('objective', 'ortho_tests', e.target.value)}
                    onFocus={() => setActiveField('objective.ortho_tests')}
                    disabled={isSigned}
                    className="w-full min-h-[60px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />

                  <textarea
                    ref={(el) => (textAreaRefs.current['objective.neuro_tests'] = el)}
                    placeholder="Nevrologiske tester (sammendrag)..."
                    value={encounterData.objective.neuro_tests}
                    onChange={(e) => updateField('objective', 'neuro_tests', e.target.value)}
                    onFocus={() => setActiveField('objective.neuro_tests')}
                    disabled={isSigned}
                    className="w-full min-h-[60px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />

                  {!isSigned && (
                    <div className="flex flex-wrap gap-1.5">
                      {quickPhrases.objective.map((phrase) => (
                        <button
                          key={phrase}
                          onClick={() => handleQuickPhrase(phrase, 'objective', 'ortho_tests')}
                          className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                        >
                          + {phrase}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* A - ASSESSMENT / DIAGNOSIS */}
              <section
                data-testid="encounter-assessment"
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-white border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <span className="bg-amber-500 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
                      A
                    </span>
                    Vurdering & Diagnose
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  <DiagnosisPanel
                    diagnosisSearch={diagnosisSearch}
                    onSearchChange={setDiagnosisSearch}
                    showDropdown={showDiagnosisDropdown}
                    onShowDropdown={setShowDiagnosisDropdown}
                    filteredDiagnoses={filteredDiagnoses}
                    selectedCodes={encounterData.icpc_codes}
                    onToggleDiagnosis={toggleDiagnosis}
                    onRemoveCode={removeDiagnosisCode}
                    isSigned={isSigned}
                  />

                  <EnhancedClinicalTextarea
                    value={encounterData.assessment.clinical_reasoning}
                    onChange={(val) => updateField('assessment', 'clinical_reasoning', val)}
                    placeholder="Klinisk resonnering og vurdering..."
                    label="Klinisk vurdering"
                    section="assessment"
                    field="clinical_reasoning"
                    disabled={isSigned}
                    rows={3}
                    showVoiceInput={true}
                    showAIButton={true}
                    aiContext={{ soapData: encounterData, patientId }}
                  />

                  <input
                    type="text"
                    placeholder="Differensialdiagnoser..."
                    value={encounterData.assessment.differential_diagnosis}
                    onChange={(e) =>
                      updateField('assessment', 'differential_diagnosis', e.target.value)
                    }
                    disabled={isSigned}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                </div>
              </section>

              {/* P - PLAN & TREATMENT (TAKSTER) */}
              <section
                data-testid="encounter-plan"
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-white border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <span className="bg-purple-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
                      P
                    </span>
                    Plan & Behandling
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">VAS Slutt:</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={encounterData.vas_pain_end || 0}
                      onChange={(e) =>
                        setEncounterData((prev) => ({
                          ...prev,
                          vas_pain_end: parseInt(e.target.value),
                        }))
                      }
                      disabled={isSigned}
                      className="w-20 h-1.5 accent-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm font-semibold text-purple-600 w-6">
                      {encounterData.vas_pain_end || 0}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {/* Treatment Notation Method Indicator */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        Behandlingsnotasjon:
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                        <Target className="h-3 w-3" />
                        {getNotationName()}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate('/settings')}
                      className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      <Settings className="h-3 w-3" />
                      Endre i innstillinger
                    </button>
                  </div>

                  {/* Treatment Performed - Conditional Rendering Based on Notation Method */}
                  {isVisualNotation ? (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      {currentNotationMethod.id === 'body_chart' && (
                        <BodyChartPanel
                          value={notationData}
                          onChange={setNotationData}
                          onGenerateNarrative={(narrative) => {
                            setNotationNarrative(narrative);
                            updateField('plan', 'treatment', narrative);
                          }}
                          lang={clinicalLang}
                          readOnly={isSigned}
                        />
                      )}
                      {currentNotationMethod.id === 'anatomical_chart' && (
                        <AnatomicalBodyChart
                          value={notationData}
                          onChange={setNotationData}
                          onGenerateNarrative={(narrative) => {
                            setNotationNarrative(narrative);
                            updateField('plan', 'treatment', narrative);
                          }}
                          lang={clinicalLang}
                          showDermatomes={clinicalPrefs.showDermatomes}
                          showTriggerPoints={clinicalPrefs.showTriggerPoints}
                          readOnly={isSigned}
                        />
                      )}
                      {currentNotationMethod.id === 'activator_protocol' && (
                        <ActivatorMethodPanel
                          value={notationData}
                          onChange={setNotationData}
                          onGenerateNarrative={(narrative) => {
                            setNotationNarrative(narrative);
                            updateField('plan', 'treatment', narrative);
                          }}
                          lang={clinicalLang}
                          readOnly={isSigned}
                        />
                      )}
                      {currentNotationMethod.id === 'facial_lines' && (
                        <FacialLinesChart
                          value={notationData}
                          onChange={setNotationData}
                          onGenerateNarrative={(narrative) => {
                            setNotationNarrative(narrative);
                            updateField('plan', 'treatment', narrative);
                          }}
                          lang={clinicalLang}
                          readOnly={isSigned}
                        />
                      )}
                    </div>
                  ) : (
                    <EnhancedClinicalTextarea
                      value={encounterData.plan.treatment}
                      onChange={(val) => updateField('plan', 'treatment', val)}
                      placeholder={
                        currentNotationMethod.id === 'segment_listing'
                          ? 'Segmentlisting: f.eks. C5 PRS, T4-T6 anterior, L5 PLI...'
                          : currentNotationMethod.id === 'gonstead_listing'
                            ? 'Gonstead: f.eks. Atlas ASLA, C2 PRSA, L5 PLI-M...'
                            : currentNotationMethod.id === 'diversified_notation'
                              ? 'Diversifisert: beskriv manipulasjoner og mobiliseringer...'
                              : currentNotationMethod.id === 'soap_narrative'
                                ? 'SOAP narrativ: beskriv behandlingen i detalj...'
                                : 'Utf\u00F8rt behandling...'
                      }
                      label="Behandling"
                      section="plan"
                      field="treatment"
                      disabled={isSigned}
                      rows={3}
                      showVoiceInput={true}
                      showAIButton={false}
                    />
                  )}

                  {/* Takster Panel */}
                  <TaksterPanel
                    selectedTakster={selectedTakster}
                    onToggleTakst={toggleTakst}
                    showTakster={showTakster}
                    onToggleShow={() => setShowTakster(!showTakster)}
                    totalPrice={totalPrice}
                    isSigned={isSigned}
                  />

                  {/* Exercises & Advice */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Hjemme\u00F8velser</span>
                      <button
                        onClick={() => setShowExercisePanel(!showExercisePanel)}
                        disabled={isSigned}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        {showExercisePanel ? 'Skjul \u00F8velsesbibliotek' : 'Velg fra bibliotek'}
                      </button>
                    </div>
                    {showExercisePanel && (
                      <div className="border border-green-200 rounded-lg overflow-hidden">
                        <ExercisePanel
                          patientId={patientId}
                          encounterId={encounterId}
                          onExercisesChange={(exercises) => {
                            const exerciseText = exercises
                              .map(
                                (e) =>
                                  `${e.name_no || e.name_en}: ${e.sets || 3}x${e.reps || 10}, ${e.frequency || 'daglig'}`
                              )
                              .join('\n');
                            updateField('plan', 'exercises', exerciseText);
                          }}
                          compact={true}
                        />
                      </div>
                    )}
                    <EnhancedClinicalTextarea
                      value={encounterData.plan.exercises}
                      onChange={(val) => updateField('plan', 'exercises', val)}
                      placeholder="Hjemme\u00F8velser og r\u00E5d... (eller velg fra biblioteket over)"
                      label="Hjemme\u00F8velser"
                      section="plan"
                      field="exercises"
                      disabled={isSigned}
                      rows={3}
                      showVoiceInput={true}
                      showAIButton={false}
                    />
                  </div>

                  {/* Follow-up */}
                  <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                    <span className="text-sm font-medium text-slate-700">Oppf\u00F8lging:</span>
                    <input
                      type="text"
                      placeholder="f.eks. 1 uke, 3 behandlinger"
                      value={encounterData.plan.follow_up}
                      onChange={(e) => updateField('plan', 'follow_up', e.target.value)}
                      disabled={isSigned}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </section>

              {/* AMENDMENTS SECTION (Only shown for signed encounters) */}
              {isSigned && (
                <section className="bg-amber-50 rounded-xl border border-amber-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-amber-800 tracking-wide flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      TILLEGG / RETTELSER
                    </h3>
                    {!showAmendmentForm && (
                      <button
                        onClick={() => setShowAmendmentForm(true)}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors flex items-center gap-1.5"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Legg til Tillegg
                      </button>
                    )}
                  </div>

                  {showAmendmentForm && (
                    <div className="bg-white rounded-lg border border-amber-200 p-4 mb-4">
                      <div className="flex gap-4 mb-3">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Type
                          </label>
                          <select
                            value={amendmentType}
                            onChange={(e) => setAmendmentType(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="ADDENDUM">Tillegg (ny informasjon)</option>
                            <option value="CORRECTION">Rettelse (korrigering av feil)</option>
                            <option value="CLARIFICATION">Avklaring (utdyping)</option>
                            <option value="LATE_ENTRY">Sen registrering</option>
                          </select>
                        </div>
                        {amendmentType === 'CORRECTION' && (
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Begrunnelse for rettelse *
                            </label>
                            <input
                              type="text"
                              value={amendmentReason}
                              onChange={(e) => setAmendmentReason(e.target.value)}
                              placeholder="Begrunn hvorfor rettelsen er n\u00F8dvendig"
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        )}
                      </div>
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Innhold
                        </label>
                        <textarea
                          value={amendmentContent}
                          onChange={(e) => setAmendmentContent(e.target.value)}
                          placeholder="Skriv tillegget eller rettelsen her..."
                          rows={4}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 resize-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setShowAmendmentForm(false);
                            setAmendmentContent('');
                            setAmendmentReason('');
                          }}
                          className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Avbryt
                        </button>
                        <button
                          onClick={handleCreateAmendment}
                          disabled={
                            !amendmentContent.trim() ||
                            createAmendmentMutation.isPending ||
                            (amendmentType === 'CORRECTION' && !amendmentReason.trim())
                          }
                          className="px-4 py-2 text-sm font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                          {createAmendmentMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Lagre Tillegg
                        </button>
                      </div>
                    </div>
                  )}

                  {amendments?.data && amendments.data.length > 0 && (
                    <div className="space-y-3">
                      {amendments.data.map((amendment, index) => (
                        <div
                          key={amendment.id}
                          className="bg-white rounded-lg border border-slate-200 p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  amendment.amendment_type === 'CORRECTION'
                                    ? 'bg-red-100 text-red-700'
                                    : amendment.amendment_type === 'CLARIFICATION'
                                      ? 'bg-blue-100 text-blue-700'
                                      : amendment.amendment_type === 'LATE_ENTRY'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {amendment.amendment_type === 'ADDENDUM' && 'Tillegg'}
                                {amendment.amendment_type === 'CORRECTION' && 'Rettelse'}
                                {amendment.amendment_type === 'CLARIFICATION' && 'Avklaring'}
                                {amendment.amendment_type === 'LATE_ENTRY' && 'Sen registrering'}
                              </span>
                              <span className="text-xs text-slate-500">
                                #{index + 1} -{' '}
                                {new Date(amendment.created_at).toLocaleDateString('no-NO')}{' '}
                                {new Date(amendment.created_at).toLocaleTimeString('no-NO', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {amendment.signed_at ? (
                                <span className="flex items-center gap-1 text-xs text-green-600">
                                  <Lock className="h-3 w-3" /> Signert
                                </span>
                              ) : (
                                <button
                                  onClick={() => signAmendmentMutation.mutate(amendment.id)}
                                  disabled={signAmendmentMutation.isPending}
                                  className="px-2 py-1 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                  Signer
                                </button>
                              )}
                            </div>
                          </div>
                          {amendment.reason && (
                            <p className="text-xs text-slate-500 mb-2 italic">
                              Begrunnelse: {amendment.reason}
                            </p>
                          )}
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">
                            {amendment.content}
                          </p>
                          <p className="text-xs text-slate-400 mt-2">
                            Skrevet av: {amendment.author_name || 'Ukjent'}
                            {amendment.signed_by_name &&
                              ` | Signert av: ${amendment.signed_by_name}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!amendments?.data || amendments.data.length === 0) && !showAmendmentForm && (
                    <p className="text-sm text-amber-700 text-center py-4">
                      Ingen tillegg eller rettelser enn\u00E5. Klikk "Legg til Tillegg" for \u00E5
                      dokumentere endringer.
                    </p>
                  )}
                </section>
              )}
            </div>
          </div>

          {/* STICKY FOOTER - ACTIONS */}
          <footer className="bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center flex-shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Activity className="h-4 w-4 text-amber-500" />
                {saveMutation.isPending ? 'Lagrer...' : 'Klar til lagring'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/patients/${patientId}`)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                data-testid="encounter-save-button"
                className="px-6 py-2 text-sm font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Lagre Notat
              </button>
              <button
                onClick={handleSignAndLock}
                disabled={saveMutation.isPending || signMutation.isPending || isSigned}
                className={`px-6 py-2 text-sm font-semibold rounded-lg ${isSigned ? 'bg-green-700' : 'bg-slate-800'} text-white hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm`}
              >
                {signMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSigned ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {isSigned ? 'Signert' : 'Signer og L\u00E5s'}
              </button>
            </div>
          </footer>
        </main>

        {/* AI ASSISTANT PANEL (Floating) */}
        {showAIAssistant && (
          <div className="fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Brain className="w-5 h-5" />
                <h3 className="font-semibold">AI Klinisk Assistent</h3>
              </div>
              <button
                onClick={() => setShowAIAssistant(false)}
                className="text-white hover:bg-purple-800 rounded p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {!aiSuggestions ? (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-4">
                    F\u00E5 AI-drevne kliniske forslag basert p\u00E5 SOAP-notatene
                  </p>
                  <button
                    onClick={getAISuggestions}
                    disabled={aiLoading}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyserer...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        F\u00E5 AI-forslag
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiSuggestions.clinicalReasoning && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Klinisk Resonnering
                      </h4>
                      <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded-lg">
                        {aiSuggestions.clinicalReasoning}
                      </p>
                    </div>
                  )}
                  {aiSuggestions.diagnosis?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Foresl\u00E5tte Diagnoser
                      </h4>
                      <ul className="space-y-2">
                        {aiSuggestions.diagnosis.map((diag, i) => (
                          <li
                            key={i}
                            className="text-sm text-gray-700 bg-blue-50 px-3 py-2 rounded-lg flex items-start gap-2"
                          >
                            <span className="text-blue-600 mt-0.5">{'\u2022'}</span>
                            <span>{diag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiSuggestions.treatment?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Foresl\u00E5tt Behandling
                      </h4>
                      <ul className="space-y-2">
                        {aiSuggestions.treatment.map((treatment, i) => (
                          <li
                            key={i}
                            className="text-sm text-gray-700 bg-green-50 px-3 py-2 rounded-lg flex items-start gap-2"
                          >
                            <span className="text-green-600 mt-0.5">{'\u2022'}</span>
                            <span>{treatment}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={getAISuggestions}
                    disabled={aiLoading}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium"
                  >
                    {aiLoading ? 'Analyserer...' : 'Oppdater Forslag'}
                  </button>
                </div>
              )}
            </div>
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                AI-forslag er kun veiledende. Bruk alltid klinisk skj\u00F8nn.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* AI DIAGNOSIS SIDEBAR (Collapsible) */}
      <AIDiagnosisSidebar
        soapData={encounterData}
        onSelectCode={(suggestion) => {
          if (suggestion.code && !encounterData.icpc_codes.includes(suggestion.code)) {
            setEncounterData((prev) => ({
              ...prev,
              icpc_codes: [...prev.icpc_codes, suggestion.code],
            }));
            setAutoSaveStatus('unsaved');
          }
        }}
        isCollapsed={!showAIDiagnosisSidebar}
        onToggle={() => setShowAIDiagnosisSidebar(!showAIDiagnosisSidebar)}
        disabled={isSigned}
      />

      {/* TEMPLATE PICKER SIDEBAR */}
      <TemplatePicker
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelectTemplate={handleTemplateSelect}
        soapSection={activeField?.split('.')[0] || 'subjective'}
      />

      {/* CONNECTION STATUS INDICATOR */}
      <ConnectionStatus
        pendingChanges={autoSaveStatus === 'unsaved' ? 1 : 0}
        lastSyncTime={lastSaved}
        syncError={null}
        position="bottom-left"
      />
    </div>
  );
}
