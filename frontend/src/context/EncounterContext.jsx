import toast from '../utils/toast';

/**
 * EncounterContext - Thin wrapper around Zustand encounterStore
 *
 * Maintains backwards compatibility with existing components that use
 * useEncounter() while delegating all state to the Zustand store.
 * New components should import from stores/encounterStore directly.
 */

import { createContext, useContext, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { encountersAPI, patientsAPI, diagnosisAPI } from '../services/api';
import { usePatientIntake } from '../hooks/usePatientIntake';
import useEncounterStore from '../stores/encounterStore';

const EncounterContext = createContext();

export const useEncounter = () => {
  const context = useContext(EncounterContext);
  if (!context) {
    throw new Error('useEncounter must be used within an EncounterProvider');
  }
  return context;
};

// Default Dev User
const DEV_USER_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

export const EncounterProvider = ({ children }) => {
  const { patientId, encounterId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const autoSaveTimerRef = useRef(null);

  // Pull all state and actions from Zustand store
  const store = useEncounterStore();

  // Destructure for convenience
  const {
    encounterData,
    setEncounterData,
    selectedTakster,
    setSelectedTakster,
    toggleTakst,
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
    errors,
    setErrors,
    showAIAssistant,
    setShowAIAssistant,
    showTemplatePicker,
    setShowTemplatePicker,
    showTakster,
    setShowTakster,
    autoSaveStatus,
    _setAutoSaveStatus,
    lastSaved,
    _setLastSaved,
    updateField,
    showAmendmentForm,
    setShowAmendmentForm,
    amendmentContent,
    setAmendmentContent,
    amendmentType,
    setAmendmentType,
    amendmentReason,
    setAmendmentReason,
    resetAmendmentForm,
    taksterNorwegian,
    markSaved,
    markSaving,
    markUnsaved,
    loadEncounter,
  } = store;

  // --- QUERIES ---
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsAPI.getById(patientId),
    enabled: !!patientId,
  });

  const { data: existingEncounter } = useQuery({
    queryKey: ['encounter', encounterId],
    queryFn: () => encountersAPI.getById(encounterId),
    enabled: !!encounterId,
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

  const { data: commonDiagnoses } = useQuery({
    queryKey: ['diagnosis', 'common'],
    queryFn: () => diagnosisAPI.getCommon(),
  });

  const isSigned = !!encounterData.signed_at;

  const { data: amendments, refetch: refetchAmendments } = useQuery({
    queryKey: ['amendments', encounterId],
    queryFn: () => encountersAPI.getAmendments(encounterId),
    enabled: !!encounterId && isSigned,
  });

  // --- EFFECTS ---
  useEffect(() => {
    if (existingEncounter?.data) {
      loadEncounter(existingEncounter.data);
    }
  }, [existingEncounter, loadEncounter]);

  // Kiosk Logic
  const appointmentId = patient?.currentAppointmentId || null;
  const {
    intake: kioskIntake,
    subjectiveNarrative: kioskSubjective,
    hasIntake: hasKioskIntake,
  } = usePatientIntake(appointmentId);
  const kioskDataAppliedRef = useRef(false);

  useEffect(() => {
    if (hasKioskIntake && kioskSubjective && !kioskDataAppliedRef.current && !encounterId) {
      setEncounterData((prev) => ({
        ...prev,
        subjective: { ...prev.subjective, chief_complaint: kioskSubjective },
        vas_pain_start: kioskIntake?.painLevel ?? prev.vas_pain_start,
      }));
      kioskDataAppliedRef.current = true;
    }
  }, [hasKioskIntake, kioskSubjective, kioskIntake, encounterId, setEncounterData]);

  // Auto-save logic
  useEffect(() => {
    if (encounterId && !isSigned) {
      markUnsaved();

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        markSaving();
        handleSave(false);
      }, 3000);
    }
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [encounterData, selectedTakster]);

  // --- HELPERS ---
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

  // --- MUTATIONS ---
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
      markSaved();
      if (!encounterId && response?.data?.id) {
        navigate(`/patients/${patientId}/encounter/${response.data.id}`, { replace: true });
      }
    },
    onError: () => markUnsaved(),
  });

  const signMutation = useMutation({
    mutationFn: (id) => encountersAPI.sign(id),
    onSuccess: () => {
      setEncounterData((prev) => ({ ...prev, signed_at: new Date().toISOString() }));
      queryClient.invalidateQueries(['encounter', encounterId]);
    },
  });

  const createAmendmentMutation = useMutation({
    mutationFn: (data) => encountersAPI.createAmendment(encounterId, data),
    onSuccess: () => {
      resetAmendmentForm();
      refetchAmendments();
    },
  });

  const signAmendmentMutation = useMutation({
    mutationFn: (amendmentId) => encountersAPI.signAmendment(encounterId, amendmentId),
    onSuccess: () => refetchAmendments(),
  });

  // --- ACTIONS ---
  const totalPrice = taksterNorwegian
    .filter((t) => selectedTakster.includes(t.id))
    .reduce((sum, t) => sum + t.price, 0);

  const handleSave = (_showToast = true) => {
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
      patient_id: patientId,
      practitioner_id: DEV_USER_ID,
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
      icd10_codes: encounterData.icd10_codes || [],
    };

    saveMutation.mutate(dataToSave);
  };

  const handleSignAndLock = () => {
    const newErrors = {};
    if (!encounterData.subjective.chief_complaint) {
      newErrors.subjective = true;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.warning('Vennligst fyll ut hovedklage før signering.');
      return;
    }

    handleSave();
    setTimeout(() => {
      if (encounterId) {
        signMutation.mutate(encounterId);
      }
    }, 500);
  };

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

  // Expose the full store + queries/mutations for backwards compat
  const value = {
    // Route params
    patientId,
    encounterId,
    // Query data
    patient,
    patientLoading,
    commonDiagnoses,
    previousEncounters,
    amendments,
    // Computed
    isSigned,
    totalPrice,

    // All store state (spread for backwards compat)
    encounterData,
    setEncounterData,
    redFlagAlerts,
    setRedFlagAlerts,
    clinicalWarnings,
    setClinicalWarnings,
    aiSuggestions,
    setAiSuggestions,
    aiLoading,
    setAiLoading,
    autoSaveStatus,
    lastSaved,
    activeField,
    setActiveField,
    errors,
    setErrors,

    // UI Toggles
    showAIAssistant,
    setShowAIAssistant,
    showTemplatePicker,
    setShowTemplatePicker,

    // Exam toggles (delegate to store)
    showNeuroExam: store.showNeuroExam,
    setShowNeuroExam: (v) => store.setUIFlag('showNeuroExam', v),
    showOrthoExam: store.showOrthoExam,
    setShowOrthoExam: (v) => store.setUIFlag('showOrthoExam', v),
    showExamProtocol: store.showExamProtocol,
    setShowExamProtocol: (v) => store.setUIFlag('showExamProtocol', v),
    showClusterTests: store.showClusterTests,
    setShowClusterTests: (v) => store.setUIFlag('showClusterTests', v),
    showBodyDiagram: store.showBodyDiagram,
    setShowBodyDiagram: (v) => store.setUIFlag('showBodyDiagram', v),
    showROMTable: store.showROMTable,
    setShowROMTable: (v) => store.setUIFlag('showROMTable', v),
    showRegionalExam: store.showRegionalExam,
    setShowRegionalExam: (v) => store.setUIFlag('showRegionalExam', v),
    showNeurologicalExam: store.showNeurologicalExam,
    setShowNeurologicalExam: (v) => store.setUIFlag('showNeurologicalExam', v),
    showOutcomeMeasures: store.showOutcomeMeasures,
    setShowOutcomeMeasures: (v) => store.setUIFlag('showOutcomeMeasures', v),
    showMMT: store.showMMT,
    setShowMMT: (v) => store.setUIFlag('showMMT', v),
    showDTR: store.showDTR,
    setShowDTR: (v) => store.setUIFlag('showDTR', v),
    showSensoryExam: store.showSensoryExam,
    setShowSensoryExam: (v) => store.setUIFlag('showSensoryExam', v),
    showCranialNerves: store.showCranialNerves,
    setShowCranialNerves: (v) => store.setUIFlag('showCranialNerves', v),
    showCoordination: store.showCoordination,
    setShowCoordination: (v) => store.setUIFlag('showCoordination', v),
    showNerveTension: store.showNerveTension,
    setShowNerveTension: (v) => store.setUIFlag('showNerveTension', v),
    showRegionalDiagrams: store.showRegionalDiagrams,
    setShowRegionalDiagrams: (v) => store.setUIFlag('showRegionalDiagrams', v),
    showHeadacheAssessment: store.showHeadacheAssessment,
    setShowHeadacheAssessment: (v) => store.setUIFlag('showHeadacheAssessment', v),
    showTissueMarkers: store.showTissueMarkers,
    setShowTissueMarkers: (v) => store.setUIFlag('showTissueMarkers', v),
    showPainAssessment: store.showPainAssessment,
    setShowPainAssessment: (v) => store.setUIFlag('showPainAssessment', v),

    // Exam Data
    neuroExamData: store.neuroExamData,
    setNeuroExamData: (v) => store.setExamData('neuroExamData', v),
    orthoExamData: store.orthoExamData,
    setOrthoExamData: (v) => store.setExamData('orthoExamData', v),
    examProtocolData: store.examProtocolData,
    setExamProtocolData: (v) => store.setExamData('examProtocolData', v),
    clusterTestData: store.clusterTestData,
    setClusterTestData: (v) => store.setExamData('clusterTestData', v),
    bodyDiagramMarkers: store.bodyDiagramMarkers,
    setBodyDiagramMarkers: (v) => store.setExamData('bodyDiagramMarkers', v),
    romTableData: store.romTableData,
    setRomTableData: (v) => store.setExamData('romTableData', v),
    neurologicalExamData: store.neurologicalExamData,
    setNeurologicalExamData: (v) => store.setExamData('neurologicalExamData', v),
    outcomeMeasureType: store.outcomeMeasureType,
    setOutcomeMeasureType: (v) => store.setExamData('outcomeMeasureType', v),
    outcomeMeasureData: store.outcomeMeasureData,
    setOutcomeMeasureData: (v) => store.setExamData('outcomeMeasureData', v),
    regionalExamData: store.regionalExamData,
    setRegionalExamData: (v) => store.setExamData('regionalExamData', v),
    mmtData: store.mmtData,
    setMmtData: (v) => store.setExamData('mmtData', v),
    cranialNerveData: store.cranialNerveData,
    setCranialNerveData: (v) => store.setExamData('cranialNerveData', v),
    sensoryExamData: store.sensoryExamData,
    setSensoryExamData: (v) => store.setExamData('sensoryExamData', v),
    painAssessmentData: store.painAssessmentData,
    setPainAssessmentData: (v) => store.setExamData('painAssessmentData', v),
    dtrData: store.dtrData,
    setDtrData: (v) => store.setExamData('dtrData', v),
    coordinationData: store.coordinationData,
    setCoordinationData: (v) => store.setExamData('coordinationData', v),
    nerveTensionData: store.nerveTensionData,
    setNerveTensionData: (v) => store.setExamData('nerveTensionData', v),
    regionalDiagramData: store.regionalDiagramData,
    setRegionalDiagramData: (v) => store.setExamData('regionalDiagramData', v),
    headacheData: store.headacheData,
    setHeadacheData: (v) => store.setExamData('headacheData', v),
    tissueMarkerData: store.tissueMarkerData,
    setTissueMarkerData: (v) => store.setExamData('tissueMarkerData', v),
    selectedRegion: store.selectedRegion,
    setSelectedRegion: store.setSelectedRegion,

    // Treatment
    selectedTakster,
    setSelectedTakster,
    toggleTakst,
    showTakster,
    setShowTakster,
    taksterNorwegian,

    // Amendments
    showAmendmentForm,
    setShowAmendmentForm,
    amendmentContent,
    setAmendmentContent,
    amendmentType,
    setAmendmentType,
    amendmentReason,
    setAmendmentReason,
    handleCreateAmendment,
    createAmendmentMutation,
    signAmendmentMutation,

    // Actions
    handleSave,
    handleSignAndLock,
    updateField,
    saveMutation,
    signMutation,

    // Refs / Other
    queryClient,
  };

  return <EncounterContext.Provider value={value}>{children}</EncounterContext.Provider>;
};
