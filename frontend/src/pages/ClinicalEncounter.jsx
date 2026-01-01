/**
 * Clinical Encounter - "Scandi-Clinical Modern" Design
 *
 * Merged version: New UI design + Full functionality from old version
 * - Split-pane layout with patient context sidebar
 * - All SOAP sections visible at once
 * - Quick phrase chips & Takster auto-totaling
 * - Full API integration, save/load, AI assistant, exam panels
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { encountersAPI, patientsAPI, diagnosisAPI, treatmentsAPI, aiAPI } from '../services/api';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Save,
  User,
  Activity,
  Clock,
  Phone,
  Mail,
  Search,
  X,
  Sparkles,
  ArrowLeft,
  Brain,
  BookOpen,
  Bone,
  Loader2,
  Lock
} from 'lucide-react';
import TemplatePicker from '../components/TemplatePicker';
import { NeurologicalExamCompact } from '../components/neuroexam';
import { OrthopedicExamCompact } from '../components/orthoexam';

// --- STATIC DATA ---
const taksterNorwegian = [
  { id: "l214", code: "L214", name: "Manipulasjonsbehandling", price: 450 },
  { id: "l215", code: "L215", name: "Bløtvevsbehandling", price: 350 },
  { id: "l220", code: "L220", name: "Tillegg for øvelser/veiledning", price: 150 },
  { id: "akutt", code: "AKUTT", name: "Akutt-tillegg (samme dag)", price: 200 },
];

// Enhanced quick phrases - expanded based on competitor analysis (ChiroTouch, ChiroSpring)
const quickPhrases = {
  subjective: [
    // Progress
    "Bedring siden sist",
    "Betydelig bedring",
    "Ingen endring",
    "Noe verre",
    "Betydelig verre",
    // Timing
    "Verre om morgenen",
    "Verre om kvelden",
    "Varierende gjennom dagen",
    "Konstante smerter",
    // Activities
    "Smerter ved løft",
    "Smerter ved sitting",
    "Smerter ved gange",
    "Smerter ved bøying",
    // Symptoms
    "Stivhet etter hvile",
    "Utstråling til ben",
    "Utstråling til arm",
    "Nummenhet/prikking",
    "Hodepine assosiert"
  ],
  objective: [
    // ROM
    "Normal ROM alle retninger",
    "Redusert fleksjon",
    "Redusert ekstensjon",
    "Redusert rotasjon bilat",
    "Redusert lateralfleksjon",
    // Palpation
    "Muskelspasme palperes",
    "Triggerpunkt identifisert",
    "Ømhet over fasettledd",
    "Segmentell dysfunksjon",
    // Tests
    "Positiv SLR venstre",
    "Positiv SLR høyre",
    "Negativ SLR bilat",
    "Positiv Kemp's test",
    "Positiv facettbelastning"
  ],
  assessment: [
    "God respons på behandling",
    "Moderat respons",
    "Begrenset respons",
    "Stabil tilstand",
    "Progresjon som forventet",
    "Vurderer henvisning"
  ],
  plan: [
    "Fortsett nåværende behandlingsplan",
    "Økt behandlingsfrekvens",
    "Redusert behandlingsfrekvens",
    "Hjemmeøvelser gjennomgått",
    "Ergonomisk veiledning gitt",
    "Kontroll om 1 uke"
  ]
};

// Macro system - Type ".xx" to expand (inspired by ChiroTouch EasyTouch macros)
const macros = {
  // Subjective macros
  '.bs': 'Bedring siden sist. ',
  '.ie': 'Ingen endring siden forrige konsultasjon. ',
  '.vm': 'Verre om morgenen, bedre utover dagen. ',
  '.kons': 'Konstante smerter, VAS ',
  '.ust': 'Utstråling til ',

  // Objective macros
  '.nrom': 'Normal ROM i alle retninger. ',
  '.rrom': 'Redusert ROM: ',
  '.palp': 'Ved palpasjon: ',
  '.spasme': 'Muskelspasme palperes paravertebralt. ',
  '.trigger': 'Triggerpunkt identifisert i ',
  '.seg': 'Segmentell dysfunksjon ',

  // Common segments
  '.c': 'Cervical ',
  '.t': 'Thorakal ',
  '.l': 'Lumbal ',
  '.si': 'SI-ledd ',

  // Treatment macros
  '.hvla': 'HVLA manipulasjon ',
  '.mob': 'Mobilisering ',
  '.soft': 'Bløtvevsbehandling ',
  '.dry': 'Dry needling ',
  '.tape': 'Kinesiotaping ',

  // Plan macros
  '.fu1': 'Oppfølging om 1 uke. ',
  '.fu2': 'Oppfølging om 2 uker. ',
  '.øv': 'Hjemmeøvelser gjennomgått og demonstrert. ',
  '.erg': 'Ergonomisk veiledning gitt. ',
  '.hen': 'Henvisning vurderes til ',

  // Quick assessments
  '.godr': 'God respons på behandling. Fortsetter nåværende plan. ',
  '.modr': 'Moderat respons. Justerer behandlingsplan. ',
  '.begr': 'Begrenset respons. Vurderer alternativ tilnærming. '
};

// Keyboard shortcuts reference
const keyboardShortcuts = {
  'Ctrl+S': 'Lagre notat',
  'Ctrl+Shift+S': 'Lagre og signer',
  'Ctrl+1': 'Gå til Subjektivt',
  'Ctrl+2': 'Gå til Objektivt',
  'Ctrl+3': 'Gå til Vurdering',
  'Ctrl+4': 'Gå til Plan',
  'Ctrl+T': 'Åpne maler',
  'Ctrl+L': 'SALT - Kopier fra forrige',
  'Esc': 'Lukk dialoger'
};

// ---------------------------

export default function ClinicalEncounter() {
  const { patientId, encounterId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const textAreaRefs = useRef({});

  // UI State
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showNeuroExam, setShowNeuroExam] = useState(false);
  const [showOrthoExam, setShowOrthoExam] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [diagnosisSearch, setDiagnosisSearch] = useState("");
  const [showDiagnosisDropdown, setShowDiagnosisDropdown] = useState(false);

  // Clinical State
  const [redFlagAlerts, setRedFlagAlerts] = useState([]);
  const [clinicalWarnings, setClinicalWarnings] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [neuroExamData, setNeuroExamData] = useState(null);
  const [orthoExamData, setOrthoExamData] = useState(null);
  
  // Amendment State (for signed encounters)
  const [showAmendmentForm, setShowAmendmentForm] = useState(false);
  const [amendmentContent, setAmendmentContent] = useState('');
  const [amendmentType, setAmendmentType] = useState('ADDENDUM');
  const [amendmentReason, setAmendmentReason] = useState('');

  // Efficiency Features State
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'
  const [lastSaved, setLastSaved] = useState(null);
  const [showMacroHint, setShowMacroHint] = useState(false);
  const [currentMacroMatch, setCurrentMacroMatch] = useState('');
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const autoSaveTimerRef = useRef(null);
  const sectionRefs = useRef({});

  // Treatment State
  const [selectedTakster, setSelectedTakster] = useState(['l214']);

  // Form State - SOAP format
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
      relieving_factors: ''
    },
    objective: {
      observation: '',
      palpation: '',
      rom: '',
      ortho_tests: '',
      neuro_tests: '',
      posture: ''
    },
    assessment: {
      clinical_reasoning: '',
      differential_diagnosis: '',
      prognosis: '',
      red_flags_checked: true
    },
    plan: {
      treatment: '',
      exercises: '',
      advice: '',
      follow_up: '',
      referrals: ''
    },
    icpc_codes: [],
    icd10_codes: [],
    treatments: [],
    vas_pain_start: 5,
    vas_pain_end: 3
  });

  // Fetch patient data
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsAPI.getById(patientId),
    enabled: !!patientId
  });

  // Fetch encounter if editing
  const { data: existingEncounter } = useQuery({
    queryKey: ['encounter', encounterId],
    queryFn: () => encountersAPI.getById(encounterId),
    enabled: !!encounterId
  });

  // Load existing encounter data
  useEffect(() => {
    if (existingEncounter?.data) {
      setEncounterData(prev => ({
        ...prev,
        ...existingEncounter.data,
        encounter_date: new Date(existingEncounter.data.encounter_date).toISOString().split('T')[0]
      }));
      setRedFlagAlerts(existingEncounter.data.redFlagAlerts || []);
      setClinicalWarnings(existingEncounter.data.clinicalWarnings || []);
    }
  }, [existingEncounter]);

  // Fetch diagnosis codes
  const { data: commonDiagnoses } = useQuery({
    queryKey: ['diagnosis', 'common'],
    queryFn: () => diagnosisAPI.getCommon()
  });

  // Fetch treatment codes
  const { data: commonTreatments } = useQuery({
    queryKey: ['treatments', 'common'],
    queryFn: () => treatmentsAPI.getCommon()
  });

  // SALT: Fetch previous encounter for this patient (Same As Last Time feature)
  const { data: previousEncounters } = useQuery({
    queryKey: ['encounters', 'patient', patientId, 'previous'],
    queryFn: async () => {
      // Use the main encounters API with patientId filter
      const response = await encountersAPI.getAll({ patientId, signed: true, limit: 10 });
      // API returns { encounters: [...], pagination: {...} }
      const encounters = response?.data?.encounters || response?.data?.data || response?.data || [];
      const previous = encounters
        .filter(e => e.id !== encounterId)
        .sort((a, b) => new Date(b.encounter_date) - new Date(a.encounter_date));
      return previous[0] || null;
    },
    enabled: !!patientId
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
      // Update auto-save status
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      if (!encounterId && response?.data?.id) {
        navigate(`/patients/${patientId}/encounter/${response.data.id}`, { replace: true });
      }
    },
    onError: () => {
      setAutoSaveStatus('unsaved');
    }
  });

  // Sign encounter mutation
  const signMutation = useMutation({
    mutationFn: (id) => encountersAPI.sign(id),
    onSuccess: (response) => {
      // Update local state with signed timestamp
      setEncounterData(prev => ({
        ...prev,
        signed_at: new Date().toISOString()
      }));
      queryClient.invalidateQueries(['encounter', encounterId]);
      queryClient.invalidateQueries(['encounters']);
    }
  });

  // Check if encounter is signed (immutable) - must be defined before amendments query
  const isSigned = !!encounterData.signed_at;

  // Fetch amendments for signed encounter
  const { data: amendments, refetch: refetchAmendments } = useQuery({
    queryKey: ['amendments', encounterId],
    queryFn: () => encountersAPI.getAmendments(encounterId),
    enabled: !!encounterId && isSigned
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
    }
  });

  // Sign amendment mutation
  const signAmendmentMutation = useMutation({
    mutationFn: (amendmentId) => encountersAPI.signAmendment(encounterId, amendmentId),
    onSuccess: () => {
      refetchAmendments();
      queryClient.invalidateQueries(['amendments', encounterId]);
    }
  });

  // Handle create amendment
  const handleCreateAmendment = () => {
    if (!amendmentContent.trim()) return;
    createAmendmentMutation.mutate({
      amendment_type: amendmentType,
      reason: amendmentReason,
      content: amendmentContent
    });
  };

  // === EFFICIENCY FEATURES ===

  // Macro expansion - expands ".xx" shortcuts to full text
  const expandMacro = (text, cursorPosition) => {
    // Find the word before cursor that starts with "."
    const beforeCursor = text.substring(0, cursorPosition);
    const macroMatch = beforeCursor.match(/(\.[a-zøæå0-9]+)$/i);

    if (macroMatch) {
      const macroKey = macroMatch[1].toLowerCase();
      const expansion = macros[macroKey];

      if (expansion) {
        const newText = text.substring(0, cursorPosition - macroKey.length) + expansion + text.substring(cursorPosition);
        return {
          expanded: true,
          text: newText,
          newCursorPosition: cursorPosition - macroKey.length + expansion.length
        };
      }
    }
    return { expanded: false, text, newCursorPosition: cursorPosition };
  };

  // Handle text input with macro detection
  const handleTextInputWithMacros = (e, section, field) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    // Check for space or enter after potential macro
    if (e.nativeEvent.data === ' ' || e.nativeEvent.inputType === 'insertLineBreak') {
      const result = expandMacro(value.slice(0, -1), cursorPos - 1);
      if (result.expanded) {
        const finalValue = result.text + (e.nativeEvent.data === ' ' ? '' : '\n');
        if (section) {
          setEncounterData(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: finalValue }
          }));
        }
        // Set cursor position after expansion
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

    // Check for matching macros to show hint
    const beforeCursor = value.substring(0, cursorPos);
    const partialMatch = beforeCursor.match(/(\.[a-zøæå0-9]*)$/i);
    if (partialMatch && partialMatch[1].length > 1) {
      const partial = partialMatch[1].toLowerCase();
      const matches = Object.keys(macros).filter(k => k.startsWith(partial));
      if (matches.length > 0 && matches[0] !== partial) {
        setCurrentMacroMatch(matches[0] + ' → ' + macros[matches[0]].substring(0, 30) + '...');
        setShowMacroHint(true);
      } else {
        setShowMacroHint(false);
      }
    } else {
      setShowMacroHint(false);
    }

    return false;
  };

  // SALT - Same As Last Time: Copy from previous encounter
  const handleSALT = (section = null) => {
    if (!previousEncounters) {
      alert('Ingen tidligere konsultasjon funnet for denne pasienten.');
      return;
    }

    const prev = previousEncounters;

    if (section) {
      // Copy specific section
      if (prev[section]) {
        setEncounterData(current => ({
          ...current,
          [section]: { ...current[section], ...prev[section] }
        }));
      }
    } else {
      // Copy all SOAP sections
      setEncounterData(current => ({
        ...current,
        subjective: prev.subjective || current.subjective,
        objective: prev.objective || current.objective,
        assessment: prev.assessment || current.assessment,
        plan: prev.plan || current.plan,
        vas_pain_start: prev.vas_pain_end || current.vas_pain_start, // Use previous end as new start
      }));
      // Copy treatments
      if (prev.treatments?.length > 0) {
        const prevTakstIds = prev.treatments.map(t =>
          taksterNorwegian.find(tak => tak.code === t.code)?.id
        ).filter(Boolean);
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

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for auto-save (3 seconds after last change)
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
      // Ctrl+S: Save
      if (e.ctrlKey && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        if (!isSigned) handleSave();
      }
      // Ctrl+Shift+S: Save and Sign
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        if (!isSigned && encounterId) {
          handleSave();
          setTimeout(() => signMutation.mutate(encounterId), 500);
        }
      }
      // Ctrl+1-4: Jump to SOAP sections
      if (e.ctrlKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const sections = ['subjective', 'objective', 'assessment', 'plan'];
        const section = sections[parseInt(e.key) - 1];
        const ref = sectionRefs.current[section];
        if (ref) ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // Ctrl+T: Open templates
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        setShowTemplatePicker(true);
      }
      // Ctrl+L: SALT - Copy from last visit
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        if (!isSigned) handleSALT();
      }
      // Escape: Close dialogs
      if (e.key === 'Escape') {
        setShowTemplatePicker(false);
        setShowAIAssistant(false);
        setShowKeyboardHelp(false);
        setShowAmendmentForm(false);
      }
      // F1: Show keyboard shortcuts
      if (e.key === 'F1') {
        e.preventDefault();
        setShowKeyboardHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSigned, encounterId]);

  // Auto-save effect - trigger on data changes
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

  // Helper functions
  // Remove empty strings from object (backend validation rejects empty strings)
  const cleanEmptyStrings = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const cleanedNested = cleanEmptyStrings(value);
        // Only include if nested object has values
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
    // Build base data with required fields
    const baseData = {
      patient_id: patientId,
      practitioner_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', // Dev user ID
      encounter_date: encounterData.encounter_date,
      encounter_type: encounterData.encounter_type,
      duration_minutes: encounterData.duration_minutes,
      vas_pain_start: encounterData.vas_pain_start,
      vas_pain_end: encounterData.vas_pain_end,
      status: 'DRAFT'
    };

    // Clean SOAP sections - remove empty strings
    const subjective = cleanEmptyStrings(encounterData.subjective);
    const objective = cleanEmptyStrings(encounterData.objective);
    const assessment = cleanEmptyStrings(encounterData.assessment);
    const plan = cleanEmptyStrings(encounterData.plan);

    // Build treatments with required type field
    const treatments = selectedTakster.map(id => {
      const takst = taksterNorwegian.find(t => t.id === id);
      return takst ? {
        code: takst.code,
        name: takst.name,
        price: takst.price,
        type: 'CHIROPRACTIC' // Required field
      } : null;
    }).filter(Boolean);

    const dataToSave = {
      ...baseData,
      ...(Object.keys(subjective).length > 0 && { subjective }),
      ...(Object.keys(objective).length > 0 && { objective }),
      ...(Object.keys(assessment).length > 0 && { assessment }),
      ...(Object.keys(plan).length > 0 && { plan }),
      treatments,
      icpc_codes: encounterData.icpc_codes || [],
      icd10_codes: encounterData.icd10_codes || []
    };

    console.log('Saving encounter:', dataToSave);
    saveMutation.mutate(dataToSave);
  };

  const handleSignAndLock = async () => {
    // First save, then sign
    if (!encounterId) {
      // Need to create first, then sign
      const baseData = {
        patient_id: patientId,
        practitioner_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        encounter_date: encounterData.encounter_date,
        encounter_type: encounterData.encounter_type,
        duration_minutes: encounterData.duration_minutes,
        vas_pain_start: encounterData.vas_pain_start,
        vas_pain_end: encounterData.vas_pain_end,
        status: 'DRAFT'
      };
      const subjective = cleanEmptyStrings(encounterData.subjective);
      const objective = cleanEmptyStrings(encounterData.objective);
      const assessment = cleanEmptyStrings(encounterData.assessment);
      const plan = cleanEmptyStrings(encounterData.plan);
      const treatments = selectedTakster.map(id => {
        const takst = taksterNorwegian.find(t => t.id === id);
        return takst ? { code: takst.code, name: takst.name, price: takst.price, type: 'CHIROPRACTIC' } : null;
      }).filter(Boolean);

      const dataToSave = {
        ...baseData,
        ...(Object.keys(subjective).length > 0 && { subjective }),
        ...(Object.keys(objective).length > 0 && { objective }),
        ...(Object.keys(assessment).length > 0 && { assessment }),
        ...(Object.keys(plan).length > 0 && { plan }),
        treatments,
        icpc_codes: encounterData.icpc_codes || [],
        icd10_codes: encounterData.icd10_codes || []
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
        console.error('Error creating and signing encounter:', error);
      }
    } else {
      // Save current changes first, then sign
      handleSave();
      // Sign after a brief delay to ensure save completes
      setTimeout(() => {
        signMutation.mutate(encounterId);
      }, 500);
    }
  };

  const updateField = (section, field, value) => {
    setEncounterData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleQuickPhrase = (phrase, section, field) => {
    const currentValue = encounterData[section][field] || '';
    const newValue = currentValue + (currentValue ? "\n" : "") + "• " + phrase;
    updateField(section, field, newValue);
  };

  const toggleDiagnosis = (diagnosis) => {
    setEncounterData(prev => {
      const exists = prev.icpc_codes.includes(diagnosis.code);
      return {
        ...prev,
        icpc_codes: exists
          ? prev.icpc_codes.filter(c => c !== diagnosis.code)
          : [...prev.icpc_codes, diagnosis.code]
      };
    });
    setDiagnosisSearch("");
    setShowDiagnosisDropdown(false);
  };

  const removeDiagnosisCode = (code) => {
    setEncounterData(prev => ({
      ...prev,
      icpc_codes: prev.icpc_codes.filter(c => c !== code)
    }));
  };

  const toggleTakst = (takstId) => {
    setSelectedTakster(prev =>
      prev.includes(takstId)
        ? prev.filter(t => t !== takstId)
        : [...prev, takstId]
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
        icpc_codes: encounterData.icpc_codes
      };

      const patientContext = {
        age: patient?.data?.date_of_birth
          ? Math.floor((new Date() - new Date(patient.data.date_of_birth)) / 31557600000)
          : null,
        gender: patient?.data?.gender,
        medical_history: patient?.data?.medical_history,
        current_medications: patient?.data?.current_medications,
        red_flags: patient?.data?.red_flags,
        contraindications: patient?.data?.contraindications
      };

      const [diagnosisResponse, redFlagResponse] = await Promise.allSettled([
        aiAPI.suggestDiagnosis(soapData),
        aiAPI.analyzeRedFlags(patientContext, soapData)
      ]);

      const suggestions = {
        diagnosis: [],
        treatment: [],
        followUp: [],
        clinicalReasoning: ''
      };

      if (diagnosisResponse.status === 'fulfilled' && diagnosisResponse.value?.data) {
        const diagData = diagnosisResponse.value.data;
        suggestions.diagnosis = diagData.codes || [];
        suggestions.clinicalReasoning = diagData.reasoning || diagData.suggestion || '';
      }

      if (redFlagResponse.status === 'fulfilled' && redFlagResponse.value?.data) {
        const redFlagData = redFlagResponse.value.data;
        if (redFlagData.recommendReferral) {
          suggestions.followUp.push(`⚠️ ${redFlagData.analysis}`);
        }
        if (redFlagData.riskLevel && redFlagData.riskLevel !== 'LOW') {
          suggestions.clinicalReasoning += `\n\nRisikonivå: ${redFlagData.riskLevel}`;
        }
      }

      // Fallback to mock suggestions if AI unavailable
      if (suggestions.diagnosis.length === 0 && !suggestions.clinicalReasoning) {
        const mockSuggestions = generateMockSuggestions(encounterData.subjective);
        Object.assign(suggestions, mockSuggestions);
      }

      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('AI suggestion error:', error);
      setAiSuggestions(generateMockSuggestions(encounterData.subjective));
    } finally {
      setAiLoading(false);
    }
  };

  const generateMockSuggestions = (subjective) => {
    const suggestions = {
      diagnosis: [],
      treatment: [],
      followUp: [],
      clinicalReasoning: ''
    };

    const complaint = (subjective.chief_complaint || '').toLowerCase();
    const history = (subjective.history || '').toLowerCase();
    const combined = complaint + ' ' + history;

    if (combined.includes('rygg') || combined.includes('back')) {
      suggestions.diagnosis.push('L03 - Korsryggsmerter');
      suggestions.diagnosis.push('L84 - Ryggsyndrom uten utstråling');
      suggestions.treatment.push('HVLA manipulasjon lumbal');
      suggestions.treatment.push('Bløtvevsbehandling');
      suggestions.clinicalReasoning = 'Basert på lumbal smertepresentasjon, vurder mekanisk korsryggsmerte. Utelukk røde flagg.';
    }

    if (combined.includes('nakke') || combined.includes('neck')) {
      suggestions.diagnosis.push('L01 - Nakkesmerter');
      suggestions.diagnosis.push('L83 - Nakkesyndrom');
      suggestions.treatment.push('Cervical mobilisering');
      suggestions.clinicalReasoning = 'Nakkesmertepresentasjon tyder på cervikal facettdysfunksjon eller muskelspenning.';
    }

    if (suggestions.diagnosis.length === 0) {
      suggestions.clinicalReasoning = 'Fyll ut subjektive og objektive funn for AI-forslag.';
    }

    return suggestions;
  };

  // Exam handlers
  const handleNeuroExamChange = (examData) => {
    setNeuroExamData(examData);
    if (examData?.narrative) {
      updateField('objective', 'neuro_tests', examData.narrative);
    }
    if (examData?.redFlags?.length > 0) {
      const neuroRedFlags = examData.redFlags.map(rf =>
        `NEURO: ${rf.description} - ${rf.action}`
      );
      setRedFlagAlerts(prev => [...prev.filter(a => !a.startsWith('NEURO:')), ...neuroRedFlags]);
    }
  };

  const handleOrthoExamChange = (examData) => {
    setOrthoExamData(examData);
    if (examData?.narrative) {
      updateField('objective', 'ortho_tests', examData.narrative);
    }
    if (examData?.redFlags?.length > 0) {
      const orthoRedFlags = examData.redFlags.map(rf =>
        `ORTHO: ${rf.testName?.no || rf.clusterName?.no} - ${rf.action}`
      );
      setRedFlagAlerts(prev => [...prev.filter(a => !a.startsWith('ORTHO:')), ...orthoRedFlags]);
    }
  };

  const handleTemplateSelect = (templateText) => {
    if (!activeField) return;
    const [section, field] = activeField.split('.');
    const currentValue = encounterData[section]?.[field] || '';
    updateField(section, field, currentValue + (currentValue ? '\n' : '') + templateText);
  };

  // Computed values
  const totalPrice = taksterNorwegian
    .filter(t => selectedTakster.includes(t.id))
    .reduce((sum, t) => sum + t.price, 0);

  const currentDate = new Date().toLocaleDateString('no-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

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
  const filteredDiagnoses = allDiagnoses.filter(d =>
    d.code?.toLowerCase().includes(diagnosisSearch.toLowerCase()) ||
    d.description_no?.toLowerCase().includes(diagnosisSearch.toLowerCase())
  );

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">

      {/* ═══════════════════════════════════════════════════════════════════
          1. LEFT SIDEBAR - PATIENT CONTEXT & SAFETY
          ═══════════════════════════════════════════════════════════════════ */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10">

        {/* Back Button & Patient Header */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <button
            onClick={() => navigate(`/patients/${patientId}`)}
            className="flex items-center text-sm text-slate-500 hover:text-slate-700 mb-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Tilbake til pasient
          </button>

          {patientLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                  {patientInitials}
                </div>
                <div>
                  <h2 className="font-semibold text-lg text-slate-800">
                    {patientData?.first_name} {patientData?.last_name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {patientAge ? `${patientAge} år` : ''}
                    {patientData?.national_id && ` • Fnr: ${patientData.national_id.substring(0, 6)}-*****`}
                  </p>
                </div>
              </div>

              {/* Quick Contact */}
              <div className="flex gap-2 mt-3">
                <button className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 px-2 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                  <Phone className="h-3 w-3" />
                  Ring
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 px-2 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                  <Mail className="h-3 w-3" />
                  SMS
                </button>
              </div>
            </>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* RED FLAG ALERTS */}
          {(redFlagAlerts.length > 0 || patientRedFlags.length > 0) && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
              <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm mb-2">
                <AlertTriangle className="h-4 w-4" />
                Kliniske Varsler
              </div>
              <ul className="space-y-1">
                {patientRedFlags.map((flag, idx) => (
                  <li key={`patient-${idx}`} className="text-sm text-rose-600 flex items-start gap-2">
                    <span className="text-rose-400 mt-1">•</span>
                    {flag}
                  </li>
                ))}
                {redFlagAlerts.map((alert, idx) => (
                  <li key={`alert-${idx}`} className="text-sm text-rose-600 flex items-start gap-2">
                    <span className="text-rose-400 mt-1">•</span>
                    {alert}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CONTRAINDICATIONS */}
          {patientContraindications.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm mb-2">
                <AlertTriangle className="h-4 w-4" />
                Kontraindikasjoner
              </div>
              <ul className="space-y-1">
                {patientContraindications.map((item, idx) => (
                  <li key={idx} className="text-sm text-amber-600 flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CLINICAL WARNINGS */}
          {clinicalWarnings.length > 0 && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <div className="flex items-center gap-2 text-yellow-700 font-semibold text-sm mb-2">
                <AlertTriangle className="h-4 w-4" />
                Kliniske Advarsler
              </div>
              <ul className="space-y-1">
                {clinicalWarnings.map((warning, idx) => (
                  <li key={idx} className="text-sm text-yellow-600 flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* PATIENT MEDICAL HISTORY */}
          {patientData?.medical_history && (
            <div className="rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 rounded-t-lg">
                <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-teal-600" />
                  Sykehistorie
                </h3>
              </div>
              <div className="p-3">
                <p className="text-sm text-slate-600 leading-relaxed">
                  {patientData.medical_history}
                </p>
              </div>
            </div>
          )}

          {/* AI SUGGESTIONS PREVIEW */}
          <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
                <Sparkles className="h-4 w-4" />
                AI-forslag
              </div>
              <button
                onClick={() => setShowAIAssistant(true)}
                className="text-xs text-purple-600 hover:text-purple-800"
              >
                Åpne →
              </button>
            </div>
            <p className="text-sm text-purple-600">
              {aiSuggestions?.clinicalReasoning || 'Klikk "Åpne" for AI-assistert analyse basert på SOAP-notater.'}
            </p>
          </div>

          {/* TEMPLATE PICKER BUTTON */}
          <button
            onClick={() => setShowTemplatePicker(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors text-sm font-medium"
          >
            <BookOpen className="h-4 w-4" />
            Kliniske Maler
          </button>

        </div>
      </aside>


      {/* ═══════════════════════════════════════════════════════════════════
          2. MAIN CONTENT - SOAP DOCUMENTATION
          ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${isSigned ? 'bg-slate-100 text-slate-500' : 'bg-teal-50 text-teal-700'} text-sm font-medium border ${isSigned ? 'border-slate-200' : 'border-teal-200'}`}>
              <Calendar className="h-3.5 w-3.5" />
              <input
                type="date"
                value={encounterData.encounter_date}
                onChange={(e) => setEncounterData(prev => ({ ...prev, encounter_date: e.target.value }))}
                disabled={isSigned}
                className="bg-transparent border-none focus:outline-none text-sm disabled:cursor-not-allowed"
              />
            </span>
            <select
              value={encounterData.encounter_type}
              onChange={(e) => setEncounterData(prev => ({ ...prev, encounter_type: e.target.value }))}
              disabled={isSigned}
              className="text-sm text-slate-600 bg-transparent border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="INITIAL">Førstegangs</option>
              <option value="FOLLOWUP">Oppfølging</option>
              <option value="REEXAM">Re-undersøkelse</option>
              <option value="EMERGENCY">Akutt</option>
            </select>
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <input
                type="number"
                value={encounterData.duration_minutes}
                onChange={(e) => setEncounterData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 30 }))}
                disabled={isSigned}
                className="w-12 text-center bg-transparent border border-slate-200 rounded px-1 disabled:opacity-50 disabled:cursor-not-allowed"
              /> min
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* SALT Button - Copy from last visit */}
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
            {/* Keyboard shortcuts help */}
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              title="Tastatursnarveier (F1)"
            >
              ⌨️
            </button>
            {/* Auto-save indicator */}
            {autoSaveStatus === 'saving' && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Lagrer...
              </span>
            )}
            {autoSaveStatus === 'saved' && lastSaved && (
              <span className="text-xs text-green-600 flex items-center gap-1" title={`Lagret ${lastSaved.toLocaleTimeString()}`}>
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
                Signert & Låst
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
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowKeyboardHelp(false)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">⌨️ Tastatursnarveier</h3>
                <button onClick={() => setShowKeyboardHelp(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                {Object.entries(keyboardShortcuts).map(([key, desc]) => (
                  <div key={key} className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">{desc}</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">{key}</kbd>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="font-medium text-slate-700 mb-2">📝 Makroer (skriv og trykk mellomrom)</h4>
                <div className="grid grid-cols-2 gap-1 text-xs max-h-40 overflow-y-auto">
                  {Object.entries(macros).slice(0, 10).map(([key, val]) => (
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
            💡 {currentMacroMatch}
          </div>
        )}


        {/* ═══════════════════════════════════════════════════════════════════
            SCROLLABLE SOAP FORM
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6">

            {/* ─────────────────────────────────────────────────────────────────
                S - SUBJECTIVE
                ───────────────────────────────────────────────────────────────── */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <span className="bg-blue-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">S</span>
                  Subjektivt
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">VAS Start:</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={encounterData.vas_pain_start || 0}
                    onChange={(e) => setEncounterData(prev => ({ ...prev, vas_pain_start: parseInt(e.target.value) }))}
                    disabled={isSigned}
                    className="w-20 h-1.5 accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-semibold text-blue-600 w-6">{encounterData.vas_pain_start || 0}</span>
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
                <textarea
                  ref={(el) => textAreaRefs.current['subjective.history'] = el}
                  placeholder="Anamnese og symptombeskrivelse... (bruk .bs for makro)"
                  className="w-full min-h-[100px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  value={encounterData.subjective.history}
                  onChange={(e) => {
                    if (!handleTextInputWithMacros(e, 'subjective', 'history')) {
                      updateField('subjective', 'history', e.target.value);
                    }
                  }}
                  onFocus={() => setActiveField('subjective.history')}
                  disabled={isSigned}
                />
                {!isSigned && (
                  <div className="flex flex-wrap gap-1.5">
                    {quickPhrases.subjective.map(phrase => (
                      <button
                        key={phrase}
                        onClick={() => handleQuickPhrase(phrase, 'subjective', 'history')}
                        className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                      >
                        + {phrase}
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Debut (når startet det?)"
                    value={encounterData.subjective.onset}
                    onChange={(e) => updateField('subjective', 'onset', e.target.value)}
                    disabled={isSigned}
                    className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                  <input
                    type="text"
                    placeholder="Smertebeskrivelse"
                    value={encounterData.subjective.pain_description}
                    onChange={(e) => updateField('subjective', 'pain_description', e.target.value)}
                    disabled={isSigned}
                    className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </section>


            {/* ─────────────────────────────────────────────────────────────────
                O - OBJECTIVE
                ───────────────────────────────────────────────────────────────── */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-white border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <span className="bg-emerald-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">O</span>
                  Objektivt
                </h3>
              </div>
              <div className="p-4 space-y-4">

                {/* Observation & Palpation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <textarea
                    placeholder="Observasjon (holdning, gange)..."
                    value={encounterData.objective.observation}
                    onChange={(e) => {
                      if (!handleTextInputWithMacros(e, 'objective', 'observation')) {
                        updateField('objective', 'observation', e.target.value);
                      }
                    }}
                    disabled={isSigned}
                    className="min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                  <textarea
                    placeholder="Palpasjon (ømhet, spenninger)... (bruk .palp for makro)"
                    value={encounterData.objective.palpation}
                    onChange={(e) => {
                      if (!handleTextInputWithMacros(e, 'objective', 'palpation')) {
                        updateField('objective', 'palpation', e.target.value);
                      }
                    }}
                    disabled={isSigned}
                    className="min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
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

                {/* Orthopedic Exam Panel */}
                <div className="border border-blue-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowOrthoExam(!showOrthoExam)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Bone className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Ortopedisk Undersøkelse</span>
                      {orthoExamData?.clusterScores && (
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                          {Object.keys(orthoExamData.clusterScores).length} tester
                        </span>
                      )}
                    </div>
                    {showOrthoExam ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5 text-blue-600" />}
                  </button>
                  {showOrthoExam && (
                    <div className="p-4 bg-white">
                      <OrthopedicExamCompact
                        patientId={patientId}
                        encounterId={encounterId}
                        onExamChange={handleOrthoExamChange}
                        initialData={orthoExamData}
                      />
                    </div>
                  )}
                </div>

                <textarea
                  ref={(el) => textAreaRefs.current['objective.ortho_tests'] = el}
                  placeholder="Ortopediske tester (sammendrag)..."
                  value={encounterData.objective.ortho_tests}
                  onChange={(e) => updateField('objective', 'ortho_tests', e.target.value)}
                  onFocus={() => setActiveField('objective.ortho_tests')}
                  disabled={isSigned}
                  className="w-full min-h-[60px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                />

                {/* Neurological Exam Panel */}
                <div className="border border-purple-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowNeuroExam(!showNeuroExam)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Nevrologisk Undersøkelse</span>
                      {neuroExamData?.clusterScores && (
                        <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                          {Object.keys(neuroExamData.clusterScores).length} tester
                        </span>
                      )}
                    </div>
                    {showNeuroExam ? <ChevronUp className="w-5 h-5 text-purple-600" /> : <ChevronDown className="w-5 h-5 text-purple-600" />}
                  </button>
                  {showNeuroExam && (
                    <div className="p-4 bg-white">
                      <NeurologicalExamCompact
                        patientId={patientId}
                        encounterId={encounterId}
                        onExamChange={handleNeuroExamChange}
                        initialData={neuroExamData}
                      />
                    </div>
                  )}
                </div>

                <textarea
                  ref={(el) => textAreaRefs.current['objective.neuro_tests'] = el}
                  placeholder="Nevrologiske tester (sammendrag)..."
                  value={encounterData.objective.neuro_tests}
                  onChange={(e) => updateField('objective', 'neuro_tests', e.target.value)}
                  onFocus={() => setActiveField('objective.neuro_tests')}
                  disabled={isSigned}
                  className="w-full min-h-[60px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                />

                {!isSigned && (
                  <div className="flex flex-wrap gap-1.5">
                    {quickPhrases.objective.map(phrase => (
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


            {/* ─────────────────────────────────────────────────────────────────
                A - ASSESSMENT / DIAGNOSIS
                ───────────────────────────────────────────────────────────────── */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-white border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <span className="bg-amber-500 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">A</span>
                  Vurdering & Diagnose
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Diagnosis Search */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Søk ICPC-2 kode eller diagnose (f.eks. L02, rygg)..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                      value={diagnosisSearch}
                      onChange={(e) => {
                        setDiagnosisSearch(e.target.value);
                        setShowDiagnosisDropdown(true);
                      }}
                      onFocus={() => setShowDiagnosisDropdown(true)}
                      disabled={isSigned}
                    />
                  </div>

                  {showDiagnosisDropdown && diagnosisSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg max-h-60 overflow-y-auto">
                      {filteredDiagnoses.length > 0 ? (
                        filteredDiagnoses.slice(0, 10).map((diagnosis) => (
                          <button
                            key={diagnosis.code}
                            onClick={() => toggleDiagnosis(diagnosis)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-amber-50 flex items-center justify-between"
                          >
                            <span>
                              <span className="font-mono font-medium text-amber-600">{diagnosis.code}</span>
                              <span className="text-slate-600 ml-2">- {diagnosis.description_no}</span>
                            </span>
                            {encounterData.icpc_codes.includes(diagnosis.code) && (
                              <Check className="h-4 w-4 text-amber-600" />
                            )}
                          </button>
                        ))
                      ) : (
                        <p className="px-4 py-3 text-sm text-slate-500">Ingen diagnose funnet</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Diagnoses */}
                {encounterData.icpc_codes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {encounterData.icpc_codes.map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-medium"
                      >
                        <span className="font-mono">{code}</span>
                        <button
                          onClick={() => removeDiagnosisCode(code)}
                          className="ml-1 hover:text-amber-900"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <textarea
                  ref={(el) => textAreaRefs.current['assessment.clinical_reasoning'] = el}
                  placeholder="Klinisk resonnering og vurdering..."
                  className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  value={encounterData.assessment.clinical_reasoning}
                  onChange={(e) => updateField('assessment', 'clinical_reasoning', e.target.value)}
                  onFocus={() => setActiveField('assessment.clinical_reasoning')}
                  disabled={isSigned}
                />

                <input
                  type="text"
                  placeholder="Differensialdiagnoser..."
                  value={encounterData.assessment.differential_diagnosis}
                  onChange={(e) => updateField('assessment', 'differential_diagnosis', e.target.value)}
                  disabled={isSigned}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            </section>


            {/* ─────────────────────────────────────────────────────────────────
                P - PLAN & TREATMENT (TAKSTER)
                ───────────────────────────────────────────────────────────────── */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-white border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <span className="bg-purple-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">P</span>
                  Plan & Behandling
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">VAS Slutt:</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={encounterData.vas_pain_end || 0}
                    onChange={(e) => setEncounterData(prev => ({ ...prev, vas_pain_end: parseInt(e.target.value) }))}
                    disabled={isSigned}
                    className="w-20 h-1.5 accent-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-semibold text-purple-600 w-6">{encounterData.vas_pain_end || 0}</span>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {/* Treatment Performed */}
                <textarea
                  ref={(el) => textAreaRefs.current['plan.treatment'] = el}
                  placeholder="Utført behandling... (bruk .hvla for makro)"
                  className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  value={encounterData.plan.treatment}
                  onChange={(e) => {
                    if (!handleTextInputWithMacros(e, 'plan', 'treatment')) {
                      updateField('plan', 'treatment', e.target.value);
                    }
                  }}
                  onFocus={() => setActiveField('plan.treatment')}
                  disabled={isSigned}
                />

                {/* Takster Selection */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Takster (behandlingskoder)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {taksterNorwegian.map((takst) => (
                      <button
                        key={takst.id}
                        onClick={() => toggleTakst(takst.id)}
                        disabled={isSigned}
                        className={`
                          flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all
                          ${selectedTakster.includes(takst.id)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'}
                          ${isSigned ? 'opacity-60 cursor-not-allowed' : ''}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            h-5 w-5 rounded flex items-center justify-center
                            ${selectedTakster.includes(takst.id)
                              ? 'bg-purple-600 text-white'
                              : 'border-2 border-slate-300'}
                          `}>
                            {selectedTakster.includes(takst.id) && <Check className="h-3 w-3" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{takst.code}</p>
                            <p className="text-xs text-slate-500">{takst.name}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-slate-600">{takst.price} kr</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex justify-end">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-100 text-purple-800">
                      <span className="text-sm">Totalt:</span>
                      <span className="font-bold">{totalPrice} kr</span>
                    </div>
                  </div>
                </div>

                {/* Exercises & Advice */}
                <textarea
                  ref={(el) => textAreaRefs.current['plan.exercises'] = el}
                  placeholder="Hjemmeøvelser og råd..."
                  className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  value={encounterData.plan.exercises}
                  onChange={(e) => updateField('plan', 'exercises', e.target.value)}
                  onFocus={() => setActiveField('plan.exercises')}
                  disabled={isSigned}
                />

                {/* Follow-up */}
                <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                  <span className="text-sm font-medium text-slate-700">Oppfølging:</span>
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

            {/* ═══════════════════════════════════════════════════════════════════
                AMENDMENTS SECTION (Only shown for signed encounters)
                ═══════════════════════════════════════════════════════════════════ */}
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

                {/* Amendment Form */}
                {showAmendmentForm && (
                  <div className="bg-white rounded-lg border border-amber-200 p-4 mb-4">
                    <div className="flex gap-4 mb-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
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
                          <label className="block text-xs font-medium text-slate-600 mb-1">Begrunnelse for rettelse *</label>
                          <input
                            type="text"
                            value={amendmentReason}
                            onChange={(e) => setAmendmentReason(e.target.value)}
                            placeholder="Begrunn hvorfor rettelsen er nødvendig"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Innhold</label>
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
                        disabled={!amendmentContent.trim() || createAmendmentMutation.isPending || (amendmentType === 'CORRECTION' && !amendmentReason.trim())}
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

                {/* Existing Amendments List */}
                {amendments?.data && amendments.data.length > 0 && (
                  <div className="space-y-3">
                    {amendments.data.map((amendment, index) => (
                      <div key={amendment.id} className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              amendment.amendment_type === 'CORRECTION' ? 'bg-red-100 text-red-700' :
                              amendment.amendment_type === 'CLARIFICATION' ? 'bg-blue-100 text-blue-700' :
                              amendment.amendment_type === 'LATE_ENTRY' ? 'bg-purple-100 text-purple-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {amendment.amendment_type === 'ADDENDUM' && 'Tillegg'}
                              {amendment.amendment_type === 'CORRECTION' && 'Rettelse'}
                              {amendment.amendment_type === 'CLARIFICATION' && 'Avklaring'}
                              {amendment.amendment_type === 'LATE_ENTRY' && 'Sen registrering'}
                            </span>
                            <span className="text-xs text-slate-500">
                              #{index + 1} - {new Date(amendment.created_at).toLocaleDateString('no-NO')} {new Date(amendment.created_at).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {amendment.signed_at ? (
                              <span className="flex items-center gap-1 text-xs text-green-600">
                                <Lock className="h-3 w-3" />
                                Signert
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
                          <p className="text-xs text-slate-500 mb-2 italic">Begrunnelse: {amendment.reason}</p>
                        )}
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{amendment.content}</p>
                        <p className="text-xs text-slate-400 mt-2">
                          Skrevet av: {amendment.author_name || 'Ukjent'}
                          {amendment.signed_by_name && ` | Signert av: ${amendment.signed_by_name}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {(!amendments?.data || amendments.data.length === 0) && !showAmendmentForm && (
                  <p className="text-sm text-amber-700 text-center py-4">
                    Ingen tillegg eller rettelser ennå. Klikk "Legg til Tillegg" for å dokumentere endringer.
                  </p>
                )}
              </section>
            )}

          </div>
        </div>


        {/* ═══════════════════════════════════════════════════════════════════
            STICKY FOOTER - ACTIONS
            ═══════════════════════════════════════════════════════════════════ */}
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
              {isSigned ? 'Signert' : 'Signer og Lås'}
            </button>
          </div>
        </footer>

      </main>


      {/* ═══════════════════════════════════════════════════════════════════
          AI ASSISTANT PANEL (Floating)
          ═══════════════════════════════════════════════════════════════════ */}
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
                  Få AI-drevne kliniske forslag basert på SOAP-notatene
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
                      Få AI-forslag
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {aiSuggestions.clinicalReasoning && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Klinisk Resonnering</h4>
                    <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded-lg">
                      {aiSuggestions.clinicalReasoning}
                    </p>
                  </div>
                )}

                {aiSuggestions.diagnosis?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Foreslåtte Diagnoser</h4>
                    <ul className="space-y-2">
                      {aiSuggestions.diagnosis.map((diag, i) => (
                        <li key={i} className="text-sm text-gray-700 bg-blue-50 px-3 py-2 rounded-lg flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{diag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiSuggestions.treatment?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Foreslått Behandling</h4>
                    <ul className="space-y-2">
                      {aiSuggestions.treatment.map((treatment, i) => (
                        <li key={i} className="text-sm text-gray-700 bg-green-50 px-3 py-2 rounded-lg flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">•</span>
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
              AI-forslag er kun veiledende. Bruk alltid klinisk skjønn.
            </p>
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════════════════
          TEMPLATE PICKER SIDEBAR
          ═══════════════════════════════════════════════════════════════════ */}
      <TemplatePicker
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelectTemplate={handleTemplateSelect}
        soapSection={activeField?.split('.')[0] || 'subjective'}
      />

    </div>
  );
}
