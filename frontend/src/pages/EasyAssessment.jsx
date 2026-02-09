import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useQuery, useMutation } from '@tanstack/react-query';
import { encountersAPI, patientsAPI, diagnosisAPI, aiAPI } from '../services/api';
import toast from '../utils/toast';
import {
  Save,
  AlertTriangle,
  Brain,
  X,
  Sparkles,
  Globe,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Settings,
  Eye,
  Edit3,
  FileText,
  Printer,
  Copy,
  Shield,
  Grid,
  Command,
  Mic,
  Cpu,
} from 'lucide-react';
import TemplatePicker from '../components/TemplatePicker';

// Import all assessment components
import {
  QuickCheckboxGrid,
  SmartTextInput,
  BodyDiagram,
  QuickRegionSelect,
  SpineDiagram,
  VASPainScale,
  VASComparisonDisplay,
  OutcomeAssessment,
  ProblemList,
  TreatmentPlanTracker,
  VisitCounter,
  generateFullNarrative,
  generateEncounterSummary,
  BodyChart,
  BodyChartGallery,
  TemplateLibrary,
  // Phase 1 Components
  SALTButton,
  MacroMatrix,
  SlashCommandTextArea,
  SlashCommandReference,
  CompliancePanel,
  ComplianceIndicator,
  PrintPreview,
  // Translations (EN/NO)
  t,
  createTranslator,
  AVAILABLE_LANGUAGES,
  getMacroContent,
  // Phase 2 AI Components
  IntakeParser,
  IntakeParserButton,
  AIScribe,
  AIScribeButton,
  AISettings,
  AIStatusIndicator,
  // Options
  PAIN_QUALITY_OPTIONS,
  AGGRAVATING_FACTORS_OPTIONS,
  RELIEVING_FACTORS_OPTIONS,
  OBSERVATION_FINDINGS_OPTIONS,
  PALPATION_FINDINGS_OPTIONS,
  ROM_FINDINGS_OPTIONS,
  ORTHO_TESTS_OPTIONS,
  NEURO_TESTS_OPTIONS,
  TREATMENT_OPTIONS,
  EXERCISE_OPTIONS,
  CHIEF_COMPLAINT_PHRASES,
  ONSET_PHRASES,
  HISTORY_PHRASES,
  CLINICAL_REASONING_PHRASES,
  FOLLOW_UP_PHRASES,
  ADVICE_PHRASES,
  QUESTIONNAIRE_TYPES,
} from '../components/assessment';

/**
 * EasyAssessment - ChiroTouch-Style Clinical Encounter Interface
 *
 * Now includes:
 * - Detailed spine diagram with vertebra-level subluxation markers
 * - Problem list panel with chronic conditions
 * - Treatment plan tracker with visit progress
 * - Auto-generated ChiroTouch-style narratives
 */
