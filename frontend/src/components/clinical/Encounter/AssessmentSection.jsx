import { Search, X, Check } from 'lucide-react';
import { useEncounter } from '../../../context/EncounterContext';

export default function AssessmentSection({
  onTextInputWithMacros,
  diagnosisSearch,
  setDiagnosisSearch,
  showDiagnosisDropdown,
  setShowDiagnosisDropdown,
  filteredDiagnoses,
  toggleDiagnosis,
  removeDiagnosisCode,
}) {
  const { encounterData, isSigned, updateField } = useEncounter();

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-white border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <span className="bg-amber-500 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
            A
          </span>
          Vurdering & Diagnose
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {/* Diagnosis Search */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Søk ICPC-2 kode eller diagnose (f.eks. L02, rygg)..."
              aria-label="Sok diagnosekode"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              value={diagnosisSearch}
              onChange={(e) => {
                setDiagnosisSearch(e.target.value);
                setShowDiagnosisDropdown(true);
              }}
              onFocus={() => setShowDiagnosisDropdown(true)}
              disabled={isSigned}
            />
          </div>

          {/* Dropdown */}
          {showDiagnosisDropdown && diagnosisSearch && !isSigned && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg max-h-60 overflow-y-auto">
              {filteredDiagnoses.length > 0 ? (
                filteredDiagnoses.map((diagnosis) => (
                  <button
                    key={diagnosis.code}
                    onClick={() => toggleDiagnosis(diagnosis)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-amber-50 flex items-center justify-between"
                  >
                    <span>
                      <span className="font-mono font-medium text-amber-600">{diagnosis.code}</span>
                      <span className="text-slate-600 ml-2">
                        - {diagnosis.description_no || diagnosis.label}
                      </span>
                    </span>
                    {encounterData.icpc_codes.includes(diagnosis.code) && (
                      <Check className="h-4 w-4 text-amber-600" />
                    )}
                  </button>
                ))
              ) : (
                <p className="px-4 py-3 text-sm text-slate-500">Ingen diagnose funnet</p>
              )}
            </div>
          )}
        </div>

        {/* Selected Diagnoses */}
        {encounterData.icpc_codes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {encounterData.icpc_codes.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-medium"
              >
                <span className="font-mono">{code}</span>
                <button
                  onClick={() => removeDiagnosisCode(code)}
                  className="ml-1 hover:text-amber-900"
                  disabled={isSigned}
                  aria-label={`Fjern diagnosekode ${code}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <textarea
          placeholder="Klinisk resonnering og vurdering..."
          aria-label="Klinisk resonnering og vurdering"
          className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          value={encounterData.assessment.clinical_reasoning}
          onChange={(e) => {
            if (!onTextInputWithMacros(e, 'assessment', 'clinical_reasoning')) {
              updateField('assessment', 'clinical_reasoning', e.target.value);
            }
          }}
          disabled={isSigned}
        />
      </div>
    </section>
  );
}
