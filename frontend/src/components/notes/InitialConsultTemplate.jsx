/**
 * InitialConsultTemplate Component
 * Mal for forstegangskonsultasjon
 *
 * Template for initial consultation / first visit.
 * Orchestrator component that delegates rendering to:
 * - HistorySection: Demographics, Subjective, Medical History
 * - ExaminationSection: Objective (vitals, posture, neuro, palpation)
 * - PlanSection: Assessment, Diagnosis codes, Treatment plan
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Save, Lock, AlertTriangle, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import ICD10CodePicker from './ICD10CodePicker';
import HistorySection from './HistorySection';
import ExaminationSection from './ExaminationSection';
import PlanSection from './PlanSection';

import logger from '../../utils/logger';

/**
 * @param {Object} props
 * @param {Object} props.initialData - Initial note data
 * @param {Object} props.patient - Patient information
 * @param {Function} props.onSave - Callback when note is saved
 * @param {Function} props.onLock - Callback when note is locked/signed
 * @param {boolean} props.readOnly - Whether the note is read-only
 */
export default function InitialConsultTemplate({
  initialData,
  patient,
  onSave,
  onLock,
  readOnly = false,
}) {
  // Auto-save timer ref
  const autoSaveTimerRef = useRef(null);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // State for consultation data
  const [consultData, setConsultData] = useState(
    initialData || {
      demographics: {
        occupation: '',
        lifestyle: '',
        activityLevel: '',
        sleepQuality: '',
      },
      subjective: {
        chiefComplaint: '',
        historyOfPresentIllness: '',
        onsetDate: '',
        onsetCircumstances: '',
        painLocation: '',
        painIntensity: 0,
        painQuality: '',
        painRadiation: '',
        painPattern: '',
        aggravatingFactors: '',
        relievingFactors: '',
        functionalLimitations: '',
        previousEpisodes: '',
        previousTreatment: '',
        currentMedications: '',
        medicationAllergies: '',
      },
      medicalHistory: {
        pastMedicalHistory: '',
        surgicalHistory: '',
        familyHistory: '',
        socialHistory: '',
        redFlagScreening: {
          unexplainedWeightLoss: false,
          nightPain: false,
          fever: false,
          bladderDysfunction: false,
          bowelDysfunction: false,
          progressiveWeakness: false,
          saddleAnesthesia: false,
          recentTrauma: false,
          cancerHistory: false,
          immunocompromised: false,
        },
      },
      objective: {
        generalAppearance: '',
        gait: '',
        posture: '',
        vitalSigns: {
          bloodPressure: '',
          pulse: '',
          respiratoryRate: '',
          temperature: '',
          height: '',
          weight: '',
        },
        inspection: '',
        palpation: '',
        rangeOfMotion: '',
        neurologicalExam: {
          motorTesting: '',
          sensoryTesting: '',
          reflexes: '',
          cranialNerves: '',
        },
        orthopedicTests: '',
        specialTests: '',
        imaging: '',
      },
      assessment: {
        primaryDiagnosis: '',
        secondaryDiagnoses: [],
        differentialDiagnosis: '',
        clinicalImpression: '',
        redFlags: [],
        severity: '',
        prognosis: '',
        expectedRecoveryTime: '',
      },
      plan: {
        treatmentGoals: {
          shortTerm: '',
          longTerm: '',
        },
        proposedTreatment: '',
        treatmentFrequency: '',
        estimatedVisits: '',
        initialTreatment: '',
        exercises: '',
        patientEducation: '',
        lifestyleRecommendations: '',
        followUp: '',
        referrals: '',
        contraindications: '',
        informedConsent: false,
      },
      icd10_codes: [],
      icpc_codes: [],
      vas_pain_start: 0,
      vas_pain_end: null,
      duration_minutes: 60,
    }
  );

  const [expandedSections, setExpandedSections] = useState({
    demographics: true,
    subjective: true,
    medicalHistory: true,
    objective: true,
    assessment: true,
    plan: true,
    codes: true,
  });

  const [saving, setSaving] = useState(false);
  const [showCodePicker, setShowCodePicker] = useState(false);

  // Auto-save effect
  useEffect(() => {
    if (!hasChanges || readOnly) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        if (onSave) {
          await onSave({
            ...consultData,
            auto_save_data: consultData,
          });
          setLastAutoSave(new Date());
          setHasChanges(false);
        }
      } catch (error) {
        logger.error('Auto-save failed:', error);
      }
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [consultData, hasChanges, readOnly, onSave]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateField = useCallback(
    (section, field, value) => {
      if (readOnly) return;
      setConsultData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
      setHasChanges(true);
    },
    [readOnly]
  );

  const updateNestedField = useCallback(
    (section, parent, field, value) => {
      if (readOnly) return;
      setConsultData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [parent]: {
            ...prev[section][parent],
            [field]: value,
          },
        },
      }));
      setHasChanges(true);
    },
    [readOnly]
  );

  const updateRootField = useCallback(
    (field, value) => {
      if (readOnly) return;
      setConsultData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setHasChanges(true);
    },
    [readOnly]
  );

  const addRedFlag = (flag) => {
    if (readOnly || !flag) return;
    setConsultData((prev) => ({
      ...prev,
      assessment: {
        ...prev.assessment,
        redFlags: [...(prev.assessment.redFlags || []), flag],
      },
    }));
    setHasChanges(true);
  };

  const removeRedFlag = (index) => {
    if (readOnly) return;
    setConsultData((prev) => ({
      ...prev,
      assessment: {
        ...prev.assessment,
        redFlags: prev.assessment.redFlags.filter((_, i) => i !== index),
      },
    }));
    setHasChanges(true);
  };

  const handleCodeSelect = (code) => {
    if (readOnly) return;
    setConsultData((prev) => ({
      ...prev,
      icd10_codes: [...(prev.icd10_codes || []), code.code],
    }));
    setHasChanges(true);
  };

  const removeCode = (codeToRemove) => {
    if (readOnly) return;
    setConsultData((prev) => ({
      ...prev,
      icd10_codes: prev.icd10_codes.filter((code) => code !== codeToRemove),
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (onSave) {
        await onSave(consultData);
        setHasChanges(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLock = async () => {
    if (onLock) {
      await onLock(consultData);
    }
  };

  // Shared UI sub-components passed as props to child sections
  const Section = ({ id, title, icon: Icon, color, children }) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
      <button
        onClick={() => toggleSection(id)}
        className={`w-full flex items-center justify-between p-4 bg-${color}-50 border-b border-${color}-100`}
        aria-expanded={expandedSections[id]}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-${color}-100 flex items-center justify-center`}>
            <Icon className={`w-4 h-4 text-${color}-600`} />
          </div>
          <h3 className={`font-semibold text-${color}-900`}>{title}</h3>
        </div>
        {expandedSections[id] ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {expandedSections[id] && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );

  const TextField = ({ label, value, onChange, rows = 2, placeholder, required = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        disabled={readOnly}
        aria-label={label}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
      />
    </div>
  );

  const InputField = ({ label, value, onChange, type = 'text', placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={readOnly}
        aria-label={label}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
      />
    </div>
  );

  const Checkbox = ({ label, checked, onChange, warning = false }) => (
    <label
      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
        checked
          ? warning
            ? 'bg-red-50 border border-red-200'
            : 'bg-blue-50 border border-blue-200'
          : 'hover:bg-gray-50'
      }`}
    >
      <input
        type="checkbox"
        checked={checked || false}
        onChange={(e) => onChange(e.target.checked)}
        disabled={readOnly}
        className="rounded border-gray-300"
      />
      <span
        className={`text-sm ${checked && warning ? 'text-red-700 font-medium' : 'text-gray-700'}`}
      >
        {label}
      </span>
      {checked && warning && <AlertTriangle className="w-4 h-4 text-red-500" />}
    </label>
  );

  // Shared props for child sections
  const sharedProps = {
    consultData,
    updateField,
    updateNestedField,
    updateRootField,
    readOnly,
    Section,
    TextField,
    InputField,
    Checkbox,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Forstegangskonsultasjon</h2>
          {patient && (
            <p className="text-sm text-gray-500 mt-0.5">
              {patient.firstName || patient.first_name} {patient.lastName || patient.last_name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastAutoSave && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Autolagret{' '}
              {lastAutoSave.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {hasChanges && !readOnly && (
            <span className="text-xs text-yellow-600">Ulagrede endringer</span>
          )}
          {!readOnly && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Lagrer...' : 'Lagre'}
              </button>
              <button
                onClick={handleLock}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Lock className="w-4 h-4" />
                Signer og las
              </button>
            </>
          )}
        </div>
      </div>

      <HistorySection {...sharedProps} />

      <ExaminationSection {...sharedProps} />

      <PlanSection
        {...sharedProps}
        addRedFlag={addRedFlag}
        removeRedFlag={removeRedFlag}
        handleCodeSelect={handleCodeSelect}
        removeCode={removeCode}
        showCodePicker={showCodePicker}
        setShowCodePicker={setShowCodePicker}
      />

      {/* ICD-10 Code Picker Modal */}
      {showCodePicker && (
        <ICD10CodePicker
          onSelect={handleCodeSelect}
          onClose={() => setShowCodePicker(false)}
          selectedCodes={consultData.icd10_codes || []}
        />
      )}
    </div>
  );
}
