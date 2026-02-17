import _React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, Save, Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { TextArea } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { useCreateEncounter } from '../../hooks/useEncounters';
import { useChiropracticCodes } from '../../hooks/useCodes';
import toast from '../../utils/toast';

const QUICK_TEXT_PRESETS = {
  subjective: [
    'Reports improved ROM.',
    'Pain level 4/10.',
    'Stiffness in morning.',
    'Radiating pain to left leg.',
    'Headache reduced.',
  ],
  objective: [
    'Cervical compression +',
    'SLR Negative',
    'Kemps Positive (L)',
    'Hypertonic Trapezius',
    'Reduced Flexion L-spine',
  ],
  plan: [
    'Continue treatment plan',
    'Re-eval in 6 visits',
    'Home exercises: Cat-Camel',
    'Ice pack 20min',
  ],
};

const TREATMENT_CODES = [
  { code: 'L214', label: 'Consultation/Treatment', price: 480 },
  { code: 'L215', label: 'Extended Treatment', price: 650 },
  { code: 'T10', label: 'Tape/Medical Supplies', price: 100 },
];

export const SoapNoteBuilder = ({ patient, onCancel, onSave }) => {
  const [activeTab, setActiveTab] = useState('S');
  const [note, setNote] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    diagnosisCodes: [],
    treatmentCodes: [],
  });
  const [painScore, setPainScore] = useState(0);
  const [errors, setErrors] = useState({});

  // Hooks
  const createEncounter = useCreateEncounter();
  const { data: diagnosisCodes = [], isLoading: codesLoading } = useChiropracticCodes();

  const addQuickText = (field, text) => {
    setNote((prev) => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]}\n${text}` : text,
    }));
  };

  const toggleDiagnosis = (code) => {
    setNote((prev) => ({
      ...prev,
      diagnosisCodes: prev.diagnosisCodes.includes(code)
        ? prev.diagnosisCodes.filter((c) => c !== code)
        : [...prev.diagnosisCodes, code],
    }));
  };

  const toggleTreatment = (code) => {
    setNote((prev) => ({
      ...prev,
      treatmentCodes: prev.treatmentCodes.includes(code)
        ? prev.treatmentCodes.filter((c) => c !== code)
        : [...prev.treatmentCodes, code],
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!note.subjective.trim()) {
      newErrors.subjective = 'Subjective findings are required';
    }
    if (!note.objective.trim()) {
      newErrors.objective = 'Objective findings are required';
    }
    if (note.diagnosisCodes.length === 0) {
      newErrors.diagnosisCodes = 'At least one diagnosis code is required';
    }
    if (note.treatmentCodes.length === 0) {
      newErrors.treatmentCodes = 'At least one treatment code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (_signNow = false) => {
    if (!validate()) {
      toast.warning('Please complete all required fields');
      return;
    }

    try {
      const encounterData = {
        patientId: patient.id,
        encounterType: 'Chiropractic Adjustment',
        encounterDate: new Date().toISOString(),
        subjective: DOMPurify.sanitize(note.subjective),
        objective: DOMPurify.sanitize(note.objective),
        assessment: DOMPurify.sanitize(note.assessment),
        plan: DOMPurify.sanitize(note.plan),
        diagnosisCodes: note.diagnosisCodes,
        treatmentCodes: note.treatmentCodes,
        metadata: {
          painScore: painScore,
        },
      };

      await createEncounter.mutateAsync(encounterData);

      if (onSave) {
        onSave();
      }
      onCancel();
    } catch (error) {
      toast.error(`Failed to save encounter: ${error.message}`);
    }
  };

  const totalPrice = note.treatmentCodes.reduce((sum, code) => {
    const treatment = TREATMENT_CODES.find((t) => t.code === code);
    return sum + (treatment?.price || 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Clinical Encounter</h2>
            <p className="text-sm text-slate-500">
              {patient.name} - {new Date().toLocaleDateString('no-NO')}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Red Flags Alert */}
            {patient.alerts && patient.alerts.length > 0 && (
              <Alert variant="danger" className="mr-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span className="font-bold">Alerts: {patient.alerts.join(', ')}</span>
                </div>
              </Alert>
            )}
            <Button variant="ghost" onClick={onCancel}>
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Quick Tools Sidebar */}
          <div className="w-64 border-r border-slate-200 bg-slate-50 p-4 overflow-y-auto hidden md:block">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Quick Phrases
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-teal-800 mb-2">Subjective</h4>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TEXT_PRESETS.subjective.map((text, i) => (
                    <button
                      key={i}
                      onClick={() => addQuickText('subjective', text)}
                      className="text-xs bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50 px-2 py-1 rounded text-left transition-colors"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-teal-800 mb-2">Objective</h4>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TEXT_PRESETS.objective.map((text, i) => (
                    <button
                      key={i}
                      onClick={() => addQuickText('objective', text)}
                      className="text-xs bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50 px-2 py-1 rounded text-left transition-colors"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-teal-800 mb-2">Plan</h4>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TEXT_PRESETS.plan.map((text, i) => (
                    <button
                      key={i}
                      onClick={() => addQuickText('plan', text)}
                      className="text-xs bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50 px-2 py-1 rounded text-left transition-colors"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col">
            {/* SOAP Tabs */}
            <div className="flex border-b border-slate-200">
              {[
                { key: 'S', label: 'Subjective' },
                { key: 'O', label: 'Objective' },
                { key: 'A', label: 'Assessment' },
                { key: 'P', label: 'Plan' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-teal-600 text-teal-700 bg-teal-50'
                      : 'border-transparent text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                  {errors[tab.key.toLowerCase()] && <span className="ml-2 text-red-500">*</span>}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'S' && (
                <div className="space-y-4">
                  <TextArea
                    label="Patient Complaints & History"
                    value={note.subjective}
                    onChange={(e) => setNote({ ...note, subjective: e.target.value })}
                    rows={12}
                    error={errors.subjective}
                    placeholder="Type or use quick phrases..."
                    className="font-mono text-sm"
                    required
                  />

                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Pain Scale (VAS 0-10)</h4>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={painScore}
                      onChange={(e) => setPainScore(parseInt(e.target.value))}
                      className="w-full accent-teal-600"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>0 - No pain</span>
                      <span className="font-bold text-lg">{painScore}/10</span>
                      <span>10 - Worst pain</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'O' && (
                <div className="space-y-4">
                  <TextArea
                    label="Clinical Findings & Examination"
                    value={note.objective}
                    onChange={(e) => setNote({ ...note, objective: e.target.value })}
                    rows={12}
                    error={errors.objective}
                    placeholder="Document objective findings..."
                    className="font-mono text-sm"
                    required
                  />
                </div>
              )}

              {activeTab === 'A' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Diagnosis (ICPC-2){' '}
                      {errors.diagnosisCodes && <span className="text-red-500">*</span>}
                    </label>
                    {codesLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="animate-spin text-teal-600" size={24} />
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-lg p-2 max-h-64 overflow-y-auto">
                        {diagnosisCodes.map((code) => (
                          <label
                            key={code.code}
                            className="flex items-center p-2 hover:bg-slate-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              className="rounded text-teal-600 focus:ring-teal-500 mr-3"
                              checked={note.diagnosisCodes.includes(code.code)}
                              onChange={() => toggleDiagnosis(code.code)}
                            />
                            <span className="font-mono text-teal-700 w-12">{code.code}</span>
                            <span className="text-sm text-slate-700">{code.description}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {errors.diagnosisCodes && (
                      <p className="text-sm text-red-600 mt-1">{errors.diagnosisCodes}</p>
                    )}
                  </div>

                  <TextArea
                    label="Assessment Notes"
                    value={note.assessment}
                    onChange={(e) => setNote({ ...note, assessment: e.target.value })}
                    rows={6}
                    placeholder="Clinical assessment and reasoning..."
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {activeTab === 'P' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Treatment Codes (Takster){' '}
                      {errors.treatmentCodes && <span className="text-red-500">*</span>}
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {TREATMENT_CODES.map((t) => (
                        <div
                          key={t.code}
                          onClick={() => toggleTreatment(t.code)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            note.treatmentCodes.includes(t.code)
                              ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900">{t.code}</span>
                            <span className="text-sm font-medium text-slate-600">{t.price} kr</span>
                          </div>
                          <div className="text-xs text-slate-500">{t.label}</div>
                        </div>
                      ))}
                    </div>
                    {errors.treatmentCodes && (
                      <p className="text-sm text-red-600">{errors.treatmentCodes}</p>
                    )}
                  </div>

                  <TextArea
                    label="Plan & Home Advice"
                    value={note.plan}
                    onChange={(e) => setNote({ ...note, plan: e.target.value })}
                    rows={6}
                    placeholder="Treatment plan and patient instructions..."
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <div className="text-sm text-slate-600">
                {totalPrice > 0 && (
                  <span>
                    Total: <strong>{totalPrice.toLocaleString('no-NO')} kr</strong>
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onCancel} disabled={createEncounter.isLoading}>
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  icon={Save}
                  onClick={() => handleSave(false)}
                  disabled={createEncounter.isLoading}
                  loading={createEncounter.isLoading}
                >
                  Save Draft
                </Button>
                <Button
                  icon={CheckCircle2}
                  onClick={() => handleSave(true)}
                  disabled={createEncounter.isLoading}
                  loading={createEncounter.isLoading}
                >
                  Sign & Complete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoapNoteBuilder;
