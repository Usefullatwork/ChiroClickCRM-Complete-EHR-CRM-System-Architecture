import { useState, useRef } from 'react';

/**
 * Custom hook that encapsulates all local state for the ClinicalEncounter page.
 * Returns all state values and setters so the main page stays lean.
 */
export function useClinicalEncounterState(patientId) {
  // UI State
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showNeuroExam, setShowNeuroExam] = useState(false);
  const [showOrthoExam, setShowOrthoExam] = useState(false);
  const [showExamProtocol, setShowExamProtocol] = useState(false);
  const [showClusterTests, setShowClusterTests] = useState(false);
  const [showBodyDiagram, setShowBodyDiagram] = useState(false);
  const [showROMTable, setShowROMTable] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [showDiagnosisDropdown, setShowDiagnosisDropdown] = useState(false);

  // Clinical State
  const [redFlagAlerts, setRedFlagAlerts] = useState([]);
  const [clinicalWarnings, setClinicalWarnings] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [neuroExamData, setNeuroExamData] = useState(null);
  const [orthoExamData, setOrthoExamData] = useState(null);
  const [examProtocolData, setExamProtocolData] = useState({});
  const [clusterTestData, setClusterTestData] = useState({});
  const [bodyDiagramMarkers, setBodyDiagramMarkers] = useState([]);
  const [romTableData, setRomTableData] = useState({});
  const [showNeurologicalExam, setShowNeurologicalExam] = useState(false);
  const [neurologicalExamData, setNeurologicalExamData] = useState({});
  const [showOutcomeMeasures, setShowOutcomeMeasures] = useState(false);
  const [outcomeMeasureType, setOutcomeMeasureType] = useState('ndi');
  const [outcomeMeasureData, setOutcomeMeasureData] = useState({});
  const [showRegionalExam, setShowRegionalExam] = useState(false);
  const [regionalExamData, setRegionalExamData] = useState({});
  const [showExercisePanel, setShowExercisePanel] = useState(false);

  // Healthcare UX State
  const [showSALTBanner, setShowSALTBanner] = useState(true);
  const [saltBannerExpanded, setSaltBannerExpanded] = useState(false);
  const [showAIDiagnosisSidebar, setShowAIDiagnosisSidebar] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ pending: 0, lastSync: null, error: null });

  // New Examination Components State
  const [showMMT, setShowMMT] = useState(false);
  const [mmtData, setMmtData] = useState({});
  const [showCranialNerves, setShowCranialNerves] = useState(false);
  const [cranialNerveData, setCranialNerveData] = useState({});
  const [showSensoryExam, setShowSensoryExam] = useState(false);
  const [sensoryExamData, setSensoryExamData] = useState({});
  const [showPainAssessment, setShowPainAssessment] = useState(false);
  const [painAssessmentData, setPainAssessmentData] = useState({});
  const [showDTR, setShowDTR] = useState(false);
  const [dtrData, setDtrData] = useState({});
  const [showCoordination, setShowCoordination] = useState(false);
  const [coordinationData, setCoordinationData] = useState({});
  const [showNerveTension, setShowNerveTension] = useState(false);
  const [nerveTensionData, setNerveTensionData] = useState({});
  const [showRegionalDiagrams, setShowRegionalDiagrams] = useState(false);
  const [regionalDiagramData, setRegionalDiagramData] = useState({});
  const [selectedRegion, setSelectedRegion] = useState('shoulder');
  const [showHeadacheAssessment, setShowHeadacheAssessment] = useState(false);
  const [headacheData, setHeadacheData] = useState({});
  const [showTissueMarkers, setShowTissueMarkers] = useState(false);
  const [tissueMarkerData, setTissueMarkerData] = useState({});

  // Notation State
  const [notationData, setNotationData] = useState({ markers: [], selectedPoints: [] });
  const [notationNarrative, setNotationNarrative] = useState('');

  // Amendment State (for signed encounters)
  const [showAmendmentForm, setShowAmendmentForm] = useState(false);
  const [amendmentContent, setAmendmentContent] = useState('');
  const [amendmentType, setAmendmentType] = useState('ADDENDUM');
  const [amendmentReason, setAmendmentReason] = useState('');

  // Efficiency Features State
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [lastSaved, setLastSaved] = useState(null);
  const [showMacroHint, setShowMacroHint] = useState(false);
  const [currentMacroMatch, setCurrentMacroMatch] = useState('');
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Treatment State
  const [selectedTakster, setSelectedTakster] = useState(['l214']);
  const [showTakster, setShowTakster] = useState(false);

  // Encounter Timer State
  const [encounterStartTime] = useState(() => new Date());
  const [elapsedTime, setElapsedTime] = useState('00:00');

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

  // Kiosk intake tracking
  const [kioskDataApplied, setKioskDataApplied] = useState(false);

  // Refs
  const textAreaRefs = useRef({});
  const palpationRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const sectionRefs = useRef({});
  const timerIntervalRef = useRef(null);

  return {
    // UI State
    showAIAssistant,
    setShowAIAssistant,
    showTemplatePicker,
    setShowTemplatePicker,
    showNeuroExam,
    setShowNeuroExam,
    showOrthoExam,
    setShowOrthoExam,
    showExamProtocol,
    setShowExamProtocol,
    showClusterTests,
    setShowClusterTests,
    showBodyDiagram,
    setShowBodyDiagram,
    showROMTable,
    setShowROMTable,
    activeField,
    setActiveField,
    diagnosisSearch,
    setDiagnosisSearch,
    showDiagnosisDropdown,
    setShowDiagnosisDropdown,

    // Clinical State
    redFlagAlerts,
    setRedFlagAlerts,
    clinicalWarnings,
    setClinicalWarnings,
    aiSuggestions,
    setAiSuggestions,
    aiLoading,
    setAiLoading,
    neuroExamData,
    setNeuroExamData,
    orthoExamData,
    setOrthoExamData,
    examProtocolData,
    setExamProtocolData,
    clusterTestData,
    setClusterTestData,
    bodyDiagramMarkers,
    setBodyDiagramMarkers,
    romTableData,
    setRomTableData,
    showNeurologicalExam,
    setShowNeurologicalExam,
    neurologicalExamData,
    setNeurologicalExamData,
    showOutcomeMeasures,
    setShowOutcomeMeasures,
    outcomeMeasureType,
    setOutcomeMeasureType,
    outcomeMeasureData,
    setOutcomeMeasureData,
    showRegionalExam,
    setShowRegionalExam,
    regionalExamData,
    setRegionalExamData,
    showExercisePanel,
    setShowExercisePanel,

    // Healthcare UX State
    showSALTBanner,
    setShowSALTBanner,
    saltBannerExpanded,
    setSaltBannerExpanded,
    showAIDiagnosisSidebar,
    setShowAIDiagnosisSidebar,
    syncStatus,
    setSyncStatus,

    // New Examination Components State
    showMMT,
    setShowMMT,
    mmtData,
    setMmtData,
    showCranialNerves,
    setShowCranialNerves,
    cranialNerveData,
    setCranialNerveData,
    showSensoryExam,
    setShowSensoryExam,
    sensoryExamData,
    setSensoryExamData,
    showPainAssessment,
    setShowPainAssessment,
    painAssessmentData,
    setPainAssessmentData,
    showDTR,
    setShowDTR,
    dtrData,
    setDtrData,
    showCoordination,
    setShowCoordination,
    coordinationData,
    setCoordinationData,
    showNerveTension,
    setShowNerveTension,
    nerveTensionData,
    setNerveTensionData,
    showRegionalDiagrams,
    setShowRegionalDiagrams,
    regionalDiagramData,
    setRegionalDiagramData,
    selectedRegion,
    setSelectedRegion,
    showHeadacheAssessment,
    setShowHeadacheAssessment,
    headacheData,
    setHeadacheData,
    showTissueMarkers,
    setShowTissueMarkers,
    tissueMarkerData,
    setTissueMarkerData,

    // Notation State
    notationData,
    setNotationData,
    notationNarrative,
    setNotationNarrative,

    // Amendment State
    showAmendmentForm,
    setShowAmendmentForm,
    amendmentContent,
    setAmendmentContent,
    amendmentType,
    setAmendmentType,
    amendmentReason,
    setAmendmentReason,

    // Efficiency Features State
    autoSaveStatus,
    setAutoSaveStatus,
    lastSaved,
    setLastSaved,
    showMacroHint,
    setShowMacroHint,
    currentMacroMatch,
    setCurrentMacroMatch,
    showKeyboardHelp,
    setShowKeyboardHelp,

    // Treatment State
    selectedTakster,
    setSelectedTakster,
    showTakster,
    setShowTakster,

    // Timer State
    encounterStartTime,
    elapsedTime,
    setElapsedTime,

    // Form State
    encounterData,
    setEncounterData,

    // Kiosk
    kioskDataApplied,
    setKioskDataApplied,

    // Refs
    textAreaRefs,
    palpationRef,
    autoSaveTimerRef,
    sectionRefs,
    timerIntervalRef,
  };
}
