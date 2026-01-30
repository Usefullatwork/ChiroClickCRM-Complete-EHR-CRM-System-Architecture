/**
 * SOAPTemplate Component
 * Mal for SOAP-notater (Subjective, Objective, Assessment, Plan)
 *
 * Template component for SOAP notes (Subjective, Objective, Assessment, Plan)
 *
 * Mobile Responsive:
 * - Stacked layouts on mobile
 * - Touch-friendly controls (min 44px)
 * - Collapsible sections
 * - Full-screen modal on mobile
 */

import React, { useState, useCallback } from 'react'
import {
  FileText,
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
  Copy,
  Clock,
  Calendar,
  X
} from 'lucide-react'
import useMediaQuery from '../../hooks/useMediaQuery'

/**
 * SOAPTemplate Component
 * SOAP-notat mal med strukturerte seksjoner
 *
 * @param {Object} props - Component props
 * @param {Object} props.initialData - Initial note data
 * @param {Object} props.patient - Patient information
 * @param {Function} props.onSave - Callback when note is saved
 * @param {Function} props.onLock - Callback when note is locked/signed
 * @param {Array} props.templates - Available templates to apply
 * @param {boolean} props.readOnly - Whether the note is read-only
 * @returns {JSX.Element} SOAP template component
 */
export default function SOAPTemplate({
  initialData,
  patient,
  onSave,
  onLock,
  templates = [],
  readOnly = false
}) {
  const { isMobile, isTablet } = useMediaQuery()

  // State for SOAP sections
  // Tilstand for SOAP-seksjoner
  const [soapData, setSoapData] = useState(initialData || {
    subjective: {
      chiefComplaint: '',
      historyOfPresentIllness: '',
      painLocation: '',
      painIntensity: 0,
      painQuality: '',
      aggravatingFactors: '',
      relievingFactors: '',
      functionalLimitations: '',
      medications: '',
      previousTreatment: ''
    },
    objective: {
      vitalSigns: {
        bloodPressure: '',
        pulse: '',
        respiratoryRate: '',
        temperature: ''
      },
      observation: '',
      palpation: '',
      rangeOfMotion: '',
      neurologicalExam: '',
      orthopedicTests: '',
      specialTests: ''
    },
    assessment: {
      diagnosis: '',
      differentialDiagnosis: '',
      clinicalImpression: '',
      redFlags: [],
      prognosis: ''
    },
    plan: {
      treatment: '',
      exercises: '',
      patientEducation: '',
      followUp: '',
      referrals: '',
      goals: ''
    }
  })

  const [expandedSections, setExpandedSections] = useState({
    subjective: true,
    objective: !isMobile, // Collapse by default on mobile
    assessment: !isMobile,
    plan: !isMobile
  })

  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [saving, setSaving] = useState(false)
  const [redFlagInput, setRedFlagInput] = useState('')
  const [showRedFlagInput, setShowRedFlagInput] = useState(false)

  /**
   * Toggle section expansion
   * Veksle seksjonsutviding
   */
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  /**
   * Update SOAP field
   * Oppdater SOAP-felt
   */
  const updateField = useCallback((section, field, value) => {
    if (readOnly) return
    setSoapData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }, [readOnly])

  /**
   * Update nested field (e.g., vitalSigns.bloodPressure)
   * Oppdater nestet felt
   */
  const updateNestedField = useCallback((section, parent, field, value) => {
    if (readOnly) return
    setSoapData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parent]: {
          ...prev[section][parent],
          [field]: value
        }
      }
    }))
  }, [readOnly])

  /**
   * Add red flag
   * Legg til rod flagg
   */
  const addRedFlag = (flag) => {
    if (readOnly || !flag.trim()) return
    setSoapData(prev => ({
      ...prev,
      assessment: {
        ...prev.assessment,
        redFlags: [...(prev.assessment.redFlags || []), flag.trim()]
      }
    }))
    setRedFlagInput('')
    setShowRedFlagInput(false)
  }

  /**
   * Remove red flag
   * Fjern rod flagg
   */
  const removeRedFlag = (index) => {
    if (readOnly) return
    setSoapData(prev => ({
      ...prev,
      assessment: {
        ...prev.assessment,
        redFlags: prev.assessment.redFlags.filter((_, i) => i !== index)
      }
    }))
  }

  /**
   * Apply template
   * Bruk mal
   */
  const applyTemplate = (template) => {
    if (readOnly) return
    setSoapData(prev => ({
      ...prev,
      ...template.data
    }))
    setShowTemplateSelector(false)
  }

  /**
   * Handle save
   * Handter lagring
   */
  const handleSave = async () => {
    try {
      setSaving(true)
      if (onSave) {
        await onSave(soapData)
      }
    } finally {
      setSaving(false)
    }
  }

  /**
   * Handle lock/sign
   * Handter lasing/signering
   */
  const handleLock = async () => {
    if (onLock) {
      await onLock(soapData)
    }
  }

  /**
   * Section component
   * Seksjonskomponent
   */
  const Section = ({ id, title, icon: Icon, color, children }) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => toggleSection(id)}
        className={`w-full flex items-center justify-between p-3 sm:p-4 bg-${color}-50 border-b border-${color}-100 min-h-[56px] touch-manipulation`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${color}-600`} />
          </div>
          <h3 className={`font-semibold text-${color}-900 text-sm sm:text-base`}>{title}</h3>
        </div>
        {expandedSections[id] ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {expandedSections[id] && (
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {children}
        </div>
      )}
    </div>
  )

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
        className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none text-base sm:text-sm"
      />
    </div>
  )

  /**
   * Input field component
   */
  const InputField = ({ label, value, onChange, placeholder, type = 'text', className = '' }) => (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
        placeholder={placeholder}
        disabled={readOnly}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 text-base sm:text-sm min-h-[44px]"
        min={type === 'number' ? '0' : undefined}
        max={type === 'number' ? '10' : undefined}
      />
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header / Overskrift */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">SOAP Notat</h2>
          {patient && (
            <p className="text-sm text-gray-500 mt-0.5">
              {patient.firstName} {patient.lastName}
            </p>
          )}
        </div>

        {/* Action buttons - stack on mobile */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {!readOnly && templates.length > 0 && (
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 min-h-[44px] touch-manipulation"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">Bruk mal</span>
              <span className="sm:hidden">Mal</span>
            </button>
          )}
          {!readOnly && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 min-h-[44px] touch-manipulation flex-1 sm:flex-none"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Lagrer...' : 'Lagre'}
              </button>
              <button
                onClick={handleLock}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 min-h-[44px] touch-manipulation flex-1 sm:flex-none"
              >
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Signer og las</span>
                <span className="sm:hidden">Signer</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Subjective Section / Subjektiv seksjon */}
      <Section id="subjective" title="S - Subjektiv" icon={User} color="blue">
        <TextField
          label="Hovedklage"
          value={soapData.subjective.chiefComplaint}
          onChange={(v) => updateField('subjective', 'chiefComplaint', v)}
          placeholder="Pasientens hovedklage..."
        />
        <TextField
          label="Sykehistorie (HPI)"
          value={soapData.subjective.historyOfPresentIllness}
          onChange={(v) => updateField('subjective', 'historyOfPresentIllness', v)}
          rows={3}
          placeholder="Detaljer om navarende plager..."
        />
        {/* Stack on mobile, 2 columns on larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <TextField
            label="Smertelokalisering"
            value={soapData.subjective.painLocation}
            onChange={(v) => updateField('subjective', 'painLocation', v)}
            rows={1}
            placeholder="Hvor er smerten?"
          />
          <InputField
            label="Smerteintensitet (0-10)"
            type="number"
            value={soapData.subjective.painIntensity}
            onChange={(v) => updateField('subjective', 'painIntensity', v)}
            placeholder="0-10"
          />
        </div>
        <TextField
          label="Forverrende faktorer"
          value={soapData.subjective.aggravatingFactors}
          onChange={(v) => updateField('subjective', 'aggravatingFactors', v)}
          placeholder="Hva forverrer plagene?"
        />
        <TextField
          label="Lindrende faktorer"
          value={soapData.subjective.relievingFactors}
          onChange={(v) => updateField('subjective', 'relievingFactors', v)}
          placeholder="Hva lindrer plagene?"
        />
        <TextField
          label="Funksjonsbegrensninger"
          value={soapData.subjective.functionalLimitations}
          onChange={(v) => updateField('subjective', 'functionalLimitations', v)}
          placeholder="Hvordan pavirker dette dagliglivet?"
        />
      </Section>

      {/* Objective Section / Objektiv seksjon */}
      <Section id="objective" title="O - Objektiv" icon={Stethoscope} color="green">
        {/* Vital signs - 2 cols on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <InputField
            label="Blodtrykk"
            value={soapData.objective.vitalSigns?.bloodPressure}
            onChange={(v) => updateNestedField('objective', 'vitalSigns', 'bloodPressure', v)}
            placeholder="120/80"
          />
          <InputField
            label="Puls"
            value={soapData.objective.vitalSigns?.pulse}
            onChange={(v) => updateNestedField('objective', 'vitalSigns', 'pulse', v)}
            placeholder="72"
          />
          <InputField
            label="Resp. frekvens"
            value={soapData.objective.vitalSigns?.respiratoryRate}
            onChange={(v) => updateNestedField('objective', 'vitalSigns', 'respiratoryRate', v)}
            placeholder="16"
          />
          <InputField
            label="Temperatur"
            value={soapData.objective.vitalSigns?.temperature}
            onChange={(v) => updateNestedField('objective', 'vitalSigns', 'temperature', v)}
            placeholder="36.8"
          />
        </div>
        <TextField
          label="Observasjon"
          value={soapData.objective.observation}
          onChange={(v) => updateField('objective', 'observation', v)}
          placeholder="Visuell observasjon av pasienten..."
        />
        <TextField
          label="Palpasjon"
          value={soapData.objective.palpation}
          onChange={(v) => updateField('objective', 'palpation', v)}
          placeholder="Funn ved palpasjon..."
        />
        <TextField
          label="Bevegelsesutslag (ROM)"
          value={soapData.objective.rangeOfMotion}
          onChange={(v) => updateField('objective', 'rangeOfMotion', v)}
          placeholder="Aktiv og passiv ROM..."
        />
        <TextField
          label="Nevrologisk undersokelse"
          value={soapData.objective.neurologicalExam}
          onChange={(v) => updateField('objective', 'neurologicalExam', v)}
          placeholder="Reflekser, styrke, sensibilitet..."
        />
        <TextField
          label="Ortopediske tester"
          value={soapData.objective.orthopedicTests}
          onChange={(v) => updateField('objective', 'orthopedicTests', v)}
          placeholder="Spesifikke tester utfort..."
        />
      </Section>

      {/* Assessment Section / Vurderingsseksjon */}
      <Section id="assessment" title="A - Vurdering" icon={ClipboardCheck} color="purple">
        <TextField
          label="Diagnose"
          value={soapData.assessment.diagnosis}
          onChange={(v) => updateField('assessment', 'diagnosis', v)}
          placeholder="Primar diagnose med ICD-10 kode..."
        />
        <TextField
          label="Differensialdiagnoser"
          value={soapData.assessment.differentialDiagnosis}
          onChange={(v) => updateField('assessment', 'differentialDiagnosis', v)}
          placeholder="Andre mulige diagnoser..."
        />
        <TextField
          label="Klinisk vurdering"
          value={soapData.assessment.clinicalImpression}
          onChange={(v) => updateField('assessment', 'clinicalImpression', v)}
          rows={3}
          placeholder="Samlet klinisk vurdering..."
        />

        {/* Red Flags / Rode flagg */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rode flagg
          </label>
          <div className="space-y-2">
            {(soapData.assessment.redFlags || []).map((flag, index) => (
              <div key={index} className="flex items-center gap-2 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="flex-1 text-sm text-red-700">{flag}</span>
                {!readOnly && (
                  <button
                    onClick={() => removeRedFlag(index)}
                    className="p-2 hover:bg-red-100 active:bg-red-200 rounded min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>
            ))}

            {/* Red flag input */}
            {!readOnly && (
              <>
                {showRedFlagInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={redFlagInput}
                      onChange={(e) => setRedFlagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addRedFlag(redFlagInput)
                        } else if (e.key === 'Escape') {
                          setShowRedFlagInput(false)
                          setRedFlagInput('')
                        }
                      }}
                      placeholder="Skriv inn rod flagg..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[44px]"
                      autoFocus
                    />
                    <button
                      onClick={() => addRedFlag(redFlagInput)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 min-h-[44px] touch-manipulation"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setShowRedFlagInput(false)
                        setRedFlagInput('')
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 min-h-[44px] touch-manipulation"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRedFlagInput(true)}
                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 py-2 min-h-[44px] touch-manipulation"
                  >
                    <Plus className="w-4 h-4" />
                    Legg til rod flagg
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <TextField
          label="Prognose"
          value={soapData.assessment.prognosis}
          onChange={(v) => updateField('assessment', 'prognosis', v)}
          placeholder="Forventet forlop og varighet..."
        />
      </Section>

      {/* Plan Section / Planseksjon */}
      <Section id="plan" title="P - Plan" icon={Target} color="orange">
        <TextField
          label="Behandling"
          value={soapData.plan.treatment}
          onChange={(v) => updateField('plan', 'treatment', v)}
          rows={3}
          placeholder="Utfort behandling og teknikker..."
        />
        <TextField
          label="Ovelser/Hjemmeoppgaver"
          value={soapData.plan.exercises}
          onChange={(v) => updateField('plan', 'exercises', v)}
          placeholder="Ovelser forskrevet til pasienten..."
        />
        <TextField
          label="Pasientundervisning"
          value={soapData.plan.patientEducation}
          onChange={(v) => updateField('plan', 'patientEducation', v)}
          placeholder="Informasjon gitt til pasienten..."
        />
        <TextField
          label="Oppfolging"
          value={soapData.plan.followUp}
          onChange={(v) => updateField('plan', 'followUp', v)}
          placeholder="Neste time og oppfolgingsplan..."
        />
        <TextField
          label="Henvisning"
          value={soapData.plan.referrals}
          onChange={(v) => updateField('plan', 'referrals', v)}
          placeholder="Eventuelle henvisninger..."
        />
        <TextField
          label="Mal"
          value={soapData.plan.goals}
          onChange={(v) => updateField('plan', 'goals', v)}
          placeholder="Kortsiktige og langsiktige mal..."
        />
      </Section>

      {/* Template Selector Modal / Malvelger-modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className={`bg-white w-full overflow-hidden ${
            isMobile
              ? 'rounded-t-2xl max-h-[85vh]'
              : 'rounded-xl max-w-md mx-4 max-h-[80vh]'
          }`}>
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-gray-900">Velg mal</h3>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: isMobile ? '70vh' : '60vh' }}>
              {templates.length > 0 ? (
                <div className="space-y-2">
                  {templates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => applyTemplate(template)}
                      className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 active:bg-blue-100 transition-colors min-h-[64px] touch-manipulation"
                    >
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      {template.description && (
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Ingen maler tilgjengelig</p>
              )}
            </div>

            {/* Mobile: Cancel button at bottom */}
            {isMobile && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowTemplateSelector(false)}
                  className="w-full py-3 text-gray-700 font-medium bg-white border border-gray-300 rounded-xl hover:bg-gray-50 active:bg-gray-100 min-h-[48px] touch-manipulation"
                >
                  Avbryt
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
