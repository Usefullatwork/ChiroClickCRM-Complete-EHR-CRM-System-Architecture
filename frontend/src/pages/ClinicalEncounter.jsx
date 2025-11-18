import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { encountersAPI, patientsAPI, diagnosisAPI, treatmentsAPI } from '../services/api';
import { formatDate } from '../lib/utils';
import { Save, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ClinicalEncounter() {
  const { patientId, encounterId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('subjective');
  const [redFlagAlerts, setRedFlagAlerts] = useState([]);
  const [clinicalWarnings, setClinicalWarnings] = useState([]);

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
                  value={encounterData.subjective.history}
                  onChange={(e) => updateField('subjective', 'history', e.target.value)}
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
    </div>
  );
}