export default function EasyAssessment() {
  const { patientId, encounterId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('subjective');
  const [viewMode, setViewMode] = useState('easy'); // 'easy' | 'detailed' | 'preview'
  const [redFlagAlerts, setRedFlagAlerts] = useState([]);
  const [clinicalWarnings, setClinicalWarnings] = useState([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showOutcomeAssessment, setShowOutcomeAssessment] = useState(false);
  const [outcomeType, setOutcomeType] = useState('ODI');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [showBodyChart, setShowBodyChart] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  // Phase 1 states - use global language context
  const { lang: language, setLang: setLanguage } = useTranslation();
  const [showMacroMatrix, setShowMacroMatrix] = useState(false);
  const [showCompliancePanel, setShowCompliancePanel] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showSlashReference, setShowSlashReference] = useState(false);
  const [macroFavorites, setMacroFavorites] = useState([]);
  // Phase 2 AI states
  const [showAIScribe, setShowAIScribe] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showIntakeParser, setShowIntakeParser] = useState(false);
  // Create translator function bound to current language
  const tr = createTranslator(language);

  // Query AI service status for inline generation availability
  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn: () => aiAPI.getStatus(),
    staleTime: 60000, // Check every minute
    refetchInterval: 60000,
  });
  const aiAvailable = aiStatus?.data?.available ?? false;

  // Form state - SOAP format with quick-select arrays
  const [encounterData, setEncounterData] = useState({
    patient_id: patientId,
    encounter_date: new Date().toISOString().split('T')[0],
    encounter_type: 'FOLLOWUP',
    duration_minutes: 30,

    // Subjective section
    subjective: {
      chief_complaint: '',
      history: '',
      onset: '',
      pain_description: '',
      aggravating_factors: '',
      relieving_factors: '',
    },

    // Quick-select data for subjective
    pain_locations: [],
    pain_qualities: [],
    aggravating_factors_selected: [],
    relieving_factors_selected: [],

    // Objective section
    objective: {
      observation: '',
      palpation: '',
      rom: '',
      ortho_tests: '',
      neuro_tests: '',
      posture: '',
    },

    // Quick-select data for objective
    observation_findings: [],
    palpation_findings: [],
    rom_findings: [],
    ortho_tests_selected: [],
    neuro_tests_selected: [],

    // NEW: Spinal findings (ChiroTouch style)
    spinal_findings: {},

    // Assessment section
    assessment: {
      clinical_reasoning: '',
      differential_diagnosis: '',
      prognosis: '',
      red_flags_checked: true,
    },

    // Plan section
    plan: {
      treatment: '',
      exercises: '',
      advice: '',
      follow_up: '',
      referrals: '',
    },

    // Quick-select data for plan
    treatments_selected: [],
    exercises_selected: [],

    // Coding and measurements
    icpc_codes: [],
    icd10_codes: [],
    treatments: [],
    vas_pain_start: null,
    vas_pain_end: null,

    // Outcome assessment
    outcome_assessment: {
      type: null,
      responses: {},
      score: null,
    },

    // Body Chart annotations (Jane App style)
    body_chart: {
      annotations: [],
      markers: [],
    },
  });

  // NEW: Problem list state
  const [problems, setProblems] = useState([]);

  // NEW: Treatment plan state
  const [treatmentPlan, setTreatmentPlan] = useState(null);
  const [currentVisitNumber, setCurrentVisitNumber] = useState(1);

  // Fetch patient data
  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsAPI.getById(patientId),
    enabled: !!patientId,
  });

  // Fetch patient's encounters to determine visit number
  const { data: patientEncounters } = useQuery({
    queryKey: ['patient-encounters', patientId],
    queryFn: () => encountersAPI.getByPatient(patientId),
    enabled: !!patientId,
  });

  // Set current visit number and get previous encounter for SALT
  const previousEncounter = patientEncounters?.data?.encounters?.[0] || null;

  useEffect(() => {
    if (patientEncounters?.data?.encounters) {
      setCurrentVisitNumber(patientEncounters.data.encounters.length + 1);
    }
  }, [patientEncounters]);

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
      setClinicalWarnings(existingEncounter.data.clinicalWarnings || []);
      if (existingEncounter.data.problems) {
        setProblems(existingEncounter.data.problems);
      }
      if (existingEncounter.data.treatmentPlan) {
        setTreatmentPlan(existingEncounter.data.treatmentPlan);
      }
    }
  }, [existingEncounter]);

  // Fetch diagnosis codes
  const { data: commonDiagnoses } = useQuery({
    queryKey: ['diagnosis', 'common'],
    queryFn: () => diagnosisAPI.getCommon(),
  });

  // Save encounter mutation
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

  // Calculate patient age helper
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Build context object for AI field generation
  const buildAIContext = (fieldType) => ({
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

  // SALT handler - apply cloned data from previous encounter
  const handleSALTApply = (clonedData) => {
    setEncounterData((prev) => ({
      ...prev,
      ...clonedData,
      subjective: { ...prev.subjective, ...clonedData.subjective },
      objective: { ...prev.objective, ...clonedData.objective },
      plan: { ...prev.plan, ...clonedData.plan },
    }));
  };

  // Macro insert handler - insert macro text into current field
  const handleMacroInsert = (text, targetField = 'current') => {
    // Insert based on active tab
    if (activeTab === 'subjective') {
      updateField(
        'subjective',
        'chief_complaint',
        (encounterData.subjective.chief_complaint
          ? encounterData.subjective.chief_complaint + ' '
          : '') + text
      );
    } else if (activeTab === 'objective') {
      updateField(
        'objective',
        'observation',
        (encounterData.objective.observation ? encounterData.objective.observation + ' ' : '') +
          text
      );
    } else if (activeTab === 'assessment') {
      updateField(
        'assessment',
        'clinical_reasoning',
        (encounterData.assessment.clinical_reasoning
          ? encounterData.assessment.clinical_reasoning + ' '
          : '') + text
      );
    } else if (activeTab === 'plan') {
      updateField(
        'plan',
        'treatment',
        (encounterData.plan.treatment ? encounterData.plan.treatment + ' ' : '') + text
      );
    }
    setShowMacroMatrix(false);
  };

  // Compliance auto-fix handler
  const handleComplianceAutoFix = (issue) => {
    if (issue.suggestion && issue.section) {
      if (issue.section === 'objective') {
        updateField(
          'objective',
          'palpation',
          (encounterData.objective.palpation ? encounterData.objective.palpation + ' ' : '') +
            issue.suggestion
        );
      } else if (issue.section === 'plan') {
        updateField(
          'plan',
          'treatment',
          (encounterData.plan.treatment ? encounterData.plan.treatment + ' ' : '') +
            issue.suggestion
        );
      }
    }
  };

  // Generate ChiroTouch-style narrative
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

  const copyToClipboard = () => {
    const text = generateNarrativeText();
    navigator.clipboard.writeText(text);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  // Tab navigation
  const tabs = [
    { id: 'subjective', label: 'Subjective', icon: '💬', color: 'green' },
    { id: 'objective', label: 'Objective', icon: '🔍', color: 'blue' },
    { id: 'assessment', label: 'Assessment', icon: '📋', color: 'purple' },
    { id: 'plan', label: 'Plan', icon: '📝', color: 'orange' },
  ];

  const currentTabIndex = tabs.findIndex((t) => t.id === activeTab);
  const canGoBack = currentTabIndex > 0;
  const canGoForward = currentTabIndex < tabs.length - 1;

  const goToNextTab = () => {
    if (canGoForward) setActiveTab(tabs[currentTabIndex + 1].id);
  };

  const goToPrevTab = () => {
    if (canGoBack) setActiveTab(tabs[currentTabIndex - 1].id);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-full mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/patients/${patientId}`)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-bold text-gray-900">
                    {patient?.data?.first_name} {patient?.data?.last_name}
                  </h1>
                  {patient?.data?.date_of_birth && (
                    <span className="text-sm text-gray-500">
                      {Math.floor(
                        (new Date() - new Date(patient.data.date_of_birth)) / 31557600000
                      )}{' '}
                      yrs old
                    </span>
                  )}
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                    Active
                  </span>
                </div>
                {/* Visit Counter */}
                {treatmentPlan && (
                  <VisitCounter
                    currentVisit={currentVisitNumber}
                    totalVisits={
                      treatmentPlan.phases?.reduce((sum, p) => sum + p.totalVisits, 0) || 0
                    }
                    className="mt-1"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setLanguage(language === 'en' ? 'no' : 'en')}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  title={language === 'en' ? 'Switch to Norwegian' : 'Bytt til Engelsk'}
                >
                  <Globe className="w-4 h-4" />
                  {language === 'en' ? '🇬🇧 EN' : '🇳🇴 NO'}
                </button>
              </div>

              {/* SALT Button */}
              <SALTButton previousEncounter={previousEncounter} onApply={handleSALTApply} />

              {/* AI Status & Controls */}
              <div className="flex items-center gap-1 border-l border-gray-200 pl-2 ml-1">
                <AIStatusIndicator language={language} onClick={() => setShowAISettings(true)} />
                <button
                  onClick={() => setShowAIScribe(true)}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  title={language === 'en' ? 'AI Voice Scribe' : 'AI Stemmeskriver'}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowAISettings(true)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  title={language === 'en' ? 'AI Settings' : 'AI-innstillinger'}
                >
                  <Cpu className="w-4 h-4" />
                </button>
              </div>

              {/* Compliance Indicator */}
              <ComplianceIndicator
                encounterData={encounterData}
                onClick={() => setShowCompliancePanel(true)}
              />

              {/* Macro Matrix Button */}
              <button
                onClick={() => setShowMacroMatrix(true)}
                className="flex items-center gap-1 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                title={language === 'en' ? 'Macro Matrix' : 'Makromatrise'}
              >
                <Grid className="w-4 h-4" />
              </button>

              {/* View Mode Toggle */}
              <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5">
                <button
                  onClick={() => setViewMode('easy')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    viewMode === 'easy'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {language === 'en' ? 'Easy' : 'Enkel'}
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    viewMode === 'detailed'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {language === 'en' ? 'Detailed' : 'Detaljert'}
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    viewMode === 'preview'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {language === 'en' ? 'Preview' : 'Forhåndsvisning'}
                </button>
              </div>

              {/* Print Preview */}
              <button
                onClick={() => setShowPrintPreview(true)}
                className="flex items-center gap-1 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                title={language === 'en' ? 'Print Preview' : 'Forhåndsvisning'}
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Copy className="w-4 h-4" />
                {copiedToClipboard
                  ? language === 'en'
                    ? 'Copied!'
                    : 'Kopiert!'
                  : language === 'en'
                    ? 'Copy'
                    : 'Kopier'}
              </button>

              <button
                onClick={handleSave}
                disabled={saveMutation.isLoading}
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout - ChiroTouch Style 3-Column */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar - Problem List */}
        <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <ProblemList
            problems={problems}
            onChange={setProblems}
            patientName={`${patient?.data?.first_name || ''} ${patient?.data?.last_name || ''}`}
            className="rounded-none border-0"
          />

          <TreatmentPlanTracker
            plan={treatmentPlan}
            currentVisit={currentVisitNumber}
            onChange={setTreatmentPlan}
            className="rounded-none border-0 border-t"
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Alerts */}
          {(redFlagAlerts.length > 0 || clinicalWarnings.length > 0) && (
            <div className="px-4 py-2 space-y-2 bg-gray-50">
              {redFlagAlerts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-2">
                  <AlertTriangle className="text-red-600 w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700">{redFlagAlerts.join(', ')}</span>
                </div>
              )}
              {clinicalWarnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-start gap-2">
                  <AlertTriangle className="text-yellow-600 w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-yellow-700">{clinicalWarnings.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Metadata Bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500">Date:</label>
                <input
                  type="date"
                  value={encounterData.encounter_date}
                  onChange={(e) =>
                    setEncounterData((prev) => ({ ...prev, encounter_date: e.target.value }))
                  }
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500">Type:</label>
                <select
                  value={encounterData.encounter_type}
                  onChange={(e) =>
                    setEncounterData((prev) => ({ ...prev, encounter_type: e.target.value }))
                  }
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="INITIAL">Initial</option>
                  <option value="FOLLOWUP">Follow-up</option>
                  <option value="REEXAM">Re-exam</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500">Duration:</label>
                <input
                  type="number"
                  value={encounterData.duration_minutes}
                  onChange={(e) =>
                    setEncounterData((prev) => ({
                      ...prev,
                      duration_minutes: parseInt(e.target.value),
                    }))
                  }
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <span className="text-xs text-gray-500">min</span>
              </div>
              <div className="flex-1"></div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500">VAS Start:</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={encounterData.vas_pain_start ?? ''}
                    onChange={(e) =>
                      setEncounterData((prev) => ({
                        ...prev,
                        vas_pain_start: e.target.value ? parseInt(e.target.value) : null,
                      }))
                    }
                    className="w-14 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                    placeholder="0-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500">VAS End:</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={encounterData.vas_pain_end ?? ''}
                    onChange={(e) =>
                      setEncounterData((prev) => ({
                        ...prev,
                        vas_pain_end: e.target.value ? parseInt(e.target.value) : null,
                      }))
                    }
                    className="w-14 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                    placeholder="0-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Mode */}
          {viewMode === 'preview' && (
            <div className="p-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Chart Notes</h2>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedToClipboard ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-4 rounded-lg leading-relaxed">
                  {generateNarrativeText()}
                </pre>
              </div>
            </div>
          )}

          {/* Easy/Detailed Mode */}
          {viewMode !== 'preview' && (
            <div className="p-4">
              {/* Tab Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={goToPrevTab}
                  disabled={!canGoBack}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium ${
                    canGoBack
                      ? 'text-gray-700 hover:bg-gray-200'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={goToNextTab}
                  disabled={!canGoForward}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium ${
                    canGoForward
                      ? 'text-gray-700 hover:bg-gray-200'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* SUBJECTIVE TAB */}
              {activeTab === 'subjective' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-4">
                    {/* AI Generate from Intake Button */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-100">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <span className="text-sm text-purple-700">
                          {language === 'en'
                            ? 'Generate Subjective from patient intake'
                            : 'Generer Subjektiv fra pasientopptak'}
                        </span>
                      </div>
                      <IntakeParserButton
                        intakeData={{
                          chiefComplaint: encounterData.subjective.chief_complaint,
                          painLevel: encounterData.vas_pain_start,
                          location: encounterData.pain_locations,
                          painQuality: encounterData.pain_qualities,
                          aggravatingFactors: encounterData.aggravating_factors_selected,
                          relievingFactors: encounterData.relieving_factors_selected,
                        }}
                        language={language}
                        onGenerate={(narrative, source) => {
                          updateField('subjective', 'chief_complaint', narrative);
                        }}
                      />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <SmartTextInput
                        label="Chief Complaint"
                        value={encounterData.subjective.chief_complaint}
                        onChange={(val) => updateField('subjective', 'chief_complaint', val)}
                        placeholder="What brings you in today?"
                        quickPhrases={CHIEF_COMPLAINT_PHRASES}
                        rows={2}
                        required
                        aiEnabled={true}
                        aiFieldType="chief_complaint"
                        aiContext={buildAIContext('chief_complaint')}
                        aiAvailable={aiAvailable}
                        language={language}
                      />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <SmartTextInput
                        label="History"
                        value={encounterData.subjective.history}
                        onChange={(val) => updateField('subjective', 'history', val)}
                        placeholder="Describe how the problem developed..."
                        quickPhrases={HISTORY_PHRASES}
                        rows={3}
                        aiEnabled={true}
                        aiFieldType="history"
                        aiContext={buildAIContext('history')}
                        aiAvailable={aiAvailable}
                        language={language}
                      />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <SmartTextInput
                        label="Onset"
                        value={encounterData.subjective.onset}
                        onChange={(val) => updateField('subjective', 'onset', val)}
                        placeholder="When did it start?"
                        quickPhrases={ONSET_PHRASES}
                        rows={1}
                        aiEnabled={true}
                        aiFieldType="onset"
                        aiContext={buildAIContext('onset')}
                        aiAvailable={aiAvailable}
                        language={language}
                      />
                    </div>

                    {viewMode === 'easy' && (
                      <>
                        <QuickCheckboxGrid
                          title="Pain Quality"
                          categories={PAIN_QUALITY_OPTIONS}
                          selectedValues={encounterData.pain_qualities}
                          onChange={(vals) => updateQuickSelect('pain_qualities', vals)}
                          columns={3}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <QuickCheckboxGrid
                            title="Aggravating Factors"
                            categories={AGGRAVATING_FACTORS_OPTIONS}
                            selectedValues={encounterData.aggravating_factors_selected}
                            onChange={(vals) =>
                              updateQuickSelect('aggravating_factors_selected', vals)
                            }
                            columns={2}
                          />
                          <QuickCheckboxGrid
                            title="Relieving Factors"
                            categories={RELIEVING_FACTORS_OPTIONS}
                            selectedValues={encounterData.relieving_factors_selected}
                            onChange={(vals) =>
                              updateQuickSelect('relieving_factors_selected', vals)
                            }
                            columns={2}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Body Chart Gallery Preview */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Body Chart</h4>
                        <button
                          onClick={() => setShowBodyChart(true)}
                          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Open Full Chart
                        </button>
                      </div>
                      <BodyChartGallery
                        markers={encounterData.body_chart?.markers || []}
                        annotations={encounterData.body_chart?.annotations || []}
                        onViewSelect={() => setShowBodyChart(true)}
                      />
                    </div>

                    {/* Quick Region Select (fallback) */}
                    <BodyDiagram
                      selectedRegions={encounterData.pain_locations}
                      onChange={(vals) => updateQuickSelect('pain_locations', vals)}
                    />
                    <QuickRegionSelect
                      selectedRegions={encounterData.pain_locations}
                      onChange={(vals) => updateQuickSelect('pain_locations', vals)}
                    />
                  </div>
                </div>
              )}

              {/* OBJECTIVE TAB */}
              {activeTab === 'objective' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-4">
                    {viewMode === 'easy' ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <QuickCheckboxGrid
                            title="Observation"
                            categories={OBSERVATION_FINDINGS_OPTIONS}
                            selectedValues={encounterData.observation_findings}
                            onChange={(vals) => updateQuickSelect('observation_findings', vals)}
                            columns={2}
                          />
                          <QuickCheckboxGrid
                            title="Palpation"
                            categories={PALPATION_FINDINGS_OPTIONS}
                            selectedValues={encounterData.palpation_findings}
                            onChange={(vals) => updateQuickSelect('palpation_findings', vals)}
                            columns={2}
                          />
                        </div>

                        <QuickCheckboxGrid
                          title="Range of Motion"
                          categories={ROM_FINDINGS_OPTIONS}
                          selectedValues={encounterData.rom_findings}
                          onChange={(vals) => updateQuickSelect('rom_findings', vals)}
                          columns={3}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <QuickCheckboxGrid
                            title="Orthopedic Tests"
                            categories={ORTHO_TESTS_OPTIONS}
                            selectedValues={encounterData.ortho_tests_selected}
                            onChange={(vals) => updateQuickSelect('ortho_tests_selected', vals)}
                            columns={2}
                          />
                          <QuickCheckboxGrid
                            title="Neurological"
                            categories={NEURO_TESTS_OPTIONS}
                            selectedValues={encounterData.neuro_tests_selected}
                            onChange={(vals) => updateQuickSelect('neuro_tests_selected', vals)}
                            columns={2}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                          <SmartTextInput
                            label="Observation"
                            value={encounterData.objective.observation}
                            onChange={(val) => updateField('objective', 'observation', val)}
                            placeholder="Visual observations, gait, posture..."
                            rows={3}
                            aiEnabled={true}
                            aiFieldType="observation"
                            aiContext={buildAIContext('observation')}
                            aiAvailable={aiAvailable}
                            language={language}
                          />
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                          <SmartTextInput
                            label="Palpation"
                            value={encounterData.objective.palpation}
                            onChange={(val) => updateField('objective', 'palpation', val)}
                            placeholder="Tenderness, muscle tension..."
                            rows={3}
                            aiEnabled={true}
                            aiFieldType="palpation"
                            aiContext={buildAIContext('palpation')}
                            aiAvailable={aiAvailable}
                            language={language}
                          />
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                          <SmartTextInput
                            label="Range of Motion"
                            value={encounterData.objective.rom}
                            onChange={(val) => updateField('objective', 'rom', val)}
                            placeholder="ROM findings..."
                            rows={3}
                            aiEnabled={true}
                            aiFieldType="rom"
                            aiContext={buildAIContext('rom')}
                            aiAvailable={aiAvailable}
                            language={language}
                          />
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                          <SmartTextInput
                            label="Orthopedic Tests"
                            value={encounterData.objective.ortho_tests}
                            onChange={(val) => updateField('objective', 'ortho_tests', val)}
                            placeholder="Test results..."
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Spine Diagram */}
                  <div>
                    <SpineDiagram
                      findings={encounterData.spinal_findings}
                      onChange={(findings) => updateQuickSelect('spinal_findings', findings)}
                    />
                  </div>
                </div>
              )}

              {/* ASSESSMENT TAB */}
              {activeTab === 'assessment' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diagnosis (ICPC-2 / ICD-10)
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addDiagnosisCode(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      >
                        <option value="">Select diagnosis...</option>
                        {commonDiagnoses?.data?.map((code) => (
                          <option key={code.code} value={code.code}>
                            {code.code} - {code.description_no || code.description_en}
                          </option>
                        ))}
                      </select>
                      <div className="flex flex-wrap gap-2">
                        {encounterData.icpc_codes.map((code) => (
                          <span
                            key={code}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                          >
                            {code}
                            <button
                              onClick={() => removeDiagnosisCode(code)}
                              className="hover:text-purple-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <SmartTextInput
                        label="Clinical Reasoning"
                        value={encounterData.assessment.clinical_reasoning}
                        onChange={(val) => updateField('assessment', 'clinical_reasoning', val)}
                        placeholder="Your clinical reasoning..."
                        quickPhrases={CLINICAL_REASONING_PHRASES}
                        rows={4}
                        aiEnabled={true}
                        aiFieldType="clinical_reasoning"
                        aiContext={buildAIContext('clinical_reasoning')}
                        aiAvailable={aiAvailable}
                        language={language}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <SmartTextInput
                          label="Differential Diagnosis"
                          value={encounterData.assessment.differential_diagnosis}
                          onChange={(val) =>
                            updateField('assessment', 'differential_diagnosis', val)
                          }
                          placeholder="Other diagnoses considered..."
                          rows={2}
                          aiEnabled={true}
                          aiFieldType="differential_diagnosis"
                          aiContext={buildAIContext('differential_diagnosis')}
                          aiAvailable={aiAvailable}
                          language={language}
                        />
                      </div>
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <SmartTextInput
                          label="Prognosis"
                          value={encounterData.assessment.prognosis}
                          onChange={(val) => updateField('assessment', 'prognosis', val)}
                          placeholder="Expected recovery..."
                          rows={2}
                          aiEnabled={true}
                          aiFieldType="prognosis"
                          aiContext={buildAIContext('prognosis')}
                          aiAvailable={aiAvailable}
                          language={language}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <VASComparisonDisplay
                      startValue={encounterData.vas_pain_start}
                      endValue={encounterData.vas_pain_end}
                    />

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Outcome Assessment</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.values(QUESTIONNAIRE_TYPES).map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              setOutcomeType(type);
                              setShowOutcomeAssessment(true);
                            }}
                            className="px-2 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PLAN TAB */}
              {activeTab === 'plan' && (
                <div className="space-y-4">
                  {viewMode === 'easy' ? (
                    <>
                      <QuickCheckboxGrid
                        title="Treatment Performed"
                        categories={TREATMENT_OPTIONS}
                        selectedValues={encounterData.treatments_selected}
                        onChange={(vals) => updateQuickSelect('treatments_selected', vals)}
                        columns={4}
                      />

                      <QuickCheckboxGrid
                        title="Home Exercises"
                        categories={EXERCISE_OPTIONS}
                        selectedValues={encounterData.exercises_selected}
                        onChange={(vals) => updateQuickSelect('exercises_selected', vals)}
                        columns={4}
                      />
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <SmartTextInput
                          label="Treatment"
                          value={encounterData.plan.treatment}
                          onChange={(val) => updateField('plan', 'treatment', val)}
                          placeholder="Treatment performed..."
                          rows={4}
                          aiEnabled={true}
                          aiFieldType="treatment"
                          aiContext={buildAIContext('treatment')}
                          aiAvailable={aiAvailable}
                          language={language}
                        />
                      </div>
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <SmartTextInput
                          label="Exercises"
                          value={encounterData.plan.exercises}
                          onChange={(val) => updateField('plan', 'exercises', val)}
                          placeholder="Home exercises..."
                          rows={4}
                          aiEnabled={true}
                          aiFieldType="exercises"
                          aiContext={buildAIContext('exercises')}
                          aiAvailable={aiAvailable}
                          language={language}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <SmartTextInput
                        label="Advice"
                        value={encounterData.plan.advice}
                        onChange={(val) => updateField('plan', 'advice', val)}
                        placeholder="Patient education..."
                        quickPhrases={ADVICE_PHRASES}
                        rows={3}
                        aiEnabled={true}
                        aiFieldType="advice"
                        aiContext={buildAIContext('advice')}
                        aiAvailable={aiAvailable}
                        language={language}
                      />
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <SmartTextInput
                        label="Follow-up"
                        value={encounterData.plan.follow_up}
                        onChange={(val) => updateField('plan', 'follow_up', val)}
                        placeholder="Next appointment..."
                        quickPhrases={FOLLOW_UP_PHRASES}
                        rows={3}
                        aiEnabled={true}
                        aiFieldType="follow_up"
                        aiContext={buildAIContext('follow_up')}
                        aiAvailable={aiAvailable}
                        language={language}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Chart Notes Preview */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Chart Notes
            </h3>
          </div>
          <div className="p-4">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-xs text-gray-700 leading-relaxed">
                {generateNarrativeText()}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Outcome Assessment Modal */}
      {showOutcomeAssessment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">{outcomeType} Assessment</h3>
              <button
                onClick={() => setShowOutcomeAssessment(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[70vh] p-6">
              <OutcomeAssessment
                type={outcomeType}
                responses={encounterData.outcome_assessment?.responses || {}}
                onChange={(responses) => {
                  const answered = Object.keys(responses).length;
                  const total = Object.values(responses).reduce((sum, val) => sum + val, 0);
                  const percentage =
                    answered > 0 ? Math.round((total / (answered * 5)) * 100) : null;
                  setEncounterData((prev) => ({
                    ...prev,
                    outcome_assessment: { type: outcomeType, responses, score: percentage },
                  }));
                }}
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowOutcomeAssessment(false)}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Picker */}
      <TemplatePicker
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelectTemplate={(text) => {
          if (activeTab === 'subjective') {
            updateField('subjective', 'history', encounterData.subjective.history + '\n' + text);
          } else if (activeTab === 'objective') {
            updateField(
              'objective',
              'observation',
              encounterData.objective.observation + '\n' + text
            );
          } else if (activeTab === 'assessment') {
            updateField(
              'assessment',
              'clinical_reasoning',
              encounterData.assessment.clinical_reasoning + '\n' + text
            );
          } else if (activeTab === 'plan') {
            updateField('plan', 'treatment', encounterData.plan.treatment + '\n' + text);
          }
        }}
        soapSection={activeTab}
      />

      {/* Body Chart Modal */}
      {showBodyChart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Body Chart - Annotate Pain Locations</h3>
              <button
                onClick={() => setShowBodyChart(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[70vh]">
              <BodyChart
                initialView="front"
                initialAnnotations={encounterData.body_chart?.annotations || []}
                initialMarkers={encounterData.body_chart?.markers || []}
                onSave={({ annotations, markers }) => {
                  setEncounterData((prev) => ({
                    ...prev,
                    body_chart: { annotations, markers },
                  }));
                  setShowBodyChart(false);
                }}
                showToolbar={true}
                height={450}
              />
            </div>
          </div>
        </div>
      )}

      {/* Template Library Modal (Jane App Style) */}
      {showTemplateLibrary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Chart Template Library</h3>
              <button
                onClick={() => setShowTemplateLibrary(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[75vh]">
              <TemplateLibrary
                embedded={true}
                showHeader={false}
                onSelectTemplate={(template) => {
                  // Insert template content based on current tab
                  if (activeTab === 'subjective') {
                    if (template.content?.subjective) {
                      updateField(
                        'subjective',
                        'chief_complaint',
                        (encounterData.subjective.chief_complaint
                          ? encounterData.subjective.chief_complaint + '\n'
                          : '') + template.content.subjective
                      );
                    }
                    if (template.content?.history) {
                      updateField(
                        'subjective',
                        'history',
                        (encounterData.subjective.history
                          ? encounterData.subjective.history + '\n'
                          : '') + template.content.history
                      );
                    }
                  } else if (activeTab === 'objective') {
                    if (template.content?.objective) {
                      updateField(
                        'objective',
                        'observation',
                        (encounterData.objective.observation
                          ? encounterData.objective.observation + '\n'
                          : '') + template.content.objective
                      );
                    }
                  } else if (activeTab === 'assessment') {
                    if (template.content?.assessment) {
                      updateField(
                        'assessment',
                        'clinical_reasoning',
                        (encounterData.assessment.clinical_reasoning
                          ? encounterData.assessment.clinical_reasoning + '\n'
                          : '') + template.content.assessment
                      );
                    }
                  } else if (activeTab === 'plan') {
                    if (template.content?.plan) {
                      updateField(
                        'plan',
                        'treatment',
                        (encounterData.plan.treatment ? encounterData.plan.treatment + '\n' : '') +
                          template.content.plan
                      );
                    }
                  }
                  setShowTemplateLibrary(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Macro Matrix Modal */}
      {showMacroMatrix && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {language === 'en'
                  ? 'Macro Matrix - Quick Insert'
                  : 'Makromatrise - Hurtiginnsetting'}
              </h3>
              <button
                onClick={() => setShowMacroMatrix(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[75vh] p-4">
              <MacroMatrix
                onInsert={handleMacroInsert}
                targetField={activeTab}
                favorites={macroFavorites}
                onFavoritesChange={setMacroFavorites}
              />
            </div>
          </div>
        </div>
      )}

      {/* Compliance Panel Modal */}
      {showCompliancePanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {language === 'en' ? 'Compliance Check' : 'Samsvarskontroll'}
              </h3>
              <button
                onClick={() => setShowCompliancePanel(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[75vh]">
              <CompliancePanel
                encounterData={encounterData}
                onApplyAutoInsert={handleComplianceAutoFix}
              />
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      <PrintPreview
        encounterData={encounterData}
        patientData={patient?.data}
        practiceInfo={{
          name: 'ChiroClick Clinic',
          address: 'Healthcare Center, Medical District',
          phone: '+47 400 00 000',
          provider: language === 'en' ? 'Provider Name, DC' : 'Behandler, DC',
          credentials: language === 'en' ? 'Doctor of Chiropractic' : 'Kiropraktor',
        }}
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
      />

      {/* Slash Command Reference Modal */}
      {showSlashReference && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Command className="w-5 h-5" />
                {language === 'en' ? 'Slash Commands' : 'Skråstrek-kommandoer'}
              </h3>
              <button
                onClick={() => setShowSlashReference(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[70vh]">
              <SlashCommandReference />
            </div>
          </div>
        </div>
      )}

      {/* AI Scribe Modal */}
      {showAIScribe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Mic className="w-5 h-5 text-blue-500" />
                {language === 'en' ? 'AI Voice Scribe' : 'AI Stemmeskriver'}
              </h3>
              <button
                onClick={() => setShowAIScribe(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[75vh]">
              <AIScribe
                language={language}
                onApplySOAP={(sections) => {
                  if (sections.subjective) {
                    updateField(
                      'subjective',
                      'chief_complaint',
                      (encounterData.subjective.chief_complaint
                        ? encounterData.subjective.chief_complaint + '\n'
                        : '') + sections.subjective
                    );
                  }
                  if (sections.objective) {
                    updateField(
                      'objective',
                      'observation',
                      (encounterData.objective.observation
                        ? encounterData.objective.observation + '\n'
                        : '') + sections.objective
                    );
                  }
                  if (sections.assessment) {
                    updateField(
                      'assessment',
                      'clinical_reasoning',
                      (encounterData.assessment.clinical_reasoning
                        ? encounterData.assessment.clinical_reasoning + '\n'
                        : '') + sections.assessment
                    );
                  }
                  if (sections.plan) {
                    updateField(
                      'plan',
                      'treatment',
                      (encounterData.plan.treatment ? encounterData.plan.treatment + '\n' : '') +
                        sections.plan
                    );
                  }
                  setShowAIScribe(false);
                }}
                onApplyTranscript={(transcript) => {
                  // Insert transcript based on active tab
                  if (activeTab === 'subjective') {
                    updateField(
                      'subjective',
                      'chief_complaint',
                      (encounterData.subjective.chief_complaint
                        ? encounterData.subjective.chief_complaint + '\n'
                        : '') + transcript
                    );
                  } else if (activeTab === 'objective') {
                    updateField(
                      'objective',
                      'observation',
                      (encounterData.objective.observation
                        ? encounterData.objective.observation + '\n'
                        : '') + transcript
                    );
                  } else if (activeTab === 'assessment') {
                    updateField(
                      'assessment',
                      'clinical_reasoning',
                      (encounterData.assessment.clinical_reasoning
                        ? encounterData.assessment.clinical_reasoning + '\n'
                        : '') + transcript
                    );
                  } else if (activeTab === 'plan') {
                    updateField(
                      'plan',
                      'treatment',
                      (encounterData.plan.treatment ? encounterData.plan.treatment + '\n' : '') +
                        transcript
                    );
                  }
                  setShowAIScribe(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Settings Modal */}
      {showAISettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full">
            <AISettings language={language} onClose={() => setShowAISettings(false)} />
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <button
          onClick={() => setShowSlashReference(true)}
          className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center"
          title={language === 'en' ? 'Slash Commands Reference' : 'Kommandoreferanse'}
        >
          <Command className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowTemplateLibrary(true)}
          className="w-12 h-12 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 flex items-center justify-center"
          title={language === 'en' ? 'Template Library' : 'Malbibliotek'}
        >
          <Sparkles className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowTemplatePicker(true)}
          className="w-12 h-12 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 flex items-center justify-center"
          title={language === 'en' ? 'Quick Templates' : 'Hurtigmaler'}
        >
          <BookOpen className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
