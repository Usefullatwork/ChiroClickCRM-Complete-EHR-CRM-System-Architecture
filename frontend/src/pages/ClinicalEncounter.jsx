import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { encountersAPI, patientsAPI, diagnosisAPI, treatmentsAPI, aiAPI } from '../services/api';
import { formatDate } from '../lib/utils';
import { Save, FileText, AlertTriangle, CheckCircle, Brain, X, Sparkles, BookOpen } from 'lucide-react';
import TemplatePicker from '../components/TemplatePicker';

export default function ClinicalEncounter() {
  const { patientId, encounterId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('subjective');
  const [redFlagAlerts, setRedFlagAlerts] = useState([]);
  const [clinicalWarnings, setClinicalWarnings] = useState([]);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const textAreaRefs = useRef({});

  // Form state - SOAP format
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
    vas_pain_start: null,
    vas_pain_end: null
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
    enabled: !!encounterId,
    onSuccess: (data) => {
      if (data) {
        setEncounterData({
          ...encounterData,
          ...data.data,
          encounter_date: new Date(data.data.encounter_date).toISOString().split('T')[0]
        });
        setRedFlagAlerts(data.data.redFlagAlerts || []);
        setClinicalWarnings(data.data.clinicalWarnings || []);
      }
    }
  });

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

  // Save encounter mutation
  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (encounterId) {
        return encountersAPI.update(encounterId, data);
      }
      return encountersAPI.create(data);
    },
    onSuccess: (response) => {
      alert('Encounter saved successfully!');
      if (!encounterId) {
        navigate(`/patients/${patientId}/encounter/${response.data.id}`);
      }
    },
    onError: (error) => {
      alert(`Error saving encounter: ${error.message}`);
    }
  });

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

  const getAISuggestions = async () => {
    setAiLoading(true);
    try {
      // Prepare SOAP data for AI analysis
      const soapData = {
        subjective: encounterData.subjective,
        objective: encounterData.objective,
        assessment: encounterData.assessment,
        icpc_codes: encounterData.icpc_codes
      };

      // Call AI API endpoint for diagnosis suggestions
      const [diagnosisResponse, redFlagResponse] = await Promise.allSettled([
        aiAPI.suggestDiagnosis(soapData),
        aiAPI.analyzeRedFlags(
          {
            age: patient?.data?.date_of_birth
              ? Math.floor((new Date() - new Date(patient.data.date_of_birth)) / 31557600000)
              : null,
            gender: patient?.data?.gender,
            medical_history: patient?.data?.medical_history,
            current_medications: patient?.data?.current_medications,
            red_flags: patient?.data?.red_flags,
            contraindications: patient?.data?.contraindications
          },
          soapData
        )
      ]);

      // Build suggestions from API responses
      const suggestions = {
        diagnosis: [],
        treatment: [],
        followUp: [],
        clinicalReasoning: ''
      };

      // Process diagnosis suggestions
      if (diagnosisResponse.status === 'fulfilled' && diagnosisResponse.value?.data) {
        const diagData = diagnosisResponse.value.data;
        suggestions.diagnosis = diagData.codes || [];
        suggestions.clinicalReasoning = diagData.reasoning || diagData.suggestion || '';
      }

      // Process red flag analysis
      if (redFlagResponse.status === 'fulfilled' && redFlagResponse.value?.data) {
        const redFlagData = redFlagResponse.value.data;
        if (redFlagData.recommendReferral) {
          suggestions.followUp.push(`⚠️ ${redFlagData.analysis}`);
        }
        if (redFlagData.riskLevel && redFlagData.riskLevel !== 'LOW') {
          suggestions.clinicalReasoning += `\n\nRisk Level: ${redFlagData.riskLevel}`;
        }
      }

      // If AI service is unavailable, fall back to mock suggestions
      if (suggestions.diagnosis.length === 0 && !suggestions.clinicalReasoning) {
        const context = {
          subjective: encounterData.subjective,
          objective: encounterData.objective,
          patient_age: patient?.data?.date_of_birth
            ? Math.floor((new Date() - new Date(patient.data.date_of_birth)) / 31557600000)
            : null,
          patient_gender: patient?.data?.gender,
          existing_diagnoses: encounterData.icpc_codes
        };
        const mockSuggestions = generateMockSuggestions(context);
        Object.assign(suggestions, mockSuggestions);
      }

      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('AI suggestion error:', error);
      // Fallback to mock suggestions on error
      const context = {
        subjective: encounterData.subjective,
        objective: encounterData.objective,
        patient_age: patient?.data?.date_of_birth
          ? Math.floor((new Date() - new Date(patient.data.date_of_birth)) / 31557600000)
          : null,
        patient_gender: patient?.data?.gender,
        existing_diagnoses: encounterData.icpc_codes
      };
      setAiSuggestions(generateMockSuggestions(context));
    } finally {
      setAiLoading(false);
    }
  };

  const generateMockSuggestions = (context) => {
    // Mock AI suggestions - replace with actual AI API call
    const suggestions = {
      diagnosis: [],
      treatment: [],
      followUp: [],
      clinicalReasoning: ''
    };

    // Simple rule-based suggestions
    const complaint = context.subjective.chief_complaint?.toLowerCase() || '';
    const history = context.subjective.history?.toLowerCase() || '';
    const combined = complaint + ' ' + history;

    if (combined.includes('back') || combined.includes('rygg')) {
      suggestions.diagnosis.push('L03 - Lumbago (korsryggsmerter)');
      suggestions.diagnosis.push('L86 - Degenerative forandringer rygg');
      suggestions.treatment.push('HVLA manipulasjon lumbale columna');
      suggestions.treatment.push('Myofascial release m. erector spinae');
      suggestions.followUp.push('Re-evaluate in 1 week');
      suggestions.clinicalReasoning = 'Based on lumbar pain presentation, consider mechanical lower back pain. Rule out red flags such as cauda equina, fracture, or infection.';
    }

    if (combined.includes('neck') || combined.includes('nakke')) {
      suggestions.diagnosis.push('L01 - Nakkesmerter');
      suggestions.treatment.push('Cervical mobilisering');
      suggestions.treatment.push('Bløtvevsbehandling trapezius');
      suggestions.followUp.push('Home exercises for cervical stability');
      suggestions.clinicalReasoning = 'Neck pain presentation suggests cervical facet dysfunction or muscle tension. Assess for radiculopathy.';
    }

    if (combined.includes('headache') || combined.includes('hodepine')) {
      suggestions.diagnosis.push('N01 - Hodepine');
      suggestions.diagnosis.push('N03 - Cerv  ikogen hodepine');
      suggestions.treatment.push('Occipital release');
      suggestions.treatment.push('C1-C2 mobilisering');
      suggestions.clinicalReasoning = 'Consider cervicogenic vs tension-type headache. Rule out serious pathology.';
    }

    if (suggestions.diagnosis.length === 0) {
      suggestions.clinicalReasoning = 'Insufficient data for AI suggestions. Please complete subjective and objective findings.';
    }

    return suggestions;
  };

  const handleTemplateSelect = (templateText) => {
    if (!activeField) {
      // If no field is active, just append to the current section's history
      const section = activeTab;
      if (section === 'subjective') {
        setEncounterData(prev => ({
          ...prev,
          subjective: {
            ...prev.subjective,
            history: (prev.subjective.history || '') + '\n' + templateText
          }
        }));
      } else if (section === 'objective') {
        setEncounterData(prev => ({
          ...prev,
          objective: {
            ...prev.objective,
            observation: (prev.objective.observation || '') + '\n' + templateText
          }
        }));
      }
      return;
    }

    // Insert template at cursor position
    const [section, field] = activeField.split('.');
    const currentValue = encounterData[section][field] || '';
    const textarea = textAreaRefs.current[activeField];

    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const newValue = currentValue.slice(0, cursorPos) + templateText + currentValue.slice(cursorPos);

      setEncounterData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newValue
        }
      }));

      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorPos + templateText.length, cursorPos + templateText.length);
      }, 0);
    } else {
      // Fallback: append to end
      setEncounterData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: currentValue + '\n' + templateText
        }
      }));
    }
  };

  const tabs = [
    { id: 'subjective', label: 'S - Subjective', icon: '💬' },
    { id: 'objective', label: 'O - Objective', icon: '🔍' },
    { id: 'assessment', label: 'A - Assessment', icon: '📋' },
    { id: 'plan', label: 'P - Plan', icon: '📝' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clinical Encounter</h1>
            {patient?.data && (
              <p className="text-gray-600 mt-1">
                Patient: {patient.data.first_name} {patient.data.last_name} (Age: {patient.data.date_of_birth ? Math.floor((new Date() - new Date(patient.data.date_of_birth)) / 31557600000) : 'N/A'})
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/patients/${patientId}`)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveMutation.isLoading}
              className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={20} />
              {saveMutation.isLoading ? 'Saving...' : 'Save Encounter'}
            </button>
          </div>
        </div>

        {/* Alerts */}
        {redFlagAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="text-red-600 mr-3 mt-1" size={20} />
              <div>
                <h3 className="text-red-800 font-semibold mb-2">Red Flag Alerts</h3>
                <ul className="list-disc list-inside text-red-700">
                  {redFlagAlerts.map((alert, i) => <li key={i}>{alert}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {clinicalWarnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="text-yellow-600 mr-3 mt-1" size={20} />
              <div>
                <h3 className="text-yellow-800 font-semibold mb-2">Clinical Warnings</h3>
                <ul className="list-disc list-inside text-yellow-700">
                  {clinicalWarnings.map((warning, i) => <li key={i}>{warning}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Encounter Metadata */}
        <div className="grid grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow-sm mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={encounterData.encounter_date}
              onChange={(e) => setEncounterData(prev => ({ ...prev, encounter_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={encounterData.encounter_type}
              onChange={(e) => setEncounterData(prev => ({ ...prev, encounter_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="INITIAL">Initial Visit</option>
              <option value="FOLLOWUP">Follow-up</option>
              <option value="REEXAM">Re-examination</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
            <input
              type="number"
              value={encounterData.duration_minutes}
              onChange={(e) => setEncounterData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">VAS Pain (Start)</label>
            <input
              type="number"
              min="0"
              max="10"
              value={encounterData.vas_pain_start || ''}
              onChange={(e) => setEncounterData(prev => ({ ...prev, vas_pain_start: e.target.value ? parseInt(e.target.value) : null }))}
              placeholder="0-10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* SOAP Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Subjective Tab */}
          {activeTab === 'subjective' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chief Complaint</label>
                <input
                  type="text"
                  value={encounterData.subjective.chief_complaint}
                  onChange={(e) => updateField('subjective', 'chief_complaint', e.target.value)}
                  placeholder="e.g., Lower back pain"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">History / Anamnesis</label>
                <textarea
                  ref={(el) => textAreaRefs.current['subjective.history'] = el}
                  value={encounterData.subjective.history}
                  onChange={(e) => updateField('subjective', 'history', e.target.value)}
                  onFocus={() => setActiveField('subjective.history')}
                  rows={3}
                  placeholder="Patient's description of symptoms, when they started, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Onset</label>
                  <input
                    type="text"
                    value={encounterData.subjective.onset}
                    onChange={(e) => updateField('subjective', 'onset', e.target.value)}
                    placeholder="e.g., 2 weeks ago, gradual"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pain Description</label>
                  <input
                    type="text"
                    value={encounterData.subjective.pain_description}
                    onChange={(e) => updateField('subjective', 'pain_description', e.target.value)}
                    placeholder="e.g., Sharp, dull, radiating"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aggravating Factors</label>
                  <input
                    type="text"
                    value={encounterData.subjective.aggravating_factors}
                    onChange={(e) => updateField('subjective', 'aggravating_factors', e.target.value)}
                    placeholder="e.g., Sitting, bending forward"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Relieving Factors</label>
                  <input
                    type="text"
                    value={encounterData.subjective.relieving_factors}
                    onChange={(e) => updateField('subjective', 'relieving_factors', e.target.value)}
                    placeholder="e.g., Rest, heat"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Objective Tab */}
          {activeTab === 'objective' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observation</label>
                <textarea
                  value={encounterData.objective.observation}
                  onChange={(e) => updateField('objective', 'observation', e.target.value)}
                  rows={2}
                  placeholder="Visual observations, gait, posture"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Palpation Findings</label>
                <textarea
                  value={encounterData.objective.palpation}
                  onChange={(e) => updateField('objective', 'palpation', e.target.value)}
                  rows={2}
                  placeholder="Tenderness, muscle tension, trigger points"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Range of Motion (ROM)</label>
                <textarea
                  value={encounterData.objective.rom}
                  onChange={(e) => updateField('objective', 'rom', e.target.value)}
                  rows={2}
                  placeholder="e.g., Lumbar flexion 60°, reduced right rotation"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Orthopedic Tests</label>
                  <textarea
                    value={encounterData.objective.ortho_tests}
                    onChange={(e) => updateField('objective', 'ortho_tests', e.target.value)}
                    rows={3}
                    placeholder="e.g., SLR negative, Kemp's positive on right"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Neurological Tests</label>
                  <textarea
                    value={encounterData.objective.neuro_tests}
                    onChange={(e) => updateField('objective', 'neuro_tests', e.target.value)}
                    rows={3}
                    placeholder="e.g., Reflexes intact, sensation normal"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Assessment Tab */}
          {activeTab === 'assessment' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis (ICPC-2)</label>
                <div className="mb-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addDiagnosisCode(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a common diagnosis...</option>
                    {commonDiagnoses?.data?.map(code => (
                      <option key={code.code} value={code.code}>
                        {code.code} - {code.description_no}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  {encounterData.icpc_codes.map(code => (
                    <span
                      key={code}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {code}
                      <button
                        onClick={() => removeDiagnosisCode(code)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Clinical Reasoning</label>
                <textarea
                  value={encounterData.assessment.clinical_reasoning}
                  onChange={(e) => updateField('assessment', 'clinical_reasoning', e.target.value)}
                  rows={3}
                  placeholder="Your clinical reasoning for the diagnosis"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Differential Diagnosis</label>
                <input
                  type="text"
                  value={encounterData.assessment.differential_diagnosis}
                  onChange={(e) => updateField('assessment', 'differential_diagnosis', e.target.value)}
                  placeholder="Other possible diagnoses considered"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prognosis</label>
                <input
                  type="text"
                  value={encounterData.assessment.prognosis}
                  onChange={(e) => updateField('assessment', 'prognosis', e.target.value)}
                  placeholder="e.g., Good, expected recovery in 4-6 weeks"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Plan Tab */}
          {activeTab === 'plan' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Performed</label>
                <textarea
                  value={encounterData.plan.treatment}
                  onChange={(e) => updateField('plan', 'treatment', e.target.value)}
                  rows={3}
                  placeholder="e.g., HVLA manipulation L4-L5, soft tissue therapy"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Home Exercises / Advice</label>
                <textarea
                  value={encounterData.plan.exercises}
                  onChange={(e) => updateField('plan', 'exercises', e.target.value)}
                  rows={3}
                  placeholder="Exercises prescribed, lifestyle advice"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Plan</label>
                <input
                  type="text"
                  value={encounterData.plan.follow_up}
                  onChange={(e) => updateField('plan', 'follow_up', e.target.value)}
                  placeholder="e.g., Re-evaluate in 1 week, 3 more visits recommended"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">VAS Pain (End of Treatment)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={encounterData.vas_pain_end || ''}
                  onChange={(e) => setEncounterData(prev => ({ ...prev, vas_pain_end: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="0-10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant Floating Button */}
      {!showAIAssistant && (
        <button
          onClick={() => setShowAIAssistant(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all flex items-center justify-center group"
          title="AI Clinical Assistant"
        >
          <Brain className="w-6 h-6" />
          <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300" />
        </button>
      )}

      {/* AI Assistant Panel */}
      {showAIAssistant && (
        <div className="fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Brain className="w-5 h-5" />
              <h3 className="font-semibold">AI Clinical Assistant</h3>
            </div>
            <button
              onClick={() => setShowAIAssistant(false)}
              className="text-white hover:bg-purple-800 rounded p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {!aiSuggestions ? (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-4">
                  Get AI-powered clinical suggestions based on your SOAP notes
                </p>
                <button
                  onClick={getAISuggestions}
                  disabled={aiLoading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {aiLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Get AI Suggestions
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Clinical Reasoning */}
                {aiSuggestions.clinicalReasoning && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Clinical Reasoning</h4>
                    <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded-lg">
                      {aiSuggestions.clinicalReasoning}
                    </p>
                  </div>
                )}

                {/* Diagnosis Suggestions */}
                {aiSuggestions.diagnosis.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Suggested Diagnoses</h4>
                    <ul className="space-y-2">
                      {aiSuggestions.diagnosis.map((diag, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-700 bg-blue-50 px-3 py-2 rounded-lg flex items-start gap-2"
                        >
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{diag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Treatment Suggestions */}
                {aiSuggestions.treatment.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Suggested Treatments</h4>
                    <ul className="space-y-2">
                      {aiSuggestions.treatment.map((treatment, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-700 bg-green-50 px-3 py-2 rounded-lg flex items-start gap-2"
                        >
                          <span className="text-green-600 mt-0.5">•</span>
                          <span>{treatment}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Follow-up Suggestions */}
                {aiSuggestions.followUp.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Follow-up Recommendations</h4>
                    <ul className="space-y-2">
                      {aiSuggestions.followUp.map((followUp, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-700 bg-yellow-50 px-3 py-2 rounded-lg flex items-start gap-2"
                        >
                          <span className="text-yellow-600 mt-0.5">•</span>
                          <span>{followUp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Refresh Button */}
                <button
                  onClick={getAISuggestions}
                  disabled={aiLoading}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium"
                >
                  {aiLoading ? 'Analyzing...' : 'Refresh Suggestions'}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              AI suggestions are for reference only. Always use clinical judgment.
            </p>
          </div>
        </div>
      )}

      {/* Template Picker Floating Button */}
      {!showTemplatePicker && !showAIAssistant && (
        <button
          onClick={() => setShowTemplatePicker(true)}
          className="fixed bottom-6 left-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all flex items-center justify-center group"
          title="Kliniske Maler"
        >
          <BookOpen className="w-6 h-6" />
        </button>
      )}

      {/* Template Picker Sidebar */}
      <TemplatePicker
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelectTemplate={handleTemplateSelect}
        soapSection={activeTab}
      />
    </div>
  );
}
