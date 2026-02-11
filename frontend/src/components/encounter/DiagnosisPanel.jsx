import React from 'react';
import { Search, Check, X } from 'lucide-react';

/**
 * Diagnosis search and selection panel for the Assessment section.
 * Handles ICD-10/ICPC-2 code search, selection, and display of selected codes.
 */
export function DiagnosisPanel({
  diagnosisSearch,
  onSearchChange,
  showDropdown,
  onShowDropdown,
  filteredDiagnoses,
  selectedCodes,
  onToggleDiagnosis,
  onRemoveCode,
  isSigned,
}) {
  return (
    <>
      {/* Diagnosis Search */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="S\u00F8k ICPC-2 kode eller diagnose (f.eks. L02, rygg)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
            value={diagnosisSearch}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onShowDropdown(true);
            }}
            onFocus={() => onShowDropdown(true)}
            disabled={isSigned}
          />
        </div>

        {showDropdown && diagnosisSearch && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg max-h-60 overflow-y-auto">
            {filteredDiagnoses.length > 0 ? (
              filteredDiagnoses.slice(0, 10).map((diagnosis) => (
                <button
                  key={diagnosis.code}
                  onClick={() => onToggleDiagnosis(diagnosis)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-amber-50 flex items-center justify-between"
                >
                  <span>
                    <span className="font-mono font-medium text-amber-600">{diagnosis.code}</span>
                    <span className="text-slate-600 ml-2">- {diagnosis.description_no}</span>
                  </span>
                  {selectedCodes.includes(diagnosis.code) && (
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
      {selectedCodes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCodes.map((code) => (
            <span
              key={code}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-medium"
            >
              <span className="font-mono">{code}</span>
              <button onClick={() => onRemoveCode(code)} className="ml-1 hover:text-amber-900">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </>
  );
}
