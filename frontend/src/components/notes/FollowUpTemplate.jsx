/**
 * FollowUpTemplate Component
 * Mal for oppfolgingskonsultasjon
 *
 * Template for follow-up consultation / return visit
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  User,
  Stethoscope,
  ClipboardCheck,
  Target,
  Save,
  Lock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  CheckCircle,
} from 'lucide-react';
import ICD10CodePicker from './ICD10CodePicker';

import logger from '../../utils/logger';
/**
 * FollowUpTemplate Component
 * Oppfolgingskonsultasjon-mal med fokus pa fremgang
 *
 * @param {Object} props - Component props
 * @param {Object} props.initialData - Initial note data
 * @param {Object} props.patient - Patient information
 * @param {Function} props.onSave - Callback when note is saved
 * @param {Function} props.onLock - Callback when note is locked/signed
 * @param {boolean} props.readOnly - Whether the note is read-only
 * @returns {JSX.Element} Follow-up consultation template component
 */
export default function FollowUpTemplate({
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

  // State for follow-up data
  // Tilstand for oppfolgingsdata
  const [followUpData, setFollowUpData] = useState(
    initialData || {
      // Tidligere konsultasjon referanse / Previous consultation reference
      previousConsultation: {
        date: '',
        treatmentGiven: '',
        recommendations: '',
      },
      // Subjektiv - Fremgang siden sist / Subjective - Progress since last visit
      subjective: {
        overallProgress: '', // improved, same, worse
        progressDescription: '',
        chiefComplaint: '',
        currentPainIntensity: 0,
        comparedToLastVisit: '', // better, same, worse
        functionalChanges: '',
        complianceWithExercises: '', // excellent, good, fair, poor
        complianceNotes: '',
        newSymptoms: '',
        sideEffects: '',
        questionsOrConcerns: '',
      },
      // Objektiv - Endringer i funn / Objective - Changes in findings
      objective: {
        generalObservation: '',
        posturalChanges: '',
        rangeOfMotionChanges: '',
        palpationFindings: '',
        neurologicalStatus: '',
        functionalTests: '',
        comparisonToPrevious: '',
      },
      // Vurdering - Oppdatert status / Assessment - Updated status
      assessment: {
        progressAssessment: '', // on_track, slower_than_expected, faster_than_expected, no_progress
        responseToTreatment: '',
        diagnosisUpdate: '',
        clinicalReasoning: '',
        redFlags: [],
        prognosis: '',
        revisedExpectations: '',
      },
      // Plan - Videre behandling / Plan - Continued treatment
      plan: {
        treatmentToday: '',
        techniqueModifications: '',
        updatedExercises: '',
        patientEducation: '',
        homeAdvice: '',
        nextAppointment: '',
        treatmentPlanAdjustments: '',
        referrals: '',
        dischargeConsideration: false,
        dischargeNotes: '',
      },
      // Diagnosekoder / Diagnosis codes
      icd10_codes: [],
      icpc_codes: [],
      // Metadata
      vas_pain_start: 0,
      vas_pain_end: 0,
      duration_minutes: 30,
      visit_number: 2,
    }
  );

  const [expandedSections, setExpandedSections] = useState({
    progress: true,
    subjective: true,
    objective: true,
    assessment: true,
    plan: true,
    codes: true,
  });

  const [saving, setSaving] = useState(false);
  const [showCodePicker, setShowCodePicker] = useState(false);

  /**
   * Auto-save effect
   * Auto-lagring effekt
   */
  useEffect(() => {
    if (!hasChanges || readOnly) {
      return;
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for auto-save (30 seconds)
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        if (onSave) {
          await onSave({
            ...followUpData,
            auto_save_data: followUpData,
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
  }, [followUpData, hasChanges, readOnly, onSave]);

  /**
   * Toggle section expansion
   * Veksle seksjonsutviding
   */
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  /**
   * Update field with change tracking
   * Oppdater felt med endringsregistrering
   */
  const updateField = useCallback(
    (section, field, value) => {
      if (readOnly) {
        return;
      }
      setFollowUpData((prev) => ({
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

  /**
   * Update root level field
   * Oppdater rotnivafeld
   */
  const updateRootField = useCallback(
    (field, value) => {
      if (readOnly) {
        return;
      }
      setFollowUpData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setHasChanges(true);
    },
    [readOnly]
  );

  /**
   * Add red flag
   * Legg til rodt flagg
   */
  const addRedFlag = (flag) => {
    if (readOnly || !flag) {
      return;
    }
    setFollowUpData((prev) => ({
      ...prev,
      assessment: {
        ...prev.assessment,
        redFlags: [...(prev.assessment.redFlags || []), flag],
      },
    }));
    setHasChanges(true);
  };

  /**
   * Remove red flag
   * Fjern rodt flagg
   */
  const removeRedFlag = (index) => {
    if (readOnly) {
      return;
    }
    setFollowUpData((prev) => ({
      ...prev,
      assessment: {
        ...prev.assessment,
        redFlags: prev.assessment.redFlags.filter((_, i) => i !== index),
      },
    }));
    setHasChanges(true);
  };

  /**
   * Handle ICD-10 code selection
   * Handter ICD-10 kodevalg
   */
  const handleCodeSelect = (code) => {
    if (readOnly) {
      return;
    }
    setFollowUpData((prev) => ({
      ...prev,
      icd10_codes: [...(prev.icd10_codes || []), code.code],
    }));
    setHasChanges(true);
  };

  /**
   * Remove ICD-10 code
   * Fjern ICD-10 kode
   */
  const removeCode = (codeToRemove) => {
    if (readOnly) {
      return;
    }
    setFollowUpData((prev) => ({
      ...prev,
      icd10_codes: prev.icd10_codes.filter((code) => code !== codeToRemove),
    }));
    setHasChanges(true);
  };

  /**
   * Handle save
   * Handter lagring
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      if (onSave) {
        await onSave(followUpData);
        setHasChanges(false);
      }
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle lock/sign
   * Handter lasting/signering
   */
  const handleLock = async () => {
    if (onLock) {
      await onLock(followUpData);
    }
  };

  /**
   * Get progress indicator
   * Hent fremdriftsindikator
   */
  const _getProgressIcon = (progress) => {
    switch (progress) {
      case 'improved':
      case 'better':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'worse':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-yellow-500" />;
    }
  };

  /**
   * Section component
   * Seksjonskomponent
   */
  const Section = ({ id, title, icon: Icon, color, children }) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
      <button
        onClick={() => toggleSection(id)}
        className={`w-full flex items-center justify-between p-4 bg-${color}-50 border-b border-${color}-100`}
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

  /**
   * Text field component
   * Tekstfeltkomponent
   */
  const TextField = ({ label, value, onChange, rows = 2, placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        disabled={readOnly}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
      />
    </div>
  );

  /**
   * Input field component
   * Inndatafeltkomponent
   */
  const InputField = ({ label, value, onChange, type = 'text', placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={readOnly}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
      />
    </div>
  );

  /**
   * Progress option button component
   * Fremdriftsalternativ-knappkomponent
   */
  const ProgressButton = ({ value, currentValue, onChange, label, icon: Icon, color }) => (
    <button
      onClick={() => onChange(value)}
      disabled={readOnly}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
        currentValue === value
          ? `bg-${color}-100 border-${color}-300 text-${color}-800`
          : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
      } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Header / Overskrift */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Oppfolgingskonsultasjon</h2>
          {patient && (
            <p className="text-sm text-gray-500 mt-0.5">
              {patient.firstName || patient.first_name} {patient.lastName || patient.last_name}
              {followUpData.visit_number && ` - Besok #${followUpData.visit_number}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-save indicator */}
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

      {/* Quick Progress Overview / Rask fremdriftsoversikt */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pasientens fremgang</h3>
        <div className="grid grid-cols-3 gap-4">
          {/* Overall Progress */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Generell fremgang
            </label>
            <div className="flex gap-2">
              <ProgressButton
                value="improved"
                currentValue={followUpData.subjective.overallProgress}
                onChange={(v) => updateField('subjective', 'overallProgress', v)}
                label="Bedre"
                icon={TrendingUp}
                color="green"
              />
              <ProgressButton
                value="same"
                currentValue={followUpData.subjective.overallProgress}
                onChange={(v) => updateField('subjective', 'overallProgress', v)}
                label="Uendret"
                icon={Minus}
                color="yellow"
              />
              <ProgressButton
                value="worse"
                currentValue={followUpData.subjective.overallProgress}
                onChange={(v) => updateField('subjective', 'overallProgress', v)}
                label="Verre"
                icon={TrendingDown}
                color="red"
              />
            </div>
          </div>

          {/* Pain Level Comparison */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VAS Smerte na: {followUpData.subjective.currentPainIntensity}/10
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={followUpData.subjective.currentPainIntensity || 0}
              onChange={(e) => {
                updateField('subjective', 'currentPainIntensity', parseInt(e.target.value));
                updateRootField('vas_pain_start', parseInt(e.target.value));
              }}
              disabled={readOnly}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Ingen smerte</span>
              <span>Maksimal smerte</span>
            </div>
          </div>

          {/* Visit Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Besoknummer</label>
            <input
              type="number"
              min="2"
              value={followUpData.visit_number || 2}
              onChange={(e) => updateRootField('visit_number', parseInt(e.target.value))}
              disabled={readOnly}
              className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Subjective Section / Subjektiv seksjon */}
      <Section id="subjective" title="Subjektiv - Fremgang siden sist" icon={User} color="blue">
        <TextField
          label="Beskrivelse av fremgang"
          value={followUpData.subjective.progressDescription}
          onChange={(v) => updateField('subjective', 'progressDescription', v)}
          rows={3}
          placeholder="Hvordan har pasienten hatt det siden sist?"
        />
        <TextField
          label="Navaerende hovedklage"
          value={followUpData.subjective.chiefComplaint}
          onChange={(v) => updateField('subjective', 'chiefComplaint', v)}
          placeholder="Hva er hovedplagen i dag?"
        />
        <TextField
          label="Funksjonelle endringer"
          value={followUpData.subjective.functionalChanges}
          onChange={(v) => updateField('subjective', 'functionalChanges', v)}
          placeholder="Endringer i daglige aktiviteter..."
        />

        {/* Compliance Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Etterlevelse av hjemmeprogram</h4>
          <div className="flex gap-2 mb-3">
            {['excellent', 'good', 'fair', 'poor'].map((level) => (
              <button
                key={level}
                onClick={() => updateField('subjective', 'complianceWithExercises', level)}
                disabled={readOnly}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  followUpData.subjective.complianceWithExercises === level
                    ? 'bg-blue-100 border-blue-300 text-blue-800'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {
                  {
                    excellent: 'Utmerket',
                    good: 'God',
                    fair: 'Moderat',
                    poor: 'Darlig',
                  }[level]
                }
              </button>
            ))}
          </div>
          <TextField
            label="Kommentarer til etterlevelse"
            value={followUpData.subjective.complianceNotes}
            onChange={(v) => updateField('subjective', 'complianceNotes', v)}
            rows={1}
            placeholder="Eventuelle utfordringer med ovelsene..."
          />
        </div>

        <TextField
          label="Nye symptomer"
          value={followUpData.subjective.newSymptoms}
          onChange={(v) => updateField('subjective', 'newSymptoms', v)}
          placeholder="Har det oppstatt nye symptomer?"
        />
        <TextField
          label="Bivirkninger"
          value={followUpData.subjective.sideEffects}
          onChange={(v) => updateField('subjective', 'sideEffects', v)}
          placeholder="Eventuelle reaksjoner pa behandling..."
        />
        <TextField
          label="Sporsmal eller bekymringer"
          value={followUpData.subjective.questionsOrConcerns}
          onChange={(v) => updateField('subjective', 'questionsOrConcerns', v)}
          placeholder="Hva lurer pasienten pa?"
        />
      </Section>

      {/* Objective Section / Objektiv seksjon */}
      <Section id="objective" title="Objektiv - Endringer i funn" icon={Stethoscope} color="green">
        <TextField
          label="Generell observasjon"
          value={followUpData.objective.generalObservation}
          onChange={(v) => updateField('objective', 'generalObservation', v)}
          placeholder="Hvordan ser pasienten ut i dag?"
        />
        <TextField
          label="Holdningsendringer"
          value={followUpData.objective.posturalChanges}
          onChange={(v) => updateField('objective', 'posturalChanges', v)}
          placeholder="Endringer i holdning siden sist..."
        />
        <TextField
          label="Bevegelsesutslag (ROM) - Endringer"
          value={followUpData.objective.rangeOfMotionChanges}
          onChange={(v) => updateField('objective', 'rangeOfMotionChanges', v)}
          rows={3}
          placeholder="Endringer i bevegelighet..."
        />
        <TextField
          label="Palpasjonsfunn"
          value={followUpData.objective.palpationFindings}
          onChange={(v) => updateField('objective', 'palpationFindings', v)}
          placeholder="Endringer i muskelspenning, omhet..."
        />
        <TextField
          label="Nevrologisk status"
          value={followUpData.objective.neurologicalStatus}
          onChange={(v) => updateField('objective', 'neurologicalStatus', v)}
          placeholder="Endringer i nevrologiske funn..."
        />
        <TextField
          label="Funksjonelle tester"
          value={followUpData.objective.functionalTests}
          onChange={(v) => updateField('objective', 'functionalTests', v)}
          placeholder="Resultater av funksjonelle tester..."
        />
        <TextField
          label="Sammenligning med forrige konsultasjon"
          value={followUpData.objective.comparisonToPrevious}
          onChange={(v) => updateField('objective', 'comparisonToPrevious', v)}
          rows={2}
          placeholder="Oppsummering av objektive endringer..."
        />
      </Section>

      {/* Assessment Section / Vurderingsseksjon */}
      <Section
        id="assessment"
        title="Vurdering - Oppdatert status"
        icon={ClipboardCheck}
        color="purple"
      >
        {/* Progress Assessment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fremgangsvurdering</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'on_track', label: 'Pa sporet', color: 'green' },
              { value: 'faster_than_expected', label: 'Raskere enn forventet', color: 'blue' },
              { value: 'slower_than_expected', label: 'Tregere enn forventet', color: 'yellow' },
              { value: 'no_progress', label: 'Ingen fremgang', color: 'red' },
            ].map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => updateField('assessment', 'progressAssessment', value)}
                disabled={readOnly}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                  followUpData.assessment.progressAssessment === value
                    ? `bg-${color}-100 border-${color}-300 text-${color}-800`
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <TextField
          label="Respons pa behandling"
          value={followUpData.assessment.responseToTreatment}
          onChange={(v) => updateField('assessment', 'responseToTreatment', v)}
          rows={2}
          placeholder="Hvordan responderer pasienten pa behandlingen?"
        />
        <TextField
          label="Diagnoseoppdatering"
          value={followUpData.assessment.diagnosisUpdate}
          onChange={(v) => updateField('assessment', 'diagnosisUpdate', v)}
          placeholder="Eventuelle endringer i diagnose..."
        />
        <TextField
          label="Klinisk resonnement"
          value={followUpData.assessment.clinicalReasoning}
          onChange={(v) => updateField('assessment', 'clinicalReasoning', v)}
          rows={3}
          placeholder="Vurdering av tilstand og fremgang..."
        />

        {/* Red Flags / Rode flagg */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rode flagg</label>
          <div className="space-y-2">
            {(followUpData.assessment.redFlags || []).map((flag, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="flex-1 text-sm text-red-700">{flag}</span>
                {!readOnly && (
                  <button
                    onClick={() => removeRedFlag(index)}
                    className="p-1 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>
            ))}
            {!readOnly && (
              <button
                onClick={() => {
                  const flag = prompt('Legg til rodt flagg:');
                  if (flag) {
                    addRedFlag(flag);
                  }
                }}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
              >
                <Plus className="w-4 h-4" />
                Legg til rodt flagg
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Prognose"
            value={followUpData.assessment.prognosis}
            onChange={(v) => updateField('assessment', 'prognosis', v)}
            rows={1}
            placeholder="Oppdatert prognose..."
          />
          <TextField
            label="Reviderte forventninger"
            value={followUpData.assessment.revisedExpectations}
            onChange={(v) => updateField('assessment', 'revisedExpectations', v)}
            rows={1}
            placeholder="Eventuelle endringer i forventninger..."
          />
        </div>
      </Section>

      {/* Diagnosis Codes Section / Diagnosekoder-seksjon */}
      <Section id="codes" title="Diagnosekoder" icon={Activity} color="teal">
        <div className="space-y-4">
          {/* ICD-10 Codes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">ICD-10 Koder</label>
              {!readOnly && (
                <button
                  onClick={() => setShowCodePicker(true)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Legg til kode
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(followUpData.icd10_codes || []).map((code, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm"
                >
                  {code}
                  {!readOnly && (
                    <button onClick={() => removeCode(code)} className="ml-1 hover:text-blue-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
              {(!followUpData.icd10_codes || followUpData.icd10_codes.length === 0) && (
                <span className="text-sm text-gray-500">Ingen koder lagt til</span>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Plan Section / Planseksjon */}
      <Section id="plan" title="Plan - Videre behandling" icon={Target} color="orange">
        <TextField
          label="Behandling utfort i dag"
          value={followUpData.plan.treatmentToday}
          onChange={(v) => updateField('plan', 'treatmentToday', v)}
          rows={3}
          placeholder="Behandlingsteknikker brukt i dag..."
        />
        <TextField
          label="Teknikkmodifikasjoner"
          value={followUpData.plan.techniqueModifications}
          onChange={(v) => updateField('plan', 'techniqueModifications', v)}
          placeholder="Endringer i behandlingstilnaerming..."
        />
        <TextField
          label="Oppdaterte ovelser"
          value={followUpData.plan.updatedExercises}
          onChange={(v) => updateField('plan', 'updatedExercises', v)}
          placeholder="Nye eller justerte ovelser..."
        />
        <TextField
          label="Pasientundervisning"
          value={followUpData.plan.patientEducation}
          onChange={(v) => updateField('plan', 'patientEducation', v)}
          placeholder="Informasjon gitt i dag..."
        />
        <TextField
          label="Rad for hjemmebruk"
          value={followUpData.plan.homeAdvice}
          onChange={(v) => updateField('plan', 'homeAdvice', v)}
          placeholder="Anbefalinger mellom behandlinger..."
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Neste time"
            type="date"
            value={followUpData.plan.nextAppointment}
            onChange={(v) => updateField('plan', 'nextAppointment', v)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Varighet i dag (minutter)
            </label>
            <input
              type="number"
              value={followUpData.duration_minutes || 30}
              onChange={(e) => updateRootField('duration_minutes', parseInt(e.target.value))}
              disabled={readOnly}
              className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <TextField
          label="Justeringer i behandlingsplan"
          value={followUpData.plan.treatmentPlanAdjustments}
          onChange={(v) => updateField('plan', 'treatmentPlanAdjustments', v)}
          placeholder="Endringer i den overordnede planen..."
        />
        <TextField
          label="Henvisninger"
          value={followUpData.plan.referrals}
          onChange={(v) => updateField('plan', 'referrals', v)}
          placeholder="Eventuelle nye henvisninger..."
        />

        {/* VAS Pain End */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            VAS Smerte etter behandling: {followUpData.vas_pain_end || 0}/10
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={followUpData.vas_pain_end || 0}
            onChange={(e) => updateRootField('vas_pain_end', parseInt(e.target.value))}
            disabled={readOnly}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>10</span>
          </div>
        </div>

        {/* Discharge Consideration */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={followUpData.plan.dischargeConsideration || false}
              onChange={(e) => updateField('plan', 'dischargeConsideration', e.target.checked)}
              disabled={readOnly}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">
              Vurder utskriving/avslutning av behandling
            </span>
          </label>
          {followUpData.plan.dischargeConsideration && (
            <TextField
              label="Utskrivingsnotater"
              value={followUpData.plan.dischargeNotes}
              onChange={(v) => updateField('plan', 'dischargeNotes', v)}
              placeholder="Grunner for utskriving, videre anbefalinger..."
            />
          )}
        </div>
      </Section>

      {/* ICD-10 Code Picker Modal */}
      {showCodePicker && (
        <ICD10CodePicker
          onSelect={handleCodeSelect}
          onClose={() => setShowCodePicker(false)}
          selectedCodes={followUpData.icd10_codes || []}
        />
      )}
    </div>
  );
}

// X icon component for removing codes
const X = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
