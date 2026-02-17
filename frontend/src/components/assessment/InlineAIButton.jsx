import { useState, useRef, useEffect } from 'react';
import { Sparkles, Square, Loader2, Check, AlertCircle } from 'lucide-react';
import { API_URL } from '../../services/api';

/**
 * InlineAIButton - Small AI generation button for individual fields
 * Features:
 * - Real-time streaming text display
 * - Abort functionality
 * - Caching awareness
 * - Field-specific model routing (handled by backend)
 */
export default function InlineAIButton({
  fieldType,
  context = {},
  onTextGenerated,
  disabled = false,
  language = 'no',
  size = 'sm', // 'sm' | 'md'
  showLabel = false,
  className = '',
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState(null);
  const [wasCached, setWasCached] = useState(false);
  const abortControllerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const startGeneration = async () => {
    setIsGenerating(true);
    setStreamText('');
    setError(null);
    setWasCached(false);

    abortControllerRef.current = new AbortController();

    try {
      // Get org ID from session storage
      let organizationId;
      try {
        const stored = sessionStorage.getItem('org_session');
        if (stored) {
          organizationId = JSON.parse(atob(stored)).id;
        }
      } catch {
        /* ignore */
      }
      organizationId = organizationId || localStorage.getItem('organizationId');

      const response = await fetch(`${API_URL}/ai/generate-field-stream`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': organizationId || '',
        },
        body: JSON.stringify({ fieldType, context, language }),
        signal: abortControllerRef.current.signal,
      });

      // Check if it's a cached JSON response (non-streaming)
      const contentType = response.headers.get('Content-Type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        if (data.cached) {
          setWasCached(true);
          setStreamText(data.text);
          onTextGenerated(data.text);
          setIsGenerating(false);
          return;
        }
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Handle SSE streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      let done = false;
      while (!done) {
        const { done: streamDone, value } = await reader.read();
        done = streamDone;
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);

            if (dataStr === '[DONE]') {
              continue;
            }

            try {
              const data = JSON.parse(dataStr);

              if (data.error) {
                throw new Error(data.error);
              }

              if (data.text) {
                fullText += data.text;
                setStreamText(fullText);
              }

              if (data.done && data.fullText) {
                fullText = data.fullText;
                setStreamText(fullText);
              }
            } catch (parseError) {
              // Skip malformed JSON
              // Skipping malformed SSE data
            }
          }
        }
      }

      // Notify parent with complete text
      if (fullText) {
        onTextGenerated(fullText);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled, use partial text if any
        if (streamText) {
          onTextGenerated(streamText);
        }
      } else {
        console.error('AI generation error:', err);
        setError(err.message);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  const handleClick = () => {
    if (isGenerating) {
      stopGeneration();
    } else {
      startGeneration();
    }
  };

  const sizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  const labels = {
    no: {
      generate: 'Generer med AI',
      generating: 'Genererer...',
      stop: 'Stopp',
      cached: 'Fra hurtigbuffer',
    },
    en: {
      generate: 'Generate with AI',
      generating: 'Generating...',
      stop: 'Stop',
      cached: 'From cache',
    },
  };

  const l = labels[language] || labels.no;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`${sizeClasses[size]} rounded hover:bg-purple-100 text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
          isGenerating ? 'bg-purple-100' : ''
        } ${error ? 'text-red-500 hover:bg-red-100' : ''}`}
        title={isGenerating ? l.stop : error ? error : l.generate}
      >
        {isGenerating ? (
          <Square className={iconSizes[size]} />
        ) : error ? (
          <AlertCircle className={iconSizes[size]} />
        ) : wasCached ? (
          <Check className={`${iconSizes[size]} text-green-500`} />
        ) : (
          <Sparkles className={iconSizes[size]} />
        )}
      </button>

      {showLabel && (
        <span className="text-xs text-gray-500">
          {isGenerating ? l.generating : wasCached ? l.cached : l.generate}
        </span>
      )}

      {/* Streaming preview tooltip (shows while generating) */}
      {isGenerating && streamText && (
        <div className="absolute z-50 mt-8 ml-0 w-64 p-2 bg-white border border-gray-200 rounded-lg shadow-lg text-xs text-gray-700 max-h-32 overflow-y-auto">
          <div className="flex items-center gap-1 mb-1 text-purple-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="font-medium">{l.generating}</span>
          </div>
          <p className="whitespace-pre-wrap">{streamText}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for tight spaces
 */
export function InlineAIButtonCompact({
  fieldType,
  context,
  onTextGenerated,
  language = 'no',
  disabled,
}) {
  return (
    <InlineAIButton
      fieldType={fieldType}
      context={context}
      onTextGenerated={onTextGenerated}
      language={language}
      disabled={disabled}
      size="sm"
      showLabel={false}
    />
  );
}
