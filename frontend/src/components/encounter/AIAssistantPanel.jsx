/**
 * AIAssistantPanel - Extracted from ClinicalEncounter.jsx
 * Floating AI clinical assistant panel
 */
import _React from 'react';
import { Brain, X, Sparkles, Loader2 } from 'lucide-react';

export function AIAssistantPanel({
  showAIAssistant,
  setShowAIAssistant,
  aiSuggestions,
  aiLoading,
  getAISuggestions,
}) {
  if (!showAIAssistant) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Brain className="w-5 h-5" />
          <h3 className="font-semibold">AI Klinisk Assistent</h3>
        </div>
        <button
          onClick={() => setShowAIAssistant(false)}
          className="text-white hover:bg-purple-800 rounded p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 max-h-96 overflow-y-auto">
        {!aiSuggestions ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-purple-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-4">
              F{'\u00E5'} AI-drevne kliniske forslag basert p{'\u00E5'} SOAP-notatene
            </p>
            <button
              onClick={getAISuggestions}
              disabled={aiLoading}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyserer...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />F{'\u00E5'} AI-forslag
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {aiSuggestions.clinicalReasoning && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Klinisk Resonnering</h4>
                <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded-lg">
                  {aiSuggestions.clinicalReasoning}
                </p>
              </div>
            )}
            {aiSuggestions.diagnosis?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Foresl{'\u00E5'}tte Diagnoser
                </h4>
                <ul className="space-y-2">
                  {aiSuggestions.diagnosis.map((diag, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-700 bg-blue-50 px-3 py-2 rounded-lg flex items-start gap-2"
                    >
                      <span className="text-blue-600 mt-0.5">{'\u2022'}</span>
                      <span>{diag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {aiSuggestions.treatment?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Foresl{'\u00E5'}tt Behandling
                </h4>
                <ul className="space-y-2">
                  {aiSuggestions.treatment.map((treatment, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-700 bg-green-50 px-3 py-2 rounded-lg flex items-start gap-2"
                    >
                      <span className="text-green-600 mt-0.5">{'\u2022'}</span>
                      <span>{treatment}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={getAISuggestions}
              disabled={aiLoading}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium"
            >
              {aiLoading ? 'Analyserer...' : 'Oppdater Forslag'}
            </button>
          </div>
        )}
      </div>
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          AI-forslag er kun veiledende. Bruk alltid klinisk skj{'\u00F8'}nn.
        </p>
      </div>
    </div>
  );
}
