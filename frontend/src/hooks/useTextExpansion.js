/**
 * useTextExpansion - API-backed "/" template expansion hook
 *
 * Replaces the hardcoded useSlashCommands with:
 * - Backend template fetching (with fallback to DEFAULT_COMMANDS)
 * - Variable substitution: {{today}}, {{now}}, {{followUp.2weeks}}, {{followUp.1month}}
 * - Usage tracking via templatesAPI.incrementUsage()
 * - Keyboard navigation (ArrowUp/Down, Tab/Enter insert, Esc close)
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { templatesAPI } from '../services/api';
import { DEFAULT_COMMANDS } from '../components/assessment/SlashCommands';
import logger from '../utils/logger';

const log = logger.scope('TextExpansion');

// Norwegian date formatting
const dateOpts = { day: 'numeric', month: 'long', year: 'numeric' };
const timeOpts = { hour: '2-digit', minute: '2-digit' };

function substituteVariables(text) {
  const now = new Date();
  const replacements = {
    '{{today}}': now.toLocaleDateString('nb-NO', dateOpts),
    '{{now}}': now.toLocaleTimeString('nb-NO', timeOpts),
    '{{followUp.2weeks}}': new Date(now.getTime() + 14 * 86400000).toLocaleDateString(
      'nb-NO',
      dateOpts
    ),
    '{{followUp.1month}}': new Date(now.getTime() + 30 * 86400000).toLocaleDateString(
      'nb-NO',
      dateOpts
    ),
  };
  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  return result;
}

// Map English categories to Norwegian
const CATEGORY_LABELS = {
  Subjective: 'Subjektiv',
  Objective: 'Objektiv',
  Assessment: 'Vurdering',
  Plan: 'Plan',
  Treatment: 'Behandling',
  Response: 'Respons',
};

// Convert DEFAULT_COMMANDS to a flat array for merging with API templates
function commandsToArray(commands) {
  return Object.entries(commands)
    .filter(([, data]) => !data.isAlias)
    .map(([shortcut, data]) => ({
      id: `local_${shortcut}`,
      shortcut: shortcut.replace('/', ''),
      name: data.label,
      text: data.text,
      category: CATEGORY_LABELS[data.category] || data.category,
      source: 'local',
    }));
}

export default function useTextExpansion() {
  const [apiTemplates, setApiTemplates] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const abortRef = useRef(null);

  // Fetch templates from API on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchTemplates() {
      try {
        const res = await templatesAPI.getAll({ language: 'no' });
        if (!cancelled && res?.data) {
          const templates = Array.isArray(res.data) ? res.data : res.data.templates || [];
          setApiTemplates(
            templates.map((t) => ({
              id: t.id,
              shortcut: t.shortcut || t.abbreviation || '',
              name: t.name || t.title || '',
              text: t.text || t.content || t.body || '',
              category: t.category || 'Annet',
              preview: (t.text || t.content || t.body || '').substring(0, 60),
              source: 'api',
            }))
          );
        }
      } catch {
        // API unavailable — will use local fallback
        log.debug('Templates API unavailable, using local defaults');
        setApiTemplates([]);
      }
    }
    fetchTemplates();
    return () => {
      cancelled = true;
    };
  }, []);

  // Merged template list: API templates first, then local defaults
  const allTemplates = useMemo(() => {
    const localDefaults = commandsToArray(DEFAULT_COMMANDS);
    if (!apiTemplates || apiTemplates.length === 0) return localDefaults;
    // De-duplicate: API templates override locals with same shortcut
    const apiShortcuts = new Set(apiTemplates.map((t) => t.shortcut.toLowerCase()));
    const filteredLocals = localDefaults.filter((t) => !apiShortcuts.has(t.shortcut.toLowerCase()));
    return [...apiTemplates, ...filteredLocals];
  }, [apiTemplates]);

  // Filtered suggestions based on search term
  const suggestions = useMemo(() => {
    if (!searchTerm) return [];
    const search = searchTerm.toLowerCase();
    return allTemplates
      .filter(
        (t) => t.shortcut.toLowerCase().includes(search) || t.name.toLowerCase().includes(search)
      )
      .slice(0, 8);
  }, [searchTerm, allTemplates]);

  // Track usage
  const trackUsage = useCallback((template) => {
    if (template.source === 'api' && template.id) {
      templatesAPI.incrementUsage(template.id).catch(() => {});
    }
  }, []);

  // Insert a template into the textarea value
  const insertTemplate = useCallback(
    (template, value, cursorPos, onChange) => {
      // Find the "/" that started this search
      const beforeCursor = value.substring(0, cursorPos);
      const slashIndex = beforeCursor.lastIndexOf('/');
      if (slashIndex === -1) return cursorPos;

      const expandedText = substituteVariables(template.text);
      const newValue = value.substring(0, slashIndex) + expandedText + value.substring(cursorPos);
      onChange(newValue);
      trackUsage(template);
      setIsOpen(false);
      setSearchTerm('');
      setSelectedIndex(0);
      return slashIndex + expandedText.length;
    },
    [trackUsage]
  );

  // Handle input changes — detect "/" trigger
  const handleInput = useCallback((value, cursorPos) => {
    const beforeCursor = value.substring(0, cursorPos);
    const slashIndex = beforeCursor.lastIndexOf('/');

    if (slashIndex !== -1) {
      const textAfterSlash = beforeCursor.substring(slashIndex + 1);
      // Only trigger if no space after slash (still typing the command)
      if (!textAfterSlash.includes(' ') && !textAfterSlash.includes('\n')) {
        setSearchTerm(textAfterSlash);
        setIsOpen(true);
        setSelectedIndex(0);
        return;
      }
    }
    setIsOpen(false);
    setSearchTerm('');
  }, []);

  // Keyboard handler for the popup navigation
  const handleKeyDown = useCallback(
    (e, textareaRef, value, onChange) => {
      if (!isOpen || suggestions.length === 0) return false;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return true;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return true;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        const template = suggestions[selectedIndex];
        const cursorPos = textareaRef.current?.selectionStart || value.length;
        const newPos = insertTemplate(template, value, cursorPos, onChange);
        // Position cursor after inserted text
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = newPos;
            textareaRef.current.selectionEnd = newPos;
          }
        }, 0);
        return true;
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
        return true;
      }
      return false;
    },
    [isOpen, suggestions, selectedIndex, insertTemplate]
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
    setSelectedIndex(0);
  }, []);

  return {
    suggestions,
    isOpen,
    searchTerm,
    selectedIndex,
    handleKeyDown,
    handleInput,
    insertTemplate,
    close,
  };
}
