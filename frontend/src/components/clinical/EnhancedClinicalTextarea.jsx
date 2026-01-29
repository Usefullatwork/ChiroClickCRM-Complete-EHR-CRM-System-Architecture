/**
 * EnhancedClinicalTextarea - Combines macro expansion (.xx) and slash commands (/xxx)
 * Plus optional AI ghost text suggestions
 *
 * Features:
 * - Type ".bs" + space → expands to "Bedring siden sist."
 * - Type "/better" → shows command menu, Enter/Tab inserts
 * - Tab accepts ghost AI suggestions
 * - Quick phrase chips below
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSlashCommands, SlashCommandMenu } from '../assessment/SlashCommands';
import { Sparkles, Loader2 } from 'lucide-react';
import { aiAPI } from '../../services/api';

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
  '.diff': 'Differensialdiagnoser: '
};

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
  aiContext = {},
  onAIGenerate,
  ...props
}) {
  const textareaRef = useRef(null);
  const [showMacroHint, setShowMacroHint] = useState(false);
  const [macroHint, setMacroHint] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);

  // Slash commands hook
  const {
    showMenu,
    menuPosition,
    filteredCommands,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown: slashKeyDown,
    handleChange: slashChange,
    selectCommand,
    closeMenu
  } = useSlashCommands();

  // Expand macro in text
  const expandMacro = useCallback((text, cursorPosition) => {
    const beforeCursor = text.substring(0, cursorPosition);
    const macroMatch = beforeCursor.match(/(\.[a-zøæå0-9]+)$/i);

    if (macroMatch) {
      const macroKey = macroMatch[1].toLowerCase();
      const expansion = MACROS[macroKey];

      if (expansion) {
        const newText = text.substring(0, cursorPosition - macroKey.length) +
          expansion +
          text.substring(cursorPosition);
        return {
          expanded: true,
          text: newText,
          newCursorPosition: cursorPosition - macroKey.length + expansion.length
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
      const matches = Object.keys(MACROS).filter(k => k.startsWith(partial));
      if (matches.length > 0 && matches[0] !== partial) {
        setMacroHint(`${matches[0]} → ${MACROS[matches[0]].substring(0, 40)}...`);
        setShowMacroHint(true);
      } else {
        setShowMacroHint(false);
      }
    } else {
      setShowMacroHint(false);
    }

    // Also check for slash commands
    slashChange(e, onChange);
  };

  // Handle key down
  const handleKeyDown = (e) => {
    // Tab to accept AI suggestion
    if (e.key === 'Tab' && aiSuggestion && !showMenu) {
      e.preventDefault();
      onChange(value + aiSuggestion);
      setAiSuggestion('');
      return;
    }

    // Escape to clear AI suggestion
    if (e.key === 'Escape') {
      if (aiSuggestion) {
        setAiSuggestion('');
        return;
      }
      if (showMenu) {
        closeMenu();
        return;
      }
    }

    // Pass to slash command handler
    slashKeyDown(e, textareaRef, value, onChange);
  };

  // Insert quick phrase at cursor
  const insertQuickPhrase = (phrase) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const textBefore = value.substring(0, start);
    const textAfter = value.substring(end);

    // Add space before if needed
    const needsSpaceBefore = textBefore.length > 0 && !textBefore.endsWith(' ') && !textBefore.endsWith('\n');
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

  // Fetch AI suggestion (debounced)
  useEffect(() => {
    if (!showAIButton || value.length < 20 || disabled) {
      setAiSuggestion('');
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setIsAILoading(true);
        // This would call AI API for suggestions
        // const response = await aiAPI.generateField(section, { partialText: value, ...aiContext });
        // setAiSuggestion(response?.data?.continuation || '');
      } catch (err) {
        console.error('AI suggestion failed:', err);
      } finally {
        setIsAILoading(false);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [value, section, aiContext, showAIButton, disabled]);

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          <span className="ml-2 text-xs text-gray-400 font-normal">
            .xx for makro · /xxx for kommandoer
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
            w-full p-3 rounded-lg border border-slate-200
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            resize-none text-sm
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${aiSuggestion ? 'pr-24' : ''}
          `}
          {...props}
        />

        {/* AI ghost text overlay */}
        {aiSuggestion && (
          <div
            className="absolute top-0 left-0 right-0 p-3 pointer-events-none whitespace-pre-wrap text-sm"
            style={{ color: 'transparent' }}
          >
            <span>{value}</span>
            <span className="text-gray-400">{aiSuggestion}</span>
          </div>
        )}

        {/* Tab hint for AI suggestion */}
        {aiSuggestion && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            Tab for å akseptere
          </div>
        )}

        {/* AI loading indicator */}
        {isAILoading && (
          <div className="absolute bottom-2 right-2">
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          </div>
        )}

        {/* Manual AI button */}
        {showAIButton && onAIGenerate && !aiSuggestion && !isAILoading && (
          <button
            onClick={() => onAIGenerate(section, field)}
            disabled={disabled}
            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50"
            title="Generer med AI"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Macro hint */}
      {showMacroHint && (
        <div className="absolute z-40 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg">
          {macroHint}
        </div>
      )}

      {/* Slash command menu */}
      <SlashCommandMenu
        show={showMenu}
        position={menuPosition}
        commands={filteredCommands}
        selectedIndex={selectedIndex}
        onSelect={(cmd, data) => selectCommand(cmd, data, value, onChange, textareaRef)}
        onClose={closeMenu}
      />

      {/* Quick phrases */}
      {quickPhrases.length > 0 && !disabled && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {quickPhrases.slice(0, 8).map(phrase => (
            <button
              key={phrase}
              onClick={() => insertQuickPhrase(phrase)}
              className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
            >
              + {phrase}
            </button>
          ))}
          {quickPhrases.length > 8 && (
            <span className="px-2 py-1 text-xs text-gray-400">
              +{quickPhrases.length - 8} mer
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Export macros for reference
export { MACROS };
