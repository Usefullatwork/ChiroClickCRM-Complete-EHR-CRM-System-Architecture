/**
 * AISuggestionCard Component
 *
 * Reusable suggestion display component with:
 * - Confidence indicator (color-coded)
 * - Suggestion text with highlighting
 * - Type badge (SOAP section, diagnosis, etc.)
 * - Compact and expanded views
 */

import _React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Brain, AlertTriangle, Sparkles } from 'lucide-react';
import { Badge } from '../ui/Badge';

// Bilingual text support
const TEXTS = {
  NO: {
    confidence: 'Konfidens',
    high: 'Hoy',
    medium: 'Moderat',
    low: 'Lav',
    showMore: 'Vis mer',
    showLess: 'Vis mindre',
    aiGenerated: 'AI-generert',
    types: {
      subjective: 'Subjektiv',
      objective: 'Objektiv',
      assessment: 'Vurdering',
      plan: 'Plan',
      diagnosis: 'Diagnose',
      treatment: 'Behandling',
      summary: 'Sammendrag',
      default: 'Forslag',
    },
  },
  EN: {
    confidence: 'Confidence',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    showMore: 'Show more',
    showLess: 'Show less',
    aiGenerated: 'AI Generated',
    types: {
      subjective: 'Subjective',
      objective: 'Objective',
      assessment: 'Assessment',
      plan: 'Plan',
      diagnosis: 'Diagnosis',
      treatment: 'Treatment',
      summary: 'Summary',
      default: 'Suggestion',
    },
  },
};

/**
 * Get confidence level and styling
 */
const getConfidenceLevel = (score, language = 'NO') => {
  const t = TEXTS[language] || TEXTS.NO;

  if (score >= 0.8) {
    return {
      level: 'high',
      label: t.high,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-300',
      progressColor: 'bg-green-500',
    };
  } else if (score >= 0.5) {
    return {
      level: 'medium',
      label: t.medium,
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-300',
      progressColor: 'bg-amber-500',
    };
  } else {
    return {
      level: 'low',
      label: t.low,
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-300',
      progressColor: 'bg-red-500',
    };
  }
};

/**
 * Get type badge styling
 */
const getTypeBadgeVariant = (type) => {
  const variants = {
    subjective: 'info',
    objective: 'default',
    assessment: 'warning',
    plan: 'success',
    diagnosis: 'danger',
    treatment: 'info',
    summary: 'default',
  };
  return variants[type?.toLowerCase()] || 'default';
};

/**
 * Confidence Indicator Component
 */
