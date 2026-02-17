/**
 * InitialConsultTemplate Component
 * Mal for forstegangskonsultasjon
 *
 * Template for initial consultation / first visit
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  User,
  FileText,
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
  Heart,
  Activity,
  CheckCircle,
} from 'lucide-react';
import ICD10CodePicker from './ICD10CodePicker';

/**
 * InitialConsultTemplate Component
 * Forstegangskonsultasjon-mal med utvidet anamnese
 *
 * @param {Object} props - Component props
 * @param {Object} props.initialData - Initial note data
 * @param {Object} props.patient - Patient information
 * @param {Function} props.onSave - Callback when note is saved
 * @param {Function} props.onLock - Callback when note is locked/signed
 * @param {boolean} props.readOnly - Whether the note is read-only
 * @returns {JSX.Element} Initial consultation template component
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
  // Tilstand for konsultasjonsdata
  const [consultData, setConsultData] = useState(
    initialData || {
      // Pasientinformasjon / Patient information
      demographics: {
        occupation: '',
        lifestyle: '',
        activityLevel: '',
        sleepQuality: '',
      },
      // Hovedklage / Chief complaint
      subjective: {
        chiefComplaint: '',
        historyOfPresentIllness: '',
        onsetDate: '',
        onsetCircumstances: '',
        painLocation: '',
        painIntensity: 0,
        painQuality: '',
        painRadiation: '',
        painPattern: '', // constant, intermittent, progressive
        aggravatingFactors: '',
        relievingFactors: '',
        functionalLimitations: '',
        previousEpisodes: '',
        previousTreatment: '',
        currentMedications: '',
        medicationAllergies: '',
      },
      // Sykehistorie / Medical history
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
      // Objektive funn / Objective findings
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
      // Vurdering / Assessment
      assessment: {
        primaryDiagnosis: '',
        secondaryDiagnoses: [],
        differentialDiagnosis: '',
        clinicalImpression: '',
        redFlags: [],
        severity: '', // mild, moderate, severe
        prognosis: '',
        expectedRecoveryTime: '',
      },
      // Behandlingsplan / Treatment plan
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
      // Diagnosekoder / Diagnosis codes
      icd10_codes: [],
      icpc_codes: [],
      // Metadata
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
            ...consultData,
            auto_save_data: consultData,
          });
          setLastAutoSave(new Date());
          setHasChanges(false);
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [consultData, hasChanges, readOnly, onSave]);

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

  /**
   * Update nested field
   * Oppdater nestet felt
   */
  const updateNestedField = useCallback(
    (section, parent, field, value) => {
      if (readOnly) {
        return;
      }
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

  /**
   * Update root level field
   * Oppdater rotnivafeld
   */
  const updateRootField = useCallback(
    (field, value) => {
      if (readOnly) {
        return;
      }
      setConsultData((prev) => ({
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
    setConsultData((prev) => ({
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
    setConsultData((prev) => ({
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
    setConsultData((prev) => ({
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
    setConsultData((prev) => ({
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
        await onSave(consultData);
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
      await onLock(consultData);
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
   * Checkbox component
   * Avkryssingsbokskomponent
   */
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

  return (
    <div className="space-y-4">
      {/* Header / Overskrift */}
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

      {/* Demographics Section / Demografiseksjon */}
      <Section id="demographics" title="Pasientinformasjon" icon={User} color="gray">
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Yrke"
            value={consultData.demographics.occupation}
            onChange={(v) => updateField('demographics', 'occupation', v)}
            placeholder="F.eks. kontorarbeider, haandverker"
          />
          <InputField
            label="Aktivitetsniva"
            value={consultData.demographics.activityLevel}
            onChange={(v) => updateField('demographics', 'activityLevel', v)}
            placeholder="F.eks. stillesittende, moderat aktiv, svaert aktiv"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Livsstil"
            value={consultData.demographics.lifestyle}
            onChange={(v) => updateField('demographics', 'lifestyle', v)}
            placeholder="Relevante livsstilsfaktorer"
          />
          <InputField
            label="Sovnkvalitet"
            value={consultData.demographics.sleepQuality}
            onChange={(v) => updateField('demographics', 'sleepQuality', v)}
            placeholder="F.eks. god, moderat, darlig"
          />
        </div>
      </Section>

      {/* Subjective Section / Subjektiv seksjon */}
      <Section
        id="subjective"
        title="Subjektiv - Hovedklage og anamnese"
        icon={FileText}
        color="blue"
      >
        <TextField
          label="Hovedklage"
          value={consultData.subjective.chiefComplaint}
          onChange={(v) => updateField('subjective', 'chiefComplaint', v)}
          placeholder="Pasientens hovedplage i egne ord..."
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Debut dato"
            type="date"
            value={consultData.subjective.onsetDate}
            onChange={(v) => updateField('subjective', 'onsetDate', v)}
          />
          <InputField
            label="Omstendigheter ved debut"
            value={consultData.subjective.onsetCircumstances}
            onChange={(v) => updateField('subjective', 'onsetCircumstances', v)}
            placeholder="Hvordan startet plagene?"
          />
        </div>
        <TextField
          label="Sykehistorie (HPI)"
          value={consultData.subjective.historyOfPresentIllness}
          onChange={(v) => updateField('subjective', 'historyOfPresentIllness', v)}
          rows={3}
          placeholder="Detaljert beskrivelse av navaerende plager..."
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Smertelokalisering"
            value={consultData.subjective.painLocation}
            onChange={(v) => updateField('subjective', 'painLocation', v)}
            placeholder="Hvor er smerten?"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Smerteintensitet (VAS 0-10)
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={consultData.subjective.painIntensity || 0}
              onChange={(e) => {
                updateField('subjective', 'painIntensity', parseInt(e.target.value));
                updateRootField('vas_pain_start', parseInt(e.target.value));
              }}
              disabled={readOnly}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span className="font-medium text-blue-600">
                {consultData.subjective.painIntensity || 0}
              </span>
              <span>10</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Smertemonster</label>
            <select
              value={consultData.subjective.painPattern || ''}
              onChange={(e) => updateField('subjective', 'painPattern', e.target.value)}
              disabled={readOnly}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Velg...</option>
              <option value="constant">Konstant</option>
              <option value="intermittent">Intermitterende</option>
              <option value="progressive">Progressiv</option>
              <option value="improving">Bedring</option>
            </select>
          </div>
          <InputField
            label="Smerteutstrahling"
            value={consultData.subjective.painRadiation}
            onChange={(v) => updateField('subjective', 'painRadiation', v)}
            placeholder="Strahler smerten ut?"
          />
        </div>
        <TextField
          label="Forverrende faktorer"
          value={consultData.subjective.aggravatingFactors}
          onChange={(v) => updateField('subjective', 'aggravatingFactors', v)}
          placeholder="Hva forverrer plagene?"
        />
        <TextField
          label="Lindrende faktorer"
          value={consultData.subjective.relievingFactors}
          onChange={(v) => updateField('subjective', 'relievingFactors', v)}
          placeholder="Hva lindrer plagene?"
        />
        <TextField
          label="Funksjonsbegrensninger"
          value={consultData.subjective.functionalLimitations}
          onChange={(v) => updateField('subjective', 'functionalLimitations', v)}
          placeholder="Hvordan pavirker dette dagliglivet?"
        />
        <TextField
          label="Tidligere episoder"
          value={consultData.subjective.previousEpisodes}
          onChange={(v) => updateField('subjective', 'previousEpisodes', v)}
          placeholder="Har pasienten hatt lignende plager for?"
        />
        <TextField
          label="Tidligere behandling"
          value={consultData.subjective.previousTreatment}
          onChange={(v) => updateField('subjective', 'previousTreatment', v)}
          placeholder="Hva har vaert forsokt tidligere?"
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Navaerende medikamenter"
            value={consultData.subjective.currentMedications}
            onChange={(v) => updateField('subjective', 'currentMedications', v)}
            placeholder="Liste over medisiner..."
          />
          <TextField
            label="Allergier"
            value={consultData.subjective.medicationAllergies}
            onChange={(v) => updateField('subjective', 'medicationAllergies', v)}
            placeholder="Kjente allergier..."
          />
        </div>
      </Section>

      {/* Medical History Section / Sykehistorieseksjon */}
      <Section id="medicalHistory" title="Sykehistorie" icon={Heart} color="pink">
        <TextField
          label="Tidligere sykdommer"
          value={consultData.medicalHistory.pastMedicalHistory}
          onChange={(v) => updateField('medicalHistory', 'pastMedicalHistory', v)}
          rows={2}
          placeholder="Relevante tidligere sykdommer..."
        />
        <TextField
          label="Kirurgisk historie"
          value={consultData.medicalHistory.surgicalHistory}
          onChange={(v) => updateField('medicalHistory', 'surgicalHistory', v)}
          placeholder="Tidligere operasjoner..."
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Familiehistorie"
            value={consultData.medicalHistory.familyHistory}
            onChange={(v) => updateField('medicalHistory', 'familyHistory', v)}
            placeholder="Relevante sykdommer i familien..."
          />
          <TextField
            label="Sosial historie"
            value={consultData.medicalHistory.socialHistory}
            onChange={(v) => updateField('medicalHistory', 'socialHistory', v)}
            placeholder="Royk, alkohol, etc..."
          />
        </div>

        {/* Red Flag Screening / Rodt flagg screening */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Rodt flagg screening
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Checkbox
              label="Uforklarlig vekttap"
              checked={consultData.medicalHistory.redFlagScreening?.unexplainedWeightLoss}
              onChange={(v) =>
                updateNestedField('medicalHistory', 'redFlagScreening', 'unexplainedWeightLoss', v)
              }
              warning
            />
            <Checkbox
              label="Nattesmerte"
              checked={consultData.medicalHistory.redFlagScreening?.nightPain}
              onChange={(v) =>
                updateNestedField('medicalHistory', 'redFlagScreening', 'nightPain', v)
              }
              warning
            />
            <Checkbox
              label="Feber"
              checked={consultData.medicalHistory.redFlagScreening?.fever}
              onChange={(v) => updateNestedField('medicalHistory', 'redFlagScreening', 'fever', v)}
              warning
            />
            <Checkbox
              label="Blaeredysfunksjon"
              checked={consultData.medicalHistory.redFlagScreening?.bladderDysfunction}
              onChange={(v) =>
                updateNestedField('medicalHistory', 'redFlagScreening', 'bladderDysfunction', v)
              }
              warning
            />
            <Checkbox
              label="Tarmdysfunksjon"
              checked={consultData.medicalHistory.redFlagScreening?.bowelDysfunction}
              onChange={(v) =>
                updateNestedField('medicalHistory', 'redFlagScreening', 'bowelDysfunction', v)
              }
              warning
            />
            <Checkbox
              label="Progressiv svakhet"
              checked={consultData.medicalHistory.redFlagScreening?.progressiveWeakness}
              onChange={(v) =>
                updateNestedField('medicalHistory', 'redFlagScreening', 'progressiveWeakness', v)
              }
              warning
            />
            <Checkbox
              label="Sadelanestesi"
              checked={consultData.medicalHistory.redFlagScreening?.saddleAnesthesia}
              onChange={(v) =>
                updateNestedField('medicalHistory', 'redFlagScreening', 'saddleAnesthesia', v)
              }
              warning
            />
            <Checkbox
              label="Nylig traume"
              checked={consultData.medicalHistory.redFlagScreening?.recentTrauma}
              onChange={(v) =>
                updateNestedField('medicalHistory', 'redFlagScreening', 'recentTrauma', v)
              }
              warning
            />
            <Checkbox
              label="Krefthistorie"
              checked={consultData.medicalHistory.redFlagScreening?.cancerHistory}
              onChange={(v) =>
                updateNestedField('medicalHistory', 'redFlagScreening', 'cancerHistory', v)
              }
              warning
            />
            <Checkbox
              label="Immunsupprimert"
              checked={consultData.medicalHistory.redFlagScreening?.immunocompromised}
              onChange={(v) =>
                updateNestedField('medicalHistory', 'redFlagScreening', 'immunocompromised', v)
              }
              warning
            />
          </div>
        </div>
      </Section>

      {/* Objective Section / Objektiv seksjon */}
      <Section
        id="objective"
        title="Objektiv - Klinisk undersokelse"
        icon={Stethoscope}
        color="green"
      >
        {/* Vital Signs / Vitale tegn */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Vitale tegn</h4>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <InputField
              label="Blodtrykk"
              value={consultData.objective.vitalSigns?.bloodPressure}
              onChange={(v) => updateNestedField('objective', 'vitalSigns', 'bloodPressure', v)}
              placeholder="120/80"
            />
            <InputField
              label="Puls"
              value={consultData.objective.vitalSigns?.pulse}
              onChange={(v) => updateNestedField('objective', 'vitalSigns', 'pulse', v)}
              placeholder="72"
            />
            <InputField
              label="Resp."
              value={consultData.objective.vitalSigns?.respiratoryRate}
              onChange={(v) => updateNestedField('objective', 'vitalSigns', 'respiratoryRate', v)}
              placeholder="16"
            />
            <InputField
              label="Temp"
              value={consultData.objective.vitalSigns?.temperature}
              onChange={(v) => updateNestedField('objective', 'vitalSigns', 'temperature', v)}
              placeholder="36.8"
            />
            <InputField
              label="Hoyde (cm)"
              value={consultData.objective.vitalSigns?.height}
              onChange={(v) => updateNestedField('objective', 'vitalSigns', 'height', v)}
              placeholder="175"
            />
            <InputField
              label="Vekt (kg)"
              value={consultData.objective.vitalSigns?.weight}
              onChange={(v) => updateNestedField('objective', 'vitalSigns', 'weight', v)}
              placeholder="70"
            />
          </div>
        </div>

        <TextField
          label="Generelt inntrykk"
          value={consultData.objective.generalAppearance}
          onChange={(v) => updateField('objective', 'generalAppearance', v)}
          placeholder="Pasientens generelle tilstand..."
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Gange"
            value={consultData.objective.gait}
            onChange={(v) => updateField('objective', 'gait', v)}
            placeholder="Gangmonster og observasjoner..."
          />
          <TextField
            label="Holdning"
            value={consultData.objective.posture}
            onChange={(v) => updateField('objective', 'posture', v)}
            placeholder="Holdningsavvik..."
          />
        </div>
        <TextField
          label="Inspeksjon"
          value={consultData.objective.inspection}
          onChange={(v) => updateField('objective', 'inspection', v)}
          placeholder="Visuell undersokelse..."
        />
        <TextField
          label="Palpasjon"
          value={consultData.objective.palpation}
          onChange={(v) => updateField('objective', 'palpation', v)}
          placeholder="Funn ved palpasjon..."
        />
        <TextField
          label="Bevegelsesutslag (ROM)"
          value={consultData.objective.rangeOfMotion}
          onChange={(v) => updateField('objective', 'rangeOfMotion', v)}
          rows={3}
          placeholder="Aktiv og passiv ROM for relevante ledd..."
        />

        {/* Neurological Exam / Nevrologisk undersokelse */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Nevrologisk undersokelse</h4>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Motorisk testing"
              value={consultData.objective.neurologicalExam?.motorTesting}
              onChange={(v) =>
                updateNestedField('objective', 'neurologicalExam', 'motorTesting', v)
              }
              placeholder="Muskelstyrke..."
            />
            <TextField
              label="Sensorisk testing"
              value={consultData.objective.neurologicalExam?.sensoryTesting}
              onChange={(v) =>
                updateNestedField('objective', 'neurologicalExam', 'sensoryTesting', v)
              }
              placeholder="Sensibilitet..."
            />
            <TextField
              label="Reflekser"
              value={consultData.objective.neurologicalExam?.reflexes}
              onChange={(v) => updateNestedField('objective', 'neurologicalExam', 'reflexes', v)}
              placeholder="Dype senereflekser..."
            />
            <TextField
              label="Hjernenerver"
              value={consultData.objective.neurologicalExam?.cranialNerves}
              onChange={(v) =>
                updateNestedField('objective', 'neurologicalExam', 'cranialNerves', v)
              }
              placeholder="Relevante hjernenerver..."
            />
          </div>
        </div>

        <TextField
          label="Ortopediske tester"
          value={consultData.objective.orthopedicTests}
          onChange={(v) => updateField('objective', 'orthopedicTests', v)}
          rows={3}
          placeholder="Utforte tester og resultater..."
        />
        <TextField
          label="Spesialtester"
          value={consultData.objective.specialTests}
          onChange={(v) => updateField('objective', 'specialTests', v)}
          placeholder="Andre relevante tester..."
        />
        <TextField
          label="Bildediagnostikk"
          value={consultData.objective.imaging}
          onChange={(v) => updateField('objective', 'imaging', v)}
          placeholder="Roentgen, MR, etc..."
        />
      </Section>

      {/* Assessment Section / Vurderingsseksjon */}
      <Section id="assessment" title="Vurdering" icon={ClipboardCheck} color="purple">
        <TextField
          label="Primaerdiagnose"
          value={consultData.assessment.primaryDiagnosis}
          onChange={(v) => updateField('assessment', 'primaryDiagnosis', v)}
          placeholder="Hoveddiagnose..."
          required
        />
        <TextField
          label="Differensialdiagnoser"
          value={consultData.assessment.differentialDiagnosis}
          onChange={(v) => updateField('assessment', 'differentialDiagnosis', v)}
          placeholder="Andre mulige diagnoser..."
        />
        <TextField
          label="Klinisk vurdering"
          value={consultData.assessment.clinicalImpression}
          onChange={(v) => updateField('assessment', 'clinicalImpression', v)}
          rows={3}
          placeholder="Samlet klinisk vurdering og resonnement..."
        />

        {/* Red Flags / Rode flagg */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rode flagg</label>
          <div className="space-y-2">
            {(consultData.assessment.redFlags || []).map((flag, index) => (
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

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alvorlighetsgrad</label>
            <select
              value={consultData.assessment.severity || ''}
              onChange={(e) => updateField('assessment', 'severity', e.target.value)}
              disabled={readOnly}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Velg...</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderat</option>
              <option value="severe">Alvorlig</option>
            </select>
          </div>
          <InputField
            label="Prognose"
            value={consultData.assessment.prognosis}
            onChange={(v) => updateField('assessment', 'prognosis', v)}
            placeholder="God, moderat, darlig"
          />
          <InputField
            label="Forventet bedringstid"
            value={consultData.assessment.expectedRecoveryTime}
            onChange={(v) => updateField('assessment', 'expectedRecoveryTime', v)}
            placeholder="F.eks. 4-6 uker"
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
              {(consultData.icd10_codes || []).map((code, index) => (
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
              {(!consultData.icd10_codes || consultData.icd10_codes.length === 0) && (
                <span className="text-sm text-gray-500">Ingen koder lagt til</span>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Plan Section / Planseksjon */}
      <Section id="plan" title="Behandlingsplan" icon={Target} color="orange">
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Kortsiktige mal"
            value={consultData.plan.treatmentGoals?.shortTerm}
            onChange={(v) => updateNestedField('plan', 'treatmentGoals', 'shortTerm', v)}
            placeholder="Mal for de neste 2-4 ukene..."
          />
          <TextField
            label="Langsiktige mal"
            value={consultData.plan.treatmentGoals?.longTerm}
            onChange={(v) => updateNestedField('plan', 'treatmentGoals', 'longTerm', v)}
            placeholder="Mal for de neste 2-3 manedene..."
          />
        </div>
        <TextField
          label="Foreslatt behandling"
          value={consultData.plan.proposedTreatment}
          onChange={(v) => updateField('plan', 'proposedTreatment', v)}
          rows={3}
          placeholder="Behandlingsmetoder som vil bli brukt..."
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Behandlingsfrekvens"
            value={consultData.plan.treatmentFrequency}
            onChange={(v) => updateField('plan', 'treatmentFrequency', v)}
            placeholder="F.eks. 2x/uke"
          />
          <InputField
            label="Estimert antall behandlinger"
            value={consultData.plan.estimatedVisits}
            onChange={(v) => updateField('plan', 'estimatedVisits', v)}
            placeholder="F.eks. 6-8 behandlinger"
          />
        </div>
        <TextField
          label="Behandling utfort i dag"
          value={consultData.plan.initialTreatment}
          onChange={(v) => updateField('plan', 'initialTreatment', v)}
          rows={3}
          placeholder="Hva ble gjort i forste konsultasjon..."
        />
        <TextField
          label="Ovelser/Hjemmeoppgaver"
          value={consultData.plan.exercises}
          onChange={(v) => updateField('plan', 'exercises', v)}
          placeholder="Ovelser forskrevet til pasienten..."
        />
        <TextField
          label="Pasientundervisning"
          value={consultData.plan.patientEducation}
          onChange={(v) => updateField('plan', 'patientEducation', v)}
          placeholder="Informasjon gitt til pasienten..."
        />
        <TextField
          label="Livsstilsanbefalinger"
          value={consultData.plan.lifestyleRecommendations}
          onChange={(v) => updateField('plan', 'lifestyleRecommendations', v)}
          placeholder="Ergonomi, aktivitet, etc..."
        />
        <TextField
          label="Oppfolging"
          value={consultData.plan.followUp}
          onChange={(v) => updateField('plan', 'followUp', v)}
          placeholder="Neste time og plan videre..."
        />
        <TextField
          label="Henvisninger"
          value={consultData.plan.referrals}
          onChange={(v) => updateField('plan', 'referrals', v)}
          placeholder="Eventuelle henvisninger..."
        />
        <TextField
          label="Kontraindikasjoner"
          value={consultData.plan.contraindications}
          onChange={(v) => updateField('plan', 'contraindications', v)}
          placeholder="Hva bor unngaas..."
        />

        {/* Informed Consent */}
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <Checkbox
            label="Pasienten er informert om diagnose, behandlingsplan og prognose, og har gitt samtykke til behandling"
            checked={consultData.plan.informedConsent}
            onChange={(v) => updateField('plan', 'informedConsent', v)}
          />
        </div>

        {/* Duration */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Konsultasjonens varighet (minutter)
          </label>
          <input
            type="number"
            value={consultData.duration_minutes || 60}
            onChange={(e) => updateRootField('duration_minutes', parseInt(e.target.value))}
            disabled={readOnly}
            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Section>

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

// X icon component for removing codes
const X = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
