/**
 * HistorySection - Demographics, Subjective, and Medical History sections
 * Extracted from InitialConsultTemplate.jsx
 */
import { User, FileText, Heart, AlertTriangle } from 'lucide-react';

export default function HistorySection({
  consultData,
  updateField,
  updateNestedField,
  updateRootField,
  readOnly,
  Section,
  TextField,
  InputField,
  Checkbox,
}) {
  return (
    <>
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
              aria-label="Smerteintensitet VAS skala"
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
              aria-label="Smertemonster"
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
    </>
  );
}
