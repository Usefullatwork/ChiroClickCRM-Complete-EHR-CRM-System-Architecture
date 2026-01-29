# Healthcare UX Implementation Plan for ChiroClickCRM

**Practical Roadmap Building on Existing Infrastructure**

*Version 1.0 | January 2026*

---

## Executive Summary

ChiroClickCRM already has **80% of the foundation** needed for world-class clinical UX. This plan prioritizes high-impact, low-effort additions that leverage existing components.

### What's Already Built

| Feature | Status | Location |
|---------|--------|----------|
| Quick-click spine palpation | ✅ Complete | `QuickPalpationSpine.jsx` |
| 2D/3D anatomy visualization | ✅ Complete | `components/anatomy/` |
| SOAP note sections | ✅ Complete | `ClinicalEncounter.jsx` |
| Multi-model AI (Ollama) | ✅ Complete | `services/ai.js` |
| Red flag detection | ✅ Complete | `useRedFlagScreening.js` |
| Exercise system + offline | ✅ Complete | `components/exercises/` |
| Service Worker/PWA | ✅ Complete | `public/sw.js` |
| Clinical settings API | ✅ Complete | `clinicalSettings.js` |
| Streaming AI responses | ✅ Complete | `InlineAIButton.jsx` |
| Macro variable substitution | ✅ Complete | `services/macros.js` |

### Key Gaps to Fill

| Gap | Impact | Effort | Priority |
|-----|--------|--------|----------|
| Text expansion triggers (`/`) | Very High | Low | P0 |
| SALT (Same As Last Time) | Very High | Medium | P0 |
| Inline ghost text suggestions | High | Medium | P1 |
| AI sidebar panel | High | Medium | P1 |
| Voice-to-text dictation | High | High | P2 |
| Connection status indicator | Medium | Low | P1 |
| AI confidence visualization | Medium | Low | P1 |
| Assessment-first (SAOP) toggle | Medium | Low | P2 |

---

## Phase 1: Quick Wins (Week 1-2)

### 1.1 Text Expansion System (`/` Triggers)

**Why**: Highest-impact pattern for documentation speed. Type `/normcspine` → full text expands.

**Implementation**: Hook into existing textarea/input components

```jsx
// frontend/src/hooks/useTextExpansion.js

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/services/api';

const TRIGGER_CHAR = '/';
const MIN_TRIGGER_LENGTH = 2;

export function useTextExpansion(inputRef, onInsert) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [triggerPosition, setTriggerPosition] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Cache templates on mount
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const { data } = await api.get('/templates?language=no');
        setTemplates(data);
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    };
    loadTemplates();
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab' && isOpen && suggestions.length > 0) {
      e.preventDefault();
      insertTemplate(suggestions[0]);
      return;
    }
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
      return;
    }
  }, [isOpen, suggestions]);

  const handleInput = useCallback((e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    // Find trigger position
    const beforeCursor = value.substring(0, cursorPos);
    const triggerIndex = beforeCursor.lastIndexOf(TRIGGER_CHAR);

    if (triggerIndex === -1 || cursorPos - triggerIndex < MIN_TRIGGER_LENGTH) {
      setIsOpen(false);
      return;
    }

    // Check if trigger is at word boundary
    if (triggerIndex > 0 && /\S/.test(beforeCursor[triggerIndex - 1])) {
      setIsOpen(false);
      return;
    }

    const search = beforeCursor.substring(triggerIndex + 1);
    setSearchTerm(search);
    setTriggerPosition(triggerIndex);

    // Filter templates
    const filtered = templates
      .filter(t =>
        t.shortcut?.toLowerCase().includes(search.toLowerCase()) ||
        t.name?.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 8);

    setSuggestions(filtered);
    setIsOpen(filtered.length > 0);
  }, [templates]);

  const insertTemplate = useCallback((template) => {
    if (!inputRef.current || triggerPosition === null) return;

    const input = inputRef.current;
    const value = input.value;
    const before = value.substring(0, triggerPosition);
    const after = value.substring(input.selectionStart);

    // Substitute variables in template
    const expandedText = substituteVariables(template.content);

    const newValue = before + expandedText + after;

    // Update input
    input.value = newValue;
    onInsert?.(newValue);

    // Position cursor after inserted text
    const newPos = triggerPosition + expandedText.length;
    input.setSelectionRange(newPos, newPos);

    setIsOpen(false);
    setSuggestions([]);
  }, [inputRef, triggerPosition, onInsert]);

  return {
    suggestions,
    isOpen,
    searchTerm,
    handleKeyDown,
    handleInput,
    insertTemplate,
    close: () => setIsOpen(false)
  };
}

function substituteVariables(text) {
  const now = new Date();
  const substitutions = {
    '{{today}}': now.toLocaleDateString('nb-NO'),
    '{{now}}': now.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }),
    '{{followUp.2weeks}}': new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('nb-NO'),
    '{{followUp.1month}}': new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('nb-NO'),
  };

  let result = text;
  for (const [key, value] of Object.entries(substitutions)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  return result;
}
```

