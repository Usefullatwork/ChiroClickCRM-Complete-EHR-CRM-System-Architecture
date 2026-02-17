import { Activity, FileText, Save, Lock, Loader2 } from 'lucide-react';

export default function EncounterFooter({
  isSigned,
  onCancel,
  onPreview,
  onSave,
  onSaveAndSign,
  isSaving,
  isSigning,
  autoSaveStatus,
  lastSaved,
}) {
  return (
    <footer className="bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center flex-shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500 flex items-center gap-1">
          <Activity
            className={`h-4 w-4 ${autoSaveStatus === 'unsaved' ? 'text-amber-500' : 'text-green-500'}`}
          />
          {isSaving
            ? 'Lagrer...'
            : autoSaveStatus === 'saved'
              ? 'Alle endringer er lagret'
              : 'Utkast lagres automatisk'}
        </span>
        {lastSaved && (
          <span className="text-xs text-slate-400">
            Sist oppdatert:{' '}
            {lastSaved.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Avbryt
        </button>
        <button
          onClick={onPreview}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Forhåndsvis
        </button>

        {!isSigned && (
          <>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="px-6 py-2 text-sm font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lagre Notat
            </button>
            <button
              onClick={onSaveAndSign}
              disabled={isSaving || isSigning}
              className="px-6 py-2 text-sm font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              {isSigning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Signer og Lås
            </button>
          </>
        )}

        {isSigned && (
          <span className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-green-100 text-green-700 text-sm font-medium">
            <Lock className="h-4 w-4" />
            Signert
          </span>
        )}
      </div>
    </footer>
  );
}
