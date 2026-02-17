import _React from 'react';
import { FileText, ChevronUp, ChevronDown, Check } from 'lucide-react';

// Static billing code data
const taksterNorwegian = [
  { id: 'l214', code: 'L214', name: 'Manipulasjonsbehandling', price: 450 },
  { id: 'l215', code: 'L215', name: 'Bl\u00F8tvevsbehandling', price: 350 },
  { id: 'l220', code: 'L220', name: 'Tillegg for \u00F8velser/veiledning', price: 150 },
  { id: 'akutt', code: 'AKUTT', name: 'Akutt-tillegg (samme dag)', price: 200 },
];

export { taksterNorwegian };

/**
 * Takster (billing code) selection panel for Norwegian HELFO codes.
 * Allows practitioners to select billing codes with auto-totaling.
 */
export function TaksterPanel({
  selectedTakster,
  onToggleTakst,
  showTakster,
  onToggleShow,
  totalPrice,
  isSigned,
}) {
  return (
    <div className="border border-purple-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggleShow}
        className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-purple-900">Takster (behandlingskoder)</span>
          <span className="text-xs text-purple-600">(Kun for behandlere)</span>
        </div>
        {showTakster ? (
          <ChevronUp className="w-5 h-5 text-purple-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-purple-600" />
        )}
      </button>

      {showTakster && (
        <div className="p-4 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {taksterNorwegian.map((takst) => (
              <button
                key={takst.id}
                onClick={() => onToggleTakst(takst.id)}
                disabled={isSigned}
                className={`
                  flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all
                  ${
                    selectedTakster.includes(takst.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }
                  ${isSigned ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      h-5 w-5 rounded flex items-center justify-center
                      ${
                        selectedTakster.includes(takst.id)
                          ? 'bg-purple-600 text-white'
                          : 'border-2 border-slate-300'
                      }
                    `}
                  >
                    {selectedTakster.includes(takst.id) && <Check className="h-3 w-3" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{takst.code}</p>
                    <p className="text-xs text-slate-500">{takst.name}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-600">{takst.price} kr</span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-100 text-purple-800">
              <span className="text-sm">Totalt:</span>
              <span className="font-bold">{totalPrice} kr</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