**UI Component** - Dropdown appearing at cursor:

```jsx
// frontend/src/components/clinical/TextExpansionPopup.jsx

import { useRef, useEffect } from 'react';

export function TextExpansionPopup({
  suggestions,
  isOpen,
  onSelect,
  searchTerm,
  inputRef
}) {
  const popupRef = useRef(null);

  if (!isOpen || suggestions.length === 0) return null;

  // Position popup near cursor
  const rect = inputRef.current?.getBoundingClientRect();

  return (
    <div
      ref={popupRef}
      className="absolute z-50 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto"
      style={{
        top: rect ? rect.bottom + 4 : 0,
        left: rect ? rect.left : 0,
        minWidth: 300
      }}
    >
      <div className="p-2 border-b text-xs text-gray-500">
        Maler ({suggestions.length}) - Tab for å sette inn
      </div>
      {suggestions.map((template, i) => (
        <button
          key={template.id}
          className={`w-full text-left px-3 py-2 hover:bg-blue-50 ${i === 0 ? 'bg-blue-50' : ''}`}
          onClick={() => onSelect(template)}
        >
          <div className="flex justify-between">
            <span className="font-medium">/{template.shortcut}</span>
            <span className="text-xs text-gray-400">{template.category}</span>
          </div>
          <div className="text-sm text-gray-600 truncate">
            {template.name}
          </div>
        </button>
      ))}
    </div>
  );
}
```

**Integration Point**: Add to SOAP section textareas in `ClinicalEncounter.jsx`

---

### 1.2 SALT (Same As Last Time) Feature

**Why**: 80%+ of follow-up visits have similar documentation. One-click duplication with diff highlighting.

**Backend Endpoint** (add to `encounters.js` controller):

```javascript
// backend/src/controllers/encounters.js

// GET /api/v1/patients/:patientId/encounters/last-similar
async getLastSimilarEncounter(req, res) {
  const { patientId } = req.params;
  const { chiefComplaint } = req.query;

  const lastEncounter = await db.query(`
    SELECT * FROM clinical_encounters
    WHERE patient_id = $1
      AND chief_complaint ILIKE $2
      AND signed_at IS NOT NULL
    ORDER BY encounter_date DESC
    LIMIT 1
  `, [patientId, `%${chiefComplaint}%`]);

  if (!lastEncounter.rows[0]) {
    return res.json({ found: false });
  }

  const encounter = lastEncounter.rows[0];

  // Return structured data for pre-population
  res.json({
    found: true,
    previousDate: encounter.encounter_date,
    subjective: encounter.subjective,
    objective: encounter.objective,
    assessment: encounter.assessment,
    plan: encounter.plan,
    treatments: encounter.treatments,
    icpc_codes: encounter.icpc_codes
  });
}
```

