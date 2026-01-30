import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { encountersAPI, patientsAPI, diagnosisAPI, treatmentsAPI, aiAPI } from '../services/api';
import { usePatientIntake } from '../hooks/usePatientIntake';

const EncounterContext = createContext();

export const useEncounter = () => {
  const context = useContext(EncounterContext);
  if (!context) {
    throw new Error('useEncounter must be used within an EncounterProvider');
  }
  return context;
};

// Default Dev User (The "Open Way" for now)
const DEV_USER_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

export const EncounterProvider = ({ children }) => {
  const { patientId, encounterId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const autoSaveTimerRef = useRef(null);

  // --- STATE ---

  // UI State
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [activeField, setActiveField] = useState(null);
  
  // Validation State
  const [errors, setErrors] = useState({});

  // Clinical Data State
  const [redFlagAlerts, setRedFlagAlerts] = useState([]);
  const [clinicalWarnings, setClinicalWarnings] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Exam Specific States (Objective)
  // Grouping them would be cleaner, but keeping flat for easier migration for now
  const [showNeuroExam, setShowNeuroExam] = useState(false);
  const [showOrthoExam, setShowOrthoExam] = useState(false);
  const [showExamProtocol, setShowExamProtocol] = useState(false);
  const [showClusterTests, setShowClusterTests] = useState(false);
  const [showBodyDiagram, setShowBodyDiagram] = useState(false);
  const [showROMTable, setShowROMTable] = useState(false);
  const [showRegionalExam, setShowRegionalExam] = useState(false);
  const [showNeurologicalExam, setShowNeurologicalExam] = useState(false);
  const [showOutcomeMeasures, setShowOutcomeMeasures] = useState(false);
  const [showMMT, setShowMMT] = useState(false);
  const [showCranialNerves, setShowCranialNerves] = useState(false);
  const [showSensoryExam, setShowSensoryExam] = useState(false);
  const [showPainAssessment, setShowPainAssessment] = useState(false);
  const [showDTR, setShowDTR] = useState(false);
  const [showCoordination, setShowCoordination] = useState(false);
  const [showNerveTension, setShowNerveTension] = useState(false);
  const [showRegionalDiagrams, setShowRegionalDiagrams] = useState(false);
  const [showHeadacheAssessment, setShowHeadacheAssessment] = useState(false);
  const [showTissueMarkers, setShowTissueMarkers] = useState(false);

  // Data Holders
  const [neuroExamData, setNeuroExamData] = useState(null);
  const [orthoExamData, setOrthoExamData] = useState(null);
  const [examProtocolData, setExamProtocolData] = useState({});
  const [clusterTestData, setClusterTestData] = useState({});
  const [bodyDiagramMarkers, setBodyDiagramMarkers] = useState([]);
  const [romTableData, setRomTableData] = useState({});
  const [neurologicalExamData, setNeurologicalExamData] = useState({});
  const [outcomeMeasureType, setOutcomeMeasureType] = useState('ndi');
  const [outcomeMeasureData, setOutcomeMeasureData] = useState({});
  const [regionalExamData, setRegionalExamData] = useState({});
  const [mmtData, setMmtData] = useState({});
  const [cranialNerveData, setCranialNerveData] = useState({});
  const [sensoryExamData, setSensoryExamData] = useState({});
  const [painAssessmentData, setPainAssessmentData] = useState({});
  const [dtrData, setDtrData] = useState({});
  const [coordinationData, setCoordinationData] = useState({});
  const [nerveTensionData, setNerveTensionData] = useState({});
  const [regionalDiagramData, setRegionalDiagramData] = useState({});
  const [headacheData, setHeadacheData] = useState({});
  const [tissueMarkerData, setTissueMarkerData] = useState({});
  const [selectedRegion, setSelectedRegion] = useState('shoulder');

  // Amendment State
  const [showAmendmentForm, setShowAmendmentForm] = useState(false);
  const [amendmentContent, setAmendmentContent] = useState('');
  const [amendmentType, setAmendmentType] = useState('ADDENDUM');
  const [amendmentReason, setAmendmentReason] = useState('');

  // Auto-save
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [lastSaved, setLastSaved] = useState(null);

  // Main Encounter Data
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

  const [selectedTakster, setSelectedTakster] = useState(['l214']);
  const [showTakster, setShowTakster] = useState(false);

  // --- QUERIES ---

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsAPI.getById(patientId),
    enabled: !!patientId
  });

  const { data: existingEncounter } = useQuery({
    queryKey: ['encounter', encounterId],
    queryFn: () => encountersAPI.getById(encounterId),
    enabled: !!encounterId
  });

  const { data: previousEncounters } = useQuery({
    queryKey: ['encounters', 'patient', patientId, 'previous'],
    queryFn: async () => {
      const response = await encountersAPI.getAll({ patientId, signed: true, limit: 10 });
      const encounters = response?.data?.encounters || response?.data?.data || response?.data || [];
      const previous = encounters
        .filter(e => e.id !== encounterId)
        .sort((a, b) => new Date(b.encounter_date) - new Date(a.encounter_date));
      return previous[0] || null;
    },
    enabled: !!patientId
  });

  const { data: commonDiagnoses } = useQuery({
    queryKey: ['diagnosis', 'common'],
    queryFn: () => diagnosisAPI.getCommon()
  });

  const isSigned = !!encounterData.signed_at;

  const { data: amendments, refetch: refetchAmendments } = useQuery({
    queryKey: ['amendments', encounterId],
    queryFn: () => encountersAPI.getAmendments(encounterId),
    enabled: !!encounterId && isSigned
  });

  // --- EFFECTS ---

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

  // Kiosk Logic
  const appointmentId = patient?.currentAppointmentId || null;
  const { intake: kioskIntake, subjectiveNarrative: kioskSubjective, hasIntake: hasKioskIntake } = usePatientIntake(appointmentId);
  const [kioskDataApplied, setKioskDataApplied] = useState(false);

  useEffect(() => {
    if (hasKioskIntake && kioskSubjective && !kioskDataApplied && !encounterId) {
      setEncounterData(prev => ({
        ...prev,
        subjective: { ...prev.subjective, chief_complaint: kioskSubjective },
        vas_pain_start: kioskIntake?.painLevel ?? prev.vas_pain_start
      }));
      setKioskDataApplied(true);
    }
  }, [hasKioskIntake, kioskSubjective, kioskIntake, kioskDataApplied, encounterId]);

  // Auto-save logic
  useEffect(() => {
    if (encounterId && !isSigned) {
      setAutoSaveStatus('unsaved');
      
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      
      autoSaveTimerRef.current = setTimeout(() => {
        setAutoSaveStatus('saving');
        handleSave(false); // Silent save
      }, 3000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [encounterData, selectedTakster]);

  // --- ACTIONS ---

  const cleanEmptyStrings = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const cleanedNested = cleanEmptyStrings(value);
        if (Object.keys(cleanedNested).length > 0) cleaned[key] = cleanedNested;
      } else if (value !== '' && value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (encounterId) return encountersAPI.update(encounterId, data);
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
    onError: () => setAutoSaveStatus('unsaved')
  });

  const signMutation = useMutation({
    mutationFn: (id) => encountersAPI.sign(id),
    onSuccess: () => {
      setEncounterData(prev => ({ ...prev, signed_at: new Date().toISOString() }));
      queryClient.invalidateQueries(['encounter', encounterId]);
    }
  });

  // Takster Data (Move to static/API later if needed)
  const taksterNorwegian = [
    { id: "l214", code: "L214", name: "Manipulasjonsbehandling", price: 450 },
    { id: "l215", code: "L215", name: "Bløtvevsbehandling", price: 350 },
    { id: "l220", code: "L220", name: "Tillegg for øvelser/veiledning", price: 150 },
    { id: "akutt", code: "AKUTT", name: "Akutt-tillegg (samme dag)", price: 200 },
  ];

  const totalPrice = taksterNorwegian
    .filter(t => selectedTakster.includes(t.id))
    .reduce((sum, t) => sum + t.price, 0);

  const handleSave = (showToast = true) => {
    const subjective = cleanEmptyStrings(encounterData.subjective);
    const objective = cleanEmptyStrings(encounterData.objective);
    const assessment = cleanEmptyStrings(encounterData.assessment);
    const plan = cleanEmptyStrings(encounterData.plan);

    const treatments = selectedTakster.map(id => {
      const takst = taksterNorwegian.find(t => t.id === id);
      return takst ? { code: takst.code, name: takst.name, price: takst.price, type: 'CHIROPRACTIC' } : null;
    }).filter(Boolean);

    const dataToSave = {
      patient_id: patientId,
      practitioner_id: DEV_USER_ID, // Use const
      encounter_date: encounterData.encounter_date,
      encounter_type: encounterData.encounter_type,
      duration_minutes: encounterData.duration_minutes,
      vas_pain_start: encounterData.vas_pain_start,
      vas_pain_end: encounterData.vas_pain_end,
      status: 'DRAFT',
      ...(Object.keys(subjective).length > 0 && { subjective }),
      ...(Object.keys(objective).length > 0 && { objective }),
      ...(Object.keys(assessment).length > 0 && { assessment }),
      ...(Object.keys(plan).length > 0 && { plan }),
      treatments,
      icpc_codes: encounterData.icpc_codes || [],
      icd10_codes: encounterData.icd10_codes || []
    };

    saveMutation.mutate(dataToSave);
  };

  const handleSignAndLock = () => {
    // Validation Logic
    const newErrors = {};
    if (!encounterData.subjective.chief_complaint) newErrors.subjective = true;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert('Vennligst fyll ut hovedklage før signering.');
      return;
    }

    handleSave();
    setTimeout(() => {
      if (encounterId) signMutation.mutate(encounterId);
    }, 500);
  };

  // Helper Wrappers
  const updateField = (section, field, value) => {
    setEncounterData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const toggleTakst = (takstId) => {
    setSelectedTakster(prev =>
      prev.includes(takstId)
        ? prev.filter(t => t !== takstId)
        : [...prev, takstId]
    );
  };

  const createAmendmentMutation = useMutation({
    mutationFn: (data) => encountersAPI.createAmendment(encounterId, data),
    onSuccess: () => {
      setShowAmendmentForm(false);
      setAmendmentContent('');
      setAmendmentReason('');
      refetchAmendments();
    }
  });

  const signAmendmentMutation = useMutation({
    mutationFn: (amendmentId) => encountersAPI.signAmendment(encounterId, amendmentId),
    onSuccess: () => refetchAmendments()
  });

  const handleCreateAmendment = () => {
    if (!amendmentContent.trim()) return;
    createAmendmentMutation.mutate({
      amendment_type: amendmentType,
      reason: amendmentReason,
      content: amendmentContent
    });
  };

  const value = {
    // State
    patientId, encounterId,
    patient, patientLoading,
    encounterData, setEncounterData,
    redFlagAlerts, setRedFlagAlerts,
    clinicalWarnings, setClinicalWarnings,
    aiSuggestions, setAiSuggestions, aiLoading, setAiLoading,
    isSigned,
    autoSaveStatus, lastSaved,
    activeField, setActiveField,
    errors, setErrors,
    
    // UI Toggles
    showAIAssistant, setShowAIAssistant,
    showTemplatePicker, setShowTemplatePicker,
    showNeuroExam, setShowNeuroExam,
    showOrthoExam, setShowOrthoExam,
    showExamProtocol, setShowExamProtocol,
    showClusterTests, setShowClusterTests,
    showBodyDiagram, setShowBodyDiagram,
    showROMTable, setShowROMTable,
    showRegionalExam, setShowRegionalExam,
    showNeurologicalExam, setShowNeurologicalExam,
    showOutcomeMeasures, setShowOutcomeMeasures,
    showMMT, setShowMMT,
    showDTR, setShowDTR,
    showSensoryExam, setShowSensoryExam,
    showCranialNerves, setShowCranialNerves,
    showCoordination, setShowCoordination,
    showNerveTension, setShowNerveTension,
    showRegionalDiagrams, setShowRegionalDiagrams,
    showHeadacheAssessment, setShowHeadacheAssessment,
    showTissueMarkers, setShowTissueMarkers,
    
    // Exam Data
    neuroExamData, setNeuroExamData,
    orthoExamData, setOrthoExamData,
    examProtocolData, setExamProtocolData,
    clusterTestData, setClusterTestData,
    bodyDiagramMarkers, setBodyDiagramMarkers,
    romTableData, setRomTableData,
    neurologicalExamData, setNeurologicalExamData,
    outcomeMeasureType, setOutcomeMeasureType,
    outcomeMeasureData, setOutcomeMeasureData,
    regionalExamData, setRegionalExamData,
    mmtData, setMmtData,
    cranialNerveData, setCranialNerveData,
    sensoryExamData, setSensoryExamData,
    painAssessmentData, setPainAssessmentData,
    dtrData, setDtrData,
    coordinationData, setCoordinationData,
    nerveTensionData, setNerveTensionData,
    regionalDiagramData, setRegionalDiagramData,
    headacheData, setHeadacheData,
    tissueMarkerData, setTissueMarkerData,
    selectedRegion, setSelectedRegion,

    // Treatment
    selectedTakster, setSelectedTakster, toggleTakst,
    showTakster, setShowTakster,
    taksterNorwegian, totalPrice,

    // Amendments
    amendments, showAmendmentForm, setShowAmendmentForm,
    amendmentContent, setAmendmentContent,
    amendmentType, setAmendmentType,
    amendmentReason, setAmendmentReason,
    handleCreateAmendment, createAmendmentMutation, signAmendmentMutation,

    // Actions
    handleSave, handleSignAndLock, updateField,
    saveMutation, signMutation,
    
    // Refs / Other
    queryClient,
    commonDiagnoses
  };

  return (
    <EncounterContext.Provider value={value}>
      {children}
    </EncounterContext.Provider>
  );
};
