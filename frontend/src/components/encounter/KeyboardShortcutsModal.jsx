/**
 * KeyboardShortcutsModal - Extracted from ClinicalEncounter.jsx
 * Shows keyboard shortcuts and macro reference
 */
import _React from 'react';
import { X } from 'lucide-react';

export function KeyboardShortcutsModal({
  showKeyboardHelp,
  setShowKeyboardHelp,
  keyboardShortcuts,
  macros,
}) {
  if (!showKeyboardHelp) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={() => setShowKeyboardHelp(false)}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">
            {'\u2328\uFE0F'} Tastatursnarveier
          </h3>
          <button
            onClick={() => setShowKeyboardHelp(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-2 text-sm">
          {Object.entries(keyboardShortcuts).map(([key, desc]) => (
            <div key={key} className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">{desc}</span>
              <kbd className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">{key}</kbd>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200">
          <h4 className="font-medium text-slate-700 mb-2">
            {'\uD83D\uDCDD'} Makroer (skriv og trykk mellomrom)
          </h4>
          <div className="grid grid-cols-2 gap-1 text-xs max-h-40 overflow-y-auto">
            {Object.entries(macros)
              .slice(0, 10)
              .map(([key, val]) => (
                <div key={key} className="flex gap-1">
                  <code className="text-purple-600">{key}</code>
                  <span className="text-slate-500 truncate">{val.substring(0, 20)}...</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
