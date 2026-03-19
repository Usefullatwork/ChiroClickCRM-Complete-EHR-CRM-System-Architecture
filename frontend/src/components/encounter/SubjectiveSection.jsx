import EnhancedClinicalTextarea from '../clinical/EnhancedClinicalTextarea';

export function SubjectiveSection({
  encounterData,
  setEncounterData,
  isSigned,
  updateField,
  quickPhrases,
}) {
  return (
    <section
      key="subjective"
      data-testid="encounter-subjective"
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <span className="bg-blue-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
            S
          </span>
          Subjektivt
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">VAS Start:</span>
          <input
            type="range"
            min="0"
            max="10"
            value={encounterData.vas_pain_start || 0}
            onChange={(e) =>
              setEncounterData((prev) => ({
                ...prev,
                vas_pain_start: parseInt(e.target.value),
              }))
            }
            disabled={isSigned}
            className="w-20 h-1.5 accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-sm font-semibold text-blue-600 w-6">
            {encounterData.vas_pain_start || 0}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <input
          type="text"
          placeholder="Hovedklage..."
          value={encounterData.subjective.chief_complaint}
          onChange={(e) => updateField('subjective', 'chief_complaint', e.target.value)}
          disabled={isSigned}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium disabled:bg-slate-50 disabled:text-slate-500 dark:text-slate-400 disabled:cursor-not-allowed"
        />
        <EnhancedClinicalTextarea
          value={encounterData.subjective.history}
          onChange={(val) => updateField('subjective', 'history', val)}
          placeholder="Anamnese og symptombeskrivelse..."
          label="Sykehistorie"
          section="subjective"
          field="history"
          quickPhrases={quickPhrases.subjective}
          disabled={isSigned}
          rows={4}
          showVoiceInput={true}
          showAIButton={false}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Debut (n&aring;r startet det?)"
            value={encounterData.subjective.onset}
            onChange={(e) => updateField('subjective', 'onset', e.target.value)}
            disabled={isSigned}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 dark:text-slate-400 disabled:cursor-not-allowed"
          />
          <input
            type="text"
            placeholder="Smertebeskrivelse"
            value={encounterData.subjective.pain_description}
            onChange={(e) => updateField('subjective', 'pain_description', e.target.value)}
            disabled={isSigned}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 dark:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </section>
  );
}
