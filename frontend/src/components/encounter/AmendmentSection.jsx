/**
 * AmendmentSection - Extracted from ClinicalEncounter.jsx
 * Shows amendments/corrections for signed encounters
 */
import { FileText, Save, Loader2, Lock } from 'lucide-react';

export function AmendmentSection({
  isSigned,
  amendments,
  showAmendmentForm,
  setShowAmendmentForm,
  amendmentContent,
  setAmendmentContent,
  amendmentType,
  setAmendmentType,
  amendmentReason,
  setAmendmentReason,
  handleCreateAmendment,
  createAmendmentMutation,
  signAmendmentMutation,
}) {
  if (!isSigned) {
    return null;
  }

  return (
    <section className="bg-amber-50 rounded-xl border border-amber-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-amber-800 tracking-wide flex items-center gap-2">
          <FileText className="h-4 w-4" />
          TILLEGG / RETTELSER
        </h3>
        {!showAmendmentForm && (
          <button
            onClick={() => setShowAmendmentForm(true)}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors flex items-center gap-1.5"
          >
            <FileText className="h-3.5 w-3.5" />
            Legg til Tillegg
          </button>
        )}
      </div>

      {showAmendmentForm && (
        <div className="bg-white rounded-lg border border-amber-200 p-4 mb-4">
          <div className="flex gap-4 mb-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <select
                value={amendmentType}
                onChange={(e) => setAmendmentType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500"
              >
                <option value="ADDENDUM">Tillegg (ny informasjon)</option>
                <option value="CORRECTION">Rettelse (korrigering av feil)</option>
                <option value="CLARIFICATION">Avklaring (utdyping)</option>
                <option value="LATE_ENTRY">Sen registrering</option>
              </select>
            </div>
            {amendmentType === 'CORRECTION' && (
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Begrunnelse for rettelse *
                </label>
                <input
                  type="text"
                  value={amendmentReason}
                  onChange={(e) => setAmendmentReason(e.target.value)}
                  placeholder="Begrunn hvorfor rettelsen er n\u00F8dvendig"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">Innhold</label>
            <textarea
              value={amendmentContent}
              onChange={(e) => setAmendmentContent(e.target.value)}
              placeholder="Skriv tillegget eller rettelsen her..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowAmendmentForm(false);
                setAmendmentContent('');
                setAmendmentReason('');
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={handleCreateAmendment}
              disabled={
                !amendmentContent.trim() ||
                createAmendmentMutation.isPending ||
                (amendmentType === 'CORRECTION' && !amendmentReason.trim())
              }
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {createAmendmentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lagre Tillegg
            </button>
          </div>
        </div>
      )}

      {amendments?.data && amendments.data.length > 0 && (
        <div className="space-y-3">
          {amendments.data.map((amendment, index) => (
            <div key={amendment.id} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      amendment.amendment_type === 'CORRECTION'
                        ? 'bg-red-100 text-red-700'
                        : amendment.amendment_type === 'CLARIFICATION'
                          ? 'bg-blue-100 text-blue-700'
                          : amendment.amendment_type === 'LATE_ENTRY'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {amendment.amendment_type === 'ADDENDUM' && 'Tillegg'}
                    {amendment.amendment_type === 'CORRECTION' && 'Rettelse'}
                    {amendment.amendment_type === 'CLARIFICATION' && 'Avklaring'}
                    {amendment.amendment_type === 'LATE_ENTRY' && 'Sen registrering'}
                  </span>
                  <span className="text-xs text-slate-500">
                    #{index + 1} - {new Date(amendment.created_at).toLocaleDateString('no-NO')}{' '}
                    {new Date(amendment.created_at).toLocaleTimeString('no-NO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {amendment.signed_at ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <Lock className="h-3 w-3" /> Signert
                    </span>
                  ) : (
                    <button
                      onClick={() => signAmendmentMutation.mutate(amendment.id)}
                      disabled={signAmendmentMutation.isPending}
                      className="px-2 py-1 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      Signer
                    </button>
                  )}
                </div>
              </div>
              {amendment.reason && (
                <p className="text-xs text-slate-500 mb-2 italic">
                  Begrunnelse: {amendment.reason}
                </p>
              )}
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{amendment.content}</p>
              <p className="text-xs text-slate-400 mt-2">
                Skrevet av: {amendment.author_name || 'Ukjent'}
                {amendment.signed_by_name && ` | Signert av: ${amendment.signed_by_name}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {(!amendments?.data || amendments.data.length === 0) && !showAmendmentForm && (
        <p className="text-sm text-amber-700 text-center py-4">
          Ingen tillegg eller rettelser enn{'\u00E5'}. Klikk "Legg til Tillegg" for {'\u00E5'}
          dokumentere endringer.
        </p>
      )}
    </section>
  );
}
