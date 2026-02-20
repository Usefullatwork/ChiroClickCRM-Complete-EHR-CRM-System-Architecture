import { Calendar, Clock, BookOpen, Check, Activity, Lock, Loader2 } from 'lucide-react';

export default function EncounterHeader({
  encounterData,
  onUpdateField,
  isSigned,
  previousEncounters,
  onSALT,
  onShowKeyboardHelp,
  autoSaveStatus,
  lastSaved,
  encounterId,
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
            onChange={(e) => onUpdateField('encounter_date', e.target.value, true)}
            disabled={isSigned}
            className="bg-transparent border-none focus:outline-none text-sm disabled:cursor-not-allowed"
          />
        </span>
        <select
          value={encounterData.encounter_type}
          onChange={(e) => onUpdateField('encounter_type', e.target.value, true)}
          disabled={isSigned}
          className="text-sm text-slate-600 bg-transparent border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="INITIAL">Førstegangs</option>
          <option value="FOLLOWUP">Oppfølging</option>
          <option value="REEXAM">Re-undersøkelse</option>
          <option value="EMERGENCY">Akutt</option>
        </select>
        <span className="text-sm text-slate-500 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <input
            type="number"
            value={encounterData.duration_minutes}
            onChange={(e) =>
              onUpdateField('duration_minutes', parseInt(e.target.value) || 30, true)
            }
            disabled={isSigned}
            className="w-12 text-center bg-transparent border border-slate-200 rounded px-1 disabled:opacity-50 disabled:cursor-not-allowed"
          />{' '}
          min
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* SALT Button - Copy from last visit */}
        {!isSigned && previousEncounters && (
          <button
            onClick={onSALT}
            className="text-xs px-2 py-1 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors flex items-center gap-1"
            title="SALT: Kopier fra forrige konsultasjon (Ctrl+L)"
          >
            <BookOpen className="h-3 w-3" />
            SALT
          </button>
        )}
        {/* Keyboard shortcuts help */}
        <button
          onClick={onShowKeyboardHelp}
          className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          title="Tastatursnarveier (F1)"
        >
          ⌨️
        </button>
        {/* Auto-save indicator with timestamp */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          {autoSaveStatus === 'saving' && (
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Lagrer...
            </span>
          )}
          {autoSaveStatus === 'saved' && lastSaved && (
            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <Check className="h-3 w-3" />
              <span>
                Lagret{' '}
                {lastSaved.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </span>
          )}
          {autoSaveStatus === 'saved' && !lastSaved && (
            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <Check className="h-3 w-3" />
              Lagret
            </span>
          )}
          {autoSaveStatus === 'unsaved' && encounterId && !isSigned && (
            <span className="text-xs text-amber-500 flex items-center gap-1.5">
              <Activity className="h-3 w-3" />
              Ulagrede endringer
            </span>
          )}
        </div>
        {isSigned ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium">
            <Lock className="h-3 w-3" />
            Signert & Låst
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
