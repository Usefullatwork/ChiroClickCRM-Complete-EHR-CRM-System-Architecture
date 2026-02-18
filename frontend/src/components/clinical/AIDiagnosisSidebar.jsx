/**
 * AIDiagnosisSidebar - Collapsible sidebar showing AI-suggested diagnosis codes
 * Non-intrusive way to show ICPC-2 code suggestions based on clinical findings
 */

import { useState, useEffect, useCallback } from 'react';
import { Brain, ChevronRight, ThumbsUp, ThumbsDown, Loader2, RefreshCw } from 'lucide-react';
import { aiAPI } from '../../services/api';
import AIConfidenceBadge from './AIConfidenceBadge';

import logger from '../../utils/logger';
export default function AIDiagnosisSidebar({
  soapData,
  onSelectCode,
  isCollapsed,
  onToggle,
  disabled = false,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState({}); // Track feedback per suggestion

  // Debounced fetch suggestions
  const fetchSuggestions = useCallback(async () => {
    // Only fetch if we have meaningful clinical data
    const hasContent =
      soapData?.subjective?.chief_complaint?.length > 5 ||
      soapData?.assessment?.clinical_reasoning?.length > 10;

    if (!hasContent || disabled) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await aiAPI.suggestDiagnosis(soapData);
      const data = response?.data || response;

      // Parse suggestions - handle different response formats
      let codes = [];
      if (Array.isArray(data?.codes)) {
        codes = data.codes;
      } else if (Array.isArray(data?.suggestions)) {
        codes = data.suggestions;
      } else if (data?.suggestion) {
        // Try to parse text suggestion into structured codes
        codes = parseTextSuggestion(data.suggestion);
      }

      // Ensure each code has required fields
      codes = codes.map((code, i) => ({
        code: code.code || code.icpc_code || `UKJ${i}`,
        description: code.description || code.name || code.text || 'Ukjent diagnose',
        confidence: code.confidence || 0.7 - i * 0.1, // Decrease confidence for lower-ranked
        reasoning: code.reasoning || code.explanation ? [code.reasoning || code.explanation] : [],
        ...code,
      }));

      setSuggestions(codes.slice(0, 5)); // Max 5 suggestions
    } catch (err) {
      logger.error('AI diagnosis suggestion failed:', err);
      setError('Kunne ikke hente forslag');
    } finally {
      setIsLoading(false);
    }
  }, [soapData, disabled]);

  // Debounce the fetch
  useEffect(() => {
    const timeout = setTimeout(fetchSuggestions, 1500);
    return () => clearTimeout(timeout);
  }, [fetchSuggestions]);

  const handleFeedback = async (code, isPositive) => {
    setFeedback((prev) => ({ ...prev, [code]: isPositive ? 'positive' : 'negative' }));

    // Track feedback (could be sent to backend for ML improvement)
    try {
      // await aiAPI.recordFeedback({ type: 'diagnosis', code, positive: isPositive });
      // Feedback recorded successfully
    } catch (err) {
      logger.error('Failed to record feedback:', err);
    }
  };

  // Collapsed state - just show a toggle button
  if (isCollapsed) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-indigo-600 text-white p-2 rounded-l-lg shadow-lg hover:bg-indigo-700 transition-colors"
        title="Vis AI diagnosehjelp"
      >
        <Brain className="w-5 h-5" />
        {suggestions.length > 0 && (
          <span className="absolute -top-1 -left-1 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
            {suggestions.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="w-72 bg-white border-l border-gray-200 shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-indigo-50 to-white border-b border-gray-200 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-800">AI Diagnosehjelp</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchSuggestions}
            disabled={isLoading}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Oppdater forslag"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Skjul panel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-sm">Analyserer kliniske funn...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button onClick={fetchSuggestions} className="text-sm text-indigo-600 hover:underline">
              Prøv igjen
            </button>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Skriv hovedklage eller vurdering for å få diagnosekode-forslag.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 font-medium">Foreslåtte ICPC-2 koder:</p>

            {suggestions.map((suggestion, _index) => (
              <div
                key={suggestion.code}
                className={`
                  border rounded-lg p-3 cursor-pointer transition-all
                  ${
                    feedback[suggestion.code] === 'positive'
                      ? 'border-green-300 bg-green-50'
                      : feedback[suggestion.code] === 'negative'
                        ? 'border-red-200 bg-red-50 opacity-60'
                        : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                  }
                `}
                onClick={() => onSelectCode(suggestion)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono font-bold text-indigo-600 text-sm">
                    {suggestion.code}
                  </span>
                  <AIConfidenceBadge
                    confidence={suggestion.confidence}
                    reasoning={suggestion.reasoning}
                    compact={false}
                    showDetails={true}
                  />
                </div>

                <p className="text-sm font-medium text-gray-800 mb-1">{suggestion.description}</p>

                {suggestion.explanation && (
                  <p className="text-xs text-gray-500">{suggestion.explanation}</p>
                )}

                {/* Feedback buttons */}
                {!feedback[suggestion.code] && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">Riktig?</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeedback(suggestion.code, true);
                      }}
                      className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Riktig forslag"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeedback(suggestion.code, false);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Feil forslag"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <p className="text-xs text-gray-500">
          Klikk på en kode for å legge til i konsultasjonen. AI-forslag skal alltid verifiseres
          klinisk.
        </p>
      </div>
    </div>
  );
}

// Helper to parse text suggestions into structured codes
function parseTextSuggestion(text) {
  const codes = [];
  // Try to find ICPC-2 codes in text (format: L84, A01, etc.)
  const codeRegex = /([A-Z]\d{2})\s*[-:]\s*([^,\n]+)/g;
  let match;

  while ((match = codeRegex.exec(text)) !== null) {
    codes.push({
      code: match[1],
      description: match[2].trim(),
    });
  }

  return codes;
}
