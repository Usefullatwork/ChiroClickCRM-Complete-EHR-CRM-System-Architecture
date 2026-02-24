/**
 * EnhancedClinicalTextarea - All-in-one clinical documentation input
 *
 * Features:
 * - Type ".bs" + space → expands to "Bedring siden sist."
 * - Type "/better" → shows command menu, Enter/Tab inserts
 * - Tab accepts ghost AI suggestions
 * - Click mic to dictate (browser Web Speech API)
 * - Quick phrase chips below
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import useTextExpansion from '../../hooks/useTextExpansion';
import TextExpansionPopup from './TextExpansionPopup';
import { Sparkles, Loader2, Mic, MicOff, Square } from 'lucide-react';
import { aiAPI } from '../../services/api';
import logger from '../../utils/logger';

const log = logger.scope('ClinicalTextarea');

// Norwegian macros - type ".xx" + space to expand
const MACROS = {
  // Subjective
  '.bs': 'Bedring siden sist. ',
  '.ie': 'Ingen endring siden forrige konsultasjon. ',
  '.vm': 'Verre om morgenen, bedre utover dagen. ',
  '.kons': 'Konstante smerter, VAS ',
  '.ust': 'Utstråling til ',
  '.bed': 'Betydelig bedring siden sist. ',
  '.forv': 'Forverring siden sist. ',
  '.stiv': 'Stivhet om morgenen som bedres med aktivitet. ',

  // Objective
  '.nrom': 'Normal ROM i alle retninger. ',
  '.rrom': 'Redusert ROM: ',
  '.palp': 'Ved palpasjon: ',
  '.spasme': 'Muskelspasme palperes paravertebralt. ',
  '.trigger': 'Triggerpunkt identifisert i ',
  '.seg': 'Segmentell dysfunksjon ',
  '.omt': 'Ømhet ved palpasjon over ',
  '.hyper': 'Hypertonisitet i ',

  // Segments
  '.c': 'Cervical ',
  '.t': 'Thorakal ',
  '.l': 'Lumbal ',
  '.si': 'SI-ledd ',
  '.ctx': 'CTX (cervikal-thorakal overgang) ',
  '.tlx': 'TLX (thorakolumbal overgang) ',

  // Treatment
  '.hvla': 'HVLA manipulasjon ',
  '.mob': 'Mobilisering ',
  '.soft': 'Bløtvevsbehandling ',
  '.dry': 'Dry needling ',
  '.tape': 'Kinesiotaping ',
  '.aktivator': 'Aktivator-teknikk ',
  '.drop': 'Drop-teknikk ',
  '.flex': 'Flexion-distraction ',

  // Plan
  '.fu1': 'Oppfølging om 1 uke. ',
  '.fu2': 'Oppfølging om 2 uker. ',
  '.fu4': 'Oppfølging om 4 uker. ',
  '.øv': 'Hjemmeøvelser gjennomgått og demonstrert. ',
  '.erg': 'Ergonomisk veiledning gitt. ',
  '.hen': 'Henvisning vurderes til ',
  '.prn': 'Kontroll ved behov. ',

  // Assessment
  '.godr': 'God respons på behandling. Fortsetter nåværende plan. ',
  '.modr': 'Moderat respons. Justerer behandlingsplan. ',
  '.begr': 'Begrenset respons. Vurderer alternativ tilnærming. ',
  '.prog': 'Prognose: ',
  '.diff': 'Differensialdiagnoser: ',
};

// Check if browser supports speech recognition
const SpeechRecognition =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export default function EnhancedClinicalTextarea({
  value,
  onChange,
  placeholder,
  label,
  section, // 'subjective', 'objective', 'assessment', 'plan'
  field,
  quickPhrases = [],
  disabled = false,
  rows = 3,
  className = '',
  showAIButton = false,
  showVoiceInput = true, // Enable voice by default
  aiContext = {},
  onAIGenerate,
  ...props
}) {
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // UI State
  const [showMacroHint, setShowMacroHint] = useState(false);
  const [macroHint, setMacroHint] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState(null);

  // Check voice support on mount
  useEffect(() => {
    setVoiceSupported(!!SpeechRecognition);
  }, []);

  // Text expansion (slash commands) hook
  const {
    suggestions: expansionSuggestions,
    isOpen: expansionOpen,
    searchTerm: expansionSearch,
    selectedIndex: expansionIndex,
    handleKeyDown: expansionKeyDown,
    handleInput: expansionInput,
    insertTemplate,
    close: closeExpansion,
  } = useTextExpansion();

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    if (!SpeechRecognition) {
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'nb-NO'; // Norwegian Bokmål

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError(null);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);

      if (final) {
        // Append final transcript to value
        const needsSpace = value && !value.endsWith(' ') && !value.endsWith('\n');
        const newValue = value + (needsSpace ? ' ' : '') + final;
        onChange(newValue);
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event) => {
      log.error('Speech recognition error', { error: event.error });
      setVoiceError(
        event.error === 'not-allowed'
          ? 'Mikrofontilgang nektet'
          : event.error === 'no-speech'
            ? 'Ingen tale oppdaget'
            : `Feil: ${event.error}`
      );
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    return recognition;
  }, [value, onChange]);

  // Start/stop voice recognition
  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimTranscript('');
    } else {
      if (!recognitionRef.current) {
        recognitionRef.current = initRecognition();
      }
      try {
        recognitionRef.current?.start();
      } catch (err) {
        // Already started, ignore
        log.debug('Recognition already started', { error: err.message });
      }
    }
  }, [isListening, initRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // Expand macro in text
  const expandMacro = useCallback((text, cursorPosition) => {
    const beforeCursor = text.substring(0, cursorPosition);
    const macroMatch = beforeCursor.match(/(\.[a-zøæå0-9]+)$/i);

    if (macroMatch) {
      const macroKey = macroMatch[1].toLowerCase();
      const expansion = MACROS[macroKey];

      if (expansion) {
        const newText =
          text.substring(0, cursorPosition - macroKey.length) +
          expansion +
          text.substring(cursorPosition);
        return {
          expanded: true,
          text: newText,
          newCursorPosition: cursorPosition - macroKey.length + expansion.length,
        };
      }
    }
    return { expanded: false, text, newCursorPosition: cursorPosition };
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    // Check for space/enter after potential macro
    if (e.nativeEvent.data === ' ' || e.nativeEvent.inputType === 'insertLineBreak') {
      const result = expandMacro(newValue.slice(0, -1), cursorPos - 1);
      if (result.expanded) {
        const finalValue = result.text + (e.nativeEvent.data === ' ' ? '' : '\n');
        onChange(finalValue);
        // Position cursor after expansion
        setTimeout(() => {
          if (textareaRef.current) {
            const newPos = result.newCursorPosition + 1;
            textareaRef.current.selectionStart = newPos;
            textareaRef.current.selectionEnd = newPos;
          }
        }, 0);
        setShowMacroHint(false);
        return;
      }
    }

    // Check for partial macro to show hint
    const beforeCursor = newValue.substring(0, cursorPos);
    const partialMatch = beforeCursor.match(/(\.[a-zøæå0-9]*)$/i);
    if (partialMatch && partialMatch[1].length > 1) {
      const partial = partialMatch[1].toLowerCase();
      const matches = Object.keys(MACROS).filter((k) => k.startsWith(partial));
      if (matches.length > 0 && matches[0] !== partial) {
        setMacroHint(`${matches[0]} → ${MACROS[matches[0]].substring(0, 40)}...`);
        setShowMacroHint(true);
      } else {
        setShowMacroHint(false);
      }
    } else {
      setShowMacroHint(false);
    }

    // Also check for text expansion (slash commands)
    onChange(newValue);
    expansionInput(newValue, cursorPos);
  };

  // Handle key down
  const handleKeyDown = (e) => {
    // Text expansion popup takes priority when open
    if (expansionOpen) {
      const handled = expansionKeyDown(e, textareaRef, value, onChange);
      if (handled) {
        return;
      }
    }

    // Tab to accept AI suggestion (only when expansion popup is closed)
    if (e.key === 'Tab' && aiSuggestion && !expansionOpen) {
      e.preventDefault();
      onChange(value + aiSuggestion);
      setAiSuggestion('');
      return;
    }

    // Escape to clear AI suggestion or stop voice
    if (e.key === 'Escape') {
      if (isListening) {
        toggleVoice();
        return;
      }
      if (aiSuggestion) {
        setAiSuggestion('');
        return;
      }
    }
  };

  // Insert quick phrase at cursor
  const insertQuickPhrase = (phrase) => {
    if (!textareaRef.current) {
      return;
    }

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const textBefore = value.substring(0, start);
    const textAfter = value.substring(end);

    // Add space before if needed
    const needsSpaceBefore =
      textBefore.length > 0 && !textBefore.endsWith(' ') && !textBefore.endsWith('\n');
    const insertText = (needsSpaceBefore ? ' ' : '') + phrase;

    const newValue = textBefore + insertText + textAfter;
    onChange(newValue);

    // Focus and position cursor
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = start + insertText.length;
        textareaRef.current.focus();
        textareaRef.current.selectionStart = newPos;
        textareaRef.current.selectionEnd = newPos;
      }
    }, 0);
  };

  // Fetch AI ghost text suggestion (debounced)
  useEffect(() => {
    // Only fetch suggestions if AI button is shown and we have enough text
    if (!showAIButton || value.length < 30 || disabled || isListening) {
      setAiSuggestion('');
      return;
    }

    // Don't suggest if text ends with macro or slash command in progress
    if (value.match(/\.[a-z]+$/i) || value.match(/\/[a-z]*$/i)) {
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setIsAILoading(true);
        const response = await aiAPI.generateField(
          section,
          {
            partialText: value,
            maxTokens: 50, // Short continuation only
            ...aiContext,
          },
          'no'
        );

        // Extract continuation from response
        const continuation = response?.data?.text || response?.data?.continuation || '';

        // Only show if it's a meaningful continuation (not repeating existing text)
        if (continuation && continuation.length > 5 && !value.includes(continuation.trim())) {
          // Trim to first sentence or max 60 chars for ghost text
          const trimmed = continuation.split(/[.!?]/)[0].trim();
          setAiSuggestion(trimmed.length > 60 ? `${trimmed.substring(0, 60)}...` : `${trimmed}.`);
        } else {
          setAiSuggestion('');
        }
      } catch (err) {
        // Silently fail - ghost text is optional enhancement
        log.debug('AI ghost text failed', { error: err.message });
        setAiSuggestion('');
      } finally {
        setIsAILoading(false);
      }
    }, 1200); // Longer delay for ghost text to avoid too many API calls

    return () => clearTimeout(timeout);
  }, [value, section, aiContext, showAIButton, disabled, isListening]);

  return (
    <div className={`relative ${className}`}>
      {/* Label with hints */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          <span className="ml-2 text-xs text-gray-400 font-normal">
            .xx makro · /xxx kommando{voiceSupported && showVoiceInput ? ' · 🎤 diktering' : ''}
          </span>
        </label>
      )}

      {/* Textarea container */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={`
            w-full p-3 pr-20 rounded-lg border
            ${isListening ? 'border-red-400 ring-2 ring-red-200' : 'border-slate-200'}
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            resize-none text-sm
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          `}
          {...props}
        />

        {/* Interim transcript overlay (shows what's being heard) */}
        {interimTranscript && (
          <div className="absolute bottom-12 left-3 right-3 px-2 py-1 bg-red-50 border border-red-200 rounded text-sm text-red-700 italic">
            {interimTranscript}...
          </div>
        )}

        {/* AI ghost text overlay */}
        {aiSuggestion && !isListening && (
          <div
            className="absolute top-0 left-0 right-0 p-3 pointer-events-none whitespace-pre-wrap text-sm"
            style={{ color: 'transparent' }}
          >
            <span>{value}</span>
            <span className="text-gray-400">{aiSuggestion}</span>
          </div>
        )}

        {/* Right-side buttons */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {/* Voice input button */}
          {voiceSupported && showVoiceInput && !disabled && (
            <button
              onClick={toggleVoice}
              className={`p-1.5 rounded transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse hover:bg-red-600'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              title={isListening ? 'Stopp diktering (Esc)' : 'Start diktering'}
              type="button"
            >
              {isListening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          {/* AI button */}
          {showAIButton && onAIGenerate && !aiSuggestion && !isAILoading && !isListening && (
            <button
              onClick={() => onAIGenerate(section, field)}
              disabled={disabled}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50"
              title="Generer med AI"
              type="button"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          {/* AI loading indicator */}
          {isAILoading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
        </div>

        {/* Tab hint for AI suggestion */}
        {aiSuggestion && !isListening && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            Tab for å akseptere
          </div>
        )}

        {/* Voice recording indicator */}
        {isListening && (
          <div className="absolute bottom-2 left-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Lytter... (Esc for å stoppe)
          </div>
        )}
      </div>

      {/* Voice error message */}
      {voiceError && (
        <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <MicOff className="w-3 h-3" />
          {voiceError}
        </div>
      )}

      {/* Macro hint */}
      {showMacroHint && (
        <div className="absolute z-40 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg">
          {macroHint}
        </div>
      )}

      {/* Text expansion popup */}
      <TextExpansionPopup
        suggestions={expansionSuggestions}
        isOpen={expansionOpen}
        searchTerm={expansionSearch}
        selectedIndex={expansionIndex}
        inputRef={textareaRef}
        onSelect={(tmpl) => {
          const cursorPos = textareaRef.current?.selectionStart || value.length;
          const newPos = insertTemplate(tmpl, value, cursorPos, onChange);
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = newPos;
              textareaRef.current.selectionEnd = newPos;
              textareaRef.current.focus();
            }
          }, 0);
        }}
        onClose={closeExpansion}
      />

      {/* Quick phrases */}
      {quickPhrases.length > 0 && !disabled && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {quickPhrases.slice(0, 8).map((phrase) => (
            <button
              key={phrase}
              onClick={() => insertQuickPhrase(phrase)}
              type="button"
              className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
            >
              + {phrase}
            </button>
          ))}
          {quickPhrases.length > 8 && (
            <span className="px-2 py-1 text-xs text-gray-400">+{quickPhrases.length - 8} mer</span>
          )}
        </div>
      )}
    </div>
  );
}

// Export macros for reference
export { MACROS };