const ConfidenceIndicator = ({ score, language = 'NO', size = 'md' }) => {
  const confidence = getConfidenceLevel(score, language);
  const t = TEXTS[language] || TEXTS.NO;
  const percentage = Math.round(score * 100);

  const sizes = {
    sm: { bar: 'h-1.5', text: 'text-xs' },
    md: { bar: 'h-2', text: 'text-sm' },
    lg: { bar: 'h-2.5', text: 'text-base' },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={`${s.text} font-medium text-slate-600`}>
          {t.confidence}: <span className={confidence.textColor}>{confidence.label}</span>
        </span>
        <span className={`${s.text} font-semibold ${confidence.textColor}`}>{percentage}%</span>
      </div>
      <div className={`w-full ${s.bar} bg-slate-200 rounded-full overflow-hidden`}>
        <div
          className={`${s.bar} ${confidence.progressColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Highlight text matches (for search/keywords)
 */
const HighlightedText = ({ text, highlights = [] }) => {
  if (!highlights || highlights.length === 0) {
    return <span>{text}</span>;
  }

  // Sort highlights by start position
  const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);

  const parts = [];
  let lastIndex = 0;

  sortedHighlights.forEach((highlight, idx) => {
    if (highlight.start > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, highlight.start),
        highlighted: false,
        key: `text-${idx}`,
      });
    }
    parts.push({
      text: text.slice(highlight.start, highlight.end),
      highlighted: true,
      key: `highlight-${idx}`,
    });
    lastIndex = highlight.end;
  });

  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      highlighted: false,
      key: 'text-end',
    });
  }

  return (
    <span>
      {parts.map((part) =>
        part.highlighted ? (
          <mark key={part.key} className="bg-yellow-200 text-slate-900 rounded px-0.5">
            {part.text}
          </mark>
        ) : (
          <span key={part.key}>{part.text}</span>
        )
      )}
    </span>
  );
};

/**
 * Main AISuggestionCard Component
 */
export const AISuggestionCard = ({
  suggestion,
  language = 'NO',
  expanded: defaultExpanded = false,
  collapsible = true,
  showConfidence = true,
  showType = true,
  highlights = [],
  className = '',
  onClick,
}) => {
  const t = TEXTS[language] || TEXTS.NO;
  const [expanded, setExpanded] = useState(defaultExpanded);

  const {
    _id,
    type = 'default',
    suggestionText = '',
    confidenceScore = 0,
    hasRedFlags = false,
    redFlags = [],
  } = suggestion || {};

  const confidence = getConfidenceLevel(confidenceScore, language);
  const typeLabel = t.types[type?.toLowerCase()] || t.types.default;

  // Determine if content should be truncated
  const maxCompactLength = 150;
  const shouldTruncate = collapsible && suggestionText.length > maxCompactLength;
  const displayText =
    !expanded && shouldTruncate
      ? `${suggestionText.slice(0, maxCompactLength)}...`
      : suggestionText;

  const handleToggle = useCallback(() => {
    if (collapsible) {
      setExpanded((prev) => !prev);
    }
  }, [collapsible]);

  const handleClick = useCallback(
    (e) => {
      if (onClick) {
        onClick(suggestion, e);
      }
    },
    [onClick, suggestion]
  );

  return (
    <div
      className={`
        rounded-lg border ${confidence.borderColor} ${confidence.bgColor}
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Brain size={18} className="text-teal-600 flex-shrink-0" />
          <span className="text-xs text-slate-500 flex-shrink-0">{t.aiGenerated}</span>

          {showType && (
            <Badge variant={getTypeBadgeVariant(type)} size="sm">
              {typeLabel}
            </Badge>
          )}

          {hasRedFlags && (
            <Badge variant="danger" size="sm">
              <AlertTriangle size={12} className="mr-1" />
              {redFlags?.length || '!'}
            </Badge>
          )}
        </div>

        {showConfidence && (
          <div className="flex items-center gap-2">
            <Sparkles size={14} className={confidence.textColor} />
            <span className={`text-sm font-semibold ${confidence.textColor}`}>
              {Math.round(confidenceScore * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {/* Confidence Bar */}
        {showConfidence && expanded && (
          <div className="mb-3">
            <ConfidenceIndicator score={confidenceScore} language={language} size="sm" />
          </div>
        )}

        {/* Suggestion Text */}
        <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
          <HighlightedText text={displayText} highlights={expanded ? highlights : []} />
        </div>

        {/* Red Flags Warning */}
        {hasRedFlags && expanded && redFlags?.length > 0 && (
          <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
            <div className="text-xs font-medium text-red-700 mb-1 flex items-center gap-1">
              <AlertTriangle size={12} />
              {language === 'NO' ? 'Rode flagg oppdaget' : 'Red flags detected'}
            </div>
            <ul className="text-xs text-red-600 list-disc list-inside space-y-0.5">
              {redFlags.map((flag, idx) => (
                <li key={idx}>{flag.description || flag}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Expand/Collapse Toggle */}
        {shouldTruncate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            className="mt-2 flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp size={16} />
                {t.showLess}
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                {t.showMore}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Compact version for list views
 */
export const AISuggestionCardCompact = ({
  suggestion,
  language = 'NO',
  onClick,
  selected = false,
}) => {
  const t = TEXTS[language] || TEXTS.NO;
  const { type = 'default', suggestionText = '', confidenceScore = 0 } = suggestion || {};
  const confidence = getConfidenceLevel(confidenceScore, language);
  const typeLabel = t.types[type?.toLowerCase()] || t.types.default;

  // Truncate text for compact view
  const truncatedText =
    suggestionText.length > 80 ? `${suggestionText.slice(0, 80)}...` : suggestionText;

  return (
    <button
      type="button"
      onClick={() => onClick?.(suggestion)}
      className={`
        w-full text-left px-3 py-2 rounded-lg border transition-all duration-150
        ${
          selected
            ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500 ring-opacity-20'
            : `border-slate-200 hover:border-slate-300 hover:bg-slate-50`
        }
      `}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <Badge variant={getTypeBadgeVariant(type)} size="sm">
            {typeLabel}
          </Badge>
        </div>
        <span className={`text-xs font-medium ${confidence.textColor}`}>
          {Math.round(confidenceScore * 100)}%
        </span>
      </div>
      <p className="text-sm text-slate-700 line-clamp-2">{truncatedText}</p>
    </button>
  );
};

export default AISuggestionCard;