**Frontend Hook**:

```jsx
// frontend/src/hooks/useSALT.js

import { useState } from 'react';
import { encountersAPI } from '@/services/api';

export function useSALT(patientId) {
  const [previousEncounter, setPreviousEncounter] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  const checkForSimilar = async (chiefComplaint) => {
    if (!chiefComplaint || chiefComplaint.length < 3) return;

    try {
      const { data } = await encountersAPI.getLastSimilar(patientId, chiefComplaint);
      if (data.found) {
        setPreviousEncounter(data);
      }
    } catch (err) {
      console.error('SALT check failed:', err);
    }
  };

  const applyPrevious = (currentData, setFormData) => {
    // Merge previous with current, marking carried-forward fields
    setFormData(prev => ({
      ...prev,
      subjective: {
        ...previousEncounter.subjective,
        _carriedForward: true
      },
      objective: {
        ...previousEncounter.objective,
        _carriedForward: true
      },
      // Keep current assessment (needs clinical review)
      assessment: prev.assessment,
      plan: {
        ...previousEncounter.plan,
        _carriedForward: true
      }
    }));

    setShowComparison(true);
  };

  return {
    previousEncounter,
    showComparison,
    setShowComparison,
    checkForSimilar,
    applyPrevious,
    clearPrevious: () => setPreviousEncounter(null)
  };
}
```

**UI Component** - Banner when previous similar visit found:

```jsx
// frontend/src/components/clinical/SALTBanner.jsx

export function SALTBanner({ previousEncounter, onApply, onDismiss }) {
  if (!previousEncounter) return null;

  const daysSince = Math.floor(
    (new Date() - new Date(previousEncounter.previousDate)) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-blue-600">📋</span>
        <div>
          <p className="font-medium text-blue-900">
            Lignende konsultasjon funnet
          </p>
          <p className="text-sm text-blue-700">
            {daysSince} dager siden - samme hovedplage
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onApply}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Bruk som utgangspunkt
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-1 text-blue-600 hover:bg-blue-100 rounded"
        >
          Avvis
        </button>
      </div>
    </div>
  );
}
```

**Visual Differentiation** for carried-forward content:

```css
/* Add to clinical encounter styles */
.carried-forward {
  background-color: rgba(59, 130, 246, 0.05);
  border-left: 3px solid #3b82f6;
  position: relative;
}

.carried-forward::before {
  content: "Fra forrige";
  position: absolute;
  top: -8px;
  right: 8px;
  font-size: 10px;
  color: #3b82f6;
  background: white;
  padding: 0 4px;
}
```

---

### 1.3 Connection Status Indicator

**Why**: Clinicians need confidence that offline work will sync.

**Component** (leverage existing `usePWA` hook):

```jsx
// frontend/src/components/common/ConnectionStatus.jsx

import { usePWA } from '@/hooks/usePWA';
import { useState, useEffect } from 'react';

export function ConnectionStatus() {
  const { isOnline, pendingSync } = usePWA();
  const [lastSynced, setLastSynced] = useState(null);

  useEffect(() => {
    if (isOnline && !pendingSync) {
      setLastSynced(new Date());
    }
  }, [isOnline, pendingSync]);

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: '🟡',
        text: `Arbeider offline`,
        subtext: pendingSync > 0 ? `${pendingSync} ventende endringer` : null,
        className: 'bg-yellow-50 text-yellow-800 border-yellow-200'
      };
    }
    if (pendingSync > 0) {
      return {
        icon: '⏳',
        text: 'Synkroniserer...',
        subtext: `${pendingSync} endringer`,
        className: 'bg-blue-50 text-blue-800 border-blue-200'
      };
    }
    return {
      icon: '🟢',
      text: 'Synkronisert',
      subtext: lastSynced ? formatRelativeTime(lastSynced) : null,
      className: 'bg-green-50 text-green-800 border-green-200'
    };
  };

  const status = getStatusConfig();

  return (
    <div className={`fixed bottom-4 right-4 px-3 py-2 rounded-lg border text-sm ${status.className}`}>
      <span className="mr-2">{status.icon}</span>
      <span>{status.text}</span>
      {status.subtext && (
        <span className="text-xs ml-2 opacity-75">{status.subtext}</span>
      )}
    </div>
  );
}

function formatRelativeTime(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'nå';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m siden`;
  const hours = Math.floor(minutes / 60);
  return `${hours}t siden`;
}
```

---

### 1.4 AI Confidence Visualization

**Why**: Clinicians need calibrated trust in AI suggestions.

**Enhance existing `InlineAIButton.jsx`**:

```jsx
// Add confidence display to AI suggestions

