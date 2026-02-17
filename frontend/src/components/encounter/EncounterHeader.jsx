/**
 * EncounterHeader - Extracted from ClinicalEncounter.jsx
 * Top header bar with date, encounter type, timer, takster total, status indicators
 */
import { Calendar, Check, Clock, Activity, BookOpen, Loader2, Lock } from 'lucide-react';

export function EncounterHeader({
  encounterData,
  setEncounterData,
  isSigned,
  encounterId,
  elapsedTime,
  totalPrice,
  applyEncounterTypeDefaults,
  // SALT
  previousEncounters,
  handleSALT,
  // Auto-save
  autoSaveStatus,
  lastSaved,
  _saveMutation,
  // Keyboard help
  setShowKeyboardHelp,
}) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center flex-shrink-0">
      <div className="flex items-center space-x-4">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${isSigned ? 'bg-slate-100 text-slate-500' : 'bg-teal-50 text-teal-700'} text-sm font-medium border ${isSigned ? 'border-slate-200' : 'border-teal-200'}`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <input
            type="date"
            value={encounterData.encounter_date}
            onChange={(e) =>
              setEncounterData((prev) => ({ ...prev, encounter_date: e.target.value }))
            }
            disabled={isSigned}
            className="bg-transparent border-none focus:outline-none text-sm disabled:cursor-not-allowed"
          />
        </span>
        <select
          value={encounterData.encounter_type}
          onChange={(e) => applyEncounterTypeDefaults(e.target.value)}
          disabled={isSigned}
          className="text-sm text-slate-600 bg-transparent border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="INITIAL">F{'\u00F8'}rstegangs</option>
          <option value="FOLLOWUP">Oppf{'\u00F8'}lging</option>
          <option value="MAINTENANCE">Vedlikehold</option>
          <option value="REEXAM">Re-unders{'\u00F8'}kelse</option>
          <option value="EMERGENCY">Akutt</option>
        </select>
        <span className="text-sm text-slate-500 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <input
            type="number"
            value={encounterData.duration_minutes}
            onChange={(e) =>
              setEncounterData((prev) => ({
                ...prev,
                duration_minutes: parseInt(e.target.value) || 30,
              }))
            }
            disabled={isSigned}
            className="w-12 text-center bg-transparent border border-slate-200 rounded px-1 disabled:opacity-50 disabled:cursor-not-allowed"
          />{' '}
          min
        </span>
        <span
          className="text-sm text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-200"
          title="Tid brukt"
        >
          <Clock className="h-3.5 w-3.5 text-teal-600" />
          <span className="font-mono text-teal-700 font-medium">{elapsedTime}</span>
        </span>
        <span
          className="text-sm font-medium flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md border border-green-200 text-green-700"
          title="Takster total"
        >
          {totalPrice} kr
        </span>
      </div>
      <div className="flex items-center gap-2">
        {!isSigned && previousEncounters && (
          <button
            onClick={() => handleSALT()}
            className="text-xs px-2 py-1 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors flex items-center gap-1"
            title="SALT: Kopier fra forrige konsultasjon (Ctrl+L)"
          >
            <BookOpen className="h-3 w-3" />
            SALT
          </button>
        )}
        <button
          onClick={() => setShowKeyboardHelp(true)}
          className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          title="Tastatursnarveier (F1)"
        >
          {'\u2328\uFE0F'}
        </button>
        {autoSaveStatus === 'saving' && (
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Lagrer...
          </span>
        )}
        {autoSaveStatus === 'saved' && lastSaved && (
          <span
            className="text-xs text-green-600 flex items-center gap-1"
            title={`Lagret ${lastSaved.toLocaleTimeString()}`}
          >
            <Check className="h-3 w-3" />
            Auto-lagret
          </span>
        )}
        {autoSaveStatus === 'unsaved' && encounterId && !isSigned && (
          <span className="text-xs text-amber-500 flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Ulagrede endringer
          </span>
        )}
        {isSigned ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium">
            <Lock className="h-3 w-3" />
            Signert & L{'\u00E5'}st
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-600 text-xs">
            <Activity className="h-3 w-3" />
            {encounterId ? 'Redigerer' : 'Utkast'}
          </span>
        )}
      </div>
    </header>
  );
}
