/**
 * Clinical Encounter - "Scandi-Clinical Modern" Design
 *
 * Orchestrator component: state management, data fetching, and handler logic.
 * UI sections are extracted to components/encounter/.
 */

import { useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { encountersAPI, patientsAPI, diagnosisAPI, aiAPI } from '../services/api';
import { usePatientIntake } from '../hooks/usePatientIntake';
import { useClinicalPreferences } from '../hooks';

const TemplatePicker = lazy(() => import('../components/TemplatePicker'));
const QuickPalpationSpine = lazy(() => import('../components/clinical/QuickPalpationSpine'));
const AIDiagnosisSidebar = lazy(() => import('../components/clinical/AIDiagnosisSidebar'));
import { ConnectionStatus } from '../components/common';
import toast from '../utils/toast';

// Extracted components
import { useClinicalEncounterState } from '../hooks/useClinicalEncounterState';
import { PatientInfoSidebar } from '../components/encounter/PatientInfoSidebar';
import { taksterNorwegian } from '../components/encounter/TaksterPanel';
import { SOAPNoteForm } from '../components/encounter/SOAPNoteForm';
import { EncounterHeader } from '../components/encounter/EncounterHeader';
import { EncounterFooter } from '../components/encounter/EncounterFooter';
import { AmendmentSection } from '../components/encounter/AmendmentSection';
import { AIAssistantPanel } from '../components/encounter/AIAssistantPanel';
import { KeyboardShortcutsModal } from '../components/encounter/KeyboardShortcutsModal';

// --- STATIC DATA ---

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
    _setShowMacroHint,
    currentMacroMatch,
    _setCurrentMacroMatch,
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
    notationData,
    setNotationData,
    notationNarrative,
    setNotationNarrative,
    textAreaRefs,
    palpationRef,
    autoSaveTimerRef,
    sectionRefs,
    timerIntervalRef,
  } = state;

  // Clinical Preferences
  const {
    preferences: clinicalPrefs,
    currentNotationMethod,
    getNotationName,
    isVisualNotation,
    language: clinicalLang,
  } = useClinicalPreferences();

  // === DATA FETCHING ===

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsAPI.getById(patientId),
    enabled: !!patientId,
  });

  const appointmentId = patient?.currentAppointmentId || null;
  const {
    intake: kioskIntake,
    subjectiveNarrative: kioskSubjective,
    hasIntake: hasKioskIntake,
  } = usePatientIntake(appointmentId);

  useEffect(() => {
    if (hasKioskIntake && kioskSubjective && !kioskDataApplied && !encounterId) {
      setEncounterData((prev) => ({
        ...prev,
        subjective: { ...prev.subjective, chief_complaint: kioskSubjective },
        vas_pain_start: kioskIntake?.painLevel ?? prev.vas_pain_start,
      }));
      setKioskDataApplied(true);
    }
  }, [hasKioskIntake, kioskSubjective, kioskIntake, kioskDataApplied, encounterId]);

  const { data: existingEncounter } = useQuery({
    queryKey: ['encounter', encounterId],
    queryFn: () => encountersAPI.getById(encounterId),
    enabled: !!encounterId,
  });

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

  const { data: commonDiagnoses } = useQuery({
    queryKey: ['diagnosis', 'common'],
    queryFn: () => diagnosisAPI.getCommon(),
  });

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

  // === MUTATIONS ===

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
    onError: () => setAutoSaveStatus('unsaved'),
  });

  const signMutation = useMutation({
    mutationFn: (id) => encountersAPI.sign(id),
    onSuccess: () => {
      setEncounterData((prev) => ({ ...prev, signed_at: new Date().toISOString() }));
      queryClient.invalidateQueries(['encounter', encounterId]);
      queryClient.invalidateQueries(['encounters']);
    },
  });

  const isSigned = !!encounterData.signed_at;

  const { data: amendments, refetch: refetchAmendments } = useQuery({
    queryKey: ['amendments', encounterId],
    queryFn: () => encountersAPI.getAmendments(encounterId),
    enabled: !!encounterId && isSigned,
  });

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

  const signAmendmentMutation = useMutation({
    mutationFn: (amendmentId) => encountersAPI.signAmendment(encounterId, amendmentId),
    onSuccess: () => {
      refetchAmendments();
      queryClient.invalidateQueries(['amendments', encounterId]);
    },
  });

  // === HANDLERS ===

  const handleCreateAmendment = () => {
    if (!amendmentContent.trim()) {
      return;
    }
    createAmendmentMutation.mutate({
      amendment_type: amendmentType,
      reason: amendmentReason,
      content: amendmentContent,
    });
  };

  // Timer
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now - encounterStartTime) / 1000);
      const mins = String(Math.floor(diff / 60)).padStart(2, '0');
      const secs = String(diff % 60).padStart(2, '0');
      setElapsedTime(`${mins}:${secs}`);
    }, 1000);
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [encounterStartTime]);

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

  // SALT
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

  // Auto-save
  const triggerAutoSave = () => {
    if (isSigned || autoSaveStatus === 'saved') {
      return;
    }
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      if (encounterId && !isSigned) {
        setAutoSaveStatus('saving');
        handleSave();
      }
    }, 3000);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        if (!isSigned) {
          handleSave();
        }
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
        const ref = sectionRefs.current[sections[parseInt(e.key) - 1]];
        if (ref) {
          ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        setShowTemplatePicker(true);
      }
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        if (!isSigned) {
          handleSALT();
        }
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

  useEffect(() => {
    if (encounterId && !isSigned) {
      setAutoSaveStatus('unsaved');
      triggerAutoSave();
    }
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [encounterData, selectedTakster]);

  // Clean empty strings helper
  const cleanEmptyStrings = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
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

  const buildSavePayload = () => {
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
    return {
      ...baseData,
      ...(Object.keys(subjective).length > 0 && { subjective }),
      ...(Object.keys(objective).length > 0 && { objective }),
      ...(Object.keys(assessment).length > 0 && { assessment }),
      ...(Object.keys(plan).length > 0 && { plan }),
      treatments,
      icpc_codes: encounterData.icpc_codes || [],
      icd10_codes: encounterData.icd10_codes || [],
    };
  };

  const handleSave = () => saveMutation.mutate(buildSavePayload());

  const handleSignAndLock = async () => {
    if (!encounterId) {
      try {
        const response = await encountersAPI.create(buildSavePayload());
        const newId = response?.data?.id;
        if (newId) {
          await encountersAPI.sign(newId);
          queryClient.invalidateQueries(['encounters']);
          navigate(`/patients/${patientId}/encounter/${newId}`, { replace: true });
        }
      } catch (error) {
        // Error handled by mutation onError
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
    updateField(section, field, `${currentValue + (currentValue ? '\n' : '')}\u2022 ${phrase}`);
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
    const combined = `${subjective.chief_complaint || ''} ${
      subjective.history || ''
    }`.toLowerCase();
    if (combined.includes('rygg') || combined.includes('back')) {
      suggestions.diagnosis.push('L03 - Korsryggsmerter', 'L84 - Ryggsyndrom uten utstråling');
      suggestions.treatment.push('HVLA manipulasjon lumbal', 'Bl\u00F8tvevsbehandling');
      suggestions.clinicalReasoning =
        'Basert p\u00E5 lumbal smertepresentasjon, vurder mekanisk korsryggsmerte. Utelukk r\u00F8de flagg.';
    }
    if (combined.includes('nakke') || combined.includes('neck')) {
      suggestions.diagnosis.push('L01 - Nakkesmerter', 'L83 - Nakkesyndrom');
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
    state.setNeuroExamData(examData);
    if (examData?.narrative) {
      updateField('objective', 'neuro_tests', examData.narrative);
    }
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
    state.setOrthoExamData(examData);
    if (examData?.narrative) {
      updateField('objective', 'ortho_tests', examData.narrative);
    }
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
    if (!activeField) {
      return;
    }
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

  // === COMPUTED VALUES ===

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
      {/* Quick Palpation Spine Sidebar */}
      <div className="fixed right-0 top-0 w-44 h-full z-20 shadow-lg">
        <Suspense fallback={<div className="animate-pulse bg-slate-100 rounded-lg h-full" />}>
          <QuickPalpationSpine onInsertText={handleSpineTextInsert} disabled={isSigned} />
        </Suspense>
      </div>

      <div className="flex flex-1 mr-44">
        {/* LEFT SIDEBAR */}
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

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <EncounterHeader
            encounterData={encounterData}
            setEncounterData={setEncounterData}
            isSigned={isSigned}
            encounterId={encounterId}
            elapsedTime={elapsedTime}
            totalPrice={totalPrice}
            applyEncounterTypeDefaults={applyEncounterTypeDefaults}
            previousEncounters={previousEncounters}
            handleSALT={handleSALT}
            autoSaveStatus={autoSaveStatus}
            lastSaved={lastSaved}
            saveMutation={saveMutation}
            setShowKeyboardHelp={setShowKeyboardHelp}
          />

          <KeyboardShortcutsModal
            showKeyboardHelp={showKeyboardHelp}
            setShowKeyboardHelp={setShowKeyboardHelp}
            keyboardShortcuts={keyboardShortcuts}
            macros={macros}
          />

          {/* Macro hint tooltip */}
          {showMacroHint && currentMacroMatch && (
            <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
              {'\uD83D\uDCA1'} {currentMacroMatch}
            </div>
          )}

          {/* SCROLLABLE SOAP FORM */}
          <div className="flex-1 overflow-y-auto">
            <SOAPNoteForm
              encounterData={encounterData}
              setEncounterData={setEncounterData}
              isSigned={isSigned}
              updateField={updateField}
              quickPhrases={quickPhrases}
              handleQuickPhrase={handleQuickPhrase}
              previousEncounters={previousEncounters}
              showSALTBanner={showSALTBanner}
              setShowSALTBanner={setShowSALTBanner}
              saltBannerExpanded={saltBannerExpanded}
              setSaltBannerExpanded={setSaltBannerExpanded}
              handleSALT={handleSALT}
              textAreaRefs={textAreaRefs}
              setActiveField={setActiveField}
              state={state}
              patientId={patientId}
              encounterId={encounterId}
              handleOrthoExamChange={handleOrthoExamChange}
              handleNeuroExamChange={handleNeuroExamChange}
              diagnosisSearch={diagnosisSearch}
              setDiagnosisSearch={setDiagnosisSearch}
              showDiagnosisDropdown={showDiagnosisDropdown}
              setShowDiagnosisDropdown={setShowDiagnosisDropdown}
              filteredDiagnoses={filteredDiagnoses}
              toggleDiagnosis={toggleDiagnosis}
              removeDiagnosisCode={removeDiagnosisCode}
              clinicalPrefs={clinicalPrefs}
              currentNotationMethod={currentNotationMethod}
              getNotationName={getNotationName}
              isVisualNotation={isVisualNotation}
              clinicalLang={clinicalLang}
              notationData={notationData}
              setNotationData={setNotationData}
              notationNarrative={notationNarrative}
              setNotationNarrative={setNotationNarrative}
              navigate={navigate}
              selectedTakster={selectedTakster}
              toggleTakst={toggleTakst}
              showTakster={showTakster}
              setShowTakster={setShowTakster}
              totalPrice={totalPrice}
              showExercisePanel={showExercisePanel}
              setShowExercisePanel={setShowExercisePanel}
              setAutoSaveStatus={setAutoSaveStatus}
            />

            {/* Amendments (signed encounters only) */}
            {isSigned && (
              <div className="max-w-4xl mx-auto px-6 pb-6">
                <AmendmentSection
                  isSigned={isSigned}
                  amendments={amendments}
                  showAmendmentForm={showAmendmentForm}
                  setShowAmendmentForm={setShowAmendmentForm}
                  amendmentContent={amendmentContent}
                  setAmendmentContent={setAmendmentContent}
                  amendmentType={amendmentType}
                  setAmendmentType={setAmendmentType}
                  amendmentReason={amendmentReason}
                  setAmendmentReason={setAmendmentReason}
                  handleCreateAmendment={handleCreateAmendment}
                  createAmendmentMutation={createAmendmentMutation}
                  signAmendmentMutation={signAmendmentMutation}
                />
              </div>
            )}
          </div>

          <EncounterFooter
            patientId={patientId}
            isSigned={isSigned}
            saveMutation={saveMutation}
            signMutation={signMutation}
            handleSave={handleSave}
            handleSignAndLock={handleSignAndLock}
            navigate={navigate}
          />
        </main>

        {/* AI ASSISTANT PANEL */}
        <AIAssistantPanel
          showAIAssistant={showAIAssistant}
          setShowAIAssistant={setShowAIAssistant}
          aiSuggestions={aiSuggestions}
          aiLoading={aiLoading}
          getAISuggestions={getAISuggestions}
        />
      </div>

      {/* AI DIAGNOSIS SIDEBAR */}
      <Suspense fallback={<div className="animate-pulse bg-slate-100 rounded-lg h-full" />}>
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
      </Suspense>

      {/* TEMPLATE PICKER SIDEBAR */}
      <Suspense fallback={<div className="animate-pulse bg-slate-100 rounded-lg h-full" />}>
        <TemplatePicker
          isOpen={showTemplatePicker}
          onClose={() => setShowTemplatePicker(false)}
          onSelectTemplate={handleTemplateSelect}
          soapSection={activeField?.split('.')[0] || 'subjective'}
        />
      </Suspense>

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