const CONFIDENCE_LEVELS = {
  high: {
    color: 'text-green-600',
    bg: 'bg-green-50',
    icon: '🟢',
    label: 'Høy sikkerhet',
    threshold: 0.85
  },
  medium: {
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    icon: '🟡',
    label: 'Gjennomgang anbefalt',
    threshold: 0.60
  },
  low: {
    color: 'text-red-600',
    bg: 'bg-red-50',
    icon: '🔴',
    label: 'Manuell verifisering',
    threshold: 0
  }
};

function getConfidenceLevel(score) {
  if (score >= CONFIDENCE_LEVELS.high.threshold) return CONFIDENCE_LEVELS.high;
  if (score >= CONFIDENCE_LEVELS.medium.threshold) return CONFIDENCE_LEVELS.medium;
  return CONFIDENCE_LEVELS.low;
}

// In AI response display:
function AIConfidenceBadge({ confidence, reasoning }) {
  const [expanded, setExpanded] = useState(false);
  const level = getConfidenceLevel(confidence);

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${level.bg}`}>
      <span>{level.icon}</span>
      <span className={`text-xs ${level.color}`}>{level.label}</span>

      {reasoning && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-1 text-gray-400 hover:text-gray-600"
        >
          ⓘ
        </button>
      )}

      {expanded && reasoning && (
        <div className="absolute mt-8 p-2 bg-white border rounded shadow-lg text-xs max-w-xs">
          <p className="font-medium mb-1">Basert på:</p>
          <ul className="list-disc list-inside text-gray-600">
            {reasoning.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
```

**Backend Enhancement** - Add confidence to AI responses:

```javascript
// backend/src/services/ai.js - enhance response format

async generateSOAPSuggestions(chiefComplaint, section, context = {}) {
  // ... existing generation code ...

  // Calculate confidence based on:
  const confidence = this.calculateConfidence({
    matchingSimilarCases: await this.countSimilarCases(chiefComplaint),
    templateMatch: this.checkTemplateMatch(response),
    contentLength: response.length,
    medicalTermsPresent: this.countMedicalTerms(response)
  });

  return {
    suggestion: response,
    confidence: confidence.score,
    reasoning: confidence.factors,
    model: this.getModelForTask('soap')
  };
}

calculateConfidence({ matchingSimilarCases, templateMatch, contentLength, medicalTermsPresent }) {
  const factors = [];
  let score = 0.5; // Base confidence

  if (matchingSimilarCases > 20) {
    score += 0.2;
    factors.push(`Matcher ${matchingSimilarCases} lignende konsultasjoner`);
  } else if (matchingSimilarCases > 5) {
    score += 0.1;
    factors.push(`Matcher ${matchingSimilarCases} tidligere tilfeller`);
  }

  if (templateMatch > 0.8) {
    score += 0.15;
    factors.push('Høy mal-match');
  }

  if (contentLength > 100 && contentLength < 500) {
    score += 0.1;
    factors.push('Passende lengde');
  }

  if (medicalTermsPresent > 3) {
    score += 0.05;
    factors.push('Klinisk terminologi bekreftet');
  }

  return { score: Math.min(score, 0.98), factors };
}
```

---

## Phase 2: AI Enhancement (Week 3-5)

### 2.1 Inline Ghost Text Suggestions

**Why**: Tab-to-accept suggestions maintain flow state during documentation.

**Implementation** - Custom textarea with ghost text overlay:

```jsx
// frontend/src/components/clinical/AITextarea.jsx

import { useState, useRef, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { aiAPI } from '@/services/api';

export function AITextarea({
  value,
  onChange,
  fieldType,
  context,
  placeholder,
  className,
  disabled,
  ...props
}) {
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Debounced suggestion fetcher
  const fetchSuggestion = useCallback(
    debounce(async (text, type, ctx) => {
      if (text.length < 10 || disabled) {
        setSuggestion('');
        return;
      }

      // Cancel previous request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      try {
        const { data } = await aiAPI.generateField(type, {
          partialText: text,
          ...ctx
        });

        // Only show suggestion if it continues current text
        if (data.suggestion?.startsWith(text.slice(-20))) {
          setSuggestion(data.suggestion.slice(text.length));
        } else {
          setSuggestion(data.suggestion || '');
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('AI suggestion failed:', err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 400), // 400ms debounce
    [disabled]
  );

  useEffect(() => {
    fetchSuggestion(value, fieldType, context);
    return () => abortControllerRef.current?.abort();
  }, [value, fieldType, context, fetchSuggestion]);

  const handleKeyDown = (e) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      onChange(value + suggestion);
      setSuggestion('');
    }
    if (e.key === 'Escape' && suggestion) {
      setSuggestion('');
    }
  };

  return (
    <div className="relative">
      {/* Actual textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${className} relative z-10 bg-transparent`}
        disabled={disabled}
        {...props}
      />

      {/* Ghost text overlay */}
      {suggestion && (
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none p-3 whitespace-pre-wrap"
          style={{
            fontFamily: 'inherit',
            fontSize: 'inherit',
            lineHeight: 'inherit'
          }}
        >
          <span className="invisible">{value}</span>
          <span className="text-gray-400">{suggestion}</span>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          <span className="animate-pulse">AI tenker...</span>
        </div>
      )}

      {/* Tab hint */}
      {suggestion && !isLoading && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-gray-100 px-1 rounded">
          Tab for å akseptere
        </div>
      )}
    </div>
  );
}
```

---

### 2.2 AI Sidebar Panel for Diagnosis Codes

**Why**: Show ICPC-2 suggestions without blocking documentation.

**Component**:

```jsx
// frontend/src/components/clinical/AIDiagnosisSidebar.jsx

