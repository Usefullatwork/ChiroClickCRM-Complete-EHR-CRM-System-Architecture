/**
 * AITextarea - Lightweight textarea with ghost text AI suggestions
 *
 * Drop-in <textarea> replacement. Tab accepts, Esc dismisses.
 * No macros, no slash commands, no voice — just ghost text.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { aiAPI } from '../../services/api';
import logger from '../../utils/logger';

const log = logger.scope('AITextarea');

export default function AITextarea({
  value,
  onChange,
  fieldType,
  context = {},
  placeholder,
  className = '',
  disabled = false,
  rows = 2,
  debounceMs = 1200,
  minLength = 30,
  ...props
}) {
  const textareaRef = useRef(null);
  const abortRef = useRef(null);
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch ghost text suggestion (debounced)
  useEffect(() => {
    if (!value || value.length < minLength || disabled) {
      setSuggestion('');
      return;
    }

    // Skip if text ends with a command in progress
    if (/[./][a-z]*$/i.test(value)) {
      return;
    }

    const timer = setTimeout(async () => {
      // Abort any previous in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setIsLoading(true);
        const res = await aiAPI.generateField(
          fieldType,
          { partialText: value, maxTokens: 50, ...context },
          'no'
        );

        if (controller.signal.aborted) {
          return;
        }

        const text = res?.data?.text || res?.data?.continuation || '';
        if (text.length > 5 && !value.includes(text.trim())) {
          const trimmed = text.split(/[.!?]/)[0].trim();
          setSuggestion(trimmed.length > 60 ? `${trimmed.substring(0, 60)}...` : `${trimmed}.`);
        } else {
          setSuggestion('');
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          log.debug('AI ghost text failed', { error: err.message });
          setSuggestion('');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [value, fieldType, context, disabled, debounceMs, minLength]);

  // Cleanup on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Tab' && suggestion) {
        e.preventDefault();
        onChange(value + suggestion);
        setSuggestion('');
      } else if (e.key === 'Escape' && suggestion) {
        setSuggestion('');
      }
    },
    [suggestion, value, onChange]
  );

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`
          w-full p-3 rounded-lg border border-slate-200
          focus:ring-2 focus:ring-emerald-500 focus:border-transparent
          resize-none text-sm
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />

      {/* Ghost text overlay */}
      {suggestion && (
        <div
          className="absolute top-0 left-0 right-0 p-3 pointer-events-none whitespace-pre-wrap text-sm"
          style={{ color: 'transparent' }}
        >
          <span>{value}</span>
          <span className="text-gray-400">{suggestion}</span>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-gray-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          AI tenker...
        </div>
      )}

      {/* Tab hint */}
      {suggestion && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
          Tab for å akseptere
        </div>
      )}
    </div>
  );
}
