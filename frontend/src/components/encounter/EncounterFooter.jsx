/**
 * EncounterFooter - Extracted from ClinicalEncounter.jsx
 * Sticky footer with save/sign actions
 */
import _React from 'react';
import { Activity, Save, FileText, Lock, Loader2 } from 'lucide-react';

export function EncounterFooter({
  patientId,
  isSigned,
  saveMutation,
  signMutation,
  handleSave,
  handleSignAndLock,
  navigate,
}) {
  return (
    <footer className="bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center flex-shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500 flex items-center gap-1">
          <Activity className="h-4 w-4 text-amber-500" />
          {saveMutation.isPending ? 'Lagrer...' : 'Klar til lagring'}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/patients/${patientId}`)}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Avbryt
        </button>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          data-testid="encounter-save-button"
          className="px-6 py-2 text-sm font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Lagre Notat
        </button>
        <button
          onClick={handleSignAndLock}
          disabled={saveMutation.isPending || signMutation.isPending || isSigned}
          className={`px-6 py-2 text-sm font-semibold rounded-lg ${isSigned ? 'bg-green-700' : 'bg-slate-800'} text-white hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm`}
        >
          {signMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSigned ? (
            <Lock className="h-4 w-4" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {isSigned ? 'Signert' : 'Signer og L\u00E5s'}
        </button>
      </div>
    </footer>
  );
}
