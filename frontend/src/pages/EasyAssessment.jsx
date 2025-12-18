import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { encountersAPI, patientsAPI, diagnosisAPI, treatmentsAPI } from '../services/api';
import {
  Save, FileText, AlertTriangle, CheckCircle, Brain, X, Sparkles,
  BookOpen, ChevronLeft, ChevronRight, Settings, Eye, Edit3
} from 'lucide-react';
import TemplatePicker from '../components/TemplatePicker';

// Import new assessment components
import {
  QuickCheckboxGrid,
  SmartTextInput,
  BodyDiagram,
  QuickRegionSelect,
  VASPainScale,
  VASComparisonDisplay,
  OutcomeAssessment,
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
  QUESTIONNAIRE_TYPES
} from '../components/assessment';

/**
 * EasyAssessment - Enhanced Clinical Encounter Interface
 *
 * Inspired by industry leaders:
 * - Jane App: Smart Options, Phrases, customizable templates
 * - DrChrono: Customizable forms, template library, single data entry
 * - ChiroTouch: 15-second SOAP notes, macros, checkbox-based assessments
 *
 * Features:
 * - Quick-select checkboxes for common findings
 * - Visual body diagram for pain location
 * - Smart text inputs with phrase macros
 * - VAS pain scale with visual feedback
 * - Outcome assessment questionnaires
 */