import { useState, useEffect } from 'react';
import { aiAPI } from '@/services/api';
import { AIConfidenceBadge } from './AIConfidenceBadge';

export function AIDiagnosisSidebar({
  soapData,
  onSelectCode,
  isCollapsed,
  onToggle
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!soapData?.assessment?.clinical_reasoning) return;

      setIsLoading(true);
      try {
        const { data } = await aiAPI.suggestDiagnosis(soapData);
        setSuggestions(data.codes || []);
      } catch (err) {
        console.error('Diagnosis suggestion failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce to avoid excessive calls
    const timeout = setTimeout(fetchSuggestions, 1000);
    return () => clearTimeout(timeout);
  }, [soapData]);

  if (isCollapsed) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-l-lg shadow-lg"
        title="Vis AI forslag"
      >
        🤖
        {suggestions.length > 0 && (
          <span className="absolute -top-1 -left-1 bg-red-500 text-xs w-4 h-4 rounded-full">
            {suggestions.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="w-80 bg-white border-l shadow-lg h-full overflow-y-auto">
      <div className="sticky top-0 bg-white border-b p-3 flex justify-between items-center">
        <h3 className="font-medium flex items-center gap-2">
          🤖 AI Diagnosehjelp
        </h3>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="p-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <span className="animate-spin">⏳</span>
            Analyserer...
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-gray-500">
            Skriv vurdering for å få forslag til diagnosekoder.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-2">
              Foreslåtte ICPC-2 koder:
            </p>

            {suggestions.map((suggestion, i) => (
              <div
                key={suggestion.code}
                className="border rounded-lg p-3 hover:border-blue-300 cursor-pointer transition-colors"
                onClick={() => onSelectCode(suggestion)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono font-bold text-blue-600">
                    {suggestion.code}
                  </span>
                  <AIConfidenceBadge
                    confidence={suggestion.confidence}
                    reasoning={suggestion.reasoning}
                  />
                </div>
                <p className="text-sm font-medium">{suggestion.description}</p>
                {suggestion.explanation && (
                  <p className="text-xs text-gray-500 mt-1">
                    {suggestion.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback section */}
      {suggestions.length > 0 && (
        <div className="border-t p-3">
          <p className="text-xs text-gray-500 mb-2">Var dette nyttig?</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border rounded hover:bg-green-50">
              👍
            </button>
            <button className="px-3 py-1 text-sm border rounded hover:bg-red-50">
              👎
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Phase 3: Voice Input (Week 6-8)

### 3.1 Browser-Based Voice Input

**Why**: Hands-free documentation during examination. Start with browser Web Speech API (free, no server).

```jsx
// frontend/src/hooks/useVoiceInput.js

import { useState, useCallback, useRef } from 'react';

export function useVoiceInput(onTranscript, language = 'nb-NO') {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Talegjenkjenning støttes ikke i denne nettleseren');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      onTranscript({ final: finalTranscript, interim: interimTranscript });
    };

    recognition.onerror = (event) => {
      setError(`Feil: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    error,
    startListening,
    stopListening,
    toggleListening,
    isSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  };
}
```

**Voice Input Button Component**:

```jsx
// frontend/src/components/clinical/VoiceInputButton.jsx

import { useVoiceInput } from '@/hooks/useVoiceInput';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

export function VoiceInputButton({ onTranscript, disabled }) {
  const {
    isListening,
    error,
    toggleListening,
    isSupported
  } = useVoiceInput(onTranscript);

  if (!isSupported) {
    return (
      <button
        disabled
        className="p-2 text-gray-400 cursor-not-allowed"
        title="Talegjenkjenning støttes ikke"
      >
        <MicOff size={20} />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        disabled={disabled}
        className={`p-2 rounded-full transition-all ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        }`}
        title={isListening ? 'Stopp diktering' : 'Start diktering'}
      >
        {isListening ? <Mic size={20} /> : <MicOff size={20} />}
      </button>

      {isListening && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-red-500 whitespace-nowrap">
          Lytter...
        </span>
      )}

      {error && (
        <div className="absolute top-full mt-1 left-0 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
}
```

### 3.2 Whisper API Integration (Phase 3b)

For better medical terminology accuracy, add optional Whisper backend:

```javascript
// backend/src/routes/transcription.js

import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Use self-hosted Whisper or OpenAI API
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const audioFile = req.file;

    // Option 1: OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile.buffer,
      model: 'whisper-1',
      language: 'no',
      prompt: 'Medisinsk journalnotat på norsk. Kiropraktikk, ryggsmerter, nakke.'
    });

    res.json({
      text: transcription.text,
      confidence: 0.95 // Whisper doesn't return confidence, estimate
    });

  } catch (error) {
    console.error('Transcription failed:', error);
    res.status(500).json({ error: 'Transkribering feilet' });
  }
});

export default router;
```

---

## Phase 4: Polish & Advanced Features (Week 9-12)

### 4.1 Assessment-First (SAOP) Toggle

Add to clinical settings for users who prefer assessment-first workflow:

```jsx
// In ClinicalEncounter.jsx - section ordering based on preference

const [sectionOrder, setSectionOrder] = useState(['S', 'O', 'A', 'P']);

useEffect(() => {
  const prefs = clinicalSettings?.soap?.sectionOrder;
  if (prefs === 'SAOP') {
    setSectionOrder(['S', 'A', 'O', 'P']);
  }
}, [clinicalSettings]);

// Render sections in dynamic order
{sectionOrder.map(section => {
  switch(section) {
    case 'S': return <SubjectiveSection key="s" {...props} />;
    case 'A': return <AssessmentSection key="a" {...props} />;
    case 'O': return <ObjectiveSection key="o" {...props} />;
    case 'P': return <PlanSection key="p" {...props} />;
  }
})}
```

### 4.2 Red Flag Modal Alerts

Enhance existing `useRedFlagScreening` to show modal for critical findings:

```jsx
// frontend/src/components/clinical/RedFlagModal.jsx

import { AlertTriangle } from 'lucide-react';

export function RedFlagModal({ alert, onAcknowledge, onDismiss }) {
  if (!alert || alert.severity !== 'critical') return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="bg-red-600 text-white p-4 rounded-t-lg flex items-center gap-3">
          <AlertTriangle size={24} />
          <h2 className="text-lg font-bold">Kritisk rødt flagg oppdaget</h2>
        </div>

        <div className="p-4">
          <p className="font-medium text-red-800 mb-2">{alert.title}</p>
          <p className="text-gray-700 mb-4">{alert.description}</p>

          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-sm font-medium text-red-800">Anbefalt handling:</p>
            <p className="text-sm text-red-700">{alert.recommendedAction}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onAcknowledge}
              className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
            >
              Bekreft og fortsett
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Lukk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4.3 Feedback Capture System

Track AI suggestion quality for continuous improvement:

```javascript
// backend/src/services/aiFeedback.js

class AIFeedbackService {
  async recordFeedback(data) {
    const { encounterId, suggestionType, accepted, modified, rejected, reason } = data;

    await db.query(`
      INSERT INTO ai_feedback (
        encounter_id, suggestion_type, accepted, modified, rejected,
        rejection_reason, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [encounterId, suggestionType, accepted, modified, rejected, reason]);

    // Update running statistics
    await this.updateSuggestionStats(suggestionType);
  }

  async getSuggestionStats(suggestionType) {
    const result = await db.query(`
      SELECT
        suggestion_type,
        COUNT(*) as total,
        SUM(CASE WHEN accepted THEN 1 ELSE 0 END) as accepted_count,
        SUM(CASE WHEN modified THEN 1 ELSE 0 END) as modified_count,
        SUM(CASE WHEN rejected THEN 1 ELSE 0 END) as rejected_count,
        ROUND(AVG(CASE WHEN accepted THEN 1 ELSE 0 END) * 100, 1) as acceptance_rate
      FROM ai_feedback
      WHERE suggestion_type = $1
      GROUP BY suggestion_type
    `, [suggestionType]);

    return result.rows[0];
  }
}
```

---

## Integration Checklist

### ClinicalEncounter.jsx Modifications

```jsx
// Add these imports
import { useTextExpansion, TextExpansionPopup } from '@/components/clinical/TextExpansion';
import { useSALT, SALTBanner } from '@/components/clinical/SALT';
import { ConnectionStatus } from '@/components/common/ConnectionStatus';
import { AIDiagnosisSidebar } from '@/components/clinical/AIDiagnosisSidebar';
import { AITextarea } from '@/components/clinical/AITextarea';
import { VoiceInputButton } from '@/components/clinical/VoiceInputButton';
import { RedFlagModal } from '@/components/clinical/RedFlagModal';

// In component:
const { previousEncounter, checkForSimilar, applyPrevious } = useSALT(patientId);
const [showAISidebar, setShowAISidebar] = useState(true);

// Check for similar on chief complaint change
useEffect(() => {
  checkForSimilar(formData.subjective?.chief_complaint);
}, [formData.subjective?.chief_complaint]);

// In render:
return (
  <div className="flex">
    <div className="flex-1">
      <SALTBanner
        previousEncounter={previousEncounter}
        onApply={() => applyPrevious(formData, setFormData)}
        onDismiss={() => {}}
      />

      {/* SOAP sections with AI-enhanced textareas */}
      <AITextarea
        value={formData.objective?.palpation}
        onChange={(v) => setFormData(prev => ({...prev, objective: {...prev.objective, palpation: v}}))}
        fieldType="palpation"
        context={{ chiefComplaint: formData.subjective?.chief_complaint }}
      />

      {/* Voice input for each section */}
      <VoiceInputButton
        onTranscript={({ final }) => appendToField('subjective.history', final)}
      />
    </div>

    <AIDiagnosisSidebar
      soapData={formData}
      onSelectCode={handleCodeSelect}
      isCollapsed={!showAISidebar}
      onToggle={() => setShowAISidebar(!showAISidebar)}
    />

    <ConnectionStatus />
    <RedFlagModal alert={criticalAlert} onAcknowledge={handleAcknowledge} />
  </div>
);
```

---

## File Creation Summary

### New Files to Create

| File | Priority | Lines (est.) |
|------|----------|--------------|
| `hooks/useTextExpansion.js` | P0 | ~100 |
| `components/clinical/TextExpansionPopup.jsx` | P0 | ~60 |
| `hooks/useSALT.js` | P0 | ~80 |
| `components/clinical/SALTBanner.jsx` | P0 | ~50 |
| `components/common/ConnectionStatus.jsx` | P1 | ~60 |
| `components/clinical/AIConfidenceBadge.jsx` | P1 | ~50 |
| `components/clinical/AITextarea.jsx` | P1 | ~120 |
| `components/clinical/AIDiagnosisSidebar.jsx` | P1 | ~150 |
| `hooks/useVoiceInput.js` | P2 | ~80 |
| `components/clinical/VoiceInputButton.jsx` | P2 | ~50 |
| `components/clinical/RedFlagModal.jsx` | P2 | ~60 |
| `services/aiFeedback.js` (backend) | P2 | ~100 |

### Files to Modify

| File | Changes |
|------|---------|
| `ClinicalEncounter.jsx` | Integrate all new components |
| `services/ai.js` (backend) | Add confidence scoring |
| `controllers/encounters.js` | Add SALT endpoint |
| `routes/encounters.js` | Add SALT route |

---

## Timeline Summary

| Week | Focus | Deliverables |
|------|-------|-------------|
| 1 | Text Expansion | `/` triggers working in all SOAP fields |
| 2 | SALT | Previous visit detection + apply |
| 3 | Ghost Text | Inline AI suggestions with Tab accept |
| 4 | AI Sidebar | Diagnosis code suggestions panel |
| 5 | Confidence | Traffic light indicators on all AI |
| 6-7 | Voice Input | Browser speech + optional Whisper |
| 8 | Polish | Red flag modals, feedback capture |

---

## Success Metrics

| Metric | Current (Est.) | Target | Measurement |
|--------|----------------|--------|-------------|
| Clicks per encounter | ~40 | <15 | Analytics tracking |
| SOAP completion time | ~4 min | <90 sec | Timer in UI |
| AI suggestion acceptance | N/A | 65-75% | Feedback tracking |
| Template usage | ~30% | >70% | Usage analytics |
| Offline sync success | ~95% | >99% | Error logging |

---

## Next Steps

1. **Start with Phase 1** - Text expansion and SALT have the highest impact-to-effort ratio
2. **Add analytics** - Track clicks and time to measure improvement
3. **User testing** - Get clinician feedback after each phase
4. **Iterate** - Adjust based on actual usage patterns

---

*This plan builds on ChiroClickCRM's existing strong foundation. Most infrastructure (AI, offline sync, anatomy visualization) is already in place - these additions focus on the "last mile" of clinical UX.*
