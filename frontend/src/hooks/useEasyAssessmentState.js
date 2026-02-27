import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useQuery, useMutation } from '@tanstack/react-query';
import { encountersAPI, patientsAPI, diagnosisAPI, aiAPI } from '../services/api';
import toast from '../utils/toast';
import {
  generateFullNarrative,
  generateEncounterSummary,
} from '../components/assessment/NarrativeGenerator';
import { createTranslator } from '../components/assessment/translations';

/**
 * Custom hook that consolidates all EasyAssessment state.
 * Returns all state values and handlers needed by tab components.
 */
export default function useEasyAssessmentState() {
  const { patientId, encounterId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('subjective');
  const [viewMode, setViewMode] = useState('easy');
  const [redFlagAlerts, setRedFlagAlerts] = useState([]);
  const [clinicalWarnings, setClinicalWarnings] = useState([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showOutcomeAssessment, setShowOutcomeAssessment] = useState(false);
  const [outcomeType, setOutcomeType] = useState('ODI');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [showBodyChart, setShowBodyChart] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const { lang: language, setLang: setLanguage } = useTranslation();
  const [showMacroMatrix, setShowMacroMatrix] = useState(false);
  const [showCompliancePanel, setShowCompliancePanel] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showSlashReference, setShowSlashReference] = useState(false);
  const [macroFavorites, setMacroFavorites] = useState([]);
  const [showAIScribe, setShowAIScribe] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showIntakeParser, setShowIntakeParser] = useState(false);
  const tr = createTranslator(language);

  // AI status query
  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn: () => aiAPI.getStatus(),
    staleTime: 60000,
    refetchInterval: 60000,
  });
  const aiAvailable = aiStatus?.data?.available ?? false;

  // Form state
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
    pain_locations: [],
    pain_qualities: [],
    aggravating_factors_selected: [],
    relieving_factors_selected: [],
    objective: {
      observation: '',
      palpation: '',
      rom: '',
      ortho_tests: '',
      neuro_tests: '',
      posture: '',
    },
    observation_findings: [],
    palpation_findings: [],
    rom_findings: [],
    ortho_tests_selected: [],
    neuro_tests_selected: [],
    spinal_findings: {},
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
    treatments_selected: [],
    exercises_selected: [],
    icpc_codes: [],
    icd10_codes: [],
    treatments: [],
    vas_pain_start: null,
    vas_pain_end: null,
    outcome_assessment: {
      type: null,
      responses: {},
      score: null,
    },
    body_chart: {
      annotations: [],
      markers: [],
    },
  });

  const [problems, setProblems] = useState([]);
  const [treatmentPlan, setTreatmentPlan] = useState(null);
  const [currentVisitNumber, setCurrentVisitNumber] = useState(1);

  // Queries
  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsAPI.getById(patientId),
    enabled: !!patientId,
  });

  const { data: patientEncounters } = useQuery({
    queryKey: ['patient-encounters', patientId],
    queryFn: () => encountersAPI.getByPatient(patientId),
    enabled: !!patientId,
  });

  const previousEncounter = patientEncounters?.data?.encounters?.[0] || null;

  useEffect(() => {
    if (patientEncounters?.data?.encounters) {
      setCurrentVisitNumber(patientEncounters.data.encounters.length + 1);
    }
  }, [patientEncounters]);

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
      setClinicalWarnings(existingEncounter.data.clinicalWarnings || []);
      if (existingEncounter.data.problems) {
        setProblems(existingEncounter.data.problems);
      }
      if (existingEncounter.data.treatmentPlan) {
        setTreatmentPlan(existingEncounter.data.treatmentPlan);
      }
    }
  }, [existingEncounter]);

  const { data: commonDiagnoses } = useQuery({
    queryKey: ['diagnosis', 'common'],
    queryFn: () => diagnosisAPI.getCommon(),
  });

  // Narrative generator
  const generateNarrativeText = () => {
    const narratives = generateFullNarrative({
      ...encounterData,
      ...encounterData.subjective,
      ...encounterData.objective,
      ...encounterData.assessment,
      ...encounterData.plan,
    });

    const totalVisits = treatmentPlan?.phases?.reduce((sum, p) => sum + p.totalVisits, 0) || 0;
    const summary = generateEncounterSummary(
      { ...encounterData, ...encounterData.subjective },
      currentVisitNumber,
      totalVisits
    );

    let text = '';
    if (summary) {
      text += `${summary}\n\n`;
    }
    text += 'SUBJECTIVE\n';
    text += narratives.subjective.join('\n') || 'No subjective findings documented.';
    text += '\n\n';
    text += 'OBJECTIVE\n';
    text += 'Daily Objective Findings:\n';
    text += narratives.objective.join('\n') || 'No objective findings documented.';
    text += '\n\n';
    text += 'ASSESSMENT\n';
    text += narratives.assessment.join('\n') || 'No assessment documented.';
    text += '\n\n';
    text += 'PLAN\n';
    text += narratives.plan.join('\n') || 'No plan documented.';
    return text;
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data) => {
      const saveData = {
        ...data,
        problems,
        treatmentPlan,
        generated_narrative: generateNarrativeText(),
      };
      if (encounterId) {
        return encountersAPI.update(encounterId, saveData);
      }
      return encountersAPI.create(saveData);
    },
    onSuccess: (response) => {
      toast.success('Journalen er lagret!');
      if (!encounterId && response?.data?.id) {
        navigate(`/patients/${patientId}/easy-assessment/${response.data.id}`);
      }
    },
    onError: (error) => {
      toast.error(`Feil ved lagring: ${error.message}`);
    },
  });

  const handleSave = () => {
    saveMutation.mutate(encounterData);
  };

  // Helpers
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) {
      return null;
    }
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const buildAIContext = (_fieldType) => ({
    patientAge: patient?.data?.date_of_birth ? calculateAge(patient.data.date_of_birth) : null,
    patientGender: patient?.data?.gender,
    chiefComplaint: encounterData.subjective.chief_complaint,
    painLocations: encounterData.pain_locations,
    painQualities: encounterData.pain_qualities,
    aggravatingFactors: encounterData.aggravating_factors_selected,
    relievingFactors: encounterData.relieving_factors_selected,
    existingText: {
      subjective: encounterData.subjective,
      objective: encounterData.objective,
      assessment: encounterData.assessment,
      plan: encounterData.plan,
    },
  });

  const updateField = (section, field, value) => {
    setEncounterData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateQuickSelect = (field, values) => {
    setEncounterData((prev) => ({
      ...prev,
      [field]: values,
    }));
  };

  const addDiagnosisCode = (code) => {
    if (!encounterData.icpc_codes.includes(code)) {
      setEncounterData((prev) => ({
        ...prev,
        icpc_codes: [...prev.icpc_codes, code],
      }));
    }
  };

  const removeDiagnosisCode = (code) => {
    setEncounterData((prev) => ({
      ...prev,
      icpc_codes: prev.icpc_codes.filter((c) => c !== code),
    }));
  };

  const handleSALTApply = (clonedData) => {
    setEncounterData((prev) => ({
      ...prev,
      ...clonedData,
      subjective: { ...prev.subjective, ...clonedData.subjective },
      objective: { ...prev.objective, ...clonedData.objective },
      plan: { ...prev.plan, ...clonedData.plan },
    }));
  };

  const handleMacroInsert = (text, _targetField = 'current') => {
    if (activeTab === 'subjective') {
      updateField(
        'subjective',
        'chief_complaint',
        (encounterData.subjective.chief_complaint
          ? `${encounterData.subjective.chief_complaint} `
          : '') + text
      );
    } else if (activeTab === 'objective') {
      updateField(
        'objective',
        'observation',
        (encounterData.objective.observation ? `${encounterData.objective.observation} ` : '') +
          text
      );
    } else if (activeTab === 'assessment') {
      updateField(
        'assessment',
        'clinical_reasoning',
        (encounterData.assessment.clinical_reasoning
          ? `${encounterData.assessment.clinical_reasoning} `
          : '') + text
      );
    } else if (activeTab === 'plan') {
      updateField(
        'plan',
        'treatment',
        (encounterData.plan.treatment ? `${encounterData.plan.treatment} ` : '') + text
      );
    }
    setShowMacroMatrix(false);
  };

  const handleComplianceAutoFix = (issue) => {
    if (issue.suggestion && issue.section) {
      if (issue.section === 'objective') {
        updateField(
          'objective',
          'palpation',
          (encounterData.objective.palpation ? `${encounterData.objective.palpation} ` : '') +
            issue.suggestion
        );
      } else if (issue.section === 'plan') {
        updateField(
          'plan',
          'treatment',
          (encounterData.plan.treatment ? `${encounterData.plan.treatment} ` : '') +
            issue.suggestion
        );
      }
    }
  };

  const copyToClipboard = () => {
    const text = generateNarrativeText();
    navigator.clipboard.writeText(text);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  // Tab navigation
  const tabs = [
    { id: 'subjective', label: 'Subjective', icon: '\u{1F4AC}', color: 'green' },
    { id: 'objective', label: 'Objective', icon: '\u{1F50D}', color: 'blue' },
    { id: 'assessment', label: 'Assessment', icon: '\u{1F4CB}', color: 'purple' },
    { id: 'plan', label: 'Plan', icon: '\u{1F4DD}', color: 'orange' },
  ];

  const currentTabIndex = tabs.findIndex((t) => t.id === activeTab);
  const canGoBack = currentTabIndex > 0;
  const canGoForward = currentTabIndex < tabs.length - 1;

  const goToNextTab = () => {
    if (canGoForward) {
      setActiveTab(tabs[currentTabIndex + 1].id);
    }
  };

  const goToPrevTab = () => {
    if (canGoBack) {
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
  };

  return {
    // Route params
    patientId,
    encounterId,
    navigate,

    // Tab state
    activeTab,
    setActiveTab,
    tabs,
    currentTabIndex,
    canGoBack,
    canGoForward,
    goToNextTab,
    goToPrevTab,

    // View mode
    viewMode,
    setViewMode,

    // Alerts
    redFlagAlerts,
    clinicalWarnings,

    // Modal toggles
    showTemplatePicker,
    setShowTemplatePicker,
    showOutcomeAssessment,
    setShowOutcomeAssessment,
    outcomeType,
    setOutcomeType,
    showBodyChart,
    setShowBodyChart,
    showTemplateLibrary,
    setShowTemplateLibrary,
    showMacroMatrix,
    setShowMacroMatrix,
    showCompliancePanel,
    setShowCompliancePanel,
    showPrintPreview,
    setShowPrintPreview,
    showSlashReference,
    setShowSlashReference,
    showAIScribe,
    setShowAIScribe,
    showAISettings,
    setShowAISettings,
    showIntakeParser,
    setShowIntakeParser,

    // Language
    language,
    setLanguage,
    tr,

    // Macro state
    macroFavorites,
    setMacroFavorites,

    // AI
    aiAvailable,

    // Core data
    encounterData,
    setEncounterData,
    problems,
    setProblems,
    treatmentPlan,
    setTreatmentPlan,
    currentVisitNumber,

    // Queries
    patient,
    previousEncounter,
    commonDiagnoses,

    // Clipboard
    copiedToClipboard,
    copyToClipboard,

    // Mutations
    saveMutation,
    handleSave,

    // Handlers
    updateField,
    updateQuickSelect,
    addDiagnosisCode,
    removeDiagnosisCode,
    handleSALTApply,
    handleMacroInsert,
    handleComplianceAutoFix,
    buildAIContext,
    generateNarrativeText,
    calculateAge,
  };
}