export default function EasyAssessment() {
  const { patientId, encounterId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('subjective');
  const [viewMode, setViewMode] = useState('easy'); // 'easy' | 'detailed' | 'preview'
  const [redFlagAlerts, setRedFlagAlerts] = useState([]);
  const [clinicalWarnings, setClinicalWarnings] = useState([]);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showOutcomeAssessment, setShowOutcomeAssessment] = useState(false);
  const [outcomeType, setOutcomeType] = useState('ODI');

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
      relieving_factors: ''
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
      posture: ''
    },

    // Quick-select data for objective
    observation_findings: [],
    palpation_findings: [],
    rom_findings: [],
    ortho_tests_selected: [],
    neuro_tests_selected: [],

    // Assessment section
    assessment: {
      clinical_reasoning: '',
      differential_diagnosis: '',
      prognosis: '',
      red_flags_checked: true
    },

    // Plan section
    plan: {
      treatment: '',
      exercises: '',
      advice: '',
      follow_up: '',
      referrals: ''
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
      score: null
    }
  });

  // Fetch patient data
  const { data: patient } = useQuery({
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

  // Save encounter mutation
  const saveMutation = useMutation({
    mutationFn: (data) => {
      // Merge quick-select data into text fields before saving
      const mergedData = mergeQuickSelectIntoText(data);
      if (encounterId) {
        return encountersAPI.update(encounterId, mergedData);
      }
      return encountersAPI.create(mergedData);
    },
    onSuccess: (response) => {
      alert('Encounter saved successfully!');
      if (!encounterId && response?.data?.id) {
        navigate(`/patients/${patientId}/encounter/${response.data.id}`);
      }
    },
    onError: (error) => {
      alert(`Error saving encounter: ${error.message}`);
    }
  });

  // Merge quick-select arrays into text descriptions
  const mergeQuickSelectIntoText = (data) => {
    const merged = { ...data };

    // Helper to convert selected values to text
    const selectedToText = (selected, options) => {
      if (!selected || selected.length === 0) return '';
      const allItems = Object.values(options).flat();
      return selected.map(val => {
        const item = allItems.find(i => i.value === val);
        return item?.label || val;
      }).join(', ');
    };

    // Merge subjective
    const painQualityText = selectedToText(data.pain_qualities, PAIN_QUALITY_OPTIONS);
    const aggravatingText = selectedToText(data.aggravating_factors_selected, AGGRAVATING_FACTORS_OPTIONS);
    const relievingText = selectedToText(data.relieving_factors_selected, RELIEVING_FACTORS_OPTIONS);

    merged.subjective = {
      ...data.subjective,
      pain_description: [data.subjective.pain_description, painQualityText].filter(Boolean).join('. '),
      aggravating_factors: [data.subjective.aggravating_factors, aggravatingText].filter(Boolean).join('. '),
      relieving_factors: [data.subjective.relieving_factors, relievingText].filter(Boolean).join('. ')
    };

    // Merge objective
    const observationText = selectedToText(data.observation_findings, OBSERVATION_FINDINGS_OPTIONS);
    const palpationText = selectedToText(data.palpation_findings, PALPATION_FINDINGS_OPTIONS);
    const romText = selectedToText(data.rom_findings, ROM_FINDINGS_OPTIONS);
    const orthoText = selectedToText(data.ortho_tests_selected, ORTHO_TESTS_OPTIONS);
    const neuroText = selectedToText(data.neuro_tests_selected, NEURO_TESTS_OPTIONS);

    merged.objective = {
      ...data.objective,
      observation: [data.objective.observation, observationText].filter(Boolean).join('. '),
      palpation: [data.objective.palpation, palpationText].filter(Boolean).join('. '),
      rom: [data.objective.rom, romText].filter(Boolean).join('. '),
      ortho_tests: [data.objective.ortho_tests, orthoText].filter(Boolean).join('. '),
      neuro_tests: [data.objective.neuro_tests, neuroText].filter(Boolean).join('. ')
    };

    // Merge plan
    const treatmentText = selectedToText(data.treatments_selected, TREATMENT_OPTIONS);
    const exerciseText = selectedToText(data.exercises_selected, EXERCISE_OPTIONS);

    merged.plan = {
      ...data.plan,
      treatment: [data.plan.treatment, treatmentText].filter(Boolean).join('. '),
      exercises: [data.plan.exercises, exerciseText].filter(Boolean).join('. ')
    };

    return merged;
  };

  const handleSave = () => {
    saveMutation.mutate(encounterData);
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

  const updateQuickSelect = (field, values) => {
    setEncounterData(prev => ({
      ...prev,
      [field]: values
    }));
  };

  const addDiagnosisCode = (code) => {
    if (!encounterData.icpc_codes.includes(code)) {
      setEncounterData(prev => ({
        ...prev,
        icpc_codes: [...prev.icpc_codes, code]
      }));
    }
  };

  const removeDiagnosisCode = (code) => {
    setEncounterData(prev => ({
      ...prev,
      icpc_codes: prev.icpc_codes.filter(c => c !== code)
    }));
  };

  // Navigate between tabs
  const tabs = [
    { id: 'subjective', label: 'Subjective', icon: '💬', color: 'green' },
    { id: 'objective', label: 'Objective', icon: '🔍', color: 'blue' },
    { id: 'assessment', label: 'Assessment', icon: '📋', color: 'purple' },
    { id: 'plan', label: 'Plan', icon: '📝', color: 'orange' }
  ];

  const currentTabIndex = tabs.findIndex(t => t.id === activeTab);
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

  // Generate preview text
  const generatePreviewText = () => {
    const merged = mergeQuickSelectIntoText(encounterData);
    return `
SUBJECTIVE
Chief Complaint: ${merged.subjective.chief_complaint || 'Not documented'}
History: ${merged.subjective.history || 'Not documented'}
Onset: ${merged.subjective.onset || 'Not documented'}
Pain Description: ${merged.subjective.pain_description || 'Not documented'}
Aggravating Factors: ${merged.subjective.aggravating_factors || 'Not documented'}
Relieving Factors: ${merged.subjective.relieving_factors || 'Not documented'}

OBJECTIVE
Observation: ${merged.objective.observation || 'Not documented'}
Palpation: ${merged.objective.palpation || 'Not documented'}
ROM: ${merged.objective.rom || 'Not documented'}
Orthopedic Tests: ${merged.objective.ortho_tests || 'Not documented'}
Neurological Tests: ${merged.objective.neuro_tests || 'Not documented'}

ASSESSMENT
Diagnosis: ${encounterData.icpc_codes.join(', ') || 'Not documented'}
Clinical Reasoning: ${merged.assessment.clinical_reasoning || 'Not documented'}
Prognosis: ${merged.assessment.prognosis || 'Not documented'}

PLAN
Treatment: ${merged.plan.treatment || 'Not documented'}
Exercises: ${merged.plan.exercises || 'Not documented'}
Advice: ${merged.plan.advice || 'Not documented'}
Follow-up: ${merged.plan.follow_up || 'Not documented'}

VAS Pain: ${encounterData.vas_pain_start ?? 'N/A'}/10 → ${encounterData.vas_pain_end ?? 'N/A'}/10
    `.trim();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/patients/${patientId}`)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Easy Assessment</h1>
                {patient?.data && (
                  <p className="text-sm text-gray-500">
                    {patient.data.first_name} {patient.data.last_name}
                    {patient.data.date_of_birth && (
                      <span className="ml-2">
                        (Age: {Math.floor((new Date() - new Date(patient.data.date_of_birth)) / 31557600000)})
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5">
                <button
                  onClick={() => setViewMode('easy')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                    viewMode === 'easy'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Easy
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                    viewMode === 'detailed'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  Detailed
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                    viewMode === 'preview'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
              </div>

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

      {/* Alerts */}
      {(redFlagAlerts.length > 0 || clinicalWarnings.length > 0) && (
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
          {redFlagAlerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="text-red-600 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-red-800">Red Flags: </span>
                <span className="text-red-700">{redFlagAlerts.join(', ')}</span>
              </div>
            </div>
          )}
          {clinicalWarnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="text-yellow-600 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-yellow-800">Warnings: </span>
                <span className="text-yellow-700">{clinicalWarnings.join(', ')}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Encounter Metadata Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={encounterData.encounter_date}
                onChange={(e) => setEncounterData(prev => ({ ...prev, encounter_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
              <select
                value={encounterData.encounter_type}
                onChange={(e) => setEncounterData(prev => ({ ...prev, encounter_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="INITIAL">Initial Visit</option>
                <option value="FOLLOWUP">Follow-up</option>
                <option value="REEXAM">Re-examination</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Duration (min)</label>
              <input
                type="number"
                value={encounterData.duration_minutes}
                onChange={(e) => setEncounterData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <VASPainScale
                value={encounterData.vas_pain_start}
                onChange={(val) => setEncounterData(prev => ({ ...prev, vas_pain_start: val }))}
                label="Pain Start"
                showFaces={false}
                showDescription={false}
                className="border-0 p-0"
              />
            </div>
            <div>
              <VASPainScale
                value={encounterData.vas_pain_end}
                onChange={(val) => setEncounterData(prev => ({ ...prev, vas_pain_end: val }))}
                label="Pain End"
                showFaces={false}
                showDescription={false}
                className="border-0 p-0"
              />
            </div>
          </div>
        </div>

        {/* Preview Mode */}
        {viewMode === 'preview' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">SOAP Note Preview</h2>
            <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg">
              {generatePreviewText()}
            </pre>
          </div>
        )}

        {/* Easy/Detailed Mode */}
        {viewMode !== 'preview' && (
          <>
            {/* Tab Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={goToPrevTab}
                disabled={!canGoBack}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium ${
                  canGoBack
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex gap-2">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      activeTab === tab.id
                        ? `bg-${tab.color}-100 text-${tab.color}-800 border-2 border-${tab.color}-300`
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    {index < currentTabIndex && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={goToNextTab}
                disabled={!canGoForward}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium ${
                  canGoForward
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* SUBJECTIVE TAB */}
              {activeTab === 'subjective' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Main inputs */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <SmartTextInput
                        label="Chief Complaint"
                        value={encounterData.subjective.chief_complaint}
                        onChange={(val) => updateField('subjective', 'chief_complaint', val)}
                        placeholder="What brings you in today?"
                        quickPhrases={CHIEF_COMPLAINT_PHRASES}
                        rows={2}
                        required
                      />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <SmartTextInput
                        label="History / How it started"
                        value={encounterData.subjective.history}
                        onChange={(val) => updateField('subjective', 'history', val)}
                        placeholder="Describe how the problem developed..."
                        quickPhrases={HISTORY_PHRASES}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <SmartTextInput
                          label="Onset"
                          value={encounterData.subjective.onset}
                          onChange={(val) => updateField('subjective', 'onset', val)}
                          placeholder="When did it start?"
                          quickPhrases={ONSET_PHRASES}
                          rows={2}
                        />
                      </div>
                    </div>

                    {viewMode === 'easy' && (
                      <>
                        <QuickCheckboxGrid
                          title="Pain Quality (click to select)"
                          categories={PAIN_QUALITY_OPTIONS}
                          selectedValues={encounterData.pain_qualities}
                          onChange={(vals) => updateQuickSelect('pain_qualities', vals)}
                          columns={3}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <QuickCheckboxGrid
                            title="What makes it worse?"
                            categories={AGGRAVATING_FACTORS_OPTIONS}
                            selectedValues={encounterData.aggravating_factors_selected}
                            onChange={(vals) => updateQuickSelect('aggravating_factors_selected', vals)}
                            columns={2}
                          />

                          <QuickCheckboxGrid
                            title="What makes it better?"
                            categories={RELIEVING_FACTORS_OPTIONS}
                            selectedValues={encounterData.relieving_factors_selected}
                            onChange={(vals) => updateQuickSelect('relieving_factors_selected', vals)}
                            columns={2}
                          />
                        </div>
                      </>
                    )}

                    {viewMode === 'detailed' && (
                      <>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                          <SmartTextInput
                            label="Pain Description"
                            value={encounterData.subjective.pain_description}
                            onChange={(val) => updateField('subjective', 'pain_description', val)}
                            placeholder="Describe the pain quality..."
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <SmartTextInput
                              label="Aggravating Factors"
                              value={encounterData.subjective.aggravating_factors}
                              onChange={(val) => updateField('subjective', 'aggravating_factors', val)}
                              placeholder="What makes it worse?"
                              rows={2}
                            />
                          </div>
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <SmartTextInput
                              label="Relieving Factors"
                              value={encounterData.subjective.relieving_factors}
                              onChange={(val) => updateField('subjective', 'relieving_factors', val)}
                              placeholder="What makes it better?"
                              rows={2}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Column - Pain location */}
                  <div className="space-y-4">
                    <BodyDiagram
                      selectedRegions={encounterData.pain_locations}
                      onChange={(vals) => updateQuickSelect('pain_locations', vals)}
                    />

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Select Regions</h4>
                      <QuickRegionSelect
                        selectedRegions={encounterData.pain_locations}
                        onChange={(vals) => updateQuickSelect('pain_locations', vals)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* OBJECTIVE TAB */}
              {activeTab === 'objective' && (
                <div className="space-y-6">
                  {viewMode === 'easy' ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <QuickCheckboxGrid
                          title="Observation Findings"
                          categories={OBSERVATION_FINDINGS_OPTIONS}
                          selectedValues={encounterData.observation_findings}
                          onChange={(vals) => updateQuickSelect('observation_findings', vals)}
                          columns={2}
                        />

                        <QuickCheckboxGrid
                          title="Palpation Findings"
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <QuickCheckboxGrid
                          title="Orthopedic Tests"
                          categories={ORTHO_TESTS_OPTIONS}
                          selectedValues={encounterData.ortho_tests_selected}
                          onChange={(vals) => updateQuickSelect('ortho_tests_selected', vals)}
                          columns={2}
                        />

                        <QuickCheckboxGrid
                          title="Neurological Tests"
                          categories={NEURO_TESTS_OPTIONS}
                          selectedValues={encounterData.neuro_tests_selected}
                          onChange={(vals) => updateQuickSelect('neuro_tests_selected', vals)}
                          columns={2}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <SmartTextInput
                          label="Observation"
                          value={encounterData.objective.observation}
                          onChange={(val) => updateField('objective', 'observation', val)}
                          placeholder="Visual observations, gait, posture..."
                          rows={3}
                        />
                      </div>
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <SmartTextInput
                          label="Palpation"
                          value={encounterData.objective.palpation}
                          onChange={(val) => updateField('objective', 'palpation', val)}
                          placeholder="Tenderness, muscle tension, trigger points..."
                          rows={3}
                        />
                      </div>
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <SmartTextInput
                          label="Range of Motion"
                          value={encounterData.objective.rom}
                          onChange={(val) => updateField('objective', 'rom', val)}
                          placeholder="ROM findings..."
                          rows={3}
                        />
                      </div>
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <SmartTextInput
                          label="Orthopedic Tests"
                          value={encounterData.objective.ortho_tests}
                          onChange={(val) => updateField('objective', 'ortho_tests', val)}
                          placeholder="SLR, Kemp's, etc..."
                          rows={3}
                        />
                      </div>
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <SmartTextInput
                          label="Neurological Tests"
                          value={encounterData.objective.neuro_tests}
                          onChange={(val) => updateField('objective', 'neuro_tests', val)}
                          placeholder="Reflexes, sensation, motor strength..."
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ASSESSMENT TAB */}
              {activeTab === 'assessment' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {/* Diagnosis Selection */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diagnosis (ICPC-2)
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addDiagnosisCode(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      >
                        <option value="">Select a diagnosis...</option>
                        {commonDiagnoses?.data?.map(code => (
                          <option key={code.code} value={code.code}>
                            {code.code} - {code.description_no || code.description_en}
                          </option>
                        ))}
                      </select>
                      <div className="flex flex-wrap gap-2">
                        {encounterData.icpc_codes.map(code => (
                          <span
                            key={code}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                          >
                            {code}
                            <button
                              onClick={() => removeDiagnosisCode(code)}
                              className="text-purple-600 hover:text-purple-800"
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
                        placeholder="Your clinical reasoning for the diagnosis..."
                        quickPhrases={CLINICAL_REASONING_PHRASES}
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <SmartTextInput
                          label="Differential Diagnosis"
                          value={encounterData.assessment.differential_diagnosis}
                          onChange={(val) => updateField('assessment', 'differential_diagnosis', val)}
                          placeholder="Other diagnoses considered..."
                          rows={2}
                        />
                      </div>
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <SmartTextInput
                          label="Prognosis"
                          value={encounterData.assessment.prognosis}
                          onChange={(val) => updateField('assessment', 'prognosis', val)}
                          placeholder="Expected recovery..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Outcome Assessment Panel */}
                  <div className="space-y-4">
                    <VASComparisonDisplay
                      startValue={encounterData.vas_pain_start}
                      endValue={encounterData.vas_pain_end}
                    />

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Outcome Assessment</h4>
                      <div className="flex gap-2 mb-3">
                        {Object.values(QUESTIONNAIRE_TYPES).map(type => (
                          <button
                            key={type}
                            onClick={() => {
                              setOutcomeType(type);
                              setShowOutcomeAssessment(true);
                            }}
                            className="flex-1 px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      {encounterData.outcome_assessment?.score && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-sm text-green-800">
                            <strong>{encounterData.outcome_assessment.type}:</strong>{' '}
                            {encounterData.outcome_assessment.score}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PLAN TAB */}
              {activeTab === 'plan' && (
                <div className="space-y-6">
                  {viewMode === 'easy' ? (
                    <>
                      <QuickCheckboxGrid
                        title="Treatment Performed (click to select)"
                        categories={TREATMENT_OPTIONS}
                        selectedValues={encounterData.treatments_selected}
                        onChange={(vals) => updateQuickSelect('treatments_selected', vals)}
                        columns={3}
                      />

                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <SmartTextInput
                          label="Additional Treatment Notes"
                          value={encounterData.plan.treatment}
                          onChange={(val) => updateField('plan', 'treatment', val)}
                          placeholder="Any additional treatment details..."
                          rows={2}
                        />
                      </div>

                      <QuickCheckboxGrid
                        title="Home Exercises Prescribed"
                        categories={EXERCISE_OPTIONS}
                        selectedValues={encounterData.exercises_selected}
                        onChange={(vals) => updateQuickSelect('exercises_selected', vals)}
                        columns={3}
                      />
                    </>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <SmartTextInput
                          label="Treatment Performed"
                          value={encounterData.plan.treatment}
                          onChange={(val) => updateField('plan', 'treatment', val)}
                          placeholder="Treatment techniques used..."
                          rows={4}
                        />
                      </div>
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <SmartTextInput
                          label="Home Exercises"
                          value={encounterData.plan.exercises}
                          onChange={(val) => updateField('plan', 'exercises', val)}
                          placeholder="Exercises prescribed..."
                          rows={4}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <SmartTextInput
                        label="Advice"
                        value={encounterData.plan.advice}
                        onChange={(val) => updateField('plan', 'advice', val)}
                        placeholder="Patient advice and education..."
                        quickPhrases={ADVICE_PHRASES}
                        rows={3}
                      />
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <SmartTextInput
                        label="Follow-up Plan"
                        value={encounterData.plan.follow_up}
                        onChange={(val) => updateField('plan', 'follow_up', val)}
                        placeholder="Next appointment, treatment frequency..."
                        quickPhrases={FOLLOW_UP_PHRASES}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Outcome Assessment Modal */}
      {showOutcomeAssessment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Outcome Assessment - {outcomeType}</h3>
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
                  const questions = outcomeType === 'ODI' ? 6 : outcomeType === 'NDI' ? 6 : 3;
                  const answered = Object.keys(responses).length;
                  const total = Object.values(responses).reduce((sum, val) => sum + val, 0);
                  const percentage = answered > 0 ? Math.round((total / (answered * 5)) * 100) : null;

                  setEncounterData(prev => ({
                    ...prev,
                    outcome_assessment: {
                      type: outcomeType,
                      responses,
                      score: percentage
                    }
                  }));
                }}
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowOutcomeAssessment(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Button */}
      {!showAIAssistant && (
        <button
          onClick={() => setShowAIAssistant(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all flex items-center justify-center"
          title="AI Clinical Assistant"
        >
          <Brain className="w-6 h-6" />
          <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300" />
        </button>
      )}

      {/* Template Picker Button */}
      {!showTemplatePicker && !showAIAssistant && (
        <button
          onClick={() => setShowTemplatePicker(true)}
          className="fixed bottom-6 left-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all flex items-center justify-center"
          title="Clinical Templates"
        >
          <BookOpen className="w-6 h-6" />
        </button>
      )}

      {/* Template Picker Sidebar */}
      <TemplatePicker
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelectTemplate={(text) => {
          // Insert into appropriate field based on active tab
          if (activeTab === 'subjective') {
            updateField('subjective', 'history', encounterData.subjective.history + '\n' + text);
          } else if (activeTab === 'objective') {
            updateField('objective', 'observation', encounterData.objective.observation + '\n' + text);
          } else if (activeTab === 'assessment') {
            updateField('assessment', 'clinical_reasoning', encounterData.assessment.clinical_reasoning + '\n' + text);
          } else if (activeTab === 'plan') {
            updateField('plan', 'treatment', encounterData.plan.treatment + '\n' + text);
          }
        }}
        soapSection={activeTab}
      />
    </div>
  );
}
