import EnhancedClinicalTextarea from '../clinical/EnhancedClinicalTextarea';
import { DiagnosisPanel } from './DiagnosisPanel';

export function AssessmentSection({
  encounterData,
  isSigned,
  updateField,
  diagnosisSearch,
  setDiagnosisSearch,
  showDiagnosisDropdown,
  setShowDiagnosisDropdown,
  filteredDiagnoses,
  toggleDiagnosis,
  removeDiagnosisCode,
  suggestedCodes,
  patientId,
}) {
  const { t } = useTranslation('clinical');
  return (
    <section
      key="assessment"
      data-testid="encounter-assessment"
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-white border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <span className="bg-amber-500 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
            A
          </span>
          Vurdering & Diagnose
        </h3>
      </div>
      <div className="p-4 space-y-4">
        <DiagnosisPanel
          diagnosisSearch={diagnosisSearch}
          onSearchChange={setDiagnosisSearch}
          showDropdown={showDiagnosisDropdown}
          onShowDropdown={setShowDiagnosisDropdown}
          filteredDiagnoses={filteredDiagnoses}
          selectedCodes={encounterData.icpc_codes}
          onToggleDiagnosis={toggleDiagnosis}
          onRemoveCode={removeDiagnosisCode}
          isSigned={isSigned}
        />

        {/* Auto-suggested codes from anatomy findings */}
        {suggestedCodes?.length > 0 && !isSigned && (
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <div className="text-xs font-medium text-amber-700 mb-2">
              Foreslatte koder fra funn:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestedCodes
                .filter((s) => !encounterData.icpc_codes.includes(s.diagnosis_code))
                .map((suggestion) => (
                  <button
                    key={suggestion.diagnosis_code}
                    onClick={() =>
                      toggleDiagnosis({
                        code: suggestion.diagnosis_code,
                        description_no: suggestion.diagnosis_name,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-amber-200 bg-white text-amber-800 hover:bg-amber-100 transition-colors"
                    title={`${suggestion.matching_regions} matchende regioner, ${Math.round(suggestion.avg_confidence * 100)}% konfidenssnitt`}
                  >
                    <span className="font-medium">{suggestion.diagnosis_code}</span>
                    <span className="text-amber-600">{suggestion.diagnosis_name}</span>
                    <span className="text-[10px] text-amber-500">
                      {Math.round(suggestion.avg_confidence * 100)}%
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}

        <EnhancedClinicalTextarea
          value={encounterData.assessment.clinical_reasoning}
          onChange={(val) => updateField('assessment', 'clinical_reasoning', val)}
          placeholder={t('clinicalReasoningPlaceholder', 'Klinisk resonnering og vurdering...')}
          label="Klinisk vurdering"
          section="assessment"
          field="clinical_reasoning"
          disabled={isSigned}
          rows={3}
          showVoiceInput={true}
          showAIButton={true}
          aiContext={{ soapData: encounterData, patientId }}
        />

        <input
          type="text"
          placeholder={t('differentialDiagnosesPlaceholder2', 'Differensialdiagnoser...')}
          value={encounterData.assessment.differential_diagnosis}
          onChange={(e) => updateField('assessment', 'differential_diagnosis', e.target.value)}
          disabled={isSigned}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 dark:text-slate-400 disabled:cursor-not-allowed"
        />
      </div>
    </section>
  );
}
