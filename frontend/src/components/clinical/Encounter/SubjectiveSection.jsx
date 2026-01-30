import React from 'react';
import { useEncounter } from '../../../context/EncounterContext';

export default function SubjectiveSection({ onTextInputWithMacros, onQuickPhrase, onSetActiveField, quickPhrases }) {
  const { encounterData, isSigned, updateField, setEncounterData } = useEncounter();

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <span className="bg-blue-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">S</span>
          Subjektivt
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">VAS Start:</span>
          <input
            type="range"
            min="0"
            max="10"
            value={encounterData.vas_pain_start || 0}
            onChange={(e) => setEncounterData(prev => ({ ...prev, vas_pain_start: parseInt(e.target.value) }))}
            disabled={isSigned}
            className="w-20 h-1.5 accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-sm font-semibold text-blue-600 w-6">{encounterData.vas_pain_start || 0}</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <input
          type="text"
          placeholder="Hovedklage..."
          value={encounterData.subjective.chief_complaint}
          onChange={(e) => updateField('subjective', 'chief_complaint', e.target.value)}
          disabled={isSigned}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
        />
        <textarea
          placeholder="Anamnese og symptombeskrivelse... (bruk .bs for makro)"
          className="w-full min-h-[100px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          value={encounterData.subjective.history}
          onChange={(e) => {
            if (!onTextInputWithMacros(e, 'subjective', 'history')) {
              updateField('subjective', 'history', e.target.value);
            }
          }}
          onFocus={() => onSetActiveField('subjective.history')}
          disabled={isSigned}
        />
        {!isSigned && (
          <div className="flex flex-wrap gap-1.5">
            {quickPhrases.subjective.map(phrase => (
              <button
                key={phrase}
                onClick={() => onQuickPhrase(phrase, 'subjective', 'history')}
                className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                + {phrase}
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Debut (når startet det?)"
            value={encounterData.subjective.onset}
            onChange={(e) => updateField('subjective', 'onset', e.target.value)}
            disabled={isSigned}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
          <input
            type="text"
            placeholder="Smertebeskrivelse"
            value={encounterData.subjective.pain_description}
            onChange={(e) => updateField('subjective', 'pain_description', e.target.value)}
            disabled={isSigned}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </section>
  );
}
