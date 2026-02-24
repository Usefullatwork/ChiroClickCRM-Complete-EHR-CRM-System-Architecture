/**
 * PlanSection - Assessment, Diagnosis codes, and Treatment plan
 * Extracted from InitialConsultTemplate.jsx
 */
import { ClipboardCheck, Target, Activity, AlertTriangle, Plus, Trash2 } from 'lucide-react';

export default function PlanSection({
  consultData,
  updateField,
  updateNestedField,
  updateRootField,
  readOnly,
  Section,
  TextField,
  InputField,
  Checkbox,
  addRedFlag,
  removeRedFlag,
  handleCodeSelect: _handleCodeSelect,
  removeCode,
  showCodePicker: _showCodePicker,
  setShowCodePicker,
}) {
  return (
    <>
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
                    aria-label="Fjern rodt flagg"
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
              aria-label="Alvorlighetsgrad"
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
                    <button
                      onClick={() => removeCode(code)}
                      className="ml-1 hover:text-blue-600"
                      aria-label={`Fjern kode ${code}`}
                    >
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
            aria-label="Konsultasjonens varighet i minutter"
            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Section>
    </>
  );
}

// X icon component for removing codes
const X = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
